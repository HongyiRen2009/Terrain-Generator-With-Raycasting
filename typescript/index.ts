const kMainCanvasId = "#MainCanvas";
const canvas = document.getElementById(kMainCanvasId) as HTMLCanvasElement;
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
// Initialize the GL context
const gl = canvas.getContext("webgl2");
function main() {
  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );

    return;
  }

  // These coordinates are in clip space, to see a visualization, go to https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection
  const TriangleVertices: readonly number[] = [
    // Top middle
    0.0, 0.5,
    // Bottom Left
    -0.5, -0.5,
    // Botton Right
    0.5, -0.5,
  ];
  const TriangleVerticesCpuBuffer: Float32Array = new Float32Array(
    TriangleVertices
  );
  const triangleGeoBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, TriangleVerticesCpuBuffer, gl.STATIC_DRAW);

  const VertexShaderCode = `#version 300 es
  precision mediump float;
  in vec2 vertexPosition;
  void main(){
    gl_Position = vec4(vertexPosition, 0.0,1.0);
  }
  `;
  const VertexShader = CreateShader(gl.VERTEX_SHADER, VertexShaderCode);

  const FragmentShaderCode = `#version 300 es
  precision mediump float;

  out vec4 outputColor;

  void main() {
    outputColor = vec4(0.294, 0.0, 0.51, 1.0);
  }`;
  const FragmentShader = CreateShader(gl.FRAGMENT_SHADER, FragmentShaderCode);

  const TriangleProgram = gl.createProgram();
  gl.attachShader(TriangleProgram, VertexShader);
  gl.attachShader(TriangleProgram, FragmentShader);
  gl.linkProgram(TriangleProgram);
  if (!gl.getProgramParameter(TriangleProgram, gl.LINK_STATUS)) {
    const errorMessage = gl.getProgramInfoLog(TriangleProgram);
    console.error(`Failed to link GPU program: ${errorMessage}`);
    return;
  }
  const vertexPositionAttributeLocation = gl.getAttribLocation(
    TriangleProgram,
    "vertexPosition"
  );
  if (vertexPositionAttributeLocation < 0) {
    console.error(`Failed to get attribute location for vertexPosition`);
    return;
  }
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(TriangleProgram);
  gl.enableVertexAttribArray(vertexPositionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
  gl.vertexAttribPointer(
    // index: vertex attrib location
    vertexPositionAttributeLocation,
    // Size: dimensions
    2,
    /* type: type of data in the GPU buffer for this attribute */
    gl.FLOAT,
    /* normalized: if type=float and is writing to a vec(n) float input, should WebGL normalize the ints first? */
    false,
    /* stride: bytes between starting byte of attribute for a vertex and the same attrib for the next vertex */
    2 * Float32Array.BYTES_PER_ELEMENT,
    /* offset: bytes between the start of the buffer and the first byte of the attribute */
    0
  );
  gl.drawArrays(
    gl.TRIANGLES,
    0,
    3 /* Number of Vertices NOT number of triangles */
  );
}

main();
function CreateShader(ShaderType, ShaderCode) {
  const Shader = gl.createShader(ShaderType);
  gl.shaderSource(Shader, ShaderCode);
  gl.compileShader(Shader);
  if (!gl.getShaderParameter(Shader, gl.COMPILE_STATUS)) {
    console.error(
      "Failed to Compile Vertex Shader " + gl.getShaderInfoLog(Shader)
    );
  }
  return Shader;
}
