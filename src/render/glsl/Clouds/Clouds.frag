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
uniform sampler2D litSceneTexture;
uniform vec3 sunPos;
uniform vec3 sunColor;

//settings
uniform bool CLOUDS_enableClouds;
uniform vec3 CLOUDS_baseCloudColor;
uniform float CLOUDS_absorption;
uniform float CLOUDS_densityThreshold;
uniform float CLOUDS_baseFrequency;
uniform float CLOUDS_detailFrequency;
uniform float CLOUDS_simplexMultiplier;
uniform float CLOUDS_lightAbsorption;
uniform float CLOUDS_lightIntensity;
uniform float CLOUDS_darknessThreshold;
uniform float CLOUDS_lightDarkSharpness;
uniform float CLOUDS_skyContribution;
uniform float CLOUDS_ambientIntensity;
uniform float CLOUDS_blueNoiseAmplitude;
uniform float CLOUDS_phaseG;
uniform float CLOUDS_phaseMultiplier;
uniform float CLOUDS_weatherMapOffsetX;
uniform float CLOUDS_weatherMapOffsetY;
uniform int CLOUDS_MAX_STEPS;
uniform int CLOUDS_MAX_STEPS_LIGHT;

uniform float time;
uniform float CLOUDS_windDirectionX;
uniform float CLOUDS_windDirectionZ;
uniform float CLOUDS_windSpeed;
out vec4 fragColor;
uniform int pathtracerOn;

// Add early exit constants
const float DENSITY_THRESHOLD_SKIP = 0.01f;
const float ALPHA_THRESHOLD = 0.99f;
vec3 skyColor = vec3(0.5f, 0.7f, 0.9f);
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

float sampleDensity(vec3 pos) {
    vec3 windDirection = normalize(vec3(CLOUDS_windDirectionX, 0.0f, CLOUDS_windDirectionZ));
    vec3 windOffset = windDirection * CLOUDS_windSpeed * time;
    vec3 animatedPos = pos + windOffset + vec3(cameraPosition.x, 0.0f, cameraPosition.z);

    vec3 localPos = (animatedPos - cubeMin) / (cubeMax - cubeMin);
    vec2 weatherUV = vec2(localPos.x + CLOUDS_weatherMapOffsetX, localPos.z + CLOUDS_weatherMapOffsetY);
    float coverage = texture(weatherMap, weatherUV).r;

    // Sample base Worley noise (inverted so high values = dense clouds)
    float worley = 1.0f - texture(noiseTexture, localPos * CLOUDS_baseFrequency).r;

    // Sample Simplex noise for variation
    float simplex = texture(noiseTexture, localPos * CLOUDS_baseFrequency).a;

    // Combine: Worley for structure, Simplex for billowy variation
    // Use remapping to make Simplex centered around 0.5
    float simplexRemapped = (simplex - 0.5f) * 2.0f; // Range: -1 to 1
    float base = worley + simplexRemapped * CLOUDS_simplexMultiplier * worley; // Modulate by worley

    // Apply coverage from weather map
    base *= (coverage);

    float density = base;

    // Height gradient for natural cloud formation
    float height01 = (pos.y - cubeMin.y) / (cubeMax.y - cubeMin.y);
    float heightWeight = smoothstep(0.15f, 0.5f, height01) * (1.0f - smoothstep(0.7f, 1.0f, height01));
    density *= heightWeight;

    // Add detail erosion using smaller-scale Worley noise
    float detail = 1.0f - (texture(noiseTexture, localPos * CLOUDS_detailFrequency).g * 0.5f +
        texture(noiseTexture, localPos * (CLOUDS_detailFrequency * 2.0f)).b * 0.25f);
    density -= detail * 0.5f * density; // Erode proportionally

    return clamp(density - CLOUDS_densityThreshold, 0.0f, 1.0f);
}

float sampleLight(vec3 pos, vec3 lightDir, float rayDensity) {
    float distInsideBox = rayBoxDst(cubeMin, cubeMax, pos, 1.0f / lightDir).y;

    int lightSteps = rayDensity > 0.5f ? CLOUDS_MAX_STEPS_LIGHT : CLOUDS_MAX_STEPS_LIGHT / 2;

    float lightTransmittance = 1.0f;
    float tStep = distInsideBox / float(lightSteps);

    for(int i = 0; i < lightSteps; i++) {
        if(lightTransmittance < 0.01f) {
            return CLOUDS_darknessThreshold;
        }

        float t = tStep * (float(i) + 0.5f);
        vec3 samplePos = pos + lightDir * t;
        float rawDensity = sampleDensity(samplePos);
        float density = rawDensity;
        lightTransmittance *= exp(-density * tStep * CLOUDS_lightAbsorption);
    }
    lightTransmittance = pow(lightTransmittance, CLOUDS_lightDarkSharpness);

    return CLOUDS_darknessThreshold + (1.0f - CLOUDS_darknessThreshold) * lightTransmittance;
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
    vec4 lit = texture(litSceneTexture, fragUV);
    if(!CLOUDS_enableClouds) {
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
    float sceneDepth = texture(depthTexture, fragUV).r;

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

    float tStep = (tFar - tNear) / float(CLOUDS_MAX_STEPS);

    vec4 accumulatedColor = vec4(0.0f);

    // Blue noise offset to reduce banding
    float blueNoiseOffset = fract(sin(dot(gl_FragCoord.xy + time * 0.1f, vec2(12.9898f, 78.233f))) * 43758.5453f) * 0.5f;
    for(int i = 0; i < CLOUDS_MAX_STEPS; i++) {
        float t = tNear + tStep * (float(i) + blueNoiseOffset * CLOUDS_blueNoiseAmplitude); // Reduced from 1.0 to 0.25
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
        float density = rawDensity;

        // Calculate lighting with adaptive quality
        vec3 lightDir = normalize(sunPos - samplePos);
        float lightTransmittance = sampleLight(samplePos, lightDir, density);

        // Phase function for silver lining
        float cosTheta = dot(rayDirWorld, lightDir);
        float phaseVal = PhaseFunction(cosTheta, CLOUDS_phaseG);
        phaseVal = mix(1.0f, phaseVal, CLOUDS_phaseMultiplier);

        // Final light color
        vec3 sunLight = sunColor * lightTransmittance * CLOUDS_lightIntensity * phaseVal;

        // Powder effect
        float powderEffect = 1.0f - exp(-density * 2.0f);
        sunLight *= mix(1.0f, powderEffect, 0.5f);

        // Ambient and bounce light
        float height = (samplePos.y - cubeMin.y) / (cubeMax.y - cubeMin.y);
        float groundFactor = 1.0f - height;
        vec3 bounceLight = vec3(0.8f, 0.75f, 0.7f) * groundFactor * 0.1f;
        vec3 ambientLight = mix(CLOUDS_baseCloudColor, skyColor, CLOUDS_skyContribution) * CLOUDS_ambientIntensity;

        //Final light color
        vec3 lightColor = sunLight + ambientLight + bounceLight;

        float stepOpacity = 1.0f - exp(-density * tStep * CLOUDS_absorption);

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