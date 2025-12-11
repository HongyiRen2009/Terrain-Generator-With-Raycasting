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
  public computeShader: ComputeShader;
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
    this.objectUI = new ObjectUI(this, this.tracerUpdateSupplier);
    this.computeShader = new ComputeShader();
    this.computeShader.init();
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
  public async generate() {
    this.chunks = {};
    let worker = 0;

    // Step 1: Prepare chunk positions and grid sizes
    const chunkParams: {
      pos: vec3;
      grid: vec3;
      seed: number;
      worker: Worker;
    }[] = [];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        for (let k = 0; k < 1; k++) {
          const chunkPos = vec3.fromValues(
            i * this.resolution,
            k * this.height,
            j * this.resolution
          );
          chunkParams.push({
            pos: chunkPos,
            grid: vec3.fromValues(
              this.resolution,
              this.height,
              this.resolution
            ),
            seed: this.seed,
            worker: this.Workers[worker++ % navigator.hardwareConcurrency]
          });
        }
      }
    }

    // Step 2: Generate field arrays sequentially using the compute shader
    const fieldArrays: Float32Array[] = [];
    for (const params of chunkParams) {
      const width = params.grid[0] + 1;
      const height = params.grid[1] + 1;
      const depth = params.grid[2] + 1;
      const fieldBuffer = await this.computeShader.createPerlinNoise3D(
        width,
        height,
        depth,
        params.seed,
        params.pos[0],
        params.pos[1],
        params.pos[2]
      );
      const fieldArray = await this.computeShader.readFieldBuffer(
        fieldBuffer,
        width,
        height,
        depth
      );
      for (let i = 0; i < fieldArray.length; i++) {
        fieldArray[i] = fieldArray[i] * 0.5 + 0.5; // Normalize to [0,1]
      }
      fieldArrays.push(fieldArray);
    }

    // Step 3: Create chunks and pass field arrays to them
    let idx = 0;
    for (const params of chunkParams) {
      const key = `${params.pos[0]},${params.pos[1]},${params.pos[2]}`;
      this.chunks[key] = new Chunk(
        params.pos,
        params.grid,
        params.seed,
        params.worker,
        this
      );
      // Assign the field array directly
      this.chunks[key].Field = fieldArrays[idx++];
    }
    // Step 4: Generate meshes using the precomputed field arrays
    const generationPromises: Promise<Mesh>[] = [];
    for (const chunkKey in this.chunks) {
      const chunk = this.chunks[chunkKey];
      generationPromises.push(chunk.generate());
    }
    await Promise.all(generationPromises);
    for (const chunk of Object.values(this.chunks)) {
      chunk.generateEdgeTriangles();
    }
  }

  public getChunkAt(
    chunkX: number,
    chunkY: number,
    chunkZ: number
  ): Chunk | undefined {
    return this.chunks[`${chunkX},${chunkY},${chunkZ}`];
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
    const chunkY = Math.floor(worldY / this.height) * this.height;
    const chunkZ = Math.floor(worldZ / this.resolution) * this.resolution;

    const chunk = this.getChunkAt(chunkX, chunkY, chunkZ);
    if (!chunk) return 0;

    // Convert world coordinates to local chunk coordinates
    const localX = worldX - chunkX;
    const localY = worldY - chunkY;
    const localZ = worldZ - chunkZ;
    return chunk.getFieldValueLocal(localX, localY, localZ);
  }
}

import { CASES, EDGES, VERTICES } from "./geometry";
import { ComputeShader } from "./WebGPU compute";

export class Chunk {
  ChunkPosition: vec3;
  GridSize: vec3;
  Field: Float32Array = new Float32Array();
  seed: number;
  Worker: Worker;
  Mesh: Mesh = null!;
  gearObjects: vec3[];
  worldMap: WorldMap;

  static computeShader: ComputeShader | null = null;

  constructor(
    ChunkPosition: vec3,
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

  getFieldValueLocal(localX: number, localY: number, localZ: number): number {
    if (
      localX < 0 ||
      localX > this.GridSize[0] ||
      localY < 0 ||
      localY > this.GridSize[1] ||
      localZ < 0 ||
      localZ > this.GridSize[2]
    ) {
      return -1;
    }
    const idx = this.chunkCoordinateToIndex(
      vec3.fromValues(localX, localY, localZ)
    );
    if (idx < 0 || idx >= this.Field.length) {
      return -1;
    }
    return this.Field[idx];
  }

  getFieldValue(localX: number, localY: number, localZ: number): number {
    const localValue = this.getFieldValueLocal(localX, localY, localZ);
    if (localValue !== -1) {
      return localValue;
    }
    const worldX = localX + this.ChunkPosition[0];
    const worldY = localY + this.ChunkPosition[1];
    const worldZ = localZ + this.ChunkPosition[2];

    return this.worldMap.getFieldValue(worldX, worldY, worldZ);
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
      // Simple deterministic hash for small per-vertex variation
      function hash01(x: number, z: number) {
        // stable pseudo-random in [0,1)
        return Math.abs(Math.sin(x * 127.1 + z * 311.7) * 43758.5453) % 1;
      }
      const WATER_LEVEL = 30;
      const SNOW_LINE = 140;
      // Determine a terrain type per vertex based on height and slope
      const types: [number, number, number] = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        const p = vertices[i].position;
        const n = vertices[i].normal;
        const worldY = p[1];
        const upDot = Math.max(-1, Math.min(1, n[1]));
        const slope = 1 - Math.abs(upDot); // 0 = flat, higher = steeper

        // Water
        if (worldY <= WATER_LEVEL - 0.2) {
          types[i] = 4; // water
          continue;
        }

        // Beaches near water (gentle slope and low height)
        if (worldY < WATER_LEVEL + 3 && slope < 0.45) {
          types[i] = 5; // sand
          continue;
        }

        // Snow on high altitudes
        if (worldY > SNOW_LINE) {
          types[i] = 3; // snow
          continue;
        }

        // Cliffs / exposed rock on steep slopes
        if (slope > 0.6 || upDot < 0.4) {
          types[i] = 2; // rock
          continue;
        }

        // Mix grass and dirt based on small deterministic noise and height
        const nval = hash01(p[0] + c[0], p[2] + c[2]);
        if (worldY < 65 && nval > 0.15)
          types[i] = 0; // grass
        else if (worldY < 80 && nval > 0.35) types[i] = 0;
        else types[i] = 1; // dirt
      }
      caseMesh.addTriangle(
        vertices.map((v) => v.position) as Triangle,
        vertices.map((v) => v.normal) as Triangle,
        types
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

  // Single pass generation: terrain field + mesh
  async generate(): Promise<Mesh> {
    // Generate the field using the compute shader
    const width = this.GridSize[0] + 1;
    const height = this.GridSize[1] + 1;
    const depth = this.GridSize[2] + 1;

    // Now pass the fieldArray to the worker
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36).slice(2);
      const handler = (
        event: MessageEvent<{
          requestId?: string;
          field?: Float32Array;
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

        // Store field data
        if (event.data.field) {
          this.Field = event.data.field;
        }

        // Reconstruct mesh from worker data
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
      this.Worker.postMessage(
        {
          requestId,
          GridSize: this.GridSize,
          ChunkPosition: this.ChunkPosition,
          Seed: this.seed,
          field: this.Field // <-- pass the field array
        },
        [this.Field.buffer]
      );
    });
  }

  getMesh() {
    return this.Mesh;
  }
}
