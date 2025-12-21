// Ik this code is a lot of repeat from code in other places, but I do have some things I plan on doing which would make me using the other code less desirable for this purpose

import { mat4, vec2, vec3 } from "gl-matrix";
import { WorldMap } from "../map/Map";
import { Mesh } from "../map/Mesh";
import { Camera } from "../render/Camera";
import { RenderUtils } from "../utils/RenderUtils";
import { TextureUtils } from "../utils/TextureUtils";
import { WorldUtils } from "../utils/WorldUtils";
import { DebugMenu } from "../DebugMenu";
import pathTracingFragmentShaderCode from "./glsl/pathtracerShader/path.frag";
import pathTracingVertexShaderCode from "./glsl/pathtracerShader/path.vert";
import { BVHUtils } from "../map/BVHUtils";
import copyFragmentShader from "./glsl/copyShader/copy.frag";
import copyVertexShader from "./glsl/copyShader/copy.vert";
import { GLRenderer } from "../render/GLRenderer";
import { NoiseGenerator } from "../render/passes/CloudsPass";
import { Terrains } from "../map/terrains";
import { SettingsManager } from "../Settings";

export class PathTracer {
  //Rendering
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  // Accumulation stuff
  private framebuffers: WebGLFramebuffer[] = [];
  private accumulationTextures: WebGLTexture[] = [];
  private currentFrame = 0; // The source texture/framebuffer index
  private frameNumber = 0; // The accumulation counter
  //Shaders
  private meshProgram: WebGLProgram;
  private copyProgram: WebGLProgram;

  private fullscreenVAO: WebGLVertexArrayObject | null = null;
  private fullscreenVBO: WebGLBuffer | null = null;

  //Information
  private vertices: Float32Array = null!;
  private terrains: Float32Array = null!;
  private boundingBoxes: Float32Array = null!;
  // BVH
  private nodes: Float32Array = null!;
  private leafs: Float32Array = null!;
  // Terrain Info
  private terrainTypes: Float32Array = null!;
  private vertexNormals: Float32Array = null!;

  //Classes
  private world: WorldMap;
  private camera: Camera;
  private debug: DebugMenu;
  private glRenderer: GLRenderer;
  private noiseGenerator: NoiseGenerator;

  //textures
  private vertexTex?: WebGLTexture;
  private terrainTex?: WebGLTexture;
  private boundingBoxesTex?: WebGLTexture;
  private nodesTex?: WebGLTexture;
  private leafsTex?: WebGLTexture;
  private terrainTypeTex?: WebGLTexture;
  private vertexNormalsTex?: WebGLTexture;
  private noiseTexture?: WebGLTexture;
  private weatherMapTexture?: WebGLTexture;

  public constructor(
    canvas: HTMLCanvasElement,
    context: WebGL2RenderingContext,
    world: WorldMap,
    camera: Camera,
    glRenderer: GLRenderer,
    debug: DebugMenu
  ) {
    this.canvas = canvas;
    this.gl = context;
    this.world = world;
    this.camera = camera;
    this.glRenderer = glRenderer;
    this.debug = debug;
    this.noiseGenerator=new NoiseGenerator(this.gl);
    this.gl.enable(this.gl.BLEND);

    //Enable float texture writing extention
    const float_render_ext = this.gl.getExtension("EXT_color_buffer_float");
    if (!float_render_ext) {
      alert(
        "Error: Floating point render targets are not supported on this browser/GPU."
      );
      throw new Error("EXT_color_buffer_float not supported");
    }

    //Shaders
    this.meshProgram = RenderUtils.CreateProgram(
      this.gl,
      pathTracingVertexShaderCode,
      pathTracingFragmentShaderCode
    )!;
    this.copyProgram = RenderUtils.CreateProgram(
      this.gl,
      copyVertexShader,
      copyFragmentShader
    )!;

    this.initSettingsSection();
  }
  public initBVH(mainMesh: Mesh) {
    ////////////////////// build flat BVH structure
    //Obtain bvh from mesh.
    const BVHtriangles = mainMesh.exportBVHTriangles();
    const BVHtree = Mesh.exportBVH(BVHtriangles);
    const flatBVHtree = Mesh.flattenBVH(BVHtree);

    ////////////// Pack everything float format to send to glsl
    //Pack triangles
    const { vertices, terrains, normals } = BVHUtils.packTriangles(
      mainMesh.mesh,
      mainMesh.type,
      mainMesh.normals
    );
    //Pack BVH
    const { boundingBoxes, nodes, leafs } = BVHUtils.packBVH(flatBVHtree);
    //Pack terrain Types
    const terrainTypes = BVHUtils.packTerrainTypes();
    //save
    this.vertices = vertices;
    this.terrains = terrains;
    this.boundingBoxes = boundingBoxes;
    this.nodes = nodes;
    this.leafs = leafs;
    this.terrainTypes = terrainTypes;
    this.vertexNormals = normals;
  }
  public render(time: number) {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    //const resScaleFactor = 1 / (this.world.resolution / 4);
    this.drawMesh();
  }

  public drawMesh() {
    this.setupFrame();

    //Put camera position, direction in shader
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.meshProgram, "u_cameraPos"),
      this.camera.position
    );
    const viewProjMatrix = this.camera.calculateProjectionMatrix(
      this.canvas.width,
      this.canvas.height
    );
    const invViewProjMatrix = mat4.create();
    mat4.invert(invViewProjMatrix, viewProjMatrix);
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(this.meshProgram, "u_invViewProjMatrix"),
      false,
      invViewProjMatrix
    );
    const resolution = vec2.create();
    resolution[0] = this.canvas.width;
    resolution[1] = this.canvas.height;
    this.gl.uniform2fv(
      this.gl.getUniformLocation(this.meshProgram, "u_resolution"),
      resolution
    );

    //put lights in the shader
    WorldUtils.updateLights(this.gl, this.meshProgram, this.world.lights, this.world.sunLight);

    //Bind Previous Frame
    const lastFrameIndex = this.currentFrame;
    const nextFrameIndex = (this.currentFrame + 1) % 2;

    this.gl.activeTexture(this.gl.TEXTURE8); // Use a new texture unit
    this.gl.bindTexture(
      this.gl.TEXTURE_2D,
      this.accumulationTextures[lastFrameIndex]
    );
    const lastFrameLoc = this.gl.getUniformLocation(
      this.meshProgram,
      "u_lastFrame"
    );
    this.gl.uniform1i(lastFrameLoc, 8);

    //put samples, bounce in shader
    SettingsManager.instance.updateProgramUniforms(this.gl,this.meshProgram);
    this.frameNumber++;
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.meshProgram, "u_frameNumber"),
      this.frameNumber
    ); // Send as a float for seeding
    //Sun Color
    this.gl.uniform3fv(this.gl.getUniformLocation(this.meshProgram, "u_sunColor"),vec3.fromValues(1.0,0.95,0.9))

    // Draw
    this.gl.bindFramebuffer(
      this.gl.FRAMEBUFFER,
      this.framebuffers[nextFrameIndex]
    );
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

    //Ping Pong
    this.currentFrame = nextFrameIndex;

    //Draw to canvas using copy shader
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.useProgram(this.copyProgram);

    TextureUtils.bindTex(
      this.gl,
      this.copyProgram,
      this.accumulationTextures[nextFrameIndex],
      "u_sourceTexture",
      0
    );
    const frameLoc = this.gl.getUniformLocation(
      this.copyProgram,
      "u_frameNumber"
    );
    this.gl.uniform1f(frameLoc, this.frameNumber);

    // We can reuse the same fullscreen triangle VAO
    this.gl.clearColor(0, 0, 0, 1); // Clear the actual screen
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    this.gl.bindVertexArray(null);
    //draw other shaders
    this.glRenderer.render(true);
  }

  public makeVao() {
    if (this.fullscreenVAO) return; // Already created once

    const fullscreenTriangle = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(vao);

    const vbo = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, fullscreenTriangle, this.gl.STATIC_DRAW);

    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);

    this.fullscreenVAO = vao;
    this.fullscreenVBO = vbo;

    // Unbind to avoid polluting other pipelines
    this.gl.bindVertexArray(null);
  }

  public init(showAccumulation: boolean = true) {
    if (showAccumulation){
      this.debug.addElement("Accumulation Frame", () => this.frameNumber);
      this.camera.farPlane = this.camera.pathtracingFarPlane;
    }
    this.initBVHTextures();
    this.setupFrame();
    this.makeVao();
    this.resetAccumulation();
  }
  public leave() {
    this.debug.removeElement("Accumulation Frame");
    this.camera.farPlane = this.camera.rayTracingFarPlane;
  }
  private initBVHTextures() {
    this.vertexTex = TextureUtils.packFloatArrayToTexture(this.gl, this.vertices);
    this.terrainTex = TextureUtils.packFloatArrayToTexture(this.gl, this.terrains);
    this.boundingBoxesTex = TextureUtils.packFloatArrayToTexture(this.gl, this.boundingBoxes);
    this.nodesTex = TextureUtils.packFloatArrayToTexture(this.gl, this.nodes);
    this.leafsTex = TextureUtils.packFloatArrayToTexture(this.gl, this.leafs);
    this.terrainTypeTex = TextureUtils.packFloatArrayToTexture(this.gl, this.terrainTypes);
    this.vertexNormalsTex = TextureUtils.packFloatArrayToTexture(this.gl, this.vertexNormals);

    //clouds
    this.noiseTexture = this.noiseGenerator.generateCloudNoiseTex(32);
    this.weatherMapTexture = this.noiseGenerator.generateWeatherMap(128);
  }

  private setupFrame() {
    this.gl.useProgram(this.meshProgram);
    const ext = this.gl.getExtension("EXT_color_buffer_float");
    if (!ext) console.warn("No float render targets available.");
    //Textures
    TextureUtils.bindTex(this.gl, this.meshProgram, this.vertexTex!, "u_vertices", 0);
    TextureUtils.bindTex(this.gl, this.meshProgram, this.terrainTex!, "u_terrains", 1);
    TextureUtils.bindTex(this.gl, this.meshProgram, this.boundingBoxesTex!, "u_boundingBox", 2);
    TextureUtils.bindTex(this.gl, this.meshProgram, this.nodesTex!, "u_nodesTex", 3);
    TextureUtils.bindTex(this.gl, this.meshProgram, this.leafsTex!, "u_leafsTex", 4);
    TextureUtils.bindTex(this.gl, this.meshProgram, this.terrainTypeTex!, "u_terrainTypes", 5);
    TextureUtils.bindTex(this.gl, this.meshProgram, this.vertexNormalsTex!, "u_normals", 6);

    this.gl.activeTexture(this.gl.TEXTURE7);
    this.gl.bindTexture(this.gl.TEXTURE_3D, this.noiseTexture!);
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.meshProgram, "u_CloudNoise"),
      7
    );
    TextureUtils.bindTex(this.gl, this.meshProgram, this.weatherMapTexture!, "u_WeatherMap", 8);

    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.meshProgram, "u_cloudsCubeMin"),
      vec3.fromValues(-300, 100, -300)
    );
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.meshProgram, "u_cloudsCubeMax"),
      vec3.fromValues(300, 160, 300)
    );

    this.gl.uniform1i(
      this.gl.getUniformLocation(this.meshProgram, "u_numTerrains"),
      Object.keys(Terrains).length
    );
    //VAO
    this.gl.bindVertexArray(this.fullscreenVAO);
  }

  private initBuffers() {
    this.accumulationTextures = [];
    this.framebuffers = [];
    for (let i = 0; i < 2; ++i) {
      // Create a texture to store the accumulated image
      const texture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA32F,
        this.canvas.width,
        this.canvas.height,
        0,
        this.gl.RGBA,
        this.gl.FLOAT,
        null
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_MIN_FILTER,
        this.gl.NEAREST
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_MAG_FILTER,
        this.gl.NEAREST
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_S,
        this.gl.CLAMP_TO_EDGE
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_T,
        this.gl.CLAMP_TO_EDGE
      );
      this.accumulationTextures.push(texture);

      // Create a framebuffer and attach the texture to it
      const fbo = this.gl.createFramebuffer();
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        texture,
        0
      );
      this.framebuffers.push(fbo);
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null); // Unbind
  }

  public resetAccumulation() {
    this.frameNumber = 1;
    this.initBuffers();
  }

  public dispose() {
    // delete accumulation textures/framebuffers
    if (this.accumulationTextures) {
      for (const tex of this.accumulationTextures) {
        if (tex) this.gl.deleteTexture(tex);
      }
      this.accumulationTextures = [];
    }
    if (this.framebuffers) {
      for (const fbo of this.framebuffers) {
        if (fbo) this.gl.deleteFramebuffer(fbo);
      }
      this.framebuffers = [];
    }
    // delete programs
    if (this.meshProgram) this.gl.deleteProgram(this.meshProgram);
    if (this.copyProgram) this.gl.deleteProgram(this.copyProgram);
    // delete fullscreen VAO/VBO
    if (this.fullscreenVAO) {
      this.gl.deleteVertexArray(this.fullscreenVAO);
      this.fullscreenVAO = null;
    }
    if (this.fullscreenVBO) {
      this.gl.deleteBuffer(this.fullscreenVBO);
      this.fullscreenVBO = null;
    }
  }

  private initSettingsSection() {
    SettingsManager.instance.createSection(
      document.getElementById("settings-section")!,
      "Pathtracer Settings"
    );
    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "numBounces",
      label: "Maximum Number of Bounces",
      min: 1,
      max: 20,
      step: 1,
      defaultValue: 15,
      numType: "int"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "sunDirX",
      label: "Sun X Direction",
      min: -1,
      max: 1,
      step: 0.01,
      defaultValue: 1.0,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "sunDirY",
      label: "Sun Y Direction",
      min: -1,
      max: 1,
      step: 0.01,
      defaultValue: -1.0,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "sunDirZ",
      label: "Sun Z Direction",
      min: -1,
      max: 1,
      step: 0.01,
      defaultValue: 0.0,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "u_sunIntensity",
      label: "Sun Intensity",
      min: 0,
      max: 20,
      step: 0.1,
      defaultValue: 4,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "u_sunAngularRadius",
      label: "Sun Angular Radius",
      min: 0.01,
      max: 1,
      step: 0.001,
      defaultValue: 0.1,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "u_redScatter",
      label: "Red Scattering in the Sky",
      min: 0,
      max: 100,
      step: 0.1,
      defaultValue: 5.5,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "u_greenScatter",
      label: "Green Scattering in the Sky",
      min: 0,
      max: 100,
      step: 0.1,
      defaultValue: 13.0,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "u_blueScatter",
      label: "Blue Scattering in the Sky",
      min: 0,
      max: 100,
      step: 0.1,
      defaultValue: 33.1,
      numType: "float"
    });

    SettingsManager.instance.addCheckboxToSection("Pathtracer Settings", {
      id: "CLOUDS_enableClouds",
      label: "Enable Clouds",
      defaultValue: true
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "CLOUDS_MAX_STEPS",
      label: "Cloud Ray Marching Max Steps",
      min: 8,
      max: 1024,
      step: 1,
      defaultValue: 64,
      numType: "int"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "CLOUDS_MAX_STEPS_LIGHT",
      label: "Cloud Light Ray Marching Max Steps",
      min: 4,
      max: 128,
      step: 1,
      defaultValue: 8,
      numType: "int"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "CLOUDS_weatherMapOffsetX",
      label: "Cloud Weather Map Offset X",
      min: 0.0,
      max: 10.0,
      step: 0.01,
      defaultValue: 0.0,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "CLOUDS_weatherMapOffsetY",
      label: "Cloud Weather Map Offset Y",
      min: 0.0,
      max: 10.0,
      step: 0.01,
      defaultValue: 0.0,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "CLOUDS_absorption",
      label: "Cloud Absorption",
      min: 0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "CLOUDS_densityThreshold",
      label: "Cloud Density Threshold",
      min: -2.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.09,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "CLOUDS_baseFrequency",
      label: "Cloud Base Frequency",
      min: 0.01,
      max: 0.5,
      step: 0.001,
      defaultValue: 0.45,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "CLOUDS_detailFrequency",
      label: "Cloud Detail Frequency",
      min: 0.1,
      max: 0.5,
      step: 0.001,
      defaultValue: 0.46,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "CLOUDS_lightAbsorption",
      label: "Cloud Light Absorption",
      min: 0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "CLOUDS_lightIntensity",
      label: "Cloud Light Intensity",
      min: 0,
      max: 5.0,
      step: 0.01,
      defaultValue: 2.4,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "CLOUDS_ambientIntensity",
      label: "Cloud Ambient Intensity",
      min: 0,
      max: 2.0,
      step: 0.01,
      defaultValue: 0.5,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "CLOUDS_darknessThreshold",
      label: "Cloud Darkness Threshold",
      min: 0.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.2,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "CLOUDS_phaseG",
      label: "Cloud Phase Function g",
      min: -1.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.5,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Pathtracer Settings",{
      id: "CLOUDS_phaseMultiplier",
      label: "Cloud Phase Function Multiplier",
      min: 0.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.5,
      numType: "float"
    });

    // Attach program uniforms for all settings
    SettingsManager.instance.attatchProgram(this.meshProgram, [
      "numBounces",
      "sunDirX",
      "sunDirY",
      "sunDirZ",
      "u_sunIntensity",
      "u_sunAngularRadius",
      "u_redScatter",
      "u_greenScatter",
      "u_blueScatter",
      "CLOUDS_enableClouds",
      "CLOUDS_MAX_STEPS",
      "CLOUDS_MAX_STEPS_LIGHT",
      "CLOUDS_weatherMapOffsetX",
      "CLOUDS_weatherMapOffsetY",
      "CLOUDS_absorption",
      "CLOUDS_densityThreshold",
      "CLOUDS_baseFrequency",
      "CLOUDS_detailFrequency",
      "CLOUDS_lightAbsorption",
      "CLOUDS_lightIntensity",
      "CLOUDS_ambientIntensity",
      "CLOUDS_darknessThreshold",
      "CLOUDS_phaseG",
      "CLOUDS_phaseMultiplier"
    ]);
  }
}