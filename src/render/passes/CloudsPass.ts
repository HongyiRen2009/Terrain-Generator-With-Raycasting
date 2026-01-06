import { SettingsManager } from "../../Settings";
import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { RenderUtils } from "../../utils/RenderUtils";
import {
  getUniformLocations,
  ResourceCache
} from "../renderSystem/managers/ResourceCache";
import cloudsVertexShaderSource from "../glsl/Clouds/Clouds.vert";
import cloudsFragmentShaderSource from "../glsl/Clouds/Clouds.frag";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { NoiseFunction3D, createNoise3D } from "simplex-noise";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { TextureUtils } from "../../utils/TextureUtils";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { vec3 } from "gl-matrix";
import { DirectionalLight } from "../../map/Light";
import coveragePNG from "../../../assets/coverage map.png";
export class CloudsPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
  public pathtracerRender: boolean = true;
  private noiseTexture: WebGLTexture | null = null;
  private weatherMapTexture: WebGLTexture | null = null;
  private noiseGenerator: NoiseGenerator;
  noiseDetailTexture: WebGLTexture;
  constructor(
    gl: WebGL2RenderingContext,
    resourceCache: ResourceCache,
    canvas: HTMLCanvasElement,
    renderGraph?: RenderGraph
  ) {
    super(gl, resourceCache, canvas, renderGraph);
    this.program = RenderUtils.CreateProgram(
      gl,
      cloudsVertexShaderSource,
      cloudsFragmentShaderSource
    );
    this.renderTarget = this.initRenderTarget();
    this.InitSettings();
    this.noiseGenerator = new NoiseGenerator(gl);
    this.noiseTexture = this.noiseGenerator.generateCloudNoiseTex(64);
    const weatherMapPromise = this.noiseGenerator.generateWeatherMap(128);
    weatherMapPromise.then((texture) => {
      this.weatherMapTexture = texture;
    });
    this.noiseDetailTexture =
      this.noiseGenerator.generateDetailedCloudNoiseTex(32);
    this.uniforms = getUniformLocations(gl, this.program!, [
      "viewInverse",
      "projInverse",
      "cameraPosition"
    ]);
  }
  protected initRenderTarget(): RenderTarget {
    const fbo = this.gl.createFramebuffer();
    // Use RGBA16F for HDR support (preserves emissive bloom values)
    const colorTexture = TextureUtils.createTexture2D(
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
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      colorTexture,
      0
    );
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    return {
      fbo: fbo,
      textures: {
        finalTexture: colorTexture!
      }
    };
  }
  public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;

    // Bind framebuffer or render to screen based on pathtracer state
    if (pathtracerOn) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    } else {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
    }

    // Configure blending based on pathtracer state
    if (pathtracerOn) {
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
    } else {
      this.gl.disable(this.gl.BLEND);
    }

    if (!pathtracerOn) {
      this.gl.clearColor(0, 0, 0, 1.0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
    this.gl.depthMask(false);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.useProgram(this.program);
    this.gl.bindVertexArray(vao.vao);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    const gBuffer = this.renderGraph!.getOutputs(this);
    const depthTexture = gBuffer["depth"];
    const litSceneTexture = gBuffer["litSceneTexture"];
    let cameraPosition = this.resourceCache.getData("cameraPosition");
    if (!cameraPosition) {
      cameraPosition = vec3.fromValues(0, 0, 0);
    }
    const boxWidth = SettingsManager.instance.getSetting("CLOUDS_boxWidth")
      ?.value as number;
    const boxHeight = SettingsManager.instance.getSetting("CLOUDS_boxHeight")
      ?.value as number;
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.program!, "cubeMin"),
      vec3.fromValues(-boxWidth / 2, 100, -boxWidth / 2)
    );
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.program!, "cubeMax"),
      vec3.fromValues(boxWidth / 2, 100 + boxHeight, boxWidth / 2)
    );
    // Bind noise texture
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      this.noiseTexture!,
      "noiseTexture",
      0,
      this.gl.TEXTURE_3D
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      this.noiseDetailTexture!,
      "detailNoiseTexture",
      1,
      this.gl.TEXTURE_3D
    );
    // Bind weather map texture
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      this.weatherMapTexture!,
      "weatherMap",
      2
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      depthTexture,
      "depthTexture",
      3
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      litSceneTexture,
      "litSceneTexture",
      4
    );
    const sunLight = this.resourceCache.getData(
      "sunLight"
    ) as DirectionalLight | null;

    // Use sunLight for sun position
    let sunPos: vec3;
    let sunColor: vec3;

    if (
      sunLight instanceof DirectionalLight &&
      !this.resourceCache.getData("disableSun")
    ) {
      // For directional light, use direction to determine sun position in sky
      // Scale the direction to represent sun position far away
      sunPos = vec3.create();
      vec3.scale(sunPos, sunLight.direction, -1000.0); // Negative because light direction points toward light
      sunColor = sunLight.color.createVec3();
    } else {
      // Fallback - default sun position
      sunPos = vec3.fromValues(0, 1000, 0);
      sunColor = vec3.fromValues(1, 1, 1);
    }

    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.program!, "sunPos"),
      sunPos
    );
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.program!, "sunColor"),
      sunColor
    );
    const cameraInfo = this.resourceCache.getData("CameraInfo");
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
      this.resourceCache.getData("cameraPosition")
    );
    this.gl.uniform3fv(this.uniforms["cameraPosition"], cameraPosition);
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.program!, "time"),
      performance.now() * 0.001 // Convert to seconds
    );

    // Pass pathtracer state to shader
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.program!, "pathtracerOn"),
      pathtracerOn ? 1 : 0
    );

    SettingsManager.instance.updateProgramUniforms(this.gl, this.program!);
    if (!pathtracerOn || this.pathtracerRender) {
      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }
    this.gl.bindVertexArray(null);
    this.gl.useProgram(null);

    this.gl.disable(this.gl.BLEND);
    this.gl.depthMask(true);
    this.gl.enable(this.gl.DEPTH_TEST);
  }

  private InitSettings() {
    SettingsManager.instance.createSection(
      document.getElementById("settings-section")!,
      "Clouds Settings"
    );

    SettingsManager.instance.addCheckboxToSection("Clouds Settings", {
      id: "CLOUDS_enableClouds",
      label: "Enable Clouds",
      defaultValue: true
    });

    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_MAX_STEPS",
      label: "Cloud Ray Marching Max Steps",
      min: 8,
      max: 128,
      step: 1,
      defaultValue: 32,
      numType: "int"
    });

    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_MAX_STEPS_LIGHT",
      label: "Cloud Light Ray Marching Max Steps",
      min: 4,
      max: 64,
      step: 1,
      defaultValue: 32,
      numType: "int"
    });

    SettingsManager.instance.addColorPickerToSection("Clouds Settings", {
      id: "CLOUDS_baseCloudColor",
      label: "Base Cloud Color",
      defaultValue: "#FFFFFF"
    });

    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_skyContribution",
      label: "Sky Color Contribution",
      min: 0.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.1,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_absorption",
      label: "Cloud Absorption",
      min: 0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_globalCoverage",
      label: "Cloud Coverage",
      min: 0.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.6,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_globalDensity",
      label: "Cloud Density",
      min: 0.0,
      max: 1.0,
      step: 0.001,
      defaultValue: 0.2,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_baseNoiseFrequency",
      label: "Cloud Base Noise Frequency",
      min: 0.01,
      max: 5.0,
      step: 0.01,
      defaultValue: 2.28,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_detailNoiseFrequency",
      label: "Cloud Detail Noise Frequency",
      min: 0.01,
      max: 5.0,
      step: 0.01,
      defaultValue: 0.01,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_lightAbsorption",
      label: "Cloud Light Absorption",
      min: 0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_lightIntensity",
      label: "Cloud Light Intensity",
      min: 0,
      max: 5.0,
      step: 0.01,
      defaultValue: 3,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_ambientIntensity",
      label: "Cloud Ambient Intensity",
      min: 0,
      max: 2.0,
      step: 0.01,
      defaultValue: 0.5,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_darknessThreshold",
      label: "Cloud Darkness Threshold",
      min: 0.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.2,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_lightDarkSharpness",
      label: "Cloud Light/Dark Sharpness",
      min: 0.1,
      max: 5.0,
      step: 0.01,
      defaultValue: 1.0,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_phaseG",
      label: "Cloud Phase Function g",
      min: -1.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.5,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_phaseMultiplier",
      label: "Cloud Phase Function Multiplier",
      min: 0.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.5,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_blueNoiseAmplitude",
      label: "Cloud Blue Noise Amplitude",
      min: 0.0,
      max: 5.0,
      step: 0.01,
      defaultValue: 4,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_boxWidth",
      label: "Cloud Box Width",
      min: 100,
      max: 8000,
      step: 10,
      defaultValue: 1000
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_boxHeight",
      label: "Cloud Box Height",
      min: 100,
      max: 2000,
      step: 10,
      defaultValue: 500
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_weatherMapOffsetX",
      label: "Cloud Weather Map Offset X",
      min: 0.0,
      max: 100.0,
      step: 0.01,
      defaultValue: 0.0,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_weatherMapOffsetY",
      label: "Cloud Weather Map Offset Y",
      min: 0.0,
      max: 100.0,
      step: 0.01,
      defaultValue: 0.0,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_weatherMapFrequency",
      label: "Cloud Weather Map Frequency",
      min: 0.01,
      max: 5.0,
      step: 0.01,
      defaultValue: 0.08,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_windSpeed",
      label: "Cloud Wind Speed",
      min: 0.0,
      max: 10.0,
      step: 0.01,
      defaultValue: 3.0,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_windDirectionX",
      label: "Cloud Wind Direction X",
      min: -1.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 1.0,
      numType: "float"
    });

    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_windDirectionZ",
      label: "Cloud Wind Direction Z",
      min: -1.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 1.0,
      numType: "float"
    });

    // Attach program uniforms for all settings
    SettingsManager.instance.attatchProgram(this.program!, [
      "CLOUDS_enableClouds",
      "CLOUDS_MAX_STEPS",
      "CLOUDS_MAX_STEPS_LIGHT",
      "CLOUDS_baseCloudColor",
      "CLOUDS_skyContribution",
      "CLOUDS_absorption",
      "CLOUDS_baseNoiseFrequency",
      "CLOUDS_detailNoiseFrequency",
      "CLOUDS_globalCoverage",
      "CLOUDS_globalDensity",
      "CLOUDS_lightAbsorption",
      "CLOUDS_lightIntensity",
      "CLOUDS_ambientIntensity",
      "CLOUDS_darknessThreshold",
      "CLOUDS_lightDarkSharpness",
      "CLOUDS_phaseG",
      "CLOUDS_phaseMultiplier",
      "CLOUDS_weatherMapOffsetX",
      "CLOUDS_weatherMapOffsetY",
      "CLOUDS_weatherMapFrequency",
      "CLOUDS_windSpeed",
      "CLOUDS_windDirectionX",
      "CLOUDS_windDirectionZ",
      "CLOUDS_blueNoiseAmplitude"
    ]);
  }
  public resize(): void {
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
}
export class NoiseGenerator {
  gl: WebGL2RenderingContext;
  simplex: NoiseFunction3D = createNoise3D();
  dataR: Uint8Array = new Uint8Array();
  dataG: Uint8Array = new Uint8Array();
  dataB: Uint8Array = new Uint8Array();
  dataA: Uint8Array = new Uint8Array();
  detailR: Uint8Array = new Uint8Array();
  detailG: Uint8Array = new Uint8Array();
  detailB: Uint8Array = new Uint8Array();
  coverageData: Uint8Array = new Uint8Array();
  heightData: Uint8Array = new Uint8Array();
  densityData: Uint8Array = new Uint8Array();
  highCoverageData: any;
  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }
  worleyNoise3D(
    width: number,
    height: number,
    depth: number,
    gridSize: number,
    pointsPerCell: number = 1
  ): Uint8Array {
    const gridCols = Math.ceil(width / gridSize);
    const gridRows = Math.ceil(height / gridSize);
    const gridDepts = Math.ceil(depth / gridSize);

    // Store feature points by grid cell for fast lookup
    const grid: Array<
      Array<Array<Array<{ x: number; y: number; z: number }>>>
    > = Array.from({ length: gridCols }, () =>
      Array.from({ length: gridRows }, () =>
        Array.from({ length: gridDepts }, () => [])
      )
    );

    // Generate random feature points for each grid cell
    for (let gx = 0; gx < gridCols; gx++) {
      for (let gy = 0; gy < gridRows; gy++) {
        for (let gz = 0; gz < gridDepts; gz++) {
          for (let i = 0; i < pointsPerCell; i++) {
            grid[gx][gy][gz].push({
              x: gx * gridSize + Math.random() * gridSize,
              y: gy * gridSize + Math.random() * gridSize,
              z: gz * gridSize + Math.random() * gridSize
            });
          }
        }
      }
    }

    // Flattened Uint8Array for output
    const data = new Uint8Array(width * height * depth);
    let maxDist = 0;
    const distArr = new Float32Array(width * height * depth);

    // For each voxel, only consider feature points from neighboring cells
    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let minDist = Infinity;
          const gx = Math.floor(x / gridSize);
          const gy = Math.floor(y / gridSize);
          const gz = Math.floor(z / gridSize);

          // Check current cell and 26 neighbors (3x3x3 cube, with wrapping)
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dz = -1; dz <= 1; dz++) {
                const ngx = (gx + dx + gridCols) % gridCols;
                const ngy = (gy + dy + gridRows) % gridRows;
                const ngz = (gz + dz + gridDepts) % gridDepts;
                for (const p of grid[ngx][ngy][ngz]) {
                  let dxp = Math.abs(p.x - x);
                  dxp = Math.min(dxp, width - dxp);
                  let dyp = Math.abs(p.y - y);
                  dyp = Math.min(dyp, height - dyp);
                  let dzp = Math.abs(p.z - z);
                  dzp = Math.min(dzp, depth - dzp);
                  const dist = dxp * dxp + dyp * dyp + dzp * dzp;
                  if (dist < minDist) minDist = dist;
                }
              }
            }
          }
          const idx = x + y * width + z * width * height;
          distArr[idx] = minDist;
          if (minDist > maxDist) maxDist = minDist;
        }
      }
    }

    // Normalize distances and convert to Uint8
    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = x + y * width + z * width * height;
          const norm = (Math.sqrt(distArr[idx]) / Math.sqrt(maxDist)) * 255;
          data[idx] = Math.floor(norm);
        }
      }
    }
    return data;
  }
  simplexWorelyNoise2D(
    width: number,
    height: number,
    frequency: number,
    gridSize: number,
    pointsPerCell: number = 1
  ): Uint8Array {
    const simplexData = this.fbmSimplexNoise2D(width, height, frequency);
    const worleyData = this.fbmWorleyNoise2D(
      width,
      height,
      gridSize,
      pointsPerCell
    );

    const data = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      // Normalize to 0-1 range
      const simplex = simplexData[i] / 255.0;
      const worley = worleyData[i] / 255.0;
      // Invert Worley (cloud interiors)
      let value = simplex * (1.0 - worley);
      // Smoothstep remap
      value = this.smoothstep(0.2, 0.8, value);
      // Optional contrast boost
      value = Math.pow(value, 1.2);
      // Back to 0-255 range
      data[i] = Math.max(0, Math.min(255, Math.floor(value * 255)));
    }
    return data;
  }
  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }
  // Tileable FBM Simplex Noise 2D
  fbmSimplexNoise2D(
    width: number,
    height: number,
    frequency: number,
    octaves: number = 4,
    lacunarity: number = 2,
    gain: number = 0.5
  ): Uint8Array {
    const data = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let amp = 1.0;
        let freq = frequency;
        let sum = 0.0;
        let norm = 0.0;
        for (let o = 0; o < octaves; o++) {
          // Tileable coordinates
          const u = (x / width) * Math.PI * 2;
          const v = (y / height) * Math.PI * 2;
          const nx = Math.cos(u) * freq;
          const ny = Math.sin(u) * freq;
          const nz = Math.cos(v) * freq;
          const nw = Math.sin(v) * freq;
          const value1 = this.simplex(nx, ny, 0);
          const value2 = this.simplex(nz, nw, 0);
          const value = (value1 + value2) / 2;
          sum += value * amp;
          norm += amp;
          amp *= gain;
          freq *= lacunarity;
        }
        const normalized = Math.floor(((sum / norm + 1) / 2) * 255);
        data[x + y * width] = normalized;
      }
    }
    return data;
  }

  // Tileable FBM Simplex Noise 3D
  fbmSimplexNoise3D(
    width: number,
    height: number,
    depth: number,
    frequency: number,
    octaves: number = 4,
    lacunarity: number = 2,
    gain: number = 0.5
  ): Uint8Array {
    const data = new Uint8Array(width * height * depth);
    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let amp = 1.0;
          let freq = frequency;
          let sum = 0.0;
          let norm = 0.0;
          for (let o = 0; o < octaves; o++) {
            const u = (x / width) * Math.PI * 2;
            const v = (y / height) * Math.PI * 2;
            const w = (z / depth) * Math.PI * 2;
            const nx = Math.cos(u) * freq;
            const ny = Math.sin(u) * freq;
            const nz = Math.cos(v) * freq;
            const nw = Math.sin(v) * freq;
            const value1 = this.simplex(nx, nz, Math.cos(w) * freq);
            const value2 = this.simplex(ny, nw, Math.sin(w) * freq);
            const value = (value1 + value2) / 2;
            sum += value * amp;
            norm += amp;
            amp *= gain;
            freq *= lacunarity;
          }
          const normalized = Math.floor(((sum / norm + 1) / 2) * 255);
          data[x + y * width + z * width * height] = normalized;
        }
      }
    }
    return data;
  }

  // Tileable FBM Worley Noise 2D
  fbmWorleyNoise2D(
    width: number,
    height: number,
    gridSize: number,
    octaves: number = 4,
    pointsPerCell: number = 1,
    lacunarity: number = 2,
    gain: number = 0.5
  ): Uint8Array {
    const data = new Float32Array(width * height);
    let amp = 1.0;
    let norm = 0.0;
    for (let o = 0; o < octaves; o++) {
      const octaveData = this.worleyNoise2D(
        width,
        height,
        gridSize,
        pointsPerCell
      );
      for (let i = 0; i < width * height; i++) {
        data[i] += (octaveData[i] / 255.0) * amp;
      }
      norm += amp;
      amp *= gain;
      gridSize = Math.max(1, Math.floor(gridSize / lacunarity));
    }
    // Normalize and convert to Uint8
    const out = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      out[i] = Math.floor(Math.max(0, Math.min(1, data[i] / norm)) * 255);
    }
    return out;
  }

  // Tileable FBM Worley Noise 3D
  fbmWorleyNoise3D(
    width: number,
    height: number,
    depth: number,
    gridSize: number,
    pointsPerCell: number = 1,
    octaves: number = 4,
    lacunarity: number = 2,
    gain: number = 0.5
  ): Uint8Array {
    const data = new Float32Array(width * height * depth);
    let amp = 1.0;
    let norm = 0.0;
    for (let o = 0; o < octaves; o++) {
      const octaveData = this.worleyNoise3D(
        width,
        height,
        depth,
        gridSize,
        pointsPerCell
      );
      for (let i = 0; i < width * height * depth; i++) {
        data[i] += (octaveData[i] / 255.0) * amp;
      }
      norm += amp;
      amp *= gain;
      gridSize = Math.max(1, Math.floor(gridSize / lacunarity));
    }
    // Normalize and convert to Uint8
    const out = new Uint8Array(width * height * depth);
    for (let i = 0; i < width * height * depth; i++) {
      out[i] = Math.floor(Math.max(0, Math.min(1, data[i] / norm)) * 255);
    }
    return out;
  }
  simplexWorleyNoise3D(
    width: number,
    height: number,
    depth: number,
    frequency: number,
    gridSize: number,
    pointsPerCell: number = 1
  ): Uint8Array {
    const simplexData = this.fbmSimplexNoise3D(width, height, depth, frequency);
    const worleyData = this.fbmWorleyNoise3D(
      width,
      height,
      depth,
      gridSize,
      pointsPerCell
    );

    const data = new Uint8Array(width * height * depth);
    for (let i = 0; i < width * height * depth; i++) {
      // Normalize to 0-1 range
      const simplex = simplexData[i] / 255.0;
      const worley = worleyData[i] / 255.0;

      // Remap simplex using worley for cloud-like appearance
      let remapped = this.remap(simplex, worley - 1.0, 1.0, 0.0, 1.0);
      data[i] = Math.floor(Math.max(0, Math.min(1, remapped)) * 255);
    }
    return data;
  }

  // Helper remap function
  private remap(
    value: number,
    low1: number,
    high1: number,
    low2: number,
    high2: number
  ): number {
    return low2 + ((value - low1) * (high2 - low2)) / (high1 - low1);
  }
  generateCloudNoiseTex(size: number): WebGLTexture {
    this.dataR = this.simplexWorleyNoise3D(size, size, size, 1, 8, 2);
    this.dataG = this.worleyNoise3D(size, size, size, 16, 2);
    this.dataB = this.worleyNoise3D(size, size, size, 32, 3);
    this.dataA = this.worleyNoise3D(size, size, size, 64, 4);

    const data = new Uint8Array(size * size * size * 4);
    for (let i = 0; i < size * size * size; i++) {
      data[i * 4 + 0] = this.dataR[i];
      data[i * 4 + 1] = 255 - this.dataG[i];
      data[i * 4 + 2] = 255 - this.dataB[i];
      data[i * 4 + 3] = 255 - this.dataA[i];
    }
    const texture = TextureUtils.createTexture3D(
      this.gl,
      size,
      size,
      size,
      this.gl.RGBA8,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      data,
      this.gl.LINEAR,
      this.gl.LINEAR,
      this.gl.REPEAT,
      this.gl.REPEAT,
      this.gl.REPEAT
    );
    return texture!;
  }
  generateDetailedCloudNoiseTex(size: number): WebGLTexture {
    this.detailR = this.worleyNoise3D(size, size, size, 32, 2);
    this.detailG = this.worleyNoise3D(size, size, size, 16, 2);
    this.detailB = this.worleyNoise3D(size, size, size, 8, 2);
    const data = new Uint8Array(size * size * size * 4);
    for (let i = 0; i < size * size * size; i++) {
      data[i * 4 + 0] = 255 - this.detailR[i];
      data[i * 4 + 1] = 255 - this.detailG[i];
      data[i * 4 + 2] = 255 - this.detailB[i];
    }
    const texture = TextureUtils.createTexture3D(
      this.gl,
      size,
      size,
      size,
      this.gl.RGB8,
      this.gl.RGB,
      this.gl.UNSIGNED_BYTE,
      data,
      this.gl.LINEAR,
      this.gl.LINEAR,
      this.gl.REPEAT,
      this.gl.REPEAT,
      this.gl.REPEAT
    );
    return texture!;
  }
  worleyNoise2D(
    width: number,
    height: number,
    gridSize: number,
    pointsPerCell: number = 1
  ): Uint8Array {
    const gridCols = Math.ceil(width / gridSize);
    const gridRows = Math.ceil(height / gridSize);

    // Store feature points by grid cell for fast lookup
    const grid: Array<Array<Array<{ x: number; y: number }>>> = Array.from(
      { length: gridCols },
      () => Array.from({ length: gridRows }, () => [])
    );

    // Generate random feature points for each grid cell
    for (let gx = 0; gx < gridCols; gx++) {
      for (let gy = 0; gy < gridRows; gy++) {
        for (let i = 0; i < pointsPerCell; i++) {
          grid[gx][gy].push({
            x: gx * gridSize + Math.random() * gridSize,
            y: gy * gridSize + Math.random() * gridSize
          });
        }
      }
    }

    // Flattened Uint8Array for output
    const data = new Uint8Array(width * height);
    let maxDist = 0;
    const distArr = new Float32Array(width * height);

    // For each pixel, only consider feature points from neighboring cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let minDist = Infinity;
        const gx = Math.floor(x / gridSize);
        const gy = Math.floor(y / gridSize);

        // Check current cell and 8 neighbors (3x3 grid, with wrapping)
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const ngx = (gx + dx + gridCols) % gridCols;
            const ngy = (gy + dy + gridRows) % gridRows;
            for (const p of grid[ngx][ngy]) {
              let dxp = Math.abs(p.x - x);
              dxp = Math.min(dxp, width - dxp);
              let dyp = Math.abs(p.y - y);
              dyp = Math.min(dyp, height - dyp);
              const dist = dxp * dxp + dyp * dyp;
              if (dist < minDist) minDist = dist;
            }
          }
        }
        const idx = x + y * width;
        distArr[idx] = minDist;
        if (minDist > maxDist) maxDist = minDist;
      }
    }

    // Normalize distances and convert to Uint8
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = x + y * width;
        const norm = (Math.sqrt(distArr[idx]) / Math.sqrt(maxDist)) * 255;
        data[idx] = Math.floor(norm);
      }
    }
    return data;
  }

  simplexNoise2D(width: number, height: number, frequency: number): Uint8Array {
    const data = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Create tileable coordinates using sine/cosine remapping
        const u = (x / width) * Math.PI * 2;
        const v = (y / height) * Math.PI * 2;

        const nx = Math.cos(u) * frequency;
        const ny = Math.sin(u) * frequency;
        const nz = Math.cos(v) * frequency;
        const nw = Math.sin(v) * frequency;

        // Sample 4D noise at these coordinates
        const value1 = this.simplex(nx, ny, 0);
        const value2 = this.simplex(nz, nw, 0);
        const value = (value1 + value2) / 2;

        const normalized = Math.floor(((value + 1) / 2) * 255);
        data[x + y * width] = normalized;
      }
    }
    return data;
  }

  simplexNoise3D(
    width: number,
    height: number,
    depth: number,
    frequency: number
  ): Uint8Array {
    const data = new Uint8Array(width * height * depth);
    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Create tileable coordinates using sine/cosine remapping
          const u = (x / width) * Math.PI * 2;
          const v = (y / height) * Math.PI * 2;
          const w = (z / depth) * Math.PI * 2;

          const nx = Math.cos(u) * frequency;
          const ny = Math.sin(u) * frequency;
          const nz = Math.cos(v) * frequency;
          const nw = Math.sin(v) * frequency;

          // Sample noise - blend two 3D samples for better tiling
          const value1 = this.simplex(nx, nz, Math.cos(w) * frequency);
          const value2 = this.simplex(ny, nw, Math.sin(w) * frequency);
          const value = (value1 + value2) / 2;

          const normalized = Math.floor(((value + 1) / 2) * 255);
          data[x + y * width + z * width * height] = normalized;
        }
      }
    }
    return data;
  }
  private parseCoverageMap(str: string, size: number): Uint8Array {
    // Remove whitespace and split by comma, space, or newline
    const numbers = str
      .replace(/[\r\n]+/g, " ") // replace newlines with spaces
      .split(/[\s,]+/) // split by spaces or commas
      .filter(Boolean) // remove empty strings
      .map(Number) // convert to numbers
      .map((n) => Math.max(0, Math.min(255, n))); // clamp to 0-255

    // Ensure the array is exactly size*size
    const arr = new Uint8Array(size * size);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = numbers[i] ?? 0; // fill with 0 if not enough numbers
    }
    return arr;
  }
  async loadCoverageFromPNG(path: string, size: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Draw image to canvas
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No 2D context");
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size).data;
        // Convert to grayscale Uint8Array (use red channel or average)
        const arr = new Uint8Array(size * size);
        for (let i = 0; i < size * size; i++) {
          // Use red channel for coverage, or average RGB for more general grayscale
          arr[i] = imageData[i * 4]; // Red channel
          // arr[i] = (imageData[i*4] + imageData[i*4+1] + imageData[i*4+2]) / 3;
        }
        resolve(arr);
      };
      img.onerror = reject;
      img.src = path;
    });
  }
  async generateWeatherMap(size: number): Promise<WebGLTexture> {
    // Load PNG coverage data
    this.coverageData = await this.loadCoverageFromPNG(coveragePNG, size);

    // ...rest of your code unchanged...
    this.highCoverageData = this.simplexWorelyNoise2D(size, size, 0.2, 32, 4);
    this.heightData = new Uint8Array(size * size);
    this.densityData = new Uint8Array(size * size);
    for (let i = 0; i < size * size; i++) {
      this.heightData[i] = 255;
      this.densityData[i] = 255;
    }
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      data[i * 4 + 0] = this.coverageData[i];
      data[i * 4 + 1] = this.highCoverageData[i];
      data[i * 4 + 2] = this.heightData[i];
      data[i * 4 + 3] = this.densityData[i];
    }
    const texture = TextureUtils.createTexture2D(
      this.gl,
      size,
      size,
      this.gl.RGBA8,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      data,
      this.gl.LINEAR,
      this.gl.LINEAR,
      this.gl.REPEAT,
      this.gl.REPEAT
    );
    return texture;
  }
  visualizeWeatherMap(
    canvas: HTMLCanvasElement,
    channel: "RGB" | "R" | "G" | "B" = "RGB"
  ) {
    const size = Math.sqrt(this.coverageData.length);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = canvas.width / size;
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const scaledX = ((Math.floor(x / scale) % size) + size) % size;
        const scaledY = ((Math.floor(y / scale) % size) + size) % size;
        const idx = scaledX + scaledY * size;
        const idx2D = (x + y * canvas.width) * 4;
        let r = this.coverageData[idx];
        let g = this.densityData[idx];
        let b = this.heightData[idx];
        if (channel === "R") {
          g = b = r;
        } else if (channel === "G") {
          r = b = g;
        } else if (channel === "B") {
          r = g = b;
        }
        imageData.data[idx2D + 0] = r;
        imageData.data[idx2D + 1] = g;
        imageData.data[idx2D + 2] = b;
        imageData.data[idx2D + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
  visualizeSliceUnscaled(
    sliceZ: number,
    canvas: HTMLCanvasElement,
    channel: "R" | "G" | "B" | "A",
    detail = false
  ) {
    const size = Math.cbrt(this.dataR.length);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const wrappedZ = ((sliceZ % size) + size) % size;
        const idx3D = x + y * size + wrappedZ * size * size;
        const idx2D = (x + y * size) * 4;
        let value = 0;
        if (detail) {
          switch (channel) {
            case "R":
              value = this.detailR[idx3D];
              break;
            case "G":
              value = this.detailG[idx3D];
              break;
            case "B":
              value = this.detailB[idx3D];
              break;
            case "A":
              value = 255;
              break;
          }
        } else {
          switch (channel) {
            case "R":
              value = this.dataR[idx3D];
              break;
            case "G":
              value = this.dataG[idx3D];
              break;
            case "B":
              value = this.dataB[idx3D];
              break;
            case "A":
              value = this.dataA[idx3D];
              break;
          }
        }
        imageData.data[idx2D + 0] = value;
        imageData.data[idx2D + 1] = value;
        imageData.data[idx2D + 2] = value;
        imageData.data[idx2D + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
  visualizeSlice(
    sliceZ: number,
    canvas: HTMLCanvasElement,
    channel: "R" | "G" | "B" | "A",
    detail = false
  ) {
    const size = Math.cbrt(this.dataR.length);
    const ctx = canvas.getContext("2d");
    const scale = canvas.width / size;
    if (!ctx) return;
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        // Wrap and tile based on scale
        const scaledX = ((Math.floor(x / scale) % size) + size) % size;
        const scaledY = ((Math.floor(y / scale) % size) + size) % size;
        const wrappedZ = ((sliceZ % size) + size) % size;

        const idx3D = scaledX + scaledY * size + wrappedZ * size * size;
        const idx2D = (x + y * canvas.width) * 4;
        let value = 0;
        if (detail) {
          switch (channel) {
            case "R":
              value = this.detailR[idx3D];
              break;
            case "G":
              value = this.detailG[idx3D];
              break;
            case "B":
              value = this.detailB[idx3D];
              break;
            case "A":
              value = 255;
              break;
          }
        } else {
          switch (channel) {
            case "R":
              value = this.dataR[idx3D];
              break;
            case "G":
              value = this.dataG[idx3D];
              break;
            case "B":
              value = this.dataB[idx3D];
              break;
            case "A":
              value = this.dataA[idx3D];
              break;
          }
        }
        imageData.data[idx2D + 0] = value;
        imageData.data[idx2D + 1] = value;
        imageData.data[idx2D + 2] = value;
        imageData.data[idx2D + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    debugger;
  }
}
