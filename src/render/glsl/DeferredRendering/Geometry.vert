#version 300 es
precision highp float;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec4 albedoBlockId; // rgb: color (optional), a: block id
uniform mat4 model;
uniform mat4 view;
uniform mat4 proj;

out vec3 viewNormal;
out vec4 albedo;
out vec4 viewPos;

void main() {
    vec4 worldPos = model * vec4(position, 1.0f);
    viewPos = view * worldPos;

    mat3 normalMatrix = mat3(transpose(inverse(view * model)));
    viewNormal = normalize(normalMatrix * normal);
    albedo = albedoBlockId;
    gl_Position = proj * viewPos;
}