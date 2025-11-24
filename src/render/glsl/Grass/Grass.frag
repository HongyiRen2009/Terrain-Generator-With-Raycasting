#version 300 es
precision lowp float;
uniform sampler2D depthTexture;
uniform sampler2D heightTexture;
uniform sampler2D normalTexture;
uniform sampler2D curveAngleTexture;
uniform vec3 sunPos;
uniform vec3 viewDir;
uniform vec3 cameraPos;
uniform mat4 projMatrixInverse;
uniform mat4 viewMatrixInverse;

uniform float specularStrength;
uniform float shininess;
uniform float translucencyStrength;
uniform float ambientTransitionPower;
uniform float specularTransitionPower;
uniform float translucencyTransitionPower;
uniform float diffuseStrength;
uniform float baseDarkness;
uniform vec3 baseColor;
uniform vec3 tipColor;
uniform vec3 specularColor;
uniform vec3 translucencyColor;

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
    vec2 screenCoord = gl_FragCoord.xy / vec2(textureSize(heightTexture, 0));
    vec3 worldPos = depthReconstruct(screenCoord, texture(depthTexture, screenCoord).r);
    float vHeight = texture(heightTexture, screenCoord).r;
    vec3 vNormal = normalize(texture(normalTexture, screenCoord).rgb);
    float curveAngle = texture(curveAngleTexture, screenCoord).r;
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
    vec3 grassColor = mix(baseColor, tipColor, pow(t, ambientTransitionPower));

    vec3 normal = normalize(vNormal) * (isInnerCurve ? -1.0f : 1.0f);
    float diffuse = max(dot(normal, lightDir), 0.0f);
    grassColor *= baseDarkness + diffuseStrength * diffuse;

    // Anisotropic specular (Kajiya-Kay model for hair/grass)
    vec3 tangent = normalize(cross(normal, vec3(0.0f, 1.0f, 0.0f)));
    vec3 halfDir = normalize(lightDir + viewDirection);
    float tdh = dot(tangent, halfDir);
    float spec = pow(sqrt(1.0f - tdh * tdh), shininess);
    spec = mix(0.0f, spec, pow(t, specularTransitionPower));
    vec3 specular = specularStrength * spec * specularColor;
    grassColor += specular;

    float translucency = max(dot(-lightDir, normal), 0.0f);
    translucency = mix(0.0f, translucency, pow(t, translucencyTransitionPower));
    grassColor += translucencyColor * translucency * translucencyStrength;

    fragColor = vec4(grassColor, 1.0f);
}