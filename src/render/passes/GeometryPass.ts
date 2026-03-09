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
import { WorldUtils } from "../../utils/WorldUtils";

export class GeometryPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.SCENE;
  public pathtracerRender: boolean = true;
  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph,
    name?: string
  ) {
    super(gl, resourceCache, canvas, renderGraph, name);
    this.canvas = canvas;
    this.program = RenderUtils.CreateProgram(
      gl,
      geometryVertexShaderSource,
      geometryFragmentShaderSource
    )!;
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
      throw new Error(
        "[GeometryPass] Floating point render targets not supported. EXT_color_buffer_float or EXT_color_buffer_half_float required."
      );
    }

    const gNormal = TextureUtils.createTexture2D(
      this.gl,
      w,
      h,
      normalInternalFormat,
      normalFormat,
      normalType
    );
    const gAux = TextureUtils.createTexture2D(
      this.gl,
      w,
      h,
      this.gl.RG16F,
      this.gl.RG,
      this.gl.FLOAT
    );
    const gMaterialID = TextureUtils.createTexture2D(
      this.gl,
      w,
      h,
      this.gl.R32UI,
      this.gl.RED_INTEGER,
      this.gl.UNSIGNED_INT
    );
    const gDepth = TextureUtils.createTexture2D(
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
      gNormal,
      0
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT1,
      this.gl.TEXTURE_2D,
      gAux,
      0
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT2,
      this.gl.TEXTURE_2D,
      gMaterialID,
      0
    );
    // No materialAttributes texture needed anymore
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.DEPTH_ATTACHMENT,
      this.gl.TEXTURE_2D,
      gDepth,
      0
    );
    this.gl.drawBuffers([
      this.gl.COLOR_ATTACHMENT0,
      this.gl.COLOR_ATTACHMENT1,
      this.gl.COLOR_ATTACHMENT2
    ]);

    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Framebuffer is not complete: " + status.toString());
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    return {
      fbo: fbo,
      textures: {
        normal: gNormal,
        depth: gDepth,
        uv: gAux,
        materialID: gMaterialID
      }
    };
  }

  public render(vaosToRender: VaoInfo[], pathtracerOn: boolean): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
    this.gl.clearBufferfv(this.gl.COLOR, 0, [1.0, 1.0, 1.0, 1.0]);
    this.gl.clearBufferfv(this.gl.COLOR, 1, [0.0, 0.0, 0.0, 1.0]);
    this.gl.clearBufferuiv(this.gl.COLOR, 2, [0, 0, 0, 0]);
    this.gl.clearDepth(1.0); // Explicitly set clear depth to far plane (1.0)
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LESS);
    this.gl.depthMask(true);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.program);

    const cameraInfo = this.resourceCache.getData("CameraInfo");
    this.gl.uniformMatrix4fv(this.uniforms["view"], false, cameraInfo.matView);
    this.gl.uniformMatrix4fv(this.uniforms["proj"], false, cameraInfo.matProj);

    // Compute frustum planes
    const viewProj = mat4.create();
    mat4.multiply(viewProj, cameraInfo.matProj, cameraInfo.matView);
    const frustum = WorldUtils.extractFrustumPlanes(viewProj);
    
    for (const vaoInfo of vaosToRender) {
      // Frustum culling
      if (vaoInfo.boundingBox && !WorldUtils.aabbInFrustum(vaoInfo.boundingBox, frustum, vaoInfo.modelMatrix)) {
        continue;
      }
      this.gl.bindVertexArray(vaoInfo.vao);
      this.gl.uniformMatrix4fv(
        this.uniforms["model"],
        false,
        vaoInfo.modelMatrix
      );
      if (!pathtracerOn || this.pathtracerRender) {
        this.gl.drawElements(
          this.gl.TRIANGLES,
          vaoInfo.indexCount,
          this.gl.UNSIGNED_INT,
          0
        );
      }
    }

    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  public resize(width: number, height: number): void {
    this.disposeRenderTarget();
    this.renderTarget = this.initRenderTarget(width, height);
  }
}
