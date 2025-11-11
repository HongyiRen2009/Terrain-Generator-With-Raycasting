import { RenderPass } from "./RenderPass";
type TextureMap = { [key: string]: WebGLTexture };
export class RenderGraph {
  private roots: Set<RenderPass>;
  private dependencies: Map<RenderPass, Set<RenderPass>>;
  private children: Map<RenderPass, Set<RenderPass>>;

  constructor() {
    this.roots = new Set();
    this.dependencies = new Map();
    this.children = new Map();
  }

  /**
   * Add a root pass that has no dependencies
   */
  addRoot(pass: RenderPass): void {
    this.roots.add(pass);
    if (!this.dependencies.has(pass)) {
      this.dependencies.set(pass, new Set());
    }
    if (!this.children.has(pass)) {
      this.children.set(pass, new Set());
    }
  }

  /**
   * Add a pass that depends on one or more parent passes
   */
  add(childPass: RenderPass, ...parentPasses: RenderPass[]): void {
    if (!this.dependencies.has(childPass)) {
      this.dependencies.set(childPass, new Set());
    }
    if (!this.children.has(childPass)) {
      this.children.set(childPass, new Set());
    }

    for (const parent of parentPasses) {
      this.dependencies.get(childPass)!.add(parent);

      if (!this.children.has(parent)) {
        this.children.set(parent, new Set());
      }
      this.children.get(parent)!.add(childPass);
    }
  }

  /**
   * Get all passes in topologically sorted order
   */
  getSortedPasses(): RenderPass[] {
    const sorted: RenderPass[] = [];
    const visited = new Set<RenderPass>();
    const temp = new Set<RenderPass>();

    const visit = (pass: RenderPass): void => {
      if (temp.has(pass)) {
        throw new Error("Circular dependency detected in render graph");
      }
      if (visited.has(pass)) {
        return;
      }

      temp.add(pass);
      const deps = this.dependencies.get(pass) || new Set();
      deps.forEach(visit);
      temp.delete(pass);
      visited.add(pass);
      sorted.push(pass);
    };

    // Visit all roots first
    this.roots.forEach(visit);

    // Visit any remaining passes (shouldn't happen in well-formed graph)
    this.dependencies.forEach((_, pass) => {
      if (!visited.has(pass)) visit(pass);
    });

    return sorted;
  }
  getUnmergedOutputs(renderPass: RenderPass): { [passId: string]: TextureMap } {
    const deps = this.dependencies.get(renderPass);
    const outputObj: { [passId: string]: TextureMap } = {};
    if (!deps || deps.size === 0) {
      return outputObj;
    }
    deps.forEach((pass) => {
      const passTextures = pass.getRenderTarget()?.textures;
      if (passTextures) {
        outputObj[pass.name!] = passTextures; // assuming pass has an 'id' property
      }
    });
    return outputObj;
  }
  getOutputs(renderPass: RenderPass): { [key: string]: WebGLTexture } {
    const deps = this.dependencies.get(renderPass);
    if (!deps || deps.size === 0) {
      return {} as TextureMap;
    }

    // Merge texture dictionaries from all dependencies
    const mergedTextures: TextureMap = {};
    deps.forEach((pass) => {
      const passTextures = pass.getRenderTarget()?.textures;
      if (passTextures) {
        Object.assign(mergedTextures, passTextures);
      }
    });
    return mergedTextures;
  }

  getRoots(): RenderPass[] {
    return Array.from(this.roots);
  }

  /** Get a pass by its name */
  getPass(name: string): RenderPass | undefined {
    for (const pass of Array.from(this.dependencies.keys())) {
      if (pass.name === name) return pass;
    }
    for (const pass of Array.from(this.roots.keys())) {
      if (pass.name === name) return pass;
    }
    return undefined;
  }
}
