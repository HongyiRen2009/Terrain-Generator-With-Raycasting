#version 300 es 
precision highp float;

in vec3 viewNormal;
in vec3 albedo;
in vec4 viewPos;
in vec4 materialAttributes;
layout(location = 0) out vec4 outNormal;
layout(location = 1) out vec4 outAlbedo;
layout(location = 2) out vec4 outMaterialAttributes;
void main() {
    vec3 normal = normalize(viewNormal);
    // Store normal directly for floating point formats
    outNormal = vec4(normal, 1.0f);
    outAlbedo = vec4(albedo, 1.0f);
    outMaterialAttributes = materialAttributes;
}