//Wrapper classes (will write stuff later)

import { Chunk } from "./marching_cubes";
import { mat4, vec2, vec3 } from "gl-matrix";
import { Light } from "./Light";

import { Color } from "./terrains";
import { Mesh } from "./Mesh";
import { Shader } from "../render/Shader";
import { GlUtils } from "../render/GlUtils";
import { WorldObject } from "./WorldObject";
import { meshToVerticesAndIndices } from "./cubes_utils";
import { MeshFragmentShaderCode, MeshVertexShaderCode } from "../render/glsl";

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
  public fieldMap: Map<string, number>;
  public Workers: Worker[] = [];
  public seed: number = 10; // Random seed for noise generation

  public worldObjects: WorldObject[] = [];
  gl: WebGL2RenderingContext;

  private nextWorldObjectId: number = 0;

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
    gl: WebGL2RenderingContext
  ) {
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
    for (const chunk of this.chunks) {
      CombinedMesh.merge(chunk.getMesh());
    }
    for(const object of this.worldObjects){
      CombinedMesh.merge(object.mesh);
    }
    return CombinedMesh;
  }
  /**
   * Add an object to the game world
   */
  public addObject(objectData: Mesh, objectLocation: mat4) {
    const { vertices, indices } = meshToVerticesAndIndices(objectData);
    const meshSize = indices.length;

    let objectShader: Shader = new Shader(
      this.gl,
      MeshVertexShaderCode,
      MeshFragmentShaderCode
    );

    let objectBuffer = GlUtils.CreateStaticBuffer(
      this.gl,
      vertices,
      Array.from(indices)
    );

    const worldObject: WorldObject = {
      shader: objectShader,
      buffer: objectBuffer,
      position: objectLocation,
      meshSize: meshSize,
      id: this.nextWorldObjectId,
      mesh: objectData
    };

    this.nextWorldObjectId++;

    this.worldObjects.push(worldObject);
  }

  //Renders map (later implementation we don't care abt it rn.)
  public render() {}
}
