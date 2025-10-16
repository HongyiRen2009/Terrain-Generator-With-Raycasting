export class geometryPass {
    TerrainTriangleBuffer: {
    vertex: { position: WebGLBuffer; normal: WebGLBuffer; color: WebGLBuffer };
    indices: WebGLBuffer;
    } | null = null;

    gBuffer: {
        framebuffer: WebGLFramebuffer;
        normalTexture: WebGLTexture; // RGB: world space normals
        albedoTexture: WebGLTexture; // RGB: albedo
        depthTexture: WebGLTexture; // Depth buffer
    } | null = null;

    geometryPassProgram!: WebGLProgram;

    private initializeGBuffer() {
        const gl = this.gl;
        const ext = this.gl.getExtension("EXT_color_buffer_float");
        if (!ext) {
          throw new Error(
            "EXT_color_buffer_float is not supported on this device."
          );
        }
    
        // Create textures using TextureUtils.createTexture
        const normalTexture = TextureUtils.createTexture(
          gl,
          this.canvas.width,
          this.canvas.height,
          gl.RGBA16F,
          gl.RGBA,
          gl.FLOAT
        );
    
        const albedoTexture = TextureUtils.createTexture(
          gl,
          this.canvas.width,
          this.canvas.height,
          gl.RGBA8,
          gl.RGBA,
          gl.UNSIGNED_BYTE
        );
    
        const depthTexture = TextureUtils.createTexture(
          gl,
          this.canvas.width,
          this.canvas.height,
          gl.DEPTH_COMPONENT32F,
          gl.DEPTH_COMPONENT,
          gl.FLOAT
        );
    
        // Create framebuffer and attach textures
        const framebuffer = gl.createFramebuffer();
        if (!framebuffer) {
          throw new Error("Failed to create framebuffer");
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          normalTexture,
          0
        );
    
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT1,
          gl.TEXTURE_2D,
          albedoTexture,
          0
        );
    
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.DEPTH_ATTACHMENT,
          gl.TEXTURE_2D,
          depthTexture,
          0
        );
    
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
          throw new Error("Framebuffer is not complete: " + status.toString());
        }
    
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
        this.gBuffer = {
          framebuffer: framebuffer,
          normalTexture: normalTexture,
          albedoTexture: albedoTexture,
          depthTexture: depthTexture
        };
    }

    resizeGBuffer(width: number, height: number) {
        // Delete old G-Buffer textures and framebuffer
        if (this.gBuffer) {
          this.gl.deleteTexture(this.gBuffer.normalTexture);
          this.gl.deleteTexture(this.gBuffer.albedoTexture);
          this.gl.deleteTexture(this.gBuffer.depthTexture);
          this.gl.deleteFramebuffer(this.gBuffer.framebuffer);
          this.gBuffer = null;
        }
        // Delete SSAO and blur textures/framebuffers
        if (this.ssaoFrameBuffer) {
          this.gl.deleteTexture(this.ssaoFrameBuffer.ssaoTexture);
          this.gl.deleteFramebuffer(this.ssaoFrameBuffer.framebuffer);
          this.ssaoFrameBuffer = null;
        }
        if (this.ssaoBlurFrameBuffer) {
          this.gl.deleteTexture(this.ssaoBlurFrameBuffer.ssaoBlurTexture);
          this.gl.deleteFramebuffer(this.ssaoBlurFrameBuffer.framebuffer);
          this.ssaoBlurFrameBuffer = null;
        }
        // Resize canvas
        this.canvas.width = width;
        this.canvas.height = height;
        // Recreate G-Buffer and SSAO framebuffers/textures
        this.initializeGBuffer();
        this.initializeSSAOFrameBuffer();
        this.initializeSSAOBlurFrameBuffer();
      }
}