#version 300 es
precision highp float;
in vec3 vPosition;
in vec3 vNormal;
out vec4 fragColor;
uniform sampler2D depthTexture;
uniform sampler2D sceneTexture;
uniform mat4 proj;
uniform mat4 view;
//Settings
uniform float ambientStrength;
uniform float diffuseStrength;
uniform float specularStrength;
uniform float shininess;
uniform float ssrThickness;
uniform float ssrMaxDistance;
uniform float ssrResolution;
uniform float fresnelF0;
uniform float fresnelPower; 
uniform float waterObscurity;
uniform vec3 waterColor;
uniform float waterAttenuation;

struct DirectionalLight {
    vec3 direction;
    vec3 color;
    float intensity;
};

uniform DirectionalLight SunLight;
uniform vec3 cameraPos;
vec3 CalculateLighting(vec3 viewDir, vec3 normal) {

    vec3 color = waterColor;
    float diffuse = max(dot(normal, -SunLight.direction), 0.0);
    color *= (ambientStrength + diffuseStrength * diffuse * SunLight.intensity);
    vec3 reflectDir = reflect(-SunLight.direction, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    color += specularStrength * spec * SunLight.color * SunLight.intensity;
    return color;
}
vec3 Raycast(vec3 rayDir) {
    float maxDistance = ssrMaxDistance;
    float resolution  = ssrResolution;
    int   steps       = int(maxDistance / resolution);
    float thickness   = ssrThickness;
    float traveled    = 0.0;
    vec3 rayOrigin = vPosition + normalize(vNormal) * 0.05;
    for(int i = 0; i < steps; i++) {
        if(traveled > maxDistance) break;
        rayOrigin += rayDir * resolution;
        traveled += resolution;
        vec4 clipPos = proj * view * vec4(rayOrigin, 1.0);
        if(clipPos.w <= 0.0) break;
        vec2 screenUV = clipPos.xy / clipPos.w * 0.5 + 0.5;
        if(screenUV.x < 0.0 || screenUV.x > 1.0 || screenUV.y < 0.0 || screenUV.y > 1.0) {
            break;
        }
        float sceneDepth = texture(depthTexture, screenUV).r;
        if(sceneDepth >= 1.0) continue;
        float rayDepth = clipPos.z / clipPos.w * 0.5 + 0.5;
        float depthDiff = rayDepth - sceneDepth;
        if(depthDiff >= 0.0 && depthDiff < thickness) {
            return texture(sceneTexture, screenUV).rgb;
        }
    }
    return vec3(0.0);
}
vec3 SSR(vec3 normal) {
    vec3 fragToCamera = normalize(cameraPos - vPosition);
    vec3 reflectionDir = normalize(reflect(-fragToCamera, normal));
    vec3 reflectionColor = Raycast(reflectionDir);
bool ssrHit = any(greaterThan(reflectionColor, vec3(0.001)));
if (!ssrHit) {
    reflectionColor = vec3(0.5, 0.7, 0.9); // Fallback sky color
}
    return reflectionColor;
}
float Fresnel(vec3 normal, vec3 viewDir){
    float cosTheta = max(dot(normal, viewDir), 0.0);
    float F0 = fresnelF0;
    float fresnel = F0 + (1.0 - F0) * pow(1.0 - cosTheta, fresnelPower);
    return fresnel;
}

float attenuation(float distance) {
    return exp(-waterAttenuation * distance);
}
float distanceInWater(float sceneDepth, float waterDepth) {
    float z = waterDepth * 2.0 - 1.0;
    float linearDepth = (2.0 * 0.1 * 100.0) / (100.0 + 0.1 - z * (100.0 - 0.1));
    return max(0.0, linearDepth - sceneDepth);  
}
void main() {
    vec2 screenUV = gl_FragCoord.xy / vec2(textureSize(sceneTexture, 0));
    float sceneDepthAtPixel = texture(depthTexture, screenUV).r;
    if(sceneDepthAtPixel < 1.0 && gl_FragCoord.z >= sceneDepthAtPixel) {
        discard;
    }

    vec3 normal = faceforward(normalize(vNormal), normalize(vPosition - cameraPos), normalize(vNormal));
    vec3 viewDir = normalize(cameraPos - vPosition);
    vec3 waterColor = CalculateLighting(viewDir, normal);
    vec3 reflectionColor = SSR(normal);
    
    vec3 refractionColor = texture(sceneTexture, screenUV).rgb;
    float fresnel = Fresnel(normal, viewDir);
    vec3 reflectionRefractionColor = mix(refractionColor, reflectionColor, fresnel);
    float refractionDistance = distanceInWater(sceneDepthAtPixel, gl_FragCoord.z);
    float atten = attenuation(refractionDistance);
    waterColor = mix(waterColor, reflectionRefractionColor, atten * (1.0 - waterObscurity));
    fragColor = vec4(waterColor, 1.0);
}
