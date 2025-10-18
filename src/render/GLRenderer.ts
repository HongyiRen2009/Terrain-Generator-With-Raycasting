import { mat4, vec3 } from "gl-matrix";
import { GlUtils } from "./GlUtils";
import { Camera } from "./Camera";
import { WorldMap } from "../map/Map";
import { DebugMenu } from "../DebugMenu";
import { Mesh } from "../map/Mesh";
import { VaoInfo, VAOManager } from "./VaoManager";
import { DeferredRenderer } from "./DeferredRenderer";
interface Matrices {
  matView: mat4;
  matProj: mat4;
  matViewProj: mat4;
  matViewInverse: mat4;
  matProjInverse: mat4;
}

// GLRenderer: Main rendering orchestrator
export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;
  debug: DebugMenu;
  world: WorldMap;
  // Matrices
  matView: mat4;
  matProj: mat4;
  matViewProj: mat4;

  // Managers
  private vaoManager: VAOManager;
  deferredRenderer: DeferredRenderer;

  // SSAO controls
  get radius() {
    return this.deferredRenderer.radius;
  }
  set radius(val: number) {
    this.deferredRenderer.radius = val;
  }
  get bias() {
    return this.deferredRenderer.bias;
  }
  set bias(val: number) {
    this.deferredRenderer.bias = val;
  }
  get enableSSAOBlur() {
    return this.deferredRenderer.enableSSAOBlur;
  }
  set enableSSAOBlur(val: boolean) {
    this.deferredRenderer.enableSSAOBlur = val;
  }

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

    this.deferredRenderer = new DeferredRenderer(gl, canvas);
    this.vaoManager = new VAOManager(
      gl,
      this.deferredRenderer.getGeometryPassProgram()
    );
  }

  GenerateTerrainBuffers(triangleMeshes: Mesh[]): void {
    this.vaoManager.createTerrainVAO(triangleMeshes);
  }
  GenerateWorldObjectVAOs(): void {
    this.vaoManager.createWorldObjectVAOs(this.world.worldObjects);
  }
  resizeGBuffer(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.deferredRenderer.resize(width, height);
  }

  render(): void {
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);

    const matViewAndProj = this.camera.calculateProjectionMatrices(
      this.canvas.width,
      this.canvas.height
    );
    this.matView = matViewAndProj.matView;
    this.matProj = matViewAndProj.matProj;
    mat4.multiply(this.matViewProj, this.matProj, this.matView);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    const vaosToRender = this.vaoManager.getVaosToRender();

    this.deferredRenderer.renderGeometryPass(
      vaosToRender,
      this.matView,
      this.matProj
    );
    this.deferredRenderer.renderSSAOPass(this.matProj);
    this.deferredRenderer.renderBlurPass();
    this.deferredRenderer.renderLightingPass(
      this.camera.position,
      this.world.lights,
      this.matView,
      this.matProj
    );
  }

  dispose(): void {
    this.vaoManager.dispose();
    this.deferredRenderer.dispose();
  }
}
