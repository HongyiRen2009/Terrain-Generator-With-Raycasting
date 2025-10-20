import { mat4, vec3 } from "gl-matrix";

export class RenderUtils {
  ///////////////////////Rendering Utilities/////////////////////
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
  ): WebGLProgram | null {
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
      return null;
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
   * Creates a buffer for vertex attributes.
   * @param gl The WebGL2RenderingContext to use for creating the buffer.
   * @param data The Float32Array containing attribute data.
   * @returns WebGLBuffer containing the attribute data.
   */
  static CreateAttributeBuffer(
    gl: WebGL2RenderingContext,
    data: Float32Array
  ): WebGLBuffer {
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("Failed to create attribute buffer");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
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
   * @param layout An object defining the layout of vertex attributes.
   * @param locations Optional object mapping attribute names to their locations.
   * @returns The created VAO.
   */
  static createInterleavedVao(
    gl: WebGL2RenderingContext,
    vertexBuffer: WebGLBuffer,
    indexBuffer: WebGLBuffer,
    layout: {
      [attribName: string]: {
        offset: number;
        stride: number;
        size: number;
        sizeOverride?: number; //For example, positions are vec4 but only use 3 components
        location?: number; // Optional location override
      };
    },
    program: WebGLProgram
  ) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    for (const [name, layoutInfo] of Object.entries(layout)) {
      const location =
        layoutInfo.location ?? gl.getAttribLocation(program, name);
      if (location === -1) {
        console.warn(`Attribute ${name} not found in shader program.`);
        continue;
      }
      const size = layoutInfo.sizeOverride ?? layoutInfo.size;

      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(
        location,
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
   * Creates a Vertex Array Object (VAO) for non-interleaved vertex attributes.
   * @param gl WebGL2RenderingContext
   * @param attributeBuffers WebGLBuffers for each attribute
   * @param indexBuffer Index buffer for the mesh
   * @param shader Shader containing attribute locations
   * @returns WebGLVertexArrayObject
   */
  static createNonInterleavedVao(
    gl: WebGL2RenderingContext,
    attributeBuffers: {
      [attribName: string]: {
        buffer: WebGLBuffer;
        size: number; // components per attribute (e.g., 3 for vec3)
        type?: GLenum; // gl.FLOAT (default)
      };
    },
    indexBuffer: WebGLBuffer,
    program: WebGLProgram
  ): WebGLVertexArrayObject {
    const vao = gl.createVertexArray();
    if (!vao) throw new Error("Failed to create VAO");

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    for (const [attribName, bufferInfo] of Object.entries(attributeBuffers)) {
      const attribLocation = gl.getAttribLocation(program, attribName);
      if (attribLocation === -1) {
        console.warn(`Attribute ${attribName} not found in shader program.`);
        continue;
      }

      const { buffer, size, type = gl.FLOAT } = bufferInfo;

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(attribLocation);
      gl.vertexAttribPointer(attribLocation, size, type, false, 0, 0);
    }

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return vao;
  }
  ///////////////////////Matrix Utilities/////////////////////
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
}
  

  