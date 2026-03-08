import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { RenderUtils } from "../../utils/RenderUtils";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { TextureUtils } from "../../utils/TextureUtils";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { RenderGraph } from "../renderSystem/RenderGraph";
import geometryVertexShaderSource from "../glsl/DeferredRendering/Geometry.vert";
import geometryFragmentShaderSource from "../glsl/DeferredRendering/Geometry.frag";
import { mat4, vec3 } from "gl-matrix";
import { getUniformLocations } from "../renderSystem/managers/ResourceCache";
import { WorldUtils } from "../../utils/WorldUtils";
import waterVertexShaderSource from "../glsl/Water/Water.vert";
import waterFragmentShaderSource from "../glsl/Water/Water.frag";
export class WaterPass extends RenderPass {
    public VAOInputType: VAOInputType = VAOInputType.WATER;
    public pathtracerRender: boolean = true;
    constructor(gl: WebGL2RenderingContext, resourceCache: ResourceCache, canvas: HTMLCanvasElement, renderGraph?: RenderGraph, name?: string) {
        super(gl, resourceCache, canvas, renderGraph, name);
        this.canvas = canvas;
        this.program = RenderUtils.CreateProgram(gl, waterVertexShaderSource, waterFragmentShaderSource);
        this.uniforms = getUniformLocations(this.gl, this.program!, [
            "view",
            "proj",
            "model",
            "time",
            "cameraPos"
        ]);

    }
    protected initRenderTarget(width?: number, height?: number): RenderTarget {
        const w = width || this.canvas.width;
        const h = height || this.canvas.height;
        const waterColorTexture = TextureUtils.createTexture2D(this.gl, w, h,
            this.gl.RGBA8,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE);
        const fbo = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, waterColorTexture, 0);
        this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error("Framebuffer not complete: " + status.toString());
        }
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        return {
            fbo: fbo,
            textures: {
                waterColorTexture
            },
        }
    }
    public render(vao_info: VaoInfo[], pathtracerOn: boolean): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.program);
        const gBuffer = this.renderGraph?.getOutputs(this);
        TextureUtils.bindTex(this.gl,this.program!, gBuffer!["depth"],"depthTexture", 0);
        TextureUtils.bindTex(this.gl,this.program!, gBuffer!["sceneTexture"],"sceneTexture", 1);
        const cameraPos = this.resourceCache.getData("cameraPosition") as
        | vec3
        | undefined;
        if (!cameraPos) return;
        
        const cameraInfo = this.resourceCache.getData("CameraInfo");
        this.gl.uniformMatrix4fv(this.uniforms["view"], false, cameraInfo.matView);
        this.gl.uniformMatrix4fv(this.uniforms["proj"], false, cameraInfo.matProj);
        this.gl.uniform1f(this.uniforms["time"], performance.now() / 1000);
        this.gl.uniform3fv(this.uniforms["cameraPos"], cameraPos);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        const viewProj = mat4.create();
        mat4.multiply(viewProj, cameraInfo.matProj, cameraInfo.matView);
        const frustum = WorldUtils.extractFrustumPlanes(viewProj);
        for (const vao of vao_info) {
            if (vao.boundingBox && !WorldUtils.aabbInFrustum(vao.boundingBox, frustum, vao.modelMatrix)) {
                continue;
            }
            this.gl.uniformMatrix4fv(this.uniforms["model"], false, vao.modelMatrix);

            this.gl.bindVertexArray(vao.vao);

            this.gl.drawElements(this.gl.TRIANGLES, vao.indexCount, this.gl.UNSIGNED_INT, 0);
        }
        this.gl.bindVertexArray(null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
    public resize(width: number, height: number): void {
        this.renderTarget = this.initRenderTarget(width, height);
    }
}