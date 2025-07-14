import { vec3 } from "gl-matrix";
import { Mesh } from "./map/Mesh";

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
      mesh.addTriangle(
        [
          vertices[parseInt(t1) - 1],
          vertices[parseInt(t2) - 1],
          vertices[parseInt(t3) - 1]
        ],
        [vec3.create(), vec3.create(), vec3.create()]
      );
    } else {
      throw new Error(
        `Unexpected line start ${line[0]} of ${line} at line ${i}`
      );
    }
    i++;
  }

  return mesh;
};
