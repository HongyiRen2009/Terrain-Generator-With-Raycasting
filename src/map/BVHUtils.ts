import { flatBVHNode, Triangle } from "./Mesh";
import { Terrains } from "./terrains";

/**
 * Utility class for packing BVH and triangle data into Float32Arrays for GPU processing.
 */
export class BVHUtils {
  /**
   * Pack all the triangles into a Float32array(s) which can be passed as a RGBAF32
   * @param tri BVH triangles
   */
  static packTriangles(
    mesh: Triangle[],
    types: [number, number, number][],
    vertexNormals: Triangle[]
  ) {
    let floatsPerTexel = 4; //Using rgbaf32 format, each texel (or pixel of texture) can hold up to 4 floats
    //Currently only need to pack the vertices and terrain types - Bounding boxes & other attributes don't matter as they will be part of the BVH
    let vertices = new Float32Array(
      Math.ceil((mesh.length * 9) / floatsPerTexel) * floatsPerTexel
    ); // Each triangle vertices has 9 attributes (3 vertices, 3 axis)
    let terrains = new Float32Array(
      Math.ceil((types.length * 3) / floatsPerTexel) * floatsPerTexel
    ); // 3 vertices each have different terrain values.
    let normals = new Float32Array(
      Math.ceil((mesh.length * 9) / floatsPerTexel) * floatsPerTexel
    ); // Each triangle normal for all the vertices has 9 attributes
    for (let i = 0; i < mesh.length; i++) {
      //Iterate through triangles
      for (let a = 0; a < mesh[i].length; a++) {
        //Iterate through vertices in each triangle
        vertices[i * 9 + 3 * a] = mesh[i][a][0];
        vertices[i * 9 + 3 * a + 1] = mesh[i][a][1];
        vertices[i * 9 + 3 * a + 2] = mesh[i][a][2];

        terrains[i * 3 + a] = types[i][a];

        normals[i * 9 + 3 * a] = vertexNormals[i][a][0];
        normals[i * 9 + 3 * a + 1] = vertexNormals[i][a][1];
        normals[i * 9 + 3 * a + 2] = vertexNormals[i][a][2];
      }
    }
    return { vertices, terrains, normals };
  }

  /**
   * Packs flatten BVH to F32 format to be sent to glsl.
   * For how this works @see packTriangles
   * @param BVH
   */
  static packBVH(BVH: flatBVHNode[]) {
    let floatsPerTexel = 4; //See thing in packTriangles Method
    let boundingBoxes = new Float32Array(
      Math.ceil((BVH.length * 6) / floatsPerTexel) * floatsPerTexel
    );
    let nodes = new Float32Array(
      Math.ceil((BVH.length * 2) / floatsPerTexel) * floatsPerTexel
    );
    let leafs = new Float32Array(
      Math.ceil((BVH.length * 4) / floatsPerTexel) * floatsPerTexel
    );
    for (let i = 0; i < BVH.length; i++) {
      for (let j = 0; j < 3; j++) {
        boundingBoxes[i * 6 + j] = BVH[i].boundingBoxMin[j];
        boundingBoxes[i * 6 + 3 + j] = BVH[i].boundingBoxMax[j];
      }
      nodes[i * 2] = BVH[i].left;
      nodes[i * 2 + 1] = BVH[i].right;

      leafs[i * 4] = BVH[i].t1;
      leafs[i * 4 + 1] = BVH[i].t2;
      leafs[i * 4 + 2] = BVH[i].t3;
      leafs[i * 4 + 3] = BVH[i].t4;
    }
    return {
      boundingBoxes,
      nodes,
      leafs
    };
  }
  /**
   * Packs terrain type properties into a Float32Array for efficient GPU transfer.
   *
   * Each terrain type's properties (color components, illuminosity, and reflectiveness)
   * are stored sequentially in the output array. The array is padded to ensure its length
   * is a multiple of `floatsPerTexel`.
   *
   * @returns {Float32Array} A packed array containing the terrain types' properties.
   *
   */
  static packTerrainTypes() {
    let floatsPerTexel = 4;
    let numberTerrains = 4;
    let numberFloats = 6;
    let out = new Float32Array(
      Math.ceil((numberTerrains * numberFloats) / floatsPerTexel) *
        floatsPerTexel
    ); //r,g,b,illuminosity, reflectiveness
    let i = 0;
    for (const key in Terrains) {
      let terrain = Terrains[key];
      out[i * numberFloats] = terrain.color.r / 255;
      out[i * numberFloats + 1] = terrain.color.g / 255;
      out[i * numberFloats + 2] = terrain.color.b / 255;
      out[i * numberFloats + 3] = terrain.reflectiveness;
      out[i * numberFloats + 4] = terrain.roughness;
      out[i * numberFloats + 5] = terrain.type;
      i++;
    }
    return out;
  }
}
