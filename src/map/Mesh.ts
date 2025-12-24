import { vec3 } from "gl-matrix";
import { Terrain, Terrains } from "./terrains";
import { GameEngine } from "../GameEngine";
import { Utilities } from "./Utilities";
export type Triangle = [vec3, vec3, vec3];

export interface BVHTriangle {
  triangle: Triangle;
  center: vec3; //centroid
  boundingBox: { min: vec3; max: vec3 };
  index: number; //index in the large thing.
  vertexNormals: Triangle;
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
 * FIXED: Avoids stack overflow with large meshes by using loops instead of spread operator
 * @param mesh2 Mesh to merge with the original one
 */
merge(mesh2: Mesh) {
  // For large meshes (>10k triangles), use direct push to avoid stack overflow
  const BATCH_THRESHOLD = 10000;
  
  if (mesh2.mesh.length > BATCH_THRESHOLD) {
    // Direct loop - no spread operator
    for (let i = 0; i < mesh2.mesh.length; i++) {
      this.mesh.push(mesh2.mesh[i]);
      this.normals.push(mesh2.normals[i]);
      this.type.push(mesh2.type[i]);
    }
  } else {
    // For small meshes, spread operator is fine and faster
    this.mesh.push(...mesh2.mesh);
    this.normals.push(...mesh2.normals);
    this.type.push(...mesh2.type);
  }
}
  /**
   * Adds triangle to mesh
   * @param triangle The triangle to add
   * @param normal The normals of the triangle to add
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

  /**
   * Scales the entire mesh
   * @param s Scaling factor
   */
  scale(s: number) {
    for (let i = 0; i < this.mesh.length; i++) {
      this.mesh[i][0] = this.mesh[i][0].map((val) => val * s) as vec3;
      this.mesh[i][1] = this.mesh[i][1].map((val) => val * s) as vec3;
      this.mesh[i][2] = this.mesh[i][2].map((val) => val * s) as vec3;
    }
  }

  /**
   * Decimates the mesh by reducing triangle count using block-based decimation
   * This preserves local mesh structure better than uniform sampling
   * @param quality Quality factor (0.0 to 1.0). 1.0 = no decimation, 0.5 = 50% triangles, etc.
   * @returns A new Mesh with reduced triangle count
   */
  decimate(quality: number): Mesh {
    if (quality >= 1.0) {
      // No decimation needed, return copy
      return this.copy();
    }

    quality = Math.max(0.05, Math.min(1.0, quality)); // Clamp between 0.05 and 1.0 (minimum 5%)
    
    if (quality < 0.3) {
      alert(`⚠️ Very low quality setting (${(quality * 100).toFixed(0)}%) may cause visual artifacts. Consider using at least 30% for better results.`);
    }
    
    const decimatedMesh = new Mesh();
    const originalCount = this.mesh.length;
    const targetCount = Math.max(1, Math.floor(originalCount * quality));
    
    // Adaptive block-based decimation: preserve local mesh structure
    // For lower quality, use larger blocks to reduce gaps
    const adaptiveBlockSize = quality < 0.3 ? 20 : quality < 0.5 ? 15 : 10;
    const blockSize = Math.max(5, adaptiveBlockSize); // Minimum block size
    const totalBlocks = Math.ceil(originalCount / blockSize);
    const blocksToKeep = Math.max(1, Math.ceil(targetCount / blockSize));
    const skipFactor = Math.max(1, Math.floor(totalBlocks / blocksToKeep));
    
    let trianglesAdded = 0;
    let currentBlock = 0;
    
    while (trianglesAdded < targetCount && currentBlock * blockSize < originalCount) {
      // Keep this block
      const blockStart = currentBlock * blockSize;
      const blockEnd = Math.min(blockStart + blockSize, originalCount);
      
      // Add all triangles in this block (up to target count)
      for (let i = blockStart; i < blockEnd && trianglesAdded < targetCount; i++) {
        decimatedMesh.addTriangle(
          this.mesh[i],
          this.normals[i],
          this.type[i]
        );
        trianglesAdded++;
      }
      
      // Skip some blocks to reach target count
      currentBlock += skipFactor;
    }

    return decimatedMesh;
  }
  exportBVHTriangles(): BVHTriangle[] {
    return this.mesh.map((val, i, arr) => {
      let center = vec3.fromValues(
        Utilities.average([val[0][0], val[1][0], val[2][0]]),
        Utilities.average([val[0][1], val[1][1], val[2][1]]),
        Utilities.average([val[0][2], val[1][2], val[2][2]])
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
        index: i,
        vertexNormals: this.normals[i]
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

  /**
   * Calculate the center of mass (centroid) of the mesh
   * @returns The center point as a vec3
   */
  getCenter(): vec3 {
    if (this.mesh.length === 0) {
      return vec3.fromValues(0, 0, 0);
    }

    let sumX = 0, sumY = 0, sumZ = 0;
    let vertexCount = 0;

    // Sum all vertices
    for (const triangle of this.mesh) {
      for (const vertex of triangle) {
        sumX += vertex[0];
        sumY += vertex[1];
        sumZ += vertex[2];
        vertexCount++;
      }
    }

    // Return average
    return vec3.fromValues(
      sumX / vertexCount,
      sumY / vertexCount,
      sumZ / vertexCount
    );
  }

static flattenBVH(node: BVHNode): flatBVHNode[] {
  let out: flatBVHNode[] = [];

  if (node.triangleIndices) {
    out.push({
      boundingBoxMin: node.boundingBox.min,
      boundingBoxMax: node.boundingBox.max,
      left: -1,
      right: -1,
      t1: node.triangleIndices[0] !== undefined ? node.triangleIndices[0] : -1,
      t2: node.triangleIndices[1] !== undefined ? node.triangleIndices[1] : -1,
      t3: node.triangleIndices[2] !== undefined ? node.triangleIndices[2] : -1,
      t4: node.triangleIndices[3] !== undefined ? node.triangleIndices[3] : -1
    });
  } else {
    let left = Mesh.flattenBVH(node.left!);
    let right = Mesh.flattenBVH(node.right!);
    
    // Dummy node - will edit
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
    
    // FIXED: Use loops instead of spread operator for large arrays
    let i1 = out.length;
    
    // Push left nodes
    for (let i = 0; i < left.length; i++) {
      const val = left[i];
      if (val.left !== -1) val.left += i1;
      if (val.right !== -1) val.right += i1;
      out.push(val);
    }
    
    let i2 = out.length;
    
    // Push right nodes  
    for (let i = 0; i < right.length; i++) {
      const val = right[i];
      if (val.left !== -1) val.left += i2;
      if (val.right !== -1) val.right += i2;
      out.push(val);
    }
    
    out[0].left = i1;
    out[0].right = i2;
  }
  return out;
}
  // Getter and Setter for vertices (mesh)
  getVertices(): Triangle[] {
    return this.mesh;
  }
  setVertices(value: Triangle[]) {
    this.mesh = value;
  }

  // Getter and Setter for normals
  getNormals(): Triangle[] {
    return this.normals;
  }
  setNormals(value: Triangle[]): void {
    this.normals = value;
  }

  // Getter and Setter for type
  getTypes(): [number, number, number][] {
    return this.type;
  }
  setTypes(value: [number, number, number][]): void {
    this.type = value;
  }
}
