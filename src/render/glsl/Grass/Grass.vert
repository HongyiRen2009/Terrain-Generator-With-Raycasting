#version 300 es
precision highp float;

layout(location = 0) in vec3 localPosition;
layout(location = 1) in vec3 basePosition;
layout(location = 2) in float randomLean;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform vec3 viewDir;
uniform float grassThickness;
out vec3 vWorldPos;
out float vHeight;
out vec3 vNormal; // NEW

mat3 rotateZ(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(c, -s, 0.0f, s, c, 0.0f, 0.0f, 0.0f, 1.0f);
}
float easeOut(float t, float power) {
    return 1.0f - pow(1.0f - t, power);
}
void main() {
    float curveAmount = randomLean * localPosition.y;
    mat3 rot = rotateZ(curveAmount);
    vec3 Pos = rot * localPosition;
    vec3 worldPosition = basePosition + Pos;
    vWorldPos = worldPosition;
    vHeight = localPosition.y;

    float bladeRadius = 0.5f; // tweak for more/less roundness
    vec3 normal = normalize(rot * vec3(localPosition.x * bladeRadius, 1.0f, 0.0f));
    vNormal = normal;

    float viewDotNormal = clamp(dot(normal.xz, viewDir.xz), 0.0f, 1.0f);
    float viewSpaceThickenFactor = easeOut(1.0f - viewDotNormal, 4.0f);
    viewSpaceThickenFactor *= smoothstep(0.2f, 0.4f, viewDotNormal);
    vec4 finalPosition = viewMatrix * vec4(worldPosition, 1.0f);
    finalPosition.x += viewSpaceThickenFactor * sign(localPosition.x) * grassThickness;
    gl_Position = projMatrix * finalPosition;
}