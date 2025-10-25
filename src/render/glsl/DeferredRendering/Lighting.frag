#version 300 es
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