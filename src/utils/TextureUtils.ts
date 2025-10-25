export class TextureUtils {

  /**
   * Binds a given WebGL texture to texture unit 0 and sets the corresponding sampler uniform in the shader program.
   *
   * @param gl - The WebGL2RenderingContext to use for binding.
   * @param program - The WebGLProgram to bind the texture to.
   * @param tex - The WebGLTexture to bind.
   * @param key - The name of the sampler uniform in the shader program to associate with the texture.
   * @param unit - The texture unit to bind the texture to (0-15 for WebGL2).
   *
   * @remarks
   * If the specified uniform cannot be found in the shader program, a warning is logged to the console.
   */
  static bindTex(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    tex: WebGLTexture,
    key: string,
    unit: number
  ) {
    const loc = gl.getUniformLocation(program, key);
    if (loc === null) {
      console.warn(`Cannot find ${key} in fragmentShader`);
      return;
    }
    // Bind to the specified texture unit
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Tell the shader's sampler to use this texture unit
    gl.uniform1i(loc, unit);
  }

  /**
   * Uploads a Float32Array to GPU as a 2D RGBA32F texture.
   * Each texel stores 4 floats (R, G, B, A).
   * (totally not vibecoded)
   * @param gl         - WebGL2RenderingContext
   * @param data       - Float32Array containing your raw float data
   * @param widthHint  - Optional: manual texture width (default auto-calculated)
   * @returns texture: WebGLTexture
   */
  static packFloatArrayToTexture(
    gl: WebGL2RenderingContext,
    data: Float32Array,
    widthHint?: number
  ) {
    if (data.length % 4 !== 0) {
      console.warn(
        `[packFloatArrayToTexture] Padding input from ${data.length} to multiple of 4`
      );
      const padded = new Float32Array(Math.ceil(data.length / 4) * 4);
      padded.set(data);
      data = padded;
    }

    const totalTexels = data.length / 4;

    const width = widthHint || Math.ceil(Math.sqrt(totalTexels));
    const height = Math.ceil(totalTexels / width);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA32F, // Internal format
      width,
      height,
      0,
      gl.RGBA, // Format of incoming data
      gl.FLOAT,
      new Float32Array(width * height * 4).fill(0).map((_, i) => data[i] ?? 0) // Fill/pad if needed
    );

    // NEAREST = no filtering/interpolation
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
  }
  /**
   * Creates and initializes a WebGL 2D texture with the specified parameters.
   *
   * @param gl - The WebGL2 rendering context.
   * @param width - The width of the texture in pixels.
   * @param height - The height of the texture in pixels.
   * @param internalFormat - The internal format of the texture (e.g., `gl.RGBA8`).
   * @param format - The format of the pixel data (e.g., `gl.RGBA`).
   * @param type - The data type of the pixel data (e.g., `gl.UNSIGNED_BYTE`).
   * @param data - Optional. The pixel data to initialize the texture with. If `null`, the texture is initialized with empty data.
   * @returns The created WebGLTexture object.
   */
  static createTexture(
    gl: WebGL2RenderingContext,
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    type: number,
    data: ArrayBufferView | null = null,
    minFilter: number = gl.NEAREST,
    magFilter: number = gl.NEAREST,
    wrapS: number = gl.CLAMP_TO_EDGE,
    wrapT: number = gl.CLAMP_TO_EDGE
  ) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      width,
      height,
      0,
      format,
      type,
      data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
    return texture;
  }
}
