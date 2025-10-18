import { mat4 } from "gl-matrix";
import { GlUtils } from "../render/GlUtils";
import { Mesh } from "./Mesh";

export type WorldObject = {
  buffer: ReturnType<typeof GlUtils.CreateStaticBuffer>;
  position: mat4;
  meshSize: number;
  id: number;
  mesh: Mesh;
  name: string;
};
