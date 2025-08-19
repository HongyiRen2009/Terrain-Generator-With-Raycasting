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

in vec4 aPosition;
in vec3 aNormal;
in vec3 aColor;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;

out vec4 vWorldPosition;  // World space position
out vec4 vViewPosition;   // View space position  
out vec3 vWorldNormal;    // World space normal
out vec3 vColor;

void main(){
  // Calculate world space position and normal
  vWorldPosition = uModel * aPosition;
  vWorldNormal = mat3(uModel) * aNormal;
  
  // Calculate view space position
  vViewPosition = uView * vWorldPosition;
  
  vColor = aColor;
  gl_Position = uProj * vViewPosition;
}`;

export const MeshGeometryFragmentShaderCode = /* glsl */ `#version 300 es 
precision highp float;

layout(location = 0) out vec4 gPosition;
layout(location = 1) out vec4 gNormal;
layout(location = 2) out vec4 gAlbedo;

in vec4 vWorldPosition;
in vec4 vViewPosition;
in vec3 vWorldNormal;
in vec3 vColor;

void main(){
  // Store view space position for SSAO (more stable than world space)
  gPosition = vViewPosition;
  
  // Store view space normal (normalize and encode)
  vec3 viewNormal = normalize(vWorldNormal);
  gNormal = vec4(viewNormal * 0.5 + 0.5, 1.0);
  
  gAlbedo = vec4(vColor, 1.0);
}`;

export const MeshSSAOVertexShaderCode = /* glsl */ `#version 300 es
precision highp float;

in vec2 aPosition;

out vec2 vTexCoords;

void main() {
    // Convert from clip space [-1, 1] to UV space [0, 1]
    vTexCoords = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const MeshSSAOFragmentShaderCode = /* glsl */ `#version 300 es
precision highp float;

#define NUM_SAMPLES 16

in vec2 vTexCoords;
out float ssao;


uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D texNoise;

uniform mat4 uProj;
uniform vec3 samples[NUM_SAMPLES];
uniform vec2 noiseScale;

const float radius = 0.5;
const float bias = 0.025;

void main(){
  vec3 fragPos = texture(gPosition, vTexCoords).xyz;
  vec3 normal = normalize(texture(gNormal, vTexCoords).xyz * 2.0 - 1.0);
  vec3 randomVec = texture(texNoise, vTexCoords * noiseScale).xyz;
  
  //Create TBN Roration Matrix
  vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
  vec3 bitangent = cross(normal, tangent);
  mat3 TBN = mat3(tangent, bitangent, normal);
  
  float occlusion = 0.0;
  for (int i = 0; i < 16; ++i) {
    // Sample vector in view space
    vec3 samplePos = TBN * samples[i];
    samplePos = fragPos + samplePos * radius;

    // project sample position (to get screen-space coords)
    vec4 offset = uProj * vec4(samplePos, 1.0);
    offset.xyz /= offset.w;
    offset.xyz = offset.xyz * 0.5 + 0.5;

    float sampleDepth = texture(gPosition, offset.xy).z;

    float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleDepth));
    if ((sampleDepth + bias) < samplePos.z) {
      occlusion += rangeCheck;
    }
  }

  occlusion = 1.0 - (occlusion / 16.0);
  ssao = occlusion;
}
`;

export const MeshLightingVertexShaderCode = /* glsl */ `#version 300 es
precision highp float;

in vec2 aPosition;
out vec2 vTexCoords;

void main() {
    vTexCoords = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export const MeshLightingFragmentShaderCode = /* glsl */ `#version 300 es
precision highp float;

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
uniform vec3 viewPosition;

uniform sampler2D gPosition;   // World/view-space positions
uniform sampler2D gNormal;     // World/view-space normals
uniform sampler2D gAlbedo;     // Albedo/color buffer
uniform sampler2D ssao;        // SSAO occlusion
uniform mat4 uView;
in vec2 vTexCoords;
out vec4 fragColor;

void main() {
mat4 inverseViewMatrix = inverse(uView);
    
    // Convert vec3 to vec4 for matrix multiplication, then back to vec3
    vec3 viewSpacePos = texture(gPosition, vTexCoords).xyz;
    vec3 fragPos = (inverseViewMatrix * vec4(viewSpacePos, 1.0)).xyz;
    
    // For normals, use w=0.0 since they're directions, not positions
    vec3 viewSpaceNormal = normalize(texture(gNormal, vTexCoords).xyz * 2.0 - 1.0);
    vec3 normal = (inverseViewMatrix * vec4(viewSpaceNormal, 0.0)).xyz;
    vec3 albedo = texture(gAlbedo, vTexCoords).rgb;
    float occlusion = texture(ssao, vTexCoords).r;

    vec3 specular = vec3(0.0);
    vec3 totalDiffuse = vec3(0.0);

    float ambientStrength = 0.15;
    vec3 ambientLight = vec3(0.4, 0.45, 0.5);

    float metallic = 0.1;
    float roughness = 0.7;
    float specularStrength = mix(0.04, 0.9, metallic);
    int shininess = int(mix(2.0, 32.0, 1.0 - roughness));

    for(int i = 0; i < MAX_LIGHTS; i++) {
        if(i >= numActiveLights) break;

        vec3 lightDir = normalize(lights[i].position - fragPos);
        float distance = length(lights[i].position - fragPos);

        // Diffuse lighting
        float diffuseStrength = max(dot(normal, lightDir), 0.1);
        vec3 diffuse = diffuseStrength * lights[i].color * lights[i].intensity;
        totalDiffuse += diffuse;

        // Specular lighting (Blinn-Phong)
        vec3 viewDir = normalize(viewPosition - fragPos);
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfwayDir), 0.0), float(shininess));
        specular += spec * lights[i].color * lights[i].intensity * specularStrength;
    }

    // Combine lighting components
    vec3 ambient = ambientLight * ambientStrength * occlusion;
    vec3 lighting = ambient + totalDiffuse + specular;

    // Apply lighting to material color
    vec3 finalColor = albedo * lighting;

    // Gamma correction
    finalColor = pow(finalColor, vec3(1.0 / 2.2));

    fragColor = vec4(finalColor, 1.0);
}
`;
