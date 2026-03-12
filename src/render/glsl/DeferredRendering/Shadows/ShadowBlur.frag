#version 300 es
precision highp float;

in vec2 fragUV;
layout (location = 0) out float blurredSunShadowMask;
layout (location = 1) out float blurredpointShadowMaskA;
layout (location = 2) out float blurredpointShadowMaskB;
layout (location = 3) out float blurredpointShadowMaskC;
layout (location = 4) out float blurredpointShadowMaskD;
layout (location = 5) out float blurredpointShadowMaskE;

uniform sampler2D sunShadowMask;
uniform sampler2D pointShadowMaskA;
uniform sampler2D pointShadowMaskB;
uniform sampler2D pointShadowMaskC;
uniform sampler2D pointShadowMaskD;
uniform sampler2D pointShadowMaskE;
uniform sampler2D gDepth;


const int KERNEL_RADIUS = 2;
const int level = 2;
const float sigma_spatial = 2.0f;
const float sigma_depth = 0.1f;

void main() {
    
    float centerDepth = texture(gDepth, fragUV).r;
    vec2 texelSize = 1.0f / vec2(textureSize(sunShadowMask, level));

    float sunShadowSum = 0.0f;
    float pointShadowASum = 0.0f;
    float pointShadowBSum = 0.0f;
    float pointShadowCSum = 0.0f;
    float pointShadowDSum = 0.0f;
    float pointShadowESum = 0.0f;
    float weightSum = 0.0f;

    for(int y = -KERNEL_RADIUS; y <= KERNEL_RADIUS; ++y) {
        for(int x = -KERNEL_RADIUS; x <= KERNEL_RADIUS; ++x) {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            float sampleSunShadowMask = textureLod(sunShadowMask, fragUV + offset, float(level)).r;
            float samplePointShadowMaskA = textureLod(pointShadowMaskA, fragUV + offset, float(level)).r;
            float samplePointShadowMaskB = textureLod(pointShadowMaskB, fragUV + offset, float(level)).r;
            float samplePointShadowMaskC = textureLod(pointShadowMaskC, fragUV + offset, float(level)).r;
            float samplePointShadowMaskD = textureLod(pointShadowMaskD, fragUV + offset, float(level)).r;
            float samplePointShadowMaskE = textureLod(pointShadowMaskE, fragUV + offset, float(level)).r;

            float sampleDepth = texture(gDepth, fragUV + offset).r;

            float spatialWeight = exp(-float(x * x + y * y) / (2.0f * sigma_spatial * sigma_spatial));
            float depthWeight = exp(-pow(sampleDepth - centerDepth, 2.0f) / (2.0f * sigma_depth * sigma_depth));
            float weight = spatialWeight * depthWeight;

            sunShadowSum += sampleSunShadowMask * weight;
            pointShadowASum += samplePointShadowMaskA * weight;
            pointShadowBSum += samplePointShadowMaskB * weight;
            pointShadowCSum += samplePointShadowMaskC * weight;
            pointShadowDSum += samplePointShadowMaskD * weight;
            pointShadowESum += samplePointShadowMaskE * weight;
        
            weightSum += weight;
        }
    }
    blurredSunShadowMask = sunShadowSum / weightSum;
    blurredpointShadowMaskA = pointShadowASum / weightSum;
    blurredpointShadowMaskB = pointShadowBSum / weightSum;
    blurredpointShadowMaskC = pointShadowCSum / weightSum;
    blurredpointShadowMaskD = pointShadowDSum / weightSum;
    blurredpointShadowMaskE = pointShadowESum / weightSum;
}