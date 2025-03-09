import { glMatrix, mat4, vec3 } from "gl-matrix";
import { CubeVertices } from "./geomatry";
import { FragmentShaderCode, VertexShaderCode } from "./glsl";
import {
  create3dPosColorInterleavedVao,
  CreateProgram,
  CreateStaticBuffer,
  CreateTransformations
} from "./gl-utilities";
import { isPointerLocked, toRadians } from "./misc_functions";
class Camera {
  position: vec3;
  sensitivity = 0.1;
  yaw = -90; // Left right rotation in degrees
  pitch = 0; // Up down rotation in degrees
  //Computed Dynamically
  front = vec3.fromValues(0, 0, -1);
  right = vec3.fromValues(1, 0, 0);

  up = vec3.fromValues(0, 1, 0);
  speed = 0;
  constructor(
    position: vec3,
    yaw: number,
    pitch: number,
    sensativity: number,
    speed: number
  ) {
    this.position = position;
    this.yaw = yaw;
    this.pitch = pitch;
    this.sensitivity = sensativity;
    this.speed = speed;
    this.UpdateCameraVectors();
  }
  //enables Camera.XPosition instead of Camera.position[0]
  get XPosition() {
    return this.position[0];
  }
  set XPosition(value) {
    this.position[0] = value;
  }
  get YPosition() {
    return this.position[0];
  }
  set YPosition(value) {
    this.position[0] = value;
  }
  get ZPosition() {
    return this.position[0];
  }
  set ZPosition(value) {
    this.position[0] = value;
  }
  UpdateCameraVectors() {
    let front = vec3.create();
    front[0] = Math.cos(toRadians(this.yaw)) * Math.cos(toRadians(this.pitch));
    front[1] = Math.sin(toRadians(this.pitch));
    front[2] = Math.sin(toRadians(this.yaw)) * Math.cos(toRadians(this.pitch));
    vec3.normalize(this.front, front); // Normalize to maintain unit length
    vec3.cross(this.right, this.front, this.up);
    vec3.normalize(this.right, this.right);
  }
}
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
  let modelMatrix = CreateTransformations(null, null, null);
  let matView = mat4.create(); //Identity matrices
  const matProj = mat4.create();
  const matViewProj = mat4.create();

  const MainCamera = new Camera(vec3.fromValues(0, 0, 3), -90, 0, 0.1, 0.05);
  let lastRenderTime = 0;
  const fps = 60;
  const fpsInterval = 1000 / fps; // 60 FPS
  canvas.addEventListener("mousemove", (event) => {
    if (isPointerLocked()) {
      let { movementX, movementY } = event;

      // Convert pixels to angles
      MainCamera.yaw += movementX * MainCamera.sensitivity;
      MainCamera.pitch -= movementY * MainCamera.sensitivity;

      // Constrain pitch (to prevent flipping)
      if (MainCamera.pitch > 89) MainCamera.pitch = 89;
      if (MainCamera.pitch < -89) MainCamera.pitch = -89;
      MainCamera.UpdateCameraVectors();
    }
  });
  const frame = (timestamp: number) => {
    if (timestamp - lastRenderTime < fpsInterval) {
      requestAnimationFrame(frame);
      return;
    }
    lastRenderTime = timestamp;
    if (isPointerLocked()) {
      updateCameraPosition(MainCamera, keysPressed);
    }
    render();
    requestAnimationFrame(frame);
    //The function repeats over and over at 60 fps because it calls itself
  };
  const render = () => {
    mat4.multiply(
      modelMatrix,
      modelMatrix,
      CreateTransformations(
        vec3.fromValues(0, 0, 0),
        vec3.fromValues(0.1, 0.1, 0),
        vec3.fromValues(1, 1, 1)
      )
    );
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
    matView = getViewMatrix(MainCamera);
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
function updateCameraPosition(camera: Camera, keys: Object) {
  let velocity = camera.speed;
  let movement = vec3.create();
  //scaleAndAdd simply adds the second operand by a scaler. Basically just +=camera.front*velocity
  if (keys["KeyW"])
    vec3.scaleAndAdd(movement, movement, camera.front, velocity); // Forward
  if (keys["KeyS"])
    vec3.scaleAndAdd(movement, movement, camera.front, -velocity); // Backward
  if (keys["KeyA"])
    vec3.scaleAndAdd(movement, movement, camera.right, -velocity); // Left
  if (keys["KeyD"])
    vec3.scaleAndAdd(movement, movement, camera.right, velocity); // Right
  if (keys["Space"]) vec3.scaleAndAdd(movement, movement, camera.up, velocity); // Up
  if (keys["ShiftLeft"])
    vec3.scaleAndAdd(movement, movement, camera.up, -velocity); // Down

  vec3.add(camera.position, camera.position, movement);
}
function getViewMatrix(camera: Camera) {
  let viewMatrix = mat4.create();
  let target = vec3.create();
  vec3.add(target, camera.position, camera.front); // Look-at target
  mat4.lookAt(viewMatrix, camera.position, target, camera.up);
  return viewMatrix;
}
function resizeCanvas(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
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
