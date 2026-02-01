#version 300 es
precision highp float;

in vec2 fragUV;
// Output: R = shadow mask, G = primary cascade (normalized), B = secondary cascade (normalized), A = blend factor
out vec4 shadowMaskData;

uniform highp sampler2DArray shadowDepthTextureArray;
uniform sampler2D depthTexture;
uniform sampler2D normalTexture;
uniform highp sampler3D jitterTexture;

uniform mat4 lightSpaceMatrices[8];
uniform float cascadeSplits[8];
uniform float cascadeBlendWidth;
uniform bool usingPCF;
uniform float csmShadowBias[8];
uniform float csmPcfBiasScale[8];
uniform int csmShadowMapSize;
uniform int numCascades;
uniform bool csmEnabled;

uniform int jitterSize;
uniform int filterSize;
uniform float pcfRadius;
uniform bool debugPauseMode;
uniform bool sunDisabled;

uniform mat4 pausedView;
uniform mat4 viewInverse;
uniform mat4 projInverse;

struct DirectionalLight {
    vec3 direction;
    vec3 color;
    float intensity;
};
uniform DirectionalLight SunLight;

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

// Cascade blend info structure
struct CascadeBlendInfo {
    int primaryCascade;   // Main cascade to sample
    int secondaryCascade; // Cascade to blend with (for smooth transitions)
    float blendFactor;    // 0.0 = use primary only, 1.0 = use secondary only
};

// Choose cascade based on view depth with blending near split boundaries
CascadeBlendInfo chooseCascadeWithBlend(float viewDepth) {
    CascadeBlendInfo info;
    float depth = abs(viewDepth);

    info.primaryCascade = numCascades - 1;
    info.secondaryCascade = numCascades - 1;
    info.blendFactor = 0.0f;

    for(int i = 0; i < 8; i++) {
        if(i >= numCascades)
            break;
        if(depth < cascadeSplits[i]) {
            info.primaryCascade = i;
            info.secondaryCascade = min(i + 1, numCascades - 1);

            // Calculate blend region near the split boundary
            float splitDist = cascadeSplits[i];
            float prevSplit = (i > 0) ? cascadeSplits[i - 1] : 0.0f;
            float cascadeRange = splitDist - prevSplit;
            float blendStart = splitDist - cascadeRange * cascadeBlendWidth;

            if(depth > blendStart && i < numCascades - 1) {
                info.blendFactor = smoothstep(blendStart, splitDist, depth);
            }
            return info;
        }
    }
    return info;
}



float computeSunShadow(vec3 worldPos, vec3 worldNormal, int cascadeIndex) {
    // If CSM is disabled, return no shadow
    if(!csmEnabled) {
        return 1.0f;
    }

    vec3 lightDir = normalize(-SunLight.direction);
    float ndotl = max(dot(worldNormal, lightDir), 0.0f);
    // Calculate slope-scaled bias using tan(angle) instead of cos
    // tan(angle) = sin(angle) / cos(angle) = sqrt(1 - cos²(angle)) / cos(angle)
    float cosAngle = ndotl;
    float sinAngle = sqrt(max(1.0f - cosAngle * cosAngle, 0.0f));
    float tanAngle = (cosAngle > 0.001f) ? sinAngle / cosAngle : 1000.0f; // Avoid division by zero
    float slopeFactor = clamp(tanAngle, 0.0f, 10.0f); // Clamp to reasonable range
    float baseBias = csmShadowBias[cascadeIndex];
    float cascadeBias = baseBias * (1.0f + slopeFactor);
    if(usingPCF) {
       
        float texelSize = 1.0f / float(csmShadowMapSize);
        float maxOffsetDistance = pcfRadius * 1.414213562f; 
        float pcfBias = maxOffsetDistance * texelSize * (1.0f + slopeFactor * 0.5f) * csmPcfBiasScale[cascadeIndex];
        cascadeBias += pcfBias;
    }
    
    //World Space to Light Space
    vec4 lp = lightSpaceMatrices[cascadeIndex] * vec4(worldPos, 1.0f);
    vec3 projCoords = lp.xyz / lp.w; // NDC

    //NDC to UV
    projCoords = projCoords * 0.5f + 0.5f;

    // Check if fragment is outside the shadow map bounds
    if(projCoords.x < 0.0f || projCoords.x > 1.0f ||
        projCoords.y < 0.0f || projCoords.y > 1.0f ||
        projCoords.z < 0.0f || projCoords.z > 1.0f) {
        // Fragment is outside shadow map, consider it lit (or in shadow based on your preference)
        return 1.0f; // Return lit for fragments outside the shadow frustum
    }

    if(usingPCF) {
        ivec3 offsetCoord;
        vec2 f = mod(gl_FragCoord.xy, vec2(jitterSize));
        offsetCoord.yz = ivec2(f);
        float shadow = 0.0f;
        int samplesDiv2 = (filterSize * filterSize) / 2;
        float texelSize = 1.0f / float(csmShadowMapSize);

        // Calculate cascade-specific PCF scale to maintain consistent world-space filter size
        // Further cascades cover larger world-space areas, so we need to scale down the PCF radius
        // We use the cascade's depth range as a proxy for its world-space coverage
        // Since cascades scale in all dimensions, depth range is a reasonable approximation
        float cascadeScale = 1.0f;
        if(cascadeIndex > 0 && cascadeSplits[0] > 0.0f) {
            // Calculate the depth range of the first cascade (reference)
            float firstCascadeRange = cascadeSplits[0];
            // Calculate the depth range of the current cascade
            float currentCascadeNear = cascadeSplits[cascadeIndex - 1];
            float currentCascadeRange = cascadeSplits[cascadeIndex] - currentCascadeNear;
            // Scale PCF radius inversely with relative cascade size
            // Larger cascades (larger range) get smaller PCF radius to maintain same world-space filter size
            cascadeScale = firstCascadeRange / max(currentCascadeRange, 0.001f);
        }
        float scaledPcfRadius = pcfRadius * cascadeScale;

        vec4 sc = vec4(projCoords, 1.0f);
        float depth = 0.0f;
        for(int i = 0; i < 4; i++) {
            offsetCoord.x = i;
            vec4 Offsets = texelFetch(jitterTexture, offsetCoord, 0) * scaledPcfRadius;
            sc.xy = projCoords.xy + Offsets.rg * texelSize;
            depth = texture(shadowDepthTextureArray, vec3(sc.xy, float(cascadeIndex))).r;
            shadow += (projCoords.z - cascadeBias > depth) ? 0.0f : 1.0f;
            sc.xy = projCoords.xy + Offsets.ba * texelSize;
            depth = texture(shadowDepthTextureArray, vec3(sc.xy, float(cascadeIndex))).r;
            shadow += (projCoords.z - cascadeBias > depth) ? 0.0f : 1.0f;
        }
        shadow = shadow / 8.0f;

        if(shadow != 0.0f && shadow != 1.0f) {
            for(int i = 4; i < samplesDiv2; i++) {
                offsetCoord.x = i;
                vec4 Offsets = texelFetch(jitterTexture, offsetCoord, 0) * scaledPcfRadius;
                sc.xy = projCoords.xy + Offsets.rg * texelSize;
                depth = texture(shadowDepthTextureArray, vec3(sc.xy, float(cascadeIndex))).r;
                shadow += (projCoords.z - cascadeBias > depth) ? 0.0f : 1.0f;
                sc.xy = projCoords.xy + Offsets.ba * texelSize;
                depth = texture(shadowDepthTextureArray, vec3(sc.xy, float(cascadeIndex))).r;
                shadow += (projCoords.z - cascadeBias > depth) ? 0.0f : 1.0f;
            }
            shadow = shadow / float(samplesDiv2 * 2);
        }
        return shadow;
    }

    float currentDepth = projCoords.z;
    // Use texture array with layer index
    float closestDepth = texture(shadowDepthTextureArray, vec3(projCoords.xy, float(cascadeIndex))).r;

    // Shadow calculation: if current depth (point being tested) is greater than 
    // the closest depth in shadow map + bias, it's in shadow
    // Return 0.0 = in shadow, 1.0 = lit (for lighting multiplication)
    return (currentDepth - cascadeBias > closestDepth) ? 0.0f : 1.0f;
}

void main() {
    vec3 fragViewPos = getViewPosition(fragUV, projInverse);
    vec3 fragWorldPos = getWorldPosition(fragViewPos, viewInverse);

    // Compute world normal from normal texture (view space -> world space)
    vec3 viewNormal = normalize(texture(normalTexture, fragUV).rgb);
    vec3 worldNormal = normalize(mat3(viewInverse) * viewNormal);

    float cascadeViewDepth = abs(fragViewPos.z);
    if(debugPauseMode) {
        vec4 pausedViewPos = pausedView * vec4(fragWorldPos, 1.0f);
        cascadeViewDepth = abs(pausedViewPos.z);
    }

    CascadeBlendInfo cascadeInfo = chooseCascadeWithBlend(cascadeViewDepth);
    int cascadeIndex = cascadeInfo.primaryCascade;

    // Compute sun shadow with optional blending between cascades
    float sunShadow;
    if(cascadeInfo.blendFactor > 0.0f && cascadeInfo.secondaryCascade != cascadeInfo.primaryCascade) {
        // Blend shadows between two cascades for smooth transitions
        float shadowPrimary = computeSunShadow(fragWorldPos, worldNormal, cascadeInfo.primaryCascade);
        float shadowSecondary = computeSunShadow(fragWorldPos, worldNormal, cascadeInfo.secondaryCascade);
        sunShadow = mix(shadowPrimary, shadowSecondary, cascadeInfo.blendFactor);
    } else {
        sunShadow = computeSunShadow(fragWorldPos, worldNormal, cascadeIndex);
    }

    // Output: R = shadow, G = primary cascade (normalized 0-1), B = secondary cascade (normalized 0-1), A = blend factor
    shadowMaskData = vec4(
        sunShadow,
        float(cascadeInfo.primaryCascade) / 8.0f,
        float(cascadeInfo.secondaryCascade) / 8.0f,
        cascadeInfo.blendFactor
    );
}