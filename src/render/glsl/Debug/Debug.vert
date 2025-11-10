#version 300 es
precision highp float;

uniform mat4 inverseLightSpaceMatrices[3];
uniform int shadowMapCascade;
uniform mat4 viewProj;

in vec3 clipPos;
in vec3 color;
out vec3 fragColor;

void main(){
    vec4 worldPos = inverseLightSpaceMatrices[shadowMapCascade] * vec4(clipPos, 1.0);
    fragColor = color;
    gl_Position = viewProj * worldPos;
    
}
