import { mat4, vec3 } from "gl-matrix";
import { cubeIndices } from "./geomatry";

export function CreateProgram(
  gl: WebGL2RenderingContext,
  VertexShaderCode: string,
  FragmentShaderCode: string
): WebGLProgram | undefined {
  const VertexShader: WebGLShader = CreateShader(
    gl,
    gl.VERTEX_SHADER,
    VertexShaderCode
  );
  const FragmentShader: WebGLShader = CreateShader(
    gl,
    gl.FRAGMENT_SHADER,
    FragmentShaderCode
  );
  const Program: WebGLProgram = gl.createProgram() as WebGLProgram;
  gl.attachShader(Program, VertexShader);
  gl.attachShader(Program, FragmentShader);
  gl.linkProgram(Program);

  if (!gl.getProgramParameter(Program, gl.LINK_STATUS)) {
    const errorMessage: string | null = gl.getProgramInfoLog(Program);
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

export function CreateStaticBuffer(
  gl: WebGL2RenderingContext,
  data: Float32Array
) {
  const buffer: WebGLBuffer | null = gl.createBuffer();
  if (!buffer) {
    console.error("Failed to create buffer");
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  const indexBuffer: WebGLBuffer = CreateIndexBuffer(gl, cubeIndices);

  return {
    position: buffer,
    // color: colorBuffer,
    indices: indexBuffer
  };
}

export function CreateTransformations(
  translation?: vec3,
  rotation?: vec3,
  scale?: vec3
): mat4 {
  let transformMatrix: mat4 = mat4.create();
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
export function CreateIndexBuffer(
  gl: WebGL2RenderingContext,
  indices: number[]
): WebGLBuffer {
  const indexBuffer: WebGLBuffer | null = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  // Now send the element array to GL

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  return indexBuffer as WebGLBuffer;
}

export function create3dPosColorInterleavedVao(
  gl: WebGL2RenderingContext,
  vertexBuffer: WebGLBuffer,
  indexBuffer: WebGLBuffer,
  posAttrib: number,
  colorAttrib: number
): WebGLVertexArrayObject {
  const vao: WebGLVertexArrayObject | null = gl.createVertexArray();
  gl.bindVertexArray(vao);

  gl.enableVertexAttribArray(posAttrib);
  gl.enableVertexAttribArray(colorAttrib);

  // Interleaved format: (x, y, z, r, g, b) (all f32)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(
    posAttrib,
    3,
    gl.FLOAT,
    false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    0
  );
  gl.vertexAttribPointer(
    colorAttrib,
    3,
    gl.FLOAT,
    false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    3 * Float32Array.BYTES_PER_ELEMENT
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bindVertexArray(null);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); // Not sure if necessary, but not a bad idea.

  return vao as WebGLVertexArrayObject;
}
