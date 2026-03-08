#version 300 es
precision highp float;
layout(location = 0) in vec3 position;
uniform mat4 view;
uniform mat4 proj;
uniform mat4 model;
uniform float time;
out vec3 vPosition;
out vec3 vNormal;
void main() {
    vec3 worldPos = (model * vec4(position, 1.0)).xyz;
    vPosition = worldPos;
    vNormal = vec3(0.0, 1.0, 0.0);
    float waveHeight = 0.1;
    float waveFrequency = 2.0;
    float waveSpeed = 1.0;
    float wave = sin((worldPos.x + worldPos.z) * waveFrequency + time * waveSpeed) * waveHeight;
    vPosition.y += wave;
    vNormal = normalize(vec3(-cos((worldPos.x + worldPos.z) * waveFrequency + time * waveSpeed) * waveFrequency * waveHeight, 1.0, -cos((worldPos.x + worldPos.z) * waveFrequency + time * waveSpeed) * waveFrequency * waveHeight));
    
gl_Position = proj * view * vec4(worldPos.x, worldPos.y + wave, worldPos.z, 1.0);}