import { RenderPass } from "../renderSystem/RenderPass";
import { ResourceCache, getUniformLocations } from "../renderSystem/managers/ResourceCache";
import { mat4 } from "gl-matrix";
import { RenderGraph } from "../renderSystem/RenderGraph";
import DebugVertexShaderSource from "../glsl/Debug/Debug.vert";
import DebugFragmentShaderSource from "../glsl/Debug/Debug.frag";
import { RenderUtils } from "../../utils/RenderUtils";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { cubeVertices, cubeWireframeIndices, cubeColors } from "../../map/geometry";

export class DebugPass extends RenderPass {
    private positionBuffer: WebGLBuffer | null = null;
    private colorBuffer: WebGLBuffer | null = null;
    private indexBuffer: WebGLBuffer | null = null;
    private vao: WebGLVertexArrayObject | null = null;

    constructor(gl: WebGL2RenderingContext, resourceCache: ResourceCache, canvas: HTMLCanvasElement, renderGraph?: RenderGraph) {
        super(gl, resourceCache, canvas, renderGraph);
        this.program = RenderUtils.CreateProgram(gl, DebugVertexShaderSource, DebugFragmentShaderSource)!;
        this.uniforms = getUniformLocations(gl, this.program!, [
            "inverseLightSpaceMatrices",
            "shadowMapCascade",
            "viewProj"
        ]);
        this.renderTarget = this.initRenderTarget();
        this.initBuffers();
    }
    protected initRenderTarget(): RenderTarget {
        return {
            fbo: null,
            textures: {}
        };
    }
    private initBuffers(): void {
        this.positionBuffer = RenderUtils.CreateAttributeBuffer(this.gl, cubeVertices);
        this.colorBuffer = RenderUtils.CreateAttributeBuffer(this.gl, cubeColors);
        this.indexBuffer = RenderUtils.CreateIndexBuffer(this.gl, cubeWireframeIndices);
        this.vao = RenderUtils.createNonInterleavedVao(
            this.gl,
            {
                clipPos: { buffer: this.positionBuffer, size: 3 },
                color: { buffer: this.colorBuffer, size: 3 }
            },
            this.indexBuffer,
            this.program!
        );
    }
    public render(): void {
        const cascadeDebug = this.resourceCache.getUniformData("cascadeDebug") as boolean | undefined;
        if (!cascadeDebug) {
            return;
        }
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.useProgram(this.program!);
        this.gl.bindVertexArray(this.vao!);
        const inverseLightSpaceMatrices: number[] = [];
        const lightSpaceMatrices = this.resourceCache.getUniformData("lightSpaceMatrices") as mat4[] | undefined;
        if (!lightSpaceMatrices || lightSpaceMatrices.length === 0) {
            console.warn("[DebugPass] No light-space matrices – skipping frustum draw");
            return;
        }
        
        if (lightSpaceMatrices) {
            for (let i = 0; i < lightSpaceMatrices.length; i++) {
                const inverted = mat4.invert(mat4.create(), lightSpaceMatrices[i]);
                if (!inverted) {
                    continue;
                }
                for (let j = 0; j < inverted.length; j++) {
                    inverseLightSpaceMatrices.push(inverted[j]);
                }
            }
        }

        this.gl.uniformMatrix4fv(
            this.uniforms["inverseLightSpaceMatrices"],
            false,
            new Float32Array(inverseLightSpaceMatrices)
        );
        const viewProj = this.resourceCache.getUniformData("CameraInfo").matViewProj;
        this.gl.uniformMatrix4fv(
            this.uniforms["viewProj"],
            false,
            viewProj
        );
        this.gl.uniform1i(this.uniforms["shadowMapCascade"], this.resourceCache.getUniformData("shadowMapCascade") as number | undefined ?? 0);
        this.gl.drawElements(this.gl.LINES, cubeWireframeIndices.length, this.gl.UNSIGNED_INT, 0);
        this.gl.bindVertexArray(null);
    }
}