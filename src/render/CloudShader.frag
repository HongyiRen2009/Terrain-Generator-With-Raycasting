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
out vec4 fragColor;
const int MAX_STEPS = 64;
const int MAX_STEPS_LIGHT = 8;
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
    float tStep = (tFar - tNear) / float(MAX_STEPS_LIGHT);
    float lightTransmittance = 1.0f;
    for(int i = 0; i < MAX_STEPS_LIGHT; i++) {
        float tCurrent = tNear + tStep * (float(i) + 0.5f);
        vec3 samplePos = pos + lightDir * tCurrent;
        float rawDensity = sampleDensity(samplePos);
        float density = smoothstep(0.2f, 0.8f, rawDensity); // Gentler remapping
        lightTransmittance *= exp(-lightAbsorption * density * tStep);
    }
    return lightTransmittance;
}
vec3 getNormal(vec3 pos) {
    float delta = 0.02f;
    vec3 normal = vec3(sampleDensity(pos)) - vec3(sampleDensity(pos + vec3(delta, 0.0f, 0.0f)), sampleDensity(pos + vec3(0.0f, delta, 0.0f)), sampleDensity(pos + vec3(0.0f, 0.0f, delta)));
    return normalize(normal);
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

    // 1. Sample base density
        float rawDensity = sampleDensity(samplePos);
        float density = smoothstep(0.2f, 0.8f, rawDensity); // soften range

        if(density < 0.01f)
            continue;

    // 2. Light attenuation along light direction
        float lightTransmittance = sampleLight(samplePos);

    // 3. Compute lighting — sun + ambient
        vec3 normal = getNormal(samplePos);
        float diffuse = max(dot(normal, normalize(sunPos - samplePos)), 0.0f);
        vec3 lightColor = sunColor * lightTransmittance * diffuse + vec3(0.6f, 0.7f, 1.0f) * 0.2f; // ambient sky blue

    // 4. Density → brightness mapping (mimic self-shadow)
        vec3 albedo = mix(vec3(1.0f), vec3(0.3f), density); // white to grey

    // 5. Energy-conserving shading
        vec3 lighting = albedo * lightColor;

    // 6. Opacity from density and absorbtion (Beer’s law but bounded)
        float stepOpacity = 1.0f - exp(-density * tStep * absorption);
        stepOpacity = clamp(stepOpacity, 0.0f, 1.0f);

    // 7. Premultiply alpha
        vec4 color = vec4(lighting * stepOpacity, stepOpacity);

    // 8. Front-to-back compositing (bounded accumulation)
        accumulatedColor += color * (1.0f - accumulatedColor.a);

    // 9. Stop if almost opaque
        if(accumulatedColor.a > 0.99f)
            break;
    }

    fragColor = accumulatedColor;

}