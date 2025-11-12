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
  public pathtracerRender: boolean = false;
  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph,
    name?: string
  ) {
    super(gl, resourceCache, canvas, renderGraph, name);
    this.program = RenderUtils.CreateProgram(
      gl,
      LightingVertexShaderSource,
      LightingFragmentShaderSource
    )!;
    this.uniforms = getUniformLocations(gl, this.program!, [
      "viewInverse",
      "projInverse",
      "cameraPosition"
    ]);
  }

  protected initRenderTarget(): RenderTarget {
    // Create framebuffer and texture for lit scene
    const fbo = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);

    const litSceneTexture = TextureUtils.createTexture2D(
      this.gl,
      this.canvas.width,
      this.canvas.height,
      this.gl.RGBA8,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null,
      this.gl.LINEAR,
      this.gl.LINEAR,
      this.gl.CLAMP_TO_EDGE,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      litSceneTexture,
      0
    );
    const depthTexture = TextureUtils.createTexture2D(
      this.gl,
      this.canvas.width,
      this.canvas.height,
      this.gl.DEPTH_COMPONENT24,
      this.gl.DEPTH_COMPONENT,
      this.gl.UNSIGNED_INT
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.DEPTH_ATTACHMENT,
      this.gl.TEXTURE_2D,
      depthTexture,
      0
    );
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    return { fbo, textures: { litSceneTexture, lightingDepth: depthTexture } };
  }

  public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const textures = this.renderGraph!.getOutputs(this);
    const normalTexture = textures["normal"];
    const albedoTexture = textures["albedo"];
    const depthTexture = textures["depth"];
    const ssaoTexture = textures["ssaoBlur"];

    // Bind lighting framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    if (!pathtracerOn || this.pathtracerRender) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
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
    if (!pathtracerOn || this.pathtracerRender) {
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
    this.renderTarget = this.initRenderTarget();
  }
}
