#version 300 es
precision highp float;
in vec3 vPosition;
in vec3 vNormal;
out vec4 fragColor;
uniform sampler2D depthTexture;
uniform sampler2D sceneTexture;
void main() {
    vec2 screenUV = gl_FragCoord.xy / vec2(textureSize(sceneTexture, 0));
    if(texture(depthTexture, screenUV).r < gl_FragCoord.z) {
        discard;
    }
    vec4 sceneColor = texture(sceneTexture, screenUV);
    //Blend water color with scene color based on normal
    vec3 waterColor = vec3(0.0, 0.3, 0.5);
    fragColor = vec4(mix(waterColor, sceneColor.rgb, 0.5), 1.0);
}