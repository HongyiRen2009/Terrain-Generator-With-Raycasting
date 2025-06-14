import { GlUtils } from "./GlUtils";

export class Shader {
  VertexShaderCode: string;
  FragmentShaderCode: string;
  VertexInputs: {
    [key: string]: {
      type: string;
      location: number;
    };
  };
  VertexUniforms: {
    [key: string]: {
      type: string;
      location: WebGLUniformLocation;
    };
  };
  /* FragmentInputs: {
    [key: string]: {
      type: string;
      location: number;
    };
  };
  FragmentUniforms: {
    [key: string]: {
      type: string;
      location: WebGLUniformLocation;
    };
  }; */
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

    /* const FragmentVariables = this.extractShaderVariables(
      gl,
      FragmentShaderCode,
      this.Program
    );
    this.FragmentInputs = FragmentVariables[0];
    this.FragmentUniforms = FragmentVariables[1]; */
    // Don't actually know if fragment shader inputs are needed
  }
  extractShaderVariables(
    gl: WebGL2RenderingContext,
    shaderCode: string,
    program: WebGLProgram
  ): [
    { [key: string]: { type: string; location: number } },
    { [key: string]: { type: string; location: WebGLUniformLocation } }
  ] {
    const inputPattern = /in\s+(\w+)\s+(\w+);/g;
    const uniformPattern = /uniform\s+(\w+)\s+(\w+);/g;

    const inputs: { [key: string]: { type: string; location: number } } = {};
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
      inputs[match[2]] = { type: match[1], location: location };
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
}
