#version 300 es
precision highp float;
precision lowp usampler2D;
in vec2 fragUV;
layout(location = 0) out vec4 outNormal;
layout(location = 1) out vec2 outuv;
layout(location = 2) out uint outmaterialID;
uniform sampler2D gNormal;
uniform sampler2D gAux;
uniform usampler2D gMaterialID;
uniform sampler2D gDepth;
uniform sampler2D grassNormalTexture;
uniform sampler2D grassDataTexture;
uniform usampler2D grassgMaterialID;
uniform sampler2D grassDepthTexture;
void main() {
    float sceneDepth = texture(gDepth, fragUV).r;
    float grassDepth = texture(grassDepthTexture, fragUV).r;
    if(grassDepth < sceneDepth) {
        outNormal = texture(grassNormalTexture, fragUV);
        outuv = texture(grassDataTexture, fragUV).rg;
        outmaterialID = texture(grassgMaterialID, fragUV).r;
        gl_FragDepth = grassDepth;
    } else {
        outNormal = texture(gNormal, fragUV);
        outuv = texture(gAux, fragUV).rg;
        outmaterialID = texture(gMaterialID, fragUV).r;
        gl_FragDepth = sceneDepth;
    }
}
