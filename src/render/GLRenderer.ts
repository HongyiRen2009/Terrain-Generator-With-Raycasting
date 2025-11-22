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
  private lightingPass: LightingPass | null = null;

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
    this.lightingPass = new LightingPass(
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

    // Build render graph tree structure
    this.renderGraph.addRoot(geometryPass);
    this.renderGraph.add(ssaoPass, geometryPass);
    this.renderGraph.add(ssaoBlurPass, ssaoPass, geometryPass);
    this.renderGraph.add(this.lightingPass, geometryPass, ssaoBlurPass);
    this.renderGraph.add(cloudsPass, geometryPass);

    // Initialize default material uniforms
    this.initializeMaterialUniforms();
  }

  /**
   * Initialize default material uniform values
   */
  private initializeMaterialUniforms(): void {
    const program = this.getLightingProgram();
    if (!program) return;

    this.gl.useProgram(program);

    // Set default material values
    const metallicityLoc = this.gl.getUniformLocation(program, "u_metallicity");
    const roughnessLoc = this.gl.getUniformLocation(program, "u_roughness");
    const terrainColorLoc = this.gl.getUniformLocation(program, "u_terrainColor");
    const ambientStrengthLoc = this.gl.getUniformLocation(program, "u_ambientStrength");
    const specularIntensityLoc = this.gl.getUniformLocation(program, "u_specularIntensity");
    const specularPowerLoc = this.gl.getUniformLocation(program, "u_specularPower");

    if (metallicityLoc) this.gl.uniform1f(metallicityLoc, 0.0);
    if (roughnessLoc) this.gl.uniform1f(roughnessLoc, 0.5);
    if (terrainColorLoc) this.gl.uniform3f(terrainColorLoc, 0.5, 0.7, 0.3);
    if (ambientStrengthLoc) this.gl.uniform1f(ambientStrengthLoc, 0.3);
    if (specularIntensityLoc) this.gl.uniform1f(specularIntensityLoc, 1.0);
    if (specularPowerLoc) this.gl.uniform1f(specularPowerLoc, 16.0);
  }
  /**
   * Get the lighting shader program for material uniform updates
   */
  public getLightingProgram(): WebGLProgram | null {
    if (!this.lightingPass) return null;
    return (this.lightingPass as any).program || null;
  }

  /**
   * Get the lighting pass for material uniform updates
   */
  public getLightingPass(): LightingPass | null {
    return this.lightingPass;
  }

  public render(pathtracerOn: boolean = false): void {
    if (!pathtracerOn) {
      this.gl.clearColor(0.5, 0.7, 1.0, 1.0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    this.calculateCameraInfo();

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
        if (!pathtracerOn || pass.pathtracerRender) {
          pass.render(screenQuadVAO, pathtracerOn);
        }
      } else if (pass.VAOInputType === VAOInputType.SCENE) {
        if (!pathtracerOn || pass.pathtracerRender) {
          pass.render(vaosToRender, pathtracerOn);
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
    this.resourceCache.setUniformData("CameraInfo", cameraInfo);
    this.resourceCache.setUniformData("cameraPosition", this.camera.position);
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