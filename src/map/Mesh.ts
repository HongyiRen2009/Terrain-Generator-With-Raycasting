import { vec3 } from "gl-matrix";
export type Triangle = [vec3, vec3, vec3];
export class Mesh {
  public mesh: Triangle[] = [];
  public type: [number, number, number][] = []; // To be used when terrain types are implemented
  constructor() {}
  merge(mesh2: Mesh){
    this.mesh.push(...mesh2.mesh);
    this.type.push(...mesh2.type);
  }
  addTriangle(triangle: Triangle, type: [number, number, number] = [0,0,0]){
    this.mesh.push(triangle);
    this.type.push(type);
  }
}
