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

export type WorkerConstructor = new (
  stringUrl: string | URL,
  options?: WorkerOptions
) => Worker;

let WorldFieldMap: Map<string, number> = new Map<string, number>();
let globalChunkPosition: vec2;

type WorkerMessage = {
  Seed: string;
  GridSize: vec3;
  ChunkPosition: vec2;
  generatingTerrain: boolean;
  worldFieldMap: Map<string, number>;
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
  const waterLevel = 30;

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
      max += amp;
      freq *= 2;
      amp *= 0.5;
    }
    return total / max;
  }

  // Hills / plains (stronger)
  const hillNoise = fractal2D(x, z, 4, 0.01, 1);
  const hillHeight = hillNoise * 60 + 40; // increased amplitude

  // Ridges / mountains (taller and sharper)
  const ridge = Math.abs(fractal2D(x, z, 3, 0.004, 1));
  const mountainHeight = Math.pow(1 - ridge, 2.2) * 300; // bigger peaks

  // Combine 2D height layers (favor mountains)
  let terrainHeight = hillHeight * 0.4 + mountainHeight * 0.6;

  terrainHeight = Math.floor(terrainHeight / 2) * 2;

  let density = terrainHeight - y;

  const cave = simplex3D(x * 0.03, y * 0.04, z * 0.03);
  if (cave > 0.55) density -= (cave - 0.55) * 40;

  const ov = simplexOverhang(x * 0.02, y * 0.02, z * 0.02);
  if (ov > 0.25 && y > terrainHeight - 25) density -= (ov - 0.25) * 25;

  const r = simplex2D(x * 0.004, z * 0.004);
  const riverMask = Math.abs(r);
  if (riverMask < 0.05) {
    const depth = (0.05 - riverMask) * 80;
    density -= depth;
  }

  if (y < waterLevel) density = Math.min(density, waterLevel - y);

  return Math.max(0, Math.min(1, (density + 80) / 200));
}

function solidChecker(a: number) {
  return a > 0.5;
}

function getFieldValueByNums(x: number, y: number, z: number) {
  const gx = x + globalChunkPosition[0];
  const gz = z + globalChunkPosition[1];
  return WorldFieldMap.get(keyFromNumbers(gx, y, gz)) ?? 0;
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

  for (const triangleLookup of caseLookup) {
    const vertices = triangleLookup.map((edgeIndex) =>
      edgeIndexToCoordinate(c, edgeIndex)
    );

    caseMesh.addTriangle(
      vertices.map((v) => v.position) as Triangle,
      vertices.map((v) => v.normal) as Triangle,
      [0, 0, 0]
    );
  }

  return caseMesh;
}

self.onmessage = (
  event: MessageEvent<WorkerMessage & { requestId?: string }>
) => {
  const {
    Seed,
    GridSize,
    ChunkPosition,
    generatingTerrain,
    worldFieldMap,
    requestId
  } = event.data;

  globalChunkPosition = ChunkPosition;

  const prng = alea(Seed);
  const simplex = createNoise3D(prng);
  const simplexOverhang = createNoise3D(prng);
  const simplex2D = createNoise2D(prng);

  if (generatingTerrain) {
    const startTotal = performance.now();
    const field = new Float32Array(
      (GridSize[0] + 1) * (GridSize[1] + 1) * (GridSize[2] + 1)
    );
    const map = new Map<string, number>();

    // Reduce allocations by using numeric coordinates instead of vec3 objects
    for (let x = 0; x <= GridSize[0]; x++) {
      for (let y = 0; y <= GridSize[1]; y++) {
        for (let z = 0; z <= GridSize[2]; z++) {
          const gx = x + ChunkPosition[0];
          const gy = y; // local Y
          const gz = z + ChunkPosition[1];

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
          map.set(keyFromNumbers(gx, gy, gz), value);
        }
      }
    }

    const endField = performance.now();
    const timings = { fieldMs: endField - startTotal };

    self.postMessage(
      { requestId, field, fieldMap: Array.from(map.entries()), timings },
      [field.buffer]
    );
  } else {
    WorldFieldMap = worldFieldMap;
    // Build mesh using existing Mesh helper, but then pack into transferable typed arrays
    const startTotal = performance.now();
    const mesh = new Mesh();
    for (let x = 0; x < GridSize[0]; x++) {
      for (let y = 0; y < GridSize[1]; y++) {
        for (let z = 0; z < GridSize[2]; z++) {
          const c = vec3.fromValues(x, y, z);
          const cubeCase = GenerateCase(c);
          mesh.merge(caseToMesh(c, cubeCase, GridSize));
        }
      }
    }
    const endMesh = performance.now();

    // pack triangles to Float32Arrays to transfer without structured cloning
    const verticesArr = mesh.getVertices();
    const normalsArr = mesh.getNormals();
    const typesArr = mesh.getTypes();
    const packed = BVHUtils.packTriangles(verticesArr, typesArr, normalsArr);
    const triangleCount = verticesArr.length;
    const endPack = performance.now();

    // Also produce interleaved vertices + indices for direct GPU upload (optional consumer)
    const interleaved = meshToInterleavedVerticesAndIndices(mesh);
    const endInterleave = performance.now();

    const timings = {
      totalMs: endInterleave - startTotal,
      meshMs: endMesh - startTotal,
      packMs: endPack - endMesh,
      interleaveMs: endInterleave - endPack
    };

    self.postMessage(
      {
        requestId,
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
        packed.vertices.buffer,
        packed.normals.buffer,
        packed.terrains.buffer,
        interleaved.vertices.buffer,
        interleaved.indices.buffer
      ]
    );
  }
};
