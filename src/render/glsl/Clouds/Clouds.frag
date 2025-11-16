#version 300 es
precision highp float;
precision highp sampler3D;
#define PI 3.14159265359
in vec2 fragUV;
uniform vec3 cameraPosition;
uniform vec3 cubeMin;
uniform vec3 cubeMax;
uniform mat4 viewInverse;
uniform mat4 projInverse;
uniform sampler3D noiseTexture;
uniform sampler2D weatherMap;
uniform sampler2D depthTexture;
uniform sampler2D lightingDepthTexture;
uniform sampler2D litSceneTexture;
uniform vec3 sunPos;
uniform vec3 sunColor;

//settings
uniform bool enableClouds;
uniform float absorption;
uniform float densityThreshold;
uniform float baseFrequency;
uniform float detailFrequency;
uniform float lightAbsorption;
uniform float lightIntensity;
uniform float darknessThreshold;
uniform float ambientIntensity;
uniform float phaseG;
uniform float phaseMultiplier;
uniform float weatherMapOffsetX;
uniform float weatherMapOffsetY;
uniform int MAX_STEPS;
uniform int MAX_STEPS_LIGHT;

uniform float time;
uniform float windDirectionX;
uniform float windDirectionZ;
uniform float windSpeed;
out vec4 fragColor;
uniform int pathtracerOn;

// Add early exit constants
const float DENSITY_THRESHOLD_SKIP = 0.01f;
const float ALPHA_THRESHOLD = 0.99f;
vec3 skyColor = vec3(1.0f);
// Stolen from Sebastian Lague
vec2 rayBoxDst(vec3 boundsMin, vec3 boundsMax, vec3 rayOrigin, vec3 invRaydir) {
// Adapted from: http://jcgt.org/published/0007/03/04/
    vec3 t0 = (boundsMin - rayOrigin) * invRaydir;
    vec3 t1 = (boundsMax - rayOrigin) * invRaydir;
    vec3 tmin = min(t0, t1);
    vec3 tmax = max(t0, t1);

    float dstA = max(max(tmin.x, tmin.y), tmin.z);
    float dstB = min(tmax.x, min(tmax.y, tmax.z));

    // CASE 1: ray intersects box from outside (0 <= dstA <= dstB)
    // dstA is dst to nearest intersection, dstB dst to far intersection

    // CASE 2: ray intersects box from inside (dstA < 0 < dstB)
    // dstA is the dst to intersection behind the ray, dstB is dst to forward intersection

    // CASE 3: ray misses box (dstA > dstB)

    float dstToBox = max(0.0f, dstA);
    float dstInsideBox = max(0.0f, dstB - dstToBox);
    return vec2(dstToBox, dstInsideBox);
}
float sampleBaseNoise(vec3 pos) {
    float noise = texture(noiseTexture, pos).r;
    return noise;
}
float fbm(vec3 pos, int octaves, float persistence, float lacunarity) {
    float total = 0.0f;
    float amplitude = 1.0f;
    float maxValue = 0.0f;
    for(int i = 0; i < octaves; i++) {
        total += sampleBaseNoise(pos) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        pos *= lacunarity;
    }
    return total / maxValue;
}
float sampleDetailNoise(vec3 p) {
    vec3 worley = texture(noiseTexture, p * 2.0f).gba;
    return (worley.r * 0.625f + worley.g * 0.25f + worley.b * 0.125f);
}

float sampleDensity(vec3 pos) {
    vec3 windDirection = normalize(vec3(windDirectionX, 0.0f, windDirectionZ));
    vec3 windOffset = windDirection * windSpeed * time;
    vec3 animatedPos = pos + windOffset;

    vec3 localPos = (animatedPos - cubeMin) / (cubeMax - cubeMin);
    // Weather map (right now idk if this is the best implementation and it needs some improvement)

    vec2 weatherUV = (animatedPos.xz - cubeMin.xz) / (cubeMax.xz - cubeMin.xz);
    vec2 weatherMapOffset = vec2(weatherMapOffsetX, weatherMapOffsetY);
    vec2 weatherWindOffset = windDirection.xz * windSpeed * time * 0.001f;
    vec4 weather = texture(weatherMap, weatherUV + weatherMapOffset + weatherWindOffset);
    float coverage = weather.r;
    if(coverage < 0.01f)
        return 0.0f;

    float height01 = (animatedPos.y - cubeMin.y) / (cubeMax.y - cubeMin.y);
    if(height01 < 0.1f || height01 > 1.0f)
        return 0.0f;

    float base = fbm(localPos * baseFrequency, 5, 0.5f, 2.0f);
    float density = base * coverage;
    if(density < densityThreshold)
        return 0.0f;

    vec3 detailWindOffset = windOffset * 0.5f;
    vec3 detailPos = (pos + detailWindOffset - cubeMin) / (cubeMax - cubeMin);
    float detail = sampleDetailNoise(detailPos * detailFrequency);
    density *= mix(0.5f, 1.0f, detail);

    // Height falloff and edge fade (stolen from Sebastian Lague)
    float originalHeight = (pos.y - cubeMin.y) / (cubeMax.y - cubeMin.y);
    float heightWeight = smoothstep(0.1f, 0.5f, originalHeight) * (1.0f - smoothstep(0.6f, 1.0f, originalHeight));
    float containerEdgeFadeDst = 50.0f;
    float dstFromEdgeX = min(containerEdgeFadeDst, min(pos.x - cubeMin.x, cubeMax.x - pos.x));
    float dstFromEdgeZ = min(containerEdgeFadeDst, min(pos.z - cubeMin.z, cubeMax.z - pos.z));
    float edgeWeight = min(dstFromEdgeZ, dstFromEdgeX) / containerEdgeFadeDst;
    heightWeight *= edgeWeight;

    density = (density - densityThreshold) * heightWeight;
    return clamp(density, 0.0f, 1.0f);
}

float sampleLight(vec3 pos, vec3 lightDir, float rayDensity) {
    float distInsideBox = rayBoxDst(cubeMin, cubeMax, pos, 1.0f / lightDir).y;

    int lightSteps = rayDensity > 0.5f ? MAX_STEPS_LIGHT : MAX_STEPS_LIGHT / 2;

    float lightTransmittance = 1.0f;
    float tStep = distInsideBox / float(lightSteps);

    for(int i = 0; i < lightSteps; i++) {
        if(lightTransmittance < 0.01f) {
            return darknessThreshold;
        }

        float t = tStep * (float(i) + 0.5f);
        vec3 samplePos = pos + lightDir * t;
        float rawDensity = sampleDensity(samplePos);
        float density = pow(smoothstep(0.0f, 1.0f, rawDensity), 0.6f);
        lightTransmittance *= exp(-density * tStep * lightAbsorption);
    }
    return darknessThreshold + (1.0f - darknessThreshold) * lightTransmittance;
}
float PhaseFunction(float cosTheta, float g) {
    float g2 = g * g;
    float denom = pow(1.0f + g2 - 2.0f * g * cosTheta, 1.5f);
    return (1.0f - g2) / (4.0f * PI * denom);
}

// Add function to reconstruct world position from depth
vec3 getWorldPositionFromDepth(vec2 texCoord, float depth) {
    vec2 ndc = texCoord * 2.0f - 1.0f;
    vec4 clipSpacePos = vec4(ndc, depth * 2.0f - 1.0f, 1.0f);
    vec4 viewSpacePos = projInverse * clipSpacePos;
    viewSpacePos /= viewSpacePos.w;
    vec4 worldPos = viewInverse * viewSpacePos;
    return worldPos.xyz;
}

void main() {
    vec4 lit = vec4(texture(litSceneTexture, fragUV).rgb, 1.0f);

    if(!enableClouds) {
        if(pathtracerOn == 1) {
            discard;
        } else {
            fragColor = lit;
        }
        return;
    }
    vec2 uv = fragUV * 2.0f - 1.0f;
    vec4 rayClip = vec4(uv, -1.0f, 1.0f);
    vec4 rayEye = projInverse * rayClip;
    rayEye = vec4(rayEye.xy, -1.0f, 0.0f);
    vec3 rayDirWorld = normalize((viewInverse * rayEye).xyz);
    vec3 rayOriginWorld = cameraPosition;

    // Read scene depth
    float sceneDepth = min(texture(depthTexture, fragUV).r, texture(lightingDepthTexture, fragUV).r);
    if(pathtracerOn == 1) {
        sceneDepth = texture(depthTexture, fragUV).r;
    }

    // Calculate world position of terrain from depth buffer
    vec3 terrainWorldPos = getWorldPositionFromDepth(fragUV, sceneDepth);
    float distanceToTerrain = length(terrainWorldPos - rayOriginWorld);

    // If depth is at far plane (sky), set to very large distance
    if(sceneDepth >= 1.0f) {
        distanceToTerrain = 1000000.0f;
    }

    // Ray-box intersection
    vec2 dsts = rayBoxDst(cubeMin, cubeMax, rayOriginWorld, 1.0f / rayDirWorld);

    if(dsts.y <= 0.0f) {
        if(pathtracerOn == 1) {
            discard;
        } else {
            fragColor = lit;
        }
        return;
    }

    float tNear = dsts.x;
    float tFar = min(dsts.x + dsts.y, distanceToTerrain); // Clip at terrain depth

    // If terrain is in front of cloud box, don't render clouds
    if(tNear >= distanceToTerrain) {
        if(pathtracerOn == 1) {
            discard;
        } else {
            fragColor = lit;
        }
        return;
    }

    float tStep = (tFar - tNear) / float(MAX_STEPS);

    vec4 accumulatedColor = vec4(0.0f);

    // Blue noise offset to reduce banding
    float blueNoiseOffset = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898f, 78.233f))) * 43758.5453f);

    for(int i = 0; i < MAX_STEPS; i++) {
        float t = tNear + tStep * (float(i) + blueNoiseOffset);

        // Stop raymarching if we've reached the terrain
        if(t >= distanceToTerrain) {
            break;
        }

        vec3 samplePos = rayOriginWorld + rayDirWorld * t;

        // Sample density
        float rawDensity = sampleDensity(samplePos);
        if(rawDensity < DENSITY_THRESHOLD_SKIP) {
            i += 1; // Skip next sample
            continue;
        }
        float density = pow(smoothstep(0.0f, 1.0f, rawDensity), 0.6f);

        // Calculate lighting with adaptive quality
        vec3 lightDir = normalize(sunPos - samplePos);
        float lightTransmittance = sampleLight(samplePos, lightDir, density);

        // Phase function for silver lining
        float cosTheta = dot(rayDirWorld, lightDir);
        float phaseVal = PhaseFunction(cosTheta, phaseG);
        phaseVal = mix(1.0f, phaseVal, phaseMultiplier);

        // Final light color
        vec3 sunLight = sunColor * lightTransmittance * lightIntensity * phaseVal;

        // Powder effect
        float powderEffect = 1.0f - exp(-density * 2.0f);
        sunLight *= mix(1.0f, powderEffect, 0.5f);

        // Ambient and bounce light
        float height = (samplePos.y - cubeMin.y) / (cubeMax.y - cubeMin.y);
        float groundFactor = 1.0f - height;
        vec3 bounceLight = vec3(0.8f, 0.75f, 0.7f) * groundFactor * 0.1f;
        vec3 ambientLight = skyColor * ambientIntensity;

        //Final light color
        vec3 lightColor = sunLight + ambientLight + bounceLight;

        float stepOpacity = 1.0f - exp(-density * tStep * absorption);

        // Accumulate color using front-to-back compositing and premultiplied alpha
        vec4 color = vec4(lightColor * stepOpacity, stepOpacity);
        accumulatedColor += color * (1.0f - accumulatedColor.a);

        if(accumulatedColor.a > ALPHA_THRESHOLD)
            break;
    }

    // When pathtracer is on, output premultiplied alpha for GL blending
    // When pathtracer is off, manually blend with lit scene
    if(pathtracerOn == 1) {
        fragColor = accumulatedColor;
    } else {
        fragColor = vec4(accumulatedColor.rgb + lit.rgb * (1.0f - accumulatedColor.a), 1.0f);
    }
}