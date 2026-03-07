#version 300 es
precision highp float;
in vec2 fragUV;
layout(location = 0) out vec4 outNormal;
layout(location = 1) out vec4 outAlbedo;
uniform sampler2D normalTexture;
uniform sampler2D albedoTexture;
uniform sampler2D depthTexture;
uniform sampler2D grassNormalTexture;
uniform sampler2D grassAlbedoTexture;
uniform sampler2D grassDepthTexture;
void main() {
    float sceneDepth = texture(depthTexture, fragUV).r;
    float grassDepth = texture(grassDepthTexture, fragUV).r;
    if(grassDepth < sceneDepth) {
        outNormal = texture(grassNormalTexture, fragUV);
        outAlbedo = texture(grassAlbedoTexture, fragUV);
        gl_FragDepth = grassDepth;
    } else {
        outNormal = texture(normalTexture, fragUV);
        outAlbedo = texture(albedoTexture, fragUV);
        gl_FragDepth = sceneDepth;
    }
}
