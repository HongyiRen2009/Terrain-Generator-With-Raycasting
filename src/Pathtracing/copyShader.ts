export const copyVertexShader = /* glsl */ `#version 300 es
precision highp float;

// Input: A hardcoded triangle that fills the screen
layout(location = 0) in vec2 a_position;

// Output: The UV coordinates to sample the texture
out vec2 v_uv;

void main() {
    // We want the UVs to go from (0,0) to (1,1) across the screen
    v_uv = a_position * 0.5 + 0.5;
    
    // Output the clip-space position of the triangle vertices
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const copyFragmentShader = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_sourceTexture;
in vec2 v_uv;
out vec4 fragColor;

// A simple Reinhard tone mapping operator
vec3 ReinhardToneMap(vec3 color) {
    color /= (color + vec3(1.0));
    return color;
}

void main() {
    // 1. Get the accumulated HDR color from our path tracer's output texture
    vec3 hdrColor = texture(u_sourceTexture, v_uv).rgb;

    // 2. Apply tone mapping to map it to a displayable range
    vec3 ldrColor = ReinhardToneMap(hdrColor);
    
    // 3. Apply Gamma Correction (very important for correct brightness)
    float gamma = 2.2;
    ldrColor = pow(ldrColor, vec3(1.0 / gamma));

    // 4. Output the final, display-ready color
    fragColor = vec4(ldrColor, 1.0);
}
`