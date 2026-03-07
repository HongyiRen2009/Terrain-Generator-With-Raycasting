#version 300 es 
precision highp float;

in vec3 viewNormal;
in vec4 albedo;
in vec4 viewPos;
layout(location = 0) out vec4 outNormal;
layout(location = 1) out vec4 outAlbedo;
void main() {
    vec3 normal = normalize(viewNormal);
    outNormal = vec4(normal, 1.0f);
    outAlbedo = albedo;
}