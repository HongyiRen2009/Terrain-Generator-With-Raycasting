import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { Light } from "./Light";

import { Color, Terrain, Terrains } from "./terrains";
import { Mesh, Triangle } from "./Mesh";
import { RenderUtils } from "../utils/RenderUtils";
import { WorldObject } from "./WorldObject";
import { meshToInterleavedVerticesAndIndices } from "./cubes_utils";
import { ObjectUI } from "./ObjectUI";

interface ImportMapEntry {
  color: string;
  terrain: Terrain;
}

/**
 * The object holding the map of the world
 * Center chunk starts at 0,0 (probably)
 */
export class WorldMap {
  //In Chunks
  //Unused for now: placeholders and use them when actually implemented
  private width: number;
  private length: number;
  public lights: Light[] = [
    new Light(
      vec3.fromValues(0, 500, 0),
      new Color(255, 255, 255),
      1,
      200,
      new Color(255, 228, 132)
    )
  ];

  public height: number;
  public resolution = 64; //#of vertices square size of chunk
  public chunks: { [key: string]: Chunk } = {};
  public Workers: Worker[] = [];
  public seed: number = Math.floor(Math.random() * 999) + 1; // Random seed for noise generation

  public worldObjects: WorldObject[] = [];
  gl: WebGL2RenderingContext;

  private nextWorldObjectId: number = 0;

  private tracerUpdateSupplier: () => () => void;

  public objectUI: ObjectUI;

  /**
   * Constructs a world
   * @param width Width in # of chunks
   * @param length Length in # of chunks
   * @param height Height of world
   */
  public constructor(
    width: number,
    height: number,
    length: number,
    gl: WebGL2RenderingContext,
    updateTracer: () => () => void
  ) {
    this.tracerUpdateSupplier = updateTracer;

    this.gl = gl;
    this.width = width;
    this.length = length;
    this.height = height;
    this.chunks = {};
    for (let i = 0; i < navigator.hardwareConcurrency; i++) {
      this.Workers.push(new Worker(new URL("./Worker.ts", import.meta.url)));
    }
    const compute = new ComputeShader();
    compute.createPerlinNoise3D(64, 64, 64, this.seed).then(() => {
      console.log("WebGPU Perlin noise 3D texture created.");
    });
    this.objectUI = new ObjectUI(this, this.tracerUpdateSupplier);
  }

  /**
   * Clean up resources associated with the map (terminate workers, clear data).
   */
  public dispose(): void {
    if (this.Workers && this.Workers.length > 0) {
      for (const w of this.Workers) {
        try {
          w.terminate();
        } catch (e) {
          // ignore termination errors
        }
      }
      this.Workers = [];
    }
    // Clear other large structures
    this.chunks = {};
    this.worldObjects = [];
  }

  //Generates map
  public generate() {
    this.chunks = {};
    let worker = 0;

    for (let i = 0; i < 1; i++) {
      for (let j = 0; j < 1; j++) {
        const chunkPos = vec2.fromValues(
          i * this.resolution,
          j * this.resolution
        );
        const key = `${chunkPos[0]},${chunkPos[1]}`;
        this.chunks[key] = new Chunk(
          chunkPos,
          vec3.fromValues(this.resolution, this.height, this.resolution),
          this.seed,
          this.Workers[worker++ % navigator.hardwareConcurrency],
          this
        );
      }
    }
  }

  public getChunkAt(chunkX: number, chunkZ: number): Chunk | undefined {
    return this.chunks[`${chunkX},${chunkZ}`];
  }

  public getAllChunks(): Chunk[] {
    return Object.values(this.chunks);
  }

  public combinedMesh(): Mesh {
    const CombinedMesh = new Mesh();

    // Merge chunks (these are already independent)
    for (const chunk of Object.values(this.chunks)) {
      CombinedMesh.merge(chunk.getMesh());
    }

    // Merge worldObjects with transformation applied
    for (const obj of this.worldObjects) {
      const meshCopy = obj.mesh.copy(); // copy original mesh

      const transformedMesh = new Mesh();

      for (let i = 0; i < meshCopy.mesh.length; i++) {
        const tri = meshCopy.mesh[i];
        const norm = meshCopy.normals[i];

        // Deep copy triangle and normal
        const newTri: Triangle = [
          vec3.clone(tri[0]),
          vec3.clone(tri[1]),
          vec3.clone(tri[2])
        ];
        const newNorm: Triangle = [
          vec3.clone(norm[0]),
          vec3.clone(norm[1]),
          vec3.clone(norm[2])
        ];

        // Apply transformation
        for (let j = 0; j < 3; j++) {
          // Transform vertex
          const v = vec4.fromValues(
            newTri[j][0],
            newTri[j][1],
            newTri[j][2],
            1
          );
          vec4.transformMat4(v, v, obj.position);
          vec3.set(newTri[j], v[0], v[1], v[2]);

          // Transform normal (rotation + scale only)
          const n = vec4.fromValues(
            newNorm[j][0],
            newNorm[j][1],
            newNorm[j][2],
            0
          );
          const normalMat = mat4.clone(obj.position);
          normalMat[12] = 0;
          normalMat[13] = 0;
          normalMat[14] = 0;
          vec4.transformMat4(n, n, normalMat);
          vec3.normalize(newNorm[j], vec3.fromValues(n[0], n[1], n[2]));
        }

        // Add transformed triangle
        transformedMesh.addTriangle(newTri, newNorm, meshCopy.type[i]);
      }

      // Merge safely into combined mesh
      CombinedMesh.merge(transformedMesh);
    }

    return CombinedMesh;
  }

  public onObjectAdded?: (obj: WorldObject) => void;
  public onObjectRemoved?: (id: number) => void;

  /**
   * Add an object to the game world
   */
  public addObject(objectData: Mesh, objectLocation: mat4, name: string) {
    const { vertices, indices } =
      meshToInterleavedVerticesAndIndices(objectData);
    const meshSize = indices.length;

    let objectBuffer = RenderUtils.CreateStaticBuffer(
      this.gl,
      vertices,
      Array.from(indices)
    );

    const worldObject: WorldObject = {
      buffer: objectBuffer,
      position: objectLocation,
      meshSize: meshSize,
      id: this.nextWorldObjectId,
      mesh: objectData,
      name: name
    };

    this.nextWorldObjectId++;

    this.worldObjects.push(worldObject);

    if (this.onObjectAdded) {
      this.onObjectAdded(worldObject);
    }
  }

  /**
   * Get field value at world coordinates
   */
  public getFieldValue(worldX: number, worldY: number, worldZ: number): number {
    // Determine which chunk this world position belongs to
    const chunkX = Math.floor(worldX / this.resolution) * this.resolution;
    const chunkZ = Math.floor(worldZ / this.resolution) * this.resolution;

    const chunk = this.getChunkAt(chunkX, chunkZ);
    if (!chunk) return 0;

    // Convert world coordinates to local chunk coordinates
    const localX = worldX - chunkX;
    const localY = worldY;
    const localZ = worldZ - chunkZ;

    return chunk.getFieldValue(localX, localY, localZ);
  }
}

import { CASES, EDGES, VERTICES } from "./geometry";
import { ComputeShader } from "./WebGPU compute";

export class Chunk {
  ChunkPosition: vec2;
  GridSize: vec3;
  Field: Float32Array = new Float32Array();
  seed: number;
  Worker: Worker;
  Mesh: Mesh = null!;
  gearObjects: vec3[];
  worldMap: WorldMap;

  constructor(
    ChunkPosition: vec2,
    GridSize: vec3,
    seed: number,
    Worker: Worker,
    worldMap: WorldMap
  ) {
    this.GridSize = GridSize;
    this.ChunkPosition = ChunkPosition;
    this.seed = seed;
    this.Worker = Worker;
    this.gearObjects = [];
    this.worldMap = worldMap;
  }

  chunkCoordinateToIndex(c: vec3): number {
    return (
      c[0] +
      c[1] * (this.GridSize[0] + 1) +
      c[2] * (this.GridSize[0] + 1) * (this.GridSize[1] + 1)
    );
  }

  /**
   * Get field value at local chunk coordinates
   */
  public getFieldValue(localX: number, localY: number, localZ: number): number {
    // Check bounds
    if (
      localX < 0 ||
      localX > this.GridSize[0] ||
      localY < 0 ||
      localY > this.GridSize[1] ||
      localZ < 0 ||
      localZ > this.GridSize[2]
    ) {
      // Out of bounds - query world map for neighboring chunk
      const worldX = localX + this.ChunkPosition[0];
      const worldY = localY;
      const worldZ = localZ + this.ChunkPosition[1];
      return this.worldMap.getFieldValue(worldX, worldY, worldZ);
    }

    const idx = Math.floor(
      localX +
        localY * (this.GridSize[0] + 1) +
        localZ * (this.GridSize[0] + 1) * (this.GridSize[1] + 1)
    );

    return this.Field[idx] ?? 0;
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
        for (let y = 1; y < this.GridSize[1] - 1; y++) {
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
        this.solidChecker(
          this.getFieldValue(vertexOffset[0], vertexOffset[1], vertexOffset[2])
        )
      );
      caseIndex += isTerrain << i;
    }
    return caseIndex;
  }

  private solidChecker(a: number): boolean {
    return a > 0.5;
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

    const value1 = this.getFieldValue(v1[0], v1[1], v1[2]);
    const value2 = this.getFieldValue(v2[0], v2[1], v2[2]);
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

    normal[0] =
      this.getFieldValue(vertex[0] + delta, vertex[1], vertex[2]) -
      this.getFieldValue(vertex[0] - delta, vertex[1], vertex[2]);

    normal[1] =
      this.getFieldValue(vertex[0], vertex[1] + delta, vertex[2]) -
      this.getFieldValue(vertex[0], vertex[1] - delta, vertex[2]);

    normal[2] =
      this.getFieldValue(vertex[0], vertex[1], vertex[2] + delta) -
      this.getFieldValue(vertex[0], vertex[1], vertex[2] - delta);

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
        }>
      ) => {
        if (event.data.requestId !== requestId) return;
        this.Field = event.data.field;
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
          packedVertices?: Float32Array;
          packedNormals?: Float32Array;
          packedTerrains?: Float32Array;
          triangleCount?: number;
          interleavedVertices?: Float32Array;
          interleavedIndices?: Uint32Array;
          timings?: { [k: string]: number };
          meshVertices?: Triangle[];
          meshNormals?: Triangle[];
          meshTypes?: [number, number, number][];
          justGearObjectsLol?: vec3[];
        }>
      ) => {
        if (event.data.requestId !== requestId) return;
        this.Mesh = new Mesh();

        if (
          event.data.packedVertices &&
          event.data.packedNormals &&
          event.data.packedTerrains &&
          event.data.triangleCount
        ) {
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
              vec3.fromValues(
                verts[baseV + 3],
                verts[baseV + 4],
                verts[baseV + 5]
              ),
              vec3.fromValues(
                verts[baseV + 6],
                verts[baseV + 7],
                verts[baseV + 8]
              )
            ];

            const n: Triangle = [
              vec3.fromValues(norms[baseN], norms[baseN + 1], norms[baseN + 2]),
              vec3.fromValues(
                norms[baseN + 3],
                norms[baseN + 4],
                norms[baseN + 5]
              ),
              vec3.fromValues(
                norms[baseN + 6],
                norms[baseN + 7],
                norms[baseN + 8]
              )
            ];

            const ty: [number, number, number] = [
              terrains[baseT],
              terrains[baseT + 1],
              terrains[baseT + 2]
            ];

            this.Mesh.addTriangle(t, n, ty);
          }
        } else if (
          event.data.interleavedVertices &&
          event.data.interleavedIndices
        ) {
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
              vec3.fromValues(
                interleaved[aPosBase],
                interleaved[aPosBase + 1],
                interleaved[aPosBase + 2]
              ),
              vec3.fromValues(
                interleaved[bPosBase],
                interleaved[bPosBase + 1],
                interleaved[bPosBase + 2]
              ),
              vec3.fromValues(
                interleaved[cPosBase],
                interleaved[cPosBase + 1],
                interleaved[cPosBase + 2]
              )
            ];

            const na: vec3 = vec3.fromValues(
              interleaved[aPosBase + 3],
              interleaved[aPosBase + 4],
              interleaved[aPosBase + 5]
            );
            const nb: vec3 = vec3.fromValues(
              interleaved[bPosBase + 3],
              interleaved[bPosBase + 4],
              interleaved[bPosBase + 5]
            );
            const nc: vec3 = vec3.fromValues(
              interleaved[cPosBase + 3],
              interleaved[cPosBase + 4],
              interleaved[cPosBase + 5]
            );

            const n: Triangle = [na, nb, nc];

            this.Mesh.addTriangle(t, n, [0, 0, 0]);
          }
        } else if (
          event.data.meshVertices &&
          event.data.meshNormals &&
          event.data.meshTypes
        ) {
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
        field: this.Field
      });
    });
  }

  getMesh() {
    return this.Mesh;
  }
}
