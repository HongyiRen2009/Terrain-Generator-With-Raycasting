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
