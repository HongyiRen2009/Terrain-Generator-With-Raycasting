import noiseShaderCode from "./noise.wgsl";

export class ComputeShader {
  device: GPUDevice = null!;
  adapter: GPUAdapter = null!;

  constructor() {
    this.init();
  }

  async init() {
    if (!navigator.gpu) {
      throw new Error("WebGPU is not supported on this browser.");
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("WebGPU adapter is not available.");
    }
    this.adapter = adapter;
    this.device = await this.adapter.requestDevice();
    if (!this.device) {
      throw new Error("WebGPU is not supported on this browser.");
    }
  }

  async createPerlinNoise3D(
    width: number,
    height: number,
    depth: number,
    seed: number = 0,
    baseX: number = 0,
    baseY: number = 0,
    baseZ: number = 0
  ) {
    if (!this.device) {
      await this.init();
    }

    const fieldSize = width * height * depth * 4; // 4 bytes per f32

    // Create storage buffer for noise field
    const fieldBuffer = this.device.createBuffer({
      size: fieldSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true
    });
    new Float32Array(fieldBuffer.getMappedRange()).fill(0);
    fieldBuffer.unmap();

    // Create uniform buffer for parameters (7 u32s = 28 bytes)
    const paramsBuffer = this.device.createBuffer({
      size: 28,
      usage: GPUBufferUsage.UNIFORM,
      mappedAtCreation: true
    });
    new Uint32Array(paramsBuffer.getMappedRange()).set([
      seed,
      width,
      height,
      depth,
      baseX,
      baseY,
      baseZ
    ]);
    paramsBuffer.unmap();

    // Create shader module
    const shaderModule = this.device.createShaderModule({
      code: noiseShaderCode
    });

    // Create bind group layout
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" }
        }
      ]
    });

    // Create bind group
    const bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: fieldBuffer } },
        { binding: 1, resource: { buffer: paramsBuffer } }
      ]
    });

    // Create compute pipeline
    const pipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
      }),
      compute: { module: shaderModule, entryPoint: "main" }
    });

    // Create command encoder and compute pass
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(
      Math.ceil(width / 4),
      Math.ceil(height / 4),
      Math.ceil(depth / 4)
    );
    passEncoder.end();

    // Submit the command buffer
    this.device.queue.submit([commandEncoder.finish()]);
    // Visualization: show the middle slice by default
    await this.visualizeNoiseField(
      document.getElementById("noisePreview") as HTMLCanvasElement,
      fieldBuffer,
      width,
      height,
      Math.floor(depth / 2)
    );
    return fieldBuffer;
  }

  async visualizeNoiseField(
    canvas: HTMLCanvasElement,
    fieldBuffer: GPUBuffer,
    width: number,
    height: number,
    slice: number // z-index of the slice to visualize
  ) {
    if (!this.device) {
      await this.init();
    }
    const imageData = new ImageData(width, height);
    const readBuffer = this.device.createBuffer({
      size: width * height * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    // Copy only the selected slice from the 3D field
    const offset = slice * width * height * 4;
    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(
      fieldBuffer,
      offset,
      readBuffer,
      0,
      width * height * 4
    );
    this.device.queue.submit([commandEncoder.finish()]);
    await readBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = readBuffer.getMappedRange();
    const data = new Float32Array(arrayBuffer);

    // Scale up to canvas size
    const ctx = canvas.getContext("2d")!;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const scaleX = canvasWidth / width;
    const scaleY = canvasHeight / height;

    // Create scaled image data
    const scaledImage = ctx.createImageData(canvasWidth, canvasHeight);
    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        // Nearest neighbor sampling
        const srcX = Math.floor(x / scaleX);
        const srcY = Math.floor(y / scaleY);
        const srcIdx = srcY * width + srcX;
        const value = Math.floor(((data[srcIdx] + 1) / 2) * 255);
        const dstIdx = (y * canvasWidth + x) * 4;
        scaledImage.data[dstIdx + 0] = value;
        scaledImage.data[dstIdx + 1] = value;
        scaledImage.data[dstIdx + 2] = value;
        scaledImage.data[dstIdx + 3] = 255;
      }
    }
    ctx.putImageData(scaledImage, 0, 0);
    readBuffer.unmap();
  }
}
