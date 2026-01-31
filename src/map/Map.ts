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
/**
 * The object holding the map of the world
 * Center chunk starts at 0,0 (probably)
 */
type Timing = {
  noise: number;
  fieldReadback: number;
  marchingCubes: number;
  vertexBufferReadback: number;
  indexBufferReadback: number;
  meshConstruction: number;
  total: number;
};
const MAX_CHUNKS_PER_STRIP_TOTAL = 16; // e.g., 4x4, but flexible


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
  public seed: number = 42; // Random seed for noise generation

  public worldObjects: WorldObject[] = [];
  gl: WebGL2RenderingContext;

  private nextWorldObjectId: number = 0;

  private tracerUpdateSupplier: () => () => void;
  private TotalTimings: Timing;
  private chunksGenerated: number = 0;
  public objectUI: ObjectUI;
  public computeShader: ComputeShader;
  public lightUI: LightUI;
  private chunkLoadQueue: { pos: vec3, key: string, then: ((chunk: Chunk) => void) | null }[] = [];
  private chunkStripQueue: { 
    startPos: vec3, 
    lengthInChunks: number, 
    widthInChunks: number, 
    then: ((chunk: Chunk) => void) | null,
    allChunksLoadedCallback: (() => void) | null 
  }[] = [];
  public isGeneratingChunk: boolean = false;
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
    this.TotalTimings = {
      noise: 0,
      fieldReadback: 0,
      marchingCubes: 0,
      vertexBufferReadback: 0,
      indexBufferReadback: 0,
      meshConstruction: 0,
      total: 0
    };
    this.chunksGenerated = 0;
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
      max: 0.5,
      step: 0.001,
      defaultValue: 0.005,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Sky Settings", {
      id: "u_greenScatter",
      label: "Green Scattering in the Sky",
      min: 0,
      max: 0.5,
      step: 0.001,
      defaultValue: 0.011,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Sky Settings", {
      id: "u_blueScatter",
      label: "Blue Scattering in the Sky",
      min: 0,
      max: 0.5,
      step: 0.001,
      defaultValue: 0.022,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Sky Settings",{
      id: "u_MIE",
      label: "Mie (whiteness at sea level)",
      min: 0,
      max: 0.5,
      step: 0.001,
      defaultValue: 0.021,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Sky Settings",{
      id: "u_haloSize",
      label: "Mie Anisotropy (Lower = larger halo)",
      min: 0,
      max: 5,
      step: 0.01,
      defaultValue: 0.76,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Sky Settings",{
      id: "u_skyGradientQuality",
      label: "Sky Gradient Quality",
      min: 1,
      max: 50,
      step: 1,
      defaultValue: 12,
      numType: "int"
    });

    SettingsManager.instance.addSliderToSection("Sky Settings",{
      id: "u_sunsetQuality",
      label: "Sunset Quality",
      min: 1,
      max: 50,
      step: 1,
      defaultValue: 4,
      numType: "int"
    });

    SettingsManager.instance.addSliderToSection("Sky Settings",{
      id: "u_skyBrightnessBoost",
      label: "Sky Brighness Coefficient",
      min: 0,
      max: 10,
      step: 0.01,
      defaultValue: 1.0,
      numType: "float"
    });


  }
  public loadChunk(pos: vec3, then: ((chunk: Chunk) => void) | null = null) {
    if (this.chunkQueueHasKey(`${pos[0]},${pos[1]},${pos[2]}`)) {
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


private computeOptimalSubStripSize(
  lengthInChunks: number,
  widthInChunks: number,
  maxArea: number
): { tileX: number; tileZ: number } {
  let bestTileX = 1;
  let bestTileZ = Math.max(1, Math.min(widthInChunks, maxArea));
  let bestCalls = Number.POSITIVE_INFINITY;
  let bestArea = bestTileX * bestTileZ;

  const maxX = Math.min(lengthInChunks, maxArea);
  for (let tx = 1; tx <= maxX; tx++) {
    const tzCandidate = Math.floor(maxArea / tx);
    if (tzCandidate < 1) continue;

    const tz = Math.min(widthInChunks, tzCandidate);
    const calls = Math.ceil(lengthInChunks / tx) * Math.ceil(widthInChunks / tz);
    const area = tx * tz;

    // Prefer fewer calls; break ties by larger area
    if (calls < bestCalls || (calls === bestCalls && area > bestArea)) {
      bestCalls = calls;
      bestArea = area;
      bestTileX = tx;
      bestTileZ = tz;
    }
  }

  return { tileX: bestTileX, tileZ: bestTileZ };
}

// ...existing code...

public loadChunkStrip(
  startPos: vec3, 
  lengthInChunks: number, 
  widthInChunks: number, 
  then: ((chunk: Chunk) => void) | null = null,
  allChunksLoadedCallback: (() => void) | null = null
) {
  // Pick optimal tile size to minimize number of calls for this region
  const { tileX, tileZ } = this.computeOptimalSubStripSize(
    lengthInChunks,
    widthInChunks,
    MAX_CHUNKS_PER_STRIP_TOTAL
  );

  for (let baseX = 0; baseX < lengthInChunks; baseX += tileX) {
    for (let baseZ = 0; baseZ < widthInChunks; baseZ += tileZ) {
      const subStripX = Math.min(tileX, lengthInChunks - baseX);
      const subStripZ = Math.min(tileZ, widthInChunks - baseZ);

      const subStripStart = vec3.fromValues(
        startPos[0] + baseX * this.resolution,
        startPos[1],
        startPos[2] + baseZ * this.resolution
      );

      // Overlap check
      let hasOverlap = false;
      for (let cx = 0; cx < subStripX && !hasOverlap; cx++) {
        for (let cz = 0; cz < subStripZ; cz++) {
          const chunkWorldX = subStripStart[0] + cx * this.resolution;
          const chunkWorldZ = subStripStart[2] + cz * this.resolution;
          const key = `${chunkWorldX},${subStripStart[1]},${chunkWorldZ}`;
          if (this.chunks[key] || this.chunkQueueHasKey(key)) {
            hasOverlap = true;
            break;
          }
        }
      }

      if (hasOverlap) {
        // Fallback to individual chunk loading for overlapping region
        for (let cx = 0; cx < subStripX; cx++) {
          for (let cz = 0; cz < subStripZ; cz++) {
            const chunkPos = vec3.fromValues(
              subStripStart[0] + cx * this.resolution,
              subStripStart[1],
              subStripStart[2] + cz * this.resolution
            );
            this.loadChunk(chunkPos, then);
          }
        }
      } else {
        // Queue the sub-strip
        this.chunkStripQueue.push({
          startPos: subStripStart,
          lengthInChunks: subStripX,
          widthInChunks: subStripZ,
          then,
          allChunksLoadedCallback
        });
      }
    }
  }
}

/**
 * Processes both the chunk strip queue and the individual chunk queue asynchronously.
 * Prioritizes strip queue for efficiency.
 */
public async processChunkQueue(allChunksLoadedCallback: (() => void) | null = null) {
  if (this.isGeneratingChunk) return;

  // Process strip queue first (more efficient)
  if (this.chunkStripQueue.length > 0) {
    this.isGeneratingChunk = true;
    const { startPos, lengthInChunks, widthInChunks, then, allChunksLoadedCallback: stripCallback } = this.chunkStripQueue.shift()!;

    try {
      await this.generateChunkStrip(startPos, lengthInChunks, widthInChunks, then);
      if (stripCallback) stripCallback();
    } catch (e) {
      console.error(`Failed to generate chunk strip at ${startPos}:`, e);
    } finally {
      this.isGeneratingChunk = false;
      // Continue processing queues
      this.processChunkQueue();
    }
    return;
  }

  // Fall back to individual chunk processing
  if (this.chunkLoadQueue.length > 0) {
    this.isGeneratingChunk = true;
    const { pos, key, then: callback } = this.chunkLoadQueue.shift()!;

    try {
      const chunk = new Chunk(
        pos,
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.seed,
        this
      );
      this.chunks[key] = chunk;

      // Await the generation
      const { mesh, timings } = await chunk.generate();
      this.addTimings(timings);
      this.chunksGenerated++;
      if (callback) callback(this.chunks[key]);
    } catch (e) {
      console.error(`Failed to generate chunk ${key}:`, e);
      delete this.chunks[key];
    } finally {
      this.isGeneratingChunk = false;
      if (this.chunkLoadQueue.length == 0) {
        this.logTiming();
        this.logTiming(true);
        if (allChunksLoadedCallback) {
          allChunksLoadedCallback();
        }
      }
      this.processChunkQueue(allChunksLoadedCallback); // Process next in the queue
    }
    return;
  }
}

/**
 * Generates a strip of chunks by creating a single large mesh and partitioning it.
 * @param chunkStartPos Starting position in chunk coordinates (vec3) of the strip
 * @param numberOfChunksX Number of chunks along X
 * @param widthInChunks Number of chunks along Z
 * @param then Optional callback after all chunks are generated
 */
private async generateChunkStrip(
  chunkStartPos: vec3,
  numberOfChunksX: number,
  numberOfChunksZ: number,
  then: ((chunk: Chunk) => void) | null = null
) {
  // Calculate total grid size for the strip
  const totalWidth = numberOfChunksX * this.resolution;
  const totalDepth = numberOfChunksZ * this.resolution;
  const gridSize = vec3.fromValues(totalWidth, this.height, totalDepth);

  // Call compute shader ONCE for the whole strip
  const computeShader = this.computeShader;
  const width = gridSize[0] + 3;
  const height = gridSize[1] + 3;
  const depth = gridSize[2] + 3;
  
  // Generate field and mesh for the entire strip
  const fieldBuffer = await computeShader.createSimplexNoise3D(
    width, height, depth, this.seed,
    chunkStartPos[0], chunkStartPos[1], chunkStartPos[2]
  );
  const interleavedResult = await computeShader.createMarchingCubes(
    fieldBuffer, width, height, depth
  );
  const interleavedData = await computeShader.readInterleavedBuffer(
    interleavedResult.interleavedBuffer, interleavedResult.vertexCount
  );
  const indices = await computeShader.readUintBuffer(
    interleavedResult.indexBuffer, interleavedResult.indexCount
  );

  // Partition triangles into chunks
  const chunkMeshes: { [key: string]: Mesh } = {};
  
  // Create chunk meshes using chunk indices (0,1,2...) not world positions
  for (let cx = 0; cx < numberOfChunksX; cx++) {
    for (let cz = 0; cz < numberOfChunksZ; cz++) {
      const chunkWorldX = chunkStartPos[0] + cx * this.resolution;
      const chunkWorldY = chunkStartPos[1];
      const chunkWorldZ = chunkStartPos[2] + cz * this.resolution;
      const key = `${chunkWorldX},${chunkWorldY},${chunkWorldZ}`;
      chunkMeshes[key] = new Mesh();
    }
  }

  // Assign triangles to the correct chunk mesh
  for (let i = 0; i < indices.length; i += 3) {
    const idx0 = indices[i];
    const idx1 = indices[i + 1];
    const idx2 = indices[i + 2];

    const offset0 = idx0 * 8;
    const offset1 = idx1 * 8;
    const offset2 = idx2 * 8;

    // Get positions in strip-local space (0 to totalWidth/totalDepth)
    const tri: Triangle = [
      vec3.fromValues(interleavedData[offset0], interleavedData[offset0 + 1], interleavedData[offset0 + 2]),
      vec3.fromValues(interleavedData[offset1], interleavedData[offset1 + 1], interleavedData[offset1 + 2]),
      vec3.fromValues(interleavedData[offset2], interleavedData[offset2 + 1], interleavedData[offset2 + 2])
    ];

    // Skip edge triangles to avoid seams (same logic as single chunk generation)
    let rejectTriangle = false;
    for (let j = 0; j < 3; j++) {
      if (
        tri[j][0] <= 0 ||
        tri[j][0] >= width - 1 ||
        tri[j][1] <= 0 ||
        tri[j][1] >= height - 1 ||
        tri[j][2] <= 0 ||
        tri[j][2] >= depth - 1
      ) {
        rejectTriangle = true;
        break;
      }
    }
    if (rejectTriangle) {
      continue;
    }

    // Determine which chunk this triangle belongs to based on first vertex
    // The vertex position is in strip-local space, so divide by resolution to get chunk index
    const localX = tri[0][0];
    const localZ = tri[0][2];
    
    // Calculate chunk indices within the strip (0, 1, 2, ...)
    const chunkIdxX = Math.floor(localX / this.resolution);
    const chunkIdxZ = Math.floor(localZ / this.resolution);
    
    // Clamp to valid chunk indices
    const clampedChunkIdxX = Math.max(0, Math.min(numberOfChunksX - 1, chunkIdxX));
    const clampedChunkIdxZ = Math.max(0, Math.min(numberOfChunksZ - 1, chunkIdxZ));
    
    // Calculate world chunk position
    const chunkWorldX = chunkStartPos[0] + clampedChunkIdxX * this.resolution;
    const chunkWorldY = chunkStartPos[1];
    const chunkWorldZ = chunkStartPos[2] + clampedChunkIdxZ * this.resolution;
    
    const key = `${chunkWorldX},${chunkWorldY},${chunkWorldZ}`;
    const mesh = chunkMeshes[key];
    if (!mesh) continue;

    // Convert to chunk-local coordinates by subtracting the chunk's offset within the strip
    const chunkOffsetX = clampedChunkIdxX * this.resolution;
    const chunkOffsetZ = clampedChunkIdxZ * this.resolution;
    
    const localTri: Triangle = [
      vec3.fromValues(tri[0][0] - chunkOffsetX, tri[0][1], tri[0][2] - chunkOffsetZ),
      vec3.fromValues(tri[1][0] - chunkOffsetX, tri[1][1], tri[1][2] - chunkOffsetZ),
      vec3.fromValues(tri[2][0] - chunkOffsetX, tri[2][1], tri[2][2] - chunkOffsetZ)
    ];

    const norm: Triangle = [
      vec3.fromValues(interleavedData[offset0 + 4], interleavedData[offset0 + 5], interleavedData[offset0 + 6]),
      vec3.fromValues(interleavedData[offset1 + 4], interleavedData[offset1 + 5], interleavedData[offset1 + 6]),
      vec3.fromValues(interleavedData[offset2 + 4], interleavedData[offset2 + 5], interleavedData[offset2 + 6])
    ];

    const types: [number, number, number] = [
      new Uint32Array(new Float32Array([interleavedData[offset0 + 3]]).buffer)[0],
      new Uint32Array(new Float32Array([interleavedData[offset1 + 3]]).buffer)[0],
      new Uint32Array(new Float32Array([interleavedData[offset2 + 3]]).buffer)[0]
    ];

    mesh.addTriangle(localTri, norm, types);
  }

  // Create Chunk objects and assign meshes
  for (let cx = 0; cx < numberOfChunksX; cx++) {
    for (let cz = 0; cz < numberOfChunksZ; cz++) {
      const chunkWorldX = chunkStartPos[0] + cx * this.resolution;
      const chunkWorldY = chunkStartPos[1];
      const chunkWorldZ = chunkStartPos[2] + cz * this.resolution;
      const chunkPos = vec3.fromValues(chunkWorldX, chunkWorldY, chunkWorldZ);
      const key = `${chunkWorldX},${chunkWorldY},${chunkWorldZ}`;
      
      const chunk = new Chunk(
        chunkPos,
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.seed,
        this
      );
      chunk.Mesh = chunkMeshes[key];
      this.chunks[key] = chunk;
      
      if (then) {
        then(chunk);
      }
    }
  }
}

  private logTiming(average = false) {
    const timings = average ? this.averageTimings() : this.TotalTimings;
    if (average) {
      console.log("Average Chunk Generation Timings (ms):");
    } else {
      console.log("Total Chunk Generation Timings (ms):");
    }
    console.log(`  Noise Generation: ${timings.noise.toFixed(2)}`);
    console.log(`  Field Readback: ${timings.fieldReadback.toFixed(2)}`);
    console.log(`  Marching Cubes: ${timings.marchingCubes.toFixed(2)}`);
    console.log(`  Vertex Buffer Readback: ${timings.vertexBufferReadback.toFixed(2)}`);
    console.log(`  Index Buffer Readback: ${timings.indexBufferReadback.toFixed(2)}`);
    console.log(`  Mesh Construction: ${timings.meshConstruction.toFixed(2)}`);
    console.log(`  Total Time: ${timings.total.toFixed(2)}`);
  }
  private addTimings(timings: Timing) {
    this.TotalTimings.noise += timings.noise;
    this.TotalTimings.fieldReadback += timings.fieldReadback;
    this.TotalTimings.marchingCubes += timings.marchingCubes;
    this.TotalTimings.vertexBufferReadback += timings.vertexBufferReadback;
    this.TotalTimings.indexBufferReadback += timings.indexBufferReadback;
    this.TotalTimings.meshConstruction += timings.meshConstruction;
    this.TotalTimings.total += timings.total;
  }
  private averageTimings(): Timing {
    const count = this.chunksGenerated || 1;
    return {
      noise: this.TotalTimings.noise / count,
      fieldReadback: this.TotalTimings.fieldReadback / count,
      marchingCubes: this.TotalTimings.marchingCubes / count,
      vertexBufferReadback: this.TotalTimings.vertexBufferReadback / count,
      indexBufferReadback: this.TotalTimings.indexBufferReadback / count,
      meshConstruction: this.TotalTimings.meshConstruction / count,
      total: this.TotalTimings.total / count
    };
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
  constructor(
    ChunkPosition: vec3,
    GridSize: vec3,
    seed: number,
    worldMap: WorldMap,
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
async generate(): Promise<{
    mesh: Mesh;
    timings: Timing;
  }> {
    const timings: Timing = {
      noise: 0,
      fieldReadback: 0,
      marchingCubes: 0,
      vertexBufferReadback: 0,
      indexBufferReadback: 0,
      meshConstruction: 0,
      total: 0
    };
    let totalStart = performance.now();

    // Generate field using compute shader
    let startTime = performance.now();
    const computeShader = this.worldMap.computeShader;
    const width = this.GridSize[0] + 3;
    const height = this.GridSize[1] + 3;
    const depth = this.GridSize[2] + 3;
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
      interleavedBuffer,
      indexBuffer,
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
    const interleavedData = await computeShader.readInterleavedBuffer(
      interleavedBuffer,
      vertexCount
    );
    timings.vertexBufferReadback = performance.now() - startTime;

    startTime = performance.now();
    const indices = await computeShader.readUintBuffer(indexBuffer, indexCount);
    timings.indexBufferReadback = performance.now() - startTime;

    // Reconstruct mesh from compute shader results
    startTime = performance.now();
    this.Mesh = new Mesh();

    for (let i = 0; i < indices.length; i += 3) {
      const idx0 = indices[i];
      const idx1 = indices[i + 1];
      const idx2 = indices[i + 2];

      // Calculate offsets in the interleaved buffer (8 floats per vertex)
      const offset0 = idx0 * 8;
      const offset1 = idx1 * 8;
      const offset2 = idx2 * 8;

      const tri: Triangle = [
        vec3.fromValues(
          interleavedData[offset0],     // position.x
          interleavedData[offset0 + 1], // position.y
          interleavedData[offset0 + 2]  // position.z
        ),
        vec3.fromValues(
          interleavedData[offset1],
          interleavedData[offset1 + 1],
          interleavedData[offset1 + 2]
        ),
        vec3.fromValues(
          interleavedData[offset2],
          interleavedData[offset2 + 1],
          interleavedData[offset2 + 2]
        )
      ];

      // Reject all triangles on edge of chunk to avoid seams
      let rejectTriangle = false;
      for (let j = 0; j < 3; j++) {
        if (
          tri[j][0] <= 0 ||
          tri[j][0] >= width - 1 ||
          tri[j][1] <= 0 ||
          tri[j][1] >= height - 1 ||
          tri[j][2] <= 0 ||
          tri[j][2] >= depth - 1
        ) {
          rejectTriangle = true;
          break;
        }
      }
      if (rejectTriangle) {
        continue;
      }

      const norm: Triangle = [
        vec3.fromValues(
          interleavedData[offset0 + 4], // normal.x
          interleavedData[offset0 + 5], // normal.y
          interleavedData[offset0 + 6]  // normal.z
        ),
        vec3.fromValues(
          interleavedData[offset1 + 4],
          interleavedData[offset1 + 5],
          interleavedData[offset1 + 6]
        ),
        vec3.fromValues(
          interleavedData[offset2 + 4],
          interleavedData[offset2 + 5],
          interleavedData[offset2 + 6]
        )
      ];

      // Extract terrain types (stored as float, convert back to uint)
      const terrainTypeFloat0 = interleavedData[offset0 + 3];
      const terrainTypeFloat1 = interleavedData[offset1 + 3];
      const terrainTypeFloat2 = interleavedData[offset2 + 3];

      const types: [number, number, number] = [
        new Uint32Array(new Float32Array([terrainTypeFloat0]).buffer)[0],
        new Uint32Array(new Float32Array([terrainTypeFloat1]).buffer)[0],
        new Uint32Array(new Float32Array([terrainTypeFloat2]).buffer)[0]
      ];

      this.Mesh.addTriangle(tri, norm, types);
    }
    timings.meshConstruction = performance.now() - startTime;
    timings.total = performance.now() - totalStart;


    return { mesh: this.Mesh, timings };
  }
  getMesh() {
    return this.Mesh;
  }
}
