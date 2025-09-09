import { mat4, vec3 } from "gl-matrix";
import { threemfToMesh } from "../modelLoader/3fmreader";
import { loadPLYToMesh, objSourceToMesh } from "../modelLoader/objreader";
import { Mesh } from "./Mesh";
import { Color, Terrains } from "./terrains";
import { WorldMap } from "./Map";

export class ObjectUI {
  private tracerUpdateSupplier: () => () => void;
  constructor(map: WorldMap, updateTracer: () => () => void) {
    this.tracerUpdateSupplier = updateTracer;

    const popup = document.getElementById("popup") as HTMLDivElement;
    const openBtn = document.getElementById("open-popup-btn")!;
    const closeBtn = document.getElementById("close-popup-btn")!;
    const submitBtn = document.getElementById("submit-object")!;
    const addMapEntryBtn = document.getElementById("add-map-entry")!;
    const importMapDiv = document.getElementById("import-map")!;
    const fileInput = document.getElementById("ply-file") as HTMLInputElement;
    const nameInput = document.getElementById(
      "object-name"
    ) as HTMLInputElement;

    openBtn.addEventListener("click", () => popup.classList.remove("hidden"));
    closeBtn.addEventListener("click", () => popup.classList.add("hidden"));

    // Add mapping UI
    addMapEntryBtn.addEventListener("click", () => {
      const wrapper = document.createElement("div");
      wrapper.className = "map-entry";

      // Color input
      const colorInput = document.createElement("input");
      colorInput.type = "color";

      // Terrain type select
      const terrainSelect = document.createElement("select");
      [1, 2, 3, 4, 5].forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t.toString();
        opt.textContent = `Type ${t}`;
        terrainSelect.appendChild(opt);
      });

      // Reflectiveness
      const reflectInput = document.createElement("input");
      reflectInput.type = "number";
      reflectInput.step = "0.1";
      reflectInput.min = "0";
      reflectInput.max = "1";
      reflectInput.value = "0.5";

      // Roughness
      const roughInput = document.createElement("input");
      roughInput.type = "number";
      roughInput.step = "0.1";
      roughInput.min = "0";
      roughInput.max = "1";
      roughInput.value = "0.5";

      wrapper.append(
        "Color: ",
        colorInput,
        " Terrain: ",
        terrainSelect,
        " Reflect: ",
        reflectInput,
        " Rough: ",
        roughInput
      );

      importMapDiv.appendChild(wrapper);
    });
    // Handle submission

    submitBtn.addEventListener("click", async () => {
      const file = fileInput.files?.[0];

      // 1. UPDATED: Validate for either .ply or .3mf
      if (
        !file ||
        !(
          file.name.endsWith(".ply") ||
          file.name.endsWith(".3mf") ||
          file.name.endsWith(".obj")
        )
      ) {
        alert("Please upload a valid .ply, .3mf, or .obj file.");
        return;
      }
      if (!nameInput.value.trim()) {
        alert("Please enter a name for the object.");
        return;
      }

      // Collect import map entries (this logic remains the same)
      const importMap: { [id: string]: number } = {};
      document.querySelectorAll(".map-entry").forEach((entry) => {
        const inputs = entry.querySelectorAll("input, select") as NodeListOf<
          HTMLInputElement | HTMLSelectElement
        >;
        const color = Color.fromHex((inputs[0] as HTMLInputElement).value);
        const type = parseInt((inputs[1] as HTMLSelectElement).value) as
          | 1
          | 2
          | 3
          | 4
          | 5;
        Terrains[Object.keys(Terrains).length] = {
          color: color,
          reflectiveness: Math.min(
            1,
            Math.max(0, parseFloat((inputs[2] as HTMLInputElement).value))
          ),
          roughness: Math.min(
            1,
            Math.max(0, parseFloat((inputs[3] as HTMLInputElement).value))
          ),
          type: type
        };
        importMap[color.toString()] = Object.keys(Terrains).length - 1;
      });

      let mesh: Mesh; // Declare mesh variable here to be used by both loaders

      // 2. NEW: Conditional loading based on file type
      if (file.name.endsWith(".ply")) {
        // Use the existing PLY loader
        const plyText = await file.text();
        mesh = loadPLYToMesh(plyText, importMap);
      } else if (file.name.endsWith(".3mf")) {
        // Use the new 3MF loader
        // threemfToMesh function needs a URL. We create a temporary local URL for the selected file.
        const fileUrl = URL.createObjectURL(file);
        mesh = await threemfToMesh(fileUrl, importMap);
        URL.revokeObjectURL(fileUrl); // Clean up the temporary URL after loading
      } else if (file.name.endsWith(".obj")) {
        if (Object.keys(importMap).length != 0) {
          alert("OBJ import with color mapping is not yet supported.");
          return;
        }
        mesh = objSourceToMesh(await file.text());
      } else {
        // This case should not be reached due to the validation above, but it's good practice
        alert("Unsupported file type.");
        return;
      }

      // This part remains the same, as it works with the generic Mesh object
      map.addObject(mesh, mat4.create(), nameInput.value.trim());

      // Reset + close popup
      importMapDiv.innerHTML = "";
      fileInput.value = "";
      nameInput.value = "";
      popup.classList.add("hidden");

      // Generate for pathtracing
      if (this.tracerUpdateSupplier) this.tracerUpdateSupplier()();
    });

    const container = document.getElementById("world-objects")!;
    this.setupObjectUI(map, container, this);
  }

  setupObjectUI(world: WorldMap, container: HTMLElement, UI: ObjectUI) {
    world.onObjectAdded = (obj) => {
      const wrapper = document.createElement("div");
      wrapper.className = "world-object";

      // Name
      const nameEl = document.createElement("h3");
      nameEl.textContent = obj.name;
      wrapper.appendChild(nameEl);

      // Vertex count
      const vertsEl = document.createElement("p");
      vertsEl.textContent = `Vertices: ${obj.mesh.mesh.length * 3}`;
      wrapper.appendChild(vertsEl);

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete Object";
      deleteBtn.style.marginBottom = "10px";
      deleteBtn.addEventListener("click", () => {
        // Remove from world
        world.worldObjects = world.worldObjects.filter((o) => o.id !== obj.id);

        // Remove UI
        wrapper.remove();

        // Trigger re-trace/update if needed
        if (UI.tracerUpdateSupplier) UI.tracerUpdateSupplier()();
      });
      wrapper.appendChild(deleteBtn);

      // Helper to create labeled number input
      function createInput(
        labelText: string,
        value: number,
        onChange: (v: number) => void
      ) {
        const label = document.createElement("label");
        label.innerHTML = `<br>${labelText}: `;
        const input = document.createElement("input");
        input.type = "number";
        input.value = value.toString();
        input.step = "0.1";
        input.addEventListener("input", () => {
          const val = input.value === "" ? 0 : parseFloat(input.value);
          onChange(val);
        });
        label.appendChild(input);
        wrapper.appendChild(label);
      }

      // Extract current transform components
      const translation = [
        obj.position[12],
        obj.position[13],
        obj.position[14]
      ];
      const rotationDegrees = [0, 0, 0]; // default 0 or store separately in WorldObject
      const scale = [1, 1, 1]; // default 1 or store separately

      // Function to rebuild mat4 from translation, rotation, scale
      function rebuildMatrix() {
        const rad = rotationDegrees.map((d) => (d * Math.PI) / 180);
        const newMat = mat4.create();

        mat4.translate(
          newMat,
          newMat,
          vec3.fromValues(translation[0], translation[1], translation[2])
        );
        mat4.rotateX(newMat, newMat, rad[0]);
        mat4.rotateY(newMat, newMat, rad[1]);
        mat4.rotateZ(newMat, newMat, rad[2]);
        mat4.scale(
          newMat,
          newMat,
          vec3.fromValues(scale[0], scale[1], scale[2])
        );

        mat4.copy(obj.position, newMat);

        if (UI.tracerUpdateSupplier) UI.tracerUpdateSupplier()();
      }
      // Translation inputs
      const tHeader = document.createElement("h4");
      tHeader.textContent = "Translation:";
      wrapper.appendChild(tHeader);
      ["X", "Y", "Z"].forEach((axis, i) =>
        createInput(axis, translation[i], (v) => {
          translation[i] = v;
          rebuildMatrix();
        })
      );

      // Rotation inputs (degrees)
      const rHeader = document.createElement("h4");
      rHeader.textContent = "Rotation (degrees):";
      wrapper.appendChild(rHeader);
      ["X", "Y", "Z"].forEach((axis, i) =>
        createInput(axis, rotationDegrees[i], (v) => {
          rotationDegrees[i] = v;
          rebuildMatrix();
        })
      );

      // Scale inputs
      const sHeader = document.createElement("h4");
      sHeader.textContent = "Scale:";
      wrapper.appendChild(sHeader);
      ["X", "Y", "Z"].forEach((axis, i) =>
        createInput(axis, scale[i], (v) => {
          scale[i] = v;
          rebuildMatrix();
        })
      );

      container.appendChild(wrapper);
    };
  }
}
