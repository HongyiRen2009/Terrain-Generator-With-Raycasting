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
import { SettingsManager } from "../../Settings";
import { vec3 } from "gl-matrix";
import { Color } from "../../map/terrains";

export class LightingPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
  public pathtracerRender: boolean = false;
  private updateSunDirectionCallback?: (direction: vec3) => void;
  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph,
    name?: string,
    updateSunDirection?: (direction: vec3) => void
  ) {
    super(gl, resourceCache, canvas, renderGraph, name);
    this.updateSunDirectionCallback = updateSunDirection;
    this.program = RenderUtils.CreateProgram(
      gl,
      LightingVertexShaderSource,
      LightingFragmentShaderSource
    )!;
    this.uniforms = getUniformLocations(gl, this.program!, [
      "viewInverse",
      "projInverse",
      "cameraPosition",
      "ambientLightIntensity",
      "numShadowedLights",
    ]);
    this.InitSettings();
    
  }

  protected initRenderTarget(): RenderTarget {
    // Create framebuffer and texture for lit scene
    const fbo = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);

    // Use RGBA16F for HDR support (bloom, emissive materials)
    const litSceneTexture = TextureUtils.createTexture2D(
      this.gl,
      this.canvas.width,
      this.canvas.height,
      this.gl.RGBA16F,
      this.gl.RGBA,
      this.gl.FLOAT,
      null,
      this.gl.LINEAR,
      this.gl.LINEAR,
      this.gl.CLAMP_TO_EDGE,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      litSceneTexture,
      0
    );

    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    return { fbo, textures: { litSceneTexture } };
  }

  public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const textures = this.renderGraph!.getOutputs(this);
    const normalTexture = textures["normal"];
    const albedoTexture = textures["albedo"];
    const depthTexture = textures["depth"];
    const ssaoTexture = textures["ssaoBlur"];
    const materialAttributesTexture = textures["materialAttributes"];
    
    // Shadow mask textures from dedicated shadow passes
    const blurredSunShadowMask = textures["blurredSunShadowMask"];
    const blurredPointShadowMaskA = textures["blurredPointShadowMaskA"];
    const blurredPointShadowMaskB = textures["blurredPointShadowMaskB"];
    const blurredPointShadowMaskC = textures["blurredPointShadowMaskC"];
    const blurredPointShadowMaskD = textures["blurredPointShadowMaskD"];
    const blurredPointShadowMaskE = textures["blurredPointShadowMaskE"];

    // Bind lighting framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    if (!pathtracerOn || this.pathtracerRender) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.program!);
    this.gl.bindVertexArray(vao.vao);

    // Bind G-buffer textures
    TextureUtils.bindTex(this.gl, this.program!, normalTexture, "normalTexture", 0);
    TextureUtils.bindTex(this.gl, this.program!, albedoTexture, "albedoTexture", 1);
    TextureUtils.bindTex(this.gl, this.program!, materialAttributesTexture, "materialAttributesTexture", 2);
    TextureUtils.bindTex(this.gl, this.program!, depthTexture, "depthTexture", 3);
    TextureUtils.bindTex(this.gl, this.program!, ssaoTexture, "ssaoTexture", 4);
    
    // Bind shadow mask textures
    TextureUtils.bindTex(this.gl, this.program!, blurredSunShadowMask, "blurredSunShadowMask", 5);
    TextureUtils.bindTex(this.gl, this.program!, blurredPointShadowMaskA, "blurredPointShadowMaskA", 6);
    TextureUtils.bindTex(this.gl, this.program!, blurredPointShadowMaskB, "blurredPointShadowMaskB", 7);
    TextureUtils.bindTex(this.gl, this.program!, blurredPointShadowMaskC, "blurredPointShadowMaskC", 8);
    TextureUtils.bindTex(this.gl, this.program!, blurredPointShadowMaskD, "blurredPointShadowMaskD", 9);
    TextureUtils.bindTex(this.gl, this.program!, blurredPointShadowMaskE, "blurredPointShadowMaskE", 10);

    SettingsManager.instance.updateProgramUniforms(this.gl, this.program!);

    const cameraInfo = this.resourceCache.getData("CameraInfo");
    this.gl.uniformMatrix4fv(this.uniforms["viewInverse"], false, cameraInfo.matViewInverse);
    this.gl.uniformMatrix4fv(this.uniforms["projInverse"], false, cameraInfo.matProjInverse);
    this.gl.uniform3fv(this.uniforms["cameraPosition"], this.resourceCache.getData("cameraPosition"));

    // Shadow uniforms
    this.gl.uniform1i(this.uniforms["numShadowedLights"], this.resourceCache.getData("numShadowedLights") ?? 0);

    const disableSun = this.resourceCache.getData("disableSun") ?? false;
    this.gl.uniform1i(this.gl.getUniformLocation(this.program!, "sunDisabled"), disableSun ? 1 : 0);

    WorldUtils.updateLights(
      this.gl,
      this.program!,
      this.resourceCache.getData("lights"),
      disableSun
        ? { direction: vec3.fromValues(0, -1, 0), color: new Color(255, 255, 255), intensity: 0 }
        : this.resourceCache.getData("sunLight")
    );
    
    if (!pathtracerOn || this.pathtracerRender) {
      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  public resize(width: number, height: number): void {
    // Delete old resources
    if (this.renderTarget) {
      if (this.renderTarget.fbo) {
        this.gl.deleteFramebuffer(this.renderTarget.fbo);
      }
      if (this.renderTarget.textures) {
        for (const texture of Object.values(this.renderTarget.textures)) {
          this.gl.deleteTexture(texture);
        }
      }
    }
    // Recreate render target with new dimensions
    this.renderTarget = this.initRenderTarget();
  }

  private InitSettings() {
    SettingsManager.instance.addCheckboxToSection("Sky Settings", {
      id: "disableSun",
      label: "Disable Sun",
      defaultValue: false,
      onChange: (value: boolean) => {
        this.resourceCache.setData("disableSun", value);
      }
    });
    SettingsManager.instance.addColorPickerToSection("Sky Settings", {
      id: "__SUNCOLOR__",
      label: "Sun Color",
      defaultValue: "#ffffffff",
      onChange: (value: string)=>{
        const sunLight = this.resourceCache.getData("sunLight");
        if (sunLight) {
          sunLight.color = Color.fromHex(value);
          this.resourceCache.setData("sunLight", sunLight);
        }
      }
    });
    SettingsManager.instance.addSliderToSection("Sky Settings", {
      id: "angularRadius",
      label: "Sunlight Angular Radius",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.1,
      numType: "float",
      onChange: (value: number) => {
        const sunLight = this.resourceCache.getData("sunLight");
        if (sunLight) {
          sunLight.angularRadius = value;
          this.resourceCache.setData("sunLight", sunLight);
        }
      }
    });
    SettingsManager.instance.addSliderToSection("Sky Settings", {
      id: "__SUN_INTENSITY__",
      label: "Sunlight Intensity",
      min: 0,
      max: 20,
      step: 0.1,
      defaultValue: 4,
      numType: "float",
      onChange: (value: number) => {
        const sunLight = this.resourceCache.getData("sunLight");
        if (sunLight) {
          sunLight.intensity = value;
          this.resourceCache.setData("sunLight", sunLight);
        }
      }
    });

    SettingsManager.instance.addSliderToSection("Sky Settings", {
      id: "ambientLightIntensity",
      label: "Ambient Light Intensity",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.1,
      numType: "float"
    });

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
          initialElevation =
            Math.atan2(dir[1], horizontalLength) * (180 / Math.PI);
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
      SettingsManager.instance.addSliderToSection("Sky Settings", {
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
      SettingsManager.instance.addSliderToSection("Sky Settings", {
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
      "grassTranslucencyColor",
      "grassPointLightintensity",
      "grassPointLightDiffuseSoftness",
      "sunShadowStrength",
      "pointLightShadowStrength",
      "ambientLightIntensity",
      "cascadeDebug"
    ]);
  }
  
}


