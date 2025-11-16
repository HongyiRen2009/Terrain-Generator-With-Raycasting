import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { RenderUtils } from "../../utils/RenderUtils";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { TextureUtils } from "../../utils/TextureUtils";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { RenderGraph } from "../renderSystem/RenderGraph";
import geometryVertexShaderSource from "../glsl/DeferredRendering/Geometry.vert";
import geometryFragmentShaderSource from "../glsl/DeferredRendering/Geometry.frag";
import { mat4 } from "gl-matrix";
import { getUniformLocations } from "../renderSystem/managers/ResourceCache";

export class GeometryPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.SCENE;
  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    this.canvas = canvas;
    this.program = RenderUtils.CreateProgram(
      gl,
      geometryVertexShaderSource,
      geometryFragmentShaderSource
    )!;
    this.renderTarget = this.initRenderTarget();
    this.uniforms = getUniformLocations(gl, this.program!, [
      "view",
      "proj",
      "model"
    ]);
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
      throw new Error("[GeometryPass] Floating point render targets not supported. EXT_color_buffer_float or EXT_color_buffer_half_float required.");
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
      this.gl.DEPTH_ATTACHMENT,
      this.gl.TEXTURE_2D,
      depthTexture,
      0
    );
    
    // Configure depth texture to be readable AFTER attaching to framebuffer
    // This allows the depth texture to be sampled as a regular texture in shaders
    // NEAREST filtering is required for reading DEPTH_COMPONENT textures on many WebGL implementations
    this.gl.bindTexture(this.gl.TEXTURE_2D, depthTexture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_COMPARE_MODE, this.gl.NONE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0, this.gl.COLOR_ATTACHMENT1]);

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
        depth: depthTexture
      }
    };
  }

  public render(vaosToRender: VaoInfo[]): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clearDepth(1.0); // Explicitly set clear depth to far plane (1.0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LESS);
    this.gl.depthMask(true);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.program);

    const cameraInfo = this.resourceCache.getUniformData("CameraInfo");
    this.gl.uniformMatrix4fv(this.uniforms["view"], false, cameraInfo.matView);
    this.gl.uniformMatrix4fv(this.uniforms["proj"], false, cameraInfo.matProj);

    for (const vaoInfo of vaosToRender) {
      this.gl.bindVertexArray(vaoInfo.vao);
      this.gl.uniformMatrix4fv(
        this.uniforms["model"],
        false,
        vaoInfo.modelMatrix
      );
      this.gl.drawElements(
        this.gl.TRIANGLES,
        vaoInfo.indexCount,
        this.gl.UNSIGNED_INT,
        0
      );
    }

    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  public resize(width: number, height: number): void {
    this.disposeRenderTarget();
    this.renderTarget = this.initRenderTarget(width, height);
  }
}
