import { mat4, vec3 } from "gl-matrix";
import { GlUtils, WireFrameCube } from "./GlUtils";
import {
  CubeFragmentShaderCode,
  CubeVertexShaderCode,
  MeshFragmentShaderCode,
  MeshVertexShaderCode,
  Shader
} from "./glsl";
import { Camera } from "./Camera";
import { meshToVerticesAndIndices } from "../map/cubes_utils";
import { WorldMap } from "../map/Map";
import { DebugMenu } from "../DebugMenu";

export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;

  WireFrameCubes: WireFrameCube[];
  TriangleBuffer: { position: WebGLBuffer; indices: WebGLBuffer };

  MeshSize: number = 0;

  matViewProj: mat4;

  debug: DebugMenu;

  world: WorldMap;

  MeshShader: Shader;
  CubeShader: Shader;
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
    let triangleVertices: number[] = [];
    let triangleIndices: number[] = [];
    let indexOffset = 0;
    this.WireFrameCubes = [];

    const out = GlUtils.genTerrainVertices(this.world);
    let triangleMeshes = out.triangleMeshes;
    this.WireFrameCubes.push(...out.WireFrameCubes);

    for (let i = 0; i < triangleMeshes.length; i++) {
      const Mesh = triangleMeshes[i];
      const vertexData = meshToVerticesAndIndices(Mesh);

      // Add vertices
      triangleVertices = triangleVertices.concat(
        Array.from(vertexData.vertices)
      );

      // Add indices with offset
      const adjustedIndices = Array.from(vertexData.indices).map(
        (index) => index + indexOffset
      );
      triangleIndices = triangleIndices.concat(adjustedIndices);

      // Update offset for next chunk
      indexOffset += vertexData.vertices.length / 9; // 9 components per vertex
    }
    this.MeshSize = triangleIndices.length;

    this.TriangleBuffer = GlUtils.CreateStaticBuffer(
      gl,
      new Float32Array(triangleVertices),
      triangleIndices
    );

    this.CubeShader = new Shader(
      gl,
      CubeVertexShaderCode,
      CubeFragmentShaderCode
    );
    this.MeshShader = new Shader(
      gl,
      MeshVertexShaderCode,
      MeshFragmentShaderCode
    );

    this.matViewProj = mat4.create();
  }

  drawMesh(TransformationMatrix: mat4) {
    this.gl.useProgram(this.MeshShader.Program!);
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
      this.MeshShader.VertexInputs["VertexColor"].location,
      this.MeshShader.VertexInputs["VertexNormal"].location
    );

    this.gl.bindVertexArray(triangleVao);

    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.MeshSize,
      this.gl.UNSIGNED_INT,
      0
    );
    this.gl.bindVertexArray(null);
  }
  DrawWireFrameCube(
    TransformationMatrix: mat4,
    cube: {
      positions: Float32Array<ArrayBuffer>;
      colors: Float32Array<ArrayBuffer>;
      indices: Uint16Array<ArrayBuffer>;
    }
  ) {
    this.gl.useProgram(this.CubeShader.Program!);
    this.gl.uniformMatrix4fv(
      this.CubeShader.VertexUniforms["MatrixTransform"].location,
      false,
      TransformationMatrix
    );
    this.gl.uniformMatrix4fv(
      this.CubeShader.VertexUniforms["matViewProj"].location,
      false,
      this.matViewProj
    );
    const cubeVao = GlUtils.createCubeVao(this.gl, this.CubeShader, cube);
    this.gl.bindVertexArray(cubeVao);

    this.gl.drawElements(
      this.gl.LINES,
      cube.indices.length,
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
    this.matViewProj = this.camera.calculateProjectionMatrix(
      this.canvas.width,
      this.canvas.height
    );
    const resScaleFactor = 1; // Want things to be smaller decrease this number
    if (this.debug.debugMode) {
      for (const cube of this.WireFrameCubes) {
        this.DrawWireFrameCube(
          GlUtils.CreateTransformations(
            undefined,
            undefined,
            vec3.fromValues(resScaleFactor, resScaleFactor, resScaleFactor)
          ),
          cube
        );
      }
    }
    this.drawMesh(
      GlUtils.CreateTransformations(
        vec3.fromValues(0, 0, 0),
        vec3.fromValues(0, 0, 0),
        vec3.fromValues(resScaleFactor, resScaleFactor, resScaleFactor)
      )
    );
  }
}
