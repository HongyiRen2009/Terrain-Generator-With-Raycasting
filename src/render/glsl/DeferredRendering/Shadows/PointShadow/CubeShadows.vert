#version 300 es
precision highp float;

uniform mat4 lightSpaceMatrix;
uniform mat4 model;

layout(location = 0) in vec3 position;
out vec3 fragPosition;

void main(){
    vec4 worldPosition = model * vec4(position,1.0);
    fragPosition = worldPosition.xyz;
    gl_Position = lightSpaceMatrix * worldPosition;
}