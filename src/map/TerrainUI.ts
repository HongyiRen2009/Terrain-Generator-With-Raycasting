import { WorldMap } from "./Map";
import { Color, Terrain, Terrains } from "./terrains";

export class TerrainUI {
  private world: WorldMap;
  private container: HTMLElement;
  private tracerUpdateSupplier?: () => ((terrainTypesOnly?: boolean) => void) | null;

  private updateQueued = false;

  constructor(world: WorldMap, updateTracer?: () => (terrainTypesOnly?: boolean) => void | null) {
    this.world = world;
    this.tracerUpdateSupplier = updateTracer;

    const { container } = this.ensureTerrainSection();
    this.container = container;

    this.container.innerHTML = "";
    this.buildTerrainCards();
  }

  private ensureTerrainSection(): {
    container: HTMLElement;
  } {
    const existing = document.getElementById("terrain-section");
    if (existing) {
      existing.remove();
    }

    const sidebar = document.getElementById("sidebar-content");
    if (!sidebar) {
      throw new Error("Sidebar not found for TerrainUI");
    }

    const section = document.createElement("section");
    section.id = "terrain-section";

    const heading = document.createElement("h3");
    heading.textContent = "Terrain Types";
    section.appendChild(heading);

    const container = document.createElement("div");
    container.id = "terrain-list";
    section.appendChild(container);

    sidebar.appendChild(section);

    const spacer = document.createElement("div");
    spacer.style.height = "40px";
    sidebar.appendChild(spacer);

    return { container };
  }

  private buildTerrainCards() {
    Object.entries(Terrains).forEach(([id, terrain]) => {
      this.createTerrainCard(Number(id), terrain as Terrain);
    });
  }

  private createTerrainCard(id: number, terrain: Terrain) {
    const wrapper = document.createElement("div");
    wrapper.className = "terrain-card";

    const title = document.createElement("h4");
    title.textContent = terrain.name;
    wrapper.appendChild(title);

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = this.colorToHex(terrain.color);

    colorInput.addEventListener("change", () => {
      try {
        terrain.color = Color.fromHex(colorInput.value);
        this.requestUpdate();
      } catch (e) {
        // If Color.fromHex fails, don't break the UI; log and ignore the update
        // (runtime-safe behavior)
        // eslint-disable-next-line no-console
        console.error("Invalid color hex:", colorInput.value, e);
      }
    });

    wrapper.appendChild(this.createLabeledInput("Color", colorInput));

    const reflectInput = document.createElement("input");
    reflectInput.type = "range";
    reflectInput.min = "0";
    reflectInput.max = "1";
    reflectInput.step = "0.01";
    reflectInput.value = terrain.reflectiveness.toString();

    const reflectValue = document.createElement("span");
    reflectValue.className = "range-value";
    reflectValue.textContent = terrain.reflectiveness.toFixed(2);

    reflectInput.addEventListener("input", () => {
      const v = parseFloat(reflectInput.value);

      terrain.reflectiveness = v;
      reflectValue.textContent = v.toFixed(2);

      this.requestUpdate();
    });

    wrapper.appendChild(
      this.createRangeGroup("Reflectiveness", reflectInput, reflectValue)
    );

    const roughInput = document.createElement("input");
    roughInput.type = "range";
    roughInput.min = "0";
    roughInput.max = "1";
    roughInput.step = "0.01";
    roughInput.value = terrain.roughness.toString();

    const roughValue = document.createElement("span");
    roughValue.className = "range-value";
    roughValue.textContent = terrain.roughness.toFixed(2);

    roughInput.addEventListener("input", () => {
      const v = parseFloat(roughInput.value);

      terrain.roughness = v;
      roughValue.textContent = v.toFixed(2);

      this.requestUpdate();
    });

    wrapper.appendChild(
      this.createRangeGroup("Roughness", roughInput, roughValue)
    );

    const typeSelect = document.createElement("select");

    [
      { id: 1, name: "Diffuse" },
      { id: 2, name: "Mirror" },
      { id: 3, name: "Glossy" },
      { id: 4, name: "Glass" },
      { id: 5, name: "Emission" }
    ].forEach((t) => {
      const opt = document.createElement("option");

      opt.value = t.id.toString();
      opt.textContent = t.name;

      typeSelect.appendChild(opt);
    });

    typeSelect.value = terrain.type.toString();

    typeSelect.addEventListener("change", () => {
      terrain.type = Number(typeSelect.value) as any;
      this.requestUpdate();
    });

    wrapper.appendChild(this.createLabeledInput("Type", typeSelect));

    this.container.appendChild(wrapper);
  }

  private createLabeledInput(
    labelText: string,
    input: HTMLElement
  ): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "terrain-label";

    const label = document.createElement("span");
    label.textContent = `${labelText}:`;

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    return wrapper;
  }

  private createRangeGroup(
    label: string,
    input: HTMLInputElement,
    value: HTMLElement
  ): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "terrain-range";

    const name = document.createElement("span");
    name.textContent = `${label}:`;

    const row = document.createElement("div");
    row.className = "terrain-range-row";

    row.appendChild(input);
    row.appendChild(value);

    wrapper.appendChild(name);
    wrapper.appendChild(row);

    return wrapper;
  }

  private colorToHex(color: Color): string {
    const normalizeHex = (v: number) => {
      // Accept either 0-1 floats or 0-255 ints
      let n = v;
      if (n <= 1) n = Math.round(n * 255);
      n = Math.round(n);
      n = Math.max(0, Math.min(255, n));
      return n.toString(16).padStart(2, "0");
    };

    return `#${normalizeHex(color.r)}${normalizeHex(color.g)}${normalizeHex(color.b)}`;
  }

  private requestUpdate() {
    if (this.updateQueued) return;

    this.updateQueued = true;

    requestAnimationFrame(async () => {
      this.updateQueued = false;

      // First notify the world so it can regenerate geometry/state,
      // then ask the tracer/renderer to rebuild resources (uses regenerated mesh).
      try {
        /*const res = this.world.onTerrainChanged?.();
        if (res && typeof (res as any).then === "function") {
          await res;
        }*/
      } catch (e) {
        // log and continue to attempt updater
        // eslint-disable-next-line no-console
        console.error("Error while regenerating world:", e);
      }

      try {
        if (this.world.onLightsChanged) this.world.onLightsChanged();
      } catch (e) {
        // ignore
      }
      
      const updater = this.tracerUpdateSupplier?.();
      if (typeof updater === "function") updater(true);
    });
  }
}
