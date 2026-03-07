#version 300 es 
precision highp float;

in vec3 viewNormal;
in vec2 fragUV;
flat in uint fragBlockId;
layout(location = 0) out vec4 outNormal;
layout(location = 1) out vec2 outUV;
layout(location = 2) out uint outBlockId;
void main() {
    vec3 normal = normalize(viewNormal);
    outNormal = vec4(normal, 1.0f);
    outUV = fragUV;
    outBlockId = fragBlockId;
}