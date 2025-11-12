#version 300 es
precision highp float;

in vec2 fragUV;
out vec4 outputColor;

uniform sampler2D sceneTexture;
uniform vec2 resolution;

// Vignette
uniform bool enableVignette;
uniform float vignetteStrength;
uniform float vignetteRadius;

// Chromatic Aberration
uniform bool enableChromaticAberration;
uniform float chromaticAberrationStrength;

// Film Grain
uniform bool enableFilmGrain;
uniform float filmGrainStrength;

// Bloom
uniform bool enableBloom;
uniform float bloomThreshold;
uniform float bloomIntensity;

// Tone Mapping
uniform bool enableToneMapping;
uniform float exposure;
uniform float gamma;

// Color Grading
uniform float saturation;
uniform float contrast;
uniform float brightness;

// Random function for film grain
float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898f, 78.233f))) * 43758.5453f);
}

// ACES tone mapping
vec3 ACESFilm(vec3 x) {
    float a = 2.51f;
    float b = 0.03f;
    float c = 2.43f;
    float d = 0.59f;
    float e = 0.14f;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0f, 1.0f);
}

// Reinhard tone mapping
vec3 Reinhard(vec3 x) {
    return x / (x + vec3(1.0f));
}

// Simple bloom approximation
vec3 bloom(sampler2D tex, vec2 uv, float threshold, float intensity) {
    vec3 color = vec3(0.0f);
    float totalWeight = 0.0f;

    // Simple blur kernel
    for(int x = -2; x <= 2; x++) {
        for(int y = -2; y <= 2; y++) {
            vec2 offset = vec2(float(x), float(y)) / resolution;
            vec3 samplePixel = texture(tex, uv + offset).rgb;

            // Extract bright areas
            float brightness = dot(samplePixel, vec3(0.2126f, 0.7152f, 0.0722f));
            if(brightness > threshold) {
                float weight = 1.0f / (1.0f + float(x * x + y * y));
                color += samplePixel * weight;
                totalWeight += weight;
            }
        }
    }

    return (color / max(totalWeight, 0.001f)) * intensity;
}

void main() {
    vec2 uv = fragUV;
    vec3 color = vec3(0.0f);

    // Chromatic Aberration
    if(enableChromaticAberration) {
        vec2 direction = uv - vec2(0.5f);
        float dist = length(direction);

        float r = texture(sceneTexture, uv + direction * chromaticAberrationStrength * dist).r;
        float g = texture(sceneTexture, uv).g;
        float b = texture(sceneTexture, uv - direction * chromaticAberrationStrength * dist).b;

        color = vec3(r, g, b);
    } else {
        color = texture(sceneTexture, uv).rgb;
    }

    // Bloom
    if(enableBloom) {
        vec3 bloomColor = bloom(sceneTexture, uv, bloomThreshold, bloomIntensity);
        color += bloomColor;
    }

    // Brightness
    color *= brightness;

    // Contrast
    color = (color - 0.5f) * contrast + 0.5f;

    // Saturation
    float luminance = dot(color, vec3(0.2126f, 0.7152f, 0.0722f));
    color = mix(vec3(luminance), color, saturation);

    // Tone Mapping
    if(enableToneMapping) {
        color *= exposure;
        color = ACESFilm(color);
        // Gamma correction
        color = pow(color, vec3(1.0f / gamma));
    }

    // Vignette
    if(enableVignette) {
        vec2 position = uv - vec2(0.5f);
        float vignette = 1.0f - smoothstep(vignetteRadius, vignetteRadius * 1.5f, length(position));
        color *= mix(1.0f, vignette, vignetteStrength);
    }

    // Film Grain
    if(enableFilmGrain) {
        float grain = random(uv + fract(1.0f)) * 2.0f - 1.0f;
        color += grain * filmGrainStrength;
    }

    outputColor = vec4(color, 1.0f);
}