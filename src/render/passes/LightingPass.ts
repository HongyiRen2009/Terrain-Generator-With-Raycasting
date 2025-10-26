import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { RenderUtils } from "../../utils/RenderUtils";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { TextureUtils } from "../../utils/TextureUtils";
import LightingVertexShaderSource from "../glsl/DeferredRendering/Lighting.vert";
import LightingFragmentShaderSource from "../glsl/DeferredRendering/Lighting.frag";
import { getUniformLocations } from "../renderSystem/managers/ResourceCache";
import { WorldUtils } from "../../utils/WorldUtils";

export class LightingPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    this.program = RenderUtils.CreateProgram(
      gl,
      LightingVertexShaderSource,
      LightingFragmentShaderSource
    )!;
    this.renderTarget = this.initRenderTarget();
    this.uniforms = getUniformLocations(gl, this.program!, [
      "viewInverse",
      "projInverse",
      "cameraPosition"
    ]);
  }

  protected initRenderTarget(): RenderTarget {
    return { fbo: null, textures: {} };
  }

  public render(vao_info: VaoInfo | VaoInfo[]): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const textures = this.renderGraph!.getOutputs(this);
    const normalTexture = textures["normal"];
    const albedoTexture = textures["albedo"];
    const depthTexture = textures["depth"];
    const ssaoTexture = textures["ssaoBlur"];

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.program!);
    this.gl.bindVertexArray(vao.vao);

    TextureUtils.bindTex(
      this.gl,
      this.program!,
      normalTexture,
      "normalTexture",
      0
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      albedoTexture,
      "albedoTexture",
      1
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      depthTexture,
      "depthTexture",
      2
    );
    TextureUtils.bindTex(this.gl, this.program!, ssaoTexture, "ssaoTexture", 3);

    const cameraInfo = this.resourceCache.getUniformData("CameraInfo");
    this.gl.uniformMatrix4fv(
      this.uniforms["viewInverse"],
      false,
      cameraInfo.matViewInverse
    );
    this.gl.uniformMatrix4fv(
      this.uniforms["projInverse"],
      false,
      cameraInfo.matProjInverse
    );
    this.gl.uniform3fv(
      this.uniforms["cameraPosition"],
      this.resourceCache.getUniformData("cameraPosition")
    );

    WorldUtils.updateLights(
      this.gl,
      this.program!,
      this.resourceCache.getUniformData("lights")
    );

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
  }

  public resize(width: number, height: number): void {
    // LightingPass renders to default framebuffer, no resize needed
    // But we need to update viewport
    this.gl.viewport(0, 0, width, height);
  }
}
