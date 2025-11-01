import { vec3 } from "gl-matrix";
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

  private grassVAO: WebGLVertexArrayObject | null = null;
  private grassVBO: WebGLBuffer | null = null;
  private grassEBO: WebGLBuffer | null = null;
  private vertexCount: number = 0;
  private floatsPerVertex: number;
  private attributes: { size: number; location: number }[] = [
    { size: 3, location: 0 }, // localPosition
    { size: 3, location: 1 }, // basePosition
    { size: 1, location: 2 } // randomLean
  ];
  protected program: WebGLProgram | null;

  private grassThickness = 0.1;
  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    debugger;
    this.floatsPerVertex = this.attributes.reduce(
      (acc, attr) => acc + attr.size,
      0
    );
    this.generateGrassVAO();
    this.program = RenderUtils.CreateProgram(
      gl,
      GrassVertexShaderSource,
      GrassFragmentShaderSource
    )!;
  }
  protected initRenderTarget(): RenderTarget {
    return { fbo: null, textures: {} };
  }
  private generateGrassVAO() {
    const gl = this.gl;
    const numBlades = 1000,
      patchSize = 10,
      defaultHeight = 1,
      defaultWidth = this.grassThickness,
      segments = 5,
      tipLength = 0.1;
    const { vertices, indices } = this.generateGrassVertices(
      numBlades,
      segments,
      patchSize,
      defaultHeight,
      defaultWidth,
      tipLength
    );
    // Setup GL buffers
    this.grassVAO = gl.createVertexArray();
    gl.bindVertexArray(this.grassVAO);

    this.grassVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.grassVBO);
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

    this.grassEBO = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.grassEBO);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
    );

    gl.bindVertexArray(null);

    this.vertexCount = indices.length;
  }
  private generateGrassVertices(
    numBlades: number,
    segments: number,
    patchSize: number,
    defaultHeight: number,
    defaultWidth: number,
    tipLength: number
  ) {
    const patchPos = vec3.fromValues(-22, 20, 33);
    const vertsPerBlade = (segments + 1) * 2 + 1;
    const vertices = new Float32Array(
      numBlades * vertsPerBlade * this.floatsPerVertex
    );
    const indices: number[] = [];

    for (let b = 0; b < numBlades; b++) {
      // Random blade attributes
      const base = vec3.fromValues(
        (Math.random() - 0.5) * patchSize + patchPos[0],
        patchPos[1],
        (Math.random() - 0.5) * patchSize + patchPos[2]
      );
      const height = defaultHeight * (0.8 + Math.random() * 0.4);
      const width = defaultWidth * (0.8 + Math.random() * 0.4);
      const angle = Math.random() * Math.PI * 2;
      const lean = (Math.random() - 0.5) * 0.5; // Random lean factor
      // Side vertices
      for (let s = 0; s <= segments; s++) {
        for (const side of [-1, 1] as const) {
          const t = s / segments;
          const y = t * height;
          const w = width * (1 - t);
          const x = Math.cos(angle) * w * side;
          const z = Math.sin(angle) * w * side;
          const vertexIdx = b * vertsPerBlade + s * 2 + (side === -1 ? 0 : 1);
          let offset = vertexIdx * this.floatsPerVertex;
          vertices.set([x, y, z], offset);
          offset += 3;
          vertices.set([base[0], base[1], base[2]], offset);
          offset += 3;
          vertices[offset] = lean; // randomLean
        }
      }
      // Tip vertex
      const tipIdx = b * vertsPerBlade + (segments + 1) * 2;
      let offset = tipIdx * this.floatsPerVertex;
      vertices.set([0, height + tipLength, 0], offset);
      offset += 3;
      vertices.set([base[0], base[1], base[2]], offset);

      // Indices
      const baseIndex = b * vertsPerBlade;
      for (let s = 0; s < segments; s++) {
        const i0 = baseIndex + s * 2;
        const i1 = baseIndex + s * 2 + 1;
        const i2 = baseIndex + (s + 1) * 2;
        const i3 = baseIndex + (s + 1) * 2 + 1;
        indices.push(i0, i2, i1, i1, i2, i3);
      }
      const lastLeft = baseIndex + segments * 2;
      const lastRight = baseIndex + segments * 2 + 1;
      const tipVertex = baseIndex + segments * 2 + 2;
      indices.push(lastLeft, lastRight, tipVertex);
    }
    return { vertices, indices };
  }
  public render(_: VaoInfo | VaoInfo[]): void {
    const gl = this.gl;
    gl.useProgram(this.program);

    // Set camera matrix
    const cameraInfo = this.resourceCache.getUniformData("CameraInfo");
    if (cameraInfo) {
      this.gl.uniformMatrix4fv(
        this.gl.getUniformLocation(this.program!, "viewMatrix"),
        false,
        cameraInfo.matView
      );
      this.gl.uniformMatrix4fv(
        this.gl.getUniformLocation(this.program!, "projMatrix"),
        false,
        cameraInfo.matProj
      );
    }
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.program!, "sunPos"),
      this.resourceCache.getUniformData("lights")[0].position
    );
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.program!, "viewDir"),
      this.resourceCache.getUniformData("cameraDirection")
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.program!, "grassThickness"),
      this.grassThickness
    );
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.bindVertexArray(this.grassVAO);
    gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }

  public dispose() {
    super.dispose();
    if (this.grassVAO) this.gl.deleteVertexArray(this.grassVAO);
    if (this.grassVBO) this.gl.deleteBuffer(this.grassVBO);
    if (this.grassEBO) this.gl.deleteBuffer(this.grassEBO);
  }
}
