import { vec2, vec3 } from "gl-matrix";
import { VERTICES, EDGES, CASES } from "./geometry";
import { Triangle, Mesh } from "./Mesh";
import { vertexKey } from "./cubes_utils";

//!NOTE: current code assumes a chunk size of GridSize[0]xGridSize[1]xGridSize[2]
export class Chunk {
  ChunkPosition: vec2;
  GridSize: vec3;
  Field: Float32Array = new Float32Array();
  FieldMap: Map<string, number>;
  WorldFieldMap: Map<string, number> = new Map<string, number>();
  seed: number;
  Worker: Worker;
  Mesh: Mesh = null!;
  constructor(
    ChunkPosition: vec2,
    GridSize: vec3,
    seed: number,
    Worker: Worker
  ) {
    this.GridSize = GridSize;
    this.ChunkPosition = ChunkPosition;
    this.seed = seed;
    this.Worker = Worker;
    this.FieldMap = new Map<string, number>();
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
  async generateTerrain(): Promise<Float32Array> {
    return new Promise((resolve) => {
      this.Worker.postMessage({
        GridSize: this.GridSize,
        ChunkPosition: this.ChunkPosition,
        Seed: this.seed,
        generatingTerrain: true,
        worldFieldMap: this.FieldMap
      });
      this.Worker.onmessage = (
        event: MessageEvent<{
          field: Float32Array;
          fieldMap: Map<string, number>;
        }>
      ) => {
        this.Field = event.data.field;
        this.FieldMap = new Map<string, number>(event.data.fieldMap);
        resolve(this.Field);
      };
    });
  }
  async generateMarchingCubes(): Promise<Mesh> {
    return new Promise((resolve) => {
      this.Worker.postMessage({
        GridSize: this.GridSize,
        ChunkPosition: this.ChunkPosition,
        Seed: this.seed,
        generatingTerrain: false,
        worldFieldMap: this.WorldFieldMap
      });
      this.Worker.onmessage = (
        event: MessageEvent<{
          meshVertices: Triangle[];
          meshNormals: Triangle[];
          meshTypes: [number, number, number][];
        }>
      ) => {
        this.Mesh = new Mesh();
        this.Mesh.setVertices(event.data.meshVertices);
        this.Mesh.setNormals(event.data.meshNormals);
        this.Mesh.setTypes(event.data.meshTypes);
        resolve(this.Mesh);
      };
    });
  }

  getMesh() {
    return this.Mesh;
  }
}
