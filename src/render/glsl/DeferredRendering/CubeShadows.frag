#version 300 es
precision highp float;

uniform vec3 lightPos;
uniform float lightRadius;

in vec3 fragPosition;
out float outDepth;

void main(){
    float distance = length(lightPos-fragPosition);
    // Normalize by 2x radius to match the extended shadow map range
    // This ensures shadows work correctly up to where light still has meaningful contribution
    distance = distance / (lightRadius * 3.0);
    outDepth = distance;
}