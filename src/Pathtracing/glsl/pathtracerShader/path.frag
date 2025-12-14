#version 300 es

//Sources:
//Gemini/Chatgpt (GOATS) - Written most of the funky low level code (texture reading)
//Hongyi Ren - Cloud sampling functions
//https://www.reddit.com/r/GraphicsProgramming/comments/pjssze/directional_lighting_in_a_path_tracer/ - More specifically the two stackoverflow links in the comments - NEE implementation
//https://www.cg.tuwien.ac.at/sites/default/files/course/4854/attachments/12_3_next%20event%20estimation_notes.pdf - NEE theory

precision highp float;
precision highp sampler3D;
precision highp int;
#define MAX_LIGHTS 30
#define PI 3.1415926
#define BVH_DEPTH 64
#define NUM_TERRAINS 50 

//Note: 
uniform sampler2D u_lastFrame;
uniform int u_frameNumber;
uniform int numBounces;


uniform sampler2D u_vertices;
uniform sampler2D u_terrains;
uniform sampler2D u_normals;
uniform sampler2D u_boundingBox;
uniform sampler2D u_nodesTex;
uniform sampler2D u_leafsTex;
uniform sampler2D u_terrainTypes;
uniform sampler3D u_CloudNoise;
uniform sampler2D u_WeatherMap;

uniform vec3 u_cameraPos;
uniform mat4 u_invViewProjMatrix;
uniform vec2 u_resolution;

uniform vec3 u_cloudsCubeMin;
uniform vec3 u_cloudsCubeMax;

//Cloud settings
uniform bool CLOUDS_enableClouds;
uniform float CLOUDS_absorption;
uniform float CLOUDS_densityThreshold;
uniform float CLOUDS_baseFrequency;
uniform float CLOUDS_detailFrequency;
uniform float CLOUDS_lightAbsorption;
uniform float CLOUDS_lightIntensity;
uniform float CLOUDS_darknessThreshold;
uniform float CLOUDS_ambientIntensity;
uniform float CLOUDS_phaseG;
uniform float CLOUDS_phaseMultiplier;
uniform float CLOUDS_weatherMapOffsetX;
uniform float CLOUDS_weatherMapOffsetY;
uniform int CLOUDS_MAX_STEPS;
uniform int CLOUDS_MAX_STEPS_LIGHT;

struct Light {
    vec3 position;
    vec3 color;
    vec3 showColor;
    float intensity;
    float radius;
};
uniform Light lights[MAX_LIGHTS];
uniform int numActiveLights;

uniform float sunDirX;
uniform float sunDirY;
uniform float sunDirZ;

//uniform vec3 u_sunDirection;     // Direction *from* the scene *to* the sun (normalized)
//uniform vec3 u_sunColor;         // The sun's color (e.g., vec3(1.0, 0.9, 0.8))
uniform float u_sunIntensity;    // Sun intensity (controls brightness)
uniform float u_sunAngularRadius; // Angular radius of the sun in radians (approx 0.00465 radians or 0.266 degrees)
vec3 u_sunColor = vec3(1.0, 0.95, 0.9);

in vec2 v_uv;
out vec4 fragColor;

struct BVH{
    vec3 min;
    vec3 max;
    int right;
    int left;
    int[4] triangles;
};

struct Triangle{
    vec3[3] vertices; 
    int[3] types;
    vec3 min;
    vec3 max;
    vec3 center;
    vec3 triNormal;
    vec3[3] normals;
};

struct TerrainType{
    vec3 color;
    float reflectiveness; // Decimal 0-1   
    float roughness; // Decimal 0-1
    int type; //Type. See terrains.ts
};

TerrainType[NUM_TERRAINS] Terrains;
uniform int u_numTerrains;

// Provides a high quality 32-bit hash function to generate pseudo-random numbers
// Source: https://www.shadertoy.com/view/4djSRW by Dave Hoskins
uint hash(uint state) {
    state ^= 2747636419u;
    state *= 2654435769u;
    state ^= state >> 16;
    state *= 2654435769u;
    state ^= state >> 16;
    state *= 2654435769u;
    return state;
}

// Generates a random float in the [0, 1] range
float rand(inout uint state) {
    state = hash(state);
    return float(state) / 4294967295.0; // 2^32 - 1
}

float fetchFloatFrom1D(sampler2D tex, int index) {
    ivec2 size = textureSize(tex, 0);
    int texWidth = size.x;
    
    int texelIndex = index / 4;      // Which texel (pixel) contains our float
    int componentIndex = index % 4;  // Which component (r,g,b,a) of the texel

    // Calculate 2D coordinates of the texel
    int y_coord = texelIndex / texWidth;
    int x_coord = texelIndex % texWidth;

    // Convert to UV coordinates [0, 1] for sampling
    // Add 0.5 to sample the center of the texel
    float u = (float(x_coord) + 0.5) / float(texWidth);
    float v = (float(y_coord) + 0.5) / float(size.y);

    vec4 texel = textureLod(tex, vec2(u, v), 0.0);//texture(tex, vec2(u, v));

    if (componentIndex == 0) return texel.r;
    else if (componentIndex == 1) return texel.g;
    else if (componentIndex == 2) return texel.b;
    else return texel.a;
}

BVH getBVH(int i){
    BVH r;
    int bbBoxSize = 6;
    r.min = vec3(fetchFloatFrom1D(u_boundingBox, i*bbBoxSize),fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+1),fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+2));
    r.max = vec3(fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+3),fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+4),fetchFloatFrom1D(u_boundingBox, i*bbBoxSize+5));

    int nodeSize = 2;
    r.left = int(fetchFloatFrom1D(u_nodesTex,i*nodeSize));
    r.right = int(fetchFloatFrom1D(u_nodesTex,i*nodeSize+1));

    int leafSize = 4;
    r.triangles[0]=int(fetchFloatFrom1D(u_leafsTex,i*leafSize));
    r.triangles[1]=int(fetchFloatFrom1D(u_leafsTex,i*leafSize+1));
    r.triangles[2]=int(fetchFloatFrom1D(u_leafsTex,i*leafSize+2));
    r.triangles[3]=int(fetchFloatFrom1D(u_leafsTex,i*leafSize+3));
    
    return r;
}

Triangle getTriangle(int i){
    Triangle tri;
    int triVertexSize = 9;
    tri.vertices[0] = vec3(fetchFloatFrom1D(u_vertices, i*triVertexSize), fetchFloatFrom1D(u_vertices, i*triVertexSize+1), fetchFloatFrom1D(u_vertices, i*triVertexSize+2));
    tri.vertices[1] = vec3(fetchFloatFrom1D(u_vertices, i*triVertexSize+3), fetchFloatFrom1D(u_vertices, i*triVertexSize+4), fetchFloatFrom1D(u_vertices, i*triVertexSize+5));
    tri.vertices[2] = vec3(fetchFloatFrom1D(u_vertices, i*triVertexSize+6), fetchFloatFrom1D(u_vertices, i*triVertexSize+7), fetchFloatFrom1D(u_vertices, i*triVertexSize+8));

    int typeSize = 3;
    tri.types[0] = int(fetchFloatFrom1D(u_terrains, i*typeSize));
    tri.types[1] = int(fetchFloatFrom1D(u_terrains, i*typeSize+1));
    tri.types[2] = int(fetchFloatFrom1D(u_terrains, i*typeSize+2));

    tri.min = vec3(min(tri.vertices[0].x, min(tri.vertices[1].x, tri.vertices[2].x)),
                   min(tri.vertices[0].y, min(tri.vertices[1].y, tri.vertices[2].y)),
                   min(tri.vertices[0].z, min(tri.vertices[1].z, tri.vertices[2].z)));
    tri.max = vec3(max(tri.vertices[0].x, max(tri.vertices[1].x, tri.vertices[2].x)),
                   max(tri.vertices[0].y, max(tri.vertices[1].y, tri.vertices[2].y)),
                   max(tri.vertices[0].z, max(tri.vertices[1].z, tri.vertices[2].z)));
    tri.center = (tri.min + tri.max) * 0.5;
    tri.triNormal = normalize(cross(tri.vertices[1] - tri.vertices[0], tri.vertices[2] - tri.vertices[0]));

    tri.normals[0] = vec3(fetchFloatFrom1D(u_normals, i*triVertexSize), fetchFloatFrom1D(u_normals, i*triVertexSize+1), fetchFloatFrom1D(u_normals, i*triVertexSize+2));
    tri.normals[1] = vec3(fetchFloatFrom1D(u_normals, i*triVertexSize+3), fetchFloatFrom1D(u_normals, i*triVertexSize+4), fetchFloatFrom1D(u_normals, i*triVertexSize+5));
    tri.normals[2] = vec3(fetchFloatFrom1D(u_normals, i*triVertexSize+6), fetchFloatFrom1D(u_normals, i*triVertexSize+7), fetchFloatFrom1D(u_normals, i*triVertexSize+8));

    return tri;
}

TerrainType getTerrainType(int i){
    TerrainType t;
    int terrainTypeSize = 6;
    t.color = vec3(fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize), fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+1), fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+2));
    t.reflectiveness = fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+3); 
    t.roughness = fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+4); 
    t.type = int(fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+5));

    return t;
}

bool intersectAABB(vec3 rayOrigin, vec3 rayDir, vec3 boxMin, vec3 boxMax, out float tMin, out float tMax) {
    vec3 invDir = 1.0 / rayDir;
    vec3 t0s = (boxMin - rayOrigin) * invDir;
    vec3 t1s = (boxMax - rayOrigin) * invDir;

    vec3 tSmalls = min(t0s, t1s);
    vec3 tBigs = max(t0s, t1s);

    tMin = max(max(tSmalls.x, tSmalls.y), tSmalls.z);
    tMax = min(min(tBigs.x, tBigs.y), tBigs.z);

    return tMax >= max(tMin, 0.0);
}

//AI written; Returns distance to intersection with triangle
float intersectTriangle(vec3 rayOrigin, vec3 rayDir, Triangle tri, out vec3 barycentric) {
    const float EPSILON = 0.000001;
    vec3 v0 = tri.vertices[0];
    vec3 v1 = tri.vertices[1];
    vec3 v2 = tri.vertices[2];

    vec3 edge1 = v1 - v0;
    vec3 edge2 = v2 - v0;

    vec3 h = cross(rayDir, edge2);
    float a = dot(edge1, h);

    if (a > -EPSILON && a < EPSILON) {
        return -1.0; // Ray is parallel to the triangle
    }

    float f = 1.0 / a;
    vec3 s = rayOrigin - v0;
    float u = f * dot(s, h);

    if (u < 0.0 || u > 1.0) {
        return -1.0;
    }

    vec3 q = cross(s, edge1);
    float v = f * dot(rayDir, q);

    if (v < 0.0 || u + v > 1.0) {
        return -1.0;
    }

    // At this stage we can compute t to find out where the intersection point is on the line.
    float t = f * dot(edge2, q);
    if (t > EPSILON) { // ray intersection
        barycentric = vec3(1.0 - u - v, u, v);
        return t;
    }
    
    return -1.0; // This means that there is a line intersection but not a ray intersection.
}

//AI written; Returns distance to intersection with light sphere
float intersectLight(vec3 rayOrigin, vec3 rayDir, Light light, out vec3 hitNormal) {
    vec3 oc = rayOrigin - light.position; 

    // The coefficients of the quadratic equation (at^2 + bt + c = 0)
    float a = dot(rayDir, rayDir); // Should be 1.0 for a normalized rayDir
    float b = 2.0 * dot(oc, rayDir);
    float c = dot(oc, oc) - light.radius * light.radius;

    float discriminant = b*b - 4.0*a*c;

    // If the discriminant is negative, the ray misses the sphere.
    if (discriminant < 0.0) {
        return -1.0;
    }

    float sqrt_d = sqrt(discriminant);

    // Calculate the two potential intersection distances (solutions for t)
    float t0 = (-b - sqrt_d) / (2.0 * a);
    float t1 = (-b + sqrt_d) / (2.0 * a);

    // We need the smallest, positive t value.
    // Check the closer intersection point (t0) first.
    if (t0 > 0.001) { // Use a small epsilon to avoid self-intersection artifacts
        vec3 hitPoint = rayOrigin + t0 * rayDir;
        hitNormal = normalize(hitPoint - light.position);
        return t0;
    }
    // If t0 was behind the ray, check the farther intersection point (t1).
    // This case occurs if the ray starts inside the sphere.
    else if (t1 > 0.001) {
        vec3 hitPoint = rayOrigin + t1 * rayDir;
        hitNormal = normalize(hitPoint - light.position);
        return t1;
    }

    // Both intersection points are behind the ray's origin.
    return -1.0;
}

/**
 * Returns TRIANGLE index
 */
int traverseBVH(vec3 rayOrigin, vec3 rayDir, out vec3 closestBarycentric, out float minHitDistance, out Triangle hitTriangle) {
    int closestHitIndex = -1;
    minHitDistance = 1.0/0.0001; // Infinity

    int stack[BVH_DEPTH]; 
    int stackPtr = 0;
    stack[stackPtr++] = 0; // Push root node index

    while (stackPtr > 0) {
        int nodeIndex = stack[--stackPtr];
        BVH node = getBVH(nodeIndex);

        float tMin, tMax;
        if (!intersectAABB(rayOrigin, rayDir, node.min, node.max, tMin, tMax)) {
            continue;
        }

        if (tMin >= minHitDistance) {
            continue;
        }

        if (node.left == -1) { // Leaf Node
            for (int j = 0; j < 4; j++) {
                int triIdx = node.triangles[j];
                if (triIdx == -1) continue;

                Triangle tri = getTriangle(triIdx);
                vec3 currentBarycentric;
                float hitDist = intersectTriangle(rayOrigin, rayDir, tri, currentBarycentric);

                if (hitDist > 0.0 && hitDist < minHitDistance) {
                    minHitDistance = hitDist;
                    closestHitIndex = triIdx;
                    closestBarycentric = currentBarycentric;
                    hitTriangle= tri;
                }
            }
        } else { // Internal Node
            // Check for space for two children to prevent stack overflow
            if (stackPtr < BVH_DEPTH-1) { 
                stack[stackPtr++] = node.left;
                stack[stackPtr++] = node.right;
            }
        }
    }

    return closestHitIndex;
}

vec3 smoothItem(vec3[3] a, vec3 baryCentric){
    return (
        baryCentric.x * a[0] + 
        baryCentric.y * a[1] +
        baryCentric.z * a[2]
    );
}
float smoothItem(float[3] a, vec3 baryCentric){
    return(
        baryCentric.x * a[0] + 
        baryCentric.y * a[1] +
        baryCentric.z * a[2]
    );
}

void getInfo(Triangle tri, TerrainType tt1, TerrainType tt2, TerrainType tt3, vec3 baryCentric, out vec3 smoothNormal, out vec3 matColor, out float matRoughness, out float reflectiveness){
    vec3[3] colors = vec3[3](
        tt1.color,
        tt2.color,
        tt3.color
    );
    float[3] reflectivities = float[3](
        tt1.reflectiveness,
        tt2.reflectiveness,
        tt3.reflectiveness
    );
    float[3] roughness = float[3](
        tt1.roughness,
        tt2.roughness,
        tt3.roughness
    );

    smoothNormal = normalize(smoothItem(tri.normals,baryCentric));
    matColor = smoothItem(colors,baryCentric);
    matRoughness = smoothItem(roughness,baryCentric);
    reflectiveness = smoothItem(reflectivities,baryCentric);
}

/**
Return random direction based on given via cosine
*/
vec3 weightedDIR(vec3 normal, inout uint rng_state){
    float r1 = rand(rng_state);
    float r2 = rand(rng_state);

    float phi = 2.0 * PI * r1;
    float cos_theta = sqrt(1.0 - r2);
    float sin_theta = sqrt(r2);
    vec3 randomDirHemi = vec3(cos(phi) * sin_theta, sin(phi) * sin_theta, cos_theta);
    vec3 up = abs(normal.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up, normal));
    vec3 bitangent = cross(normal, tangent);
    vec3 dirWorld = tangent * randomDirHemi.x + bitangent * randomDirHemi.y + normal * randomDirHemi.z;
    return normalize(dirWorld);
}

vec3 sampleGlossyDirection(vec3 perfectDir, float roughness, inout uint rng_state) {
    float r1 = rand(rng_state);
    float r2 = rand(rng_state);

    float shininess = pow(1.0 - roughness, 3.0) * 1000.0; // adjust as needed

    float phi = 2.0 * PI * r1;
    float cosTheta = pow(r2, 1.0 / (shininess + 1.0));
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

    vec3 localDir = vec3(
        cos(phi) * sinTheta,
        sin(phi) * sinTheta,
        cosTheta
    );

    // Construct tangent space around the perfect reflection direction
    vec3 up = abs(perfectDir.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up, perfectDir));
    vec3 bitangent = cross(perfectDir, tangent);

    vec3 worldDir = normalize(
        tangent * localDir.x + bitangent * localDir.y + perfectDir * localDir.z
    );

    return worldDir;
}
vec3 sampleCone(vec3 coneAxis, float maxAngle, inout uint rng_state) {
    // 1. Generate 2 random numbers
    float r1 = rand(rng_state);
    float r2 = rand(rng_state);

    float cosMaxAngle = cos(maxAngle);
    
    // --- 2. Spherical Coordinate Sampling (Inverse Transform Sampling) ---
    // cos_theta: Samples the cosine of the polar angle (theta) uniformly 
    // over the solid angle of the cone. This is the crucial step for uniformity.
    float cos_theta = mix(cosMaxAngle, 1.0, r2); 
    
    float sin_theta = sqrt(1.0 - cos_theta * cos_theta);
    float phi = 2.0 * PI * r1; // Azimuthal angle (phi) is uniform 0 to 2*PI

    // --- 3. Create Local Direction (Cone Axis = Z-axis) ---
    // The direction vector in the local cone space.
    vec3 localDir = vec3(
        cos(phi) * sin_theta,
        sin(phi) * sin_theta,
        cos_theta
    );

    // --- 4. Transform Local Direction to World Space (Tangent Space Transform) ---
    
    // Calculate an orthonormal basis (tangent space) around the coneAxis.
    // The standard 'up' vector handles cases where coneAxis is near (0, 1, 0)
    // by choosing a different vector to cross with.
    vec3 up = abs(coneAxis.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up, coneAxis));
    vec3 bitangent = cross(coneAxis, tangent);

    // Transform the local direction (localDir) into the world space basis (tangent, bitangent, coneAxis)
    vec3 worldDir = normalize(
        tangent * localDir.x + 
        bitangent * localDir.y + 
        coneAxis * localDir.z
    );
    
    return worldDir;
}

bool isValidVec3(vec3 v) {
    return all(greaterThanEqual(v, vec3(-1e20))) &&
           all(lessThanEqual(v, vec3(1e20))) &&
           !any(isnan(v));
}
//Copied from the goat Hongyi Ren
float sampleBaseNoise(vec3 pos) {
    float noise = texture(u_CloudNoise, pos).r;
    return noise;
}
float fbm(vec3 pos, int octaves, float persistence, float lacunarity) {
    float total = 0.0f;
    float amplitude = 1.0f;
    float maxValue = 0.0f;
    for(int i = 0; i < octaves; i++) {
        total += sampleBaseNoise(pos) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        pos *= lacunarity;
    }
    return total / maxValue;
}
float sampleDetailNoise(vec3 p) {
    vec3 worley = texture(u_CloudNoise, p * 2.0f).gba;
    return (worley.r * 0.625f + worley.g * 0.25f + worley.b * 0.125f);
}
float sampleDensity(vec3 pos) {
    vec3 windDirection = normalize(vec3(1, 0.0f, 1));
    vec3 windOffset = windDirection * 1.0 * 1.0 ;
    vec3 animatedPos = pos + windOffset;

    vec3 localPos = (animatedPos - u_cloudsCubeMin) / (u_cloudsCubeMax - u_cloudsCubeMin);
    // Weather map (right now idk if this is the best implementation and it needs some improvement)

    vec2 weatherUV = (animatedPos.xz - u_cloudsCubeMin.xz) / (u_cloudsCubeMax.xz - u_cloudsCubeMin.xz);
    vec2 weatherMapOffset = vec2(CLOUDS_weatherMapOffsetX, CLOUDS_weatherMapOffsetY);
    vec2 weatherWindOffset = windDirection.xz * 1.0 * 1.0 * 0.001f;
    vec4 weather = texture(u_WeatherMap, weatherUV + weatherMapOffset + weatherWindOffset);
    float coverage = weather.r;
    if(coverage < 0.01f)
        return 0.0f;

    float height01 = (animatedPos.y - u_cloudsCubeMin.y) / (u_cloudsCubeMax.y - u_cloudsCubeMin.y);
    if(height01 < 0.1f || height01 > 1.0f)
        return 0.0f;

    float base = fbm(localPos * CLOUDS_baseFrequency, 5, 0.5f, 2.0f);
    float density = base * coverage;
    if(density < CLOUDS_densityThreshold)
        return 0.0f;

    vec3 detailWindOffset = windOffset * 0.5f;
    vec3 detailPos = (pos + detailWindOffset - u_cloudsCubeMin) / (u_cloudsCubeMax - u_cloudsCubeMin);
    float detail = sampleDetailNoise(detailPos * CLOUDS_detailFrequency);
    density *= mix(0.5f, 1.0f, detail);

    // Height falloff and edge fade (stolen from Sebastian Lague)
    float originalHeight = (pos.y - u_cloudsCubeMin.y) / (u_cloudsCubeMax.y - u_cloudsCubeMin.y);
    float heightWeight = smoothstep(0.1f, 0.5f, originalHeight) * (1.0f - smoothstep(0.6f, 1.0f, originalHeight));
    float containerEdgeFadeDst = 50.0f;
    float dstFromEdgeX = min(containerEdgeFadeDst, min(pos.x - u_cloudsCubeMin.x, u_cloudsCubeMax.x - pos.x));
    float dstFromEdgeZ = min(containerEdgeFadeDst, min(pos.z - u_cloudsCubeMin.z, u_cloudsCubeMax.z - pos.z));
    float edgeWeight = min(dstFromEdgeZ, dstFromEdgeX) / containerEdgeFadeDst;
    heightWeight *= edgeWeight;

    density = (density - CLOUDS_densityThreshold) * heightWeight;
    return clamp(density, 0.0f, 1.0f);
}
float PhaseFunction(float cosTheta, float g) {
    float g2 = g * g;
    float denom = pow(1.0f + g2 - 2.0f * g * cosTheta, 1.5f);
    return (1.0f - g2) / (4.0f * PI * denom);
}
float sampleCloudLight(vec3 pos, vec3 lightDir, float rayDensity) {
    vec3 u_sunDirection = normalize(vec3(sunDirX, sunDirY, sunDirZ));

    float Tmin, Tmax;
    intersectAABB(pos,normalize(lightDir),u_cloudsCubeMin,u_cloudsCubeMax,Tmin,Tmax);
    float distInsideBox = Tmax-Tmin;

    int lightSteps = rayDensity > 0.5f ? CLOUDS_MAX_STEPS_LIGHT : CLOUDS_MAX_STEPS_LIGHT / 2;

    float lightTransmittance = 1.0f;
    float tStep = distInsideBox / float(lightSteps);

    for(int i = 0; i < lightSteps; i++) {
        if(lightTransmittance < 0.01f) {
            return CLOUDS_darknessThreshold;
        }

        float t = tStep * (float(i) + 0.5f);
        vec3 samplePos = pos + lightDir * t;
        float rawDensity = sampleDensity(samplePos);
        float density = pow(smoothstep(0.0f, 1.0f, rawDensity), 0.6f);
        lightTransmittance *= exp(-density * tStep * CLOUDS_lightAbsorption);
    }
    return CLOUDS_darknessThreshold + (1.0f - CLOUDS_darknessThreshold) * lightTransmittance;
}
vec4 handleClouds(vec3 rayOrigin, vec3 rayDir, vec3 skyColor){
    if(!CLOUDS_enableClouds){
        return vec4(0.0);
    }
    float cloudTmin;
    float cloudTmax;
    if(!intersectAABB(rayOrigin, rayDir, u_cloudsCubeMin, u_cloudsCubeMax, cloudTmin, cloudTmax)){
        return vec4(0.0);
    }
    float cloudInside = cloudTmax - cloudTmin;
    if(cloudInside <= 0.0f) {
        return vec4(0.0f);
    }
    float tStep = (cloudInside)/float(CLOUDS_MAX_STEPS);
    vec4 accumulatedColor = vec4(0.0f);
    float blueNoiseOffset = 0.0;//fract(sin(dot(gl_FragCoord.xy, vec2(12.9898f, 78.233f))) * 43758.5453f);

    const float DENSITY_THRESHOLD_SKIP = 0.01f;
    const float ALPHA_THRESHOLD = 0.99f;

    for(int i = 0; i < CLOUDS_MAX_STEPS; i++) {
        float t = cloudTmin + tStep * (float(i) + blueNoiseOffset);

        vec3 samplePos = rayOrigin + rayDir * t;

        // Sample density
        float rawDensity = sampleDensity(samplePos);
        if(rawDensity < DENSITY_THRESHOLD_SKIP) {
            i += 1; // Skip next sample
            continue;
        }
        float density = pow(smoothstep(0.0f, 1.0f, rawDensity), 0.6f);

        // Calculate lighting with adaptive quality
        vec3 u_sunDirection = normalize(vec3(sunDirX, sunDirY, sunDirZ));
        vec3 lightDir = normalize(-u_sunDirection);
        float lightTransmittance = sampleCloudLight(samplePos, lightDir, density);

        // Phase function for silver lining
        float cosTheta = dot(normalize(rayDir), lightDir);
        float phaseVal = PhaseFunction(cosTheta, CLOUDS_phaseG);
        phaseVal = mix(1.0f, phaseVal, CLOUDS_phaseMultiplier);

        // Final light color
        vec3 sunLight = u_sunColor * lightTransmittance * CLOUDS_lightIntensity * phaseVal;

        // Powder effect
        float powderEffect = 1.0f - exp(-density * 2.0f);
        sunLight *= mix(1.0f, powderEffect, 0.5f);

        // Ambient and bounce light
        float height = (samplePos.y - u_cloudsCubeMin.y) / (u_cloudsCubeMax.y - u_cloudsCubeMin.y);
        float groundFactor = 1.0f - height;
        vec3 bounceLight = vec3(0.8f, 0.75f, 0.7f) * groundFactor * 0.1f;
        vec3 ambientLight = skyColor * CLOUDS_ambientIntensity;

        //Final light color
        vec3 lightColor = sunLight + ambientLight + bounceLight;

        float stepOpacity = 1.0f - exp(-density * tStep * CLOUDS_absorption);

        // Accumulate color using front-to-back compositing and premultiplied alpha
        vec4 color = vec4(lightColor * stepOpacity, stepOpacity);
        accumulatedColor += color * (1.0f - accumulatedColor.a);

        if(accumulatedColor.a > ALPHA_THRESHOLD)
            break;
    }
    return accumulatedColor;
}

vec3 shootShadowRay(vec3 origin, vec3 BRDF, vec3 smoothNormal, inout uint rng_state){
    vec3 directLight = vec3(0.0);
    for(int i = 0; i < numActiveLights; i++){
        Light light = lights[i]; 
        rng_state = hash(rng_state);
        //choose a point on the light sphere
        float r1 = (rand(rng_state)-0.5)*2.0;
        float r2 = (rand(rng_state)-0.5)*2.0;
        float r3 = (rand(rng_state)-0.5)*2.0;
        vec3 jitter = normalize(vec3(r1,r2,r3)) * light.radius;
        vec3 lightPoint = light.position + jitter;

        vec3 lightDir = normalize(lightPoint - origin);
        float lightDistance = length(lightPoint - origin);
        //shadow ray

        vec3 shadowOrigin = origin;
        vec3 shadowBarycentric;
        float shadowHitDistance;
        Triangle shadowTri;
        int shadowTriIndex = traverseBVH(shadowOrigin, lightDir, shadowBarycentric, shadowHitDistance,shadowTri);
        if(shadowTriIndex == -1 || shadowHitDistance > lightDistance){
            float P = 1.0/(lightDistance*lightDistance);
            float NdotL = max(dot(smoothNormal, lightDir), 0.0);
            directLight += BRDF*light.color*light.intensity*NdotL*P*PI*light.radius*light.radius;
        }
    }
    return directLight;
}

vec3 sampleSunLight(vec3 origin, vec3 BRDF, vec3 smoothNormal, inout uint rng_state) {
    vec3 u_sunDirection = normalize(vec3(sunDirX, sunDirY, sunDirZ));
    vec3 sunAxis = -u_sunDirection; // Direction *to* the sun

    vec3 lightDir = sampleCone(sunAxis, u_sunAngularRadius, rng_state);

    float NdotL = max(dot(smoothNormal, lightDir), 0.0);
    if (NdotL <= 0.0) {
        return vec3(0.0);
    }
    
    // 3. Shadow Test
    vec3 shadowBarycentric;
    float shadowHitDistance;
    Triangle shadowTri;
    int shadowTriIndex = traverseBVH(origin, lightDir, shadowBarycentric, shadowHitDistance, shadowTri);

    if (shadowTriIndex == -1) {
        // Ray is not blocked, calculate light contribution
        float cos_alpha = cos(u_sunAngularRadius);
        float solidAngle = 2.0 * PI * (1.0 - cos_alpha);
        float PDF = 1.0 / solidAngle; 
        
        // --- Light Contribution (Radiance) ---
        // L_i = BRDF * NdotL / PDF * Radiance
        // Radiance (L_e) = Intensity / SolidAngle
        // L_i = BRDF * NdotL / PDF * (u_sunIntensity / solidAngle) 
        // L_i = BRDF * NdotL * (1 / PDF) * (u_sunIntensity / solidAngle)
        // Since (1/PDF) = solidAngle, the solidAngle terms cancel out perfectly:
        
        vec3 radiance = u_sunColor * u_sunIntensity;
                
        vec3 directLight = BRDF * u_sunColor * u_sunIntensity * NdotL;

        return directLight;
    }
    
    return vec3(0.0);
}

vec3 getSkyColor(vec3 rayDir, vec3 sunDir) {
    // 1. Constants for Earth's Atmosphere
    // Rayleigh coefficient (scatters blue more)
    vec3 kRlh = vec3(5.5, 13.0, 33.1) * 0.005;
    // Mie coefficient (scatters white)
    float kMie = 0.01;
    // Sun brightness
    float sunIntensity = 22.0; 
    
    // 2. Geometry: How "thick" is the atmosphere in this direction?
    // We approximate the optical depth using the zenith angle.
    // When looking up (y=1), depth is 1. When looking at horizon (y=0), depth is huge.
    // The "max" prevents division by zero below the horizon.
    float zenithAngle = clamp(rayDir.y,0.0, 1.0);
    float opticalDepth = 1.0 / (zenithAngle + 0.05); // +0.05 acts as the "scale height" approximation
    
    // 3. Phase Functions: How much light scatters towards the camera?
    float cosTheta = dot(rayDir, sunDir);
    
    // Rayleigh Phase (simple symmetric scattering)
    float rPhase = 3.0 / (16.0 * PI) * (1.0 + cosTheta * cosTheta);
    
    // Mie Phase (Henyey-Greenstein) - Creates the bright sun halo
    // g is anisotropy: 0.7-0.8 for strong forward glare
    float g = 0.76; 
    float g2 = g * g;
    float mPhase = (1.0 - g2) / (4.0 * PI * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));

    // 4. Combine
    // Calculate how much blue (Rayleigh) and white (Mie) light is scattered to us
    vec3 rayleigh = kRlh * opticalDepth * rPhase;
    vec3 mie = vec3(kMie) * opticalDepth * mPhase;
    
    // Add them up and multiply by sun intensity
    // Note: In a full path tracer, you might want to tonemap this result later
    return (rayleigh + mie) * sunIntensity;
}

vec3 PathTrace(vec3 OGrayOrigin, vec3 OGrayDir, inout uint rng_state) {
    vec3 u_sunDirection = normalize(vec3(sunDirX, sunDirY, sunDirZ));
    vec3 rayOrigin = OGrayOrigin;
    vec3 rayDir = OGrayDir;

    vec3 color = vec3(0.0);
    vec3 throughput = vec3(1.0);

    int hasMirror = -1;
    for (int bounce = 0; bounce < numBounces; bounce++) {
        vec3 baryCentric;
        float minHitDistance;
        Triangle tri;
        int triIndex = traverseBVH(rayOrigin, rayDir, baryCentric, minHitDistance,tri);
        
        int hitLightIndex = -1;
        for (int i = 0; i < numActiveLights; i++) {
            vec3 lightHitNormal;
            float lightHitDistance = intersectLight(rayOrigin, rayDir, lights[i], lightHitNormal);
            if (lightHitDistance > 0.0 && lightHitDistance < minHitDistance) {
                hitLightIndex = i;
                minHitDistance = lightHitDistance;
            }
        }

        if (hitLightIndex != -1) {
            // Ray hit light source
            if(bounce == 0 || bounce == hasMirror + 1){
                // Directly visible light or after mirror/glossy
                vec4 cloudHandled = handleClouds(OGrayOrigin,OGrayDir,vec3(0.8));
                color += throughput * lights[hitLightIndex].color * lights[hitLightIndex].intensity;
                color = mix(color,cloudHandled.xyz,cloudHandled.a);
            }
            //Note, now that we have an NEE we do not need to factor in light hit after the first bounce.
            break; // Path terminates.
        }

        if (triIndex == -1) {
            // Ray missed everything and flew into space (Sky).
            vec3 atmosphereColor = getSkyColor(rayDir, -u_sunDirection);

            vec3 sunDirToScene = -u_sunDirection; // Direction from scene TO the sun
            float cosAngle = dot(rayDir, sunDirToScene);
            
            // The angular radius is very small, so we use its cosine
            float cosAngularRadius = cos(u_sunAngularRadius);
            
            // If the angle between the ray and the center of the sun is less than the angular radius, 
            // the ray hit the visible sun disk.
            bool hitSunDisk = (cosAngle >= cosAngularRadius);

            vec3 finalSky = atmosphereColor;

            if (hitSunDisk) {
                // Ray hit the visible Sun disk
                finalSky += u_sunColor * u_sunIntensity * 10.0; // Boosted intensity for visibility
            }

            // Apply clouds and final color
            if(bounce == 0 || bounce == hasMirror + 1){
                vec4 cloudHandled = handleClouds(rayOrigin, rayDir, finalSky);
                color = throughput * mix(finalSky, cloudHandled.xyz, cloudHandled.a);
            }
            
            break;
        }

        // The ray hit a triangle 
        //Get information
        vec3 hitPoint = rayOrigin + rayDir * minHitDistance;

        TerrainType t1 = Terrains[tri.types[0]];//getTerrainType(tri.types[0]);
        TerrainType t2 = Terrains[tri.types[1]];
        TerrainType t3 = Terrains[tri.types[2]];

        vec3 smoothNormal, matColor;
        float matRoughness, reflectiveness;
        int type = 1;
        if(t1.type != 1){
            type = t1.type;
        }else if(t2.type != 1){
            type = t2.type;
        }else if(t3.type != 1){
            type = t3.type;
        }else{
            type = t1.type; //default to first one in triangle
        }
        
        getInfo(tri, t1, t2, t3, baryCentric, smoothNormal, matColor, matRoughness, reflectiveness);
        

        vec3 geometricNormal = tri.triNormal;
        bool didSwitch = false;
        if (dot(geometricNormal, rayDir) > 0.0) geometricNormal = -geometricNormal; //"same direction"
        if (dot(smoothNormal, geometricNormal) < 0.0) {
            smoothNormal = -smoothNormal;
            didSwitch = true;
        } //If pointing in opposite directions, flip
        
        //in the future consider NEE (Next Event Estimation) - Was removed cause buggy

        // Create the next bounce ray
        if(type != 4) //Transmission goes through
            rayOrigin = hitPoint + geometricNormal * 0.1;
        if(type == 1){ //Diffuse
            //direct lighting
            vec3 directLight = vec3(0.0);
            vec3 BRDF = matColor / PI;
            directLight = sampleSunLight(rayOrigin,BRDF, smoothNormal, rng_state) + shootShadowRay(rayOrigin, BRDF, smoothNormal, rng_state);
            
            rayDir = weightedDIR(smoothNormal, rng_state);
            float cos_theta = dot(rayDir,smoothNormal);
            float p = 0.5*PI;
            throughput *= BRDF*cos_theta/p;
            color += throughput * directLight;
        }else if (type == 2) { // Specular (mirror)
            vec3 useNormal = smoothNormal;
            if (dot(useNormal, rayDir) > 0.0) useNormal = -useNormal; //"same direction"
            vec3 perfect = normalize(reflect(rayDir, useNormal));
            rayDir = perfect;
            throughput *= vec3(0.8); // decrease brightness a bit
            hasMirror = bounce;
        }else if (type == 3){ //Microfacet (Glossy), mixture of diffuse and specular
            vec3 useNormal = smoothNormal;
            if (dot(useNormal, rayDir) > 0.0) useNormal = -useNormal; //"same direction"
            vec3 perfect = normalize(reflect(rayDir, useNormal));
            rayDir = sampleGlossyDirection(perfect, matRoughness, rng_state);
            throughput *= matColor; //Switch to BDF later
            //Consider fresnel in the future
            hasMirror = bounce;
        }else if (type == 4){ //Transmission (Glass)
            float eta;
            vec3 transmissionNormal;
            if(didSwitch){ //exiting
                eta = reflectiveness / 1.0;
                transmissionNormal = -smoothNormal; // Refract in the opposite direction
            }else{ //entering
                eta = 1.0 / reflectiveness;
                transmissionNormal = smoothNormal; // Refract in the same direction
            }
            vec3 refracted = refract(rayDir, transmissionNormal, eta);
            if (length(refracted) < 0.001) {
                // TIR: fall back to mirror reflection
                vec3 useNormal = smoothNormal;
                if (dot(useNormal, rayDir) > 0.0) useNormal = -useNormal; //"same direction"
                rayDir = normalize(reflect(rayDir, useNormal));
                rayOrigin = hitPoint + geometricNormal * 0.01;
            } else {
                //Do microfacet
                vec3 useNormal = smoothNormal;
                if (dot(useNormal, rayDir) > 0.0) useNormal = -useNormal; //"same direction"
                rayDir = sampleGlossyDirection(normalize(refracted), matRoughness, rng_state);

                rayOrigin = hitPoint - geometricNormal * 0.01;
            }
            hasMirror = bounce; // Transmission is not a mirror, but we still track the last bounce
            vec3 CLOUDS_absorption = -log(matColor)*0.1;  // if matColor is tint
            throughput *= exp(-CLOUDS_absorption * (minHitDistance)); //Beer Lambert law
        }else if (type == 5){ // Emissive
            color += throughput * matColor;
            break;
        }
    }
    return min(color, vec3(10.0));
}

void main() {
    //Random Hash
    uint pixel_x = uint(v_uv.x * u_resolution.x); 
    uint pixel_y = uint(v_uv.y * u_resolution.y);
    uint seed = hash(pixel_x) + hash(pixel_y * 1999u);
    uint rng_state = hash(seed + uint(u_frameNumber));
    rng_state = hash(rng_state + uint(u_frameNumber));

    //Load terrains
    for(int i = 0; i < u_numTerrains; i++){
        Terrains[i] = getTerrainType(i);
    }
    
    // Jitter calculation for Anti-Alising
    uint jitter_rng_state = hash(rng_state); // Create a new state from the main one
    float jitterX = rand(jitter_rng_state) - 0.5; // Random value in [-0.5, 0.5]
    float jitterY = rand(jitter_rng_state) - 0.5; // Random value in [-0.5, 0.5]
    vec2 pixelSize = 1.0 / u_resolution; // Get the size of one pixel in UV space [0, 1].

    vec2 jitteredUV = v_uv + vec2(jitterX, jitterY) * pixelSize;
    vec2 screenPos = jitteredUV * 2.0 - 1.0; // Convert jittered UV to NDC

    // Define the ray in clip space. 'w' is 1.0 because it's a point.
    vec4 rayClip = vec4(screenPos, -1.0, 1.0); 
    // Transform from clip space to world space
    vec4 rayWorld = u_invViewProjMatrix * rayClip;
    // Perform perspective divide
    rayWorld /= rayWorld.w;
    // The ray direction is the vector from the camera to this point in the world
    vec3 rayDir = normalize(rayWorld.xyz - u_cameraPos);
    vec3 rayOrigin = u_cameraPos;

    vec3 newSampleColor = PathTrace(rayOrigin, rayDir, rng_state); // Sample Color
    vec3 newSum;
    if(u_frameNumber == 1){
        newSum = newSampleColor;
    }else{
        vec3 lastSum = texture(u_lastFrame, v_uv).rgb; //Old color
        newSum = lastSum + (newSampleColor - lastSum)/float(u_frameNumber);
    }

    fragColor = vec4(newSum,1.0); 
}