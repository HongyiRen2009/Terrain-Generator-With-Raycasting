import { vec2, vec3 } from "gl-matrix";
import { Triangle, Mesh } from "./Mesh";
import { WorldMap } from "./Map";
import { CASES, EDGES, VERTICES } from "./geometry";
import { vertexKey } from "./cubes_utils";

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

  // Generate edge triangles in main thread
  generateEdgeTriangles(): void {
    const edgeMesh = new Mesh();

    // Process X-axis edges (x = 0 and x = GridSize[0] - 1)
    for (let x of [0, this.GridSize[0] - 1]) {
      for (let y = 0; y < this.GridSize[1]; y++) {
        for (let z = 0; z < this.GridSize[2]; z++) {
          let c = vec3.fromValues(x, y, z);
          const cubeCase = this.GenerateCase(c);
          const newMesh = this.caseToMesh(c, cubeCase);
          edgeMesh.merge(newMesh);
        }
      }
    }

    // Process Y-axis edges (y = 0 and y = GridSize[1] - 1)
    for (let y of [0, this.GridSize[1] - 1]) {
      for (let x = 1; x < this.GridSize[0] - 1; x++) {
        // Skip corners already processed
        for (let z = 0; z < this.GridSize[2]; z++) {
          let c = vec3.fromValues(x, y, z);
          const cubeCase = this.GenerateCase(c);
          const newMesh = this.caseToMesh(c, cubeCase);
          edgeMesh.merge(newMesh);
        }
      }
    }

    // Process Z-axis edges (z = 0 and z = GridSize[2] - 1)
    for (let z of [0, this.GridSize[2] - 1]) {
      for (let x = 1; x < this.GridSize[0] - 1; x++) {
        // Skip edges already processed
        for (let y = 1; y < this.GridSize[1] - 1; y++) {
          // Skip edges already processed
          let c = vec3.fromValues(x, y, z);
          const cubeCase = this.GenerateCase(c);
          const newMesh = this.caseToMesh(c, cubeCase);
          edgeMesh.merge(newMesh);
        }
      }
    }

    if (!this.Mesh) {
      this.Mesh = edgeMesh;
    } else {
      this.Mesh.merge(edgeMesh);
    }

  }

  private GenerateCase(cubeCoordinates: vec3): number {
    let caseIndex = 0;
    for (let i = 0; i < VERTICES.length; i++) {
      let vertexOffset = vec3.fromValues(...VERTICES[i]);
      vec3.add(vertexOffset, vertexOffset, cubeCoordinates);
      const isTerrain = Number(
        this.solidChecker(this.getFieldValue(vertexOffset))
      );
      caseIndex += isTerrain << i;
    }
    return caseIndex;
  }

  private solidChecker(a: number): boolean {
    return a > 0.5;
  }

  private getFieldValue(c: vec3): number {
    const newVector = vec3.fromValues(0, 0, 0);
    vec3.add(
      newVector,
      c,
      vec3.fromValues(this.ChunkPosition[0], 0, this.ChunkPosition[1])
    );
    return this.WorldFieldMap.get(vertexKey(newVector)) ?? 0;
  }

  private caseToMesh(c: vec3, caseNumber: number): Mesh {
    const caseMesh: Mesh = new Mesh();
    const caseLookup = CASES[caseNumber];
    for (const triangleLookup of caseLookup) {
      const vertices = triangleLookup.map((edgeIndex) =>
        this.edgeIndexToCoordinate(c, edgeIndex)
      );
      caseMesh.addTriangle(
        vertices.map((v) => v.position) as Triangle,
        vertices.map((v) => v.normal) as Triangle,
        [0, 0, 0]
      );
    }
    return caseMesh;
  }

  private edgeIndexToCoordinate(
    c: vec3,
    edgeIndex: number
  ): { position: vec3; normal: vec3 } {
    const [a, b] = EDGES[edgeIndex];
    const v1 = vec3.fromValues(...VERTICES[a]);
    const v2 = vec3.fromValues(...VERTICES[b]);
    vec3.add(v1, v1, c);
    vec3.add(v2, v2, c);

    const value1 = this.getFieldValue(v1);
    const value2 = this.getFieldValue(v2);
    const normal1 = this.calculateNormal(v1);
    const normal2 = this.calculateNormal(v2);

    const lerpAmount = (value1 - 0.5) / (value1 - 0.5 - (value2 - 0.5));
    let position = vec3.create();
    let normal = vec3.create();
    vec3.lerp(position, v1, v2, lerpAmount);
    vec3.lerp(normal, normal1, normal2, lerpAmount);
    vec3.normalize(normal, normal);

    return { position, normal };
  }

  private calculateNormal(vertex: vec3): vec3 {
    const delta = 1.0;
    const normal = vec3.create();

    const x1 = vec3.fromValues(vertex[0] + delta, vertex[1], vertex[2]);
    const x2 = vec3.fromValues(vertex[0] - delta, vertex[1], vertex[2]);
    normal[0] = this.getFieldValue(x1) - this.getFieldValue(x2);

    const y1 = vec3.fromValues(vertex[0], vertex[1] + delta, vertex[2]);
    const y2 = vec3.fromValues(vertex[0], vertex[1] - delta, vertex[2]);
    normal[1] = this.getFieldValue(y1) - this.getFieldValue(y2);

    const z1 = vec3.fromValues(vertex[0], vertex[1], vertex[2] + delta);
    const z2 = vec3.fromValues(vertex[0], vertex[1], vertex[2] - delta);
    normal[2] = this.getFieldValue(z1) - this.getFieldValue(z2);

    vec3.negate(normal, normal);
    vec3.normalize(normal, normal);
    return normal;
  }
  // Generate terrain field and mesh (NEW)
  async generateTerrain(): Promise<void> {
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
        resolve();
      };
      this.Worker.addEventListener("message", handler as EventListener);
      this.Worker.postMessage({
        requestId,
        GridSize: this.GridSize,
        ChunkPosition: this.ChunkPosition,
        Seed: this.seed,
        generatingTerrain: true
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
  // Generate only edge cubes and merge into existing mesh (W AI commments)

  getMesh() {
    return this.Mesh;
  }
}
