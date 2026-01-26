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
import { mat4, vec2, vec3 } from "gl-matrix";
import { DirectionalLight } from "../../map/Light";
import coveragePNG from "../../../assets/coverage map.png";
export class CloudsPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
  public pathtracerRender: boolean = true;
  private noiseTexture: WebGLTexture | null = null;
  private weatherMapTexture: WebGLTexture | null = null;
  private noiseGenerator: NoiseGenerator;
  private noiseDetailTexture: WebGLTexture;
  
  private previousView: mat4 = mat4.create();
  private previousCloudTexture: WebGLTexture | null = null;
  private cloudTextures: WebGLTexture[] = [];
  private pingPongIndex: number = 0;
  private frameCounter: number = 0;
  private previousCameraPosition: vec3 = vec3.create();
private lastQuery: WebGLQuery | null = null;
private lastExt: any = null;
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
  "matViewProj",
  "cameraPosition",
  "cubeMin",
  "cubeMax",
  "sunPos",
  "sunColor",
  "time",
  "previousView",
  "tanFovBy2",
  "previousCloudTexture"
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
    const colorTexture1 = TextureUtils.createTexture2D(
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

    this.cloudTextures=[colorTexture, colorTexture1];
    this.previousCloudTexture=colorTexture1;
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
        cloudsTexture: colorTexture!,
      }
    };
  }
public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
  const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;

  // --- Ping-pong logic ---
  const writeIndex = this.pingPongIndex;
  const readIndex = 1 - this.pingPongIndex;
  const currentTexture = this.cloudTextures[writeIndex];
  const previousTexture = this.cloudTextures[readIndex];

  // Update render target textures
  if (this.renderTarget) {
    this.renderTarget.textures = {
      cloudsTexture: currentTexture,
    };
  }

  // --- Attach the correct texture to the framebuffer for writing ---
  this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
  this.gl.framebufferTexture2D(
    this.gl.FRAMEBUFFER,
    this.gl.COLOR_ATTACHMENT0,
    this.gl.TEXTURE_2D,
    currentTexture,
    0
  );
  // --- State setup ---
  this.gl.disable(this.gl.BLEND);
  this.gl.clearColor(0, 0, 0, 0.0);
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  this.gl.depthMask(false);
  this.gl.disable(this.gl.DEPTH_TEST);

  // --- Shader & VAO ---
  this.gl.useProgram(this.program);
  this.gl.bindVertexArray(vao.vao);
  this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

// --- Uniforms & Textures ---
const gBuffer = this.renderGraph!.getOutputs(this);
const depthTexture = gBuffer["depth"];
const cameraPosition = this.resourceCache.getData("cameraPosition") ?? vec3.fromValues(0, 0, 0);

const boxWidth = SettingsManager.instance.getSetting("CLOUDS_boxWidth")?.value as number;
const boxHeight = SettingsManager.instance.getSetting("CLOUDS_boxHeight")?.value as number;
const cloudBaseHeight = SettingsManager.instance.getSetting("CLOUDS_height")?.value as number;

this.gl.uniform3fv(this.uniforms["cubeMin"], vec3.fromValues(-boxWidth / 2 + cameraPosition[0], cloudBaseHeight, -boxWidth / 2 + cameraPosition[2]));
this.gl.uniform3fv(this.uniforms["cubeMax"], vec3.fromValues(boxWidth / 2 + cameraPosition[0], cloudBaseHeight + boxHeight, boxWidth / 2 + cameraPosition[2]));

TextureUtils.bindTex(this.gl, this.program!, this.noiseTexture!, "noiseTexture", 0, this.gl.TEXTURE_3D);
TextureUtils.bindTex(this.gl, this.program!, this.noiseDetailTexture!, "detailNoiseTexture", 1, this.gl.TEXTURE_3D);
TextureUtils.bindTex(this.gl, this.program!, this.weatherMapTexture!, "weatherMap", 2);
TextureUtils.bindTex(this.gl, this.program!, depthTexture, "depthTexture", 3);
TextureUtils.bindTex(this.gl, this.program!, previousTexture, "previousCloudTexture", 4);

this.gl.uniform3fv(this.uniforms["cameraPosition"], cameraPosition);

const sunLight = this.resourceCache.getData("sunLight") as DirectionalLight | null;
let sunPos: vec3, sunColor: vec3;
if (sunLight instanceof DirectionalLight && !this.resourceCache.getData("disableSun")) {
  sunPos = vec3.create();
  vec3.scale(sunPos, sunLight.direction, -1000.0);
  sunColor = sunLight.color.createVec3();
} else {
  sunPos = vec3.fromValues(0, 1000, 0);
  sunColor = vec3.fromValues(1, 1, 1);
}
this.gl.uniform3fv(this.uniforms["sunPos"], sunPos);
this.gl.uniform3fv(this.uniforms["sunColor"], sunColor);

const cameraInfo = this.resourceCache.getData("CameraInfo");
this.gl.uniformMatrix4fv(this.uniforms["viewInverse"], false, cameraInfo.matViewInverse);
this.gl.uniformMatrix4fv(this.uniforms["projInverse"], false, cameraInfo.matProjInverse);
this.gl.uniformMatrix4fv(this.uniforms["matViewProj"], false, cameraInfo.matViewProj);
this.gl.uniformMatrix4fv(this.uniforms["previousView"], false, this.previousView);

this.gl.uniform2fv(this.uniforms["tanFovBy2"], vec2.fromValues(
  Math.tan(this.resourceCache.getData("fovY") * 0.5) * this.resourceCache.getData("aspectRatio"),
  Math.tan(this.resourceCache.getData("fovY") * 0.5)
));

this.gl.uniform1f(this.uniforms["time"], performance.now() * 0.001);

// Update all settings uniforms
SettingsManager.instance.updateProgramUniforms(this.gl, this.program!);

// Update previous camera position and previousViewProj for reprojection
vec3.copy(this.previousCameraPosition, cameraPosition);
this.previousView = mat4.clone(cameraInfo.matView);

  // Update all settings uniforms
  SettingsManager.instance.updateProgramUniforms(this.gl, this.program!);

  // --- GPU Timer Query ---
  const ext = this.gl.getExtension("EXT_disjoint_timer_query_webgl2");
  if (ext) {
    const query = this.gl.createQuery();
    this.gl.beginQuery(ext.TIME_ELAPSED_EXT, query);

    if (!pathtracerOn || this.pathtracerRender) {
      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }

    this.gl.endQuery(ext.TIME_ELAPSED_EXT);

    // Check previous query result (from last frame)
    if (this.lastQuery && this.lastExt) {
      const available = this.gl.getQueryParameter(this.lastQuery, this.gl.QUERY_RESULT_AVAILABLE);
      const disjoint = this.gl.getParameter(this.lastExt.GPU_DISJOINT_EXT);
      if (available && !disjoint) {
        const timeElapsed = this.gl.getQueryParameter(this.lastQuery, this.gl.QUERY_RESULT);
        //console.log("Clouds Pass GPU Time: " + (timeElapsed / 1e6) + " ms");
        this.gl.deleteQuery(this.lastQuery);
        this.lastQuery = null;
      }
    }
    // Save current query for next frame
    this.lastQuery = query;
    this.lastExt = ext;
  } else {
    // Fallback: just draw if extension not available
    if (!pathtracerOn || this.pathtracerRender) {
      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }
  }

  // Unbind
  this.gl.bindVertexArray(null);
  this.gl.useProgram(null);

  this.gl.disable(this.gl.BLEND);
  this.gl.depthMask(true);
  this.gl.enable(this.gl.DEPTH_TEST);

  // Advance ping-pong index for next frame
  this.pingPongIndex = readIndex;
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
      defaultValue: 1,
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
      defaultValue: 5,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_noiseWeights",
      label: "Cloud Base Noise Weights",
      min:[  0.0, 0.0, 0.0 ],
      max: [ 1.0, 1.0, 1.0 ],
      step: [ 0.01, 0.01, 0.01 ],
      defaultValue:[ 0.625, 0.25, 0.125 ],
      numType: "vec3"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id: "CLOUDS_detailWeights",
      label: "Cloud Detail Noise Weight",
      min:[ 0.0, 0.0, 0.0 ],
      max: [ 1.0, 1.0, 1.0 ],
      step: [ 0.01, 0.01, 0.01 ],
      defaultValue: [ 0.625, 0.25, 0.125 ],
      numType: "vec3"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id:"CLOUDS_densityFalloffIntensity",
      label: "Cloud Density Falloff Intensity",
      min: 0.1,
      max: 5.0,
      step: 0.01,
      defaultValue: 1.0,
      numType: "float"
    });
    SettingsManager.instance.addSliderToSection("Clouds Settings", {
      id:"CLOUDS_distanceFalloffIntensity",
      label: "Cloud Distance Falloff Intensity",
      min: 0.1,
      max: 5.0,
      step: 0.01,
      defaultValue: 1.0,
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
      id:"CLOUDS_height",
      label: "Cloud Base Height",
      min: 50,
      max: 500,
      step: 5,
      defaultValue: 100
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
      min: 0.001,
      max: 0.1,
      step: 0.001,
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
        SettingsManager.instance.addCheckboxToSection("Clouds Settings", {
      id: "CLOUDS_enableReprojection",
      label: "Enable Cloud Reprojection",
      defaultValue: false
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
      "CLOUDS_noiseWeights", 
      "CLOUDS_detailWeights",
      "CLOUDS_densityFalloffIntensity",
      "CLOUDS_distanceFalloffIntensity",
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
      "CLOUDS_blueNoiseAmplitude",
      "CLOUDS_enableReprojection",
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
    this.cloudTextures.forEach((texture) => this.gl.deleteTexture(texture));
    // Recreate render target with new dimensions
    this.renderTarget = this.initRenderTarget();
  }
}
export class NoiseGenerator {
  gl: WebGL2RenderingContext;
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
  private fbmPerlinWorely3d(width: number, height: number, depth: number, frequency: number,worelyGridSize:number, octaves: number): Uint8Array {
    const data = new Uint8Array(width * height * depth);
    for(let o = 0; o < octaves; o++) {
      const perlinData = this.perlinNoise3D(width, height, depth, frequency * Math.pow(2, o));
      const worleyData = this.worleyNoise3D(width, height, depth, worelyGridSize * Math.pow(2, -o), 2);
      for(let i = 0; i < width * height * depth; i++) {
        const perlinValue = perlinData[i] / 255;
        const worleyValue = 1.0 - worleyData[i] / 255;
        const combinedValue = this.remap(perlinValue+worleyValue, 0, 2, 0, 1);
        data[i] += Math.floor((combinedValue * 255) / octaves);

      }
    }
    return data;
  }
  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
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
    this.dataR = this.fbmPerlinWorely3d(size, size, size, 0.1,64,4);
    this.dataG = this.worleyNoise3D(size, size, size, 8, 2);
    this.dataB = this.worleyNoise3D(size, size, size, 6, 3);
    this.dataA = this.worleyNoise3D(size, size, size, 4, 4);

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
    this.visualizeSlice(1,document.getElementById("noisePreview") as HTMLCanvasElement  ,"R",false,2);
    return texture!;
  }
  generateDetailedCloudNoiseTex(size: number): WebGLTexture {
    this.detailR = this.worleyNoise3D(size, size, size, 8, 2);
    this.detailG = this.worleyNoise3D(size, size, size, 4, 2);
    this.detailB = this.worleyNoise3D(size, size, size, 2, 2);
    const data = new Uint8Array(size * size * size * 3);
    for (let i = 0; i < size * size * size; i++) {
      data[i * 3 + 0] = 255 - this.detailR[i];
      data[i * 3 + 1] = 255 - this.detailG[i];
      data[i * 3 + 2] = 255 - this.detailB[i];
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
    this.coverageData = await this.loadCoverageFromPNG(coveragePNG, size);
    this.highCoverageData = this.perlinNoise2D(size,size,0.5)
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
    detail = false,
    tileCount = 1 // NEW: how many times to tile in X/Y
  ) {
    const size = Math.cbrt(this.dataR.length);
    const ctx = canvas.getContext("2d");
    const scale = canvas.width / size / tileCount;
    if (!ctx) return;
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        // Tile the slice tileCount times in X and Y
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
  }

  //Temporary, will be replaced with a compute shader
  // --- Perlin Noise Helpers ---
private perlinPerm: number[] = [];
private perlinSeeded = false;

// Initialize permutation table for a given period (tile size)
private initPerlinPerm(period: number) {
  if (this.perlinSeeded && this.perlinPerm.length === period * 2) return;
  this.perlinPerm = [];
  for (let i = 0; i < period; i++) this.perlinPerm[i] = i;
  // Fisher-Yates shuffle
  for (let i = period - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [this.perlinPerm[i], this.perlinPerm[j]] = [this.perlinPerm[j], this.perlinPerm[i]];
  }
  // Repeat for overflow
  for (let i = 0; i < period; i++) this.perlinPerm[period + i] = this.perlinPerm[i];
  this.perlinSeeded = true;
}

// Fade function for Perlin interpolation
private perlinFade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// Linear interpolation
private perlinLerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

// Gradient function for 2D
private perlinGrad2(hash: number, x: number, y: number): number {
  // 8 directions
  const h = hash & 7;
  const u = h < 4 ? x : y;
  const v = h < 4 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}

// Gradient function for 3D
private perlinGrad3(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}

// --- Tileable Perlin Noise 2D ---
perlinNoise2D(width: number, height: number, frequency: number): Uint8Array {
  const basePeriod = Math.min(width, height);
  const period = Math.max(1, Math.round(basePeriod * frequency)); // integer lattice period
  this.initPerlinPerm(period);
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Map (x, y) to [0, period)
      const fx = (x / width) * period;
      const fy = (y / height) * period;

      const X0 = Math.floor(fx) % period;
      const Y0 = Math.floor(fy) % period;
      const X1 = (X0 + 1) % period;
      const Y1 = (Y0 + 1) % period;

      const dx = fx - Math.floor(fx);
      const dy = fy - Math.floor(fy);

      const perm = this.perlinPerm;
      const aa = perm[perm[X0] + Y0];
      const ab = perm[perm[X0] + Y1];
      const ba = perm[perm[X1] + Y0];
      const bb = perm[perm[X1] + Y1];

      const g_aa = this.perlinGrad2(aa, dx, dy);
      const g_ba = this.perlinGrad2(ba, dx - 1, dy);
      const g_ab = this.perlinGrad2(ab, dx, dy - 1);
      const g_bb = this.perlinGrad2(bb, dx - 1, dy - 1);

      const u = this.perlinFade(dx);
      const v = this.perlinFade(dy);

      const lerpX1 = this.perlinLerp(g_aa, g_ba, u);
      const lerpX2 = this.perlinLerp(g_ab, g_bb, u);
      const value = this.perlinLerp(lerpX1, lerpX2, v);

      const normalized = Math.floor(((value + 1) / 2) * 255);
      data[x + y * width] = normalized;
    }
  }
  return data;
}

// --- Tileable Perlin Noise 3D ---
perlinNoise3D(width: number, height: number, depth: number, frequency: number): Uint8Array {
  const basePeriod = Math.min(width, height, depth);
  const period = Math.max(1, Math.round(basePeriod * frequency)); // integer lattice period
  this.initPerlinPerm(period);
  const data = new Uint8Array(width * height * depth);

  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Map to [0, period) so it wraps cleanly
        const fx = (x / width) * period;
        const fy = (y / height) * period;
        const fz = (z / depth) * period;

        const X0 = Math.floor(fx) % period;
        const Y0 = Math.floor(fy) % period;
        const Z0 = Math.floor(fz) % period;
        const X1 = (X0 + 1) % period;
        const Y1 = (Y0 + 1) % period;
        const Z1 = (Z0 + 1) % period;

        const dx = fx - Math.floor(fx);
        const dy = fy - Math.floor(fy);
        const dz = fz - Math.floor(fz);

        const perm = this.perlinPerm;
        const aaa = perm[perm[perm[X0] + Y0] + Z0];
        const aba = perm[perm[perm[X0] + Y1] + Z0];
        const aab = perm[perm[perm[X0] + Y0] + Z1];
        const abb = perm[perm[perm[X0] + Y1] + Z1];
        const baa = perm[perm[perm[X1] + Y0] + Z0];
        const bba = perm[perm[perm[X1] + Y1] + Z0];
        const bab = perm[perm[perm[X1] + Y0] + Z1];
        const bbb = perm[perm[perm[X1] + Y1] + Z1];

        const g_aaa = this.perlinGrad3(aaa, dx, dy, dz);
        const g_baa = this.perlinGrad3(baa, dx - 1, dy, dz);
        const g_aba = this.perlinGrad3(aba, dx, dy - 1, dz);
        const g_bba = this.perlinGrad3(bba, dx - 1, dy - 1, dz);
        const g_aab = this.perlinGrad3(aab, dx, dy, dz - 1);
        const g_bab = this.perlinGrad3(bab, dx - 1, dy, dz - 1);
        const g_abb = this.perlinGrad3(abb, dx, dy - 1, dz - 1);
        const g_bbb = this.perlinGrad3(bbb, dx - 1, dy - 1, dz - 1);

        const u = this.perlinFade(dx);
        const v = this.perlinFade(dy);
        const w = this.perlinFade(dz);

        const lerpX1 = this.perlinLerp(g_aaa, g_baa, u);
        const lerpX2 = this.perlinLerp(g_aba, g_bba, u);
        const lerpY1 = this.perlinLerp(lerpX1, lerpX2, v);

        const lerpX3 = this.perlinLerp(g_aab, g_bab, u);
        const lerpX4 = this.perlinLerp(g_abb, g_bbb, u);
        const lerpY2 = this.perlinLerp(lerpX3, lerpX4, v);

        const value = this.perlinLerp(lerpY1, lerpY2, w);

        const normalized = Math.floor(((value + 1) / 2) * 255);
        data[x + y * width + z * width * height] = normalized;
      }
    }
  }
  return data;
}
}
