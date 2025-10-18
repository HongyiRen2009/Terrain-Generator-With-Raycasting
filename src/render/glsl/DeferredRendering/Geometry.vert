#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
in vec3 color;

uniform mat4 model;
uniform mat4 view;
uniform mat4 proj;

out vec3 viewNormal;
out vec3 albedo;
out vec4 viewPos;

void main() {
    vec4 worldPos = model * vec4(position, 1.0f);
    viewPos = view * worldPos;

    mat3 normalMatrix = mat3(transpose(inverse(view * model)));
    viewNormal = normalize(normalMatrix * normal);

    albedo = color;

    gl_Position = proj * viewPos;
}