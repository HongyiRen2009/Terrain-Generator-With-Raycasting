#version 300 es
precision highp float;
precision highp sampler2D;
precision highp sampler3D;
#define PI 3.14159265359
#define e 2.71828182846
in vec2 fragUV;
uniform vec3 cameraPosition;
uniform vec3 cubeMin;
uniform vec3 cubeMax;
uniform mat4 viewInverse;
uniform mat4 projInverse;
uniform sampler3D noiseTexture;
uniform sampler3D detailNoiseTexture;
uniform sampler2D weatherMap;
uniform sampler2D depthTexture;
uniform sampler2D litSceneTexture;
uniform vec3 sunPos;
uniform vec3 sunColor;

//settings
uniform bool CLOUDS_enableClouds;
uniform vec3 CLOUDS_baseCloudColor;
uniform float CLOUDS_absorption;
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
uniform float CLOUDS_densityFalloffIntensity; 
uniform float CLOUDS_distanceFalloffIntensity;
// density settings
uniform float CLOUDS_globalCoverage;
uniform float CLOUDS_globalDensity;
uniform float CLOUDS_baseNoiseFrequency;
uniform float CLOUDS_detailNoiseFrequency;
uniform float CLOUDS_weatherMapFrequency;
uniform vec3 CLOUDS_noiseWeights;
uniform vec3 CLOUDS_detailWeights;
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
float SAT(float value){
    return clamp(value, 0.0f, 1.0f);
}
float Remap(float value, float minA, float maxA, float minB, float maxB) {
    return minB + (value - minA) * (maxB - minB) / (maxA - minA);
}
float SATRemap(float value, float minA, float maxA, float minB, float maxB) {
    return SAT(Remap(value, minA, maxA, minB, maxB));
}
float lerp(float a, float b, float t) {
    return a + t * (b - a);
}
float shapeAlteringFactor(float heightPercent, vec4 weatherMapValue) {
    float peakHeight = weatherMapValue.b;
    float bottomRound = SAT(Remap(heightPercent, 0.0f, 0.07f, 0.0f, 1.0f));
    float topRound = SAT(Remap(heightPercent, peakHeight*0.2,peakHeight, 1.0f, 0.0f));
    float shapeAlter = topRound * bottomRound;
    return shapeAlter;
}
float densityAlteringFactor(float heightPercent, vec4 weatherMapValue) {
    float bottomAlter = heightPercent*SAT(Remap(heightPercent,0.0,0.15,0.0,1.0));
    float topAlter = SAT(Remap(heightPercent,0.9,1.0,1.0,0.0));
    float densityAlter = CLOUDS_globalDensity*bottomAlter*topAlter*weatherMapValue.a*2.0f;
    return densityAlter;
}
float coverage(vec4 weatherMapValue) {
    float lowCoverage = weatherMapValue.r;
    float highCoverage = weatherMapValue.g;
    float coverage = max(lowCoverage,SAT(CLOUDS_globalCoverage-0.5f)*2.0f*highCoverage);
    return coverage;
    }
float sampleDensity(vec3 pos) {
    vec3 windDirection = normalize(vec3(CLOUDS_windDirectionX, 0.0f, CLOUDS_windDirectionZ));
    vec3 windOffset = windDirection * CLOUDS_windSpeed * time;
    vec3 animatedPos = pos + windOffset + vec3(cameraPosition.x, 0.0f, cameraPosition.z);

    vec3 localPos = animatedPos * 0.001f; // Scale down for noise sampling
    vec2 weatherUV = vec2(localPos.x + CLOUDS_weatherMapOffsetX, localPos.z + CLOUDS_weatherMapOffsetY)* CLOUDS_weatherMapFrequency;
    vec4 weatherSample = texture(weatherMap, weatherUV);
    float heightPercent = (pos.y - cubeMin.y) / (cubeMax.y - cubeMin.y);
    vec4 noiseSample = texture(noiseTexture, localPos*CLOUDS_baseNoiseFrequency);
    float shapeAlter = shapeAlteringFactor(heightPercent, weatherSample);
    float densityAlter = densityAlteringFactor(heightPercent, weatherSample);
    float coverageFactor = coverage(weatherSample);
    
    float baseNoise = Remap(noiseSample.r,(dot(noiseSample.gba, (CLOUDS_noiseWeights)))-1.0,1.0,0.0,1.0);
    float alteredNoise = SATRemap(baseNoise*shapeAlter,1.0-CLOUDS_globalCoverage*coverageFactor,1.0,0.0,1.0);
    if(alteredNoise <= 0.0f) {
        return 0.0f;
    }
    vec4 detailNoise = texture(detailNoiseTexture, localPos*CLOUDS_detailNoiseFrequency);
    float detailFBM = dot(detailNoise.rgb, (CLOUDS_detailWeights));
    float detailNoiseMod = 0.35*pow(e,-CLOUDS_globalCoverage*0.75)*lerp(detailFBM,1.0-detailFBM,SAT(heightPercent*5.0));
    float density = SATRemap(alteredNoise,detailNoiseMod,1.0,0.0,1.0  ) * densityAlter;
    return density;
    
}
float calculateStepLength(float baseStep, float density, float distanceFromCamera) {
    return baseStep+distanceFromCamera/100.0*CLOUDS_distanceFalloffIntensity;
}
float sampleLight(vec3 pos, vec3 lightDir, float rayDensity) {
    float distInsideBox = rayBoxDst(cubeMin, cubeMax, pos, 1.0f / lightDir).y;

    int lightSteps = rayDensity > 0.5f ? CLOUDS_MAX_STEPS_LIGHT : CLOUDS_MAX_STEPS_LIGHT / 2;

    float lightTransmittance = 1.0f;
    float tStepBase = distInsideBox / float(lightSteps);

    float t = 0.0f;
    for(int i = 0; i < lightSteps && t < distInsideBox; i++) {
        if(lightTransmittance < 0.01f) {
            return CLOUDS_darknessThreshold;
        }

        float tMid = t + tStepBase * 0.5f;
        vec3 samplePos = pos + lightDir * tMid;
        float rawDensity = sampleDensity(samplePos);
        float density = rawDensity;

        // Adaptive step length for lightmarching
        float distanceFromCamera = length(samplePos - cameraPosition);
        float tStep = calculateStepLength(tStepBase, density, distanceFromCamera);

        lightTransmittance *= exp(-density * tStep * CLOUDS_lightAbsorption);
        t += tStep;
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

vec4 calculateCloudColor(
    vec3 rayOriginWorld,
    vec3 rayDirWorld,
    float tNear,
    float tFar,
    float distanceToTerrain,
    float tStepBase
) {
    vec4 accumulatedColor = vec4(0.0f);

    float blueNoiseOffset = fract(sin(dot(gl_FragCoord.xy + time * 0.1f, vec2(12.9898f, 78.233f))) * 43758.5453f) * CLOUDS_blueNoiseAmplitude;

    float t = tNear+blueNoiseOffset * tStepBase;
    for(int i = 0; i < CLOUDS_MAX_STEPS; i++) {
        if(t >= tFar || t >= distanceToTerrain) {
            break;
        }
        vec3 samplePos = rayOriginWorld + rayDirWorld * t;

        float rawDensity = sampleDensity(samplePos);
        if(rawDensity < DENSITY_THRESHOLD_SKIP) {
            t += tStepBase * 2.0f; // Skip next sample adaptively
            continue;
        }
        float density = rawDensity;

        float distanceFromCamera = length(samplePos - cameraPosition);
        float tStep = calculateStepLength(tStepBase, density, distanceFromCamera);

        vec3 lightDir = normalize(sunPos - samplePos);
        float lightTransmittance = sampleLight(samplePos, lightDir, density);

        float cosTheta = dot(rayDirWorld, lightDir);
        float phaseVal = PhaseFunction(cosTheta, CLOUDS_phaseG);
        phaseVal = mix(1.0f, phaseVal, CLOUDS_phaseMultiplier);

        vec3 sunLight = sunColor * lightTransmittance * CLOUDS_lightIntensity * phaseVal;

        float powderEffect = 1.0f - exp(-density * 2.0f);
        sunLight *= mix(1.0f, powderEffect, 0.5f);

        float height = (samplePos.y - cubeMin.y) / (cubeMax.y - cubeMin.y);
        float groundFactor = 1.0f - height;
        vec3 bounceLight = vec3(0.8f, 0.75f, 0.7f) * groundFactor * 0.1f;
        vec3 ambientLight = mix(CLOUDS_baseCloudColor, skyColor, CLOUDS_skyContribution) * CLOUDS_ambientIntensity;

        vec3 lightColor = sunLight + ambientLight + bounceLight;

        float stepOpacity = 1.0f - exp(-density * tStep * CLOUDS_absorption);

        vec4 color = vec4(lightColor * stepOpacity, stepOpacity);
        accumulatedColor += color * (1.0f - accumulatedColor.a);

        if(accumulatedColor.a > ALPHA_THRESHOLD)
            break;

        t += tStep;
    }
    return accumulatedColor;
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

    float sceneDepth = texture(depthTexture, fragUV).r;
    vec3 terrainWorldPos = getWorldPositionFromDepth(fragUV, sceneDepth);
    float distanceToTerrain = length(terrainWorldPos - rayOriginWorld);

    if(sceneDepth >= 1.0f) {
        distanceToTerrain = 1000000.0f;
    }

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
    float tFar = min(dsts.x + dsts.y, distanceToTerrain);

    if(tNear >= distanceToTerrain) {
        if(pathtracerOn == 1) {
            discard;
        } else {
            fragColor = lit;
        }
        return;
    }

    float tStepBase = (tFar - tNear) / float(CLOUDS_MAX_STEPS);

    vec4 accumulatedColor = calculateCloudColor(
        rayOriginWorld,
        rayDirWorld,
        tNear,
        tFar,
        distanceToTerrain,
        tStepBase
    );

    if(pathtracerOn == 1) {
        fragColor = accumulatedColor;
    } else {
        fragColor = vec4(accumulatedColor.rgb + lit.rgb * (1.0f - accumulatedColor.a), 1.0f);
    }
}