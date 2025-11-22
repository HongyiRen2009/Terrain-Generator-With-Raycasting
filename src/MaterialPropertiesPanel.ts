import { SettingsSection } from "./Settings";
import { LightingPass } from "./render/passes/LightingPass";

export class MaterialPropertiesPanel {
  private panelElement: HTMLElement;
  private toggleButton: HTMLElement;
  private isOpen: boolean = false;
  private settingsSection: SettingsSection;
  private gl: WebGL2RenderingContext;
  private lightingProgram: WebGLProgram | null = null;
  private lightingPass: LightingPass | null = null;

  // Material properties with defaults
  private properties = {
    // Color
    colorR: 0.5,
    colorG: 0.7,
    colorB: 0.3,
    colorBlendStrength: 0.7,
    colorIntensity: 1.0,
    // Material
    metallicity: 0.0,
    roughness: 0.5,
    ambient: 0.3,
    specularIntensity: 1.0,
    specularPower: 16.0,
    // Terrain shading features
    slopeShadingStrength: 0.0,
    heightGradientStrength: 0.0,
    heightGradientTopR: 1.0,
    heightGradientTopG: 1.0,
    heightGradientTopB: 1.0,
    heightGradientBottomR: 0.2,
    heightGradientBottomG: 0.4,
    heightGradientBottomB: 0.6,
    curvatureStrength: 0.0,
    detailNoiseStrength: 0.0,
    detailNoiseScale: 10.0,
    patchinessStrength: 0.0,
    patchinessScale: 5.0,
    patchinessColorR: 0.3,
    patchinessColorG: 0.5,
    patchinessColorB: 0.2,
    ambientOcclusionStrength: 0.0,
    erosionNoiseStrength: 0.0,
    erosionNoiseScale: 8.0,
    microRoughnessStrength: 0.0,
    microRoughnessScale: 50.0,
    fogStrength: 0.0,
    fogHeight: 10.0,
    fogColorR: 0.5,
    fogColorG: 0.7,
    fogColorB: 1.0,
  };
  private colorPreview: HTMLElement | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.createUI();
    this.setupEventListeners();
    this.initializeSettings();
  }

  /**
   * Set the lighting program for uniform updates
   */
  public setLightingProgram(program: WebGLProgram): void {
    this.lightingProgram = program;
    if (this.settingsSection) {
      // Recreate settings section with the program
      const container = this.panelElement.querySelector(".material-settings-container") as HTMLElement;
      container.innerHTML = "";
      this.settingsSection = new SettingsSection(container, "Adjust Material", program);
      this.initializeSettings();
    }
  }

  /**
   * Set the lighting pass for material uniform updates
   */
  public setLightingPass(lightingPass: LightingPass): void {
    this.lightingPass = lightingPass;
    if (lightingPass && (lightingPass as any).program) {
      this.setLightingProgram((lightingPass as any).program);
    }
  }

  private createUI(): void {
    // Create the toggle button (bottom-right corner)
    this.toggleButton = document.createElement("button");
    this.toggleButton.id = "material-toggle";
    this.toggleButton.className = "material-toggle-button";
    this.toggleButton.innerHTML = "🎨";
    this.toggleButton.title = "Material Properties";
    document.body.appendChild(this.toggleButton);

    // Create the panel
    this.panelElement = document.createElement("div");
    this.panelElement.id = "material-panel";
    this.panelElement.className = "material-panel";

    // Panel header
    const header = document.createElement("div");
    header.className = "material-panel-header";
    header.innerHTML = `
      <h2>Material Properties</h2>
      <button class="close-material-panel">&times;</button>
    `;

    // Color preview section at top
    const colorPreviewSection = document.createElement("div");
    colorPreviewSection.className = "color-preview-section";
    colorPreviewSection.style.padding = "16px 20px";
    colorPreviewSection.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)";
    
    const colorPreviewLabel = document.createElement("div");
    colorPreviewLabel.textContent = "Current Color";
    colorPreviewLabel.style.color = "#a0aec0";
    colorPreviewLabel.style.fontSize = "12px";
    colorPreviewLabel.style.textTransform = "uppercase";
    colorPreviewLabel.style.letterSpacing = "1px";
    colorPreviewLabel.style.marginBottom = "8px";
    
    this.colorPreview = document.createElement("div");
    this.colorPreview.className = "color-preview-box";
    this.colorPreview.style.width = "100%";
    this.colorPreview.style.height = "60px";
    this.colorPreview.style.borderRadius = "8px";
    this.colorPreview.style.border = "2px solid rgba(255, 255, 255, 0.2)";
    this.colorPreview.style.background = this.rgbToHex(this.properties.colorR, this.properties.colorG, this.properties.colorB);
    this.colorPreview.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
    
    colorPreviewSection.appendChild(colorPreviewLabel);
    colorPreviewSection.appendChild(this.colorPreview);

    // Settings container
    const settingsContainer = document.createElement("div");
    settingsContainer.className = "material-settings-container";

    this.panelElement.appendChild(header);
    this.panelElement.appendChild(colorPreviewSection);
    this.panelElement.appendChild(settingsContainer);
    document.body.appendChild(this.panelElement);

    // Initialize settings section (will be updated when program is set)
    this.settingsSection = new SettingsSection(
      settingsContainer,
      "Adjust Material",
      undefined
    );
  }

  private setupEventListeners(): void {
    // Toggle button opens panel
    this.toggleButton.addEventListener("click", () => {
      this.togglePanel();
    });

    // Close button closes panel
    const closeBtn = this.panelElement.querySelector(".close-material-panel");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.closePanel();
      });
    }

    // Click outside panel to close
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (
        this.isOpen &&
        !this.panelElement.contains(target) &&
        !this.toggleButton.contains(target)
      ) {
        this.closePanel();
      }
    });
  }

  private initializeSettings(): void {
    // Color sliders - Red, Green, Blue (at top)
    this.settingsSection.addSlider({
      id: "u_terrainColorR",
      label: "Color - Red",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: this.properties.colorR,
      uniform: false,
      onChange: (value) => {
        this.properties.colorR = value;
        this.updateColorPreview();
        this.updateUniforms();
      },
    });

    this.settingsSection.addSlider({
      id: "u_terrainColorG",
      label: "Color - Green",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: this.properties.colorG,
      uniform: false,
      onChange: (value) => {
        this.properties.colorG = value;
        this.updateColorPreview();
        this.updateUniforms();
      },
    });

    this.settingsSection.addSlider({
      id: "u_terrainColorB",
      label: "Color - Blue",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: this.properties.colorB,
      uniform: false,
      onChange: (value) => {
        this.properties.colorB = value;
        this.updateColorPreview();
        this.updateUniforms();
      },
    });

    this.settingsSection.addSlider({
      id: "u_ambientStrength",
      label: "Ambient Strength",
      min: 0,
      max: 10,
      step: 0.1,
      defaultValue: this.properties.ambient,
      uniform: true,
      onChange: (value) => {
        this.properties.ambient = value;
        this.updateUniforms();
      },
    });

    this.settingsSection.addSlider({
      id: "u_specularIntensity",
      label: "Specular Intensity",
      min: 0,
      max: 100,
      step: 1,
      defaultValue: this.properties.specularIntensity,
      uniform: true,
      onChange: (value) => {
        this.properties.specularIntensity = value;
        this.updateUniforms();
      },
    });

    this.settingsSection.addSlider({
      id: "u_specularPower",
      label: "Specular Power (Shininess)",
      min: 1,
      max: 2048,
      step: 1,
      defaultValue: this.properties.specularPower,
      uniform: true,
      numType: "float",
      onChange: (value) => {
        this.properties.specularPower = value;
        this.updateUniforms();
      },
    });

    // Color blend strength - how much terrain color vs base texture
    this.settingsSection.addSlider({
      id: "u_colorBlendStrength",
      label: "Color Blend Strength",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: this.properties.colorBlendStrength,
      uniform: true,
      onChange: (value) => {
        this.properties.colorBlendStrength = value;
        this.updateUniforms();
      },
    });

    this.settingsSection.addSlider({
      id: "u_colorIntensity",
      label: "Color Intensity",
      min: 0,
      max: 10,
      step: 0.1,
      defaultValue: this.properties.colorIntensity,
      uniform: true,
      onChange: (value) => {
        this.properties.colorIntensity = value;
        this.updateUniforms();
      },
    });

    // Terrain Shading Features
    this.addTerrainShadingControls();
  }

  private addTerrainShadingControls(): void {
    // Slope-based shading
    this.settingsSection.addSlider({
      id: "u_slopeShadingStrength",
      label: "Slope Shading",
      min: 0,
      max: 2,
      step: 0.1,
      defaultValue: this.properties.slopeShadingStrength,
      uniform: true,
      onChange: (value) => {
        this.properties.slopeShadingStrength = value;
        this.updateUniforms();
      },
    });

    // Height gradient
    this.settingsSection.addSlider({
      id: "u_heightGradientStrength",
      label: "Height Gradient",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: this.properties.heightGradientStrength,
      uniform: true,
      onChange: (value) => {
        this.properties.heightGradientStrength = value;
        this.updateUniforms();
      },
    });

    // Curvature shading
    this.settingsSection.addSlider({
      id: "u_curvatureStrength",
      label: "Curvature Shading",
      min: 0,
      max: 2,
      step: 0.1,
      defaultValue: this.properties.curvatureStrength,
      uniform: true,
      onChange: (value) => {
        this.properties.curvatureStrength = value;
        this.updateUniforms();
      },
    });

    // Detail texture noise
    this.settingsSection.addSlider({
      id: "u_detailNoiseStrength",
      label: "Detail Noise",
      min: 0,
      max: 0.5,
      step: 0.01,
      defaultValue: this.properties.detailNoiseStrength,
      uniform: true,
      onChange: (value) => {
        this.properties.detailNoiseStrength = value;
        this.updateUniforms();
      },
    });

    this.settingsSection.addSlider({
      id: "u_detailNoiseScale",
      label: "Detail Noise Scale",
      min: 1,
      max: 100,
      step: 1,
      defaultValue: this.properties.detailNoiseScale,
      uniform: true,
      onChange: (value) => {
        this.properties.detailNoiseScale = value;
        this.updateUniforms();
      },
    });

    // Patchiness
    this.settingsSection.addSlider({
      id: "u_patchinessStrength",
      label: "Patchiness",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: this.properties.patchinessStrength,
      uniform: true,
      onChange: (value) => {
        this.properties.patchinessStrength = value;
        this.updateUniforms();
      },
    });

    this.settingsSection.addSlider({
      id: "u_patchinessScale",
      label: "Patchiness Scale",
      min: 1,
      max: 50,
      step: 1,
      defaultValue: this.properties.patchinessScale,
      uniform: true,
      onChange: (value) => {
        this.properties.patchinessScale = value;
        this.updateUniforms();
      },
    });

    // Ambient occlusion
    this.settingsSection.addSlider({
      id: "u_ambientOcclusionStrength",
      label: "Fake AO Strength",
      min: 0,
      max: 2,
      step: 0.1,
      defaultValue: this.properties.ambientOcclusionStrength,
      uniform: true,
      onChange: (value) => {
        this.properties.ambientOcclusionStrength = value;
        this.updateUniforms();
      },
    });

    // Erosion noise
    this.settingsSection.addSlider({
      id: "u_erosionNoiseStrength",
      label: "Erosion Noise",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: this.properties.erosionNoiseStrength,
      uniform: true,
      onChange: (value) => {
        this.properties.erosionNoiseStrength = value;
        this.updateUniforms();
      },
    });

    this.settingsSection.addSlider({
      id: "u_erosionNoiseScale",
      label: "Erosion Scale",
      min: 1,
      max: 50,
      step: 1,
      defaultValue: this.properties.erosionNoiseScale,
      uniform: true,
      onChange: (value) => {
        this.properties.erosionNoiseScale = value;
        this.updateUniforms();
      },
    });

    // Micro-roughness
    this.settingsSection.addSlider({
      id: "u_microRoughnessStrength",
      label: "Micro Roughness",
      min: 0,
      max: 0.5,
      step: 0.01,
      defaultValue: this.properties.microRoughnessStrength,
      uniform: true,
      onChange: (value) => {
        this.properties.microRoughnessStrength = value;
        this.updateUniforms();
      },
    });

    this.settingsSection.addSlider({
      id: "u_microRoughnessScale",
      label: "Micro Roughness Scale",
      min: 10,
      max: 200,
      step: 10,
      defaultValue: this.properties.microRoughnessScale,
      uniform: true,
      onChange: (value) => {
        this.properties.microRoughnessScale = value;
        this.updateUniforms();
      },
    });

    // Fog
    this.settingsSection.addSlider({
      id: "u_fogStrength",
      label: "Fog Strength",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: this.properties.fogStrength,
      uniform: true,
      onChange: (value) => {
        this.properties.fogStrength = value;
        this.updateUniforms();
      },
    });

    this.settingsSection.addSlider({
      id: "u_fogHeight",
      label: "Fog Height",
      min: 0,
      max: 100,
      step: 1,
      defaultValue: this.properties.fogHeight,
      uniform: true,
      onChange: (value) => {
        this.properties.fogHeight = value;
        this.updateUniforms();
      },
    });
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private updateColorPreview(): void {
    if (this.colorPreview) {
      this.colorPreview.style.background = this.rgbToHex(
        this.properties.colorR,
        this.properties.colorG,
        this.properties.colorB
      );
    }
  }

  private updateTerrainColor(): void {
    // Update terrain color through lighting pass if available
    if (this.lightingPass) {
      this.updateUniforms();
    } else if (this.lightingProgram) {
      // Fallback: update directly if lighting pass not available
      this.gl.useProgram(this.lightingProgram);
      const loc = this.gl.getUniformLocation(this.lightingProgram, "u_terrainColor");
      if (loc) {
        this.gl.uniform3f(loc, this.properties.colorR, this.properties.colorG, this.properties.colorB);
      }
    }
  }

  private togglePanel(): void {
    if (this.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  private openPanel(): void {
    this.isOpen = true;
    this.panelElement.classList.add("open");
    // Update color preview when panel opens
    this.updateColorPreview();
    // Ensure uniforms are up to date when panel opens
    this.updateUniforms();
  }

  private closePanel(): void {
    this.isOpen = false;
    this.panelElement.classList.remove("open");
  }

  /**
   * Update all material uniforms in the shader
   * Call this before rendering or when sliders change
   */
  public updateUniforms(): void {
    // Use LightingPass.updateMaterialUniforms if available (preferred method)
    if (this.lightingPass) {
      this.lightingPass.updateMaterialUniforms({
        metallicity: this.properties.metallicity,
        roughness: this.properties.roughness,
        colorR: this.properties.colorR,
        colorG: this.properties.colorG,
        colorB: this.properties.colorB,
        ambient: this.properties.ambient,
        specularIntensity: this.properties.specularIntensity,
        specularPower: this.properties.specularPower,
        colorBlendStrength: this.properties.colorBlendStrength,
        colorIntensity: this.properties.colorIntensity,
        slopeShadingStrength: this.properties.slopeShadingStrength,
        heightGradientStrength: this.properties.heightGradientStrength,
        heightGradientTopR: this.properties.heightGradientTopR,
        heightGradientTopG: this.properties.heightGradientTopG,
        heightGradientTopB: this.properties.heightGradientTopB,
        heightGradientBottomR: this.properties.heightGradientBottomR,
        heightGradientBottomG: this.properties.heightGradientBottomG,
        heightGradientBottomB: this.properties.heightGradientBottomB,
        curvatureStrength: this.properties.curvatureStrength,
        detailNoiseStrength: this.properties.detailNoiseStrength,
        detailNoiseScale: this.properties.detailNoiseScale,
        patchinessStrength: this.properties.patchinessStrength,
        patchinessScale: this.properties.patchinessScale,
        patchinessColorR: this.properties.patchinessColorR,
        patchinessColorG: this.properties.patchinessColorG,
        patchinessColorB: this.properties.patchinessColorB,
        ambientOcclusionStrength: this.properties.ambientOcclusionStrength,
        erosionNoiseStrength: this.properties.erosionNoiseStrength,
        erosionNoiseScale: this.properties.erosionNoiseScale,
        microRoughnessStrength: this.properties.microRoughnessStrength,
        microRoughnessScale: this.properties.microRoughnessScale,
        fogStrength: this.properties.fogStrength,
        fogHeight: this.properties.fogHeight,
        fogColorR: this.properties.fogColorR,
        fogColorG: this.properties.fogColorG,
        fogColorB: this.properties.fogColorB,
      });
    } else if (this.lightingProgram) {
      // Fallback: update uniforms directly through SettingsSection
      this.gl.useProgram(this.lightingProgram);
      this.settingsSection.updateUniforms(this.gl);
      // Manually update the vec3 terrain color
      const loc = this.gl.getUniformLocation(this.lightingProgram, "u_terrainColor");
      if (loc) {
        this.gl.uniform3f(loc, this.properties.colorR, this.properties.colorG, this.properties.colorB);
      }
    }
  }

  /**
   * Get current material properties
   */
  public getProperties() {
    return { ...this.properties };
  }
}