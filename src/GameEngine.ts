import { vec3 } from "gl-matrix";
import { DebugMenu } from "./DebugMenu";
import { WorldMap } from "./map/Map";
import { Camera } from "./render/Camera";
import { GLRenderer } from "./render/GLRenderer";

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;

  //Classes
  private debug: DebugMenu;
  private world: WorldMap;
  private mainCamera: Camera;
  private renderer: GLRenderer;

  //
  private keys: { [key: string]: boolean } = {};
  private maxFPS: number = 60;
  private frameInterval = 1000 / this.maxFPS;
  private lastRenderTime: number = 0;

  //
  private frameCounter: number = 0;
  private lastFPSCheck: number = 0;
  private currentFPS: number = 0;

  constructor(canvasId: string) {
    //Debugger
    this.debug = new DebugMenu(true); // Pass into class when want to use

    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    //GL Context
    this.gl = this.canvas.getContext("webgl2", { antialias: true })!;

    //Initialize controls
    this.addKeys();

    //Initialize world
    this.world = new WorldMap(1000, 1000, 1000);

    //Initialize Camera
    this.mainCamera = new Camera(vec3.fromValues(0, 0, 3));

    //Initialize Renderer
    this.renderer = new GLRenderer(
      this.gl,
      this.canvas,
      this.mainCamera,
      this.debug,
      this.world
    );

    //Events
    this.canvas.addEventListener("mousedown", () => this.requestScreenLock());
    this.canvas.addEventListener("mousemove", (e: MouseEvent) =>
      this.mouseMove(e)
    );
    window.addEventListener("resize", () => this.resizeCanvas());

    //Debugging
    this.debug.addElement("FPS", () => Math.round(this.currentFPS));

    //Check to see if WebGL working
    if (!this.gl) {
      alert(
        "Unable to initialize WebGL. Your browser or machine may not support it."
      );
      return;
    }
  }

  /**
   * Our Game Loop
   */
  tick(timestamp: number) {
    if (timestamp - this.lastRenderTime < this.frameInterval) {
      return;
    }
    const timePassed = timestamp - this.lastRenderTime;
    this.lastRenderTime = timestamp;
    if (GameEngine.getLockedElement()) {
      this.updateCamera(timePassed);
    }

    this.renderer.render();

    this.frameCounter += 1;
    if (Date.now() - this.lastFPSCheck >= 1000) {
      this.currentFPS =
        this.frameCounter / ((Date.now() - this.lastFPSCheck) / 1000);
      this.lastFPSCheck = Date.now();
      this.frameCounter = 0;
    }
    this.debug.update();
  }

  updateCamera(time: number) {
    let velocity = this.mainCamera.speed * time;
    let movement = vec3.create();

    //scaleAndAdd simply adds the second operand by a scaler. Basically just +=camera.front*velocity
    if (this.keys["KeyW"])
      vec3.scaleAndAdd(movement, movement, this.mainCamera.front, velocity); // Forward
    if (this.keys["KeyS"])
      vec3.scaleAndAdd(movement, movement, this.mainCamera.front, -velocity); // Backward
    if (this.keys["KeyA"])
      vec3.scaleAndAdd(movement, movement, this.mainCamera.right, -velocity); // Left
    if (this.keys["KeyD"])
      vec3.scaleAndAdd(movement, movement, this.mainCamera.right, velocity); // Right
    if (this.keys["Space"])
      vec3.scaleAndAdd(movement, movement, this.mainCamera.up, velocity); // Up
    if (this.keys["ShiftLeft"])
      vec3.scaleAndAdd(movement, movement, this.mainCamera.up, -velocity); // Down
    vec3.add(this.mainCamera.position, this.mainCamera.position, movement);
  }

  addKeys() {
    window.addEventListener("keydown", (event: KeyboardEvent) => {
      this.keys[event.code] = true;
    });
    window.addEventListener("keyup", (event: KeyboardEvent) => {
      this.keys[event.code] = false;
    });
  }

  /*--------------------------------Utilities--------------------------------*/
  requestScreenLock() {
    this.canvas.requestPointerLock();
    document.getElementById("body")!.requestFullscreen();
  }
  mouseMove(event: MouseEvent) {
    if (GameEngine.getLockedElement()) {
      let { movementX, movementY } = event;

      // Convert pixels to angles
      this.mainCamera.yaw += movementX * this.mainCamera.sensitivity;
      this.mainCamera.pitch -= movementY * this.mainCamera.sensitivity;

      // Constrain pitch (to prevent flipping)
      if (this.mainCamera.pitch > 89) this.mainCamera.pitch = 89;
      if (this.mainCamera.pitch < -89) this.mainCamera.pitch = -89;
      this.mainCamera.UpdateCameraVectors();
    }
  }
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  static getLockedElement() {
    return document.pointerLockElement;
  }
  static toRadians(degrees: number) {
    return degrees * (Math.PI / 180);
  }
}
