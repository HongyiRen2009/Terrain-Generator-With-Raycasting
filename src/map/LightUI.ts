import { vec3 } from "gl-matrix";
import { WorldMap } from "./Map";
import { PointLight, enableShadow, disableShadow} from "./Light";
import { Color } from "./terrains";

export class LightUI {
  private container: HTMLElement;
  private addButton: HTMLButtonElement;
  private world: WorldMap;
  private tracerUpdateSupplier: () => () => void;
  private displayOrder: PointLight[] = []; // Maintains stable display order

  constructor(world: WorldMap, updateTracer: () => () => void) {
    this.world = world;
    this.tracerUpdateSupplier = updateTracer;

    const { container, addButton } = this.ensureLightSection();
    this.container = container;
    this.addButton = addButton;

    this.addButton.addEventListener("click", () => this.createDefaultLight());
    this.container.innerHTML = "";
    // Initialize display order with current lights
    this.displayOrder = [...this.world.lights];
    this.displayOrder.forEach((light) => this.createLightCard(light));
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
    this.displayOrder.push(newLight); // Add to display order
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

    const shadowInput = document.createElement("input");
    shadowInput.type = "checkbox";
    shadowInput.checked = this.world.lights.indexOf(light) < this.world.numShadowedLights;
    shadowInput.addEventListener("change", () => {
      // Recalculate the index each time, as the array may have been reordered
      const currentIndex = this.world.lights.indexOf(light);
      if (currentIndex === -1) return; // Light was removed
      
      if (shadowInput.checked) {
        if (this.world.numShadowedLights >= 5) {
            shadowInput.checked = false;
            alert("You can only have up to 5 shadowed lights");
            return;
        }
        const result = enableShadow(this.world.lights, currentIndex, this.world.numShadowedLights);
        this.world.lights = result.lights;
        this.world.numShadowedLights = result.numShadowedLights;
      } else {
        const result = disableShadow(this.world.lights, currentIndex, this.world.numShadowedLights);
        this.world.lights = result.lights;
        this.world.numShadowedLights = result.numShadowedLights;
      }
      this.refreshLightCards();
      this.requestPathTracerUpdate();
    });
    wrapper.appendChild(this.createLabeledInput("Shadow", shadowInput));

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

    // Only show shadow map visualization checkbox for shadowed lights
    const currentLightIndex = this.world.lights.indexOf(light);
    if (currentLightIndex < this.world.numShadowedLights) {
      const shadowMapLabel = document.createElement("label");
      shadowMapLabel.className = "point-light__shadow-map-toggle";
      const shadowMapInput = document.createElement("input");
      shadowMapInput.type = "checkbox";
      shadowMapInput.checked = light.showShadowMap;
      shadowMapInput.addEventListener("change", () => {
        light.showShadowMap = shadowMapInput.checked;
      });
      shadowMapLabel.appendChild(shadowMapInput);
      shadowMapLabel.append(" Show shadow map");
      wrapper.appendChild(shadowMapLabel);
    }

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Remove Light";
    deleteButton.className = "point-light__delete";
    deleteButton.addEventListener("click", () => {
    const deleteIndex = this.world.lights.indexOf(light);
    // If we're deleting a shadowed light, decrement the count
    if (deleteIndex >= 0 && deleteIndex < this.world.numShadowedLights) {
        this.world.numShadowedLights--;
    }
    this.world.lights = this.world.lights.filter((l) => l !== light);
    // Remove from display order as well
    this.displayOrder = this.displayOrder.filter((l) => l !== light);
    wrapper.remove();
    this.refreshLightCards();
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

  private refreshLightCards() {
    this.container.innerHTML = "";
    // Use display order for stable UI, but only show lights that still exist in the world
    const lightsSet = new Set(this.world.lights);
    this.displayOrder = this.displayOrder.filter(light => lightsSet.has(light));
    // Add any new lights that aren't in display order yet
    this.world.lights.forEach(light => {
      if (!this.displayOrder.includes(light)) {
        this.displayOrder.push(light);
      }
    });
    this.displayOrder.forEach((light) => this.createLightCard(light));
  }

  private requestPathTracerUpdate() {
    if (this.tracerUpdateSupplier) {
      const updater = this.tracerUpdateSupplier();
      if (updater) updater();
    }
  }  
}

