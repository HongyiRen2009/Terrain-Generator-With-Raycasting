import { mat4, vec3 } from "gl-matrix";
import { GlUtils } from "./GlUtils";
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
import { cubeVertices, cubeWireframeIndices } from "../map/geometry";
import { Mesh } from "../map/Mesh";
import { WorldObject } from "../map/WorldObject";

export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;

  TerrainTriangleBuffer: { vertex: WebGLBuffer; indices: WebGLBuffer } | null =
    null;
  CubeBuffer: { vertex: WebGLBuffer; indices: WebGLBuffer } | null = null;
  TerrainMeshSize: number = 0;

  matViewProj: mat4;

  debug: DebugMenu;

  world: WorldMap;

  TerrainMeshShader: Shader;
  terrainVAO: WebGLVertexArrayObject | null = null;

  WireframeCubeShader: Shader;
  wireframeCubeVAO: WebGLVertexArrayObject | null = null;

  worldObjectVAOs: Map<number, WebGLVertexArrayObject> = new Map();

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
    this.WireframeCubeShader = new Shader(
      gl,
      CubeVertexShaderCode,
      CubeFragmentShaderCode
    );
    this.TerrainMeshShader = new Shader(
      gl,
      MeshVertexShaderCode,
      MeshFragmentShaderCode
    );

    this.matViewProj = mat4.create();
  }
  GenerateTriangleBuffer(triangleMeshes: Mesh[]) {
    // These coordinates are in clip space, to see a visualization, go to https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection
    let triangleVertices: number[] = [];
    let triangleIndices: number[] = [];
    let indexOffset = 0;

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
    this.TerrainMeshSize = triangleIndices.length;

    this.TerrainTriangleBuffer = GlUtils.CreateStaticBuffer(
      this.gl,
      new Float32Array(triangleVertices),
      triangleIndices
    );
    this.CubeBuffer = GlUtils.CreateStaticBuffer(
      this.gl,
      new Float32Array(cubeVertices),
      cubeWireframeIndices
    );

    this.WireframeCubeShader = new Shader(
      this.gl,
      CubeVertexShaderCode,
      CubeFragmentShaderCode
    );
    this.TerrainMeshShader = new Shader(
      this.gl,
      MeshVertexShaderCode,
      MeshFragmentShaderCode
    );

    this.matViewProj = mat4.create();
  }
  drawTerrain(TransformationMatrix: mat4) {
    this.gl.useProgram(this.TerrainMeshShader.Program!);
    GlUtils.updateLights(
      this.gl,
      this.TerrainMeshShader.Program!,
      this.world.lights,
      this.camera
    );
    this.gl.uniformMatrix4fv(
      this.TerrainMeshShader.VertexUniforms["MatrixTransform"].location,
      false,
      TransformationMatrix
    );
    this.gl.uniformMatrix4fv(
      this.TerrainMeshShader.VertexUniforms["matViewProj"].location,
      false,
      this.matViewProj
    );

    //Create vertice array object
    if (!this.TerrainTriangleBuffer) {
      console.error("TriangleBuffer not initialized.");
      return;
    }

    if (!this.terrainVAO) {
      this.terrainVAO = GlUtils.createInterleavedVao(
        this.gl,
        this.TerrainTriangleBuffer.vertex,
        this.TerrainTriangleBuffer.indices,
        this.TerrainMeshShader,
        {
          VertexPosition: { offset: 0, stride: 36, sizeOverride: 3 },
          VertexNormal: { offset: 12, stride: 36 },
          VertexColor: { offset: 24, stride: 36 }
        }
      );
    }

    this.gl.bindVertexArray(this.terrainVAO);

    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.TerrainMeshSize,
      this.gl.UNSIGNED_INT,
      0
    );
    this.gl.bindVertexArray(null);
  }
  DrawWireFrameCube(TransformationMatrix: mat4) {
    this.gl.useProgram(this.WireframeCubeShader.Program!);
    this.gl.uniformMatrix4fv(
      this.WireframeCubeShader.VertexUniforms["MatrixTransform"].location,
      false,
      TransformationMatrix
    );
    this.gl.uniformMatrix4fv(
      this.WireframeCubeShader.VertexUniforms["matViewProj"].location,
      false,
      this.matViewProj
    );

    if (!this.CubeBuffer) throw new Error("CubeBuffer not initialized.");

    if (!this.wireframeCubeVAO) {
      this.wireframeCubeVAO = GlUtils.createInterleavedVao(
        this.gl,
        this.CubeBuffer.vertex,
        this.CubeBuffer.indices,
        this.WireframeCubeShader,
        {
          VertexPosition: { offset: 0, stride: 24, sizeOverride: 3 },
          VertexColor: { offset: 12, stride: 24 }
        }
      );
    }

    this.gl.bindVertexArray(this.wireframeCubeVAO);
    this.gl.drawElements(this.gl.LINES, 24, this.gl.UNSIGNED_INT, 0);
    this.gl.bindVertexArray(null);
  }

  drawWorldObject(obj: WorldObject) {
    // for now, just use the terrain mesh
    this.gl.useProgram(this.TerrainMeshShader.Program!);
    this.gl.uniformMatrix4fv(
      obj.shader.VertexUniforms["MatrixTransform"].location,
      false,
      obj.position
    );
    this.gl.uniformMatrix4fv(
      obj.shader.VertexUniforms["matViewProj"].location,
      false,
      this.matViewProj
    );

    // TODO: vao should be per mesh, not per object
    // Do we need to have some sort of meshid instead of objectid?
    if (!this.worldObjectVAOs.has(obj.id)) {
      const vao = GlUtils.createInterleavedVao(
        this.gl,
        obj.buffer.vertex,
        obj.buffer.indices,
        obj.shader,
        {
          VertexPosition: { offset: 0, stride: 36, sizeOverride: 3 },
          VertexNormal: { offset: 12, stride: 36 },
          VertexColor: { offset: 24, stride: 36 }
        }
      );
      this.worldObjectVAOs.set(obj.id, vao);
    }

    this.gl.bindVertexArray(this.worldObjectVAOs.get(obj.id)!);
    this.gl.drawElements(
      this.gl.TRIANGLES,
      obj.meshSize,
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
            vec3.fromValues(
              this.world.resolution,
              this.world.height,
              this.world.resolution
            )
          )
        );
      }
    }

    for (const object of this.world.worldObjects) {
      this.drawWorldObject(object);
    }

    this.drawTerrain(
      GlUtils.CreateTransformations(
        vec3.fromValues(0, 0, 0),
        vec3.fromValues(0, 0, 0),
        vec3.fromValues(resScaleFactor, resScaleFactor, resScaleFactor)
      )
    );
  }
}
