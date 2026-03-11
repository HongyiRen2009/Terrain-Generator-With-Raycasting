#version 300 es
precision highp float;
layout(location = 0) in vec3 position;

uniform mat4 view;
uniform mat4 proj;
uniform mat4 model;
uniform float time;

out vec3 vPosition;
out vec3 vNormal;

const int MAX_WAVE_COUNT = 128;
uniform int WAVE_COUNT;
uniform vec2 WAVE_DIRS[MAX_WAVE_COUNT];
uniform float WAVE_SPEED[MAX_WAVE_COUNT];
uniform float WAVE_PHASE[MAX_WAVE_COUNT];

// Settings
uniform float waterAmplitude;
uniform float waterFrequency;
uniform float globalWaveSpeed;

float getDirectionalWaves(vec2 pos) {
    float h = 0.0;
    float amp = waterAmplitude;
    float freq = waterFrequency;

    for (int i = 0; i < WAVE_COUNT; i++) {
        float theta = dot(pos, WAVE_DIRS[i]) * freq + time * WAVE_SPEED[i]*globalWaveSpeed + WAVE_PHASE[i];
        h += sin(theta) * amp;

        amp *= 0.55;
        freq *= 1.85;
    }

    return h;
}

vec3 getDirectionalNormal(vec2 pos) {
    float dHx = 0.0;
    float dHz = 0.0;
    float amp = waterAmplitude;
    float freq = waterFrequency;

    for (int i = 0; i < WAVE_COUNT; i++) {
        float theta = dot(pos, WAVE_DIRS[i]) * freq + time * WAVE_SPEED[i]*globalWaveSpeed + WAVE_PHASE[i];
        float c = cos(theta);

        float commonMultiple = amp * freq * c;
        dHx += commonMultiple * WAVE_DIRS[i].x;
        dHz += commonMultiple * WAVE_DIRS[i].y;

        amp *= 0.55;
        freq *= 1.85;
    }

    return normalize(vec3(-dHx, 1.0, -dHz));
}

void main() {
    vec3 worldPos = (model * vec4(position, 1.0)).xyz;

    worldPos.y += getDirectionalWaves(worldPos.xz);

    vPosition = worldPos;
    vNormal = getDirectionalNormal(worldPos.xz);

    gl_Position = proj * view * vec4(worldPos, 1.0);
}