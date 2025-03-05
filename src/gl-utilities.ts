import { mat4, vec3 } from "gl-matrix";

export function CreateProgram(
  gl: WebGL2RenderingContext,
  VertexShaderCode: string,
  FragmentShaderCode: string
) {
  const VertexShader = CreateShader(gl, gl.VERTEX_SHADER, VertexShaderCode);
  const FragmentShader = CreateShader(
    gl,
    gl.FRAGMENT_SHADER,
    FragmentShaderCode
  );
  const Program: WebGLProgram = gl.createProgram();
  gl.attachShader(Program, VertexShader);
  gl.attachShader(Program, FragmentShader);
  gl.linkProgram(Program);

  if (!gl.getProgramParameter(Program, gl.LINK_STATUS)) {
    const errorMessage = gl.getProgramInfoLog(Program);
    console.error(`Failed to link GPU program: ${errorMessage}`);
    return;
  }
  gl.useProgram(Program);
  return Program;
}
export function CreateShader(
  gl: WebGL2RenderingContext,
  ShaderType: GLenum,
  ShaderCode: string
): WebGLShader {
  const Shader: WebGLShader | null = gl.createShader(ShaderType);

  if (!Shader) {
    throw new Error("Failed to create WebGL shader.");
  }

  gl.shaderSource(Shader, ShaderCode);
  gl.compileShader(Shader);

  if (!gl.getShaderParameter(Shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation error: ", gl.getShaderInfoLog(Shader));
    gl.deleteShader(Shader); // Clean up the failed shader
    throw new Error("Shader compilation failed.");
  }

  return Shader;
}
export function CreateStaticBuffer(gl, data) {
  const buffer = gl.createBuffer();
  if (!buffer) {
    console.error("Failed to create buffer");
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  const indexBuffer = CreateIndexBuffer(gl);

  return {
    position: buffer,
    // color: colorBuffer,
    indices: indexBuffer,
  };
}

export function CreateTransformations(
  translation?: vec3,
  rotation?: vec3,
  scale?: vec3
) {
  let transformMatrix = mat4.create();
  if (scale) {
    mat4.scale(transformMatrix, transformMatrix, scale);
  }
  if (rotation) {
    // Apply rotation around X, Y, and Z axes using Euler angles
    mat4.rotateX(transformMatrix, transformMatrix, rotation[0]);
    mat4.rotateY(transformMatrix, transformMatrix, rotation[1]);
    mat4.rotateZ(transformMatrix, transformMatrix, rotation[2]);
  }
  if (translation) {
    mat4.translate(transformMatrix, transformMatrix, translation);
  }
  return transformMatrix;
}
//Will change it later to feature length manipulations
export function CreateIndexBuffer(gl) {
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = [
    0,
    1,
    2,
    0,
    2,
    3, // front
    4,
    5,
    6,
    4,
    6,
    7, // back
    8,
    9,
    10,
    8,
    10,
    11, // top
    12,
    13,
    14,
    12,
    14,
    15, // bottom
    16,
    17,
    18,
    16,
    18,
    19, // right
    20,
    21,
    22,
    20,
    22,
    23, // left
  ];

  // Now send the element array to GL

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  return indexBuffer;
}
