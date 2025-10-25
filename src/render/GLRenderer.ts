import { Camera } from "./Camera";
import { DebugMenu } from "../DebugMenu";
import { WorldMap } from "../map/Map";
import { ResourceCache } from "./renderSystem/managers/UniformsManager";
import { RenderGraph } from "./renderSystem/RenderGraph";
import { RenderPass } from "./renderSystem/RenderPass";
import { VAOManager } from "./renderSystem/managers/VaoManager";
import { UniformsManager } from "./renderSystem/managers/UniformsManager";
import { GeometryPass } from "./passes/GeometryPass";
import { SSAOPass } from "./passes/SSAOPass";
import { SSAOBlurPass } from "./passes/SSAOBlurPass";
import { LightingPass } from "./passes/LightingPass";

export class GLRenderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private debug: DebugMenu;
  private world: WorldMap;
  private resourceCache: ResourceCache;
  private renderGraph: RenderGraph;
  private passes: RenderPass[];

  private _vaoManager: VAOManager;
  private _uniformsManager: UniformsManager;

  // Expose managers for external access
  public get vaoManager(): VAOManager {
    return this._vaoManager;
  }

  public get uniformsManager(): UniformsManager {
    return this._uniformsManager;
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
    this.passes = [];
    this._vaoManager = new VAOManager(gl);
    this._uniformsManager = new UniformsManager(
      gl,
      canvas,
      this.resourceCache,
      this.camera
    );
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
    this.passes.push(geometryPass);
    this.passes.push(ssaoPass);
    this.passes.push(ssaoBlurPass);
    this.passes.push(lightingPass);

    // Set up render graph dependencies
    this.renderGraph.add(geometryPass, ssaoPass);
    this.renderGraph.add(ssaoPass, ssaoBlurPass);
    this.renderGraph.add(geometryPass, ssaoBlurPass);
    this.renderGraph.add(geometryPass, lightingPass);
    this.renderGraph.add(ssaoBlurPass, lightingPass);
  }

  public render(): void {
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    this._uniformsManager.calculateCameraInfo();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    const vaosToRender = this._vaoManager.getVaosToRender();
    const screenQuadVAO = this._vaoManager.getScreenQuadVAO();

    this.resourceCache.setUniformData("lights", this.world.lights);

    // Render geometry pass with all VAOs
    this.passes[0].render(vaosToRender);

    // Render post-processing passes with screen quad
    for (let i = 1; i < this.passes.length; i++) {
      if (screenQuadVAO) {
        this.passes[i].render(screenQuadVAO);
      }
    }
  }

  public resizeGBuffer(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);

    // Resize all render passes
    for (const pass of this.passes) {
      pass.resize(width, height);
    }
  }

  public dispose(): void {
    this._vaoManager.dispose();
    for (const pass of this.passes) {
      pass.dispose();
    }
  }
}
