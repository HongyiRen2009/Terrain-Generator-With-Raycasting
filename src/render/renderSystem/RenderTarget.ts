export interface RenderTarget {
    fbo: WebGLFramebuffer | null;
    textures: { [key: string]: WebGLTexture } | null;
}