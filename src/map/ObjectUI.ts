import { mat4, vec3 } from "gl-matrix";
import { threemfToMesh } from "../modelLoader/3fmreader";
import { loadPLYToMesh, objSourceToMesh } from "../modelLoader/objreader";
import { Mesh } from "./Mesh";
import { Color, Terrains } from "./terrains";
import { WorldMap } from "./Map";
import { WorldObject } from "./WorldObject";

export class ObjectUI {
  private tracerUpdateSupplier: () => () => void;
  private nextSpawnPosition: vec3 = vec3.fromValues(0, 50, 0);
  private camera?: { position: vec3 }; // Optional camera reference
  private transformUpdateTimeout: number | null = null; // For debouncing transform updates

  constructor(
    map: WorldMap,
    updateTracer: () => () => void,
    camera?: { position: vec3 }
  ) {
    this.tracerUpdateSupplier = updateTracer;
    this.camera = camera;

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
    const scaleInput = document.getElementById(
      "model-scale"
    ) as HTMLInputElement;
    const qualityInput = document.getElementById(
      "model-quality"
    ) as HTMLInputElement;
    const qualityValueSpan = document.getElementById(
      "quality-value"
    ) as HTMLElement;

    // Update quality display when slider changes
    if (qualityInput && qualityValueSpan) {
      qualityInput.addEventListener("input", () => {
        const value = parseFloat(qualityInput.value);
        qualityValueSpan.textContent = `${Math.round(value * 100)}%`;
      });
    }

    // Add position controls after popup is ready
    this.addPositionControls();

    openBtn.addEventListener("click", () => {
      popup.classList.remove("hidden");
      // Update spawn position inputs when popup opens
      this.updateSpawnInputs();
    });

    closeBtn.addEventListener("click", () => popup.classList.add("hidden"));

    // Add mapping UI
    addMapEntryBtn.addEventListener("click", () => {
      const wrapper = document.createElement("div");
      wrapper.className = "map-entry";

      const colorInput = document.createElement("input");
      colorInput.type = "color";

      const terrainSelect = document.createElement("select");
      const terrainTypes = [
        { value: 1, label: "Diffuse (Matte)" },
        { value: 2, label: "Specular (Mirror)" },
        { value: 3, label: "Glossy (Microfacet)" },
        { value: 4, label: "Transmission (Glass)" },
        { value: 5, label: "Emission (Light)" }
      ];

      terrainTypes.forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t.value.toString();
        opt.textContent = t.label;
        terrainSelect.appendChild(opt);
      });

      const reflectInput = document.createElement("input");
      reflectInput.type = "number";
      reflectInput.step = "0.1";
      reflectInput.min = "0";
      reflectInput.max = "1";
      reflectInput.value = "0.5";
      reflectInput.placeholder = "Metallic";

      const roughInput = document.createElement("input");
      roughInput.type = "number";
      roughInput.step = "0.1";
      roughInput.min = "0";
      roughInput.max = "1";
      roughInput.value = "0.5";
      roughInput.placeholder = "Roughness";

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Remove";
      deleteBtn.style.marginLeft = "10px";

      deleteBtn.addEventListener("click", () => {
        wrapper.remove();
      });

      wrapper.append(
        "Color: ",
        colorInput,
        " Terrain: ",
        terrainSelect,
        " Metallic: ",
        reflectInput,
        " Rough: ",
        roughInput,
        deleteBtn
      );

      importMapDiv.appendChild(wrapper);
    });

    // Handle submission
    submitBtn.addEventListener("click", async () => {
      const file = fileInput.files?.[0];

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

      const scaleValue = parseFloat(scaleInput.value) || 1.0;
      const qualityValue = parseFloat(
        (document.getElementById("model-quality") as HTMLInputElement)?.value ||
          "1"
      );
      const spawnPos = this.getSpawnPosition();

      // Show loading indicator
      const loadingMsg = document.createElement("div");
      loadingMsg.textContent = "Loading model...";
      loadingMsg.style.cssText =
        "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 8px; z-index: 10000; font-family: monospace;";
      document.body.appendChild(loadingMsg);

      try {
        // Collect import map entries
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
            type: type,
            emissivity: vec3.fromValues(0, 0, 0),
          metallicity: 0
          };
          importMap[color.toString()] = Object.keys(Terrains).length - 1;
        });

        let mesh: Mesh;
        let threeMFTransform: mat4 | null = null;

        // Load based on file type
        if (file.name.endsWith(".ply")) {
          const plyText = await file.text();
          mesh = loadPLYToMesh(plyText, importMap);
        } else if (file.name.endsWith(".3mf")) {
          const fileUrl = URL.createObjectURL(file);
          try {
            const result = await threemfToMesh(
              fileUrl,
              importMap,
              qualityValue
            );
            if (result == null) {
              return;
            }
            mesh = result.mesh;
            threeMFTransform = result.transform;
          } finally {
            URL.revokeObjectURL(fileUrl);
          }
        } else if (file.name.endsWith(".obj")) {
          if (Object.keys(importMap).length != 0) {
            alert("OBJ import with color mapping is not yet supported.");
            document.body.removeChild(loadingMsg);
            return;
          }
          mesh = objSourceToMesh(await file.text());
        } else {
          throw new Error("Unsupported file type.");
        }

        // Apply scale to the mesh
        if (scaleValue !== 1.0) {
          mesh.scale(scaleValue);
        }

        // Create transform matrix for spawn position
        // FIXED: Apply 3MF transform first, then translate to spawn position
        // This keeps vertices in local space for proper center calculation
        const transform = mat4.create();

        // Apply 3MF transform if present (this is the transform from the 3MF file)
        // IMPORTANT: The 3MF transform should only include rotation/scale, not translation
        // because translation is handled separately as the world position
        if (threeMFTransform && !mat4.equals(threeMFTransform, mat4.create())) {
          // Extract translation from 3MF transform
          const threeMFTranslation = vec3.fromValues(
            threeMFTransform[12],
            threeMFTransform[13],
            threeMFTransform[14]
          );

          // Copy 3MF transform but zero out translation (we'll handle translation separately)
          mat4.copy(transform, threeMFTransform);
          transform[12] = 0;
          transform[13] = 0;
          transform[14] = 0;

          // Add 3MF translation to spawn position (so object appears at correct location)
          const adjustedSpawnPos = vec3.create();
          vec3.add(adjustedSpawnPos, spawnPos, threeMFTranslation);

          // Then translate to adjusted spawn position
          mat4.translate(transform, transform, adjustedSpawnPos);
        } else {
          // No 3MF transform, just translate to spawn position
          mat4.translate(transform, transform, spawnPos);
        }

        // Add to world at spawn position
        map.addObject(mesh, transform, nameInput.value.trim());

        // Update next spawn position (offset by 10 units in X)
        this.nextSpawnPosition[0] += 10;

        // Reset + close popup
        importMapDiv.innerHTML = "";
        fileInput.value = "";
        nameInput.value = "";
        scaleInput.value = "1";
        (document.getElementById("model-quality") as HTMLInputElement).value =
          "1";
        (document.getElementById("quality-value") as HTMLElement).textContent =
          "100%";
        popup.classList.add("hidden");

        // Generate for pathtracing
        if (this.tracerUpdateSupplier) this.tracerUpdateSupplier()();

        // Success message with position
        alert(
          `Successfully loaded ${file.name} at position [${spawnPos[0].toFixed(1)}, ${spawnPos[1].toFixed(1)}, ${spawnPos[2].toFixed(1)}]!`
        );
      } catch (error) {
        console.error("❌ Error loading model:", error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        alert(`Error loading model: ${errorMsg}\n\nCheck console for details.`);
      } finally {
        document.body.removeChild(loadingMsg);
      }
    });
  }

  /**
   * Add position control inputs to the popup UI
   */
  private addPositionControls() {
    const popup = document.getElementById("popup");
    if (!popup) {
      console.error("Could not find popup element");
      return;
    }

    // Check if position controls already exist
    if (document.getElementById("spawn-position-section")) {
      return; // Already added
    }

    // Create position control section
    const positionSection = document.createElement("div");
    positionSection.id = "spawn-position-section";
    positionSection.style.cssText =
      "margin: 15px 0; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background: #f5f5f5;";

    const positionTitle = document.createElement("h3");
    positionTitle.textContent = "Spawn Position";
    positionTitle.style.margin = "0 0 10px 0";
    positionSection.appendChild(positionTitle);

    // X, Y, Z position inputs
    const axes = ["X", "Y", "Z"];
    axes.forEach((axis, index) => {
      const label = document.createElement("label");
      label.style.display = "block";
      label.style.marginBottom = "8px";
      label.innerHTML = `${axis}: `;

      const input = document.createElement("input");
      input.type = "number";
      input.id = `spawn-${axis.toLowerCase()}`;
      input.value = this.nextSpawnPosition[index].toString();
      input.step = "1";
      input.style.width = "100px";
      input.style.marginLeft = "10px";

      label.appendChild(input);
      positionSection.appendChild(label);
    });

    // Add "Use Camera Position" button
    const useCameraBtn = document.createElement("button");
    useCameraBtn.textContent = "📷 Use Camera Position";
    useCameraBtn.type = "button";
    useCameraBtn.style.cssText =
      "margin-top: 10px; width: 100%; padding: 5px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;";
    useCameraBtn.addEventListener("click", () => {
      if (this.camera && this.camera.position) {
        (document.getElementById("spawn-x") as HTMLInputElement).value =
          this.camera.position[0].toFixed(1);
        (document.getElementById("spawn-y") as HTMLInputElement).value =
          this.camera.position[1].toFixed(1);
        (document.getElementById("spawn-z") as HTMLInputElement).value =
          this.camera.position[2].toFixed(1);
      } else {
        alert(
          "Camera position not available. Please enter coordinates manually."
        );
      }
    });
    positionSection.appendChild(useCameraBtn);

    // Add "Reset to Default" button
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "↺ Reset to Default";
    resetBtn.type = "button";
    resetBtn.style.cssText =
      "margin-top: 5px; width: 100%; padding: 5px; background: #666; color: white; border: none; border-radius: 3px; cursor: pointer;";
    resetBtn.addEventListener("click", () => {
      (document.getElementById("spawn-x") as HTMLInputElement).value = "0";
      (document.getElementById("spawn-y") as HTMLInputElement).value = "50";
      (document.getElementById("spawn-z") as HTMLInputElement).value = "0";
    });
    positionSection.appendChild(resetBtn);

    // Append to popup at the end (will appear before submit button if that's the last element)
    popup.appendChild(positionSection);
  }

  /**
   * Update spawn position inputs with current nextSpawnPosition
   */
  private updateSpawnInputs() {
    (document.getElementById("spawn-x") as HTMLInputElement)?.setAttribute(
      "value",
      this.nextSpawnPosition[0].toString()
    );
    (document.getElementById("spawn-y") as HTMLInputElement)?.setAttribute(
      "value",
      this.nextSpawnPosition[1].toString()
    );
    (document.getElementById("spawn-z") as HTMLInputElement)?.setAttribute(
      "value",
      this.nextSpawnPosition[2].toString()
    );
  }

  /**
   * Get spawn position from UI inputs
   */
  private getSpawnPosition(): vec3 {
    const x = parseFloat(
      (document.getElementById("spawn-x") as HTMLInputElement)?.value || "0"
    );
    const y = parseFloat(
      (document.getElementById("spawn-y") as HTMLInputElement)?.value || "50"
    );
    const z = parseFloat(
      (document.getElementById("spawn-z") as HTMLInputElement)?.value || "0"
    );

    return vec3.fromValues(x, y, z);
  }

  setupObjectUI(
    obj: WorldObject,
    world: WorldMap,
    container: HTMLElement,
    UI: ObjectUI
  ) {
    const wrapper = document.createElement("div");
    wrapper.className = "world-object";
    wrapper.style.cssText =
      "margin-bottom: 15px; padding: 0; border: 1px solid #444; border-radius: 8px; background: rgba(50, 50, 50, 0.8); overflow: hidden;";

    // Header section with name and delete button
    const header = document.createElement("div");
    header.style.cssText =
      "padding: 12px 15px; background: rgba(60, 60, 60, 0.9); border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;";

    const nameEl = document.createElement("h3");
    nameEl.textContent = obj.name;
    nameEl.style.cssText =
      "margin: 0; font-size: 1.1em; font-weight: 600; color: #fff;";
    header.appendChild(nameEl);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "Delete Object";
    deleteBtn.style.cssText =
      "background-color: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.9em; transition: background-color 0.2s;";
    deleteBtn.addEventListener(
      "mouseenter",
      () => (deleteBtn.style.backgroundColor = "#c82333")
    );
    deleteBtn.addEventListener(
      "mouseleave",
      () => (deleteBtn.style.backgroundColor = "#dc3545")
    );
    deleteBtn.addEventListener("click", () => {
      if (!confirm(`Delete "${obj.name}"?`)) return;

      try {
        if ((obj as any).buffer) {
          const b = (obj as any).buffer;
          if (world.gl && b.vertex) world.gl.deleteBuffer(b.vertex);
          if (world.gl && b.indices) world.gl.deleteBuffer(b.indices);
        }
      } catch (e) {
        console.warn("Could not clean up buffers:", e);
      }

      world.worldObjects = world.worldObjects.filter((o) => o.id !== obj.id);
      wrapper.remove();

      // Clear any pending transform updates
      if (UI.transformUpdateTimeout !== null) {
        clearTimeout(UI.transformUpdateTimeout);
        UI.transformUpdateTimeout = null;
      }

      if (UI.tracerUpdateSupplier) UI.tracerUpdateSupplier()();
      if (world.onObjectRemoved) world.onObjectRemoved(obj.id);
    });
    header.appendChild(deleteBtn);
    wrapper.appendChild(header);

    // Content section
    const content = document.createElement("div");
    content.style.cssText = "padding: 15px;";

    // Info section
    const infoSection = document.createElement("div");
    infoSection.style.cssText =
      "margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #555;";

    const infoRow = (label: string, value: string) => {
      const row = document.createElement("div");
      row.style.cssText =
        "display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9em;";

      const labelSpan = document.createElement("span");
      labelSpan.textContent = label + ":";
      labelSpan.style.cssText = "color: #aaa; font-weight: 500;";

      const valueSpan = document.createElement("span");
      valueSpan.textContent = value;
      valueSpan.style.cssText = "color: #fff; font-family: monospace;";

      row.appendChild(labelSpan);
      row.appendChild(valueSpan);
      return row;
    };

    const vertCount = obj.mesh.mesh.length * 3;
    const triangleCount = obj.mesh.mesh.length;
    infoSection.appendChild(infoRow("Vertices", vertCount.toLocaleString()));
    infoSection.appendChild(
      infoRow("Triangles", triangleCount.toLocaleString())
    );

    const posEl = document.createElement("div");
    posEl.style.cssText =
      "display: flex; justify-content: space-between; font-size: 0.9em;";
    const posLabel = document.createElement("span");
    posLabel.textContent = "Position:";
    posLabel.style.cssText = "color: #aaa; font-weight: 500;";
    const posValue = document.createElement("span");
    posValue.style.cssText = "color: #fff; font-family: monospace;";
    posEl.appendChild(posLabel);
    posEl.appendChild(posValue);
    infoSection.appendChild(posEl);

    content.appendChild(infoSection);

    // Calculate and cache mesh center (for rotation/scale pivot)
    // IMPORTANT: Center must be in LOCAL space (from mesh vertices, not world space)
    if (!obj._cachedMeshCenter) {
      obj._cachedMeshCenter = obj.mesh.getCenter();
    }
    const meshCenter = obj._cachedMeshCenter;

    // Extract current transform components from the position matrix
    // The position matrix is: T_world * T_center * R * S * T_negCenter
    // We need to decompose it to extract translation, rotation, and scale
    // For now, we'll extract what we can, but start with identity rotation/scale
    // and let the user adjust from there

    // Extract translation (last column, bottom 3 elements)
    const translation = [obj.position[12], obj.position[13], obj.position[14]];

    // Extract scale from matrix (length of first 3 column vectors, before rotation)
    // This is approximate but should work for most cases
    const sx = Math.sqrt(
      obj.position[0] * obj.position[0] +
        obj.position[1] * obj.position[1] +
        obj.position[2] * obj.position[2]
    );
    const sy = Math.sqrt(
      obj.position[4] * obj.position[4] +
        obj.position[5] * obj.position[5] +
        obj.position[6] * obj.position[6]
    );
    const sz = Math.sqrt(
      obj.position[8] * obj.position[8] +
        obj.position[9] * obj.position[9] +
        obj.position[10] * obj.position[10]
    );
    const scale = [sx, sy, sz];

    // Start with zero rotation (user can adjust)
    const rotationDegrees = [0, 0, 0];

    // Function to update position display
    const updatePosDisplay = () => {
      posValue.textContent = `[${translation[0].toFixed(2)}, ${translation[1].toFixed(2)}, ${translation[2].toFixed(2)}]`;
    };
    updatePosDisplay();

    // Function to rebuild mat4 from translation, rotation, scale
    // FIXED: The correct order for rotating/scaling around a local center is:
    // T_world * (R * S * T_negCenter + center)
    // But since we can't add vectors to matrices, we use:
    // T_world * T_rotatedCenter * R * S * T_negCenter
    // Where T_rotatedCenter applies the center translation in the rotated coordinate space
    function rebuildMatrix() {
      const rad = rotationDegrees.map((d) => (d * Math.PI) / 180);

      // The correct formula for rotating/scaling around a point P (the center) is:
      // T_world * R * S * T(-P)
      // But we need to ensure the center ends up at world position.
      // After T(-P), the center is at (0,0,0). After R*S, it's still at (0,0,0).
      // After T_world, it should be at world position.
      // However, we need to account for the fact that the center offset gets scaled/rotated.

      // Build rotation/scale matrix first
      const rotScaleMat = mat4.create();
      mat4.scale(
        rotScaleMat,
        rotScaleMat,
        vec3.fromValues(scale[0], scale[1], scale[2])
      );
      mat4.rotateX(rotScaleMat, rotScaleMat, rad[0]);
      mat4.rotateY(rotScaleMat, rotScaleMat, rad[1]);
      mat4.rotateZ(rotScaleMat, rotScaleMat, rad[2]);

      // After T(-center), center is at (0,0,0)
      // After R*S, center is still at (0,0,0)
      // We want center to end up at 'translation' in world space
      // But the translation happens AFTER rotation, so it's in rotated coordinate space
      // We need to transform the translation vector by the inverse rotation to get it in local space
      const invRotScaleMat = mat4.create();
      mat4.invert(invRotScaleMat, rotScaleMat);
      const worldTransInLocalSpace = vec3.create();
      vec3.transformMat4(
        worldTransInLocalSpace,
        vec3.fromValues(translation[0], translation[1], translation[2]),
        invRotScaleMat
      );

      // Build the full transform: T(worldTransInLocalSpace) * R * S * T(-center)
      const newMat = mat4.create();

      // 1. Translate to -center (move object center to origin in LOCAL space)
      const negCenter = vec3.fromValues(
        -meshCenter[0],
        -meshCenter[1],
        -meshCenter[2]
      );
      mat4.translate(newMat, newMat, negCenter);

      // 2. Apply rotation/scale (center is now at origin, so it stays at origin)
      mat4.multiply(newMat, rotScaleMat, newMat);

      // 3. Translate by world translation (in local/rotated space) to place center at world position
      mat4.translate(newMat, newMat, worldTransInLocalSpace);

      mat4.copy(obj.position, newMat);
      // Position display updates immediately (smooth UI feedback)
      updatePosDisplay();

      // Debounce the expensive BVH rebuild - only update after user stops adjusting for 300ms
      // This prevents rebuilding the entire combined mesh (including transforming all triangles)
      // on every slider drag, which is very expensive for large meshes
      if (UI.transformUpdateTimeout !== null) {
        clearTimeout(UI.transformUpdateTimeout);
      }

      UI.transformUpdateTimeout = window.setTimeout(() => {
        if (UI.tracerUpdateSupplier) {
          UI.tracerUpdateSupplier()();
        }
        UI.transformUpdateTimeout = null;
      }, 300); // Wait 300ms after last change before rebuilding
    }

    // Helper to create a transform section
    const createTransformSection = (
      title: string,
      values: number[],
      axes: string[],
      onChange: (axis: number, value: number) => void
    ) => {
      const section = document.createElement("div");
      section.style.cssText = "margin-bottom: 15px;";

      const sectionTitle = document.createElement("div");
      sectionTitle.textContent = title;
      sectionTitle.style.cssText =
        "font-size: 0.85em; font-weight: 600; color: #bbb; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;";
      section.appendChild(sectionTitle);

      const inputsContainer = document.createElement("div");
      inputsContainer.style.cssText =
        "display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;";

      axes.forEach((axis, i) => {
        const inputGroup = document.createElement("div");
        inputGroup.style.cssText = "display: flex; flex-direction: column;";

        const label = document.createElement("label");
        label.textContent = axis;
        label.style.cssText =
          "font-size: 0.8em; color: #aaa; margin-bottom: 4px; font-weight: 500;";

        const input = document.createElement("input");
        input.type = "number";
        input.value = values[i].toString();
        input.step = axis === "Rotation" ? "1" : "0.1";
        input.style.cssText =
          "padding: 6px 8px; background: #333; border: 1px solid #555; border-radius: 4px; color: #fff; font-size: 0.9em; font-family: monospace; width: 100%; box-sizing: border-box;";
        input.addEventListener("input", () => {
          const val = input.value === "" ? 0 : parseFloat(input.value);
          values[i] = val;
          onChange(i, val);
          updatePosDisplay();
        });
        input.addEventListener(
          "focus",
          () => (input.style.borderColor = "#666")
        );
        input.addEventListener(
          "blur",
          () => (input.style.borderColor = "#555")
        );

        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        inputsContainer.appendChild(inputGroup);
      });

      section.appendChild(inputsContainer);
      return section;
    };

    // Translation section
    content.appendChild(
      createTransformSection(
        "Translation",
        translation,
        ["X", "Y", "Z"],
        (i, v) => {
          translation[i] = v;
          rebuildMatrix();
        }
      )
    );

    // Rotation section
    content.appendChild(
      createTransformSection(
        "Rotation (degrees)",
        rotationDegrees,
        ["X", "Y", "Z"],
        (i, v) => {
          rotationDegrees[i] = v;
          rebuildMatrix();
        }
      )
    );

    // Scale section
    content.appendChild(
      createTransformSection("Scale", scale, ["X", "Y", "Z"], (i, v) => {
        scale[i] = v;
        rebuildMatrix();
      })
    );

    wrapper.appendChild(content);
    container.appendChild(wrapper);
  }
}
