// Web Worker for STL parsing: produces flat position/normal arrays.
// This keeps heavy parsing work off the main thread.

export interface STLWorkerRequest {
  id: string;
  buffer: ArrayBuffer;
  options?: {
    quality?: number;
  };
}

export interface STLWorkerResponse {
  id: string;
  error?: string;
  positions?: Float32Array;
  normals?: Float32Array;
  numTriangles?: number;
}

// Detect if STL data is binary.
// Binary STL: 80-byte header, 4-byte little-endian triangle count, then 50 bytes per triangle.
function isBinarySTL(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 84) return false;
  const view = new DataView(buffer);
  const numTriangles = view.getUint32(80, true);
  const expectedSize = 84 + numTriangles * 50;
  return buffer.byteLength === expectedSize;
}

// Parse binary STL into flat typed arrays (positions, normals).
function parseBinarySTLToArrays(
  buffer: ArrayBuffer
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
    offset += 14; // 12 vertex bytes + 2 attribute bytes
  }

  return { positions, normals, numTriangles };
}

// Minimal ASCII STL parser: mirrors main-thread logic but only returns flat arrays.
function parseASCIISTLToArrays(
  text: string
): { positions: Float32Array; normals: Float32Array; numTriangles: number } {
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
    normalsList.push(
      parseFloat(numMatch[1]),
      parseFloat(numMatch[2]),
      parseFloat(numMatch[3])
    );
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
      positions.push(
        p1[0],
        p1[1],
        p1[2],
        p2[0],
        p2[1],
        p2[2],
        p3[0],
        p3[1],
        p3[2]
      );
    }
    i = text.indexOf("endfacet", v3Start);
    if (i === -1) break;
    i += 8;
  }

  const numTriangles = normalsList.length / 3;
  const posArray = new Float32Array(positions);
  const normArray = new Float32Array(normalsList);

  return { positions: posArray, normals: normArray, numTriangles };
}

self.onmessage = (event: MessageEvent<STLWorkerRequest>) => {
  const { id, buffer } = event.data;

  try {
    if (isBinarySTL(buffer)) {
      const { positions, normals, numTriangles } = parseBinarySTLToArrays(buffer);
      const response: STLWorkerResponse = {
        id,
        positions,
        normals,
        numTriangles
      };
      self.postMessage(response, [positions.buffer, normals.buffer]);
    } else {
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const text = decoder.decode(buffer);
      const { positions, normals, numTriangles } = parseASCIISTLToArrays(text);
      const response: STLWorkerResponse = {
        id,
        positions,
        normals,
        numTriangles
      };
      self.postMessage(response, [positions.buffer, normals.buffer]);
    }
  } catch (error: any) {
    const response: STLWorkerResponse = {
      id,
      error: error?.message ?? String(error)
    };
    self.postMessage(response);
  }
};

