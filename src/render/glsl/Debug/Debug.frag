#version 300 es
precision highp float;

in vec3 fragColor;
out vec4 outputColor;

void main(){
    outputColor = vec4(fragColor, 1.0);
}
