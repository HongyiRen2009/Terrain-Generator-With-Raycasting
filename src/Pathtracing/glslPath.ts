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
//#define NUM_TERRAINS 1000 

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

uniform ivec2 u_verticesTexSize;
uniform ivec2 u_normalsTexSize;
uniform ivec2 u_boundingBoxTexSize;
uniform ivec2 u_nodesTexSize;
uniform ivec2 u_leafsTexSize;
uniform ivec2 u_terrainTypesTexSize;
uniform ivec2 u_terrainsTexSize;

struct Light {
    vec3 position;
    vec3 color;
    vec3 showColor;
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
    int type; //Type. See terrains.ts
};

//TerrainType[NUM_TERRAINS] Terrains;

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

float fetchFloatFrom1D(sampler2D tex, ivec2 texSize, int index) {
    int texWidth = texSize.x;
    
    int texelIndex = index / 4;      // Which texel (pixel) contains our float
    int componentIndex = index & 3;  // Which component (r,g,b,a) of the texel. index & 3 is equivalent to index % 4

    // Calculate 2D coordinates of the texel
    int y_coord = texelIndex / texWidth;
    int x_coord = texelIndex % texWidth;

    // Convert to UV coordinates [0, 1] for sampling
    // Add 0.5 to sample the center of the texel
    float u = (float(x_coord) + 0.5) / float(texWidth);
    float v = (float(y_coord) + 0.5) / float(texSize.y);

    vec4 texel = texture(tex, vec2(u, v));

    if (componentIndex == 0) return texel.r;
    else if (componentIndex == 1) return texel.g;
    else if (componentIndex == 2) return texel.b;
    else return texel.a;
}

BVH getBVH(int i){
    BVH r;
    int bbBoxSize = 6;
    r.min = vec3(fetchFloatFrom1D(u_boundingBox, u_boundingBoxTexSize, i*bbBoxSize),fetchFloatFrom1D(u_boundingBox, u_boundingBoxTexSize, i*bbBoxSize+1),fetchFloatFrom1D(u_boundingBox, u_boundingBoxTexSize, i*bbBoxSize+2));
    r.max = vec3(fetchFloatFrom1D(u_boundingBox, u_boundingBoxTexSize, i*bbBoxSize+3),fetchFloatFrom1D(u_boundingBox, u_boundingBoxTexSize, i*bbBoxSize+4),fetchFloatFrom1D(u_boundingBox, u_boundingBoxTexSize, i*bbBoxSize+5));

    int nodeSize = 2;
    r.left = int(fetchFloatFrom1D(u_nodesTex, u_nodesTexSize,i*nodeSize));
    r.right = int(fetchFloatFrom1D(u_nodesTex, u_nodesTexSize,i*nodeSize+1));

    int leafSize = 4;
    r.triangles[0]=int(fetchFloatFrom1D(u_leafsTex, u_leafsTexSize,i*leafSize));
    r.triangles[1]=int(fetchFloatFrom1D(u_leafsTex, u_leafsTexSize,i*leafSize+1));
    r.triangles[2]=int(fetchFloatFrom1D(u_leafsTex, u_leafsTexSize,i*leafSize+2));
    r.triangles[3]=int(fetchFloatFrom1D(u_leafsTex, u_leafsTexSize,i*leafSize+3));
    
    return r;
}

Triangle getTriangle(int i){
    Triangle tri;
    int triVertexSize = 9;
    tri.vertices[0] = vec3(fetchFloatFrom1D(u_vertices, u_verticesTexSize, i*triVertexSize), fetchFloatFrom1D(u_vertices, u_verticesTexSize, i*triVertexSize+1), fetchFloatFrom1D(u_vertices, u_verticesTexSize, i*triVertexSize+2));
    tri.vertices[1] = vec3(fetchFloatFrom1D(u_vertices, u_verticesTexSize, i*triVertexSize+3), fetchFloatFrom1D(u_vertices, u_verticesTexSize, i*triVertexSize+4), fetchFloatFrom1D(u_vertices, u_verticesTexSize, i*triVertexSize+5));
    tri.vertices[2] = vec3(fetchFloatFrom1D(u_vertices, u_verticesTexSize, i*triVertexSize+6), fetchFloatFrom1D(u_vertices, u_verticesTexSize, i*triVertexSize+7), fetchFloatFrom1D(u_vertices, u_verticesTexSize, i*triVertexSize+8));

    int typeSize = 3;
    tri.types[0] = int(fetchFloatFrom1D(u_terrains, u_terrainsTexSize, i*typeSize));
    tri.types[1] = int(fetchFloatFrom1D(u_terrains, u_terrainsTexSize, i*typeSize+1));
    tri.types[2] = int(fetchFloatFrom1D(u_terrains, u_terrainsTexSize, i*typeSize+2));

    tri.min = vec3(min(tri.vertices[0].x, min(tri.vertices[1].x, tri.vertices[2].x)),
                   min(tri.vertices[0].y, min(tri.vertices[1].y, tri.vertices[2].y)),
                   min(tri.vertices[0].z, min(tri.vertices[1].z, tri.vertices[2].z)));
    tri.max = vec3(max(tri.vertices[0].x, max(tri.vertices[1].x, tri.vertices[2].x)),
                   max(tri.vertices[0].y, max(tri.vertices[1].y, tri.vertices[2].y)),
                   max(tri.vertices[0].z, max(tri.vertices[1].z, tri.vertices[2].z)));
    tri.center = (tri.min + tri.max) * 0.5;
    tri.triNormal = normalize(cross(tri.vertices[1] - tri.vertices[0], tri.vertices[2] - tri.vertices[0]));

    tri.normals[0] = vec3(fetchFloatFrom1D(u_normals, u_normalsTexSize, i*triVertexSize), fetchFloatFrom1D(u_normals, u_normalsTexSize, i*triVertexSize+1), fetchFloatFrom1D(u_normals, u_normalsTexSize, i*triVertexSize+2));
    tri.normals[1] = vec3(fetchFloatFrom1D(u_normals, u_normalsTexSize, i*triVertexSize+3), fetchFloatFrom1D(u_normals, u_normalsTexSize, i*triVertexSize+4), fetchFloatFrom1D(u_normals, u_normalsTexSize, i*triVertexSize+5));
    tri.normals[2] = vec3(fetchFloatFrom1D(u_normals, u_normalsTexSize, i*triVertexSize+6), fetchFloatFrom1D(u_normals, u_normalsTexSize, i*triVertexSize+7), fetchFloatFrom1D(u_normals, u_normalsTexSize, i*triVertexSize+8));

    return tri;
}

TerrainType getTerrainType(int i){
    TerrainType t;
    int terrainTypeSize = 6;
    t.color = vec3(fetchFloatFrom1D(u_terrainTypes, u_terrainTypesTexSize, i*terrainTypeSize), fetchFloatFrom1D(u_terrainTypes, u_terrainTypesTexSize, i*terrainTypeSize+1), fetchFloatFrom1D(u_terrainTypes, u_terrainTypesTexSize, i*terrainTypeSize+2));
    t.reflectiveness = fetchFloatFrom1D(u_terrainTypes, u_terrainTypesTexSize, i*terrainTypeSize+3); 
    t.roughness = fetchFloatFrom1D(u_terrainTypes, u_terrainTypesTexSize, i*terrainTypeSize+4); 
    t.type = int(fetchFloatFrom1D(u_terrainTypes, u_terrainTypesTexSize, i*terrainTypeSize+5));

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

bool isValidVec3(vec3 v) {
    return all(greaterThanEqual(v, vec3(-1e20))) &&
           all(lessThanEqual(v, vec3(1e20))) &&
           !any(isnan(v));
}

vec3 PathTrace(vec3 OGrayOrigin, vec3 OGrayDir, inout uint rng_state) {
    vec3 rayOrigin = OGrayOrigin;
    vec3 rayDir = OGrayDir;

    vec3 color = vec3(0.0);
    vec3 throughput = vec3(1.0);

    int hasMirror = -2;
    for (int bounce = 0; bounce < numBounces; bounce++) {
        vec3 baryCentric;
        float minHitDistance;
        vec3 directLight = vec3(1.0);

        
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
            if(bounce != 0){
                color += throughput * lights[hitLightIndex].color * lights[hitLightIndex].intensity;
            }else{
                color = lights[hitLightIndex].showColor;
            }
            
            break; // Path terminates.
        }

        if (triIndex == -1) {
            // Ray missed everything and flew into space.
            if(bounce == 0 || bounce == hasMirror + 1){
                color = throughput * vec3(0.54,0.824,0.94);
            }else{
                color += throughput * 1.0/(float(1000*bounce)); // light sky!
            }
            break;
        }

        // The ray hit a triangle 
        //Get information
        vec3 hitPoint = rayOrigin + rayDir * minHitDistance;
        Triangle tri = getTriangle(triIndex);

        TerrainType t1 = getTerrainType(tri.types[0]);
        TerrainType t2 = getTerrainType(tri.types[1]);
        TerrainType t3 = getTerrainType(tri.types[2]);

        vec3 smoothNormal, matColor;
        float matRoughness, reflectiveness;
        int type = -1;
        type = getTerrainType(tri.types[0]).type;
        getInfo(tri, t1, t2, t3, baryCentric, smoothNormal, matColor, matRoughness, reflectiveness);
        

        vec3 geometricNormal = tri.triNormal;
        bool didSwitch = false;
        if (dot(geometricNormal, rayDir) > 0.0) geometricNormal = -geometricNormal;
        if (dot(smoothNormal, geometricNormal) < 0.0) {
            smoothNormal = -smoothNormal;
            didSwitch = true;
        }

        vec3 BRDF = matColor / PI;
        
        // Direct Lighting (Next Event Estimation)
        //for now let's do one light sample per bounce
        //https://www.youtube.com/watch?v=FU1dbi827LY
        //https://www.cg.tuwien.ac.at/sites/default/files/course/4411/attachments/08_next%20event%20estimation.pdf
        if(type == 1){ //Diffuse only
            //int lightToSample = int(floor(rand(rng_state) * float(numActiveLights)));
            //lightToSample = clamp(lightToSample, 0, numActiveLights - 1);
            Light light = lights[0];
            
            vec3 toLight = light.position - hitPoint;
            float distToLight = length(toLight);
            toLight = normalize(toLight);
            // Shadow ray
            vec3 shadowRayOrigin = hitPoint + geometricNormal * 0.01;
            vec3 shadowRayDir = toLight;
            
            vec3 shadowBarycentric;
            float shadowHitDistance;
            int shadowTriIndex = traverseBVH(shadowRayOrigin, shadowRayDir, 0, shadowBarycentric, shadowHitDistance);
            
            vec3 lightHitNormal;
            float lightHitDistance = intersectLight(shadowRayOrigin, shadowRayDir, light, lightHitNormal);
            
            if ((shadowTriIndex == -1 || shadowHitDistance >= lightHitDistance) && lightHitDistance > 0.0 && lightHitDistance <= distToLight) {
                // No occlusion
                float P = dot(smoothNormal,-toLight)/dot(light.position - hitPoint,light.position - hitPoint);
                vec3 thingy = BRDF * light.color * light.intensity * P * dot(smoothNormal, toLight);
                if(length(thingy) == 0.0 || !isValidVec3(thingy)){
                    thingy = vec3(1.0,0,0);
                }
                directLight = thingy;
            }
        }

        // INDIRECT LIGHTING (Prepare for the NEXT bounce)
        // Create the next bounce ray
        if(type != 4) //Transmission goes through
            rayOrigin = hitPoint + geometricNormal * 0.01;
        if(type == 1){ //Diffuse
            rayDir = weightedDIR(smoothNormal, rng_state);
            if(directLight == vec3(1.0)){
                throughput *= matColor; 
            }else{
                float weight = 1.0;
                if(bounce > 0){weight = 0.5;} //First bounce is full, subsequent are half
                throughput *= (weight * (matColor + directLight)); //Simple mix of direct and indirect
            }
        }
        else if (type == 2) { // Specular (mirror)
            rayDir = normalize(reflect(rayDir, smoothNormal)); // Use built-in
            throughput *= vec3(0.8); // decrease brightness a bit
            hasMirror = bounce;
        }else if (type == 3){ //Microfacet (Glossy), mixture of diffuse and specular
            vec3 perfect = normalize(reflect(rayDir, smoothNormal));
            rayDir = sampleGlossyDirection(perfect, matRoughness, rng_state);
            throughput *= matColor; //Switch to BDF later
            //Consider fresnel in the future
            hasMirror = bounce;
        }else if (type == 4){ //Transmission (Glass)
            float eta;
            vec3 transmissionNormal;
            if(didSwitch){ //exiting
                eta = matRoughness / 1.0;
                transmissionNormal = -smoothNormal; // Refract in the opposite direction
            }else{ //entering
                eta = 1.0 / matRoughness;
                transmissionNormal = smoothNormal; // Refract in the same direction
            }
            vec3 refracted = refract(rayDir, transmissionNormal, eta);
            if (length(refracted) < 0.001) {
                // TIR: fall back to mirror reflection
                rayDir = normalize(reflect(rayDir, transmissionNormal));
                rayOrigin = hitPoint + geometricNormal * 0.01;
            } else {
                rayDir = normalize(refracted);
                rayOrigin = hitPoint + rayDir * 0.01;
            }
            hasMirror = bounce; // Transmission is not a mirror, but we still track the last bounce
            vec3 absorption = (vec3(1.0) - matColor)*0.2;  // if matColor is tint
            throughput *= exp(-absorption * (minHitDistance*0.2)); //Beer Lambert law
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
    uint rng_state = hash(seed * hash(uint(u_frameNumber)) + uint(u_frameNumber));
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
