import { vec3 } from "gl-matrix";
export type Triangle = [vec3, vec3, vec3];
export class Mesh {
  public mesh: Triangle[] = [];
  public type: number[] = []; // To be used when terrain types are implemented
  constructor() {}
}
