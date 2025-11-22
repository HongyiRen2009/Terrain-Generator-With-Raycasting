#version 300 es
precision highp float;

uniform mat4 viewProj;

in vec3 position;
in vec3 color;
out vec3 fragColor;

void main() {
    fragColor = color;
    gl_Position = viewProj * vec4(position, 1.0);
}
