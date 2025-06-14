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
export const MeshVertexShaderCode = /*glsl*/ `#version 300 es
precision mediump float;
//If you see lessons that use attribute, that's an old version of Webgl
struct Light {
    vec3 position;
    vec3 color;
    float intensity;
};
#define MAX_LIGHTS 100
uniform Light lights[MAX_LIGHTS];
in vec4 VertexPosition;
in vec3 VertexNormal;
in vec3 VertexColor;
out vec3 fragmentColor;
out vec3 fragmentNormal;
out vec3 fragmentPosition;
uniform mat4 MatrixTransform;
uniform mat4 matViewProj;

void main() {  
  fragmentColor = VertexColor;
  fragmentNormal = VertexNormal;
  fragmentPosition = VertexPosition.xyz;
  gl_Position = matViewProj*MatrixTransform*VertexPosition;
}
`;

export const MeshFragmentShaderCode = /*glsl*/ `#version 300 es
precision mediump float;

// Define the light structure
struct Light {
    vec3 position;
    vec3 color;
    float intensity;
};

// Declare uniform array of lights and light count
#define MAX_LIGHTS 100
uniform Light lights[MAX_LIGHTS];
uniform int numActiveLights;
uniform vec3 viewPosition; // Camera position for lighting calculations
in vec3 fragmentColor;
in vec3 fragmentNormal;
in vec3 fragmentPosition;
out vec4 outputColor;

void main() {
    vec3 specular = vec3(0.0);
    vec3 totalDiffuse = vec3(0.0);
    vec3 normal = normalize(fragmentNormal);
    float metalic = 0.2; // Will be changed to input value later
    int metallicValue = int(mix(32.0, 128.0, clamp(metalic, 0.0, 1.0)));// Shininess factor for specular highlights
    float roughnessValue = 0.8; // Roughness factor for diffuse lighting, will be changed to input value later
    // Calculate lighting contribution from each light
    for(int i = 0; i < MAX_LIGHTS; i++) {
        if(i >= numActiveLights) break;
        
        vec3 lightDir = normalize(lights[i].position - fragmentPosition);
        float diffuseStrength = max(dot(normal, lightDir), 0.2);
        totalDiffuse += diffuseStrength * lights[i].color * lights[i].intensity;
          // View and halfway vector for Blinn-Phong
          vec3 viewDir = normalize(viewPosition - fragmentPosition);
          vec3 halfwayDir = normalize(lightDir + viewDir);

          float spec = pow(max(dot(normal, halfwayDir), 0.0), float(metallicValue));
          specular+= spec * lights[i].color * lights[i].intensity* (1.0 - roughnessValue); // Specular highlight
    }
    
    // Apply lighting and gamma correction
    vec3 lighting = totalDiffuse + specular;
    vec3 finalColor = fragmentColor * lighting;
    
    // Apply gamma correction component-wise
    finalColor = vec3(pow(finalColor.r, 1.0 / 2.2), pow(finalColor.g, 1.0 / 2.2), pow(finalColor.b, 1.0 / 2.2));
    
    outputColor = vec4(finalColor, 1.0);
}`;