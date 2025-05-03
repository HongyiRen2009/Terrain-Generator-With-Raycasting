import { vec2, vec3 } from "gl-matrix";
import { VERTICES, EDGES, CASES } from "./geometry";
import { createNoise3D } from "simplex-noise";
import type { NoiseFunction2D, NoiseFunction3D } from "simplex-noise";
import { Triangle, Mesh } from "./Mesh";
import { Terrains } from "./terrains";


//!NOTE: current code assumes a chunk size of GridSize[0]xGridSize[1]xGridSize[2]
export class Chunk {
  ChunkPosition: vec2;
  GridSize: vec3;
  Field: Float32Array;
  SimplexNoise: NoiseFunction3D;

  constructor(
    ChunkPosition: vec2,
    GridSize: vec3,
    SimplexNoise: NoiseFunction3D
  ) {
    this.GridSize = GridSize;
    this.ChunkPosition = ChunkPosition;
    this.SimplexNoise = SimplexNoise;
    this.Field = this.generateFieldValues();
  }

  chunkCoordinateToIndex(c: vec3): number {
    return (
      c[0] +
      c[1] * (this.GridSize[0] + 1) +
      c[2] * (this.GridSize[0] + 1) * (this.GridSize[1] + 1)
    );
  }

  generateFieldValues(): Float32Array {
    const field = new Float32Array(
      (this.GridSize[0] + 1) * (this.GridSize[1] + 1) * (this.GridSize[2] + 1)
    );

    for (let x = 0; x < this.GridSize[0] + 1; x++) {
      for (let y = 0; y < this.GridSize[1] + 1; y++) {
        for (let z = 0; z < this.GridSize[2] + 1; z++) {
          let c = vec3.fromValues(x, y, z);

          const idx = this.chunkCoordinateToIndex(c);
          field[idx] = this.noiseFunction(c);
        }
      }
    }

    return field;
  }

  noiseFunction(c: vec3): number {
    const noiseScaleFactor = 10;
    // returns a value [-1, 1] so we need to remap it to our domain of [0, 1]
    vec3.add(
      c,
      c,
      vec3.fromValues(this.ChunkPosition[0], 0, this.ChunkPosition[1])
    ); // Offset the coordinates by the chunk position
    const SimplexNoise = this.SimplexNoise(c[0] / 10, c[1] / 10, c[2] / 10);

    const normalizedNoise = (SimplexNoise + 1) / 2;

    // Encourage the surface to be closer to the ground
    const heightParameter = 1 / 1.07 ** c[1];

    const floor = +(c[1] == 0);

    return Math.max(normalizedNoise * heightParameter, floor);
  }

  set(c: vec3, value: number) {
    this.Field[this.chunkCoordinateToIndex(c)] = value;
  }

  getTerrainValue(c: vec3) {
    return this.Field[this.chunkCoordinateToIndex(c)];
  }

  isSolid(c: vec3) {
    return this.getTerrainValue(c) > 0.5;
  }

  GenerateTerrainChunk() {}

  CreateMarchingCubes(): Mesh {
    const mesh: Mesh = new Mesh();

    for (let x = 0; x < this.GridSize[0]; x++) {
      for (let y = 0; y < this.GridSize[1]; y++) {
        for (let z = 0; z < this.GridSize[2]; z++) {
          let c = vec3.fromValues(x, y, z);

          const cubeCase = this.GenerateCase(c);
          const newMesh = this.caseToMesh(c, cubeCase);
          mesh.merge(newMesh);
        }
      }
    }

    return mesh;
  }

  GenerateCase(cubeCoordinates: vec3): number {
    /*
      Given the coordinate of a cube in the world,
      return the corresponding index into the marching cubes lookup.
      Involves looking at each of the eight vertices.
    */

    let caseIndex = 0;

    for (let i = 0; i < VERTICES.length; i++) {
      let vertexOffset = vec3.fromValues(...VERTICES[i]);

      vec3.add(vertexOffset, vertexOffset, cubeCoordinates);

      const isTerrain = Number(this.isSolid(vertexOffset));
      caseIndex += isTerrain << i;
    }

    return caseIndex;
  }

  caseToMesh(c: vec3, caseNumber: number): Mesh {
    const caseMesh: Mesh = new Mesh();
    const caseLookup = CASES[caseNumber];
    for (const triangleLookup of caseLookup) {
      // each triangle is represented as list of the three edges which it is located on
      // for now, place the actual triangle's vertices as the midpoint of the edge
      let triangle = triangleLookup.map((edgeIndex) =>
        this.edgeIndexToCoordinate(c, edgeIndex)
      ) as Triangle;
      caseMesh.addTriangle(triangle);
    }

    return caseMesh;
  }

  edgeIndexToCoordinate(c: vec3, edgeIndex: number): vec3 {
    const [a, b] = EDGES[edgeIndex];

    const v1 = vec3.fromValues(...VERTICES[a]);
    const v2 = vec3.fromValues(...VERTICES[b]);

    vec3.add(v1, v1, c);
    vec3.add(v2, v2, c);

    // this formula works by guessing where along the edge you would find 0.5
    // Is there a better way to write this? :/
    const weight1 = this.getTerrainValue(v1) - 0.5;
    const weight2 = this.getTerrainValue(v2) - 0.5;

    const lerpAmount = weight1 / (weight1 - weight2);

    let edgeCoordinate = vec3.create();

    vec3.lerp(edgeCoordinate, v1, v2, lerpAmount);

    return edgeCoordinate;
  }
}
const roundToPrecision = (value: number, precision: number): number =>
  Math.round(value * precision) / precision;

const vertexKey = (vertex: vec3): string =>
  `${roundToPrecision(vertex[0], 1e2)},${roundToPrecision(vertex[1], 1e2)},${roundToPrecision(vertex[2], 1e2)}`;
const calculateTriangleNormal = (triangle: Triangle): vec3 => {
  const v1 = vec3.sub(vec3.create(), triangle[1], triangle[0]);
  const v2 = vec3.sub(vec3.create(), triangle[2], triangle[0]);
  const normal = vec3.create();
  vec3.cross(normal, v1, v2);
  vec3.normalize(normal, normal);
  return normal;
};
export const calculateVertexNormals = (mesh: Mesh): Map<string, vec3> => {
  const vertexNormals = new Map<string, vec3>();

  for (const triangle of mesh.mesh) {
    // Calculate the normal for the triangle
    const normal = calculateTriangleNormal(triangle);

    // Add the triangle's normal to each of its vertices
    for (const vertex of triangle) {
      console.log(vertex);
      const key = vertexKey(vertex); // Use the vertex position as a key
      if (!vertexNormals.has(key)) {
        vertexNormals.set(key, vec3.create());
      }
      vec3.add(vertexNormals.get(key)!, vertexNormals.get(key)!, normal);
    }
  }

  // Normalize all vertex normals
  for (const [key, normal] of Array.from(vertexNormals.entries())) {
    vec3.normalize(normal, normal);
  }

  return vertexNormals;
};

export const meshToVertices = (
  mesh: Mesh,
  vertexNormals: Map<string, vec3>,
  ChunkPosition: vec2
): Float32Array => {
  // For each vertex: x, y, z, r, g, b
  const vertices = new Float32Array(mesh.mesh.length * 18);

  for (let i = 0; i < mesh.mesh.length; i++) {
    const triangle = mesh.mesh[i];
    const types = mesh.type[i];
    for (let j = 0; j < 3; j++) {
      const vertex = triangle[j];
      const key = vertexKey(vertex);
      const normal = vertexNormals.get(key)!;

      // Vertex position
      vertices[i * 18 + j * 6 + 0] = vertex[0] + ChunkPosition[0];
      vertices[i * 18 + j * 6 + 1] = vertex[1];
      vertices[i * 18 + j * 6 + 2] = vertex[2] + ChunkPosition[1];

      // Vertex normal

      //TODO: Implement everything else and tune stuff
      const type = Terrains[types[j]];
      const color = type.color
      const shadow = Math.pow(normal[1],0.30103);
      vertices[i * 18 + j * 6 + 3] = color.r/255*shadow*type.illuminosity;
      vertices[i * 18 + j * 6 + 4] = color.g/255*shadow*type.illuminosity;
      vertices[i * 18 + j * 6 + 5] = color.b/255*shadow*type.illuminosity;
      console.log(normal[1] * 0.5 + 0.5);
    }
  }

  return vertices;
};
