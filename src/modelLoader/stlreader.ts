import { vec3 } from "gl-matrix";
import { Mesh, Triangle } from "../map/Mesh";
import type { STLWorkerResponse } from "./StlWorker";

const DEFAULT_TERRAIN_TYPE: [number, number, number] = [0, 0, 0];

/** Chunk size for mesh building to keep UI responsive (yield every N triangles) */
const MESH_BUILD_CHUNK = 25000;

export interface STLLoadOptions {
  /** 0–1: after loading, reduce mesh with Mesh.decimate(quality). Default 1 = no decimation. */
  quality?: number;
}

/** STL normals are often inward or degenerate; fix and flip so the mesh lights correctly. */
function fixSTLNormal(
  nx: number,
  ny: number,
  nz: number,
  v1x: number,
  v1y: number,
  v1z: number,
  v2x: number,
  v2y: number,
  v2z: number,
  v3x: number,
  v3y: number,
  v3z: number
): vec3 {
  let l = nx * nx + ny * ny + nz * nz;
  if (l < 1e-10) {
    const e1x = v2x - v1x;
    const e1y = v2y - v1y;
    const e1z = v2z - v1z;
    const e2x = v3x - v1x;
    const e2y = v3y - v1y;
    const e2z = v3z - v1z;
    nx = e1y * e2z - e1z * e2y;
    ny = e1z * e2x - e1x * e2z;
    nz = e1x * e2y - e1y * e2x;
    l = nx * nx + ny * ny + nz * nz;
    if (l < 1e-20) return vec3.fromValues(0, 1, 0);
  }
  l = 1 / Math.sqrt(l);
  return vec3.fromValues(-nx * l, -ny * l, -nz * l);
}

/**
 * Detect if STL data is binary.
 * Binary STL: 80-byte header, 4-byte little-endian triangle count, then 50 bytes per triangle.
 */
function isBinarySTL(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 84) return false;
  const view = new DataView(buffer);
  const numTriangles = view.getUint32(80, true);
  const expectedSize = 84 + numTriangles * 50;
  return buffer.byteLength === expectedSize;
}

/**
 * Parse binary STL into typed arrays. Loads the full mesh.
 * Quality is NOT applied here — use Mesh.decimate(quality) after load for proper reduction.
 */
function parseBinarySTLToArrays(
  buffer: ArrayBuffer,
  _options?: STLLoadOptions
): { positions: Float32Array; normals: Float32Array; numTriangles: number } {
  const view = new DataView(buffer);
  const numTriangles = view.getUint32(80, true);

  const positions = new Float32Array(numTriangles * 9);
  const normals = new Float32Array(numTriangles * 3);
  let offset = 84;

  for (let i = 0; i < numTriangles; i++) {
    normals[i * 3] = view.getFloat32(offset, true);
    normals[i * 3 + 1] = view.getFloat32(offset + 4, true);
    normals[i * 3 + 2] = view.getFloat32(offset + 8, true);
    offset += 12;
    positions[i * 9] = view.getFloat32(offset, true);
    positions[i * 9 + 1] = view.getFloat32(offset + 4, true);
    positions[i * 9 + 2] = view.getFloat32(offset + 8, true);
    offset += 12;
    positions[i * 9 + 3] = view.getFloat32(offset, true);
    positions[i * 9 + 4] = view.getFloat32(offset + 4, true);
    positions[i * 9 + 5] = view.getFloat32(offset + 8, true);
    offset += 12;
    positions[i * 9 + 6] = view.getFloat32(offset, true);
    positions[i * 9 + 7] = view.getFloat32(offset + 4, true);
    positions[i * 9 + 8] = view.getFloat32(offset + 8, true);
    offset += 14; // 12 + 2 attribute
  }

  return { positions, normals, numTriangles };
}

/**
 * Build Mesh from pre-parsed Float32Arrays in chunks so the main thread can stay responsive.
 * Reuses one normal vec3 per triangle (same reference 3x) to minimize allocations.
 */
function buildMeshFromArraysChunked(
  positions: Float32Array,
  normals: Float32Array,
  numTriangles: number
): Promise<Mesh> {
  const mesh = new Mesh();
  const triArray: Triangle[] = [];
  const normArray: Triangle[] = [];
  const typeArray: [number, number, number][] = [];
  const sharedType = DEFAULT_TERRAIN_TYPE;

  return new Promise((resolve) => {
    let start = 0;

    function doChunk() {
      const end = Math.min(start + MESH_BUILD_CHUNK, numTriangles);
      for (let i = start; i < end; i++) {
        const o = i * 9;
        triArray.push([
          vec3.fromValues(positions[o], positions[o + 1], positions[o + 2]),
          vec3.fromValues(positions[o + 3], positions[o + 4], positions[o + 5]),
          vec3.fromValues(positions[o + 6], positions[o + 7], positions[o + 8])
        ]);
        const n = fixSTLNormal(
          normals[i * 3],
          normals[i * 3 + 1],
          normals[i * 3 + 2],
          positions[o],
          positions[o + 1],
          positions[o + 2],
          positions[o + 3],
          positions[o + 4],
          positions[o + 5],
          positions[o + 6],
          positions[o + 7],
          positions[o + 8]
        );
        normArray.push([n, n, n]);
        typeArray.push(sharedType);
      }
      start = end;
      if (start >= numTriangles) {
        mesh.setVertices(triArray);
        mesh.setNormals(normArray);
        mesh.setMaterialIDs(typeArray);
        resolve(mesh);
        return;
      }
      requestAnimationFrame(doChunk);
    }

    requestAnimationFrame(doChunk);
  });
}

/**
 * Build Mesh from pre-parsed Float32Arrays in one shot (for smaller meshes).
 */
function buildMeshFromArraysSync(
  positions: Float32Array,
  normals: Float32Array,
  numTriangles: number
): Mesh {
  const mesh = new Mesh();
  const triArray: Triangle[] = [];
  const normArray: Triangle[] = [];
  const typeArray: [number, number, number][] = [];
  const sharedType = DEFAULT_TERRAIN_TYPE;

  for (let i = 0; i < numTriangles; i++) {
    const o = i * 9;
    triArray.push([
      vec3.fromValues(positions[o], positions[o + 1], positions[o + 2]),
      vec3.fromValues(positions[o + 3], positions[o + 4], positions[o + 5]),
      vec3.fromValues(positions[o + 6], positions[o + 7], positions[o + 8])
    ]);
    const n = fixSTLNormal(
      normals[i * 3],
      normals[i * 3 + 1],
      normals[i * 3 + 2],
      positions[o],
      positions[o + 1],
      positions[o + 2],
      positions[o + 3],
      positions[o + 4],
      positions[o + 5],
      positions[o + 6],
      positions[o + 7],
      positions[o + 8]
    );
    normArray.push([n, n, n]);
    typeArray.push(sharedType);
  }
  mesh.setVertices(triArray);
  mesh.setNormals(normArray);
  mesh.setMaterialIDs(typeArray);
  return mesh;
}

/**
 * Parse binary STL asynchronously; uses chunked mesh building so UI stays responsive.
 */
export function parseBinarySTLAsync(buffer: ArrayBuffer, options?: STLLoadOptions): Promise<Mesh> {
  const { positions, normals, numTriangles } = parseBinarySTLToArrays(buffer, options);
  return buildMeshFromArraysChunked(positions, normals, numTriangles);
}

/** Apply quality via decimation after load (preserves coherent mesh instead of scattered sampling). */
function applyQuality(mesh: Mesh, options?: STLLoadOptions): Mesh {
  const q = options?.quality;
  if (q == null || q >= 1) return mesh;
  const quality = Math.min(1, Math.max(0.05, q));
  return mesh.decimate(quality);
}

/** ASCII STL: single-pass parse (no full line split) into arrays, then build mesh (chunked if large). */
function parseASCIISTL(text: string, options?: STLLoadOptions): Mesh | Promise<Mesh> {
  const positions: number[] = [];
  const normalsList: number[] = [];
  const len = text.length;
  let i = 0;

  while (i < len) {
    const facetStart = text.indexOf("facet normal", i);
    if (facetStart === -1) break;
    i = facetStart + 12;
    const rest = text.slice(i);
    const numMatch = rest.match(/^\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/);
    if (!numMatch) continue;
    normalsList.push(parseFloat(numMatch[1]), parseFloat(numMatch[2]), parseFloat(numMatch[3]));
    const loopStart = text.indexOf("outer loop", i);
    if (loopStart === -1) break;
    i = loopStart + 10;
    const v1Start = text.indexOf("vertex", i);
    const v2Start = text.indexOf("vertex", v1Start + 1);
    const v3Start = text.indexOf("vertex", v2Start + 1);
    if (v1Start === -1 || v2Start === -1 || v3Start === -1) break;
    const end1 = text.indexOf("\n", v1Start);
    const end2 = text.indexOf("\n", v2Start);
    const end3 = text.indexOf("\n", v3Start);
    const v1Str = (end1 === -1 ? text.slice(v1Start + 6) : text.slice(v1Start + 6, end1)).trim();
    const v2Str = (end2 === -1 ? text.slice(v2Start + 6) : text.slice(v2Start + 6, end2)).trim();
    const v3Str = (end3 === -1 ? text.slice(v3Start + 6) : text.slice(v3Start + 6, end3)).trim();
    const p1 = v1Str.split(/\s+/).map(Number);
    const p2 = v2Str.split(/\s+/).map(Number);
    const p3 = v3Str.split(/\s+/).map(Number);
    if (p1.length >= 3 && p2.length >= 3 && p3.length >= 3) {
      positions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2], p3[0], p3[1], p3[2]);
    }
    i = text.indexOf("endfacet", v3Start);
    if (i === -1) break;
    i += 8;
  }

  const numTriangles = normalsList.length / 3;
  const posArray = new Float32Array(positions);
  const normArray = new Float32Array(normalsList);

  let meshOrPromise: Mesh | Promise<Mesh>;
  if (numTriangles <= MESH_BUILD_CHUNK) {
    meshOrPromise = buildMeshFromArraysSync(posArray, normArray, numTriangles);
  } else {
    meshOrPromise = buildMeshFromArraysChunked(posArray, normArray, numTriangles);
  }
  if (meshOrPromise instanceof Promise) {
    return meshOrPromise.then((mesh) => applyQuality(mesh, options));
  }
  return applyQuality(meshOrPromise, options);
}

/**
 * Load STL from ArrayBuffer (auto-detect binary vs ASCII).
 * Returns a Promise for large files so the UI can stay responsive.
 * options.quality < 1 applies decimation after load.
 */
export function stlBufferToMesh(buffer: ArrayBuffer, options?: STLLoadOptions): Mesh | Promise<Mesh> {
  if (isBinarySTL(buffer)) {
    const { positions, normals, numTriangles } = parseBinarySTLToArrays(buffer, options);
    if (numTriangles <= MESH_BUILD_CHUNK) {
      return applyQuality(buildMeshFromArraysSync(positions, normals, numTriangles), options);
    }
    return buildMeshFromArraysChunked(positions, normals, numTriangles).then((mesh) =>
      applyQuality(mesh, options)
    );
  }
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const text = decoder.decode(buffer);
  return parseASCIISTL(text, options);
}

/**
 * Load STL from ASCII string.
 */
export function stlSourceToMesh(asciiSource: string, options?: STLLoadOptions): Mesh | Promise<Mesh> {
  return parseASCIISTL(asciiSource, options);
}

/**
 * Load STL from a File. Uses arrayBuffer() and auto-detects format.
 * Returns Promise so large files can be loaded without freezing the page.
 * Pass options.quality to decimate after load (e.g. 0.5 for 50%).
 */
let stlWorker: Worker | null = null;
let stlWorkerRequestId = 0;
const stlWorkerPending = new Map<
  string,
  { resolve: (value: STLWorkerResponse) => void; reject: (reason?: any) => void }
>();

function getStlWorker(): Worker {
  if (!stlWorker) {
    stlWorker = new Worker(new URL("./StlWorker.ts", import.meta.url));
    stlWorker.onmessage = (event: MessageEvent<STLWorkerResponse>) => {
      const { id } = event.data;
      const pending = stlWorkerPending.get(id);
      if (!pending) return;
      stlWorkerPending.delete(id);
      pending.resolve(event.data);
    };
    stlWorker.onerror = (err) => {
      // Fail all pending requests on worker error
      stlWorkerPending.forEach(({ reject }) => reject(err));
      stlWorkerPending.clear();
    };
  }
  return stlWorker;
}

async function stlBufferToMeshViaWorker(
  buffer: ArrayBuffer,
  options?: STLLoadOptions
): Promise<Mesh> {
  // Fallback if workers are not available (e.g., non-browser env)
  if (typeof Worker === "undefined") {
    const direct = stlBufferToMesh(buffer, options);
    if (direct instanceof Promise) return direct;
    return direct;
  }

  const worker = getStlWorker();
  const id = String(++stlWorkerRequestId);

  const response = await new Promise<STLWorkerResponse>((resolve, reject) => {
    stlWorkerPending.set(id, { resolve, reject });
    // Transfer the buffer to avoid copying
    worker.postMessage({ id, buffer, options }, [buffer]);
  });

  if (response.error) {
    throw new Error(response.error);
  }
  if (
    !response.positions ||
    !response.normals ||
    response.numTriangles == null
  ) {
    throw new Error("STL worker returned incomplete data.");
  }

  const { positions, normals, numTriangles } = response;

  // Reuse existing helpers to build Mesh on main thread (with chunking for large meshes)
  let meshOrPromise: Mesh | Promise<Mesh>;
  if (numTriangles <= MESH_BUILD_CHUNK) {
    meshOrPromise = buildMeshFromArraysSync(positions, normals, numTriangles);
  } else {
    meshOrPromise = buildMeshFromArraysChunked(positions, normals, numTriangles);
  }

  const mesh =
    meshOrPromise instanceof Promise ? await meshOrPromise : meshOrPromise;
  return applyQuality(mesh, options);
}

export async function stlFileToMesh(file: File, options?: STLLoadOptions): Promise<Mesh> {
  const buffer = await file.arrayBuffer();
  return stlBufferToMeshViaWorker(buffer, options);
}
