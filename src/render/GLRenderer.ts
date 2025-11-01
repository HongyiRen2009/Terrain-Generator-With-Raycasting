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
import { mat4 } from "gl-matrix";
import { GrassPass } from "./passes/GrassPass";
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
    world: WorldMap
  ) {
    this.gl = gl;
    this.canvas = canvas;
    this.camera = camera;
    this.debug = debug;
    this.world = world;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.depthFunc(gl.LEQUAL);
    this.resourceCache = new ResourceCache(gl);
    this.renderGraph = new RenderGraph();
    this._vaoManager = new VAOManager(gl);
    this.init();
  }

  private init(): void {
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
      this.renderGraph
    );
    const cloudsPass = new CloudsPass(
      this.gl,
      this.resourceCache,
      this.canvas,
      this.renderGraph
    );
    const grassPass = new GrassPass(
      this.gl,
      this.resourceCache,
      this.canvas,
      this.renderGraph
    );
    // Build render graph tree structure
    /*     this.renderGraph.addRoot(geometryPass);
    this.renderGraph.add(ssaoPass, geometryPass);
    this.renderGraph.add(ssaoBlurPass, ssaoPass, geometryPass);
    this.renderGraph.add(lightingPass, geometryPass, ssaoBlurPass);

    this.renderGraph.add(cloudsPass, geometryPass); */
    this.renderGraph.addRoot(grassPass);
  }

  public render(): void {
    this.gl.clearColor(0.5, 0.7, 1.0, 1.0);
    this.calculateCameraInfo();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    const vaosToRender = this._vaoManager.getVaosToRender();
    const screenQuadVAO = this._vaoManager.getScreenQuadVAO();

    this.resourceCache.setUniformData("lights", this.world.lights);

    // Get passes in correct execution order
    const sortedPasses = this.renderGraph.getSortedPasses();
    for (const pass of sortedPasses) {
      if (pass.VAOInputType === VAOInputType.FULLSCREENQUAD) {
        if (!screenQuadVAO) {
          console.warn("No screen quad VAO available for fullscreen pass");
          continue;
        }
        pass.render(screenQuadVAO);
      } else if (pass.VAOInputType === VAOInputType.SCENE) {
        pass.render(vaosToRender);
      } else if (pass.VAOInputType === VAOInputType.NONE) {
        pass.render([]);
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
    this.resourceCache.setUniformData("CameraInfo", cameraInfo);
    this.resourceCache.setUniformData("cameraPosition", this.camera.position);
    this.resourceCache.setUniformData("cameraDirection", this.camera.front);
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
