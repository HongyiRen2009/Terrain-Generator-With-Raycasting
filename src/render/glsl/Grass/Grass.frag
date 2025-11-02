#version 300 es
precision highp float;

in vec3 vWorldPos;
in float vHeight;
in vec3 vNormal;

out vec4 fragColor;
uniform vec4 wireframeColor;
uniform vec3 sunPos;

void main() {
    if(wireframeColor.a > 0.0f) {
        fragColor = wireframeColor;
        return;
    }
    vec3 lightDir = vec3(0.3f, 1.0f, 0.5f);
    // Simple gradient from dark green at base to light green at tip
    vec3 baseColor = vec3(0.1f, 0.4f, 0.1f);
    vec3 tipColor = vec3(0.3f, 0.8f, 0.3f);

    float t = clamp(vHeight / 1.5f, 0.0f, 1.0f);
    vec3 grassColor = mix(baseColor, tipColor, t);

    // Simple diffuse lighting
    float diffuse = max(dot(normalize(vNormal), normalize(lightDir)), 0.0f);
    grassColor *= 0.5f + 0.5f * diffuse; // ambient + diffuse

    fragColor = vec4(grassColor, 1.0f);
}