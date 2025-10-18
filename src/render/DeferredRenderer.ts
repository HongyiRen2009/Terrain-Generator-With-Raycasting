import { vec3, mat4 } from "gl-matrix";
import { GlUtils } from "./GlUtils";
import { VaoInfo } from "./VaoManager";
import geometryVertexShaderSource from "./glsl/DeferredRendering/Geometry.vert";
import geometryFragmentShaderSource from "./glsl/DeferredRendering/Geometry.frag";
import ssaoVertexShaderSource from "./glsl/DeferredRendering/SSAO.vert";
import ssaoFragmentShaderSource from "./glsl/DeferredRendering/SSAO.frag";
import ssaoBlurVertexShaderSource from "./glsl/DeferredRendering/SSAOBlur.vert";
import ssaoBlurFragmentShaderSource from "./glsl/DeferredRendering/SSAOBlur.frag";
import lightingVertexShaderSource from "./glsl/DeferredRendering/Lighting.vert";
import lightingFragmentShaderSource from "./glsl/DeferredRendering/Lighting.frag";
// Helper for uniform locations
function getUniformLocations(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: string[]
) {
  const locations: { [key: string]: WebGLUniformLocation } = {};
  for (const name of names) {
    const loc = gl.getUniformLocation(program, name);
    if (loc) locations[name] = loc;
  }
  return locations;
}

// DeferredRenderer: Handles deferred rendering pipeline

export class DeferredRenderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;

  // G-Buffer
  private gBuffer: {
    framebuffer: WebGLFramebuffer;
    normalTexture: WebGLTexture;
    albedoTexture: WebGLTexture;
    depthTexture: WebGLTexture;
  } | null = null;

  // SSAO framebuffers
  private ssaoFrameBuffer: {
    framebuffer: WebGLFramebuffer;
    ssaoTexture: WebGLTexture;
  } | null = null;

  private ssaoBlurFrameBuffer: {
    framebuffer: WebGLFramebuffer;
    ssaoBlurTexture: WebGLTexture;
  } | null = null;

  // Programs
  private geometryPassProgram: WebGLProgram | null = null;
  private ssaoPassProgram: WebGLProgram | null = null;
  private ssaoBlurPassProgram: WebGLProgram | null = null;
  private lightingPassProgram: WebGLProgram | null = null;

  // Uniform locations
  private geometryUniforms: { [key: string]: WebGLUniformLocation } = {};
  private ssaoUniforms: { [key: string]: WebGLUniformLocation } = {};
  private ssaoBlurUniforms: { [key: string]: WebGLUniformLocation } = {};
  private lightingUniforms: { [key: string]: WebGLUniformLocation } = {};

  // Screen quad
  private screenQuadVAO: WebGLVertexArrayObject | null = null;

  // SSAO data
  private kernelSize: number = 64;
  private kernels: vec3[] = [];
  private noiseTexture: WebGLTexture | null = null;
  private noiseSize: number = 64;
  radius: number = 5.0;
  bias: number = 0.025;
  enableSSAOBlur: boolean = true;

  // Cached matrices
  private matProjInverse: mat4 = mat4.create();
  private matViewInverse: mat4 = mat4.create();

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
    this.gl = gl;
    this.canvas = canvas;

    this.initPrograms();
    this.initializeGBuffer();
    this.initializeSSAOFrameBuffer();
    this.initializeSSAOBlurFrameBuffer();
    this.initializeScreenQuad();
    this.generateKernels();
    this.generateNoiseTexture();
  }

  private initPrograms(): void {
    this.geometryPassProgram = GlUtils.CreateProgram(
      this.gl,
      geometryVertexShaderSource,
      geometryFragmentShaderSource
    );
    this.ssaoPassProgram = GlUtils.CreateProgram(
      this.gl,
      ssaoVertexShaderSource,
      ssaoFragmentShaderSource
    );
    this.ssaoBlurPassProgram = GlUtils.CreateProgram(
      this.gl,
      ssaoBlurVertexShaderSource,
      ssaoBlurFragmentShaderSource
    );
    this.lightingPassProgram = GlUtils.CreateProgram(
      this.gl,
      lightingVertexShaderSource,
      lightingFragmentShaderSource
    );
    this.geometryUniforms = getUniformLocations(
      this.gl,
      this.geometryPassProgram!,
      ["view", "proj", "model"]
    );
    this.ssaoUniforms = getUniformLocations(this.gl, this.ssaoPassProgram!, [
      "proj",
      "projInverse",
      "noiseSize",
      "radius",
      "bias"
    ]);
    this.ssaoBlurUniforms = getUniformLocations(
      this.gl,
      this.ssaoBlurPassProgram!,
      ["enableBlur"]
    );
    this.lightingUniforms = getUniformLocations(
      this.gl,
      this.lightingPassProgram!,
      ["viewInverse", "projInverse", "cameraPosition"]
    );
  }

  private initializeGBuffer(): void {
    const gl = this.gl;
    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
      throw new Error(
        "EXT_color_buffer_float is not supported on this device."
      );
    }

    const normalTexture = GlUtils.createTexture(
      gl,
      this.canvas.width,
      this.canvas.height,
      gl.RGBA16F,
      gl.RGBA,
      gl.FLOAT
    );

    const albedoTexture = GlUtils.createTexture(
      gl,
      this.canvas.width,
      this.canvas.height,
      gl.RGBA8,
      gl.RGBA,
      gl.UNSIGNED_BYTE
    );

    const depthTexture = GlUtils.createTexture(
      gl,
      this.canvas.width,
      this.canvas.height,
      gl.DEPTH_COMPONENT32F,
      gl.DEPTH_COMPONENT,
      gl.FLOAT
    );

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

    this.gBuffer = { framebuffer, normalTexture, albedoTexture, depthTexture };
  }

  private initializeSSAOFrameBuffer(): void {
    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) {
      throw new Error("Failed to create SSAO framebuffer");
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

    const ssaoTexture = GlUtils.createTexture(
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

    this.ssaoFrameBuffer = { framebuffer, ssaoTexture };
  }

  private initializeSSAOBlurFrameBuffer(): void {
    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) {
      throw new Error("Failed to create SSAO Blur framebuffer");
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

    const ssaoBlurTexture = GlUtils.createTexture(
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
      ssaoBlurTexture,
      0
    );
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    this.ssaoBlurFrameBuffer = { framebuffer, ssaoBlurTexture };
  }

  private initializeScreenQuad(): void {
    const { quadVertices, quadIndices } = require("../map/geometry");

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

    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 20, 0);
    this.gl.enableVertexAttribArray(1);
    this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 20, 12);

    this.gl.bindVertexArray(null);
    this.screenQuadVAO = vao;
  }

  private generateKernels(): void {
    this.kernels = [];
    for (let i = 0; i < this.kernelSize; i++) {
      let sample = vec3.fromValues(
        Math.random() * 2.0 - 1.0,
        Math.random() * 2.0 - 1.0,
        Math.random()
      );

      vec3.normalize(sample, sample);

      let scale = i / this.kernelSize;
      scale = 0.1 + scale * scale * 0.9;
      vec3.scale(sample, sample, scale);

      this.kernels.push(sample);
    }
  }

  private generateNoiseTexture(): void {
    const noiseData = new Float32Array(this.noiseSize * this.noiseSize * 3);
    for (let i = 0; i < this.noiseSize; i++) {
      for (let j = 0; j < this.noiseSize; j++) {
        const index = (i * this.noiseSize + j) * 3;
        noiseData[index] = Math.random() * 2.0 - 1.0;
        noiseData[index + 1] = Math.random() * 2.0 - 1.0;
        noiseData[index + 2] = 0.0;
      }
    }
    this.noiseTexture = GlUtils.createTexture(
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

  getGeometryPassProgram(): WebGLProgram {
    return this.geometryPassProgram!;
  }

  resize(width: number, height: number): void {
    // Delete old resources
    if (this.gBuffer) {
      this.gl.deleteTexture(this.gBuffer.normalTexture);
      this.gl.deleteTexture(this.gBuffer.albedoTexture);
      this.gl.deleteTexture(this.gBuffer.depthTexture);
      this.gl.deleteFramebuffer(this.gBuffer.framebuffer);
      this.gBuffer = null;
    }
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

    // Recreate resources
    this.initializeGBuffer();
    this.initializeSSAOFrameBuffer();
    this.initializeSSAOBlurFrameBuffer();
  }

  renderGeometryPass(
    vaosToRender: VaoInfo[],
    matView: mat4,
    matProj: mat4
  ): void {
    this.gl.bindFramebuffer(
      this.gl.FRAMEBUFFER,
      this.gBuffer?.framebuffer || null
    );
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthMask(true);
    this.gl.disable(this.gl.BLEND);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

    this.gl.useProgram(this.geometryPassProgram);

    this.gl.uniformMatrix4fv(this.geometryUniforms["view"], false, matView);
    this.gl.uniformMatrix4fv(this.geometryUniforms["proj"], false, matProj);

    for (const vaoInfo of vaosToRender) {
      this.gl.bindVertexArray(vaoInfo.vao);
      this.gl.uniformMatrix4fv(
        this.geometryUniforms["model"],
        false,
        vaoInfo.modelMatrix
      );
      this.gl.drawElements(
        this.gl.TRIANGLES,
        vaoInfo.indexCount,
        this.gl.UNSIGNED_INT,
        0
      );
    }
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  renderSSAOPass(matProj: mat4): void {
    this.gl.bindFramebuffer(
      this.gl.FRAMEBUFFER,
      this.ssaoFrameBuffer?.framebuffer || null
    );
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.ssaoPassProgram);
    this.gl.bindVertexArray(this.screenQuadVAO);

    GlUtils.bindTex(
      this.gl,
      this.ssaoPassProgram!,
      this.gBuffer?.normalTexture!,
      "normalTexture",
      0
    );
    GlUtils.bindTex(
      this.gl,
      this.ssaoPassProgram!,
      this.gBuffer?.depthTexture!,
      "depthTexture",
      1
    );
    GlUtils.bindTex(
      this.gl,
      this.ssaoPassProgram!,
      this.noiseTexture!,
      "noiseTexture",
      2
    );

    mat4.invert(this.matProjInverse, matProj);

    this.gl.uniform1f(this.ssaoUniforms["radius"], this.radius);
    this.gl.uniform1f(this.ssaoUniforms["bias"], this.bias);
    this.gl.uniformMatrix4fv(this.ssaoUniforms["proj"], false, matProj);
    this.gl.uniformMatrix4fv(
      this.ssaoUniforms["projInverse"],
      false,
      this.matProjInverse
    );
    this.gl.uniform1f(this.ssaoUniforms["noiseSize"], this.noiseSize);

    for (let i = 0; i < this.kernelSize; i++) {
      this.gl.uniform3fv(
        this.gl.getUniformLocation(this.ssaoPassProgram!, `samples[${i}]`),
        this.kernels[i]
      );
    }

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  renderBlurPass(): void {
    this.gl.bindFramebuffer(
      this.gl.FRAMEBUFFER,
      this.ssaoBlurFrameBuffer?.framebuffer || null
    );
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.ssaoBlurPassProgram);
    this.gl.bindVertexArray(this.screenQuadVAO);

    GlUtils.bindTex(
      this.gl,
      this.ssaoBlurPassProgram!,
      this.ssaoFrameBuffer?.ssaoTexture!,
      "ssaoTexture",
      0
    );
    GlUtils.bindTex(
      this.gl,
      this.ssaoBlurPassProgram!,
      this.gBuffer?.depthTexture!,
      "depthTexture",
      1
    );

    this.gl.uniform1i(
      this.ssaoBlurUniforms["enableBlur"],
      this.enableSSAOBlur ? 1 : 0
    );

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  renderLightingPass(
    cameraPosition: vec3,
    lights: any[],
    matView: mat4,
    matProj: mat4
  ): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.lightingPassProgram);
    this.gl.bindVertexArray(this.screenQuadVAO);

    GlUtils.bindTex(
      this.gl,
      this.lightingPassProgram!,
      this.gBuffer?.normalTexture!,
      "normalTexture",
      0
    );
    GlUtils.bindTex(
      this.gl,
      this.lightingPassProgram!,
      this.gBuffer?.albedoTexture!,
      "albedoTexture",
      1
    );
    GlUtils.bindTex(
      this.gl,
      this.lightingPassProgram!,
      this.gBuffer?.depthTexture!,
      "depthTexture",
      2
    );
    GlUtils.bindTex(
      this.gl,
      this.lightingPassProgram!,
      this.ssaoBlurFrameBuffer?.ssaoBlurTexture!,
      "ssaoTexture",
      3
    );

    mat4.invert(this.matViewInverse, matView);
    mat4.invert(this.matProjInverse, matProj);

    this.gl.uniformMatrix4fv(
      this.lightingUniforms["viewInverse"],
      false,
      this.matViewInverse
    );
    this.gl.uniformMatrix4fv(
      this.lightingUniforms["projInverse"],
      false,
      this.matProjInverse
    );
    this.gl.uniform3fv(this.lightingUniforms["cameraPosition"], cameraPosition);

    GlUtils.updateLights(this.gl, this.lightingPassProgram!, lights);

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
  }

  dispose(): void {
    if (this.gBuffer) {
      this.gl.deleteTexture(this.gBuffer.normalTexture);
      this.gl.deleteTexture(this.gBuffer.albedoTexture);
      this.gl.deleteTexture(this.gBuffer.depthTexture);
      this.gl.deleteFramebuffer(this.gBuffer.framebuffer);
    }
    if (this.ssaoFrameBuffer) {
      this.gl.deleteTexture(this.ssaoFrameBuffer.ssaoTexture);
      this.gl.deleteFramebuffer(this.ssaoFrameBuffer.framebuffer);
    }
    if (this.ssaoBlurFrameBuffer) {
      this.gl.deleteTexture(this.ssaoBlurFrameBuffer.ssaoBlurTexture);
      this.gl.deleteFramebuffer(this.ssaoBlurFrameBuffer.framebuffer);
    }
    if (this.noiseTexture) {
      this.gl.deleteTexture(this.noiseTexture);
    }
    if (this.screenQuadVAO) {
      this.gl.deleteVertexArray(this.screenQuadVAO);
    }
  }
}
