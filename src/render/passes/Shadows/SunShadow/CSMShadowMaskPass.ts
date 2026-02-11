import { RenderPass, VAOInputType } from "../../../renderSystem/RenderPass";
import { getUniformLocations, ResourceCache } from "../../../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../../../renderSystem/RenderGraph";
import { RenderUtils } from "../../../../utils/RenderUtils";
import { RenderTarget } from "../../../renderSystem/RenderTarget";
import { TextureUtils } from "../../../../utils/TextureUtils";
import CSMShadowMaskVertexShaderSource from "../../../glsl/DeferredRendering/Shadows/SunShadow/CSMShadowMask.vert";
import CSMShadowMaskFragmentShaderSource from "../../../glsl/DeferredRendering/Shadows/SunShadow/CSMShadowMask.frag";
import { VaoInfo } from "../../../renderSystem/managers/VaoManager";
import { SettingsManager } from "../../../../Settings";
import { vec3 } from "gl-matrix";

export class CSMShadowMaskPass extends RenderPass {
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
      CSMShadowMaskVertexShaderSource,
      CSMShadowMaskFragmentShaderSource
    );
    this.renderTarget = this.initRenderTarget();
    this.uniforms = getUniformLocations(gl, this.program!, [
      "lightSpaceMatrices",
      "cameraPosition",
      "viewInverse",
      "projInverse",
      "pausedView",
      "cascadeSplits",
      "cascadeBlendWidth",
      "usingPCF",
      "csmShadowBias",
      "csmEnabled",
      "cascadeDebug",
      "debugPauseMode",
      "csmShadowMapSize",
      "pcfRadius",
      "jitterSize",
      "filterSize",
      "sunDisabled",
      "numCascades"
    ]);
    this.jitterTexture = createJitterTexture(
      gl,
      this.resourceCache.getData("jitterSize") ?? 16,
      this.resourceCache.getData("filterSize") ?? 8
    );
    this.resourceCache.setData(
      "updateJitterTexture",
      (jitterSize: number, filterSize: number) => {
        this.updateJitterTexture(jitterSize, filterSize);
      }
    );
    
    // Attach program to settings for automatic uniform updates
    SettingsManager.instance.attatchProgram(this.program!, [
      "usingPCF",
      "csmShadowBias",
      "csmPcfBiasScale",
      "pcfRadius",
      "jitterSize",
      "filterSize",
      "jitterScale",
      "debugPauseMode"
    ]);
  }

  public initRenderTarget(): RenderTarget {
    const fbo = this.gl.createFramebuffer();
    if (!fbo) {
      throw new Error("Failed to create framebuffer");
    }
    // RGBA16F: R = shadow mask, G = primary cascade, B = secondary cascade, A = blend factor
    const CSMshadowMaskTexture = TextureUtils.createTexture2D(
      this.gl,
      this.canvas.width,
      this.canvas.height,
      this.gl.RGBA16F,
      this.gl.RGBA,
      this.gl.FLOAT
    );
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      CSMshadowMaskTexture,
      0
    );
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    return { fbo, textures: { sunShadowMask: CSMshadowMaskTexture } };
  }

  public resize(width: number, height: number): void {
    this.disposeRenderTarget();
    this.renderTarget = this.initRenderTarget();
  }

  public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const textures = this.renderGraph!.getOutputs(this);
    const shadowDepthTextureArray = textures["shadowDepthTextureArray"];
    const depthTexture = textures["depth"];
    const normalTexture = textures["normal"];
    
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);
    this.gl.useProgram(this.program!);
    this.gl.bindVertexArray(vao.vao);

    // Bind textures
    TextureUtils.bindTex(this.gl, this.program!, depthTexture, "depthTexture", 0);
    TextureUtils.bindTex(this.gl, this.program!, normalTexture, "normalTexture", 1);
    TextureUtils.bindTex(this.gl, this.program!, shadowDepthTextureArray, "shadowDepthTextureArray", 2, this.gl.TEXTURE_2D_ARRAY);
    
    // Bind jitter texture
    this.gl.activeTexture(this.gl.TEXTURE3);
    this.gl.bindTexture(this.gl.TEXTURE_3D, this.jitterTexture);
    this.gl.uniform1i(this.gl.getUniformLocation(this.program!, "jitterTexture"), 3);

    // Camera uniforms
    const cameraInfo = this.resourceCache.getData("CameraInfo");
    const pausedCameraInfo = this.resourceCache.getData("pausedCameraInfo") ?? cameraInfo;
    this.gl.uniformMatrix4fv(this.uniforms["viewInverse"], false, cameraInfo.matViewInverse);
    this.gl.uniformMatrix4fv(this.uniforms["projInverse"], false, cameraInfo.matProjInverse);
    this.gl.uniformMatrix4fv(this.uniforms["pausedView"], false, pausedCameraInfo.matView);

    // CSM uniforms
    const numCascades = this.resourceCache.getData("numCascades") ?? 3;
    const lightSpaceMatrices = this.resourceCache.getData("lightSpaceMatrices");
    if (lightSpaceMatrices && Array.isArray(lightSpaceMatrices) && lightSpaceMatrices.length === numCascades) {
      const flattened = new Float32Array(numCascades * 16);
      for (let i = 0; i < numCascades; i++) {
        flattened.set(lightSpaceMatrices[i], i * 16);
      }
      this.gl.uniformMatrix4fv(this.uniforms["lightSpaceMatrices"], false, flattened);
    }

    const cascadeSplits = this.resourceCache.getData("cascadeSplits");
    if (cascadeSplits && Array.isArray(cascadeSplits) && cascadeSplits.length === numCascades) {
      this.gl.uniform1fv(this.uniforms["cascadeSplits"], cascadeSplits);
    }

    const cascadeBlendWidth = this.resourceCache.getData("cascadeBlendWidth") ?? 0.5;
    const csmEnabled = this.resourceCache.getData("csmEnabled") ?? true;
    const csmShadowMapSize = this.resourceCache.getData("csmShadowMapSize");
    const disableSun = this.resourceCache.getData("disableSun") ?? false;

    this.gl.uniform1f(this.uniforms["cascadeBlendWidth"], cascadeBlendWidth);
    this.gl.uniform1i(this.uniforms["csmEnabled"], csmEnabled ? 1 : 0);
    this.gl.uniform1i(this.uniforms["csmShadowMapSize"], csmShadowMapSize);
    this.gl.uniform1i(this.uniforms["numCascades"], numCascades);
    this.gl.uniform1i(this.uniforms["sunDisabled"], disableSun ? 1 : 0);

    // Update settings-driven uniforms
    SettingsManager.instance.updateProgramUniforms(this.gl, this.program!);

    // Sun light direction
    const sunLight = this.resourceCache.getData("sunLight");
    if (sunLight && !disableSun) {
      const dirLoc = this.gl.getUniformLocation(this.program!, "SunLight.direction");
      if (dirLoc) this.gl.uniform3fv(dirLoc, sunLight.direction);
    } else {
      const dirLoc = this.gl.getUniformLocation(this.program!, "SunLight.direction");
      if (dirLoc) this.gl.uniform3fv(dirLoc, vec3.fromValues(0, -1, 0));
    }

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
  public updateJitterTexture(jitterSize: number, filterSize: number): void {
    this.jitterTexture = createJitterTexture(this.gl, jitterSize, filterSize);
  }
}

// R2 sequence constants (plastic constant based low-discrepancy sequence)
// Has blue noise properties - samples are well-distributed without clumping
const PLASTIC_CONSTANT = 1.32471795724474602596;
const R2_A1 = 1.0 / PLASTIC_CONSTANT;
const R2_A2 = 1.0 / (PLASTIC_CONSTANT * PLASTIC_CONSTANT);

// Generate R2 sequence point (blue noise distribution)
function r2Sequence(n: number): [number, number] {
  return [
    (0.5 + n * R2_A1) % 1.0,
    (0.5 + n * R2_A2) % 1.0
  ];
}

// Hash function for per-pixel variation while maintaining blue noise properties
function blueNoiseHash(x: number, y: number, seed: number): number {
  // Interleaved gradient noise - has blue noise frequency spectrum
  const magic = 52.9829189;
  const dot = x * 0.06711056 + y * 0.00583715 + seed * 0.00239123;
  return (magic * (dot % 1.0)) % 1.0;
}

export function createJitterTexture(
  gl: WebGL2RenderingContext,
  size: number,
  filterSize: number
): WebGLTexture {
  const data = new Float32Array(size * size * filterSize * filterSize * 2);
  const totalSamples = filterSize * filterSize;

  let index = 0;
  for (let texY = 0; texY < size; texY++) {
    for (let texX = 0; texX < size; texX++) {
      // Per-pixel rotation angle using blue noise hash
      const pixelRotation = blueNoiseHash(texX, texY, 0) * Math.PI * 2;
      const cosRot = Math.cos(pixelRotation);
      const sinRot = Math.sin(pixelRotation);
      
      for (let i = 0; i < totalSamples; i++) {
        // Use R2 sequence for well-distributed samples in the disk
        const [u, v] = r2Sequence(i + texX * totalSamples + texY * size * totalSamples);
        
        // Convert to polar coordinates for disk sampling
        const angle = u * Math.PI * 2;
        const radius = Math.sqrt(v); // sqrt for uniform disk distribution
        
        // Generate point in unit disk
        let px = radius * Math.cos(angle);
        let py = radius * Math.sin(angle);
        
        // Apply per-pixel rotation for spatial variation
        const rotatedX = px * cosRot - py * sinRot;
        const rotatedY = px * sinRot + py * cosRot;
        
        data[index] = rotatedX;
        data[index + 1] = rotatedY;
        index += 2;
      }
    }
  }

  const texture = gl.createTexture();
  const layers = (filterSize * filterSize) / 2;
  gl.bindTexture(gl.TEXTURE_3D, texture);
  gl.texImage3D(
    gl.TEXTURE_3D,
    0,
    gl.RGBA32F,
    layers,
    size,
    size,
    0,
    gl.RGBA,
    gl.FLOAT,
    data
  );
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindTexture(gl.TEXTURE_3D, null);
  return texture!;
}