#version 300 es
precision lowp float;

uniform sampler2D depthTexture;
in vec3 vWorldPos;
in float vHeight;
in vec3 vNormal;
in vec3 vCurveDirection;
in float vFragDepth;

out vec4 fragColor;
uniform vec4 wireframeColor;
uniform vec3 sunPos;
uniform vec3 viewDir;
uniform float specularStrength;
uniform float shininess;
uniform float translucencyStrength; // Add this uniform for control
void main() {
    // Convert fragment coordinates to texture coordinates
    vec2 screenCoord = gl_FragCoord.xy / vec2(textureSize(depthTexture, 0));

    // Sample the depth buffer
    float sceneDepth = texture(depthTexture, screenCoord).r;

    // Compare depths (add small bias to avoid z-fighting)
    float depthBias = 0.0001f;
    if(vFragDepth > sceneDepth + depthBias) {
        discard; // Grass is behind something, don't render
    }

    if(wireframeColor.a > 0.0f) {
        fragColor = wireframeColor;
        return;
    }

    // Check if viewing outer or inner curve
    // If dot product is positive, we're viewing the outer curve (convex side)
    // If negative, we're viewing the inner curve (concave side)
    vec3 toCamera = normalize(-viewDir);
    toCamera.y = 0.0f; // Project onto horizontal plane
    vec3 curveDirection = vec3(vCurveDirection.x, 0.0f, vCurveDirection.z);
    float curveViewDot = dot(curveDirection, toCamera);
    bool isInnerCurve = curveViewDot > 0.0f;

    vec3 lightDir = normalize(sunPos - vWorldPos);
    vec3 viewDirection = normalize(-viewDir);

    // Simple gradient color from base to tip
    vec3 baseColor = vec3(0.1f, 0.4f, 0.1f);
    vec3 tipColor = vec3(0.3f, 0.8f, 0.3f);

    float t = clamp(vHeight / 1.5f, 0.0f, 1.0f);
    vec3 grassColor = mix(baseColor, tipColor, t);

    // Flip normal based on which side we're viewing
    vec3 normal = normalize(vNormal) * (isInnerCurve ? -1.0f : 1.0f);

    // Diffuse lighting
    float diffuse = max(dot(normal, lightDir), 0.0f);
    grassColor *= 0.7f + 0.3f * diffuse;

    // Specular lighting
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDirection, reflectDir), 0.0f), shininess);
    vec3 specular = specularStrength * spec * vec3(1.0f);

    grassColor += specular;

    // Translucency (subsurface/backlight)
    float translucency = max(dot(-lightDir, normal), 0.0f);
    vec3 transColor = vec3(0.7f, 1.0f, 0.5f); // Bright greenish backlight
    grassColor += transColor * translucency * translucencyStrength;

    fragColor = vec4(grassColor, 1.0f);
}