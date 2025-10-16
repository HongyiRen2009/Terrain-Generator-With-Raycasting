import { MeshSSAOBlurVertexShaderCode, MeshSSAOBlurFragmentShaderCode } from "../../glsl/ssaoBlur";
import { GlUtils } from "../../utils/GlUtils";
import { TextureUtils } from "../../utils/TextureUtils";

export class SSAOBlurPass {
    private gl: WebGL2RenderingContext;
    private ssaoBlurPassProgram: WebGLProgram | undefined;
    private screenQuadVAO: WebGLVertexArrayObject | null = null;
    ssaoBlurFrameBuffer: {
    framebuffer: WebGLFramebuffer;
    ssaoBlurTexture: WebGLTexture; // Blurred SSAO result
    } | null = null

    constructor(gl: WebGL2RenderingContext, screenQuadVAO: WebGLVertexArrayObject) {
        this.gl = gl;
        this.screenQuadVAO = screenQuadVAO;
        this.ssaoBlurPassProgram=GlUtils.CreateProgram(
            this.gl,
            MeshSSAOBlurVertexShaderCode,
            MeshSSAOBlurFragmentShaderCode

          );
    }
      private initializeSSAOBlurFrameBuffer(width: number, height: number) {
    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) {
      throw new Error("Failed to create SSAO Blur framebuffer");
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

    const ssaoBlurTexture = TextureUtils.createTexture(
      this.gl,
      width,
      height,
      this.gl.R8,
      this.gl.RED,
      this.gl.UNSIGNED_BYTE
    );

    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      ssaoBlurTexture,
      0
    );
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    this.ssaoBlurFrameBuffer = {
      framebuffer: framebuffer,
      ssaoBlurTexture: ssaoBlurTexture
    };
  }
    // Blur Pass: Blur SSAO texture to reduce noise
  private blurPass(width: number, height: number,ssaoFrameBuffer:any,gBuffer:any,enableSSAOBlur:boolean) {
    this.gl.bindFramebuffer(
      this.gl.FRAMEBUFFER,
      this.ssaoBlurFrameBuffer?.framebuffer || null
    );
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.ssaoBlurPassProgram!);
    this.gl.bindVertexArray(this.screenQuadVAO);

    // Use TextureUtils.bindTex for texture binding
    TextureUtils.bindTex(
      this.gl,
      this.ssaoBlurPassProgram!,
      ssaoFrameBuffer?.ssaoTexture!,
      "ssaoTexture",
      0
    );
    TextureUtils.bindTex(
      this.gl,
      this.ssaoBlurPassProgram!,
      gBuffer?.depthTexture!,
      "depthTexture",
      1
    );

    this.gl.uniform1i(
      this.gl.getUniformLocation(
        this.ssaoBlurPassProgram!,
        "enableBlur"
      ),
      enableSSAOBlur ? 1 : 0
    );

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
}