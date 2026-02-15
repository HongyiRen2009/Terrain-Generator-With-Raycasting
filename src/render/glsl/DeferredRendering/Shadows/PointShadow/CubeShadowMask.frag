#version 300 es
precision highp float;

#define MAX_SHADOWED_POINT_LIGHTS 5
#define MAX_LIGHTS 100

in vec2 fragUV;
layout(location = 0) out float shadowMaskA;
layout(location = 1) out float shadowMaskB;
layout(location = 2) out float shadowMaskC;
layout(location = 3) out float shadowMaskD;
layout(location = 4) out float shadowMaskE;

struct PointLight {
    vec3 position;
    vec3 color;
    vec3 showColor;
    float intensity;
    float radius;
    float range;
};
uniform PointLight pointLights[MAX_LIGHTS];

uniform bool usingPCF;
uniform float pointShadowBias;
uniform int numShadowedLights;
uniform int cubeMapSize;
uniform bool cubeShadowsOn;
uniform int jitterSize;
uniform int filterSize;
uniform float pcfRadius;
uniform float slopeFactorClamp;
uniform bool debugPauseMode;

uniform mat4 pausedView;
uniform mat4 viewInverse;
uniform mat4 projInverse;

// Use samplerCubeShadow for hardware shadow filtering
uniform highp samplerCubeShadow pointShadowTexture[MAX_SHADOWED_POINT_LIGHTS];
uniform sampler2D depthTexture;
uniform sampler2D normalTexture;
uniform highp sampler3D jitterTexture;

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

// Hardware shadow comparison sample - returns 0.0 (shadow) or 1.0 (lit), with LINEAR filtering
float pointShadowSample(int lightIndex, vec3 direction, float refDepth) {
    // samplerCubeShadow takes vec4(direction.xyz, refDepth) and returns comparison result
    switch(lightIndex) {
        case 0:
            return texture(pointShadowTexture[0], vec4(direction, refDepth));
        case 1:
            return texture(pointShadowTexture[1], vec4(direction, refDepth));
        case 2:
            return texture(pointShadowTexture[2], vec4(direction, refDepth));
        case 3:
            return texture(pointShadowTexture[3], vec4(direction, refDepth));
        case 4:
            return texture(pointShadowTexture[4], vec4(direction, refDepth));
        default:
            return 1.0f;
    }
}

float computePointShadow(vec3 worldPos, vec3 worldNormal, int lightIndex) {
    if (lightIndex >= numShadowedLights) {
        return 1.0f;
    }
    if(!cubeShadowsOn) {
        return 1.0f;
    }
    vec3 toFrag = worldPos - pointLights[lightIndex].position;
    float currentDist = length(toFrag);
    float shadowMapRange = pointLights[lightIndex].range;
    vec3 lightDir = normalize(-toFrag);
    // Calculate slope-scaled bias using tan(angle) instead of cos
    float ndotl = max(dot(worldNormal, lightDir), 0.0f);
    float cosAngle = ndotl;
    float sinAngle = sqrt(max(1.0f - cosAngle * cosAngle, 0.0f));
    float tanAngle = (cosAngle > 0.001f) ? sinAngle / cosAngle : 1000.0f; // Avoid division by zero
    float slopeFactor = clamp(tanAngle, 0.0f, slopeFactorClamp);
    // Bias is applied to the normalized depth (0-1 range)
    float depthBias = pointShadowBias * (1.0f + slopeFactor);
    
    if(currentDist > shadowMapRange) {
        return 1.0f;
    }
    
    // Reference depth for hardware comparison (normalized distance - bias)
    float refDepth = (currentDist / shadowMapRange) - depthBias;

    if(usingPCF) {
        ivec3 offsetCoord;
        vec2 f = mod(gl_FragCoord.xy, vec2(jitterSize));
        offsetCoord.yz = ivec2(f);
        float shadow = 0.0f;
        int samplesDiv2 = (filterSize * filterSize) / 2;
        // For cube maps, texel size in world space depends on distance from light
        // Calculate world-space texel size based on current distance and cube map resolution
        float texelSizeWorld = (currentDist / float(cubeMapSize)) * 2.0f;
        
        vec3 forward = normalize(toFrag);
        vec3 right = cross(forward, vec3(0, 1, 0));
        if(length(right) < 0.001f) {
            // If forward is parallel to up vector, use different basis
            right = cross(forward, vec3(1, 0, 0));
        }
        right = normalize(right);
        vec3 up = normalize(cross(right, forward));

        // First pass - initial samples (matches CSM pattern)
        for(int i = 0; i < filterSize/2; i++) {
            offsetCoord.x = i;
            vec4 Offsets = texelFetch(jitterTexture, offsetCoord, 0) * pcfRadius;
            // Scale offsets by world-space texel size
            vec3 offset = right * Offsets.r * texelSizeWorld + up * Offsets.g * texelSizeWorld;
            vec3 sc = normalize(toFrag + offset);
            // Hardware shadow comparison returns 0.0 or 1.0 (with LINEAR filtering interpolation)
            shadow += pointShadowSample(lightIndex, sc, refDepth) / float(filterSize);

            offset = right * Offsets.b * texelSizeWorld + up * Offsets.a * texelSizeWorld;
            sc = normalize(toFrag + offset);
            shadow += pointShadowSample(lightIndex, sc, refDepth) / float(filterSize);
        }
        
        // Second pass - additional samples only if in penumbra (matches CSM pattern)
        if((shadow - 1.0f) * shadow * ndotl != 0.0f) {
            shadow *= 1.0f / float(filterSize);
            for(int i = filterSize/2; i < samplesDiv2 - filterSize/2; i++) {
                offsetCoord.x = i;
                vec4 Offsets = texelFetch(jitterTexture, offsetCoord, 0) * pcfRadius;
                vec3 offset = right * Offsets.r * texelSizeWorld + up * Offsets.g * texelSizeWorld;
                vec3 sc = normalize(toFrag + offset);
                shadow += pointShadowSample(lightIndex, sc, refDepth) / float(samplesDiv2 * 2);

                offset = right * Offsets.b * texelSizeWorld + up * Offsets.a * texelSizeWorld;
                sc = normalize(toFrag + offset);
                shadow += pointShadowSample(lightIndex, sc, refDepth) / float(samplesDiv2 * 2);
            }
        }
        return shadow;
    }
    
    // Non-PCF path: single hardware shadow comparison sample
    return pointShadowSample(lightIndex, toFrag, refDepth);
}

void main() {
    vec3 fragViewPos = getViewPosition(fragUV, projInverse);
    vec3 fragWorldPos = getWorldPosition(fragViewPos, viewInverse);

    // Compute world normal from normal texture (view space -> world space)
    vec3 viewNormal = normalize(texture(normalTexture, fragUV).rgb);
    vec3 worldNormal = normalize(mat3(viewInverse) * viewNormal);

    shadowMaskA = computePointShadow(fragWorldPos, worldNormal, 0);
    shadowMaskB = computePointShadow(fragWorldPos, worldNormal, 1);
    shadowMaskC = computePointShadow(fragWorldPos, worldNormal, 2);
    shadowMaskD = computePointShadow(fragWorldPos, worldNormal, 3);
    shadowMaskE = computePointShadow(fragWorldPos, worldNormal, 4);
}