import { glMatrix, mat4, vec2, vec3 } from "gl-matrix";
import { CubeVertices, WirFrameCubeIndices } from "./geomatry";
import {
  create3dPosColorInterleavedVao,
  CreateProgram,
  CreateStaticBuffer,
  CreateTransformations
} from "./gl-utilities";
import { VertexShaderCode, FragmentShaderCode } from "./glsl";
import { Camera } from "./Camera";
import { Chunk, meshToVertices } from "./marching_cubes";

export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;

  CubeBuffer: { position: WebGLBuffer; indices: WebGLBuffer };
  TriangleBuffer: { position: WebGLBuffer; indices: WebGLBuffer };

  MeshSize: number;

  MatrixTransformUniformLocation: WebGLUniformLocation;
  matViewProjUniform: WebGLUniformLocation;
  VertexPositionAttributeLocation: number;
  VertexColorAttributeLocation: number;

  matView: mat4;
  matProj: mat4;
  matViewProj: mat4;

  constructor(
    gl: WebGL2RenderingContext,
    canvas: HTMLCanvasElement,
    camera: Camera
  ) {
    this.gl = gl;
    this.canvas = canvas;
    this.camera = camera;

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // Ensures closer objects are drawn in front

    // These coordinates are in clip space, to see a visualization, go to https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection
    const CubeCPUBuffer = new Float32Array(CubeVertices);
    this.CubeBuffer = CreateStaticBuffer(
      gl,
      CubeCPUBuffer,
      WirFrameCubeIndices
    );

    //TODO: this is not the right place to be doing this
    const chunk = new Chunk(vec2.fromValues(0, 0), vec3.fromValues(32, 32, 32));
    const triangleMesh = chunk.CreateMarchingCubes();

    // console.log(chunk.CreateMarchingCubes());

    const triangleVertices = meshToVertices(triangleMesh);

    // since we don't reuse any vertices right now, each index is unique
    const triangleIndices = Array(triangleMesh.length * 3)
      .fill(0)
      .map((_, i) => i);

    this.MeshSize = triangleMesh.length;
    this.TriangleBuffer = CreateStaticBuffer(
      gl,
      triangleVertices,
      triangleIndices
    );

    const CubeProgram = CreateProgram(gl, VertexShaderCode, FragmentShaderCode);

    if (!this.CubeBuffer || !CubeProgram) {
      throw new Error("Error initializing program");
    }

    this.VertexPositionAttributeLocation = gl.getAttribLocation(
      CubeProgram,
      "VertexPosition"
    );
    this.VertexColorAttributeLocation = gl.getAttribLocation(
      CubeProgram,
      "VertexColor"
    );

    this.MatrixTransformUniformLocation = gl.getUniformLocation(
      CubeProgram,
      "MatrixTransform"
    ) as WebGLUniformLocation;

    this.matViewProjUniform = gl.getUniformLocation(
      CubeProgram,
      "matViewProj"
    ) as WebGLUniformLocation;

    this.matView = mat4.create(); //Identity matrices
    this.matProj = mat4.create();
    this.matViewProj = mat4.create();
  }

  drawMesh(TransformationMatrix: mat4) {
    this.gl.uniformMatrix4fv(
      this.MatrixTransformUniformLocation,
      false,
      TransformationMatrix
    );
    this.gl.uniformMatrix4fv(this.matViewProjUniform, false, this.matViewProj);
    //Create vertice array object
    const triangleVao = create3dPosColorInterleavedVao(
      this.gl,
      this.TriangleBuffer.position,
      this.TriangleBuffer.indices,
      this.VertexPositionAttributeLocation,
      this.VertexColorAttributeLocation
    );

    this.gl.bindVertexArray(triangleVao);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.MeshSize * 3);
    this.gl.bindVertexArray(null);
  }

  DrawWireFrameCube(TransformationMatrix: mat4) {
    this.gl.uniformMatrix4fv(
      this.MatrixTransformUniformLocation,
      false,
      TransformationMatrix
    );
    this.gl.uniformMatrix4fv(this.matViewProjUniform, false, this.matViewProj);
    //Create vertice array object
    const cubeVao = create3dPosColorInterleavedVao(
      this.gl,
      this.CubeBuffer!.position,
      this.CubeBuffer!.indices,
      this.VertexPositionAttributeLocation,
      this.VertexColorAttributeLocation
    );

    this.gl.bindVertexArray(cubeVao);

    this.gl.drawElements(
      this.gl.LINES,
      48 /*Vertex count */,
      this.gl.UNSIGNED_SHORT,
      0
    );
    this.gl.bindVertexArray(null);
  }

  render() {
    // Set clear color to black, fully opaque
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Calculate view and projection matrices once per frame
    this.matView = this.camera.getViewMatrix();
    mat4.perspective(
      this.matProj,
      /* fovy= */ glMatrix.toRadian(80),
      /* aspectRatio= */ this.canvas.width / this.canvas.height,
      /* near, far= */ 0.1,
      100.0
    );
    mat4.multiply(this.matViewProj, this.matProj, this.matView);

    const Chunks = [
      new Chunk(vec2.fromValues(0, 0), vec3.fromValues(32, 32, 32))
    ];

    for (let i = 0; i < Chunks.length; i++) {
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          for (let z = 0; z < 5; z++) {
            this.DrawWireFrameCube(
              CreateTransformations(
                vec3.fromValues(x, y, z),
                undefined,
                undefined
              )
            );
          }
        }
      }
    }

    this.drawMesh(CreateTransformations(vec3.fromValues(0, 0, 0)));
  }
}

