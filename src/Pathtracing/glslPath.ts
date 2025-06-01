export const pathTracingVertexShaderCode = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
out vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5; // map [-1, 1] → [0, 1]
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;
export const pathTracingFragmentShaderCode = `#version 300 es
precision highp float;

uniform sampler2D u_vertices;
uniform sampler2D u_terrains;
uniform sampler2D u_boundingBox;
uniform sampler2D u_nodesTex;
uniform sampler2D u_leafsTex;
uniform sampler2D u_terrainTypes;

in vec2 v_uv;
out vec4 fragColor;

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