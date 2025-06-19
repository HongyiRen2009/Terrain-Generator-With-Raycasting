// Ik this code is a lot of repeat from code in other places, but I do have some things I plan on doing which would make me using the other code less desirable for this purpose

import { mat4, vec2, vec3 } from "gl-matrix";
import { WorldMap } from "../map/Map";
import { Mesh } from "../map/Mesh";
import { Camera } from "../render/Camera";
import { Shader } from "../render/Shader";
import { GlUtils } from "../render/GlUtils";
import { DebugMenu } from "../DebugMenu";
import {
  pathTracingFragmentShaderCode,
  pathTracingVertexShaderCode
} from "./glslPath";
import { BVHUtils } from "../map/BVHUtils";
import { copyFragmentShader, copyVertexShader } from "./copyShader";

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
  private meshShader: Shader;
  private copyShader: Shader;

  //Information
  private vertices: Float32Array;
  private terrains: Float32Array;
  private boundingBoxes: Float32Array;
  private nodes: Float32Array;
  private leafs: Float32Array;
  private terrainTypes: Float32Array;
  private vertexNormals: Float32Array;

  //Classes
  private world: WorldMap;
  private camera: Camera;
  private debug: DebugMenu;

  public constructor(
    canvas: HTMLCanvasElement,
    context: WebGL2RenderingContext,
    world: WorldMap,
    camera: Camera,
    debug: DebugMenu
  ) {
    this.canvas = canvas;
    this.gl = context;
    this.world = world;
    this.camera = camera;
    this.debug = debug;
    //this.gl.enable(this.gl.BLEND);
    this.debug.addElement("Frame",()=>this.frameNumber)

    //Enable float texture writing extention
    const float_render_ext = this.gl.getExtension('EXT_color_buffer_float');
    if (!float_render_ext) {
        // This is a fatal error. The browser/GPU doesn't support the required extension.
        // You should inform the user gracefully.
        alert("Error: Floating point render targets are not supported on this browser/GPU.");
        throw new Error("EXT_color_buffer_float not supported");
    }

    //shader
    this.meshShader = new Shader(
      this.gl,
      pathTracingVertexShaderCode,
      pathTracingFragmentShaderCode
    );
    this.copyShader = new Shader(
      this.gl,
      copyVertexShader,
      copyFragmentShader
    )

    ////////////////////// build flat BVH structure
    //Get main mesh
    let mainMesh = new Mesh();

    for (const chunk of this.world.chunks) {
      const triangleMesh = chunk.CreateMarchingCubes();
      triangleMesh.translate(
        vec3.fromValues(chunk.ChunkPosition[0], 0, chunk.ChunkPosition[1])
      );
      mainMesh.merge(triangleMesh);
    }
    //Obtain bvh from mesh.
    const BVHtriangles = mainMesh.exportBVHTriangles();
    const BVHtree = Mesh.exportBVH(BVHtriangles);
    const flatBVHtree = Mesh.flattenBVH(BVHtree);
    console.log(BVHtree);
    console.log(flatBVHtree);

    ////////////// Pack everything float format to send to glsl
    //Pack triangles
    const { vertices, terrains, normals } = BVHUtils.packTriangles(
      mainMesh.mesh,
      mainMesh.type,
      mainMesh.normals
    );
    console.log(vertices);
    console.log(terrains);
    //Pack BVH
    const { boundingBoxes, nodes, leafs } = BVHUtils.packBVH(flatBVHtree);
    console.log(boundingBoxes);
    console.log(nodes);
    console.log(leafs);
    //Pack terrain Types
    const terrainTypes = BVHUtils.packTerrainTypes();
    console.log(terrainTypes);
    //save
    this.vertices = vertices;
    this.terrains = terrains;
    this.boundingBoxes = boundingBoxes;
    this.nodes = nodes;
    this.leafs = leafs;
    this.terrainTypes = terrainTypes;
    this.vertexNormals = normals;

    this.init();
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

    //Put camera position, direction in shader
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.meshShader.Program!, "u_cameraPos"),
      this.camera.position
    );
    const viewProjMatrix = this.camera.calculateProjectionMatrix(
      this.canvas.width,
      this.canvas.height
    );
    const invViewProjMatrix = mat4.create();
    mat4.invert(invViewProjMatrix, viewProjMatrix);
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(
        this.meshShader.Program!,
        "u_invViewProjMatrix"
      ), 
      false, 
      invViewProjMatrix
    );
    const resolution = vec2.create();
    resolution[0] = this.canvas.width;
    resolution[1] = this.canvas.height;
    this.gl.uniform2fv(this.gl.getUniformLocation(this.meshShader.Program!,"u_resolution"), resolution);

    //put lights in the shader
    GlUtils.updateLights(this.gl, this.meshShader.Program!, this.world.lights);

    //Bind Previous Frame
    const lastFrameIndex = this.currentFrame;
    const nextFrameIndex = (this.currentFrame + 1) % 2;

    this.gl.activeTexture(this.gl.TEXTURE8); // Use a new texture unit
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.accumulationTextures[lastFrameIndex]);
    const lastFrameLoc = this.gl.getUniformLocation(this.meshShader.Program!, "u_lastFrame");
    this.gl.uniform1i(lastFrameLoc, 8);
    

    //put samples, bounce in shader
    this.frameNumber++;
    this.gl.uniform1i(this.gl.getUniformLocation(this.meshShader.Program!,"numBounces"), 5);
    this.gl.uniform1f(this.gl.getUniformLocation(this.meshShader.Program!,"u_frameNumber"), this.frameNumber); // Send as a float for seeding

    // Draw
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffers[nextFrameIndex]);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

    //Ping Pong
    this.currentFrame = nextFrameIndex;

    //Draw to canvas using copy shader
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.useProgram(this.copyShader.Program!);
    
    GlUtils.bindTex(this.gl,this.copyShader.Program!, this.accumulationTextures[nextFrameIndex],"u_sourceTexture",0);
    const frameLoc = this.gl.getUniformLocation(this.copyShader.Program!, "u_frameNumber");
    this.gl.uniform1f(frameLoc, this.frameNumber);

    // We can reuse the same fullscreen triangle VAO
    this.gl.clearColor(0, 0, 0, 1); // Clear the actual screen
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

  }

  public makeVao() {
    const fullscreenTriangle = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(vao);

    const vbo = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      fullscreenTriangle,
      this.gl.STATIC_DRAW
    );

    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
  }

  public init() {
    this.initPathtracing();
    this.makeVao();
    this.resetAccumulation();
  }

  private initPathtracing(){
    this.gl.useProgram(this.meshShader.Program!);
    //Textures
    let verticeTex = GlUtils.packFloatArrayToTexture(this.gl, this.vertices);
    let terrainTex = GlUtils.packFloatArrayToTexture(this.gl, this.terrains);
    let boundingBoxesTex = GlUtils.packFloatArrayToTexture(
      this.gl,
      this.boundingBoxes
    );
    let nodesTex = GlUtils.packFloatArrayToTexture(this.gl, this.nodes);
    let leafsTex = GlUtils.packFloatArrayToTexture(this.gl, this.leafs);
    let terrainTypeTex = GlUtils.packFloatArrayToTexture(
      this.gl,
      this.terrainTypes
    );
    let vertexNormalsTex = GlUtils.packFloatArrayToTexture(
      this.gl,
      this.vertexNormals
    );

    GlUtils.bindTex(this.gl, this.meshShader.Program!, verticeTex, "u_vertices", 0);
    GlUtils.bindTex(this.gl, this.meshShader.Program!, terrainTex, "u_terrains", 1);
    GlUtils.bindTex(
      this.gl,
      this.meshShader.Program!,
      boundingBoxesTex,
      "u_boundingBox",
      2
    );
    GlUtils.bindTex(this.gl, this.meshShader.Program!, nodesTex, "u_nodesTex", 3);
    GlUtils.bindTex(this.gl, this.meshShader.Program!, leafsTex, "u_leafsTex", 4);
    GlUtils.bindTex(
      this.gl,
      this.meshShader.Program!,
      terrainTypeTex,
      "u_terrainTypes",
      5
    );
    GlUtils.bindTex(
      this.gl,
      this.meshShader.Program!,
      vertexNormalsTex,
      "u_normals",
      6
    );
  }

  private initBuffers(){
    this.accumulationTextures = [];
    this.framebuffers = [];
    for (let i = 0; i < 2; ++i) {
        // Create a texture to store the accumulated image
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.RGBA32F,
            this.canvas.width, this.canvas.height, 0,
            this.gl.RGBA, this.gl.FLOAT, null
        );
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.accumulationTextures.push(texture);

        // Create a framebuffer and attach the texture to it
        const fbo = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0
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
