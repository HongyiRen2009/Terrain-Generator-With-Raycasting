import SSAOVertexShaderSource from "../glsl/DeferredRendering/SSAO.vert";
import SSAOFragmentShaderSource from "../glsl/DeferredRendering/SSAO.frag";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { RenderUtils } from "../../utils/RenderUtils";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { TextureUtils } from "../../utils/TextureUtils";
import { getUniformLocations } from "../renderSystem/managers/ResourceCache";
import { vec3 } from "gl-matrix";
import { SettingsSection } from "../../Settings";

export class SSAOPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
  private kernelSize: number = 64;
  private noiseSize: number = 4;
  private kernels: vec3[] = [];
  private noiseTexture: WebGLTexture | null = null;
  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    this.program = RenderUtils.CreateProgram(
      gl,
      SSAOVertexShaderSource,
      SSAOFragmentShaderSource
    )!;
    this.renderTarget = this.initRenderTarget();
    this.uniforms = getUniformLocations(gl, this.program!, [
      "proj",
      "projInverse",
      "noiseSize"
    ]);
    // Initialize settings manager for SSAO settings
    this.settingsSection = new SettingsSection(
      document.getElementById("settings-section")!,
      "SSAO Settings",
      this.program
    );
    this.settingsSection.addSlider({
      id: "radius",
      label: "SSAO Radius",
      min: 0.1,
      max: 10.0,
      step: 0.01,
      defaultValue: 5.0
    });
    this.settingsSection.addSlider({
      id: "bias",
      label: "SSAO Bias",
      min: 0.0,
      max: 11,
      step: 0.001,
      defaultValue: 0.025
    });
    this.settingsSection.addCheckbox({
      id: "enableSSAO",
      label: "Enable SSAO",
      defaultValue: true
    });
    this.generateKernels();
    this.generateNoiseTexture();
  }
  protected initRenderTarget(width?: number, height?: number): RenderTarget {
    const w = width || this.canvas.width;
    const h = height || this.canvas.height;

    const ssaoTexture = TextureUtils.createTexture2D(
      this.gl,
      w,
      h,
      this.gl.R8,
      this.gl.RED,
      this.gl.UNSIGNED_BYTE
    );

    const fbo = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      ssaoTexture,
      0
    );

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    return {
      fbo: fbo,
      textures: { ssao: ssaoTexture }
    };
  }

  public render(vao_info: VaoInfo | VaoInfo[]): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const gBuffer = this.renderGraph!.getOutputs(this);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.program);
    this.gl.bindVertexArray(vao.vao);
    this.settingsSection?.updateUniforms(this.gl);
    // Get textures from geometry pass using named keys
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      gBuffer["normal"],
      "normalTexture",
      0
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      gBuffer["depth"],
      "depthTexture",
      1
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      this.noiseTexture!,
      "noiseTexture",
      2
    );

    const cameraInfo = this.resourceCache.getData("CameraInfo");
    this.gl.uniformMatrix4fv(this.uniforms["proj"], false, cameraInfo.matProj);
    this.gl.uniformMatrix4fv(
      this.uniforms["projInverse"],
      false,
      cameraInfo.matProjInverse
    );
    this.gl.uniform1f(this.uniforms["noiseSize"], this.noiseSize);

    // Upload kernel samples
    for (let i = 0; i < this.kernelSize; i++) {
      this.gl.uniform3fv(
        this.gl.getUniformLocation(this.program!, `samples[${i}]`),
        this.kernels[i]
      );
    }

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
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
    this.renderTarget = this.initRenderTarget(width, height);
  }
  private generateKernels(): void {
    this.kernels = [];
    for (let i = 0; i < this.kernelSize; i++) {
      let sample = vec3.fromValues(
        Math.random() * 2.0 - 1.0,
        Math.random() * 2.0 - 1.0,
        Math.random()
      );

      vec3.normalize(sample, sample);

      let scale = i / this.kernelSize;
      scale = 0.1 + scale * scale * 0.9;
      vec3.scale(sample, sample, scale);

      this.kernels.push(sample);
    }
  }

  private generateNoiseTexture(): void {
    const noiseData = new Float32Array(this.noiseSize * this.noiseSize * 3);
    for (let i = 0; i < this.noiseSize; i++) {
      for (let j = 0; j < this.noiseSize; j++) {
        const index = (i * this.noiseSize + j) * 3;
        noiseData[index] = Math.random() * 2.0 - 1.0;
        noiseData[index + 1] = Math.random() * 2.0 - 1.0;
        noiseData[index + 2] = 0.0;
      }
    }
    this.noiseTexture = TextureUtils.createTexture2D(
      this.gl,
      this.noiseSize,
      this.noiseSize,
      this.gl.RGB32F,
      this.gl.RGB,
      this.gl.FLOAT,
      noiseData,
      this.gl.NEAREST,
      this.gl.NEAREST,
      this.gl.REPEAT,
      this.gl.REPEAT
    );
  }
}
