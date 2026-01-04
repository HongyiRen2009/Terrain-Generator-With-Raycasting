#version 300 es

//Sources:
//Gemini/Chatgpt (GOATS) - Written most of the funky low level code (texture reading)
//Hongyi Ren - Cloud sampling functions
//https://www.reddit.com/r/GraphicsProgramming/comments/pjssze/directional_lighting_in_a_path_tracer/ - More specifically the two stackoverflow links in the comments - NEE implementation
//https://www.cg.tuwien.ac.at/sites/default/files/course/4854/attachments/12_3_next%20event%20estimation_notes.pdf - NEE theory

precision highp float;
precision highp sampler3D;
precision highp int;
#define MAX_LIGHTS 100
#define PI 3.1415926
#define BVH_DEPTH 64
#define NUM_TERRAINS 50 
#define MAX_FLOAT 1e20

//Note: 
/*uniform sampler2D u_lastFrame;
uniform int numBounces;
uniform int u_skips;*/
uniform int u_frameNumber;
in vec2 v_uv;
// INPUTS (State from previous bounce)
uniform sampler2D u_posTex;
uniform sampler2D u_dirTex;
uniform sampler2D u_throughputTex;
uniform sampler2D u_radianceTex;
uniform int u_currentBounce; // 0 = Camera Ray, >0 = Bounce
// OUTPUTS (MRT)
layout(location = 0) out vec4 out_position;
layout(location = 1) out vec4 out_direction;
layout(location = 2) out vec4 out_throughput;
layout(location = 3) out vec4 out_radiance;

uniform sampler2D u_vertices;
uniform sampler2D u_terrains;
uniform sampler2D u_normals;
uniform sampler2D u_boundingBox;
uniform sampler2D u_nodesTex;
uniform sampler2D u_leafsTex;
uniform sampler2D u_terrainTypes;
uniform sampler2D u_grassBB;
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
uniform float CLOUDS_blueNoiseAmplitude;
uniform vec3 CLOUDS_baseCloudColor;
uniform float CLOUDS_skyContribution;
uniform float CLOUDS_lightDarkSharpness;
uniform float CLOUDS_simplexMultiplier;
const float CLOUDS_DENSITY_THRESHOLD_SKIP = 0.01f;
const float CLOUDS_ALPHA_THRESHOLD = 0.99f;

//Grass
uniform vec3 grassBaseColor;
uniform vec3 grassTipColor;
uniform bool grassEnabled;

//Light/Sun
struct Light {
    vec3 position;
    vec3 color;
    vec3 showColor;
    float intensity;
    float radius;
};
uniform Light lights[MAX_LIGHTS];
uniform int numActiveLights;


/*uniform float sunDirX;
uniform float sunDirY;
uniform float sunDirZ;*/
uniform vec3 u_sunDirection;

uniform float u_sunIntensity;    // Sun intensity (controls brightness)
uniform float u_sunAngularRadius; // Angular radius of the sun in radians (approx 0.00465 radians or 0.266 degrees)
uniform vec3 u_sunColor;
uniform float u_blueScatter;
uniform float u_redScatter;
uniform float u_greenScatter;
uniform float u_haloSize;
uniform int u_skyGradientQuality;
uniform int u_sunsetQuality; 
uniform float u_MIE;
uniform float ambientLightIntensity;
uniform float u_skyBrightnessBoost; 



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

struct Ray{
    vec3 origin;
    vec3 dir;
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

bool intersectAABB(Ray mainRay, vec3 boxMin, vec3 boxMax, out float tMin, out float tMax) {
    vec3 invDir = 1.0 / mainRay.dir;
    vec3 t0s = (boxMin - mainRay.origin) * invDir;
    vec3 t1s = (boxMax - mainRay.origin) * invDir;

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

vec3 rotateY(vec3 v, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(c * v.x - s * v.z, v.y, s * v.x + c * v.z);
}

// --- Intersection Function ---
// Returns true if hit, writes distance to 'dist' and fills 'result' struct
bool intersectGrassBlade(Ray mainRay,vec3 instancePos,float lean, float rotation, out float dist, out Triangle result) {
    // ------------------------------------
    
    // 1. TRANSFORM RAY TO LOCAL SPACE
    vec3 localOrigin = mainRay.origin - instancePos;
    vec3 localDir = mainRay.dir;
    float hitY = 0.0;

    // Inverse Rotation (Rotate by -rotation)
    localOrigin = rotateY(localOrigin, -rotation);
    localDir = rotateY(localDir, -rotation);

    // Inverse Shear (Undo the lean: x' = x - lean*y)
    localOrigin.x -= lean * localOrigin.y;
    localOrigin.z -= lean * localOrigin.y;
    localDir.x -= lean * localDir.y;
    localDir.z -= lean * localDir.y;

    float tClosest = 1e20;
    vec3 normalClosest = vec3(0.0);
    bool hitAny = false;
    
    float bladeHeight = 1.0;
    float baseWidth = 0.1; 
    
    // --- Test Plane A (Z-facing part) ---
    if (abs(localDir.z) > 1e-6) {
        float t = -localOrigin.z / localDir.z;
        if (t > 0.0) { // Removed t < tClosest check since it's the first check
            vec3 p = localOrigin + t * localDir;
            if (p.y >= 0.0 && p.y <= bladeHeight) {
                float currentWidth = baseWidth * (1.0 - (p.y / bladeHeight));
                if (abs(p.x) <= currentWidth) {
                    tClosest = t;
                    hitAny = true;
                    // Base normal (0,0,1) -> Sheared normal -> Rotated normal
                    // Sheared Plane Z: z - lean*y = 0. Normal is (0, -lean, 1)
                    normalClosest = normalize(vec3(0.0, -lean, 1.0));
                    hitY = p.y;
                    // Flip if hitting backface
                    if (dot(localDir, normalClosest) > 0.0) normalClosest = -normalClosest;
                }
            }
        }
    }

    // --- Test Plane B (X-facing part) ---
    if (abs(localDir.x) > 1e-6) {
        float t = -localOrigin.x / localDir.x;
        // Only update if this hit is closer than the previous one
        if (t > 0.0 && t < tClosest) {
            vec3 p = localOrigin + t * localDir;
            if (p.y >= 0.0 && p.y <= bladeHeight) {
                float currentWidth = baseWidth * (1.0 - (p.y / bladeHeight));
                if (abs(p.z) <= currentWidth) {
                    tClosest = t;
                    hitAny = true;
                    // Base normal (1,0,0) -> Sheared normal -> Rotated normal
                    // Sheared Plane X: x - lean*y = 0. Normal is (1, -lean, 0)
                    normalClosest = normalize(vec3(1.0, -lean, 0.0));
                    hitY = p.y;
                    if (dot(localDir, normalClosest) > 0.0) normalClosest = -normalClosest;
                }
            }
        }
    }

    if (!hitAny) {
        return false;
    }

    // Output 1: Distance
    dist = tClosest;

    // Output 2: Triangle Struct
    // Rotate the normal back to world space
    vec3 worldNormal = rotateY(normalClosest, rotation);
    
    // Fill required dummy data to prevent compilation errors/undefined behavior
    result.vertices = vec3[3](vec3(0.), vec3(0.), vec3(0.));
    result.types[1] = 0;
    result.types[2] = 0;
    result.min = vec3(0.);
    result.max = vec3(0.);
    result.center = vec3(0.);
    result.normals = vec3[3](vec3(0.), vec3(0.), vec3(0.));

    // Fill only the required fields
    result.types[0] = -1;       // As requested
    result.triNormal = worldNormal; // The calculated normal
    result.normals[0].x = hitY; //Height
    return true;
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
int traverseBVH(Ray mainRay, out vec3 closestBarycentric, out float minHitDistance, out Triangle hitTriangle) {
    int closestHitIndex = -1;
    minHitDistance = 1.0/0.0001; // Infinity

    int stack[BVH_DEPTH]; 
    int stackPtr = 0;
    stack[stackPtr++] = 0; // Push root node index

    while (stackPtr > 0) {
        int nodeIndex = stack[--stackPtr];
        BVH node = getBVH(nodeIndex);

        float tMin, tMax;
        if (!intersectAABB(mainRay, node.min, node.max, tMin, tMax)) {
            continue;
        }

        if (tMin >= minHitDistance) {
            continue;
        }

        if (node.left == -1) { // Leaf Node
            for (int j = 0; j < 4; j++) {
                int triIdx = node.triangles[j];
                if(triIdx <= -2 && grassEnabled){//gRaS
                    //Do cool stuff later
                    int thingI = triIdx*(-1)-2;
                    int grassInfoSize = 8;
                    vec3 minB = vec3(fetchFloatFrom1D(u_grassBB, thingI*grassInfoSize),fetchFloatFrom1D(u_grassBB, thingI*grassInfoSize+1),fetchFloatFrom1D(u_grassBB, thingI*grassInfoSize+2));
                    //vec3 max = vec3(fetchFloatFrom1D(u_grassBB, thingI*grassInfoSize+3),fetchFloatFrom1D(u_grassBB, thingI*grassInfoSize+4),fetchFloatFrom1D(u_grassBB, thingI*grassInfoSize+5));
                    float lean = fetchFloatFrom1D(u_grassBB, thingI*grassInfoSize+6);
                    float angle = fetchFloatFrom1D(u_grassBB, thingI*grassInfoSize+7);
                    //bool intersectGrassBlade(vec3 rayOrigin, vec3 rayDir,vec3 instancePos,float lean, float rotation, out float dist, out Triangle result) 
                    Triangle tri;
                    float hitDist;
                    bool val = intersectGrassBlade(mainRay, minB, lean, angle, hitDist, tri);
                    if(val && hitDist < minHitDistance){
                        minHitDistance = hitDist;
                        closestHitIndex = triIdx;
                        closestBarycentric = vec3(0.0);
                        hitTriangle= tri;
                    }
                    continue;
                }
                if (triIdx == -1) continue;

                Triangle tri = getTriangle(triIdx);
                vec3 currentBarycentric;
                float hitDist = intersectTriangle(mainRay.origin, mainRay.dir, tri, currentBarycentric);

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

// New optimized traversal for shadows: Returns TRUE immediately on any hit
bool traverseBVHShadow(Ray shadowRay, float maxDist) {
    int stack[BVH_DEPTH]; 
    int stackPtr = 0;
    stack[stackPtr++] = 0; // Push root node index

    while (stackPtr > 0) {
        int nodeIndex = stack[--stackPtr];
        BVH node = getBVH(nodeIndex);

        float tMin, tMax;
        if (!intersectAABB(shadowRay, node.min, node.max, tMin, tMax)) {
            continue;
        }

        // Optimization: If the AABB is further away than the light source, ignore it
        if (tMin >= maxDist) {
            continue;
        }

        if (node.left == -1) { // Leaf Node
            for (int j = 0; j < 4; j++) {
                int triIdx = node.triangles[j];
                
                // Grass Logic
                if(triIdx <= -2 && grassEnabled){
                    int thingI = triIdx*(-1)-2;
                    int grassInfoSize = 8;
                    vec3 minB = vec3(fetchFloatFrom1D(u_grassBB, thingI*grassInfoSize),fetchFloatFrom1D(u_grassBB, thingI*grassInfoSize+1),fetchFloatFrom1D(u_grassBB, thingI*grassInfoSize+2));
                    float lean = fetchFloatFrom1D(u_grassBB, thingI*grassInfoSize+6);
                    float angle = fetchFloatFrom1D(u_grassBB, thingI*grassInfoSize+7);
                    
                    Triangle dummyTri; // Not used, but required by function signature
                    float hitDist;
                    bool hit = intersectGrassBlade(shadowRay, minB, lean, angle, hitDist, dummyTri);
                    
                    // If we hit grass closer than the light, we are blocked
                    if(hit && hitDist > 0.001 && hitDist < maxDist){
                        return true;
                    }
                    continue;
                }

                if (triIdx == -1) continue;

                Triangle tri = getTriangle(triIdx);
                vec3 dummyBary;
                float hitDist = intersectTriangle(shadowRay.origin, shadowRay.dir, tri, dummyBary);

                // If we hit geometry closer than the light, we are blocked
                if (hitDist > 0.001 && hitDist < maxDist) {
                    return true;
                }
            }
        } else { // Internal Node
            if (stackPtr < BVH_DEPTH-1) { 
                stack[stackPtr++] = node.left;
                stack[stackPtr++] = node.right;
            }
        }
    }

    return false; // No occlusion found
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

// --- PBR Helper Functions ---

// 1. Fresnel Schlick
// cosTheta is dot(H, V)
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// 2. Distribution GGX (Trowbridge-Reitz)
float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float num = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return num / denom;
}

// 3. Geometry Schlick-GGX (Smith method)
float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0; // Use k = a^2 / 2 for IBL, but (r+1)^2 / 8 for direct light path tracing

    float num = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return num / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

// 4. GGX Importance Sampling
// Returns a Half-vector (H) based on roughness
vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
    float a = roughness * roughness;
    
    float phi = 2.0 * PI * Xi.x;
    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
    float sinTheta = sqrt(1.0 - cosTheta*cosTheta);
    
    // Spherical to Cartesian (Tangent space)
    vec3 H;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;
    
    // Tangent to World space
    vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up, N));
    vec3 bitangent = cross(N, tangent);
    
    vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
    return normalize(sampleVec);
}

// Evaluate Both Specular and Diffuse for Direct Light (NEE)
// This calculates how much light reflects from the sun to the camera
vec3 EvalUnifiedBRDF(vec3 N, vec3 V, vec3 L, float roughness, vec3 F0, vec3 albedo, float metallic) {
    vec3 H = normalize(V + L);
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float HdotV = max(dot(H, V), 0.0);
    
    if (NdotL <= 0.0 || NdotV <= 0.0) return vec3(0.0);

    // 1. Specular Term (Cook-Torrance)
    float D = DistributionGGX(N, H, roughness);
    float G = GeometrySmith(N, V, L, roughness);
    vec3 F = fresnelSchlick(HdotV, F0);
    
    vec3 kS = F; // Specular contribution
    vec3 kD = vec3(1.0) - kS; // Remaining energy for diffuse
    kD *= (1.0 - metallic);   // Metals have 0 diffuse

    vec3 specular = (D * G * F) / (4.0 * NdotV * NdotL + 0.0001);
    vec3 diffuse = albedo / PI; //regular lambertian diffuse
    
    return kD * diffuse + specular; 
}

//Get sky color. AI generated
vec3 getSkyColor(vec3 rayDir, vec3 sunDir) {
    // -------------------------------------
    // Constants
    // -------------------------------------
    const float RE = 6360e3;          // Earth Radius (meters)
    const float RA = 6420e3;          // Atmosphere Radius (meters)
    const float HR = 8000.0;          // Rayleigh Scale Height
    const float HM = 1200.0;          // Mie Scale Height
    float G_MIE = u_haloSize;         // Mie Anisotropy
    


    vec3 BETA_R = vec3(u_redScatter, u_greenScatter, u_blueScatter) * 0.001; 
    vec3 BETA_M = vec3(u_MIE * 0.001);                 

    float SUN_INTENSITY = u_sunIntensity; 
    int STEPS_PRIMARY = u_skyGradientQuality;   
    int STEPS_LIGHT = u_sunsetQuality;       

    // -------------------------------------
    // Setup Geometry
    // -------------------------------------
    Light atmosphere;
    atmosphere.position = vec3(0.0);
    atmosphere.radius = RA;

    vec3 camPos = vec3(0.0, RE + u_cameraPos.y, 0.0); 
    vec3 dummyNormal; 

    // Calculate distance to leave the atmosphere
    float distToTop = intersectLight(camPos, rayDir, atmosphere, dummyNormal);
    
    // If we look down and don't hit the atmosphere cap (or hit ground logic),
    // we initialize with White instead of Black.
    if (distToTop < 0.0) return vec3(1.0); 

    // -------------------------------------
    // Raymarching
    // -------------------------------------
    float stepSize = distToTop / float(STEPS_PRIMARY);
    vec3 currentPos = camPos;
    
    vec3 totalR = vec3(0.0); 
    vec3 totalM = vec3(0.0); 
    float optDepthR = 0.0;
    float optDepthM = 0.0;
    
    float mu = dot(rayDir, sunDir);
    float phaseR = 3.0 / (16.0 * PI) * (1.0 + mu * mu);
    float g = G_MIE; float g2 = g * g;
    float phaseM = 3.0 / (8.0 * PI) * ((1.0 - g2) * (1.0 + mu * mu)) / 
                   ((2.0 + g2) * pow(1.0 + g2 - 2.0 * g * mu, 1.5));

    for (int i = 0; i < STEPS_PRIMARY; ++i) {
        vec3 samplePos = currentPos + rayDir * (stepSize * 0.5);
        float height = length(samplePos) - RE;
        
        if (height < 0.0) height = 0.0;

        float hr = exp(-height / HR) * stepSize;
        float hm = exp(-height / HM) * stepSize;
        
        optDepthR += hr;
        optDepthM += hm;
        
        float distToSun = intersectLight(samplePos, sunDir, atmosphere, dummyNormal);
        float stepSizeSun = distToSun / float(STEPS_LIGHT);
        float sunDepthR = 0.0;
        float sunDepthM = 0.0;
        vec3 sunPos = samplePos;
        
        for (int j = 0; j < STEPS_LIGHT; ++j) {
            vec3 sPos = sunPos + sunDir * (stepSizeSun * 0.5);
            float h = length(sPos) - RE;
            if (h < 0.0) h = 0.0;
            
            sunDepthR += exp(-h / HR) * stepSizeSun;
            sunDepthM += exp(-h / HM) * stepSizeSun;
            sunPos += sunDir * stepSizeSun;
        }
        
        vec3 tau = BETA_R * (optDepthR + sunDepthR) + BETA_M * 1.1 * (optDepthM + sunDepthM);
        vec3 attenuation = exp(-tau);
        
        totalR += hr * attenuation;
        totalM += hm * attenuation;
        
        currentPos += rayDir * stepSize;
    }
    
    // -------------------------------------
    // Final Color Calculation
    // -------------------------------------
    vec3 skyColor = SUN_INTENSITY * (totalR * BETA_R * phaseR + totalM * BETA_M * phaseM);
    
    // Apply Brightness
    skyColor *= u_skyBrightnessBoost;

    // --- [CHANGE #2 PART B] Smooth Horizon Blend ---
    // Instead of a sharp cut, we mix the calculated sky with a white color
    // based on how far the ray is looking down. 
    // -0.1 to 0.1 creates a small foggy blur at the horizon line.
    // If rayDir.y is very negative (looking down), blendingFactor becomes 0.0 (All white).
    
    vec3 groundColor = vec3(1.0); // White
    float horizonBlend = smoothstep(-0.05, 0.05, rayDir.y);
    
    return mix(groundColor, skyColor, horizonBlend);
}
vec3 shootShadowRay(Ray mainRay, vec3 BRDF, vec3 smoothNormal, inout uint rng_state){
    vec3 directLight = vec3(0.0);
    bool autoNormal = false;
    if(length(smoothNormal) == 0.0){
        autoNormal = true;
    }
    if(numActiveLights == 0){
        return vec3(0.0);
    }
    
    int i = int(rand(rng_state)*float(numActiveLights));
    Light light = lights[i]; 
    rng_state = hash(rng_state);
    
    // choose a point on the light sphere
    float r1 = (rand(rng_state)-0.5)*2.0;
    float r2 = (rand(rng_state)-0.5)*2.0;
    float r3 = (rand(rng_state)-0.5)*2.0;
    vec3 jitter = normalize(vec3(r1,r2,r3)) * light.radius;
    vec3 lightPoint = light.position + jitter;

    vec3 lightDir = normalize(lightPoint - mainRay.origin);
    float lightDistance = length(lightPoint - mainRay.origin);

    if(autoNormal){
        smoothNormal = lightDir;
    }

    Ray shadowRay;
    shadowRay.origin = mainRay.origin;
    shadowRay.dir = lightDir;

    // Fast Shadow Check
    bool blocked = traverseBVHShadow(shadowRay, lightDistance);

    if(!blocked){
        float P = 1.0/(lightDistance*lightDistance);
        float NdotL = max(dot(smoothNormal, lightDir), 0.0);
        directLight += BRDF * light.color * light.intensity * NdotL * P * PI * light.radius * light.radius;
    }
    return directLight;
}

vec3 sampleSunLight(Ray mainRay, vec3 BRDF, vec3 smoothNormal, inout uint rng_state) {
    vec3 sunAxis = -u_sunDirection; 

    vec3 lightDir = sampleCone(sunAxis, u_sunAngularRadius, rng_state);

    if(length(smoothNormal) == 0.0){
        smoothNormal = lightDir;
    }
    float NdotL = max(dot(smoothNormal, lightDir), 0.0);
    if (NdotL <= 0.0) {
        return vec3(0.0);
    }
    
    Ray shadowRay;
    shadowRay.origin = mainRay.origin;
    shadowRay.dir = lightDir;

    // Fast Shadow Check (Max distance is effectively infinite for sun)
    bool blocked = traverseBVHShadow(shadowRay, 1e20);

    if (!blocked) {
        // Ray is not blocked, calculate light contribution
        // --- Light Contribution (Radiance) ---
        // float cos_alpha = cos(u_sunAngularRadius);
        // float solidAngle = 2.0 * PI * (1.0 - cos_alpha);
        // float PDF = 1.0 / solidAngle; 
        // L_i = BRDF * NdotL / PDF * Radiance
        // Radiance (L_e) = Intensity / SolidAngle
        // L_i = BRDF * NdotL / PDF * (u_sunIntensity / solidAngle) 
        // L_i = BRDF * NdotL * (1 / PDF) * (u_sunIntensity / solidAngle)
        // Since (1/PDF) = solidAngle, the solidAngle terms cancel out perfectly:
        vec3 directLight = BRDF * u_sunColor * u_sunIntensity * NdotL;
        return directLight;
    }
    
    return vec3(0.0);
}

void main() {
    uint rng_state;
    
    Ray currentRay;
    vec3 throughput;
    vec3 accumulatedRadiance;
    bool prevWasSpecular = true; // Bounce 0 is always "specular" (cam sees lights)

    if(u_currentBounce == 0){
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
        Ray mainRay;
        mainRay.origin = u_cameraPos;
        mainRay.dir = normalize(rayWorld.xyz - u_cameraPos);

        currentRay = mainRay;
        throughput = vec3(1.0);
        accumulatedRadiance = vec3(0.0); 
    }else{
        vec4 posData = texture(u_posTex, v_uv);
        vec4 dirData = texture(u_dirTex, v_uv);
        vec4 thruData = texture(u_throughputTex, v_uv);
        vec4 radData = texture(u_radianceTex, v_uv);
        
        // If ray hit sky previously or terminated, just pass data through and return
        if (thruData.a < 0.0) { 
             out_position = posData;
             out_direction = dirData;
             out_throughput = thruData;
             out_radiance = radData;
             return;
        }

        currentRay.origin = posData.rgb;
        currentRay.dir = dirData.rgb;
        rng_state = floatBitsToUint(posData.a); // Restore RNG
        throughput = thruData.rgb;
        accumulatedRadiance = radData.rgb;
        //If dirData.a is 1.0, previous bounce specular
        prevWasSpecular = (dirData.a > 0.5);
    }

    vec3 UP_VECTOR = vec3(0.0, 1.0, 0.0);
    float COS_ZENITH = dot(-u_sunDirection, UP_VECTOR);
    float ZENITH_ANGLE = acos(COS_ZENITH) * 57.2958; //converted to degrees
    float AIR_MASS = 1.0 / (COS_ZENITH + 0.15 * pow(93.885 - ZENITH_ANGLE, -1.253));
    AIR_MASS = clamp(AIR_MASS, 1.0, 50.0);
    vec3 BETA_EXTINCTION = vec3(u_redScatter, u_greenScatter, u_blueScatter)*0.001; 
    vec3 SUN_TRANSMISSION = exp(-AIR_MASS * BETA_EXTINCTION);

    //Intersection
    vec3 baryCentric;
    float minHitDistance;
    Triangle tri;
    int triIndex = traverseBVH(currentRay, baryCentric, minHitDistance,tri);
    
    //Check if hit light  
    int hitLightIndex = -1;
    for (int i = 0; i < numActiveLights; i++) {
        vec3 lightHitNormal;
        float lightHitDistance = intersectLight(currentRay.origin, currentRay.dir, lights[i], lightHitNormal);
        if (lightHitDistance > 0.0 && lightHitDistance < minHitDistance) {
            hitLightIndex = i;
            minHitDistance = lightHitDistance;
        }
    }
    if (hitLightIndex != -1) {
        // Ray hit light source
        if(prevWasSpecular){
            // Directly visible light or after mirror/glossy
            accumulatedRadiance += throughput * lights[hitLightIndex].color * lights[hitLightIndex].intensity;
        }
        //Note, now that we have an NEE we do not need to factor in light hit after the first bounce.
        // Path terminates.
        out_radiance = vec4(accumulatedRadiance,1.0);
        out_throughput = vec4(throughput,-1.0);
        return;
    }

    //check if hit sky
    if(triIndex == -1){
        vec3 atmosphereColor = getSkyColor(currentRay.dir, -u_sunDirection);

        vec3 sunDirToScene = -u_sunDirection; // Direction from scene TO the sun
        float cosAngle = dot(currentRay.dir, sunDirToScene);
        
        // The angular radius is very small, so we use its cosine
        float cosAngularRadius = cos(u_sunAngularRadius);
        
        // If the angle between the ray and the center of the sun is less than the angular radius, 
        // the ray hit the visible sun disk.
        bool hitSunDisk = (cosAngle >= cosAngularRadius);

        vec3 finalSky = atmosphereColor;
        // Ray missed everything and flew into space (Sky).
        if (hitSunDisk) {
            // Ray hit the visible Sun disk
            finalSky += u_sunColor * u_sunIntensity *SUN_TRANSMISSION; 
        }

        // Apply clouds and final color
        if(prevWasSpecular){
            accumulatedRadiance += throughput * finalSky;
        }
        accumulatedRadiance += finalSky*ambientLightIntensity;

        //kill the ray
        out_radiance = vec4(accumulatedRadiance,1.0);
        out_throughput = vec4(throughput,-1.0);
        return;
    }

    //Hit Geometry
    // The ray hit a triangle 
    //Get information
    vec3 hitPoint = currentRay.origin + currentRay.dir * minHitDistance;

    bool isGrassBlade = false;
    if(tri.types[0] == -1){
        isGrassBlade = true; 
    }
    TerrainType t1;//getTerrainType(tri.types[0]);
    TerrainType t2;
    TerrainType t3;
    if(!isGrassBlade){
        t1 = Terrains[tri.types[0]];//getTerrainType(tri.types[0]);
        t2 = Terrains[tri.types[1]];
        t3 = Terrains[tri.types[2]];
    }

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
    if(!isGrassBlade){
        getInfo(tri, t1, t2, t3, baryCentric, smoothNormal, matColor, matRoughness, reflectiveness);
    }

    vec3 geometricNormal = tri.triNormal;
    bool didSwitch = false;
    if (dot(geometricNormal, currentRay.dir) > 0.0) geometricNormal = -geometricNormal; //"same direction"
    if(!isGrassBlade){
        if (dot(smoothNormal, geometricNormal) < 0.0) {
            smoothNormal = -smoothNormal;
            didSwitch = true;
        } //If pointing in opposite directions, flip
    }

    // Create the next bounce ray
    if(isGrassBlade){
        //Do something cool 
        //pretend diffuse for now
        type = 1;
        smoothNormal = tri.triNormal;
        matColor =  mix(grassBaseColor,grassTipColor, tri.normals[0].x);
    }

    vec3 nextDir;
    bool nextIsSpecular = false;
    if(type != 4) //Transmission goes through
        currentRay.origin = hitPoint + geometricNormal * 0.1;
    if(type == 1){ //Diffuse
        //direct lighting
        vec3 directLight = vec3(0.0);
        vec3 BRDF = matColor / PI;
        directLight = sampleSunLight(currentRay,BRDF, smoothNormal, rng_state) + shootShadowRay(currentRay, BRDF, smoothNormal, rng_state);
        
        nextDir = weightedDIR(smoothNormal, rng_state);
        float cos_theta = dot(nextDir,smoothNormal);
        float p = 0.5*PI;
        throughput *= BRDF*cos_theta/p;
        accumulatedRadiance += throughput * directLight;

        nextIsSpecular = false; 
    }else if (type == 2) { // Specular (mirror)
        vec3 useNormal = smoothNormal;
        if (dot(useNormal, currentRay.dir) > 0.0) useNormal = -useNormal; //"same direction"
        vec3 perfect = normalize(reflect(currentRay.dir, useNormal));
        nextDir = perfect;
        throughput *= vec3(0.9); // decrease brightness a bit
        nextIsSpecular = true;
    }else if (type == 3){ //Microfacet (Glossy), mixture of diffuse and specular
        vec3 useNormal = smoothNormal;
        vec3 backDir = -currentRay.dir;
        if(dot(useNormal, currentRay.dir) > 0.0) useNormal = -useNormal; //"same direction"
        float metallic = clamp(reflectiveness, 0.0, 1.0);
        float roughness = clamp(matRoughness, 0.001, 1.0);
        float alpha = roughness * roughness;
        vec3 F0 = mix(vec3(0.04), matColor, metallic);
        vec3 albedo = matColor * (1.0 - metallic);

        //Direct Lighting
        vec3 L_sun = -u_sunDirection;
        vec3 brdf = EvalUnifiedBRDF(useNormal, backDir, L_sun, alpha, F0, albedo, metallic);
        vec3 directLight = sampleSunLight(currentRay, brdf, useNormal, rng_state) + shootShadowRay(currentRay, brdf, useNormal, rng_state);
        accumulatedRadiance += throughput * directLight;

        //Indirect lighting
        float F_view = fresnelSchlick(max(dot(useNormal, backDir), 0.0), F0).g; // use green channel as estimate
        float specProb = mix(F_view, 1.0, metallic);
        specProb = clamp(specProb, 0.05, 0.95); // Prevent divide by zero

        float r_val = rand(rng_state);

        if(r_val < specProb){ //Specular bounce
            vec2 Xi = vec2(rand(rng_state), rand(rng_state));
            vec3 H = ImportanceSampleGGX(Xi, useNormal, alpha);
            vec3 L = normalize(reflect(-backDir, H));

            float NdotL = dot(useNormal, L);
            float NdotH = dot(useNormal, H);
            float VdotH = dot(backDir, H);
            float NdotV = dot(useNormal, backDir);

            if (NdotL > 0.0 && VdotH > 0.0) {
                vec3 F = fresnelSchlick(VdotH, F0);
                float G = GeometrySmith(useNormal, backDir, L, alpha);
                
                // The Weight for GGX Importance Sampling:
                // Weight = (F * G * VdotH) / (NdotV * NdotH * specProb)
                vec3 weight = (F * G * VdotH) / (NdotV * NdotH + 0.0001);
                
                throughput *= weight / specProb;
                nextDir = L;
                nextIsSpecular = true;
            }
        }else{
            //regular diffuse
            vec3 L = weightedDIR(useNormal, rng_state);
            vec3 kS = fresnelSchlick(max(dot(useNormal, L), 0.0), F0);
            vec3 kD = (vec3(1.0) - kS) * (1.0 - metallic);
            
            throughput *= (kD * albedo) / (1.0 - specProb);
            nextDir = L;
            nextIsSpecular = false;
        }
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
        vec3 refracted = refract(currentRay.dir, transmissionNormal, eta);
        if (length(refracted) < 0.001) {
            // TIR: fall back to mirror reflection
            vec3 useNormal = smoothNormal;
            if (dot(useNormal, currentRay.dir) > 0.0) useNormal = -useNormal; //"same direction"
            nextDir = normalize(reflect(currentRay.dir, useNormal));
            currentRay.origin = hitPoint + geometricNormal * 0.01;
        } else {
            //Do microfacet
            vec3 useNormal = smoothNormal;
            if (dot(useNormal, currentRay.dir) > 0.0) useNormal = -useNormal; //"same direction"
            nextDir = sampleGlossyDirection(normalize(refracted), matRoughness, rng_state);

            currentRay.origin = hitPoint - geometricNormal * 0.01;
        }
        nextIsSpecular = true; // Transmission is not a mirror, but we still track the last bounce
        vec3 absorption = -log(matColor)*0.1;  // if matColor is tint
        throughput *= exp(-absorption * (minHitDistance)); //Beer Lambert law
    }else if (type == 5){ // Emissive
        accumulatedRadiance += throughput * matColor;
        out_radiance = vec4(accumulatedRadiance,1.0);
        out_throughput = vec4(throughput,-1.0);
        return;
    }
    
    // Pass the "nextIsSpecular" flag to the next frame via Alpha channel
    out_direction = vec4(nextDir, nextIsSpecular ? 1.0 : 0.0);
    
    out_position = vec4(currentRay.origin, uintBitsToFloat(rng_state));
    out_throughput = vec4(throughput, 1.0); // Still alive
    out_radiance = vec4(accumulatedRadiance, 1.0);
}