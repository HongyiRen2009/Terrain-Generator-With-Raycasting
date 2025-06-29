import { vec3 } from "gl-matrix";
import { Mesh } from "./Mesh";
import { Terrains } from "./terrains";

const roundToPrecision = (value: number, precision: number): number =>
  Math.round(value * precision) / precision;

export const vertexKey = (vertex: vec3): string =>
  `${roundToPrecision(vertex[0], 1e2)},${roundToPrecision(vertex[1], 1e2)},${roundToPrecision(vertex[2], 1e2)}`;

export const meshToInterleavedVerticesAndIndices = (
  mesh: Mesh
): { vertices: Float32Array; indices: Uint32Array } => {
  // For each vertex: x, y, z, r, g, b
  const vertexMap = new Map<string, number>();
  const vertices: number[] = [];
  const indices: number[] = [];
  let vertexIndex = 0;
  for (let i = 0; i < mesh.mesh.length; i++) {
    const triangle = mesh.mesh[i];
    const types = mesh.type[i];
    for (let j = 0; j < 3; j++) {
      const vertex = triangle[j];
      const normal = mesh.normals[i][j];
      const key = vertexKey(vertex);
      if (!vertexMap.has(key)) {
        const type = Terrains[types[j]];
        const color = type.color;
        vertices.push(
          vertex[0],
          vertex[1],
          vertex[2],
          normal[0],
          normal[1],
          normal[2],
          color.r / 255,
          color.g / 255,
          color.b / 255
        );
        vertexMap.set(key, vertexIndex);
        vertexIndex++;
      }
      indices.push(vertexMap.get(key)!); // Store the index of the vertex
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices)
  };
};

export const meshToNonInterleavedVerticesAndIndices = (
  mesh: Mesh
): {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
} => {
  const vertexMap = new Map<string, number>();
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  let vertexIndex = 0;

  for (let i = 0; i < mesh.mesh.length; i++) {
    const triangle = mesh.mesh[i];
    const types = mesh.type[i];
    for (let j = 0; j < 3; j++) {
      const vertex = triangle[j];
      const normal = mesh.normals[i][j];
      const key = vertexKey(vertex);

      if (!vertexMap.has(key)) {
        const type = Terrains[types[j]];
        const color = type.color;

        positions.push(vertex[0], vertex[1], vertex[2]);
        normals.push(normal[0], normal[1], normal[2]);
        colors.push(color.r / 255, color.g / 255, color.b / 255);

        vertexMap.set(key, vertexIndex++);
      }

      indices.push(vertexMap.get(key)!);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint32Array(indices)
  };
};
