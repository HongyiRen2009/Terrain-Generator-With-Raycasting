#version 300 es
precision lowp float;

uniform sampler2D depthTexture;
uniform float near;
uniform float far;
in vec3 vWorldPos;
in float vHeight;
in vec3 vNormal;
in vec3 vCurveDirection;

out vec4 fragColor;
uniform vec4 wireframeColor;
uniform vec3 sunPos;
uniform vec3 viewDir;
uniform vec3 cameraPos;

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

    if(wireframeColor.a > 0.0f) {
        fragColor = wireframeColor;
        return;
    }

    vec3 toCamera = normalize(-viewDir);
    toCamera.y = 0.0f;
    vec3 curveDirection = vec3(vCurveDirection.x, 0.0f, vCurveDirection.z);
    float curveViewDot = dot(curveDirection, toCamera);
    bool isInnerCurve = curveViewDot > 0.0f;

    vec3 lightDir = normalize(sunPos - vWorldPos);
    vec3 viewDirection = normalize(cameraPos - vWorldPos);

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