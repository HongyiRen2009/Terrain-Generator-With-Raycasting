import { glMatrix, mat4 } from "gl-matrix";
import { TriangleVertices } from "./geomatry";
import { FragmentShaderCode, VertexShaderCode } from "./glsl";
import { CreateProgram, CreateStaticVertexBuffer } from "./gl-utilities";

function main() {
  const kMainCanvasId = "#MainCanvas";
  const canvas = document.getElementById(kMainCanvasId) as HTMLCanvasElement;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  // Initialize the GL context
  const gl = canvas.getContext("webgl2");
  gl.viewport(0, 0, canvas.width, canvas.height);
  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );

    return;
  }

  // These coordinates are in clip space, to see a visualization, go to https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection

  const TriangleVerticesCpuBuffer: Float32Array = new Float32Array(
    TriangleVertices
  );
  const triangleGeoBuffer = CreateStaticVertexBuffer(
    gl,
    TriangleVerticesCpuBuffer
  );
  const TriangleProgram = CreateProgram(
    gl,
    VertexShaderCode,
    FragmentShaderCode
  );
  const VertexPositionAttributeLocation = gl.getAttribLocation(
    TriangleProgram,
    "VertexPosition"
  );
  const MatrixTransformUniformLocation = gl.getUniformLocation(
    TriangleProgram,
    "MatrixTransform"
  );
  const modelMatrix = mat4.create();
  mat4.rotateY(modelMatrix, modelMatrix, Math.PI / 4); // Rotate 45° around Y-axis
  gl.uniformMatrix4fv(MatrixTransformUniformLocation, false, modelMatrix);
  if (VertexPositionAttributeLocation < 0) {
    console.error(`Failed to get attribute location for VertexPosition`);
    return;
  }
  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enableVertexAttribArray(VertexPositionAttributeLocation);
  gl.vertexAttribPointer(
    // index: vertex attrib location
    VertexPositionAttributeLocation,
    // Size: dimensions
    3,
    /* type: type of data in the GPU buffer for this attribute */
    gl.FLOAT,
    /* normalized: if type=float and is writing to a vec(n) float input, should WebGL normalize the ints first? */
    false,
    /* stride: bytes between starting byte of attribute for a vertex and the same attrib for the next vertex */
    0,
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
