import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { RenderUtils } from "../../utils/RenderUtils";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { TextureUtils } from "../../utils/TextureUtils";
import SSAOBlurVertexShaderSource from "../glsl/DeferredRendering/SSAOBlur.vert";
import SSAOBlurFragmentShaderSource from "../glsl/DeferredRendering/SSAOBlur.frag";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { getUniformLocations } from "../renderSystem/managers/ResourceCache";

export class SSAOBlurPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
  public pathtracerRender: Boolean = false;
  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    this.program = RenderUtils.CreateProgram(
      gl,
      SSAOBlurVertexShaderSource,
      SSAOBlurFragmentShaderSource
    )!;
    this.renderTarget = this.initRenderTarget();
    this.uniforms = getUniformLocations(gl, this.program!, ["enableBlur"]);
  }

  protected initRenderTarget(width?: number, height?: number): RenderTarget {
    const w = width || this.canvas.width;
    const h = height || this.canvas.height;

    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) {
      throw new Error("Failed to create SSAO Blur framebuffer");
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

    const ssaoBlurTexture = TextureUtils.createTexture2D(
      this.gl,
      w,
      h,
      this.gl.R8,
      this.gl.RED,
      this.gl.UNSIGNED_BYTE
    );

    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      ssaoBlurTexture,
      0
    );
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    return { fbo: framebuffer, textures: { ssaoBlur: ssaoBlurTexture } };
  }

  public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: Boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    // Get textures from render graph
    const textures = this.renderGraph!.getOutputs(this);
    // SSAO texture is from SSAO pass, depth is from geometry pass
    const ssaoTexture = textures["ssao"];
    const depthTexture = textures["depth"];

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.program!);
    this.gl.bindVertexArray(vao.vao);

    TextureUtils.bindTex(this.gl, this.program!, ssaoTexture, "ssaoTexture", 0);
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      depthTexture,
      "depthTexture",
      1
    );
    this.settingsSection?.updateUniforms(this.gl);
    if(!pathtracerOn || this.pathtracerRender){
      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

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
    this.renderTarget = this.initRenderTarget(width, height);
  }
}
