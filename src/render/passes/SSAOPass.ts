import SSAOVertexShaderSource from "../glsl/DeferredRendering/SSAO.vert";
import SSAOFragmentShaderSource from "../glsl/DeferredRendering/SSAO.frag";
import { ResourceCache } from "../renderSystem/managers/UniformsManager";
import { RenderPass } from "../renderSystem/RenderPass";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { RenderUtils } from "../../utils/RenderUtils";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { TextureUtils } from "../../utils/TextureUtils";
import { getUniformLocations } from "../renderSystem/managers/UniformsManager";

export class SSAOPass extends RenderPass {
    constructor(gl: WebGL2RenderingContext, resourceCache: ResourceCache, canvas: HTMLCanvasElement, renderGraph?: RenderGraph) {
        super(gl, resourceCache, canvas, renderGraph);
        this.program = RenderUtils.CreateProgram(gl, SSAOVertexShaderSource, SSAOFragmentShaderSource)!;
        this.renderTarget = this.initRenderTarget();
        this.uniforms = getUniformLocations(gl, this.program!, ["radius", "bias", "proj", "projInverse", "noiseSize"]);
    }

    protected initRenderTarget(width?: number, height?: number): RenderTarget {
        const w = width || this.canvas.width;
        const h = height || this.canvas.height;
        
        const ssaoTexture = TextureUtils.createTexture(this.gl, w, h, this.gl.R8, this.gl.RED, this.gl.UNSIGNED_BYTE);
        
        const fbo = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, ssaoTexture, 0);
        
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        
        return {
            fbo: fbo,
            textures: { ssao: ssaoTexture }
        };
    }

    public render(vao_info: VaoInfo | VaoInfo[]): void {
        const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
        const gBuffer = this.renderGraph!.getOutputs(this);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.BLEND);

        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(vao.vao);

        // Get textures from geometry pass using named keys
        TextureUtils.bindTex(this.gl, this.program!, gBuffer["normal"], "normalTexture", 0);
        TextureUtils.bindTex(this.gl, this.program!, gBuffer["depth"], "depthTexture", 1);
        TextureUtils.bindTex(this.gl, this.program!, this.resourceCache.getUniformData("SSAOInfo")!.NoiseTexture, "noiseTexture", 2);

        const cameraInfo = this.resourceCache.getUniformData("CameraInfo");
        this.gl.uniform1f(this.uniforms["radius"], this.resourceCache.getUniformData("SSAOInfo")!.radius);
        this.gl.uniform1f(this.uniforms["bias"], this.resourceCache.getUniformData("SSAOInfo")!.bias);
        this.gl.uniformMatrix4fv(this.uniforms["proj"], false, cameraInfo.matProj);
        this.gl.uniformMatrix4fv(this.uniforms["projInverse"], false, cameraInfo.matProjInverse);
        this.gl.uniform1f(this.uniforms["noiseSize"], this.resourceCache.getUniformData("SSAOInfo")!.NoiseSize);

        // Upload kernel samples
        const ssaoInfo = this.resourceCache.getUniformData("SSAOInfo");
        for (let i = 0; i < ssaoInfo.KernelSize; i++) {
            this.gl.uniform3fv(
                this.gl.getUniformLocation(this.program!, `samples[${i}]`),
                ssaoInfo.Kernels[i]
            );
        }

        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
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
        this.renderTarget = this.initRenderTarget(width, height);
    }

}