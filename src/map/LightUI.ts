import { vec3 } from "gl-matrix";
import { WorldMap } from "./Map";
import { PointLight } from "./Light";
import { Color } from "./terrains";

export class LightUI {
  private container: HTMLElement;
  private addButton: HTMLButtonElement;
  private world: WorldMap;
  private tracerUpdateSupplier: () => () => void;

  constructor(world: WorldMap, updateTracer: () => () => void) {
    this.world = world;
    this.tracerUpdateSupplier = updateTracer;

    const { container, addButton } = this.ensureLightSection();
    this.container = container;
    this.addButton = addButton;

    this.addButton.addEventListener("click", () => this.createDefaultLight());
    this.container.innerHTML = "";
    this.world.lights.forEach((light) => this.createLightCard(light));
  }

  private ensureLightSection(): {
    container: HTMLElement;
    addButton: HTMLButtonElement;
  } {
    // Always rebuild the section to guarantee markup exists and is consistent
    const existingSection = document.getElementById("point-light-section");
    if (existingSection) {
      existingSection.remove();
    }

    const sidebar = document.getElementById("sidebar");
    if (!sidebar) {
      throw new Error("Sidebar element not found for LightUI");
    }

    const section = document.createElement("section");
    section.id = "point-light-section";

    const heading = document.createElement("h3");
    heading.textContent = "Point Lights";
    section.appendChild(heading);

    const addButton = document.createElement("button");
    addButton.id = "add-light-btn";
    addButton.type = "button";
    addButton.textContent = "Add Point Light";
    section.appendChild(addButton);

    const container = document.createElement("div");
    container.id = "point-lights";
    section.appendChild(container);

    sidebar.appendChild(section);

    return { container, addButton };
  }

  private createDefaultLight() {
    const index = this.world.lights.length + 1;
    const newLight = new PointLight(
      vec3.fromValues(0, 20, 0),
      new Color(255, 255, 255),
      1,
      20,
      undefined,
      `Point Light ${index}`
    );
    this.world.lights.push(newLight);
    this.createLightCard(newLight);
    this.requestPathTracerUpdate();
  }

  private createLightCard(light: PointLight) {
    const wrapper = document.createElement("div");
    wrapper.className = "point-light";

    const title = document.createElement("h4");
    title.textContent = light.name ?? "Point Light";
    wrapper.appendChild(title);

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = light.name ?? "Point Light";
    nameInput.placeholder = "Point Light name";
    nameInput.addEventListener("change", () => {
      const trimmed = nameInput.value.trim();
      light.name = trimmed.length > 0 ? trimmed : "Point Light";
      title.textContent = light.name;
    });
    wrapper.appendChild(this.createLabeledInput("Name", nameInput));

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = this.colorToHex(light.color);
    colorInput.addEventListener("change", () => {
      const updatedColor = Color.fromHex(colorInput.value);
      light.color = updatedColor;
      light.showColor = updatedColor;
      this.requestPathTracerUpdate();
    });
    wrapper.appendChild(this.createLabeledInput("Color", colorInput));

    wrapper.appendChild(
      this.createVectorInputGroup(
        "Position",
        light.position,
        (axis, value) => {
          light.position[axis] = value;
          this.requestPathTracerUpdate();
        }
      )
    );

    const intensityInput = document.createElement("input");
    intensityInput.type = "number";
    intensityInput.step = "0.1";
    intensityInput.min = "0";
    intensityInput.max = "10";
    intensityInput.value = light.intensity.toString();
    const commitIntensity = () => {
      const val = intensityInput.value === "" ? 0 : parseFloat(intensityInput.value);
      light.intensity = Math.max(0, val);
      this.requestPathTracerUpdate();
    };
    intensityInput.addEventListener("change", commitIntensity);
    intensityInput.addEventListener("blur", commitIntensity);
    wrapper.appendChild(this.createLabeledInput("Intensity", intensityInput));

    const radiusInput = document.createElement("input");
    radiusInput.type = "number";
    radiusInput.step = "1";
    radiusInput.min = "0";
    radiusInput.max = "500";
    radiusInput.value = light.radius.toString();
    const commitRadius = () => {
      const val = radiusInput.value === "" ? 0 : parseFloat(radiusInput.value);
      light.radius = Math.max(0, val);
      this.requestPathTracerUpdate();
    };
    radiusInput.addEventListener("change", commitRadius);
    radiusInput.addEventListener("blur", commitRadius);
    wrapper.appendChild(this.createLabeledInput("Radius", radiusInput));

    const visualizeLabel = document.createElement("label");
    visualizeLabel.className = "point-light__visualize-toggle";
    const visualizeInput = document.createElement("input");
    visualizeInput.type = "checkbox";
    visualizeInput.checked = light.visualizerEnabled;
    visualizeInput.addEventListener("change", () => {
      light.visualizerEnabled = visualizeInput.checked;
    });
    visualizeLabel.appendChild(visualizeInput);
    visualizeLabel.append(" Draw visualization cube");
    wrapper.appendChild(visualizeLabel);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Remove Light";
    deleteButton.className = "point-light__delete";
    deleteButton.addEventListener("click", () => {
      this.world.lights = this.world.lights.filter((l) => l !== light);
      wrapper.remove();
      this.requestPathTracerUpdate();
    });
    wrapper.appendChild(deleteButton);

    this.container.appendChild(wrapper);
  }

  private createVectorInputGroup(
    labelText: string,
    values: vec3,
    onChange: (axis: number, value: number) => void
  ): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "vector-input-group";

    const label = document.createElement("span");
    label.textContent = `${labelText}:`;
    wrapper.appendChild(label);

    ["X", "Y", "Z"].forEach((axisLabel, index) => {
      const input = document.createElement("input");
      input.type = "number";
      input.step = "0.5";
      input.value = values[index].toString();
      input.className = "vector-input";
      const commitValue = () => {
        const val = input.value === "" ? 0 : parseFloat(input.value);
        onChange(index, val);
      };
      input.addEventListener("change", commitValue);
      input.addEventListener("blur", commitValue);

      const axisWrapper = document.createElement("label");
      axisWrapper.textContent = `${axisLabel}: `;
      axisWrapper.appendChild(input);
      wrapper.appendChild(axisWrapper);
    });

    return wrapper;
  }

  private createLabeledInput(labelText: string, input: HTMLInputElement) {
    const wrapper = document.createElement("div");
    wrapper.className = "point-light__label";
    const textSpan = document.createElement("span");
    textSpan.textContent = `${labelText}: `;
    wrapper.appendChild(textSpan);
    wrapper.appendChild(input);
    return wrapper;
  }

  private colorToHex(color: Color) {
    const toHex = (value: number) => value.toString(16).padStart(2, "0");
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }

  private requestPathTracerUpdate() {
    if (this.tracerUpdateSupplier) {
      const updater = this.tracerUpdateSupplier();
      if (updater) updater();
    }
  }

  private enableBlurOnOutside(element: HTMLInputElement) {
    element.addEventListener("focus", () => {
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.background = "transparent";
      overlay.style.zIndex = "2147483646";
      overlay.style.pointerEvents = "auto";
      overlay.className = "color-dismiss-overlay";

      let overlayAppended = false;
      const cleanup = () => {
        overlay.removeEventListener("pointerdown", overlayHandler);
        if (overlayAppended) {
          overlay.remove();
        }
        element.removeEventListener("blur", cleanup);
      };

      const overlayHandler = (event: PointerEvent) => {
        event.preventDefault();
        cleanup();
        element.blur();
      };

      overlay.addEventListener("pointerdown", overlayHandler);

      setTimeout(() => {
        if (!document.body.contains(overlay)) {
          document.body.appendChild(overlay);
          overlayAppended = true;
        }
      }, 0);
      element.addEventListener("blur", cleanup);
    });
  }
}

