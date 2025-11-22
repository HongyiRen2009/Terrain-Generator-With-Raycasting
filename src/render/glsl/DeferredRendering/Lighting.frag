#version 300 es
precision highp float;

in vec2 fragUV;
out vec4 outputColor;

uniform sampler2D normalTexture;
uniform sampler2D albedoTexture;
uniform sampler2D depthTexture;
uniform sampler2D ssaoTexture;

uniform mat4 viewInverse;
uniform mat4 projInverse;

// Material properties (NEW!)
uniform float u_metallicity;
uniform float u_roughness;
uniform vec3 u_terrainColor; // Combined as vec3
uniform float u_ambientStrength;
uniform float u_specularIntensity;
uniform float u_specularPower;
uniform float u_colorBlendStrength; // How much terrain color vs albedo (0-1)
uniform float u_colorIntensity; // Overall color intensity multiplier

// Terrain shading features
uniform float u_slopeShadingStrength;
uniform float u_heightGradientStrength;
uniform vec3 u_heightGradientTop;
uniform vec3 u_heightGradientBottom;
uniform float u_curvatureStrength;
uniform float u_detailNoiseStrength;
uniform float u_detailNoiseScale;
uniform float u_patchinessStrength;
uniform float u_patchinessScale;
uniform vec3 u_patchinessColor;
uniform float u_ambientOcclusionStrength;
uniform float u_erosionNoiseStrength;
uniform float u_erosionNoiseScale;
uniform float u_microRoughnessStrength;
uniform float u_microRoughnessScale;
uniform float u_fogStrength;
uniform float u_fogHeight;
uniform vec3 u_fogColor;

struct Light {
    vec3 position;
    vec3 color;
    vec3 showColor;
    float intensity;
    float radius;
};

#define MAX_LIGHTS 100
uniform Light lights[MAX_LIGHTS];
uniform int numActiveLights;
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

// Simple hash function for noise
float hash(vec3 p) {
    p = fract(p * 0.3183099f + 0.1f);
    p *= 17.0f;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

// Simple 3D noise
float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0f - 2.0f * f);
    
    float n = i.x + i.y * 57.0f + 113.0f * i.z;
    return mix(mix(mix(hash(vec3(n + 0.0f)), hash(vec3(n + 1.0f)), f.x),
                   mix(hash(vec3(n + 57.0f)), hash(vec3(n + 58.0f)), f.x), f.y),
               mix(mix(hash(vec3(n + 113.0f)), hash(vec3(n + 114.0f)), f.x),
                   mix(hash(vec3(n + 170.0f)), hash(vec3(n + 171.0f)), f.x), f.y), f.z);
}

// Ridged noise for erosion
float ridgedNoise(vec3 p) {
    float n = abs(noise(p));
    return 1.0f - n;
}

void main() {
    vec3 fragViewPos = getViewPosition(fragUV);
    vec3 fragWorldPos = getWorldPosition(fragViewPos);
    vec3 viewNormal = normalize(texture(normalTexture, fragUV).rgb);
    vec3 skyColor = vec3(0.5f, 0.7f, 1.0f);
    vec3 worldNormal = normalize(mat3(viewInverse) * viewNormal);
    
    // Use terrain color - blend with albedo for variety but make terrain color more dominant
    vec3 baseAlbedo = texture(albedoTexture, fragUV).rgb;
    // Blend terrain color with base albedo using adjustable blend strength
    vec3 blendedColor = mix(baseAlbedo, u_terrainColor, u_colorBlendStrength);
    
    // Apply terrain shading features
    vec3 finalAlbedo = blendedColor;
    
    // 1. Slope-based shading (use normal Y component)
    float slopeFactor = worldNormal.y; // 1.0 = flat, 0.0 = vertical
    finalAlbedo = mix(finalAlbedo, finalAlbedo * (0.5f + 0.5f * slopeFactor), u_slopeShadingStrength);
    
    // 2. Height gradient
    float height01 = clamp((fragWorldPos.y + 50.0f) / 100.0f, 0.0f, 1.0f); // Normalize height
    vec3 heightColor = mix(u_heightGradientBottom, u_heightGradientTop, height01);
    finalAlbedo = mix(finalAlbedo, heightColor, u_heightGradientStrength);
    
    // 3. Curvature shading (cheap approximation using normal variation)
    // Sample normals at nearby points to estimate curvature
    vec2 texelSize = 1.0f / vec2(1920.0f, 1080.0f); // Approximate screen size
    vec3 normalX = normalize(texture(normalTexture, fragUV + vec2(texelSize.x, 0.0f)).rgb);
    vec3 normalY = normalize(texture(normalTexture, fragUV + vec2(0.0f, texelSize.y)).rgb);
    float curvature = length(normalX - viewNormal) + length(normalY - viewNormal);
    curvature = clamp(curvature * 2.0f, 0.0f, 1.0f);
    // Darken convex areas, lighten concave
    float curvatureFactor = mix(0.7f, 1.3f, 1.0f - curvature);
    finalAlbedo = mix(finalAlbedo, finalAlbedo * curvatureFactor, u_curvatureStrength);
    
    // 4. Detail texture noise
    float detailNoise = noise(fragWorldPos * u_detailNoiseScale) * 2.0f - 1.0f;
    finalAlbedo += detailNoise * u_detailNoiseStrength;
    
    // 5. Patchiness (mix between two colors based on noise)
    float patchNoise = noise(fragWorldPos * u_patchinessScale);
    vec3 patchColor = mix(finalAlbedo, u_patchinessColor, patchNoise);
    finalAlbedo = mix(finalAlbedo, patchColor, u_patchinessStrength);
    
    // 6. Erosion noise
    float erosion = ridgedNoise(fragWorldPos * u_erosionNoiseScale);
    finalAlbedo = mix(finalAlbedo, finalAlbedo * (0.7f + 0.3f * erosion), u_erosionNoiseStrength);
    
    // Apply color intensity multiplier
    vec3 albedo = finalAlbedo * u_colorIntensity;
    
    // 7. Micro-roughness (perturb normal slightly)
    vec3 microNoise = vec3(
        noise(fragWorldPos * u_microRoughnessScale),
        noise(fragWorldPos * u_microRoughnessScale + vec3(100.0f)),
        noise(fragWorldPos * u_microRoughnessScale + vec3(200.0f))
    ) * 2.0f - 1.0f;
    vec3 perturbedNormal = normalize(worldNormal + microNoise * u_microRoughnessStrength);
    worldNormal = mix(worldNormal, perturbedNormal, u_microRoughnessStrength);
    
    float ambientOcclusion = texture(ssaoTexture, fragUV).r;
    
    // 8. Fake ambient occlusion (enhance existing AO)
    float fakeAO = 1.0f;
    // Simple approximation: use normal Y and distance-based falloff
    fakeAO = mix(0.3f, 1.0f, worldNormal.y * 0.5f + 0.5f);
    ambientOcclusion = mix(ambientOcclusion, ambientOcclusion * fakeAO, u_ambientOcclusionStrength);
    
    // Use adjustable ambient strength
    vec3 ambient = (vec3(u_ambientStrength) * albedo) * ambientOcclusion;
    vec3 lighting = ambient;
    
    for(int i = 0; i < numActiveLights; i++) {
        vec3 lightDir = normalize(lights[i].position - fragWorldPos);
        float diff = max(dot(lightDir, worldNormal), 0.0f);
        // Diffuse should multiply by albedo to get correct surface color
        vec3 diffuse = diff * albedo * lights[i].color * lights[i].intensity;
        
        vec3 viewDir = normalize(cameraPosition - fragWorldPos);
        vec3 reflectDir = reflect(-lightDir, worldNormal);
        
        // Use adjustable specular power and intensity
        float spec = pow(max(dot(viewDir, reflectDir), 0.0f), u_specularPower);
        vec3 specular = spec * lights[i].color * lights[i].intensity * u_specularIntensity;
        
        // Simple metallicity: metallic surfaces reflect light color more
        specular = mix(specular, specular * albedo, u_metallicity);
        
        // Roughness affects specular: rough surfaces have less intense specular
        specular *= (1.0f - u_roughness * 0.8f);
        
        float distance = length(lights[i].position - fragWorldPos);
        float attenuation = 1.0f / (1.0f + (distance / lights[i].radius) * (distance / lights[i].radius));
        
        diffuse *= attenuation;
        specular *= attenuation;
        
        // Add diffuse and specular directly (don't multiply by ambient)
        lighting += diffuse + specular;
    }
    
    vec3 finalColor = lighting;
    
    // 9. Fog (height-based)
    if(u_fogStrength > 0.0f) {
        float fogFactor = exp(-max(0.0f, fragWorldPos.y - u_fogHeight) * u_fogStrength * 0.1f);
        fogFactor = clamp(fogFactor, 0.0f, 1.0f);
        finalColor = mix(u_fogColor, finalColor, fogFactor);
    }
    
    if(texture(depthTexture, fragUV).r >= 1.0f) {
        outputColor = vec4(skyColor, 1.0f);
    } else {
        outputColor = vec4(finalColor, 1.0f);
    }
}