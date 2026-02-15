interface Setting<T> {
  id: string;
  label: string;
  value: T;
  uniform?: boolean;
  defaultValue?: T;
  type: "slider" | "checkbox" | "color";
  onChange?: (value: T) => void;
}

export interface SliderSetting extends Omit<Setting<number | number[]>, "onChange"> {
  type: "slider";
  min: number | number[]; // Single value or array of values per index
  max: number | number[]; // Single value or array of values per index
  step: number | number[]; // Single value or array of values per index
  numType?: "int" | "float";
  isArray?: boolean;
  arrayLength?: number;
  arrayIndex?: number;
  defaultValue?: number | number[]; // Single value or array of values per index
  onChange?: (value: number) => void; // For sliders, onChange always receives a number (single value, even for arrays)
  fineTuner?: boolean; // Add +/- buttons for fine-grained adjustments
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
        if (setting.isArray) {
          const arrayValue = Array.isArray(setting.value) ? setting.value : [];
          gl.uniform1fv(loc, new Float32Array(arrayValue));
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
    const isArray = config.isArray ?? false;
    const arrayLength = config.arrayLength ?? 1;

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

    // For array sliders, create an array of values
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
    valueSpan.textContent = currentValue.toString();

    // For array sliders, add index display and navigation
    let indexSpan: HTMLElement | null = null;
    let prevButton: HTMLButtonElement | null = null;
    let nextButton: HTMLButtonElement | null = null;

    if (setting.isArray && setting.arrayLength) {
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
    label.appendChild(valueSpan);
    if (indexSpan) label.appendChild(indexSpan);
    if (prevButton) label.appendChild(prevButton);
    if (nextButton) label.appendChild(nextButton);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = `${setting.id}-slider`;
    slider.min = getCurrentMin().toString();
    slider.max = getCurrentMax().toString();
    slider.step = getCurrentStep().toString();
    slider.value = currentValue.toString();

    // Helper function to get decimal places from step value
    const getDecimalPlaces = (step: number): number => {
      const str = step.toString();
      if (str.includes('e-')) {
        return parseInt(str.split('e-')[1]);
      }
      const decimalPart = str.split('.')[1];
      return decimalPart ? decimalPart.length : 0;
    };

    // Helper function to update value and UI
    const updateValue = (newValue: number) => {
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      const step = this.getValueAtIndex(setting.step, setting.arrayIndex ?? 0, 0.01);
      
      // Round to avoid floating point precision issues
      const decimals = getDecimalPlaces(step);
      newValue = parseFloat(newValue.toFixed(decimals));
      newValue = Math.max(min, Math.min(max, newValue));
      
      if (setting.isArray) {
        const arrayValue = Array.isArray(setting.value) ? setting.value : [];
        const idx = setting.arrayIndex ?? 0;
        arrayValue[idx] = newValue;
        setting.value = arrayValue;
      } else {
        setting.value = newValue;
      }
      
      slider.value = newValue.toString();
      valueSpan.textContent = newValue.toString();
      if (setting.onChange) {
        setting.onChange(newValue as any);
      }
    };

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

    wrapper.appendChild(label);
    wrapper.appendChild(document.createElement("br"));

    // Only add fine tuner buttons if fineTuner is enabled
    if (setting.fineTuner) {
      const smallBtnStyle = "padding: 1px 5px; margin: 0 1px; cursor: pointer; font-size: 11px;";
      const largeBtnStyle = "padding: 1px 3px; margin: 0 1px; cursor: pointer; font-size: 10px;";
      
      // 10x decrement button
      const decrement10xBtn = document.createElement("button");
      decrement10xBtn.textContent = "−10";
      decrement10xBtn.style.cssText = largeBtnStyle;
      decrement10xBtn.title = `Decrease by ${getCurrentStep() * 10}`;
      decrement10xBtn.addEventListener("click", () => {
        const step = this.getValueAtIndex(setting.step, setting.arrayIndex ?? 0, 0.01);
        const currentVal = parseFloat(slider.value);
        updateValue(currentVal - step * 10);
      });

      // 1x decrement button
      const decrementBtn = document.createElement("button");
      decrementBtn.textContent = "−";
      decrementBtn.style.cssText = smallBtnStyle;
      decrementBtn.title = `Decrease by ${getCurrentStep()}`;
      decrementBtn.addEventListener("click", () => {
        const step = this.getValueAtIndex(setting.step, setting.arrayIndex ?? 0, 0.01);
        const currentVal = parseFloat(slider.value);
        updateValue(currentVal - step);
      });

      // 1x increment button
      const incrementBtn = document.createElement("button");
      incrementBtn.textContent = "+";
      incrementBtn.style.cssText = smallBtnStyle;
      incrementBtn.title = `Increase by ${getCurrentStep()}`;
      incrementBtn.addEventListener("click", () => {
        const step = this.getValueAtIndex(setting.step, setting.arrayIndex ?? 0, 0.01);
        const currentVal = parseFloat(slider.value);
        updateValue(currentVal + step);
      });

      // 10x increment button
      const increment10xBtn = document.createElement("button");
      increment10xBtn.textContent = "+10";
      increment10xBtn.style.cssText = largeBtnStyle;
      increment10xBtn.title = `Increase by ${getCurrentStep() * 10}`;
      increment10xBtn.addEventListener("click", () => {
        const step = this.getValueAtIndex(setting.step, setting.arrayIndex ?? 0, 0.01);
        const currentVal = parseFloat(slider.value);
        updateValue(currentVal + step * 10);
      });

      // Create a container for the slider row with buttons
      const sliderRow = document.createElement("div");
      sliderRow.style.display = "flex";
      sliderRow.style.alignItems = "center";
      sliderRow.style.gap = "2px";
      
      sliderRow.appendChild(decrement10xBtn);
      sliderRow.appendChild(decrementBtn);
      sliderRow.appendChild(slider);
      sliderRow.appendChild(incrementBtn);
      sliderRow.appendChild(increment10xBtn);
      
      wrapper.appendChild(sliderRow);
    } else {
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
