import { vec3 } from "gl-matrix";
import { createNoise3D, NoiseFunction3D } from "simplex-noise";
import alea from "alea";
import { vertexKey } from "./cubes_utils";

export type WorkerConstructor = new (
  stringUrl: string | URL,
  options?: WorkerOptions
) => Worker;

console.log("Worker started");
self.onmessage = (event: MessageEvent<any>) => {
  console.log("Worker received message", event.data);
  const prng = alea(event.data.Seed);
  const SimplexNoise = createNoise3D(prng);
  const field = new Float32Array(
    (event.data.GridSize[0] + 1) *
      (event.data.GridSize[1] + 1) *
      (event.data.GridSize[2] + 1)
  );
  const fieldMap = new Map<string, number>();
  function chunkCoordinateToIndex(c: vec3): number {
    return (
      c[0] +
      c[1] * (event.data.GridSize[0] + 1) +
      c[2] * (event.data.GridSize[0] + 1) * (event.data.GridSize[1] + 1)
    );
  }
  function noiseFunction(c: vec3): number {
    const frequency = 0.07;
    // returns a value [-1, 1] so we need to remap it to our domain of [0, 1]
    const NoiseValue = SimplexNoise(
      c[0] * frequency,
      c[1] * frequency,
      c[2] * frequency
    );

    const normalizedNoise = (NoiseValue + 1) / 2;

    // Encourage the surface to be closer to the ground
    const heightParameter = 1 / 1.07 ** c[1];

    const floor = +(c[1] == 0);

    return Math.max(normalizedNoise * heightParameter, floor);
  }
  for (let x = 0; x < event.data.GridSize[0] + 1; x++) {
    for (let y = 0; y < event.data.GridSize[1] + 1; y++) {
      for (let z = 0; z < event.data.GridSize[2] + 1; z++) {
        let c = vec3.fromValues(x, y, z);

        const idx = chunkCoordinateToIndex(c);
        vec3.add(
          c,
          c,
          vec3.fromValues(
            event.data.ChunkPosition[0],
            0,
            event.data.ChunkPosition[1]
          )
        );
        const out = noiseFunction(c);
        field[idx] = out;
        fieldMap.set(vertexKey(c), out); // Store the value in the fieldMap with a unique key
      }
    }
  }
  const fieldMapArray = Array.from(fieldMap.entries());
  (self as DedicatedWorkerGlobalScope).postMessage(
    { field, fieldMap: fieldMapArray },
    [field.buffer]
  );
};
