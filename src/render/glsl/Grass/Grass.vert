#version 300 es
precision lowp float;

layout(location = 0) in vec3 localPosition;
layout(location = 1) in vec3 basePosition;
layout(location = 2) in float randomLean;
layout(location = 3) in float rotAngle;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform sampler2D windStrengthNoiseTex;
uniform sampler2D windDirectionNoiseTex;
uniform float time;
uniform float windStrength;
uniform float windSpeed;
uniform float windFrequency;
out vec3 vWorldPos;
out float vHeight;
out vec3 vNormal;
out vec3 vCurveDirection;

const float PI = 3.14159265359f;
mat3 rotateAxisAngle(vec3 axis, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0f - c;

    return mat3(oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s, oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c);
}
float easeOut(float t, float power) {
    return 1.0f - pow(1.0f - t, power);
}
float remap(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}
void main() {
    float windSamplePos = basePosition.x * 0.1f + time * windSpeed;
    float windSamplePosZ = basePosition.z * 0.1f + time * windSpeed;
    float windStrengthSample = texture(windStrengthNoiseTex, vec2(windSamplePos, windSamplePosZ) * windFrequency).r;
    float windDir = texture(windDirectionNoiseTex, vec2(windSamplePos + 100.0f, windSamplePosZ + 100.0f) * windFrequency).r * 2.0f * PI;
    windDir = remap(windDir, 0.0f, 2.0f * PI, -PI, PI);
    float windLeanAngle = remap(windStrengthSample, 0.0f, 1.0f, 0.0f, windStrength);
    windLeanAngle = easeOut(windLeanAngle, 2.0f);
    vec3 windAxis = vec3(-sin(windDir), 0.0f, cos(windDir));
    mat3 windRotation = rotateAxisAngle(windAxis, windLeanAngle);
    float curveAmount = randomLean * localPosition.y;

    float curveAngle = rotAngle + PI / 2.0f;
    vec3 curveAxis = vec3(-sin(curveAngle), 0.0f, cos(curveAngle));
    mat3 rotCurve = rotateAxisAngle(curveAxis, curveAmount) + windRotation;

    vec3 Pos = rotCurve * localPosition;

    vec3 worldPosition = basePosition + Pos;
    vWorldPos = worldPosition;
    vHeight = localPosition.y;

    // Pass the curve direction to fragment shader
    vCurveDirection = vec3(cos(curveAngle), 0.0f, sin(curveAngle)) * sign(curveAmount);
    // Calculate tangent along the blade (derivative of curved position)
    // The tangent represents the direction the blade is pointing at this height
    float heightStep = 0.01f; // Small delta for numerical derivative
    float curveAmountNext = randomLean * (localPosition.y + heightStep);
    mat3 rotCurveNext = rotateAxisAngle(curveAxis, curveAmountNext);
    vec3 nextLocalPos = vec3(localPosition.x, localPosition.y + heightStep, localPosition.z);
    vec3 nextPos = rotCurveNext * nextLocalPos;

    vec3 tangent = normalize(nextPos - Pos);

    // The normal is perpendicular to both the tangent and the blade width direction
    vec3 bladeWidthDirection = vec3(cos(rotAngle), 0.0f, sin(rotAngle));
    vNormal = normalize(cross(tangent, bladeWidthDirection));
    gl_Position = projMatrix * viewMatrix * vec4(worldPosition, 1.0f);

}