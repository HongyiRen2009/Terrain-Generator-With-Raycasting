import { vec2, vec3 } from "gl-matrix";
import { createNoise3D, NoiseFunction3D } from "simplex-noise";
import alea from "alea";
import { Mesh, Triangle } from "./Mesh";
import { CASES, EDGES, VERTICES } from "./geometry";

console.log("Worker started");

let field: Float32Array;
let gradients: Float32Array;
let gridSize: vec3;
let chunkPosition: vec2;

type WorkerMessage = {
  Seed: string;
  GridSize: vec3;
  ChunkPosition: vec2;
  generatingTerrain: boolean;
  worldFieldMap: Map<string, number>;
};

function chunkCoordinateToIndex(x: number, y: number, z: number): number {
  return x + y * (gridSize[0] + 1) + z * (gridSize[0] + 1) * (gridSize[1] + 1);
}

function noiseFunction(
  x: number,
  y: number,
  z: number,
  simplex: NoiseFunction3D
): number {
  const frequency = 0.07;
  const noiseValue = simplex(x * frequency, y * frequency, z * frequency);
  const normalizedNoise = (noiseValue + 1) / 2;
  const heightParameter = 1 / 1.07 ** y;
  const floor = +(y === 0);
  return Math.max(normalizedNoise * heightParameter, floor);
}

function GenerateCase(cx: number, cy: number, cz: number): number {
  /*
      Given the coordinate of a cube in the world,
      return the corresponding index into the marching cubes lookup.
      Involves looking at each of the eight vertices.
    */

  let caseIndex = 0;

  for (let i = 0; i < VERTICES.length; i++) {
    const vx = cx + VERTICES[i][0];
    const vy = cy + VERTICES[i][1];
    const vz = cz + VERTICES[i][2];
    const isTerrain = Number(solidChecker(getFieldValue(vx, vy, vz)));
    caseIndex += isTerrain << i;
  }

  return caseIndex;
}

function solidChecker(a: number): boolean {
  return a > 0.5;
}

function getFieldValue(x: number, y: number, z: number): number {
  const idx = chunkCoordinateToIndex(x, y, z);
  if (idx < 0 || idx >= field.length) return 0;
  return field[idx];
}

function getGradient(
  x: number,
  y: number,
  z: number
): [number, number, number] {
  const idx = chunkCoordinateToIndex(x, y, z);
  if (idx < 0 || idx >= field.length) {
    return [0, 0, 0];
  }
  return [gradients[3 * idx], gradients[3 * idx + 1], gradients[3 * idx + 2]];
}

function calculateNormal(
  x: number,
  y: number,
  z: number
): [number, number, number] {
  const [gx, gy, gz] = getGradient(x, y, z);
  const nx = -gx;
  const ny = -gy;
  const nz = -gz;

  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len === 0) return [0, 1, 0];

  return [nx / len, ny / len, nz / len];
}

function caseToMesh(
  cx: number,
  cy: number,
  cz: number,
  caseNumber: number
): Mesh {
  const caseMesh: Mesh = new Mesh();
  const caseLookup = CASES[caseNumber];

  for (const triangleLookup of caseLookup) {
    const positions: vec3[] = [];
    const normals: vec3[] = [];

    for (let i = 0; i < 3; i++) {
      const edgeIndex = triangleLookup[i];
      const result = edgeIndexToCoordinate(cx, cy, cz, edgeIndex);
      positions.push(
        vec3.fromValues(
          result.position[0],
          result.position[1],
          result.position[2]
        )
      );
      normals.push(
        vec3.fromValues(result.normal[0], result.normal[1], result.normal[2])
      );
    }

    caseMesh.addTriangle(positions as Triangle, normals as Triangle, [0, 0, 0]);
  }
  return caseMesh;
}

function edgeIndexToCoordinate(
  cx: number,
  cy: number,
  cz: number,
  edgeIndex: number
): { position: [number, number, number]; normal: [number, number, number] } {
  const [a, b] = EDGES[edgeIndex];

  const v1x = cx + VERTICES[a][0];
  const v1y = cy + VERTICES[a][1];
  const v1z = cz + VERTICES[a][2];
  const v2x = cx + VERTICES[b][0];
  const v2y = cy + VERTICES[b][1];
  const v2z = cz + VERTICES[b][2];

  const value1 = getFieldValue(v1x, v1y, v1z);
  const value2 = getFieldValue(v2x, v2y, v2z);

  const [n1x, n1y, n1z] = calculateNormal(v1x, v1y, v1z);
  const [n2x, n2y, n2z] = calculateNormal(v2x, v2y, v2z);

  const lerpAmount = (value1 - 0.5) / (value1 - 0.5 - (value2 - 0.5));

  const px = v1x + (v2x - v1x) * lerpAmount;
  const py = v1y + (v2y - v1y) * lerpAmount;
  const pz = v1z + (v2z - v1z) * lerpAmount;

  const nx = n1x + (n2x - n1x) * lerpAmount;
  const ny = n1y + (n2y - n1y) * lerpAmount;
  const nz = n1z + (n2z - n1z) * lerpAmount;

  const nlen = Math.sqrt(nx * nx + ny * ny + nz * nz);
  const nnx = nlen === 0 ? 0 : nx / nlen;
  const nny = nlen === 0 ? 1 : ny / nlen;
  const nnz = nlen === 0 ? 0 : nz / nlen;

  return {
    position: [px, py, pz],
    normal: [nnx, nny, nnz]
  };
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const startTime = performance.now();
  const { Seed, GridSize, ChunkPosition } = event.data;

  gridSize = GridSize;
  chunkPosition = ChunkPosition;

  const prng = alea(Seed);
  const simplex = createNoise3D(prng);

  const fieldSize = (GridSize[0] + 1) * (GridSize[1] + 1) * (GridSize[2] + 1);
  field = new Float32Array(fieldSize);
  gradients = new Float32Array(fieldSize * 3);

  // Generate field
  for (let x = 0; x <= GridSize[0]; x++) {
    for (let y = 0; y <= GridSize[1]; y++) {
      for (let z = 0; z <= GridSize[2]; z++) {
        const worldX = x + ChunkPosition[0];
        const worldY = y;
        const worldZ = z + ChunkPosition[1];
        const idx = chunkCoordinateToIndex(x, y, z);
        field[idx] = noiseFunction(worldX, worldY, worldZ, simplex);
      }
    }
  }

  // Precompute gradients
  const delta = 1.0;
  for (let x = 0; x <= GridSize[0]; x++) {
    for (let y = 0; y <= GridSize[1]; y++) {
      for (let z = 0; z <= GridSize[2]; z++) {
        const idx = chunkCoordinateToIndex(x, y, z);

        const x1 = Math.min(x + delta, GridSize[0]);
        const x2 = Math.max(x - delta, 0);
        const y1 = Math.min(y + delta, GridSize[1]);
        const y2 = Math.max(y - delta, 0);
        const z1 = Math.min(z + delta, GridSize[2]);
        const z2 = Math.max(z - delta, 0);

        gradients[3 * idx] = getFieldValue(x1, y, z) - getFieldValue(x2, y, z);
        gradients[3 * idx + 1] =
          getFieldValue(x, y1, z) - getFieldValue(x, y2, z);
        gradients[3 * idx + 2] =
          getFieldValue(x, y, z1) - getFieldValue(x, y, z2);
      }
    }
  }

  // Generate interior mesh
  const mesh: Mesh = new Mesh();
  for (let x = 1; x < GridSize[0] - 1; x++) {
    for (let y = 1; y < GridSize[1] - 1; y++) {
      for (let z = 1; z < GridSize[2] - 1; z++) {
        const cubeCase = GenerateCase(x, y, z);
        if (cubeCase !== 0 && cubeCase !== 255) {
          const newMesh = caseToMesh(x, y, z, cubeCase);
          mesh.merge(newMesh);
        }
      }
    }
  }

  self.postMessage(
    {
      field,
      meshVertices: mesh.getVertices(),
      meshNormals: mesh.getNormals(),
      meshTypes: mesh.getTypes()
    },
    [field.buffer]
  );

  const endTime = performance.now();
  console.log(`Worker finished in ${endTime - startTime} ms`);
};
