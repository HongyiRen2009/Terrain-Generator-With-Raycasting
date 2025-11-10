export class ResourceCache {
  private uniformsCache: Map<string, any>;

  constructor(gl: WebGL2RenderingContext) {
    this.uniformsCache = new Map();
  }

  public getUniformData(key: string) {
    return this.uniformsCache.get(key);
  }

  public setUniformData(key: string, value: any) {
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
