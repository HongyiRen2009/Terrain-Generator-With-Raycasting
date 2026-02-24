import JSZip from "jszip";
import { mat4, vec2, vec3 } from "gl-matrix";
import { Mesh, Triangle } from "../map/Mesh";
import { Color, Terrains } from "../map/terrains";
import { XMLParser } from "fast-xml-parser";
import type { ThreeMFWorkerResponse } from "./ThreeMFWorker";

export async function threemfToMesh(
  url: string,
  importMap: { [id: string]: number } | null = null,
  quality: number = 1.0
): Promise<{ mesh: Mesh; transform: mat4 } | null> {
  const modelData =
    typeof Worker !== "undefined" ? await load3MFViaWorker(url) : await load3MF(url);
  return buildMeshFromExtracted(modelData, importMap, quality);
}

function buildMeshFromExtracted(
  modelData: Extracted3MFData,
  importMap: { [id: string]: number } | null,
  quality: number
): { mesh: Mesh; transform: mat4 } | null {
  const mesh = new Mesh();
  const totalTriangles = modelData.triangles.length;
  
  for (let i = 0; i < totalTriangles; i++) {
    
    const triangleVertices: vec3[] = modelData.triangles[i].map(
      (vIdx) => modelData.vertices[vIdx]
    );
    const triangleVerticesNormals: vec3[] = modelData.triangles[i].map(
      (vIdx) => modelData.normals[vIdx]
    );
    
    let types: number[] = [0, 0, 0];
    
    // Process colors and materials to assign terrain types
    for (let j = 0; j < 3; j++) {
      const vIdx = modelData.triangles[i][j];
      const col = Color.fromVec3(modelData.colors[vIdx]);
      const colStr = col.toString();
      const material = modelData.materials[vIdx];
      
      // Check if color is in import map
      if (importMap && colStr in importMap) {
        types[j] = importMap[colStr] as number;
      } else {
        // Check if a terrain with this color and material properties exists
        let found = false;
        for (let key in Terrains) {
          const terrain = Terrains[parseInt(key)];
          if (terrain.color.equals(col) && 
              Math.abs(terrain.reflectiveness - material.metallic) < 0.01 &&
              Math.abs(terrain.roughness - material.roughness) < 0.01) {
            types[j] = parseInt(key);
            found = true;
            break;
          }
        }
        
        // Create new terrain type if not found
        if (!found) {
          // Determine terrain type based on material properties
          let terrainType: 1 | 2 | 3 | 4 | 5 = 1; // Default to diffuse
          
          if (material.metallic > 0.8) {
            terrainType = 2; // Specular (mirror)
          } else if (material.roughness < 0.3) {
            terrainType = 3; // Glossy
          } else if (material.specular > 0.9) {
            terrainType = 4; // Transmission
          }
          
          Terrains[Object.keys(Terrains).length] = {
            color: col,
            reflectiveness: material.metallic,
            roughness: material.roughness,
            type: terrainType
          };
          types[j] = Object.keys(Terrains).length - 1;
        }
      }
    }

    mesh.addTriangle(
      triangleVertices as Triangle,
      triangleVerticesNormals as Triangle,
      types as [number, number, number]
    );
  }

  const originalTriangleCount = mesh.mesh.length;

  // Apply decimation if quality < 1.0
  // For very large meshes (>500k triangles), optionally suggest reducing quality.
  const LARGE_MESH_THRESHOLD = 500000;
  let effectiveQuality = quality;

  if (
    typeof window !== "undefined" &&
    quality >= 1.0 &&
    originalTriangleCount > LARGE_MESH_THRESHOLD
  ) {
    // Auto-recommend reduced quality for extremely large meshes
    const recommendedQuality = Math.max(
      0.3,
      Math.min(0.7, 500000 / originalTriangleCount)
    );
    const proceedWithRecommended = window.confirm(
      `⚠️ The imported model is very large (${originalTriangleCount.toLocaleString()} triangles).\n\n` +
        `Click OK to use a reduced quality of ${recommendedQuality.toFixed(
          2
        )} for better performance,\n` +
        `or Cancel to enter a custom quality value.`
    );

    if (proceedWithRecommended) {
      effectiveQuality = recommendedQuality;
    } else {
      while (true) {
        const input = window.prompt(
          `Enter a quality value between 0.0 and 1.0\n` +
            `(Recommended: ${recommendedQuality.toFixed(2)})\n\n` +
            `Press Cancel to abort import.`,
          recommendedQuality.toFixed(2)
        );

        if (input === null) {
          return null;
        }

        const value = Number(input);
        if (!Number.isNaN(value) && value >= 0.0 && value <= 1.0) {
          effectiveQuality = value;
          break;
        }

        window.alert(
          "Invalid input. Quality must be a number between 0.0 and 1.0."
        );
      }
    }
  } else if (quality < 0.3 && typeof window !== "undefined") {
    window.alert(
      `⚠️ Quality setting below 30% (${(quality * 100).toFixed(
        0
      )}%) may cause significant visual artifacts. Consider using 30-50% for better results.`
    );
  }

  if (effectiveQuality < 1.0) {
    const clampedQuality = Math.max(0.05, Math.min(1.0, effectiveQuality));
    const decimatedMesh = mesh.decimate(clampedQuality);
    return { mesh: decimatedMesh, transform: modelData.transform };
  }

  return { mesh, transform: modelData.transform };
}

let threeMFWorker: Worker | null = null;
let threeMFWorkerRequestId = 0;
const threeMFWorkerPending = new Map<
  string,
  { resolve: (value: ThreeMFWorkerResponse) => void; reject: (reason?: any) => void }
>();

function getThreeMFWorker(): Worker {
  if (!threeMFWorker) {
    threeMFWorker = new Worker(new URL("./ThreeMFWorker.ts", import.meta.url));
    threeMFWorker.onmessage = (event: MessageEvent<ThreeMFWorkerResponse>) => {
      const { id } = event.data;
      const pending = threeMFWorkerPending.get(id);
      if (!pending) return;
      threeMFWorkerPending.delete(id);
      pending.resolve(event.data);
    };
    threeMFWorker.onerror = (err) => {
      threeMFWorkerPending.forEach(({ reject }) => reject(err));
      threeMFWorkerPending.clear();
    };
  }
  return threeMFWorker;
}

async function load3MFViaWorker(url: string): Promise<Extracted3MFData> {
  if (typeof Worker === "undefined") {
    return load3MF(url);
  }

  const worker = getThreeMFWorker();
  const id = String(++threeMFWorkerRequestId);

  const response = await new Promise<ThreeMFWorkerResponse>((resolve, reject) => {
    threeMFWorkerPending.set(id, { resolve, reject });
    worker.postMessage({ id, url });
  });

  if (response.error) {
    throw new Error(response.error);
  }

  if (
    !response.vertices ||
    !response.colors ||
    !response.triangles ||
    !response.metallic ||
    !response.roughness ||
    !response.specular ||
    !response.transform
  ) {
    throw new Error("3MF worker returned incomplete data.");
  }

  const vertices: vec3[] = [];
  const colors: vec3[] = [];
  const materials: MaterialProperties[] = [];
  const triangles: [number, number, number][] = [];

  for (let i = 0; i < response.vertices.length; i += 3) {
    vertices.push(
      vec3.fromValues(
        response.vertices[i],
        response.vertices[i + 1],
        response.vertices[i + 2]
      )
    );
  }

  for (let i = 0; i < response.colors.length; i += 3) {
    colors.push(
      vec3.fromValues(
        response.colors[i],
        response.colors[i + 1],
        response.colors[i + 2]
      )
    );
  }

  for (let i = 0; i < response.metallic.length; i++) {
    materials.push({
      metallic: response.metallic[i],
      roughness: response.roughness[i],
      specular: response.specular[i]
    });
  }

  for (let i = 0; i < response.triangles.length; i += 3) {
    triangles.push([
      response.triangles[i],
      response.triangles[i + 1],
      response.triangles[i + 2]
    ]);
  }

  const transform = mat4.fromValues(
    response.transform[0],
    response.transform[1],
    response.transform[2],
    response.transform[3],
    response.transform[4],
    response.transform[5],
    response.transform[6],
    response.transform[7],
    response.transform[8],
    response.transform[9],
    response.transform[10],
    response.transform[11],
    response.transform[12],
    response.transform[13],
    response.transform[14],
    response.transform[15]
  );

  const normals = calculateNormals(vertices, triangles);

  return {
    vertices,
    normals,
    colors,
    uvs: [],
    triangles,
    materials,
    textures: new Map(),
    transform
  };
}

export interface Extracted3MFData {
  vertices: vec3[];
  normals: vec3[];
  colors: vec3[];
  uvs: vec2[];
  triangles: [number, number, number][];
  materials: MaterialProperties[];
  textures: Map<string, TextureData>;
  transform: mat4; // 3MF transform to apply (identity if none)
}

export interface MaterialProperties {
  metallic: number;
  roughness: number;
  specular: number;
  textureId?: string;
}

export interface TextureData {
  id: string;
  blob: Blob;
  contentType: string;
}

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

/**
 * Calculates smooth vertex normals
 */
function calculateNormals(
  vertices: vec3[],
  triangles: [number, number, number][]
): vec3[] {
  const normals: vec3[] = [];
  for (let i = 0; i < vertices.length; i++) {
    normals.push(vec3.fromValues(0, 0, 0));
  }

  const edge1 = vec3.create();
  const edge2 = vec3.create();
  const faceNormal = vec3.create();

  for (const triangle of triangles) {
    const [i1, i2, i3] = triangle;
    const v1 = vertices[i1];
    const v2 = vertices[i2];
    const v3 = vertices[i3];

    vec3.subtract(edge1, v2, v1);
    vec3.subtract(edge2, v3, v1);
    vec3.cross(faceNormal, edge1, edge2);

    vec3.add(normals[i1], normals[i1], faceNormal);
    vec3.add(normals[i2], normals[i2], faceNormal);
    vec3.add(normals[i3], normals[i3], faceNormal);
  }

  for (let i = 0; i < normals.length; i++) {
    const len = vec3.length(normals[i]);
    if (len > 0.0001) {
      vec3.normalize(normals[i], normals[i]);
    } else {
      // Degenerate normal, use up vector
      vec3.set(normals[i], 0, 1, 0);
    }
  }

  return normals;
}

/**
 * Extract color from various hex formats
 */
function parseHexColor(hexStr: string): vec3 | null {
  if (!hexStr || typeof hexStr !== 'string') return null;
  
  let hex = hexStr.trim();
  if (hex.startsWith('#')) hex = hex.substring(1);
  
  // Remove any non-hex characters
  hex = hex.replace(/[^0-9A-Fa-f]/g, '');
  
  if (hex.length === 0) return null;
  
  let r = 0, g = 0, b = 0;
  
  try {
    if (hex.length === 8) {
      // RRGGBBAA
      r = parseInt(hex.substring(0, 2), 16) / 255;
      g = parseInt(hex.substring(2, 4), 16) / 255;
      b = parseInt(hex.substring(4, 6), 16) / 255;
    } else if (hex.length === 6) {
      // RRGGBB
      r = parseInt(hex.substring(0, 2), 16) / 255;
      g = parseInt(hex.substring(2, 4), 16) / 255;
      b = parseInt(hex.substring(4, 6), 16) / 255;
    } else if (hex.length === 4) {
      // RGBA
      r = parseInt(hex.substring(0, 1).repeat(2), 16) / 255;
      g = parseInt(hex.substring(1, 2).repeat(2), 16) / 255;
      b = parseInt(hex.substring(2, 3).repeat(2), 16) / 255;
    } else if (hex.length === 3) {
      // RGB
      r = parseInt(hex.substring(0, 1).repeat(2), 16) / 255;
      g = parseInt(hex.substring(1, 2).repeat(2), 16) / 255;
      b = parseInt(hex.substring(2, 3).repeat(2), 16) / 255;
    } else {
      console.warn(`⚠️ Unusual hex length (${hex.length}): ${hexStr}`);
      return null;
    }
    
    // Validate the parsed values
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      console.warn(`⚠️ Failed to parse hex color: ${hexStr}`);
      return null;
    }
    
    return vec3.fromValues(r, g, b);
  } catch (e) {
    console.warn(`⚠️ Error parsing hex color ${hexStr}:`, e);
    return null;
  }
}

/**
 * Helper to find a key in an object, case-insensitive and namespace-agnostic
 */
function findKey(obj: any, ...possibleNames: string[]): string | null {
  if (!obj || typeof obj !== 'object') return null;
  
  const keys = Object.keys(obj);
  
  for (const name of possibleNames) {
    // Direct match
    if (keys.includes(name)) return name;
    
    // Case-insensitive match
    const lowerName = name.toLowerCase();
    for (const key of keys) {
      if (key.toLowerCase() === lowerName) return key;
      
      // Check if key ends with the name (for namespaced attributes)
      if (key.toLowerCase().endsWith(':' + lowerName) || 
          key.toLowerCase().endsWith('_' + lowerName)) {
        return key;
      }
    }
  }
  
  return null;
}

/**
 * Get value from object using flexible key matching
 */
function getValue(obj: any, ...possibleNames: string[]): any {
  const key = findKey(obj, ...possibleNames);
  return key ? obj[key] : null;
}

/**
 * Improved 3MF parser with better error handling
 */
function parse3MFModel(xmlString: string): Extracted3MFData {
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

  let result;
  try {
    result = parser.parse(xmlString);
  } catch (e) {
    console.error("❌ XML parsing failed:", e);
    throw new Error(`Failed to parse 3MF XML: ${e}`);
  }
  
  // Find model node flexibly
  const modelNode = getValue(result, 'model', '3mf:model', 'm:model');
  
  if (!modelNode) {
    console.error("❌ No model node found. Available keys:", Object.keys(result));
    throw new Error("Invalid 3MF: No model node found");
  }

  // Parse unit and scale
  const unit = getValue(modelNode, '@_unit', '@_Unit') || "millimeter";
  let scale = 1.0;
  const unitLower = unit.toLowerCase();
  if (unitLower === "meter") scale = 1000.0;
  else if (unitLower === "inch") scale = 25.4;
  else if (unitLower === "centimeter") scale = 10.0;
  else if (unitLower === "micrometer") scale = 0.001;
  else if (unitLower === "foot") scale = 304.8;
  

  // Resource library
  const resourceLibrary = {
    objects: new Map<string, ObjectData>(),
    colors: new Map<string, vec3[]>(),
    materials: new Map<string, MaterialProperties>(),
    textures: new Map<string, string>()
  };

  // Parse resources
  const resources = getValue(modelNode, 'resources', 'm:resources', '3mf:resources');
  
  if (resources) {
    try {
      parseColorResources(resources, resourceLibrary, defaultColor);
      parseMaterialResources(resources, resourceLibrary);
      parseTextureResources(resources, resourceLibrary);
      parseObjects(resources, resourceLibrary, scale, defaultColor);
    } catch (e) {
      console.error("⚠️ Error parsing resources:", e);
    }
  } else {
    console.warn("⚠️ No resources element found");
  }

  // Process build items
  // FIXED: Don't apply transforms to vertices - keep them in local space
  // This allows proper center calculation and prevents movement during scaling/rotation
  const finalData: Omit<Extracted3MFData, "normals" | "triangles" | "textures" | "transform"> & {
    triangles: number[];
  } = {
    vertices: [],
    colors: [],
    uvs: [],
    materials: [],
    triangles: []
  };

  // Accumulate 3MF transforms (for multiple build items, combine them)
  let combinedTransform = mat4.create();
  let hasTransform = false;

  const build = getValue(modelNode, 'build', 'm:build', '3mf:build');
  if (build) {
    const itemValue = getValue(build, 'item', 'm:item', '3mf:item');
    if (itemValue) {
      const items = Array.isArray(itemValue) ? itemValue : [itemValue];
      
      // For multiple build items, we'll combine them into one mesh
      // but for now, just use the first item's transform
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const objectId = getValue(item, '@_objectid', '@_objectId', '@_ObjectId');
        if (!objectId) {
          console.warn("⚠️ Build item missing objectid");
          continue;
        }
        
        const transformStr = getValue(item, '@_transform', '@_Transform');
        const transform = parseTransform(transformStr);
        
        // For first item, use its transform; for others, combine (though this is rare)
        if (idx === 0) {
          combinedTransform = transform;
          hasTransform = !mat4.equals(transform, mat4.create());
        } else {
          // Multiple build items - combine transforms (this is unusual but handle it)
          mat4.multiply(combinedTransform, combinedTransform, transform);
        }
        
        try {
          // Pass identity transform to keep vertices in local space
          processObject(objectId, mat4.create(), resourceLibrary, finalData);
        } catch (e) {
          console.error(`⚠️ Error processing object ${objectId}:`, e);
        }
      }
    }
  } else {
    console.warn("⚠️ No build element found");
  }

  if (finalData.vertices.length === 0) {
    throw new Error("No geometry data found in 3MF file");
  }

  // Finalize triangles and calculate normals
  const finalTriangles: [number, number, number][] = [];
  for (let i = 0; i < finalData.triangles.length; i += 3) {
    finalTriangles.push([
      finalData.triangles[i],
      finalData.triangles[i + 1],
      finalData.triangles[i + 2]
    ]);
  }

  const normals = calculateNormals(finalData.vertices, finalTriangles);

  return {
    ...finalData,
    normals,
    triangles: finalTriangles,
    textures: new Map(),
    transform: hasTransform ? combinedTransform : mat4.create()
  };
}

/**
 * Parse material resources
 */
function parseMaterialResources(
  resources: any,
  library: { materials: Map<string, MaterialProperties> }
) {
  const materialValue = getValue(resources, 'basematerials', 'basematerial', 'material', 'materials');
  if (!materialValue) {
    return;
  }
  
  const groups = Array.isArray(materialValue) ? materialValue : [materialValue];
  
  for (const group of groups) {
    const id = getValue(group, '@_id', '@_Id');
    if (!id) continue;
    
    const material: MaterialProperties = {
      metallic: parseFloat(
        getValue(group, '@_metallic', '@_metalness', '@_metal') || "0"
      ),
      roughness: parseFloat(
        getValue(group, '@_roughness', '@_rough') || "0.5"
      ),
      specular: parseFloat(
        getValue(group, '@_specular', '@_spec') || "0.5"
      ),
      textureId: getValue(group, '@_textureid', '@_textureId', '@_texture')
    };
    
    library.materials.set(id, material);
  }
}

/**
 * Parse texture resources
 */
function parseTextureResources(
  resources: any,
  library: { textures: Map<string, string> }
) {
  const textureValue = getValue(resources, 'texture2d', 'texture', 'textures', 'image');
  if (!textureValue) {
    return;
  }
  
  const textures = Array.isArray(textureValue) ? textureValue : [textureValue];
  
  for (const texture of textures) {
    const id = getValue(texture, '@_id', '@_Id');
    const path = getValue(texture, '@_path', '@_href', '@_Path');
    
    if (id && path) {
      library.textures.set(id, path);
    }
  }
}

/**
 * Parse color resources
 */
function parseColorResources(
  resources: any,
  library: { colors: Map<string, vec3[]> },
  defaultColor: vec3
) {
  const colorGroupValue = getValue(resources, 'colorgroup', 'basematerials', 'basematerial', 'colors');
  
  if (!colorGroupValue) {
    return;
  }
  
  const groups = Array.isArray(colorGroupValue) ? colorGroupValue : [colorGroupValue];
  
  for (const group of groups) {
    const id = getValue(group, '@_id', '@_Id');
    if (!id) continue;
    
    const colorElements = getValue(group, 'color', 'base', 'item', 'c');
    
    if (!colorElements) {
      continue;
    }
    
    const colorArray = Array.isArray(colorElements) ? colorElements : [colorElements];
    const parsedColors: vec3[] = [];
    
    for (let idx = 0; idx < colorArray.length; idx++) {
      const c = colorArray[idx];
      const colorStr = getValue(c, '@_color', '@_displaycolor', '@_displayColor', '@_Color', '@_sRGB', '@_rgb');
      
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

/**
 * Parse objects - FIXED to handle missing mesh nodes
 */
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
  const objectValue = getValue(resources, 'object', 'objects');
  
  if (!objectValue) {
    console.warn("⚠️ No objects found");
    return;
  }
  
  const objects = Array.isArray(objectValue) ? objectValue : [objectValue];

  for (const objectNode of objects) {
    const objectId = getValue(objectNode, '@_id', '@_Id');
    if (!objectId) continue;

    try {
      const meshValue = getValue(objectNode, 'mesh', 'm:mesh', '3mf:mesh');
      const componentsValue = getValue(objectNode, 'components', 'm:components', 'component');
      
      if (meshValue) {
        const meshData = parseMesh(objectNode, library, scale, defaultColor);
        library.objects.set(objectId, { mesh: meshData });
      } else if (componentsValue) {
        const components = parseComponents(componentsValue);
        library.objects.set(objectId, { components });
      } else {
        console.warn(`  ⚠️ Object ${objectId} has no mesh or components`);
      }
    } catch (e) {
      console.error(`⚠️ Error parsing object ${objectId}:`, e);
    }
  }
}

/**
 * Parse mesh - FIXED triangle validation
 */
function parseMesh(
  objectNode: any,
  library: { 
    colors: Map<string, vec3[]>;
    materials: Map<string, MaterialProperties>;
  },
  scale: number,
  defaultColor: vec3
): MeshData {
  const meshNode = getValue(objectNode, 'mesh', 'm:mesh', '3mf:mesh');
  if (!meshNode) {
    throw new Error("No mesh node found");
  }
  
  const vertices: vec3[] = [];
  const triangles: TriangleData[] = [];
  
  const objectPid = getValue(objectNode, '@_pid', '@_Pid');
  const objectPindex = getValue(objectNode, '@_pindex', '@_pIndex', '@_Pindex');

  // Parse vertices
  const verticesNode = getValue(meshNode, 'vertices', 'm:vertices');
  if (verticesNode) {
    const vertexValue = getValue(verticesNode, 'vertex', 'v');
    if (vertexValue) {
      const vertexArray = Array.isArray(vertexValue) ? vertexValue : [vertexValue];
      
      for (const v of vertexArray) {
        const x = parseFloat(getValue(v, '@_x', '@_X') || "0");
        const y = parseFloat(getValue(v, '@_y', '@_Y') || "0");
        const z = parseFloat(getValue(v, '@_z', '@_Z') || "0");
        vertices.push(vec3.fromValues(x * scale, y * scale, z * scale));
      }
    }
  }

  if (vertices.length === 0) {
    throw new Error("No vertices found in mesh");
  }

  const objectColors = new Array(vertices.length);
  const objectUvs = new Array(vertices.length);
  const objectMaterials = new Array(vertices.length);
  
  for (let i = 0; i < vertices.length; i++) {
    objectColors[i] = vec3.clone(defaultColor);
    objectUvs[i] = vec2.create();
    objectMaterials[i] = {
      metallic: 0,
      roughness: 0.5,
      specular: 0.5
    };
  }

  // Parse triangles
  const trianglesNode = getValue(meshNode, 'triangles', 'm:triangles');
  if (trianglesNode) {
    const triangleValue = getValue(trianglesNode, 'triangle', 't');
    if (triangleValue) {
      const triangleArray = Array.isArray(triangleValue) ? triangleValue : [triangleValue];
      
      for (const t of triangleArray) {
        const v1 = parseInt(getValue(t, '@_v1', '@_V1') || "0", 10);
        const v2 = parseInt(getValue(t, '@_v2', '@_V2') || "0", 10);
        const v3 = parseInt(getValue(t, '@_v3', '@_V3') || "0", 10);
        
        // FIXED: Validate indices
        if (v1 >= vertices.length || v2 >= vertices.length || v3 >= vertices.length || 
            v1 < 0 || v2 < 0 || v3 < 0) {
          console.warn(`  ⚠️ Triangle references invalid vertex indices: ${v1}, ${v2}, ${v3} (max: ${vertices.length - 1})`);
          continue;
        }

        const trianglePid = getValue(t, '@_pid', '@_Pid') || objectPid;
        let p1 = getValue(t, '@_p1', '@_P1');
        let p2 = getValue(t, '@_p2', '@_P2');
        let p3 = getValue(t, '@_p3', '@_P3');
        
        p1 = p1 !== null ? parseInt(p1, 10) : (objectPindex !== null ? parseInt(objectPindex, 10) : 0);
        p2 = p2 !== null ? parseInt(p2, 10) : p1;
        p3 = p3 !== null ? parseInt(p3, 10) : p1;

        // Apply colors
        if (trianglePid && library.colors.has(trianglePid)) {
          const colors = library.colors.get(trianglePid)!;
          if (p1 < colors.length) objectColors[v1] = colors[p1];
          if (p2 < colors.length) objectColors[v2] = colors[p2];
          if (p3 < colors.length) objectColors[v3] = colors[p3];
        }
        
        // Apply materials
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
  }

  return {
    vertices,
    triangles,
    colors: objectColors,
    uvs: objectUvs,
    materials: objectMaterials
  };
}

/**
 * Parse components - FIXED to handle both nested and direct component elements
 */
function parseComponents(componentsNode: any): ComponentData[] {
  // componentsNode might be the components wrapper OR an array of component elements
  let componentArray: any[];
  
  if (Array.isArray(componentsNode)) {
    componentArray = componentsNode;
  } else {
    const componentValue = getValue(componentsNode, 'component', 'm:component');
    if (!componentValue) return [];
    componentArray = Array.isArray(componentValue) ? componentValue : [componentValue];
  }
  
  return componentArray.map((c: any) => {
    const objectId = getValue(c, '@_objectid', '@_objectId', '@_ObjectId');
    const transformStr = getValue(c, '@_transform', '@_Transform');
    return {
      objectId,
      transform: parseTransform(transformStr)
    };
  }).filter((c: any) => c.objectId);
}

/**
 * Process objects recursively - OPTIMIZED to avoid stack overflow
 */
function processObject(
  objectId: string,
  cumulativeTransform: mat4,
  library: { objects: Map<string, ObjectData> },
  out: { 
    vertices: vec3[]; 
    colors: vec3[]; 
    uvs: vec2[]; 
    materials: MaterialProperties[];
    triangles: number[] 
  },
  depth: number = 0
) {
  // Use iterative processing with a stack to avoid call stack overflow
  const stack: Array<{ id: string; transform: mat4; depth: number }> = [
    { id: objectId, transform: cumulativeTransform, depth: 0 }
  ];
  
  while (stack.length > 0) {
    const { id, transform, depth } = stack.pop()!;
    
    if (depth > 100) {
      console.error(`⚠️ Component hierarchy too deep (${depth}), skipping object ${id}`);
      continue;
    }

    const objectData = library.objects.get(id);
    if (!objectData) {
      console.warn(`⚠️ Object ${id} not found in library`);
      continue;
    }

    if (objectData.mesh) {
      const mesh = objectData.mesh;
      const vertexOffset = out.vertices.length;
      const isLargeMesh = mesh.vertices.length > 50000;

      // Transform and add vertices
      for (const v of mesh.vertices) {
        const transformedVertex = vec3.create();
        vec3.transformMat4(transformedVertex, v, transform);
        out.vertices.push(transformedVertex);
      }

      // FIXED: Use loops instead of spread operator to avoid stack overflow with large arrays
      // This prevents "Maximum call stack size exceeded" errors when processing very large meshes
      for (let i = 0; i < mesh.colors.length; i++) {
        out.colors.push(mesh.colors[i]);
      }
      for (let i = 0; i < mesh.uvs.length; i++) {
        out.uvs.push(mesh.uvs[i]);
      }
      for (let i = 0; i < mesh.materials.length; i++) {
        out.materials.push(mesh.materials[i]);
      }

      // Add triangles with offset
      for (const tri of mesh.triangles) {
        out.triangles.push(
          tri.indices[0] + vertexOffset,
          tri.indices[1] + vertexOffset,
          tri.indices[2] + vertexOffset
        );
      }
    } else if (objectData.components) {
      // Add component children to stack (reverse order to maintain processing order)
      for (let i = objectData.components.length - 1; i >= 0; i--) {
        const component = objectData.components[i];
        const componentTransform = mat4.create();
        mat4.multiply(componentTransform, transform, component.transform);
        stack.push({
          id: component.objectId,
          transform: componentTransform,
          depth: depth + 1
        });
      }
    }
  }
}

/**
 * Load 3MF with texture extraction
 */
async function load3MF(url: string): Promise<Extracted3MFData> {
  try {
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
    
    const modelData = parse3MFModel(xmlString);
    
    // Extract textures from the zip package
    const textures = new Map<string, TextureData>();
    
    const texturePatterns = [
      /^3D\/Textures\/.+\.(png|jpg|jpeg)$/i,
      /^Textures\/.+\.(png|jpg|jpeg)$/i,
      /^.+\.(png|jpg|jpeg)$/i
    ];
    
    for (const [filename, file] of Object.entries(zip.files)) {
      if (file.dir) continue;
      
      const matches = texturePatterns.some(pattern => pattern.test(filename));
      if (matches) {
        try {
          const blob = await file.async("blob");
          const textureId = filename.split('/').pop() || filename;
          
          let contentType = "image/png";
          if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
            contentType = "image/jpeg";
          }
          
          textures.set(textureId, {
            id: textureId,
            blob,
            contentType
          });
        } catch (err) {
          console.warn(`  ⚠️ Failed to extract texture ${filename}:`, err);
        }
      }
    }
    
    return {
      ...modelData,
      textures
    };
  } catch (error) {
    console.error("❌ Error loading 3MF:", error);
    throw error;
  }
}

/**
 * Parse transform matrix
 */
function parseTransform(transformString: string | null): mat4 {
  const transform = mat4.create();
  if (!transformString) return transform;

  try {
    const parts = transformString.trim().split(/\s+/).map(parseFloat);
    if (parts.length < 12) {
      console.warn("⚠️ Invalid transform:", transformString);
      return transform;
    }

    mat4.set(
      transform,
      parts[0], parts[1], parts[2], 0,
      parts[3], parts[4], parts[5], 0,
      parts[6], parts[7], parts[8], 0,
      parts[9], parts[10], parts[11], 1
    );
  } catch (e) {
    console.warn("⚠️ Error parsing transform:", e);
  }

  return transform;
}