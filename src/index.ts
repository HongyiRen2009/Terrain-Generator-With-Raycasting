function main() {
	const kMainCanvasId = "#MainCanvas";
	const canvas = document.getElementById(kMainCanvasId) as HTMLCanvasElement;
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	// Initialize the GL context
	const gl = canvas.getContext("webgl2");
	gl.viewport(0, 0, canvas.width, canvas.height);
	// Only continue if WebGL is available and working
	if (gl === null) {
		alert(
			"Unable to initialize WebGL. Your browser or machine may not support it."
		);

		return;
	}

	// These coordinates are in clip space, to see a visualization, go to https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection
	const TriangleVertices: readonly number[] = [
		// Top middle
		0.0, 0.5,
		// Bottom Left
		-0.5, -0.5,
		// Botton Right
		0.5, -0.5,
	];
	const TriangleVerticesCpuBuffer: Float32Array = new Float32Array(
		TriangleVertices
	);
	const triangleGeoBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, TriangleVerticesCpuBuffer, gl.STATIC_DRAW);

	const VertexShaderCode = /*glsl*/ `#version 300 es
  precision mediump float;
  
  in vec2 VertexPosition;
  
  
  uniform vec2 CanvasSize;
  uniform vec2 ShapeLocation;
  uniform float ShapeSize;
  
  void main() {  
    vec2 WorldPosition = VertexPosition * ShapeSize + ShapeLocation;
    vec2 ClipPosition = (WorldPosition / CanvasSize);
  
    gl_Position = vec4(ClipPosition, 0.0, 1.0);
  }
  `;

	const FragmentShaderCode = /*glsl*/ `#version 300 es
  precision mediump float;

  out vec4 outputColor;

  void main() {
    outputColor = vec4(0.294, 0.0, 0.51, 1.0);
  }`;

	const TriangleProgram = CreateProgram(
		gl,
		VertexShaderCode,
		FragmentShaderCode
	);
	const VertexPositionAttributeLocation = gl.getAttribLocation(
		TriangleProgram,
		"VertexPosition"
	);
	if (VertexPositionAttributeLocation < 0) {
		console.error(`Failed to get attribute location for VertexPosition`);
		return;
	}
	const CanvasSizeUniformLocation = gl.getUniformLocation(
		TriangleProgram,
		"CanvasSize"
	);
	const ShapeLocationUniformLocation = gl.getUniformLocation(
		TriangleProgram,
		"ShapeLocation"
	);
	const ShapeSizeUniformLocation = gl.getUniformLocation(
		TriangleProgram,
		"ShapeSize"
	);
	if (
		CanvasSizeUniformLocation == null ||
		ShapeLocationUniformLocation == null ||
		ShapeSizeUniformLocation == null
	) {
		console.error(
			`Failed to get Uniform locations:CanvasSizeUniformLocation:${!!CanvasSizeUniformLocation},ShapeLocationUniformLocation:${!!ShapeLocationUniformLocation},ShapeSizeUniformLocation:${!!ShapeSizeUniformLocation}`
		);
	}
	// Set clear color to black, fully opaque
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	// Clear the color buffer with specified clear color
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enableVertexAttribArray(VertexPositionAttributeLocation);
	gl.vertexAttribPointer(
		// index: vertex attrib location
		VertexPositionAttributeLocation,
		// Size: dimensions
		2,
		/* type: type of data in the GPU buffer for this attribute */
		gl.FLOAT,
		/* normalized: if type=float and is writing to a vec(n) float input, should WebGL normalize the ints first? */
		false,
		/* stride: bytes between starting byte of attribute for a vertex and the same attrib for the next vertex */
		2 * Float32Array.BYTES_PER_ELEMENT,
		/* offset: bytes between the start of the buffer and the first byte of the attribute */
		0
	);
	gl.uniform2f(CanvasSizeUniformLocation, canvas.width, canvas.height);
	gl.uniform2f(ShapeLocationUniformLocation, 0, 0);
	gl.uniform1f(ShapeSizeUniformLocation, 100);
	gl.drawArrays(
		gl.TRIANGLES,
		0,
		3 /* Number of Vertices NOT number of triangles */
	);
	gl.uniform2f(ShapeLocationUniformLocation, -200, -100);
	gl.uniform1f(ShapeSizeUniformLocation, 100);
	gl.drawArrays(
		gl.TRIANGLES,
		0,
		3 /* Number of Vertices NOT number of triangles */
	);
}

main();
function CreateProgram(
	gl: WebGL2RenderingContext,
	VertexShaderCode: string,
	FragmentShaderCode: string
) {
	const VertexShader = CreateShader(gl, gl.VERTEX_SHADER, VertexShaderCode);
	const FragmentShader = CreateShader(
		gl,
		gl.FRAGMENT_SHADER,
		FragmentShaderCode
	);
	const Program = gl.createProgram();
	gl.attachShader(Program, VertexShader);
	gl.attachShader(Program, FragmentShader);
	gl.linkProgram(Program);

	if (!gl.getProgramParameter(Program, gl.LINK_STATUS)) {
		const errorMessage = gl.getProgramInfoLog(Program);
		console.error(`Failed to link GPU program: ${errorMessage}`);
		return;
	}
	gl.useProgram(Program);
	return Program;
}
function CreateShader(
	gl: WebGL2RenderingContext,
	ShaderType,
	ShaderCode: string
) {
	const Shader = gl.createShader(ShaderType);
	gl.shaderSource(Shader, ShaderCode);
	gl.compileShader(Shader);
	if (!gl.getShaderParameter(Shader, gl.COMPILE_STATUS)) {
		console.error(
			"Failed to Compile Vertex Shader " + gl.getShaderInfoLog(Shader)
		);
	}
	return Shader;
}
