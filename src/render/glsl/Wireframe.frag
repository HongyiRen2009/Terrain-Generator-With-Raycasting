#version 300 es
precision highp float;

uniform vec4 u_wireframeColor;

out vec4 fragColor;

void main() {
    fragColor = u_wireframeColor;
}