export const TerrainLightingVertexShaderCode = /*glsl*/ `#version 300 es
precision highp float;
in vec3 VertexPosition;
in vec2 UV;
out vec2 fragUV;
void main()
{
  fragUV = UV;
  gl_Position = vec4(VertexPosition, 1.0);
}
`;
export const TerrainLightingFragmentShaderCode = /*glsl*/ `#version 300 es
precision highp float;
in vec2 fragUV;
out vec4 outputColor;
uniform sampler2D SSAOTexture;
uniform sampler2D VertexPositionTexture;
uniform sampler2D VertexNormalTexture;
uniform sampler2D VertexAlbedoTexture;
void main() {
  vec3 albedo = texture(VertexAlbedoTexture, fragUV).rgb;
  vec3 normal = normalize(texture(VertexNormalTexture, fragUV).rgb);
  vec3 fragPos = texture(VertexPositionTexture, fragUV).rgb;
  //Lighting parameters
  //Apply SSAO
  float ambientOcclusion = texture(SSAOTexture, fragUV).r;
  vec3 ambient = ambientOcclusion*albedo+normal*0.0+fragPos*0.0;
  outputColor = vec4(ambient, 1.0);
}
`;