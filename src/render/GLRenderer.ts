import { mat4, vec3 } from "gl-matrix";
import { GlUtils } from "./GlUtils";
import {
  CubeFragmentShaderCode,
  CubeVertexShaderCode,
  MeshGeometryFragmentShaderCode,
  MeshGeometryVertexShaderCode,
  MeshSSAOFragmentShaderCode,
  MeshSSAOVertexShaderCode,
} from "./glsl";
import { Shader } from "./Shader";
import { Camera } from "./Camera";
import { meshToInterleavedVerticesAndIndices, meshToNonInterleavedVerticesAndIndices } from "../map/cubes_utils";
import { WorldMap } from "../map/Map";
import { DebugMenu } from "../DebugMenu";
import { cubeVertices, cubeWireframeIndices, quadPositions, quadIndices } from "../map/geometry";
import { Mesh } from "../map/Mesh";

export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;

  TriangleBuffer: { vertex: {position: WebGLBuffer, normal: WebGLBuffer, color: WebGLBuffer}; indices: WebGLBuffer } | null = null;
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

  // Deferred Rendering Related Properties
  kernels: vec3[] = []; // SSAO kernels
  ssaoNoiseTexture: WebGLTexture | null = null;
  gBuffer!: {
    frameBuffer: WebGLFramebuffer;
    gPosition: WebGLTexture;
    gNormal: WebGLTexture;
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

    gl.enable(gl.DEPTH_TEST);
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
      trianglePositions = trianglePositions.concat(Array.from(vertexData.positions));
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
      position: GlUtils.CreateAttributeBuffer(this.gl, new Float32Array(trianglePositions)),
      normal: GlUtils.CreateAttributeBuffer(this.gl, new Float32Array(triangleNormals)),
      color: GlUtils.CreateAttributeBuffer(this.gl, new Float32Array(triangleColors)),
    },
      indices: GlUtils.CreateIndexBuffer(this.gl, triangleIndices),
    };
    this.CubeBuffer = GlUtils.CreateStaticBuffer(this.gl, new Float32Array(cubeVertices),cubeWireframeIndices);
    this.QuadBuffer!.vertex = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.QuadBuffer!);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, quadPositions, this.gl.STATIC_DRAW);
    this.QuadBuffer!.indices = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.QuadBuffer!);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, quadIndices, this.gl.STATIC_DRAW);
    // Initialize shaders
    this.CubeShader = new Shader(this.gl, CubeVertexShaderCode,CubeFragmentShaderCode);
    this.MeshGeometryShader = new Shader(this.gl, MeshGeometryVertexShaderCode,MeshGeometryFragmentShaderCode);
    this.MeshSSAOShader = new Shader(this.gl, MeshSSAOVertexShaderCode,MeshSSAOFragmentShaderCode);
  }

  //Geometry Pass for Deferred Rendering
  MeshGeometryPass(uModelMatrix: mat4) {
    //Create and bind the G-Buffer
    const gBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, gBuffer);

    //Position Texture
    const gPosition = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, gPosition);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA16F, this.canvas.width, this.canvas.height, 0, this.gl.RGBA, this.gl.FLOAT, null);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, gPosition, 0);

    //Normal Texture
    const gNormal = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, gNormal);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA16F, this.canvas.width, this.canvas.height, 0, this.gl.RGBA, this.gl.FLOAT, null);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT1, this.gl.TEXTURE_2D, gNormal, 0);
    
    //Create VAO
    const meshGeometryVao = GlUtils.createNonInterleavedVao(
    this.gl,
    {
      VertexPosition: {
        buffer: this.TriangleBuffer!.vertex.position,
        size: 3,
      },
      VertexNormal: {
        buffer: this.TriangleBuffer!.vertex.normal,
        size: 3,
      },
    },
    this.TriangleBuffer!.indices,
    this.MeshGeometryShader
    );

    this.gl.useProgram(this.MeshGeometryShader.Program!);
    this.gl.bindVertexArray(meshGeometryVao);

    // Set uniforms as needed (e.g., transformation matrices)
    this.gl.uniformMatrix4fv(
      this.MeshGeometryShader.VertexUniforms["uModel"],
      false,
      uModelMatrix
    );
    this.gl.uniformMatrix4fv(
      this.MeshGeometryShader.VertexUniforms["uView"],
      false,
      this.matView
    );
    this.gl.uniformMatrix4fv(
      this.MeshGeometryShader.VertexUniforms["uProj"],
      false,
      this.matProj
    );

    //Draw the mesh
    this.gl.drawBuffers([
      this.gl.COLOR_ATTACHMENT0, // Position
      this.gl.COLOR_ATTACHMENT1 // Normal
    ]);

    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.MeshSize,
      this.gl.UNSIGNED_INT,
      0
    );

    this.gBuffer = {
      frameBuffer: gBuffer,
      gPosition: gPosition,
      gNormal: gNormal
    };

    // Unbind the framebuffer and VAO
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindVertexArray(null);
  }
  //Kernels for SSAO
  generateKernels() {
    const lerp = (a: number, b: number, f: number) => a + f * (b - a);

    for (let i = 0; i < 16; ++i) {
      let sample = vec3.fromValues(
        Math.random() * 2.0 - 1.0,
        Math.random() * 2.0 - 1.0,
        Math.random() * 2.0 - 1.0
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
  // Screen Space Ambient Occlusion Pass
  SSAOPass() {
    //Create Noise Texture
    const noiseSize = 4;
    const noiseData = new Float32Array(noiseSize * noiseSize * 3);
    for (let i = 0; i < noiseSize * noiseSize; i++) {
      noiseData[i * 3 + 0] = Math.random() * 2 - 1;
      noiseData[i * 3 + 1] = Math.random() * 2 - 1;
      noiseData[i * 3 + 2] = 0.0;
    }

    const noiseTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, noiseTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, noiseSize, noiseSize, 0, this.gl.RGB, this.gl.FLOAT, noiseData);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
    this.ssaoNoiseTexture = noiseTexture;

    // Create and bind the SSAO framebuffer
    const ssaoBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, ssaoBuffer);

    // Create the SSAO texture
    const ssaoTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, ssaoTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.canvas.width, this.canvas.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      ssaoTexture,
      0
    );

    //Send Uniforms to the SSAO shader
    for (let i = 0; i < this.kernels.length; i++) {
      const loc = this.gl.getUniformLocation(
        this.MeshSSAOShader.Program!,
        `samples[${i}]`
      );
      this.gl.uniform3fv(loc, this.kernels[i]);
    }
    const noiseScale = [
      this.canvas.width / noiseSize,
      this.canvas.height / noiseSize
    ];
    const loc = this.gl.getUniformLocation(
      this.MeshSSAOShader.Program!,
      "noiseScale"
    );
    this.gl.uniform2fv(loc, noiseScale);

    //Bind Textures
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
      this.ssaoNoiseTexture,
      "texNoise",
      2
    );
    // Use the SSAO shader program
    this.gl.useProgram(this.MeshSSAOShader.Program!);

    // Create fullscreen quad VAO 
    

    const quadVAO = GlUtils.createNonInterleavedVao(
      this.gl,
      {
        aPosition: { buffer: this.QuadBuffer!.vertex, size: 2 },
      },
      this.QuadBuffer!.indices,
      this.MeshSSAOShader
    );

    this.gl.bindVertexArray(quadVAO);

    this.gl.drawElements(
      this.gl.TRIANGLES,
      quadIndices.length,
      this.gl.UNSIGNED_SHORT,
      0
    );

    // Unbind the framebuffer and VAO
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
  LightingPass() {
    //Ensure default framebuffer is bound
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

  }

  DrawWireFrameCube(TransformationMatrix: mat4) {
    this.gl.useProgram(this.CubeShader.Program!);
    this.gl.uniformMatrix4fv(
      this.CubeShader.VertexUniforms["MatrixTransform"].location,
      false,
      TransformationMatrix
    );
    this.gl.uniformMatrix4fv(
      this.CubeShader.VertexUniforms["matViewProj"].location,
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
    const matViewAndProj = this.camera.calculateProjectionMatrix(
      this.canvas.width,
      this.canvas.height
    );
    this.matView = matViewAndProj.matView;
    this.matProj = matViewAndProj.matProj;
    mat4.multiply(this.matViewProj, this.matView, this.matProj);
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
  }
}
