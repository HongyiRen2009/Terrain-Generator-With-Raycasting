import { mat4, vec3 } from "gl-matrix";
import { RenderUtils } from "../utils/RenderUtils";
import { Mesh } from "./Mesh";

export type WorldObject = {
  buffer: ReturnType<typeof RenderUtils.CreateStaticBuffer>;
  position: mat4;
  meshSize: number;
  id: number;
  mesh: Mesh;
  name: string;
  // Cached transformed mesh - only recomputed when transform changes
  _cachedTransformedMesh?: Mesh;
  _cachedTransformHash?: string;
  // Cached mesh center - calculated once for rotation/scale pivot
  _cachedMeshCenter?: vec3;
};
