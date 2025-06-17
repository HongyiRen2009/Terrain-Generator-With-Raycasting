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

export const MeshVertexShaderCode = /*glsl*/ `#version 300 es
precision mediump float;
//If you see lessons that use attribute, that's an old version of Webgl
struct Light {
  vec3 position;
  vec3 color;
  vec3 showColor;
  float intensity;
  float radius;
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

in vec3 fragmentColor;
in vec3 fragmentNormal;
in vec3 fragmentPosition;
out vec4 outputColor;

void main() {
    vec3 normal = normalize(fragmentNormal);
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
        
        vec3 lightDir = normalize(lights[i].position - fragmentPosition);
        float distance = length(lights[i].position - fragmentPosition);
        
        
        // Diffuse lighting
        float diffuseStrength = max(dot(normal, lightDir), 0.1);
        vec3 diffuse = diffuseStrength * lights[i].color * lights[i].intensity;
        totalDiffuse += diffuse;
        
        // Specular lighting (Blinn-Phong)
        vec3 viewDir = normalize(viewPosition - fragmentPosition);
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfwayDir), 0.0), float(shininess));
        specular += spec * lights[i].color * lights[i].intensity * specularStrength;
    }
    
    // Combine lighting components
    vec3 ambient = ambientLight * ambientStrength;
    vec3 lighting = ambient + totalDiffuse + specular;
    
    // Apply lighting to material color
    vec3 finalColor = fragmentColor * lighting;
    
    // Gamma correction
    finalColor = pow(finalColor, vec3(1.0 / 2.2));
    
    outputColor = vec4(finalColor, 1.0);
}`;
