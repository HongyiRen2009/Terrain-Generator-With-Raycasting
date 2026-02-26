// Web Worker for 3MF loading and XML/ZIP parsing.
// It offloads JSZip + fast-xml-parser work and returns flattened geometry.

import JSZip from "jszip";
import { mat4, vec2, vec3 } from "gl-matrix";
import { XMLParser } from "fast-xml-parser";

export interface ThreeMFWorkerRequest {
  id: string;
  url: string;
}

export interface ThreeMFWorkerResponse {
  id: string;
  error?: string;
  vertices?: Float32Array; // flat [x,y,z,...]
  colors?: Float32Array; // flat [r,g,b,...]
  triangles?: Uint32Array; // flat [i0,i1,i2,...]
  metallic?: Float32Array;
  roughness?: Float32Array;
  specular?: Float32Array;
  transform?: Float32Array; // 4x4 matrix (length 16)
}

interface Extracted3MFDataWorker {
  vertices: vec3[];
  colors: vec3[];
  triangles: [number, number, number][];
  materials: {
    metallic: number;
    roughness: number;
    specular: number;
  }[];
  transform: mat4;
}

// The following helpers mirror those in 3mfreader.ts but are trimmed to only
// what we need to extract raw geometry/material data for the main thread.

interface ObjectData {
  mesh?: MeshData;
  components?: ComponentData[];
}

interface MeshData {
  vertices: vec3[];
  triangles: TriangleData[];
  colors: vec3[];
  uvs: vec2[];
  materials: MaterialProperties[];
}

interface TriangleData {
  indices: [number, number, number];
  colorIndices?: [number, number, number];
  propertyGroupId?: string;
}

interface ComponentData {
  objectId: string;
  transform: mat4;
}

interface MaterialProperties {
  metallic: number;
  roughness: number;
  specular: number;
  textureId?: string;
}

function parseHexColor(hexStr: string): vec3 | null {
  if (!hexStr || typeof hexStr !== "string") return null;
  let hex = hexStr.trim();
  if (hex.startsWith("#")) hex = hex.substring(1);
  hex = hex.replace(/[^0-9A-Fa-f]/g, "");
  if (hex.length === 0) return null;

  let r = 0,
    g = 0,
    b = 0;
  try {
    if (hex.length === 8) {
      r = parseInt(hex.substring(0, 2), 16) / 255;
      g = parseInt(hex.substring(2, 4), 16) / 255;
      b = parseInt(hex.substring(4, 6), 16) / 255;
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16) / 255;
      g = parseInt(hex.substring(2, 4), 16) / 255;
      b = parseInt(hex.substring(4, 6), 16) / 255;
    } else if (hex.length === 4) {
      r = parseInt(hex.substring(0, 1).repeat(2), 16) / 255;
      g = parseInt(hex.substring(1, 2).repeat(2), 16) / 255;
      b = parseInt(hex.substring(2, 3).repeat(2), 16) / 255;
    } else if (hex.length === 3) {
      r = parseInt(hex.substring(0, 1).repeat(2), 16) / 255;
      g = parseInt(hex.substring(1, 2).repeat(2), 16) / 255;
      b = parseInt(hex.substring(2, 3).repeat(2), 16) / 255;
    } else {
      return null;
    }
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return vec3.fromValues(r, g, b);
  } catch {
    return null;
  }
}

function findKey(obj: any, ...possibleNames: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;
  const keys = Object.keys(obj);
  for (const name of possibleNames) {
    if (keys.includes(name)) return name;
    const lowerName = name.toLowerCase();
    for (const key of keys) {
      if (key.toLowerCase() === lowerName) return key;
      if (
        key.toLowerCase().endsWith(":" + lowerName) ||
        key.toLowerCase().endsWith("_" + lowerName)
      ) {
        return key;
      }
    }
  }
  return null;
}

function getValue(obj: any, ...possibleNames: string[]): any {
  const key = findKey(obj, ...possibleNames);
  return key ? obj[key] : null;
}

function parseTransform(transformString: string | null): mat4 {
  const transform = mat4.create();
  if (!transformString) return transform;
  try {
    const parts = transformString.trim().split(/\s+/).map(parseFloat);
    if (parts.length < 12) return transform;
    mat4.set(
      transform,
      parts[0],
      parts[1],
      parts[2],
      0,
      parts[3],
      parts[4],
      parts[5],
      0,
      parts[6],
      parts[7],
      parts[8],
      0,
      parts[9],
      parts[10],
      parts[11],
      1
    );
  } catch {
    return transform;
  }
  return transform;
}

function parse3MFModelWorker(xmlString: string): Extracted3MFDataWorker {
  const defaultColor = vec3.fromValues(0.8, 0.8, 0.8);

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    parseAttributeValue: false,
    trimValues: true,
    processEntities: true,
    removeNSPrefix: true,
    parseTagValue: false
  });

  const result = parser.parse(xmlString);
  const modelNode = getValue(result, "model", "3mf:model", "m:model");
  if (!modelNode) {
    throw new Error("Invalid 3MF: No model node found");
  }

  const unit = getValue(modelNode, "@_unit", "@_Unit") || "millimeter";
  let scale = 1.0;
  const unitLower = unit.toLowerCase();
  if (unitLower === "meter") scale = 1000.0;
  else if (unitLower === "inch") scale = 25.4;
  else if (unitLower === "centimeter") scale = 10.0;
  else if (unitLower === "micrometer") scale = 0.001;
  else if (unitLower === "foot") scale = 304.8;

  const resourceLibrary = {
    objects: new Map<string, ObjectData>(),
    colors: new Map<string, vec3[]>(),
    materials: new Map<string, MaterialProperties>()
  };

  const resources = getValue(
    modelNode,
    "resources",
    "m:resources",
    "3mf:resources"
  );
  if (resources) {
    parseColorResources(resources, resourceLibrary, defaultColor);
    parseMaterialResources(resources, resourceLibrary);
    parseObjects(resources, resourceLibrary, scale, defaultColor);
  }

  const finalVertices: vec3[] = [];
  const finalColors: vec3[] = [];
  const finalMaterials: MaterialProperties[] = [];
  const finalTriangles: number[] = [];

  let combinedTransform = mat4.create();
  let hasTransform = false;

  const build = getValue(modelNode, "build", "m:build", "3mf:build");
  if (build) {
    const itemValue = getValue(build, "item", "m:item", "3mf:item");
    if (itemValue) {
      const items = Array.isArray(itemValue) ? itemValue : [itemValue];
      const stack: Array<{ id: string; transform: mat4 }> = [];

      items.forEach((item, idx) => {
        const objectId = getValue(
          item,
          "@_objectid",
          "@_objectId",
          "@_ObjectId"
        );
        if (!objectId) return;
        const transformStr = getValue(
          item,
          "@_transform",
          "@_Transform"
        );
        const transform = parseTransform(transformStr);
        if (idx === 0) {
          combinedTransform = transform;
          hasTransform = !mat4.equals(transform, mat4.create());
        } else {
          mat4.multiply(combinedTransform, combinedTransform, transform);
        }
        stack.push({ id: objectId, transform: mat4.create() });
      });

      while (stack.length > 0) {
        const { id, transform } = stack.pop()!;
        const obj = resourceLibrary.objects.get(id);
        if (!obj) continue;
        if (obj.mesh) {
          const mesh = obj.mesh;
          const vertexOffset = finalVertices.length;
          for (const v of mesh.vertices) {
            const transformed = vec3.create();
            vec3.transformMat4(transformed, v, transform);
            finalVertices.push(transformed);
          }
          for (let i = 0; i < mesh.colors.length; i++) {
            finalColors.push(mesh.colors[i]);
          }
          for (let i = 0; i < mesh.materials.length; i++) {
            finalMaterials.push(mesh.materials[i]);
          }
          for (const tri of mesh.triangles) {
            finalTriangles.push(
              tri.indices[0] + vertexOffset,
              tri.indices[1] + vertexOffset,
              tri.indices[2] + vertexOffset
            );
          }
        } else if (obj.components) {
          for (let i = obj.components.length - 1; i >= 0; i--) {
            const c = obj.components[i];
            const childTransform = mat4.create();
            mat4.multiply(childTransform, transform, c.transform);
            stack.push({ id: c.objectId, transform: childTransform });
          }
        }
      }
    }
  }

  if (finalVertices.length === 0) {
    throw new Error("No geometry data found in 3MF file");
  }

  const triangles: [number, number, number][] = [];
  for (let i = 0; i < finalTriangles.length; i += 3) {
    triangles.push([
      finalTriangles[i],
      finalTriangles[i + 1],
      finalTriangles[i + 2]
    ]);
  }

  return {
    vertices: finalVertices,
    colors: finalColors,
    triangles,
    materials: finalMaterials,
    transform: hasTransform ? combinedTransform : mat4.create()
  };
}

function parseMaterialResources(
  resources: any,
  library: { materials: Map<string, MaterialProperties> }
) {
  const materialValue = getValue(
    resources,
    "basematerials",
    "basematerial",
    "material",
    "materials"
  );
  if (!materialValue) return;
  const groups = Array.isArray(materialValue) ? materialValue : [materialValue];
  for (const group of groups) {
    const id = getValue(group, "@_id", "@_Id");
    if (!id) continue;
    const material: MaterialProperties = {
      metallic: parseFloat(
        getValue(group, "@_metallic", "@_metalness", "@_metal") || "0"
      ),
      roughness: parseFloat(
        getValue(group, "@_roughness", "@_rough") || "0.5"
      ),
      specular: parseFloat(
        getValue(group, "@_specular", "@_spec") || "0.5"
      )
    };
    library.materials.set(id, material);
  }
}

function parseColorResources(
  resources: any,
  library: { colors: Map<string, vec3[]> },
  defaultColor: vec3
) {
  const colorGroupValue = getValue(
    resources,
    "colorgroup",
    "basematerials",
    "basematerial",
    "colors"
  );
  if (!colorGroupValue) return;
  const groups = Array.isArray(colorGroupValue)
    ? colorGroupValue
    : [colorGroupValue];
  for (const group of groups) {
    const id = getValue(group, "@_id", "@_Id");
    if (!id) continue;
    const colorElements = getValue(
      group,
      "color",
      "base",
      "item",
      "c"
    );
    if (!colorElements) continue;
    const colorArray = Array.isArray(colorElements)
      ? colorElements
      : [colorElements];
    const parsedColors: vec3[] = [];
    for (const c of colorArray) {
      const colorStr = getValue(
        c,
        "@_color",
        "@_displaycolor",
        "@_displayColor",
        "@_Color",
        "@_sRGB",
        "@_rgb"
      );
      if (colorStr) {
        const parsed = parseHexColor(colorStr);
        if (parsed) {
          parsedColors.push(parsed);
          continue;
        }
      }
      parsedColors.push(vec3.clone(defaultColor));
    }
    if (parsedColors.length > 0) {
      library.colors.set(id, parsedColors);
    }
  }
}

function parseObjects(
  resources: any,
  library: {
    objects: Map<string, ObjectData>;
    colors: Map<string, vec3[]>;
    materials: Map<string, MaterialProperties>;
  },
  scale: number,
  defaultColor: vec3
) {
  const objectValue = getValue(resources, "object", "objects");
  if (!objectValue) return;
  const objects = Array.isArray(objectValue) ? objectValue : [objectValue];
  for (const objectNode of objects) {
    const objectId = getValue(objectNode, "@_id", "@_Id");
    if (!objectId) continue;
    const meshValue = getValue(objectNode, "mesh", "m:mesh", "3mf:mesh");
    const componentsValue = getValue(
      objectNode,
      "components",
      "m:components",
      "component"
    );
    if (meshValue) {
      const meshData = parseMesh(objectNode, library, scale, defaultColor);
      library.objects.set(objectId, { mesh: meshData });
    } else if (componentsValue) {
      const components = parseComponents(componentsValue);
      library.objects.set(objectId, { components });
    }
  }
}

function parseMesh(
  objectNode: any,
  library: {
    colors: Map<string, vec3[]>;
    materials: Map<string, MaterialProperties>;
  },
  scale: number,
  defaultColor: vec3
): MeshData {
  const meshNode = getValue(objectNode, "mesh", "m:mesh", "3mf:mesh");
  if (!meshNode) {
    throw new Error("No mesh node found");
  }

  const vertices: vec3[] = [];
  const triangles: TriangleData[] = [];

  const objectPid = getValue(objectNode, "@_pid", "@_Pid");
  const objectPindex = getValue(
    objectNode,
    "@_pindex",
    "@_pIndex",
    "@_Pindex"
  );

  const verticesNode = getValue(meshNode, "vertices", "m:vertices");
  if (verticesNode) {
    const vertexValue = getValue(verticesNode, "vertex", "v");
    const vertexArray = Array.isArray(vertexValue)
      ? vertexValue
      : [vertexValue];
    for (const v of vertexArray) {
      const x = parseFloat(getValue(v, "@_x", "@_X") || "0");
      const y = parseFloat(getValue(v, "@_y", "@_Y") || "0");
      const z = parseFloat(getValue(v, "@_z", "@_Z") || "0");
      vertices.push(vec3.fromValues(x * scale, y * scale, z * scale));
    }
  }

  const objectColors = new Array(vertices.length);
  const objectMaterials = new Array(vertices.length);
  for (let i = 0; i < vertices.length; i++) {
    objectColors[i] = vec3.clone(defaultColor);
    objectMaterials[i] = {
      metallic: 0,
      roughness: 0.5,
      specular: 0.5
    };
  }

  const trianglesNode = getValue(meshNode, "triangles", "m:triangles");
  if (trianglesNode) {
    const triangleValue = getValue(trianglesNode, "triangle", "t");
    const triangleArray = Array.isArray(triangleValue)
      ? triangleValue
      : [triangleValue];
    for (const t of triangleArray) {
      const v1 = parseInt(getValue(t, "@_v1", "@_V1") || "0", 10);
      const v2 = parseInt(getValue(t, "@_v2", "@_V2") || "0", 10);
      const v3 = parseInt(getValue(t, "@_v3", "@_V3") || "0", 10);
      if (
        v1 >= vertices.length ||
        v2 >= vertices.length ||
        v3 >= vertices.length ||
        v1 < 0 ||
        v2 < 0 ||
        v3 < 0
      ) {
        continue;
      }
      const trianglePid = getValue(t, "@_pid", "@_Pid") || objectPid;
      let p1 = getValue(t, "@_p1", "@_P1");
      let p2 = getValue(t, "@_p2", "@_P2");
      let p3 = getValue(t, "@_p3", "@_P3");

      p1 =
        p1 !== null
          ? parseInt(p1, 10)
          : objectPindex !== null
          ? parseInt(objectPindex, 10)
          : 0;
      p2 = p2 !== null ? parseInt(p2, 10) : p1;
      p3 = p3 !== null ? parseInt(p3, 10) : p1;

      if (trianglePid && library.colors.has(trianglePid)) {
        const colors = library.colors.get(trianglePid)!;
        if (p1 < colors.length) objectColors[v1] = colors[p1];
        if (p2 < colors.length) objectColors[v2] = colors[p2];
        if (p3 < colors.length) objectColors[v3] = colors[p3];
      }
      if (trianglePid && library.materials.has(trianglePid)) {
        const material = library.materials.get(trianglePid)!;
        objectMaterials[v1] = { ...material };
        objectMaterials[v2] = { ...material };
        objectMaterials[v3] = { ...material };
      }

      triangles.push({
        indices: [v1, v2, v3],
        colorIndices: [p1, p2, p3],
        propertyGroupId: trianglePid || undefined
      });
    }
  }

  return {
    vertices,
    triangles,
    colors: objectColors,
    uvs: new Array(vertices.length).fill(vec2.create()),
    materials: objectMaterials
  };
}

function parseComponents(componentsNode: any): ComponentData[] {
  let componentArray: any[];
  if (Array.isArray(componentsNode)) {
    componentArray = componentsNode;
  } else {
    const componentValue = getValue(componentsNode, "component", "m:component");
    if (!componentValue) return [];
    componentArray = Array.isArray(componentValue)
      ? componentValue
      : [componentValue];
  }
  return componentArray
    .map((c: any) => {
      const objectId = getValue(
        c,
        "@_objectid",
        "@_objectId",
        "@_ObjectId"
      );
      const transformStr = getValue(c, "@_transform", "@_Transform");
      return {
        objectId,
        transform: parseTransform(transformStr)
      };
    })
    .filter((c: any) => c.objectId);
}

async function load3MFWorker(url: string): Promise<Extracted3MFDataWorker> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  const fileData = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(fileData);
  const modelFile = zip.file("3D/3dmodel.model");
  if (!modelFile) {
    throw new Error("Invalid 3MF: 3D/3dmodel.model not found");
  }
  const xmlString = await modelFile.async("string");
  return parse3MFModelWorker(xmlString);
}

self.onmessage = async (event: MessageEvent<ThreeMFWorkerRequest>) => {
  const { id, url } = event.data;
  try {
    const model = await load3MFWorker(url);

    const vertexCount = model.vertices.length;
    const vertices = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const metallic = new Float32Array(vertexCount);
    const roughness = new Float32Array(vertexCount);
    const specular = new Float32Array(vertexCount);

    for (let i = 0; i < vertexCount; i++) {
      const v = model.vertices[i];
      const c = model.colors[i] ?? vec3.fromValues(0.8, 0.8, 0.8);
      const m = model.materials[i] ?? {
        metallic: 0,
        roughness: 0.5,
        specular: 0.5
      };

      vertices[i * 3 + 0] = v[0];
      vertices[i * 3 + 1] = v[1];
      vertices[i * 3 + 2] = v[2];

      colors[i * 3 + 0] = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];

      metallic[i] = m.metallic;
      roughness[i] = m.roughness;
      specular[i] = m.specular;
    }

    const trianglesFlat = new Uint32Array(model.triangles.length * 3);
    for (let i = 0; i < model.triangles.length; i++) {
      const t = model.triangles[i];
      const o = i * 3;
      trianglesFlat[o] = t[0];
      trianglesFlat[o + 1] = t[1];
      trianglesFlat[o + 2] = t[2];
    }

    const transform = new Float32Array(model.transform);

    const response: ThreeMFWorkerResponse = {
      id,
      vertices,
      colors,
      triangles: trianglesFlat,
      metallic,
      roughness,
      specular,
      transform
    };

    self.postMessage(response, [
      vertices.buffer,
      colors.buffer,
      trianglesFlat.buffer,
      metallic.buffer,
      roughness.buffer,
      specular.buffer,
      transform.buffer
    ]);
  } catch (error: any) {
    const response: ThreeMFWorkerResponse = {
      id,
      error: error?.message ?? String(error)
    };
    self.postMessage(response);
  }
};

