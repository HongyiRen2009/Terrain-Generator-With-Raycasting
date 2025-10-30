import { vec2, vec3 } from "gl-matrix";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import GrassVertexShaderSource from "../glsl/Grass/Grass.vert";
import GrassFragmentShaderSource from "../glsl/Grass/Grass.frag";
import { RenderUtils } from "../../utils/RenderUtils";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { RenderTarget } from "../renderSystem/RenderTarget";

export class GrassPass extends RenderPass {
  public VAOInputType = VAOInputType.NONE;

  basePositions: Float32Array;
  grassVertices: Float32Array;
  grassIndices: Uint16Array;
  protected program: WebGLProgram | null;

  private grassVAO: WebGLVertexArrayObject | null = null;
  private grassVBO: WebGLBuffer | null = null;
  private grassEBO: WebGLBuffer | null = null;
  private vertexCount: number = 0;

  // Wireframe additions
  private wireframeIndices: Uint16Array | null = null;
  private wireframeEBO: WebGLBuffer | null = null;
  private wireframeCount: number = 0;
  private showWireframe: boolean = false;

  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    this.basePositions = this.initBasePositions(
      vec3.fromValues(-22, 20, 33),
      1000,
      10
    );
    const bladeData = this.createBladeVertices(this.basePositions, 1, 0.1, 5);
    this.grassVertices = bladeData.vertices;
    this.grassIndices = bladeData.indices;
    this.vertexCount = this.grassIndices.length;

    // Generate wireframe indices
    this.wireframeIndices = this.generateWireframeIndices(this.grassIndices);
    this.wireframeCount = this.wireframeIndices.length;

    this.program = RenderUtils.CreateProgram(
      gl,
      GrassVertexShaderSource,
      GrassFragmentShaderSource
    )!;

    this.setupGrassBuffers();
    this.renderTarget = this.initRenderTarget();
  }

  protected initRenderTarget(): RenderTarget {
    // Render directly to screen, no FBO needed
    return {
      fbo: null,
      textures: {}
    };
  }

  private initBasePositions(
    patchPosition: vec3,
    numberOfBlades: number,
    patchSize: number
  ) {
    const positions = new Float32Array(numberOfBlades * 3);
    for (let i = 0; i < numberOfBlades; i++) {
      const x = (Math.random() - 0.5) * patchSize + patchPosition[0];
      const z = (Math.random() - 0.5) * patchSize + patchPosition[2];
      const y = patchPosition[1];
      positions.set([x, y, z], i * 3);
    }
    return positions;
  }

  private createBladeVertices(
    basePositions: Float32Array,
    height: number,
    width: number,
    segments: number,
    tipLength: number = 0.1
  ) {
    const numBlades = basePositions.length / 3;
    const vertsPerBlade = (segments + 1) * 2 + 1;
    // position (3) + baseHeight (1) = 4 floats per vertex
    const vertices = new Float32Array(numBlades * vertsPerBlade * 4);
    const indices: number[] = [];

    for (let b = 0; b < numBlades; b++) {
      const baseX = basePositions[b * 3];
      const baseY = basePositions[b * 3 + 1];
      const baseZ = basePositions[b * 3 + 2];

      for (let s = 0; s <= segments; s++) {
        const t = (s / segments) * height;
        const offset = (b * vertsPerBlade + s * 2) * 4;

        // Left vertex
        vertices[offset] = baseX - width / 2;
        vertices[offset + 1] = baseY + t;
        vertices[offset + 2] = baseZ;
        vertices[offset + 3] = baseY; // Base height

        // Right vertex
        vertices[offset + 4] = baseX + width / 2;
        vertices[offset + 5] = baseY + t;
        vertices[offset + 6] = baseZ;
        vertices[offset + 7] = baseY; // Base height
      }

      // Tip vertex
      const tipOffset = (b * vertsPerBlade + (segments + 1) * 2) * 4;
      vertices[tipOffset] = baseX;
      vertices[tipOffset + 1] = baseY + height + tipLength;
      vertices[tipOffset + 2] = baseZ;
      vertices[tipOffset + 3] = baseY; // Base height
    }

    // Create indices (unchanged)
    for (let b = 0; b < numBlades; b++) {
      const baseIndex = b * vertsPerBlade;
      for (let s = 0; s < segments; s++) {
        const i0 = baseIndex + s * 2;
        const i1 = baseIndex + s * 2 + 1;
        const i2 = baseIndex + (s + 1) * 2;
        const i3 = baseIndex + (s + 1) * 2 + 1;
        indices.push(i0, i2, i1);
        indices.push(i1, i2, i3);
      }
      const lastLeft = baseIndex + segments * 2;
      const lastRight = baseIndex + segments * 2 + 1;
      const tipIndex = baseIndex + segments * 2 + 2;
      indices.push(lastLeft, lastRight, tipIndex);
    }

    return { vertices, indices: new Uint16Array(indices) };
  }
  private generateWireframeIndices(triangleIndices: Uint16Array): Uint16Array {
    const edges = new Set<string>();
    const lineIndices: number[] = [];

    // Process each triangle
    for (let i = 0; i < triangleIndices.length; i += 3) {
      const v0 = triangleIndices[i];
      const v1 = triangleIndices[i + 1];
      const v2 = triangleIndices[i + 2];

      // Add edges (sorted to avoid duplicates)
      const edgesToAdd = [
        [Math.min(v0, v1), Math.max(v0, v1)],
        [Math.min(v1, v2), Math.max(v1, v2)],
        [Math.min(v2, v0), Math.max(v2, v0)]
      ];

      for (const [a, b] of edgesToAdd) {
        const key = `${a}-${b}`;
        if (!edges.has(key)) {
          edges.add(key);
          lineIndices.push(a, b);
        }
      }
    }

    return new Uint16Array(lineIndices);
  }

  private setupGrassBuffers() {
    const gl = this.gl;

    this.grassVAO = gl.createVertexArray();
    gl.bindVertexArray(this.grassVAO);

    this.grassVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.grassVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this.grassVertices, gl.STATIC_DRAW);

    const stride = 4 * 4; // 4 floats * 4 bytes per float

    // Position attribute (location 0)
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);

    // Base height attribute (location 1)
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 3 * 4);

    // Triangle indices
    this.grassEBO = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.grassEBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.grassIndices, gl.STATIC_DRAW);

    // Wireframe indices (separate buffer)
    if (this.wireframeIndices) {
      this.wireframeEBO = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireframeEBO);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        this.wireframeIndices,
        gl.STATIC_DRAW
      );
    }

    gl.bindVertexArray(null);
  }

  public setWireframeMode(enabled: boolean): void {
    this.showWireframe = enabled;
  }

  public render(vao_info: VaoInfo | VaoInfo[]): void {
    const gl = this.gl;

    gl.useProgram(this.program);

    // Get camera matrices
    const cameraInfo = this.resourceCache.getUniformData("CameraInfo");
    if (cameraInfo) {
      const viewProjLoc = gl.getUniformLocation(this.program!, "uViewProj");
      gl.uniformMatrix4fv(viewProjLoc, false, cameraInfo.matViewProj);
    }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.bindVertexArray(this.grassVAO);
    gl.uniform4fv(
      gl.getUniformLocation(this.program!, "wireframeColor"),
      this.showWireframe ? [0.0, 0.0, 0.0, 1.0] : [0.0, 0.0, 0.0, 0.0]
    );
    if (this.showWireframe) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireframeEBO);

      gl.polygonOffset(-1.0, -1.0);

      gl.lineWidth(1.0);

      gl.drawElements(gl.LINES, this.wireframeCount, gl.UNSIGNED_SHORT, 0);
    } else {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.grassEBO);
      gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);
    }

    gl.bindVertexArray(null);
  }

  public dispose() {
    super.dispose();
    if (this.grassVAO) this.gl.deleteVertexArray(this.grassVAO);
    if (this.grassVBO) this.gl.deleteBuffer(this.grassVBO);
    if (this.grassEBO) this.gl.deleteBuffer(this.grassEBO);
    if (this.wireframeEBO) this.gl.deleteBuffer(this.wireframeEBO);
  }
}
