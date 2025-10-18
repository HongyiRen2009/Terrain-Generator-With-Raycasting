#version 300 es 
precision highp float;

in vec3 viewNormal;
in vec3 albedo;
in vec4 viewPos;

layout(location = 0) out vec4 outNormal;
layout(location = 1) out vec4 outAlbedo;

void main() {
    outNormal = vec4(normalize(viewNormal), 1.0);
    outAlbedo = vec4(albedo, 1.0);
}