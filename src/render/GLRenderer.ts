import { mat4, vec3 } from "gl-matrix";
import { GlUtils } from "./GlUtils";
import {
  CubeFragmentShaderCode,
  CubeVertexShaderCode,
  TerrainGeometryVertexShaderCode,
  TerrainGeometryFragmentShaderCode,
  TerrainSSAOVertexShaderCode,
  TerrainSSAOFragmentShaderCode,
  TerrainLightingVertexShaderCode,
  TerrainLightingFragmentShaderCode
} from "./glsl";
import { Shader } from "./Shader";
import { Camera } from "./Camera";
import { meshToVerticesAndIndices } from "../map/cubes_utils";
import { WorldMap } from "../map/Map";
import { DebugMenu } from "../DebugMenu";
import { cubeVertices, cubeWireframeIndices } from "../map/geometry";
import { Mesh } from "../map/Mesh";
import { WorldObject } from "../map/WorldObject";

export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;

  TerrainTriangleBuffer: {
    vertex: WebGLBuffer;
    indices: WebGLBuffer;
  } | null = null;
  CubeBuffer: { vertex: WebGLBuffer; indices: WebGLBuffer } | null = null;
  TerrainMeshSize: number = 0;

  matView: mat4;
  matProj: mat4;
  matViewProj: mat4;

  debug: DebugMenu;

  world: WorldMap;

  terrainVAO: WebGLVertexArrayObject | null = null;

  WireframeCubeShader: Shader;
  wireframeCubeVAO: WebGLVertexArrayObject | null = null;

  worldObjectVAOs: Map<number, WebGLVertexArrayObject> = new Map();

  SSAONoiseTexture: WebGLTexture | null = null;
  SSAOKernel: vec3[] = [];
  QuadVAO: WebGLVertexArrayObject | null = null;
  gBUffer: {
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
  TerrainGeometryShader: Shader | null = null;
  TerrainSSAOShader: Shader | null = null;
  TerrainLightingShader: Shader | null = null;
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
    this.WireframeCubeShader = new Shader(
      gl,
      CubeVertexShaderCode,
      CubeFragmentShaderCode
    );
    this.matView = mat4.create();
    this.matProj = mat4.create();
    this.matViewProj = mat4.create();
    this.TerrainGeometryShader = new Shader(
      gl,
      TerrainGeometryVertexShaderCode,
      TerrainGeometryFragmentShaderCode
    );
    this.TerrainSSAOShader = new Shader(
      gl,
      TerrainSSAOVertexShaderCode,
      TerrainSSAOFragmentShaderCode
    );
    this.TerrainLightingShader = new Shader(
      gl,
      TerrainLightingVertexShaderCode,
      TerrainLightingFragmentShaderCode
    );
    this.gl.getExtension("EXT_color_buffer_float");
    this.InitalizeGBuffer();
    this.InitalizeSSAOFramebuffer();
    this.InitalizeFullScreenQuad();
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
    this.SSAONoiseTexture = GlUtils.CreateBufferTexture(
      this.gl,
      noiseSize,
      noiseSize,
      this.gl.RGB16F,
      this.gl.RGB,
      this.gl.FLOAT,
      noiseData
    );
  }
  InitalizeGBuffer() {
    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) throw new Error("Failed to create framebuffer");
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    const positionTexture = GlUtils.CreateBufferTexture(
      this.gl,
      this.canvas.width,
      this.canvas.height,
      this.gl.RGBA16F,
      this.gl.RGBA,
      this.gl.FLOAT
    );
    const normalTexture = GlUtils.CreateBufferTexture(
      this.gl,
      this.canvas.width,
      this.canvas.height,
      this.gl.RGBA16F,
      this.gl.RGBA,
      this.gl.FLOAT
    );
    const albedoTexture = GlUtils.CreateBufferTexture(
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
    this.gBUffer = {
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
    const SSAOTexture = GlUtils.CreateBufferTexture(
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

    this.TerrainTriangleBuffer = GlUtils.CreateStaticBuffer(
      this.gl,
      new Float32Array(triangleVertices),
      triangleIndices
    );
    this.CubeBuffer = GlUtils.CreateStaticBuffer(
      this.gl,
      new Float32Array(cubeVertices),
      cubeWireframeIndices
    );

    this.WireframeCubeShader = new Shader(
      this.gl,
      CubeVertexShaderCode,
      CubeFragmentShaderCode
    );

    this.matViewProj = mat4.create();
  }

  InitalizeFullScreenQuad() {
    const quadVertices = new Float32Array([
      // positions   // texCoords
      -1.0,
      1.0,
      0.0,
      1.0, // top left
      -1.0,
      -1.0,
      0.0,
      0.0, // bottom left
      1.0,
      -1.0,
      1.0,
      0.0, // bottom right
      1.0,
      1.0,
      1.0,
      1.0 // top right
    ]);
    const quadIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
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
  DefferedRenderingGeometryPass(TransformationMatrix: mat4) {
    if (!this.gBUffer) return;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.gBUffer.framebuffer);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.useProgram(this.TerrainGeometryShader?.Program!);
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(
        this.TerrainGeometryShader?.Program!,
        "MatView"
      ),
      false,
      this.matView
    );
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(
        this.TerrainGeometryShader?.Program!,
        "MatProj"
      ),

      false,
      this.matProj
    );
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(
        this.TerrainGeometryShader?.Program!,
        "MatTransform"
      ),
      false,
      TransformationMatrix
    );
    this.gl.bindVertexArray(this.terrainVAO);
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.TerrainMeshSize,
      this.gl.UNSIGNED_INT,
      0
    );
    this.gl.bindVertexArray(null);
  }
  DefferedRenderingSSAOPass() {
    if (!this.gBUffer || !this.SSAOFramebuffer || !this.QuadVAO) return;
    this.gl.bindFramebuffer(
      this.gl.FRAMEBUFFER,
      this.SSAOFramebuffer.framebuffer
    );
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.TerrainSSAOShader?.Program!);
    GlUtils.bindTex(
      this.gl,
      this.TerrainSSAOShader?.Program!,
      this.gBUffer.position,
      "VertexPositionTexture",
      0
    );
    GlUtils.bindTex(
      this.gl,
      this.TerrainSSAOShader?.Program!,
      this.gBUffer.normal,
      "VertexNormalTexture",
      1
    );
    GlUtils.bindTex(
      this.gl,
      this.TerrainSSAOShader?.Program!,
      this.SSAONoiseTexture!,
      "NoiseTexture",
      2
    );
    // Send kernel samples to shader
    for (let i = 0; i < this.SSAOKernel.length; i++) {
      this.gl.uniform3fv(
        this.gl.getUniformLocation(
          this.TerrainSSAOShader?.Program!,
          `samples[${i}]`
        ),
        this.SSAOKernel[i]
      );
    }
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(this.TerrainSSAOShader?.Program!, "MatProj"),
      false,
      this.matProj
    );
    // Send Noise to shader
    this.gl.uniform1f(
      this.gl.getUniformLocation(
        this.TerrainSSAOShader?.Program!,
        "NoiseScale"
      ),
      this.canvas.width / 4.0
    );
    this.gl.bindVertexArray(this.QuadVAO);
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
  DefferedRenderingLightingPass() {
    if (!this.gBUffer || !this.SSAOFramebuffer || !this.QuadVAO) return;
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.useProgram(this.TerrainLightingShader?.Program!);
    GlUtils.bindTex(
      this.gl,
      this.TerrainLightingShader?.Program!,
      this.gBUffer.position,
      "VertexPositionTexture",
      0
    );
    GlUtils.bindTex(
      this.gl,
      this.TerrainLightingShader?.Program!,
      this.gBUffer.normal,
      "VertexNormalTexture",
      1
    );
    GlUtils.bindTex(
      this.gl,
      this.TerrainLightingShader?.Program!,
      this.gBUffer.albedo,
      "VertexAlbedoTexture",
      2
    );
    GlUtils.bindTex(
      this.gl,
      this.TerrainLightingShader?.Program!,
      this.SSAOFramebuffer.SSAOTexture,
      "SSAOTexture",
      3
    );
    this.gl.bindVertexArray(this.QuadVAO);
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
  }
  drawTerrain(TransformationMatrix: mat4) {
    if (!this.TerrainTriangleBuffer) return;
    if (!this.terrainVAO) {
      this.terrainVAO = GlUtils.createInterleavedVao(
        this.gl,
        this.TerrainTriangleBuffer.vertex,
        this.TerrainTriangleBuffer.indices,
        this.TerrainGeometryShader!,
        {
          VertexPosition: {
            offset: 0,
            stride: 36,
            sizeOverride: 3
          },
          VertexNormal: { offset: 12, stride: 36 },
          VertexAlbedo: { offset: 24, stride: 36 }
        }
      );
    }
    this.DefferedRenderingGeometryPass(TransformationMatrix);
    this.DefferedRenderingSSAOPass();
    this.DefferedRenderingLightingPass();
  }
  DrawWireFrameCube(TransformationMatrix: mat4) {
    this.gl.useProgram(this.WireframeCubeShader.Program!);
    this.gl.uniformMatrix4fv(
      this.WireframeCubeShader.VertexUniforms["MatrixTransform"].location,
      false,
      TransformationMatrix
    );
    this.gl.uniformMatrix4fv(
      this.WireframeCubeShader.VertexUniforms["matViewProj"].location,
      false,
      this.matViewProj
    );

    if (!this.CubeBuffer) throw new Error("CubeBuffer not initialized.");

    if (!this.wireframeCubeVAO) {
      this.wireframeCubeVAO = GlUtils.createInterleavedVao(
        this.gl,
        this.CubeBuffer.vertex,
        this.CubeBuffer.indices,
        this.WireframeCubeShader,
        {
          VertexPosition: {
            offset: 0,
            stride: 24,
            sizeOverride: 3
          },
          VertexColor: { offset: 12, stride: 24 }
        }
      );
    }

    this.gl.bindVertexArray(this.wireframeCubeVAO);
    this.gl.drawElements(this.gl.LINES, 24, this.gl.UNSIGNED_INT, 0);
    this.gl.bindVertexArray(null);
  }

  /*   drawWorldObject(obj: WorldObject) {
    // for now, just use the terrain mesh
    this.gl.useProgram(this.TerrainMeshShader.Program!);
    this.gl.uniformMatrix4fv(
      this.TerrainMeshShader.VertexUniforms["MatrixTransform"].location,
      false,
      obj.position
    );
    this.gl.uniformMatrix4fv(
      this.TerrainMeshShader.VertexUniforms["matViewProj"].location,
      false,
      this.matViewProj
    );

    // TODO: vao should be per mesh, not per object
    // Do we need to have some sort of meshid instead of objectid?
    if (!this.worldObjectVAOs.has(obj.id)) {
      const vao = GlUtils.createInterleavedVao(
        this.gl,
        obj.buffer.vertex,
        obj.buffer.indices,
        this.TerrainMeshShader,
        {
          VertexPosition: {
            offset: 0,
            stride: 36,
            sizeOverride: 3
          },
          VertexNormal: { offset: 12, stride: 36 },
          VertexColor: { offset: 24, stride: 36 }
        }
      );
      this.worldObjectVAOs.set(obj.id, vao);
    }

    this.gl.bindVertexArray(this.worldObjectVAOs.get(obj.id)!);
    this.gl.drawElements(
      this.gl.TRIANGLES,
      obj.meshSize,
      this.gl.UNSIGNED_INT,
      0
    );
    this.gl.bindVertexArray(null);
  } */

  render() {
    // Set clear color to black, fully opaque
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Calculate view and projection matrices once per frame
    this.matView = this.camera.calculateViewMatrix();
    this.matProj = this.camera.calculateProjectionMatrix(
      this.canvas.width,
      this.canvas.height
    );
    mat4.multiply(this.matViewProj, this.matProj, this.matView);
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

    this.drawTerrain(
      GlUtils.CreateTransformations(
        vec3.fromValues(0, 0, 0),
        vec3.fromValues(0, 0, 0),
        vec3.fromValues(resScaleFactor, resScaleFactor, resScaleFactor)
      )
    );
    /* 
    for (const object of this.world.worldObjects) {
      this.drawWorldObject(object);
    } */
  }
}
