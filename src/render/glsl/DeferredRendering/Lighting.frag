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
    float angleFactor = clamp(1.0f - max(dot(worldNormal, lightDir), 0.0f), 0.0f, 1.0f);
    float biasScalar = pointShadowBias * (1.5f + angleFactor * 3.0f);
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
    float angleFactor = clamp(1.0f - ndotl, 0.0f, 1.0f);
    float baseBias = csmShadowBias[cascadeIndex];
    float cascadeBias = baseBias * (2.5f + angleFactor * 3.5f);
    if(usingPCF) {
        cascadeBias += baseBias * (pcfRadius * 0.05f);
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
        vec4 sc = vec4(projCoords, 1.0f);
        float depth = 0.0f;
        for(int i = 0; i < 4; i++) {
            offsetCoord.x = i;
            vec4 Offsets = texelFetch(jitterTexture, offsetCoord, 0) * pcfRadius;
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
                vec4 Offsets = texelFetch(jitterTexture, offsetCoord, 0) * pcfRadius;
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
vec3 calculateSunPBRLighting(vec3 worldPos, vec3 worldNormal, vec3 albedo, vec3 emissivity, float baseReflectivity, float metalicity, float roughness) {
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

    return (diffuse + specular) * radiance * diffuseFactor + emissivity;
}
vec3 unpackEmissivity(int packed) {
    float r = float(packed & 0x3) / 3.0f;
    float g = float((packed >> 2) & 0x3) / 3.0f;
    float b = float((packed >> 4) & 0x3) / 3.0f;
    return vec3(r, g, b);
}

float calculateAttenuation(float d, float r, float range){
    if(d > range) {
        return 0.0f;
    }
    return 2.0f * (1.0f-d/sqrt(d*d+r*r));
}

vec3 calculatePointPBRLighting(vec3 worldPos, vec3 worldNormal, vec3 albedo, vec3 emissivity, float baseReflectivity, float metalicity, float roughness, int lightIndex) {
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

    return (diffuse + specular) * radiance * diffuseFactor * attenuation + emissivity;
}
vec3 computeTerrainLighting(vec3 worldPos, vec3 worldNormal, vec3 albedo, float ambientOcclusion, float sunShadow) {
    vec3 ambient = (vec3(ambientLightIntensity) * albedo) * ambientOcclusion;
    vec3 lighting = ambient;

    // Material attributes
    vec4 materialData = texture(materialAttributesTexture, fragUV);
    float baseReflectivity = materialData.r;
    float metallicity = materialData.g;
    float roughness = materialData.b;
    vec3 emissivity = unpackEmissivity(int(materialData.a));

    // Sun PBR lighting
    if(!sunDisabled) {
        lighting += calculateSunPBRLighting(worldPos, worldNormal, albedo, emissivity, baseReflectivity, metallicity, roughness) * sunShadow;
    }

    // Point lights PBR
    for(int i = 0; i < numActivePointLights; i++) {
        float pointLightShadow = (i < numShadowedLights) ? computePointShadow(worldPos, worldNormal, i) : 1.0f;
        lighting += calculatePointPBRLighting(worldPos, worldNormal, albedo, emissivity, baseReflectivity, metallicity, roughness, i) * pointLightShadow;
    }

    return lighting;
}

vec3 computeGrassLighting(vec3 worldPos, vec3 worldNormal, float vHeight, float curveAngle, float sunShadow) {
        // albedoData contains (height, curveAngle, 0.0, materialId)

    vec3 viewDirection = normalize(cameraPosition - worldPos);
    
    // Use a default direction for camera-based calculations when sun is disabled
    vec3 toCamera = sunDisabled ? vec3(0.0f, 0.0f, -1.0f) : normalize(-SunLight.direction);
    toCamera.y = 0.0f;

    float curveViewDot = cos(curveAngle) * toCamera.x + sin(curveAngle) * toCamera.z;
    bool isInnerCurve = curveViewDot > 0.0f;

    float t = clamp(vHeight / 1.5f, 0.0f, 1.0f);
    vec3 grassColor = mix(grassBaseColor, grassTipColor, pow(t, grassAmbientTransitionPower));

    vec3 normal = normalize(worldNormal) * (isInnerCurve ? -1.0f : 1.0f);
    
    // Calculate tangent for anisotropic specular (needed for both sun and point lights)
    vec3 tangent = normalize(cross(normal, vec3(0.0f, 1.0f, 0.0f)));
    
    // Only apply sun-based lighting if sun is not disabled
    if(!sunDisabled) {
        vec3 lightDir = normalize(-SunLight.direction);
        float diffuse = max(dot(normal, lightDir), 0.0f);
        grassColor *= grassBaseDarkness + grassDiffuseStrength * diffuse;

            // Anisotropic specular (Kajiya-Kay model for hair/grass)
        vec3 halfDir = normalize(lightDir + viewDirection);
        float tdh = dot(tangent, halfDir);
        float spec = pow(sqrt(1.0f - tdh * tdh), grassShininess);
        spec = mix(0.0f, spec, pow(t, grassSpecularTransitionPower));
        vec3 specular = grassSpecularStrength * spec * grassSpecularColor;
        grassColor += specular;

        float translucency = max(dot(-lightDir, normal), 0.0f);
        translucency = mix(0.0f, translucency, pow(t, grassTranslucencyTransitionPower));
        grassColor += grassTranslucencyColor * translucency * grassTranslucencyStrength;

            // Apply sun shadow
        grassColor *= mix(1.0f, sunShadow, sunShadowStrength);
    } else {
        // When sun is disabled, just use base darkness
        grassColor *= grassBaseDarkness;
    }

        // Apply point lights
    for(int i = 0; i < numActivePointLights; i++) {
        float pointLightShadow = (i < numShadowedLights) ? computePointShadow(worldPos, worldNormal, i) : 1.0f;
        vec3 pointLightDir = normalize(pointLights[i].position - worldPos);

            // Diffuse contribution from point light
        float pointDiffuse = max(dot(normal, pointLightDir), 0.0f);
        // Scale down point light contribution significantly to prevent overexposure
        // Use grassDiffuseStrength to match sun lighting behavior and apply additional scaling
        vec3 pointDiffuseColor = pointDiffuse * pointLights[i].color * pointLights[i].intensity * grassDiffuseStrength * 0.3f;

            // Anisotropic specular for point light
        vec3 pointHalfDir = normalize(pointLightDir + viewDirection);
        float pointTdh = dot(tangent, pointHalfDir);
        float pointSpec = pow(sqrt(1.0f - pointTdh * pointTdh), grassShininess);
        pointSpec = mix(0.0f, pointSpec, pow(t, grassSpecularTransitionPower));
        // Scale down specular contribution as well
        vec3 pointSpecular = grassSpecularStrength * pointSpec * grassSpecularColor * 0.3f;

            // Point light attenuation
        float distance = length(pointLights[i].position - worldPos);
        float attenuation = calculateAttenuation(distance, pointLights[i].radius, pointLights[i].range);

        // Add point light contribution with shadow applied
        // The scaling above prevents the grass from becoming too bright/white
        grassColor += (pointDiffuseColor + pointSpecular) * attenuation * mix(1.0f, pointLightShadow, pointLightShadowStrength);
    }

    return grassColor;
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

    // Shadow Map Visualization Mode - Display the shadow map sample at the fragment's light-space location
    if(showShadowMap && csmEnabled) {
        int cascadeIndex = clamp(shadowMapCascade, 0, numCascades - 1);
        vec4 lightSpacePos = lightSpaceMatrices[cascadeIndex] * vec4(fragWorldPos, 1.0f);
        vec3 shadowCoords = lightSpacePos.xyz / lightSpacePos.w;
        shadowCoords = shadowCoords * 0.5f + 0.5f;

        bool outsideShadowMap = shadowCoords.x < 0.0f || shadowCoords.x > 1.0f ||
            shadowCoords.y < 0.0f || shadowCoords.y > 1.0f;

        vec3 color;
        if(outsideShadowMap) {
            color = vec3(1.0f, 0.0f, 0.0f);
        } else {
            // Use texture array with layer index
            float shadowDepth = texture(shadowDepthTextureArray, vec3(shadowCoords.xy, float(cascadeIndex))).r;
            float depthToUse = 1.0f - shadowDepth;
            float normalizedDepth = pow(depthToUse, 0.5f);
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