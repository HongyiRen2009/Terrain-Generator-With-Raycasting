#version 300 es
precision highp float;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 uv;
layout(location = 3) in uint blockId;
uniform mat4 model;
uniform mat4 view;
uniform mat4 proj;

out vec3 viewNormal;
out vec2 fragUV;
flat out uint fragBlockId;
out vec4 viewPos;

void main() {
    vec4 worldPos = model * vec4(position, 1.0f);
    viewPos = view * worldPos;

    mat3 normalMatrix = mat3(transpose(inverse(view * model)));
    viewNormal = normalize(normalMatrix * normal);
    fragUV = uv;
    fragBlockId = blockId;
    gl_Position = proj * viewPos;
}