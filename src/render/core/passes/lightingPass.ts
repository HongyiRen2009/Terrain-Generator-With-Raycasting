import { glUtils } from "../../utils/GlUtils";
import { textureUtils } from "../../utils/TextureUtils";
import {
  TerrainLightingVertexShaderCode,
  TerrainLightingFragmentShaderCode
} from "../../glsl/lighting";

export class lightingPass {
  gl: WebGL2RenderingContext;
  gBuffer: any;
  SSAOFramebuffer: any;
  QuadVAO: WebGLVertexArrayObject | null;
  TerrainLightingProgram: WebGLProgram | null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.QuadVAO = null;
    this.TerrainLightingProgram =
      glUtils.CreateProgram(
        gl,
        TerrainLightingVertexShaderCode,
        TerrainLightingFragmentShaderCode
      ) || null;

    if (!this.TerrainLightingProgram) {
      console.error("Failed to create terrain lighting program");
    } else {
      console.log("Terrain lighting program created successfully");
    }
  }

  DefferedRenderingLightingPass() {
    if (!this.gBuffer || !this.SSAOFramebuffer || !this.QuadVAO) return;
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.useProgram(this.TerrainLightingProgram!);
    textureUtils.bindTex(
      this.gl,
      this.TerrainLightingProgram!,
      this.gBuffer.position,
      "VertexPositionTexture",
      0
    );
    textureUtils.bindTex(
      this.gl,
      this.TerrainLightingProgram!,
      this.gBuffer.normal,
      "VertexNormalTexture",
      1
    );
    textureUtils.bindTex(
      this.gl,
      this.TerrainLightingProgram!,
      this.gBuffer.albedo,
      "VertexAlbedoTexture",
      2
    );
    textureUtils.bindTex(
      this.gl,
      this.TerrainLightingProgram!,
      this.SSAOFramebuffer.SSAOTexture,
      "SSAOTexture",
      3
    );
    this.gl.bindVertexArray(this.QuadVAO);
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
  }
}
