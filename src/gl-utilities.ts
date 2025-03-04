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
export function CreateStaticVertexBuffer(gl, data) {
  const buffer = gl.createBuffer();
  if (!buffer) {
    console.error("Failed to create buffer");
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}
