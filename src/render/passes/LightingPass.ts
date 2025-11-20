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
import { vec3 } from "gl-matrix";
import { Color } from "../../map/terrains";

export class LightingPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
  protected settingsSection: SettingsSection | null = null;
  private updateSunDirectionCallback?: (direction: vec3) => void;
  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph,
    updateSunDirection?: (direction: vec3) => void
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    this.updateSunDirectionCallback = updateSunDirection;
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
      "csmShadowBias",
      "csmEnabled",
      "cascadeDebug",
      "debugPauseMode",
      "showShadowMap",
      "shadowMapCascade",
      "csmShadowMapSize",
      "showCameraDepth",
      "numCascades",
      "pointShadowBias",
      "numShadowedLights",
      "pointLightShowShadowMap",
      "cubeMapSize",
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
    const shadowDepthTextureArray = textures["shadowDepthTextureArray"];
    const pointShadowTextures = textures["pointShadowTextures"] as WebGLTexture[];

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
      11
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      albedoTexture,
      "albedoTexture",
      12
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      depthTexture,
      "depthTexture",
      13
    );
    TextureUtils.bindTex(this.gl, this.program!, ssaoTexture, "ssaoTexture", 14);
    
    // Bind cascade depth texture array
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      shadowDepthTextureArray,
      "shadowDepthTextureArray",
      15,
      this.gl.TEXTURE_2D_ARRAY
    );

    const maxPointShadows = Math.min(5, pointShadowTextures?.length ?? 0);
    for (let i = 0; i < maxPointShadows; i++) {
      TextureUtils.bindTex(this.gl, this.program!, pointShadowTextures[i], `pointShadowTexture[${i}]`, i, this.gl.TEXTURE_CUBE_MAP);
      if (!pointShadowTextures[i]) {
        console.warn(`Point shadow texture ${i} is missing`);
      }
    }

    const cameraInfo = this.resourceCache.getData("CameraInfo");
    const pausedCameraInfo =
      this.resourceCache.getData("pausedCameraInfo") ?? cameraInfo;
    const debugPauseMode =
      this.resourceCache.getData("debugPauseMode") ??
      this.resourceCache.getData("debugPause") ??
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
      this.resourceCache.getData("cameraPosition")
    );

    // Set CSM uniforms
    const numCascades = this.resourceCache.getData("numCascades") ?? 3;
    const lightSpaceMatrices = this.resourceCache.getData("lightSpaceMatrices");
    if (lightSpaceMatrices && Array.isArray(lightSpaceMatrices) && lightSpaceMatrices.length === numCascades) {
      // Flatten the array of matrices into a single Float32Array (numCascades matrices * 16 floats)
      const flattened = new Float32Array(numCascades * 16);
      for (let i = 0; i < numCascades; i++) {
        flattened.set(lightSpaceMatrices[i], i * 16);
      }
      this.gl.uniformMatrix4fv(
        this.uniforms["lightSpaceMatrices[0]"],
        false,
        flattened
      );
    }

    const cascadeSplits = this.resourceCache.getData("cascadeSplits");
    if (cascadeSplits && Array.isArray(cascadeSplits) && cascadeSplits.length === numCascades) {
      this.gl.uniform1fv(
        this.uniforms["cascadeSplits"],
        cascadeSplits
      );
    }

    const usingPCF = this.resourceCache.getData("usingPCF") ?? true;
    const csmShadowBias = this.resourceCache.getData("csmShadowBias");
    // Support both array and single value for backward compatibility
    const csmShadowBiasArray = Array.isArray(csmShadowBias) 
      ? csmShadowBias 
      : [csmShadowBias ?? 0.001];
    const csmEnabled = this.resourceCache.getData("csmEnabled") ?? true;
    const cascadeDebug = this.resourceCache.getData("cascadeDebug") ?? false;
    const showShadowMap = this.resourceCache.getData("showShadowMap") ?? false;
    const shadowMapCascade = this.resourceCache.getData("shadowMapCascade") ?? 0;
    const csmShadowMapSize = this.resourceCache.getData("csmShadowMapSize");
    const showCameraDepth = this.resourceCache.getData("showCameraDepth") ?? false;
    const pointShadowBias = this.resourceCache.getData("pointShadowBias") ?? 0.05;
    
    this.gl.uniform1i(this.uniforms["usingPCF"], usingPCF ? 1 : 0);
    // Upload csmShadowBias as array uniform
    const csmShadowBiasFloatArray = new Float32Array(8); // Support up to 8 cascades
    csmShadowBiasFloatArray.set(csmShadowBiasArray.slice(0, 8), 0);
    this.gl.uniform1fv(this.uniforms["csmShadowBias"], csmShadowBiasFloatArray);
    this.gl.uniform1i(this.uniforms["csmEnabled"], csmEnabled ? 1 : 0);
    this.gl.uniform1i(this.uniforms["cascadeDebug"], cascadeDebug ? 1 : 0);
    this.gl.uniform1i(
      this.uniforms["debugPauseMode"],
      debugPauseMode ? 1 : 0
    );
    this.gl.uniform1i(this.uniforms["showShadowMap"], showShadowMap ? 1 : 0);
    this.gl.uniform1i(this.uniforms["shadowMapCascade"], shadowMapCascade);
    this.gl.uniform1i(this.uniforms["csmShadowMapSize"], csmShadowMapSize);
    this.gl.uniform1i(this.uniforms["showCameraDepth"], showCameraDepth ? 1 : 0);
    this.gl.uniform1i(this.uniforms["numCascades"], numCascades);
    this.gl.uniform1f(this.uniforms["pointShadowBias"], pointShadowBias);
    this.gl.uniform1i(this.uniforms["numShadowedLights"], this.resourceCache.getData("numShadowedLights") ?? 0);
    this.gl.uniform1i(this.uniforms["cubeMapSize"], this.resourceCache.getData("CubeShadowsMapSize") ?? 1024);
    
    // Update point light shadow map visualization flags
    const lights = this.resourceCache.getData("lights") as any[];
    if (lights) {
      const showShadowMapArray = lights.map((light: any) => light.showShadowMap ? 1 : 0);
      this.gl.uniform1iv(this.uniforms["pointLightShowShadowMap"], showShadowMapArray);
    }

    WorldUtils.updateLights(
      this.gl,
      this.program!,
      this.resourceCache.getData("lights"),
      this.resourceCache.getData("disableSun") ? {direction: vec3.fromValues(0, -1, 0), color: new Color(255, 255, 255), intensity: 0} : this.resourceCache.getData("sunLight")
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
      id: "disableSun",
      label: "Disable Sun",
      defaultValue: false,
      onChange: (value: boolean) => {
        this.resourceCache.setData("disableSun", value);
      }
    });
    this.settingsSection.addCheckbox({
      id: "showCameraDepth",
      label: "Show Camera Depth",
      defaultValue: false,
      onChange: (value: boolean) => {
        this.resourceCache.setData("showCameraDepth", value);
      }
    });
    
    // Initialize default value in resourceCache
    this.resourceCache.setData("showCameraDepth", false);

    // Add sun direction sliders
    if (this.updateSunDirectionCallback) {
      // Get initial sun direction from sunLight
      const sunLight = this.resourceCache.getData("sunLight") as any;
      let initialAzimuth = 180; // Default to south (180 degrees)
      let initialElevation = -45; // Default to 45 degrees down

      if (sunLight && sunLight.direction) {
        const dir = sunLight.direction;
        // Convert direction vector to spherical coordinates
        // azimuth: angle in XZ plane (0-360)
        // elevation: angle above/below horizon (-90 to 90)
        const horizontalLength = Math.sqrt(dir[0] * dir[0] + dir[2] * dir[2]);
        if (horizontalLength > 0.0001) {
          // Normal case: can compute azimuth
          initialAzimuth = Math.atan2(dir[0], dir[2]) * (180 / Math.PI);
          if (initialAzimuth < 0) initialAzimuth += 360;
          initialElevation = Math.atan2(dir[1], horizontalLength) * (180 / Math.PI);
        } else {
          // Edge case: direction is straight up or down
          // Azimuth doesn't matter, but elevation is ±90
          initialElevation = dir[1] > 0 ? 90 : -90;
          // Keep default azimuth of 180
        }
      }

      // Function to convert spherical coordinates to direction vector
      const updateSunDirection = (azimuth: number, elevation: number) => {
        const azimuthRad = (azimuth * Math.PI) / 180;
        const elevationRad = (elevation * Math.PI) / 180;
        
        // Convert to direction vector
        // X = sin(azimuth) * cos(elevation)
        // Y = sin(elevation)
        // Z = cos(azimuth) * cos(elevation)
        const dir = vec3.fromValues(
          Math.sin(azimuthRad) * Math.cos(elevationRad),
          Math.sin(elevationRad),
          Math.cos(azimuthRad) * Math.cos(elevationRad)
        );
        vec3.normalize(dir, dir);
        
        if (this.updateSunDirectionCallback) {
          this.updateSunDirectionCallback(dir);
        }
      };

      // Store current values
      let currentAzimuth = initialAzimuth;
      let currentElevation = initialElevation;

      // Sun azimuth slider (0-360 degrees)
      this.settingsSection.addSlider({
        id: "sunAzimuth",
        label: "Sun Azimuth (degrees)",
        min: 0,
        max: 360,
        step: 1,
        defaultValue: initialAzimuth,
        numType: "float",
        onChange: (value: number) => {
          currentAzimuth = value;
          updateSunDirection(currentAzimuth, currentElevation);
        }
      });

      // Sun elevation slider (-90 to 90 degrees)
      this.settingsSection.addSlider({
        id: "sunElevation",
        label: "Sun Elevation (degrees)",
        min: -90,
        max: 90,
        step: 1,
        defaultValue: initialElevation,
        numType: "float",
        onChange: (value: number) => {
          currentElevation = value;
          updateSunDirection(currentAzimuth, currentElevation);
        }
      });
    }
  }
}
