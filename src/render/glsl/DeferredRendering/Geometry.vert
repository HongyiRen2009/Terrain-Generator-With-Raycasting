#version 300 es
precision highp float;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec3 color;
layout(location = 3) in float reflectiveness;
layout(location = 4) in float metalicity;
layout(location = 5) in float roughness;
layout(location = 6) in float emissivity;
uniform mat4 model;
uniform mat4 view;
uniform mat4 proj;

out vec3 viewNormal;
out vec3 albedo;
out vec4 materialAttributes; // x: reflectiveness, y: metalicity, z: roughness, w: emissivity
out vec4 viewPos;

void main() {
    vec4 worldPos = model * vec4(position, 1.0f);
    viewPos = view * worldPos;

    mat3 normalMatrix = mat3(transpose(inverse(view * model)));
    viewNormal = normalize(normalMatrix * normal);

    albedo = color;
    materialAttributes = vec4(reflectiveness, metalicity, roughness, emissivity);
    gl_Position = proj * viewPos;
}