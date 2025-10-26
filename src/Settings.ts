export interface SliderSetting {
  type: "slider";
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  numType: string;
  onChange?: (value: number) => void;
}

export interface CheckboxSetting {
  type: "checkbox";
  id: string;
  label: string;
  value: boolean;
  onChange?: (value: boolean) => void;
}

export type Setting = SliderSetting | CheckboxSetting;

export class SettingsSection {
  private settings: Map<string, Setting> = new Map();
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
  addSlider(config: {
    id: string;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    numType?: string;
    onChange?: (value: number) => void;
  }): void {
    const setting: SliderSetting = {
      type: "slider",
      id: config.id,
      label: config.label,
      min: config.min,
      max: config.max,
      step: config.step,
      value: config.defaultValue,
      numType: config.numType || "float",
      onChange: config.onChange
    };

    this.settings.set(config.id, setting);
    this.renderSlider(setting);
  }

  /**
   * Add a checkbox setting
   */
  addCheckbox(config: {
    id: string;
    label: string;
    defaultValue: boolean;
    onChange?: (value: boolean) => void;
  }): void {
    const setting: CheckboxSetting = {
      type: "checkbox",
      id: config.id,
      label: config.label,
      value: config.defaultValue,
      onChange: config.onChange
    };

    this.settings.set(config.id, setting);
    this.renderCheckbox(setting);
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
  public updateUniforms(gl: WebGL2RenderingContext) {
    if (!this.program) return;
    const program = this.program;
    for (let i = 0; i < this.settings.size; i++) {
      debugger;
      const setting = Array.from(this.settings.values())[i];
      if (setting.type === "slider") {
        const loc = gl.getUniformLocation(program, setting.id);
        if (loc) {
          if (setting.numType === "int") {
            gl.uniform1i(loc, Math.floor(setting.value));
          } else {
            gl.uniform1f(loc, setting.value);
          }
        } else {
          console.warn(`Uniform location for ${setting.id} not found.`);
        }
      } else if (setting.type === "checkbox") {
        const loc = gl.getUniformLocation(program, setting.id);
        if (loc) {
          gl.uniform1i(loc, setting.value ? 1 : 0);
        } else {
          console.warn(`Uniform location for ${setting.id} not found.`);
        }
      }
    }
  }
  /**
   * Get a setting by ID
   */
  getSetting(id: string): Setting | undefined {
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
