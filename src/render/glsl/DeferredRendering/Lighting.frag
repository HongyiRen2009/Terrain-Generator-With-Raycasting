#version 300 es
precision highp float;

#define MAX_LIGHTS 100
#define MAX_SHADOWED_POINT_LIGHTS 5
in vec2 fragUV;
out vec4 outputColor;
uniform samplerCube pointShadowTexture[MAX_SHADOWED_POINT_LIGHTS];
uniform sampler2D normalTexture;
uniform sampler2D albedoTexture;
uniform sampler2D depthTexture;
uniform sampler2D ssaoTexture;

uniform highp sampler2DArray shadowDepthTextureArray;

uniform mat4 viewInverse;
uniform mat4 projInverse;


uniform mat4 pausedView;

//Shadow Uniforms
uniform mat4 lightSpaceMatrices[8]; // Support up to 8 cascades
uniform float cascadeSplits[8]; // Support up to 8 cascades
uniform bool usingPCF;
uniform float csmShadowBias[8]; // One bias per cascade for CSM
uniform int csmShadowMapSize;
uniform int numCascades;

uniform bool csmEnabled;
uniform bool cascadeDebug;
uniform bool debugPauseMode;
uniform bool showShadowMap;
uniform int shadowMapCascade;
uniform bool showCameraDepth;
uniform float pointShadowBias;
uniform int numShadowedLights;
uniform int pointLightShowShadowMap[MAX_LIGHTS];
uniform int cubeMapSize;

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

uniform DirectionalLight SunLight;
uniform PointLight pointLights[MAX_LIGHTS];
uniform int numActivePointLights;
uniform vec3 cameraPosition;

vec3 getViewPosition(vec2 texCoord, mat4 projectionInverse) {
    float depth = texture(depthTexture, texCoord).r;
    vec2 ndc = texCoord * 2.0f - 1.0f;
    vec4 clipSpacePos = vec4(ndc, depth * 2.0f - 1.0f, 1.0f);
    vec4 viewSpacePos = projectionInverse * clipSpacePos;
    return viewSpacePos.xyz / viewSpacePos.w;
}

vec3 getWorldPosition(vec3 viewPos, mat4 viewInverseMatrix) {
    vec4 worldPos = viewInverseMatrix * vec4(viewPos, 1.0f);
    return worldPos.xyz;
}

int chooseCascade (float viewDepth) {
    // View depth is negative (camera looks down -Z), cascade splits are positive distances
    float depth = abs(viewDepth);
    for (int i = 0; i < 8; i++) {
        if (i >= numCascades) break;
        if (depth < cascadeSplits[i]) return i;
    }
    return numCascades - 1; // Return last cascade if beyond all splits
}

float computePointShadow(vec3 worldPos, int lightIndex){
    vec3 toFrag = worldPos - pointLights[lightIndex].position;
    float currentDist = length(toFrag);
    // Shadow map covers 3x radius, but we only apply shadows where light has meaningful contribution
    // Beyond 3x radius, consider it fully lit (light attenuation is negligible anyway)
    float shadowMapRange = pointLights[lightIndex].radius * 3.0;
    if (currentDist > shadowMapRange) {
        return 1.0;
    }

    if (usingPCF){
        float shadow = 0.0;

        vec3 forward = normalize(toFrag);
        vec3 right = normalize(cross(forward,vec3(0.0,1.0,0.0)));
        vec3 up = normalize(cross(forward,right));
        float texelSize = 1.0 / float(cubeMapSize);
        for (int x = -1; x <= 1; x++) {
            for (int y = -1; y <= 1; y++) {
                vec3 offsetDir = forward 
                    + right * (float(x)*texelSize)
                    + up * (float(y)*texelSize);
                float stored;
                offsetDir = normalize(offsetDir);
                switch(lightIndex) {
                    case 0: stored = texture(pointShadowTexture[0], offsetDir).r; break;
                    case 1: stored = texture(pointShadowTexture[1], offsetDir).r; break;
                    case 2: stored = texture(pointShadowTexture[2], offsetDir).r; break;
                    case 3: stored = texture(pointShadowTexture[3], offsetDir).r; break;
                    case 4: stored = texture(pointShadowTexture[4], offsetDir).r; break;
                    default: return 1.0;    
                }
                stored = stored * shadowMapRange;
                if (currentDist - pointShadowBias * shadowMapRange > stored) shadow += 1.0;
            }
        }
        shadow /= 9.0;
        // shadow is 1.0 = fully shadowed, 0.0 = fully lit
        // Return inverted: 1.0 = lit, 0.0 = shadowed (matching non-PCF behavior)
        return 1.0 - shadow;
    }
    else{
        // Cannot dynamically index sampler arrays in GLSL ES 3.00
        // Use switch with constant indices
        float stored;
        switch(lightIndex) {
            case 0: stored = texture(pointShadowTexture[0], toFrag).r; break;
            case 1: stored = texture(pointShadowTexture[1], toFrag).r; break;
            case 2: stored = texture(pointShadowTexture[2], toFrag).r; break;
            case 3: stored = texture(pointShadowTexture[3], toFrag).r; break;
            case 4: stored = texture(pointShadowTexture[4], toFrag).r; break;
            default: return 1.0; // No shadow for lights beyond supported range
        }
        
        // Convert stored normalized depth back to world distance
        // stored is normalized by 3x radius, so multiply by 3x radius
        stored = stored * shadowMapRange;
        
        float shadow = (currentDist - pointShadowBias * shadowMapRange > stored) ? 0.0 : 1.0;
        return shadow;
    }
}

float computeSunShadow(vec3 worldPos, int cascadeIndex){
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

        float texelSize = 1.0 / float(csmShadowMapSize); 

        for (int x = -2; x <= 2; ++x) {
            for (int y = -2; y <= 2; ++y) {
                vec2 offset = vec2(x, y) * texelSize;
                // Use texture array with layer index
                float depth = texture(shadowDepthTextureArray, vec3(projCoords.xy + offset, float(cascadeIndex))).r;
                // If current depth is greater than shadow map depth, fragment is in shadow
                shadow += (projCoords.z - csmShadowBias[cascadeIndex] > depth) ? 1.0 : 0.0;
                samples++;
            }
        }

        shadow /= float(samples);
        // shadow is 1.0 = fully shadowed, 0.0 = fully lit
        // Return inverted: 0.0 = in shadow, 1.0 = lit (for lighting multiplication)
        return 1.0 - shadow;
    }

    float currentDepth = projCoords.z;
    // Use texture array with layer index
    float closestDepth = texture(shadowDepthTextureArray, vec3(projCoords.xy, float(cascadeIndex))).r;


    // Shadow calculation: if current depth (point being tested) is greater than 
    // the closest depth in shadow map + bias, it's in shadow
    // Return 0.0 = in shadow, 1.0 = lit (for lighting multiplication)
    return (currentDepth - csmShadowBias[cascadeIndex] > closestDepth) ? 0.0 : 1.0;
}

void main() {
    // Camera Depth Visualization Mode - Display the raw camera depth texture directly
    if (showCameraDepth) {
        // Read depth directly from texture
        float depth = texture(depthTexture, fragUV).r;
        
        vec3 color;
        if (depth == 0.0 || depth == 1.0) {
            // Exactly 0.0 or 1.0 - likely means depth isn't being written (red to indicate error)
            color = vec3(1.0, 0.0, 0.0); // Red
        } else {
            // Depth is being written - create a visible gradient
            // Note: White = near plane, Black = far plane (depth values are inverted)
            // Invert for proper visualization (black=near, white=far)
            float depthToUse = 1.0 - depth;
            
            // The depth values are clustered at extremes (very close to 0 or 1)
            // To create a visible gradient, we need to expand the range
            // Use a power curve to stretch the middle values
            float normalizedDepth = pow(depthToUse, 0.5); // Square root to expand middle range
            
            // Visualize as grayscale gradient
            // Black = near plane, White = far plane
            color = vec3(normalizedDepth);
        }
        
        outputColor = vec4(color, 1.0);
        return;
    }
    
    vec3 fragViewPos = getViewPosition(fragUV, projInverse);
    vec3 fragWorldPos = getWorldPosition(fragViewPos, viewInverse);

    float cascadeViewDepth = abs(fragViewPos.z);
    if (debugPauseMode) {
        vec4 pausedViewPos = pausedView * vec4(fragWorldPos, 1.0f);
        cascadeViewDepth = abs(pausedViewPos.z);
    }

    // Point Shadow Map Visualization Mode - Display the point shadow cube map
    // Find the first light with shadow map visualization enabled
    int shadowMapVisualizationIndex = -1;
    for (int i = 0; i < numShadowedLights && i < MAX_SHADOWED_POINT_LIGHTS; i++) {
        if (i < numActivePointLights && pointLightShowShadowMap[i] != 0) {
            shadowMapVisualizationIndex = i;
            break;
        }
    }
    
    if (shadowMapVisualizationIndex >= 0 && shadowMapVisualizationIndex < numActivePointLights) {
        vec3 toFrag = fragWorldPos - pointLights[shadowMapVisualizationIndex].position;
        float currentDist = length(toFrag);
        float shadowMapRange = pointLights[shadowMapVisualizationIndex].radius * 3.0;
        
        vec3 color;
        if (currentDist > shadowMapRange) {
            // Fragment is outside shadow map range - show red
            color = vec3(1.0, 0.0, 0.0);
        } else {
            // Sample the cube map using the direction vector
            float stored;
            switch(shadowMapVisualizationIndex) {
                case 0: stored = texture(pointShadowTexture[0], toFrag).r; break;
                case 1: stored = texture(pointShadowTexture[1], toFrag).r; break;
                case 2: stored = texture(pointShadowTexture[2], toFrag).r; break;
                case 3: stored = texture(pointShadowTexture[3], toFrag).r; break;
                case 4: stored = texture(pointShadowTexture[4], toFrag).r; break;
                default: stored = 1.0; break;
            }
            
            // Convert stored depth (normalized by 3x radius) to visual representation
            stored = stored * shadowMapRange;
            
            // Normalize depth for visualization (0 = near light, 1 = at shadow map range)
            float normalizedDepth = stored / shadowMapRange;
            normalizedDepth = pow(normalizedDepth, 0.5); // Expand middle range for better visibility
            color = vec3(normalizedDepth);
        }

        outputColor = vec4(color, 1.0);
        return;
    }
    
    // Shadow Map Visualization Mode - Display the shadow map sample at the fragment's light-space location
    if (showShadowMap && csmEnabled) {
        int cascadeIndex = clamp(shadowMapCascade, 0, numCascades - 1);
        vec4 lightSpacePos = lightSpaceMatrices[cascadeIndex] * vec4(fragWorldPos, 1.0);
        vec3 shadowCoords = lightSpacePos.xyz / lightSpacePos.w;
        shadowCoords = shadowCoords * 0.5 + 0.5;

        bool outsideShadowMap = shadowCoords.x < 0.0 || shadowCoords.x > 1.0 ||
                                shadowCoords.y < 0.0 || shadowCoords.y > 1.0;

        vec3 color;
        if (outsideShadowMap) {
            color = vec3(1.0, 0.0, 0.0);
        } else {
            // Use texture array with layer index
            float shadowDepth = texture(shadowDepthTextureArray, vec3(shadowCoords.xy, float(cascadeIndex))).r;
            float depthToUse = 1.0 - shadowDepth;
            float normalizedDepth = pow(depthToUse, 0.5);
            color = vec3(normalizedDepth);
        }

        outputColor = vec4(color, 1.0);
        return;
    }
    
    vec3 viewNormal = normalize(texture(normalTexture, fragUV).rgb);
    vec3 skyColor = vec3(0.5f, 0.7f, 1.0f);

    vec3 worldNormal = normalize(mat3(viewInverse) * viewNormal);

    vec3 albedo = texture(albedoTexture, fragUV).rgb;
    float ambientOcclusion = texture(ssaoTexture, fragUV).r;

    int cascadeIndex = chooseCascade(cascadeViewDepth);
    float sunShadow = computeSunShadow(fragWorldPos, cascadeIndex);

    // Replace albedo with debug colors when cascade debug is enabled
    if (cascadeDebug && csmEnabled) {
        // Cycle through colors for different cascades
        vec3 cascadeColors[8] = vec3[](
            vec3(1.0, 0.0, 1.0), // Magenta
            vec3(0.0, 1.0, 1.0), // Cyan
            vec3(1.0, 1.0, 0.0), // Yellow
            vec3(1.0, 0.0, 0.0), // Red
            vec3(0.0, 1.0, 0.0), // Green
            vec3(0.0, 0.0, 1.0), // Blue
            vec3(1.0, 0.5, 0.0), // Orange
            vec3(0.5, 0.0, 1.0)  // Purple
        );
        albedo = cascadeColors[cascadeIndex % 8];
    }

    vec3 ambient = (vec3(0.3f) * albedo) * ambientOcclusion;
    vec3 lighting = ambient;

    // Process directional lights
    vec3 lightDir = normalize(-SunLight.direction);
    float diff = max(dot(lightDir, worldNormal), 0.0f);
        // Diffuse should be multiplied by albedo to get correct surface color
    vec3 diffuse = diff * albedo * SunLight.color * SunLight.intensity;

     vec3 viewDir = normalize(cameraPosition - fragWorldPos);
    vec3 reflectDir = reflect(-lightDir, worldNormal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0f), 16.0f);
    // Specular highlights are typically white/light-colored, not affected by albedo
    vec3 specular = spec * SunLight.color * SunLight.intensity;

    // Directional lights have no attenuation
    lighting += (diffuse+specular) * sunShadow;

    // Process point lights
    for(int i = 0; i < numActivePointLights; i++) {
        float pointLightShadow = (i < numShadowedLights) ? computePointShadow(fragWorldPos, i) : 1.0;
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

        lighting += (diffuse + specular) * pointLightShadow;
    }

    if(texture(depthTexture, fragUV).r >= 1.0f) {
        outputColor = vec4(skyColor, 1.0f);
    } else {
        // Clamp lighting to prevent HDR overflow (white spots)
        // If you want HDR support, consider implementing tone mapping instead
        vec3 finalColor = min(lighting, vec3(1.0f));
        float gamma = 2.2;
        finalColor = pow(finalColor, vec3(1.0f / gamma));
        outputColor = vec4(finalColor, 1.0f);
    }
}