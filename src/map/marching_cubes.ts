import { vec2, vec3 } from "gl-matrix";
import { VERTICES, EDGES, CASES } from "./geometry";
import {
  createNoise2D,
  NoiseFunction2D,
  type NoiseFunction3D
} from "simplex-noise";
import { Triangle, Mesh } from "./Mesh";
import { vertexKey } from "./cubes_utils";

//!NOTE: current code assumes a chunk size of GridSize[0]xGridSize[1]xGridSize[2]
export class Chunk {
  ChunkPosition: vec2;
  GridSize: vec3;
  Field: Float32Array;
  octaves: NoiseFunction2D[];
  FieldMap: Map<string, number>;
  WorldFieldMap: Map<string, number> = new Map<string, number>();

  constructor(
    ChunkPosition: vec2,
    GridSize: vec3,
    SimplexNoise: NoiseFunction3D
  ) {
    this.GridSize = GridSize;
    this.ChunkPosition = ChunkPosition;
    this.octaves = [];
    for (let i = 0; i < 8; i++) {
      this.octaves.push(createNoise2D(Math.random));
    }
    this.FieldMap = new Map<string, number>();
    this.Field = this.generateFieldValues();
  }

  chunkCoordinateToIndex(c: vec3): number {
    return (
      c[0] +
      c[1] * (this.GridSize[0] + 1) +
      c[2] * (this.GridSize[0] + 1) * (this.GridSize[1] + 1)
    );
  }
  setWorldFieldMap(worldFieldMap: Map<string, number>) {
    this.WorldFieldMap = worldFieldMap;
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
          vec3.add(
            c,
            c,
            vec3.fromValues(this.ChunkPosition[0], 0, this.ChunkPosition[1])
          );
          const out = this.noiseFunction(c);
          field[idx] = out;

          this.FieldMap.set(vertexKey(c), out);
        }
      }
    }

    return field;
  }
  getFieldValueWithNeighbors(vertex: vec3): number {
    vec3.add(
      vertex,
      vertex,
      vec3.fromValues(this.ChunkPosition[0], 0, this.ChunkPosition[1])
    );
    const key = vertexKey(vertex);
    return this.WorldFieldMap.get(key) ?? 0;
  }

  calculateNormal(vertex: vec3): vec3 {
    const delta = 1.0;
    const normal = vec3.create();

    // Calculate gradients using central differences
    // X gradient
    const x1 = vec3.fromValues(vertex[0] + delta, vertex[1], vertex[2]);
    const x2 = vec3.fromValues(vertex[0] - delta, vertex[1], vertex[2]);
    normal[0] =
      this.getFieldValueWithNeighbors(x1) - this.getFieldValueWithNeighbors(x2);

    // Y gradient
    const y1 = vec3.fromValues(vertex[0], vertex[1] + delta, vertex[2]);
    const y2 = vec3.fromValues(vertex[0], vertex[1] - delta, vertex[2]);
    normal[1] =
      this.getFieldValueWithNeighbors(y1) - this.getFieldValueWithNeighbors(y2);

    // Z gradient
    const z1 = vec3.fromValues(vertex[0], vertex[1], vertex[2] + delta);
    const z2 = vec3.fromValues(vertex[0], vertex[1], vertex[2] - delta);
    normal[2] =
      this.getFieldValueWithNeighbors(z1) - this.getFieldValueWithNeighbors(z2);

    // Negate and normalize the normal
    vec3.negate(normal, normal);
    vec3.normalize(normal, normal);

    return normal;
  }
  noiseFunction(c: vec3): number {
    const octaveValues = this.octaves
      .slice(0, 2)
      .map((fn, i) => {
        const frequency = 2 ** (i - 5);
        const noise = fn(c[0] * frequency, c[2] * frequency);
        const normalized = (noise + 1) / 2;
        return normalized * 10 * 0.5 ** i;
      })
      .reduce((a, b) => a + b);

    const floor = +(c[1] == 0);

    // only become solid if the y coordinate is below the height
    // so basically a heightmap
    if (c[1] < Math.max(octaveValues, floor)) {
      return 1;
    } else {
      return 0;
    }
  }

  set(c: vec3, value: number) {
    this.Field[this.chunkCoordinateToIndex(c)] = value;
  }

  getTerrainValue(c: vec3) {
    return this.Field[this.chunkCoordinateToIndex(c)];
  }

  isSolid(c: vec3) {
    return Chunk.solidChecker(this.getTerrainValue(c));
  }
  /**
   * Meant to future-proof our code - when we may end up needing to use raw field values, instead of rewriting a everchanging solution to check if it is solid use this
   * @param a The value from the field
   * @returns A boolean if it is solid or not
   */
  static solidChecker(a: number) {
    return a > 0.5;
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
      const vertices = triangleLookup.map((edgeIndex) =>
        this.edgeIndexToCoordinate(c, edgeIndex)
      );

      // Add triangle with both position and normal information
      caseMesh.addTriangle(
        vertices.map((v) => v.position) as Triangle,
        vertices.map((v) => v.normal) as Triangle
      );
    }
    return caseMesh;
  }
  edgeIndexToCoordinate(
    c: vec3,
    edgeIndex: number
  ): { position: vec3; normal: vec3 } {
    const [a, b] = EDGES[edgeIndex];

    const v1 = vec3.fromValues(...VERTICES[a]);
    const v2 = vec3.fromValues(...VERTICES[b]);

    vec3.add(v1, v1, c);
    vec3.add(v2, v2, c);

    // this formula works by guessing where along the edge you would find 0.5
    // Is there a better way to write this? :/
    const weight1 = this.getTerrainValue(v1) - 0.5;
    const weight2 = this.getTerrainValue(v2) - 0.5;
    const normal1 = this.calculateNormal(v1);
    const normal2 = this.calculateNormal(v2);
    const lerpAmount = weight1 / (weight1 - weight2);

    let position = vec3.create();
    let normal = vec3.create();

    vec3.lerp(position, v1, v2, lerpAmount);
    vec3.lerp(normal, normal1, normal2, lerpAmount);
    return { position, normal };
  }
}
