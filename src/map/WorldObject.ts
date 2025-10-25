import { mat4 } from "gl-matrix";
import { RenderUtils } from "../utils/RenderUtils";
import { Mesh } from "./Mesh";

export type WorldObject = {
  buffer: ReturnType<typeof RenderUtils.CreateStaticBuffer>;
  position: mat4;
  meshSize: number;
  id: number;
  mesh: Mesh;
  name: string;
};
