export const pathTracingVertexShaderCode = /* glsl */ `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
out vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5; // map [-1, 1] → [0, 1]
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;
export const pathTracingFragmentShaderCode = /* glsl */ `#version 300 es
precision highp float;

#define MAX_LIGHTS 30
#define PI 3.1415926

//Note: 
uniform sampler2D u_lastFrame;
uniform float u_frameNumber;
uniform int numBounces;


uniform sampler2D u_vertices;
uniform sampler2D u_terrains;
uniform sampler2D u_normals;
uniform sampler2D u_boundingBox;
uniform sampler2D u_nodesTex;
uniform sampler2D u_leafsTex;
uniform sampler2D u_terrainTypes;
uniform vec3 u_cameraPos;
uniform mat4 u_invViewProjMatrix;
uniform vec2 u_resolution;

struct Light {
    vec3 position;
    vec3 color;
    float intensity;
    float radius;
};
uniform Light lights[MAX_LIGHTS];
uniform int numActiveLights;

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
};

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

    vec4 texel = texture(tex, vec2(u, v));

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
    int terrainTypeSize = 5;
    t.color = vec3(fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize), fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+1), fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+2));
    t.reflectiveness = fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+3); 
    t.roughness = fetchFloatFrom1D(u_terrainTypes, i*terrainTypeSize+4); 

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
int traverseBVH(vec3 rayOrigin, vec3 rayDir, int BVHindex, out vec3 closestBarycentric, out float minHitDistance) {
    int closestHitIndex = -1;
    minHitDistance = 1.0/0.0; // Infinity

    int stack[64]; // Stack of 64 - May need to change for larger BVH later
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
                }
            }
        } else { // Internal Node
            // Check for space for two children to prevent stack overflow
            if (stackPtr < 63) { 
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

void getInfo(Triangle tri, vec3 baryCentric, out vec3 smoothNormal, out vec3 matColor, out float matRoughness){
    vec3[3] colors = vec3[3](
        getTerrainType(tri.types[0]).color,
        getTerrainType(tri.types[1]).color,
        getTerrainType(tri.types[2]).color
    );
    float[3] reflectivities = float[3](
        getTerrainType(tri.types[0]).reflectiveness,
        getTerrainType(tri.types[1]).reflectiveness,
        getTerrainType(tri.types[2]).reflectiveness
    );
    float[3] roughness = float[3](
        getTerrainType(tri.types[0]).roughness,
        getTerrainType(tri.types[1]).roughness,
        getTerrainType(tri.types[2]).roughness
    );

    smoothNormal = normalize(smoothItem(tri.normals,baryCentric));
    matColor = smoothItem(colors,baryCentric);
    matRoughness = smoothItem(roughness,baryCentric);
}

/**
Return random direction based on normal via cosine
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

vec3 PathTrace(vec3 OGrayOrigin, vec3 OGrayDir, inout uint rng_state) {
    vec3 rayOrigin = OGrayOrigin;
    vec3 rayDir = OGrayDir;

    vec3 color = vec3(0.0);
    vec3 throughput = vec3(1.0);

    for (int bounce = 0; bounce < numBounces; bounce++) {
        vec3 baryCentric;
        float minHitDistance;
        
        int triIndex = traverseBVH(rayOrigin, rayDir, 0, baryCentric, minHitDistance);
        
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
            color += throughput * lights[hitLightIndex].color * lights[hitLightIndex].intensity;
            break; // Path terminates.
        }

        if (triIndex == -1) {
            // Ray missed everything and flew into space.
            color += throughput * 0.00001; // light sky!
            break;
        }

        // The ray hit a triangle 
        //Get information
        vec3 hitPoint = rayOrigin + rayDir * minHitDistance;
        Triangle tri = getTriangle(triIndex);
        intersectTriangle(rayOrigin, rayDir, tri, baryCentric);

        vec3 smoothNormal, matColor;
        float matRoughness;
        getInfo(tri, baryCentric, smoothNormal, matColor, matRoughness);
        
        vec3 geometricNormal = tri.triNormal;
        if (dot(geometricNormal, rayDir) > 0.0) geometricNormal = -geometricNormal;
        if (dot(smoothNormal, geometricNormal) < 0.0) smoothNormal = -smoothNormal;

        vec3 BRDF = matColor / PI;
        
        
        // NEXT EVENT ESTIMATION (Direct Lighting)
        if (numActiveLights > 0) {
            Light directSampledLight = lights[0];
            vec3 toLight = directSampledLight.position - hitPoint;
            float distToLightSqr = dot(toLight, toLight);
            float distToLight = sqrt(distToLightSqr);
            vec3 shadowRayDir = toLight / distToLight;
            vec3 shadowRayOrigin = hitPoint + geometricNormal * 0.01;
            
            vec3 dummyBary;
            float meshHitDist;
            int occludingTri = traverseBVH(shadowRayOrigin, shadowRayDir, 0, dummyBary, meshHitDist);
            
            if (occludingTri == -1 || meshHitDist >= distToLight) {
                // The light is visible.
                float cos_theta = max(0.0, dot(smoothNormal, shadowRayDir));
                
                vec3 directLighting = directSampledLight.color * directSampledLight.intensity * BRDF * cos_theta / max(distToLightSqr, 0.001);
                color += throughput * directLighting;
            }
        }
        
        // INDIRECT LIGHTING (Prepare for the NEXT bounce)
        // Create the next bounce ray
        rayOrigin = hitPoint + geometricNormal * 0.01;
        rayDir = weightedDIR(smoothNormal, rng_state);
        //Add to throughput
        float PDF = dot(rayDir,smoothNormal) / PI;
        throughput *= BRDF * dot(rayDir,smoothNormal)/PDF;
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

    vec3 lastSum = texture(u_lastFrame, v_uv).rgb; //Old color
    vec3 newSampleColor = PathTrace(rayOrigin, rayDir, rng_state); // Sample Color
    vec3 newSum = lastSum + newSampleColor; // New sum

    fragColor = vec4(newSum,1.0); 
}
`;
