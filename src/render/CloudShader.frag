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
uniform float lightAbsorption;
uniform float lightIntensity;
uniform float darknessThreshold;
uniform float ambientIntensity;
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
float sampleDensity(vec3 pos) {
    vec3 localPos = (pos - cubeMin) / (cubeMax - cubeMin);
    float noiseValue = texture(noiseTexture, localPos * frequency).r;
    return max(0.0f, noiseValue - densityThreshold);
}
float sampleLight(vec3 pos) {
    vec3 lightDir = normalize(sunPos - pos);
    float tNear, tFar;
    if(!intersectBox(pos, lightDir, cubeMin, cubeMax, tNear, tFar)) {
        return 1.0f;
    }

    float tStart = max(0.0f, tNear);
    float tStep = (tFar - tStart) / float(MAX_STEPS_LIGHT);
    float lightTransmittance = 1.0f;

    for(int i = 0; i < MAX_STEPS_LIGHT; i++) {
        float tCurrent = tStart + tStep * (float(i) + 0.5f);
        vec3 samplePos = pos + lightDir * tCurrent;
        float rawDensity = sampleDensity(samplePos);
        float density = smoothstep(0.2f, 0.8f, rawDensity);
        lightTransmittance *= exp(-lightAbsorption * density * tStep);
    }
    return darknessThreshold + (1.0f - darknessThreshold) * lightTransmittance;
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
    float lightEnergy = 0.0f;
    for(int i = 0; i < MAX_STEPS; i++) {
        float t = tNear + tStep * (float(i) + 0.5f);
        vec3 samplePos = rayOriginWorld + rayDirWorld * t;

    // Sample density
        float rawDensity = sampleDensity(samplePos);
        float density = pow(smoothstep(0.0f, 1.0f, rawDensity), 0.6f);

        if(density < 0.01f)
            continue;

    // Sample light transmittance
        float lightTransmittance = sampleLight(samplePos);

    // Compute lighting — sun + ambient
        vec3 sunLight = sunColor * lightTransmittance * lightIntensity;
        vec3 ambientLight = skyColor * ambientIntensity;

        vec3 lightColor = sunLight + ambientLight;
    //  Opacity from density and absorbtion (Beer’s law but bounded)
        float stepOpacity = 1.0f - exp(-density * tStep * absorption);

    // Premultiply alpha

        vec4 color = vec4(lightColor * stepOpacity, stepOpacity);

    //Front-to-back compositing (bounded accumulation)
        accumulatedColor += color * (1.0f - accumulatedColor.a);

        if(accumulatedColor.a > 0.99f)
            break;
    }
    vec3 finalColor = accumulatedColor.rgb;
    float grey = dot(finalColor, vec3(0.333f));
    finalColor = mix(finalColor, vec3(grey), 0.1f);

    fragColor = vec4(finalColor, accumulatedColor.a);

}