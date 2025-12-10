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
import { SettingsManager } from "../../Settings";

export class GrassPass extends RenderPass {
  public VAOInputType = VAOInputType.FULLSCREENQUAD;
  public pathtracerRender: boolean = true;

  protected program: WebGLProgram | null;

  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    this.program = RenderUtils.CreateProgram(
      gl,
      GrassVertexShaderSource,
      GrassFragmentShaderSource
    )!;
    this.initSettings();
  }

  private initSettings() {
    SettingsManager.instance.attatchProgram(this.program!, [
      "grassSpecularStrength",
      "grassShininess",
      "grassTranslucencyStrength",
      "grassAmbientTransitionPower",
      "grassSpecularTransitionPower",
      "grassTranslucencyTransitionPower",
      "grassDiffuseStrength",
      "grassBaseDarkness",
      "grassBaseColor",
      "grassTipColor",
      "grassSpecularColor",
      "grassTranslucencyColor"
    ]);
  }

  protected initRenderTarget(): RenderTarget {
    return { fbo: null, textures: {} };
  }

  public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const gl = this.gl;

    if (!this.program) return;

    // Check if grass is enabled
    const grassEnabled = this.resourceCache.getData("grassEnabled") ?? true;
    if (!grassEnabled) return;

    gl.useProgram(this.program);

    // Bind to screen framebuffer or lighting FBO
    if (pathtracerOn) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else {
      return;
    }
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    debugger;
    // Get geometry data from GrassGeometryPass
    const gBuffer = this.renderGraph!.getOutputs(this);
    const depthTexture = gBuffer["grassDepth"];
    const normalTexture = gBuffer["grassNormal"];
    const albedoTexture = gBuffer["grassAlbedo"];
    const worldDepthTexture = gBuffer["depth"];

    // Bind textures
    TextureUtils.bindTex(gl, this.program!, depthTexture, "depthTexture", 0);
    TextureUtils.bindTex(gl, this.program!, normalTexture, "normalTexture", 1);
    TextureUtils.bindTex(gl, this.program!, albedoTexture, "albedoTexture", 2);
    TextureUtils.bindTex(
      gl,
      this.program!,
      worldDepthTexture,
      "worldDepthTexture",
      3
    );

    // Bind lighting data
    const cameraInfo = this.resourceCache.getData("CameraInfo");
    const cameraPos = this.resourceCache.getData("cameraPosition") as
      | vec3
      | undefined;

    if (!cameraPos || !cameraInfo) return;

    gl.uniform3fv(
      gl.getUniformLocation(this.program!, "sunPos"),
      this.resourceCache.getData("lights")[0].position
    );
    gl.uniform3fv(
      gl.getUniformLocation(this.program!, "viewDir"),
      this.resourceCache.getData("cameraDirection")
    );
    gl.uniform3fv(gl.getUniformLocation(this.program!, "cameraPos"), cameraPos);
    gl.uniformMatrix4fv(
      gl.getUniformLocation(this.program!, "projMatrix"),
      false,
      cameraInfo.matProj
    );
    gl.uniformMatrix4fv(
      gl.getUniformLocation(this.program!, "projMatrixInverse"),
      false,
      cameraInfo.matProjInverse
    );
    SettingsManager.instance.updateProgramUniforms(gl, this.program!);

    if (!pathtracerOn || this.pathtracerRender) {
      gl.bindVertexArray(vao.vao);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      gl.bindVertexArray(null);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  public dispose() {
    super.dispose();
  }
}
