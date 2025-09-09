import JSZip from "jszip";
import { mat4, vec2, vec3 } from 'gl-matrix'; 
import { Mesh, Triangle } from "../map/Mesh";

type RGB = { r: number; g: number; b: number };
type mfTriangle = { v: [number, number, number]; colors?: (RGB | null)[] };

export async function threemfToMesh(url: string): Promise<Mesh>{
    console.log("Hi");
    const mesh = new Mesh();
    const modelData: Extracted3MFData = await load3MF(url);
    //get everything
    /*
    const { vertices, vertexColors, vertexNormals, triangles } = await parse3mf(data);
    */
    console.log(modelData.triangles);
    console.log(modelData.vertices);
    //creteMesh
    for(let i=0;i<modelData.triangles.length;i++){
        const TriangleVertices: vec3[] = modelData.triangles[i].map(vIdx=>modelData.vertices[vIdx]);
        const TriangleVerticesNormals: vec3[] = modelData.triangles[i].map(vIdx=>modelData.normals[vIdx]);
        mesh.addTriangle(TriangleVertices as Triangle, TriangleVerticesNormals as Triangle);
    }

    return mesh;
}

/**
 * UPDATED: The structure of the data extracted from the 3MF file.
 * Now includes texture coordinates (uvs).
 */
export interface Extracted3MFData {
    vertices: vec3[];
    normals: vec3[];
    colors: vec3[];
    uvs: vec2[];
    triangles: [number, number, number][]; // Indices for vertices
}

// Internal interfaces for the new recursive parser
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
interface ObjectData {
    mesh?: MeshData;
    components?: ComponentData[];
}


/**
 * Parses an #RRGGBB or #RRGGBBAA hex color string into a gl-matrix vec3 (0-1 range).
 * Alpha is ignored.
 * @param hex The hex color string (e.g., "#FF0000").
 * @returns A vec3 representing the color.
 */
function parseHexColor(hex: string): vec3 {
    if (hex.startsWith('#')) {
        hex = hex.substring(1);
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255.0;
    const g = parseInt(hex.substring(2, 4), 16) / 255.0;
    const b = parseInt(hex.substring(4, 6), 16) / 255.0;
    return vec3.fromValues(r, g, b);
}

/**
 * Calculates smooth vertex normals by averaging the face normals of adjacent triangles.
 * @param vertices The array of vertex positions.
 * @param triangles The array of triangle indices.
 * @returns An array of calculated vertex normals.
 */
function calculateNormals(vertices: vec3[], triangles: [number, number, number][]): vec3[] {
    const normals: vec3[] = new Array(vertices.length).fill(0).map(() => vec3.create());

    for (const triangle of triangles) {
        const [i1, i2, i3] = triangle;
        const v1 = vertices[i1];
        const v2 = vertices[i2];
        const v3 = vertices[i3];

        const edge1 = vec3.subtract(vec3.create(), v2, v1);
        const edge2 = vec3.subtract(vec3.create(), v3, v1);
        
        const faceNormal = vec3.cross(vec3.create(), edge1, edge2);
        // No need to normalize here, as longer edges (larger triangles) should have more influence.

        // Add the face normal to each vertex normal
        vec3.add(normals[i1], normals[i1], faceNormal);
        vec3.add(normals[i2], normals[i2], faceNormal);
        vec3.add(normals[i3], normals[i3], faceNormal);
    }

    // Normalize all the vertex normals
    for (const normal of normals) {
        vec3.normalize(normal, normal);
    }

    return normals;
}

/**
 * The main parsing orchestrator.
 * It sets up the resource library and then processes the build items.
 */
function parse3MFModel(xmlDoc: XMLDocument): Extracted3MFData {
    // Define the XML Namespaces
    const CORE_NAMESPACE = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02";
    const MATERIAL_NAMESPACE = "http://schemas.microsoft.com/3dmanufacturing/material/2015/02";
    
    // --- Step 1: Set up scale ---
    const modelNode = xmlDoc.getElementsByTagNameNS(CORE_NAMESPACE, 'model')[0];
    const unit = modelNode?.getAttribute('unit') || 'millimeter';
    let scale = 1.0;
    if (unit === 'meter') scale = 1000.0;
    else if (unit === 'inch') scale = 25.4;
    else if (unit === 'centimeter') scale = 10.0;
    
    // --- Step 2: Parse all resources into a library ---
    const resourceLibrary = {
        objects: new Map<string, ObjectData>(),
        colors: new Map<string, vec3[]>(),
        // We'll add textures here later
    };

    const defaultColor = vec3.fromValues(0.8, 0.8, 0.8);
    
    // Parse Color Groups and Base Materials (they function similarly)
    const colorGroups = xmlDoc.getElementsByTagNameNS(MATERIAL_NAMESPACE, 'colorgroup');
    for (const group of Array.from(colorGroups)) {
        const id = group.getAttribute('id');
        if (!id) continue;
        const colors = Array.from(group.getElementsByTagNameNS(MATERIAL_NAMESPACE, 'color')).map(c => parseHexColor(c.getAttribute('color')!));
        resourceLibrary.colors.set(id, colors);
    }
    const baseMaterials = xmlDoc.getElementsByTagNameNS(MATERIAL_NAMESPACE, 'basematerials');
    for (const group of Array.from(baseMaterials)) {
        const id = group.getAttribute('id');
        if (!id) continue;
        const colors = Array.from(group.getElementsByTagNameNS(MATERIAL_NAMESPACE, 'base')).map(b => parseHexColor(b.getAttribute('displaycolor')!));
        resourceLibrary.colors.set(id, colors);
    }

    // Parse all <object> definitions
    const objects = xmlDoc.getElementsByTagNameNS(CORE_NAMESPACE, 'object');
    for (const objectNode of Array.from(objects)) {
        const objectId = objectNode.getAttribute('id');
        if (!objectId) continue;

        // An object can contain EITHER a <mesh> OR <components>
        const meshNode = objectNode.getElementsByTagNameNS(CORE_NAMESPACE, 'mesh')[0];
        const componentsNode = objectNode.getElementsByTagNameNS(CORE_NAMESPACE, 'components')[0];

        if (meshNode) {
            const vertices: vec3[] = [];
            const triangles: [number, number, number][] = [];
            
            const verticesNode = meshNode.getElementsByTagNameNS(CORE_NAMESPACE, 'vertices')[0];
            for (const v of Array.from(verticesNode.getElementsByTagNameNS(CORE_NAMESPACE, 'vertex'))) {
                vertices.push(vec3.fromValues(
                    parseFloat(v.getAttribute('x')!) * scale,
                    parseFloat(v.getAttribute('y')!) * scale,
                    parseFloat(v.getAttribute('z')!) * scale
                ));
            }
            
            const objectColors = new Array(vertices.length).fill(0).map(() => vec3.clone(defaultColor));
            const objectUvs = new Array(vertices.length).fill(0).map(() => vec2.create()); // Default UVs

            const trianglesNode = meshNode.getElementsByTagNameNS(CORE_NAMESPACE, 'triangles')[0];
            for (const t of Array.from(trianglesNode.getElementsByTagNameNS(CORE_NAMESPACE, 'triangle'))) {
                const v1 = parseInt(t.getAttribute('v1')!, 10);
                const v2 = parseInt(t.getAttribute('v2')!, 10);
                const v3 = parseInt(t.getAttribute('v3')!, 10);
                triangles.push([v1, v2, v3]);

                const pid = t.getAttribute('pid') || objectNode.getAttribute('pid');
                if (pid && resourceLibrary.colors.has(pid)) {
                    const colors = resourceLibrary.colors.get(pid)!;
                    const p1_str = t.getAttribute('p1') ?? objectNode.getAttribute('pindex');
                    if (p1_str) {
                        const idx = parseInt(p1_str, 10);
                        if (colors[idx]) {
                           objectColors[v1] = colors[idx];
                           objectColors[v2] = colors[idx]; // v2/v3 default to v1 color if not specified
                           objectColors[v3] = colors[idx];
                        }
                    }
                    const p2_str = t.getAttribute('p2');
                    if (p2_str) objectColors[v2] = colors[parseInt(p2_str, 10)];
                    const p3_str = t.getAttribute('p3');
                    if (p3_str) objectColors[v3] = colors[parseInt(p3_str, 10)];
                }
            }
            resourceLibrary.objects.set(objectId, { mesh: { vertices, triangles, colors: objectColors, uvs: objectUvs } });
        
        } else if (componentsNode) {
            const components: ComponentData[] = [];
            for (const c of Array.from(componentsNode.getElementsByTagNameNS(CORE_NAMESPACE, 'component'))) {
                const id = c.getAttribute('objectid');
                if (!id) continue;
                components.push({
                    objectId: id,
                    transform: parseTransform(c.getAttribute('transform')),
                });
            }
            resourceLibrary.objects.set(objectId, { components });
        }
    }
    
    // --- Step 3: Process the build items recursively to generate the final geometry ---
    const finalData: Omit<Extracted3MFData, 'normals' | 'triangles'> & { triangles: number[] } = {
        vertices: [], colors: [], uvs: [], triangles: []
    };

    const buildItems = xmlDoc.getElementsByTagNameNS(CORE_NAMESPACE, 'item');
    for (const item of Array.from(buildItems)) {
        const objectId = item.getAttribute('objectid');
        if (!objectId) continue;
        const transform = parseTransform(item.getAttribute('transform'));
        processObject(objectId, transform, resourceLibrary, finalData);
    }
    
    // --- Step 4: Finalize data and calculate normals ---
    const finalTriangles: [number, number, number][] = [];
    for (let i = 0; i < finalData.triangles.length; i += 3) {
        finalTriangles.push([finalData.triangles[i], finalData.triangles[i+1], finalData.triangles[i+2]]);
    }
    
    const normals = calculateNormals(finalData.vertices, finalTriangles);
    
    return {
        ...finalData,
        normals,
        triangles: finalTriangles
    };
}


/**
 * The new recursive function that processes an object and its children.
 * @param objectId The ID of the object to process from the library.
 * @param cumulativeTransform The transformation matrix accumulated from parent objects.
 * @param library The parsed resource library.
 * @param out The final, flattened geometry data to be populated.
 */
function processObject(
    objectId: string,
    cumulativeTransform: mat4,
    library: { objects: Map<string, ObjectData> },
    out: { vertices: vec3[]; colors: vec3[]; uvs: vec2[]; triangles: number[] }
) {
    const objectData = library.objects.get(objectId);
    if (!objectData) return;

    // Case 1: The object is a mesh, so we transform and append its geometry.
    if (objectData.mesh) {
        const mesh = objectData.mesh;
        const vertexOffset = out.vertices.length;

        // Apply transform to each vertex and add to the output
        for (const v of mesh.vertices) {
            const transformedVertex = vec3.create();
            vec3.transformMat4(transformedVertex, v, cumulativeTransform);
            out.vertices.push(transformedVertex);
        }

        // Add corresponding colors and UVs
        out.colors.push(...mesh.colors);
        out.uvs.push(...mesh.uvs);

        // Add triangle indices, adjusted by the vertex offset
        for (const tri of mesh.triangles) {
            out.triangles.push(tri[0] + vertexOffset, tri[1] + vertexOffset, tri[2] + vertexOffset);
        }
    }
    // Case 2: The object is an assembly of other components. Recurse!
    else if (objectData.components) {
        for (const component of objectData.components) {
            // Each component has its own local transform. We multiply it with the parent's.
            const componentTransform = mat4.create();
            mat4.multiply(componentTransform, cumulativeTransform, component.transform);
            
            // Recursively process the child component with the new transform.
            processObject(component.objectId, componentTransform, library, out);
        }
    }
}

/**
 * The main loader function. Fetches a .3mf file, unzips it, and extracts geometry.
 * @param url The URL of the .3mf file to load.
 * @returns A promise that resolves with the extracted model data.
 */
async function load3MF(url: string): Promise<Extracted3MFData> {
    try {
        // 1. Fetch the .3mf file as a binary blob
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch 3MF file: ${response.statusText}`);
        }
        const fileData = await response.arrayBuffer();

        // 2. Unzip the file data in memory
        const zip = await JSZip.loadAsync(fileData);
        const modelFile = zip.file('3D/3dmodel.model');

        if (!modelFile) {
            throw new Error('Invalid 3MF file: 3D/3dmodel.model not found.');
        }

        // 3. Read the model's XML content as a string
        const xmlString = await modelFile.async('string');

        // 4. Parse the XML string using the browser's built-in parser
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        
        // 5. Extract data from the parsed XML
        return parse3MFModel(xmlDoc);

    } catch (error) {
        console.error('Error loading or parsing 3MF file:', error);
        throw error;
    }
}

/**
 * Parses a 3MF transform string into a gl-matrix mat4.
 * The 3MF spec provides the matrix in row-major order. The gl-matrix `set`
 * function conveniently also takes arguments in row-major order.
 * @param transformString The space-separated string of 12 matrix values.
 * @returns A mat4 representing the transformation.
 */
function parseTransform(transformString: string | null): mat4 {
    const transform = mat4.create(); // Start with an identity matrix
    if (!transformString) {
        return transform;
    }

    const parts = transformString.split(' ').map(parseFloat);
    if (parts.length < 12) {
        console.warn('Invalid transform string found:', transformString);
        return transform; // Return identity if transform is malformed
    }
    
    // The 3MF string is: Rxx Rxy Rxz Ryx Ryy Ryz Rzx Rzy Rzz Tx Ty Tz
    // These correspond to the first 3 rows of a 4x4 matrix.
    // Let's call them p[0] through p[11].
    
    // The mat4.set function arguments are in row-major order:
    // set(out, m00, m01, m02, m03,  // Row 0
    //          m10, m11, m12, m13,  // Row 1
    //          m20, m21, m22, m23,  // Row 2
    //          m30, m31, m32, m33); // Row 3
    
    mat4.set(
        transform,
        parts[0], parts[1], parts[2], parts[9],  // Row 0: Rxx, Rxy, Rxz, Tx
        parts[3], parts[4], parts[5], parts[10], // Row 1: Ryx, Ryy, Ryz, Ty
        parts[6], parts[7], parts[8], parts[11], // Row 2: Rzx, Rzy, Rzz, Tz
        0,        0,        0,        1         // Row 3
    );

    return transform;
}