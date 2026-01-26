interface Setting<T> {
  id: string;
  label: string;
  value: T;
  uniform?: boolean;
  defaultValue?: T;
  type: "slider" | "checkbox" | "color";
  onChange?: (value: T) => void;
}

interface SliderSetting extends Omit<Setting<number | number[]>, "onChange"> {
  type: "slider";
  min: number | number[]; // Single value or array of values per index
  max: number | number[]; // Single value or array of values per index
  step: number | number[]; // Single value or array of values per index
  numType?: "int" | "float" | "vec2" | "vec3" | "vec4";
  isArray?: boolean;
  arrayLength?: number;
  arrayIndex?: number;
  defaultValue?: number | number[]; // Single value or array of values per index
  onChange?: (value: number) => void; // For sliders, onChange always receives a number (single value, even for arrays)
}

interface CheckboxSetting extends Setting<boolean> {
  type: "checkbox";
}

interface ColorSetting extends Setting<string> {
  type: "color";
}

type AnySetting = SliderSetting | CheckboxSetting | ColorSetting;
export class SettingsManager {
  public static instance: SettingsManager = new SettingsManager();
  private sections: Map<string, SettingsSection> = new Map();
  private attachedProgramUniforms: Map<WebGLProgram, string[]> = new Map();
  private IdInSection: Map<string, string> = new Map(); // Map of setting ID to section title
  constructor() {}
  public createSection(parentContainer: HTMLElement, title: string) {
    const section = new SettingsSection(parentContainer, title);
    this.sections.set(title, section);
  }
  public addSliderToSection(
    sectionTitle: string,
    config: Omit<SliderSetting, "type" | "value">
  ): void {
    const section = this.sections.get(sectionTitle);
    if (section) {
      section.addSlider(config);
    }
    this.IdInSection.set(config.id, sectionTitle);
  }
  public addCheckboxToSection(
    sectionTitle: string,
    config: Omit<CheckboxSetting, "type" | "value">
  ): void {
    const section = this.sections.get(sectionTitle);
    if (section) {
      section.addCheckbox(config);
    }
    this.IdInSection.set(config.id, sectionTitle);
  }
  public addColorPickerToSection(
    sectionTitle: string,
    config: Omit<ColorSetting, "type" | "value">
  ): void {
    const section = this.sections.get(sectionTitle);
    if (section) {
      section.addColorPicker(config);
    }
    this.IdInSection.set(config.id, sectionTitle);
  }
  public addButtonToSection(
    sectionTitle: string,
    label: string,
    onClick: () => void
  ): void {
    const section = this.sections.get(sectionTitle);
    if (section) {
      section.addButton(label, onClick);
    }
  }
  public attatchProgram(program: WebGLProgram, uniformNames: string[]): void {
    this.attachedProgramUniforms.set(program, uniformNames);
  }
  public updateProgramUniforms(
    gl: WebGL2RenderingContext,
    program: WebGLProgram
  ): void {
    const uniformNames = this.attachedProgramUniforms.get(program);
    if (!uniformNames) return;
    uniformNames.forEach((name) => {
      const setting = this.getSetting(name);
      if (!setting || setting.uniform === false) return;
      const loc = gl.getUniformLocation(program, setting.id);
      if (!loc) {
        console.warn(`Uniform location for ${setting.id} not found.`);
        return;
      }
      if (setting.type === "slider") {
        // Check if it's a vector type
        const isVector = setting.numType === "vec2" || setting.numType === "vec3" || setting.numType === "vec4";
        
        if (setting.isArray || isVector) {
          const arrayValue = Array.isArray(setting.value) ? setting.value : [];
          
          if (isVector) {
            // Handle vector uniforms
            if (setting.numType === "vec2") {
              gl.uniform2fv(loc, new Float32Array(arrayValue.slice(0, 2)));
            } else if (setting.numType === "vec3") {
              gl.uniform3fv(loc, new Float32Array(arrayValue.slice(0, 3)));
            } else if (setting.numType === "vec4") {
              gl.uniform4fv(loc, new Float32Array(arrayValue.slice(0, 4)));
            }
          } else {
            // Handle regular array uniforms
            gl.uniform1fv(loc, new Float32Array(arrayValue));
          }
        } else {
          const numValue =
            typeof setting.value === "number" ? setting.value : 0;
          if (setting.numType === "int") {
            gl.uniform1i(loc, Math.floor(numValue));
          } else {
            gl.uniform1f(loc, numValue);
          }
        }
      } else if (setting.type === "checkbox") {
        gl.uniform1i(loc, setting.value ? 1 : 0);
      } else if (setting.type === "color") {
        const rgb = this.hexToRgb(setting.value);
        gl.uniform3f(loc, rgb[0], rgb[1], rgb[2]);
      }
    });
  }
  public getSetting(id: string): AnySetting | undefined {
    const sectionTitle = this.IdInSection.get(id);
    if (!sectionTitle) throw new Error(`Setting ID '${id}' not found`);
    const section = this.sections.get(sectionTitle);
    if (!section) throw new Error(`Section '${sectionTitle}' not found`);
    return section.getSetting(id);
  }
  public getSliderArray(id: string): number[] {
    const sectionTitle = this.IdInSection.get(id);
    if (!sectionTitle) throw new Error(`Setting ID '${id}' not found`);
    const section = this.sections.get(sectionTitle);
    if (!section) throw new Error(`Section '${sectionTitle}' not found`);
    return section.getSliderArray(id);
  }
  private hexToRgb(hex: string): [number, number, number] {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r / 255, g / 255, b / 255];
  }
}
class SettingsSection {
  private settings: Map<string, AnySetting> = new Map();
  private container: HTMLElement;
  private sectionElement: HTMLElement;

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
  }

  /**
   * Add a button to the section
   */
  addButton(label: string, onClick: () => void): void {
    const wrapper = document.createElement("div");
    wrapper.style.margin = "16px 0";

    const button = document.createElement("button");
    button.textContent = label;
    button.style.padding = "8px 16px";
    button.style.cursor = "pointer";
    button.style.fontSize = "14px";

    button.addEventListener("click", onClick);

    wrapper.appendChild(button);
    this.container.appendChild(wrapper);
  }
  /**
   * Helper to get value at index (or single value if not array)
   */
  private getValueAtIndex(
    value: number | number[] | undefined,
    index: number,
    fallback: number = 0
  ): number {
    if (value === undefined) return fallback;
    if (typeof value === "number") return value;
    return value[index] ?? fallback;
  }

  /**
   * Add a slider setting
   */
  addSlider(config: Omit<SliderSetting, "type" | "value">): void {
    // Check if it's a vector type
    const isVector = config.numType === "vec2" || config.numType === "vec3" || config.numType === "vec4";
    const vecLength = config.numType === "vec2" ? 2 : config.numType === "vec3" ? 3 : config.numType === "vec4" ? 4 : 0;
    
    // Treat vectors as arrays with fixed length
    const isArray = config.isArray ?? isVector;
    const arrayLength = isVector ? vecLength : (config.arrayLength ?? 1);

    // Handle defaultValue: if single value, fill array; if array, use it; otherwise default to 0
    let defaultValue: number | number[];
    if (isArray) {
      if (Array.isArray(config.defaultValue)) {
        // Use provided array, padding with last value if needed
        const providedArray = config.defaultValue;
        defaultValue = Array.from({ length: arrayLength }, (_, i) =>
          i < providedArray.length
            ? providedArray[i]
            : (providedArray[providedArray.length - 1] ?? 0)
        );
      } else {
        // Single value: fill entire array
        defaultValue = Array(arrayLength).fill(config.defaultValue ?? 0);
      }
    } else {
      defaultValue = config.defaultValue ?? 0;
    }

    // For array sliders or vector sliders, create an array of values
    const initialValue = isArray
      ? Array.isArray(defaultValue)
        ? defaultValue
        : Array(arrayLength).fill(defaultValue)
      : typeof defaultValue === "number"
        ? defaultValue
        : (defaultValue[0] ?? 0);

    const setting: SliderSetting = {
      ...config,
      type: "slider",
      value: initialValue as any,
      uniform: config.uniform ?? true,
      numType: config.numType ?? "float",
      isArray: isArray,
      arrayLength: arrayLength,
      arrayIndex: config.arrayIndex ?? 0,
      defaultValue: defaultValue
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
  getSliderValue(id: string, index?: number): number {
    const setting = this.settings.get(id);
    if (setting && setting.type === "slider") {
      if (setting.isArray) {
        const arrayValue = Array.isArray(setting.value) ? setting.value : [];
        const idx = index !== undefined ? index : (setting.arrayIndex ?? 0);
        return arrayValue[idx] ?? 0;
      }
      return typeof setting.value === "number" ? setting.value : 0;
    }
    throw new Error(`Slider setting '${id}' not found`);
  }

  /**
   * Get an array slider value at a specific index
   */
  getSliderArray(id: string): number[] {
    const setting = this.settings.get(id);
    if (setting && setting.type === "slider" && setting.isArray) {
      return Array.isArray(setting.value) ? setting.value : [];
    }
    throw new Error(`Array slider setting '${id}' not found`);
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
  setSliderValue(id: string, value: number, index?: number): void {
    const setting = this.settings.get(id);
    if (setting && setting.type === "slider") {
      if (setting.isArray) {
        const arrayValue = Array.isArray(setting.value) ? setting.value : [];
        const idx = index !== undefined ? index : (setting.arrayIndex ?? 0);
        arrayValue[idx] = value;
        setting.value = arrayValue;
        // Update UI if this is the current index
        if (idx === (setting.arrayIndex ?? 0)) {
          const sliderElement = document.getElementById(
            `${id}-slider`
          ) as HTMLInputElement;
          const valueSpan = document.getElementById(`${id}-value`);
          if (sliderElement) sliderElement.value = value.toString();
          if (valueSpan) valueSpan.textContent = value.toString();
        }
        // Update index display
        const indexSpan = document.getElementById(`${id}-index`);
        if (indexSpan) {
          indexSpan.textContent = `${setting.arrayIndex ?? 0}`;
        }
        if (setting.onChange) setting.onChange(value as any);
      } else {
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

    // Check if this is a vector type
    const isVector = setting.numType === "vec2" || setting.numType === "vec3" || setting.numType === "vec4";
    const componentLabels = ["x", "y", "z", "w"];

    const valueSpan = document.createElement("span");
    valueSpan.id = `${setting.id}-value`;

    const currentIndex = setting.arrayIndex ?? 0;

    // Helper function to get current min/max/step/defaultValue based on index
    const getCurrentMin = () =>
      this.getValueAtIndex(setting.min, currentIndex, 0);
    const getCurrentMax = () =>
      this.getValueAtIndex(setting.max, currentIndex, 1);
    const getCurrentStep = () =>
      this.getValueAtIndex(setting.step, currentIndex, 0.01);
    const getCurrentDefault = () =>
      this.getValueAtIndex(setting.defaultValue, currentIndex, 0);

    const currentValue = setting.isArray
      ? Array.isArray(setting.value)
        ? setting.value[currentIndex]
        : getCurrentDefault()
      : typeof setting.value === "number"
        ? setting.value
        : getCurrentDefault();
    
    // Don't show value span for vectors (each component shows its own)
    if (!isVector) {
      valueSpan.textContent = currentValue.toString();
    }

    // For array sliders (but not vectors), add index display and navigation
    let indexSpan: HTMLElement | null = null;
    let prevButton: HTMLButtonElement | null = null;
    let nextButton: HTMLButtonElement | null = null;

    if (setting.isArray && !isVector && setting.arrayLength) {
      indexSpan = document.createElement("span");
      indexSpan.id = `${setting.id}-index`;
      indexSpan.style.marginLeft = "8px";
      indexSpan.style.marginRight = "8px";
      indexSpan.textContent = `[${currentIndex}]`;

      prevButton = document.createElement("button");
      prevButton.textContent = "◄";
      prevButton.style.marginLeft = "8px";
      prevButton.style.marginRight = "4px";
      prevButton.style.padding = "2px 8px";
      prevButton.style.cursor = "pointer";
      prevButton.disabled = currentIndex === 0;

      nextButton = document.createElement("button");
      nextButton.textContent = "►";
      nextButton.style.marginLeft = "4px";
      nextButton.style.padding = "2px 8px";
      nextButton.style.cursor = "pointer";
      nextButton.disabled = currentIndex >= setting.arrayLength - 1;

      prevButton.addEventListener("click", () => {
        if (setting.arrayIndex !== undefined && setting.arrayIndex > 0) {
          setting.arrayIndex--;
          const arrayValue = Array.isArray(setting.value) ? setting.value : [];
          const newValue =
            arrayValue[setting.arrayIndex] ??
            this.getValueAtIndex(setting.defaultValue, setting.arrayIndex, 0);
          const slider = document.getElementById(
            `${setting.id}-slider`
          ) as HTMLInputElement;
          if (slider) {
            // Update slider properties based on new index
            slider.min = this.getValueAtIndex(
              setting.min,
              setting.arrayIndex,
              0
            ).toString();
            slider.max = this.getValueAtIndex(
              setting.max,
              setting.arrayIndex,
              1
            ).toString();
            slider.step = this.getValueAtIndex(
              setting.step,
              setting.arrayIndex,
              0.01
            ).toString();
            slider.value = newValue.toString();
          }
          if (valueSpan) valueSpan.textContent = newValue.toString();
          if (indexSpan) indexSpan.textContent = `[${setting.arrayIndex}]`;
          if (prevButton) prevButton.disabled = setting.arrayIndex === 0;
          if (nextButton)
            nextButton.disabled =
              setting.arrayIndex >= setting.arrayLength! - 1;
        }
      });

      nextButton.addEventListener("click", () => {
        if (
          setting.arrayIndex !== undefined &&
          setting.arrayIndex < setting.arrayLength! - 1
        ) {
          setting.arrayIndex++;
          const arrayValue = Array.isArray(setting.value) ? setting.value : [];
          const newValue =
            arrayValue[setting.arrayIndex] ??
            this.getValueAtIndex(setting.defaultValue, setting.arrayIndex, 0);
          const slider = document.getElementById(
            `${setting.id}-slider`
          ) as HTMLInputElement;
          if (slider) {
            // Update slider properties based on new index
            slider.min = this.getValueAtIndex(
              setting.min,
              setting.arrayIndex,
              0
            ).toString();
            slider.max = this.getValueAtIndex(
              setting.max,
              setting.arrayIndex,
              1
            ).toString();
            slider.step = this.getValueAtIndex(
              setting.step,
              setting.arrayIndex,
              0.01
            ).toString();
            slider.value = newValue.toString();
          }
          if (valueSpan) valueSpan.textContent = newValue.toString();
          if (indexSpan) indexSpan.textContent = `[${setting.arrayIndex}]`;
          if (prevButton) prevButton.disabled = setting.arrayIndex === 0;
          if (nextButton)
            nextButton.disabled =
              setting.arrayIndex >= setting.arrayLength! - 1;
        }
      });
    }

    label.innerHTML = `${setting.label}: `;
    if (!isVector) {
      label.appendChild(valueSpan);
      if (indexSpan) label.appendChild(indexSpan);
      if (prevButton) label.appendChild(prevButton);
      if (nextButton) label.appendChild(nextButton);
    }

    wrapper.appendChild(label);
    wrapper.appendChild(document.createElement("br"));

    // Render sliders: multiple for vectors, single for others
    if (isVector) {
      // Render multiple sliders for vector components
      const vecValue = Array.isArray(setting.value) ? setting.value : [];
      for (let i = 0; i < setting.arrayLength!; i++) {
        const componentWrapper = document.createElement("div");
        componentWrapper.style.marginBottom = "8px";
        componentWrapper.style.display = "flex";
        componentWrapper.style.alignItems = "center";

        const componentLabel = document.createElement("label");
        componentLabel.textContent = `${componentLabels[i]}: `;
        componentLabel.style.display = "inline-block";
        componentLabel.style.width = "20px";
        componentLabel.style.marginRight = "8px";

        const slider = document.createElement("input");
        slider.type = "range";
        slider.id = `${setting.id}-slider-${i}`;
        slider.min = this.getValueAtIndex(setting.min, i, 0).toString();
        slider.max = this.getValueAtIndex(setting.max, i, 1).toString();
        slider.step = this.getValueAtIndex(setting.step, i, 0.01).toString();
        slider.value = (vecValue[i] ?? 0).toString();
        slider.style.flex = "1";
        slider.style.marginRight = "8px";

        const componentValue = document.createElement("span");
        componentValue.id = `${setting.id}-value-${i}`;
        componentValue.textContent = (vecValue[i] ?? 0).toFixed(2);
        componentValue.style.display = "inline-block";
        componentValue.style.width = "50px";
        componentValue.style.textAlign = "right";

        slider.addEventListener("input", () => {
          const value = parseFloat(slider.value);
          const arrayValue = Array.isArray(setting.value) ? setting.value : [];
          arrayValue[i] = value;
          setting.value = arrayValue;
          componentValue.textContent = value.toFixed(2);
          if (setting.onChange) {
            setting.onChange(value as any);
          }
        });

        componentWrapper.appendChild(componentLabel);
        componentWrapper.appendChild(slider);
        componentWrapper.appendChild(componentValue);
        wrapper.appendChild(componentWrapper);
      }
    } else {
      // Render single slider for non-vector types
      const slider = document.createElement("input");
      slider.type = "range";
      slider.id = `${setting.id}-slider`;
      slider.min = getCurrentMin().toString();
      slider.max = getCurrentMax().toString();
      slider.step = getCurrentStep().toString();
      slider.value = currentValue.toString();

      slider.addEventListener("input", () => {
        const value = parseFloat(slider.value);
        if (setting.isArray) {
          const arrayValue = Array.isArray(setting.value) ? setting.value : [];
          const idx = setting.arrayIndex ?? 0;
          arrayValue[idx] = value;
          setting.value = arrayValue;
          valueSpan.textContent = slider.value;
          if (setting.onChange) {
            setting.onChange(value as any);
          }
        } else {
          setting.value = value;
          valueSpan.textContent = slider.value;
          if (setting.onChange) {
            setting.onChange(value);
          }
        }
      });

      wrapper.appendChild(slider);
    }

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
