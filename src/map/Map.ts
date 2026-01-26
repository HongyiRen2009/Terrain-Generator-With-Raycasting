import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { PointLight, DirectionalLight } from "./Light";

import { Color, Terrain, Terrains } from "./terrains";
import { Mesh, Triangle } from "./Mesh";
import { RenderUtils } from "../utils/RenderUtils";
import { WorldObject } from "./WorldObject";
import { meshToInterleavedVerticesAndIndices } from "./cubes_utils";
import { ObjectUI } from "./ObjectUI";
import { LightUI } from "./LightUI";
import { SettingsManager } from "../Settings";

interface ImportMapEntry {
  color: string;
  terrain: Terrain;
}
const directions = [
  vec3.fromValues(1, 0, 0),
  vec3.fromValues(-1, 0, 0),
  vec3.fromValues(0, 1, 0),
  vec3.fromValues(0, -1, 0),
  vec3.fromValues(0, 0, 1),
  vec3.fromValues(0, 0, -1)
];
/**
 * The object holding the map of the world
 * Center chunk starts at 0,0 (probably)
 */
export class WorldMap {

  public onObjectAdded?: (obj: WorldObject) => void;
  public onObjectRemoved?: (id: number) => void;
  //In Chunks
  //Unused for now: placeholders and use them when actually implemented
  private width: number;
  private length: number;

  public sunLight: DirectionalLight = new DirectionalLight(
    vec3.fromValues(0, -1, 0),
    new Color(255, 255, 255),
    4,
    0.1
  );
  public lights: PointLight[] = [];
  public numShadowedLights: number = 5;

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
  public lightUI: LightUI;
  private chunkLoadQueue : { pos: vec3, key: string, then: (() => void) | null }[] = [];
  public isGeneratingChunk : boolean = false;
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
    console.log(this.seed);

    this.gl = gl;
    this.width = width;
    this.length = length;
    this.height = height;
    this.chunks = {};
    this.objectUI = new ObjectUI(this, this.tracerUpdateSupplier);
    this.computeShader = new ComputeShader();
    this.computeShader.init();
    this.lightUI = new LightUI(this, this.tracerUpdateSupplier);
    this.initSettings();
  }

  public initSettings() {
    SettingsManager.instance.createSection(
      document.getElementById("settings-section")!,
      "Sky Settings"
    );
    //Further Sky settings are in the LightingPass Code

    SettingsManager.instance.addSliderToSection("Sky Settings", {
      id: "u_redScatter",
      label: "Red Scattering in the Sky",
      min: 0,
      max: 100,
      step: 0.1,
      defaultValue: 5.5,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Sky Settings", {
      id: "u_greenScatter",
      label: "Green Scattering in the Sky",
      min: 0,
      max: 100,
      step: 0.1,
      defaultValue: 13.0,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Sky Settings", {
      id: "u_blueScatter",
      label: "Blue Scattering in the Sky",
      min: 0,
      max: 100,
      step: 0.1,
      defaultValue: 33.1,
      numType: "float"
    });
  }
  public loadChunk(pos: vec3, then: (() => void) | null = null) {
      if(this.chunkQueueHasKey(`${pos[0]},${pos[1]},${pos[2]}`)){
      return;
    }
    const key = `${pos[0]},${pos[1]},${pos[2]}`;
    
    // Skip if already loaded or queued
    if (this.chunks[key]) return;
    if (this.chunkLoadQueue.some(item => item.key === key)) return;
    
    // Add to queue
    this.chunkLoadQueue.push({ pos, key, then });
  }
  private chunkQueueHasKey(key: string): boolean {
    return this.chunkLoadQueue.some(item => item.key === key);
  }
  public async processChunkQueue(allChunksLoadedCallback: (() => void) | null = null) {
    if (this.isGeneratingChunk || this.chunkLoadQueue.length === 0) {
      return;
    }

    this.isGeneratingChunk = true;
    const { pos, key, then: callback } = this.chunkLoadQueue.shift()!;

    try {
      const chunk = new Chunk(
        pos,
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.seed,
        this,
        callback
      );
      this.chunks[key] = chunk;
      
      // Await the generation
      const { mesh, timings } = await chunk.generate(false);
    } catch (e) {
      console.error(`Failed to generate chunk ${key}:`, e);
      delete this.chunks[key];
    } finally {
      this.isGeneratingChunk = false;
      if(this.chunkLoadQueue.length == 0 && allChunksLoadedCallback){
        allChunksLoadedCallback();
      }
      this.processChunkQueue(allChunksLoadedCallback); // Process next chunk in the queue
      callback?.();

    }
  }

  public async unloadChunk(pos: vec3) {
    const key = `${pos[0]},${pos[1]},${pos[2]}`;
    delete this.chunks[key];
    
    // Remove from queue if it hasn't started generating yet
    this.chunkLoadQueue = this.chunkLoadQueue.filter(item => item.key !== key);
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
  // Replace the combinedMesh() method in Map.ts (around line 183)

  public combinedMesh(): Mesh {
    console.time("combinedMesh generation");
    const CombinedMesh = new Mesh();

    // Count total triangles for pre-allocation logging
    let totalTriangles = 0;
    for (const chunk of Object.values(this.chunks)) {
      totalTriangles += chunk.getMesh().mesh.length;
    }
    for (const obj of this.worldObjects) {
      totalTriangles += obj.mesh.mesh.length;
    }

    // Merge chunks with transformation applied
    for (const chunk of Object.values(this.chunks)) {
      const chunkMesh = chunk.getMesh();
      const transformedChunkMesh = new Mesh();
      
      // Transform each triangle by the chunk position
      for (let i = 0; i < chunkMesh.mesh.length; i++) {
        const tri = chunkMesh.mesh[i];
        const norm = chunkMesh.normals[i];
        
        const newTri: Triangle = [
          vec3.create(),
          vec3.create(),
          vec3.create()
        ];
        const newNorm: Triangle = [
          vec3.create(),
          vec3.create(),
          vec3.create()
        ];
        
        // Apply chunk position offset to vertices
        for (let j = 0; j < 3; j++) {
          vec3.add(newTri[j], tri[j], chunk.ChunkPosition);
          vec3.copy(newNorm[j], norm[j]); // Normals don't need translation
        }
        
        transformedChunkMesh.mesh.push(newTri);
        transformedChunkMesh.normals.push(newNorm);
        transformedChunkMesh.type.push(chunkMesh.type[i]);
      }
      
      CombinedMesh.merge(transformedChunkMesh);
    }

    // Merge worldObjects with transformation applied
    if (this.worldObjects.length > 0) {
      for (let objIdx = 0; objIdx < this.worldObjects.length; objIdx++) {
        const obj = this.worldObjects[objIdx];

        // Create a simple hash of the transform matrix to detect changes
        const transformHash = obj.position.join(",");
        const needsRetransform =
          !obj._cachedTransformedMesh ||
          obj._cachedTransformHash !== transformHash;

        let transformedMesh: Mesh;

        if (needsRetransform) {
          // Transform mesh from scratch
          const meshCopy = obj.mesh;
          const triCount = meshCopy.mesh.length;
          transformedMesh = new Mesh();

          // Process triangles in batches for progress reporting
          const BATCH_SIZE = 50000;

          for (let i = 0; i < triCount; i++) {
            const tri = meshCopy.mesh[i];
            const norm = meshCopy.normals[i];

            // Create new triangle and normal (avoid clone overhead)
            const newTri: Triangle = [
              vec3.create(),
              vec3.create(),
              vec3.create()
            ];
            const newNorm: Triangle = [
              vec3.create(),
              vec3.create(),
              vec3.create()
            ];

            // Apply transformation to all 3 vertices
            for (let j = 0; j < 3; j++) {
              // Transform vertex
              const v = vec4.fromValues(tri[j][0], tri[j][1], tri[j][2], 1);
              vec4.transformMat4(v, v, obj.position);
              vec3.set(newTri[j], v[0], v[1], v[2]);

              // Transform normal (rotation + scale only)
              const n = vec4.fromValues(norm[j][0], norm[j][1], norm[j][2], 0);
              const normalMat = mat4.clone(obj.position);
              normalMat[12] = 0;
              normalMat[13] = 0;
              normalMat[14] = 0;
              vec4.transformMat4(n, n, normalMat);
              vec3.normalize(newNorm[j], vec3.fromValues(n[0], n[1], n[2]));
            }

            // Add transformed triangle directly
            transformedMesh.mesh.push(newTri);
            transformedMesh.normals.push(newNorm);
            transformedMesh.type.push(meshCopy.type[i]);
          }

          // Cache the transformed mesh and transform hash
          obj._cachedTransformedMesh = transformedMesh;
          obj._cachedTransformHash = transformHash;
        } else {
          // Use cached transformed mesh - much faster!
          transformedMesh = obj._cachedTransformedMesh!;
        }

        // Merge transformed mesh into combined mesh
        CombinedMesh.merge(transformedMesh);
      }
    }
    console.timeEnd("combinedMesh generation");
    return CombinedMesh;
  }
  public onLightsChanged?: () => void;

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
  getChunkCoordsFromPosition(position: vec3) {
    const chunkX = Math.floor(position[0] / this.resolution) * this.resolution;
    const chunkY = Math.floor(position[1] / this.height) * this.height;
    const chunkZ = Math.floor(position[2] / this.resolution) * this.resolution;
    return vec3.fromValues(chunkX, chunkY, chunkZ);
  }
  hasChunkAt(chunkPos: vec3): boolean {
    const key = `${chunkPos[0]},${chunkPos[1]},${chunkPos[2]}`;
    return this.chunks[key] !== undefined;
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
  public callback: (() => void) | null = null;
  constructor(
    ChunkPosition: vec3,
    GridSize: vec3,
    seed: number,
    worldMap: WorldMap,
    callback: (() => void) | null = null
  ) {
    this.GridSize = GridSize;
    this.ChunkPosition = ChunkPosition;
    this.seed = seed;
    this.gearObjects = [];
    this.worldMap = worldMap;
    this.callback = callback;
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
    const width = this.GridSize[0] +3;
    const height = this.GridSize[1]+3;
    const depth = this.GridSize[2] +3;
    const fieldBuffer = await computeShader.createSimplexNoise3D(
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
    timings.dedupe = performance.now() - startTime;
    startTime = performance.now();

    // Reconstruct mesh from compute shader results
    this.Mesh = new Mesh();
    
    // Group vertices by triangle (3 vertices per triangle)
    for (let i = 0; i < indices.length; i += 3) {
      const idx0 = indices[i];
      const idx1 = indices[i + 1];
      const idx2 = indices[i + 2];
      // Reject all triangles on edge of chunk to avoid seams

      const tri: Triangle = [
        vec3.fromValues(
          vertices[idx0 * 4], // x
          vertices[idx0 * 4 + 1], // y
          vertices[idx0 * 4 + 2] // z (skip idx0*4+3 which is padding)
        ),
        vec3.fromValues(
          vertices[idx1 * 4],
          vertices[idx1 * 4 + 1],
          vertices[idx1 * 4 + 2]
        ),
        vec3.fromValues(
          vertices[idx2 * 4],
          vertices[idx2 * 4 + 1],
          vertices[idx2 * 4 + 2]
        )
      ];
      let rejectTriangle = false;
      for(let j=0;j<3;j++){
        if(
          tri[j][0] <= 0 ||
          tri[j][0] >= width-1 ||
          tri[j][1] <= 0 ||
          tri[j][1] >= height-1 ||
          tri[j][2] <= 0 ||
          tri[j][2] >= depth-1
        ){
          rejectTriangle = true;
          break;
        }
      }
      if(rejectTriangle){
        continue;
      }
      const norm: Triangle = [
        vec3.fromValues(
          normals[idx0 * 4],
          normals[idx0 * 4 + 1],
          normals[idx0 * 4 + 2]
        ),
        vec3.fromValues(
          normals[idx1 * 4],
          normals[idx1 * 4 + 1],
          normals[idx1 * 4 + 2]
        ),
        vec3.fromValues(
          normals[idx2 * 4],
          normals[idx2 * 4 + 1],
          normals[idx2 * 4 + 2]
        )
      ];

      const types: [number, number, number] = [
        terrainTypes[idx0],
        terrainTypes[idx1],
        terrainTypes[idx2]
      ];

      this.Mesh.addTriangle(tri, norm, types);
    }
    timings.meshConstruction = performance.now() - startTime;

    startTime = performance.now();
    // Generate edge triangles on CPU
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
