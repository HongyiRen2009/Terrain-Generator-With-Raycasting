import { mat4, vec3 } from "gl-matrix";
import { GlUtils } from "../utils/GlUtils";
import { TextureUtils } from "../utils/TextureUtils";
import { Camera } from "../Camera";
import { meshToNonInterleavedVerticesAndIndices } from "../../map/cubes_utils";
import { WorldMap } from "../../map/Map";
import { DebugMenu } from "../../DebugMenu";
import {
  quadVertices,
  quadIndices
} from "../../map/geometry";
import { Mesh } from "../../map/Mesh";
import { MeshGeometryVertexShaderCode, MeshGeometryFragmentShaderCode } from "../glsl/geometry";
import { MeshLightingVertexShaderCode, MeshLightingFragmentShaderCode } from "../glsl/lighting";
import { MeshSSAOVertexShaderCode, MeshSSAOFragmentShaderCode} from "../glsl/ssao";
import { MeshSSAOBlurVertexShaderCode, MeshSSAOBlurFragmentShaderCode } from "../glsl/ssao_blur";
import { geometryPass } from "./passes/geometryPass";
import { SSAOPass } from "./passes/SSAOPass";
import { SSAOBlurPass } from "./passes/SSAOBlurPass";
import { lightingPass } from "./passes/lightingPass";

export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;

  // Geometry buffers
  QuadBuffer: { vertex: WebGLBuffer; indices: WebGLBuffer } | null = null;  
  
  // Screen-space quad for fullscreen passes
  screenQuadVAO: WebGLVertexArrayObject | null = null;

  // Matrices
  matView: mat4;
  matProj: mat4;
  matViewProj: mat4;
  matProjInverse: mat4;
  matViewInverse: mat4;
  debug: DebugMenu;
  world: WorldMap;

  // Passes for deferred rendering
  geometryPass: geometryPass
  ssaoPass: SSAOPass
  blurPass: SSAOBlurPass
  lightingPass: lightingPass

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
    gl.depthFunc(gl.LEQUAL);

    this.matView = mat4.create();
    this.matProj = mat4.create();
    this.matViewProj = mat4.create();
    this.matProjInverse = mat4.create();
    this.matViewInverse = mat4.create();

    this.geometryPass = new geometryPass(this.gl, this.canvas);
    this.ssaoPass = new SSAOPass(this.gl, this.canvas);
    this.blurPass = new SSAOBlurPass(this.gl, this.canvas, this.ssaoPass.screenQuadVAO);
    this.lightingPass = new lightingPass(this.gl, this.canvas, this.ssaoPass.screenQuadVAO);
  }
  


  // Initialize screen-space quad for fullscreen passes
  private initializeScreenQuad() {
    const vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(vao);

    const vbo = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, quadVertices, this.gl.STATIC_DRAW);

    const ebo = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ebo);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      quadIndices,
      this.gl.STATIC_DRAW
    );

    // Position attribute (location 0)
    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 20, 0);
    // TexCoord attribute (location 1)
    this.gl.enableVertexAttribArray(1);
    this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 20, 12);

    this.gl.bindVertexArray(null);
    this.screenQuadVAO = vao;
  }
  

  
  private initShaders() {
    this.geometryPassProgram = GlUtils.CreateProgram(
      this.gl,
      MeshGeometryVertexShaderCode,
      MeshGeometryFragmentShaderCode
    )!;
    this.ssaoPassProgram = GlUtils.CreateProgram(
      this.gl,
      MeshSSAOVertexShaderCode,
      MeshSSAOFragmentShaderCode
    )!;
    this.ssaoBlurPassProgram = GlUtils.CreateProgram(
      this.gl,
      MeshSSAOBlurVertexShaderCode,
      MeshSSAOBlurFragmentShaderCode
    )!;
    this.lightingPassProgram = GlUtils.CreateProgram(
      this.gl,
      MeshLightingVertexShaderCode,
      MeshLightingFragmentShaderCode
    )!;
  }

  drawTerrain(){

  }
  
  render() {
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);

    const matViewAndProj = this.camera.calculateProjectionMatrices(
      this.canvas.width,
      this.canvas.height
    );
    this.matView = matViewAndProj.matView;
    this.matProj = matViewAndProj.matProj;
    mat4.invert(this.matProjInverse, this.matProj);
    mat4.invert(this.matViewInverse, this.matView);
    mat4.multiply(this.matViewProj, this.matProj, this.matView);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Single geometry pass for all objects
    this.geometryPass();

    // Post-processing passes
    this.ssaoPass();
    this.blurPass();
    this.lightingPass();
  }
  
}
