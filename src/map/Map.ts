//Wrapper classes (will write stuff later)

import { Chunk } from "./marching_cubes";
import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { Light } from "./Light";

import { Color } from "./terrains";
import { Mesh } from "./Mesh";
import { Shader } from "../render/Shader";
import { GlUtils } from "../render/GlUtils";
import { WorldObject } from "./WorldObject";
import { meshToVerticesAndIndices } from "./cubes_utils";
import { MeshFragmentShaderCode, MeshVertexShaderCode } from "../render/glsl";
import { Supplier } from "../DebugMenu";

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
    for (const chunk of this.chunks) {
      CombinedMesh.merge(chunk.getMesh());
    }

    // Merge worldObjects with transformation applied
    for (const obj of this.worldObjects) {
      const meshCopy = obj.mesh.copy();
      meshCopy.translate(vec3.fromValues(obj.position[12],obj.position[13],obj.position[14]));
      /*const meshCopy = obj.mesh.copy(); 
      const transform = obj.position;   // mat4

      // Apply transform to all vertices and normals
      for (let i = 0; i < meshCopy.mesh.length; i++) {
        
        //const tri = meshCopy.mesh[i];
        //const norm = meshCopy.normals[i];


        // Transform each vertex
        for (let j = 0; j < 3; j++) {
          const v = vec4.fromValues(tri[j][0], tri[j][1], tri[j][2], 1);
          vec4.transformMat4(v, v, transform);
          vec3.set(tri[j], v[0], v[1], v[2]);
        }

        // Transform normals (ignore translation, only use rotation + scale)
        const normalMat = mat4.create();
        mat4.copy(normalMat, transform);
        normalMat[12] = 0;
        normalMat[13] = 0;
        normalMat[14] = 0;

        for (let j = 0; j < 3; j++) {
          const n = vec4.fromValues(norm[j][0], norm[j][1], norm[j][2], 0);
          vec4.transformMat4(n, n, normalMat);
          vec3.normalize(norm[j], vec3.fromValues(n[0], n[1], n[2]));
        }
      }
      CombinedMesh.merge(meshCopy);
      */
      CombinedMesh.merge(meshCopy);
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

      // Helper to create labeled number input
      function createInput(labelText: string, value: number, onChange: (v: number) => void) {
        const label = document.createElement("label");
        label.innerHTML = `<br>${labelText}: `;
        const input = document.createElement("input");
        input.type = "number";
        input.value = value.toString();
        input.step = "0.1";
        input.addEventListener("input", () => {
          onChange(parseFloat(input.value));
        });
        label.appendChild(input);
        wrapper.appendChild(label);
      }

      // Extract current translation, rotation, scale from mat4
      const translation = [obj.position[12], obj.position[13], obj.position[14]];
      const rotationDegrees = [0, 0, 0]; // default 0, or you can store separately in WorldObject
      const scale = [1, 1, 1];    // default 1, or store separately

      // Translation inputs
      let a = document.createElement("h4");
      a.textContent = "Translation:";
      wrapper.appendChild(a);
      ["X", "Y", "Z"].forEach((axis, i) =>
        createInput(`${axis}`, translation[i], (v) => {
          obj.position[12 + i] = v;
          this.tracerUpdateSupplier()();
        })
      );

      // Rotation inputs (in radians)
      a = document.createElement("h4");
      a.textContent = "Rotation:";
      wrapper.appendChild(a);
      ["X", "Y", "Z"].forEach((axis, i) =>
        createInput(`${axis}`, rotationDegrees[i], (deg) => {
          rotationDegrees[i] = deg;
          const rad = rotationDegrees.map((d) => (d * Math.PI) / 180); // convert all to radians

          // Build rotation matrix
          const r = mat4.create();
          mat4.rotateX(r, r, rad[0]);
          mat4.rotateY(r, r, rad[1]);
          mat4.rotateZ(r, r, rad[2]);

          // Preserve translation
          const t = [obj.position[12], obj.position[13], obj.position[14]];
          mat4.copy(obj.position, r);
          obj.position[12] = t[0];
          obj.position[13] = t[1];
          obj.position[14] = t[2];
          this.tracerUpdateSupplier()();
        })
      );

      // Scale inputs
      a = document.createElement("h4");
      a.textContent = "Scale:";
      wrapper.appendChild(a);
      ["X", "Y", "Z"].forEach((axis, i) =>
        createInput(`${axis}`, scale[i], (v) => {
          obj.position[parseInt(axis) * 5] = v; // crude: scale affects diagonal (0,5,10)
          this.tracerUpdateSupplier()();
        })
      );

      container.appendChild(wrapper);
    };
  }
}
