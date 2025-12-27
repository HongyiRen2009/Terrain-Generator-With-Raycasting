import { WorldMap } from "../map/Map";
import { Mesh } from "../map/Mesh";
import { PointLight, DirectionalLight } from "../map/Light";
import { Camera } from "../render/Camera";
import { mat4, vec3 } from "gl-matrix";
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

    for (const chunk of Object.values(world.chunks)) {
      const triangleMesh = chunk.Mesh;
      triangleMesh.translate(chunk.ChunkPosition);
      mainMesh.merge(triangleMesh);
      triangleMeshes.push(triangleMesh); // Store the chunk's mesh
    }

    return triangleMeshes;
  }

  static addChunkGears(world: WorldMap, gearMesh: Mesh) {
    for (const chunk of Object.values(world.chunks)) {
      for (const gearPos of chunk.gearObjects) {
        let position = mat4.create();
        mat4.translate(position, position, gearPos);

        mat4.scale(position, position, vec3.fromValues(0.1, 0.1, 0.1));
        world.addObject(gearMesh, position, "Gear (from chunk)");
      }
    }
  }

  static updateLights(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    pointLights: Array<PointLight> | undefined | null,
    sun?: DirectionalLight,
    camera?: Camera
  ) {
    // Check if this is for pathtracer (has lights[] and numActiveLights uniforms)
    const numActiveLightsLocation = gl.getUniformLocation(
      program,
      "numActiveLights"
    );
    const isPathtracer = numActiveLightsLocation !== null;

    if (isPathtracer) {
      // Pathtracer mode: convert sun to PointLight and use lights[] array
      const lights = pointLights || [];

      // Convert sun (directional light) to a PointLight for pathtracer
      if(sun){
        gl.uniform1f(gl.getUniformLocation(program,"sunDirX"),sun.direction[0]);
        gl.uniform1f(gl.getUniformLocation(program,"sunDirY"),sun.direction[1]);
        gl.uniform1f(gl.getUniformLocation(program,"sunDirZ"),sun.direction[2]);
        gl.uniform1f(gl.getUniformLocation(program,"u_sunIntensity"),sun.intensity);
        gl.uniform1f(gl.getUniformLocation(program,"u_sunAngularRadius"),sun.angularRadius);
        gl.uniform3fv(gl.getUniformLocation(program,"u_sunColor"),sun.color.createVec3())
      }

      // Combine sun with existing point lights
      const numLights = Math.min(lights.length, 100); // MAX_LIGHTS is 100

      // Set number of active lights
      gl.uniform1i(numActiveLightsLocation, numLights);

      // Update each light
      for (let i = 0; i < numLights; i++) {
        const light = lights[i];
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
        const rangeLocation = gl.getUniformLocation(
          program,
          `${baseUniform}.range`
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
        if (rangeLocation !== null) {
          gl.uniform1f(rangeLocation, light.range);
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
        const rangeLocation = gl.getUniformLocation(
          program,
          `${baseUniform}.range`
        );
        const showColorLocation = gl.getUniformLocation(
          program,
          `${baseUniform}.showColor`
        );

        if (posLocation !== null) gl.uniform3fv(posLocation, light.position);
        if (colorLocation !== null)
          gl.uniform3fv(colorLocation, light.color.createVec3());
        if (showColorLocation !== null)
          gl.uniform3fv(showColorLocation, light.showColor!.createVec3());
        if (intensityLocation !== null)
          gl.uniform1f(intensityLocation, light.intensity);
        if (radiusLocation !== null) gl.uniform1f(radiusLocation, light.radius);
        if (rangeLocation !== null) gl.uniform1f(rangeLocation, light.range);
      });

      // Update point light shadow map visualization flags
      const showShadowMapArray = lights.map((light) =>
        light.showShadowMap ? 1 : 0
      );
      const showShadowMapLocation = gl.getUniformLocation(
        program,
        "pointLightShowShadowMap"
      );
      if (showShadowMapLocation !== null) {
        gl.uniform1iv(showShadowMapLocation, showShadowMapArray);
      }

      // Update sun (the only directional light in the system)
      if (sun) {
        const directionLocation = gl.getUniformLocation(
          program,
          "SunLight.direction"
        );
        const colorLocation = gl.getUniformLocation(program, "SunLight.color");
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
