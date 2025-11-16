import { RenderUtils } from "../../utils/RenderUtils";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { RenderTarget } from "../renderSystem/RenderTarget";
import FinalVertexShaderSource from "../glsl/DeferredRendering/FinalPass.vert";
import FinalFragmentShaderSource from "../glsl/DeferredRendering/FinalPass.frag";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { TextureUtils } from "../../utils/TextureUtils";
import { SettingsSection } from "../../Settings";
import { getUniformLocations } from "../renderSystem/managers/ResourceCache";

export class FinalPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
  public pathtracerRender: boolean = false;

  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    this.program = RenderUtils.CreateProgram(
      gl,
      FinalVertexShaderSource,
      FinalFragmentShaderSource
    )!;

    this.uniforms = getUniformLocations(gl, this.program!, ["resolution"]);

    // Initialize settings manager for post-processing effects
    this.settingsSection = new SettingsSection(
      document.getElementById("settings-section")!,
      "Post Processing",
      this.program
    );

    // Vignette settings
    this.settingsSection.addCheckbox({
      id: "enableVignette",
      label: "Enable Vignette",
      defaultValue: true
    });
    this.settingsSection.addSlider({
      id: "vignetteStrength",
      label: "Vignette Strength",
      min: 0.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 0.5
    });
    this.settingsSection.addSlider({
      id: "vignetteRadius",
      label: "Vignette Radius",
      min: 0.1,
      max: 2.0,
      step: 0.01,
      defaultValue: 0.8
    });

    // Chromatic Aberration settings
    this.settingsSection.addCheckbox({
      id: "enableChromaticAberration",
      label: "Enable Chromatic Aberration",
      defaultValue: false
    });
    this.settingsSection.addSlider({
      id: "chromaticAberrationStrength",
      label: "Chromatic Aberration Strength",
      min: 0.0,
      max: 0.05,
      step: 0.001,
      defaultValue: 0.005
    });

    // Film Grain settings
    this.settingsSection.addCheckbox({
      id: "enableFilmGrain",
      label: "Enable Film Grain",
      defaultValue: false
    });
    this.settingsSection.addSlider({
      id: "filmGrainStrength",
      label: "Film Grain Strength",
      min: 0.0,
      max: 0.5,
      step: 0.01,
      defaultValue: 0.1
    });

    // Bloom settings
    this.settingsSection.addCheckbox({
      id: "enableBloom",
      label: "Enable Bloom",
      defaultValue: false
    });
    this.settingsSection.addSlider({
      id: "bloomThreshold",
      label: "Bloom Threshold",
      min: 0.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0
    });
    this.settingsSection.addSlider({
      id: "bloomIntensity",
      label: "Bloom Intensity",
      min: 0.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 0.5
    });

    // Tone Mapping settings
    this.settingsSection.addCheckbox({
      id: "enableToneMapping",
      label: "Enable Tone Mapping",
      defaultValue: false
    });
    this.settingsSection.addSlider({
      id: "exposure",
      label: "Exposure",
      min: 0.1,
      max: 5.0,
      step: 0.1,
      defaultValue: 1.0
    });
    this.settingsSection.addSlider({
      id: "gamma",
      label: "Gamma",
      min: 1.0,
      max: 3.0,
      step: 0.1,
      defaultValue: 2.2
    });

    // Saturation settings
    this.settingsSection.addSlider({
      id: "saturation",
      label: "Saturation",
      min: 0.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0
    });

    // Contrast settings
    this.settingsSection.addSlider({
      id: "contrast",
      label: "Contrast",
      min: 0.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0
    });

    // Brightness settings
    this.settingsSection.addSlider({
      id: "brightness",
      label: "Brightness",
      min: 0.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0
    });
  }

  protected initRenderTarget(): RenderTarget {
    return { fbo: null, textures: {} };
  }

  public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const textures = this.renderGraph!.getOutputs(this);
    const colorTexture = textures["finalTexture"];

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.useProgram(this.program);

    // Update uniforms from settings
    this.settingsSection?.updateUniforms(this.gl);

    // Set resolution uniform
    this.gl.uniform2f(
      this.uniforms["resolution"],
      this.canvas.width,
      this.canvas.height
    );

    TextureUtils.bindTex(
      this.gl,
      this.program!,
      colorTexture!,
      "sceneTexture",
      0
    );

    this.gl.bindVertexArray(vao.vao);
    if (!pathtracerOn || this.pathtracerRender) {
      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
}
