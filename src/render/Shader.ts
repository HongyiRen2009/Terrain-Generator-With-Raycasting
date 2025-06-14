import { GlUtils } from "./GlUtils";

export class Shader {
  VertexShaderCode: string;
  FragmentShaderCode: string;
  VertexInputs: {
    [key: string]: {
      type: string;
      size: number;
      location: number;
    };
  };
  VertexUniforms: {
    [key: string]: {
      type: string;
      location: WebGLUniformLocation;
    };
  };

  Program: WebGLProgram | undefined;
  constructor(
    gl: WebGL2RenderingContext,
    VertexShaderCode: string,
    FragmentShaderCode: string
  ) {
    this.VertexShaderCode = VertexShaderCode;
    this.FragmentShaderCode = FragmentShaderCode;
    this.Program = GlUtils.CreateProgram(
      gl,
      VertexShaderCode,
      FragmentShaderCode
    );
    if (!this.Program) {
      throw new Error("Error creating shader program");
    }
    const VertexVariables = this.extractShaderVariables(
      gl,
      VertexShaderCode,
      this.Program
    );
    this.VertexInputs = VertexVariables[0];
    this.VertexUniforms = VertexVariables[1];
  }
  extractShaderVariables(
    gl: WebGL2RenderingContext,
    shaderCode: string,
    program: WebGLProgram
  ): [
    { [key: string]: { type: string; size: number, location: number } },
    { [key: string]: { type: string; location: WebGLUniformLocation } }
  ] {
    const inputPattern = /in\s+(\w+)\s+(\w+);/g;
    const uniformPattern = /uniform\s+(\w+)\s+(\w+);/g;

    const inputs: { [key: string]: { type: string; size: number, location: number } } = {};
    const uniforms: {
      [key: string]: { type: string; location: WebGLUniformLocation };
    } = {};

    let match;

    // Extract inputs
    while ((match = inputPattern.exec(shaderCode)) !== null) {
      const location = gl.getAttribLocation(program, match[2]);
      if (location === -1) {
        console.error(`Attribute ${match[2]} not found in shader program.`);
        continue;
      }
      inputs[match[2]] = { type: match[1], size: this.glslTypeToSize(match[1]), location: location };
    }

    // Extract uniforms
    while ((match = uniformPattern.exec(shaderCode)) !== null) {
      const location = gl.getUniformLocation(program, match[2]);
      if (location === null) {
        console.error(`Uniform ${match[2]} not found in shader program.`);
        continue;
      }
      uniforms[match[2]] = { type: match[1], location: location };
    }
    return [inputs, uniforms];
  }
  // Method to get the size of a GLSL type
  private glslTypeToSize(type: string): number {
  switch (type) {
    case "float": return 1;
    case "vec2": return 2;
    case "vec3": return 3;
    case "vec4": return 4;
    default: throw new Error(`Unsupported GLSL type: ${type}`);
    }
  }

}
