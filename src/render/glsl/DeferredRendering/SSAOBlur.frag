#version 300 es
precision highp float;
in vec2 fragUV;
out float ssaoBlur;
uniform sampler2D ssaoTexture;
uniform sampler2D depthTexture;
uniform bool enableBlur;

const int KERNEL_RADIUS = 2;
const float sigma_spatial = 2.0;
const float sigma_depth = 0.1;

void main() {
    if (!enableBlur) {
        ssaoBlur = texture(ssaoTexture, fragUV).r;
        return;
    }

    float centerSSAO = texture(ssaoTexture, fragUV).r;
    float centerDepth = texture(depthTexture, fragUV).r;
    vec2 texelSize = 1.0 / vec2(textureSize(ssaoTexture, 0));

    float sum = 0.0;
    float weightSum = 0.0;

    for (int y = -KERNEL_RADIUS; y <= KERNEL_RADIUS; ++y) {
        for (int x = -KERNEL_RADIUS; x <= KERNEL_RADIUS; ++x) {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            float sampleSSAO = texture(ssaoTexture, fragUV + offset).r;
            float sampleDepth = texture(depthTexture, fragUV + offset).r;

            float spatialWeight = exp(-float(x * x + y * y) / (2.0 * sigma_spatial * sigma_spatial));
            float depthWeight = exp(-pow(sampleDepth - centerDepth, 2.0) / (2.0 * sigma_depth * sigma_depth));
            float weight = spatialWeight * depthWeight;

            sum += sampleSSAO * weight;
            weightSum += weight;
        }
    }
    ssaoBlur = sum / weightSum;
}