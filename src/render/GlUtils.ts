import { mat4, vec3 } from "gl-matrix";
import { Shader } from "./Shader";
import { Mesh } from "../map/Mesh";
import { WorldMap } from "../map/Map";
import { Light } from "../map/Light";
import { Camera } from "./Camera";

export class GlUtils {
  /**
   * Creates a WebGL program with the given vertex and fragment shader code.
   * @param gl The WebGL2RenderingContext to use for creating the program.
   * @param VertexShaderCode The GLSL code for the vertex shader.
   * @param FragmentShaderCode The GLSL code for the fragment shader.
   * @returns The created WebGLProgram or undefined if linking failed.
   * @throws Error if shader compilation fails.
   */
  static CreateProgram(
    gl: WebGL2RenderingContext,
    VertexShaderCode: string,
    FragmentShaderCode: string
  ) {
    const VertexShader = this.CreateShader(
      gl,
      gl.VERTEX_SHADER,
      VertexShaderCode
    );
    const FragmentShader = this.CreateShader(
      gl,
      gl.FRAGMENT_SHADER,
      FragmentShaderCode
    );
    const Program = gl.createProgram();
    gl.attachShader(Program, VertexShader);
    gl.attachShader(Program, FragmentShader);
    gl.linkProgram(Program);

    if (!gl.getProgramParameter(Program, gl.LINK_STATUS)) {
      const errorMessage = gl.getProgramInfoLog(Program);
      console.error(`Failed to link GPU program: ${errorMessage}`);
      return;
    }
    return Program;
  }
  /**
   * Creates a WebGL shader of the specified type with the given GLSL code.
   * @param gl The WebGL2RenderingContext to use for creating the shader.
   * @param ShaderType The type of shader to create (e.g., gl.VERTEX_SHADER, gl.FRAGMENT_SHADER).
   * @param ShaderCode The GLSL code for the shader.
   * @returns The created WebGLShader.
   * @throws Error if shader compilation fails.
   */
  static CreateShader(
    gl: WebGL2RenderingContext,
    ShaderType: GLenum,
    ShaderCode: string
  ) {
    const Shader = gl.createShader(ShaderType);

    if (!Shader) {
      throw new Error("Failed to create WebGL shader.");
    }

    gl.shaderSource(Shader, ShaderCode);
    gl.compileShader(Shader);

    if (!gl.getShaderParameter(Shader, gl.COMPILE_STATUS)) {
      console.error("Shader compilation error: ", gl.getShaderInfoLog(Shader));
      gl.deleteShader(Shader); // Clean up the failed shader
      throw new Error("Shader compilation failed.");
    }

    return Shader;
  }
  /**
   * Creates a static buffer for vertices and indices.
   * @param gl The WebGL2RenderingContext to use for creating the buffer.
   * @param CPUVertexBuffer The Float32Array containing vertex data.
   * @param CPUIndexBuffer The array of indices for the buffer.
   * @returns An object containing the vertex buffer and index buffer.
   * @throws Error if buffer creation fails.
   */
  static CreateStaticBuffer(
    gl: WebGL2RenderingContext,
    CPUVertexBuffer: Float32Array,
    CPUIndexBuffer: number[]
  ) {
    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error("Failed to create buffer");
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, CPUVertexBuffer, gl.STATIC_DRAW);
    const IndexBuffer = this.CreateIndexBuffer(gl, CPUIndexBuffer);

    return {
      vertex: buffer,
      // color: colorBuffer,
      indices: IndexBuffer
    };
  }
  /**
   * Creates a transformation matrix based on translation, rotation, and scale. Translate, rotate, then scale.
   * @param translation A vec3 representing the translation (x, y, z).
   * @param rotation A vec3 representing the rotation in radians (x, y, z).
   * @param scale A vec3 representing the scale (x, y, z).
   * @returns A mat4 transformation matrix.
   */
  static CreateTransformations(
    translation?: vec3,
    rotation?: vec3,
    scale?: vec3
  ) {
    let transformMatrix = mat4.create();

    if (translation) {
      mat4.translate(transformMatrix, transformMatrix, translation);
    }
    if (rotation) {
      mat4.rotateX(transformMatrix, transformMatrix, rotation[0]);
      mat4.rotateY(transformMatrix, transformMatrix, rotation[1]);
      mat4.rotateZ(transformMatrix, transformMatrix, rotation[2]);
    }
    if (scale) {
      mat4.scale(transformMatrix, transformMatrix, scale);
    }
    return transformMatrix;
  }

  /**
   * Creates an index buffer for the given indices.
   * @param gl The WebGL2RenderingContext to use for creating the buffer.
   * @param indices The array of indices to be stored in the buffer.
   * @returns The created WebGLBuffer containing the indices.
   */
  static CreateIndexBuffer(gl: WebGL2RenderingContext, indices: number[]) {
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.

    // Now send the element array to GL

    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint32Array(indices),
      gl.STATIC_DRAW
    );

    return indexBuffer;
  }

  /**
   * Creates a Vertex Array Object (VAO) for interleaved vertex attributes.
   * @param gl The WebGL2RenderingContext to use for creating the VAO.
   * @param vertexBuffer The WebGLBuffer containing vertex data.
   * @param indexBuffer The WebGLBuffer containing index data.
   * @param shader The Shader object containing vertex attribute locations.
   * @param layout An object defining the layout of vertex attributes.
   * @returns The created VAO.
   */
  static createInterleavedVao(
    gl: WebGL2RenderingContext,
    vertexBuffer: WebGLBuffer,
    indexBuffer: WebGLBuffer,
    shader: Shader,
    layout: {
      [attribName: string]: {
        offset: number;
        stride: number;
        sizeOverride?: number; //For example, positions are vec4 but only use 3 components
      };
    }
  ) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    for (const [name, attrib] of Object.entries(shader.VertexInputs)) {
      const layoutInfo = layout[name];
      if (!layoutInfo) {
        console.warn(`No layout info for attribute ${name}, skipping.`);
        continue;
      }

      const size = layoutInfo.sizeOverride ?? attrib.size;

      gl.enableVertexAttribArray(attrib.location);
      gl.vertexAttribPointer(
        attrib.location,
        size,
        gl.FLOAT,
        false,
        layoutInfo.stride,
        layoutInfo.offset
      );
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vao;
  }

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

  ///////////////////////Texture Utilities/////////////////////

  /**
   * Binds a given WebGL texture to texture unit 0 and sets the corresponding sampler uniform in the shader program.
   *
   * @param gl - The WebGL2RenderingContext to use for binding.
   * @param program - The WebGLProgram to bind the texture to.
   * @param tex - The WebGLTexture to bind.
   * @param key - The name of the sampler uniform in the shader program to associate with the texture.
   * @param unit - The texture unit to bind the texture to (0-15 for WebGL2).
   *
   * @remarks
   * If the specified uniform cannot be found in the shader program, a warning is logged to the console.
   */
  static bindTex(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    tex: WebGLTexture,
    key: string,
    unit: number
  ) {
    const loc = gl.getUniformLocation(program, key);
    if (loc === null) {
      console.warn(`Cannot find ${key} in fragmentShader`);
      return;
    }
    // Bind to the specified texture unit
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Tell the shader's sampler to use this texture unit
    gl.uniform1i(loc, unit);
  }

  /**
   * Uploads a Float32Array to GPU as a 2D RGBA32F texture.
   * Each texel stores 4 floats (R, G, B, A).
   * (totally not vibecoded)
   * @param gl         - WebGL2RenderingContext
   * @param data       - Float32Array containing your raw float data
   * @param widthHint  - Optional: manual texture width (default auto-calculated)
   * @returns texture: WebGLTexture
   */
  static packFloatArrayToTexture(
    gl: WebGL2RenderingContext,
    data: Float32Array,
    widthHint?: number
  ) {
    if (data.length % 4 !== 0) {
      console.warn(
        `[packFloatArrayToTexture] Padding input from ${data.length} to multiple of 4`
      );
      const padded = new Float32Array(Math.ceil(data.length / 4) * 4);
      padded.set(data);
      data = padded;
    }

    const totalTexels = data.length / 4;

    const width = widthHint || Math.ceil(Math.sqrt(totalTexels));
    const height = Math.ceil(totalTexels / width);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA32F, // Internal format
      width,
      height,
      0,
      gl.RGBA, // Format of incoming data
      gl.FLOAT,
      new Float32Array(width * height * 4).fill(0).map((_, i) => data[i] ?? 0) // Fill/pad if needed
    );

    // NEAREST = no filtering/interpolation
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
  }
}
