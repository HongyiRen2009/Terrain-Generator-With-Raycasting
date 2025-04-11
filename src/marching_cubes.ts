import { vec2, vec3 } from "gl-matrix";
import { createNoise2D, createNoise3D } from "simplex-noise";
export class Chunk {
  ChunkPosition: vec2;
  GridSize: vec3;
  Field: Float32Array;
  constructor(ChunkPosition: vec2, GridSize: vec3) {
    this.GridSize = GridSize;
    this.ChunkPosition = ChunkPosition;
    this.Field = new Float32Array(32 * 32 * 32); //32 X width, 32 Z width and 32 height
  }
  get(x: number, y: number, z: number) {
    return this.Field[
      x + y * this.GridSize[0] + z * this.GridSize[0] * this.GridSize[1]
    ];
  }
  set(x: number, y: number, z: number, value: number) {
    this.Field[
      x + y * this.GridSize[0] + z * this.GridSize[0] * this.GridSize[1]
    ] = value;
  }
  GenerateTerrainChunk() {}
  CreateMarchingCubes() {
    for (let x = 0; x < this.GridSize[0] - 1; x++) {
      for (let y = 0; y < this.GridSize[1] - 1; y++) {
        for (let z = 0; z < this.GridSize[2] - 1; z++) {
          const CubeCase = this.GenerateCase(x, y, z);
        }
      }
    }
  }
  GenerateCase(x: number, y: number, z: number) {
    let CubeCase = 0;

    for (let i = 0; i < 8; i++) {
      let Currentx = x + (i & 1);
      let Currenty = y + ((i & 2) >> 1);
      let Currentz = z + ((i & 4) >> 2);

      if (this.get(Currentx, Currenty, Currentz) > 0) {
        CubeCase |= 1 << i;
      }
    }
  }
}

interface Coordinate {
  x: number;
  y: number;
  z: number;
}

type Triangle = [Coordinate, Coordinate, Coordinate];
type Mesh = Triangle[];

export const march = (chunk: Chunk): Mesh => {
  const triangle1: Triangle = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 }
  ];

  const triangle2: Triangle = [
    { x: 1, y: 1, z: 0 },
    { x: 2, y: 1, z: 0 },
    { x: 1, y: 2, z: 0 }
  ];

  const triangle3: Triangle = [
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 1 },
    { x: 0, y: 1, z: 1 }
  ];

  const triangle4: Triangle = [
    { x: 1, y: 1, z: 1 },
    { x: 2, y: 1, z: 2 },
    { x: 1, y: 2, z: 3 }
  ];

  return [triangle1, triangle2, triangle3, triangle4];
};

export const meshToVertices = (mesh: Mesh): Float32Array => {
  // for each vertex: x,y,z, r,g,b
  const vertices = new Float32Array(mesh.length * 18);
  // for each triangle
  for (let i = 0; i < mesh.length; i++) {
    // for each vertex in the triangle
    for (let j = 0; j < 3; j++) {
      const vertex = mesh[i][j];
      vertices[i * 18 + j * 6 + 0] = vertex.x;
      vertices[i * 18 + j * 6 + 1] = vertex.y;
      vertices[i * 18 + j * 6 + 2] = vertex.z;

      // change the colors based on the vertex position
      vertices[i * 18 + j * 6 + 3] = [1, 0, 0][j];
      vertices[i * 18 + j * 6 + 4] = [0, 1, 0][j];
      vertices[i * 18 + j * 6 + 5] = [0, 0, 1][j];
    }
  }

  return vertices;
};

