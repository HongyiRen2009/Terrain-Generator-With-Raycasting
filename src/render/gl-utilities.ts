import { mat4, vec3 } from "gl-matrix";
import { Color, Terrain } from "../map/terrains";

export class glUtils {
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
    gl.useProgram(Program);
    return Program;
  }

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

  static CreateStaticBuffer(
    gl: WebGL2RenderingContext,
    CPUPositionBuffer: Float32Array,
    CPUIndexBuffer: number[]
  ) {
    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error("Failed to create buffer");
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, CPUPositionBuffer, gl.STATIC_DRAW);
    const IndexBuffer = this.CreateIndexBuffer(gl, CPUIndexBuffer);

    return {
      position: buffer,
      // color: colorBuffer,
      indices: IndexBuffer
    };
  }

  static CreateTransformations(
    translation?: vec3,
    rotation?: vec3,
    scale?: vec3
  ) {
    let transformMatrix = mat4.create();
    if (scale) {
      mat4.scale(transformMatrix, transformMatrix, scale);
    }
    if (rotation) {
      // Apply rotation around X, Y, and Z axes using Euler angles
      mat4.rotateX(transformMatrix, transformMatrix, rotation[0]);
      mat4.rotateY(transformMatrix, transformMatrix, rotation[1]);
      mat4.rotateZ(transformMatrix, transformMatrix, rotation[2]);
    }
    if (translation) {
      mat4.translate(transformMatrix, transformMatrix, translation);
    }
    return transformMatrix;
  }

  //Will change it later to feature length manipulations
  static CreateIndexBuffer(gl: WebGL2RenderingContext, indices: number[]) {
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.

    // Now send the element array to GL

    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
    );

    return indexBuffer;
  }

  static create3dPosColorInterleavedVao(
    gl: WebGL2RenderingContext,
    vertexBuffer: WebGLBuffer,
    indexBuffer: WebGLBuffer,
    posAttrib: number,
    colorAttrib: number
  ) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    gl.enableVertexAttribArray(posAttrib);
    gl.enableVertexAttribArray(colorAttrib);

    // Interleaved format: (x, y, z, r, g, b) (all f32)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(
      posAttrib,
      3,
      gl.FLOAT,
      false,
      6 * Float32Array.BYTES_PER_ELEMENT,
      0
    );
    gl.vertexAttribPointer(
      colorAttrib,
      3,
      gl.FLOAT,
      false,
      6 * Float32Array.BYTES_PER_ELEMENT,
      3 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bindVertexArray(null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); // Not sure if necessary, but not a bad idea.

    return vao;
  }

  static getMeshColor(normal: number, terrain: Terrain) {
    //TODO: Implement everything, tune models
    const color = terrain.color;
    const shadow = 0.5 * normal + 0.5;
    return new Color(
      color.r * shadow * terrain.illuminosity,
      color.g * shadow * terrain.illuminosity,
      color.b * shadow * terrain.illuminosity
    );
  }
}
