import { vec2, vec3 } from "gl-matrix";
import {
  createNoise2D,
  createNoise3D,
  NoiseFunction2D,
  NoiseFunction3D
} from "simplex-noise";
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
  simplex2D: NoiseFunction2D,
  simplex3D: NoiseFunction3D,
  simplexOverhang: NoiseFunction3D
): number {
  const waterLevel = 30;

  function fractal2D(
    x: number,
    z: number,
    oct: number,
    freq: number,
    amp: number
  ) {
    let total = 0;
    let max = 0;

    for (let i = 0; i < oct; i++) {
      total += simplex2D(x * freq, z * freq) * amp;
      max += amp;
      freq *= 2;
      amp *= 0.5;
    }
    return total / max;
  }

  // Hills / plains (stronger)
  const hillNoise = fractal2D(c[0], c[2], 4, 0.01, 1);
  const hillHeight = hillNoise * 60 + 40; // increased amplitude

  // Ridges / mountains (taller and sharper)
  const ridge = Math.abs(fractal2D(c[0], c[2], 3, 0.004, 1));
  const mountainHeight = Math.pow(1 - ridge, 2.2) * 300; // bigger peaks

  // Combine 2D height layers (favor mountains)
  let terrainHeight = hillHeight * 0.4 + mountainHeight * 0.6;

  terrainHeight = Math.floor(terrainHeight / 2) * 2;

  let density = terrainHeight - c[1];

  const cave = simplex3D(c[0] * 0.03, c[1] * 0.04, c[2] * 0.03);
  if (cave > 0.55) density -= (cave - 0.55) * 40;

  const ov = simplexOverhang(c[0] * 0.02, c[1] * 0.02, c[2] * 0.02);
  if (ov > 0.25 && c[1] > terrainHeight - 25) density -= (ov - 0.25) * 25;

  const r = simplex2D(c[0] * 0.004, c[2] * 0.004);
  const riverMask = Math.abs(r);
  if (riverMask < 0.05) {
    const depth = (0.05 - riverMask) * 80;
    density -= depth;
  }

  if (c[1] < waterLevel) density = Math.min(density, waterLevel - c[1]);

  return Math.max(0, Math.min(1, (density + 80) / 200));
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
  const simplex2D = createNoise2D(prng);

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
          const value = noiseFunction(c, simplex2D, simplex, simplexOverhang);

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

    // from the mesh, choose a random triangle
    let meshTriangles: Readonly<Triangle[]> = mesh.mesh;
    let randomTriangle: Triangle =
      meshTriangles[Math.floor(Math.random() * meshTriangles.length)];

    // Generate a singular gear at this triangle
    let localGearObjectPos = vec3.fromValues(
      randomTriangle[0][0] + ChunkPosition[0],
      randomTriangle[0][1],
      randomTriangle[0][2] + ChunkPosition[1]
    );

    self.postMessage({
      requestId,
      meshVertices: mesh.getVertices(),
      meshNormals: mesh.getNormals(),
      meshTypes: mesh.getTypes(),
      justGearObjectsLol: []
    });
  }
};
