import { mat4 } from "gl-matrix";
import { GlUtils } from "../render/GlUtils";
import { Shader } from "../render/Shader";

export type WorldObject = {
  shader: Shader;
  buffer: ReturnType<typeof GlUtils.CreateStaticBuffer>;
  position: mat4;
  meshSize: number;
};
