import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { RenderUtils } from "../../utils/RenderUtils";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { TextureUtils } from "../../utils/TextureUtils";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import CombineGeometryVertexShaderSource from "../glsl/DeferredRendering/CombineGeometryPass.vert";
import CombineGeometryFragmentShaderSource from "../glsl/DeferredRendering/CombineGeometryPass.frag";
export class CombineGeometryPass extends RenderPass {
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
      CombineGeometryVertexShaderSource,
      CombineGeometryFragmentShaderSource
    )!;
  }

  protected initRenderTarget(width?: number, height?: number): RenderTarget {
    const w = width || this.canvas.width;
    const h = height || this.canvas.height;

    // Check for floating point render target support
    const floatExt = this.gl.getExtension("EXT_color_buffer_float");
    const halfFloatExt = this.gl.getExtension("EXT_color_buffer_half_float");

    let normalInternalFormat: number;
    let normalFormat: number;
    let normalType: number;

    if (floatExt) {
      // Use full float precision
      normalInternalFormat = this.gl.RGBA16F;
      normalFormat = this.gl.RGBA;
      normalType = this.gl.FLOAT;
    } else if (halfFloatExt) {
      // Use half float precision
      normalInternalFormat = this.gl.RGBA16F;
      normalFormat = this.gl.RGBA;
      normalType = this.gl.HALF_FLOAT;
    } else {
      throw new Error(
        "[GeometryPass] Floating point render targets not supported. EXT_color_buffer_float or EXT_color_buffer_half_float required."
      );
    }

    const normalTexture = TextureUtils.createTexture2D(
      this.gl,
      w,
      h,
      normalInternalFormat,
      normalFormat,
      normalType
    );
    const albedoTexture = TextureUtils.createTexture2D(
      this.gl,
      w,
      h,
      this.gl.RGBA8,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE
    );
    const materialAttributesTexture = TextureUtils.createTexture2D(
      this.gl,
      w,
      h,
      this.gl.RGBA8,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE
    );
    const depthTexture = TextureUtils.createTexture2D(
      this.gl,
      w,
      h,
      this.gl.DEPTH_COMPONENT32F,
      this.gl.DEPTH_COMPONENT,
      this.gl.FLOAT
    );

    const fbo = this.gl.createFramebuffer();

    if (!fbo) {
      throw new Error("Failed to create framebuffer");
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      normalTexture,
      0
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT1,
      this.gl.TEXTURE_2D,
      albedoTexture,
      0
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT2,
      this.gl.TEXTURE_2D,
      materialAttributesTexture,
      0
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.DEPTH_ATTACHMENT,
      this.gl.TEXTURE_2D,
      depthTexture,
      0
    );
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0, this.gl.COLOR_ATTACHMENT1, this.gl.COLOR_ATTACHMENT2]);

    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Framebuffer is not complete: " + status.toString());
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    return {
      fbo: fbo,
      textures: {
        normal: normalTexture,
        albedo: albedoTexture,
        materialAttributes: materialAttributesTexture,
        depth: depthTexture
      }
    };
  }

  public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const gBuffer = this.renderGraph?.getOutputs(this);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clearDepth(1.0); // Explicitly set clear depth to far plane (1.0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthMask(true);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.program!);
    this.gl.bindVertexArray(vao.vao);
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      gBuffer!["normal"],
      "normalTexture",
      0
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      gBuffer!["albedo"],
      "albedoTexture",
      1
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      gBuffer!["materialAttributes"],
      "materialAttributesTexture",
      2
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      gBuffer!["depth"],
      "depthTexture",
      3
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      gBuffer!["grassNormal"],
      "grassNormalTexture",
      4
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      gBuffer!["grassAlbedo"],
      "grassAlbedoTexture",
      5
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      gBuffer!["grassDepth"],
      "grassDepthTexture",
      6
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
          this.gl.deleteTexture(texture as WebGLTexture);
        }
      }
    }

    // Recreate render target with new dimensions
    this.renderTarget = this.initRenderTarget();
  }
}
