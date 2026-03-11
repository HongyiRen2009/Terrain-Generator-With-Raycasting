import { RenderUtils } from "../../utils/RenderUtils";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { RenderTarget } from "../renderSystem/RenderTarget";
import FinalVertexShaderSource from "../glsl/DeferredRendering/FinalPass.vert";
import FinalFragmentShaderSource from "../glsl/DeferredRendering/FinalPass.frag";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { TextureUtils } from "../../utils/TextureUtils";
import { SettingsManager } from "../../Settings";
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

    // Use SettingsManager for post-processing settings
    SettingsManager.instance.createSection(
      document.getElementById("settings-section")!,
      "Post Processing"
    );
    SettingsManager.instance.addCheckboxToSection("Post Processing", {
      id: "enableVignette",
      label: "Enable Vignette",
      defaultValue: true
    });
    SettingsManager.instance.addSliderToSection("Post Processing", {
      id: "vignetteStrength",
      label: "Vignette Strength",
      min: 0.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 0.5
    });
    SettingsManager.instance.addSliderToSection("Post Processing", {
      id: "vignetteRadius",
      label: "Vignette Radius",
      min: 0.1,
      max: 2.0,
      step: 0.01,
      defaultValue: 0.8
    });

    // Chromatic Aberration settings
    SettingsManager.instance.addCheckboxToSection("Post Processing", {
      id: "enableChromaticAberration",
      label: "Enable Chromatic Aberration",
      defaultValue: false
    });
    SettingsManager.instance.addSliderToSection("Post Processing", {
      id: "chromaticAberrationStrength",
      label: "Chromatic Aberration Strength",
      min: 0.0,
      max: 0.05,
      step: 0.001,
      defaultValue: 0.005
    });

    // Film Grain settings
    SettingsManager.instance.addCheckboxToSection("Post Processing", {
      id: "enableFilmGrain",
      label: "Enable Film Grain",
      defaultValue: false
    });
    SettingsManager.instance.addSliderToSection("Post Processing", {
      id: "filmGrainStrength",
      label: "Film Grain Strength",
      min: 0.0,
      max: 0.5,
      step: 0.01,
      defaultValue: 0.1
    });

    // Bloom settings
    SettingsManager.instance.addCheckboxToSection("Post Processing", {
      id: "enableBloom",
      label: "Enable Bloom",
      defaultValue: false
    });
    SettingsManager.instance.addSliderToSection("Post Processing", {
      id: "bloomThreshold",
      label: "Bloom Threshold",
      min: 0.0,
      max: 5.0,
      step: 0.01,
      defaultValue: 1.5 // Only bloom HDR emissive objects (lights are at ~4.0 brightness)
    });
    SettingsManager.instance.addSliderToSection("Post Processing", {
      id: "bloomIntensity",
      label: "Bloom Intensity",
      min: 0.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 0.8 // Stronger bloom effect
    });

    // Tone Mapping settings
    SettingsManager.instance.addCheckboxToSection("Post Processing", {
      id: "enableToneMapping",
      label: "Enable Tone Mapping",
      defaultValue: true
    });
    SettingsManager.instance.addCheckboxToSection("Post Processing", {
      id: "useACES",
      label: "Use ACES Tone Mapping",
      defaultValue: true
    });
    SettingsManager.instance.addSliderToSection("Post Processing", {
      id: "exposure",
      label: "Exposure",
      min: 0.1,
      max: 5.0,
      step: 0.1,
      defaultValue: 1.0
    });
    SettingsManager.instance.addSliderToSection("Post Processing", {
      id: "gamma",
      label: "Gamma",
      min: 1.0,
      max: 3.0,
      step: 0.1,
      defaultValue: 2.2
    });

    // Saturation settings
    SettingsManager.instance.addSliderToSection("Post Processing", {
      id: "saturation",
      label: "Saturation",
      min: 0.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0
    });

    // Contrast settings
    SettingsManager.instance.addSliderToSection("Post Processing", {
      id: "contrast",
      label: "Contrast",
      min: 0.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0
    });

    // Brightness settings
    SettingsManager.instance.addSliderToSection("Post Processing", {
      id: "brightness",
      label: "Brightness",
      min: 0.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0
    });
    SettingsManager.instance.attatchProgram(this.program!, [
      "enableVignette",
      "vignetteStrength",
      "vignetteRadius",
      "enableChromaticAberration",
      "chromaticAberrationStrength",
      "enableFilmGrain",
      "filmGrainStrength",
      "enableBloom",
      "bloomThreshold",
      "bloomIntensity",
      "enableToneMapping",
      "useACES",
      "exposure",
      "gamma",
      "saturation",
      "contrast",
      "brightness"
    ]);
  }

  protected initRenderTarget(): RenderTarget {
    return { fbo: null, textures: {} };
  }

public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const textures = this.renderGraph!.getOutputs(this);
    const sceneTexture = textures["sceneTexture"];
    const cloudsTexture = textures["cloudsTexture"]; // <-- Add this line

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.useProgram(this.program);

    SettingsManager.instance.updateProgramUniforms(this.gl, this.program!);
    // Set resolution uniform
    this.gl.uniform2f(
      this.uniforms["resolution"],
      this.canvas.width,
      this.canvas.height
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      sceneTexture!,
      "sceneTexture",
      0
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      cloudsTexture!,
      "cloudsTexture",
      1
    );

    this.gl.bindVertexArray(vao.vao);
    if (!pathtracerOn || this.pathtracerRender) {
      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
}
}
