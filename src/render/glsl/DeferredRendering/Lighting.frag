#version 300 es
precision highp float;
precision lowp usampler2D;
precision lowp sampler2DArray;
#define MAX_LIGHTS 100
#define MAX_SHADOWED_POINT_LIGHTS 5
in vec2 fragUV;
out vec4 outputColor;
uniform sampler2D gNormal;
uniform sampler2D gAux;
uniform usampler2D gMaterialID;
uniform sampler2D gDepth;
uniform sampler2D ssaoTexture;
uniform sampler2DArray materialsTextureArray;
// Shadow mask textures from dedicated shadow passes
uniform sampler2D blurredSunShadowMask;
uniform sampler2D blurredPointShadowMaskA;
uniform sampler2D blurredPointShadowMaskB;
uniform sampler2D blurredPointShadowMaskC;
uniform sampler2D blurredPointShadowMaskD;
uniform sampler2D blurredPointShadowMaskE;

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
    float depth = texture(gDepth, texCoord).r;
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
        case 0: return texture(blurredPointShadowMaskA, fragUV).r;
        case 1: return texture(blurredPointShadowMaskB, fragUV).r;
        case 2: return texture(blurredPointShadowMaskC, fragUV).r;
        case 3: return texture(blurredPointShadowMaskD, fragUV).r;
        case 4: return texture(blurredPointShadowMaskE, fragUV).r;
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
vec3 calculateSunPBRLighting(vec3 worldPos, vec3 worldNormal, vec3 albedo, float baseReflectivity, float metallicity, float roughness) {
    vec3 viewDir = normalize(cameraPosition - worldPos);
    vec3 lightDir = normalize(-SunLight.direction);
    vec3 halfWay = normalize(viewDir + lightDir);
    float specularCoefficient = calculateFresnel(viewDir, normalize(worldNormal + viewDir), baseReflectivity);
    float diffuseCoefficient = (1.0f - specularCoefficient) * (1.0f - metallicity);
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
float calculateAttenuation(float d, float r) {
    return 2.0f * (1.0f - d / sqrt(d * d + r * r));
}

vec3 calculatePointPBRLighting(vec3 worldPos, vec3 worldNormal, vec3 albedo, float baseReflectivity, float metallicity, float roughness, int lightIndex) {
    vec3 viewDir = normalize(cameraPosition - worldPos);
    vec3 lightDir = normalize(pointLights[lightIndex].position - worldPos);
    vec3 halfWay = normalize(viewDir + lightDir);
    float specularCoefficient = calculateFresnel(viewDir, normalize(worldNormal + viewDir), baseReflectivity);
    float diffuseCoefficient = (1.0f - specularCoefficient) * (1.0f - metallicity);
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
    float attenuation = calculateAttenuation(distance, pointLights[lightIndex].radius);
    float diffuseFactor = max(dot(worldNormal, lightDir), 0.0f);

    return (diffuse + specular) * radiance * diffuseFactor * attenuation;
}
vec3 computeTerrainLighting(vec3 worldPos, vec3 worldNormal, vec3 albedo, float baseReflectivity, float metallicity, float roughness, float ambientOcclusion, float sunShadow) {
    vec3 ambient = (vec3(ambientLightIntensity) * albedo) * ambientOcclusion;
    vec3 lighting = ambient;

    // Sun PBR lighting
    if(!sunDisabled) {
        lighting += calculateSunPBRLighting(worldPos, worldNormal, albedo, baseReflectivity, metallicity, roughness) * sunShadow;
    }

    // Point lights PBR - use pre-computed shadow masks
    for(int i = 0; i < numActivePointLights; i++) {
        float pointLightShadow = (i < numShadowedLights) ? getPointShadowMask(i) : 1.0f;
        lighting += calculatePointPBRLighting(worldPos, worldNormal, albedo, baseReflectivity, metallicity, roughness, i) * pointLightShadow;
    }
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
        float attenuation = calculateAttenuation(distance, pointLights[i].radius);

        float shadowFactor = mix(1.0f, pointLightShadow, pointLightShadowStrength);
        grassColor += (pointDiffuseColor + pointSpecular) * attenuation * shadowFactor;
    }

    return pow(grassColor, vec3(2.2f));
}

void main() {
    vec3 fragViewPos = getViewPosition(fragUV, projInverse);
    vec3 fragWorldPos = getWorldPosition(fragViewPos, viewInverse);

    vec3 viewNormal = normalize(texture(gNormal, fragUV).rgb);
    vec3 skyColor = vec3(0.5f, 0.7f, 1.0f);

    vec3 worldNormal = normalize(mat3(viewInverse) * viewNormal);

    vec4 auxData = texture(gAux, fragUV);
    vec2 uv = auxData.xy;
    uint materialID = texture(gMaterialID, fragUV).r;
    vec3 albedo;
    
    float ambientOcclusion = texture(ssaoTexture, fragUV).r;

    // Check if this is an emissive light (materialID == 69)
    if(materialID == 69u) {
        float packedEmissivity = uv.x;
        float packed = packedEmissivity * 63.0;
        float r = mod(packed, 4.0) / 3.0;
        float g = mod(floor(packed / 4.0), 4.0) / 3.0;
        float b = mod(floor(packed / 16.0), 4.0) / 3.0;
        outputColor = vec4(vec3(r, g, b), 1.0f);
        return;
    }

    // Sample pre-computed sun shadow mask data
    // R = shadow, G = primary cascade (normalized), B = secondary cascade (normalized), A = blend factor
    vec4 sunShadowData = texture(blurredSunShadowMask, fragUV);
    float sunShadow = sunShadowData.r;
    int primaryCascade = int(sunShadowData.g * 8.0f + 0.5f);
    int secondaryCascade = int(sunShadowData.b * 8.0f + 0.5f);
    float cascadeBlendFactor = sunShadowData.a;

    // Check if this is a grass material (materialID == 1)
    bool isGrass = (materialID == 67u);

    // Apply cascade debug colors to albedo when enabled
    if(cascadeDebug && !isGrass) {
        albedo = getCascadeDebugColor(primaryCascade, secondaryCascade, cascadeBlendFactor);
    }

    vec3 lighting;

    if(isGrass) {
        // For grass: auxData.x = vHeight, auxData.y = curveAngle
        float vHeight = auxData.x;
        float curveAngle = auxData.y;
        lighting = computeGrassLighting(fragWorldPos, worldNormal, vHeight, curveAngle, sunShadow);
    } else {
        // Standard PBR lighting for terrain (use placeholder values)
        float baseReflectivity = 0.04f;
        float metallicity = 0.0f;
        float roughness = 0.8f;
        vec3 blendWeights = abs(worldNormal);
        // Tighten up the blending zone:
        blendWeights = (blendWeights - 0.2) * 7.0;
        blendWeights = max(blendWeights, 0.0); //Force weights to sum to 1.0 (very important!)
        float weightSum = blendWeights.x + blendWeights.y + blendWeights.z;
        blendWeights /= max(weightSum, 0.0001); // avoid division by zero on flat normals
        vec2 coord1 = fragWorldPos.yz;
        vec2 coord2 = fragWorldPos.zx;
        vec2 coord3 = fragWorldPos.xy;
        uint layer = 5u * materialID;
        vec3 color1 = texture(materialsTextureArray, vec3(coord1, float(layer))).rgb;
        vec3 color2 = texture(materialsTextureArray, vec3(coord2, float(layer))).rgb;
        vec3 color3 = texture(materialsTextureArray, vec3(coord3, float(layer))).rgb;
        // Now determine a color value and bump vector for each of the 3projections, blend them
        albedo =  color1.xyz * blendWeights.xxx +
                  color2.xyz * blendWeights.yyy +
                  color3.xyz * blendWeights.zzz;
        lighting = computeTerrainLighting(fragWorldPos, worldNormal, albedo, baseReflectivity, metallicity, roughness, ambientOcclusion, sunShadow);
    }

    if(texture(gDepth, fragUV).r >= 1.0f) {
        outputColor = vec4(skyColor, 1.0f);
    } else {
        outputColor = vec4(lighting, 1.0f);
    }
}