import { vec2, vec3 } from "gl-matrix";
import { VERTICES, EDGES, CASES } from "./geometry";
import { Triangle, Mesh } from "./Mesh";
import { vertexKey } from "./cubes_utils";

//!NOTE: current code assumes a chunk size of GridSize[0]xGridSize[1]xGridSize[2]
export class Chunk {
  ChunkPosition: vec2;
  GridSize: vec3;
  Field: Float32Array = new Float32Array();
  FieldMap: Map<string, number>;
  WorldFieldMap: Map<string, number> = new Map<string, number>();
  seed: number;
  Worker: Worker;
  Mesh: Mesh = null!;
  constructor(
    ChunkPosition: vec2,
    GridSize: vec3,
    seed: number,
    Worker: Worker
  ) {
    this.GridSize = GridSize;
    this.ChunkPosition = ChunkPosition;
    this.seed = seed;
    this.Worker = Worker;
    this.FieldMap = new Map<string, number>();
  }

  chunkCoordinateToIndex(c: vec3): number {
    return (
      c[0] +
      c[1] * (this.GridSize[0] + 1) +
      c[2] * (this.GridSize[0] + 1) * (this.GridSize[1] + 1)
    );
  }
  setWorldFieldMap(worldFieldMap: Map<string, number>) {
    this.WorldFieldMap = worldFieldMap;
  }

  // Generate edge triangles in main thread
  generateEdgeTriangles(): void {
    const edgeMesh = new Mesh();
    
    for (let x = 0; x < this.GridSize[0]; x++) {
      for (let y = 0; y < this.GridSize[1]; y++) {
        for (let z = 0; z < this.GridSize[2]; z++) {
          // Only process edge cubes
          const isEdge = x === 0 || x === this.GridSize[0] - 1 ||
                         y === 0 || y === this.GridSize[1] - 1 ||
                         z === 0 || z === this.GridSize[2] - 1;
          if (!isEdge) continue;
          
          let c = vec3.fromValues(x, y, z);
          const cubeCase = this.GenerateCase(c);
          const newMesh = this.caseToMesh(c, cubeCase);
          edgeMesh.merge(newMesh);
        }
      }
    }
    
    this.Mesh.merge(edgeMesh);
  }

  private GenerateCase(cubeCoordinates: vec3): number {
    let caseIndex = 0;
    for (let i = 0; i < VERTICES.length; i++) {
      let vertexOffset = vec3.fromValues(...VERTICES[i]);
      vec3.add(vertexOffset, vertexOffset, cubeCoordinates);
      const isTerrain = Number(this.solidChecker(this.getFieldValue(vertexOffset)));
      caseIndex += isTerrain << i;
    }
    return caseIndex;
  }

  private solidChecker(a: number): boolean {
    return a > 0.5;
  }

  private getFieldValue(c: vec3): number {
    const newVector = vec3.fromValues(0, 0, 0);
    vec3.add(
      newVector,
      c,
      vec3.fromValues(this.ChunkPosition[0], 0, this.ChunkPosition[1])
    );
    return this.WorldFieldMap.get(vertexKey(newVector)) ?? 0;
  }

  private caseToMesh(c: vec3, caseNumber: number): Mesh {
    const caseMesh: Mesh = new Mesh();
    const caseLookup = CASES[caseNumber];
    for (const triangleLookup of caseLookup) {
      const vertices = triangleLookup.map((edgeIndex) =>
        this.edgeIndexToCoordinate(c, edgeIndex)
      );
      caseMesh.addTriangle(
        vertices.map((v) => v.position) as Triangle,
        vertices.map((v) => v.normal) as Triangle,
        [0, 0, 0]
      );
    }
    return caseMesh;
  }

  private edgeIndexToCoordinate(
    c: vec3,
    edgeIndex: number
  ): { position: vec3; normal: vec3 } {
    const [a, b] = EDGES[edgeIndex];
    const v1 = vec3.fromValues(...VERTICES[a]);
    const v2 = vec3.fromValues(...VERTICES[b]);
    vec3.add(v1, v1, c);
    vec3.add(v2, v2, c);

    const value1 = this.getFieldValue(v1);
    const value2 = this.getFieldValue(v2);
    const normal1 = this.calculateNormal(v1);
    const normal2 = this.calculateNormal(v2);

    const lerpAmount = (value1 - 0.5) / (value1 - 0.5 - (value2 - 0.5));
    let position = vec3.create();
    let normal = vec3.create();
    vec3.lerp(position, v1, v2, lerpAmount);
    vec3.lerp(normal, normal1, normal2, lerpAmount);
    vec3.normalize(normal, normal);

    return { position, normal };
  }

  private calculateNormal(vertex: vec3): vec3 {
    const delta = 1.0;
    const normal = vec3.create();

    const x1 = vec3.fromValues(vertex[0] + delta, vertex[1], vertex[2]);
    const x2 = vec3.fromValues(vertex[0] - delta, vertex[1], vertex[2]);
    normal[0] = this.getFieldValue(x1) - this.getFieldValue(x2);

    const y1 = vec3.fromValues(vertex[0], vertex[1] + delta, vertex[2]);
    const y2 = vec3.fromValues(vertex[0], vertex[1] - delta, vertex[2]);
    normal[1] = this.getFieldValue(y1) - this.getFieldValue(y2);

    const z1 = vec3.fromValues(vertex[0], vertex[1], vertex[2] + delta);
    const z2 = vec3.fromValues(vertex[0], vertex[1], vertex[2] - delta);
    normal[2] = this.getFieldValue(z1) - this.getFieldValue(z2);

    vec3.negate(normal, normal);
    vec3.normalize(normal, normal);
    return normal;
  }
  // Generate terrain field and mesh (NEW)
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
        fieldMap: [string, number][];
        meshVertices: Triangle[];
        meshNormals: Triangle[];
        meshTypes: [number, number, number][];
      }>
    ) => {
      this.Field = event.data.field;
      this.FieldMap = new Map<string, number>(event.data.fieldMap);
      
      // Initialize mesh with interior triangles
      this.Mesh = new Mesh();
      this.Mesh.setVertices(event.data.meshVertices);
      this.Mesh.setNormals(event.data.meshNormals);
      this.Mesh.setTypes(event.data.meshTypes);
      
      resolve();
    };
  });
}
// Generate only edge cubes and merge into existing mesh (W AI commments)
  
  getMesh() {
    return this.Mesh;
  }
}
