import { mat4 } from "gl-matrix";
import { Mesh } from "../../../map/Mesh";
import { WorldObject } from "../../../map/WorldObject";
import { RenderUtils } from "../../../utils/RenderUtils";
import { meshToNonInterleavedVerticesAndIndices } from "../../../map/cubes_utils";
import GeometryVertexShaderSource from "../../glsl/DeferredRendering/Geometry.vert";
import GeometryFragmentShaderSource from "../../glsl/DeferredRendering/Geometry.frag";
export interface VaoInfo {
  vao: WebGLVertexArrayObject;
  indexCount: number;
  modelMatrix: mat4;
}
export class VAOManager {
  private gl: WebGL2RenderingContext;
  private vaoCache: Map<number, VaoInfo>;
  private terrainVAOInfo: VaoInfo | null = null;
  private screenQuadVAOInfo: VaoInfo | null = null;
  private geometryProgram: WebGLProgram | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.vaoCache = new Map();
    this.geometryProgram = RenderUtils.CreateProgram(
      this.gl,
      GeometryVertexShaderSource,
      GeometryFragmentShaderSource
    )!;
    this.initializeScreenQuad();
  }

  createTerrainVAO(triangleMeshes: Mesh[]): void {
    let trianglePositions: number[] = [];
    let triangleNormals: number[] = [];
    let triangleColors: number[] = [];
    let triangleIndices: number[] = [];
    let indexOffset = 0;

    for (let i = 0; i < triangleMeshes.length; i++) {
      const mesh = triangleMeshes[i];
      const vertexData = meshToNonInterleavedVerticesAndIndices(mesh);

      trianglePositions = trianglePositions.concat(
        Array.from(vertexData.positions)
      );
      triangleNormals = triangleNormals.concat(Array.from(vertexData.normals));
      triangleColors = triangleColors.concat(Array.from(vertexData.colors));

      const adjustedIndices = Array.from(vertexData.indices).map(
        (index) => index + indexOffset
      );
      triangleIndices = triangleIndices.concat(adjustedIndices);

      indexOffset += vertexData.positions.length / 3;
    }

    const TerrainMeshSize = triangleIndices.length;

    const TerrainTriangleBuffer = {
      vertex: {
        position: RenderUtils.CreateAttributeBuffer(
          this.gl,
          new Float32Array(trianglePositions)
        ),
        normal: RenderUtils.CreateAttributeBuffer(
          this.gl,
          new Float32Array(triangleNormals)
        ),
        color: RenderUtils.CreateAttributeBuffer(
          this.gl,
          new Float32Array(triangleColors)
        )
      },
      indices: RenderUtils.CreateIndexBuffer(this.gl, triangleIndices)
    };
    const terrainVAO = RenderUtils.createNonInterleavedVao(
      this.gl,
      {
        position: { buffer: TerrainTriangleBuffer.vertex.position, size: 3 },
        normal: { buffer: TerrainTriangleBuffer.vertex.normal, size: 3 },
        color: { buffer: TerrainTriangleBuffer.vertex.color, size: 3 }
      },
      TerrainTriangleBuffer.indices,
      this.geometryProgram!
    );
    this.terrainVAOInfo = {
      vao: terrainVAO,
      indexCount: TerrainMeshSize,
      modelMatrix: mat4.create()
    };
  }

  createWorldObjectVAOs(worldObjects: WorldObject[]): void {
    for (const worldObject of worldObjects) {
      const vao = RenderUtils.createInterleavedVao(
        this.gl,
        worldObject.buffer.vertex,
        worldObject.buffer.indices,
        {
          position: { offset: 0, size: 3, stride: 36 },
          normal: { offset: 12, size: 3, stride: 36 },
          color: { offset: 24, size: 3, stride: 36 }
        },
        this.geometryProgram!
      );
      this.vaoCache.set(worldObject.id, {
        vao,
        indexCount: worldObject.meshSize,
        modelMatrix: worldObject.position
      });
    }
  }

  private initializeScreenQuad(): void {
    const { quadVertices, quadIndices } = require("../../../map/geometry");

    const vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(vao);

    const vbo = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, quadVertices, this.gl.STATIC_DRAW);

    const ebo = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ebo);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      quadIndices,
      this.gl.STATIC_DRAW
    );

    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 20, 0);
    this.gl.enableVertexAttribArray(1);
    this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 20, 12);

    this.gl.bindVertexArray(null);
    this.screenQuadVAOInfo = {
      vao,
      indexCount: quadIndices.length,
      modelMatrix: mat4.create()
    };
  }

  getVaosToRender(): VaoInfo[] {
    const vaosToRender: VaoInfo[] = [];
    if (this.terrainVAOInfo) {
      vaosToRender.push(this.terrainVAOInfo);
    }
    this.vaoCache.forEach((vao) => {
      vaosToRender.push(vao);
    });
    return vaosToRender;
  }

  getScreenQuadVAO(): VaoInfo | null {
    return this.screenQuadVAOInfo;
  }

  dispose(): void {
    if (this.terrainVAOInfo) {
      this.gl.deleteVertexArray(this.terrainVAOInfo.vao);
      this.terrainVAOInfo = null;
    }
    this.vaoCache.forEach((vao) => {
      this.gl.deleteVertexArray(vao);
    });
    this.vaoCache.clear();
  }
}
