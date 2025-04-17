import { glMatrix, mat4, vec2, vec3 } from "gl-matrix";
import { CubeVertices, WirFrameCubeIndices } from "../map/geometry";
import {
  create3dPosColorInterleavedVao,
  CreateProgram,
  CreateStaticBuffer,
  CreateTransformations
} from "./gl-utilities";
import { VertexShaderCode, FragmentShaderCode } from "./glsl";
import { Camera } from "./Camera";
import {
  calculateVertexNormals,
  Chunk,
  meshToVertices
} from "../map/marching_cubes";
import { WorldMap } from "../map/Map";
import { Mesh } from "../map/Mesh";

export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;

  CubeBuffer: { position: WebGLBuffer; indices: WebGLBuffer };
  TriangleBuffer: { position: WebGLBuffer; indices: WebGLBuffer };

  MeshSize: number = 0;

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
    let triangleVertices: number[] = [];
    const triangleMeshes: Mesh[] = []; // Store all chunks' meshes
    let combinedMesh: Mesh = new Mesh(); // Combine all chunks' meshes into one
    const world = new WorldMap(1000, 1000, 1000);
    debugger;
    for (const chunk of world.chunks) {
      const triangleMesh = chunk.CreateMarchingCubes();
      triangleMeshes.push(triangleMesh); // Store the chunk's mesh
      combinedMesh.mesh = combinedMesh.mesh.concat(triangleMesh.mesh); // Add the chunk's mesh to the combined mesh
      // console.log(chunk.CreateMarchingCubes());
    }
    const VertexNormals = calculateVertexNormals(combinedMesh);
    for (let i = 0; i < triangleMeshes.length; i++) {
      const Mesh = triangleMeshes[i];
      const ChunkPosition = world.chunks[i].ChunkPosition;
      triangleVertices = triangleVertices.concat(
        Array.from(meshToVertices(Mesh, VertexNormals, ChunkPosition))
      );
    }
    // since we don't reuse any vertices right now, each index is unique
    const triangleIndices = Array(combinedMesh.mesh.length * 3)
      .fill(0)
      .map((_, i) => i + this.MeshSize * 3);
    this.MeshSize = combinedMesh.mesh.length;

    this.TriangleBuffer = CreateStaticBuffer(
      gl,
      new Float32Array(triangleVertices),
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

    this.gl.drawElements(this.gl.LINES, 48, this.gl.UNSIGNED_SHORT, 0);
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

    for (let i = 0; i < 1; i++) {
      for (let x = 0; x < 5; x++) {
        for (let z = 0; z < 5; z++) {
          this.DrawWireFrameCube(
            CreateTransformations(
              vec3.fromValues(x + 0.5, 0.5, z + 0.5),
              undefined,
              vec3.fromValues(32, 32, 32)
            )
          );
        }
      }
    }

    this.drawMesh(CreateTransformations(vec3.fromValues(0, 0, 0)));
  }
}
