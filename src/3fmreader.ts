import JSZip from "jszip";
import { mat4, vec3 } from 'gl-matrix'; 
import { Mesh, Triangle } from "./map/Mesh";

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
 * Defines the structure of the data extracted from the 3MF file.
 */
export interface Extracted3MFData {
    vertices: vec3[];
    normals: vec3[];
    colors: vec3[];
    triangles: [number, number, number][]; // Indices for vertices
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

// Replace your parse3MFModel function with this one.
// The other helper functions (load3MF, calculateNormals, etc.) can remain the same.

interface ObjectData {
    vertices: vec3[];
    triangles: [number, number, number][];
    colors: vec3[]; // Per-vertex colors
}

function parse3MFModel(xmlDoc: XMLDocument): Extracted3MFData {
    // --- Define the XML Namespaces from your file ---
    const CORE_NAMESPACE = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02";
    const MATERIAL_NAMESPACE = "http://schemas.microsoft.com/3dmanufacturing/material/2015/02";

    // --- Final flattened data to be returned ---
    const finalVertices: vec3[] = [];
    const finalNormals: vec3[] = [];
    const finalColors: vec3[] = [];
    const finalTriangles: [number, number, number][] = [];
    
    // --- Step 1: Check for units and set a scale factor ---
    const modelNode = xmlDoc.getElementsByTagNameNS(CORE_NAMESPACE, 'model')[0];
    const unit = modelNode?.getAttribute('unit') || 'millimeter';
    let scale = 1.0;
    if (unit === 'meter') {
        scale = 1000.0; // Convert meters to millimeters
    } else if (unit === 'inch') {
        scale = 25.4;
    } else if (unit === 'centimeter') {
        scale = 10.0;
    }
    // Add other units as needed

    // --- Step 2: Parse Resources into a Library ---
    const objectLibrary = new Map<string, ObjectData>();
    const defaultColor = vec3.fromValues(0.8, 0.8, 0.8);

    // CORRECTED: Use getElementsByTagNameNS for colors
    const colorMap = new Map<string, vec3[]>();
    const colorGroups = xmlDoc.getElementsByTagNameNS(MATERIAL_NAMESPACE, 'colorgroup');
    for (const group of Array.from(colorGroups)) {
        const groupId = group.getAttribute('id');
        if (!groupId) continue;
        const colorsInGroup: vec3[] = [];
        const colorElements = group.getElementsByTagNameNS(MATERIAL_NAMESPACE, 'color');
        for (const colorEl of Array.from(colorElements)) {
            colorsInGroup.push(parseHexColor(colorEl.getAttribute('color')!));
        }
        colorMap.set(groupId, colorsInGroup);
    }

    // CORRECTED: Use getElementsByTagNameNS for objects
    const objects = xmlDoc.getElementsByTagNameNS(CORE_NAMESPACE, 'object');
    for (const objectNode of Array.from(objects)) {
        const objectId = objectNode.getAttribute('id');
        if (!objectId) continue;

        const meshNode = objectNode.getElementsByTagNameNS(CORE_NAMESPACE, 'mesh')[0];
        if (!meshNode) continue;
        
        const objectVertices: vec3[] = [];
        const objectTriangles: [number, number, number][] = [];
        
        // Parse Vertices, applying the scale factor
        const verticesNode = meshNode.getElementsByTagNameNS(CORE_NAMESPACE, 'vertices')[0];
        for (const v of Array.from(verticesNode.getElementsByTagNameNS(CORE_NAMESPACE, 'vertex'))) {
            const x = parseFloat(v.getAttribute('x')!) * scale; // Apply scale
            const y = parseFloat(v.getAttribute('y')!) * scale; // Apply scale
            const z = parseFloat(v.getAttribute('z')!) * scale; // Apply scale
            objectVertices.push(vec3.fromValues(x, y, z));
        }
        
        const objectColors = new Array(objectVertices.length).fill(0).map(() => vec3.clone(defaultColor));

        // Parse Triangles and Colors
        const trianglesNode = meshNode.getElementsByTagNameNS(CORE_NAMESPACE, 'triangles')[0];
        for (const t of Array.from(trianglesNode.getElementsByTagNameNS(CORE_NAMESPACE, 'triangle'))) {
            const v1 = parseInt(t.getAttribute('v1')!, 10);
            const v2 = parseInt(t.getAttribute('v2')!, 10);
            const v3 = parseInt(t.getAttribute('v3')!, 10);
            objectTriangles.push([v1, v2, v3]);

            const propertyId = t.getAttribute('pid'); // pid is in the object tag in your example
            const objectPid = objectNode.getAttribute('pid');

            const colorGroupId = propertyId || objectPid;

            if (colorGroupId && colorMap.has(colorGroupId)) {
                const colors = colorMap.get(colorGroupId)!;
                const p1_str = t.getAttribute('p1');
                const pindex = objectNode.getAttribute('pindex'); // Get pindex from object
                const colorIndexStr = p1_str ?? pindex; // A triangle's p1 overrides the object's pindex
                
                if (colorIndexStr) {
                    const colorIndex = parseInt(colorIndexStr, 10);
                    if (colors[colorIndex]) {
                         objectColors[v1] = colors[colorIndex];
                         objectColors[v2] = colors[colorIndex];
                         objectColors[v3] = colors[colorIndex];
                    }
                }
            }
        }
        
        objectLibrary.set(objectId, { vertices: objectVertices, triangles: objectTriangles, colors: objectColors });
    }

    // --- Step 3: Process the <build> section to assemble the final model ---
    const buildItems = xmlDoc.getElementsByTagNameNS(CORE_NAMESPACE, 'item');
    for (const item of Array.from(buildItems)) {
        const objectId = item.getAttribute('objectid');
        if (!objectId || !objectLibrary.has(objectId)) continue;

        const objectData = objectLibrary.get(objectId)!;
        const transform = parseTransform(item.getAttribute('transform'));
        
        const vertexOffset = finalVertices.length;

        for (const v of objectData.vertices) {
            const transformedVertex = vec3.create();
            vec3.transformMat4(transformedVertex, v, transform);
            finalVertices.push(transformedVertex);
        }
        
        finalColors.push(...objectData.colors);

        for (const tri of objectData.triangles) {
            finalTriangles.push([ tri[0] + vertexOffset, tri[1] + vertexOffset, tri[2] + vertexOffset ]);
        }
    }

    // --- Step 4: Calculate normals for the final, assembled model ---
    const normals = calculateNormals(finalVertices, finalTriangles);

    return {
        vertices: finalVertices,
        normals: normals,
        colors: finalColors,
        triangles: finalTriangles,
    };
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