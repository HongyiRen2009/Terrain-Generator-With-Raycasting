#version 300 es
precision highp float;
in vec2 fragUV;
out vec4 outputColor;
uniform sampler2D normalTexture;
uniform sampler2D albedoTexture;
uniform sampler2D depthTexture;
uniform sampler2D ssaoTexture;

uniform sampler2D cascadeDepthTexture0;
uniform sampler2D cascadeDepthTexture1;
uniform sampler2D cascadeDepthTexture2;


uniform mat4 viewInverse;
uniform mat4 projInverse;

//Shadow Uniforms
uniform mat4 lightSpaceMatrices[3];
uniform float cascadeSplits[3];
uniform bool usingPCF;
uniform float shadowBias;
uniform int shadowMapSize;

uniform bool csmEnabled;
uniform bool cascadeDebug;
uniform bool showShadowMap;
uniform int shadowMapCascade;

struct PointLight {
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
uniform PointLight pointLights[MAX_LIGHTS];
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

int chooseCascade (float viewDepth) {
    // View depth is negative (camera looks down -Z), cascade splits are positive distances
    float depth = abs(viewDepth);
    if (depth < cascadeSplits[0]) return 0;
    else if (depth < cascadeSplits[1]) return 1;
    else return 2;
}

float computeShadow(vec3 worldPos, int cascadeIndex){
    // If CSM is disabled, return no shadow
    if (!csmEnabled) {
        return 1.0;
    }
    
    //World Space to Light Space
    vec4 lp = lightSpaceMatrices[cascadeIndex] * vec4(worldPos, 1.0);
    vec3 projCoords = lp.xyz / lp.w; // NDC

    //NDC to UV
    projCoords = projCoords * 0.5 + 0.5;
    
    // Check if fragment is outside the shadow map bounds
    if(projCoords.x < 0.0 || projCoords.x > 1.0 || 
       projCoords.y < 0.0 || projCoords.y > 1.0 ||
       projCoords.z < 0.0 || projCoords.z > 1.0) {
        // Fragment is outside shadow map, consider it lit (or in shadow based on your preference)
        return 1.0; // Return lit for fragments outside the shadow frustum
    }

    if (usingPCF){
        float shadow = 0.0;
        int samples = 0;

        float texelSize = 1.0 / float(shadowMapSize); 

        for (int x = -1; x <= 1; ++x) {
            for (int y = -1; y <= 1; ++y) {
                vec2 offset = vec2(x, y) * texelSize;
                float depth;
                if(cascadeIndex == 0) {
                    depth = texture(cascadeDepthTexture0, projCoords.xy + offset).r;
                } else if(cascadeIndex == 1) {
                    depth = texture(cascadeDepthTexture1, projCoords.xy + offset).r;
                } else {
                    depth = texture(cascadeDepthTexture2, projCoords.xy + offset).r;
                }
                // If current depth is greater than shadow map depth, fragment is in shadow
                shadow += (projCoords.z - shadowBias > depth) ? 1.0 : 0.0;
                samples++;
            }
        }

        shadow /= float(samples);
        // shadow is 1.0 = fully shadowed, 0.0 = fully lit
        // Return inverted: 0.0 = in shadow, 1.0 = lit (for lighting multiplication)
        return 1.0 - shadow;
    }

    float currentDepth = projCoords.z;
    float closestDepth;
    if(cascadeIndex == 0) {
        closestDepth = texture(cascadeDepthTexture0, projCoords.xy).r;
    } else if(cascadeIndex == 1) {
        closestDepth = texture(cascadeDepthTexture1, projCoords.xy).r;
    } else {
        closestDepth = texture(cascadeDepthTexture2, projCoords.xy).r;
    }


    // Shadow calculation: if current depth (point being tested) is greater than 
    // the closest depth in shadow map + bias, it's in shadow
    // Return 0.0 = in shadow, 1.0 = lit (for lighting multiplication)
    return (currentDepth - shadowBias > closestDepth) ? 0.0 : 1.0;
}

void main() {
    // Shadow Map Visualization Mode - Display the raw shadow map texture directly
    if (showShadowMap && csmEnabled) {
        // Directly visualize the shadow map texture at screen coordinates
        // This shows what the light "sees" - the entire shadow map texture
        vec2 shadowUV = fragUV;
        
        float shadowDepth;
        if (shadowMapCascade == 0) {
            shadowDepth = texture(cascadeDepthTexture0, shadowUV).r;
        } else if (shadowMapCascade == 1) {
            shadowDepth = texture(cascadeDepthTexture1, shadowUV).r;
        } else {
            shadowDepth = texture(cascadeDepthTexture2, shadowUV).r;
        }
        
        // Visualize depth directly - shows raw depth values
        // 0.0 = near plane (black), 1.0 = far plane/uninitialized (white)
        // If all white, the shadow map isn't being written to (stays at clear value 1.0)
        vec3 color = vec3(shadowDepth);
        
        outputColor = vec4(color, 1.0);
        return;
    }
    
    vec3 fragViewPos = getViewPosition(fragUV);
    vec3 fragWorldPos = getWorldPosition(fragViewPos);
    vec3 viewNormal = normalize(texture(normalTexture, fragUV).rgb);
    vec3 skyColor = vec3(0.5f, 0.7f, 1.0f);

    vec3 worldNormal = normalize(mat3(viewInverse) * viewNormal);

    vec3 albedo = texture(albedoTexture, fragUV).rgb;
    float ambientOcclusion = texture(ssaoTexture, fragUV).r;

    int cascadeIndex = chooseCascade(fragViewPos.z);
    float shadow = computeShadow(fragWorldPos, cascadeIndex);

    // Replace albedo with debug colors when cascade debug is enabled
    if (cascadeDebug && csmEnabled) {
        if (cascadeIndex == 0) {
            albedo = vec3(1.0, 0.0, 1.0); // Magenta
        } else if (cascadeIndex == 1) {
            albedo = vec3(0.0, 1.0, 1.0); // Cyan
        } else {
            albedo = vec3(1.0, 1.0, 0.0); // Yellow
        }
    }

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
        lighting += (diffuse+specular) * shadow;
    }

    // Process point lights
    for(int i = 0; i < numActivePointLights; i++) {
        vec3 lightDir = normalize(pointLights[i].position - fragWorldPos);
        float diff = max(dot(lightDir, worldNormal), 0.0f);
        // Diffuse should be multiplied by albedo to get correct surface color
        vec3 diffuse = diff * albedo * pointLights[i].color * pointLights[i].intensity;

        vec3 viewDir = normalize(cameraPosition - fragWorldPos);
        vec3 reflectDir = reflect(-lightDir, worldNormal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0f), 16.0f);
        // Specular highlights are typically white/light-colored, not affected by albedo
        vec3 specular = spec *pointLights[i].color * pointLights[i].intensity;

        float distance = length(pointLights[i].position - fragWorldPos);
        float attenuation = 1.0f / (1.0f + (distance / pointLights[i].radius) * (distance / pointLights[i].radius));
        diffuse *= attenuation;
        specular *= attenuation;

        lighting += (diffuse + specular) * shadow;
    }

    if(texture(depthTexture, fragUV).r >= 1.0f) {
        outputColor = vec4(skyColor, 1.0f);
    } else {
        // Clamp lighting to prevent HDR overflow (white spots)
        // If you want HDR support, consider implementing tone mapping instead
        outputColor = vec4(min(lighting, vec3(1.0f)), 1.0f);
    }
}