//Wrapper classes (will write stuff later)

import { createNoise3D, NoiseFunction3D } from "simplex-noise";
import { Chunk } from "./marching_cubes";
import { vec2, vec3 } from "gl-matrix";
import { Light } from "./Light";
import { Color } from "./terrains";

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
  public simplexNoise!: NoiseFunction3D;
  public fieldMap: Map<string, number>;

  /**
   * Constructs a world
   * @param width Width in # of chunks
   * @param length Length in # of chunks
   * @param height Height of world
   */
  public constructor(width: number, height: number, length: number) {
    this.width = width;
    this.length = length;
    this.height = height;
    this.chunks = [];
    this.simplexNoise = createNoise3D();
    this.generate();

    this.fieldMap = new Map<string, number>();
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
      new Chunk(
        vec2.fromValues(0, 0),
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.simplexNoise,
        true
      ),
      new Chunk(
        vec2.fromValues(this.resolution, 0),
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.simplexNoise
      ),
      new Chunk(
        vec2.fromValues(2 * this.resolution, 0),
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.simplexNoise
      ),
      new Chunk(
        vec2.fromValues(0, this.resolution),
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.simplexNoise
      )
    ];
  }

  //Renders map (later implementation we don't care abt it rn.)
  public render() {}
}
