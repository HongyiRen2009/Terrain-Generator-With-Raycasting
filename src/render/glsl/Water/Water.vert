#version 300 es
precision highp float;
layout(location = 0) in vec3 position;
uniform mat4 view;
uniform mat4 proj;
uniform mat4 model;
uniform float time;
out vec3 vPosition;
out vec3 vNormal;

//Settings
uniform float waterAmplitude;
uniform float waterFrequency;
void main() {
    vec3 worldPos = (model * vec4(position, 1.0)).xyz;
    vPosition = worldPos;
    vNormal = vec3(0.0, 1.0, 0.0);
    
gl_Position = proj * view * vec4(worldPos,1.0);
}