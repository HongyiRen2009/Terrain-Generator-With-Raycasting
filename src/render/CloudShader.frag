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
uniform vec3 sunPos;
uniform vec3 sunColor;

//settings
uniform float absorption;
uniform float densityThreshold;
uniform float frequency;
out vec4 fragColor;
const int MAX_STEPS = 16;

bool intersectBox(vec3 rayOrigin, vec3 rayDir, vec3 boxMin, vec3 boxMax, out float tNear, out float tFar) {
    vec3 tMin = (boxMin - rayOrigin) / rayDir;
    vec3 tMax = (boxMax - rayOrigin) / rayDir;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    tNear = max(max(t1.x, t1.y), t1.z);
    tFar = min(min(t2.x, t2.y), t2.z);
    return tNear <= tFar && tFar >= 0.0f;
}

float phaseHG(float cosTheta, float g) {
    // cosTheta = dot(lightDir, viewDir)
    float denom = 1.0f + g * g - 2.0f * g * cosTheta;
    return (1.0f - g * g) / (4.0f * 3.14159f * pow(denom, 1.5f));
}
float sampleDensity(vec3 pos) {
    int octaves = 5;
    float persistence = 0.707f;
    float lacunarity = 2.5789f;
    vec3 samplePos = (pos - cubeMin) / (cubeMax - cubeMin);
    vec3 UVW = samplePos * frequency;
    float amplitude = 1.0f;
    float value = 0.0f;
    for(int i = 0; i < octaves; i++) {
        value += amplitude * texture(noiseTexture, UVW).r;
        UVW *= lacunarity;
        amplitude *= persistence;
    }
    // Correct thresholding
    return max(0.0f, value - densityThreshold) * absorption;
}
vec3 computeSunColor(vec3 samplePos) {
    vec3 lightDir = normalize(sunPos - samplePos);
    float tNear, tFar;
    if(!intersectBox(samplePos, lightDir, cubeMin, cubeMax, tNear, tFar)) {
        return sunColor;
    }
    float stepSize = (tFar - tNear) / float(MAX_STEPS);
    float totalDensity = 0.0f;
    for(int i = 0; i < MAX_STEPS; i++) {
        vec3 samplePoint = samplePos + lightDir * (tNear + stepSize * (float(i) + 0.5f));
        totalDensity += max(0.0f, sampleDensity(samplePoint) * stepSize);
    }
    float transmittance = exp(-totalDensity);
    return sunColor * transmittance;
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
    float transmittance = 1.0f;
    vec3 color = vec3(0.0f);
    for(int i = 0; i < MAX_STEPS; i++) {
        vec3 samplePos = rayOriginWorld + (rayDirWorld * (tNear + tStep * (float(i) + 0.5f)));
        float density = sampleDensity(samplePos);
        fragColor = vec4(vec3(density), 1.0f); // For debugging density
        return;
        if(density > 0.01f) {
            vec3 sunCol = computeSunColor(samplePos);
            float phase = phaseHG(dot(normalize(sunPos - samplePos), -rayDirWorld), 0.76f);
            float deltaTransmittance = exp(-density * tStep);
            color += sunCol * density * phase * tStep * transmittance;
            transmittance *= deltaTransmittance;
        }
    }
    float alpha = 1.0f - transmittance;
    fragColor = vec4(color, alpha);

}