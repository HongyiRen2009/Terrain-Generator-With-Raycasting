#version 300 es
precision highp float;

#define MAX_LIGHTS 100
#define MAX_SHADOWED_POINT_LIGHTS 5
in vec2 fragUV;
out vec4 outputColor;
uniform sampler2D normalTexture;
uniform sampler2D albedoTexture;
uniform sampler2D materialAttributesTexture;
uniform sampler2D depthTexture;
uniform sampler2D ssaoTexture;
// Shadow mask textures from dedicated shadow passes
uniform sampler2D sunShadowMask;
uniform sampler2D pointShadowMaskA;
uniform sampler2D pointShadowMaskB;
uniform sampler2D pointShadowMaskC;
uniform sampler2D pointShadowMaskD;
uniform sampler2D pointShadowMaskE;

uniform mat4 viewInverse;
uniform mat4 projInverse;

uniform float ambientLightIntensity;
//Shadow Uniforms
uniform int numShadowedLights;
uniform bool sunDisabled;
uniform bool cascadeDebug;

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

float calculateFresnel(vec3 viewDir, vec3 halfDir, float baseReflectivity) {
    return baseReflectivity + (1.0f - baseReflectivity) * pow(1.0f - dot(viewDir, halfDir), 5.0f);
}

// Sample point light shadow mask from pre-computed shadow mask textures
float getPointShadowMask(int lightIndex) {
    switch(lightIndex) {
        case 0: return texture(pointShadowMaskA, fragUV).r;
        case 1: return texture(pointShadowMaskB, fragUV).r;
        case 2: return texture(pointShadowMaskC, fragUV).r;
        case 3: return texture(pointShadowMaskD, fragUV).r;
        case 4: return texture(pointShadowMaskE, fragUV).r;
        default: return 1.0f;
    }
}

// Cascade debug visualization colors
vec3 getCascadeDebugColor(int primaryCascade, int secondaryCascade, float blendFactor) {
    vec3 cascadeColors[8] = vec3[](
        vec3(1.0f, 0.2f, 0.2f), // Red - Cascade 0 (smallest/closest)
        vec3(0.2f, 1.0f, 0.2f), // Green - Cascade 1
        vec3(0.2f, 0.2f, 1.0f), // Blue - Cascade 2
        vec3(1.0f, 1.0f, 0.2f), // Yellow - Cascade 3
        vec3(1.0f, 0.2f, 1.0f), // Magenta - Cascade 4
        vec3(0.2f, 1.0f, 1.0f), // Cyan - Cascade 5
        vec3(1.0f, 0.6f, 0.2f), // Orange - Cascade 6
        vec3(0.6f, 0.2f, 1.0f)  // Purple - Cascade 7
    );
    vec3 primaryColor = cascadeColors[primaryCascade % 8];
    vec3 secondaryColor = cascadeColors[secondaryCascade % 8];
    if(blendFactor > 0.0f) {
        vec3 blendedColor = mix(primaryColor, secondaryColor, blendFactor);
        return mix(blendedColor, vec3(1.0f), blendFactor * 0.3f);
    }
    return primaryColor;
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

    // Point lights PBR - use pre-computed shadow masks
    for(int i = 0; i < numActivePointLights; i++) {
        float pointLightShadow = (i < numShadowedLights) ? getPointShadowMask(i) : 1.0f;
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

    // Point lights - use pre-computed shadow masks
    for(int i = 0; i < numActivePointLights; i++) {
        float pointLightShadow = (i < numShadowedLights) ? getPointShadowMask(i) : 1.0f;
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
    vec3 fragViewPos = getViewPosition(fragUV, projInverse);
    vec3 fragWorldPos = getWorldPosition(fragViewPos, viewInverse);

    vec3 viewNormal = normalize(texture(normalTexture, fragUV).rgb);
    vec3 skyColor = vec3(0.5f, 0.7f, 1.0f);

    vec3 worldNormal = normalize(mat3(viewInverse) * viewNormal);

    vec3 albedo = texture(albedoTexture, fragUV).rgb;
    float ambientOcclusion = texture(ssaoTexture, fragUV).r;

    // Sample pre-computed sun shadow mask data
    // R = shadow, G = primary cascade (normalized), B = secondary cascade (normalized), A = blend factor
    vec4 sunShadowData = texture(sunShadowMask, fragUV);
    float sunShadow = sunShadowData.r;
    int primaryCascade = int(sunShadowData.g * 8.0f + 0.5f);
    int secondaryCascade = int(sunShadowData.b * 8.0f + 0.5f);
    float cascadeBlendFactor = sunShadowData.a;

    // Check if this is a grass material (material ID = 0.5 in alpha channel)
    float materialId = texture(albedoTexture, fragUV).a;
    bool isGrass = abs(materialId - 0.5f) < 0.01f;

    // Apply cascade debug colors to albedo when enabled
    if(cascadeDebug && !isGrass) {
        albedo = getCascadeDebugColor(primaryCascade, secondaryCascade, cascadeBlendFactor);
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