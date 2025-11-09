#version 300 es
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