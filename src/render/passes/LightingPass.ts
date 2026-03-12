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
import { Color, Terrain, Terrains, MaterialMap } from "../../map/terrains";

export class LightingPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
  public pathtracerRender: boolean = false;
  public materialsTextureArray: WebGLTexture;
  public materialTextureScale: number[];
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
      "materialTextureScale[0]"
    ]);
    this.InitSettings();
    this.materialsTextureArray = this.createMaterialsTextureArray();
    this.materialTextureScale = this.updateMaterialTextureScale();
  }

  protected initRenderTarget(): RenderTarget {
    // Create framebuffer and texture for lit scene
    const fbo = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);

    // Use RGBA16F for HDR support (bloom, emissive materials)
    const sceneTexture = TextureUtils.createTexture2D(
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
      sceneTexture,
      0
    );

    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    return { fbo, textures: { sceneTexture } };
  }

  public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    const textures = this.renderGraph!.getOutputs(this);
    const gNormal = textures["normal"];
    const gAux = textures["uv"];
    const gMaterialID = textures["materialID"];
    const gDepth = textures["depth"];
    const ssaoTexture = textures["ssaoBlur"];
    
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
    this.gl.clearDepth(1.0);
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.BLEND);

    this.gl.useProgram(this.program!);
    this.gl.bindVertexArray(vao.vao);

    // Bind G-buffer textures
    TextureUtils.bindTex(this.gl, this.program!, gNormal, "gNormal", 0);
    TextureUtils.bindTex(this.gl, this.program!, gAux, "gAux", 1);
    TextureUtils.bindTex(this.gl, this.program!, gMaterialID, "gMaterialID", 2);
    // No materialAttributesTexture binding
    TextureUtils.bindTex(this.gl, this.program!, gDepth, "gDepth", 3);
    TextureUtils.bindTex(this.gl, this.program!, ssaoTexture, "ssaoTexture", 4);
    TextureUtils.bindTex(this.gl, this.program!, this.materialsTextureArray, "materialsTextureArray", 5, this.gl.TEXTURE_2D_ARRAY);
    
    // Bind shadow mask textures
    TextureUtils.bindTex(this.gl, this.program!, blurredSunShadowMask, "blurredSunShadowMask", 6);
    TextureUtils.bindTex(this.gl, this.program!, blurredPointShadowMaskA, "blurredPointShadowMaskA", 7);
    TextureUtils.bindTex(this.gl, this.program!, blurredPointShadowMaskB, "blurredPointShadowMaskB", 8);
    TextureUtils.bindTex(this.gl, this.program!, blurredPointShadowMaskC, "blurredPointShadowMaskC", 9);
    TextureUtils.bindTex(this.gl, this.program!, blurredPointShadowMaskD, "blurredPointShadowMaskD", 10);
    TextureUtils.bindTex(this.gl, this.program!, blurredPointShadowMaskE, "blurredPointShadowMaskE", 11);

    SettingsManager.instance.updateProgramUniforms(this.gl, this.program!);

    const cameraInfo = this.resourceCache.getData("CameraInfo");
    this.gl.uniformMatrix4fv(this.uniforms["viewInverse"], false, cameraInfo.matViewInverse);
    this.gl.uniformMatrix4fv(this.uniforms["projInverse"], false, cameraInfo.matProjInverse);
    const scaleArray = SettingsManager.instance.getSliderArray("materialTextureScale");
    this.gl.uniform1fv(this.uniforms["materialTextureScale[0]"], scaleArray);
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
    // Terrain material texture scale (per-terrain, index 0=Grass, 1=Dirt, 2=Rock, 3=Snow, 4=Water, 5=Sand)
    SettingsManager.instance.createSection(
      document.getElementById("settings-section")!,
      "Terrain Materials"
    );
    const defaultTexScales = this.getDefaultTexScaleArray();
    SettingsManager.instance.addSliderToSection("Terrain Materials", {
      id: "materialTextureScale",
      label: "Terrain Tex Scale",
      isArray: true,
      arrayLength: defaultTexScales.length,
      defaultValue: defaultTexScales,
      min: 0.001,
      max: 1,
      step: 0.001,
      numType: "float",
      uniform: false,
      fineTuner: true
    });

    SettingsManager.instance.addCheckboxToSection("Terrain Materials", {
      id: "useTerrainNormalMap",
      label: "Use Terrain Normal Maps",
      defaultValue: true
    });

    SettingsManager.instance.addCheckboxToSection("Terrain Materials", {
      id: "useTerrainARMMap",
      label: "Use Terrain ARM Maps (AO/Rough/Metal)",
      defaultValue: true
    });

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
      defaultValue: 0.05,
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
      "useTerrainNormalMap",
      "useTerrainARMMap",
      "cascadeDebug"
    ]);

 
  }

  private createMaterialsTextureArray(): WebGLTexture{
      const materialsTexturesArray = this.gl.createTexture();
      const size = 2048;
      this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, materialsTexturesArray);
      this.gl.texStorage3D(
        this.gl.TEXTURE_2D_ARRAY,
        Math.floor(Math.log2(size)) + 1, // mip levels
        this.gl.RGBA8,           // internal format
        size,
        size,
        Object.keys(Terrains).length*3 // For each terrain type, there is color normal (AO Roughness Metallicity Displacement) 
      );
      this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
      this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);

      // Reduce shimmering on highly tiled materials (like grass) when moving
      const anisoExt =
        this.gl.getExtension("EXT_texture_filter_anisotropic") ||
        this.gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") ||
        this.gl.getExtension("MOZ_EXT_texture_filter_anisotropic");
      if (anisoExt) {
        const maxAniso = this.gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
        this.gl.texParameterf(
          this.gl.TEXTURE_2D_ARRAY,
          anisoExt.TEXTURE_MAX_ANISOTROPY_EXT,
          Math.min(8, maxAniso || 1)
        );
      }

      for (const materialID in Terrains) {
        const id = parseInt(materialID);
        const material = Terrains[id].material;
        const mapKeys = ["colorMap", "normalMap", "AOMap", "roughnessMap", "metallicityMap", "displacementMap"] as const;
        for (let textureIndex = 0; textureIndex < 3; textureIndex++) {
          const image = new Image();
          let fallbackPixel: Uint8Array;
          switch (textureIndex){
            case 0:
              fallbackPixel = this.createSolidColorData(
                size,
                size,
                Terrains[id].color.r,
                Terrains[id].color.g,
                Terrains[id].color.b,
                255
              );
              break;
            case 1:
              fallbackPixel = this.createSolidColorData(
                size,
                size,
                128,
                128,
                255,
                255
              );
              break;
            default:
              // ARM layer: shader samples R=AO, G=roughness, B=metallic (A=displacement unused in lighting)
              fallbackPixel = this.createSolidColorData(
                size,
                size,
                255,      // R = AO (1 = no darkening)
                0.8*255,  // G = roughness
                0,        // B = metallicity
                0         // A = displacement
              );
          }
          if (material == null){
            this.gl.texSubImage3D(
              this.gl.TEXTURE_2D_ARRAY,
              0,
              0, 0, id * 3 + textureIndex,
              size, size, 1,
              this.gl.RGBA,
              this.gl.UNSIGNED_BYTE,
              fallbackPixel
            );
            this.gl.generateMipmap(this.gl.TEXTURE_2D_ARRAY);
            continue;
          }
          const layerIndex = id * 3 + textureIndex;
          if (textureIndex < 2){
            image.crossOrigin = "anonymous";
            image.onload = () => {
              this.gl.activeTexture(this.gl.TEXTURE0);
              this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, materialsTexturesArray);
              this.gl.texSubImage3D(
              this.gl.TEXTURE_2D_ARRAY,
              0,
              0, 0, layerIndex,
              size, size, 1,
              this.gl.RGBA,
              this.gl.UNSIGNED_BYTE,
              image
                );
              this.gl.generateMipmap(this.gl.TEXTURE_2D_ARRAY);
              }
            image.onerror = () => {
              this.gl.activeTexture(this.gl.TEXTURE0);
              this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, materialsTexturesArray);
              this.gl.texSubImage3D(
                this.gl.TEXTURE_2D_ARRAY,
                0,
                0, 0, layerIndex,
                size, size, 1,
                this.gl.RGBA,
                this.gl.UNSIGNED_BYTE,
                fallbackPixel
              );
              this.gl.generateMipmap(this.gl.TEXTURE_2D_ARRAY);
            };
            image.src = material[mapKeys[textureIndex]]!;
          }
          else{
            this.packGrayscaleImagesToTextureData(0, 255, 0.8*255, 0, size, material[mapKeys[2]], material[mapKeys[3]], material[mapKeys[4]], material[mapKeys[5]])
              .then((packedData) => {
                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, materialsTexturesArray);
                this.gl.texSubImage3D(
                  this.gl.TEXTURE_2D_ARRAY,
                  0,
                  0, 0, layerIndex,
                  size, size, 1,
                  this.gl.RGBA,
                  this.gl.UNSIGNED_BYTE,
                  packedData
                );
                this.gl.generateMipmap(this.gl.TEXTURE_2D_ARRAY);
              })
              .catch(() => {
                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, materialsTexturesArray);
                this.gl.texSubImage3D(
                  this.gl.TEXTURE_2D_ARRAY,
                  0,
                  0, 0, layerIndex,
                  size, size, 1,
                  this.gl.RGBA,
                  this.gl.UNSIGNED_BYTE,
                  fallbackPixel
                );
                this.gl.generateMipmap(this.gl.TEXTURE_2D_ARRAY);
              });
          }
        }
      }
      return materialsTexturesArray;
  }
  private createSolidColorData(
    width: number,
    height: number,
    r: number,
    g: number,
    b: number,
    a: number
  ): Uint8Array {
    const data = new Uint8Array(width * height * 4);
  
    for (let i = 0; i < width * height; i++) {
      const o = i * 4;
      data[o + 0] = r;
      data[o + 1] = g; 
      data[o + 2] = b;
      data[o + 3] = a;
    }
  
    return data;
  }
  private packGrayscaleImagesToTextureData(
    fallbackR: number, 
    fallbackG: number, 
    fallbackB: number, 
    fallbackA: number,
    size: number,
    AO?: string, 
    roughness?: string, 
    metallicity?: string, 
    displacement?: string  
  ): Promise<Uint8Array> {
    const data = new Uint8Array(size * size * 4);
    return Promise.all([
      this.loadImage(AO),
      this.loadImage(roughness),
      this.loadImage(metallicity),
      this.loadImage(displacement)
    ]).then(([AOImage, roughnessImage, metallicityImage, displacementImage]) => {
      console.log("All images loaded");
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      let AOData, roughnessData, metallicityData, displacementData;
      if (AOImage == null){
        AOData = this.createSolidColorData(2*size, 2*size, fallbackR, fallbackR, fallbackR, 255);
      }
      else{
        ctx?.drawImage(AOImage, 0, 0, size, size);
        AOData = ctx?.getImageData(0, 0, size, size).data;
      }
      if (roughnessImage == null){
        roughnessData = this.createSolidColorData(2*size, 2*size, fallbackG, fallbackG, fallbackG, 255);
      }
      else{
        ctx?.drawImage(roughnessImage, 0, 0, size, size);
        roughnessData = ctx?.getImageData(0, 0, size, size).data;
      }
      if (metallicityImage == null){
        metallicityData = this.createSolidColorData(2*size, 2*size, fallbackB, fallbackB, fallbackB, 255);
      }
      else{
        ctx?.drawImage(metallicityImage, 0, 0, size, size);
        metallicityData = ctx?.getImageData(0, 0, size, size).data;
      }
      if (displacementImage == null){
        displacementData = this.createSolidColorData(2*size, 2*size, fallbackA, fallbackA, fallbackA, 255);
      }
      else{
        ctx?.drawImage(displacementImage, 0, 0, size, size);
        displacementData = ctx?.getImageData(0, 0, size, size).data;
      }

      for (let i = 0; i < size*size; i++){
        const o = 4*i;
        data[o+0] = AOData![o];
        data[o+1] = roughnessData![o];
        data[o+2] = metallicityData![o];
        data[o+3] = displacementData![o];
      }
      return data;
      
    }).catch(err => {
      console.error("Image failed to load", err);
      throw err;
    });
  }

  private loadImage(src: string | undefined) : Promise<HTMLImageElement | undefined> {
    return new Promise((resolve, reject) => {
      if (src == null){
        resolve(undefined);
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src!;
    }) 
  }

  private getDefaultTexScaleArray(): number[] {
    const scale: number[] = [];
    for (const materialID in Terrains) {
      const id = parseInt(materialID);
      const material = Terrains[id].material;
      scale[id] = material?.texScale ?? 1;
    }
    return scale;
  }

  private updateMaterialTextureScale(): number[] {
    return this.getDefaultTexScaleArray();
  }
}
