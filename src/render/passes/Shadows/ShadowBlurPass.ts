import { RenderUtils } from "../../../utils/RenderUtils";
import { ResourceCache } from "../../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../../renderSystem/RenderGraph";
import { RenderPass, VAOInputType } from "../../renderSystem/RenderPass";
import ShadowBlurVertexShaderSource from "../../glsl/DeferredRendering/Shadows/ShadowBlur.vert"
import ShadowBlurFragmentShaderSource from "../../glsl/DeferredRendering/Shadows/ShadowBlur.frag"
import { RenderTarget } from "../../renderSystem/RenderTarget";
import { TextureUtils } from "../../../utils/TextureUtils";
import { VaoInfo } from "../../renderSystem/managers/VaoManager";

export class ShadowBlurPass extends RenderPass{
    public pathtracerRender: boolean = false;
    public VAOInputType: VAOInputType = VAOInputType.FULLSCREENQUAD;
    constructor( gl: WebGL2RenderingContext, resourceCache: ResourceCache, canvas: HTMLCanvasElement, renderGraph?: RenderGraph){
        super(gl, resourceCache, canvas, renderGraph);
        this.program = RenderUtils.CreateProgram(
            gl,
            ShadowBlurVertexShaderSource,
            ShadowBlurFragmentShaderSource
        )!;
    }

    public initRenderTarget(): RenderTarget {
        const fbo = this.gl.createFramebuffer();
        if (!fbo) {
            throw new Error("Failed to create framebuffer");
        }
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
        const blurredSunShadowMaskTexture = TextureUtils.createTexture2D(this.gl, this.canvas.width, this.canvas.height, this.gl.RGBA16F, this.gl.RGBA, this.gl.FLOAT);
        const blurredPointShadowMaskATexture = TextureUtils.createTexture2D(this.gl, this.canvas.width, this.canvas.height, this.gl.R32F, this.gl.RED, this.gl.FLOAT);
        const blurredPointShadowMaskBTexture = TextureUtils.createTexture2D(this.gl, this.canvas.width, this.canvas.height, this.gl.R32F, this.gl.RED, this.gl.FLOAT);
        const blurredPointShadowMaskCTexture = TextureUtils.createTexture2D(this.gl, this.canvas.width, this.canvas.height, this.gl.R32F, this.gl.RED, this.gl.FLOAT);
        const blurredPointShadowMaskDTexture = TextureUtils.createTexture2D(this.gl, this.canvas.width, this.canvas.height, this.gl.R32F, this.gl.RED, this.gl.FLOAT);
        const blurredPointShadowMaskETexture = TextureUtils.createTexture2D(this.gl, this.canvas.width, this.canvas.height, this.gl.R32F, this.gl.RED, this.gl.FLOAT);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, blurredSunShadowMaskTexture, 0);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT1, this.gl.TEXTURE_2D, blurredPointShadowMaskATexture, 0);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT2, this.gl.TEXTURE_2D, blurredPointShadowMaskBTexture, 0);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT3, this.gl.TEXTURE_2D, blurredPointShadowMaskCTexture, 0);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT4, this.gl.TEXTURE_2D, blurredPointShadowMaskDTexture, 0);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT5, this.gl.TEXTURE_2D, blurredPointShadowMaskETexture, 0);
        this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0, this.gl.COLOR_ATTACHMENT1, this.gl.COLOR_ATTACHMENT2, this.gl.COLOR_ATTACHMENT3, this.gl.COLOR_ATTACHMENT4, this.gl.COLOR_ATTACHMENT5]);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        return { fbo, textures: { blurredSunShadowMask: blurredSunShadowMaskTexture, blurredPointShadowMaskA:  blurredPointShadowMaskATexture, blurredPointShadowMaskB:  blurredPointShadowMaskBTexture, blurredPointShadowMaskC:  blurredPointShadowMaskCTexture, blurredPointShadowMaskD:  blurredPointShadowMaskDTexture, blurredPointShadowMaskE:  blurredPointShadowMaskETexture} };
    }

    public resize(width: number, height: number): void {
        this.disposeRenderTarget();
        this.renderTarget = this.initRenderTarget();
    }

    public render(vao_info: VaoInfo | VaoInfo[], pathtracerOn: boolean): void {
        const vao = Array.isArray(vao_info) ? vao_info[0] : vao_info;
        // Get INPUT textures from dependencies (unblurred shadow masks)
        const textures = this.renderGraph!.getOutputs(this);
        const sunShadowMask = textures["sunShadowMask"];
        const pointShadowMaskA = textures["pointShadowMaskA"];
        const pointShadowMaskB = textures["pointShadowMaskB"];
        const pointShadowMaskC = textures["pointShadowMaskC"];
        const pointShadowMaskD = textures["pointShadowMaskD"];
        const pointShadowMaskE = textures["pointShadowMaskE"];
        const depthTexture = textures["depth"];
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.BLEND);
        this.gl.useProgram(this.program!);
        this.gl.bindVertexArray(vao.vao);
        // Bind input textures with shader uniform names
        TextureUtils.bindTex(this.gl, this.program!, sunShadowMask, "sunShadowMask", 0);
        TextureUtils.bindTex(this.gl, this.program!, pointShadowMaskA, "pointShadowMaskA", 1);
        TextureUtils.bindTex(this.gl, this.program!, pointShadowMaskB, "pointShadowMaskB", 2);
        TextureUtils.bindTex(this.gl, this.program!, pointShadowMaskC, "pointShadowMaskC", 3);
        TextureUtils.bindTex(this.gl, this.program!, pointShadowMaskD, "pointShadowMaskD", 4);
        TextureUtils.bindTex(this.gl, this.program!, pointShadowMaskE, "pointShadowMaskE", 5);
        TextureUtils.bindTex(this.gl, this.program!, depthTexture, "depthTexture", 6);
        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
}