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

export class LightingPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
  public pathtracerRender: boolean = false;
  
  // Material uniform locations
  private materialUniforms: {
    metallicity: WebGLUniformLocation | null;
    roughness: WebGLUniformLocation | null;
    terrainColor: WebGLUniformLocation | null;
    ambientStrength: WebGLUniformLocation | null;
    specularIntensity: WebGLUniformLocation | null;
    specularPower: WebGLUniformLocation | null;
    colorBlendStrength: WebGLUniformLocation | null;
    colorIntensity: WebGLUniformLocation | null;
    // Terrain shading
    slopeShadingStrength: WebGLUniformLocation | null;
    heightGradientStrength: WebGLUniformLocation | null;
    heightGradientTop: WebGLUniformLocation | null;
    heightGradientBottom: WebGLUniformLocation | null;
    curvatureStrength: WebGLUniformLocation | null;
    detailNoiseStrength: WebGLUniformLocation | null;
    detailNoiseScale: WebGLUniformLocation | null;
    patchinessStrength: WebGLUniformLocation | null;
    patchinessScale: WebGLUniformLocation | null;
    patchinessColor: WebGLUniformLocation | null;
    ambientOcclusionStrength: WebGLUniformLocation | null;
    erosionNoiseStrength: WebGLUniformLocation | null;
    erosionNoiseScale: WebGLUniformLocation | null;
    microRoughnessStrength: WebGLUniformLocation | null;
    microRoughnessScale: WebGLUniformLocation | null;
    fogStrength: WebGLUniformLocation | null;
    fogHeight: WebGLUniformLocation | null;
    fogColor: WebGLUniformLocation | null;
  };

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
      "cameraPosition"
    ]);

    // Get material uniform locations
    this.materialUniforms = {
      metallicity: gl.getUniformLocation(this.program!, "u_metallicity"),
      roughness: gl.getUniformLocation(this.program!, "u_roughness"),
      terrainColor: gl.getUniformLocation(this.program!, "u_terrainColor"),
      ambientStrength: gl.getUniformLocation(this.program!, "u_ambientStrength"),
      specularIntensity: gl.getUniformLocation(this.program!, "u_specularIntensity"),
      specularPower: gl.getUniformLocation(this.program!, "u_specularPower"),
      colorBlendStrength: gl.getUniformLocation(this.program!, "u_colorBlendStrength"),
      colorIntensity: gl.getUniformLocation(this.program!, "u_colorIntensity"),
      slopeShadingStrength: gl.getUniformLocation(this.program!, "u_slopeShadingStrength"),
      heightGradientStrength: gl.getUniformLocation(this.program!, "u_heightGradientStrength"),
      heightGradientTop: gl.getUniformLocation(this.program!, "u_heightGradientTop"),
      heightGradientBottom: gl.getUniformLocation(this.program!, "u_heightGradientBottom"),
      curvatureStrength: gl.getUniformLocation(this.program!, "u_curvatureStrength"),
      detailNoiseStrength: gl.getUniformLocation(this.program!, "u_detailNoiseStrength"),
      detailNoiseScale: gl.getUniformLocation(this.program!, "u_detailNoiseScale"),
      patchinessStrength: gl.getUniformLocation(this.program!, "u_patchinessStrength"),
      patchinessScale: gl.getUniformLocation(this.program!, "u_patchinessScale"),
      patchinessColor: gl.getUniformLocation(this.program!, "u_patchinessColor"),
      ambientOcclusionStrength: gl.getUniformLocation(this.program!, "u_ambientOcclusionStrength"),
      erosionNoiseStrength: gl.getUniformLocation(this.program!, "u_erosionNoiseStrength"),
      erosionNoiseScale: gl.getUniformLocation(this.program!, "u_erosionNoiseScale"),
      microRoughnessStrength: gl.getUniformLocation(this.program!, "u_microRoughnessStrength"),
      microRoughnessScale: gl.getUniformLocation(this.program!, "u_microRoughnessScale"),
      fogStrength: gl.getUniformLocation(this.program!, "u_fogStrength"),
      fogHeight: gl.getUniformLocation(this.program!, "u_fogHeight"),
      fogColor: gl.getUniformLocation(this.program!, "u_fogColor"),
    };

    // Set default material values
    this.setDefaultMaterialUniforms();
  }

  private setDefaultMaterialUniforms(): void {
    this.gl.useProgram(this.program!);
    
    if (this.materialUniforms.metallicity) {
      this.gl.uniform1f(this.materialUniforms.metallicity, 0.0);
    }
    if (this.materialUniforms.roughness) {
      this.gl.uniform1f(this.materialUniforms.roughness, 0.5);
    }
    if (this.materialUniforms.terrainColor) {
      this.gl.uniform3f(this.materialUniforms.terrainColor, 0.5, 0.7, 0.3);
    }
    if (this.materialUniforms.ambientStrength) {
      this.gl.uniform1f(this.materialUniforms.ambientStrength, 0.3);
    }
    if (this.materialUniforms.specularIntensity) {
      this.gl.uniform1f(this.materialUniforms.specularIntensity, 1.0);
    }
    if (this.materialUniforms.specularPower) {
      this.gl.uniform1f(this.materialUniforms.specularPower, 16.0);
    }
    if (this.materialUniforms.colorBlendStrength) {
      this.gl.uniform1f(this.materialUniforms.colorBlendStrength, 0.7);
    }
    if (this.materialUniforms.colorIntensity) {
      this.gl.uniform1f(this.materialUniforms.colorIntensity, 1.0);
    }
  }

  /**
   * Update material uniforms - called by MaterialPropertiesPanel
   */
  public updateMaterialUniforms(properties: {
    metallicity: number;
    roughness: number;
    colorR: number;
    colorG: number;
    colorB: number;
    ambient: number;
    specularIntensity: number;
    specularPower: number;
    colorBlendStrength?: number;
    colorIntensity?: number;
    slopeShadingStrength?: number;
    heightGradientStrength?: number;
    heightGradientTopR?: number;
    heightGradientTopG?: number;
    heightGradientTopB?: number;
    heightGradientBottomR?: number;
    heightGradientBottomG?: number;
    heightGradientBottomB?: number;
    curvatureStrength?: number;
    detailNoiseStrength?: number;
    detailNoiseScale?: number;
    patchinessStrength?: number;
    patchinessScale?: number;
    patchinessColorR?: number;
    patchinessColorG?: number;
    patchinessColorB?: number;
    ambientOcclusionStrength?: number;
    erosionNoiseStrength?: number;
    erosionNoiseScale?: number;
    microRoughnessStrength?: number;
    microRoughnessScale?: number;
    fogStrength?: number;
    fogHeight?: number;
    fogColorR?: number;
    fogColorG?: number;
    fogColorB?: number;
  }): void {
    // Program must be active before setting uniforms
    this.gl.useProgram(this.program!);

    if (this.materialUniforms.metallicity) {
      this.gl.uniform1f(this.materialUniforms.metallicity, properties.metallicity);
    }
    if (this.materialUniforms.roughness) {
      this.gl.uniform1f(this.materialUniforms.roughness, properties.roughness);
    }
    if (this.materialUniforms.terrainColor) {
      this.gl.uniform3f(this.materialUniforms.terrainColor, properties.colorR, properties.colorG, properties.colorB);
    }
    if (this.materialUniforms.ambientStrength) {
      this.gl.uniform1f(this.materialUniforms.ambientStrength, properties.ambient);
    }
    if (this.materialUniforms.specularIntensity) {
      this.gl.uniform1f(this.materialUniforms.specularIntensity, properties.specularIntensity);
    }
    if (this.materialUniforms.specularPower) {
      this.gl.uniform1f(this.materialUniforms.specularPower, properties.specularPower);
    }
    if (this.materialUniforms.colorBlendStrength) {
      this.gl.uniform1f(this.materialUniforms.colorBlendStrength, properties.colorBlendStrength ?? 0.7);
    }
    if (this.materialUniforms.colorIntensity) {
      this.gl.uniform1f(this.materialUniforms.colorIntensity, properties.colorIntensity ?? 1.0);
    }
    // Terrain shading uniforms
    if (this.materialUniforms.slopeShadingStrength) {
      this.gl.uniform1f(this.materialUniforms.slopeShadingStrength, properties.slopeShadingStrength ?? 0.0);
    }
    if (this.materialUniforms.heightGradientStrength) {
      this.gl.uniform1f(this.materialUniforms.heightGradientStrength, properties.heightGradientStrength ?? 0.0);
    }
    if (this.materialUniforms.heightGradientTop) {
      this.gl.uniform3f(this.materialUniforms.heightGradientTop, 
        properties.heightGradientTopR ?? 1.0, 
        properties.heightGradientTopG ?? 1.0, 
        properties.heightGradientTopB ?? 1.0);
    }
    if (this.materialUniforms.heightGradientBottom) {
      this.gl.uniform3f(this.materialUniforms.heightGradientBottom, 
        properties.heightGradientBottomR ?? 0.2, 
        properties.heightGradientBottomG ?? 0.4, 
        properties.heightGradientBottomB ?? 0.6);
    }
    if (this.materialUniforms.curvatureStrength) {
      this.gl.uniform1f(this.materialUniforms.curvatureStrength, properties.curvatureStrength ?? 0.0);
    }
    if (this.materialUniforms.detailNoiseStrength) {
      this.gl.uniform1f(this.materialUniforms.detailNoiseStrength, properties.detailNoiseStrength ?? 0.0);
    }
    if (this.materialUniforms.detailNoiseScale) {
      this.gl.uniform1f(this.materialUniforms.detailNoiseScale, properties.detailNoiseScale ?? 10.0);
    }
    if (this.materialUniforms.patchinessStrength) {
      this.gl.uniform1f(this.materialUniforms.patchinessStrength, properties.patchinessStrength ?? 0.0);
    }
    if (this.materialUniforms.patchinessScale) {
      this.gl.uniform1f(this.materialUniforms.patchinessScale, properties.patchinessScale ?? 5.0);
    }
    if (this.materialUniforms.patchinessColor) {
      this.gl.uniform3f(this.materialUniforms.patchinessColor, 
        properties.patchinessColorR ?? 0.3, 
        properties.patchinessColorG ?? 0.5, 
        properties.patchinessColorB ?? 0.2);
    }
    if (this.materialUniforms.ambientOcclusionStrength) {
      this.gl.uniform1f(this.materialUniforms.ambientOcclusionStrength, properties.ambientOcclusionStrength ?? 0.0);
    }
    if (this.materialUniforms.erosionNoiseStrength) {
      this.gl.uniform1f(this.materialUniforms.erosionNoiseStrength, properties.erosionNoiseStrength ?? 0.0);
    }
    if (this.materialUniforms.erosionNoiseScale) {
      this.gl.uniform1f(this.materialUniforms.erosionNoiseScale, properties.erosionNoiseScale ?? 8.0);
    }
    if (this.materialUniforms.microRoughnessStrength) {
      this.gl.uniform1f(this.materialUniforms.microRoughnessStrength, properties.microRoughnessStrength ?? 0.0);
    }
    if (this.materialUniforms.microRoughnessScale) {
      this.gl.uniform1f(this.materialUniforms.microRoughnessScale, properties.microRoughnessScale ?? 50.0);
    }
    if (this.materialUniforms.fogStrength) {
      this.gl.uniform1f(this.materialUniforms.fogStrength, properties.fogStrength ?? 0.0);
    }
    if (this.materialUniforms.fogHeight) {
      this.gl.uniform1f(this.materialUniforms.fogHeight, properties.fogHeight ?? 10.0);
    }
    if (this.materialUniforms.fogColor) {
      this.gl.uniform3f(this.materialUniforms.fogColor, 
        properties.fogColorR ?? 0.5, 
        properties.fogColorG ?? 0.7, 
        properties.fogColorB ?? 1.0);
    }
  }

  protected initRenderTarget(): RenderTarget {
    return { fbo: null, textures: {} };
  }

  public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const textures = this.renderGraph!.getOutputs(this);
    const normalTexture = textures["normal"];
    const albedoTexture = textures["albedo"];
    const depthTexture = textures["depth"];
    const ssaoTexture = textures["ssaoBlur"];

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    if (!pathtracerOn || this.pathtracerRender) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
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

    const cameraInfo = this.resourceCache.getUniformData("CameraInfo");
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
    this.gl.uniform3fv(
      this.uniforms["cameraPosition"],
      this.resourceCache.getUniformData("cameraPosition")
    );

    WorldUtils.updateLights(
      this.gl,
      this.program!,
      this.resourceCache.getUniformData("lights")
    );

    // Material uniforms are updated here via ResourceCache
    // They're set by MaterialPropertiesPanel through updateMaterialUniforms()
    
    if (!pathtracerOn || this.pathtracerRender) {
      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }
    this.gl.bindVertexArray(null);
  }

  public resize(width: number, height: number): void {
    // LightingPass renders to default framebuffer, no resize needed
    // But we need to update viewport
    this.gl.viewport(0, 0, width, height);
  }
}