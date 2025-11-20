interface Setting<T> {
  id: string;
  label: string;
  value: T;
  uniform?: boolean;
  defaultValue?: T;
  type: "slider" | "checkbox" | "color";
  onChange?: (value: T) => void;
}

interface SliderSetting extends Setting<number> {
  type: "slider";
  min: number;
  max: number;
  step: number;
  numType?: "int" | "float";
}

interface CheckboxSetting extends Setting<boolean> {
  type: "checkbox";
}

interface ColorSetting extends Setting<string> {
  type: "color";
}

type AnySetting = SliderSetting | CheckboxSetting | ColorSetting;

export class SettingsSection {
  private settings: Map<string, AnySetting> = new Map();
  private container: HTMLElement;
  private sectionElement: HTMLElement;
  private program: WebGLProgram | null = null;

  constructor(
    parentContainer: HTMLElement,
    title: string,
    program?: WebGLProgram
  ) {
    // Create section with heading
    this.sectionElement = document.createElement("div");
    this.sectionElement.className = "settings-section";
    this.sectionElement.style.margin = "20px 0";

    const heading = document.createElement("h3");
    heading.textContent = title;
    heading.style.marginBottom = "12px";
    this.sectionElement.appendChild(heading);

    this.container = document.createElement("div");
    this.container.className = "settings-container";
    this.sectionElement.appendChild(this.container);

    parentContainer.appendChild(this.sectionElement);
    this.program = program || null;
  }

  /**
   * Add a slider setting
   */
  addSlider(config: Omit<SliderSetting, "type" | "value">): void {
    const setting: SliderSetting = {
      ...config,
      type: "slider",
      value: config.defaultValue ?? 0,
      uniform: config.uniform ?? true,
      numType: config.numType ?? "float"
    };
    this.settings.set(config.id, setting);
    this.renderSlider(setting);
  }

  /**
   * Add a checkbox setting
   */
  addCheckbox(config: Omit<CheckboxSetting, "type" | "value">): void {
    const setting: CheckboxSetting = {
      ...config,
      type: "checkbox",
      value: config.defaultValue ?? false,
      uniform: config.uniform ?? true
    };
    this.settings.set(config.id, setting);
    this.renderCheckbox(setting);
  }

  /**
   * Add a color picker setting
   */
  addColorPicker(config: Omit<ColorSetting, "type" | "value">): void {
    const setting: ColorSetting = {
      ...config,
      type: "color",
      value: config.defaultValue ?? "#ffffff",
      uniform: config.uniform ?? true
    };
    this.settings.set(config.id, setting);
    this.renderColorPicker(setting);
  }

  /**
   * Get a slider value
   */
  getSliderValue(id: string): number {
    const setting = this.settings.get(id);
    if (setting && setting.type === "slider") {
      return setting.value;
    }
    throw new Error(`Slider setting '${id}' not found`);
  }

  /**
   * Get a checkbox value
   */
  getCheckboxValue(id: string): boolean {
    const setting = this.settings.get(id);
    if (setting && setting.type === "checkbox") {
      return setting.value;
    }
    throw new Error(`Checkbox setting '${id}' not found`);
  }

  /**
   * Get a color value
   */
  getColorValue(id: string): string {
    const setting = this.settings.get(id);
    if (setting && setting.type === "color") {
      return setting.value;
    }
    throw new Error(`Color setting '${id}' not found`);
  }

  /**
   * Set a slider value programmatically
   */
  setSliderValue(id: string, value: number): void {
    const setting = this.settings.get(id);
    if (setting && setting.type === "slider") {
      setting.value = value;
      const sliderElement = document.getElementById(
        `${id}-slider`
      ) as HTMLInputElement;
      const valueSpan = document.getElementById(`${id}-value`);
      if (sliderElement) sliderElement.value = value.toString();
      if (valueSpan) valueSpan.textContent = value.toString();
      if (setting.onChange) setting.onChange(value);
    }
  }

  /**
   * Set a checkbox value programmatically
   */
  setCheckboxValue(id: string, value: boolean): void {
    const setting = this.settings.get(id);
    if (setting && setting.type === "checkbox") {
      setting.value = value;
      const checkboxElement = document.getElementById(
        `${id}-checkbox`
      ) as HTMLInputElement;
      if (checkboxElement) checkboxElement.checked = value;
      if (setting.onChange) setting.onChange(value);
    }
  }

  /**
   * Set a color value programmatically
   */
  setColorValue(id: string, value: string): void {
    const setting = this.settings.get(id);
    if (setting && setting.type === "color") {
      setting.value = value;
      const colorElement = document.getElementById(
        `${id}-color`
      ) as HTMLInputElement;
      if (colorElement) colorElement.value = value;
      if (setting.onChange) setting.onChange(value);
    }
  }

  /**
   * Render a slider setting in the UI
   */
  private renderSlider(setting: SliderSetting): void {
    const wrapper = document.createElement("div");
    wrapper.style.margin = "16px 0";

    const label = document.createElement("label");
    label.htmlFor = `${setting.id}-slider`;

    const valueSpan = document.createElement("span");
    valueSpan.id = `${setting.id}-value`;
    valueSpan.textContent = setting.value.toString();

    label.innerHTML = `${setting.label}: `;
    label.appendChild(valueSpan);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = `${setting.id}-slider`;
    slider.min = setting.min.toString();
    slider.max = setting.max.toString();
    slider.step = setting.step.toString();
    slider.value = setting.value.toString();

    slider.addEventListener("input", () => {
      const value = parseFloat(slider.value);
      setting.value = value;
      valueSpan.textContent = slider.value;
      if (setting.onChange) {
        setting.onChange(value);
      }
    });

    wrapper.appendChild(label);
    wrapper.appendChild(document.createElement("br"));
    wrapper.appendChild(slider);

    this.container.appendChild(wrapper);
  }

  /**
   * Render a checkbox setting in the UI
   */
  private renderCheckbox(setting: CheckboxSetting): void {
    const wrapper = document.createElement("div");
    wrapper.style.margin = "8px 0";

    const label = document.createElement("label");
    label.htmlFor = `${setting.id}-checkbox`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `${setting.id}-checkbox`;
    checkbox.checked = setting.value;

    checkbox.addEventListener("change", () => {
      setting.value = checkbox.checked;
      if (setting.onChange) {
        setting.onChange(checkbox.checked);
      }
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(` ${setting.label}`));
    wrapper.appendChild(label);

    this.container.appendChild(wrapper);
  }

  /**
   * Render a color picker setting in the UI
   */
  private renderColorPicker(setting: ColorSetting): void {
    const wrapper = document.createElement("div");
    wrapper.style.margin = "16px 0";

    const label = document.createElement("label");
    label.htmlFor = `${setting.id}-color`;
    label.textContent = `${setting.label}: `;

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.id = `${setting.id}-color`;
    colorInput.value = setting.value;
    colorInput.style.marginLeft = "8px";
    colorInput.style.cursor = "pointer";

    colorInput.addEventListener("input", () => {
      setting.value = colorInput.value;
      if (setting.onChange) {
        setting.onChange(colorInput.value);
      }
    });

    wrapper.appendChild(label);
    wrapper.appendChild(colorInput);

    this.container.appendChild(wrapper);
  }

  /**
   * Convert hex color to RGB array (0-1 range)
   */
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255
        ]
      : [0, 0, 0];
  }

  public updateUniforms(gl: WebGL2RenderingContext): void {
    if (!this.program) {
      console.warn("No program associated with this settings section.");
      return;
    }
    const program = this.program;

    this.settings.forEach((setting) => {
      if (setting.uniform === false) return;

      const loc = gl.getUniformLocation(program, setting.id);
      if (!loc) {
        console.warn(`Uniform location for ${setting.id} not found.`);
        return;
      }

      if (setting.type === "slider") {
        if (setting.numType === "int") {
          gl.uniform1i(loc, Math.floor(setting.value));
        } else {
          gl.uniform1f(loc, setting.value);
        }
      } else if (setting.type === "checkbox") {
        gl.uniform1i(loc, setting.value ? 1 : 0);
      } else if (setting.type === "color") {
        const rgb = this.hexToRgb(setting.value);
        gl.uniform3f(loc, rgb[0], rgb[1], rgb[2]);
      }
    });
  }

  /**
   * Get a setting by ID
   */
  getSetting(id: string): AnySetting | undefined {
    return this.settings.get(id);
  }

  /**
   * Remove all settings in this section
   */
  clear(): void {
    this.settings.clear();
    this.container.innerHTML = "";
  }

  /**
   * Remove the entire section
   */
  remove(): void {
    this.sectionElement.remove();
  }
}
