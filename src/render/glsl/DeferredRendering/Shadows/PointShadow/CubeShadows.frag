#version 300 es
precision highp float;

uniform vec3 lightPos;
uniform float lightRadius;
uniform float lightRange;

in vec3 fragPosition;

void main(){
    float distance = length(lightPos - fragPosition);
    // Normalize by range to match the shadow map range
    // This ensures shadows work correctly up to where light still has meaningful contribution
    // Write to gl_FragDepth for hardware shadow comparison
    gl_FragDepth = distance / lightRange;
}