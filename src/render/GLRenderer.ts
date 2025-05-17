import { glMatrix, mat4, vec2, vec3 } from "gl-matrix";
import { CubeVertices, WirFrameCubeIndices } from "../map/geometry";
import { GlUtils } from "./GlUtils";
import { VertexShaderCode, FragmentShaderCode, Shader } from "./glsl";
import { Camera } from "./Camera";
import { calculateVertexNormals, meshToVertices } from "../map/cubes_utils";
import { WorldMap } from "../map/Map";
import { Mesh } from "../map/Mesh";
import { DebugMenu } from "../DebugMenu";

export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;

  CubeBuffer: { position: WebGLBuffer; indices: WebGLBuffer };
  TriangleBuffer: { position: WebGLBuffer; indices: WebGLBuffer };

  MeshSize: number = 0;

  matView: mat4;
  matProj: mat4;
  matViewProj: mat4;

  debug: DebugMenu;

  world: WorldMap;

  MeshShader: Shader;
  constructor(
    gl: WebGL2RenderingContext,
    canvas: HTMLCanvasElement,
    camera: Camera,
    debug: DebugMenu,
    world: WorldMap
  ) {
    this.gl = gl;
    this.canvas = canvas;
    this.camera = camera;
    this.debug = debug;
    this.world = world;

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // Ensures closer objects are drawn in front

    // These coordinates are in clip space, to see a visualization, go to https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection
    const CubeCPUBuffer = new Float32Array(CubeVertices);
    this.CubeBuffer = GlUtils.CreateStaticBuffer(
      gl,
      CubeCPUBuffer,
      WirFrameCubeIndices
    );
    let triangleVertices: number[] = [];
    const triangleMeshes: Mesh[] = []; // Store all chunks' meshes
    const vertexNormals = [];

    for (const chunk of this.world.chunks) {
      const triangleMesh = chunk.CreateMarchingCubes();
      triangleMeshes.push(triangleMesh); // Store the chunk's mesh
      vertexNormals.push(calculateVertexNormals(triangleMesh));
    }
    for (let i = 0; i < triangleMeshes.length; i++) {
      const Mesh = triangleMeshes[i];
      const ChunkPosition = this.world.chunks[i].ChunkPosition;
      triangleVertices = triangleVertices.concat(
        Array.from(meshToVertices(Mesh, vertexNormals[i], ChunkPosition))
      );
    }
    this.MeshSize = triangleMeshes.reduce(
      (acc, mesh) => acc + mesh.mesh.length,
      0
    );
    // since we don't reuse any vertices right now, each index is unique
    const triangleIndices = Array(this.MeshSize * 3)
      .fill(0)
      .map((_, i) => i + this.MeshSize * 3);

    this.TriangleBuffer = GlUtils.CreateStaticBuffer(
      gl,
      new Float32Array(triangleVertices),
      triangleIndices
    );
    this.MeshShader = new Shader(gl, VertexShaderCode, FragmentShaderCode);

    this.matView = mat4.create(); //Identity matrices
    this.matProj = mat4.create();
    this.matViewProj = mat4.create();
  }

  drawMesh(TransformationMatrix: mat4) {
    this.gl.uniformMatrix4fv(
      this.MeshShader.VertexUniforms["MatrixTransform"].location,
      false,
      TransformationMatrix
    );
    this.gl.uniformMatrix4fv(
      this.MeshShader.VertexUniforms["matViewProj"].location,
      false,
      this.matViewProj
    );
    //Create vertice array object
    const triangleVao = GlUtils.create3dPosColorInterleavedVao(
      this.gl,
      this.TriangleBuffer.position,
      this.TriangleBuffer.indices,
      this.MeshShader.VertexInputs["VertexPosition"].location,
      this.MeshShader.VertexInputs["VertexColor"].location
    );

    this.gl.bindVertexArray(triangleVao);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.MeshSize * 3);
    this.gl.bindVertexArray(null);
  }
  DrawWireFrameCube(TransformationMatrix: mat4) {
    this.gl.uniformMatrix4fv(
      this.MeshShader.VertexUniforms["MatrixTransform"].location,
      false,
      TransformationMatrix
    );
    this.gl.uniformMatrix4fv(
      this.MeshShader.VertexUniforms["matViewProj"].location,
      false,
      this.matViewProj
    );
    //Create vertice array object
    const cubeVao = GlUtils.create3dPosColorInterleavedVao(
      this.gl,
      this.CubeBuffer!.position,
      this.CubeBuffer!.indices,
      this.MeshShader.VertexInputs["VertexPosition"].location,
      this.MeshShader.VertexInputs["VertexColor"].location
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
            GlUtils.CreateTransformations(
              vec3.fromValues(x + 0.5, 0.5, z + 0.5),
              undefined,
              vec3.fromValues(32, 32, 32)
            )
          );
        }
      }
    }

    this.drawMesh(GlUtils.CreateTransformations(vec3.fromValues(0, 0, 0)));
  }
}
