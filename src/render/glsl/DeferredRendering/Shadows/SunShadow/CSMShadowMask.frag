#version 300 es
precision highp float;

in vec2 fragUV;
// Output: R = shadow mask, G = primary cascade (normalized), B = secondary cascade (normalized), A = blend factor
out vec4 shadowMaskData;

uniform highp sampler2DArrayShadow shadowDepthTextureArray;
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
uniform float jitterScale;
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
        vec2 f = mod(vec2(gl_FragCoord.xy) * jitterScale, vec2(jitterSize));
        offsetCoord.yz = ivec2(f);
        float shadow = 0.0f;
        int samplesDiv2 = (filterSize * filterSize) / 2;
        float texelSize = 1.0f / float(csmShadowMapSize);

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

        vec2 sc;
        float refDepth = projCoords.z - cascadeBias;
        for(int i = 0; i < filterSize/2; i++) {
            offsetCoord.x = i;
            vec4 Offsets = texelFetch(jitterTexture, offsetCoord, 0) * scaledPcfRadius;
            sc = projCoords.xy + Offsets.rg * texelSize;
            shadow += texture(shadowDepthTextureArray, vec4(sc, float(cascadeIndex), refDepth)) / float(filterSize);
            sc = projCoords.xy + Offsets.ba * texelSize;
            shadow += texture(shadowDepthTextureArray, vec4(sc, float(cascadeIndex), refDepth)) / float(filterSize);
        }
        if((shadow - 1.0f) * shadow * ndotl != 0.0f) {
            shadow *= 1.0f / float(filterSize);
            for(int i = filterSize/2; i < samplesDiv2 - filterSize/2; i++) {
                offsetCoord.x = i;
                vec4 Offsets = texelFetch(jitterTexture, offsetCoord, 0) * scaledPcfRadius;
                sc = projCoords.xy + Offsets.rg * texelSize;
                shadow += texture(shadowDepthTextureArray, vec4(sc, float(cascadeIndex), refDepth)) / float(samplesDiv2 * 2);
                sc = projCoords.xy + Offsets.ba * texelSize;
                shadow += texture(shadowDepthTextureArray, vec4(sc, float(cascadeIndex), refDepth)) / float(samplesDiv2 * 2);
            }
        }
        return shadow;
    }

    // Hardware shadow comparison: returns 0.0 (in shadow) or 1.0 (lit)
    // With LINEAR filtering, this also does 2x2 PCF automatically
    float refDepth = projCoords.z - cascadeBias;
    return texture(shadowDepthTextureArray, vec4(projCoords.xy, float(cascadeIndex), refDepth));
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