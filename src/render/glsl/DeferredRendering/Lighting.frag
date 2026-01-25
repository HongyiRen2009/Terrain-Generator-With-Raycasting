#version 300 es
precision highp float;

#define MAX_LIGHTS 100
#define MAX_SHADOWED_POINT_LIGHTS 5
in vec2 fragUV;
out vec4 outputColor;
uniform samplerCube pointShadowTexture[MAX_SHADOWED_POINT_LIGHTS];
uniform sampler2D normalTexture;
uniform sampler2D albedoTexture;
uniform sampler2D materialAttributesTexture;
uniform sampler2D depthTexture;
uniform sampler2D ssaoTexture;
uniform highp sampler3D jitterTexture;
uniform highp sampler2DArray shadowDepthTextureArray;
uniform mat4 viewInverse;
uniform mat4 projInverse;
uniform mat4 pausedView;

uniform float ambientLightIntensity;
//Shadow Uniforms
uniform mat4 lightSpaceMatrices[8]; // Support up to 8 cascades
uniform float cascadeSplits[8]; // Support up to 8 cascades
uniform bool usingPCF;
uniform float csmShadowBias[8]; // One bias per cascade for CSM
uniform float csmPcfBiasScale[8]; // Per-cascade scale for PCF-only bias term
uniform int csmShadowMapSize;
uniform int numCascades;
uniform bool csmEnabled;
uniform bool cascadeDebug;
uniform bool debugPauseMode;
uniform bool showCameraDepth;
uniform float pointShadowBias;
uniform int numShadowedLights;
uniform int pointLightShowShadowMap[MAX_LIGHTS];
uniform int cubeMapSize;
uniform bool cubeShadowsOn;
uniform int jitterSize;
uniform int filterSize;
uniform float pcfRadius;
uniform bool sunDisabled;

struct PointLight {
    vec3 position;
    vec3 color;
    vec3 showColor;
    float intensity;
    float radius;
    float range;
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

// Add these uniforms near the top with other uniforms
uniform float grassSpecularStrength;
uniform float grassShininess;
uniform float grassTranslucencyStrength;
uniform float grassAmbientTransitionPower;
uniform float grassSpecularTransitionPower;
uniform float grassTranslucencyTransitionPower;
uniform float grassDiffuseStrength;
uniform float grassBaseDarkness;
uniform vec3 grassBaseColor;
uniform vec3 grassTipColor;
uniform vec3 grassSpecularColor;
uniform vec3 grassTranslucencyColor;
uniform float sunShadowStrength;
uniform float pointLightShadowStrength;
uniform float grassPointLightintensity;
uniform float grassPointLightDiffuseSoftness;
const float PI = 3.14159265359f;
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

int chooseCascade(float viewDepth) {
    // View depth is negative (camera looks down -Z), cascade splits are positive distances
    float depth = abs(viewDepth);
    for(int i = 0; i < 8; i++) {
        if(i >= numCascades)
            break;
        if(depth < cascadeSplits[i])
            return i;
    }
    return numCascades - 1; // Return last cascade if beyond all splits
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
        // Add bias to account for PCF kernel size
        // Scale with slope factor since steep surfaces need more bias for PCF samples
        // Use diagonal distance (sqrt(2) * radius) to account for corner samples
        float texelSize = 1.0f / float(csmShadowMapSize);
        float maxOffsetDistance = pcfRadius * 1.414213562f; // sqrt(2) for diagonal
        // Cascade-relative scaling (same idea as scaledPcfRadius below): larger cascades get smaller contribution.
        float cascadeScale = 1.0f;
        if(cascadeIndex > 0 && cascadeSplits[0] > 0.0f) {
            float firstCascadeRange = cascadeSplits[0];
            float currentCascadeNear = cascadeSplits[cascadeIndex - 1];
            float currentCascadeRange = cascadeSplits[cascadeIndex] - currentCascadeNear;
            cascadeScale = firstCascadeRange / max(currentCascadeRange, 0.001f);
        }
        // PCF-only bias contribution: per-cascade tunable scale (keeps base + slope-scaled bias as-is).
        float pcfBias = maxOffsetDistance * texelSize * (1.0f + slopeFactor * 0.5f) * csmPcfBiasScale[cascadeIndex] * cascadeScale;
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
float calculateFresnel(vec3 viewDir, vec3 halfDir, float baseReflectivity) {
    return baseReflectivity + (1.0f - baseReflectivity) * pow(1.0f - dot(viewDir, halfDir), 5.0f);
}
float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0f);
    float NdotH2 = NdotH * NdotH;

    float nom = a2;
    float denom = (NdotH2 * (a2 - 1.0f) + 1.0f);
    denom = PI * denom * denom;

    return nom / denom;
}
float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0f);
    float k = (r * r) / 8.0f;

    float nom = NdotV;
    float denom = NdotV * (1.0f - k) + k;

    return nom / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0f);
    float NdotL = max(dot(N, L), 0.0f);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}
vec3 calculateSunPBRLighting(vec3 worldPos, vec3 worldNormal, vec3 albedo, float baseReflectivity, float metalicity, float roughness) {
    vec3 viewDir = normalize(cameraPosition - worldPos);
    vec3 lightDir = normalize(-SunLight.direction);
    vec3 halfWay = normalize(viewDir + lightDir);
    float specularCoefficient = calculateFresnel(viewDir, normalize(worldNormal + viewDir), baseReflectivity);
    float diffuseCoefficient = (1.0f - specularCoefficient) * (1.0f - metalicity);
    vec3 diffuse = diffuseCoefficient * albedo / PI;

    // Cook-Torrance BRDF
    float NDF = DistributionGGX(worldNormal, halfWay, roughness);
    float G = GeometrySmith(worldNormal, viewDir, lightDir, roughness);
    vec3 F = vec3(calculateFresnel(viewDir, halfWay, baseReflectivity));

    vec3 numerator = NDF * G * F;
    float denominator = 4.0f * max(dot(worldNormal, viewDir), 0.0f) * max(dot(worldNormal, lightDir), 0.0f) + 0.001f;
    vec3 specular = numerator / denominator;
    vec3 radiance = SunLight.color * SunLight.intensity;
    float diffuseFactor = max(dot(worldNormal, lightDir), 0.0f);

    return (diffuse + specular) * radiance * diffuseFactor;
}
vec3 unpackEmissivity(float normalizedPacked) {
    // Denormalize from 0-1 range back to 0-63 (stored normalized for RGBA8 texture)
    int packed = int(normalizedPacked * 63.0f + 0.5f); // +0.5 for rounding
    float r = float(packed & 0x3) / 3.0f;
    float g = float((packed >> 2) & 0x3) / 3.0f;
    float b = float((packed >> 4) & 0x3) / 3.0f;
    return vec3(r, g, b);
}

float calculateAttenuation(float d, float r, float range) {
    if(d > range) {
        return 0.0f;
    }
    return 2.0f * (1.0f - d / sqrt(d * d + r * r));
}

vec3 calculatePointPBRLighting(vec3 worldPos, vec3 worldNormal, vec3 albedo, float baseReflectivity, float metalicity, float roughness, int lightIndex) {
    vec3 viewDir = normalize(cameraPosition - worldPos);
    vec3 lightDir = normalize(pointLights[lightIndex].position - worldPos);
    vec3 halfWay = normalize(viewDir + lightDir);
    float specularCoefficient = calculateFresnel(viewDir, normalize(worldNormal + viewDir), baseReflectivity);
    float diffuseCoefficient = (1.0f - specularCoefficient) * (1.0f - metalicity);
    vec3 diffuse = diffuseCoefficient * albedo / PI;

    // Cook-Torrance BRDF
    float NDF = DistributionGGX(worldNormal, halfWay, roughness);
    float G = GeometrySmith(worldNormal, viewDir, lightDir, roughness);
    vec3 F = vec3(calculateFresnel(viewDir, halfWay, baseReflectivity));

    vec3 numerator = NDF * G * F;
    float denominator = 4.0f * max(dot(worldNormal, viewDir), 0.0f) * max(dot(worldNormal, lightDir), 0.0f) + 0.001f;
    vec3 specular = numerator / denominator;
    vec3 radiance = pointLights[lightIndex].color * pointLights[lightIndex].intensity;
    float distance = length(pointLights[lightIndex].position - worldPos);
    float attenuation = calculateAttenuation(distance, pointLights[lightIndex].radius, pointLights[lightIndex].range);
    float diffuseFactor = max(dot(worldNormal, lightDir), 0.0f);

    return (diffuse + specular) * radiance * diffuseFactor * attenuation;
}
vec3 computeTerrainLighting(vec3 worldPos, vec3 worldNormal, vec3 albedo, float ambientOcclusion, float sunShadow) {
    vec3 ambient = (vec3(ambientLightIntensity) * albedo) * ambientOcclusion;
    vec3 lighting = ambient;

    // Material attributes
    vec4 materialData = texture(materialAttributesTexture, fragUV);
    float baseReflectivity = materialData.r;
    float metallicity = materialData.g;
    float roughness = materialData.b;
    vec3 emissivity = unpackEmissivity(materialData.a);

    // Sun PBR lighting
    if(!sunDisabled) {
        lighting += calculateSunPBRLighting(worldPos, worldNormal, albedo, baseReflectivity, metallicity, roughness) * sunShadow;
    }

    // Point lights PBR
    for(int i = 0; i < numActivePointLights; i++) {
        float pointLightShadow = (i < numShadowedLights) ? computePointShadow(worldPos, worldNormal, i) : 1.0f;
        lighting += calculatePointPBRLighting(worldPos, worldNormal, albedo, baseReflectivity, metallicity, roughness, i) * pointLightShadow;
    }

    // Add emissivity ONCE at the end, unaffected by shadows
    // This makes emissive materials glow regardless of lighting conditions
    // Multiply by 4.0 to make emissive objects bright enough to trigger bloom (threshold 1.5)
    lighting += emissivity * 4.0f;

    return lighting;
}

vec3 computeGrassLighting(vec3 worldPos, vec3 worldNormal, float vHeight, float curveAngle, float sunShadow) {
    vec3 viewDirection = normalize(cameraPosition - worldPos);

    vec3 toCamera = sunDisabled ? vec3(0.0f, 0.0f, -1.0f) : normalize(-SunLight.direction);
    toCamera.y = 0.0f;

    float curveViewDot = cos(curveAngle) * toCamera.x + sin(curveAngle) * toCamera.z;
    bool isInnerCurve = curveViewDot > 0.0f;

    float t = clamp(vHeight / 1.5f, 0.0f, 1.0f);
    vec3 baseGrassColor = mix(grassBaseColor, grassTipColor, pow(t, grassAmbientTransitionPower));

    vec3 normal = normalize(worldNormal) * (isInnerCurve ? -1.0f : 1.0f);
    vec3 tangent = normalize(cross(normal, vec3(0.0f, 1.0f, 0.0f)));

    // Ambient
    vec3 grassColor = baseGrassColor * grassBaseDarkness;

    // Sun lighting
    if(!sunDisabled) {
        vec3 lightDir = normalize(-SunLight.direction);
        float diffuse = max(dot(normal, lightDir), 0.0f);
        diffuse = diffuse * 0.6f + 0.4f;
        vec3 sunDiffuse = baseGrassColor * grassDiffuseStrength * diffuse;

        vec3 halfDir = normalize(lightDir + viewDirection);
        float tdh = dot(tangent, halfDir);
        float spec = pow(sqrt(1.0f - tdh * tdh), grassShininess);
        spec = mix(0.0f, spec, pow(t, grassSpecularTransitionPower));
        vec3 specular = grassSpecularStrength * spec * grassSpecularColor;

        float translucency = max(dot(-lightDir, normal), 0.0f);
        translucency = mix(0.0f, translucency, pow(t, grassTranslucencyTransitionPower));
        vec3 translucentColor = grassTranslucencyColor * translucency * grassTranslucencyStrength;

        float shadowFactor = mix(1.0f, sunShadow, sunShadowStrength);
        grassColor += (sunDiffuse + specular + translucentColor) * shadowFactor;
    }

    // Point lights
    for(int i = 0; i < numActivePointLights; i++) {
        float pointLightShadow = (i < numShadowedLights) ? computePointShadow(worldPos, worldNormal, i) : 1.0f;
        vec3 pointLightDir = normalize(pointLights[i].position - worldPos);

        float pointDiffuse = max(dot(normal, pointLightDir), 0.0f);
        pointDiffuse = pointDiffuse * (1.0f - grassPointLightDiffuseSoftness) + grassPointLightDiffuseSoftness;
        // Multiply by baseGrassColor so point lights tint the grass properly
        vec3 pointDiffuseColor = baseGrassColor * pointDiffuse * pointLights[i].color * pointLights[i].intensity * grassDiffuseStrength * grassPointLightintensity;

        vec3 pointHalfDir = normalize(pointLightDir + viewDirection);
        float pointTdh = dot(tangent, pointHalfDir);
        float pointSpec = pow(sqrt(1.0f - pointTdh * pointTdh), grassShininess);
        pointSpec = mix(0.0f, pointSpec, pow(t, grassSpecularTransitionPower));
        vec3 pointSpecular = grassSpecularStrength * pointSpec * grassSpecularColor * grassPointLightintensity;

        float distance = length(pointLights[i].position - worldPos);
        float attenuation = calculateAttenuation(distance, pointLights[i].radius, pointLights[i].range);

        float shadowFactor = mix(1.0f, pointLightShadow, pointLightShadowStrength);
        grassColor += (pointDiffuseColor + pointSpecular) * attenuation * shadowFactor;
    }

    return pow(grassColor, vec3(2.2f));
}

void main() {

    // Camera Depth Visualization Mode - Display the raw camera depth texture directly
    if(showCameraDepth) {
        // Read depth directly from texture
        float depth = texture(depthTexture, fragUV).r;

        vec3 color;
        if(depth == 0.0f || depth == 1.0f) {
            // Exactly 0.0 or 1.0 - likely means depth isn't being written (red to indicate error)
            color = vec3(1.0f, 0.0f, 0.0f); // Red
        } else {
            // Depth is being written - create a visible gradient
            // Note: White = near plane, Black = far plane (depth values are inverted)
            // Invert for proper visualization (black=near, white=far)
            float depthToUse = 1.0f - depth;

            // The depth values are clustered at extremes (very close to 0 or 1)
            // To create a visible gradient, we need to expand the range
            // Use a power curve to stretch the middle values
            float normalizedDepth = pow(depthToUse, 0.5f); // Square root to expand middle range

            // Visualize as grayscale gradient
            // Black = near plane, White = far plane
            color = vec3(normalizedDepth);
        }

        outputColor = vec4(color, 1.0f);
        return;
    }
    vec3 fragViewPos = getViewPosition(fragUV, projInverse);
    vec3 fragWorldPos = getWorldPosition(fragViewPos, viewInverse);

    float cascadeViewDepth = abs(fragViewPos.z);
    if(debugPauseMode) {
        vec4 pausedViewPos = pausedView * vec4(fragWorldPos, 1.0f);
        cascadeViewDepth = abs(pausedViewPos.z);
    }

    // Point Shadow Map Visualization Mode - Display the point shadow cube map
    // Find the first light with shadow map visualization enabled
    int shadowMapVisualizationIndex = -1;
    for(int i = 0; i < numShadowedLights && i < MAX_SHADOWED_POINT_LIGHTS; i++) {
        if(i < numActivePointLights && pointLightShowShadowMap[i] != 0) {
            shadowMapVisualizationIndex = i;
            break;
        }
    }

    if(shadowMapVisualizationIndex >= 0 && shadowMapVisualizationIndex < numActivePointLights) {
        vec3 toFrag = fragWorldPos - pointLights[shadowMapVisualizationIndex].position;
        float currentDist = length(toFrag);
        float shadowMapRange = pointLights[shadowMapVisualizationIndex].range;

        vec3 color;
        if(currentDist > shadowMapRange) {
            // Fragment is outside shadow map range - show red
            color = vec3(1.0f, 0.0f, 0.0f);
        } else {
            // Sample the cube map using the direction vector
            float stored;
            switch(shadowMapVisualizationIndex) {
                case 0:
                    stored = texture(pointShadowTexture[0], toFrag).r;
                    break;
                case 1:
                    stored = texture(pointShadowTexture[1], toFrag).r;
                    break;
                case 2:
                    stored = texture(pointShadowTexture[2], toFrag).r;
                    break;
                case 3:
                    stored = texture(pointShadowTexture[3], toFrag).r;
                    break;
                case 4:
                    stored = texture(pointShadowTexture[4], toFrag).r;
                    break;
                default:
                    stored = 1.0f;
                    break;
            }

            stored = stored * shadowMapRange;

            // Normalize depth for visualization (0 = near light, 1 = at shadow map range)
            float normalizedDepth = stored / shadowMapRange;
            normalizedDepth = pow(normalizedDepth, 0.5f); // Expand middle range for better visibility
            color = vec3(normalizedDepth);
        }

        outputColor = vec4(color, 1.0f);
        return;
    }

    vec3 viewNormal = normalize(texture(normalTexture, fragUV).rgb);
    vec3 skyColor = vec3(0.5f, 0.7f, 1.0f);

    vec3 worldNormal = normalize(mat3(viewInverse) * viewNormal);

    vec3 albedo = texture(albedoTexture, fragUV).rgb;
    float ambientOcclusion = texture(ssaoTexture, fragUV).r;

    // Check if this is a grass material (material ID = 0.5 in alpha channel)
    float materialId = texture(albedoTexture, fragUV).a;
    bool isGrass = abs(materialId - 0.5f) < 0.01f;

    int cascadeIndex = chooseCascade(cascadeViewDepth);
    float sunShadow = computeSunShadow(fragWorldPos, worldNormal, cascadeIndex);

    // Replace albedo with debug colors when cascade debug is enabled
    if(cascadeDebug && csmEnabled) {
        // Cycle through colors for different cascades
        vec3 cascadeColors[8] = vec3[](vec3(1.0f, 0.0f, 1.0f), // Magenta
        vec3(0.0f, 1.0f, 1.0f), // Cyan
        vec3(1.0f, 1.0f, 0.0f), // Yellow
        vec3(1.0f, 0.0f, 0.0f), // Red
        vec3(0.0f, 1.0f, 0.0f), // Green
        vec3(0.0f, 0.0f, 1.0f), // Blue
        vec3(1.0f, 0.5f, 0.0f), // Orange
        vec3(0.5f, 0.0f, 1.0f)  // Purple
        );
        albedo = cascadeColors[cascadeIndex % 8];
    }

    vec3 lighting;

    if(isGrass) {
        // For grass: albedo.rg contains (height, curveAngle)
        float vHeight = albedo.r;
        float curveAngle = albedo.g;
        lighting = computeGrassLighting(fragWorldPos, worldNormal, vHeight, curveAngle, sunShadow);
    } else {
        // Standard PBR lighting for terrain
        lighting = computeTerrainLighting(fragWorldPos, worldNormal, albedo, ambientOcclusion, sunShadow);
    }

    if(texture(depthTexture, fragUV).r >= 1.0f) {
        outputColor = vec4(skyColor, 1.0f);
    } else {
        outputColor = vec4(lighting, 1.0f);
    }
}