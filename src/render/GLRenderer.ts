import { mat4, vec3 } from "gl-matrix";
import { GlUtils } from "./GlUtils";
import {
  CubeFragmentShaderCode,
  CubeVertexShaderCode,
  MeshGeometryFragmentShaderCode,
  MeshGeometryVertexShaderCode,
  MeshLightingFragmentShaderCode,
  MeshLightingVertexShaderCode,
  MeshSSAOFragmentShaderCode,
  MeshSSAOVertexShaderCode
} from "./glsl";
import { Shader } from "./Shader";
import { Camera } from "./Camera";
import {
  meshToInterleavedVerticesAndIndices,
  meshToNonInterleavedVerticesAndIndices
} from "../map/cubes_utils";
import { WorldMap } from "../map/Map";
import { DebugMenu } from "../DebugMenu";
import {
  cubeVertices,
  cubeWireframeIndices,
  quadPositions,
  quadIndices
} from "../map/geometry";
import { Mesh } from "../map/Mesh";

export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;

  TriangleBuffer: {
    vertex: { position: WebGLBuffer; normal: WebGLBuffer; color: WebGLBuffer };
    indices: WebGLBuffer;
  } | null = null;
  CubeBuffer: { vertex: WebGLBuffer; indices: WebGLBuffer } | null = null;
  QuadBuffer: { vertex: WebGLBuffer; indices: WebGLBuffer } | null = null;
  MeshSize: number = 0;

  matView: mat4;
  matProj: mat4;
  matViewProj: mat4;
  debug: DebugMenu;
  world: WorldMap;

  CubeShader!: Shader;
  MeshGeometryShader!: Shader;
  MeshSSAOShader!: Shader;
  MeshLightingShader!: Shader;

  // Deferred Rendering Related Properties
  kernels: vec3[] = []; // SSAO kernels
  meshGeometryVao: WebGLVertexArrayObject | null = null;
  ssaoFramebuffer: WebGLFramebuffer | null = null;
  ssaoQuadVAO: WebGLVertexArrayObject | null = null;
  lightingQuadVAO: WebGLVertexArrayObject | null = null;
  ssaoNoiseTexture: WebGLTexture | null = null;
  ssaoTexture: WebGLTexture | null = null;
  gBuffer!: {
    frameBuffer: WebGLFramebuffer;
    gPosition: WebGLTexture;
    gNormal: WebGLTexture;
    gAlbedo: WebGLTexture;
    gDepth: WebGLTexture;
  };

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

    gl.depthFunc(gl.LEQUAL); // Ensures closer objects are drawn in front
    this.matView = mat4.create();
    this.matProj = mat4.create();
    this.matViewProj = mat4.create();

    const size = 4;
  }
  GenerateTriangleBuffer(triangleMeshes: Mesh[]) {
    // These coordinates are in clip space, to see a visualization, go to https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection
    let trianglePositions: number[] = [];
    let triangleNormals: number[] = [];
    let triangleColors: number[] = [];
    let triangleIndices: number[] = [];
    let indexOffset = 0;

    for (let i = 0; i < triangleMeshes.length; i++) {
      const Mesh = triangleMeshes[i];
      const vertexData = meshToNonInterleavedVerticesAndIndices(Mesh);

      // Add non-interleaved vertex attributes
      trianglePositions = trianglePositions.concat(
        Array.from(vertexData.positions)
      );
      triangleNormals = triangleNormals.concat(Array.from(vertexData.normals));
      triangleColors = triangleColors.concat(Array.from(vertexData.colors));

      // Adjust and add indices
      const adjustedIndices = Array.from(vertexData.indices).map(
        (index) => index + indexOffset
      );
      triangleIndices = triangleIndices.concat(adjustedIndices);

      // Update offset based on number of vertices (not floats)
      indexOffset += vertexData.positions.length / 3; // 3 components per position
    }

    this.MeshSize = triangleIndices.length;

    // Initialize Buffers
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
    // Initialize shaders
    this.CubeShader = new Shader(
      this.gl,
      CubeVertexShaderCode,
      CubeFragmentShaderCode
    );
    this.MeshGeometryShader = new Shader(
      this.gl,
      MeshGeometryVertexShaderCode,
      MeshGeometryFragmentShaderCode
    );
    this.MeshSSAOShader = new Shader(
      this.gl,
      MeshSSAOVertexShaderCode,
      MeshSSAOFragmentShaderCode
    );
    this.MeshLightingShader = new Shader(
      this.gl,
      MeshLightingVertexShaderCode,
      MeshLightingFragmentShaderCode
    );
    this.initializeBuffers();
  }
  initializeBuffers() {
    this.initializeGeometryBuffers();
    this.initSSAOBuffers();
    this.initLightingBuffers();
  }

  initializeGeometryBuffers() {
    // Create and set up G-Buffer and its textures
    const gBuffer = this.gl.createFramebuffer()!;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, gBuffer);

    // Position Texture (World Space)
    const gPosition = this.gl.createTexture()!;
    this.gl.bindTexture(this.gl.TEXTURE_2D, gPosition);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA32F,
      this.canvas.width,
      this.canvas.height,
      0,
      this.gl.RGBA,
      this.gl.FLOAT,
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
      gPosition,
      0
    );

    // Normal Texture (World Space)
    const gNormal = this.gl.createTexture()!;
    this.gl.bindTexture(this.gl.TEXTURE_2D, gNormal);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA16F,
      this.canvas.width,
      this.canvas.height,
      0,
      this.gl.RGBA,
      this.gl.FLOAT,
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
      this.gl.COLOR_ATTACHMENT1,
      this.gl.TEXTURE_2D,
      gNormal,
      0
    );

    // Albedo Texture
    const gAlbedo = this.gl.createTexture()!;
    this.gl.bindTexture(this.gl.TEXTURE_2D, gAlbedo);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.canvas.width,
      this.canvas.height,
      0,
      this.gl.RGBA,
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
      this.gl.COLOR_ATTACHMENT2,
      this.gl.TEXTURE_2D,
      gAlbedo,
      0
    );

    const gDepth = this.gl.createTexture()!;
    this.gl.bindTexture(this.gl.TEXTURE_2D, gDepth);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.DEPTH_COMPONENT24,
      this.canvas.width,
      this.canvas.height,
      0,
      this.gl.DEPTH_COMPONENT,
      this.gl.UNSIGNED_INT,
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
      this.gl.DEPTH_ATTACHMENT,
      this.gl.TEXTURE_2D,
      gDepth,
      0
    );

    // Check framebuffer completeness
    if (
      this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !==
      this.gl.FRAMEBUFFER_COMPLETE
    ) {
      console.error("G-Buffer framebuffer is not complete!");
    }

    this.gBuffer = {
      frameBuffer: gBuffer,
      gPosition: gPosition,
      gNormal: gNormal,
      gAlbedo: gAlbedo,
      gDepth: gDepth
    };

    // Create VAO for mesh geometry (assuming TriangleBuffer is already set)
    this.meshGeometryVao = GlUtils.createNonInterleavedVao(
      this.gl,
      {
        aPosition: { buffer: this.TriangleBuffer!.vertex.position, size: 3 },
        aNormal: { buffer: this.TriangleBuffer!.vertex.normal, size: 3 },
        aColor: { buffer: this.TriangleBuffer!.vertex.color, size: 3 }
      },
      this.TriangleBuffer!.indices,
      this.MeshGeometryShader
    );

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
  //Geometry Pass for Deferred Rendering
  MeshGeometryPass(uModelMatrix: mat4) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.gBuffer.frameBuffer);

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LESS);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.useProgram(this.MeshGeometryShader.Program!);
    this.gl.bindVertexArray(this.meshGeometryVao);

    // Set uniforms as needed (e.g., transformation matrices)
    this.gl.uniformMatrix4fv(
      this.MeshGeometryShader.Uniforms["uModel"].location,
      false,
      uModelMatrix
    );
    this.gl.uniformMatrix4fv(
      this.MeshGeometryShader.Uniforms["uView"].location,
      false,
      this.matView
    );
    this.gl.uniformMatrix4fv(
      this.MeshGeometryShader.Uniforms["uProj"].location,
      false,
      this.matProj
    );

    this.gl.drawBuffers([
      this.gl.COLOR_ATTACHMENT0,
      this.gl.COLOR_ATTACHMENT1,
      this.gl.COLOR_ATTACHMENT2
    ]);

    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.MeshSize,
      this.gl.UNSIGNED_INT,
      0
    );

    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
  //Kernels for SSAO
  generateKernels() {
    const lerp = (a: number, b: number, f: number) => a + f * (b - a);

    for (let i = 0; i < 16; ++i) {
      let sample = vec3.fromValues(
        Math.random() * 2.0 - 1.0,
        Math.random() * 2.0 - 1.0,
        Math.random()
      );
      vec3.normalize(sample, sample);
      vec3.scale(sample, sample, Math.random());

      //Accelerating interpolation function
      let scale: GLfloat = i / 16.0;
      scale = lerp(0.1, 1.0, scale * scale);
      vec3.scale(sample, sample, scale);
      this.kernels.push(sample);
    }
  }

  // Initialize SSAO buffers and textures
  initSSAOBuffers() {
    // Create Noise Texture
    const noiseSize = 4;
    const noiseData = new Float32Array(noiseSize * noiseSize * 3);
    for (let i = 0; i < noiseSize * noiseSize; i++) {
      noiseData[i * 3 + 0] = Math.random() * 2 - 1;
      noiseData[i * 3 + 1] = Math.random() * 2 - 1;
      noiseData[i * 3 + 2] = 0.0;
    }

    const noiseTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, noiseTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGB32F,
      noiseSize,
      noiseSize,
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
    this.ssaoNoiseTexture = noiseTexture;

    // Create and bind the SSAO framebuffer
    const ssaoBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, ssaoBuffer);

    // Create the SSAO texture
    this.ssaoTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.ssaoTexture);
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
      this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.LINEAR
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
      this.ssaoTexture,
      0
    );

    // Check framebuffer completeness
    if (
      this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !==
      this.gl.FRAMEBUFFER_COMPLETE
    ) {
      console.error("SSAO framebuffer is not complete!");
    }

    this.ssaoFramebuffer = ssaoBuffer;

    // Create fullscreen quad VAO for SSAO
    this.ssaoQuadVAO = GlUtils.createNonInterleavedVao(
      this.gl,
      {
        aPosition: { buffer: this.QuadBuffer!.vertex, size: 2 }
      },
      this.QuadBuffer!.indices,
      this.MeshSSAOShader
    );

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  initLightingBuffers() {
    this.lightingQuadVAO = GlUtils.createNonInterleavedVao(
      this.gl,
      {
        aPosition: { buffer: this.QuadBuffer!.vertex, size: 2 }
      },
      this.QuadBuffer!.indices,
      this.MeshLightingShader
    );
  }

  // Screen Space Ambient Occlusion Pass
  SSAOPass() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.ssaoFramebuffer);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.disable(this.gl.DEPTH_TEST); // No depth testing for post-process
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.useProgram(this.MeshSSAOShader.Program!);

    // Send projection matrix to SSAO shader
    this.gl.uniformMatrix4fv(
      this.MeshSSAOShader.Uniforms["uProj"].location,
      false,
      this.matProj
    );

    // Send kernels
    for (let i = 0; i < this.kernels.length; i++) {
      const loc = this.gl.getUniformLocation(
        this.MeshSSAOShader.Program!,
        `samples[${i}]`
      );
      this.gl.uniform3fv(loc, this.kernels[i]);
    }

    const noiseScale = [this.canvas.width / 4, this.canvas.height / 4];
    const loc = this.gl.getUniformLocation(
      this.MeshSSAOShader.Program!,
      "noiseScale"
    );
    this.gl.uniform2fv(loc, noiseScale);

    // Bind textures
    GlUtils.bindTex(
      this.gl,
      this.MeshSSAOShader.Program!,
      this.gBuffer.gPosition,
      "gPosition",
      0
    );
    GlUtils.bindTex(
      this.gl,
      this.MeshSSAOShader.Program!,
      this.gBuffer.gNormal,
      "gNormal",
      1
    );
    GlUtils.bindTex(
      this.gl,
      this.MeshSSAOShader.Program!,
      this.ssaoNoiseTexture!,
      "texNoise",
      2
    );

    this.gl.bindVertexArray(this.ssaoQuadVAO);
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);

    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  // Lighting Pass
  LightingPass() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.disable(this.gl.DEPTH_TEST); // No depth testing for final composite
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.useProgram(this.MeshLightingShader.Program!);

    // Bind G-Buffer textures and SSAO texture
    GlUtils.bindTex(
      this.gl,
      this.MeshLightingShader.Program!,
      this.gBuffer.gPosition,
      "gPosition",
      0
    );
    GlUtils.bindTex(
      this.gl,
      this.MeshLightingShader.Program!,
      this.gBuffer.gNormal,
      "gNormal",
      1
    );
    GlUtils.bindTex(
      this.gl,
      this.MeshLightingShader.Program!,
      this.gBuffer.gAlbedo,
      "gAlbedo",
      2
    );
    GlUtils.bindTex(
      this.gl,
      this.MeshLightingShader.Program!,
      this.ssaoTexture!,
      "ssao",
      3
    );

    // Update lights and view matrix
    GlUtils.updateLights(
      this.gl,
      this.MeshLightingShader.Program!,
      this.world.lights,
      this.camera
    );
    this.gl.uniformMatrix4fv(
      this.MeshLightingShader.Uniforms["uView"].location,
      false,
      this.matView
    );

    this.gl.bindVertexArray(this.lightingQuadVAO);
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);

    this.gl.bindVertexArray(null);
  }

  drawMesh(uModelMatrix: mat4) {
    // 1. Geometry Pass - Fill G-Buffer
    this.MeshGeometryPass(uModelMatrix);

    // 2. SSAO Pass
    this.SSAOPass();

    // 3. Lighting Pass - Final render
    this.LightingPass();
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
    // Set clear color to black, fully opaque
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Calculate view and projection matrices once per frame
    const matViewAndProj = this.camera.calculateProjectionMatrices(
      this.canvas.width,
      this.canvas.height
    );
    this.matView = matViewAndProj.matView;
    this.matProj = matViewAndProj.matProj;
    this.matViewProj = this.camera.calculateProjectionMatrix(
      this.canvas.width,
      this.canvas.height
    );
    const resScaleFactor = 1;

    if (this.debug.debugMode) {
      for (const chunk of this.world.chunks) {
        debugger;
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

        this.drawMesh(
          GlUtils.CreateTransformations(
            undefined,
            undefined,
            vec3.fromValues(resScaleFactor, resScaleFactor, resScaleFactor)
          )
        );
      }
    }
  }
}
