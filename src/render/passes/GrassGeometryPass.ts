import { vec3 } from "gl-matrix";
import { TextureUtils } from "../../utils/TextureUtils";
import { VaoInfo, GrassVAOInfo } from "../renderSystem/managers/VaoManager";
import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { SettingsManager } from "../../Settings";
import grassGeometryVertexSource from "../glsl/Grass/GrassGeometry.vert";
import grassGeometryFragmentSource from "../glsl/Grass/GrassGeometry.frag";
import { RenderUtils } from "../../utils/RenderUtils";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { createNoise2D } from "simplex-noise";

export class GrassGeometryPass extends RenderPass {
  public pathtracerRender: boolean = false;
  public VAOInputType: VAOInputType = VAOInputType.GRASS;
  private windStrengthNoiseTexture: WebGLTexture | null = null;
  private windDirectionNoiseTexture: WebGLTexture | null = null;

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
      grassGeometryVertexSource,
      grassGeometryFragmentSource
    )!;
    this.windStrengthNoiseTexture = this.generateNoiseTexture(256);
    this.windDirectionNoiseTexture = this.generateNoiseTexture(256);
    // Initialize grass enabled state
    this.resourceCache.setData("grassEnabled", true);
    this.initSettings();
  }

  protected initRenderTarget(): RenderTarget {
    const fbo = this.gl.createFramebuffer();
    if (!fbo)
      throw new Error("Failed to create framebuffer for GrassGeometryPass");
    const depthTexture = TextureUtils.createTexture2D(
      this.gl,
      this.canvas.width,
      this.canvas.height,
      this.gl.DEPTH_COMPONENT32F,
      this.gl.DEPTH_COMPONENT,
      this.gl.FLOAT
    );
    const normalTexture = TextureUtils.createTexture2D(
      this.gl,
      this.canvas.width,
      this.canvas.height,
      this.gl.RGBA16F,
      this.gl.RGBA,
      this.gl.FLOAT
    );
    const albedoTexture = TextureUtils.createTexture2D(
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
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0, this.gl.COLOR_ATTACHMENT1]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    return {
      fbo,
      textures: {
        grassDepth: depthTexture,
        grassNormal: normalTexture,
        grassAlbedo: albedoTexture
      }
    };
  }

  private initSettings(): void {
    SettingsManager.instance.createSection(
      document.getElementById("settings-section")!,
      "Grass Settings"
    );

    // Enable/Disable grass
    SettingsManager.instance.addCheckboxToSection("Grass Settings", {
      id: "grassEnabled",
      label: "Enable Grass",
      defaultValue: true,
      onChange: (value: boolean) => {
        this.resourceCache.setData("grassEnabled", value);
      }
    });

    // Color settings
    SettingsManager.instance.addColorPickerToSection("Grass Settings", {
      id: "grassBaseColor",
      label: "Grass Base Color",
      defaultValue: "#046204"
    });
    SettingsManager.instance.addColorPickerToSection("Grass Settings", {
      id: "grassTipColor",
      label: "Grass Tip Color",
      defaultValue: "#00ff00"
    });
    SettingsManager.instance.addColorPickerToSection("Grass Settings", {
      id: "grassSpecularColor",
      label: "Grass Specular Color",
      defaultValue: "#ffffff"
    });
    SettingsManager.instance.addColorPickerToSection("Grass Settings", {
      id: "grassTranslucencyColor",
      label: "Grass Translucency Color",
      defaultValue: "#b3ff80"
    });

    // Lighting settings
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "grassDiffuseStrength",
      label: "Grass Diffuse Strength",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.3
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "grassBaseDarkness",
      label: "Grass Base Darkness",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.7
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "grassSpecularStrength",
      label: "Grass Specular Strength",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.25
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "grassShininess",
      label: "Grass Shininess",
      min: 1,
      max: 100,
      step: 1,
      defaultValue: 32
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "grassTranslucencyStrength",
      label: "Grass Translucency Strength",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.7
    });

    // Transition settings
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "grassAmbientTransitionPower",
      label: "Grass Ambient Transition Power",
      min: 0.1,
      max: 5,
      step: 0.1,
      defaultValue: 1
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "grassSpecularTransitionPower",
      label: "Grass Specular Transition Power",
      min: 0.1,
      max: 5,
      step: 0.1,
      defaultValue: 2
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "grassTranslucencyTransitionPower",
      label: "Grass Translucency Transition Power",
      min: 0.1,
      max: 5,
      step: 0.1,
      defaultValue: 0.7
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "sunShadowStrength",
      label: "Sun Shadow Strength",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.3
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "pointLightShadowStrength",
      label: "Point Light Shadow Strength",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.3
    });
    // Wind settings
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "grassWindStrength",
      label: "Grass Wind Strength",
      min: 0,
      max: 5,
      step: 0.1,
      defaultValue: 0.5
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "grassWindFrequency",
      label: "Grass Wind Frequency",
      min: 0.1,
      max: 5,
      step: 0.1,
      defaultValue: 0.13
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "grassWindSpeed",
      label: "Grass Wind Speed",
      min: 0,
      max: 5,
      step: 0.01,
      defaultValue: 0.3
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "grassPointLightintensity",
      label: "Grass Point Light Intensity",
      min: 0,
      max: 5,
      step: 0.1,
      defaultValue: 1.2
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "grassPointLightDiffuseSoftness",
      label: "Grass Point Light Diffuse Softness",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.6
    });
    SettingsManager.instance.attatchProgram(this.program!, [
      "grassWindStrength",
      "grassWindFrequency",
      "grassWindSpeed"
    ]);
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

  public render(
    vao_info: VaoInfo | VaoInfo[] | GrassVAOInfo,
    pathtracerOn: boolean
  ): void {
    if (!this.program) return;

    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTarget!.fbo);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Check if grass is enabled - if not, we've already cleared the buffers
    // so the depth will be 1.0 (far plane), ensuring scene geometry is used
    const grassEnabled = this.resourceCache.getData("grassEnabled") ?? true;
    if (!grassEnabled) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return;
    }

    gl.useProgram(this.program);
    const cameraInfo = this.resourceCache.getData("CameraInfo");
    const cameraPos = this.resourceCache.getData("cameraPosition") as
      | vec3
      | undefined;
    const gBuffer = this.renderGraph!.getOutputs(this);
    if (!cameraPos) return;

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

    gl.uniform1f(
      gl.getUniformLocation(this.program!, "time"),
      performance.now() / 1000
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program!, "near"),
      this.resourceCache.getData("nearFarPlanes").near
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program!, "far"),
      this.resourceCache.getData("nearFarPlanes").far
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
    SettingsManager.instance.updateProgramUniforms(gl, this.program!);

    const grassVAO = vao_info as GrassVAOInfo;
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
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);
  }
}
