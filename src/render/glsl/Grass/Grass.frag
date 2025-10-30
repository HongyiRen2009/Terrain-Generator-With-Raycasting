#version 300 es
precision highp float;

in vec3 vWorldPos;
in float vHeight;

out vec4 fragColor;
uniform vec4 wireframeColor;

void main() {
    if(wireframeColor.a > 0.0f) {
        fragColor = wireframeColor;
        return;
    }

    // Simple gradient from dark green at base to light green at tip
    vec3 baseColor = vec3(0.1f, 0.4f, 0.1f);
    vec3 tipColor = vec3(0.3f, 0.8f, 0.3f);

    // vHeight is now relative to the base (0 = base, increases to tip)
    float t = clamp(vHeight / 1.5f, 0.0f, 1.0f); // Adjust divisor based on your grass height
    vec3 grassColor = mix(baseColor, tipColor, t);

    fragColor = vec4(grassColor, 1.0f);
}