import { ResourceCache } from "../render/renderSystem/managers/UniformsManager";
import { VaoInfo } from "../render/renderSystem/managers/VaoManager";
import { RenderGraph } from "../render/renderSystem/RenderGraph";
import { RenderPass } from "../render/renderSystem/RenderPass";
import { RenderTarget } from "../render/renderSystem/RenderTarget";

export class PathtracingPass extends RenderPass {
    constructor(gl: WebGL2RenderingContext, resourceCache: ResourceCache, canvas: HTMLCanvasElement, renderGraph?: RenderGraph) {
        super(gl, resourceCache, canvas, renderGraph);
        
    }
    protected initRenderTarget(width?: number, height?: number): RenderTarget {
        return { fbo: [], textures: {} }
    }

    public render(vao_info: VaoInfo | VaoInfo[]): void {
        
    }

    public resize(width: number, height: number): void {
        
    }
}