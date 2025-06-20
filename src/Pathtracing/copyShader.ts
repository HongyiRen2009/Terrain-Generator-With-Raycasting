//Imma be honest all this code was written by AI cause I'm too lazy to right the Tone mapping
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

uniform sampler2D u_sourceTexture; // This texture now contains the SUM of samples
uniform float u_frameNumber;       // We need the frame number here now
in vec2 v_uv;
out vec4 fragColor;

// ACES Filmic Tone Mapping Curve
vec3 ACESFilmic(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
    // 1. Get the SUM of colors from the accumulation texture
    vec3 sumColor = texture(u_sourceTexture, v_uv).rgb;

    // 2. Calculate the correct average by dividing by the number of samples (frames)
    //    Add a max to prevent division by zero if frameNumber is somehow 0.
    vec3 avgColor = sumColor / max(u_frameNumber, 1.0);

    // 3. Now apply tone mapping and gamma to the STABLE AVERAGE
    float exposure = 1.0;
    vec3 tonedColor = ACESFilmic(avgColor * exposure);
    
    float gamma = 2.2;
    vec3 finalColor = pow(tonedColor, vec3(1.0 / gamma));

    fragColor = vec4(finalColor, 1.0);
}
`;
