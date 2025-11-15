import { GrassVAOInfo, VaoInfo } from "./managers/VaoManager";
import { RenderTarget } from "./RenderTarget";
import { ResourceCache } from "./managers/ResourceCache";
import { RenderGraph } from "./RenderGraph";
import { SettingsSection } from "../../Settings";
export enum VAOInputType {
  SCENE,
  FULLSCREENQUAD,
  GRASS,
  NONE
}
export abstract class RenderPass {
  protected gl: WebGL2RenderingContext;
  protected canvas: HTMLCanvasElement;
  protected program: WebGLProgram | null;
  protected renderTarget: RenderTarget | null;
  protected resourceCache: ResourceCache;
  protected renderGraph?: RenderGraph;
  protected uniforms: { [key: string]: WebGLUniformLocation } = {};
  protected settingsSection: SettingsSection | null = null;
  public abstract pathtracerRender: boolean; // Do you render while pathtracing
  public abstract VAOInputType: VAOInputType;
  public name?: string;
  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph,
    name?: string
  ) {
    this.gl = gl;
    this.canvas = canvas;
    this.program = null;
    this.renderTarget = this.initRenderTarget();
    this.uniforms = {};
    this.resourceCache = resourceCache;
    this.renderGraph = renderGraph;
    this.name = name;
  }
  protected abstract initRenderTarget(): RenderTarget;

  public getRenderTarget(): RenderTarget | null {
    return this.renderTarget;
  }

  public abstract render(
    vao_info: VaoInfo | VaoInfo[] | GrassVAOInfo,
    pathtracerOn: boolean
  ): void;

  public resize(width: number, height: number): void {
    // Delete old resources
    if (this.renderTarget) {
      if (this.renderTarget.fbo) {
        this.gl.deleteFramebuffer(this.renderTarget.fbo);
      }
      if (this.renderTarget.textures) {
        for (const texture of Object.values(this.renderTarget.textures)) {
          this.gl.deleteTexture(texture);
        }
      }
    }

    // Recreate render target with new dimensions
    this.renderTarget = this.initRenderTarget();
  }

  public dispose() {
    if (this.renderTarget) {
      if (this.renderTarget.fbo) {
        this.gl.deleteFramebuffer(this.renderTarget.fbo);
      }
      if (this.renderTarget.textures) {
        for (const texture of Object.values(this.renderTarget.textures)) {
          this.gl.deleteTexture(texture);
        }
      }
    }
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}
