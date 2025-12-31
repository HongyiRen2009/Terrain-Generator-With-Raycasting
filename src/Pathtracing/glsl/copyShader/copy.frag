#version 300 es
precision highp float;

uniform sampler2D u_sourceTexture; // This texture now contains the SUM of samples
in vec2 v_uv;
out vec4 fragColor;

// ACES Filmic Tone Mapping Curve
vec3 ACESFilmic(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
    vec3 sumColor = texture(u_sourceTexture, v_uv).rgb;

    float exposure = 1.0;
    vec3 tonedColor = ACESFilmic(sumColor * exposure);
    
    float gamma = 2.2;
    vec3 finalColor = pow(tonedColor, vec3(1.0 / gamma));

    fragColor = vec4(finalColor, 1.0);
}