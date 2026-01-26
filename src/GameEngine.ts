import { mat3, mat4, vec3 } from "gl-matrix";
import { DebugMenu } from "./DebugMenu";
import { Chunk, WorldMap } from "./map/Map";
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
import { SettingsManager } from "./Settings";

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
  private lastRenderTime: number = 0;
  private mode: number = 0; // 0 for hybrid, 1 for pathtracer, -1 for off

  //
  private frameCounter: number = 0; // In the current FPS
  private lastFPSCheck: number = 0;
  private currentFPS: number = 0;

  private worldInitialized = false;
  private renderDistance = 3; // In chunks
  private lastCameraChunk: vec3 = vec3.fromValues(-1, -1, -1);
  private updatePathracing: () => void;
  private pathtracerUpdated: boolean = false;
  // Stored bound event handlers for cleanup
  private boundMouseDown: ((e?: any) => void) | null = null;
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundResize: (() => void) | null = null;
  private boundRayClick: (() => void) | null = null;
  private boundPathClick: (() => void) | null = null;
  private boundMenuClick: (() => void) | null = null;
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundKeyUp: ((e: KeyboardEvent) => void) | null = null;
  /**
   * Constructs game engine
   * @param canvasId The ID of the canvas rendered to
   * @returns
   */
  constructor(canvas: HTMLCanvasElement) {
    //Debugger
    this.debug = new DebugMenu(true); // Pass into class when want to use

    this.canvas = canvas;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.display = "none";
    this.initWorldSettings();

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

    this.updatePathracing = () => { };

    //Initialize world
    // Increase world height to allow taller mountains (was 64)
    this.world = new WorldMap(
      1000,
      160,
      1000,
      this.gl,
      () => this.updatePathracing
    );

    //Initialize Camera
    this.mainCamera = new Camera(vec3.fromValues(500, 50, 500));
    this.lastCameraChunk = this.world.getChunkCoordsFromPosition(
      this.mainCamera.position
    );
    //Initial pathTracer
    this.pathTracer = new PathTracer(
      this.canvas,
      this.gl,
      this.world,
      this.mainCamera,
      this.debug
    );
    //Initialize Renderer
    this.renderer = new GLRenderer(
      this.gl,
      this.canvas,
      this.mainCamera,
      this.debug,
      this.world,
      this.pathTracer
    );

    this.updatePathracing = () => {
      if (!this.pathtracerUpdated) {
        this.pathtracerUpdated = true;
        this.pathTracer.initBVH(this.world.combinedMesh());
      }
      this.pathTracer.init(false);
    };

    //Events
    this.boundMouseDown = () => this.requestScreenLock();
    this.boundMouseMove = (e: MouseEvent) => this.mouseMove(e);
    this.boundResize = () => this.resizeCanvas();
    this.canvas.addEventListener("mousedown", this.boundMouseDown);
    this.canvas.addEventListener("mousemove", this.boundMouseMove);
    window.addEventListener("resize", this.boundResize);

    //Debugging
    this.debug.addElement("FPS", () => Math.round(this.currentFPS));
    this.debug.addElement("#Types", () => Object.keys(Terrains).length);

    //Initialize switcher
    const rayBtn = document.getElementById("raytracing")!;
    const pathBtn = document.getElementById("pathtracing")!;

    this.boundRayClick = () => {
      rayBtn.classList.add("active");
      pathBtn.classList.remove("active");
      if (this.mode == 1) {
        this.pathTracer.leave();
      }
      this.mode = 0; // Set to raytracing
    };
    rayBtn.addEventListener("click", this.boundRayClick);

    this.boundPathClick = () => {
      pathBtn.classList.add("active");
      rayBtn.classList.remove("active");
      this.mode = 1; // Set to pathtracing
      this.pathTracer.initBVH(this.world.combinedMesh());
      this.pathTracer.init();
    };
    pathBtn.addEventListener("click", this.boundPathClick);

    //Initialize menu
    const menuButton = document.getElementById("menu-toggle")!;
    const sidebar = document.getElementById("sidebar")!;
    const topBar = document.getElementById("topBarWrapper")!;

    this.boundMenuClick = () => {
      sidebar.classList.toggle("open");
      topBar.classList.toggle("shifted");
    };
    menuButton.addEventListener("click", this.boundMenuClick);

    //Check to see if WebGL working
    if (!this.gl) {
      alert(
        "Unable to initialize WebGL. Your browser or machine may not support it."
      );
      return;
    }

    this.initialize();
  }

  /**
   * Dispose engine resources and remove DOM / event hooks.
   */
  public dispose(): void {
    // Remove event listeners
    try {
      if (this.boundMouseDown)
        this.canvas.removeEventListener("mousedown", this.boundMouseDown);
      if (this.boundMouseMove)
        this.canvas.removeEventListener(
          "mousemove",
          this.boundMouseMove as any
        );
      if (this.boundResize)
        window.removeEventListener("resize", this.boundResize);
      if (this.boundRayClick)
        document
          .getElementById("raytracing")
          ?.removeEventListener("click", this.boundRayClick);
      if (this.boundPathClick)
        document
          .getElementById("pathtracing")
          ?.removeEventListener("click", this.boundPathClick);
      if (this.boundMenuClick)
        document
          .getElementById("menu-toggle")
          ?.removeEventListener("click", this.boundMenuClick);
      if (this.boundKeyDown)
        window.removeEventListener("keydown", this.boundKeyDown);
      if (this.boundKeyUp) window.removeEventListener("keyup", this.boundKeyUp);
    } catch (e) {
      // ignore
    }

    // Dispose subsystems
    try {
      this.renderer.dispose();
    } catch (e) { }
    try {
      this.pathTracer.dispose();
    } catch (e) { }
  }
  public async initialize() {

    this.generateChunksAroundCamera();

    this.world.onObjectAdded = (obj: WorldObject) => {
      this.world.objectUI.setupObjectUI(
        obj,
        this.world,
        document.getElementById("world-objects")!,
        this.world.objectUI
      );
      this.renderer.vaoManager.createWorldObjectVAOs(this.world.worldObjects);
    };
    this.world.onObjectRemoved = (id: number) => {
      try {
        this.renderer.vaoManager.removeWorldObjectVAO(id);
      } catch (e) {
        // ignore
      }
    };

    // Set up light change callback and create initial light VAOs
    this.world.onLightsChanged = () => {
      this.renderer.vaoManager.createPointLightVAOs(this.world.lights);
    };
    this.renderer.vaoManager.createPointLightVAOs(this.world.lights);

    // Add a gear object
    const gearResult = await threemfToMesh(gearModelUrl);
    const gearMesh = gearResult!.mesh;
    // Note: gearResult.transform could be applied if needed, but addChunkGears applies its own transforms

    WorldUtils.addChunkGears(this.world, gearMesh);

    //this.pathTracer.initBVH(this.world.combinedMesh());
    //this.pathTracer.init(false);
    this.worldInitialized = true;
    this.canvas.style.display = "block";
    document.getElementById("loadingBox")!.style.display = "none";
  }
  private initWorldSettings() {
    SettingsManager.instance.createSection(
      document.getElementById("settings-section")!,
      "World Settings"
    );
    SettingsManager.instance.addSliderToSection("World Settings", {
      id: "Render Distance",
      label: "Render Distance",
      defaultValue: this.renderDistance,
      min: 1,
      max: 20,
      step: 1,
      numType: "int",
      onChange: (v: number) => {
        this.renderDistance = v;
        this.generateChunksAroundCamera(true
        );
      }
    });
    SettingsManager.instance.addButtonToSection("World Settings", "Regenerate Terrain", () => {
      this.generateChunksAroundCamera(true
      );
    });
  }

  /**
   * Our Game Loop - Run once every frame (capped at max framerate)
   */
  tick(timestamp: number) {
    if (this.mode == -1) {
      return;
    }
    const timePassed = timestamp - this.lastRenderTime;
    this.lastRenderTime = timestamp;
    if (this.worldInitialized) {
      if (GameEngine.getLockedElement()) {
        this.updateCamera(timePassed);
      }

      if (this.mode == 0) {
        this.renderer.render(timestamp);
      } else {
        this.renderer.render(timestamp, true);
        //this.pathTracer.render(timestamp);
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

  generateChunksAroundCamera(deleteAllChunks: boolean = false) {
    if(this.world.isGeneratingChunk) return;
    const cameraChunk = this.world.getChunkCoordsFromPosition(
      this.mainCamera.position
    );
    for (const chunkKey in this.world.chunks) {
      const chunkPos = WorldUtils.chunkKeyToPosition(chunkKey);
      const distance = Math.max(
        Math.abs(chunkPos[0] - cameraChunk[0]) / this.world.resolution,
        Math.abs(chunkPos[1] - cameraChunk[1]) / this.world.height,
        Math.abs(chunkPos[2] - cameraChunk[2]) / this.world.resolution
      );
      if (distance > this.renderDistance || deleteAllChunks) {
        this.world.unloadChunk(chunkPos);
        this.renderer.vaoManager.deleteTerrainVao(chunkKey);
      }
    }
    for (let j = -this.renderDistance; j <= this.renderDistance; j++) {
      for (let i = -this.renderDistance; i <= this.renderDistance; i++) {
        const chunkPos = vec3.fromValues(cameraChunk[0] + (i) * this.world.resolution, 0, cameraChunk[2] + (j) * this.world.resolution);
        this.world.loadChunk(chunkPos, (chunk: Chunk) => {
          if(!chunk) return;
          this.renderer.vaoManager.createTerrainVAO(chunk,WorldUtils.chunkKeyFromPosition(chunkPos, this.world));
        });
      }
    }
    this.world.processChunkQueue();
  }
  updateChunksForCamera() {
    const cameraChunk = this.world.getChunkCoordsFromPosition(
      this.mainCamera.position
    );

    if (vec3.equals(cameraChunk, this.lastCameraChunk) || this.mode != 0) {
      return;
    }
    this.lastCameraChunk = cameraChunk;
    this.generateChunksAroundCamera();
  }
  /**
   * Controls to move the camera!
   */
  updateCamera(time: number) {
    let velocity = this.mainCamera.speed * time;
    let movement = vec3.create();
    this.mainCamera.lastPosition = vec3.clone(this.mainCamera.position);

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

    if (!vec3.equals(this.mainCamera.position, this.mainCamera.lastPosition)) {
      this.pathTracer.resetAccumulation();
    }
    this.updateChunksForCamera();
  }

  addKeys() {
    this.boundKeyDown = (event: KeyboardEvent) => {
      this.keys[event.code] = true;
    };
    this.boundKeyUp = (event: KeyboardEvent) => {
      this.keys[event.code] = false;
    };
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
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
