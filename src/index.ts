import { vec3 } from "gl-matrix";
import { isPointerLocked } from "./gen_utils";
import { Camera } from "./render/Camera";
import { GLRenderer } from "./render/GLRenderer";
import { debugMenu } from "./debug";

function main() {
  const kMainCanvasId = "#MainCanvas";
  const canvas = document.getElementById(kMainCanvasId) as HTMLCanvasElement;
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  canvas.onmousedown = () => {
    canvas.requestPointerLock();
    document.getElementById("body")!.requestFullscreen();
  };

  // Initialize the GL context
  const gl = canvas.getContext("webgl2");

  //initialize debugger
  const debug = new debugMenu(true); // When you want to use just pass it into


  // Only continue if WebGL is available and working
  if (!gl)
    return alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );

  const keysPressed: { [key: string]: boolean } = {};
  addKeys(keysPressed);

  const MainCamera = new Camera(vec3.fromValues(0, 0, 3));
  let lastRenderTime = 0;
  const maxFPS = 60;
  const frameInterval = 1000 / maxFPS; // 60 FPS

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

  const renderer = new GLRenderer(gl, canvas, MainCamera, debug);

  window.addEventListener("resize", () => {
    resizeCanvas(gl, canvas);
  });

  const frame = (timestamp: number) => {
    if (timestamp - lastRenderTime < frameInterval) {
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
