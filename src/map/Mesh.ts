import { vec3 } from "gl-matrix";
import { Terrain, Terrains } from "./terrains";
import { GameEngine } from "../GameEngine";
export type Triangle = [vec3, vec3, vec3];

export interface BVHTriangle {
  triangle: Triangle;
  center: vec3; //centroid
  boundingBox: { min: vec3; max: vec3 };
  type: Terrain[]; //Terrain information - length of 3
  index: number; //index in the large thing.
}

export interface BVHNode {
  boundingBox: { min: vec3; max: vec3 };
  left?: BVHNode;
  right?: BVHNode;
  triangleIndices?: number[];
}

export interface flatBVHNode {
  boundingBoxMin: vec3;
  boundingBoxMax: vec3;
  left: number; //Child index or -1
  right: number; //Child index or -1
  t1: number; //Triangle index in list of triangles or -1
  t2: number; //Triangle index in list of triangles or -1
  t3: number; //Triangle index in list of triangles or -1
  t4: number; //Triangle index in list of triangles or -1
}

/**
 * The "Mesh Class" - Stores the world's mesh
 */
export class Mesh {
  public mesh: Triangle[] = [];
  public normals: Triangle[] = [];
  public type: [number, number, number][] = []; // To be used when terrain types are implemented
  constructor() {}

  /**
   * For when merging two meshes together
   * @param mesh2 Mesh to merge with the original one
   */
  merge(mesh2: Mesh) {
    this.mesh.push(...mesh2.mesh);
    this.normals.push(...mesh2.normals);
    this.type.push(...mesh2.type);
  }

  /**
   * Adds triangle to mesh
   * @param triangle The triangle to add
   * @param type (optional) the terrain types of the triangles to add
   */
  addTriangle(
    triangle: Triangle,
    normal: Triangle,
    type: [number, number, number] = [0, 0, 0]
  ) {
    this.mesh.push(triangle);
    this.normals.push(normal);
    this.type.push(type);
  }
  /**
   * Copies the mesh to another mesh (used generally for OOP to avoid funny pointer errors)
   * @returns A new Mesh with the same values
   */
  copy() {
    const a = new Mesh();
    for (let i = 0; i < this.mesh.length; i++) {
      a.addTriangle(this.mesh[i], this.normals[i], this.type[i]);
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

  exportBVHTriangles(): BVHTriangle[] {
    return this.mesh.map((val, i, arr) => {
      let center = vec3.fromValues(
        GameEngine.average([val[0][0], val[1][0], val[2][0]]),
        GameEngine.average([val[0][1], val[1][1], val[2][1]]),
        GameEngine.average([val[0][2], val[1][2], val[2][2]])
      );
      let terrain = this.type[i].map((type) => {
        return Terrains[type];
      });
      let min = vec3.fromValues(
        Math.min(val[0][0], val[1][0], val[2][0]),
        Math.min(val[0][1], val[1][1], val[2][1]),
        Math.min(val[0][2], val[1][2], val[2][2])
      );
      let max = vec3.fromValues(
        Math.max(val[0][0], val[1][0], val[2][0]),
        Math.max(val[0][1], val[1][1], val[2][1]),
        Math.max(val[0][2], val[1][2], val[2][2])
      );
      return {
        triangle: val,
        center: center,
        boundingBox: { min: min, max: max },
        type: terrain,
        index: i
      };
    });
  }

  /**
   * Export BVH from BVH triangles
   */
  static exportBVH(triangles: BVHTriangle[], depth = 0): BVHNode {
    if (triangles.length <= 4) {
      let bbox = Mesh.computeBoundingBox(
        ...triangles.map((val) => val.boundingBox)
      );
      return {
        boundingBox: bbox,
        triangleIndices: triangles.map((val) => val.index)
      };
    }

    let axis = depth % 3;
    triangles.sort((a, b) => a.center[axis] - b.center[axis]);
    let mid = Math.floor(triangles.length / 2);
    let left = Mesh.exportBVH(triangles.slice(0, mid), depth + 1);
    let right = Mesh.exportBVH(triangles.slice(mid), depth + 1);
    return {
      boundingBox: Mesh.computeBoundingBox(left.boundingBox, right.boundingBox),
      left: left,
      right: right
    };
  }

  static computeBoundingBox(...boxes: { max: vec3; min: vec3 }[]) {
    let min = vec3.fromValues(
      Math.min(...boxes.map((val) => val.min[0])),
      Math.min(...boxes.map((val) => val.min[1])),
      Math.min(...boxes.map((val) => val.min[2]))
    );
    let max = vec3.fromValues(
      Math.max(...boxes.map((val) => val.max[0])),
      Math.max(...boxes.map((val) => val.max[1])),
      Math.max(...boxes.map((val) => val.max[2]))
    );
    return { max: max, min: min };
  }

  static flattenBVH(node: BVHNode): flatBVHNode[] {
    let out: flatBVHNode[] = [];

    if (node.triangleIndices) {
      out.push({
        boundingBoxMin: node.boundingBox.min,
        boundingBoxMax: node.boundingBox.max,
        left: -1,
        right: -1,
        t1:
          node.triangleIndices[0] !== undefined ? node.triangleIndices[0] : -1,
        t2:
          node.triangleIndices[1] !== undefined ? node.triangleIndices[1] : -1,
        t3:
          node.triangleIndices[2] !== undefined ? node.triangleIndices[2] : -1,
        t4: node.triangleIndices[3] !== undefined ? node.triangleIndices[3] : -1
      });
    } else {
      let left = Mesh.flattenBVH(node.left!);
      let right = Mesh.flattenBVH(node.right!);
      //dummy -- will edit
      out.push({
        boundingBoxMin: node.boundingBox.min,
        boundingBoxMax: node.boundingBox.max,
        left: -1,
        right: -1,
        t1: -1,
        t2: -1,
        t3: -1,
        t4: -1
      });
      //Push sides
      let i1 = out.length; //Note: i1 should always be 1 but better practice
      out.push(
        ...left.map((val) => {
          if (val.left != -1) val.left += i1;
          if (val.right != -1) val.right += i1;
          return val;
        })
      );
      let i2 = out.length;
      out.push(
        ...right.map((val) => {
          if (val.left != -1) val.left += i2;
          if (val.right != -1) val.right += i2;
          return val;
        })
      );
      out[0].left = i1;
      out[0].right = i2;
    }
    return out;
  }
}
