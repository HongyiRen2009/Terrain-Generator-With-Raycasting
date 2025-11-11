#version 300 es
precision highp float;
in vec2 fragUV;
out vec4 outputColor;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform sampler2D grassColorTexture;
uniform sampler2D grassDepthTexture;
uniform sampler2D grassSSAOTexture;

void main() {
    bool useGrass = texture(grassDepthTexture, fragUV).r < texture(depthTexture, fragUV).r;
    if(useGrass) {
        vec3 color = texture(grassColorTexture, fragUV).rgb;
        float ambientOcclusion = texture(grassSSAOTexture, fragUV).r;
        color *= ambientOcclusion;
        outputColor = vec4(color, 1.0f);
    } else {
        vec3 color = texture(colorTexture, fragUV).rgb;
        outputColor = vec4(color, 1.0f);
    }
}