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
uniform float specularStrength;
uniform float shininess;
uniform float translucencyStrength;

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
    vec3 viewDirection = normalize(-viewDir);

    vec3 baseColor = vec3(0.1f, 0.4f, 0.1f);
    vec3 tipColor = vec3(0.3f, 0.8f, 0.3f);

    float t = clamp(vHeight / 1.5f, 0.0f, 1.0f);
    vec3 grassColor = mix(baseColor, tipColor, t);

    vec3 normal = normalize(vNormal) * (isInnerCurve ? -1.0f : 1.0f);

    float diffuse = max(dot(normal, lightDir), 0.0f);
    grassColor *= 0.7f + 0.3f * diffuse;

    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDirection, reflectDir), 0.0f), shininess);
    vec3 specular = specularStrength * spec * vec3(1.0f);

    grassColor += specular;

    float translucency = max(dot(-lightDir, normal), 0.0f);
    vec3 transColor = vec3(0.7f, 1.0f, 0.5f);
    grassColor += transColor * translucency * translucencyStrength;

    fragColor = vec4(grassColor, 1.0f);
}