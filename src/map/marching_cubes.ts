import { vec2, vec3 } from "gl-matrix";
import { VERTICES, EDGES, CASES } from "./geometry";
import type { NoiseFunction3D } from "simplex-noise";
import { Triangle, Mesh } from "./Mesh";

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
    const frequency = 0.07;
    // returns a value [-1, 1] so we need to remap it to our domain of [0, 1]
    vec3.add(
      c,
      c,
      vec3.fromValues(this.ChunkPosition[0], 0, this.ChunkPosition[1])
    ); // Offset the coordinates by the chunk position
    const SimplexNoise = this.SimplexNoise(c[0] *frequency, c[1] *frequency, c[2] *frequency);

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
