#version 300 es 
precision highp float;

in vec3 viewNormal;
in vec3 albedo;
in vec4 viewPos;

uniform int useNormalEncoding;

layout(location = 0) out vec4 outNormal;
layout(location = 1) out vec4 outAlbedo;

void main() {
    vec3 normal = normalize(viewNormal);
    if (useNormalEncoding == 1) {
        // Encode normal from [-1, 1] to [0, 1] for RGBA8 storage
        outNormal = vec4(normal * 0.5 + 0.5, 1.0);
    } else {
        // Store normal directly for floating point formats
        outNormal = vec4(normal, 1.0);
    }
    outAlbedo = vec4(albedo, 1.0);
}