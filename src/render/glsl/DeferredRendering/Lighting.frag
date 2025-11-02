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
struct DirectionalLight {
    vec3 direction;
    vec3 color;
    float intensity;
};
#define MAX_LIGHTS 100
uniform DirectionalLight directionalLights[MAX_LIGHTS];
uniform Light lights[MAX_LIGHTS];
uniform int numActivePointLights;
uniform int numActiveDirectionalLights;
uniform vec3 cameraPosition;

vec3 getViewPosition(vec2 texCoord) {
    float depth = texture(depthTexture, texCoord).r;
    vec2 ndc = texCoord * 2.0f - 1.0f;
    vec4 clipSpacePos = vec4(ndc, depth * 2.0f - 1.0f, 1.0f);
    vec4 viewSpacePos = projInverse * clipSpacePos;
    return viewSpacePos.xyz / viewSpacePos.w;
}

vec3 getWorldPosition(vec3 viewPos) {
    vec4 worldPos = viewInverse * vec4(viewPos, 1.0f);
    return worldPos.xyz;
}

void main() {
    vec3 fragViewPos = getViewPosition(fragUV);
    vec3 fragWorldPos = getWorldPosition(fragViewPos);
    vec3 viewNormal = normalize(texture(normalTexture, fragUV).rgb);
    vec3 skyColor = vec3(0.5f, 0.7f, 1.0f);

    vec3 worldNormal = normalize(mat3(viewInverse) * viewNormal);

    vec3 albedo = texture(albedoTexture, fragUV).rgb;
    float ambientOcclusion = texture(ssaoTexture, fragUV).r;

    vec3 ambient = (vec3(0.3f) * albedo) * ambientOcclusion;
    vec3 lighting = ambient;

    // Process directional lights
    for(int i = 0; i < numActiveDirectionalLights; i++) {
        vec3 lightDir = normalize(-directionalLights[i].direction);
        float diff = max(dot(lightDir, worldNormal), 0.0f);
        // Diffuse should be multiplied by albedo to get correct surface color
        vec3 diffuse = diff * albedo * directionalLights[i].color * directionalLights[i].intensity;

        vec3 viewDir = normalize(cameraPosition - fragWorldPos);
        vec3 reflectDir = reflect(-lightDir, worldNormal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0f), 16.0f);
        // Specular highlights are typically white/light-colored, not affected by albedo
        vec3 specular = spec * directionalLights[i].color * directionalLights[i].intensity;

        // Directional lights have no attenuation
        lighting += diffuse+specular;
    }

    // Process point lights
    for(int i = 0; i < numActivePointLights; i++) {
        vec3 lightDir = normalize(lights[i].position - fragWorldPos);
        float diff = max(dot(lightDir, worldNormal), 0.0f);
        // Diffuse should be multiplied by albedo to get correct surface color
        vec3 diffuse = diff * albedo * lights[i].color * lights[i].intensity;

        vec3 viewDir = normalize(cameraPosition - fragWorldPos);
        vec3 reflectDir = reflect(-lightDir, worldNormal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0f), 16.0f);
        // Specular highlights are typically white/light-colored, not affected by albedo
        vec3 specular = spec * lights[i].color * lights[i].intensity;

        float distance = length(lights[i].position - fragWorldPos);
        float attenuation = 1.0f / (1.0f + (distance / lights[i].radius) * (distance / lights[i].radius));
        diffuse *= attenuation;
        specular *= attenuation;

        lighting += diffuse + specular;
    }

    if(texture(depthTexture, fragUV).r >= 1.0f) {
        outputColor = vec4(skyColor, 1.0f);
    } else {
        // Clamp lighting to prevent HDR overflow (white spots)
        // If you want HDR support, consider implementing tone mapping instead
        outputColor = vec4(min(lighting, vec3(1.0f)), 1.0f);
    }
}