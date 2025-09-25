import { quadVertices } from "../../../map/geometry";
import { quadIndices } from "../../../map/geometry";
import { glUtils } from "../../utils/GlUtils";

export class VAOManager {
    gl: WebGL2RenderingContext;
    QuadVAO: WebGLVertexArrayObject | null = null;
    terrainVAO: WebGLVertexArrayObject | null = null;
    worldObjectVAOs: Map<number, WebGLVertexArrayObject> = new Map();

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        
        this.InitalizeFullScreenQuad();
    }
    
    InitalizeFullScreenQuad() {
        // Create and bind VAO
        const quadVAO = this.gl.createVertexArray();
        const quadVBO = this.gl.createBuffer();
        const quadEBO = this.gl.createBuffer();
        if (!quadVAO || !quadVBO || !quadEBO) {
          throw new Error("Failed to create buffers for full-screen quad");
        }
        this.gl.bindVertexArray(quadVAO);
        // Vertex buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, quadVBO);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, quadVertices, this.gl.STATIC_DRAW);
        // Element buffer
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, quadEBO);
        this.gl.bufferData(
          this.gl.ELEMENT_ARRAY_BUFFER,
          quadIndices,
          this.gl.STATIC_DRAW
        );
        // Position attribute
        this.gl.enableVertexAttribArray(0);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 16, 0);
        // TexCoord attribute
        this.gl.enableVertexAttribArray(1);
        this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 16, 8);
        // Unbind VAO
        this.gl.bindVertexArray(null);
        this.QuadVAO = quadVAO;
      }

    InitalizeTerrainVAO(TerrainTriangleBuffer: any, TerrainGeometryShader: any) {
        if (!TerrainTriangleBuffer || !TerrainGeometryShader) {
            console.warn("VAOManager: Missing TerrainTriangleBuffer or TerrainGeometryShader");
            return;
        }
        if (!this.terrainVAO) {
            console.log("Creating terrain VAO...");
            
            // Debug attribute locations
            const positionLoc = this.gl.getAttribLocation(TerrainGeometryShader, "VertexPosition");
            const normalLoc = this.gl.getAttribLocation(TerrainGeometryShader, "VertexNormal");
            const albedoLoc = this.gl.getAttribLocation(TerrainGeometryShader, "VertexAlbedo");
            
            console.log(`Attribute locations - Position: ${positionLoc}, Normal: ${normalLoc}, Albedo: ${albedoLoc}`);
            
            if (positionLoc === -1 || normalLoc === -1 || albedoLoc === -1) {
                console.error("One or more vertex attributes not found in shader!");
                return;
            }
            
            this.terrainVAO = glUtils.createInterleavedVao(
                this.gl,
                TerrainTriangleBuffer.vertex,
                TerrainTriangleBuffer.indices,
                {
                VertexPosition: {
                    offset: 0,
                    stride: 36,
                    size: 3,
                    sizeOverride: 3
                },
                VertexNormal: { offset: 12, stride: 36, size: 3 },
                VertexAlbedo: { offset: 24, stride: 36, size: 3 }
                },
                {
                    VertexPosition: positionLoc,
                    VertexNormal: normalLoc,
                    VertexAlbedo: albedoLoc
                }
            );
            console.log("Terrain VAO created:", this.terrainVAO);
        }
    }
}