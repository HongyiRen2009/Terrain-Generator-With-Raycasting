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
uniform bool debugPauseMode;

uniform mat4 pausedView;
uniform mat4 viewInverse;
uniform mat4 projInverse;

uniform samplerCube pointShadowTexture[MAX_SHADOWED_POINT_LIGHTS];
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

float pointShadowSample(int lightIndex, vec3 vector) {
    float stored;
    switch(lightIndex) {
        case 0:
            stored = texture(pointShadowTexture[0], vector).r;
            break;
        case 1:
            stored = texture(pointShadowTexture[1], vector).r;
            break;
        case 2:
            stored = texture(pointShadowTexture[2], vector).r;
            break;
        case 3:
            stored = texture(pointShadowTexture[3], vector).r;
            break;
        case 4:
            stored = texture(pointShadowTexture[4], vector).r;
            break;
        default:
            return 1.0f;
    }
    return stored;
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
    float slopeFactor = clamp(tanAngle, 0.0f, 10.0f); // Clamp to reasonable range
    float biasScalar = pointShadowBias * (1.0f + slopeFactor);
    float depthBias = biasScalar * shadowMapRange;
    if(currentDist > shadowMapRange) {
        return 1.0f;
    }

    if(usingPCF) {
        ivec3 offsetCoord;
        vec2 f = mod(gl_FragCoord.xy, vec2(jitterSize));
        offsetCoord.yz = ivec2(f);
        float shadow = 0.0f;
        int samplesDiv2 = (filterSize * filterSize) / 2;
        // For cube maps, texel size in world space depends on distance from light
        // Calculate world-space texel size based on current distance and cube map resolution
        float texelSizeWorld = (currentDist / float(cubeMapSize)) * 2.0f;
        float depth = 0.0f;
        vec3 forward = normalize(toFrag);
        vec3 right = cross(forward, vec3(0, 1, 0));
        if(length(right) < 0.001f) {
            // If forward is parallel to up vector, use different basis
            right = cross(forward, vec3(1, 0, 0));
        }
        right = normalize(right);
        vec3 up = normalize(cross(right, forward));

        for(int i = 0; i < 4; i++) {
            offsetCoord.x = i;
            vec4 Offsets = texelFetch(jitterTexture, offsetCoord, 0) * pcfRadius;
            // Scale offsets by world-space texel size
            vec3 offset = right * Offsets.r * texelSizeWorld + up * Offsets.g * texelSizeWorld;
            vec3 sc = normalize(toFrag + offset);
            depth = pointShadowSample(lightIndex, sc);
            // Convert stored depth back to world distance
            depth = depth * shadowMapRange;
            shadow += (currentDist - depthBias > depth) ? 0.0f : 1.0f;

            offset = right * Offsets.b * texelSizeWorld + up * Offsets.a * texelSizeWorld;
            sc = normalize(toFrag + offset);
            depth = pointShadowSample(lightIndex, sc);
            depth = depth * shadowMapRange;
            shadow += (currentDist - depthBias > depth) ? 0.0f : 1.0f;
        }
        shadow = shadow / 8.0f;

        if(shadow != 0.0f && shadow != 1.0f) {
            for(int i = 4; i < samplesDiv2; i++) {
                offsetCoord.x = i;
                vec4 Offsets = texelFetch(jitterTexture, offsetCoord, 0) * pcfRadius;
                vec3 offset = right * Offsets.r * texelSizeWorld + up * Offsets.g * texelSizeWorld;
                vec3 sc = normalize(toFrag + offset);
                depth = pointShadowSample(lightIndex, sc);
                depth = depth * shadowMapRange;
                shadow += (currentDist - depthBias > depth) ? 0.0f : 1.0f;

                offset = right * Offsets.b * texelSizeWorld + up * Offsets.a * texelSizeWorld;
                sc = normalize(toFrag + offset);
                depth = pointShadowSample(lightIndex, sc);
                depth = depth * shadowMapRange;
                shadow += (currentDist - depthBias > depth) ? 0.0f : 1.0f;

            }
            shadow = shadow / float(samplesDiv2 * 2);
        }
        return shadow;
    }
    // Cannot dynamically index sampler arrays in GLSL ES 3.00
    // Use switch with constant indices
    float stored = pointShadowSample(lightIndex, toFrag);

    // Convert stored normalized depth back to world distance
    // stored is normalized by 3x radius, so multiply by 3x radius
    stored = stored * shadowMapRange;

    float shadow = (currentDist - depthBias > stored) ? 0.0f : 1.0f;
    return shadow;
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