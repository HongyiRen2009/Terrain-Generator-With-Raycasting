import { mat4, vec3 } from "gl-matrix";
import { GlUtils} from "./GlUtils";
import {
  CubeFragmentShaderCode,
  CubeVertexShaderCode,
  MeshFragmentShaderCode,
  MeshVertexShaderCode
} from "./glsl";
import { Shader } from "./Shader";
import { Camera } from "./Camera";
import { meshToVerticesAndIndices } from "../map/cubes_utils";
import { WorldMap } from "../map/Map";
import { DebugMenu } from "../DebugMenu";
import { Light } from "../map/Light";
import { cubeVertices, cubeWireframeIndices } from "../map/geometry";

export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;

  TriangleBuffer: { vertex: WebGLBuffer; indices: WebGLBuffer };
  CubeBuffer: { vertex: WebGLBuffer; indices: WebGLBuffer };
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
    
    let triangleMeshes = GlUtils.genTerrainVertices(this.world);

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
    this.CubeBuffer = GlUtils.CreateStaticBuffer(
      gl,
      new Float32Array(cubeVertices),
      cubeWireframeIndices
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
    GlUtils.updateLights(
      this.gl,
      this.MeshShader.Program!,
      this.world.lights,
      this.camera
    );
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
    const triangleVao = GlUtils.createInterleavedVao(
      this.gl,
      this.TriangleBuffer.vertex,
      this.TriangleBuffer.indices,
      this.MeshShader,
      {
        VertexPosition: { offset: 0,  stride: 36, sizeOverride: 3 },
        VertexNormal:   { offset: 12, stride: 36 },
        VertexColor:    { offset: 24, stride: 36 }
      }
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
    const cubeVao = GlUtils.createInterleavedVao(
      this.gl,
      this.CubeBuffer.vertex,
      this.CubeBuffer.indices,
      this.CubeShader,
      {
        VertexPosition: { offset: 0,  stride: 24, sizeOverride: 3 },
        VertexColor:    { offset: 12, stride: 24 }
      }
    );
    this.gl.bindVertexArray(cubeVao);
    this.gl.drawElements(
      this.gl.LINES,
      24,
      this.gl.UNSIGNED_INT,
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
    const resScaleFactor = 1; 
    
    if (this.debug.debugMode) {
      for (const chunk of this.world.chunks) {
        this.DrawWireFrameCube(
          GlUtils.CreateTransformations(
            vec3.fromValues(chunk.ChunkPosition[0], 0, chunk.ChunkPosition[1]),
            undefined,
            vec3.fromValues(this.world.resolution, this.world.height, this.world.resolution)
          )
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
