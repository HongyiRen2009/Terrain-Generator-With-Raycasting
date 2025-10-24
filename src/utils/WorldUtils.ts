import { WorldMap } from "../map/Map";
import { Mesh } from "../map/Mesh";
import { Light } from "../map/Light";
import { Camera } from "../render/Camera";
import { vec3 } from "gl-matrix";

export class WorldUtils {
  /**
   * Calculates the necessary vertices, normals, and wireframes for cubes for our world
   * @param world The world we are rendering
   * @returns { List of triangle meshes }
   */
  static genTerrainVertices(world: WorldMap) {
    const triangleMeshes: Mesh[] = []; // Store all chunks' meshes
    let mainMesh = new Mesh();

    for (const chunk of world.chunks) {
      const triangleMesh = chunk.Mesh;
      triangleMesh.translate(
        vec3.fromValues(chunk.ChunkPosition[0], 0, chunk.ChunkPosition[1])
      );
      mainMesh.merge(triangleMesh);
      triangleMeshes.push(triangleMesh); // Store the chunk's mesh
    }

    return triangleMeshes;
  }

  static updateLights(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    lights: Array<Light>,
    camera?: Camera
  ) {
    // Set number of active lights
    const numLightsLocation = gl.getUniformLocation(program, "numActiveLights");
    gl.uniform1i(numLightsLocation, lights.length);

    // Update each light's data
    lights.forEach((light, index) => {
      const baseUniform = `lights[${index}]`;

      const posLocation = gl.getUniformLocation(
        program,
        `${baseUniform}.position`
      );
      const colorLocation = gl.getUniformLocation(
        program,
        `${baseUniform}.color`
      );
      const intensityLocation = gl.getUniformLocation(
        program,
        `${baseUniform}.intensity`
      );
      const radiusLocation = gl.getUniformLocation(
        program,
        `${baseUniform}.radius`
      );
      const showColorLocation = gl.getUniformLocation(
        program,
        `${baseUniform}.showColor`
      );

      gl.uniform3fv(posLocation, light.position);
      gl.uniform3fv(colorLocation, light.color.createVec3());
      gl.uniform3fv(showColorLocation, light.showColor.createVec3());
      gl.uniform1f(intensityLocation, light.intensity);
      gl.uniform1f(radiusLocation, light.radius);
    });

    if (camera) {
      const viewPositionLocation = gl.getUniformLocation(
        program,
        "viewPosition"
      );
      gl.uniform3fv(viewPositionLocation, camera.getPosition());
    }
  }
}