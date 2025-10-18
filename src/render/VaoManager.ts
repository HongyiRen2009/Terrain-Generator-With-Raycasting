import { mat4 } from "gl-matrix";
import { Mesh } from "../map/Mesh";
import { WorldObject } from "../map/WorldObject";
import { GlUtils } from "./GlUtils";
import { meshToNonInterleavedVerticesAndIndices } from "../map/cubes_utils";
export interface VaoInfo {
  vao: WebGLVertexArrayObject;
  indexCount: number;
  modelMatrix: mat4;
}
export class VAOManager {
  private gl: WebGL2RenderingContext;
  private vaoCache: Map<number, VaoInfo>;
  private terrainVAOInfo: VaoInfo | null = null;
  private program: WebGLProgram | null = null;
  constructor(gl: WebGL2RenderingContext, program: WebGLProgram) {
    this.gl = gl;
    this.program = program;
    this.vaoCache = new Map();
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
        position: GlUtils.CreateAttributeBuffer(
          this.gl,
          new Float32Array(trianglePositions)
        ),
        normal: GlUtils.CreateAttributeBuffer(
          this.gl,
          new Float32Array(triangleNormals)
        ),
        color: GlUtils.CreateAttributeBuffer(
          this.gl,
          new Float32Array(triangleColors)
        )
      },
      indices: GlUtils.CreateIndexBuffer(this.gl, triangleIndices)
    };
    const terrainVAO = GlUtils.createNonInterleavedVao(
      this.gl,
      {
        position: { buffer: TerrainTriangleBuffer.vertex.position, size: 3 },
        normal: { buffer: TerrainTriangleBuffer.vertex.normal, size: 3 },
        color: { buffer: TerrainTriangleBuffer.vertex.color, size: 3 }
      },
      TerrainTriangleBuffer.indices,
      this.program!
    );
    this.terrainVAOInfo = {
      vao: terrainVAO,
      indexCount: TerrainMeshSize,
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
  createWorldObjectVAOs(worldObjects: WorldObject[]): void {
    for (const worldObject of worldObjects) {
      const vao = GlUtils.createInterleavedVao(
        this.gl,
        worldObject.buffer.vertex,
        worldObject.buffer.indices,
        {
          position: { offset: 0, size: 3, stride: 36 },
          normal: { offset: 12, size: 3, stride: 36 },
          color: { offset: 24, size: 3, stride: 36 }
        },
        this.program!
      );
      this.vaoCache.set(worldObject.id, {
        vao,
        indexCount: worldObject.meshSize,
        modelMatrix: worldObject.position
      });
    }
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
