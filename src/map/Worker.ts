import { vec2, vec3 } from "gl-matrix";
import { createNoise3D, NoiseFunction3D } from "simplex-noise";
import alea from "alea";
import { vertexKey } from "./cubes_utils";
import { Mesh, Triangle } from "./Mesh";
import { CASES, EDGES, VERTICES } from "./geometry";

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

function chunkCoordinateToIndex(c: vec3, gridSize: vec3): number {
  return (
    c[0] +
    c[1] * (gridSize[0] + 1) +
    c[2] * (gridSize[0] + 1) * (gridSize[1] + 1)
  );
}

function noiseFunction(
  c: vec3,
  simplex: NoiseFunction3D,
  simplexOverhang: NoiseFunction3D,
  simplexRiver: NoiseFunction3D
): number {
  const hillFreq = 0.02;
  const mountainFreq = 0.005;
  const caveFreq = 0.05;
  const waterLevel = 30;

  function fractalNoise(c: vec3, oct: number, freq: number, amp: number) {
    let total = 0,
      max = 0,
      f = freq,
      a = amp;
    for (let i = 0; i < oct; i++) {
      total += simplex(c[0] * f, c[1] * f, c[2] * f) * a;
      max += a;
      f *= 2;
      a /= 2;
    }
    return total / max;
  }

  const hillNoise = fractalNoise(c, 4, hillFreq, 1);
  const hillHeight = hillNoise * 40 + 50;
  const ridgeVal = 1 - Math.abs(fractalNoise(c, 3, mountainFreq, 1));
  const mountainHeight = Math.pow(ridgeVal, 2) * 120;
  let terrainHeight = hillHeight * 0.6 + mountainHeight * 0.4;
  terrainHeight = Math.floor(terrainHeight / 5) * 5;

  let density = terrainHeight - c[1];

  // Caves
  const caveNoise = fractalNoise(c, 3, caveFreq, 1);
  density -= Math.max(0, (caveNoise - 0.5) * 60 * Math.max(0, 1 - c[1] / 100));

  // Overhangs
  const overhang = simplexOverhang(c[0] * 0.03, c[1] * 0.03, c[2] * 0.03);
  if (overhang > 0.2) density -= (overhang - 0.2) * 30;

  // Rivers
  const riverNoise = simplexRiver(c[0] * 0.01, c[2] * 0.01, 0);
  const riverThreshold = 0.1;
  if (riverNoise < riverThreshold) {
    density -= (riverThreshold - riverNoise) * 50; // riverbed depth
  }

  if (c[1] < waterLevel) density = Math.min(density, waterLevel - c[1]);

  return Math.max(0, Math.min(1, (density + 100) / 200));
}

function solidChecker(a: number) {
  return a > 0.5;
}

function getFieldValue(c: vec3) {
  const newVector = vec3.fromValues(0, 0, 0);
  vec3.add(
    newVector,
    c,
    vec3.fromValues(globalChunkPosition[0], 0, globalChunkPosition[1])
  );
  return WorldFieldMap.get(vertexKey(newVector)) ?? 0;
}

function GenerateCase(cube: vec3): number {
  let caseIndex = 0;
  for (let i = 0; i < VERTICES.length; i++) {
    let v = vec3.fromValues(...VERTICES[i]);
    vec3.add(v, v, cube);
    caseIndex += Number(solidChecker(getFieldValue(v))) << i;
  }
  return caseIndex;
}

function edgeIndexToCoordinate(
  c: vec3,
  edgeIndex: number
): { position: vec3; normal: vec3 } {
  const [a, b] = EDGES[edgeIndex];

  const v1 = vec3.fromValues(...VERTICES[a]);
  const v2 = vec3.fromValues(...VERTICES[b]);
  vec3.add(v1, v1, c);
  vec3.add(v2, v2, c);

  const value1 = getFieldValue(v1);
  const value2 = getFieldValue(v2);

  const normal1 = calculateNormal(v1);
  const normal2 = calculateNormal(v2);

  const t = (value1 - 0.5) / (value1 - 0.5 - (value2 - 0.5));
  const p = vec3.create();
  const n = vec3.create();

  vec3.lerp(p, v1, v2, t);
  vec3.lerp(n, normal1, normal2, t);
  vec3.normalize(n, n);

  return { position: p, normal: n };
}

function calculateNormal(v: vec3): vec3 {
  const d = 1.0;
  const n = vec3.create();

  n[0] =
    getFieldValue(vec3.fromValues(v[0] + d, v[1], v[2])) -
    getFieldValue(vec3.fromValues(v[0] - d, v[1], v[2]));
  n[1] =
    getFieldValue(vec3.fromValues(v[0], v[1] + d, v[2])) -
    getFieldValue(vec3.fromValues(v[0], v[1] - d, v[2]));
  n[2] =
    getFieldValue(vec3.fromValues(v[0], v[1], v[2] + d)) -
    getFieldValue(vec3.fromValues(v[0], v[1], v[2] - d));

  vec3.negate(n, n);
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
  const simplexRiver = createNoise3D(prng); // new noise for rivers

  if (generatingTerrain) {
    const field = new Float32Array(
      (GridSize[0] + 1) * (GridSize[1] + 1) * (GridSize[2] + 1)
    );
    const map = new Map<string, number>();

    for (let x = 0; x <= GridSize[0]; x++) {
      for (let y = 0; y <= GridSize[1]; y++) {
        for (let z = 0; z <= GridSize[2]; z++) {
          let c = vec3.fromValues(x, y, z);
          vec3.add(
            c,
            c,
            vec3.fromValues(ChunkPosition[0], 0, ChunkPosition[1])
          );

          const idx = chunkCoordinateToIndex(
            vec3.fromValues(x, y, z),
            GridSize
          );
          const value = noiseFunction(
            c,
            simplex,
            simplexOverhang,
            simplexRiver
          );

          field[idx] = value;
          map.set(vertexKey(c), value);
        }
      }
    }

    self.postMessage(
      { requestId, field, fieldMap: Array.from(map.entries()) },
      [field.buffer]
    );
  } else {
    WorldFieldMap = worldFieldMap;

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

    // Generate a singular gear at the origin of the chunk
    let localGearObjectPos = vec3.fromValues(
      ChunkPosition[0],
      0,
      ChunkPosition[1]
    );

    self.postMessage({
      requestId,
      meshVertices: mesh.getVertices(),
      meshNormals: mesh.getNormals(),
      meshTypes: mesh.getTypes(),
      justGearObjectsLol: [localGearObjectPos]
    });
  }
};
