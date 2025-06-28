import { mat4, vec3 } from "gl-matrix";
import { GlUtils } from "./GlUtils";
import {
  CubeFragmentShaderCode,
  CubeVertexShaderCode,
  MeshFragmentShaderCode,
  MeshGeometryFragmentShaderCode,
  MeshGeometryVertexShaderCode,
  MeshSSAOFragmentShaderCode,
  MeshSSAOVertexShaderCode,
  MeshVertexShaderCode
} from "./glsl";
import { Shader } from "./Shader";
import { Camera } from "./Camera";
import { meshToVerticesAndIndices } from "../map/cubes_utils";
import { WorldMap } from "../map/Map";
import { DebugMenu } from "../DebugMenu";
import { cubeVertices, cubeWireframeIndices } from "../map/geometry";
import { Mesh } from "../map/Mesh";

export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;

  TriangleBuffer: { vertex: WebGLBuffer; indices: WebGLBuffer } | null = null;
  CubeBuffer: { vertex: WebGLBuffer; indices: WebGLBuffer } | null = null;
  MeshSize: number = 0;

  matViewProj: mat4;
  debug: DebugMenu;
  world: WorldMap;
  

  CubeShader!: Shader;
  MeshGeometryShader!: Shader;
  MeshSSAOShader!: Shader;
  
  // Deferred Rendering Related Properties
  kernels: vec3[] = []; // SSAO kernels
  ssaoNoiseTexture: WebGLTexture | null = null;
  FrameNumber: number = 0; // Frame number for SSAO randomness
  gBuffer!: {frameBuffer: WebGLFramebuffer, gPosition: WebGLTexture, gNormal: WebGLTexture};
  
  constructor(
    gl: WebGL2RenderingContext,
    canvas: HTMLCanvasElement,
    camera: Camera,
    debug: DebugMenu,
    world: WorldMap,
  ) {
    this.gl = gl;
    this.canvas = canvas;
    this.camera = camera;
    this.debug = debug;
    this.world = world;

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // Ensures closer objects are drawn in front

    this.matViewProj = mat4.create();
    
    const size = 4;

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
    this.MeshSize = triangleIndices.length;

    this.TriangleBuffer = GlUtils.CreateStaticBuffer(
      this.gl,
      new Float32Array(triangleVertices),
      triangleIndices
    );
    this.CubeBuffer = GlUtils.CreateStaticBuffer(
      this.gl,
      new Float32Array(cubeVertices),
      cubeWireframeIndices
    );

    this.CubeShader = new Shader(
      this.gl,
      CubeVertexShaderCode,
      CubeFragmentShaderCode
    );
    this.MeshGeometryShader=new Shader(this.gl,MeshGeometryVertexShaderCode,MeshGeometryFragmentShaderCode);
    this.MeshSSAOShader=new Shader(this.gl,MeshSSAOVertexShaderCode,MeshSSAOFragmentShaderCode);
    this.matViewProj = mat4.create();
  }
  
  //Geometry Pass for Deferred Rendering
  MeshGeometryPass(){
    //Create and bind the G-Buffer
    const gBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, gBuffer);

    //Position Texture
    const gPosition = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, gPosition);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA16F, this.canvas.width, this.canvas.height, 0, this.gl.RGBA, this.gl.FLOAT, null);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, gPosition, 0);

    //Normal Texture
    const gNormal = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, gNormal);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA16F, this.canvas.width, this.canvas.height, 0, this.gl.RGBA, this.gl.FLOAT, null);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT1, this.gl.TEXTURE_2D, gNormal, 0);

    this.gl.drawBuffers([
      this.gl.COLOR_ATTACHMENT0, // Position
      this.gl.COLOR_ATTACHMENT1, // Normal
    ]);

    this.gBuffer = {
      frameBuffer: gBuffer,
      gPosition: gPosition,
      gNormal: gNormal
    };

    // Unbind the framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
  //
  generateKernels(){
    const lerp = (a: number, b: number, f: number) => a + f * (b - a);

    for (let i = 0; i < 16; ++i) {
      const RNGSeed = this.FrameNumber*100 + i; // Ensure different seeds for each sample
      // Simple hash-based RNG
      const rand = (s: number) => {
        let x = Math.sin(s) * 10000;
        return x - Math.floor(x);
      };
      let sample = vec3.fromValues(
        rand(RNGSeed)*2.0-1.0,
        rand(RNGSeed+1)*2.0-1.0,
        rand(RNGSeed+2)*2.0-1.0
      );
      vec3.normalize(sample, sample);
      vec3.scale(sample, sample, rand(RNGSeed + 3));

      //Accelerating interpolation function
      let scale: GLfloat = i / 16.0;
      scale = lerp(0.1, 1.0, scale * scale);
      vec3.scale(sample, sample, scale);
      this.kernels.push(sample);
    }
  }

  // Screen Space Ambient Occlusion Pass
  SSAOPass(){
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
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGB,
      noiseSize,
      noiseSize,
      0,
      this.gl.RGB,
      this.gl.FLOAT,
      noiseData
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
    this.ssaoNoiseTexture = noiseTexture;

    this.gl.uniform1i(this.MeshSSAOShader.Program!,this.FrameNumber)
    // Create and bind the SSAO framebuffer
    const ssaoBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, ssaoBuffer);

    // Create the SSAO texture
    const ssaoTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, ssaoTexture);

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
      this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.LINEAR
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      ssaoTexture,
      0
    );

    //Send Uniforms to the SSAO shader
    for (let i = 0; i < this.kernels.length; i++) {
      const loc = this.gl.getUniformLocation(this.MeshSSAOShader.Program!, `samples[${i}]`);
      this.gl.uniform3fv(loc, this.kernels[i]);
    }
    const noiseScale = [this.canvas.width / noiseSize, this.canvas.height / noiseSize];
    const loc = this.gl.getUniformLocation(this.MeshSSAOShader.Program!, "noiseScale");
    this.gl.uniform2fv(loc, noiseScale);

    //Bind Textures
    GlUtils.bindTex(this.gl, this.MeshSSAOShader.Program!, this.gBuffer.gPosition, "gPosition", 0);
    GlUtils.bindTex(this.gl, this.MeshSSAOShader.Program!, this.gBuffer.gNormal, "gNormal", 1);
    GlUtils.bindTex(this.gl, this.MeshSSAOShader.Program!, this.ssaoNoiseTexture, "texNoise", 2);


    // Unbind the framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.FrameNumber+=1
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
    this.matViewProj = this.camera.calculateProjectionMatrix(
      this.canvas.width,
      this.canvas.height
    );
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
