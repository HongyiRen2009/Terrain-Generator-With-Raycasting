import { vec2, vec3 } from "gl-matrix";
import { Triangle, Mesh } from "./Mesh";
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
          // packed format (transferables)
          packedVertices?: Float32Array;
          packedNormals?: Float32Array;
          packedTerrains?: Float32Array;
          triangleCount?: number;
          // interleaved / index format
          interleavedVertices?: Float32Array;
          interleavedIndices?: Uint32Array;
          timings?: { [k: string]: number };
          // legacy format
          meshVertices?: Triangle[];
          meshNormals?: Triangle[];
          meshTypes?: [number, number, number][];
          justGearObjectsLol?: vec3[];
        }>
      ) => {
        if (event.data.requestId !== requestId) return;
        this.Mesh = new Mesh();
        // If worker sent packed buffers, unpack into Mesh (avoids structured-clone in worker)
        if (event.data.packedVertices && event.data.packedNormals && event.data.packedTerrains && event.data.triangleCount) {
          const verts = event.data.packedVertices;
          const norms = event.data.packedNormals;
          const terrains = event.data.packedTerrains;
          const triCount = event.data.triangleCount;

          for (let i = 0; i < triCount; i++) {
            const baseV = i * 9;
            const baseN = i * 9;
            const baseT = i * 3;

            const t: Triangle = [
              vec3.fromValues(verts[baseV], verts[baseV + 1], verts[baseV + 2]),
              vec3.fromValues(verts[baseV + 3], verts[baseV + 4], verts[baseV + 5]),
              vec3.fromValues(verts[baseV + 6], verts[baseV + 7], verts[baseV + 8])
            ];

            const n: Triangle = [
              vec3.fromValues(norms[baseN], norms[baseN + 1], norms[baseN + 2]),
              vec3.fromValues(norms[baseN + 3], norms[baseN + 4], norms[baseN + 5]),
              vec3.fromValues(norms[baseN + 6], norms[baseN + 7], norms[baseN + 8])
            ];

            const ty: [number, number, number] = [
              terrains[baseT],
              terrains[baseT + 1],
              terrains[baseT + 2]
            ];

            this.Mesh.addTriangle(t, n, ty);
          }
        } else if (event.data.interleavedVertices && event.data.interleavedIndices) {
          // If interleaved vertex/index buffers are provided, reconstruct Mesh triangles from them
          const interleaved = event.data.interleavedVertices as Float32Array;
          const indices = event.data.interleavedIndices as Uint32Array;
          const triCount2 = Math.floor(indices.length / 3);
          for (let i = 0; i < triCount2; i++) {
            const ia = indices[i * 3];
            const ib = indices[i * 3 + 1];
            const ic = indices[i * 3 + 2];

            const aPosBase = ia * 9;
            const bPosBase = ib * 9;
            const cPosBase = ic * 9;

            const t: Triangle = [
              vec3.fromValues(interleaved[aPosBase], interleaved[aPosBase + 1], interleaved[aPosBase + 2]),
              vec3.fromValues(interleaved[bPosBase], interleaved[bPosBase + 1], interleaved[bPosBase + 2]),
              vec3.fromValues(interleaved[cPosBase], interleaved[cPosBase + 1], interleaved[cPosBase + 2])
            ];

            const na: vec3 = vec3.fromValues(interleaved[aPosBase + 3], interleaved[aPosBase + 4], interleaved[aPosBase + 5]);
            const nb: vec3 = vec3.fromValues(interleaved[bPosBase + 3], interleaved[bPosBase + 4], interleaved[bPosBase + 5]);
            const nc: vec3 = vec3.fromValues(interleaved[cPosBase + 3], interleaved[cPosBase + 4], interleaved[cPosBase + 5]);

            const n: Triangle = [na, nb, nc];

            this.Mesh.addTriangle(t, n, [0, 0, 0]);
          }
        } else if (event.data.meshVertices && event.data.meshNormals && event.data.meshTypes) {
          // legacy path
          this.Mesh.setVertices(event.data.meshVertices);
          this.Mesh.setNormals(event.data.meshNormals);
          this.Mesh.setTypes(event.data.meshTypes);
          this.gearObjects = event.data.justGearObjectsLol ?? [];
        }
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
