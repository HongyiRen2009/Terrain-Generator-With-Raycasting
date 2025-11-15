import { mat4, vec3 } from "gl-matrix";
import { Mesh } from "../../../map/Mesh";
import { WorldObject } from "../../../map/WorldObject";
import { RenderUtils } from "../../../utils/RenderUtils";
import { meshToNonInterleavedVerticesAndIndices } from "../../../map/cubes_utils";
import GeometryVertexShaderSource from "../../glsl/DeferredRendering/Geometry.vert";
import GeometryFragmentShaderSource from "../../glsl/DeferredRendering/Geometry.frag";
import GrassVertexShaderSource from "../../glsl/Grass/Grass.vert";
import GrassFragmentShaderSource from "../../glsl/Grass/Grass.frag";
export interface VaoInfo {
  vao: WebGLVertexArrayObject;
  indexCount: number;
  modelMatrix: mat4;
}

interface LODLevel {
  vao: WebGLVertexArrayObject;
  indexCount: number;
  segments: number;
  maxDistance: number;
}

export interface GrassVAOInfo {
  lodLevels: LODLevel[];
  numInstances: number;
}

export class VAOManager {
  private gl: WebGL2RenderingContext;
  private vaoCache: Map<number, VaoInfo>;
  private terrainVAOInfo: VaoInfo | null = null;
  private screenQuadVAOInfo: VaoInfo | null = null;
  private geometryProgram: WebGLProgram | null = null;
  private grassProgram: WebGLProgram | null = null;
  private grassVAOInfo: GrassVAOInfo | null = null;
  private instanceVBO: WebGLBuffer | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.vaoCache = new Map();
    this.geometryProgram = RenderUtils.CreateProgram(
      this.gl,
      GeometryVertexShaderSource,
      GeometryFragmentShaderSource
    )!;
    this.grassProgram = RenderUtils.CreateProgram(
      this.gl,
      GrassVertexShaderSource,
      GrassFragmentShaderSource
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
    //Currently grass can spawn on all terrain, when terrain is implemented, this needs to be changed
    this.createGrassVAO(
      new Float32Array(trianglePositions),
      new Float32Array(triangleNormals),
      triangleIndices,
      this.grassProgram!
    );
  }

  createGrassVAO(
    terrainVertices: Float32Array,
    terrainNormals: Float32Array,
    triangleIndices: number[],
    grassProgram: WebGLProgram
  ): void {
    const numBlades = 500000;
    const grassThickness = 0.1;
    const numTriangles = triangleIndices.length / 3;
    const instanceData = new Float32Array(numBlades * 5); // basePos(3) + randomLean(1) + rotAngle(1)
    let bladesPlaced = 0;

    for (let i = 0; i < numBlades; i++) {
      // Pick a random triangle
      const triIdx = Math.floor(Math.random() * numTriangles) * 3;
      const i0 = triangleIndices[triIdx + 0] * 3;
      const i1 = triangleIndices[triIdx + 1] * 3;
      const i2 = triangleIndices[triIdx + 2] * 3;

      // Random barycentric coordinates
      let u = Math.random();
      let v = Math.random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      const w = 1 - u - v;

      // Interpolate position
      const x =
        terrainVertices[i0] * u +
        terrainVertices[i1] * v +
        terrainVertices[i2] * w;
      const y =
        terrainVertices[i0 + 1] * u +
        terrainVertices[i1 + 1] * v +
        terrainVertices[i2 + 1] * w;
      const z =
        terrainVertices[i0 + 2] * u +
        terrainVertices[i1 + 2] * v +
        terrainVertices[i2 + 2] * w;

      // Interpolate normal
      const nx =
        terrainNormals[i0] * u +
        terrainNormals[i1] * v +
        terrainNormals[i2] * w;
      const ny =
        terrainNormals[i0 + 1] * u +
        terrainNormals[i1 + 1] * v +
        terrainNormals[i2 + 1] * w;
      const nz =
        terrainNormals[i0 + 2] * u +
        terrainNormals[i1 + 2] * v +
        terrainNormals[i2 + 2] * w;

      // Only place grass if normal is not too steep
      if (ny < 0.7) continue;

      const offset = bladesPlaced * 5;
      instanceData[offset + 0] = x;
      instanceData[offset + 1] = y;
      instanceData[offset + 2] = z;
      instanceData[offset + 3] = (Math.random() - 0.5) * 0.5; // Random lean
      instanceData[offset + 4] = Math.random() * Math.PI * 2; // Rotation angle

      bladesPlaced++;
      if (bladesPlaced >= numBlades) break;
    }

    // Create instance VBO
    this.instanceVBO = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceVBO);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, instanceData, this.gl.STATIC_DRAW);

    // Generate LOD levels
    const lodLevels = this.generateGrassLODLevels(grassThickness, grassProgram);

    this.grassVAOInfo = {
      lodLevels,
      numInstances: bladesPlaced
    };
  }

  private generateGrassLODLevels(
    grassThickness: number,
    grassProgram: WebGLProgram
  ): LODLevel[] {
    const defaultHeight = 1;
    const defaultWidth = grassThickness;
    const tipLength = 0.1;

    const lodConfigs = [
      { segments: 6, maxDistance: 20 },
      { segments: 4, maxDistance: 40 },
      { segments: 2, maxDistance: 80 },
      { segments: 1, maxDistance: Infinity }
    ];

    const lodLevels: LODLevel[] = [];

    for (const config of lodConfigs) {
      const { vertices, indices } = this.generateGrassBladeMesh(
        config.segments,
        defaultHeight,
        defaultWidth,
        tipLength
      );

      const vao = this.gl.createVertexArray()!;
      this.gl.bindVertexArray(vao);

      // Vertex buffer (local positions only)
      const vbo = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

      // Local position attribute (location 0)
      this.gl.enableVertexAttribArray(0);
      this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 12, 0);

      // Instance buffer
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceVBO);

      // Base position (location 1)
      this.gl.enableVertexAttribArray(1);
      this.gl.vertexAttribPointer(1, 3, this.gl.FLOAT, false, 20, 0);
      this.gl.vertexAttribDivisor(1, 1);

      // Random lean (location 2)
      this.gl.enableVertexAttribArray(2);
      this.gl.vertexAttribPointer(2, 1, this.gl.FLOAT, false, 20, 12);
      this.gl.vertexAttribDivisor(2, 1);

      // Rotation angle (location 3)
      this.gl.enableVertexAttribArray(3);
      this.gl.vertexAttribPointer(3, 1, this.gl.FLOAT, false, 20, 16);
      this.gl.vertexAttribDivisor(3, 1);

      // Index buffer
      const ebo = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ebo);
      this.gl.bufferData(
        this.gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        this.gl.STATIC_DRAW
      );

      this.gl.bindVertexArray(null);

      lodLevels.push({
        vao,
        indexCount: indices.length,
        segments: config.segments,
        maxDistance: config.maxDistance
      });
    }

    return lodLevels;
  }

  private generateGrassBladeMesh(
    segments: number,
    height: number,
    width: number,
    tipLength: number
  ) {
    const vertsPerQuad = (segments + 1) * 2 + 1;
    const vertsPerBlade = vertsPerQuad * 2;
    const vertices = new Float32Array(vertsPerBlade * 3); // Only positions
    const indices: number[] = [];

    let vertexOffset = 0;

    for (let quadIdx = 0; quadIdx < 2; quadIdx++) {
      const angle = (quadIdx * Math.PI) / 2;

      for (let s = 0; s <= segments; s++) {
        for (const side of [-1, 1] as const) {
          const t = s / segments;
          const y = t * height;
          const w = width * (1 - t);
          const x = Math.cos(angle) * w * side;
          const z = Math.sin(angle) * w * side;

          const vertexIdx = vertexOffset + s * 2 + (side === -1 ? 0 : 1);
          const offset = vertexIdx * 3;

          vertices.set([x, y, z], offset);
        }
      }

      const tipIdx = vertexOffset + (segments + 1) * 2;
      const offset = tipIdx * 3;
      vertices.set([0, height + tipLength, 0], offset);

      for (let s = 0; s < segments; s++) {
        const i0 = vertexOffset + s * 2;
        const i1 = vertexOffset + s * 2 + 1;
        const i2 = vertexOffset + (s + 1) * 2;
        const i3 = vertexOffset + (s + 1) * 2 + 1;

        indices.push(i0, i2, i1, i1, i2, i3);
        indices.push(i1, i2, i0, i3, i2, i1);
      }

      const lastLeft = vertexOffset + segments * 2;
      const lastRight = vertexOffset + segments * 2 + 1;
      const tipVertex = vertexOffset + segments * 2 + 2;

      indices.push(lastLeft, tipVertex, lastRight);
      indices.push(lastRight, tipVertex, lastLeft);

      vertexOffset += vertsPerQuad;
    }

    return { vertices, indices };
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

  getGrassVAO(): GrassVAOInfo | null {
    return this.grassVAOInfo;
  }

  dispose(): void {
    if (this.terrainVAOInfo) {
      this.gl.deleteVertexArray(this.terrainVAOInfo.vao);
      this.terrainVAOInfo = null;
    }
    this.vaoCache.forEach((vao) => {
      this.gl.deleteVertexArray(vao.vao);
    });
    this.vaoCache.clear();

    if (this.grassVAOInfo) {
      for (const lod of this.grassVAOInfo.lodLevels) {
        this.gl.deleteVertexArray(lod.vao);
      }
      this.grassVAOInfo = null;
    }
    if (this.instanceVBO) {
      this.gl.deleteBuffer(this.instanceVBO);
      this.instanceVBO = null;
    }
  }
}
