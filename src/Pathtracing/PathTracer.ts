// Ik this code is a lot of repeat from code in other places, but I do have some things I plan on doing which would make me using the other code less desirable for this purpose

import { WorldMap } from "../map/Map";
import { Camera } from "../render/Camera";
import { FragmentShaderCode, VertexShaderCode } from "../render/glsl";

export class PathTracer{
    //Rendering
    private canvas: HTMLCanvasElement;
    private context: WebGL2RenderingContext;
    private program: WebGLProgram;
    
    //Shaders
    private vertexShader: WebGLShader;
    private fragmentShader: WebGLShader;
    private resolutionLock: WebGLUniformLocation;
    private timeLock: WebGLUniformLocation;

    //Classes
    private world: WorldMap;
    private camera: Camera;

    public constructor(canvas: HTMLCanvasElement, context: WebGL2RenderingContext, world: WorldMap, camera: Camera){
        this.canvas = canvas;
        this.context = context;
        this.world = world;
        this.camera = camera;
        this.program = this.context.createProgram();
        //Surely this will be fine (it was not)
        this.vertexShader = this.compileShaderType(this.context.VERTEX_SHADER,VertexShaderCode); //this.compileShaderType(this.context.VERTEX_SHADER,"");
        this.fragmentShader = this.compileShaderType(this.context.VERTEX_SHADER,FragmentShaderCode); //this.compileShaderType(this.context.FRAGMENT_SHADER,"");
        //this.linkShaders()

        //quad buffer:
        const quadBuffer = this.context.createBuffer();
        this.context.bindBuffer(this.context.ARRAY_BUFFER, quadBuffer);
        const quadVertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        this.context.bufferData(this.context.ARRAY_BUFFER, quadVertices, this.context.STATIC_DRAW);

        const positionAttrib = this.context.getAttribLocation(this.program, "position");
        this.context.enableVertexAttribArray(positionAttrib);
        this.context.vertexAttribPointer(positionAttrib, 2, this.context.FLOAT, false, 0, 0);

        const a = this.context.getUniformLocation(this.program,"resolution");
        const b = this.context.getUniformLocation(this.program,"time");

        this.resolutionLock = ""; //(a == null ? new WebGLUniformLocation(): a);
        this.timeLock = ""; //(b == null ? new WebGLUniformLocation(): b);
    }

    private compileShaderType(type: number, source: string): WebGLShader {
        const shader = this.context.createShader(type);
        if(shader != null){
            this.context.shaderSource(shader, source);
            this.context.compileShader(shader);
            if (!this.context.getShaderParameter(shader, this.context.COMPILE_STATUS)) {
                console.error("Shader compile error:", this.context.getShaderInfoLog(shader));
                this.context.deleteShader(shader);
                throw new Error("Check Console");
            }
            this.context.VERTEX_SHADER
            return shader;
        }
        throw new Error("YOU SHOULD NOT BE HERE");
    }
    
    private deleteShaders(){
        this.context.deleteShader(this.vertexShader);
        this.context.deleteShader(this.fragmentShader);
    }

    private compileShaders(){
        //TODO: Actually generate shader lol
        this.vertexShader = this.compileShaderType(this.context.VERTEX_SHADER,VertexShaderCode);
        this.fragmentShader = this.compileShaderType(this.context.FRAGMENT_SHADER,FragmentShaderCode);
    }

    private linkShaders(){
        this.context.attachShader(this.program, this.vertexShader);
        this.context.attachShader(this.program, this.fragmentShader);
        this.context.linkProgram(this.program);
        if (!this.context.getProgramParameter(this.program, this.context.LINK_STATUS)) {
            console.error("Shader program linking error:", this.context.getProgramInfoLog(this.program));
        }
        this.context.useProgram(this.program);
    }

    public render(time: number){
        this.context.uniform2f(this.resolutionLock, this.canvas.width, this.canvas.height);
        this.context.uniform1f(this.timeLock, time * 0.001);
        this.context.drawArrays(this.context.TRIANGLE_STRIP, 0, 4);
    }
}