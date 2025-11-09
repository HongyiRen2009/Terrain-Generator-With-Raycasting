//Wrapper classes (will write stuff later)

import { Chunk } from "./marching_cubes";
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
public chunks: Chunk[];
  
  // NEW: Single TypedArray for entire world (replaces fieldMap!)
  private worldFieldData: Float32Array | null = null;
  private worldFieldMinX: number = 0;
  private worldFieldMinZ: number = 0;
  private worldFieldMaxX: number = 0;
  private worldFieldMaxZ: number = 0;
  
  public Workers: Worker[] = [];
  public seed: number = 10; // Random seed for noise generation

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
    this.chunks = [];
    const NUM_CHUNKS = 4;
    for (let i = 0; i < NUM_CHUNKS; i++) {
      this.Workers.push(new Worker(new URL("./Worker.ts", import.meta.url)));
    }

    this.generate();

    this.objectUI = new ObjectUI(this, this.tracerUpdateSupplier);
  }
public generate() {
    this.chunks = [
      new Chunk(
        vec2.fromValues(0, 0),
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.seed,
        this.Workers[0]
      ),
      new Chunk(
        vec2.fromValues(this.resolution, 0),
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.seed,
        this.Workers[1]
      ),
      new Chunk(
        vec2.fromValues(2 * this.resolution, 0),
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.seed,
        this.Workers[2]
      ),
      new Chunk(
        vec2.fromValues(3 * this.resolution, 0),
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.seed,
        this.Workers[3]
      )
    ];
  }
  public populateFieldMap() {
    console.log("🔄 Consolidating chunk data into single TypedArray...");
    
    // Calculate world bounds
    this.worldFieldMinX = Math.min(...this.chunks.map(c => c.ChunkPosition[0]));
    this.worldFieldMinZ = Math.min(...this.chunks.map(c => c.ChunkPosition[1]));
    this.worldFieldMaxX = Math.max(...this.chunks.map(c => c.ChunkPosition[0] + c.GridSize[0]));
    this.worldFieldMaxZ = Math.max(...this.chunks.map(c => c.ChunkPosition[1] + c.GridSize[2]));
    
    const sizeX = this.worldFieldMaxX - this.worldFieldMinX + 1;
    const sizeY = this.height + 1;
    const sizeZ = this.worldFieldMaxZ - this.worldFieldMinZ + 1;
    
    const totalSize = sizeX * sizeY * sizeZ;    
    // Create single typed array for entire world
    this.worldFieldData = new Float32Array(totalSize);
    
    // Copy data from all chunks
    let totalEntries = 0;
    for (const chunk of this.chunks) {
      for (const [key, val] of Array.from(chunk.FieldMap.entries())) {
        const coords = key.split(',').map(Number);
        const [x, y, z] = coords;
        
        // Convert to local coordinates
        const localX = x - this.worldFieldMinX;
        const localZ = z - this.worldFieldMinZ;
        
        if (localX >= 0 && localX < sizeX &&
            localZ >= 0 && localZ < sizeZ &&
            y >= 0 && y < sizeY) {
          const idx = localX + y * sizeX + localZ * sizeX * sizeY;
          this.worldFieldData[idx] = val;
          totalEntries++;
        }
      }
    }
    
    console.log(`✅ Consolidated ${totalEntries.toLocaleString()} field values`);
    
    // Share the typed array with all chunks
    for (const chunk of this.chunks) {
      chunk.setWorldFieldData(
        this.worldFieldData,
        this.worldFieldMinX,
        this.worldFieldMinZ,
        sizeX,
        sizeY,
        sizeZ
      );
      // Clear temporary Map data to free memory
      chunk.clearTemporaryData();
    }
    
    console.log("✅ Shared world field with all chunks and cleared temporary Maps");
  }
  public combinedMesh(): Mesh {
    const CombinedMesh = new Mesh();

    // Merge chunks (these are already independent)
    for (const chunk of this.chunks) {
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
}
