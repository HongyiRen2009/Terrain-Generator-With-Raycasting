import { vec3 } from "gl-matrix";
import { textureUtils } from "../../utils/TextureUtils";
import { glUtils } from "../../utils/GlUtils";
import { TerrainSSAOVertexShaderCode, TerrainSSAOFragmentShaderCode } from "../../glsl/ssao";

export class SSAOPass {
    gl: WebGL2RenderingContext;
    gBuffer: any;
    SSAOFramebuffer: any;
    QuadVAO: WebGLVertexArrayObject | null;
    TerrainSSAOProgram: WebGLProgram | null;
    SSAONoiseTexture: WebGLTexture | null;
    SSAOKernel: vec3[];
    matProj: any;
    canvas!: HTMLCanvasElement;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.QuadVAO = null;
        this.SSAONoiseTexture = null;
        this.SSAOKernel = [];
        this.TerrainSSAOProgram = glUtils.CreateProgram(
            gl,
            TerrainSSAOVertexShaderCode,
            TerrainSSAOFragmentShaderCode
        ) || null;
        
        if (!this.TerrainSSAOProgram) {
            console.error("Failed to create terrain SSAO program");
        } else {
            console.log("Terrain SSAO program created successfully");
        }
    }

    DefferedRenderingSSAOPass() {
        if (!this.gBuffer || !this.SSAOFramebuffer || !this.QuadVAO || !this.TerrainSSAOProgram) return;
        this.gl.bindFramebuffer(
            this.gl.FRAMEBUFFER,
            this.SSAOFramebuffer.framebuffer
        );
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.TerrainSSAOProgram);
        textureUtils.bindTex(
          this.gl,
          this.TerrainSSAOProgram,
          this.gBuffer.position,
          "VertexPositionTexture",
          0
        );
        textureUtils.bindTex(
          this.gl,
          this.TerrainSSAOProgram,
          this.gBuffer.normal,
          "VertexNormalTexture",
          1
        );
        textureUtils.bindTex(
          this.gl,
          this.TerrainSSAOProgram,
          this.SSAONoiseTexture!,
          "NoiseTexture",
          2
        );
        // Send kernel samples to shader
        for (let i = 0; i < this.SSAOKernel.length; i++) {
            this.gl.uniform3fv(
                this.gl.getUniformLocation(
                    this.TerrainSSAOProgram,
                    `samples[${i}]`
                ),
                this.SSAOKernel[i]
            );
        }
        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.TerrainSSAOProgram, "MatProj"),
            false,
            this.matProj
        );
        // Send Noise to shader
        this.gl.uniform1f(
            this.gl.getUniformLocation(
                this.TerrainSSAOProgram,
                "NoiseScale"
            ),
            this.canvas.width / 4.0
        );
        this.gl.bindVertexArray(this.QuadVAO);
        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
}

export class SSAOfunctions {
    SSAONoiseTexture: WebGLTexture | null = null;
    SSAOKernel: vec3[] = [];
    gl: WebGL2RenderingContext;
    
    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.GenerateSSAOKernel();
        this.GenerateSSAONoiseTexture();
    }

    GenerateSSAOKernel() {
        const kernelSize = 64;
        this.SSAOKernel = [];
        for (let i = 0; i < kernelSize; i++) {
          let sample = vec3.fromValues(
            Math.random() * 2.0 - 1.0,
            Math.random() * 2.0 - 1.0,
            Math.random()
          );
          vec3.normalize(sample, sample);
          vec3.scale(sample, sample, Math.random());
          let scale = i / kernelSize;
          scale = 0.1 + 0.9 * scale * scale;
          vec3.scale(sample, sample, scale);
          this.SSAOKernel.push(sample);
        }
      }
    GenerateSSAONoiseTexture() {
        const noiseSize = 64;
        const noiseData = new Float32Array(noiseSize * noiseSize * 3);
        for (let i = 0; i < noiseSize * noiseSize; i++) {
          noiseData[i * 3] = Math.random() * 2.0 - 1.0;
          noiseData[i * 3 + 1] = Math.random() * 2.0 - 1.0;
          noiseData[i * 3 + 2] = 0.0;
        }
        this.SSAONoiseTexture = textureUtils.CreateBufferTexture(
          this.gl,
          noiseSize,
          noiseSize,
          this.gl.RGB16F,
          this.gl.RGB,
          this.gl.FLOAT,
          noiseData
        );
    }
}