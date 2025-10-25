#version 300 es
precision highp float;
precision highp sampler3D;
#define PI 3.14159265359
in vec2 fragUV;
uniform vec3 cameraPos;
uniform vec3 cubeMin;
uniform vec3 cubeMax;
uniform mat4 viewInverse;
uniform mat4 projInverse;
uniform sampler3D noiseTexture;
uniform sampler2D weatherMap;
uniform vec3 sunPos;
uniform vec3 sunColor;

//settings
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
out vec4 fragColor;
const int MAX_STEPS = 64;
const int MAX_STEPS_LIGHT = 8;
vec3 skyColor = vec3(1.0f);
bool intersectBox(vec3 rayOrigin, vec3 rayDir, vec3 boxMin, vec3 boxMax, out float tNear, out float tFar) {
    vec3 tMin = (boxMin - rayOrigin) / rayDir;
    vec3 tMax = (boxMax - rayOrigin) / rayDir;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    tNear = max(max(t1.x, t1.y), t1.z);
    tFar = min(min(t2.x, t2.y), t2.z);
    return tNear <= tFar && tFar >= 0.0f;
}
            // Returns (dstToBox, dstInsideBox). If ray misses box, dstInsideBox will be zero
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
    vec3 localPos = (pos - cubeMin) / (cubeMax - cubeMin);
    // --- 1. Base structure (Perlin–Worley) ---
    float base = fbm(localPos * baseFrequency, 5, 0.5f, 2.0f);

    // --- 2. Detail noise (multi-octave Worley) ---
    float detail = sampleDetailNoise(localPos * detailFrequency);

    // --- 3. Height shaping ---
    float height01 = (pos.y - cubeMin.y) / (cubeMax.y - cubeMin.y);
    float heightWeight = smoothstep(0.1f, 0.5f, height01) * (1.0f - smoothstep(0.6f, 1.0f, height01));

                    // Calculate falloff at along x/z edges of the cloud container
    float containerEdgeFadeDst = 50.0f;
    float dstFromEdgeX = min(containerEdgeFadeDst, min(pos.x - cubeMin.x, cubeMax.x - pos.x));
    float dstFromEdgeZ = min(containerEdgeFadeDst, min(pos.z - cubeMin.z, cubeMax.z - pos.z));
    float edgeWeight = min(dstFromEdgeZ, dstFromEdgeX) / containerEdgeFadeDst;
    heightWeight *= edgeWeight;
    //Weather map
    vec2 weatherUV = (pos.xz - cubeMin.xz) / (cubeMax.xz - cubeMin.xz);
    vec4 weather = texture(weatherMap, weatherUV);
    float coverage = weather.r;
    float densityMultiplier = weather.g;
    // --- 4. Final erosion and remap ---
    float density = base;

    if(density > 0.0f) {
        density *= mix(0.5f, 1.0f, detail);
    }

    density = (density - densityThreshold) * heightWeight;

    density = clamp(density, 0.0f, 1.0f);

    return density;
}

float sampleLight(vec3 pos, vec3 lightDir) {
    float distInsideBox = rayBoxDst(cubeMin, cubeMax, pos, 1.0f / lightDir).y;

    float lightTransmittance = 1.0f;
    float tStep = distInsideBox / float(MAX_STEPS_LIGHT);
    for(int i = 0; i < MAX_STEPS_LIGHT; i++) {
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

void main() {
    vec2 uv = fragUV * 2.0f - 1.0f;
    vec4 rayClip = vec4(uv, -1.0f, 1.0f);
    vec4 rayEye = projInverse * rayClip;
    rayEye = vec4(rayEye.xy, -1.0f, 0.0f);
    vec3 rayDirWorld = normalize((viewInverse * rayEye).xyz);
    vec3 rayOriginWorld = cameraPos;

    float tNear, tFar;
    if(!intersectBox(rayOriginWorld, rayDirWorld, cubeMin, cubeMax, tNear, tFar)) {
        discard;
    }
    float tStep = (tFar - tNear) / float(MAX_STEPS);
    vec4 accumulatedColor = vec4(0.0f);
    for(int i = 0; i < MAX_STEPS; i++) {
        float t = tNear + tStep * (float(i) + 0.5f);
        vec3 samplePos = rayOriginWorld + rayDirWorld * t;

        // Sample density
        float rawDensity = sampleDensity(samplePos);
        float density = pow(smoothstep(0.0f, 1.0f, rawDensity), 0.6f);

        if(density < 0.01f)
            continue;

        // Calculate lighting
        vec3 lightDir = normalize(sunPos - samplePos);
        float lightTransmittance = sampleLight(samplePos, lightDir);

        // Phase function
        float cosTheta = dot(rayDirWorld, lightDir);
        float phaseVal = PhaseFunction(cosTheta, phaseG);
        phaseVal = mix(1.0f, phaseVal, phaseMultiplier);
        vec3 sunLight = sunColor * lightTransmittance * lightIntensity * phaseVal;

        // Powder effect
        float powderEffect = 1.0f - exp(-density * 2.0f);
        sunLight *= mix(1.0f, powderEffect, 0.5f);
        // Ground bounce light
        float height = (samplePos.y - cubeMin.y) / (cubeMax.y - cubeMin.y);
        float groundFactor = 1.0f - height; // stronger near bottom
        vec3 bounceLight = vec3(0.8f, 0.75f, 0.7f) * groundFactor * 0.1f; // subtle warm tint

        // Ambient light (no phase function)
        vec3 ambientLight = skyColor * ambientIntensity;

        // Combine lights
        vec3 lightColor = sunLight + ambientLight + bounceLight;

        // Compute opacity
        float stepOpacity = 1.0f - exp(-density * tStep * absorption);

        // Premultiply alpha
        vec4 color = vec4(lightColor * stepOpacity, stepOpacity);

        //Front-to-back compositing (bounded accumulation)
        accumulatedColor += color * (1.0f - accumulatedColor.a);

        if(accumulatedColor.a > 0.99f)
            break;
    }
    fragColor = accumulatedColor;

}