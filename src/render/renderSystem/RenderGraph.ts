import { RenderPass } from "./RenderPass";
import { RenderTarget } from "./RenderTarget";

export class RenderGraph {
    private passes: Map<RenderPass, RenderPass[]>;
    constructor() {
        this.passes = new Map();
    }
    add(prevPass: RenderPass, nextPass: RenderPass): void {
        if (!this.passes.has(nextPass)) {
            this.passes.set(nextPass, []);
        }
        this.passes.get(nextPass)!.push(prevPass);
    }
    getOutputs(renderPass: RenderPass): { [key: string]: WebGLTexture } {
        const prevPasses = this.passes.get(renderPass);
        if (!prevPasses) {
            throw new Error("No outputs found for render pass");
        }
        // Merge texture dictionaries from all previous passes
        const mergedTextures: { [key: string]: WebGLTexture } = {};
        for (const pass of prevPasses) {
            const passTextures = pass.getRenderTarget()!.textures!;
            Object.assign(mergedTextures, passTextures);
        }
        return mergedTextures;
    }
}