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

in vec2 v_uv;
out vec4 fragColor;

struct BVH{
    vec3 min;
    vec3 max;
    int right;
    int left;
    int[4] triangles;
};

float fetchFloatFrom1D(sampler2D tex, int index) {
    ivec2 size = textureSize(tex, 0);
    int texWidth = size.x;    
    int texelIndex = index / 4;
    int componentIndex = index % 4;

    float x = (float(texelIndex) + 0.5) / float(texWidth);
    vec4 texel = texture(tex, vec2(x, 0.5));

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

void main() {
    //All dummy. There mostly to ensure webgl doesn't auto-optimize all the things out.
    vec4 dummy1 = texture(u_vertices, v_uv * 0.0); // Always fetch (0,0)
    vec4 dummy2 = texture(u_terrains, v_uv * 0.0); // Always fetch (0,0)
    vec4 dummy3 = texture(u_boundingBox, v_uv * 0.0); // Always fetch (0,0)
    vec4 dummy4 = texture(u_nodesTex, v_uv * 0.0); // Always fetch (0,0)
    vec4 dummy5 = texture(u_leafsTex, v_uv * 0.0); // Always fetch (0,0)
    vec4 dummy6 = texture(u_terrainTypes, v_uv * 0.0); // Always fetch (0,0)

    // Replace this with your raytracing logic
    fragColor = vec4(v_uv, 0.0, 1.0)+ (dummy1+dummy2+dummy3+dummy4+dummy5+dummy6)*0.0; // visual gradient
}
`