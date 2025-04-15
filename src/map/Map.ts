//Wrapper classes (will write stuff later)

import { createNoise3D, NoiseFunction3D } from "simplex-noise";
import { Chunk } from "./marching_cubes";
import { vec2, vec3 } from "gl-matrix";

//Check README for implementation pattern
//Center chunk starts at 0,0 (probably)

//Entirety of the map
export class WorldMap {
  private height: number;
  //In Chunks
  private width: number;
  private length: number;

  public chunks: Chunk[];
  public simplexNoise!: NoiseFunction3D;

  //TODO: Insert parameters
  public constructor(width: number, length: number, height: number) {
    this.width = width;
    this.length = length;
    this.height = height;
    this.chunks = [];
    this.simplexNoise = createNoise3D();
    this.generate();
  }

  //Generates map
  public generate() {
    this.chunks = [
      new Chunk(
        vec2.fromValues(0, 0),
        vec3.fromValues(32, 32, 32),
        this.simplexNoise
      ),
      new Chunk(
        vec2.fromValues(32, 0),
        vec3.fromValues(32, 32, 32),
        this.simplexNoise
      ),
      new Chunk(
        vec2.fromValues(-32, 0),
        vec3.fromValues(32, 32, 32),
        this.simplexNoise
      ),
      new Chunk(
        vec2.fromValues(0, 32),
        vec3.fromValues(32, 32, 32),
        this.simplexNoise
      )
    ];
  }

  //Renders map (later implementation we don't care abt it rn.)
  public render() {}
}
