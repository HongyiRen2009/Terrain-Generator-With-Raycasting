//Wrapper classes (will write stuff later)
import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { Light } from "./Light";

import { Color, Terrain, Terrains } from "./terrains";
import { Mesh, Triangle } from "./Mesh";
import { RenderUtils } from "../utils/RenderUtils";
import { WorldObject } from "./WorldObject";
import { meshToInterleavedVerticesAndIndices } from "./cubes_utils";
import { ObjectUI } from "./ObjectUI";
/**
 * The object holding the map of the world
 * Center chunk starts at 0,0
 */
export class WorldMap {
  private width: number;
  private length: number;
  public lights: Light[] = [
    new Light(
      vec3.fromValues(0, 500, 0),
      new Color(255, 255, 255),
      1,
      200,
      new Color(255, 228, 132)
    )
  ];

  public height: number;
  public resolution = 64; //#of vertices square size of chunk
  public chunkDict: { [key: string]: Chunk } = {};
  public Workers: Worker[] = [];
  public seed: number = 10; // Random seed for noise generation

  public worldObjects: WorldObject[] = [];

  gl: WebGL2RenderingContext;

  private nextWorldObjectId: number = 0;
  private renderDistance: number = 1; // In chunks
  private tracerUpdateSupplier: () => () => void;

  public objectUI: ObjectUI;

  /**
   * Constructs a world
   * @param width Width in # of chunks
   * @param length Length in # of chunks
   * @param height Height of world
   */
  public constructor(
    width: number,
    height: number,
    length: number,
    gl: WebGL2RenderingContext,
    resolution: number,
    updateTracer: () => () => void
  ) {
    this.tracerUpdateSupplier = updateTracer;

    this.gl = gl;
    this.width = width;
    this.length = length;
    this.height = height;
    this.resolution = resolution;
    for (let i = 0; i < navigator.hardwareConcurrency; i++) {
      this.Workers.push(new Worker(new URL("./Worker.ts", import.meta.url)));
    }
    this.objectUI = new ObjectUI(this, this.tracerUpdateSupplier);
  }

  public getFieldValue(worldX: number, worldY: number, worldZ: number): number {
    // Convert world position to chunk key
    const chunkX = Math.floor(worldX / this.resolution) * this.resolution;
    const chunkZ = Math.floor(worldZ / this.resolution) * this.resolution;
    const chunkKey = `${chunkX},${chunkZ}`;

    const chunk = this.chunkDict[chunkKey];
    if (!chunk) return 0;

    // Convert to local chunk coordinates
    const localX = worldX - chunkX;
    const localY = worldY;
    const localZ = worldZ - chunkZ;

    return chunk.getFieldValueLocal(localX, localY, localZ);
  }

  public async generate(position: vec2): Promise<void> {
    //delete existing chunks
    this.chunkDict = {};
    const positions: vec2[] = [];
    for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
      for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
        const chunkX =
          (Math.floor(position[0] / this.resolution) + x) * this.resolution;
        const chunkZ =
          (Math.floor(position[1] / this.resolution) + z) * this.resolution;
        positions.push(vec2.fromValues(chunkX, chunkZ));
      }
    }

    positions.forEach((pos, i) => {
      const chunk = new Chunk(
        pos,
        vec3.fromValues(this.resolution, this.height, this.resolution),
        this.seed,
        this.Workers[i % this.Workers.length],
        this
      );
      this.chunkDict[`${pos[0]},${pos[1]}`] = chunk;
    });
    await Promise.all(
      Object.values(this.chunkDict).map((chunk) => chunk.generateTerrain())
    );
    await Promise.all(
      Object.values(this.chunkDict).map((chunk) =>
        chunk.generateEdgeTriangles()
      )
    );
  }

  public async generateIncremental(position: vec2): Promise<void> {
    const positions: vec2[] = [];
    const newChunkKeys = new Set<string>();

    // Determine which chunks should exist
    for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
      for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
        const chunkX =
          (Math.floor(position[0] / this.resolution) + x) * this.resolution;
        const chunkZ =
          (Math.floor(position[1] / this.resolution) + z) * this.resolution;
        const key = `${chunkX},${chunkZ}`;
        newChunkKeys.add(key);

        // Only add if chunk doesn't exist
        if (!this.chunkDict[key]) {
          positions.push(vec2.fromValues(chunkX, chunkZ));
        }
      }
    }

    // Remove old chunks that are out of range
    for (const key in this.chunkDict) {
      if (!newChunkKeys.has(key)) {
        delete this.chunkDict[key];
      }
    }

    // Generate only new chunks
    if (positions.length > 0) {
      positions.forEach((pos, i) => {
        const chunk = new Chunk(
          pos,
          vec3.fromValues(this.resolution, this.height, this.resolution),
          this.seed,
          this.Workers[i % this.Workers.length],
          this
        );
        this.chunkDict[`${pos[0]},${pos[1]}`] = chunk;
      });

      const newChunks = positions.map(
        (pos) => this.chunkDict[`${pos[0]},${pos[1]}`]
      );
      await Promise.all(newChunks.map((chunk) => chunk.generateTerrain()));
      await Promise.all(
        newChunks.map((chunk) => chunk.generateEdgeTriangles())
      );
    }
  }

  public combinedMesh(): Mesh {
    const CombinedMesh = new Mesh();

    // Merge chunks
    for (const key in this.chunkDict) {
      CombinedMesh.merge(this.chunkDict[key].getMesh());
    }

    // Merge worldObjects with transformation applied
    for (const obj of this.worldObjects) {
      const meshCopy = obj.mesh.copy();
      const transformedMesh = new Mesh();

      for (let i = 0; i < meshCopy.mesh.length; i++) {
        const tri = meshCopy.mesh[i];
        const norm = meshCopy.normals[i];

        // Deep copy triangle and normal
        const newTri: Triangle = [
          vec3.clone(tri[0]),
          vec3.clone(tri[1]),
          vec3.clone(tri[2])
        ];
        const newNorm: Triangle = [
          vec3.clone(norm[0]),
          vec3.clone(norm[1]),
          vec3.clone(norm[2])
        ];

        // Apply transformation
        for (let j = 0; j < 3; j++) {
          // Transform vertex
          const v = vec4.fromValues(
            newTri[j][0],
            newTri[j][1],
            newTri[j][2],
            1
          );
          vec4.transformMat4(v, v, obj.position);
          vec3.set(newTri[j], v[0], v[1], v[2]);

          // Transform normal (rotation + scale only)
          const n = vec4.fromValues(
            newNorm[j][0],
            newNorm[j][1],
            newNorm[j][2],
            0
          );
          const normalMat = mat4.clone(obj.position);
          normalMat[12] = 0;
          normalMat[13] = 0;
          normalMat[14] = 0;
          vec4.transformMat4(n, n, normalMat);
          vec3.normalize(newNorm[j], vec3.fromValues(n[0], n[1], n[2]));
        }

        // Add transformed triangle
        transformedMesh.addTriangle(newTri, newNorm, meshCopy.type[i]);
      }

      // Merge safely into combined mesh
      CombinedMesh.merge(transformedMesh);
    }

    return CombinedMesh;
  }
  public onObjectAdded?: (obj: WorldObject) => void;

  /**
   * Add an object to the game world
   */
  public addObject(objectData: Mesh, objectLocation: mat4, name: string) {
    const { vertices, indices } =
      meshToInterleavedVerticesAndIndices(objectData);
    const meshSize = indices.length;

    let objectBuffer = RenderUtils.CreateStaticBuffer(
      this.gl,
      vertices,
      Array.from(indices)
    );

    const worldObject: WorldObject = {
      buffer: objectBuffer,
      position: objectLocation,
      meshSize: meshSize,
      id: this.nextWorldObjectId,
      mesh: objectData,
      name: name
    };

    this.nextWorldObjectId++;
    this.worldObjects.push(worldObject);

    if (this.onObjectAdded) {
      this.onObjectAdded(worldObject);
    }
  }
}

import { VERTICES, EDGES, CASES } from "./geometry";

export class Chunk {
  ChunkPosition: vec2;
  GridSize: vec3;
  Field: Float32Array = new Float32Array();
  seed: number;
  Worker: Worker;
  Mesh: Mesh = null!;
  worldMap: WorldMap;

  constructor(
    ChunkPosition: vec2,
    GridSize: vec3,
    seed: number,
    Worker: Worker,
    worldMap: WorldMap
  ) {
    this.GridSize = GridSize;
    this.ChunkPosition = ChunkPosition;
    this.seed = seed;
    this.Worker = Worker;
    this.worldMap = worldMap;
  }

  chunkCoordinateToIndex(x: number, y: number, z: number): number {
    return (
      x +
      y * (this.GridSize[0] + 1) +
      z * (this.GridSize[0] + 1) * (this.GridSize[1] + 1)
    );
  }

  getFieldValueLocal(localX: number, localY: number, localZ: number): number {
    const idx = this.chunkCoordinateToIndex(localX, localY, localZ);
    if (idx < 0 || idx >= this.Field.length) return 0;
    return this.Field[idx];
  }

  getFieldValue(localX: number, localY: number, localZ: number): number {
    const worldX = localX + this.ChunkPosition[0];
    const worldY = localY;
    const worldZ = localZ + this.ChunkPosition[1];

    return this.worldMap.getFieldValue(worldX, worldY, worldZ);
  }

  generateEdgeTriangles(): void {
    const edgeMesh = new Mesh();

    for (let x of [0, this.GridSize[0] - 1]) {
      for (let y = 0; y < this.GridSize[1]; y++) {
        for (let z = 0; z < this.GridSize[2]; z++) {
          const cubeCase = this.GenerateCase(x, y, z);
          if (cubeCase !== 0 && cubeCase !== 255) {
            const newMesh = this.caseToMesh(x, y, z, cubeCase);
            edgeMesh.merge(newMesh);
          }
        }
      }
    }

    for (let y of [0, this.GridSize[1] - 1]) {
      for (let x = 1; x < this.GridSize[0] - 1; x++) {
        for (let z = 0; z < this.GridSize[2]; z++) {
          const cubeCase = this.GenerateCase(x, y, z);
          if (cubeCase !== 0 && cubeCase !== 255) {
            const newMesh = this.caseToMesh(x, y, z, cubeCase);
            edgeMesh.merge(newMesh);
          }
        }
      }
    }

    for (let z of [0, this.GridSize[2] - 1]) {
      for (let x = 1; x < this.GridSize[0] - 1; x++) {
        for (let y = 1; y < this.GridSize[1] - 1; y++) {
          const cubeCase = this.GenerateCase(x, y, z);
          if (cubeCase !== 0 && cubeCase !== 255) {
            const newMesh = this.caseToMesh(x, y, z, cubeCase);
            edgeMesh.merge(newMesh);
          }
        }
      }
    }

    this.Mesh.merge(edgeMesh);
  }

  private GenerateCase(cx: number, cy: number, cz: number): number {
    let caseIndex = 0;
    for (let i = 0; i < VERTICES.length; i++) {
      const vx = cx + VERTICES[i][0];
      const vy = cy + VERTICES[i][1];
      const vz = cz + VERTICES[i][2];
      const isTerrain = Number(
        this.solidChecker(this.getFieldValue(vx, vy, vz))
      );
      caseIndex += isTerrain << i;
    }
    return caseIndex;
  }

  private solidChecker(a: number): boolean {
    return a > 0.5;
  }

  private caseToMesh(
    cx: number,
    cy: number,
    cz: number,
    caseNumber: number
  ): Mesh {
    const caseMesh: Mesh = new Mesh();
    const caseLookup = CASES[caseNumber];

    for (const triangleLookup of caseLookup) {
      const positions: vec3[] = [];
      const normals: vec3[] = [];

      for (let i = 0; i < 3; i++) {
        const edgeIndex = triangleLookup[i];
        const result = this.edgeIndexToCoordinate(cx, cy, cz, edgeIndex);
        positions.push(result.position);
        normals.push(result.normal);
      }

      caseMesh.addTriangle(
        positions as Triangle,
        normals as Triangle,
        [0, 0, 0]
      );
    }
    return caseMesh;
  }

  private edgeIndexToCoordinate(
    cx: number,
    cy: number,
    cz: number,
    edgeIndex: number
  ): { position: vec3; normal: vec3 } {
    const [a, b] = EDGES[edgeIndex];

    const v1x = cx + VERTICES[a][0];
    const v1y = cy + VERTICES[a][1];
    const v1z = cz + VERTICES[a][2];
    const v2x = cx + VERTICES[b][0];
    const v2y = cy + VERTICES[b][1];
    const v2z = cz + VERTICES[b][2];

    const value1 = this.getFieldValue(v1x, v1y, v1z);
    const value2 = this.getFieldValue(v2x, v2y, v2z);

    const [n1x, n1y, n1z] = this.calculateNormal(v1x, v1y, v1z);
    const [n2x, n2y, n2z] = this.calculateNormal(v2x, v2y, v2z);

    const lerpAmount = (value1 - 0.5) / (value1 - 0.5 - (value2 - 0.5));

    const px = v1x + (v2x - v1x) * lerpAmount;
    const py = v1y + (v2y - v1y) * lerpAmount;
    const pz = v1z + (v2z - v1z) * lerpAmount;

    const nx = n1x + (n2x - n1x) * lerpAmount;
    const ny = n1y + (n2y - n1y) * lerpAmount;
    const nz = n1z + (n2z - n1z) * lerpAmount;

    const nlen = Math.sqrt(nx * nx + ny * ny + nz * nz);
    const nnx = nlen === 0 ? 0 : nx / nlen;
    const nny = nlen === 0 ? 1 : ny / nlen;
    const nnz = nlen === 0 ? 0 : nz / nlen;

    return {
      position: vec3.fromValues(px, py, pz),
      normal: vec3.fromValues(nnx, nny, nnz)
    };
  }

  private calculateNormal(
    vx: number,
    vy: number,
    vz: number
  ): [number, number, number] {
    const delta = 1.0;

    const gx =
      this.getFieldValue(vx + delta, vy, vz) -
      this.getFieldValue(vx - delta, vy, vz);
    const gy =
      this.getFieldValue(vx, vy + delta, vz) -
      this.getFieldValue(vx, vy - delta, vz);
    const gz =
      this.getFieldValue(vx, vy, vz + delta) -
      this.getFieldValue(vx, vy, vz - delta);

    const nx = -gx;
    const ny = -gy;
    const nz = -gz;

    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len === 0) return [0, 1, 0];

    return [nx / len, ny / len, nz / len];
  }

  async generateTerrain(): Promise<void> {
    return new Promise((resolve) => {
      this.Worker.postMessage({
        GridSize: this.GridSize,
        ChunkPosition: this.ChunkPosition,
        Seed: this.seed
      });
      this.Worker.onmessage = (
        event: MessageEvent<{
          field: Float32Array;
          meshVertices: Triangle[];
          meshNormals: Triangle[];
          meshTypes: [number, number, number][];
        }>
      ) => {
        this.Field = event.data.field;

        this.Mesh = new Mesh();
        this.Mesh.setVertices(event.data.meshVertices);
        this.Mesh.setNormals(event.data.meshNormals);
        this.Mesh.setTypes(event.data.meshTypes);

        resolve();
      };
    });
  }

  getMesh() {
    return this.Mesh;
  }
}
