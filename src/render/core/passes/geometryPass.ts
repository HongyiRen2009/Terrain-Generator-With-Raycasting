import { mat4 } from "gl-matrix";
import { glUtils } from "../../utils/GlUtils";
import {
  TerrainGeometryVertexShaderCode,
  TerrainGeometryFragmentShaderCode
} from "../../glsl/geometry";

export class geometryPass {
  gl: WebGL2RenderingContext;
  gBuffer: any;
  TerrainGeometryProgram: WebGLProgram | null;
  matView!: mat4;
  matProj!: mat4;
  terrainVAO: WebGLVertexArrayObject | null;
  TerrainMeshSize: number;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.terrainVAO = null;
    this.TerrainMeshSize = 0;
    this.TerrainGeometryProgram =
      glUtils.CreateProgram(
        gl,
        TerrainGeometryVertexShaderCode,
        TerrainGeometryFragmentShaderCode
      ) || null;

    if (!this.TerrainGeometryProgram) {
      console.error("Failed to create terrain geometry program");
    } else {
      console.log("Terrain geometry program created successfully");
    }
  }

  DefferedRenderingGeometryPass(TransformationMatrix: mat4) {
    if (!this.gBuffer || !this.TerrainGeometryProgram) {
      console.warn("Geometry pass: Missing gBuffer or program");
      return;
    }
    if (!this.terrainVAO) {
      console.warn("Geometry pass: Missing terrain VAO");
      return;
    }
    if (this.TerrainMeshSize === 0) {
      console.warn("Geometry pass: No mesh data to draw");
      return;
    }

    console.log(`Drawing ${this.TerrainMeshSize} elements`);
    console.log("gBuffer:", this.gBuffer);
    console.log("terrainVAO:", this.terrainVAO);
    console.log("program:", this.TerrainGeometryProgram);

    // Debug buffer information
    this.gl.bindVertexArray(this.terrainVAO);
    const indexBuffer = this.gl.getParameter(
      this.gl.ELEMENT_ARRAY_BUFFER_BINDING
    );
    if (indexBuffer) {
      const bufferSize = this.gl.getBufferParameter(
        this.gl.ELEMENT_ARRAY_BUFFER,
        this.gl.BUFFER_SIZE
      );
      const indexCount = bufferSize / 4; // 4 bytes per Uint32
      console.log(
        `Index buffer size: ${bufferSize} bytes, ${indexCount} indices`
      );
      console.log(`Requesting to draw ${this.TerrainMeshSize} elements`);

      if (this.TerrainMeshSize > indexCount) {
        console.error(
          `ERROR: Trying to draw ${this.TerrainMeshSize} elements but buffer only has ${indexCount} indices!`
        );
      }
    }

    // Check for WebGL errors before drawing
    const preDrawError = this.gl.getError();
    if (preDrawError !== this.gl.NO_ERROR) {
      console.error(`WebGL error before drawing: ${preDrawError}`);
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.gBuffer.framebuffer);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.useProgram(this.TerrainGeometryProgram);
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(this.TerrainGeometryProgram, "MatView"),
      false,
      this.matView
    );
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(this.TerrainGeometryProgram, "MatProj"),
      false,
      this.matProj
    );
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(this.TerrainGeometryProgram, "MatTransform"),
      false,
      TransformationMatrix
    );
    this.gl.bindVertexArray(this.terrainVAO);

    // Check for WebGL errors before drawElements
    const preDrawElementsError = this.gl.getError();
    if (preDrawElementsError !== this.gl.NO_ERROR) {
      console.error(`WebGL error before drawElements: ${preDrawElementsError}`);
    }

    console.log(
      `About to draw ${this.TerrainMeshSize} elements with UNSIGNED_INT type`
    );
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.TerrainMeshSize,
      this.gl.UNSIGNED_INT,
      0
    );

    // Check for WebGL errors after drawing
    const postDrawError = this.gl.getError();
    if (postDrawError !== this.gl.NO_ERROR) {
      console.error(`WebGL error after drawElements: ${postDrawError}`);
    }

    this.gl.bindVertexArray(null);
  }
}
