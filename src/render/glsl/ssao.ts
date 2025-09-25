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