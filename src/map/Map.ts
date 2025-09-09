//Wrapper classes (will write stuff later)

import { Chunk } from "./marching_cubes";
import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { Light } from "./Light";

import { Color, Terrain, Terrains } from "./terrains";
import { Mesh, Triangle } from "./Mesh";
import { Shader } from "../render/Shader";
import { GlUtils } from "../render/GlUtils";
import { WorldObject } from "./WorldObject";
import { meshToVerticesAndIndices } from "./cubes_utils";
import { MeshFragmentShaderCode, MeshVertexShaderCode } from "../render/glsl";
import { Supplier } from "../DebugMenu";
import { loadPLYToMesh, objSourceToMesh } from "../modelLoader/objreader";
import { threemfToMesh } from "../modelLoader/3fmreader";


interface ImportMapEntry {
  color: string;
  terrain: Terrain;
}

/**
 * The object holding the map of the world
 * Center chunk starts at 0,0 (probably)
 */
export class WorldMap {
  //In Chunks
  //Unused for now: placeholders and use them when actually implemented
  private width: number;
  private length: number;
  public lights: Light[] = [
    new Light(
      vec3.fromValues(0, 500, 0),
      new Color(255, 255, 255),
      1,
      200,
      new Color(255, 228, 132)
    )
  ];

  public height: number;
  public resolution = 64; //#of vertices square size of chunk
  public chunks: Chunk[];
  public fieldMap: Map<string, number>;
  public Workers: Worker[] = [];
  public seed: number = 10; // Random seed for noise generation

  public worldObjects: WorldObject[] = [];
  gl: WebGL2RenderingContext;

  private nextWorldObjectId: number = 0;

  private tracerUpdateSupplier: () => () => void;

  private importMapEntries: ImportMapEntry[] = []

  /**
   * Constructs a world
   * @param width Width in # of chunks
   * @param length Length in # of chunks
   * @param height Height of world
   */
  public constructor(
    width: number,
    height: number,
    length: number,
    gl: WebGL2RenderingContext,
    updateTracer: () => ()=> void
  ) {
    this.tracerUpdateSupplier = updateTracer;

    this.gl = gl;
    this.width = width;
    this.length = length;
    this.height = height;
    this.chunks = [];
    for (let i = 0; i < navigator.hardwareConcurrency; i++) {
      this.Workers.push(new Worker(new URL("./Worker.ts", import.meta.url)));
    }
    this.generate();

    this.fieldMap = new Map<string, number>();

    const popup = document.getElementById("popup") as HTMLDivElement;
    const openBtn = document.getElementById("open-popup-btn")!;
    const closeBtn = document.getElementById("close-popup-btn")!;
    const submitBtn = document.getElementById("submit-object")!;
    const addMapEntryBtn = document.getElementById("add-map-entry")!;
    const importMapDiv = document.getElementById("import-map")!;
    const fileInput = document.getElementById("ply-file") as HTMLInputElement;
    const nameInput = document.getElementById("object-name") as HTMLInputElement;

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
      [1,2,3,4,5].forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.toString();
        opt.textContent = `Type ${t}`;
        terrainSelect.appendChild(opt);
      });

      // Reflectiveness
      const reflectInput = document.createElement("input");
      reflectInput.type = "number";
      reflectInput.step = "0.1";
      reflectInput.min = "0"; reflectInput.max = "1";
      reflectInput.value = "0.5";

      // Roughness
      const roughInput = document.createElement("input");
      roughInput.type = "number";
      roughInput.step = "0.1";
      roughInput.min = "0"; roughInput.max = "1";
      roughInput.value = "0.5";

      wrapper.append("Color: ", colorInput, " Terrain: ", terrainSelect,
                    " Reflect: ", reflectInput, " Rough: ", roughInput);

      importMapDiv.appendChild(wrapper);
    });
    // Handle submission
    
    submitBtn.addEventListener("click", async () => {
      const file = fileInput.files?.[0];

      // 1. UPDATED: Validate for either .ply or .3mf
      if (!file || !(file.name.endsWith(".ply") || file.name.endsWith(".3mf") || file.name.endsWith(".obj"))) {
        alert("Please upload a valid .ply, .3mf, or .obj file.");
        return;
      }
      if (!nameInput.value.trim()) {
        alert("Please enter a name for the object.");
        return;
      }

      // Collect import map entries (this logic remains the same)
      const importMap: { [id: string]: number } = {};
      document.querySelectorAll(".map-entry").forEach(entry => {
        const inputs = entry.querySelectorAll("input, select") as NodeListOf<HTMLInputElement|HTMLSelectElement>;
        const color = Color.fromHex((inputs[0] as HTMLInputElement).value);
        const type = parseInt((inputs[1] as HTMLSelectElement).value) as 1|2|3|4|5;
        Terrains[Object.keys(Terrains).length] = {
          color: color,
          reflectiveness: Math.min(1,Math.max(0,parseFloat((inputs[2] as HTMLInputElement).value))),
          roughness: Math.min(1,Math.max(0,parseFloat((inputs[3] as HTMLInputElement).value))),
          type: type
        }
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
      } else if (file.name.endsWith(".obj")){
        if(Object.keys(importMap).length != 0){
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
      this.addObject(mesh, mat4.create(), nameInput.value.trim());

      // Reset + close popup
      importMapDiv.innerHTML = "";
      fileInput.value = "";
      nameInput.value = "";
      popup.classList.add("hidden");

      // Generate for pathtracing
      if (this.tracerUpdateSupplier) this.tracerUpdateSupplier()();
    });
  }

  
  public populateFieldMap() {
    for (const chunk of this.chunks) {
      for (const [key, val] of Array.from(chunk.FieldMap.entries())) {
        this.fieldMap.set(key, val);
      }
    }
    for (const chunk of this.chunks) {
      chunk.setWorldFieldMap(this.fieldMap);
    }
  }
  //Generates map
  public generate() {
    this.chunks = [
      // Row 1
      new Chunk(
        vec2.fromValues(0, 0),
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.seed,
        this.Workers[0]
      ),
      new Chunk(
        vec2.fromValues(this.resolution, 0),
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.seed,
        this.Workers[1]
      ),
      new Chunk(
        vec2.fromValues(2 * this.resolution, 0),
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.seed,
        this.Workers[2]
      ),
      new Chunk(
        vec2.fromValues(3 * this.resolution, 0),
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.seed,
        this.Workers[3]
      )
    ];

    const container = document.getElementById("world-objects")!;
    this.setupObjectUI(this, container);
    
  }
  public combinedMesh(): Mesh {
    const CombinedMesh = new Mesh();

    // Merge chunks (these are already independent)
    for (const chunk of this.chunks) {
      CombinedMesh.merge(chunk.getMesh());
    }

    // Merge worldObjects with transformation applied
    for (const obj of this.worldObjects) {
      const meshCopy = obj.mesh.copy(); // copy original mesh

      const transformedMesh = new Mesh();

      for (let i = 0; i < meshCopy.mesh.length; i++) {
        const tri = meshCopy.mesh[i];
        const norm = meshCopy.normals[i];

        // Deep copy triangle and normal
        const newTri: Triangle = [
          vec3.clone(tri[0]),
          vec3.clone(tri[1]),
          vec3.clone(tri[2])
        ];
        const newNorm: Triangle = [
          vec3.clone(norm[0]),
          vec3.clone(norm[1]),
          vec3.clone(norm[2])
        ];

        // Apply transformation
        for (let j = 0; j < 3; j++) {
          // Transform vertex
          const v = vec4.fromValues(newTri[j][0], newTri[j][1], newTri[j][2], 1);
          vec4.transformMat4(v, v, obj.position);
          vec3.set(newTri[j], v[0], v[1], v[2]);

          // Transform normal (rotation + scale only)
          const n = vec4.fromValues(newNorm[j][0], newNorm[j][1], newNorm[j][2], 0);
          const normalMat = mat4.clone(obj.position);
          normalMat[12] = 0;
          normalMat[13] = 0;
          normalMat[14] = 0;
          vec4.transformMat4(n, n, normalMat);
          vec3.normalize(newNorm[j], vec3.fromValues(n[0], n[1], n[2]));
        }

        // Add transformed triangle
        transformedMesh.addTriangle(newTri, newNorm, meshCopy.type[i]);
      }

      // Merge safely into combined mesh
      CombinedMesh.merge(transformedMesh);
    }

    return CombinedMesh;
  }
  public onObjectAdded?: (obj: WorldObject) => void;

  /**
   * Add an object to the game world
   */
  public addObject(objectData: Mesh, objectLocation: mat4, name: string) {
    const { vertices, indices } = meshToVerticesAndIndices(objectData);
    const meshSize = indices.length;

    let objectBuffer = GlUtils.CreateStaticBuffer(
      this.gl,
      vertices,
      Array.from(indices)
    );

    const worldObject: WorldObject = {
      buffer: objectBuffer,
      position: objectLocation,
      meshSize: meshSize,
      id: this.nextWorldObjectId,
      mesh: objectData,
      name: name
    };

    this.nextWorldObjectId++;

    this.worldObjects.push(worldObject);

    if (this.onObjectAdded) {
      this.onObjectAdded(worldObject);
    }
  }

  //Renders map (later implementation we don't care abt it rn.)
  public render() {}

  setupObjectUI(world: WorldMap, container: HTMLElement) {
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
        world.worldObjects = world.worldObjects.filter(o => o.id !== obj.id);

        // Remove UI
        wrapper.remove();

        // Trigger re-trace/update if needed
        if (world.tracerUpdateSupplier) world.tracerUpdateSupplier()();
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
      const translation = [obj.position[12], obj.position[13], obj.position[14]];
      const rotationDegrees = [0, 0, 0]; // default 0 or store separately in WorldObject
      const scale = [1, 1, 1];           // default 1 or store separately

      // Function to rebuild mat4 from translation, rotation, scale
      function rebuildMatrix() {
        const rad = rotationDegrees.map((d) => (d * Math.PI) / 180);
        const newMat = mat4.create();

        mat4.translate(newMat, newMat, vec3.fromValues(translation[0], translation[1], translation[2]));
        mat4.rotateX(newMat, newMat, rad[0]);
        mat4.rotateY(newMat, newMat, rad[1]);
        mat4.rotateZ(newMat, newMat, rad[2]);
        mat4.scale(newMat, newMat, vec3.fromValues(scale[0], scale[1], scale[2]));

        mat4.copy(obj.position, newMat);

        if (world.tracerUpdateSupplier) world.tracerUpdateSupplier()();
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
