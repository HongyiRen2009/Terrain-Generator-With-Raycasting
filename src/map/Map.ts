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
  //In Chunks
  //Unused for now: placeholders and use them when actually implemented
  private width: number;
  private length: number;
  /**
   * Calculates the equivalent directional light intensity from a point light
   * using the attenuation formula from LightingPass.
   * 
   * Attenuation formula: 2.0 * (1.0 - d/sqrt(d*d + r*r))
   * where d = distance, r = radius, range = max distance
   * 
   * @param pointLightIntensity The intensity of the point light (default: 1.0)
   * @param pointLightPosition The position of the point light (default: (0, 500, 0))
   * @param pointLightRadius The radius of the point light (default: 200)
   * @param representativeDistance The distance at which to calculate attenuation (default: 500, height of sun)
   * @returns The equivalent directional light intensity
   */
  private static calculateEquivalentSunIntensity(
    pointLightIntensity: number = 1.0,
    pointLightPosition: vec3 = vec3.fromValues(0, 500, 0),
    pointLightRadius: number = 200,
    representativeDistance: number = 500
  ): number {
    // Attenuation formula from Lighting.frag: calculateAttenuation
    // attenuation = 2.0 * (1.0 - d/sqrt(d*d + r*r))
    const d = representativeDistance;
    const r = pointLightRadius;
    const range = pointLightRadius * 5.0; // Default range from PointLight constructor
    
    if (d > range) {
      return 0.0;
    }
    
    const attenuation = 2.0 * (1.0 - d / Math.sqrt(d * d + r * r));
    
    // Equivalent directional light intensity = point light intensity * attenuation
    return pointLightIntensity * attenuation;
  }

  public sunLight: DirectionalLight = new DirectionalLight(
    vec3.fromValues(0, -1, 0),
    new Color(255, 255, 255),
    WorldMap.calculateEquivalentSunIntensity() // Calculate equivalent intensity from point light
  );
  public lights: PointLight[] = [
    new PointLight(vec3.fromValues(32, 10, 16), new Color(255, 255, 255), 5, 5),
    new PointLight(vec3.fromValues(96, 10, 48), new Color(255, 255, 255), 5, 5),
    new PointLight(
      vec3.fromValues(128, 10, 32),
      new Color(255, 255, 255),
      5,
      5
    ),
    new PointLight(
      vec3.fromValues(160, 10, 16),
      new Color(255, 255, 255),
      5,
      5
    ),
    new PointLight(vec3.fromValues(224, 10, 48), new Color(255, 255, 255), 5, 5)
  ];
  public numShadowedLights: number = 5;

  public height: number;
  public resolution = 64; //#of vertices square size of chunk
  public chunks: Chunk[];
  public fieldMap: Map<string, number>;
  public Workers: Worker[] = [];
  public seed: number = 10; // Random seed for noise generation

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
    this.chunks = [
      // Row 1
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
