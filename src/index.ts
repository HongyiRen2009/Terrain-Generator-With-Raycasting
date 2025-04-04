import { glMatrix, mat4, vec2, vec3 } from "gl-matrix";
import { CubeVertices, WirFrameCubeIndices } from "./geomatry";
import { FragmentShaderCode, VertexShaderCode } from "./glsl";
import {
  create3dPosColorInterleavedVao,
  CreateProgram,
  CreateStaticBuffer,
  CreateTransformations
} from "./gl-utilities";
import { isPointerLocked } from "./misc_functions";
import { Chunk } from "./marching_cubes";
import { Camera } from "./Camera";
import { GLRenderer } from "./GLRenderer";

function main() {
  const kMainCanvasId = "#MainCanvas";
  const canvas = document.getElementById(kMainCanvasId) as HTMLCanvasElement;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  canvas.onmousedown = () => {
    canvas.requestPointerLock();
    canvas.requestFullscreen();
  };

  // Initialize the GL context
  const gl = canvas.getContext("webgl2");

  // Only continue if WebGL is available and working
  if (!gl)
    return alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );

  const keysPressed: { [key: string]: boolean } = {};
  addKeys(keysPressed);

  const MainCamera = new Camera(vec3.fromValues(0, 0, 3));
  let lastRenderTime = 0;
  const fps = 60;
  const fpsInterval = 1000 / fps; // 60 FPS

  canvas.addEventListener("mousemove", (event: MouseEvent) => {
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

  const renderer = new GLRenderer(gl, canvas, MainCamera);

  window.addEventListener("resize", () => {
    resizeCanvas(gl, canvas);
  });

  const frame = (timestamp: number) => {
    if (timestamp - lastRenderTime < fpsInterval) {
      requestAnimationFrame(frame);
      return;
    }
    const timePassed = timestamp - lastRenderTime;
    lastRenderTime = timestamp;
    if (isPointerLocked()) {
      console.log("Updating camera position");
      updateCameraPosition(MainCamera, keysPressed, timePassed);
    }
    renderer.render();
    requestAnimationFrame(frame);
    //The function repeats over and over at 60 fps because it calls itself
  };

  requestAnimationFrame(frame);
}

function updateCameraPosition(
  camera: Camera,
  keys: { [key: string]: boolean },
  timePassed: number
) {
  let velocity = camera.speed * timePassed;
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

function resizeCanvas(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  console.log(canvas.width);
}

function addKeys(keys: { [key: string]: boolean }) {
  window.addEventListener("keydown", (event: KeyboardEvent) => {
    keys[event.code] = true;
  });

  window.addEventListener("keyup", (event: KeyboardEvent) => {
    keys[event.code] = false;
  });
}

main();

