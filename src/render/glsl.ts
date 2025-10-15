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
//
export const MeshGeometryVertexShaderCode = /* glsl */ `#version 300 es
precision highp float;

in vec3 VertexPosition;
in vec3 VertexNormal;
in vec3 VertexColor;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;

out vec3 vViewNormal;
out vec3 vAlbedo;
out vec4 vViewPos;

void main() {
    // Transform position to view space for depth reconstruction
    vec4 worldPos = uModel * vec4(VertexPosition, 1.0);
    vViewPos = uView * worldPos;
    
    // Transform normals to world space and then to view space
    mat3 normalMatrix = mat3(transpose(inverse(uView * uModel)));
    vViewNormal = normalize(normalMatrix * VertexNormal);
    
    // Pass through albedo (using vertex color)
    vAlbedo = VertexColor;
    
    gl_Position = uProj * vViewPos;
}
`;

export const MeshGeometryFragmentShaderCode = /* glsl */ `#version 300 es 
precision highp float;

in vec3 vViewNormal;
in vec3 vAlbedo;
in vec4 vViewPos;

layout(location = 0) out vec4 outNormal;
layout(location = 1) out vec4 outAlbedo;

void main() {
    // Store view-space normals (normalized)
    outNormal = vec4(normalize(vViewNormal), 1.0);
    
    // Store albedo color
    outAlbedo = vec4(vAlbedo, 1.0);
    
    // Depth is automatically written to the depth buffer
    // For depth reconstruction in SSAO, we'll use gl_FragCoord.z
}
`;
export const MeshSSAOVertexShaderCode = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec3 VertexPosition;
layout(location = 1) in vec2 VertexUV;
out vec2 vUV;
void main() {
    vUV = VertexUV;
    gl_Position = vec4(VertexPosition, 1.0);
}
`;
export const MeshSSAOFragmentShaderCode = /* glsl */ `#version 300 es
precision highp float;
#define NUM_SAMPLES 64
in vec2 vUV;
out float ssao;
uniform sampler2D uNormalTex;
uniform sampler2D uDepthTex;
uniform sampler2D uNoiseTex;
uniform float uNoiseSize;
uniform vec3 uSamples[64];
uniform mat4 uProj;
uniform mat4 uProjInverse;
uniform float radius;
uniform float bias;
// Improved depth reconstruction function
vec3 getViewPosition(vec2 texCoord) {
    float depth = texture(uDepthTex, texCoord).r;
    
    // Convert screen coordinates to NDC
    vec2 ndc = texCoord * 2.0 - 1.0;
    
    // Create clip space position
    vec4 clipSpacePos = vec4(ndc, depth * 2.0 - 1.0, 1.0);
    
    // Transform to view space
    vec4 viewSpacePos = uProjInverse * clipSpacePos;
    
    // Perspective divide
    return viewSpacePos.xyz / viewSpacePos.w;
}

void main() {
    vec2 noiseScale = vec2(textureSize(uDepthTex, 0)) / uNoiseSize;
    
    vec3 fragPos = getViewPosition(vUV);
    vec3 normal = normalize(texture(uNormalTex, vUV).rgb);
    vec3 randomVec = normalize(texture(uNoiseTex, vUV * noiseScale).xyz);

    // Create TBN matrix - ensure proper hemisphere orientation
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);
    
    float occlusion = 0.0;
    
    for(int i = 0; i < NUM_SAMPLES; i++) {
        // Get sample position in hemisphere around surface normal
        vec3 samplePos = TBN * uSamples[i];
        samplePos = fragPos + samplePos * radius;

        // Project sample position to screen space
        vec4 offset = uProj * vec4(samplePos, 1.0);
        offset.xyz /= offset.w;
        offset.xyz = offset.xyz * 0.5 + 0.5;

        // Skip samples outside screen bounds
        if (offset.x < 0.0 || offset.x > 1.0 || offset.y < 0.0 || offset.y > 1.0) {
            continue;
        }

        // Get sample depth
        float sampleDepth = getViewPosition(offset.xy).z;
        if(texture(uDepthTex, offset.xy).r>=1.0) continue; // Ignore far plane samples
        // Range check to avoid artifacts from distant geometry
        float rangeCheck= abs(fragPos.z - sampleDepth) < radius ? 1.0 : 0.0;
        occlusion += (sampleDepth >= samplePos.z+bias ? 1.0 : 0.0) * rangeCheck;
    }
    
    occlusion = 1.0 - (occlusion / float(NUM_SAMPLES));
    ssao = occlusion;
}
`;
export const MeshSSAOBlurVertexShaderCode = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec3 VertexPosition;
layout(location = 1) in vec2 VertexUV;
out vec2 vUV;
void main() {
    vUV = VertexUV;
    gl_Position = vec4(VertexPosition, 1.0);
}
`;
export const MeshSSAOBlurFragmentShaderCode = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
out float ssaoBlur;
uniform sampler2D ssaoInput;
uniform sampler2D depthInput; // Add this uniform for depth-based bilateral filtering
uniform bool enableBlur;

const int KERNEL_RADIUS = 2; // 5x5 kernel
const float sigma_spatial = 2.0;
const float sigma_depth = 0.1;

void main() {
    if (!enableBlur) {
        ssaoBlur = texture(ssaoInput, vUV).r;
        return;
    }

    float centerSSAO = texture(ssaoInput, vUV).r;
    float centerDepth = texture(depthInput, vUV).r;
    vec2 texelSize = 1.0 / vec2(textureSize(ssaoInput, 0));

    float sum = 0.0;
    float weightSum = 0.0;

    for (int y = -KERNEL_RADIUS; y <= KERNEL_RADIUS; ++y) {
        for (int x = -KERNEL_RADIUS; x <= KERNEL_RADIUS; ++x) {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            float sampleSSAO = texture(ssaoInput, vUV + offset).r;
            float sampleDepth = texture(depthInput, vUV + offset).r;

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
layout(location = 0) in vec3 VertexPosition;
layout(location = 1) in vec2 VertexUV;
out vec2 vUV;
void main() {
    vUV = VertexUV;
    gl_Position = vec4(VertexPosition, 1.0);
}
`;

export const MeshLightingFragmentShaderCode = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 outputColor;
uniform sampler2D gNormal;
uniform sampler2D gAlbedo;
uniform sampler2D gDepth;
uniform sampler2D ssao;
uniform mat4 uViewInverse;
uniform mat4 uProjInverse;
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
uniform vec3 viewPos; // Camera position in world space

// Use the same depth reconstruction function as SSAO
vec3 getViewPosition(vec2 texCoord) {
    float depth = texture(gDepth, texCoord).r;
    
    // Convert screen coordinates to NDC
    vec2 ndc = texCoord * 2.0 - 1.0;
    
    // Create clip space position
    vec4 clipSpacePos = vec4(ndc, depth * 2.0 - 1.0, 1.0);
    
    // Transform to view space
    vec4 viewSpacePos = uProjInverse * clipSpacePos;
    
    // Perspective divide
    return viewSpacePos.xyz / viewSpacePos.w;
}

vec3 getWorldPosition(vec3 viewPos) {
    vec4 worldPos = uViewInverse * vec4(viewPos, 1.0);
    return worldPos.xyz;
}

void main() {
    vec3 fragViewPos = getViewPosition(vUV);
    vec3 fragWorldPos = getWorldPosition(fragViewPos);
    vec3 viewNormal = normalize(texture(gNormal, vUV).rgb);
    vec3 skyColor = vec3(0.5, 0.7, 1.0); // Light blue sky color
    
    // Transform normal back to world space for lighting calculations
    vec3 worldNormal = normalize(mat3(uViewInverse) * viewNormal);
    
    vec3 albedo = texture(gAlbedo, vUV).rgb;
    float ambientOcclusion = texture(ssao, vUV).r;
    
    vec3 ambient = (vec3(0.3) * albedo) * ambientOcclusion; // Ambient light with SSAO
    vec3 lighting = ambient;
    
    for(int i = 0; i < numActiveLights; i++) {
        // Diffuse
        vec3 lightDir = normalize(lights[i].position - fragWorldPos);
        float diff = max(dot(lightDir, worldNormal), 0.0);
        vec3 diffuse = diff * lights[i].color * lights[i].intensity;

        // Specular
        vec3 viewDir = normalize(viewPos - fragWorldPos);
        vec3 reflectDir = reflect(-lightDir, worldNormal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0); // Shininess hardcoded to 16
        vec3 specular = spec * lights[i].color * lights[i].intensity;
        
        // Attenuation
        float distance = length(lights[i].position - fragWorldPos);
        float attenuation = 1.0 / (1.0 + (distance / lights[i].radius) * (distance / lights[i].radius));
        diffuse *= attenuation;
        specular *= attenuation;

        lighting += (diffuse + specular) * ambient;
    }

    if(texture(gDepth, vUV).r>=1.0) { // Background
        outputColor = vec4(skyColor,1.0);
    }
    else{
        outputColor = vec4(lighting, 1.0);
    }
}
`;
