#version 300 es
precision highp float;
precision lowp usampler2D;
in vec2 fragUV;
layout(location = 0) out vec4 outNormal;
layout(location = 1) out vec2 outuv;
layout(location = 2) out uint outBlockId;
uniform sampler2D normalTexture;
uniform sampler2D uvTexture;
uniform usampler2D blockIdTexture;
uniform sampler2D depthTexture;
uniform sampler2D grassNormalTexture;
uniform sampler2D grassDataTexture;
uniform usampler2D grassBlockIdTexture;
uniform sampler2D grassDepthTexture;
void main() {
    float sceneDepth = texture(depthTexture, fragUV).r;
    float grassDepth = texture(grassDepthTexture, fragUV).r;
    if(grassDepth < sceneDepth) {
        outNormal = texture(grassNormalTexture, fragUV);
        outuv = texture(grassDataTexture, fragUV).rg;
        outBlockId = texture(grassBlockIdTexture, fragUV).r;
        gl_FragDepth = grassDepth;
    } else {
        outNormal = texture(normalTexture, fragUV);
        outuv = texture(uvTexture, fragUV).rg;
        outBlockId = texture(blockIdTexture, fragUV).r;
        gl_FragDepth = sceneDepth;
    }
}
