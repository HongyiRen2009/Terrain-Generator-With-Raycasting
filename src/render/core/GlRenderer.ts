import { mat4, vec3 } from "gl-matrix";
import { glUtils } from "../utils/GlUtils";
import { Camera } from "../Camera";
import { WorldMap } from "../../map/Map";
import { DebugMenu } from "../../DebugMenu";
import { Mesh } from "../../map/Mesh";
import { WorldObject } from "../../map/WorldObject";
import { SSAOfunctions } from "./passes/SSAOPass";
import { BufferManager } from "./managers/BufferManager";
import { VAOManager } from "./managers/VAOManager";
import { geometryPass } from "./passes/geometryPass";
import { SSAOPass } from "./passes/SSAOPass";
import { lightingPass } from "./passes/lightingPass";

export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;
  TerrainMeshSize: number = 0;
  matView: mat4;
  matProj: mat4;
  matViewProj: mat4;
  debug: DebugMenu;
  world: WorldMap;
  
  // Managers
  bufferManager: BufferManager;
  vaoManager: VAOManager;
  
  // Passes
  geometryPass: geometryPass;
  ssaoPass: SSAOPass;
  lightingPass: lightingPass;
  
  // SSAO functions
  ssaoFunctions: SSAOfunctions;
  
  
  
  constructor(
    gl: WebGL2RenderingContext,
    canvas: HTMLCanvasElement,
    camera: Camera,
    debug: DebugMenu,
    world: WorldMap
  ) {
    this.gl = gl;
    this.canvas = canvas;
    this.camera = camera;
    this.debug = debug;
    this.world = world;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // Ensures closer objects are drawn in front

    this.matView = mat4.create();
    this.matProj = mat4.create();
    this.matViewProj = mat4.create();

    this.gl.getExtension("EXT_color_buffer_float");
    
    // Initialize managers
    this.bufferManager = new BufferManager(gl, canvas);
    this.vaoManager = new VAOManager(gl);
    
    // Initialize passes
    this.geometryPass = new geometryPass(gl);
    this.ssaoPass = new SSAOPass(gl);
    this.lightingPass = new lightingPass(gl);
    
    // Initialize SSAO functions
    this.ssaoFunctions = new SSAOfunctions(gl);
    
    this.initializeFramebuffers();
  }
  
  connectComponents() {
    // Connect buffer manager properties to passes
    this.geometryPass.gBuffer = this.bufferManager.gBuffer;
    this.geometryPass.terrainVAO = this.vaoManager.terrainVAO;
    this.geometryPass.TerrainMeshSize = this.bufferManager.TerrainMeshSize;
    this.geometryPass.matView = this.matView;
    this.geometryPass.matProj = this.matProj;
    
    this.ssaoPass.gBuffer = this.bufferManager.gBuffer;
    this.ssaoPass.SSAOFramebuffer = this.bufferManager.SSAOFramebuffer;
    this.ssaoPass.QuadVAO = this.vaoManager.QuadVAO;
    this.ssaoPass.SSAONoiseTexture = this.ssaoFunctions.SSAONoiseTexture;
    this.ssaoPass.SSAOKernel = this.ssaoFunctions.SSAOKernel;
    this.ssaoPass.matProj = this.matProj;
    this.ssaoPass.canvas = this.canvas;
    
    this.lightingPass.gBuffer = this.bufferManager.gBuffer;
    this.lightingPass.SSAOFramebuffer = this.bufferManager.SSAOFramebuffer;
    this.lightingPass.QuadVAO = this.vaoManager.QuadVAO;
  }
  
  generateTerrainBuffers(triangleMeshes: Mesh[]) {
    console.log("Generating terrain buffers with", triangleMeshes.length, "meshes");
    console.log("Triangle meshes:", triangleMeshes);
    
    // Generate triangle buffer in BufferManager
    this.bufferManager.GenerateTriangleBuffer(triangleMeshes);
    console.log("Buffer manager terrain mesh size:", this.bufferManager.TerrainMeshSize);
    
    // Update terrain VAO with the new buffer
    console.log("Buffer manager terrain triangle buffer:", this.bufferManager.TerrainTriangleBuffer);
    this.vaoManager.InitalizeTerrainVAO(
      this.bufferManager.TerrainTriangleBuffer,
      this.geometryPass.TerrainGeometryProgram
    );
    console.log("Terrain VAO created:", this.vaoManager.terrainVAO);
    
    // Update connections after buffer generation
    this.connectComponents();
  }

  initializeFramebuffers() {
    this.bufferManager.InitalizeGBuffer();
    this.bufferManager.InitalizeSSAOFramebuffer();
    this.connectComponents();
  }
  

  drawTerrain(TransformationMatrix: mat4) {
    this.geometryPass.DefferedRenderingGeometryPass(TransformationMatrix);
    this.ssaoPass.DefferedRenderingSSAOPass();
    this.lightingPass.DefferedRenderingLightingPass();
  }

  render() {

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.matView = this.camera.calculateViewMatrix();
    this.matProj = this.camera.calculateProjectionMatrix(
      this.canvas.width,
      this.canvas.height
    );
    this.connectComponents();
    mat4.multiply(this.matViewProj, this.matProj, this.matView);
    const resScaleFactor = 1;

    this.drawTerrain(
      glUtils.CreateTransformations(
        vec3.fromValues(0, 0, 0),
        vec3.fromValues(0, 0, 0),
        vec3.fromValues(resScaleFactor, resScaleFactor, resScaleFactor)
      )
    );

  }
}
