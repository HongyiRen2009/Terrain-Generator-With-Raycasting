import { mat4, vec3 } from "gl-matrix";
import cloudFragmentShaderSource from "./CloudShader.frag";
import cloudVertexShaderSource from "./CloudShader.vert";
import { GlUtils } from "./GlUtils";
import { createNoise3D, NoiseFunction3D } from "simplex-noise";
import { Light } from "../map/Light";

export class CloudRenderer {
  private gl: WebGL2RenderingContext;
  private shaderProgram: WebGLProgram | null = null;
  private screenQuadVao: WebGLVertexArrayObject;
  private noiseTexture: WebGLTexture | null = null;
  private noiseGenerator: NoiseGenerator;
  //settings
  public absorption = 0.1;
  public densityThreshold = 1.0;
  public frequency = 0.2;
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
    this.generateNoiseTexture(32);
  }
  generateNoiseTexture(size: number) {
    const data = this.worleyNoise3D(size, size, size, 8, 3);
    const texData = new Float32Array(size * size * size);
    for (let z = 0; z < size; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = x + y * size + z * size * size;
          texData[idx] = data[z][y][x];
        }
      }
    }
    this.noiseTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_3D, this.noiseTexture);
    this.gl.texImage3D(
      this.gl.TEXTURE_3D,
      0,
      this.gl.R32F,
      size,
      size,
      size,
      0,
      this.gl.RED,
      this.gl.FLOAT,
      texData
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_3D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR
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
    this.gl.bindTexture(this.gl.TEXTURE_3D, null);
  }
  worleyNoise3D(
    width: number,
    height: number,
    depth: number,
    gridSize: number,
    pointsPerCell = 1
  ) {
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

    // Create 3D array
    const data = Array.from({ length: depth }, () =>
      Array.from({ length: height }, () => new Float32Array(width))
    );
    let maxDist = 0;

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
          data[z][y][x] = minDist;
          if (minDist > maxDist) maxDist = minDist;
        }
      }
    }

    // Normalize distances
    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          data[z][y][x] = Math.sqrt(data[z][y][x]) / Math.sqrt(maxDist);
        }
      }
    }
    return data;
  }
  render(
    cameraPos: vec3,
    lights: Array<Light>,
    viewInverse: mat4,
    projInverse: mat4
  ) {
    if (!this.shaderProgram) return;
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
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
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.shaderProgram, "absorption"),
      this.absorption
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.shaderProgram, "densityThreshold"),
      this.densityThreshold
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.shaderProgram, "frequency"),
      this.frequency
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
  // --- Simple hash-based random ---
  hash(x: number, y: number, z: number): number {
    let h = (x * 374761393 + y * 668265263) ^ (z * 2147483647);
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) & 0x7fffffff;
  }

  // --- Worley noise (distance to nearest cell point) ---
  worleyNoise(x: number, y: number, z: number, scale: number): number {
    const xi = Math.floor(x * scale);
    const yi = Math.floor(y * scale);
    const zi = Math.floor(z * scale);
    let minDist = 999.0;

    for (let dz = -1; dz <= 1; dz++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = xi + dx;
          const ny = yi + dy;
          const nz = zi + dz;

          const h = this.hash(nx, ny, nz);
          const fx = (h & 255) / 255.0;
          const fy = ((h >> 8) & 255) / 255.0;
          const fz = ((h >> 16) & 255) / 255.0;

          const px = (nx + fx) / scale;
          const py = (ny + fy) / scale;
          const pz = (nz + fz) / scale;

          const dxp = x - px;
          const dyp = y - py;
          const dzp = z - pz;

          const dist = Math.sqrt(dxp * dxp + dyp * dyp + dzp * dzp);
          if (dist < minDist) minDist = dist;
        }
      }
    }
    return minDist; // [0, ~0.8]
  }
  perlinWorley(x: number, y: number, z: number): number {
    const p = this.simplex(x, y, z) * 0.5 + 0.5; // Perlin in [0,1]
    const w = this.worleyNoise(x, y, z, 4.0); // coarse Worley
    return Math.min(1.0, p + (1.0 - w)); // puff + cells
  }
  generateCloudNoiseTex(size: number): WebGLTexture {
    const data = new Uint8Array(size * size * size * 4);

    let idx = 0;
    for (let z = 0; z < size; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const u = x / size;
          const v = y / size;
          const w = z / size;

          // R channel = Perlin-Worley
          const r = this.perlinWorley(u, v, w);

          // GBA = Worley at increasing scales
          const g = this.worleyNoise(u, v, w, 8.0);
          const b = this.worleyNoise(u, v, w, 16.0);
          const a = this.worleyNoise(u, v, w, 32.0);

          data[idx++] = Math.floor(r * 255);
          data[idx++] = Math.floor(g * 255);
          data[idx++] = Math.floor(b * 255);
          data[idx++] = Math.floor(a * 255);
        }
      }
    }
    const tex = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_3D, tex);
    this.gl.texImage3D(
      this.gl.TEXTURE_3D,
      0,
      this.gl.RGBA8,
      size,
      size,
      size,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      data
    );

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

    this.gl.generateMipmap(this.gl.TEXTURE_3D);
    return tex;
  }
}
