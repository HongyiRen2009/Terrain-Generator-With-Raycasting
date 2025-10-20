import { mat4, vec3 } from "gl-matrix";
import { RenderUtils } from "../utils/RenderUtils";
import { Camera } from "./Camera";
import { WorldMap } from "../map/Map";
import { DebugMenu } from "../DebugMenu";
import { Mesh } from "../map/Mesh";
import { VaoInfo, VAOManager } from "./VaoManager";
import { DeferredRenderer } from "./DeferredRenderer";
interface Matrices {
  matView: mat4;
  matProj: mat4;
  matViewProj: mat4;
  matViewInverse: mat4;
  matProjInverse: mat4;
}

// GLRenderer: Main rendering orchestrator
export class GLRenderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  camera: Camera;
  debug: DebugMenu;
  world: WorldMap;
  // Matrices
  matView: mat4;
  matProj: mat4;
  matViewProj: mat4;

  // Managers
  private vaoManager: VAOManager;
  deferredRenderer: DeferredRenderer;

  //SSAO stuff
  kernelSize: number = 64;
  kernels: vec3[] = [];
  noiseTexture: WebGLTexture | null = null;
  noiseSize: number = 64;

  // Add VAO property for geometry pass
  TerrainVAO: WebGLVertexArrayObject | null = null;

  // SSAO Settings
  radius: number = 5.0;
  bias: number = 0.025;
  enableSSAOBlur: boolean = true;
  enableSSAO: boolean = true;

  // Cache VAOs
  wireframeCubeVAO: WebGLVertexArrayObject | null = null;
  worldObjectVAOs: Map<number, WebGLVertexArrayObject> = new Map();
  // SSAO controls
  get radius() {
    return this.deferredRenderer.radius;
  }
  set radius(val: number) {
    this.deferredRenderer.radius = val;
  }
  get bias() {
    return this.deferredRenderer.bias;
  }
  set bias(val: number) {
    this.deferredRenderer.bias = val;
  }
  get enableSSAOBlur() {
    return this.deferredRenderer.enableSSAOBlur;
  }
  set enableSSAOBlur(val: boolean) {
    this.deferredRenderer.enableSSAOBlur = val;
  }

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

    this.deferredRenderer = new DeferredRenderer(gl, canvas);
    this.vaoManager = new VAOManager(
      gl,
      this.deferredRenderer.getGeometryPassProgram()
    );
  }

  GenerateTerrainBuffers(triangleMeshes: Mesh[]): void {
    this.vaoManager.createTerrainVAO(triangleMeshes);
  }
  GenerateWorldObjectVAOs(): void {
    this.vaoManager.createWorldObjectVAOs(this.world.worldObjects);
  }
  resizeGBuffer(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.deferredRenderer.resize(width, height);
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

    this.TerrainMeshSize = triangleIndices.length;

    this.TerrainTriangleBuffer = {
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
    this.wireframeCubeVAO = GlUtils.createInterleavedVao(
      this.gl,
      this.CubeBuffer.vertex,
      this.CubeBuffer.indices,
      this.CubeShader,
      {
        position: { offset: 0, stride: 24, sizeOverride: 3 },
        color: { offset: 12, stride: 24 }
      }
    );
    // Create VAO for geometry pass after shaders are initialized
    this.TerrainVAO = GlUtils.createNonInterleavedVao(
      this.gl,
      {
        position: {
          buffer: this.TerrainTriangleBuffer.vertex.position,
          size: 3
        },
        normal: {
          buffer: this.TerrainTriangleBuffer.vertex.normal,
          size: 3
        },
        color: {
          buffer: this.TerrainTriangleBuffer.vertex.color,
          size: 3
        }
      },
      this.TerrainTriangleBuffer.indices,
      this.geometryPassShader
    );
  }
  private initShaders() {
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
  }
  private geometryPass() {
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

    // Set view and projection matrices (shared by terrain and objects)
    this.gl.uniformMatrix4fv(
      this.geometryPassShader.Uniforms["view"].location,
      false,
      this.matView
    );
    this.gl.uniformMatrix4fv(
      this.geometryPassShader.Uniforms["proj"].location,
      false,
      this.matProj
    );

    // Render terrain with identity matrix
    const identityMatrix = mat4.create();
    this.gl.uniformMatrix4fv(
      this.geometryPassShader.Uniforms["model"].location,
      false,
      identityMatrix
    );

    if (!this.TerrainVAO) {
      throw new Error("VAO not initialized");
    }

    this.gl.bindVertexArray(this.TerrainVAO);
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.TerrainMeshSize,
      this.gl.UNSIGNED_INT,
      0
    );

    // Render world objects
    for (const worldObject of this.world.worldObjects) {
      // Set model matrix for this object
      this.gl.uniformMatrix4fv(
        this.geometryPassShader.Uniforms["model"].location,
        false,
        worldObject.position
      );

      // Get or create VAO for this object
      let vao = this.worldObjectVAOs.get(worldObject.id);
      if (!vao) {
        vao = GlUtils.createInterleavedVao(
          this.gl,
          worldObject.buffer.vertex,
          worldObject.buffer.indices,
          this.geometryPassShader,
          {
            position: {
              offset: 0,
              stride: 36,
              sizeOverride: 3
            },
            normal: { offset: 12, stride: 36 },
            color: { offset: 24, stride: 36 }
          }
        );
        this.worldObjectVAOs.set(worldObject.id, vao);
      }

      this.gl.bindVertexArray(vao);
      this.gl.drawElements(
        this.gl.TRIANGLES,
        worldObject.meshSize,
        this.gl.UNSIGNED_INT,
        0
      );
    }

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

    GlUtils.bindTex(
      this.gl,
      this.ssaoPassShader.Program!,
      this.gBuffer?.normalTexture!,
      "normalTexture",
      0
    );
    GlUtils.bindTex(
      this.gl,
      this.ssaoPassShader.Program!,
      this.gBuffer?.depthTexture!,
      "depthTexture",
      1
    );
    GlUtils.bindTex(
      this.gl,
      this.ssaoPassShader.Program!,
      this.noiseTexture!,
      "noiseTexture",
      2
    );

    this.gl.uniform1f(
      this.gl.getUniformLocation(this.ssaoPassShader.Program!, "radius"),
      this.radius
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.ssaoPassShader.Program!, "bias"),
      this.bias
    );
    this.gl.uniformMatrix4fv(
      this.ssaoPassShader.Uniforms["proj"].location,
      false,
      this.matProj
    );
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(this.ssaoPassShader.Program!, "projInverse"),
      false,
      this.matProjInverse
    );
    this.gl.uniform1f(
      this.ssaoPassShader.Uniforms["noiseSize"].location,
      this.noiseSize
    );

    for (let i = 0; i < this.kernelSize; i++) {
      this.gl.uniform3fv(
        this.gl.getUniformLocation(
          this.ssaoPassShader.Program!,
          `samples[${i}]`
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

    // Use GlUtils.bindTex for texture binding
    GlUtils.bindTex(
      this.gl,
      this.ssaoBlurPassShader.Program!,
      this.ssaoFrameBuffer?.ssaoTexture!,
      "ssaoTexture",
      0
    );
    GlUtils.bindTex(
      this.gl,
      this.ssaoBlurPassShader.Program!,
      this.gBuffer?.depthTexture!,
      "depthTexture",
      1
    );

    this.gl.uniform1i(
      this.gl.getUniformLocation(
        this.ssaoBlurPassShader.Program!,
        "enableBlur"
      ),
      this.enableSSAOBlur ? 1 : 0
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

    // Use GlUtils.bindTex for all texture bindings
    GlUtils.bindTex(
      this.gl,
      this.lightingPassShader.Program!,
      this.gBuffer?.normalTexture!,
      "normalTexture",
      0
    );
    GlUtils.bindTex(
      this.gl,
      this.lightingPassShader.Program!,
      this.gBuffer?.albedoTexture!,
      "albedoTexture",
      1
    );
    GlUtils.bindTex(
      this.gl,
      this.lightingPassShader.Program!,
      this.gBuffer?.depthTexture!,
      "depthTexture",
      2
    );
    GlUtils.bindTex(
      this.gl,
      this.lightingPassShader.Program!,
      this.ssaoBlurFrameBuffer?.ssaoBlurTexture!,
      "ssaoTexture",
      3
    );

    this.gl.uniformMatrix4fv(
      this.lightingPassShader.Uniforms["viewInverse"].location,
      false,
      this.matViewInverse
    );
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(
        this.lightingPassShader.Program!,
        "projInverse"
      ),
      false,
      this.matProjInverse
    );
    this.gl.uniform3fv(
      this.lightingPassShader.Uniforms["cameraPosition"].location,
      this.camera.position
    );
    this.gl.uniform1i(
      this.lightingPassShader.Uniforms["enableSSAO"].location,
      this.enableSSAO ? 1 : 0
    );

    GlUtils.updateLights(
      this.gl,
      this.lightingPassShader.Program!,
      this.world.lights
    );

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
  }
  DrawWireFrameCube(TransformationMatrix: mat4) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.useProgram(this.CubeShader.Program!);
    this.gl.uniformMatrix4fv(
      this.CubeShader.Uniforms["transform"].location,
      false,
      TransformationMatrix
    );
    this.gl.uniformMatrix4fv(
      this.CubeShader.Uniforms["viewProj"].location,
      false,
      this.matViewProj
    );

    if (!this.CubeBuffer) throw new Error("CubeBuffer not initialized.");

    this.gl.bindVertexArray(this.wireframeCubeVAO);
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
    mat4.multiply(this.matViewProj, this.matProj, this.matView);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    const vaosToRender = this.vaoManager.getVaosToRender();

    // Post-processing passes
    if (this.enableSSAO) {
      this.ssaoPass();
      this.blurPass();
    }
    this.lightingPass();

    // Draw debug wireframes
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
    this.deferredRenderer.renderGeometryPass(
      vaosToRender,
      this.matView,
      this.matProj
    );
    this.deferredRenderer.renderSSAOPass(this.matProj);
    this.deferredRenderer.renderBlurPass();
    this.deferredRenderer.renderLightingPass(
      this.camera.position,
      this.world.lights,
      this.matView,
      this.matProj
    );
  }

  dispose(): void {
    this.vaoManager.dispose();
    this.deferredRenderer.dispose();
  }
}
