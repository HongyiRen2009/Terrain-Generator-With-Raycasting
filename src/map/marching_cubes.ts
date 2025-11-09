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
  
  // NEW: Reference to shared world field (replaces WorldFieldMap!)
  private worldFieldData: Float32Array | null = null;
  private worldFieldMinX: number = 0;
  private worldFieldMinZ: number = 0;
  private worldFieldSizeX: number = 0;
  private worldFieldSizeY: number = 0;
  private worldFieldSizeZ: number = 0;
  
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
  
// NEW: Set reference to shared world field array
  setWorldFieldData(
    data: Float32Array,
    minX: number,
    minZ: number,
    sizeX: number,
    sizeY: number,
    sizeZ: number
  ) {
    this.worldFieldData = data;
    this.worldFieldMinX = minX;
    this.worldFieldMinZ = minZ;
    this.worldFieldSizeX = sizeX;
    this.worldFieldSizeY = sizeY;
    this.worldFieldSizeZ = sizeZ;
  }
  async generateTerrain(): Promise<Float32Array> {
    return new Promise((resolve) => {
      this.Worker.postMessage({
        GridSize: this.GridSize,
        ChunkPosition: this.ChunkPosition,
        Seed: this.seed,
        generatingTerrain: true,
        worldFieldMap: this.FieldMap
      });
      this.Worker.onmessage = (
        event: MessageEvent<{
          field: Float32Array;
          fieldMap: Map<string, number>;
        }>
      ) => {
        this.Field = event.data.field;
        this.FieldMap = new Map<string, number>(event.data.fieldMap);
        resolve(this.Field);
      };
    });
  }
  
  async generateMarchingCubes(): Promise<Mesh> {
    return new Promise((resolve) => {
      const relevantData = this.getRelevantFieldData();
      
      this.Worker.postMessage({
        GridSize: this.GridSize,
        ChunkPosition: this.ChunkPosition,
        Seed: this.seed,
        generatingTerrain: false,
        worldFieldData: relevantData
      }, [relevantData.data.buffer]); // Transfer buffer ownership to worker
      
      this.Worker.onmessage = (
        event: MessageEvent<{
          meshVertices: Triangle[];
          meshNormals: Triangle[];
          meshTypes: [number, number, number][];
        }>
      ) => {
        this.Mesh = new Mesh();
        this.Mesh.setVertices(event.data.meshVertices);
        this.Mesh.setNormals(event.data.meshNormals);
        this.Mesh.setTypes(event.data.meshTypes);
        resolve(this.Mesh);
      };
    });
  }

  // Optimized: Convert Map to typed array to reduce memory
 private getRelevantFieldData(): { 
    data: Float32Array, 
    minX: number, 
    minZ: number, 
    sizeX: number, 
    sizeZ: number,
    sizeY: number
  } {
    if (!this.worldFieldData) {
      throw new Error("World field data not available");
    }
    
    const minX = this.ChunkPosition[0] - 1;
    const minZ = this.ChunkPosition[1] - 1;
    const maxX = this.ChunkPosition[0] + this.GridSize[0] + 1;
    const maxZ = this.ChunkPosition[1] + this.GridSize[2] + 1;
    
    const sizeX = maxX - minX + 1;
    const sizeZ = maxZ - minZ + 1;
    const sizeY = this.GridSize[1] + 1;
    
    const data = new Float32Array(sizeX * sizeY * sizeZ);
    
    let count = 0;
    for (let x = minX; x <= maxX; x++) {
      for (let y = 0; y < sizeY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const worldX = x - this.worldFieldMinX;
          const worldZ = z - this.worldFieldMinZ;
          
          if (worldX >= 0 && worldX < this.worldFieldSizeX &&
              worldZ >= 0 && worldZ < this.worldFieldSizeZ &&
              y >= 0 && y < this.worldFieldSizeY) {
            const worldIdx = worldX + y * this.worldFieldSizeX + worldZ * this.worldFieldSizeX * this.worldFieldSizeY;
            
            const localX = x - minX;
            const localZ = z - minZ;
            const localIdx = localX + y * sizeX + localZ * sizeX * sizeY;
            
            data[localIdx] = this.worldFieldData[worldIdx];
            count++;
          }
        }
      }
    }
    
    console.log(`Chunk (${this.ChunkPosition[0]},${this.ChunkPosition[1]}): Extracted ${count} values`);
    
    return { data, minX, minZ, sizeX, sizeZ, sizeY };
  }
  getMesh() {
    return this.Mesh;
  }
  // Clear temporary data after consolidation
  clearTemporaryData() {
    this.FieldMap.clear();
    this.Field = new Float32Array(0);
  }
}