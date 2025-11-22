import { WorldMap } from "../map/Map";
import { Mesh } from "../map/Mesh";
import { PointLight, DirectionalLight } from "../map/Light";
import { Camera } from "../render/Camera";
import { vec3 } from "gl-matrix";
import { Color } from "../map/terrains";

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
    pointLights: Array<PointLight> | undefined | null,
    sun?: DirectionalLight,
    camera?: Camera
  ) {
    // Check if this is for pathtracer (has lights[] and numActiveLights uniforms)
    const numActiveLightsLocation = gl.getUniformLocation(program, "numActiveLights");
    const isPathtracer = numActiveLightsLocation !== null;

    if (isPathtracer) {
      // Pathtracer mode: convert sun to PointLight and use lights[] array
      const lights = pointLights || [];
      
      // Convert sun (directional light) to a PointLight for pathtracer
      const sunPointLight = new PointLight(
        vec3.fromValues(0, 500, 0),
        new Color(255, 255, 255),
        1,
        200,
        new Color(255, 228, 132)
      );

      // Combine sun with existing point lights
      const allLights = [sunPointLight, ...lights];
      const numLights = Math.min(allLights.length, 30); // MAX_LIGHTS is 30

      // Set number of active lights
      gl.uniform1i(numActiveLightsLocation, numLights);

      // Update each light
      for (let i = 0; i < numLights; i++) {
        const light = allLights[i];
        const baseUniform = `lights[${i}]`;

        const posLocation = gl.getUniformLocation(
          program,
          `${baseUniform}.position`
        );
        const colorLocation = gl.getUniformLocation(
          program,
          `${baseUniform}.color`
        );
        const showColorLocation = gl.getUniformLocation(
          program,
          `${baseUniform}.showColor`
        );
        const intensityLocation = gl.getUniformLocation(
          program,
          `${baseUniform}.intensity`
        );
        const radiusLocation = gl.getUniformLocation(
          program,
          `${baseUniform}.radius`
        );

        if (posLocation !== null) {
          gl.uniform3fv(posLocation, light.position);
        }
        if (colorLocation !== null) {
          gl.uniform3fv(colorLocation, light.color.createVec3());
        }
        if (showColorLocation !== null) {
          const showColor = light.showColor || light.color;
          gl.uniform3fv(showColorLocation, showColor.createVec3());
        }
        if (intensityLocation !== null) {
          gl.uniform1f(intensityLocation, light.intensity);
        }
        if (radiusLocation !== null) {
          gl.uniform1f(radiusLocation, light.radius);
        }
      }
    } else {
      // Deferred renderer mode: use pointLights[] and SunLight
      // Note: The sun is the only directional light and is handled separately via the sun parameter
      const lights = pointLights || [];

      // Set number of active point lights
      const numPointLightsLocation = gl.getUniformLocation(
        program,
        "numActivePointLights"
      );
      if (numPointLightsLocation !== null) {
        gl.uniform1i(numPointLightsLocation, lights.length);
      }

      // Update point lights
      lights.forEach((light, index) => {
        const baseUniform = `pointLights[${index}]`;

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

        if (posLocation !== null) gl.uniform3fv(posLocation, light.position);
        if (colorLocation !== null) gl.uniform3fv(colorLocation, light.color.createVec3());
        if (showColorLocation !== null) gl.uniform3fv(showColorLocation, light.showColor!.createVec3());
        if (intensityLocation !== null) gl.uniform1f(intensityLocation, light.intensity);
        if (radiusLocation !== null) gl.uniform1f(radiusLocation, light.radius);
      });

      // Update point light shadow map visualization flags
      const showShadowMapArray = lights.map(light => light.showShadowMap ? 1 : 0);
      const showShadowMapLocation = gl.getUniformLocation(program, "pointLightShowShadowMap");
      if (showShadowMapLocation !== null) {
        gl.uniform1iv(showShadowMapLocation, showShadowMapArray);
      }

      // Update sun (the only directional light in the system)
      if (sun) {
        const directionLocation = gl.getUniformLocation(
          program,
          "SunLight.direction"
        );
        const colorLocation = gl.getUniformLocation(
          program,
          "SunLight.color"
        );
        const intensityLocation = gl.getUniformLocation(
          program,
          "SunLight.intensity"
        );

        if (directionLocation) gl.uniform3fv(directionLocation, sun.direction);
        if (colorLocation) gl.uniform3fv(colorLocation, sun.color.createVec3());
        if (intensityLocation) gl.uniform1f(intensityLocation, sun.intensity);
      }
    }

    if (camera) {
      const cameraPositionLocation = gl.getUniformLocation(
        program,
        "cameraPosition"
      );
      if (cameraPositionLocation !== null) {
        gl.uniform3fv(cameraPositionLocation, camera.getPosition());
      }
    }
  }
}