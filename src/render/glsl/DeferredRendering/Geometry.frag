#version 300 es 
precision highp float;

in vec3 viewNormal;
in vec2 fragUV;
flat in uint fragmaterialID;
layout(location = 0) out vec4 outNormal;
layout(location = 1) out vec2 outUV;
layout(location = 2) out uint outmaterialID;
void main() {
    vec3 normal = normalize(viewNormal);
    outNormal = vec4(normal, 1.0f);
    outUV = fragUV;
    outmaterialID = fragmaterialID;
}