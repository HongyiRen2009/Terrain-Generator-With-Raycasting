import { vec3 } from "gl-matrix";
export type Triangle = [vec3, vec3, vec3];

/**
 * The "Mesh Class" - Stores the world's mesh
 */
export class Mesh {
  public mesh: Triangle[] = [];
  public type: [number, number, number][] = []; // To be used when terrain types are implemented
  constructor() {}

  /**
   * For when merging two meshes together
   * @param mesh2 Mesh to merge with the original one
   */
  merge(mesh2: Mesh) {
    this.mesh.push(...mesh2.mesh);
    this.type.push(...mesh2.type);
  }

  /**
   * Adds triangle to mesh
   * @param triangle The triangle to add
   * @param type (optional) the terrain types of the triangles to add
   */
  addTriangle(triangle: Triangle, type: [number, number, number] = [0, 0, 0]) {
    this.mesh.push(triangle);
    this.type.push(type);
  }
  /**
   * Copies the mesh to another mesh (used generally for OOP to avoid funny pointer errors)
   * @returns A new Mesh with the same values
   */
  copy() {
    const a = new Mesh();
    for (let i = 0; i < this.mesh.length; i++) {
      a.addTriangle(this.mesh[i], this.type[i]);
    }
    return a;
  }

  /**
   * Translates the entire mesh
   * @param a The translation vector
   */
  translate(a: vec3) {
    for (let i = 0; i < this.mesh.length; i++) {
      vec3.add(this.mesh[i][0], this.mesh[i][0], a);
      vec3.add(this.mesh[i][1], this.mesh[i][1], a);
      vec3.add(this.mesh[i][2], this.mesh[i][2], a);
    }
  }
}
