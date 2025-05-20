import { vec2, vec3 } from "gl-matrix";
import { Mesh, Triangle } from "./Mesh";
import { Terrains } from "./terrains";
import { GlUtils } from "../render/GlUtils";
import { Chunk } from "./marching_cubes";

const roundToPrecision = (value: number, precision: number): number =>
  Math.round(value * precision) / precision;

const vertexKey = (vertex: vec3): string =>
  `${roundToPrecision(vertex[0], 1e2)},${roundToPrecision(vertex[1], 1e2)},${roundToPrecision(vertex[2], 1e2)}`;

const calculateTriangleNormal = (triangle: Triangle): vec3 => {
  const v1 = vec3.sub(vec3.create(), triangle[1], triangle[0]);
  const v2 = vec3.sub(vec3.create(), triangle[2], triangle[0]);
  const normal = vec3.create();
  vec3.cross(normal, v1, v2);
  vec3.normalize(normal, normal);
  return normal;
};

export const calculateVertexNormals = (
  mesh: Mesh
): Map<string, vec3> => {
  const vertexNormals = new Map<string, vec3>();

  for (const triangle of mesh.mesh) {
    // Calculate the normal for the triangle
    const normal = calculateTriangleNormal(triangle);

    // Add the triangle's normal to each of its vertices
    for (const vertex of triangle) {
      const key = vertexKey(vertex); // Use the vertex position as a key
      if (!vertexNormals.has(key)) {
        vertexNormals.set(key, vec3.create());
      }
      vec3.add(vertexNormals.get(key)!, vertexNormals.get(key)!, normal);
    }
  }

  // Normalize all vertex normals
  for (const [key, normal] of Array.from(vertexNormals.entries())) {
    vec3.normalize(normal, normal);
  }

  return vertexNormals;
};

export const meshToVerticesAndIndices = (
  mesh: Mesh,
  vertexNormals: Map<string, vec3>,
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
      const key = vertexKey(vertex);
      if (!vertexMap.has(key)) {
        const normal = vertexNormals.get(key)!;

        const type = Terrains[types[j]];
        const color = GlUtils.getMeshColor(type);
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
