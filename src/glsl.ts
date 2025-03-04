export const VertexShaderCode = /*glsl*/ `#version 300 es
precision mediump float;
//If you see lessons that use attribute, that's an old version of Webgl
in vec4 VertexPosition;
uniform mat4 MatrixTransform;

void main() {  
  gl_Position = MatrixTransform*VertexPosition;
}
`;

export const FragmentShaderCode = /*glsl*/ `#version 300 es
precision mediump float;

out vec4 outputColor;

void main() {
  outputColor = vec4(0.294, 0.0, 0.51, 1.0);
}`;
