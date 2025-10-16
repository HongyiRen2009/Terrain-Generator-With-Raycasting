export class getWorldMesh {
    worldObjectVAOs: Map<number, WebGLVertexArrayObject> = new Map();
    TerrainVAO: WebGLVertexArrayObject | null = null;
    TerrainMeshSize: number = 0;

    GenerateTriangleBuffer(triangleMeshes: Mesh[]) {
        let trianglePositions: number[] = [];
        let triangleNormals: number[] = [];
        let triangleColors: number[] = [];
        let triangleIndices: number[] = [];
        let indexOffset = 0;
    
        for (let i = 0; i < triangleMeshes.length; i++) {
          const Mesh = triangleMeshes[i];
          const vertexData = meshToNonInterleavedVerticesAndIndices(Mesh);
    
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
    
        this.TerrainMeshSize = triangleIndices.length;
    
        this.TerrainTriangleBuffer = {
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
        this.TerrainVAO = GlUtils.createInterleavedVao(
          this.gl,
          this.TerrainTriangleBuffer.vertex,
          this.TerrainTriangleBuffer.indices,
          {
            position: { offset: 0, stride: 36, size: 3, sizeOverride: 3 },
            normal: { offset: 12, stride: 36, size: 3 },
            color: { offset: 24, stride: 36, size: 3 }
          }
        );
      }
    
    dispose() {
        if (this.TerrainVAO) {
        this.gl.deleteVertexArray(this.TerrainVAO);
        }

        // Delete world object VAOs
        for (const vao of Array.from(this.worldObjectVAOs.values())) {
        this.gl.deleteVertexArray(vao);
        }
        this.worldObjectVAOs.clear();

        // TODO: Delete G-Buffer textures and framebuffer
        // TODO: Delete other VAOs
        // TODO: Delete shaders
  }
}