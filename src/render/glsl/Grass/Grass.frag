#version 300 es
precision lowp float;
uniform sampler2D depthTexture;
uniform sampler2D normalTexture;
uniform sampler2D albedoTexture;
uniform sampler2D worldDepthTexture;
uniform vec3 sunPos;
uniform vec3 viewDir;
uniform vec3 cameraPos;
uniform mat4 projMatrixInverse;
uniform mat4 viewMatrixInverse;

uniform float grassSpecularStrength;
uniform float grassShininess;
uniform float grassTranslucencyStrength;
uniform float grassAmbientTransitionPower;
uniform float grassSpecularTransitionPower;
uniform float grassTranslucencyTransitionPower;
uniform float grassDiffuseStrength;
uniform float grassBaseDarkness;
uniform vec3 grassBaseColor;
uniform vec3 grassTipColor;
uniform vec3 grassSpecularColor;
uniform vec3 grassTranslucencyColor;

out vec4 fragColor;

vec3 depthReconstruct(vec2 uv, float depth) {
    float z = depth * 2.0f - 1.0f;
    vec4 clipSpacePosition = vec4(uv * 2.0f - 1.0f, z, 1.0f);
    vec4 viewSpacePosition = projMatrixInverse * clipSpacePosition;
    viewSpacePosition /= viewSpacePosition.w;
    vec4 worldSpacePosition = viewMatrixInverse * viewSpacePosition;
    return worldSpacePosition.xyz;
}
void main() {
    // Depth check
    vec2 screenCoord = gl_FragCoord.xy / vec2(textureSize(albedoTexture, 0));
    if(texture(worldDepthTexture, screenCoord).r < texture(depthTexture, screenCoord).r) {
        discard;
    }
    vec3 worldPos = depthReconstruct(screenCoord, texture(depthTexture, screenCoord).r);
    float vHeight = texture(albedoTexture, screenCoord).r;
    vec3 vNormal = normalize(texture(normalTexture, screenCoord).rgb);
    float curveAngle = texture(albedoTexture, screenCoord).g;
    // Discard if no geometry written
    if(vHeight < 0.001f) {
        discard;
    }
    vec3 toCamera = normalize(-viewDir);
    toCamera.y = 0.0f;

    float curveViewDot = cos(curveAngle) * toCamera.x + sin(curveAngle) * toCamera.z;
    bool isInnerCurve = curveViewDot > 0.0f;

    vec3 lightDir = normalize(sunPos - worldPos);
    vec3 viewDirection = normalize(cameraPos - worldPos);

    float t = clamp(vHeight / 1.5f, 0.0f, 1.0f);
    vec3 grassColor = mix(grassBaseColor, grassTipColor, pow(t, grassAmbientTransitionPower));

    vec3 normal = normalize(vNormal) * (isInnerCurve ? -1.0f : 1.0f);
    float diffuse = max(dot(normal, lightDir), 0.0f);
    grassColor *= grassBaseDarkness + grassDiffuseStrength * diffuse;

    // Anisotropic specular (Kajiya-Kay model for hair/grass)
    vec3 tangent = normalize(cross(normal, vec3(0.0f, 1.0f, 0.0f)));
    vec3 halfDir = normalize(lightDir + viewDirection);
    float tdh = dot(tangent, halfDir);
    float spec = pow(sqrt(1.0f - tdh * tdh), grassShininess);
    spec = mix(0.0f, spec, pow(t, grassSpecularTransitionPower));
    vec3 specular = grassSpecularStrength * spec * grassSpecularColor;
    grassColor += specular;

    float translucency = max(dot(-lightDir, normal), 0.0f);
    translucency = mix(0.0f, translucency, pow(t, grassTranslucencyTransitionPower));
    grassColor += grassTranslucencyColor * translucency * grassTranslucencyStrength;

    fragColor = vec4(grassColor, 1.0f);
}