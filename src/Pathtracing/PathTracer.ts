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

export class PathTracer {
  //Rendering
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  // Accumulation stuff
  private framebuffers: WebGLFramebuffer[] = [];
  private accumulationTextures: WebGLTexture[] = [];
  private currentFrame = 0; // The source texture/framebuffer index
  private frameNumber = 0; // The accumulation counter
  private numBounces = 15;
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
    //Slider
    const slider = document.getElementById("bounceSlider")! as HTMLInputElement;

    slider.addEventListener("input", this.handleBounceInput.bind(this));
    slider.value = this.numBounces.toString();
    const bounceValue = document.getElementById(
      "bounceValue"
    )! as HTMLSpanElement;
    bounceValue.textContent = `${this.numBounces}`;
  }

  private handleBounceInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = parseInt(target.value);
    this.numBounces = newValue;
    const bounceValue = document.getElementById(
      "bounceValue"
    )! as HTMLSpanElement;
    bounceValue.textContent = newValue.toString();
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
    this.initPathtracing();
    this.gl.bindVertexArray(this.fullscreenVAO);

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
    WorldUtils.updateLights(this.gl, this.meshProgram, this.world.lights);

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
    this.frameNumber++;
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.meshProgram, "numBounces"),
      this.numBounces
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.meshProgram, "u_frameNumber"),
      this.frameNumber
    ); // Send as a float for seeding

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
    this.initPathtracing();
    this.makeVao();
    this.resetAccumulation();
  }
  public leave() {
    this.debug.removeElement("Accumulation Frame");
    this.camera.farPlane = this.camera.rayTracingFarPlane;
  }

  private initPathtracing() {
    this.gl.useProgram(this.meshProgram);
    //Textures
    let verticeTex = TextureUtils.packFloatArrayToTexture(
      this.gl,
      this.vertices
    );
    let terrainTex = TextureUtils.packFloatArrayToTexture(
      this.gl,
      this.terrains
    );
    let boundingBoxesTex = TextureUtils.packFloatArrayToTexture(
      this.gl,
      this.boundingBoxes
    );
    let nodesTex = TextureUtils.packFloatArrayToTexture(this.gl, this.nodes);
    let leafsTex = TextureUtils.packFloatArrayToTexture(this.gl, this.leafs);
    let terrainTypeTex = TextureUtils.packFloatArrayToTexture(
      this.gl,
      this.terrainTypes
    );
    let vertexNormalsTex = TextureUtils.packFloatArrayToTexture(
      this.gl,
      this.vertexNormals
    );

    TextureUtils.bindTex(
      this.gl,
      this.meshProgram,
      verticeTex,
      "u_vertices",
      0
    );
    TextureUtils.bindTex(
      this.gl,
      this.meshProgram,
      terrainTex,
      "u_terrains",
      1
    );
    TextureUtils.bindTex(
      this.gl,
      this.meshProgram,
      boundingBoxesTex,
      "u_boundingBox",
      2
    );
    TextureUtils.bindTex(this.gl, this.meshProgram, nodesTex, "u_nodesTex", 3);
    TextureUtils.bindTex(this.gl, this.meshProgram, leafsTex, "u_leafsTex", 4);
    TextureUtils.bindTex(
      this.gl,
      this.meshProgram,
      terrainTypeTex,
      "u_terrainTypes",
      5
    );
    TextureUtils.bindTex(
      this.gl,
      this.meshProgram,
      vertexNormalsTex,
      "u_normals",
      6
    );
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
    this.frameNumber = 0;
    this.initBuffers();
  }
}
