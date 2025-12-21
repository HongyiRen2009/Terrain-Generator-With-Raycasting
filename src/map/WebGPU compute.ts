import noiseShaderCode from "./noise.wgsl";
import marchingCubesCode from "./marching_cubes.wgsl";
import prefixSumShaderCode from "./prefix_sum.wgsl";
import prefixSumChunkCode from "./prefix_sum_chunk.wgsl";
import prefixSumScanBlocksCode from "./prefix_sum_scan_blocks.wgsl";
import prefixSumUniformAddCode from "./prefix_sum_uniform_add.wgsl";
import calcVertexCountCode from "./calc_vertex_count.wgsl";
import { CASES } from "./geometry";
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
  async readFieldBuffer(
    fieldBuffer: GPUBuffer,
    width: number,
    height: number,
    depth: number
  ): Promise<Float32Array> {
    const size = width * height * depth * 4;
    const readBuffer = this.device.createBuffer({
      size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(fieldBuffer, 0, readBuffer, 0, size);
    this.device.queue.submit([commandEncoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = readBuffer.getMappedRange();
    const floatArray = new Float32Array(arrayBuffer.slice(0));
    readBuffer.unmap();
    return floatArray;
  }
  async readVectorBuffer(
    vectorBuffer: GPUBuffer,
    elementCount: number
  ): Promise<Float32Array> {
    const size = elementCount * 4;
    const readBuffer = this.device.createBuffer({
      size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(vectorBuffer, 0, readBuffer, 0, size);
    this.device.queue.submit([commandEncoder.finish()]);
    await readBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = readBuffer.getMappedRange();
    const floatArray = new Float32Array(arrayBuffer.slice(0));
    readBuffer.unmap();
    return floatArray;
  }
  async readUintBuffer(
    uintBuffer: GPUBuffer,
    elementCount: number
  ): Promise<Uint32Array> {
    const size = elementCount * 4;
    const readBuffer = this.device.createBuffer({
      size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(uintBuffer, 0, readBuffer, 0, size);
    this.device.queue.submit([commandEncoder.finish()]);
    await readBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = readBuffer.getMappedRange();
    const uintArray = new Uint32Array(arrayBuffer.slice(0));
    readBuffer.unmap();
    return uintArray;
  }
  async readUint(uint: GPUBuffer): Promise<number> {
    const readBuffer = this.device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(uint, 0, readBuffer, 0, 4);
    this.device.queue.submit([commandEncoder.finish()]);
    await readBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = readBuffer.getMappedRange();
    const value = new Uint32Array(arrayBuffer.slice(0))[0];
    readBuffer.unmap();
    return value;
  }
  /**
   * Reads a single uint32 value from a GPUBuffer at the given index.
   */
  async readUintAt(buffer: GPUBuffer, index: number): Promise<number> {
    const readBuffer = this.device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(buffer, index * 4, readBuffer, 0, 4);
    this.device.queue.submit([commandEncoder.finish()]);
    await readBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = readBuffer.getMappedRange();
    const value = new Uint32Array(arrayBuffer)[0];
    readBuffer.unmap();
    return value;
  }

  /**
   * Reads the total vertex and index count from marching cubes buffers.
   * Returns { vertexCount, indexCount }
   */
  async getMarchingCubesCounts(
    prefixSumBuffer: GPUBuffer,
    vertexCountsBuffer: GPUBuffer,
    width: number,
    height: number,
    depth: number
  ): Promise<{ vertexCount: number; indexCount: number }> {
    const numVoxels = (width - 1) * (height - 1) * (depth - 1);
    const lastIdx = numVoxels - 1;
    const lastPrefix = await this.readUintAt(prefixSumBuffer, lastIdx);
    const lastCount = await this.readUintAt(vertexCountsBuffer, lastIdx);
    const vertexCount = lastPrefix + lastCount;
    const indexCount = vertexCount; // or (vertexCount / 3) * 3 if always triangles
    return { vertexCount, indexCount };
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

  // Update createMarchingCubes to use this encoder
  async createMarchingCubes(
    fieldBuffer: GPUBuffer,
    width: number,
    height: number,
    depth: number
  ) {
    if (!this.device) {
      await this.init();
    }

    const vertexCountsBuffer = await this.computeVertexCount(
      fieldBuffer,
      width,
      height,
      depth
    );
    const counts = await this.readUintBuffer(
      vertexCountsBuffer,
      (width - 1) * (height - 1) * (depth - 1)
    );
    const testArray = new Float32Array(163840);
    for (let i = 0; i < testArray.length; i++) {
      testArray[i] = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 10);
    }
    const vertexOffsetsBuffer = await this.computePrefixSum(
      vertexCountsBuffer,
      (width - 1) * (height - 1) * (depth - 1)
    );
    const offsets = await this.readUintBuffer(
      vertexOffsetsBuffer,
      (width - 1) * (height - 1) * (depth - 1)
    );
    // Create params buffer
    const paramsBuffer = this.device.createBuffer({
      size: 12, // 3 u32s
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Uint32Array(paramsBuffer.getMappedRange()).set([width, height, depth]);
    paramsBuffer.unmap();
    const vertexCountData = await this.getMarchingCubesCounts(
      vertexOffsetsBuffer,
      vertexCountsBuffer,
      width,
      height,
      depth
    );
    const maxVertices = vertexCountData.vertexCount;
    const maxIndices = vertexCountData.indexCount;

    // Create vertex data buffer
    const vertexBuffer = this.device.createBuffer({
      size: maxVertices * 16, // vec3<f32> = 12 bytes
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true
    });
    new Float32Array(vertexBuffer.getMappedRange()).fill(0);
    vertexBuffer.unmap();

    // Create index data buffer
    const indexBuffer = this.device.createBuffer({
      size: maxIndices * 4, // u32 = 4 bytes
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true
    });
    new Uint32Array(indexBuffer.getMappedRange()).fill(0);
    indexBuffer.unmap();
    const normalsBuffer = this.device.createBuffer({
      size: maxVertices * 16, // vec3<f32> = 12 bytes
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true
    });
    new Float32Array(normalsBuffer.getMappedRange()).fill(0);
    normalsBuffer.unmap();
    const terrainTypeBuffer = this.device.createBuffer({
      size: maxVertices * 4, // u32 = 4 bytes
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true
    });
    new Uint32Array(terrainTypeBuffer.getMappedRange()).fill(0);
    terrainTypeBuffer.unmap();
    // Create shader module
    const shaderModule = this.device.createShaderModule({
      code: marchingCubesCode
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
          buffer: { type: "storage" }
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }
        },
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }
        },
        {
          binding: 5,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }
        },
        {
          binding: 6,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }
        }
      ]
    });

    // Create bind group
    const bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: vertexBuffer } },
        { binding: 1, resource: { buffer: indexBuffer } },
        { binding: 2, resource: { buffer: fieldBuffer } },
        { binding: 3, resource: { buffer: paramsBuffer } },
        { binding: 4, resource: { buffer: vertexOffsetsBuffer } },
        { binding: 5, resource: { buffer: normalsBuffer } },
        { binding: 6, resource: { buffer: terrainTypeBuffer } }
      ]
    });

    // Create and run compute pipeline
    const pipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
      }),
      compute: { module: shaderModule, entryPoint: "main" }
    });

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

    this.device.queue.submit([commandEncoder.finish()]);
    return {
      vertexBuffer,
      indexBuffer,
      normalsBuffer,
      terrainTypeBuffer,
      vertexCount: vertexCountData.vertexCount,
      indexCount: vertexCountData.indexCount
    };
  }
  async computeVertexCount(
    fieldBuffer: GPUBuffer,
    width: number,
    height: number,
    depth: number
  ): Promise<GPUBuffer> {
    if (!this.device) {
      await this.init();
    }
    const numVoxels = (width - 1) * (height - 1) * (depth - 1);
    // Create params buffer
    const paramsBuffer = this.device.createBuffer({
      size: 12, // 3 u32s
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Uint32Array(paramsBuffer.getMappedRange()).set([width, height, depth]);
    paramsBuffer.unmap();
    // Create vertex count buffer
    const vertexCountBuffer = this.device.createBuffer({
      size: numVoxels * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true
    });
    new Uint32Array(vertexCountBuffer.getMappedRange()).fill(0);
    vertexCountBuffer.unmap();
    // Create shader module
    const shaderModule = this.device.createShaderModule({
      code: calcVertexCountCode
    });

    // Create bind group layout
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }
        }
      ]
    });
    // Create bind group
    const bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: fieldBuffer } },
        { binding: 1, resource: { buffer: paramsBuffer } },
        { binding: 2, resource: { buffer: vertexCountBuffer } }
      ]
    });
    // Create and run compute pipeline
    const pipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
      }),
      compute: { module: shaderModule, entryPoint: "main" }
    });

    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(
      Math.ceil((width - 1) / 4),
      Math.ceil((height - 1) / 4),
      Math.ceil((depth - 1) / 4)
    );
    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
    return vertexCountBuffer;
  }
  async computePrefixSum(
    inputBuffer: GPUBuffer,
    elementCount: number
  ): Promise<GPUBuffer> {
    if (!this.device) {
      await this.init();
    }
    const pass1ShaderModule = this.device.createShaderModule({
      code: prefixSumChunkCode
    });
    const pass2ShaderModule = this.device.createShaderModule({
      code: prefixSumScanBlocksCode
    });
    const pass3ShaderModule = this.device.createShaderModule({
      code: prefixSumUniformAddCode
    });

    const pass1UniformBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }
        }
      ]
    });

    const pass2UniformBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {}
        }
      ]
    });

    const pass3UniformBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }
        }
      ]
    });

    const chunkCount = Math.ceil(elementCount / 512);

    // get nearest power of 2 for chunkCount
    let powerOf2 = 1;
    while (powerOf2 < chunkCount) {
      powerOf2 *= 2;
    }

    /*     const inputArrayBuffer = this.createGPUBuffer(
      new Float32Array(input),
      GPUBufferUsage.STORAGE
    );
    const outputArrayBuffer = this.createGPUBuffer(
      new Float32Array(input),
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    );
    const readOutputArrayBuffer = this.createGPUBuffer(
      new Float32Array(input),
      GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    ); */
    const inputArrayBuffer = inputBuffer;
    const outputArrayBuffer = this.copyGPUBuffer(
      inputBuffer,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    );
    const sumArrayBuffer = this.createGPUBuffer(
      new Uint32Array(powerOf2),
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    );
    const outputSumArrayBuffer = this.createGPUBuffer(
      new Uint32Array(powerOf2),
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    );

    const sumSizeBuffer = this.createGPUBuffer(
      new Uint32Array([powerOf2]),
      GPUBufferUsage.UNIFORM
    );

    const pass1UniformBindGroup = this.device.createBindGroup({
      layout: pass1UniformBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: inputArrayBuffer
          }
        },
        {
          binding: 1,
          resource: {
            buffer: outputArrayBuffer
          }
        },
        {
          binding: 2,
          resource: {
            buffer: sumArrayBuffer
          }
        }
      ]
    });

    const pass2UniformBindGroup = this.device.createBindGroup({
      layout: pass2UniformBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: sumArrayBuffer
          }
        },
        {
          binding: 1,
          resource: {
            buffer: outputSumArrayBuffer
          }
        },
        {
          binding: 2,
          resource: {
            buffer: sumSizeBuffer
          }
        }
      ]
    });

    const pass3UniformBindGroup = this.device.createBindGroup({
      layout: pass3UniformBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: outputArrayBuffer
          }
        },
        {
          binding: 1,
          resource: {
            buffer: outputSumArrayBuffer
          }
        }
      ]
    });

    const pass1Pipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [pass1UniformBindGroupLayout]
      }),
      compute: {
        module: pass1ShaderModule,
        entryPoint: "main"
      }
    });

    const pass2Pipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [pass2UniformBindGroupLayout]
      }),
      compute: {
        module: pass2ShaderModule,
        entryPoint: "main"
      }
    });

    const pass3Pipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [pass3UniformBindGroupLayout]
      }),
      compute: {
        module: pass3ShaderModule,
        entryPoint: "main"
      }
    });

    const computePassDescriptor = {};

    const commandEncoder = this.device.createCommandEncoder();

    const passEncoder1 = commandEncoder.beginComputePass(computePassDescriptor);
    passEncoder1.setPipeline(pass1Pipeline);
    passEncoder1.setBindGroup(0, pass1UniformBindGroup);
    passEncoder1.dispatchWorkgroups(chunkCount);
    passEncoder1.end();

    const passEncoder2 = commandEncoder.beginComputePass(computePassDescriptor);
    passEncoder2.setPipeline(pass2Pipeline);
    passEncoder2.setBindGroup(0, pass2UniformBindGroup);
    passEncoder2.dispatchWorkgroups(1);
    passEncoder2.end();

    const passEncoder3 = commandEncoder.beginComputePass(computePassDescriptor);
    passEncoder3.setPipeline(pass3Pipeline);
    passEncoder3.setBindGroup(0, pass3UniformBindGroup);
    passEncoder3.dispatchWorkgroups(chunkCount);
    passEncoder3.end();

    this.device.queue.submit([commandEncoder.finish()]);
    return outputArrayBuffer;
  }
  copyGPUBuffer(
    source: GPUBuffer,
    usage: GPUBufferUsageFlags = GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST
  ): GPUBuffer {
    const buffer = this.device.createBuffer({
      size: source.size,
      usage
    });
    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(source, 0, buffer, 0, source.size);
    this.device.queue.submit([commandEncoder.finish()]);
    return buffer;
  }
  createGPUBuffer(
    array: Float32Array | Uint32Array,
    usage: GPUBufferUsageFlags
  ): GPUBuffer {
    const buffer = this.device.createBuffer({
      size: array.byteLength,
      usage,
      mappedAtCreation: true
    });
    const mapping = buffer.getMappedRange();
    if (array instanceof Float32Array) {
      new Float32Array(mapping).set(array);
    } else if (array instanceof Uint32Array) {
      new Uint32Array(mapping).set(array);
    }
    buffer.unmap();
    return buffer;
  }
  async createBufferFromArray(
    array: Float32Array | Uint32Array,
    usage: GPUBufferUsageFlags
  ): Promise<GPUBuffer> {
    if (!this.device) {
      await this.init();
    }
    const buffer = this.device.createBuffer({
      size: array.byteLength,
      usage,
      mappedAtCreation: true
    });
    const mapping = buffer.getMappedRange();
    if (array instanceof Float32Array) {
      new Float32Array(mapping).set(array);
    } else if (array instanceof Uint32Array) {
      new Uint32Array(mapping).set(array);
    }
    buffer.unmap();
    return buffer;
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
