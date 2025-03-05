import { glMatrix, mat4, vec3 } from "gl-matrix";
import { CubeVertices } from "./geomatry";
import { FragmentShaderCode, VertexShaderCode } from "./glsl";
import {
  create3dPosColorInterleavedVao,
  CreateProgram,
  CreateStaticBuffer,
  CreateTransformations
} from "./gl-utilities";

function main() {
  const kMainCanvasId = "#MainCanvas";
  const canvas = document.getElementById(kMainCanvasId) as HTMLCanvasElement;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  canvas.onmousedown = function (event) {
    canvas.requestPointerLock();
    canvas.requestFullscreen();
  };
  // Initialize the GL context
  const gl = canvas.getContext("webgl2");
  gl.viewport(0, 0, canvas.width, canvas.height);
  
  window.addEventListener("resize", () => {
    resizeCanvas(gl, canvas);
  });

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL); // Ensures closer objects are drawn in front
  const keysPressed = {};
  addKeys(keysPressed);
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
  const CubeProgram = CreateProgram(gl, VertexShaderCode, FragmentShaderCode);
  const VertexPositionAttributeLocation = gl.getAttribLocation(
    CubeProgram,
    "VertexPosition"
  );
  const VertexColorAttributeLocation = gl.getAttribLocation(
    CubeProgram,
    "VertexColor"
  );

  const MatrixTransformUniformLocation = gl.getUniformLocation(
    CubeProgram,
    "MatrixTransform"
  );
  const matViewProjUniform = gl.getUniformLocation(CubeProgram, "matViewProj");
  const modelMatrix = CreateTransformations(null, null, null);
  //Camera View and Projections not yet implemented
  const matView = mat4.create(); //Identity matrices
  const matProj = mat4.create();
  const matViewProj = mat4.create();
  let cameraX = 10,
    cameraY = 10,
    cameraZ = 10;

  let lastRenderTime = 0;
  const fps = 60;
  const fpsInterval = 1000 / fps; // 60 FPS

  const frame = (timestamp: number) => {
    if (timestamp - lastRenderTime < fpsInterval) {
      requestAnimationFrame(frame);
      return;
    }
    lastRenderTime = timestamp;
    if (keysPressed["KeyA"]) {
      cameraX -= 0.2;
    }
    if (keysPressed["KeyD"]) {
      cameraX += 0.2;
    }
    if (keysPressed["KeyW"]) {
      cameraZ += 0.2;
    }
    if (keysPressed["KeyS"]) {
      cameraZ -= 0.2;
    }

    if (keysPressed["ShiftLeft"] || keysPressed["ShiftRight"]) {
      cameraY -= 0.2;
    }
    if (keysPressed["Space"]) {
      cameraY += 0.2;
    }
    render();
    requestAnimationFrame(frame);
    //The function repeats over and over at 60 fps because it calls itself
  };
  const render = () => {
    gl.uniformMatrix4fv(MatrixTransformUniformLocation, false, modelMatrix);
    gl.uniformMatrix4fv(matViewProjUniform, false, matViewProj);
    //Create vertice array object
    const cubeVao = create3dPosColorInterleavedVao(
      gl,
      CubeBuffer.position,
      CubeBuffer.indices,
      VertexPositionAttributeLocation,
      VertexColorAttributeLocation
    );
    //equivalent GLM (C++): matViewProj = matProj*matView
    mat4.lookAt(
      matView,
      /* pos= */ vec3.fromValues(cameraX, cameraY, cameraZ),
      /* lookAt= */ vec3.fromValues(0, 0, 0),
      /* up= */ vec3.fromValues(0, 1, 0)
    );
    mat4.perspective(
      matProj,
      /* fovy= */ glMatrix.toRadian(80),
      /* aspectRatio= */ canvas.width / canvas.height,
      /* near, far= */ 0.1,
      100.0
    );
    mat4.multiply(matViewProj, matProj, matView);

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindVertexArray(cubeVao);

    gl.drawElements(gl.TRIANGLES, 36 /*Vertex count */, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  };
  requestAnimationFrame(frame);
}

function resizeCanvas(gl: WebGL2RenderingContext,canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  console.log(canvas.width);
}

function addKeys(keys: Object) {
  window.addEventListener("keydown", (event) => {
    keys[event.code] = true;
  });

  window.addEventListener("keyup", (event) => {
    keys[event.code] = false;
  });
}
main();
