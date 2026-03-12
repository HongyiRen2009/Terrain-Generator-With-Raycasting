import { GrassVAOInfo, VaoInfo } from "./managers/VaoManager";
import { RenderTarget } from "./RenderTarget";
import { ResourceCache } from "./managers/ResourceCache";
import { RenderGraph } from "./RenderGraph";
export enum VAOInputType {
  SCENE,
  FULLSCREENQUAD,
  GRASS,
  WATER,
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
    this.resourceCache = resourceCache;

    this.program = null;
    this.renderTarget = this.initRenderTarget();
    this.uniforms = {};
    this.renderGraph = renderGraph;
    this.name = name;
  }
  protected abstract initRenderTarget(): RenderTarget;
  /**
   * Number of times this pass should execute per frame. Override in subclasses as needed.
   */
  public getInvocationCount(): number {
    return 1;
  }

  /**
   * Optional hook to inform the pass about the current invocation index (0..count-1).
   * Subclasses can override to adjust state between invocations.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setInvocationIndex(_index: number): void {}

  public getRenderTarget(): RenderTarget | null {
    return this.renderTarget;
  }

  public abstract render(
    vao_info: VaoInfo | VaoInfo[] | GrassVAOInfo,
    pathtracerOn: boolean
  ): void;

  public resize(width: number, height: number): void {
    this.disposeRenderTarget();
    this.renderTarget = this.initRenderTarget();
  }

  public disposeRenderTarget(): void {
    if (this.renderTarget) {
      if (this.renderTarget.fbo) {
        this.gl.deleteFramebuffer(this.renderTarget.fbo);
      }
      if (this.renderTarget.textures) {
        for (const texture of Object.values(this.renderTarget.textures)) {
          if (Array.isArray(texture)) {
            // Handle array of textures
            for (const tex of texture) {
              if (tex) {
                this.gl.deleteTexture(tex);
              }
            }
          } else {
            // Handle single texture
            if (texture) {
              this.gl.deleteTexture(texture);
            }
          }
        }
      }
      this.renderTarget = null;
    }
  }

  public dispose() {
    this.disposeRenderTarget();
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}
