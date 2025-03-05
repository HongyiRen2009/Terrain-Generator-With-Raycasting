import { glMatrix, mat4 } from "gl-matrix";
import { CubeVertices, TriangleVertices } from "./geomatry";
import { FragmentShaderCode, VertexShaderCode } from "./glsl";
import {
  CreateProgram,
  CreateStaticBuffer,
  CreateTransformations,
} from "./gl-utilities";

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
  const CubeCPUBuffer = new Float32Array(CubeVertices);
  const CubeBuffer = CreateStaticBuffer(gl, CubeCPUBuffer);
  const TriangleProgram = CreateProgram(
    gl,
    VertexShaderCode,
    FragmentShaderCode
  );
  const VertexPositionAttributeLocation = gl.getAttribLocation(
    TriangleProgram,
    "VertexPosition"
  );
  if (VertexPositionAttributeLocation < 0) {
    console.error(`Failed to get attribute location for VertexPosition`);
    return;
  }
  const MatrixTransformUniformLocation = gl.getUniformLocation(
    TriangleProgram,
    "MatrixTransform"
  );
  const modelMatrix = CreateTransformations([0.7, 0, 0], null, [0.3, 0.3, 0.3]);
  let lastRenderTime = 0;
  const fps = 60;
  const fpsInterval = 1000 / fps; // 60 FPS

  const render = function (timestamp) {
    if (timestamp - lastRenderTime < fpsInterval) {
      requestAnimationFrame(render);
      return;
    }
    lastRenderTime = timestamp;
    gl.uniformMatrix4fv(MatrixTransformUniformLocation, false, modelMatrix);

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
    gl.drawElements(gl.TRIANGLES, 36 /*Vertex count */, gl.UNSIGNED_SHORT, 0);
    mat4.rotateY(modelMatrix, modelMatrix, 0.05);
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
}

main();
