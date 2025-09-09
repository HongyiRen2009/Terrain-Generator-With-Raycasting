import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { vec3 } from "gl-matrix";
import { Mesh, Triangle } from "./map/Mesh";

type RGB = { r: number; g: number; b: number };
type mfTriangle = { v: [number, number, number]; colors?: (RGB | null)[] };

export type ParseResult = {
  vertices: vec3[];             // list of vertices
  vertexColors: (RGB | null)[]; // per vertex color (may be null)
  vertexNormals: vec3[];        // per vertex normal
  triangles: mfTriangle[];        // connectivity + optional per-corner colors
};

export async function threemfToMesh(data: ArrayBuffer): Promise<Mesh>{
    console.log("Hi");
    const mesh = new Mesh();
    //get everything
    const { vertices, vertexColors, vertexNormals, triangles } = await parse3mf(data);
    
    //creteMesh
    for(let i=0;i<triangles.length;i++){
        const TriangleVertices: vec3[] = triangles[i].v.map(vIdx=>vertices[vIdx]);
        const TriangleVerticesNormals: vec3[] = triangles[i].v.map(vIdx=>vertexNormals[vIdx]);
        mesh.addTriangle(TriangleVertices as Triangle, TriangleVerticesNormals as Triangle);
    }

    return mesh;
}

async function parse3mf(
  data: ArrayBuffer
): Promise<ParseResult> {
  const zip = await JSZip.loadAsync(data as any);

  const files = Object.keys(zip.files);
  const modelPath =
    files.find((n) => /3dmodel(\.model|\.xml)?$/i.test(n)) ||
    files.find((n) => /\.model$/i.test(n));

  if (!modelPath) throw new Error("Could not find .model file inside .3mf");

  const xmlText = await zip.file(modelPath)!.async("text");
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const xmlObj = parser.parse(xmlText);

  const modelNodes = findNodesByLocalName(xmlObj, "model");
  if (!modelNodes.length) throw new Error("No <model> found in 3mf");

  const vertices: vec3[] = [];
  const vertexColors: (RGB | null)[] = [];
  const vertexNormals: vec3[] = [];
  const triangles: mfTriangle[] = [];

  for (const modelNode of modelNodes) {
    const resources = findFirstChildByLocalName(modelNode, "resources");
    if (!resources) continue;
    const propertyGroups = buildPropertyGroups(resources);

    const objects = ensureArray(findFirstChildByLocalName(resources, "object"));
    for (const obj of objects) {
      const mesh = findFirstChildByLocalName(obj, "mesh");
      if (!mesh) continue;

      const objectPidAttr = obj["@_pid"] ?? obj["@_pID"];
      const objectPid = objectPidAttr ? parseInt(objectPidAttr, 10) : undefined;

      const vertexBase = vertices.length;
      const vNodes = ensureArray(findFirstChildByLocalName(mesh, "vertices")?.vertex);
      for (const v of vNodes) {
        const x = parseFloat(v["@_x"]);
        const y = parseFloat(v["@_y"]);
        const z = parseFloat(v["@_z"]);
        vertices.push(vec3.fromValues(x, y, z));
        vertexNormals.push(vec3.create());

        let col: RGB | null = null;
        const disp = v["@_displaycolor"] ?? v["@_color"];
        if (typeof disp === "string" && disp.startsWith("#")) col = hexToRgb(disp);
        vertexColors.push(col);
      }

      const tNodes = ensureArray(findFirstChildByLocalName(mesh, "triangles")?.triangle);
      for (const t of tNodes) {
        const gV1 = vertexBase + parseInt(t["@_v1"], 10);
        const gV2 = vertexBase + parseInt(t["@_v2"], 10);
        const gV3 = vertexBase + parseInt(t["@_v3"], 10);

        const tri: mfTriangle = { v: [gV1, gV2, gV3] };

        // handle color via pid + p1/p2/p3
        const pidAttr = t["@_pid"] ?? objectPid;
        if (pidAttr != null) {
          const group = propertyGroups.get(parseInt(pidAttr, 10));
          if (group) {
            const i1 = parseInt(t["@_p1"] ?? "0", 10);
            const i2 = parseInt(t["@_p2"] ?? `${i1}`, 10);
            const i3 = parseInt(t["@_p3"] ?? `${i1}`, 10);
            const c1 = group.colors[i1] ?? null;
            const c2 = group.colors[i2] ?? null;
            const c3 = group.colors[i3] ?? null;
            tri.colors = [c1, c2, c3];
            if (c1) vertexColors[gV1] = c1;
            if (c2) vertexColors[gV2] = c2;
            if (c3) vertexColors[gV3] = c3;
          }
        }
        triangles.push(tri);

        // --- compute face normal & accumulate ---
        const v1 = vertices[gV1];
        const v2 = vertices[gV2];
        const v3 = vertices[gV3];
        const e1 = vec3.sub(vec3.create(), v2, v1);
        const e2 = vec3.sub(vec3.create(), v3, v1);
        const faceNormal = vec3.cross(vec3.create(), e1, e2);
        vec3.normalize(faceNormal, faceNormal);

        vec3.add(vertexNormals[gV1], vertexNormals[gV1], faceNormal);
        vec3.add(vertexNormals[gV2], vertexNormals[gV2], faceNormal);
        vec3.add(vertexNormals[gV3], vertexNormals[gV3], faceNormal);
      }
    }
  }

  // normalize accumulated vertex normals
  for (const n of vertexNormals) {
    if (vec3.len(n) > 1e-6) vec3.normalize(n, n);
  }

  return { vertices, vertexColors, vertexNormals, triangles };
}

/* ------------------- helpers ------------------- */

function ensureArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}
function stripNs(tag: string) {
  return tag.includes(":") ? tag.split(":").pop()! : tag;
}
function findNodesByLocalName(obj: any, localName: string): any[] {
  const out: any[] = [];
  (function walk(o: any) {
    if (!o || typeof o !== "object") return;
    for (const k of Object.keys(o)) {
      if (stripNs(k).toLowerCase() === localName.toLowerCase()) out.push(o[k]);
      walk(o[k]);
    }
  })(obj);
  return out;
}
function findFirstChildByLocalName(node: any, localName: string): any | undefined {
  if (!node || typeof node !== "object") return undefined;
  for (const k of Object.keys(node)) {
    if (stripNs(k).toLowerCase() === localName.toLowerCase()) return node[k];
  }
  return undefined;
}
function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
function buildPropertyGroups(resources: any): Map<number, { colors: (RGB | null)[] }> {
  const map = new Map<number, { colors: (RGB | null)[] }>();
  const bmNodes = ensureArray(findFirstChildByLocalName(resources, "basematerials"));
  for (const bm of bmNodes) {
    const pid = bm["@_id"] ? parseInt(bm["@_id"], 10) : undefined;
    if (pid == null) continue;
    const bases = ensureArray(bm.base);
    const colors = bases.map((baseItem: any) => {
      const dc = baseItem["@_displaycolor"];
      return typeof dc === "string" && dc.startsWith("#") ? hexToRgb(dc) : null;
    });
    map.set(pid, { colors });
  }
  return map;
}