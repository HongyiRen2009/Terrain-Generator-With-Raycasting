import { mat4 } from "gl-matrix";
import { glUtils } from "../render/utils/GlUtils";
import { Mesh } from "./Mesh";

export type WorldObject = {
  buffer: ReturnType<typeof glUtils.CreateStaticBuffer>;
  position: mat4;
  meshSize: number;
  id: number;
  mesh: Mesh;
  name: string;
};
