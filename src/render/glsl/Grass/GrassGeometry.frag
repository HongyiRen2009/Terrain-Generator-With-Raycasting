#version 300 es
precision lowp float;
in float vHeight;
in vec3 vNormal;
in float vCurveAngle;
layout(location = 0) out vec4 fragNormal;
layout(location = 1) out vec4 fragAlbedo;
void main() {
    fragNormal = vec4(normalize(vNormal), 1.0f);
    fragAlbedo = vec4(vHeight, vCurveAngle, 0.0f, 1.0);
}