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
    // Combine GrassPass and GrassGeometryPass settings into one section
    SettingsManager.instance.createSection(
      document.getElementById("settings-section")!,
      "Grass Settings"
    );

    // Color settings
    SettingsManager.instance.addColorPickerToSection("Grass Settings", {
      id: "baseColor",
      label: "Base Color",
      defaultValue: "#046204"
    });
    SettingsManager.instance.addColorPickerToSection("Grass Settings", {
      id: "tipColor",
      label: "Tip Color",
      defaultValue: "#00ff00"
    });
    SettingsManager.instance.addColorPickerToSection("Grass Settings", {
      id: "specularColor",
      label: "Specular Color",
      defaultValue: "#ffffff"
    });
    SettingsManager.instance.addColorPickerToSection("Grass Settings", {
      id: "translucencyColor",
      label: "Translucency Color",
      defaultValue: "#b3ff80"
    });

    // Lighting settings
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "diffuseStrength",
      label: "Diffuse Strength",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.3
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "baseDarkness",
      label: "Base Darkness",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.7
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "specularStrength",
      label: "Specular Strength",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.25
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "shininess",
      label: "Shininess",
      min: 1,
      max: 100,
      step: 1,
      defaultValue: 32
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "translucencyStrength",
      label: "Translucency Strength",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 0.7
    });

    // Transition settings
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "ambientTransitionPower",
      label: "Ambient Transition Power",
      min: 0.1,
      max: 5,
      step: 0.1,
      defaultValue: 1
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "specularTransitionPower",
      label: "Specular Transition Power",
      min: 0.1,
      max: 5,
      step: 0.1,
      defaultValue: 2
    });
    SettingsManager.instance.addSliderToSection("Grass Settings", {
      id: "translucencyTransitionPower",
      label: "Translucency Transition Power",
      min: 0.1,
      max: 5,
      step: 0.1,
      defaultValue: 0.7
    });
    SettingsManager.instance.attatchProgram(this.program!, [
      "baseColor",
      "tipColor",
      "specularColor",
      "translucencyColor",
      "diffuseStrength",
      "baseDarkness",
      "specularStrength",
      "shininess",
      "translucencyStrength",
      "ambientTransitionPower",
      "specularTransitionPower",
      "translucencyTransitionPower"
    ]);
  }

  protected initRenderTarget(): RenderTarget {
    const fbo = this.gl.createFramebuffer();
    if (!fbo) {
      throw new Error("[GrassPass] Failed to create framebuffer");
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
    const grassColorTexture = TextureUtils.createTexture2D(
      this.gl,
      this.canvas.width,
      this.canvas.height,
      this.gl.RGBA16F,
      this.gl.RGBA,
      this.gl.FLOAT
    );
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      grassColorTexture,
      0
    );
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    return {
      fbo,
      textures: {
        grassColorTexture
      }
    };
  }

  public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const gl = this.gl;

    if (!this.program) return;

    gl.useProgram(this.program);

    // Bind to screen framebuffer or lighting FBO
    if (pathtracerOn) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTarget!.fbo);
    }
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    // Get geometry data from GrassGeometryPass
    const gBuffer = this.renderGraph!.getOutputs(this);
    const depthTexture = gBuffer["grassDepthTexture"];
    const heightTexture = gBuffer["heightTexture"];
    const normalTexture = gBuffer["grassNormalTexture"];
    const curveAngleTexture = gBuffer["curveAngle"];

    // Bind textures
    TextureUtils.bindTex(gl, this.program!, depthTexture, "depthTexture", 0);
    TextureUtils.bindTex(gl, this.program!, heightTexture, "heightTexture", 1);
    TextureUtils.bindTex(gl, this.program!, normalTexture, "normalTexture", 2);
    TextureUtils.bindTex(
      gl,
      this.program!,
      curveAngleTexture,
      "curveAngleTexture",
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
