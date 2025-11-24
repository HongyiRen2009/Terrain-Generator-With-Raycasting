#version 300 es
precision lowp float;
in float vHeight;
in vec3 vNormal;
in vec3 vCurveAngle;
layout(location = 0) out float fragHeight;
layout(location = 1) out vec3 fragNormal;
layout(location = 2) out vec3 fragCurveAngle;
uniform sampler2D depthTexture;
uniform float near;
uniform float far;
void main() {
    vec2 screenCoord = gl_FragCoord.xy / vec2(textureSize(depthTexture, 0));
    float sceneDepth = texture(depthTexture, screenCoord).r;
    // Linearize both depths
    float z_ndc = gl_FragCoord.z * 2.0f - 1.0f;
    float linearFragDepth = (2.0f * near * far) / (far + near - z_ndc * (far - near));
    float linearSceneDepth = (2.0f * near * far) / (far + near - (sceneDepth * 2.0f - 1.0f) * (far - near));

    float depthBias = 0.01f;
    if(linearFragDepth > linearSceneDepth + depthBias) {
        discard;
    }
    fragHeight = vHeight;
    fragNormal = normalize(vNormal);
    fragCurveAngle = vCurveAngle;
}