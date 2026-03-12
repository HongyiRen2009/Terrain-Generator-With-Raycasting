import { vec3 } from "gl-matrix";
import { Mesh } from "./Mesh";
import { TerrainNorm, Terrains } from "./terrains";

const roundToPrecision = (value: number, precision: number): number =>
  Math.round(value * precision) / precision;

export const vertexKey = (vertex: vec3): string =>
  `${roundToPrecision(vertex[0], 1e2)},${roundToPrecision(vertex[1], 1e2)},${roundToPrecision(vertex[2], 1e2)}`;

/** Emissivity packed for shader (0–1). Non-emissive = 0; emissive terrain uses color. */
function packEmissivity(terrain: (typeof Terrains)[number]): number {
  if (terrain.brdfType === 5) {
    const v = terrain.color.createVec3();
    return (v[0] + v[1] + v[2]) / 3; // simple luminance for emissive
  }
  return 0;
}

export const meshToInterleavedVerticesAndIndices = (
  mesh: Mesh
): { vertices: Float32Array; indices: Uint32Array } => {
  // Per vertex: position(3), normal(3), uv(2), materialID(1) = 9 floats = 36 bytes stride
  // Color comes from textures or defaults to magenta if no texture
  const vertexMap = new Map<string, number>();
  const vertices: number[] = [];
  const indices: number[] = [];
  let vertexIndex = 0;
  for (let i = 0; i < mesh.mesh.length; i++) {
    const triangle = mesh.mesh[i];
    const types = mesh.materialIDs[i];
    for (let j = 0; j < 3; j++) {
      const vertex = triangle[j];
      const normal = mesh.normals[i][j];
      const key = vertexKey(vertex);
      if (!vertexMap.has(key)) {
        vertices.push(
          // Position (3 floats)
          vertex[0],
          vertex[1],
          vertex[2],
          // Normal (3 floats)
          normal[0],
          normal[1],
          normal[2],
          // UV (2 floats)
          0.0,
          0.0,
          // Material ID (1 float as uint)
          types[j]
        );
        vertexMap.set(key, vertexIndex);
        vertexIndex++;
      }
      indices.push(vertexMap.get(key)!);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices)
  };
};
export const meshToPositionsAndIndices = (
  mesh: Mesh
): { positions: Float32Array; indices: Uint32Array } => {
  const vertexMap = new Map<string, number>();
  const positions: number[] = [];
  const indices: number[] = [];
  let vertexIndex = 0;
  for (let i = 0; i < mesh.mesh.length; i++) {
    const triangle = mesh.mesh[i];
    for (let j = 0; j < 3; j++) {
      const vertex = triangle[j];
      const key = vertexKey(vertex);
      if (!vertexMap.has(key)) {
        positions.push(vertex[0], vertex[1], vertex[2]);
        vertexMap.set(key, vertexIndex);
        vertexIndex++;
      }
      indices.push(vertexMap.get(key)!);
    }
  }

  return {
    positions: new Float32Array(positions),
    indices: new Uint32Array(indices)
  };
};
export const meshToNonInterleavedVerticesAndIndices = (
  mesh: Mesh
): {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  materialIDs: Uint32Array;
  indices: Uint32Array;
} => {
  const vertexMap = new Map<string, number>();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const materialIDs: number[] = [];
  const indices: number[] = [];
  let vertexIndex = 0;

  for (let i = 0; i < mesh.mesh.length; i++) {
    const triangle = mesh.mesh[i];
    const types = mesh.materialIDs[i];
    for (let j = 0; j < 3; j++) {
      const vertex = triangle[j];
      const normal = mesh.normals[i][j];
      const key = vertexKey(vertex);

      if (!vertexMap.has(key)) {
        positions.push(vertex[0], vertex[1], vertex[2]);
        normals.push(normal[0], normal[1], normal[2]);
        uvs.push(0.0, 0.0); // Placeholder for UVs
        materialIDs.push(types[j]); // block id as float
        vertexMap.set(key, vertexIndex++);
      }

      indices.push(vertexMap.get(key)!);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    materialIDs: new Uint32Array(materialIDs),
    indices: new Uint32Array(indices),
  };
};