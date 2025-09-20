export const CubeVertexShaderCode = /*glsl*/ `#version 300 es
precision mediump float;
//If you see lessons that use attribute, that's an old version of Webgl
in vec4 VertexPosition;
in vec3 VertexColor;
out vec3 fragmentColor;
uniform mat4 MatrixTransform;
uniform mat4 matViewProj;

void main() {  
  fragmentColor = VertexColor;
  gl_Position = matViewProj*MatrixTransform*VertexPosition;
}
`;

export const CubeFragmentShaderCode = /*glsl*/ `#version 300 es
precision mediump float;

in vec3 fragmentColor;
out vec4 outputColor;

void main() {
  outputColor = vec4(fragmentColor, 1);
}`;
// Deffered Rendering for terrain
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
export const TerrainSSAOVertexShaderCode = /*glsl*/ `#version 300 es
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
export const TerrainSSAOFragmentShaderCode = /*glsl*/ `#version 300 es
precision highp float;

in vec2 fragUV;
out float outputColor;

uniform sampler2D VertexPositionTexture;
uniform sampler2D VertexNormalTexture;
uniform sampler2D NoiseTexture;
uniform vec3 samples[64];
uniform mat4 MatProj;
uniform float NoiseScale;

const int kernelSize = 64;
const float radius = 0.5;
const float bias = 0.025;

void main() {
    // Get fragment position and normal in view space
    vec3 fragPos = texture(VertexPositionTexture, fragUV).xyz;
    vec3 normal = normalize(texture(VertexNormalTexture, fragUV).xyz);

    // Get random vector from noise texture
    vec2 noiseUV = fragUV * NoiseScale;
    vec3 randomVec = normalize(texture(NoiseTexture, noiseUV).xyz);

    // Create TBN matrix
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;
    for(int i = 0; i < kernelSize; ++i) {
        // Sample in tangent space
        vec3 sampleVec = TBN * samples[i];
        sampleVec = fragPos + sampleVec * radius;

        // Project sample position (view space) to screen space
        vec4 offset = MatProj * vec4(sampleVec, 1.0);
        offset.xyz /= offset.w;
        vec2 sampleUV = offset.xy * 0.5 + 0.5;

        float sampleDepth = texture(VertexPositionTexture, sampleUV).z;
        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleDepth));
        if((sampleDepth - fragPos.z) >= bias) {
            occlusion += rangeCheck;
        }
    }
    occlusion = 1.0 - (occlusion / float(kernelSize));
    outputColor = occlusion;
}
`;
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
