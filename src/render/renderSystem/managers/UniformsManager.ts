import { mat4, vec3 } from "gl-matrix";
import { TextureUtils } from "../../../utils/TextureUtils";
import { Camera } from "../../Camera";

export class ResourceCache {
    private uniformsCache: Map<string, any>;
    
    constructor(gl: WebGL2RenderingContext) {
        this.uniformsCache = new Map();
    }

    public getUniformData(key: string){
        return this.uniformsCache.get(key);
    }

    public setUniformData(key: string, value: any){
        this.uniformsCache.set(key, value);
    }
}

interface Matrices {
    matView: mat4;
    matProj: mat4;
    matViewProj: mat4;
    matViewInverse: mat4;
    matProjInverse: mat4;
  }

export function getUniformLocations(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    names: string[]
  ) {
    const locations: { [key: string]: WebGLUniformLocation } = {};
    for (const name of names) {
      const loc = gl.getUniformLocation(program, name);
      if (loc) locations[name] = loc;
    }
    return locations;
  }

export class UniformsManager {
    private gl: WebGL2RenderingContext;
    private canvas: HTMLCanvasElement;
    private SSAOParameters: 
    {
        radius: number;
        bias: number;
        SSAOBlur: boolean;
    }

    private kernelSize: number = 64;
    private kernels: vec3[] = [];
    private noiseTexture: WebGLTexture | null = null;
    private noiseSize: number = 64;
    private resourceCache: ResourceCache;
    private camera: Camera;

    constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, resourceCache: ResourceCache, camera: Camera) {
        this.gl = gl;
        this.SSAOParameters = {
            radius: 5.0,
            bias: 0.025,
            SSAOBlur: true,
        };
        this.generateKernels();
        this.generateNoiseTexture();
        this.resourceCache = resourceCache;
        this.canvas = canvas;
        this.camera = camera;
        this.resourceCache.setUniformData("SSAOInfo", this.getSSAOInfo());
    }   
    
    public getSSAOInfo(): { radius: number; bias: number; SSAOBlur: boolean, KernelSize: number, Kernels: vec3[], NoiseTexture: WebGLTexture, NoiseSize: number } {
        return { ...this.SSAOParameters, KernelSize: this.kernelSize, Kernels: this.kernels, NoiseTexture: this.noiseTexture!, NoiseSize: this.noiseSize };
    }
   
    public setSSAOParameters(radius: number, bias: number, SSAOBlur: boolean): void {
        this.SSAOParameters.radius = radius;
        this.SSAOParameters.bias = bias;
        this.SSAOParameters.SSAOBlur = SSAOBlur;
        this.resourceCache.setUniformData("SSAOInfo", this.getSSAOInfo());
    }

    private generateKernels(): void {
        this.kernels = [];
        for (let i = 0; i < this.kernelSize; i++) {
          let sample = vec3.fromValues(
            Math.random() * 2.0 - 1.0,
            Math.random() * 2.0 - 1.0,
            Math.random()
          );
    
          vec3.normalize(sample, sample);
    
          let scale = i / this.kernelSize;
          scale = 0.1 + scale * scale * 0.9;
          vec3.scale(sample, sample, scale);
    
          this.kernels.push(sample);
        }
    }

    private generateNoiseTexture(): void {
        const noiseData = new Float32Array(this.noiseSize * this.noiseSize * 3);
        for (let i = 0; i < this.noiseSize; i++) {
          for (let j = 0; j < this.noiseSize; j++) {
            const index = (i * this.noiseSize + j) * 3;
            noiseData[index] = Math.random() * 2.0 - 1.0;
            noiseData[index + 1] = Math.random() * 2.0 - 1.0;
            noiseData[index + 2] = 0.0;
          }
        }
        this.noiseTexture = TextureUtils.createTexture(
          this.gl,
          this.noiseSize,
          this.noiseSize,
          this.gl.RGB32F,
          this.gl.RGB,
          this.gl.FLOAT,
          noiseData,
          this.gl.NEAREST,
          this.gl.NEAREST,
          this.gl.REPEAT,
          this.gl.REPEAT
        );
      }

    public calculateCameraInfo(): void {
        const matViewAndProj = this.camera.calculateProjectionMatrices(this.canvas.width, this.canvas.height);
        const cameraInfo : Matrices = {
            matView: matViewAndProj.matView,
            matProj: matViewAndProj.matProj,
            matViewProj: mat4.multiply(mat4.create(), matViewAndProj.matProj, matViewAndProj.matView),
            matViewInverse: mat4.invert(mat4.create(), matViewAndProj.matView),
            matProjInverse: mat4.invert(mat4.create(), matViewAndProj.matProj),
        };
        this.resourceCache.setUniformData("CameraInfo", cameraInfo);
        this.resourceCache.setUniformData("cameraPosition", this.camera.position);
    }
}