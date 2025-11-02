#version 300 es
precision highp float;

layout(location = 0) in vec3 localPosition;
layout(location = 1) in vec3 basePosition;
layout(location = 2) in float randomLean;
layout(location = 3) in vec3 normal;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform vec3 viewDir;
uniform sampler2D noiseTexture;
uniform float time;
uniform float grassThickness;
uniform float windStrength;
uniform float windSpeed;
out vec3 vWorldPos;
out float vHeight;
out vec3 vNormal;
mat3 rotateZ(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(c, -s, 0.0f, s, c, 0.0f, 0.0f, 0.0f, 1.0f);
}
mat3 rotateY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(c, 0.0f, s, 0.0f, 1.0f, 0.0f, -s, 0.0f, c);
}
float easeOut(float t, float power) {
    return 1.0f - pow(1.0f - t, power);
}
float sampleNoise(vec3 pos, float time) {
    vec2 uv = pos.xz * 0.1f + vec2(time * 0.1f, time * 0.05f) * windSpeed;
    return pow(texture(noiseTexture, uv).r, windStrength);
}
void main() {
    float noiseValue = sampleNoise(basePosition, time);
    float curveAmount = randomLean * localPosition.y + noiseValue;

    // First rotate around Y-axis to twist the blade sides towards the curve direction
    float twistAmount = curveAmount * sign(randomLean);
    mat3 rotY = rotateY(twistAmount);

    // Then rotate around Z-axis to create the main curve
    mat3 rotZ = rotateZ(curveAmount);

    // Apply both rotations: first twist, then curve
    vec3 twistedPos = rotY * localPosition;
    vec3 Pos = rotZ * twistedPos;

    vec3 worldPosition = basePosition + Pos;
    vWorldPos = worldPosition;
    vHeight = localPosition.y;

    // Apply the same rotations to the normal
    vec3 twistedNormal = rotY * normal;
    vec3 curvedNormal = rotZ * twistedNormal;
    vNormal = normalize(curvedNormal);

    float viewDotNormal = clamp(dot(normal.xz, viewDir.xz), 0.0f, 1.0f);
    float viewSpaceThickenFactor = easeOut(1.0f - viewDotNormal, 4.0f);
    viewSpaceThickenFactor *= smoothstep(0.2f, 0.4f, viewDotNormal);
    vec4 finalPosition = viewMatrix * vec4(worldPosition, 1.0f);
    finalPosition.x += viewSpaceThickenFactor * sign(localPosition.x) * grassThickness;
    gl_Position = projMatrix * finalPosition;
}