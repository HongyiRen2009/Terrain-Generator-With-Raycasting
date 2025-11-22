#version 300 es
precision highp float;
#define NUM_SAMPLES 64
in vec2 fragUV;
out float ssao;
uniform sampler2D normalTexture;
uniform sampler2D depthTexture;
uniform sampler2D noiseTexture;
uniform float noiseSize;
uniform vec3 samples[64];
uniform mat4 proj;
uniform mat4 projInverse;
uniform float radius;
uniform float bias;
uniform bool enableSSAO;
vec3 getViewPosition(vec2 texCoord) {
    float depth = texture(depthTexture, texCoord).r;
    vec2 ndc = texCoord * 2.0f - 1.0f;
    vec4 clipSpacePos = vec4(ndc, depth * 2.0f - 1.0f, 1.0f);
    vec4 viewSpacePos = projInverse * clipSpacePos;
    return viewSpacePos.xyz / viewSpacePos.w;
}

void main() {
    if(!enableSSAO) {
        ssao = 1.0f;
        return;
    }
    // Calculate noise scale to tile noise texture across screen
    vec2 screenSize = vec2(textureSize(depthTexture, 0));
    
    vec3 fragPos = getViewPosition(fragUV);
    
    // Read normal directly from floating point texture
    vec3 normal = normalize(texture(normalTexture, fragUV).rgb);
    
    // Use pixel coordinates with modulo to avoid floating point precision issues and grid artifacts
    // This ensures the noise texture tiles smoothly without visible patterns
    ivec2 screenPos = ivec2(fragUV * screenSize);
    vec3 randomVec = normalize(texture(noiseTexture, vec2(screenPos) / noiseSize).xyz);

    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.0f;

    for(int i = 0; i < NUM_SAMPLES; i++) {
        vec3 samplePos = TBN * samples[i];
        samplePos = fragPos + samplePos * radius;

        vec4 offset = proj * vec4(samplePos, 1.0f);
        offset.xyz /= offset.w;
        offset.xyz = offset.xyz * 0.5f + 0.5f;

        if(offset.x < 0.0f || offset.x > 1.0f || offset.y < 0.0f || offset.y > 1.0f) {
            continue;
        }

        float sampleDepth = getViewPosition(offset.xy).z;
        if(texture(depthTexture, offset.xy).r >= 1.0f)
            continue;
        float rangeCheck = abs(fragPos.z - sampleDepth) < radius ? 1.0f : 0.0f;
        occlusion += (sampleDepth >= samplePos.z + bias ? 1.0f : 0.0f) * rangeCheck;
    }

    occlusion = 1.0f - (occlusion / float(NUM_SAMPLES));
    ssao = occlusion;
}