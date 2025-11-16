import { vec3 } from "gl-matrix";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import GrassVertexShaderSource from "../glsl/Grass/Grass.vert";
import GrassFragmentShaderSource from "../glsl/Grass/Grass.frag";
import { RenderUtils } from "../../utils/RenderUtils";
import { GrassVAOInfo, VaoInfo } from "../renderSystem/managers/VaoManager";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { TextureUtils } from "../../utils/TextureUtils";
import { createNoise2D } from "simplex-noise";
import { SettingsSection } from "../../Settings";

export class GrassPass extends RenderPass {
  public VAOInputType = VAOInputType.GRASS;
  public pathtracerRender: boolean = true;

  protected program: WebGLProgram | null;

  private grassThickness = 0.1;
  private windStrengthNoiseTexture: WebGLTexture | null = null;
  private windDirectionNoiseTexture: WebGLTexture | null = null;
  protected settingsSection: SettingsSection | null = null;

  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    this.windStrengthNoiseTexture = this.generateNoiseTexture(256);
    this.windDirectionNoiseTexture = this.generateNoiseTexture(256);
    this.visualizeNoiseTexture(
      document.getElementById("noisePreview") as HTMLCanvasElement,
      this.windDirectionNoiseTexture
    );
    this.program = RenderUtils.CreateProgram(
      gl,
      GrassVertexShaderSource,
      GrassFragmentShaderSource
    )!;
    this.initSettings();
  }

  private initSettings() {
    this.settingsSection = new SettingsSection(
      document.getElementById("settings-section")!,
      "Grass Settings",
      this.program!
    );
    this.settingsSection.addSlider({
      id: "specularStrength",
      label: "Specular Strength",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.3
    });
    this.settingsSection.addSlider({
      id: "shininess",
      label: "Shininess",
      min: 1,
      max: 100,
      step: 1,
      defaultValue: 32
    });
    this.settingsSection.addSlider({
      id: "translucencyStrength",
      label: "Translucency Strength",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.25
    });
    this.settingsSection.addSlider({
      id: "windStrength",
      label: "Wind Strength",
      min: 0,
      max: 5,
      step: 0.1,
      defaultValue: 0.5
    });
    this.settingsSection.addSlider({
      id: "windSpeed",
      label: "Wind Speed",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.3
    });
    this.settingsSection.addSlider({
      id: "windFrequency",
      label: "Wind Frequency",
      min: 0.1,
      max: 1,
      step: 0.01,
      defaultValue: 0.13
    });
  }

  protected initRenderTarget(): RenderTarget {
    return { fbo: null, textures: {} };
  }

  public render(grassVAOInfo: GrassVAOInfo, pathtracerOn: boolean): void {
    const gl = this.gl;
    const grassVAO = grassVAOInfo;
    if (!grassVAO) return;

    gl.useProgram(this.program);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    const gBuffer = this.renderGraph!.getOutputs(this);
    const depthTexture = gBuffer["depth"];
    if (pathtracerOn) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else {
      const lightingFBO = this.renderGraph!.getPass(
        "Terrain Lighting Pass"
      )?.getRenderTarget()?.fbo;
      gl.bindFramebuffer(gl.FRAMEBUFFER, lightingFBO!);
    }
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);

    const cameraInfo = this.resourceCache.getUniformData("CameraInfo");
    if (cameraInfo) {
      gl.uniformMatrix4fv(
        gl.getUniformLocation(this.program!, "viewMatrix"),
        false,
        cameraInfo.matView
      );
      gl.uniformMatrix4fv(
        gl.getUniformLocation(this.program!, "projMatrix"),
        false,
        cameraInfo.matProj
      );
    }

    gl.uniform3fv(
      gl.getUniformLocation(this.program!, "sunPos"),
      this.resourceCache.getUniformData("lights")[0].position
    );
    gl.uniform3fv(
      gl.getUniformLocation(this.program!, "viewDir"),
      this.resourceCache.getUniformData("cameraDirection")
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program!, "grassThickness"),
      this.grassThickness
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program!, "time"),
      performance.now() / 1000
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program!, "near"),
      cameraInfo?.nearPlane || 0.1
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program!, "far"),
      cameraInfo?.farPlane || 100
    );
    TextureUtils.bindTex(
      gl,
      this.program!,
      this.windStrengthNoiseTexture!,
      "windStrengthNoiseTex",
      0
    );
    TextureUtils.bindTex(
      gl,
      this.program!,
      this.windDirectionNoiseTexture!,
      "windDirectionNoiseTex",
      1
    );
    TextureUtils.bindTex(gl, this.program!, depthTexture!, "depthTexture", 2);

    this.settingsSection?.updateUniforms(gl);

    const cameraPos = this.resourceCache.getUniformData("cameraPosition") as
      | vec3
      | undefined;
    if (!cameraPos) return;

    if (!pathtracerOn || this.pathtracerRender) {
      for (let i = 0; i < grassVAO.lodLevels.length; i++) {
        const lod = grassVAO.lodLevels[i];
        const patchCenter = vec3.fromValues(0, 20, 33);
        const distance = vec3.distance(cameraPos, patchCenter);
        if (distance <= lod.maxDistance) {
          gl.bindVertexArray(lod.vao);
          gl.drawElementsInstanced(
            gl.TRIANGLES,
            lod.indexCount,
            gl.UNSIGNED_SHORT,
            0,
            grassVAO.numInstances
          );
          break;
        }
      }
    }
    gl.bindVertexArray(null);
  }

  private generateNoiseTexture(size: number): WebGLTexture {
    const noiseFunction = createNoise2D();
    const data = new Uint8Array(size * size);

    const octaves = 4;
    const persistence = 0.5;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
          const nx = (x / size) * 10 * frequency;
          const ny = (y / size) * 10 * frequency;
          value += noiseFunction(nx, ny) * amplitude;
          maxValue += amplitude;
          amplitude *= persistence;
          frequency *= 2;
        }

        value /= maxValue;
        value = 0.5 + value * 0.5;
        const normalized = Math.floor(((value + 1) / 2) * 255);
        data[y * size + x] = normalized;
      }
    }
    const texture = TextureUtils.createTexture2D(
      this.gl,
      size,
      size,
      this.gl.R8,
      this.gl.RED,
      this.gl.UNSIGNED_BYTE,
      data,
      this.gl.LINEAR,
      this.gl.LINEAR,
      this.gl.REPEAT,
      this.gl.REPEAT
    );
    return texture;
  }

  private visualizeNoiseTexture(
    canvas: HTMLCanvasElement,
    texture: WebGLTexture
  ) {
    const gl = this.gl;
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const ctx = canvas.getContext("2d")!;
    const width = canvas.width;
    const height = canvas.height;
    const pixels = new Uint8Array(width * height * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const imageData = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const value = pixels[i * 4];
      imageData.data[i * 4 + 0] = value;
      imageData.data[i * 4 + 1] = value;
      imageData.data[i * 4 + 2] = value;
      imageData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  public dispose() {
    super.dispose();
  }
}
