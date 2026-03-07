import { vec3 } from "gl-matrix";
import { Mesh } from "./Mesh";
import { TerrainNorm, Terrains } from "./terrains";

const roundToPrecision = (value: number, precision: number): number =>
  Math.round(value * precision) / precision;

export const vertexKey = (vertex: vec3): string =>
  `${roundToPrecision(vertex[0], 1e2)},${roundToPrecision(vertex[1], 1e2)},${roundToPrecision(vertex[2], 1e2)}`;

/** Emissivity packed for shader (0–1). Non-emissive = 0; emissive terrain uses color. */
function packEmissivity(terrain: (typeof Terrains)[number]): number {
  if (terrain.type === 5) {
    const v = terrain.color.createVec3();
    return (v[0] + v[1] + v[2]) / 3; // simple luminance for emissive
  }
  return 0;
}

export const meshToInterleavedVerticesAndIndices = (
  mesh: Mesh
): { vertices: Float32Array; indices: Uint32Array } => {
  // Per vertex: position(3), normal(3), color(3), reflectiveness(1), metallicity(1), roughness(1), emissivity(1) = 13 floats
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
        const terrain = Terrains[types[j]];
        const color = terrain.color;
        const metallicity = terrain.type === 2 ? 1 : 0; // specular mirror
        vertices.push(
          vertex[0],
          vertex[1],
          vertex[2],
          normal[0],
          normal[1],
          normal[2],
          color.r / 255,
          color.g / 255,
          color.b / 255,
          terrain.reflectiveness,
          metallicity,
          terrain.roughness,
          packEmissivity(terrain)
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
function packEmissivityToUint8(emissivity:vec3): number {
  const r = Math.min(3, Math.floor(emissivity[0] * 3)); // 2 bits
  const g = Math.min(3, Math.floor(emissivity[1] * 3)); // 2 bits
  const b = Math.min(3, Math.floor(emissivity[2] * 3)); // 2 bits
  return (b << 4) | (g << 2) | r;
}
export const meshToNonInterleavedVerticesAndIndices = (
  mesh: Mesh
): {
  positions: Float32Array;
  normals: Float32Array;
  albedoBlockId: Float32Array;
  indices: Uint32Array;
} => {
  const vertexMap = new Map<string, number>();
  const positions: number[] = [];
  const normals: number[] = [];
  const albedoBlockId: number[] = [];
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
        albedoBlockId.push(
          0.0,0.0,0.0,
          types[j]/TerrainNorm // block id in .a
        );
        vertexMap.set(key, vertexIndex++);
      }

      indices.push(vertexMap.get(key)!);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    albedoBlockId: new Float32Array(albedoBlockId),
    indices: new Uint32Array(indices),
  };
};