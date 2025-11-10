import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { RenderUtils } from "../../utils/RenderUtils";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { TextureUtils } from "../../utils/TextureUtils";
import LightingVertexShaderSource from "../glsl/DeferredRendering/Lighting.vert";
import LightingFragmentShaderSource from "../glsl/DeferredRendering/Lighting.frag";
import { getUniformLocations } from "../renderSystem/managers/ResourceCache";
import { WorldUtils } from "../../utils/WorldUtils";
import { SettingsSection } from "../../Settings";

export class LightingPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
  protected settingsSection: SettingsSection | null = null;
  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    this.program = RenderUtils.CreateProgram(
      gl,
      LightingVertexShaderSource,
      LightingFragmentShaderSource
    )!;
    this.renderTarget = this.initRenderTarget();
    this.uniforms = getUniformLocations(gl, this.program!, [
      "viewInverse",
      "projInverse",
      "pausedView",
      "cameraPosition",
      "lightSpaceMatrices[0]",
      "cascadeSplits",
      "usingPCF",
      "shadowBias",
      "csmEnabled",
      "cascadeDebug",
      "debugPauseMode",
      "showShadowMap",
      "shadowMapCascade",
      "shadowMapSize",
      "showCameraDepth"
    ]);
    this.InitSettings();
  }

  protected initRenderTarget(): RenderTarget {
    return { fbo: null, textures: {} };
  }

  public render(vao_info: VaoInfo | VaoInfo[]): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const textures = this.renderGraph!.getOutputs(this);
    const normalTexture = textures["normal"];
    const albedoTexture = textures["albedo"];
    const depthTexture = textures["depth"];
    const ssaoTexture = textures["ssaoBlur"];
    const cascadeDepthTexture0 = textures["shadowDepthTexture0"];
    const cascadeDepthTexture1 = textures["shadowDepthTexture1"];
    const cascadeDepthTexture2 = textures["shadowDepthTexture2"];

    // Debug: Check if shadow textures are available
    if (!cascadeDepthTexture0 || !cascadeDepthTexture1 || !cascadeDepthTexture2) {
        console.warn("[Lighting] Missing shadow depth textures:", {
            cascade0: !!cascadeDepthTexture0,
            cascade1: !!cascadeDepthTexture1,
            cascade2: !!cascadeDepthTexture2,
            availableTextures: Object.keys(textures)
        });
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.program!);
    this.gl.bindVertexArray(vao.vao);

    TextureUtils.bindTex(
      this.gl,
      this.program!,
      normalTexture,
      "normalTexture",
      0
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      albedoTexture,
      "albedoTexture",
      1
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      depthTexture,
      "depthTexture",
      2
    );
    TextureUtils.bindTex(this.gl, this.program!, ssaoTexture, "ssaoTexture", 3);
    
    // Bind cascade depth textures
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      cascadeDepthTexture0,
      "cascadeDepthTexture0",
      4
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      cascadeDepthTexture1,
      "cascadeDepthTexture1",
      5
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      cascadeDepthTexture2,
      "cascadeDepthTexture2",
      6
    );

    const cameraInfo = this.resourceCache.getUniformData("CameraInfo");
    const pausedCameraInfo =
      this.resourceCache.getUniformData("pausedCameraInfo") ?? cameraInfo;
    const debugPauseMode =
      this.resourceCache.getUniformData("debugPauseMode") ??
      this.resourceCache.getUniformData("debugPause") ??
      false;
    this.gl.uniformMatrix4fv(
      this.uniforms["viewInverse"],
      false,
      cameraInfo.matViewInverse
    );
    this.gl.uniformMatrix4fv(
      this.uniforms["projInverse"],
      false,
      cameraInfo.matProjInverse
    );
    this.gl.uniformMatrix4fv(
      this.uniforms["pausedView"],
      false,
      pausedCameraInfo.matView
    );
    this.gl.uniform3fv(
      this.uniforms["cameraPosition"],
      this.resourceCache.getUniformData("cameraPosition")
    );

    // Set CSM uniforms
    const lightSpaceMatrices = this.resourceCache.getUniformData("lightSpaceMatrices");
    if (lightSpaceMatrices && Array.isArray(lightSpaceMatrices) && lightSpaceMatrices.length === 3) {
      // Flatten the array of matrices into a single Float32Array (3 matrices * 16 floats = 48 floats)
      const flattened = new Float32Array(48);
      for (let i = 0; i < 3; i++) {
        flattened.set(lightSpaceMatrices[i], i * 16);
      }
      this.gl.uniformMatrix4fv(
        this.uniforms["lightSpaceMatrices[0]"],
        false,
        flattened
      );
    }

    const cascadeSplits = this.resourceCache.getUniformData("cascadeSplits");
    if (cascadeSplits && Array.isArray(cascadeSplits) && cascadeSplits.length === 3) {
      this.gl.uniform1fv(
        this.uniforms["cascadeSplits"],
        cascadeSplits
      );
    }

    const usingPCF = this.resourceCache.getUniformData("usingPCF") ?? true;
    const shadowBias = this.resourceCache.getUniformData("shadowBias") ?? 0.001;
    const csmEnabled = this.resourceCache.getUniformData("csmEnabled") ?? true;
    const cascadeDebug = this.resourceCache.getUniformData("cascadeDebug") ?? false;
    const showShadowMap = this.resourceCache.getUniformData("showShadowMap") ?? false;
    const shadowMapCascade = this.resourceCache.getUniformData("shadowMapCascade") ?? 0;
    const shadowMapSize = this.resourceCache.getUniformData("shadowMapSize") ?? 2048;
    const showCameraDepth = this.resourceCache.getUniformData("showCameraDepth") ?? false;
    
    this.gl.uniform1i(this.uniforms["usingPCF"], usingPCF ? 1 : 0);
    this.gl.uniform1f(this.uniforms["shadowBias"], shadowBias);
    this.gl.uniform1i(this.uniforms["csmEnabled"], csmEnabled ? 1 : 0);
    this.gl.uniform1i(this.uniforms["cascadeDebug"], cascadeDebug ? 1 : 0);
    this.gl.uniform1i(
      this.uniforms["debugPauseMode"],
      debugPauseMode ? 1 : 0
    );
    this.gl.uniform1i(this.uniforms["showShadowMap"], showShadowMap ? 1 : 0);
    this.gl.uniform1i(this.uniforms["shadowMapCascade"], shadowMapCascade);
    this.gl.uniform1f(this.uniforms["shadowMapSize"], shadowMapSize);
    this.gl.uniform1i(this.uniforms["showCameraDepth"], showCameraDepth ? 1 : 0);

    WorldUtils.updateLights(
      this.gl,
      this.program!,
      this.resourceCache.getUniformData("lights")
    );

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
  }

  public resize(width: number, height: number): void {
    // LightingPass renders to default framebuffer, no resize needed
    // But we need to update viewport
    this.gl.viewport(0, 0, width, height);
  }

  private InitSettings() {
    this.settingsSection = new SettingsSection(
      document.getElementById("settings-section")!,
      "Lighting Settings",
      this.program!
    );
    this.settingsSection.addCheckbox({
      id: "showCameraDepth",
      label: "Show Camera Depth",
      defaultValue: false,
      onChange: (value: boolean) => {
        this.resourceCache.setUniformData("showCameraDepth", value);
      }
    });
    
    // Initialize default value in resourceCache
    this.resourceCache.setUniformData("showCameraDepth", false);
  }
}
