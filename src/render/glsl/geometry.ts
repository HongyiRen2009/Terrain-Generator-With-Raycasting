export const TerrainGeometryVertexShaderCode = /*glsl*/ `#version 300 es
precision highp float;
in vec3 VertexPosition;
in vec3 VertexNormal;
in vec3 VertexAlbedo;
out vec3 viewPosition;
out vec3 viewNormal;
out vec3 Albedo;
uniform mat4 MatView;
uniform mat4 MatProj;
uniform mat4 MatTransform;
void main() {
  Albedo = VertexAlbedo;
  vec4 worldPosition = MatTransform * vec4(VertexPosition, 1.0);
  viewPosition = (MatView * worldPosition).xyz;
  viewNormal = mat3(transpose(inverse(MatView * MatTransform))) * VertexNormal;
  gl_Position = MatProj * MatView * worldPosition;
}
`;
export const TerrainGeometryFragmentShaderCode = /*glsl*/ `#version 300 es
precision highp float;
in vec3 viewPosition;
in vec3 viewNormal;
in vec3 Albedo;
layout(location = 0) out vec4 outPosition;
layout(location = 1) out vec4 outNormal;
layout(location = 2) out vec4 outAlbedo;
void main() {
  outPosition = vec4(viewPosition, 1.0);
  outNormal = vec4(normalize(viewNormal), 1.0);
  outAlbedo = vec4(Albedo, 1.0);
}
`;