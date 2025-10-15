export const CubeVertexShaderCode = /*glsl*/ `#version 300 es
precision mediump float;
in vec4 position;
in vec3 color;
out vec3 fragmentColor;
uniform mat4 transform;
uniform mat4 viewProj;

void main() {  
  fragmentColor = color;
  gl_Position = viewProj * transform * position;
}
`;

export const CubeFragmentShaderCode = /*glsl*/ `#version 300 es
precision mediump float;

in vec3 fragmentColor;
out vec4 outputColor;

void main() {
  outputColor = vec4(fragmentColor, 1);
}`;

export const MeshGeometryVertexShaderCode = /* glsl */ `#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
in vec3 color;

uniform mat4 model;
uniform mat4 view;
uniform mat4 proj;

out vec3 viewNormal;
out vec3 albedo;
out vec4 viewPos;

void main() {
    vec4 worldPos = model * vec4(position, 1.0);
    viewPos = view * worldPos;
    
    mat3 normalMatrix = mat3(transpose(inverse(view * model)));
    viewNormal = normalize(normalMatrix * normal);
    
    albedo = color;
    
    gl_Position = proj * viewPos;
}
`;

export const MeshGeometryFragmentShaderCode = /* glsl */ `#version 300 es 
precision highp float;

in vec3 viewNormal;
in vec3 albedo;
in vec4 viewPos;

layout(location = 0) out vec4 outNormal;
layout(location = 1) out vec4 outAlbedo;

void main() {
    outNormal = vec4(normalize(viewNormal), 1.0);
    outAlbedo = vec4(albedo, 1.0);
}
`;

export const MeshSSAOVertexShaderCode = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;
out vec2 fragUV;
void main() {
    fragUV = uv;
    gl_Position = vec4(position, 1.0);
}
`;

export const MeshSSAOFragmentShaderCode = /* glsl */ `#version 300 es
precision highp float;
#define NUM_SAMPLES 64
in vec2 fragUV;
out float ssao;
uniform sampler2D normalTexture;
uniform sampler2D depthTexture;
uniform sampler2D noiseTexture;
uniform float noiseSize;
uniform vec3 samples[64];
uniform mat4 proj;
uniform mat4 projInverse;
uniform float radius;
uniform float bias;

vec3 getViewPosition(vec2 texCoord) {
    float depth = texture(depthTexture, texCoord).r;
    vec2 ndc = texCoord * 2.0 - 1.0;
    vec4 clipSpacePos = vec4(ndc, depth * 2.0 - 1.0, 1.0);
    vec4 viewSpacePos = projInverse * clipSpacePos;
    return viewSpacePos.xyz / viewSpacePos.w;
}

void main() {
    vec2 noiseScale = vec2(textureSize(depthTexture, 0)) / noiseSize;
    
    vec3 fragPos = getViewPosition(fragUV);
    vec3 normal = normalize(texture(normalTexture, fragUV).rgb);
    vec3 randomVec = normalize(texture(noiseTexture, fragUV * noiseScale).xyz);

    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);
    
    float occlusion = 0.0;
    
    for(int i = 0; i < NUM_SAMPLES; i++) {
        vec3 samplePos = TBN * samples[i];
        samplePos = fragPos + samplePos * radius;

        vec4 offset = proj * vec4(samplePos, 1.0);
        offset.xyz /= offset.w;
        offset.xyz = offset.xyz * 0.5 + 0.5;

        if (offset.x < 0.0 || offset.x > 1.0 || offset.y < 0.0 || offset.y > 1.0) {
            continue;
        }

        float sampleDepth = getViewPosition(offset.xy).z;
        if(texture(depthTexture, offset.xy).r>=1.0) continue;
        float rangeCheck= abs(fragPos.z - sampleDepth) < radius ? 1.0 : 0.0;
        occlusion += (sampleDepth >= samplePos.z+bias ? 1.0 : 0.0) * rangeCheck;
    }
    
    occlusion = 1.0 - (occlusion / float(NUM_SAMPLES));
    ssao = occlusion;
}
`;

export const MeshSSAOBlurVertexShaderCode = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;
out vec2 fragUV;
void main() {
    fragUV = uv;
    gl_Position = vec4(position, 1.0);
}
`;

export const MeshSSAOBlurFragmentShaderCode = /* glsl */ `#version 300 es
precision highp float;
in vec2 fragUV;
out float ssaoBlur;
uniform sampler2D ssaoTexture;
uniform sampler2D depthTexture;
uniform bool enableBlur;

const int KERNEL_RADIUS = 2;
const float sigma_spatial = 2.0;
const float sigma_depth = 0.1;

void main() {
    if (!enableBlur) {
        ssaoBlur = texture(ssaoTexture, fragUV).r;
        return;
    }

    float centerSSAO = texture(ssaoTexture, fragUV).r;
    float centerDepth = texture(depthTexture, fragUV).r;
    vec2 texelSize = 1.0 / vec2(textureSize(ssaoTexture, 0));

    float sum = 0.0;
    float weightSum = 0.0;

    for (int y = -KERNEL_RADIUS; y <= KERNEL_RADIUS; ++y) {
        for (int x = -KERNEL_RADIUS; x <= KERNEL_RADIUS; ++x) {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            float sampleSSAO = texture(ssaoTexture, fragUV + offset).r;
            float sampleDepth = texture(depthTexture, fragUV + offset).r;

            float spatialWeight = exp(-float(x * x + y * y) / (2.0 * sigma_spatial * sigma_spatial));
            float depthWeight = exp(-pow(sampleDepth - centerDepth, 2.0) / (2.0 * sigma_depth * sigma_depth));
            float weight = spatialWeight * depthWeight;

            sum += sampleSSAO * weight;
            weightSum += weight;
        }
    }
    ssaoBlur = sum / weightSum;
}`;

export const MeshLightingVertexShaderCode = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;
out vec2 fragUV;
void main() {
    fragUV = uv;
    gl_Position = vec4(position, 1.0);
}
`;

export const MeshLightingFragmentShaderCode = /* glsl */ `#version 300 es
precision highp float;
in vec2 fragUV;
out vec4 outputColor;
uniform sampler2D normalTexture;
uniform sampler2D albedoTexture;
uniform sampler2D depthTexture;
uniform sampler2D ssaoTexture;
uniform mat4 viewInverse;
uniform mat4 projInverse;
struct Light {
  vec3 position;
  vec3 color;
  vec3 showColor;
  float intensity;
  float radius;
};
#define MAX_LIGHTS 100

uniform Light lights[MAX_LIGHTS];
uniform int numActiveLights;
uniform vec3 cameraPosition;

vec3 getViewPosition(vec2 texCoord) {
    float depth = texture(depthTexture, texCoord).r;
    vec2 ndc = texCoord * 2.0 - 1.0;
    vec4 clipSpacePos = vec4(ndc, depth * 2.0 - 1.0, 1.0);
    vec4 viewSpacePos = projInverse * clipSpacePos;
    return viewSpacePos.xyz / viewSpacePos.w;
}

vec3 getWorldPosition(vec3 viewPos) {
    vec4 worldPos = viewInverse * vec4(viewPos, 1.0);
    return worldPos.xyz;
}

void main() {
    vec3 fragViewPos = getViewPosition(fragUV);
    vec3 fragWorldPos = getWorldPosition(fragViewPos);
    vec3 viewNormal = normalize(texture(normalTexture, fragUV).rgb);
    vec3 skyColor = vec3(0.5, 0.7, 1.0);
    
    vec3 worldNormal = normalize(mat3(viewInverse) * viewNormal);
    
    vec3 albedo = texture(albedoTexture, fragUV).rgb;
    float ambientOcclusion = texture(ssaoTexture, fragUV).r;
    
    vec3 ambient = (vec3(0.3) * albedo) * ambientOcclusion;
    vec3 lighting = ambient;
    
    for(int i = 0; i < numActiveLights; i++) {
        vec3 lightDir = normalize(lights[i].position - fragWorldPos);
        float diff = max(dot(lightDir, worldNormal), 0.0);
        vec3 diffuse = diff * lights[i].color * lights[i].intensity;

        vec3 viewDir = normalize(cameraPosition - fragWorldPos);
        vec3 reflectDir = reflect(-lightDir, worldNormal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);
        vec3 specular = spec * lights[i].color * lights[i].intensity;
        
        float distance = length(lights[i].position - fragWorldPos);
        float attenuation = 1.0 / (1.0 + (distance / lights[i].radius) * (distance / lights[i].radius));
        diffuse *= attenuation;
        specular *= attenuation;

        lighting += (diffuse + specular) * ambient;
    }

    if(texture(depthTexture, fragUV).r>=1.0) {
        outputColor = vec4(skyColor,1.0);
    }
    else{
        outputColor = vec4(lighting, 1.0);
    }
}
`;
