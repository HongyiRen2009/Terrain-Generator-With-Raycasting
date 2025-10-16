export class lightingPass {
    gl: WebGL2RenderingContext;
    lightingPassProgram!: WebGLProgram;
    private lightingPass() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.BLEND);
    
        this.gl.useProgram(this.lightingPassProgram!);
        this.gl.bindVertexArray(this.screenQuadVAO);
    
        // Use TextureUtils.bindTex for all texture bindings
        TextureUtils.bindTex(
          this.gl,
          this.lightingPassProgram!,
          this.gBuffer?.normalTexture!,
          "normalTexture",
          0
        );
        TextureUtils.bindTex(
          this.gl,
          this.lightingPassProgram!,
          this.gBuffer?.albedoTexture!,
          "albedoTexture",
          1
        );
        TextureUtils.bindTex(
          this.gl,
          this.lightingPassProgram!,
          this.gBuffer?.depthTexture!,
          "depthTexture",
          2
        );
        TextureUtils.bindTex(
          this.gl,
          this.lightingPassProgram!,
          this.ssaoBlurFrameBuffer?.ssaoBlurTexture!,
          "ssaoTexture",
          3
        );
    
        this.gl.uniformMatrix4fv(
          this.gl.getUniformLocation(this.lightingPassProgram!, "viewInverse"),
          false,
          this.matViewInverse
        );
        this.gl.uniformMatrix4fv(
          this.gl.getUniformLocation(
            this.lightingPassProgram!,
            "projInverse"
          ),
          false,
          this.matProjInverse
        );
        this.gl.uniform3fv(
          this.gl.getUniformLocation(this.lightingPassProgram!, "viewPos"),
          this.camera.position
        );
    
        GlUtils.updateLights(
          this.gl,
          this.lightingPassProgram!,
          this.world.lights
        );
    
        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);
      }
    
}