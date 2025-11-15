import { mat3, mat4, vec3 } from "gl-matrix";
import { DebugMenu } from "./DebugMenu";
import { WorldMap } from "./map/Map";
import { Camera } from "./render/Camera";
import { GLRenderer } from "./render/GLRenderer";
import { PathTracer } from "./Pathtracing/PathTracer";
import { RenderUtils } from "./utils/RenderUtils";
import { WorldUtils } from "./utils/WorldUtils";

import gearModelUrl from "../models/stand.3mf";

import { loadPLYToMesh, objSourceToMesh } from "./modelLoader/objreader";
import { threemfToMesh } from "./modelLoader/3fmreader";
import { Color, Terrains } from "./map/terrains";
import { WorldObject } from "./map/WorldObject";

/**
 * Our holding class for all game mechanics
 * Generally doing something like this is better programming practice & may avoid bugs and merge conflicts in the future
 */
export class GameEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;

  //Classes
  private debug: DebugMenu;
  private world: WorldMap;
  private mainCamera: Camera;
  private renderer: GLRenderer;
  private pathTracer: PathTracer;

  //
  private keys: { [key: string]: boolean } = {};
  private maxFPS: number = 60;
  private frameInterval = 1000 / this.maxFPS;
  private lastRenderTime: number = 0;
  private mode: number = 0; // 0 for hybrid, 1 for pathtracer, -1 for off

  //
  private frameCounter: number = 0; // In the current FPS
  private lastFPSCheck: number = 0;
  private currentFPS: number = 0;

  private worldInitialized = false;
  private updatePathracing: () => void;
  /**
   * Constructs game engine
   * @param canvasId The ID of the canvas rendered to
   * @returns
   */
  constructor(canvasId: string) {
    //Debugger
    this.debug = new DebugMenu(true); // Pass into class when want to use

    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.display = "none";

    //GL Context
    this.gl = this.canvas.getContext("webgl2", {
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      depth: true,
      stencil: true
    })!;

    //Initialize controls
    this.addKeys();

    this.updatePathracing = () => {};

    //Initialize world
    this.world = new WorldMap(
      1000,
      64,
      1000,
      this.gl,
      () => this.updatePathracing
    );

    //Initialize Camera
    this.mainCamera = new Camera(vec3.fromValues(-22, 20, 33));

    //Initialize Renderer
    this.renderer = new GLRenderer(
      this.gl,
      this.canvas,
      this.mainCamera,
      this.debug,
      this.world
    );
    //Initial pathTracer
    this.pathTracer = new PathTracer(
      this.canvas,
      this.gl,
      this.world,
      this.mainCamera,
      this.renderer,
      this.debug
    );
    this.updatePathracing = () => {
      this.pathTracer.initBVH(this.world.combinedMesh());
      this.pathTracer.init(false);
    };

    //Events
    this.canvas.addEventListener("mousedown", () => this.requestScreenLock());
    this.canvas.addEventListener("mousemove", (e: MouseEvent) =>
      this.mouseMove(e)
    );
    window.addEventListener("resize", () => this.resizeCanvas());

    //Debugging
    this.debug.addElement("FPS", () => Math.round(this.currentFPS));
    this.debug.addElement("#Types", () => Object.keys(Terrains).length);

    //Initialize switcher
    const rayBtn = document.getElementById("raytracing")!;
    const pathBtn = document.getElementById("pathtracing")!;

    rayBtn.addEventListener("click", () => {
      rayBtn.classList.add("active");
      pathBtn.classList.remove("active");
      if (this.mode == 1) {
        this.pathTracer.leave();
      }
      this.mode = 0; // Set to raytracing
    });

    pathBtn.addEventListener("click", () => {
      pathBtn.classList.add("active");
      rayBtn.classList.remove("active");
      this.mode = 1; // Set to pathtracing
      this.pathTracer.init();
    });

    //Initialize menu
    const menuButton = document.getElementById("menu-toggle")!;
    const sidebar = document.getElementById("sidebar")!;
    const topBar = document.getElementById("topBarWrapper")!;

    menuButton.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      topBar.classList.toggle("shifted");
    });

    //Check to see if WebGL working
    if (!this.gl) {
      alert(
        "Unable to initialize WebGL. Your browser or machine may not support it."
      );
      return;
    }

    this.initialize();
  }
  public async initialize() {
    await Promise.all(
      this.world.chunks.map((chunk) => chunk.generateTerrain())
    );
    this.world.populateFieldMap();

    await Promise.all(
      this.world.chunks.map((chunk) => chunk.generateMarchingCubes())
    );

    this.renderer.vaoManager.createTerrainVAO(
      WorldUtils.genTerrainVertices(this.world)
    );
    this.world.onObjectAdded = (obj: WorldObject) => {
      this.world.objectUI.setupObjectUI(
        obj,
        this.world,
        document.getElementById("world-objects")!,
        this.world.objectUI
      );
      this.renderer.vaoManager.createWorldObjectVAOs(this.world.worldObjects);
    };

    // Add a gear object
    const mesh = await threemfToMesh(gearModelUrl);
    const identity2 = mat4.create();
    mat4.identity(identity2);
    this.world.addObject(mesh, identity2, "Gear");

    this.pathTracer.initBVH(this.world.combinedMesh());
    this.pathTracer.init(false);
    this.worldInitialized = true;
    this.canvas.style.display = "block";
    document.getElementById("loadingBox")!.style.display = "none";
  }
  /**
   * Our Game Loop - Run once every frame (capped at max framerate)
   */
  tick(timestamp: number) {
    if (
      timestamp - this.lastRenderTime < this.frameInterval ||
      this.mode == -1
    ) {
      return;
    }
    const timePassed = timestamp - this.lastRenderTime;
    this.lastRenderTime = timestamp;
    if (this.worldInitialized) {
      if (GameEngine.getLockedElement()) {
        this.updateCamera(timePassed);
      }

      if (this.mode == 0) {
        this.renderer.render();
      } else {
        this.pathTracer.render(timestamp);
        //this.mode=-1;
      }
    }
    this.frameCounter += 1;
    if (Date.now() - this.lastFPSCheck >= 1000) {
      this.currentFPS =
        this.frameCounter / ((Date.now() - this.lastFPSCheck) / 1000);
      this.lastFPSCheck = Date.now();
      this.frameCounter = 0;
    }
    this.debug.update();
  }

  /**
   * Controls to move the camera!
   */
  updateCamera(time: number) {
    let velocity = this.mainCamera.speed * time;
    let movement = vec3.create();
    let oldCamPos: vec3 = vec3.create();
    vec3.copy(oldCamPos, this.mainCamera.position);

    //scaleAndAdd simply adds the second operand by a scaler. Basically just +=camera.front*velocity
    if (this.keys["KeyF"]) velocity *= 4;
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

    if (!vec3.equals(this.mainCamera.position, oldCamPos)) {
      this.pathTracer.resetAccumulation();
    }
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
  /**
   * Requests a pointer lock on the game
   */
  requestScreenLock() {
    this.canvas.requestPointerLock();
    document.getElementById("body")!.requestFullscreen();
  }
  /**
   * To measure the movement of the mouse
   */
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
      this.pathTracer.resetAccumulation();
    }
  }
  /**
   * Resize the canvas to fill screen at all times
   */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.renderer.resizeGBuffer(this.canvas.width, this.canvas.height);
    this.pathTracer.resetAccumulation();
  }

  /**
   * Use when you want to see if the screen is locked or not
   * @returns HTML Element (The locked element)
   */
  static getLockedElement() {
    return document.pointerLockElement;
  }
  static toRadians(degrees: number) {
    return degrees * (Math.PI / 180);
  }
}
