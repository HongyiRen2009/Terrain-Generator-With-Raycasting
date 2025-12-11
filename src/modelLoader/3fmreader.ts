import JSZip from "jszip";
import { mat4, vec2, vec3 } from "gl-matrix";
import { Mesh, Triangle } from "../map/Mesh";
import { Color, Terrains } from "../map/terrains";
import { XMLParser } from "fast-xml-parser";

export async function threemfToMesh(
  url: string,
  importMap: { [id: string]: number } | null = null
): Promise<Mesh> {
  const mesh = new Mesh();
  const modelData: Extracted3MFData = await load3MF(url);
  
  // Create mesh from extracted data
  for (let i = 0; i < modelData.triangles.length; i++) {
    const TriangleVertices: vec3[] = modelData.triangles[i].map(
      (vIdx) => modelData.vertices[vIdx]
    );
    const TriangleVerticesNormals: vec3[] = modelData.triangles[i].map(
      (vIdx) => modelData.normals[vIdx]
    );
    
    let types: number[] = [0, 0, 0];
    
    // Process colors and assign terrain types
    for (let j = 0; j < 3; j++) {
      const col = Color.fromVec3(modelData.colors[modelData.triangles[i][j]]);
      const colStr = col.toString();
      
      // Check if color is in import map
      if (importMap && colStr in importMap) {
        types[j] = importMap[colStr] as number;
      } else {
        // Check if a simple terrain with this color exists
        let found = false;
        for (let key in Terrains) {
          const terrain = Terrains[parseInt(key)];
          if (terrain.type == 1 && col.equals(terrain.color)) {
            types[j] = parseInt(key);
            found = true;
            break;
          }
        }
        
        // Create new terrain type if not found
        if (!found) {
          Terrains[Object.keys(Terrains).length] = {
            color: col,
            reflectiveness: 0.2,
            roughness: 0.8,
            type: 1
          };
          types[j] = Object.keys(Terrains).length - 1;
        }
      }
    }

    mesh.addTriangle(
      TriangleVertices as Triangle,
      TriangleVerticesNormals as Triangle,
      types as [number, number, number]
    );
  }

  return mesh;
}

export interface Extracted3MFData {
  vertices: vec3[];
  normals: vec3[];
  colors: vec3[];
  uvs: vec2[];
  triangles: [number, number, number][];
}

interface ObjectData {
  mesh?: MeshData;
  components?: ComponentData[];
}

interface MeshData {
  vertices: vec3[];
  triangles: [number, number, number][];
  colors: vec3[];
  uvs: vec2[];
}

interface ComponentData {
  objectId: string;
  transform: mat4;
}

/**
 * Calculates smooth vertex normals by averaging the face normals of adjacent triangles.
 */
function calculateNormals(
  vertices: vec3[],
  triangles: [number, number, number][]
): vec3[] {
  const normals: vec3[] = new Array(vertices.length)
    .fill(0)
    .map(() => vec3.create());

  for (const triangle of triangles) {
    const [i1, i2, i3] = triangle;
    const v1 = vertices[i1];
    const v2 = vertices[i2];
    const v3 = vertices[i3];

    const edge1 = vec3.subtract(vec3.create(), v2, v1);
    const edge2 = vec3.subtract(vec3.create(), v3, v1);
    const faceNormal = vec3.cross(vec3.create(), edge1, edge2);

    vec3.add(normals[i1], normals[i1], faceNormal);
    vec3.add(normals[i2], normals[i2], faceNormal);
    vec3.add(normals[i3], normals[i3], faceNormal);
  }

  for (const normal of normals) {
    vec3.normalize(normal, normal);
  }

  return normals;
}

/**
 * Improved 3MF parser using fast-xml-parser for better compatibility
 */
function parse3MFModel(xmlString: string): Extracted3MFData {
  const defaultColor = vec3.fromValues(0.8, 0.8, 0.8);
  
  // Configure XML parser with options for better compatibility
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    parseAttributeValue: false,
    trimValues: true,
    processEntities: true
  });

  const result = parser.parse(xmlString);
  
  // Navigate to model node - handle different structures
  let modelNode = result.model || result["model"];
  if (!modelNode) {
    throw new Error("Invalid 3MF: No model node found");
  }

  // Parse unit and scale
  const unit = modelNode["@_unit"] || "millimeter";
  let scale = 1.0;
  if (unit === "meter") scale = 1000.0;
  else if (unit === "inch") scale = 25.4;
  else if (unit === "centimeter") scale = 10.0;
  else if (unit === "micrometer") scale = 0.001;
  else if (unit === "foot") scale = 304.8;

  // Resource library
  const resourceLibrary = {
    objects: new Map<string, ObjectData>(),
    colors: new Map<string, vec3[]>()
  };

  // Parse resources
  const resources = modelNode.resources;
  if (resources) {
    // Parse color groups
    parseColorResources(resources, resourceLibrary, defaultColor);
    
    // Parse objects
    parseObjects(resources, resourceLibrary, scale, defaultColor);
  }

  // Process build items
  const finalData: Omit<Extracted3MFData, "normals" | "triangles"> & {
    triangles: number[];
  } = {
    vertices: [],
    colors: [],
    uvs: [],
    triangles: []
  };

  const build = modelNode.build;
  if (build && build.item) {
    const items = Array.isArray(build.item) ? build.item : [build.item];
    for (const item of items) {
      const objectId = item["@_objectid"];
      if (!objectId) continue;
      
      const transform = parseTransform(item["@_transform"]);
      processObject(objectId, transform, resourceLibrary, finalData);
    }
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
    triangles: finalTriangles
  };
}

/**
 * Parse color resources (colorgroup and basematerials)
 */
function parseColorResources(
  resources: any,
  library: { colors: Map<string, vec3[]> },
  defaultColor: vec3
) {
  // Parse colorgroup elements
  if (resources.colorgroup) {
    const colorGroups = Array.isArray(resources.colorgroup) 
      ? resources.colorgroup 
      : [resources.colorgroup];
    
    for (const group of colorGroups) {
      const id = group["@_id"];
      if (!id) continue;
      
      const colors = group.color;
      if (!colors) continue;
      
      const colorArray = Array.isArray(colors) ? colors : [colors];
      const parsedColors = colorArray.map(c => {
        const colorStr = c["@_color"];
        if (colorStr) {
          try {
            return Color.fromHex(colorStr).createVec3();
          } catch (e) {
            console.warn("Failed to parse color:", colorStr);
            return vec3.clone(defaultColor);
          }
        }
        return vec3.clone(defaultColor);
      });
      
      library.colors.set(id, parsedColors);
    }
  }

  // Parse basematerials elements
  if (resources.basematerials) {
    const baseMaterialGroups = Array.isArray(resources.basematerials)
      ? resources.basematerials
      : [resources.basematerials];
    
    for (const group of baseMaterialGroups) {
      const id = group["@_id"];
      if (!id) continue;
      
      const bases = group.base;
      if (!bases) continue;
      
      const baseArray = Array.isArray(bases) ? bases : [bases];
      const parsedColors = baseArray.map(b => {
        const colorStr = b["@_displaycolor"];
        if (colorStr) {
          try {
            return Color.fromHex(colorStr).createVec3();
          } catch (e) {
            console.warn("Failed to parse displaycolor:", colorStr);
            return vec3.clone(defaultColor);
          }
        }
        return vec3.clone(defaultColor);
      });
      
      library.colors.set(id, parsedColors);
    }
  }
}

/**
 * Parse object elements from resources
 */
function parseObjects(
  resources: any,
  library: { objects: Map<string, ObjectData>; colors: Map<string, vec3[]> },
  scale: number,
  defaultColor: vec3
) {
  if (!resources.object) return;
  
  const objects = Array.isArray(resources.object) 
    ? resources.object 
    : [resources.object];

  for (const objectNode of objects) {
    const objectId = objectNode["@_id"];
    if (!objectId) continue;

    // Check if object has mesh
    if (objectNode.mesh) {
      const meshData = parseMesh(objectNode, library, scale, defaultColor);
      library.objects.set(objectId, { mesh: meshData });
    }
    // Check if object has components
    else if (objectNode.components) {
      const components = parseComponents(objectNode.components);
      library.objects.set(objectId, { components });
    }
  }
}

/**
 * Parse mesh data from an object node
 */
function parseMesh(
  objectNode: any,
  library: { colors: Map<string, vec3[]> },
  scale: number,
  defaultColor: vec3
): MeshData {
  const meshNode = objectNode.mesh;
  const vertices: vec3[] = [];
  const triangles: [number, number, number][] = [];
  
  // Parse vertices
  if (meshNode.vertices && meshNode.vertices.vertex) {
    const vertexArray = Array.isArray(meshNode.vertices.vertex)
      ? meshNode.vertices.vertex
      : [meshNode.vertices.vertex];
    
    for (const v of vertexArray) {
      vertices.push(
        vec3.fromValues(
          parseFloat(v["@_x"] || "0") * scale,
          parseFloat(v["@_y"] || "0") * scale,
          parseFloat(v["@_z"] || "0") * scale
        )
      );
    }
  }

  const objectColors = new Array(vertices.length)
    .fill(0)
    .map(() => vec3.clone(defaultColor));
  const objectUvs = new Array(vertices.length)
    .fill(0)
    .map(() => vec2.create());

  // Parse triangles
  if (meshNode.triangles && meshNode.triangles.triangle) {
    const triangleArray = Array.isArray(meshNode.triangles.triangle)
      ? meshNode.triangles.triangle
      : [meshNode.triangles.triangle];
    
    for (const t of triangleArray) {
      const v1 = parseInt(t["@_v1"] || "0", 10);
      const v2 = parseInt(t["@_v2"] || "0", 10);
      const v3 = parseInt(t["@_v3"] || "0", 10);
      
      if (v1 < vertices.length && v2 < vertices.length && v3 < vertices.length) {
        triangles.push([v1, v2, v3]);

        // Parse colors - check multiple possible attribute names
        const pid = t["@_pid"] || objectNode["@_pid"];
        if (pid && library.colors.has(pid)) {
          const colors = library.colors.get(pid)!;
          
          // Parse color indices
          const p1_str = t["@_p1"] || objectNode["@_pindex"];
          if (p1_str) {
            const idx = parseInt(p1_str, 10);
            if (colors[idx]) {
              objectColors[v1] = colors[idx];
              objectColors[v2] = colors[idx];
              objectColors[v3] = colors[idx];
            }
          }
          
          const p2_str = t["@_p2"];
          if (p2_str && colors[parseInt(p2_str, 10)]) {
            objectColors[v2] = colors[parseInt(p2_str, 10)];
          }
          
          const p3_str = t["@_p3"];
          if (p3_str && colors[parseInt(p3_str, 10)]) {
            objectColors[v3] = colors[parseInt(p3_str, 10)];
          }
        }
      }
    }
  }

  return {
    vertices,
    triangles,
    colors: objectColors,
    uvs: objectUvs
  };
}

/**
 * Parse component elements
 */
function parseComponents(componentsNode: any): ComponentData[] {
  if (!componentsNode.component) return [];
  
  const componentArray = Array.isArray(componentsNode.component)
    ? componentsNode.component
    : [componentsNode.component];
  
  return componentArray.map((c: any) => ({
    objectId: c["@_objectid"],
    transform: parseTransform(c["@_transform"])
  })).filter((c: any) => c.objectId);
}

/**
 * Recursively process objects and build final geometry
 */
function processObject(
  objectId: string,
  cumulativeTransform: mat4,
  library: { objects: Map<string, ObjectData> },
  out: { vertices: vec3[]; colors: vec3[]; uvs: vec2[]; triangles: number[] }
) {
  const objectData = library.objects.get(objectId);
  if (!objectData) {
    console.warn(`Object ${objectId} not found in library`);
    return;
  }

  if (objectData.mesh) {
    const mesh = objectData.mesh;
    const vertexOffset = out.vertices.length;

    for (const v of mesh.vertices) {
      const transformedVertex = vec3.create();
      vec3.transformMat4(transformedVertex, v, cumulativeTransform);
      out.vertices.push(transformedVertex);
    }

    out.colors.push(...mesh.colors);
    out.uvs.push(...mesh.uvs);

    for (const tri of mesh.triangles) {
      out.triangles.push(
        tri[0] + vertexOffset,
        tri[1] + vertexOffset,
        tri[2] + vertexOffset
      );
    }
  } else if (objectData.components) {
    for (const component of objectData.components) {
      const componentTransform = mat4.create();
      mat4.multiply(componentTransform, cumulativeTransform, component.transform);
      processObject(component.objectId, componentTransform, library, out);
    }
  }
}

/**
 * Load 3MF file from URL
 */
async function load3MF(url: string): Promise<Extracted3MFData> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch 3MF file: ${response.statusText}`);
    }
    const fileData = await response.arrayBuffer();

    const zip = await JSZip.loadAsync(fileData);
    const modelFile = zip.file("3D/3dmodel.model");

    if (!modelFile) {
      throw new Error("Invalid 3MF file: 3D/3dmodel.model not found.");
    }

    const xmlString = await modelFile.async("string");
    return parse3MFModel(xmlString);
  } catch (error) {
    console.error("Error loading or parsing 3MF file:", error);
    throw error;
  }
}

/**
 * Parse 3MF transform string into mat4
 */
function parseTransform(transformString: string | null): mat4 {
  const transform = mat4.create();
  if (!transformString) {
    return transform;
  }

  const parts = transformString.trim().split(/\s+/).map(parseFloat);
  if (parts.length < 12) {
    console.warn("Invalid transform string found:", transformString);
    return transform;
  }

  mat4.set(
    transform,
    parts[0], parts[1], parts[2], parts[9],
    parts[3], parts[4], parts[5], parts[10],
    parts[6], parts[7], parts[8], parts[11],
    0, 0, 0, 1
  );

  return transform;
}