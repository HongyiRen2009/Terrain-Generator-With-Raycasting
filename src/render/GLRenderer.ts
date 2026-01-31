import { Camera } from "./Camera";
import { DebugMenu } from "../DebugMenu";
import { WorldMap } from "../map/Map";
import { ResourceCache } from "./renderSystem/managers/ResourceCache";
import { RenderGraph } from "./renderSystem/RenderGraph";
import { RenderPass, VAOInputType } from "./renderSystem/RenderPass";
import { VAOManager } from "./renderSystem/managers/VaoManager";
import { GeometryPass } from "./passes/GeometryPass";
import { SSAOPass } from "./passes/SSAOPass";
import { SSAOBlurPass } from "./passes/SSAOBlurPass";
import { LightingPass } from "./passes/LightingPass";
import { CloudsPass } from "./passes/CloudsPass";
import { CSMPass } from "./passes/CSMPass";
import { glMatrix, mat4, vec3 } from "gl-matrix";
import { DirectionalLight } from "../map/Light";
import { CubeShadowsPass } from "./passes/CubeShadowsPass";
import { FinalPass } from "./passes/FinalPass";
import { GrassGeometryPass } from "./passes/GrassGeometryPass";
import { CombineGeometryPass } from "./passes/CombineGeometryPass";
import { PathTracer } from "../Pathtracing/PathTracer";
interface Matrices {
  matView: mat4;
  matProj: mat4;
  matViewProj: mat4;
  matViewInverse: mat4;
  matProjInverse: mat4;
}
export class GLRenderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private debug: DebugMenu;
  private world: WorldMap;
  private pathtracer: PathTracer;
  private resourceCache: ResourceCache;
  private renderGraph: RenderGraph;

  private _vaoManager: VAOManager;

  // Expose managers for external access
  public get vaoManager(): VAOManager {
    return this._vaoManager;
  }

  constructor(
    gl: WebGL2RenderingContext,
    canvas: HTMLCanvasElement,
    camera: Camera,
    debug: DebugMenu,
    world: WorldMap,
    pathtracer: PathTracer
  ) {
    this.gl = gl;
    this.canvas = canvas;
    this.camera = camera;
    this.debug = debug;
    this.world = world;
    this.pathtracer = pathtracer;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.depthFunc(gl.LEQUAL);
    this.resourceCache = new ResourceCache(gl);
    this.renderGraph = new RenderGraph();
    this._vaoManager = new VAOManager(gl);
    this.pathtracer.glRendererVaoManager = this._vaoManager;
    this.init();
  }

  private init(): void {
    // Set lights in resource cache before initializing passes that depend on them
    this.resourceCache.setData("lights", this.world.lights);
    this.resourceCache.setData("sunLight", this.world.sunLight);
    this.resourceCache.setData(
      "numShadowedLights",
      this.world.numShadowedLights
    );

    const geometryPass = new GeometryPass(
      this.gl,
      this.resourceCache,
      this.canvas,
      this.renderGraph
    );
    const ssaoPass = new SSAOPass(
      this.gl,
      this.resourceCache,
      this.canvas,
      this.renderGraph
    );
    const ssaoBlurPass = new SSAOBlurPass(
      this.gl,
      this.resourceCache,
      this.canvas,
      this.renderGraph
    );
    const lightingPass = new LightingPass(
      this.gl,
      this.resourceCache,
      this.canvas,
      this.renderGraph,
      "Terrain Lighting Pass",
      (direction: vec3) => {
        // Update the sun light direction in the world
        vec3.copy(this.world.sunLight.direction, direction);
      }
    );
    const csmPass = new CSMPass(
      this.gl,
      this.resourceCache,
      this.canvas,
      this.renderGraph
    );
    const cloudsPass = new CloudsPass(
      this.gl,
      this.resourceCache,
      this.canvas,
      this.renderGraph
    );
    const cubeShadowsPass = new CubeShadowsPass(
      this.gl,
      this.resourceCache,
      this.canvas,
      this.renderGraph
    );
    const finalPass = new FinalPass(
      this.gl,
      this.resourceCache,
      this.canvas,
      this.renderGraph
    );
    const grassGeometryPass = new GrassGeometryPass(
      this.gl,
      this.resourceCache,
      this.canvas,
      this.renderGraph
    );
    const combineGeometryPass = new CombineGeometryPass(
      this.gl,
      this.resourceCache,
      this.canvas,
      this.renderGraph
    );
    // Build render graph tree structure

    this.renderGraph.addRoot(geometryPass);
    this.renderGraph.addRoot(grassGeometryPass);
    this.renderGraph.add(combineGeometryPass, geometryPass, grassGeometryPass);
    this.renderGraph.add(csmPass, combineGeometryPass);
    this.renderGraph.add(cubeShadowsPass, combineGeometryPass);
    this.renderGraph.add(ssaoPass, combineGeometryPass);
    this.renderGraph.add(ssaoBlurPass, ssaoPass, combineGeometryPass);
    this.renderGraph.add(
      lightingPass,
      ssaoBlurPass,
      csmPass,
      cubeShadowsPass,
      combineGeometryPass
    );
    this.renderGraph.add(cloudsPass, combineGeometryPass);
    this.renderGraph.add(finalPass, cloudsPass,lightingPass);
  }

  public render(time: number, pathtracerOn: boolean = false): void {
    if (!pathtracerOn) {
      this.gl.clearColor(0.5, 0.7, 1.0, 1.0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    //Run Pathtracer
    if(pathtracerOn){
      this.pathtracer.render(time);
      return;
    }

    //Now run auxillary shaders
    this.calculateCameraInfo();

    const vaosToRender = this._vaoManager.getVaosToRender();
    const screenQuadVAO = this._vaoManager.getScreenQuadVAO();
    const grassVAO = this._vaoManager.getGrassVAO();
    this.resourceCache.setData("lights", this.world.lights);
    this.resourceCache.setData("sunLight", this.world.sunLight);
    this.resourceCache.setData(
      "numShadowedLights",
      this.world.numShadowedLights
    );

    // Get passes in correct execution order
    const sortedPasses = this.renderGraph.getSortedPasses();
    for (const pass of sortedPasses) {
      const invocationCount = pass.getInvocationCount();
      for (let i = 0; i < invocationCount; i++) {
        pass.setInvocationIndex(i);
        switch (pass.VAOInputType) {
          case VAOInputType.FULLSCREENQUAD:
            if (!pathtracerOn || pass.pathtracerRender) {
              pass.render(screenQuadVAO!, pathtracerOn);
            }
            break;
          case VAOInputType.SCENE:
            pass.render(vaosToRender, pathtracerOn);
            break;
          case VAOInputType.GRASS:
            pass.render(grassVAO!, pathtracerOn);
            break;
          case VAOInputType.NONE:
            pass.render([], pathtracerOn);
            break;
        }
      }
    }
  }

  public calculateCameraInfo(): void {
    const matViewAndProj = this.camera.calculateProjectionMatrices(
      this.canvas.width,
      this.canvas.height
    );
    const cameraInfo: Matrices = {
      matView: matViewAndProj.matView,
      matProj: matViewAndProj.matProj,
      matViewProj: mat4.multiply(
        mat4.create(),
        matViewAndProj.matProj,
        matViewAndProj.matView
      ),
      matViewInverse: mat4.invert(mat4.create(), matViewAndProj.matView),
      matProjInverse: mat4.invert(mat4.create(), matViewAndProj.matProj)
    };
    this.resourceCache.setData("CameraInfo", cameraInfo);
    this.resourceCache.setData("nearFarPlanes", this.camera.getNearFarPlanes());
    this.resourceCache.setData("cameraPosition", this.camera.position);
    this.resourceCache.setData("cameraDirection", this.camera.front);
    this.resourceCache.setData("fovY",glMatrix.toRadian(this.camera.fovy));
    this.resourceCache.setData(
      "aspectRatio",
      this.canvas.width / this.canvas.height
    );
    const debugPauseActive =
      this.resourceCache.getData("debugPauseMode") ??
      this.resourceCache.getData("debugPause") ??
      false;
    if (!debugPauseActive) {
      this.resourceCache.setData("pausedCameraInfo", cameraInfo);
      this.resourceCache.setData(
        "pausedNearFarPlanes",
        this.camera.getNearFarPlanes()
      );
      this.resourceCache.setData("pausedCameraPosition", this.camera.position);
      this.resourceCache.setData("pausedFovY", glMatrix.toRadian(this.camera.fovy));
      this.resourceCache.setData(
        "pausedAspectRatio",
        this.canvas.width / this.canvas.height
      );
    }
  }
  public resizeGBuffer(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);

    // Resize all render passes
    const allPasses = this.renderGraph.getSortedPasses();
    for (const pass of allPasses) {
      pass.resize(width, height);
    }
  }

  public dispose(): void {
    this._vaoManager.dispose();
    const allPasses = this.renderGraph.getSortedPasses();
    for (const pass of allPasses) {
      pass.dispose();
    }
  }
}
