import { vec2, vec3 } from "gl-matrix";
import { createNoise3D, NoiseFunction3D } from "simplex-noise";
import alea from "alea";
import { vertexKey } from "./cubes_utils";
import { Mesh, Triangle } from "./Mesh";
import { CASES, EDGES, VERTICES } from "./geometry";
import { Utilities } from "./Utilities";

export type WorkerConstructor = new (
  stringUrl: string | URL,
  options?: WorkerOptions
) => Worker;
console.log("Worker started");
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

function noiseFunction(c: vec3, simplex: NoiseFunction3D): number {
  const frequency = 0.07;
  const noiseValue = simplex(
    c[0] * frequency,
    c[1] * frequency,
    c[2] * frequency
  );
  const normalizedNoise = (noiseValue + 1) / 2;
  const heightParameter = 1 / 1.07 ** c[1];
  const floor = +(c[1] === 0);
  return Math.max(normalizedNoise * heightParameter, floor);
}

function GenerateCase(cubeCoordinates: vec3): number {
  /*
      Given the coordinate of a cube in the world,
      return the corresponding index into the marching cubes lookup.
      Involves looking at each of the eight vertices.
    */

  let caseIndex = 0;

  for (let i = 0; i < VERTICES.length; i++) {
    let vertexOffset = vec3.fromValues(...VERTICES[i]);

    vec3.add(vertexOffset, vertexOffset, cubeCoordinates);

    const isTerrain = Number(solidChecker(getFieldValue(vertexOffset)));
    caseIndex += isTerrain << i;
  }

  return caseIndex;
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
function caseToMesh(c: vec3, caseNumber: number, gridSize: vec3): Mesh {
  const caseMesh: Mesh = new Mesh();
  const caseLookup = CASES[caseNumber];
  for (const triangleLookup of caseLookup) {
    // each triangle is represented as list of the three edges which it is located on
    // for now, place the actual triangle's vertices as the midpoint of the edge
    const vertices = triangleLookup.map((edgeIndex) =>
      edgeIndexToCoordinate(c, edgeIndex)
    );

    // Add triangle with both position and normal information
    caseMesh.addTriangle(
      vertices.map((v) => v.position) as Triangle,
      vertices.map((v) => v.normal) as Triangle,
      (vertices[0].position[0] < 20 ? [0,0,0]: vertices[0].position[0] < 40 ? [2,2,2] : [3,3,3])
    );
  }
  return caseMesh;
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

  // Get terrain values using the field array
  const value1 = getFieldValue(v1);
  const value2 = getFieldValue(v2);

  // Calculate normals using central differences and the noise function
  const normal1 = calculateNormal(v1);
  const normal2 = calculateNormal(v2);

  const lerpAmount = (value1 - 0.5) / (value1 - 0.5 - (value2 - 0.5));

  let position = vec3.create();
  let normal = vec3.create();

  vec3.lerp(position, v1, v2, lerpAmount);
  vec3.lerp(normal, normal1, normal2, lerpAmount);
  vec3.normalize(normal, normal);

  return { position, normal };
}
// Helper for normal calculation
// Helper for normal calculation
function calculateNormal(vertex: vec3): vec3 {
  const delta = 1.0;
  const normal = vec3.create();

  // Calculate gradients using central differences
  // X gradient
  const x1 = vec3.fromValues(vertex[0] + delta, vertex[1], vertex[2]);
  const x2 = vec3.fromValues(vertex[0] - delta, vertex[1], vertex[2]);
  normal[0] = getFieldValue(x1) - getFieldValue(x2);

  // Y gradient
  const y1 = vec3.fromValues(vertex[0], vertex[1] + delta, vertex[2]);
  const y2 = vec3.fromValues(vertex[0], vertex[1] - delta, vertex[2]);
  normal[1] = getFieldValue(y1) - getFieldValue(y2);

  // Z gradient
  const z1 = vec3.fromValues(vertex[0], vertex[1], vertex[2] + delta);
  const z2 = vec3.fromValues(vertex[0], vertex[1], vertex[2] - delta);
  normal[2] = getFieldValue(z1) - getFieldValue(z2);

  // Negate and normalize the normal
  vec3.negate(normal, normal);
  vec3.normalize(normal, normal);

  return normal;
}
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { Seed, GridSize, ChunkPosition, generatingTerrain, worldFieldMap } =
    event.data;
  globalChunkPosition = ChunkPosition;
  const prng = alea(Seed);
  const simplex = createNoise3D(prng);
  if (generatingTerrain) {
    const field = new Float32Array(
      (GridSize[0] + 1) * (GridSize[1] + 1) * (GridSize[2] + 1)
    );
    const fieldMap = new Map<string, number>();

    // Generate noise field
    for (let x = 0; x <= GridSize[0]; x++) {
      for (let y = 0; y <= GridSize[1]; y++) {
        for (let z = 0; z <= GridSize[2]; z++) {
          let c = vec3.fromValues(x, y, z);
          // Offset by chunk position
          vec3.add(
            c,
            c,
            vec3.fromValues(ChunkPosition[0], 0, ChunkPosition[1])
          );
          const idx = chunkCoordinateToIndex(
            vec3.fromValues(x, y, z),
            GridSize
          );
          const value = noiseFunction(c, simplex);
          field[idx] = value;
          fieldMap.set(vertexKey(c), value);
        }
      }
    }
    const fieldMapArray = Array.from(fieldMap.entries());
    self.postMessage(
      {
        field,
        fieldMap: fieldMapArray
      },
      [field.buffer]
    );
    return;
  } else {
    WorldFieldMap = worldFieldMap;
    //Generate mesh with marching cubes
    const mesh: Mesh = new Mesh();
    for (let x = 0; x < GridSize[0]; x++) {
      for (let y = 0; y < GridSize[1]; y++) {
        for (let z = 0; z < GridSize[2]; z++) {
          let c = vec3.fromValues(x, y, z);
          const cubeCase = GenerateCase(c);
          const newMesh = caseToMesh(c, cubeCase, GridSize);
          mesh.merge(newMesh);
        }
      }
    }
    self.postMessage({
      meshVertices: mesh.getVertices(),
      meshNormals: mesh.getNormals(),
      meshTypes: mesh.getTypes()
    });
  }
};
