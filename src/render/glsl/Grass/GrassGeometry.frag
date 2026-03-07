#version 300 es
precision lowp float;
in float vHeight;
in vec3 vNormal;
in float vCurveAngle;
layout(location = 0) out vec4 fragNormal;
layout(location = 1) out vec2 fragGrassData;
layout(location = 2) out uint fragBlockId;
void main() {
    fragNormal = vec4(normalize(vNormal), 1.0f);
    fragGrassData = vec2(vHeight, vCurveAngle);
    fragBlockId = 67u;
}