import { glUtils } from "../../utils/GlUtils";
import { textureUtils } from "../../utils/TextureUtils";
import { Mesh } from "../../../map/Mesh";
import { meshToVerticesAndIndices } from "../../../map/marching cubes/cubes_utils";
import { mat4 } from "gl-matrix";

export class BufferManager {
    gl: WebGL2RenderingContext;
    canvas: HTMLCanvasElement;
    TerrainTriangleBuffer: {
        vertex: WebGLBuffer;
        indices: WebGLBuffer;
      } | null = null;
    TerrainMeshSize: number = 0;
    matViewProj!: mat4;
    gBuffer: {
        framebuffer: WebGLFramebuffer;
        position: WebGLTexture;
        normal: WebGLTexture;
        albedo: WebGLTexture;
        depth: WebGLRenderbuffer;
      } | null = null;
      SSAOFramebuffer: {
        framebuffer: WebGLFramebuffer;
        SSAOTexture: WebGLTexture;
      } | null = null;
      constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
        this.gl = gl;
        this.canvas = canvas;
      }
      InitalizeGBuffer() {
        const framebuffer = this.gl.createFramebuffer();
        if (!framebuffer) throw new Error("Failed to create framebuffer");
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        const positionTexture = textureUtils.CreateBufferTexture(
          this.gl,
          this.canvas.width,
          this.canvas.height,
          this.gl.RGBA16F,
          this.gl.RGBA,
          this.gl.FLOAT
        );
        const normalTexture = textureUtils.CreateBufferTexture(
          this.gl,
          this.canvas.width,
          this.canvas.height,
          this.gl.RGBA16F,
          this.gl.RGBA,
          this.gl.FLOAT
        );
        const albedoTexture = textureUtils.CreateBufferTexture(
          this.gl,
          this.canvas.width,
          this.canvas.height,
          this.gl.RGBA8,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE
        );
        const depthRenderbuffer = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthRenderbuffer);
        this.gl.renderbufferStorage(
          this.gl.RENDERBUFFER,
          this.gl.DEPTH_COMPONENT24,
          this.canvas.width,
          this.canvas.height
        );
        this.gl.framebufferRenderbuffer(
          this.gl.FRAMEBUFFER,
          this.gl.DEPTH_ATTACHMENT,
          this.gl.RENDERBUFFER,
          depthRenderbuffer
        );
    
        this.gl.framebufferTexture2D(
          this.gl.FRAMEBUFFER,
          this.gl.COLOR_ATTACHMENT0,
          this.gl.TEXTURE_2D,
          positionTexture,
          0
        );
        this.gl.framebufferTexture2D(
          this.gl.FRAMEBUFFER,
          this.gl.COLOR_ATTACHMENT1,
          this.gl.TEXTURE_2D,
          normalTexture,
          0
        );
        this.gl.framebufferTexture2D(
          this.gl.FRAMEBUFFER,
          this.gl.COLOR_ATTACHMENT2,
          this.gl.TEXTURE_2D,
          albedoTexture,
          0
        );
    
        const drawBuffers = [
          this.gl.COLOR_ATTACHMENT0,
          this.gl.COLOR_ATTACHMENT1,
          this.gl.COLOR_ATTACHMENT2
        ];
        this.gl.drawBuffers(drawBuffers);
        // Add this before the framebuffer status check:
        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
          console.error("G-Buffer framebuffer status:", status);
          switch (status) {
            case this.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
              console.error("FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
              break;
            case this.gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
              console.error("FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
              break;
            case this.gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
              console.error("FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
              break;
            case this.gl.FRAMEBUFFER_UNSUPPORTED:
              console.error("FRAMEBUFFER_UNSUPPORTED");
              break;
          }
          throw new Error(`G-Buffer framebuffer is not complete: ${status}`);
        }
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gBuffer = {
          framebuffer: framebuffer,
          position: positionTexture,
          normal: normalTexture,
          albedo: albedoTexture,
          depth: depthRenderbuffer // now a renderbuffer, not a texture
        };
      }

      InitalizeSSAOFramebuffer() {
        const framebuffer = this.gl.createFramebuffer();
        if (!framebuffer) throw new Error("Failed to create framebuffer");
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        const SSAOTexture = textureUtils.CreateBufferTexture(
          this.gl,
          this.canvas.width,
          this.canvas.height,
          this.gl.R8,
          this.gl.RED,
          this.gl.UNSIGNED_BYTE
        );
        this.gl.framebufferTexture2D(
          this.gl.FRAMEBUFFER,
          this.gl.COLOR_ATTACHMENT0,
          this.gl.TEXTURE_2D,
          SSAOTexture,
          0
        );
        const drawBuffers = [this.gl.COLOR_ATTACHMENT0];
        this.gl.drawBuffers(drawBuffers);
        // Add similar error checking here:
        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
          console.error("SSAO framebuffer status:", status);
          throw new Error(`SSAO framebuffer is not complete: ${status}`);
        }
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.SSAOFramebuffer = {
          framebuffer: framebuffer,
          SSAOTexture: SSAOTexture
        };
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
        
        console.log(`BufferManager: Creating buffer with ${triangleVertices.length} vertices and ${triangleIndices.length} indices`);

      
        
        if (triangleIndices.length === 0) {
            console.warn("WARNING: No indices to draw - this will cause WebGL errors");
        }
    
        this.TerrainTriangleBuffer = glUtils.CreateStaticBuffer(
          this.gl,
          new Float32Array(triangleVertices),
          triangleIndices
        );
    
        this.matViewProj = mat4.create();
      }
    
}
