import { RenderUtils } from "../../utils/RenderUtils";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { RenderTarget } from "../renderSystem/RenderTarget";
import FinalVertexShaderSource from "../glsl/DeferredRendering/FinalPass.vert";
import FinalFragmentShaderSource from "../glsl/DeferredRendering/FinalPass.frag";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { TextureUtils } from "../../utils/TextureUtils";
export class FinalPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
  public pathtracerRender: boolean = true;
  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    this.program = RenderUtils.CreateProgram(
      gl,
      FinalVertexShaderSource,
      FinalFragmentShaderSource
    )!;
  }
  protected initRenderTarget(): RenderTarget {
    return { fbo: null, textures: {} };
  }
  public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const textures = this.renderGraph!.getUnmergedOutputs(this);
    const colorTexture = textures["terrainLighting"]["color"];
    const depthTexture = textures["terrainGeometry"]["depth"];
    const grassColorTexture = textures["grass"]["color"];
    const grassDepthTexture = textures["grass"]["depth"];
    const grassSSAOTexture = textures["grassSSAOBlur"]["ssaoBlur"];
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    if (!pathtracerOn || this.pathtracerRender) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);
    this.gl.useProgram(this.program!);
    this.gl.bindVertexArray(vao.vao);
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      colorTexture,
      "colorTexture",
      0
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      depthTexture,
      "depthTexture",
      1
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      grassColorTexture,
      "grassColorTexture",
      2
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      grassDepthTexture,
      "grassDepthTexture",
      3
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      grassSSAOTexture,
      "grassSSAOTexture",
      4
    );

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
}
