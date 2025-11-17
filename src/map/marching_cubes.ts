import { vec2, vec3 } from "gl-matrix";
import { VERTICES, EDGES, CASES } from "./geometry";
import { Triangle, Mesh } from "./Mesh";
import { vertexKey } from "./cubes_utils";
import { WorldObject } from "./WorldObject";
import { WorldMap } from "./Map";

export class Chunk {
  ChunkPosition: vec2;
  GridSize: vec3;
  Field: Float32Array = new Float32Array();
  FieldMap: Map<string, number>;
  WorldFieldMap: Map<string, number> = new Map<string, number>();
  seed: number;
  Worker: Worker;
  Mesh: Mesh = null!;
  gearObjects: vec3[];
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
    this.gearObjects = [];
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
  /**
   * Generates the surface mesh and world objects, comprising a chunk
   */
  async generateTerrain(world: WorldMap): Promise<Float32Array> {
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36).slice(2);
      const handler = (
        event: MessageEvent<{
          requestId?: string;
          field: Float32Array;
          fieldMap: [string, number][];
        }>
      ) => {
        if (event.data.requestId !== requestId) return;
        this.Field = event.data.field;
        this.FieldMap = new Map<string, number>(event.data.fieldMap);
        this.Worker.removeEventListener("message", handler as EventListener);
        resolve(this.Field);
      };
      this.Worker.addEventListener("message", handler as EventListener);
      this.Worker.postMessage({
        requestId,
        GridSize: this.GridSize,
        ChunkPosition: this.ChunkPosition,
        Seed: this.seed,
        generatingTerrain: true,
        worldFieldMap: this.FieldMap
      });
    });
  }
  async generateMarchingCubes(): Promise<Mesh> {
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36).slice(2);
      const handler = (
        event: MessageEvent<{
          requestId?: string;
          meshVertices: Triangle[];
          meshNormals: Triangle[];
          meshTypes: [number, number, number][];
          justGearObjectsLol: vec3[];
        }>
      ) => {
        if (event.data.requestId !== requestId) return;
        this.Mesh = new Mesh();
        this.Mesh.setVertices(event.data.meshVertices);
        this.Mesh.setNormals(event.data.meshNormals);
        this.Mesh.setTypes(event.data.meshTypes);
        this.gearObjects = event.data.justGearObjectsLol;
        this.Worker.removeEventListener("message", handler as EventListener);
        resolve(this.Mesh);
      };
      this.Worker.addEventListener("message", handler as EventListener);
      this.Worker.postMessage({
        requestId,
        GridSize: this.GridSize,
        ChunkPosition: this.ChunkPosition,
        Seed: this.seed,
        generatingTerrain: false,
        worldFieldMap: this.WorldFieldMap
      });
    });
  }

  getMesh() {
    return this.Mesh;
  }
}
