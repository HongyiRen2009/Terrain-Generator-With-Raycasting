import { vec3 } from "gl-matrix";
import { TextureUtils } from "../../utils/TextureUtils";

export class SSAOPass{
    gl: WebGL2RenderingContext;
    kernelSize: number = 64;
    kernels: vec3[] = [];
    noiseTexture: WebGLTexture | null = null;
    noiseSize: number = 64;

    radius: number = 5.0;
    bias: number = 0.025;
    enableSSAOBlur: boolean = true;

    ssaoPassProgram!: WebGLProgram;

    private generateKernels() {
        this.kernels = [];
        for (let i = 0; i < this.kernelSize; i++) {
          // Generate random point in hemisphere
          let sample = vec3.fromValues(
            Math.random() * 2.0 - 1.0,
            Math.random() * 2.0 - 1.0,
            Math.random() // Only positive Z for hemisphere
          );
    
          // Normalize to unit sphere
          vec3.normalize(sample, sample);
    
          // Scale samples to be closer to the origin (more samples near surface)
          let scale = i / this.kernelSize;
          scale = 0.1 + scale * scale * 0.9; // Lerp between 0.1 and 1.0
          vec3.scale(sample, sample, scale);
    
          this.kernels.push(sample);
        }
      }
    private generateNoiseTexture() {
        const noiseData = new Float32Array(this.noiseSize * this.noiseSize * 3);
        for (let i = 0; i < this.noiseSize; i++) {
          for (let j = 0; j < this.noiseSize; j++) {
            const index = (i * this.noiseSize + j) * 3;
            noiseData[index] = Math.random() * 2.0 - 1.0;
            noiseData[index + 1] = Math.random() * 2.0 - 1.0;
            noiseData[index + 2] = 0.0;
          }
        }
        this.noiseTexture = TextureUtils.createTexture(
          this.gl,
          this.noiseSize,
          this.noiseSize,
          this.gl.RGB32F,
          this.gl.RGB,
          this.gl.FLOAT,
          noiseData,
          this.gl.NEAREST,
          this.gl.NEAREST,
          this.gl.REPEAT,
          this.gl.REPEAT
        );
    }

    private initializeSSAOFrameBuffer() {
        const framebuffer = this.gl.createFramebuffer();
        if (!framebuffer) {
            throw new Error("Failed to create SSAO framebuffer");
          }
          this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
      
          const ssaoTexture = TextureUtils.createTexture(
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
            ssaoTexture,
            0
          );
          this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
          this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      
          this.ssaoFrameBuffer = {
            framebuffer: framebuffer,
            ssaoTexture: ssaoTexture
          };
        }   

    private ssaoPass() {
        this.gl.bindFramebuffer(
          this.gl.FRAMEBUFFER,
          this.ssaoFrameBuffer?.framebuffer || null
        );
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.BLEND);
    
        this.gl.useProgram(this.ssaoPassProgram!);
        this.gl.bindVertexArray(this.screenQuadVAO);
    
        TextureUtils.bindTex(
          this.gl,
          this.ssaoPassProgram!,
          this.gBuffer?.normalTexture!,
          "normalTexture",
          0
        );
        TextureUtils.bindTex(
          this.gl,
          this.ssaoPassProgram!,
          this.gBuffer?.depthTexture!,
          "depthTexture",
          1
        );
        TextureUtils.bindTex(
          this.gl,
          this.ssaoPassProgram!,
          this.noiseTexture!,
          "noiseTexture",
          2
        );
    
        this.gl.uniform1f(
          this.gl.getUniformLocation(this.ssaoPassProgram!, "radius"),
          this.radius
        );
        this.gl.uniform1f(
          this.gl.getUniformLocation(this.ssaoPassProgram!, "bias"),
          this.bias
        );
        this.gl.uniformMatrix4fv(
          this.gl.getUniformLocation(this.ssaoPassProgram!, "proj"),
          false,
          this.matProj
        );
        this.gl.uniformMatrix4fv(
          this.gl.getUniformLocation(this.ssaoPassProgram!, "projInverse"),
          false,
          this.matProjInverse
        );
        this.gl.uniform1f(
          this.gl.getUniformLocation(this.ssaoPassProgram!, "noiseScale"),
          this.noiseSize
        );
    
        for (let i = 0; i < this.kernelSize; i++) {
          this.gl.uniform3fv(
            this.gl.getUniformLocation(
              this.ssaoPassProgram!,
              `samples[${i}]`
            ),
            this.kernels[i]
          );
        }
    
        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      }
}