export const pathTracingVertexShaderCode = /* glsl */  `#version 300 es
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

uniform sampler2D u_vertices;
uniform sampler2D u_terrains;
uniform sampler2D u_boundingBox;
uniform sampler2D u_nodesTex;
uniform sampler2D u_leafsTex;
uniform sampler2D u_terrainTypes;
uniform vec3 u_cameraPos;
uniform mat4 u_invViewProjMatrix;

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
    vec3 normal;
};


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
    r.min = vec3(fetchFloatFrom1D(u_boundingBox, i*6),fetchFloatFrom1D(u_boundingBox, i*6+1),fetchFloatFrom1D(u_boundingBox, i*6+2));
    r.max = vec3(fetchFloatFrom1D(u_boundingBox, i*6+3),fetchFloatFrom1D(u_boundingBox, i*6+4),fetchFloatFrom1D(u_boundingBox, i*6+5));

    r.left = int(fetchFloatFrom1D(u_nodesTex,i*2));
    r.right = int(fetchFloatFrom1D(u_nodesTex,i*2+1));

    r.triangles[0]=int(fetchFloatFrom1D(u_leafsTex,i*4));
    r.triangles[1]=int(fetchFloatFrom1D(u_leafsTex,i*4+1));
    r.triangles[2]=int(fetchFloatFrom1D(u_leafsTex,i*4+2));
    r.triangles[3]=int(fetchFloatFrom1D(u_leafsTex,i*4+3));
    
    return r;
}

Triangle getTriangle(int i){
    Triangle tri;
    tri.vertices[0] = vec3(fetchFloatFrom1D(u_vertices, i*9), fetchFloatFrom1D(u_vertices, i*9+1), fetchFloatFrom1D(u_vertices, i*9+2));
    tri.vertices[1] = vec3(fetchFloatFrom1D(u_vertices, i*9+3), fetchFloatFrom1D(u_vertices, i*9+4), fetchFloatFrom1D(u_vertices, i*9+5));
    tri.vertices[2] = vec3(fetchFloatFrom1D(u_vertices, i*9+6), fetchFloatFrom1D(u_vertices, i*9+7), fetchFloatFrom1D(u_vertices, i*9+8));
    tri.types[0] = int(fetchFloatFrom1D(u_terrainTypes, i*3));
    tri.types[1] = int(fetchFloatFrom1D(u_terrainTypes, i*3+1));
    tri.types[2] = int(fetchFloatFrom1D(u_terrainTypes, i*3+2));

    tri.min = vec3(min(tri.vertices[0].x, min(tri.vertices[1].x, tri.vertices[2].x)),
                   min(tri.vertices[0].y, min(tri.vertices[1].y, tri.vertices[2].y)),
                   min(tri.vertices[0].z, min(tri.vertices[1].z, tri.vertices[2].z)));
    tri.max = vec3(max(tri.vertices[0].x, max(tri.vertices[1].x, tri.vertices[2].x)),
                   max(tri.vertices[0].y, max(tri.vertices[1].y, tri.vertices[2].y)),
                   max(tri.vertices[0].z, max(tri.vertices[1].z, tri.vertices[2].z)));
    tri.center = (tri.min + tri.max) * 0.5;
    tri.normal = normalize(cross(tri.vertices[1] - tri.vertices[0], tri.vertices[2] - tri.vertices[0]));
    return tri;
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


/**
 * Returns TRIANGLE index
 */
int traverseBVH(vec3 rayOrigin, vec3 rayDir, int BVHindex) {
    int closestHitIndex = -1;
    float minHitDistance = 1.0/0.0; // Infinity

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
                vec3 barycentric;
                float hitDist = intersectTriangle(rayOrigin, rayDir, tri, barycentric);

                if (hitDist > 0.0 && hitDist < minHitDistance) {
                    minHitDistance = hitDist;
                    closestHitIndex = triIdx;
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


vec4 PathTrace(vec3 rayOrigin, vec3 rayDir, int depth){
    bool hit = false;
    vec4 color = vec4(0.0);
    int triIndex = traverseBVH(rayOrigin, rayDir, 0); // Start traversing from the root BVH node
    if(triIndex != -1){
        Triangle tri = getTriangle(triIndex);
        vec3 lightColor = vec3(1.0, 1.0, 1.0);
        vec3 lightSource = vec3(0.0, 1.0, 0.0);
        float diffuseStrength = max(dot(normalize(tri.normal), normalize(lightSource)), 0.2);
        vec3 diffuseColor = diffuseStrength * lightColor;
        vec3 lighting = diffuseColor;
        color = vec4(pow(vec3(0.0,1.0,0.0)*lighting,vec3(1.0 / 2.2)), 1);
    }else{
        color = vec4(0.0, 0.0, 0.0, 1.0); // background color
    }

    return color; 
}

void main() {
    //All dummy. There mostly to ensure webgl doesn't auto-optimize all the things out.
    vec4 dummy1 = texture(u_vertices, v_uv * 0.0); // Always fetch (0,0)
    vec4 dummy2 = texture(u_terrains, v_uv * 0.0); // Always fetch (0,0)
    vec4 dummy3 = texture(u_boundingBox, v_uv * 0.0); // Always fetch (0,0)
    vec4 dummy4 = texture(u_nodesTex, v_uv * 0.0); // Always fetch (0,0)
    vec4 dummy5 = texture(u_leafsTex, v_uv * 0.0); // Always fetch (0,0)
    vec4 dummy6 = texture(u_terrainTypes, v_uv * 0.0); // Always fetch (0,0)

    vec2 screenPos = v_uv * 2.0 - 1.0; // NDC space: [-1, 1]

    // Define the ray in clip space. 'w' is 1.0 because it's a point.
    vec4 rayClip = vec4(screenPos, -1.0, 1.0); 
    // Transform from clip space to world space
    vec4 rayWorld = u_invViewProjMatrix * rayClip;
    // Perform perspective divide
    rayWorld /= rayWorld.w;
    // The ray direction is the vector from the camera to this point in the world
    vec3 rayDir = normalize(rayWorld.xyz - u_cameraPos);
    vec3 rayOrigin = u_cameraPos;

    fragColor = PathTrace(rayOrigin,rayDir,1)+ (dummy1+dummy2+dummy3+dummy4+dummy5+dummy6)*0.0 + u_cameraPos[0]*0.0 + u_invViewProjMatrix[0]*0.0; 
}
`