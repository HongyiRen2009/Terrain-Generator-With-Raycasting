import { vec3 } from "gl-matrix";
import { Mesh, Triangle } from "./map/Mesh";

const calculateNormal = (vertices: vec3[]): vec3 => {
  const normal = vec3.create();
  const v1 = vec3.subtract(vec3.create(), vertices[1], vertices[0]);
  const v2 = vec3.subtract(vec3.create(), vertices[2], vertices[0]);
  vec3.cross(normal, v1, v2);
  vec3.normalize(normal, normal);
  return normal;
};

//TODO: .obj comes with built in optimization reusing vertices
export const objSourceToMesh = (objSource: string): Mesh => {
  let i = 0;
  const mesh = new Mesh();
  const vertices: vec3[] = [];
  for (const line of objSource.split(/\r?\n/)) {
    if (line.trim() === "") {
      continue;
    }
    if (line.startsWith("v")) {
      let [_, x, y, z] = line.split(" ");
      vertices.push(
        vec3.fromValues(parseFloat(x), parseFloat(y), parseFloat(z))
      );
    } else if (line.startsWith("f")) {
      // note: vertix indices start at 1
      let [_, t1, t2, t3] = line.split(" ");
      let triangle: [vec3, vec3, vec3] = [
        vertices[parseInt(t1) - 1],
        vertices[parseInt(t2) - 1],
        vertices[parseInt(t3) - 1]
      ];
      let normal = calculateNormal(triangle);
      mesh.addTriangle(triangle, [normal, normal, normal]);
    } else {
      throw new Error(
        `Unexpected line start ${line[0]} of ${line} at line ${i}`
      );
    }
    i++;
  }

  return mesh;
};


export function loadPLYToMesh(plyString: string): Mesh {
  const lines = plyString.split(/\r?\n/);
  let numVertices = 0;
  let numFaces = 0;
  let headerEnded = false;
  let vertexLines: string[] = [];
  let faceLines: string[] = [];
  let lineIndex = 0;

  // Parse header
  while (!headerEnded && lineIndex < lines.length) {
    const line = lines[lineIndex].trim();
    if (line.startsWith("element vertex")) {
      numVertices = parseInt(line.split(" ")[2]);
    } else if (line.startsWith("element face")) {
      numFaces = parseInt(line.split(" ")[2]);
    } else if (line === "end_header") {
      headerEnded = true;
    }
    lineIndex++;
  }

  // Get vertex lines
  vertexLines = lines.slice(lineIndex, lineIndex + numVertices);
  lineIndex += numVertices;

  // Get face lines
  faceLines = lines.slice(lineIndex, lineIndex + numFaces);

  const vertices: vec3[] = [];
  const normals: vec3[] = [];

  // Parse vertices (assumes x y z nx ny nz r g b)
  for (const line of vertexLines) {
    const parts = line.trim().split(/\s+/).map(Number);
    const v = vec3.fromValues(parts[0], parts[1], parts[2]);
    vertices.push(v);

    // Normal fallback: if normals exist
    if (parts.length >= 6) {
      const n = vec3.fromValues(parts[3], parts[4], parts[5]);
      normals.push(n);
    } else {
      normals.push(vec3.fromValues(0, 0, 0));
    }
  }

  const mesh = new Mesh();

  // Parse faces
  for (const line of faceLines) {
    const parts = line.trim().split(/\s+/).map(Number);
    const vertexCount = parts[0];
    if (vertexCount < 3) continue;

    const indices = parts.slice(1, vertexCount + 1);
    // triangulate polygon (assumes convex)
    for (let i = 1; i < vertexCount - 1; i++) {
      const t: Triangle = [
        vertices[indices[0]],
        vertices[indices[i]],
        vertices[indices[i + 1]],
      ];
      const n: Triangle = [
        normals[indices[0]],
        normals[indices[i]],
        normals[indices[i + 1]],
      ];
      mesh.addTriangle(t, n);
    }
  }

  return mesh;
}