#version 300 es
precision highp float;

layout(location = 0) in vec3 a_position;
layout(location = 1) in float a_baseHeight;

uniform mat4 uViewProj;

out vec3 vWorldPos;
out float vHeight;

void main() {
    vWorldPos = a_position;
    vHeight = (a_position.y - a_baseHeight); // Normalized height from base
    gl_Position = uViewProj * vec4(a_position, 1.0f);
}