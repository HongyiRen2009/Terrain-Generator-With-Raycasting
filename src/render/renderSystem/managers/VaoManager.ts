import { mat4, vec3 } from "gl-matrix";
import { Mesh } from "../../../map/Mesh";
import { WorldObject } from "../../../map/WorldObject";
import { RenderUtils } from "../../../utils/RenderUtils";
import { meshToNonInterleavedVerticesAndIndices } from "../../../map/cubes_utils";
import GeometryVertexShaderSource from "../../glsl/DeferredRendering/Geometry.vert";
import GeometryFragmentShaderSource from "../../glsl/DeferredRendering/Geometry.frag";
import GrassVertexShaderSource from "../../glsl/Grass/Grass.vert";
import GrassFragmentShaderSource from "../../glsl/Grass/Grass.frag";
import e from "express";
import { Color } from "../../../map/terrains";
import { PointLight } from "../../../map/Light";
export interface VaoInfo {
  vao: WebGLVertexArrayObject;
  indexCount: number;
  modelMatrix: mat4;
  isLight?: boolean;
  lightIndex?: number;
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
function packEmissivityToUint8(emissivity: [number, number, number]): number {
  const r = Math.min(3, Math.floor(emissivity[0] * 3)); // 2 bits
  const g = Math.min(3, Math.floor(emissivity[1] * 3)); // 2 bits
  const b = Math.min(3, Math.floor(emissivity[2] * 3)); // 2 bits
  return (b << 4) | (g << 2) | r;
}
export class VAOManager {
  private gl: WebGL2RenderingContext;
  private vaoCache: Map<number, VaoInfo>;
  private terrainVAOInfo: VaoInfo | null = null;
  private screenQuadVAOInfo: VaoInfo | null = null;
  // Keep references to buffers so we can delete them later
  private terrainBuffers: {
    vertex: WebGLBuffer;
    normal: WebGLBuffer;
    color: WebGLBuffer;
    indices: WebGLBuffer;
  } | null = null;
  private screenQuadBuffers: {
    vbo: WebGLBuffer | null;
    ebo: WebGLBuffer | null;
  } | null = null;
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
    //Current placeholders for reflectiveness, metalicity, roughness, add them in the terrain branch
    const reflectivenessPlaceholder = new Array(
      (trianglePositions.length / 3) * 3
    ).fill(0.04); // Low reflectivity for dielectric/non-metallic surfaces
    const metalicityPlaceholder = new Array(
      (trianglePositions.length / 3) * 3
    ).fill(0.0);
    const roughnessPlaceholder = new Array(
      (trianglePositions.length / 3) * 3
    ).fill(0.7); // Medium-high roughness for terrain
    const emissivityPlaceholder = new Array(
      (trianglePositions.length / 3) * 3
    ).fill(packEmissivityToUint8([0.0, 0.0, 0.0]) / 63.0); // Normalized for RGBA8 texture
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
        ),
        reflectiveness: RenderUtils.CreateAttributeBuffer(
          this.gl,
          new Float32Array(reflectivenessPlaceholder)
        ),
        metalicity: RenderUtils.CreateAttributeBuffer(
          this.gl,
          new Float32Array(metalicityPlaceholder)
        ),
        roughness: RenderUtils.CreateAttributeBuffer(
          this.gl,
          new Float32Array(roughnessPlaceholder)
        ),
        emissivity: RenderUtils.CreateAttributeBuffer(
          this.gl,
          new Float32Array(emissivityPlaceholder)
        )
      },
      indices: RenderUtils.CreateIndexBuffer(this.gl, triangleIndices)
    };
    // Save buffers so we can delete them later
    this.terrainBuffers = {
      vertex: TerrainTriangleBuffer.vertex.position,
      normal: TerrainTriangleBuffer.vertex.normal,
      color: TerrainTriangleBuffer.vertex.color,
      indices: TerrainTriangleBuffer.indices
    };
    const terrainVAO = RenderUtils.createNonInterleavedVao(
      this.gl,
      {
        position: { buffer: TerrainTriangleBuffer.vertex.position, size: 3 },
        normal: { buffer: TerrainTriangleBuffer.vertex.normal, size: 3 },
        color: { buffer: TerrainTriangleBuffer.vertex.color, size: 3 },
        reflectiveness: {
          buffer: TerrainTriangleBuffer.vertex.reflectiveness,
          size: 1
        },
        metalicity: {
          buffer: TerrainTriangleBuffer.vertex.metalicity,
          size: 1
        },
        roughness: { buffer: TerrainTriangleBuffer.vertex.roughness, size: 1 },
        emissivity: { buffer: TerrainTriangleBuffer.vertex.emissivity, size: 1 }
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

  createSphericalMesh(radius: number, showColor: Color): Mesh {
    const mesh = new Mesh();
    const subdivisions = 2; // Reduced to 2 (320 tris) for stability

    // Golden ratio for icosahedron
    const phi = (1 + Math.sqrt(5)) / 2;

    // Create initial icosahedron vertices (normalized to unit sphere)
    const initialVertices: vec3[] = [
      vec3.normalize(vec3.create(), vec3.fromValues(-1, phi, 0)),
      vec3.normalize(vec3.create(), vec3.fromValues(1, phi, 0)),
      vec3.normalize(vec3.create(), vec3.fromValues(-1, -phi, 0)),
      vec3.normalize(vec3.create(), vec3.fromValues(1, -phi, 0)),
      vec3.normalize(vec3.create(), vec3.fromValues(0, -1, phi)),
      vec3.normalize(vec3.create(), vec3.fromValues(0, 1, phi)),
      vec3.normalize(vec3.create(), vec3.fromValues(0, -1, -phi)),
      vec3.normalize(vec3.create(), vec3.fromValues(0, 1, -phi)),
      vec3.normalize(vec3.create(), vec3.fromValues(phi, 0, -1)),
      vec3.normalize(vec3.create(), vec3.fromValues(phi, 0, 1)),
      vec3.normalize(vec3.create(), vec3.fromValues(-phi, 0, -1)),
      vec3.normalize(vec3.create(), vec3.fromValues(-phi, 0, 1))
    ];

    // Icosahedron faces (20 triangles)
    const faces: [number, number, number][] = [
      // 5 faces around point 0
      [0, 11, 5],
      [0, 5, 1],
      [0, 1, 7],
      [0, 7, 10],
      [0, 10, 11],
      // 5 adjacent faces
      [1, 5, 9],
      [5, 11, 4],
      [11, 10, 2],
      [10, 7, 6],
      [7, 1, 8],
      // 5 faces around point 3
      [3, 9, 4],
      [3, 4, 2],
      [3, 2, 6],
      [3, 6, 8],
      [3, 8, 9],
      // 5 adjacent faces
      [4, 9, 5],
      [2, 4, 11],
      [6, 2, 10],
      [8, 6, 7],
      [9, 8, 1]
    ];

    // Midpoint cache for subdivision
    const midpointCache = new Map<string, number>();
    let vertices = [...initialVertices];

    const getMidpoint = (v1: number, v2: number): number => {
      const key = v1 < v2 ? `${v1}_${v2}` : `${v2}_${v1}`;
      if (midpointCache.has(key)) {
        return midpointCache.get(key)!;
      }

      const p1 = vertices[v1];
      const p2 = vertices[v2];
      const mid = vec3.create();
      vec3.add(mid, p1, p2);
      vec3.scale(mid, mid, 0.5);
      vec3.normalize(mid, mid); // Project onto unit sphere

      const index = vertices.length;
      vertices.push(mid);
      midpointCache.set(key, index);
      return index;
    };

    let currentFaces = faces;

    // Subdivide faces
    for (let i = 0; i < subdivisions; i++) {
      const newFaces: [number, number, number][] = [];
      for (const [v1, v2, v3] of currentFaces) {
        const a = getMidpoint(v1, v2);
        const b = getMidpoint(v2, v3);
        const c = getMidpoint(v3, v1);

        newFaces.push([v1, a, c]);
        newFaces.push([v2, b, a]);
        newFaces.push([v3, c, b]);
        newFaces.push([a, b, c]);
      }
      currentFaces = newFaces;
    }

    // Create triangles with the given radius
    for (const [i1, i2, i3] of currentFaces) {
      const v1 = vec3.scale(vec3.create(), vertices[i1], radius);
      const v2 = vec3.scale(vec3.create(), vertices[i2], radius);
      const v3 = vec3.scale(vec3.create(), vertices[i3], radius);

      // For a sphere, vertex normals are the normalized positions (pointing outward)
      const n1 = vec3.clone(vertices[i1]);
      const n2 = vec3.clone(vertices[i2]);
      const n3 = vec3.clone(vertices[i3]);

      const triangle: [vec3, vec3, vec3] = [v1, v2, v3];
      const normal: [vec3, vec3, vec3] = [n1, n2, n3];

      // Add triangle with default terrain type 0
      mesh.addTriangle(triangle, normal, [0, 0, 0]);
    }

    return mesh;
  }

  createPointLightVAOs(pointLights: PointLight[]): void {
    // Clear any existing light VAOs from cache
    const keysToDelete: number[] = [];
    this.vaoCache.forEach((vaoInfo, key) => {
      if (vaoInfo.isLight) {
        this.gl.deleteVertexArray(vaoInfo.vao);
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.vaoCache.delete(key));

    // Create a sphere VAO for each point light
    for (let i = 0; i < pointLights.length; i++) {
      const light = pointLights[i];
      const showColor = light.showColor || light.color;

      // Create icosphere mesh for this light (using spheres again)
      const sphereMesh = this.createSphericalMesh(light.radius, showColor);

      // Flatten mesh to simple arrays
      const triangles = sphereMesh.getVertices();
      const triNormals = sphereMesh.getNormals();
      const numVerts = triangles.length * 3;

      const positions = new Float32Array(numVerts * 3);
      const normals = new Float32Array(numVerts * 3);
      const colors = new Float32Array(numVerts * 3);
      const indices = new Uint32Array(numVerts);

      const colorVec = showColor.createVec3();
      // Standard color for albedo
      const cr = colorVec[0];
      const cg = colorVec[1];
      const cb = colorVec[2];

      // Pack emissivity to make the light sphere glow with its color
      // Normalize to 0-1 range for RGBA8 texture storage (max packed value is 63)
      const packedEmissivity = packEmissivityToUint8([cr, cg, cb]) / 63.0;

      // Material attributes for each vertex
      const reflectiveness = new Float32Array(numVerts);
      const metalicity = new Float32Array(numVerts);
      const roughness = new Float32Array(numVerts);
      const emissivity = new Float32Array(numVerts);

      for (let j = 0; j < triangles.length; j++) {
        const tri = triangles[j];
        const norm = triNormals[j];

        for (let k = 0; k < 3; k++) {
          const idx = j * 3 + k;

          // Position
          positions[idx * 3 + 0] = tri[k][0];
          positions[idx * 3 + 1] = tri[k][1];
          positions[idx * 3 + 2] = tri[k][2];

          // Normal
          normals[idx * 3 + 0] = norm[k][0];
          normals[idx * 3 + 1] = norm[k][1];
          normals[idx * 3 + 2] = norm[k][2];

          // Color
          colors[idx * 3 + 0] = cr;
          colors[idx * 3 + 1] = cg;
          colors[idx * 3 + 2] = cb;

          // Material attributes - default values for light spheres
          reflectiveness[idx] = 0.04; // Low reflectivity (dielectric), allows albedo color to show
          metalicity[idx] = 0.0; // Non-metallic
          roughness[idx] = 0.8; // Higher roughness for matte look
          emissivity[idx] = packedEmissivity; // Glow with the light's color

          indices[idx] = idx;
        }
      }

      // Create buffers
      const lightBuffers = {
        position: {
          buffer: RenderUtils.CreateAttributeBuffer(this.gl, positions),
          size: 3
        },
        normal: {
          buffer: RenderUtils.CreateAttributeBuffer(this.gl, normals),
          size: 3
        },
        color: {
          buffer: RenderUtils.CreateAttributeBuffer(this.gl, colors),
          size: 3
        },
        reflectiveness: {
          buffer: RenderUtils.CreateAttributeBuffer(this.gl, reflectiveness),
          size: 1
        },
        metalicity: {
          buffer: RenderUtils.CreateAttributeBuffer(this.gl, metalicity),
          size: 1
        },
        roughness: {
          buffer: RenderUtils.CreateAttributeBuffer(this.gl, roughness),
          size: 1
        },
        emissivity: {
          buffer: RenderUtils.CreateAttributeBuffer(this.gl, emissivity),
          size: 1
        }
      };

      const indexBuffer = RenderUtils.CreateIndexBuffer(
        this.gl,
        Array.from(indices) // RenderUtils expects number[]
      );

      // Create VAO with Non-Interleaved layout (safer)
      const lightVAO = RenderUtils.createNonInterleavedVao(
        this.gl,
        lightBuffers,
        indexBuffer,
        this.geometryProgram!
      );

      // Create model matrix with translation to light position
      const modelMatrix = mat4.create();
      mat4.translate(modelMatrix, modelMatrix, light.position);

      // Use a unique ID for light VAOs (negative to avoid collision with world objects)
      const lightId = -(i + 1);
      this.vaoCache.set(lightId, {
        vao: lightVAO,
        indexCount: indices.length,
        modelMatrix: modelMatrix,
        isLight: true,
        lightIndex: i
      });
    }
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
    // store quad buffers for cleanup
    this.screenQuadBuffers = { vbo, ebo };

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

  /**
   * Remove VAO for a world object and delete the vertex array.
   */
  public removeWorldObjectVAO(id: number): void {
    const info = this.vaoCache.get(id);
    if (info) {
      this.gl.deleteVertexArray(info.vao);
      this.vaoCache.delete(id);
    }
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
      // vao is VaoInfo
      this.gl.deleteVertexArray(vao.vao);
    });
    this.vaoCache.clear();
    // delete terrain attribute/index buffers if present
    if (this.terrainBuffers) {
      if (this.terrainBuffers.vertex)
        this.gl.deleteBuffer(this.terrainBuffers.vertex);
      if (this.terrainBuffers.normal)
        this.gl.deleteBuffer(this.terrainBuffers.normal);
      if (this.terrainBuffers.color)
        this.gl.deleteBuffer(this.terrainBuffers.color);
      if (this.terrainBuffers.indices)
        this.gl.deleteBuffer(this.terrainBuffers.indices);
      this.terrainBuffers = null;
    }
    // delete screen quad buffers
    if (this.screenQuadBuffers) {
      if (this.screenQuadBuffers.vbo)
        this.gl.deleteBuffer(this.screenQuadBuffers.vbo);
      if (this.screenQuadBuffers.ebo)
        this.gl.deleteBuffer(this.screenQuadBuffers.ebo);
      this.screenQuadBuffers = null;
    }

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
export class GrassManager {
  private gl: WebGL2RenderingContext;
  private grassProgram: WebGLProgram;
  constructor(gl: WebGL2RenderingContext, grassProgram: WebGLProgram) {
    this.gl = gl;
    this.grassProgram = grassProgram;
  }
}
