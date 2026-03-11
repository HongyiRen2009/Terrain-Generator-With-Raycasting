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
float getSumOfSines(vec2 pos, int octaves) {
    float height = 0.0;
    float frequency = waterFrequency;
    float amplitude = waterAmplitude;
    for(int i = 0; i < octaves; i++) {
        height += sin(pos.x * frequency + time) * cos(pos.y * frequency + time) * amplitude;
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return height;
}
vec3 getSumOfSinesNormal(vec2 pos, int octaves) {
    float frequency = waterFrequency;
    float amplitude = waterAmplitude;
    vec3 normal = vec3(0.0, 1.0, 0.0);
    for(int i = 0; i < octaves; i++) {
        float sineX = sin(pos.x * frequency + time);
        float cosineY = cos(pos.y * frequency + time);
        normal.x += cosineY * frequency * amplitude;
        normal.z += sineX * frequency * amplitude;
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return normalize(normal);

}
void main() {
    vec3 worldPos = (model * vec4(position, 1.0)).xyz;
    worldPos.y += getSumOfSines(worldPos.xz, 4);
    vPosition = worldPos;
    vNormal = getSumOfSinesNormal(worldPos.xz, 4);
    
gl_Position = proj * view * vec4(worldPos,1.0);
}