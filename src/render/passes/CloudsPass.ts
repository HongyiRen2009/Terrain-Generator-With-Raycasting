import { SettingsSection } from "../../Settings";
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
export class CloudsPass extends RenderPass {
  public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
  public pathtracerRender: boolean = true;
  protected settingsSection: SettingsSection | null = null;
  private noiseTexture: WebGLTexture | null = null;
  private weatherMapTexture: WebGLTexture | null = null;
  private noiseGenerator: NoiseGenerator;
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
    this.noiseTexture = this.noiseGenerator.generateCloudNoiseTex(32);
    this.weatherMapTexture = this.noiseGenerator.generateWeatherMap(128);
    this.uniforms = getUniformLocations(gl, this.program!, [
      "viewInverse",
      "projInverse",
      "cameraPosition"
    ]);
  }
  protected initRenderTarget(): RenderTarget {
    return { fbo: null, textures: {} };
  }
  public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
    const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.depthMask(false);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.useProgram(this.program);
    this.gl.bindVertexArray(vao.vao);
    const gBuffer = this.renderGraph!.getOutputs(this);
    const depthTexture = gBuffer["depth"];
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.program!, "cubeMin"),
      vec3.fromValues(-300, 100, -300)
    );
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.program!, "cubeMax"),
      vec3.fromValues(300, 160, 300)
    );
    // Bind 3D texture
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_3D, this.noiseTexture);
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.program!, "noiseTexture"),
      0
    );
    // Bind weather map texture
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      this.weatherMapTexture!,
      "weatherMap",
      1
    );
    TextureUtils.bindTex(
      this.gl,
      this.program!,
      depthTexture,
      "depthTexture",
      2
    );
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.program!, "sunPos"),
      this.resourceCache.getUniformData("lights")[0].position
    );
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.program!, "sunColor"),
      this.resourceCache.getUniformData("lights")[0].color.createVec3()
    );
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
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.program!, "time"),
      performance.now() * 0.001 // Convert to seconds
    );
    this.settingsSection?.updateUniforms(this.gl);
    if (!pathtracerOn || this.pathtracerRender) {
      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }
    this.gl.bindVertexArray(null);
    this.gl.useProgram(null);

    this.gl.disable(this.gl.BLEND);
    this.gl.depthMask(true);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_3D, null);
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  private InitSettings() {
    this.settingsSection = new SettingsSection(
      document.getElementById("settings-section")!,
      "Clouds Settings",
      this.program!
    );

    this.settingsSection.addCheckbox({
      id: "enableClouds",
      label: "Enable Clouds",
      defaultValue: true
    });

    this.settingsSection.addSlider({
      id: "MAX_STEPS",
      label: "Cloud Ray Marching Max Steps",
      min: 8,
      max: 128,
      step: 1,
      defaultValue: 32,
      numType: "int"
    });

    this.settingsSection.addSlider({
      id: "MAX_STEPS_LIGHT",
      label: "Cloud Light Ray Marching Max Steps",
      min: 4,
      max: 32,
      step: 1,
      defaultValue: 8,
      numType: "int"
    });

    this.settingsSection.addSlider({
      id: "absorption",
      label: "Cloud Absorption",
      min: 0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0,
      numType: "float"
    });

    this.settingsSection.addSlider({
      id: "densityThreshold",
      label: "Cloud Density Threshold",
      min: -2.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.09,
      numType: "float"
    });

    this.settingsSection.addSlider({
      id: "baseFrequency",
      label: "Cloud Base Frequency",
      min: 0.01,
      max: 0.5,
      step: 0.001,
      defaultValue: 0.45,
      numType: "float"
    });

    this.settingsSection.addSlider({
      id: "detailFrequency",
      label: "Cloud Detail Frequency",
      min: 0.1,
      max: 0.5,
      step: 0.001,
      defaultValue: 0.46,
      numType: "float"
    });

    this.settingsSection.addSlider({
      id: "lightAbsorption",
      label: "Cloud Light Absorption",
      min: 0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0,
      numType: "float"
    });

    this.settingsSection.addSlider({
      id: "lightIntensity",
      label: "Cloud Light Intensity",
      min: 0,
      max: 5.0,
      step: 0.01,
      defaultValue: 2.4,
      numType: "float"
    });

    this.settingsSection.addSlider({
      id: "ambientIntensity",
      label: "Cloud Ambient Intensity",
      min: 0,
      max: 2.0,
      step: 0.01,
      defaultValue: 0.5,
      numType: "float"
    });

    this.settingsSection.addSlider({
      id: "darknessThreshold",
      label: "Cloud Darkness Threshold",
      min: 0.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.2,
      numType: "float"
    });

    this.settingsSection.addSlider({
      id: "phaseG",
      label: "Cloud Phase Function g",
      min: -1.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.5,
      numType: "float"
    });

    this.settingsSection.addSlider({
      id: "phaseMultiplier",
      label: "Cloud Phase Function Multiplier",
      min: 0.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.5,
      numType: "float"
    });

    this.settingsSection.addSlider({
      id: "weatherMapOffsetX",
      label: "Cloud Weather Map Offset X",
      min: 0.0,
      max: 10.0,
      step: 0.01,
      defaultValue: 0.0,
      numType: "float"
    });

    this.settingsSection.addSlider({
      id: "weatherMapOffsetY",
      label: "Cloud Weather Map Offset Y",
      min: 0.0,
      max: 10.0,
      step: 0.01,
      defaultValue: 0.0,
      numType: "float"
    });

    this.settingsSection.addSlider({
      id: "windSpeed",
      label: "Cloud Wind Speed",
      min: 0.0,
      max: 10.0,
      step: 0.01,
      defaultValue: 3.0,
      numType: "float"
    });

    this.settingsSection.addSlider({
      id: "windDirectionX",
      label: "Cloud Wind Direction X",
      min: -1.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 1.0,
      numType: "float"
    });

    this.settingsSection.addSlider({
      id: "windDirectionZ",
      label: "Cloud Wind Direction Z",
      min: -1.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 1.0,
      numType: "float"
    });
  }
  public resize(width: number, height: number): void {
    // LightingPass renders to default framebuffer, no resize needed
    // But we need to update viewport
    this.gl.viewport(0, 0, width, height);
  }
}
class NoiseGenerator {
  gl: WebGL2RenderingContext;
  simplex: NoiseFunction3D = createNoise3D();
  dataR: Uint8Array = new Uint8Array();
  dataG: Uint8Array = new Uint8Array();
  dataB: Uint8Array = new Uint8Array();
  dataA: Uint8Array = new Uint8Array();
  coverageData: Uint8Array = new Uint8Array();
  densityData: Uint8Array = new Uint8Array();
  typeData: Uint8Array = new Uint8Array();
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
          const value = this.simplex(
            x * frequency,
            y * frequency,
            z * frequency
          );
          const normalized = Math.floor(((value + 1) / 2) * 255);
          data[x + y * width + z * width * height] = normalized;
        }
      }
    }
    return data;
  }
  simplexWorleyNoise3D(
    width: number,
    height: number,
    depth: number,
    frequency: number
  ): Uint8Array {
    const worelyData = this.worleyNoise3D(
      width,
      height,
      depth,
      Math.min(width, height, depth) / frequency
    );
    const simplexData = this.simplexNoise3D(width, height, depth, frequency);
    const data = new Uint8Array(width * height * depth);
    for (let i = 0; i < data.length; i++) {
      const worleyNorm = worelyData[i] / 255.0;
      const simplexNorm = simplexData[i] / 255.0;
      const hybrid = 1.0 - Math.pow(1.0 - worleyNorm, simplexNorm);
      data[i] = Math.floor(hybrid * 255);
    }
    return data;
  }
  generateCloudNoiseTex(size: number): WebGLTexture {
    const frequency = 8;
    this.dataR = this.simplexWorleyNoise3D(size, size, size, frequency);
    this.dataG = this.worleyNoise3D(size, size, size, size / (frequency * 2));
    this.dataB = this.worleyNoise3D(size, size, size, (frequency * 4) / 2);
    this.dataA = this.worleyNoise3D(size, size, size, size / (frequency * 8));
    // Interleave RGBA channels
    const data = new Uint8Array(size * size * size * 4);
    for (let i = 0; i < size * size * size; i++) {
      data[i * 4 + 0] = this.dataR[i];
      data[i * 4 + 1] = this.dataG[i];
      data[i * 4 + 2] = this.dataB[i];
      data[i * 4 + 3] = this.dataA[i];
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
        const value = this.simplex(x * frequency, y * frequency, 10);
        const normalized = Math.floor(((value + 1) / 2) * 255);
        data[x + y * width] = normalized;
      }
    }
    return data;
  }
  generateWeatherMap(size: number): WebGLTexture {
    const worely = this.worleyNoise2D(size, size, size / 4);
    const simplex = this.simplexNoise2D(size, size, 0.08);
    this.coverageData = new Uint8Array(size * size);
    for (let i = 0; i < size * size; i++) {
      const worelyNorm = 1 - worely[i] / 255.0;
      const simplexNorm = simplex[i] / 255.0;
      let coverage = Math.pow(worelyNorm, 1.2) - simplexNorm * 0.3;
      coverage = Math.min(Math.max(coverage, 0.0), 1.0);

      this.coverageData[i] = coverage * 255;
    }
    // Right now I have no idea what to put in density and type maps, so just fill with zeros
    this.densityData = new Uint8Array(size * size);
    this.typeData = new Uint8Array(size * size);
    // Interleave RGB channels
    const data = new Uint8Array(size * size * 3);
    for (let i = 0; i < size * size; i++) {
      data[i * 3 + 0] = this.coverageData[i];
      data[i * 3 + 1] = this.densityData[i];
      data[i * 3 + 2] = this.typeData[i];
    }
    const texture = TextureUtils.createTexture2D(
      this.gl,
      size,
      size,
      this.gl.RGB8,
      this.gl.RGB,
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
        let b = this.typeData[idx];
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
  visualizeSlice(
    sliceZ: number,
    canvas: HTMLCanvasElement,
    channel: "R" | "G" | "B" | "A"
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
        imageData.data[idx2D + 0] = value;
        imageData.data[idx2D + 1] = value;
        imageData.data[idx2D + 2] = value;
        imageData.data[idx2D + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
}
