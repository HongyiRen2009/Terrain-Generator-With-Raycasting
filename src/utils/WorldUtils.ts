import { WorldMap } from "../map/Map";
import { Mesh } from "../map/Mesh";
import { PointLight, DirectionalLight } from "../map/Light";
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
    lights: Array<PointLight | DirectionalLight>,
    camera?: Camera
  ) {
    // Separate point lights and directional lights
    const pointLights: PointLight[] = [];
    const directionalLights: DirectionalLight[] = [];

    lights.forEach((light) => {
      if (light instanceof PointLight) {
        pointLights.push(light);
      } else if (light instanceof DirectionalLight) {
        directionalLights.push(light);
      }
    });

    // Set number of active lights
    const numPointLightsLocation = gl.getUniformLocation(
      program,
      "numActivePointLights"
    );
    gl.uniform1i(numPointLightsLocation, pointLights.length);

    const numDirectionalLightsLocation = gl.getUniformLocation(
      program,
      "numActiveDirectionalLights"
    );
    gl.uniform1i(numDirectionalLightsLocation, directionalLights.length);

    // Update point lights
    pointLights.forEach((light, index) => {
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
      gl.uniform3fv(showColorLocation, light.showColor!.createVec3());
      gl.uniform1f(intensityLocation, light.intensity);
      gl.uniform1f(radiusLocation, light.radius);
    });

    // Update directional lights
    directionalLights.forEach((light, index) => {
      const baseUniform = `directionalLights[${index}]`;

      const directionLocation = gl.getUniformLocation(
        program,
        `${baseUniform}.direction`
      );
      const colorLocation = gl.getUniformLocation(
        program,
        `${baseUniform}.color`
      );
      const intensityLocation = gl.getUniformLocation(
        program,
        `${baseUniform}.intensity`
      );

      gl.uniform3fv(directionLocation, light.direction);
      gl.uniform3fv(colorLocation, light.color.createVec3());
      gl.uniform1f(intensityLocation, light.intensity);
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