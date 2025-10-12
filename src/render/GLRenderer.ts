import { mat4, vec3 } from "gl-matrix";
import { GlUtils } from "./GlUtils";
import {
  CubeFragmentShaderCode,
  CubeVertexShaderCode,
  MeshGeometryFragmentShaderCode,
  MeshGeometryVertexShaderCode,
  MeshLightingFragmentShaderCode,
  MeshLightingVertexShaderCode,
  MeshSSAOBlurVertexShaderCode,
  MeshSSAOBlurFragmentShaderCode,
  MeshSSAOFragmentShaderCode,
  MeshSSAOVertexShaderCode
  // TODO: Add deferred rendering shaders
  // GeometryPassVertexShaderCode,
  // GeometryPassFragmentShaderCode,
  // LightingPassVertexShaderCode,
  // LightingPassFragmentShaderCode
} from "./glsl";
import { Shader } from "./Shader";
import { Camera } from "./Camera";
import { meshToNonInterleavedVerticesAndIndices } from "../map/cubes_utils";
import { WorldMap } from "../map/Map";
import { DebugMenu } from "../DebugMenu";
import {
  cubeVertices,
  cubeWireframeIndices,
  quadPositions,
  quadIndices
} from "../map/geometry";
import { Mesh } from "../map/Mesh";
import { Utilities } from "../map/Utilities";

export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;

  // Geometry buffers
  TriangleBuffer: {
    vertex: { position: WebGLBuffer; normal: WebGLBuffer; color: WebGLBuffer };
    indices: WebGLBuffer;
  } | null = null;
  CubeBuffer: { vertex: WebGLBuffer; indices: WebGLBuffer } | null = null;
  QuadBuffer: { vertex: WebGLBuffer; indices: WebGLBuffer } | null = null;
  MeshSize: number = 0;

  // G-Buffer for deferred rendering with depth reconstruction
  gBuffer: {
    framebuffer: WebGLFramebuffer;
    normalTexture: WebGLTexture; // RGB: world space normals
    albedoTexture: WebGLTexture; // RGB: albedo
    depthTexture: WebGLTexture; // Depth buffer
  } | null = null;
  ssaoFrameBuffer: {
    framebuffer: WebGLFramebuffer;
    ssaoTexture: WebGLTexture; // SSAO result
  } | null = null;
  ssaoBlurFrameBuffer: {
    framebuffer: WebGLFramebuffer;
    ssaoBlurTexture: WebGLTexture; // Blurred SSAO result
  } | null = null;
  // Screen-space quad for fullscreen passes
  screenQuadVAO: WebGLVertexArrayObject | null = null;

  // Matrices
  matView: mat4;
  matProj: mat4;
  matViewProj: mat4;
  matProjInverse: mat4;
  matViewInverse: mat4;
  debug: DebugMenu;
  world: WorldMap;

  // Shaders
  CubeShader!: Shader;
  // Deferred rendering shaders
  geometryPassShader!: Shader; // Renders to G-Buffer
  ssaoPassShader!: Shader; // SSAO effect
  ssaoBlurPassShader!: Shader; // Blurs SSAO texture
  lightingPassShader!: Shader; // Combines G-Buffer data for final image

  //SSAO stuff
  kernelSize: number = 64;
  kernels: vec3[] = [];
  noiseTexture: WebGLTexture | null = null;
  noiseSize: number = 64;

  // Add VAO property for geometry pass
  geometryVAO: WebGLVertexArrayObject | null = null;

  constructor(
    gl: WebGL2RenderingContext,
    canvas: HTMLCanvasElement,
    camera: Camera,
    debug: DebugMenu,
    world: WorldMap
  ) {
    this.gl = gl;
    this.canvas = canvas;
    this.camera = camera;
    this.debug = debug;
    this.world = world;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.depthFunc(gl.LEQUAL);

    this.matView = mat4.create();
    this.matProj = mat4.create();
    this.matViewProj = mat4.create();
    this.matProjInverse = mat4.create();
    this.matViewInverse = mat4.create();

    // Initialize deferred rendering components
    this.initializeGBuffer();
    this.initializeSSAOFrameBuffer();
    this.initializeSSAOBlurFrameBuffer();
    this.initializeScreenQuad();
    this.generateKernels();
    this.generateNoiseTexture();
  }
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
        noiseData[index + 2] = 0.0; // Z component is zero
      }
    }
    this.noiseTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.noiseTexture);

    // Add the missing texture setup
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGB32F,
      this.noiseSize,
      this.noiseSize,
      0,
      this.gl.RGB,
      this.gl.FLOAT,
      noiseData
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.REPEAT
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.REPEAT
    );
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  private initializeGBuffer() {
    const gl = this.gl;
    const ext = this.gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
      throw new Error(
        "EXT_color_buffer_float is not supported on this device."
      );
    }
    // Create normal texture (RGB: world space normals)
    const normalTexture = gl.createTexture();
    if (!normalTexture) {
      throw new Error("Failed to create normal texture");
    }
    gl.bindTexture(gl.TEXTURE_2D, normalTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16F, // High precision for normals
      this.canvas.width,
      this.canvas.height,
      0,
      gl.RGBA,
      gl.FLOAT,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Create albedo texture (RGB: albedo color)
    const albedoTexture = gl.createTexture();
    if (!albedoTexture) {
      throw new Error("Failed to create albedo texture");
    }
    gl.bindTexture(gl.TEXTURE_2D, albedoTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8, // 8-bit precision for colors
      this.canvas.width,
      this.canvas.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Create depth texture (stores depth information)
    const depthTexture = gl.createTexture();
    if (!depthTexture) {
      throw new Error("Failed to create depth texture");
    }
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.DEPTH_COMPONENT32F,
      this.canvas.width,
      this.canvas.height,
      0,
      gl.DEPTH_COMPONENT,
      gl.FLOAT,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Create framebuffer and attach textures
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
      throw new Error("Failed to create framebuffer");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    // Attach normal texture to framebuffer
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      normalTexture,
      0
    );

    // Attach albedo texture to framebuffer
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT1,
      gl.TEXTURE_2D,
      albedoTexture,
      0
    );

    // Attach depth texture to framebuffer
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      depthTexture,
      0
    );

    // Set draw buffers for multiple render targets
    gl.drawBuffers([
      gl.COLOR_ATTACHMENT0, // Normal texture
      gl.COLOR_ATTACHMENT1 // Albedo texture
    ]);

    // Check framebuffer completeness
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Framebuffer is not complete: " + status.toString());
    }

    // Unbind framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Store G-Buffer textures and framebuffer
    this.gBuffer = {
      framebuffer: framebuffer,
      normalTexture: normalTexture,
      albedoTexture: albedoTexture,
      depthTexture: depthTexture
    };
  }
  // Initialize SSAO framebuffer and textures
  private initializeSSAOFrameBuffer() {
    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) {
      throw new Error("Failed to create SSAO framebuffer");
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    const ssaoTexture = this.gl.createTexture();
    if (!ssaoTexture) {
      throw new Error("Failed to create SSAO texture");
    }
    this.gl.bindTexture(this.gl.TEXTURE_2D, ssaoTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.R8,
      this.canvas.width,
      this.canvas.height,
      0,
      this.gl.RED,
      this.gl.UNSIGNED_BYTE,
      null
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE
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
  private initializeSSAOBlurFrameBuffer() {
    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) {
      throw new Error("Failed to create SSAO Blur framebuffer");
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    const ssaoBlurTexture = this.gl.createTexture();
    if (!ssaoBlurTexture) {
      throw new Error("Failed to create SSAO Blur texture");
    }
    this.gl.bindTexture(this.gl.TEXTURE_2D, ssaoBlurTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.R8,
      this.canvas.width,
      this.canvas.height,
      0,
      this.gl.RED,
      this.gl.UNSIGNED_BYTE,
      null
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE
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
    this.ssaoBlurFrameBuffer = {
      framebuffer: framebuffer,
      ssaoBlurTexture: ssaoBlurTexture
    };
  }
  // Initialize screen-space quad for fullscreen passes
  private initializeScreenQuad() {
    const quadVertices = new Float32Array([
      -1.0,
      -1.0,
      0.0,
      0.0,
      0.0, // Bottom-left
      1.0,
      -1.0,
      0.0,
      1.0,
      0.0, // Bottom-right
      1.0,
      1.0,
      0.0,
      1.0,
      1.0, // Top-right
      -1.0,
      1.0,
      0.0,
      0.0,
      1.0 // Top-left
    ]);
    const quadIndices = new Uint16Array([0, 1, 2, 2, 3, 0]);

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

    // Position attribute (location 0)
    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 20, 0);
    // TexCoord attribute (location 1)
    this.gl.enableVertexAttribArray(1);
    this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 20, 12);

    this.gl.bindVertexArray(null);
    this.screenQuadVAO = vao;
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

    this.MeshSize = triangleIndices.length;

    this.TriangleBuffer = {
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
    this.CubeBuffer = GlUtils.CreateStaticBuffer(
      this.gl,
      new Float32Array(cubeVertices),
      cubeWireframeIndices
    );
    const QuadBufferVertices = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, QuadBufferVertices);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      quadPositions,
      this.gl.STATIC_DRAW
    );
    const QuadBufferIndices = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, QuadBufferIndices);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      quadIndices,
      this.gl.STATIC_DRAW
    );
    this.QuadBuffer = {
      vertex: QuadBufferVertices,
      indices: QuadBufferIndices
    };
    this.CubeShader = new Shader(
      this.gl,
      CubeVertexShaderCode,
      CubeFragmentShaderCode
    );
    this.geometryPassShader = new Shader(
      this.gl,
      MeshGeometryVertexShaderCode,
      MeshGeometryFragmentShaderCode
    );
    this.ssaoPassShader = new Shader(
      this.gl,
      MeshSSAOVertexShaderCode,
      MeshSSAOFragmentShaderCode
    );
    this.ssaoBlurPassShader = new Shader(
      this.gl,
      MeshSSAOBlurVertexShaderCode,
      MeshSSAOBlurFragmentShaderCode
    );
    this.lightingPassShader = new Shader(
      this.gl,
      MeshLightingVertexShaderCode,
      MeshLightingFragmentShaderCode
    );

    // Create VAO for geometry pass after shaders are initialized
    this.geometryVAO = GlUtils.createNonInterleavedVao(
      this.gl,
      {
        VertexPosition: {
          buffer: this.TriangleBuffer.vertex.position,
          size: 3
        },
        VertexNormal: {
          buffer: this.TriangleBuffer.vertex.normal,
          size: 3
        },
        VertexColor: {
          buffer: this.TriangleBuffer.vertex.color,
          size: 3
        }
      },
      this.TriangleBuffer.indices,
      this.geometryPassShader
    );
  }

  // Simplified geometry pass using VAO
  private geometryPass(uModel: mat4) {
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

    this.gl.useProgram(this.geometryPassShader.Program!);

    // Set uniforms
    this.gl.uniformMatrix4fv(
      this.geometryPassShader.Uniforms["uModel"].location,
      false,
      uModel
    );
    this.gl.uniformMatrix4fv(
      this.geometryPassShader.Uniforms["uView"].location,
      false,
      this.matView
    );
    this.gl.uniformMatrix4fv(
      this.geometryPassShader.Uniforms["uProj"].location,
      false,
      this.matProj
    );

    // Check if VAO and TriangleBuffer are initialized
    if (!this.geometryVAO) {
      throw new Error("Geometry VAO not initialized");
    }
    if (!this.TriangleBuffer) {
      throw new Error("TriangleBuffer not initialized");
    }

    // Bind VAO and draw
    this.gl.bindVertexArray(this.geometryVAO);
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.MeshSize,
      this.gl.UNSIGNED_INT,
      0
    );

    // Clean up
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
  // SSAO Pass: Apply screen-space ambient occlusion
  private ssaoPass() {
    this.gl.bindFramebuffer(
      this.gl.FRAMEBUFFER,
      this.ssaoFrameBuffer?.framebuffer || null
    );
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.ssaoPassShader.Program!);
    this.gl.bindVertexArray(this.screenQuadVAO);

    // Bind textures with proper active texture units
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.gBuffer?.normalTexture!);
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.ssaoPassShader.Program!, "uNormalTex"),
      0
    );

    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.gBuffer?.depthTexture!);
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.ssaoPassShader.Program!, "uDepthTex"),
      1
    );

    this.gl.activeTexture(this.gl.TEXTURE2);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.noiseTexture!);
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.ssaoPassShader.Program!, "uNoiseTex"),
      2
    );

    this.gl.uniformMatrix4fv(
      this.ssaoPassShader.Uniforms["uProj"].location,
      false,
      this.matProj
    );
    console.log("MatProjInverse SSAO:", this.matProjInverse);
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(this.ssaoPassShader.Program!, "uProjInverse"),
      false,
      this.matProjInverse
    );
    this.gl.uniform1f(
      this.ssaoPassShader.Uniforms["uNoiseSize"].location,
      this.noiseSize
    );

    // Send over kernels
    for (let i = 0; i < this.kernelSize; i++) {
      this.gl.uniform3fv(
        this.gl.getUniformLocation(
          this.ssaoPassShader.Program!,
          `uSamples[${i}]`
        ),
        this.kernels[i]
      );
    }

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  // Blur Pass: Blur SSAO texture to reduce noise
  private blurPass() {
    this.gl.bindFramebuffer(
      this.gl.FRAMEBUFFER,
      this.ssaoBlurFrameBuffer?.framebuffer || null
    );
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.ssaoBlurPassShader.Program!);
    this.gl.bindVertexArray(this.screenQuadVAO);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.ssaoFrameBuffer?.ssaoTexture!);
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.ssaoBlurPassShader.Program!, "ssaoInput"),
      0
    );

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  // Lighting Pass: Combine G-Buffer data to produce final image
  private lightingPass() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.lightingPassShader.Program!);
    this.gl.bindVertexArray(this.screenQuadVAO);

    // Bind all G-Buffer textures
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.gBuffer?.normalTexture!);
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.lightingPassShader.Program!, "gNormal"),
      0
    );

    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.gBuffer?.albedoTexture!);
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.lightingPassShader.Program!, "gAlbedo"),
      1
    );

    this.gl.activeTexture(this.gl.TEXTURE2);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.gBuffer?.depthTexture!);
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.lightingPassShader.Program!, "gDepth"),
      2
    );

    this.gl.activeTexture(this.gl.TEXTURE3);
    this.gl.bindTexture(
      this.gl.TEXTURE_2D,
      this.ssaoBlurFrameBuffer?.ssaoBlurTexture!
    );
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.lightingPassShader.Program!, "ssao"),
      3
    );

    this.gl.uniformMatrix4fv(
      this.lightingPassShader.Uniforms["uViewInverse"].location,
      false,
      this.matViewInverse
    );
    console.log("MatProjInverse:", this.matProjInverse);
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(
        this.lightingPassShader.Program!,
        "uProjInverse"
      ),
      false,
      this.matProjInverse
    );
    this.gl.uniform3fv(
      this.lightingPassShader.Uniforms["viewPos"].location,
      this.camera.position
    );

    GlUtils.updateLights(
      this.gl,
      this.lightingPassShader.Program!,
      this.world.lights
    );

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
  }

  drawMesh(uModelMatrix: mat4) {
    this.geometryPass(uModelMatrix);
    this.ssaoPass();
    this.blurPass();
    this.lightingPass();
  }

  DrawWireFrameCube(TransformationMatrix: mat4) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.useProgram(this.CubeShader.Program!);
    this.gl.uniformMatrix4fv(
      this.CubeShader.Uniforms["MatrixTransform"].location,
      false,
      TransformationMatrix
    );
    this.gl.uniformMatrix4fv(
      this.CubeShader.Uniforms["matViewProj"].location,
      false,
      this.matViewProj
    );

    if (!this.CubeBuffer) throw new Error("CubeBuffer not initialized.");

    const cubeVao = GlUtils.createInterleavedVao(
      this.gl,
      this.CubeBuffer.vertex,
      this.CubeBuffer.indices,
      this.CubeShader,
      {
        VertexPosition: { offset: 0, stride: 24, sizeOverride: 3 },
        VertexColor: { offset: 12, stride: 24 }
      }
    );
    this.gl.bindVertexArray(cubeVao);
    this.gl.drawElements(this.gl.LINES, 24, this.gl.UNSIGNED_INT, 0);
    this.gl.bindVertexArray(null);
  }

  render() {
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);

    const matViewAndProj = this.camera.calculateProjectionMatrices(
      this.canvas.width,
      this.canvas.height
    );
    this.matView = matViewAndProj.matView;
    this.matProj = matViewAndProj.matProj;
    mat4.invert(this.matProjInverse, this.matProj);
    mat4.invert(this.matViewInverse, this.matView);
    mat4.multiply(this.matViewProj, this.matProj, this.matView);

    // Deferred rendering pipeline
    // TODO: Uncomment when implementing deferred rendering
    // this.geometryPass();
    // this.lightingPass();

    // Fallback to forward rendering for now
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    const resScaleFactor = 1;

    if (this.debug.debugMode) {
      for (const chunk of this.world.chunks) {
        this.DrawWireFrameCube(
          GlUtils.CreateTransformations(
            vec3.fromValues(chunk.ChunkPosition[0], 0, chunk.ChunkPosition[1]),
            undefined,
            vec3.fromValues(
              this.world.resolution,
              this.world.height,
              this.world.resolution
            )
          )
        );
      }
    }
    this.drawMesh(
      GlUtils.CreateTransformations(
        vec3.fromValues(0, 0, 0),
        undefined,
        vec3.fromValues(resScaleFactor, resScaleFactor, resScaleFactor)
      )
    );
  }

  // Cleanup resources
  dispose() {
    if (this.geometryVAO) {
      this.gl.deleteVertexArray(this.geometryVAO);
    }
    // TODO: Delete G-Buffer textures and framebuffer
    // TODO: Delete other VAOs
    // TODO: Delete shaders
  }
}
