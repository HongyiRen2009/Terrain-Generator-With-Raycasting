import { vec3 } from "gl-matrix";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import GrassVertexShaderSource from "../glsl/Grass/Grass.vert";
import GrassFragmentShaderSource from "../glsl/Grass/Grass.frag";
import { RenderUtils } from "../../utils/RenderUtils";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { TextureUtils } from "../../utils/TextureUtils";
import { createNoise2D } from "simplex-noise";
import { SettingsSection } from "../../Settings";

interface LODLevel {
  vao: WebGLVertexArrayObject;
  indexCount: number;
  segments: number;
  maxDistance: number;
}

export class GrassPass extends RenderPass {
  public VAOInputType = VAOInputType.NONE;

  private lodLevels: LODLevel[] = [];
  private instanceVBO: WebGLBuffer | null = null;
  private numInstances: number = 0;
  private instanceData: Float32Array | null = null;

  private floatsPerVertex: number;
  private floatsPerInstance: number = 5; // basePos(3) + randomLean(1) + rotAngle(1)

  private attributes: { size: number; location: number }[] = [
    { size: 3, location: 0 } // localPosition
  ];

  private instanceAttributes: { size: number; location: number }[] = [
    { size: 3, location: 1 }, // basePosition (instanced)
    { size: 1, location: 2 }, // randomLean (instanced)
    { size: 1, location: 3 } // rotAngle (instanced)
  ];

  protected program: WebGLProgram | null;

  private grassThickness = 0.1;
  private windStrengthNoiseTexture: WebGLTexture | null = null;
  private windDirectionNoiseTexture: WebGLTexture | null = null;
  protected settingsSection: SettingsSection | null = null;

  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    this.floatsPerVertex = this.attributes.reduce(
      (acc, attr) => acc + attr.size,
      0
    );
    this.generateGrassInstances();
    this.generateLODLevels();
    this.windStrengthNoiseTexture = this.generateNoiseTexture(256);
    this.windDirectionNoiseTexture = this.generateNoiseTexture(256);
    this.visualizeNoiseTexture(
      document.getElementById("noisePreview") as HTMLCanvasElement,
      this.windDirectionNoiseTexture
    );
    this.program = RenderUtils.CreateProgram(
      gl,
      GrassVertexShaderSource,
      GrassFragmentShaderSource
    )!;
    this.initSettings();
  }

  private initSettings() {
    this.settingsSection = new SettingsSection(
      document.getElementById("settings-section")!,
      "Grass Settings",
      this.program!
    );
    this.settingsSection.addSlider({
      id: "windStrength",
      label: "Wind Strength",
      min: 0,
      max: 5,
      step: 0.1,
      defaultValue: 0.5
    });
    this.settingsSection.addSlider({
      id: "windSpeed",
      label: "Wind Speed",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.3
    });
    this.settingsSection.addSlider({
      id: "windFrequency",
      label: "Wind Frequency",
      min: 0.1,
      max: 1,
      step: 0.01,
      defaultValue: 0.13
    });
  }

  protected initRenderTarget(): RenderTarget {
    return { fbo: null, textures: {} };
  }

  private generateGrassInstances() {
    const numBlades = 50000;
    const patchSize = 50;
    const patchPos = vec3.fromValues(-22, 20, 33);

    this.numInstances = numBlades;
    this.instanceData = new Float32Array(numBlades * this.floatsPerInstance);

    for (let i = 0; i < numBlades; i++) {
      const offset = i * this.floatsPerInstance;

      // Base position
      this.instanceData[offset + 0] =
        (Math.random() - 0.5) * patchSize + patchPos[0];
      this.instanceData[offset + 1] = patchPos[1];
      this.instanceData[offset + 2] =
        (Math.random() - 0.5) * patchSize + patchPos[2];

      // Random lean
      this.instanceData[offset + 3] = (Math.random() - 0.5) * 0.5;

      // Rotation angle
      this.instanceData[offset + 4] = Math.random() * Math.PI * 2;
    }

    // Create instance VBO
    const gl = this.gl;
    this.instanceVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceData, gl.STATIC_DRAW);
  }

  private generateLODLevels() {
    const gl = this.gl;
    const defaultHeight = 1;
    const defaultWidth = this.grassThickness;
    const tipLength = 0.1;

    const lodConfigs = [
      { segments: 6, maxDistance: 20 }, // High detail
      { segments: 4, maxDistance: 40 }, // Medium detail
      { segments: 2, maxDistance: 80 }, // Low detail
      { segments: 1, maxDistance: Infinity } // Minimal detail
    ];

    for (const config of lodConfigs) {
      const { vertices, indices } = this.generateGrassBladeMesh(
        config.segments,
        defaultHeight,
        defaultWidth,
        tipLength
      );

      const vao = gl.createVertexArray()!;
      gl.bindVertexArray(vao);

      // Vertex buffer (local positions only)
      const vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const stride = this.floatsPerVertex * 4;
      let attribOffset = 0;
      for (const attr of this.attributes) {
        gl.enableVertexAttribArray(attr.location);
        gl.vertexAttribPointer(
          attr.location,
          attr.size,
          gl.FLOAT,
          false,
          stride,
          attribOffset * 4
        );
        attribOffset += attr.size;
      }

      // Instance buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO);
      let instanceOffset = 0;
      for (const attr of this.instanceAttributes) {
        gl.enableVertexAttribArray(attr.location);
        gl.vertexAttribPointer(
          attr.location,
          attr.size,
          gl.FLOAT,
          false,
          this.floatsPerInstance * 4,
          instanceOffset * 4
        );
        gl.vertexAttribDivisor(attr.location, 1); // Mark as instanced
        instanceOffset += attr.size;
      }

      // Index buffer
      const ebo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
      );

      gl.bindVertexArray(null);

      this.lodLevels.push({
        vao,
        indexCount: indices.length,
        segments: config.segments,
        maxDistance: config.maxDistance
      });
    }
  }

  private generateGrassBladeMesh(
    segments: number,
    height: number,
    width: number,
    tipLength: number
  ) {
    // Each cross-quad blade has 2 quads perpendicular to each other
    const vertsPerQuad = (segments + 1) * 2 + 1; // side verts + tip
    const vertsPerBlade = vertsPerQuad * 2; // 2 quads
    const vertices = new Float32Array(vertsPerBlade * this.floatsPerVertex);
    const indices: number[] = [];

    let vertexOffset = 0;

    // Generate two perpendicular quads
    for (let quadIdx = 0; quadIdx < 2; quadIdx++) {
      const angle = (quadIdx * Math.PI) / 2; // 0° and 90°

      // Side vertices
      for (let s = 0; s <= segments; s++) {
        for (const side of [-1, 1] as const) {
          const t = s / segments;
          const y = t * height;
          const w = width * (1 - t);
          const x = Math.cos(angle) * w * side;
          const z = Math.sin(angle) * w * side;

          const vertexIdx = vertexOffset + s * 2 + (side === -1 ? 0 : 1);
          const offset = vertexIdx * this.floatsPerVertex;

          vertices.set([x, y, z], offset);
        }
      }

      // Tip vertex
      const tipIdx = vertexOffset + (segments + 1) * 2;
      const offset = tipIdx * this.floatsPerVertex;
      vertices.set([0, height + tipLength, 0], offset);

      // Generate indices for this quad
      for (let s = 0; s < segments; s++) {
        const i0 = vertexOffset + s * 2;
        const i1 = vertexOffset + s * 2 + 1;
        const i2 = vertexOffset + (s + 1) * 2;
        const i3 = vertexOffset + (s + 1) * 2 + 1;

        // Front face
        indices.push(i0, i2, i1, i1, i2, i3);
        // Back face (for double-sided rendering)
        indices.push(i1, i2, i0, i3, i2, i1);
      }

      // Tip triangle
      const lastLeft = vertexOffset + segments * 2;
      const lastRight = vertexOffset + segments * 2 + 1;
      const tipVertex = vertexOffset + segments * 2 + 2;

      // Front and back faces for tip
      indices.push(lastLeft, tipVertex, lastRight);
      indices.push(lastRight, tipVertex, lastLeft);

      vertexOffset += vertsPerQuad;
    }

    return { vertices, indices };
  }

  public render(_: VaoInfo | VaoInfo[]): void {
    const gl = this.gl;
    gl.useProgram(this.program);
    const gBuffer = this.renderGraph!.getOutputs(this);
    const depthTexture = gBuffer["depth"];
    // Set camera matrix
    const cameraInfo = this.resourceCache.getUniformData("CameraInfo");
    if (cameraInfo) {
      gl.uniformMatrix4fv(
        gl.getUniformLocation(this.program!, "viewMatrix"),
        false,
        cameraInfo.matView
      );
      gl.uniformMatrix4fv(
        gl.getUniformLocation(this.program!, "projMatrix"),
        false,
        cameraInfo.matProj
      );
    }

    gl.uniform3fv(
      gl.getUniformLocation(this.program!, "sunPos"),
      this.resourceCache.getUniformData("lights")[0].position
    );
    gl.uniform3fv(
      gl.getUniformLocation(this.program!, "viewDir"),
      this.resourceCache.getUniformData("cameraDirection")
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program!, "grassThickness"),
      this.grassThickness
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program!, "time"),
      performance.now() / 1000
    );

    // Bind noise textures
    TextureUtils.bindTex(
      gl,
      this.program!,
      this.windStrengthNoiseTexture!,
      "windStrengthNoiseTex",
      0
    );
    TextureUtils.bindTex(
      gl,
      this.program!,
      this.windDirectionNoiseTexture!,
      "windDirectionNoiseTex",
      1
    );
    TextureUtils.bindTex(gl, this.program!, depthTexture!, "depthTexture", 2);

    this.settingsSection?.updateUniforms(gl);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    const cameraPos = this.resourceCache.getUniformData("cameraPosition") as
      | vec3
      | undefined;
    if (!cameraPos) return;

    for (let i = 0; i < this.lodLevels.length; i++) {
      const lod = this.lodLevels[i];
      // Calculate distance from camera to patch center
      const patchCenter = vec3.fromValues(0, 20, 33);
      const distance = vec3.distance(cameraPos, patchCenter);
      if (distance <= lod.maxDistance) {
        gl.bindVertexArray(lod.vao);
        gl.drawElementsInstanced(
          gl.TRIANGLES,
          lod.indexCount,
          gl.UNSIGNED_SHORT,
          0,
          this.numInstances
        );
        break; // Render only the highest detail LOD that fits
      }
    }

    gl.bindVertexArray(null);
  }
  private generateNoiseTexture(size: number): WebGLTexture {
    const noiseFunction = createNoise2D();
    const data = new Uint8Array(size * size);

    // fBm parameters
    const octaves = 4;
    const persistence = 0.5;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
          const nx = (x / size) * 10 * frequency;
          const ny = (y / size) * 10 * frequency;
          value += noiseFunction(nx, ny) * amplitude;
          maxValue += amplitude;
          amplitude *= persistence;
          frequency *= 2;
        }

        value /= maxValue; // Normalize
        value = 0.5 + value * 0.5; // Remap to [0,1]
        const normalized = Math.floor(((value + 1) / 2) * 255);
        data[y * size + x] = normalized;
      }
    }
    const texture = TextureUtils.createTexture2D(
      this.gl,
      size,
      size,
      this.gl.R8,
      this.gl.RED,
      this.gl.UNSIGNED_BYTE,
      data,
      this.gl.LINEAR,
      this.gl.LINEAR,
      this.gl.REPEAT,
      this.gl.REPEAT
    );
    return texture;
  }
  private visualizeNoiseTexture(
    canvas: HTMLCanvasElement,
    texture: WebGLTexture
  ) {
    const gl = this.gl;
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const ctx = canvas.getContext("2d")!;
    const width = canvas.width;
    const height = canvas.height;
    const pixels = new Uint8Array(width * height * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const imageData = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const value = pixels[i * 4]; // R channel
      imageData.data[i * 4 + 0] = value;
      imageData.data[i * 4 + 1] = value;
      imageData.data[i * 4 + 2] = value;
      imageData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }
  public dispose() {
    super.dispose();
    for (const lod of this.lodLevels) {
      if (lod.vao) this.gl.deleteVertexArray(lod.vao);
    }
    if (this.instanceVBO) this.gl.deleteBuffer(this.instanceVBO);
  }
}
