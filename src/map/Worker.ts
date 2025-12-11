import { vec2, vec3 } from "gl-matrix";
import {
  createNoise2D,
  createNoise3D,
  NoiseFunction2D,
  NoiseFunction3D
} from "simplex-noise";
import alea from "alea";
import { meshToInterleavedVerticesAndIndices } from "./cubes_utils";
import { Mesh, Triangle } from "./Mesh";
import { CASES, EDGES, VERTICES } from "./geometry";
import { BVHUtils } from "./BVHUtils";
import { Chunk } from "./Map";

export type WorkerConstructor = new (
  stringUrl: string | URL,
  options?: WorkerOptions
) => Worker;

let field: Float32Array;
const chunkGridSize = vec3.create();
type WorkerMessage = {
  Seed: string;
  GridSize: vec3;
  ChunkPosition: vec3;
};

function keyFromNumbers(x: number, y: number, z: number): string {
  // match precision used by vertexKey (round to 2 decimals)
  const rx = Math.round(x * 1e2) / 1e2;
  const ry = Math.round(y * 1e2) / 1e2;
  const rz = Math.round(z * 1e2) / 1e2;
  return `${rx},${ry},${rz}`;
}

function noiseFunction(
  x: number,
  y: number,
  z: number,
  simplex2D: NoiseFunction2D,
  simplex3D: NoiseFunction3D,
  simplexOverhang: NoiseFunction3D
): number {
  const waterLevelBase = 30;

  function fractal2D(
    px: number,
    pz: number,
    oct: number,
    freq: number,
    amp: number
  ) {
    let total = 0;
    let max = 0;
    for (let i = 0; i < oct; i++) {
      total += simplex2D(px * freq, pz * freq) * amp;
      max += Math.abs(amp);
      freq *= 2;
      amp *= 0.5;
    }
    return max === 0 ? 0 : total / max;
  }

  // Low-frequency continentalness defines large-scale variation (plains -> mountains)
  const continental = fractal2D(x, z, 3, 0.0006, 1); // range about [-1,1]

  // Large mountain ridges (ridged multifractal feel)
  const ridgeNoise = Math.abs(fractal2D(x + 1000, z - 1000, 4, 0.002, 1));
  const mountainProxy = Math.pow(1 - ridgeNoise, 2.0); // peaks where ridgeNoise small

  // Medium scale hills / erosion
  const hills = fractal2D(x, z, 5, 0.008, 1);

  // Small scale detail
  const detail = fractal2D(x, z, 6, 0.03, 1) * 0.8;

  // Compose a raw height in world units
  const baseHeight = continental * 60; // continentalness modifies baseline
  const mountainHeight = mountainProxy * 220 * Math.max(0, continental + 0.2); // mountains preferred where continental positive
  const hillsHeight = hills * 45;
  let terrainHeight =
    baseHeight + mountainHeight + hillsHeight + detail * 10 + 48;

  // Add terrace / plateau effect in certain mountain-y areas
  if (mountainProxy > 0.6 && Math.abs(simplex2D(x * 0.01, z * 0.01)) > 0.5) {
    terrainHeight = Math.floor(terrainHeight / 4) * 4; // coarse terracing
  }

  // Estimate slope from nearby height samples (low-frequency) to create cliffs
  const sampleA =
    baseHeight +
    Math.pow(1 - Math.abs(fractal2D(x + 2, z, 3, 0.002, 1)), 2.0) * 150 +
    fractal2D(x + 2, z, 4, 0.008, 1) * 45;
  const sampleB =
    baseHeight +
    Math.pow(1 - Math.abs(fractal2D(x - 2, z, 3, 0.002, 1)), 2.0) * 150 +
    fractal2D(x - 2, z, 4, 0.008, 1) * 45;
  const slope = Math.abs(sampleA - sampleB) / 2.0;

  // Cliffs: if slope is steep, produce sharp vertical change by boosting height locally
  if (slope > 15) {
    const cliffFactor = Math.min(1, (slope - 15) / 30);
    terrainHeight += cliffFactor * 80 * (0.5 + mountainProxy);
  }

  // River mask: low-frequency ridged lines create meandering rivers
  const riverNoise =
    simplex2D(x * 0.0009, z * 0.0009) + 0.5 * simplex2D(x * 0.002, z * 0.002);
  const riverDist = Math.abs(riverNoise);
  const riverWidth = 0.03 + (1 - Math.abs(continental)) * 0.02; // wider in flat areas

  // Carve river valleys where riverDist is small
  let valleyDepth = 0;
  if (riverDist < riverWidth) {
    const riverStrength = (riverWidth - riverDist) / riverWidth;
    valleyDepth = 60 * Math.pow(riverStrength, 1.5);
    // further deepen near low continentalness (plains) so rivers cut wide
    valleyDepth *= 1 + (1 - Math.abs(continental)) * 0.5;
    terrainHeight -= valleyDepth;
  }

  // Water level varies slowly across world to allow oceans and lakes
  const waterLevel = waterLevelBase;

  // Density is how much above the queried y we are
  let density = terrainHeight - y;

  // Caves (3D noise) carve interior; higher values carve out more
  const cave = simplex3D(x * 0.03, y * 0.04, z * 0.03);
  if (cave > 0.55) density -= (cave - 0.55) * 48;

  // Overhangs: 3D overhang noise that only applies near surface to create ledges/arches
  const ov = simplexOverhang(x * 0.02, y * 0.02, z * 0.02);
  if (ov > 0.25 && y > terrainHeight - 28) density -= (ov - 0.25) * 28;

  // Lakes / shallow water: if valley carved below water level, ensure water present
  if (y < waterLevel) density = Math.max(density, waterLevel - y);

  // Apply small erosion-like smoothing at low heights (flatten very low slopes)
  if (terrainHeight < waterLevel + 6) {
    density -= (waterLevel + 6 - terrainHeight) * 0.2;
  }

  // Map density roughly into [0,1]. Tuned so around y == terrainHeight corresponds to ~0.5 threshold.
  const out = Math.max(0, Math.min(1, (density + 80) / 200));
  return out;
}

function solidChecker(a: number) {
  return a > 0.5;
}

function getFieldValueByNums(x: number, y: number, z: number) {
  if (
    x < 0 ||
    y < 0 ||
    z < 0 ||
    x > chunkGridSize[0] ||
    y > chunkGridSize[1] ||
    z > chunkGridSize[2]
  ) {
    return 0; // or some default value
  }
  const idx =
    x +
    y * (chunkGridSize[0] + 1) +
    z * (chunkGridSize[0] + 1) * (chunkGridSize[1] + 1);
  return field[idx];
}

function GenerateCase(cube: vec3): number {
  let caseIndex = 0;
  for (let i = 0; i < VERTICES.length; i++) {
    const vx = VERTICES[i][0] + cube[0];
    const vy = VERTICES[i][1] + cube[1];
    const vz = VERTICES[i][2] + cube[2];
    caseIndex += Number(solidChecker(getFieldValueByNums(vx, vy, vz))) << i;
  }
  return caseIndex;
}

function edgeIndexToCoordinate(
  c: vec3,
  edgeIndex: number
): { position: vec3; normal: vec3 } {
  const [a, b] = EDGES[edgeIndex];

  const v1x = VERTICES[a][0] + c[0];
  const v1y = VERTICES[a][1] + c[1];
  const v1z = VERTICES[a][2] + c[2];

  const v2x = VERTICES[b][0] + c[0];
  const v2y = VERTICES[b][1] + c[1];
  const v2z = VERTICES[b][2] + c[2];

  const value1 = getFieldValueByNums(v1x, v1y, v1z);
  const value2 = getFieldValueByNums(v2x, v2y, v2z);

  const normal1 = calculateNormalByNums(v1x, v1y, v1z);
  const normal2 = calculateNormalByNums(v2x, v2y, v2z);

  const denom = value1 - 0.5 - (value2 - 0.5);
  const t = denom === 0 ? 0 : (value1 - 0.5) / denom;

  const p = vec3.fromValues(
    v1x + (v2x - v1x) * t,
    v1y + (v2y - v1y) * t,
    v1z + (v2z - v1z) * t
  );

  const n = vec3.create();
  vec3.lerp(n, normal1, normal2, t);
  vec3.normalize(n, n);

  return { position: p, normal: n };
}

function calculateNormalByNums(x: number, y: number, z: number): vec3 {
  const d = 1.0;
  const nx =
    getFieldValueByNums(x + d, y, z) - getFieldValueByNums(x - d, y, z);
  const ny =
    getFieldValueByNums(x, y + d, z) - getFieldValueByNums(x, y - d, z);
  const nz =
    getFieldValueByNums(x, y, z + d) - getFieldValueByNums(x, y, z - d);

  const n = vec3.fromValues(-nx, -ny, -nz);
  vec3.normalize(n, n);
  return n;
}

function caseToMesh(c: vec3, caseNumber: number, gridSize: vec3): Mesh {
  const caseMesh: Mesh = new Mesh();
  const caseLookup = CASES[caseNumber];

  // Simple deterministic hash for small per-vertex variation
  function hash01(x: number, z: number) {
    // stable pseudo-random in [0,1)
    return Math.abs(Math.sin(x * 127.1 + z * 311.7) * 43758.5453) % 1;
  }

  // Heuristic thresholds (match waterLevelBase used in noiseFunction)
  const WATER_LEVEL = 30;
  const SNOW_LINE = 140;

  for (const triangleLookup of caseLookup) {
    const vertices = triangleLookup.map((edgeIndex) =>
      edgeIndexToCoordinate(c, edgeIndex)
    );

    // Determine a terrain type per vertex based on height and slope
    const types: [number, number, number] = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      const p = vertices[i].position;
      const n = vertices[i].normal;
      const worldY = p[1];
      const upDot = Math.max(-1, Math.min(1, n[1]));
      const slope = 1 - Math.abs(upDot); // 0 = flat, higher = steeper

      // Water
      if (worldY < WATER_LEVEL - 0.2) {
        types[i] = 4; // water
        continue;
      }

      // Beaches near water (gentle slope and low height)
      if (worldY < WATER_LEVEL + 3 && slope < 0.45) {
        types[i] = 5; // sand
        continue;
      }

      // Snow on high altitudes
      if (worldY > SNOW_LINE) {
        types[i] = 3; // snow
        continue;
      }

      // Cliffs / exposed rock on steep slopes
      if (slope > 0.6 || upDot < 0.4) {
        types[i] = 2; // rock
        continue;
      }

      // Mix grass and dirt based on small deterministic noise and height
      const nval = hash01(p[0] + c[0], p[2] + c[2]);
      if (worldY < 65 && nval > 0.15)
        types[i] = 0; // grass
      else if (worldY < 80 && nval > 0.35) types[i] = 0;
      else types[i] = 1; // dirt
    }

    caseMesh.addTriangle(
      vertices.map((v) => v.position) as Triangle,
      vertices.map((v) => v.normal) as Triangle,
      types
    );
  }

  return caseMesh;
}

self.onmessage = (
  event: MessageEvent<
    WorkerMessage & { requestId?: string; field?: Float32Array }
  >
) => {
  const {
    Seed,
    GridSize,
    ChunkPosition,
    requestId,
    field: precomputedField
  } = event.data;

  const prng = alea(Seed);
  const simplex = createNoise3D(prng);
  const simplexOverhang = createNoise3D(prng);
  const simplex2D = createNoise2D(prng);

  const startTotal = performance.now();

  // Use precomputed field if provided, otherwise generate
  if (precomputedField) {
    field = precomputedField;
  } else {
    field = new Float32Array(
      (GridSize[0] + 1) * (GridSize[1] + 1) * (GridSize[2] + 1)
    );
    for (let x = 0; x <= GridSize[0]; x++) {
      for (let y = 0; y <= GridSize[1]; y++) {
        for (let z = 0; z <= GridSize[2]; z++) {
          const gx = x + ChunkPosition[0];
          const gy = y + ChunkPosition[1];
          const gz = z + ChunkPosition[2];

          const idx =
            x +
            y * (GridSize[0] + 1) +
            z * (GridSize[0] + 1) * (GridSize[1] + 1);
          const value = noiseFunction(
            gx,
            gy,
            gz,
            simplex2D,
            simplex,
            simplexOverhang
          );

          field[idx] = value;
        }
      }
    }
  }
  chunkGridSize[0] = GridSize[0];
  chunkGridSize[1] = GridSize[1];
  chunkGridSize[2] = GridSize[2];

  const endField = performance.now();

  // Generate interior mesh (exclude edges)
  const mesh = new Mesh();
  for (let x = 1; x < GridSize[0] - 1; x++) {
    for (let y = 1; y < GridSize[1] - 1; y++) {
      for (let z = 1; z < GridSize[2] - 1; z++) {
        const c = vec3.fromValues(x, y, z);
        const cubeCase = GenerateCase(c);
        mesh.merge(caseToMesh(c, cubeCase, GridSize));
      }
    }
  }
  const endMesh = performance.now();

  // Pack mesh data
  const verticesArr = mesh.getVertices();
  const normalsArr = mesh.getNormals();
  const typesArr = mesh.getTypes();
  const packed = BVHUtils.packTriangles(verticesArr, typesArr, normalsArr);
  const triangleCount = verticesArr.length;
  const endPack = performance.now();

  const interleaved = meshToInterleavedVerticesAndIndices(mesh);
  const endInterleave = performance.now();

  const timings = {
    totalMs: endInterleave - startTotal,
    fieldMs: endField - startTotal,
    meshMs: endMesh - endField,
    packMs: endPack - endMesh,
    interleaveMs: endInterleave - endPack
  };
  console.log(
    `Worker generated field + interior mesh with ${triangleCount} triangles in ${timings.totalMs.toFixed(
      2
    )} ms (field: ${timings.fieldMs.toFixed(2)} ms, mesh: ${timings.meshMs.toFixed(
      2
    )} ms, pack: ${timings.packMs.toFixed(2)} ms)`
  );

  self.postMessage(
    {
      requestId,
      field,
      packedVertices: packed.vertices,
      packedNormals: packed.normals,
      packedTerrains: packed.terrains,
      triangleCount,
      interleavedVertices: interleaved.vertices,
      interleavedIndices: interleaved.indices,
      timings,
      justGearObjectsLol: []
    },
    [
      field.buffer,
      packed.vertices.buffer,
      packed.normals.buffer,
      packed.terrains.buffer,
      interleaved.vertices.buffer,
      interleaved.indices.buffer
    ]
  );
};
