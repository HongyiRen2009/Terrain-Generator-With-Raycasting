import { mat4, vec3 } from "gl-matrix";
import { Color, Terrain } from "../map/terrains";
import { Shader } from "./glsl";
import { Mesh } from "../map/Mesh";
import { WorldMap } from "../map/Map";
import { calculateVertexNormals } from "../map/cubes_utils";

export type WireFrameCube = {
  positions: Float32Array<ArrayBuffer>;
  colors: Float32Array<ArrayBuffer>;
  indices: Uint16Array<ArrayBuffer>;
};

export class GlUtils {
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
      new Uint32Array(indices),
      gl.STATIC_DRAW
    );

    return indexBuffer;
  }

  static createCubeVao(
    gl: WebGL2RenderingContext,
    CubeShader: Shader,
    cube: WireFrameCube
  ) {
    const cubeVao = gl.createVertexArray()!;
    gl.bindVertexArray(cubeVao); // ✅ Bind VAO first!

    // --- Position buffer
    const positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cube.positions, gl.STATIC_DRAW);

    const positionLoc = CubeShader.VertexInputs["VertexPosition"].location;
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

    // --- Color buffer
    const colorBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cube.colors, gl.STATIC_DRAW);

    const colorLoc = CubeShader.VertexInputs["VertexColor"].location;
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);

    // --- Index buffer
    const indexBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    return cubeVao;
  }

  static getMeshColor(terrain: Terrain) {
    //TODO: Implement everything, tune models
    const color = terrain.color;
    return new Color(
      color.r * terrain.illuminosity,
      color.g * terrain.illuminosity,
      color.b * terrain.illuminosity
    );
  }
  static createRectangularPrismWireframe(position: vec3, size: vec3) {
    const x = position[0];
    const y = position[1];
    const z = position[2];

    const width = size[0];
    const height = size[1];
    const depth = size[2];

    const x0 = x,
      x1 = x + width;
    const y0 = y,
      y1 = y + height;
    const z0 = z,
      z1 = z + depth;

    // 8 vertices of the prism
    const vertices = new Float32Array([
      x0,
      y0,
      z0, // 0: front-bottom-left
      x1,
      y0,
      z0, // 1: front-bottom-right
      x1,
      y1,
      z0, // 2: front-top-right
      x0,
      y1,
      z0, // 3: front-top-left
      x0,
      y0,
      z1, // 4: back-bottom-left
      x1,
      y0,
      z1, // 5: back-bottom-right
      x1,
      y1,
      z1, // 6: back-top-right
      x0,
      y1,
      z1 // 7: back-top-left
    ]);

    // Colors per vertex (random for now)
    const colors = new Float32Array(vertices.length);
    for (let i = 0; i < colors.length; i++) {
      colors[i] = Math.random();
    }

    // Indices for edges (lines) of the rectangular prism
    // Each pair defines a line segment (edge)
    const indices = new Uint16Array([
      0,
      1, // front bottom edge
      1,
      2, // front right edge
      2,
      3, // front top edge
      3,
      0, // front left edge

      4,
      5, // back bottom edge
      5,
      6, // back right edge
      6,
      7, // back top edge
      7,
      4, // back left edge

      0,
      4, // left bottom edge
      1,
      5, // right bottom edge
      2,
      6, // right top edge
      3,
      7 // left top edge
    ]);

    return { positions: vertices, colors, indices };
  }
  static create3dPosColorInterleavedVao(
    gl: WebGL2RenderingContext,
    vertexBuffer: WebGLBuffer,
    indexBuffer: WebGLBuffer,
    posAttrib: number,
    colorAttrib: number,
    normalAttrib: number = -1
  ) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    gl.enableVertexAttribArray(posAttrib);
    gl.enableVertexAttribArray(colorAttrib);

    // Interleaved format: (x, y, z,nx, ny, nz, r, g, b) (all f32)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(
      posAttrib,
      3,
      gl.FLOAT,
      false,
      9 * Float32Array.BYTES_PER_ELEMENT,
      0
    );

    if (normalAttrib !== -1) {
      gl.enableVertexAttribArray(normalAttrib);
      gl.vertexAttribPointer(
        normalAttrib,
        3,
        gl.FLOAT,
        false,
        9 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT
      );
    }

    gl.vertexAttribPointer(
      colorAttrib,
      3,
      gl.FLOAT,
      false,
      9 * Float32Array.BYTES_PER_ELEMENT,
      6 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bindVertexArray(null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); // Not sure if necessary, but not a bad idea.

    return vao;
  }

  static genTerrainVertices(world: WorldMap) {
    const triangleMeshes: Mesh[] = []; // Store all chunks' meshes
    let mainMesh = new Mesh();
    const WireFrameCubes = [];

    for (const chunk of world.chunks) {
      const triangleMesh = chunk.CreateMarchingCubes();
      triangleMesh.translate(
        vec3.fromValues(chunk.ChunkPosition[0], 0, chunk.ChunkPosition[1])
      );
      mainMesh.merge(triangleMesh);
      triangleMeshes.push(triangleMesh); // Store the chunk's mesh
      WireFrameCubes.push(
        GlUtils.createRectangularPrismWireframe(
          vec3.fromValues(chunk.ChunkPosition[0], 0, chunk.ChunkPosition[1]),
          vec3.fromValues(world.resolution, world.resolution, world.resolution)
        )
      );
    }
    const vertexNormals = calculateVertexNormals(mainMesh);
    return { triangleMeshes, vertexNormals, WireFrameCubes };
  }
}
