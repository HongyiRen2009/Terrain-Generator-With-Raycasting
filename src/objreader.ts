import { vec3 } from "gl-matrix";
import { Mesh } from "./map/Mesh";

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
