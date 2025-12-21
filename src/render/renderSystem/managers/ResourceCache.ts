export class ResourceCache {
  private uniformsCache: Map<string, any>;
  private warnedKeys: Set<string>; // Track which keys we've already warned about

  constructor(gl: WebGL2RenderingContext) {
    this.uniformsCache = new Map();
    this.warnedKeys = new Set();
  }

  public getData(key: string, warnIfMissing: boolean = true) {
    if (warnIfMissing && !this.uniformsCache.has(key) && !this.warnedKeys.has(key)) {
      this.warnedKeys.add(key);
      const availableKeys = Array.from(this.uniformsCache.keys()).join(", ") || "none";
      console.warn(`[ResourceCache] Uniform data key "${key}" not found in cache. Available keys: ${availableKeys}`);
    }
    return this.uniformsCache.get(key);
  }

  public setData(key: string, value: any) {
    this.uniformsCache.set(key, value);
  }
}

export function getUniformLocations(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: string[]
) {
  const locations: { [key: string]: WebGLUniformLocation } = {};
  for (const name of names) {
    const loc = gl.getUniformLocation(program, name);
    if (loc !== null) locations[name] = loc;
  }
  return locations;
}
