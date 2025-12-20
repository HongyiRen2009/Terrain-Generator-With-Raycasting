//Wrapper classes (will write stuff later)

import { Chunk } from "./marching_cubes";
import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { PointLight, DirectionalLight } from "./Light";

import { Color, Terrain, Terrains } from "./terrains";
import { Mesh, Triangle } from "./Mesh";
import { RenderUtils } from "../utils/RenderUtils";
import { WorldObject } from "./WorldObject";
import { meshToInterleavedVerticesAndIndices } from "./cubes_utils";
import { ObjectUI } from "./ObjectUI";
import { LightUI } from "./LightUI";

interface ImportMapEntry {
  color: string;
  terrain: Terrain;
}

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
    0.143047 // Equivalent intensity calculated from point light attenuation
  );
  public lights: PointLight[] = [];
  public numShadowedLights: number = 5;

  public height: number;
  public resolution = 16; //#of vertices square size of chunk
  public chunks: Chunk[];
  public fieldMap: Map<string, number>;
  public Workers: Worker[] = [];
  public seed: number = Math.floor(Math.random() * 999) + 1; // Random seed for noise generation

  public worldObjects: WorldObject[] = [];
  gl: WebGL2RenderingContext;

  private nextWorldObjectId: number = 0;

  private tracerUpdateSupplier: () => () => void;

  public objectUI: ObjectUI;
  public lightUI: LightUI;

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
    for (let i = 0; i < navigator.hardwareConcurrency; i++) {
      this.Workers.push(new Worker(new URL("./Worker.ts", import.meta.url)));
    }
    this.generate();

    this.fieldMap = new Map<string, number>();

    this.objectUI = new ObjectUI(this, this.tracerUpdateSupplier);
    this.lightUI = new LightUI(this, this.tracerUpdateSupplier);
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
    this.chunks = [];
    this.fieldMap.clear();
    this.worldObjects = [];
  }

  public populateFieldMap() {
    for (const chunk of this.chunks) {
      for (const [key, val] of Array.from(chunk.FieldMap.entries())) {
        this.fieldMap.set(key, val);
      }
    }
    for (const chunk of this.chunks) {
      chunk.setWorldFieldMap(this.fieldMap);
    }
  }
  //Generates map
  public generate() {
    this.chunks = [];
    let worker = 0;

    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 6; j++) {
        this.chunks.push(
          new Chunk(
            vec2.fromValues(i * this.resolution, j * this.resolution),
            vec3.fromValues(this.resolution, this.height, this.resolution),
            this.seed,
            this.Workers[worker++ % navigator.hardwareConcurrency]
          )
        );
      }
  }
  // Replace the combinedMesh() method in Map.ts (around line 183)

  public combinedMesh(): Mesh {
    console.time("combinedMesh generation");
    const CombinedMesh = new Mesh();

    // Count total triangles for pre-allocation logging
    let totalTriangles = 0;
    for (const chunk of this.chunks) {
      totalTriangles += chunk.getMesh().mesh.length;
    }
    for (const obj of this.worldObjects) {
      totalTriangles += obj.mesh.mesh.length;
    }

    // Merge chunks (these are already independent)
    for (let i = 0; i < this.chunks.length; i++) {
      CombinedMesh.merge(this.chunks[i].getMesh());
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
}
