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
  public resolution = 32; //#of vertices square size of chunk
  public chunks: { [key: string]: Chunk } = {};
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
    this.objectUI = new ObjectUI(this, this.tracerUpdateSupplier);
    this.computeShader = new ComputeShader();
    this.computeShader.init();
  }

  //Generates map
  public async generate() {
    this.chunks = {};

    // Step 1: Prepare chunk positions and grid sizes
    const chunkParams: {
      pos: vec3;
      grid: vec3;
      seed: number;
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
          });
        }
      }
    }

    // Collect timings for all chunks
    const allTimings: {
      noise: number;
      fieldReadback: number;
      marchingCubes: number;
      vertexBufferReadback: number;
      indexBufferReadback: number;
      normalsBufferReadback: number;
      terrainTypeBufferReadback: number;
      dedupe: number;
      meshConstruction: number;
      edgeTriangles: number;
      total: number;
    }[] = [];

    for (const chunkParam of chunkParams) {
      const chunk = new Chunk(
        chunkParam.pos,
        chunkParam.grid,
        chunkParam.seed,
        this
      );
      const key = `${chunkParam.pos[0]},${chunkParam.pos[1]},${chunkParam.pos[2]}`;
      this.chunks[key] = chunk;
      const { mesh, timings } = await chunk.generate(false);
      allTimings.push(timings);
    }

    // Average timings
    if (allTimings.length > 0) {
      const avg = (key: keyof (typeof allTimings)[0]) =>
        allTimings.reduce((sum, t) => sum + t[key], 0) / allTimings.length;
      console.log(
        `[Chunk Generation Timings] avg noise: ${avg("noise").toFixed(
          2
        )} ms, fieldReadback: ${avg("fieldReadback").toFixed(
          2
        )} ms, marchingCubes: ${avg("marchingCubes").toFixed(
          2
        )} ms, vertexBufferReadback: ${avg("vertexBufferReadback").toFixed(
          2
        )} ms, indexBufferReadback: ${avg("indexBufferReadback").toFixed(
          2
        )} ms, normalsBufferReadback: ${avg("normalsBufferReadback").toFixed(
          2
        )} ms, terrainTypeBufferReadback: ${avg(
          "terrainTypeBufferReadback"
        ).toFixed(2)} ms, dedupe: ${avg("dedupe").toFixed(2)}
         ms, meshConstruction: ${avg("meshConstruction").toFixed(
           2
         )} ms, edgeTriangles: ${avg("edgeTriangles").toFixed(
           2
         )} ms, total: ${avg("total").toFixed(2)} ms`
      );
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
  Mesh: Mesh = null!;
  gearObjects: vec3[];
  worldMap: WorldMap;

  constructor(
    ChunkPosition: vec3,
    GridSize: vec3,
    seed: number,
    worldMap: WorldMap
  ) {
    this.GridSize = GridSize;
    this.ChunkPosition = ChunkPosition;
    this.seed = seed;
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
        if (worldY <= WATER_LEVEL + 0.5) {
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
        if (slope > 0.8 || upDot < 0.4) {
          types[i] = 2; // rock
          continue;
        }

        // Grassland otherwise
        types[i] = 0; // grass
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
  private deduplicateVertices(
    vertices: Float32Array,
    normals: Float32Array,
    terrainTypes: Uint32Array,
    indices: Uint32Array
  ): {
    vertices: Float32Array;
    normals: Float32Array;
    terrainTypes: Uint32Array;
    indices: Uint32Array;
  } {
    const vertexMap = new Map<string, number>();
    const newVertices: number[] = [];
    const newNormals: number[] = [];
    const newTerrainTypes: number[] = [];
    const remap = new Map<number, number>();
    let uniqueIndex = 0;

    for (let i = 0; i < vertices.length; i += 4) {
      const key = `${vertices[i].toFixed(5)},${vertices[i + 1].toFixed(5)},${vertices[i + 2].toFixed(5)}`;
      if (!vertexMap.has(key)) {
        vertexMap.set(key, uniqueIndex);
        remap.set(i / 4, uniqueIndex);
        // Add unique vertex, normal, terrainType
        newVertices.push(
          vertices[i],
          vertices[i + 1],
          vertices[i + 2],
          vertices[i + 3]
        );
        newNormals.push(
          normals[i],
          normals[i + 1],
          normals[i + 2],
          normals[i + 3]
        );
        newTerrainTypes.push(terrainTypes[i / 4]);
        uniqueIndex++;
      }
      remap.set(i / 4, vertexMap.get(key)!);
    }

    const newIndices = new Uint32Array(indices.length);
    for (let i = 0; i < indices.length; i++) {
      newIndices[i] = remap.get(indices[i])!;
    }

    return {
      vertices: new Float32Array(newVertices),
      normals: new Float32Array(newNormals),
      terrainTypes: new Uint32Array(newTerrainTypes),
      indices: newIndices
    };
  }
  /**
   *
   * Generates the chunk's mesh using the compute shader, must be called sequentially to avoid two chunks using the same shader at once
   * @param logPerformance Whether to log performance metrics
   * @returns The generated mesh and timing information
   */
  async generate(logPerformance = true): Promise<{
    mesh: Mesh;
    timings: {
      noise: number;
      fieldReadback: number;
      marchingCubes: number;
      vertexBufferReadback: number;
      indexBufferReadback: number;
      normalsBufferReadback: number;
      terrainTypeBufferReadback: number;
      dedupe: number;
      meshConstruction: number;
      edgeTriangles: number;
      total: number;
    };
  }> {
    const timings: any = {};
    let totalStart = performance.now();

    // Generate field using compute shader
    let startTime = performance.now();
    const computeShader = this.worldMap.computeShader;
    const width = this.GridSize[0] + 1;
    const height = this.GridSize[1] + 1;
    const depth = this.GridSize[2] + 1;
    const fieldBuffer = await computeShader.createPerlinNoise3D(
      width,
      height,
      depth,
      this.seed,
      this.ChunkPosition[0],
      this.ChunkPosition[1],
      this.ChunkPosition[2]
    );
    timings.noise = performance.now() - startTime;

    startTime = performance.now();
    this.Field = await computeShader.readFieldBuffer(
      fieldBuffer,
      width,
      height,
      depth
    );
    timings.fieldReadback = performance.now() - startTime;

    startTime = performance.now();
    const {
      vertexBuffer,
      indexBuffer,
      normalsBuffer,
      terrainTypeBuffer,
      vertexCount,
      indexCount
    } = await computeShader.createMarchingCubes(
      fieldBuffer,
      width,
      height,
      depth
    );
    timings.marchingCubes = performance.now() - startTime;

    startTime = performance.now();
    const vertices = await computeShader.readVectorBuffer(
      vertexBuffer,
      vertexCount * 4 // 4 floats per vec3 (due to padding)
    );
    timings.vertexBufferReadback = performance.now() - startTime;

    startTime = performance.now();
    const indices = await computeShader.readUintBuffer(indexBuffer, indexCount);
    timings.indexBufferReadback = performance.now() - startTime;

    startTime = performance.now();
    const normals = await computeShader.readVectorBuffer(
      normalsBuffer,
      vertexCount * 4 // 4 floats per vec3 (due to padding)
    );
    timings.normalsBufferReadback = performance.now() - startTime;

    startTime = performance.now();
    const terrainTypes = await computeShader.readUintBuffer(
      terrainTypeBuffer,
      vertexCount
    );
    timings.terrainTypeBufferReadback = performance.now() - startTime;
    startTime = performance.now();
    // Deduplicate vertices
    const {
      vertices: dedupedVertices,
      normals: dedupedNormals,
      terrainTypes: dedupedTerrainTypes,
      indices: dedupedIndices
    } = this.deduplicateVertices(vertices, normals, terrainTypes, indices);
    timings.dedupe = performance.now() - startTime;
    startTime = performance.now();

    // Reconstruct mesh from compute shader results
    this.Mesh = new Mesh();

    // Group vertices by triangle (3 vertices per triangle)
    for (let i = 0; i < dedupedIndices.length; i += 3) {
      const idx0 = dedupedIndices[i];
      const idx1 = dedupedIndices[i + 1];
      const idx2 = dedupedIndices[i + 2];

      const tri: Triangle = [
        vec3.fromValues(
          dedupedVertices[idx0 * 4], // x
          dedupedVertices[idx0 * 4 + 1], // y
          dedupedVertices[idx0 * 4 + 2] // z (skip idx0*4+3 which is padding)
        ),
        vec3.fromValues(
          dedupedVertices[idx1 * 4],
          dedupedVertices[idx1 * 4 + 1],
          dedupedVertices[idx1 * 4 + 2]
        ),
        vec3.fromValues(
          dedupedVertices[idx2 * 4],
          dedupedVertices[idx2 * 4 + 1],
          dedupedVertices[idx2 * 4 + 2]
        )
      ];

      const norm: Triangle = [
        vec3.fromValues(
          dedupedNormals[idx0 * 4],
          dedupedNormals[idx0 * 4 + 1],
          dedupedNormals[idx0 * 4 + 2]
        ),
        vec3.fromValues(
          dedupedNormals[idx1 * 4],
          dedupedNormals[idx1 * 4 + 1],
          dedupedNormals[idx1 * 4 + 2]
        ),
        vec3.fromValues(
          dedupedNormals[idx2 * 4],
          dedupedNormals[idx2 * 4 + 1],
          dedupedNormals[idx2 * 4 + 2]
        )
      ];

      const types: [number, number, number] = [
        dedupedTerrainTypes[idx0],
        dedupedTerrainTypes[idx1],
        dedupedTerrainTypes[idx2]
      ];

      this.Mesh.addTriangle(tri, norm, types);
    }
    timings.meshConstruction = performance.now() - startTime;

    startTime = performance.now();
    // Generate edge triangles on CPU
    this.generateEdgeTriangles();
    timings.edgeTriangles = performance.now() - startTime;

    timings.total = performance.now() - totalStart;

    if (logPerformance) {
      // Logging is now handled outside, after averaging
    }

    return { mesh: this.Mesh, timings };
  }
  getMesh() {
    return this.Mesh;
  }
}
