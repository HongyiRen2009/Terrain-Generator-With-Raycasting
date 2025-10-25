import { mat4, vec3 } from "gl-matrix";
import cloudFragmentShaderSource from "./CloudShader.frag";
import cloudVertexShaderSource from "./CloudShader.vert";
import { GlUtils } from "./GlUtils";
import { createNoise3D, NoiseFunction3D } from "simplex-noise";
import { Light } from "../map/Light";
import { GameEngine } from "../GameEngine";

export class CloudRenderer {
  private gl: WebGL2RenderingContext;
  private shaderProgram: WebGLProgram | null = null;
  private screenQuadVao: WebGLVertexArrayObject;
  private noiseTexture: WebGLTexture | null = null;
  private noiseGenerator: NoiseGenerator;
  constructor(
    gl: WebGL2RenderingContext,
    screenQuadVao: WebGLVertexArrayObject
  ) {
    this.gl = gl;
    this.screenQuadVao = screenQuadVao;
    this.shaderProgram = GlUtils.CreateProgram(
      gl,
      cloudVertexShaderSource,
      cloudFragmentShaderSource
    );
    this.noiseGenerator = new NoiseGenerator(gl);
    this.noiseTexture = this.noiseGenerator.generateCloudNoiseTex(32);
  }
  render(
    cameraPos: vec3,
    lights: Array<Light>,
    viewInverse: mat4,
    projInverse: mat4
  ) {
    if (!this.shaderProgram) return;
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.depthMask(false);
    this.gl.useProgram(this.shaderProgram);
    this.gl.bindVertexArray(this.screenQuadVao);
    // Bind 3D texture
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_3D, this.noiseTexture);
    this.gl.uniform1i(
      this.gl.getUniformLocation(this.shaderProgram, "noiseTexture"),
      0
    );
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.shaderProgram, "cameraPos"),
      cameraPos
    );
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.shaderProgram, "cubeMin"),
      vec3.fromValues(-50, -20, -50)
    );
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.shaderProgram, "cubeMax"),
      vec3.fromValues(50, 20, 50)
    );
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(this.shaderProgram, "viewInverse"),
      false,
      viewInverse
    );
    this.gl.uniformMatrix4fv(
      this.gl.getUniformLocation(this.shaderProgram, "projInverse"),
      false,
      projInverse
    );
    const cloudSection = GameEngine.settingsManager.getSection("clouds");
    if (!cloudSection) {
      console.warn("Cloud settings section not found");
    }
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.shaderProgram, "absorption"),
      cloudSection?.getSliderValue("absorption") || 1.0
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.shaderProgram, "densityThreshold"),
      cloudSection?.getSliderValue("density-threshold") || 0.5
    );
    debugger;
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.shaderProgram, "baseFrequency"),
      cloudSection?.getSliderValue("base-frequency") || 0.05
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.shaderProgram, "detailFrequency"),
      cloudSection?.getSliderValue("detail-frequency") || 0.2
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.shaderProgram, "lightAbsorption"),
      cloudSection?.getSliderValue("light-absorption") || 1.0
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.shaderProgram, "lightIntensity"),
      cloudSection?.getSliderValue("light-intensity") || 1.0
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.shaderProgram, "darknessThreshold"),
      cloudSection?.getSliderValue("darkness-threshold") || 0.2
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.shaderProgram, "ambientIntensity"),
      cloudSection?.getSliderValue("ambient-intensity") || 0.8
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.shaderProgram, "phaseG"),
      cloudSection?.getSliderValue("phase-g") || 0.5
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.shaderProgram, "phaseMultiplier"),
      0.5
    );
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.shaderProgram, "sunPos"),
      lights[0].position
    );
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.shaderProgram, "sunColor"),
      lights[0].color.createVec3()
    );
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
    this.gl.useProgram(null);
  }
}
class NoiseGenerator {
  gl: WebGL2RenderingContext;
  simplex: NoiseFunction3D = createNoise3D();
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
          const norm = Math.sqrt(distArr[idx]) / Math.sqrt(maxDist);
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
          const normalized = Math.floor((value + 1) / 2);
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
    debugger;
    for (let i = 0; i < data.length; i++) {
      const hybrid = 1.0 - Math.pow(1.0 - worelyData[i], simplexData[i]);
      data[i] = hybrid;
    }
    return data;
  }
  generateCloudNoiseTex(size: number): WebGLTexture {
    const frequency = 8;
    const dataR = this.simplexWorleyNoise3D(size, size, size, frequency);
    const dataG = this.worleyNoise3D(size, size, size, size / (frequency * 2));
    const dataB = this.worleyNoise3D(size, size, size, (frequency * 4) / 2);
    const dataA = this.worleyNoise3D(size, size, size, size / (frequency * 8));
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_3D, texture);

    // Interleave RGBA channels
    const data = new Uint8Array(size * size * size * 4);
    for (let i = 0; i < size * size * size; i++) {
      data[i * 4 + 0] = dataR[i];
      data[i * 4 + 1] = dataG[i];
      data[i * 4 + 2] = dataB[i];
      data[i * 4 + 3] = dataA[i];
    }

    this.gl.texImage3D(
      this.gl.TEXTURE_3D,
      0, // mip level
      this.gl.RGBA8,
      size,
      size,
      size,
      0, // border
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      data
    );

    // Set texture parameters for mipmapping and filtering
    this.gl.texParameteri(
      this.gl.TEXTURE_3D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR_MIPMAP_LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_3D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_3D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.REPEAT
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_3D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.REPEAT
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_3D,
      this.gl.TEXTURE_WRAP_R,
      this.gl.REPEAT
    );

    // Generate mipmaps
    this.gl.generateMipmap(this.gl.TEXTURE_3D);

    this.gl.bindTexture(this.gl.TEXTURE_3D, null);
    return texture!;
  }
}
