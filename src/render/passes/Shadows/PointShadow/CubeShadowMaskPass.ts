import { RenderPass, VAOInputType } from "../../../renderSystem/RenderPass";
import { getUniformLocations, ResourceCache } from "../../../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../../../renderSystem/RenderGraph";
import { RenderUtils } from "../../../../utils/RenderUtils";
import { RenderTarget } from "../../../renderSystem/RenderTarget";
import { TextureUtils } from "../../../../utils/TextureUtils";
import CubeShadowMaskVertexShaderSource from "../../../glsl/DeferredRendering/Shadows/PointShadow/CubeShadowMask.vert";
import CubeShadowMaskFragmentShaderSource from "../../../glsl/DeferredRendering/Shadows/PointShadow/CubeShadowMask.frag";
import { VaoInfo } from "../../../renderSystem/managers/VaoManager";
import { SettingsManager } from "../../../../Settings";
import { WorldUtils } from "../../../../utils/WorldUtils";

export class CubeShadowMaskPass extends RenderPass {
  public pathtracerRender: boolean = false;
  public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
  private jitterTexture: WebGLTexture | null = null;
  
  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    this.program = RenderUtils.CreateProgram(
      gl,
      CubeShadowMaskVertexShaderSource,
      CubeShadowMaskFragmentShaderSource
    );
    this.renderTarget = this.initRenderTarget();
    this.uniforms = getUniformLocations(gl, this.program!, [
      "viewInverse",
      "projInverse",
      "pausedView",
      "usingPCF",
      "pointShadowBias",
      "numShadowedLights",
      "cubeMapSize",
      "cubeShadowsOn",
      "jitterSize",
      "filterSize",
      "pcfRadius",
      "debugPauseMode"
    ]);
    
    // Get or create jitter texture (shared with CSM pass)
    this.jitterTexture = this.resourceCache.getData("jitterTexture");
    if (!this.jitterTexture) {
      // Use the same jitter texture creation logic as CSMShadowMaskPass
      const jitterSize = this.resourceCache.getData("jitterSize") ?? 16;
      const filterSize = this.resourceCache.getData("filterSize") ?? 4;
      this.jitterTexture = this.createJitterTexture(jitterSize, filterSize);
      this.resourceCache.setData("jitterTexture", this.jitterTexture);
    }
    
    // Attach program to settings for automatic uniform updates
    SettingsManager.instance.attatchProgram(this.program!, [
      "usingPCF",
      "pointShadowBias",
      "pcfRadius",
      "jitterSize",
      "filterSize",
      "slopeFactorClamp",
      "debugPauseMode"
    ]);
  }

  private createJitterTexture(size: number, filterSize: number): WebGLTexture {
    const data = new Float32Array(size * size * filterSize * filterSize * 2);
    const totalSamples = filterSize * filterSize;

    let index = 0;
    for (let texY = 0; texY < size; texY++) {
      for (let texX = 0; texX < size; texX++) {
        for (let i = 0; i < 8; i++) {
          const angle = (i + Math.random()) / 8;
          const radius = 1.0 - Math.random() * (1.0 / filterSize);
          data[index] = Math.sqrt(radius) * Math.cos(angle * 2 * Math.PI);
          data[index + 1] = Math.sqrt(radius) * Math.sin(angle * 2 * Math.PI);
          index += 2;
        }

        const remainingSamples = totalSamples - 8;
        for (let i = 0; i < remainingSamples; i++) {
          const sampleIdx = i + 8;
          const filterX = sampleIdx % filterSize;
          const filterY = filterSize - 1 - Math.floor(sampleIdx / filterSize);
          const angle = (filterX + Math.random()) / filterSize;
          const radius = (filterY + Math.random()) / filterSize;
          data[index] = Math.sqrt(radius) * Math.cos(angle * 2 * Math.PI);
          data[index + 1] = Math.sqrt(radius) * Math.sin(angle * 2 * Math.PI);
          index += 2;
        }
      }
    }

    const texture = this.gl.createTexture();
    const layers = (filterSize * filterSize) / 2;
    this.gl.bindTexture(this.gl.TEXTURE_3D, texture);
    this.gl.texImage3D(
      this.gl.TEXTURE_3D,
      0,
      this.gl.RGBA32F,
      layers,
      size,
      size,
      0,
      this.gl.RGBA,
      this.gl.FLOAT,
      data
    );
    this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.bindTexture(this.gl.TEXTURE_3D, null);
    return texture!;
  }

  public initRenderTarget(): RenderTarget {
    const fbo = this.gl.createFramebuffer();
    if (!fbo) {
      throw new Error("Failed to create framebuffer");
    }
    
    // Create 5 R32F textures for 5 point light shadow masks
    const pointShadowMaskA = TextureUtils.createTexture2D(
      this.gl, this.canvas.width, this.canvas.height,
      this.gl.R32F, this.gl.RED, this.gl.FLOAT
    );
    const pointShadowMaskB = TextureUtils.createTexture2D(
      this.gl, this.canvas.width, this.canvas.height,
      this.gl.R32F, this.gl.RED, this.gl.FLOAT
    );
    const pointShadowMaskC = TextureUtils.createTexture2D(
      this.gl, this.canvas.width, this.canvas.height,
      this.gl.R32F, this.gl.RED, this.gl.FLOAT
    );
    const pointShadowMaskD = TextureUtils.createTexture2D(
      this.gl, this.canvas.width, this.canvas.height,
      this.gl.R32F, this.gl.RED, this.gl.FLOAT
    );
    const pointShadowMaskE = TextureUtils.createTexture2D(
      this.gl, this.canvas.width, this.canvas.height,
      this.gl.R32F, this.gl.RED, this.gl.FLOAT
    );
    
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, pointShadowMaskA, 0);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT1, this.gl.TEXTURE_2D, pointShadowMaskB, 0);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT2, this.gl.TEXTURE_2D, pointShadowMaskC, 0);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT3, this.gl.TEXTURE_2D, pointShadowMaskD, 0);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT4, this.gl.TEXTURE_2D, pointShadowMaskE, 0);
    
    this.gl.drawBuffers([
      this.gl.COLOR_ATTACHMENT0,
      this.gl.COLOR_ATTACHMENT1,
      this.gl.COLOR_ATTACHMENT2,
      this.gl.COLOR_ATTACHMENT3,
      this.gl.COLOR_ATTACHMENT4
    ]);
    
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    
    return {
      fbo,
      textures: {
        pointShadowMaskA,
        pointShadowMaskB,
        pointShadowMaskC,
        pointShadowMaskD,
        pointShadowMaskE
      }
    };
  }

  public resize(width: number, height: number): void {
    this.disposeRenderTarget();
    this.renderTarget = this.initRenderTarget();
  }

  public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const textures = this.renderGraph!.getOutputs(this);
    const depthTexture = textures["depth"];
    const normalTexture = textures["normal"];
    const pointShadowTextures = textures["pointShadowTextures"] as WebGLTexture[];
    
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // Clear to 1.0 (fully lit) so unshadowed lights show correctly
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);
    this.gl.useProgram(this.program!);
    this.gl.bindVertexArray(vao.vao);

    // Bind G-buffer textures
    TextureUtils.bindTex(this.gl, this.program!, depthTexture, "depthTexture", 0);
    TextureUtils.bindTex(this.gl, this.program!, normalTexture, "normalTexture", 1);
    
    // Bind point shadow cube maps (up to 5)
    const numShadowedLights = this.resourceCache.getData("numShadowedLights") ?? 0;
    if (pointShadowTextures && pointShadowTextures.length > 0) {
      for (let i = 0; i < Math.min(numShadowedLights, 5); i++) {
        this.gl.activeTexture(this.gl.TEXTURE2 + i);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, pointShadowTextures[i]);
        this.gl.uniform1i(this.gl.getUniformLocation(this.program!, `pointShadowTexture[${i}]`), 2 + i);
      }
    }
    
    // Bind jitter texture
    this.gl.activeTexture(this.gl.TEXTURE7);
    this.gl.bindTexture(this.gl.TEXTURE_3D, this.jitterTexture);
    this.gl.uniform1i(this.gl.getUniformLocation(this.program!, "jitterTexture"), 7);

    // Camera uniforms
    const cameraInfo = this.resourceCache.getData("CameraInfo");
    const pausedCameraInfo = this.resourceCache.getData("pausedCameraInfo") ?? cameraInfo;
    this.gl.uniformMatrix4fv(this.uniforms["viewInverse"], false, cameraInfo.matViewInverse);
    this.gl.uniformMatrix4fv(this.uniforms["projInverse"], false, cameraInfo.matProjInverse);
    this.gl.uniformMatrix4fv(this.uniforms["pausedView"], false, pausedCameraInfo.matView);

    // Shadow uniforms
    this.gl.uniform1i(this.uniforms["numShadowedLights"], numShadowedLights);
    this.gl.uniform1i(this.uniforms["cubeMapSize"], this.resourceCache.getData("CubeShadowsMapSize") ?? 1024);
    this.gl.uniform1i(this.uniforms["cubeShadowsOn"], this.resourceCache.getData("cubeShadowsOn") ? 1 : 0);

    // Update settings-driven uniforms
    SettingsManager.instance.updateProgramUniforms(this.gl, this.program!);

    // Update point lights uniforms
    const lights = this.resourceCache.getData("lights");
    WorldUtils.updateLights(this.gl, this.program!, lights);

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
}
