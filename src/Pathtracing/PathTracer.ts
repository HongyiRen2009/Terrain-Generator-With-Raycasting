// Ik this code is a lot of repeat from code in other places, but I do have some things I plan on doing which would make me using the other code less desirable for this purpose

import { vec3 } from "gl-matrix";
import { WorldMap } from "../map/Map";
import { Chunk } from "../map/marching_cubes";
import { BVHTriangle, Mesh, Triangle } from "../map/Mesh";
import { Camera } from "../render/Camera";
import { MeshVertexShaderCode, MeshFragmentShaderCode } from "../render/glsl";
import { GlUtils, WireFrameCube } from "../render/GlUtils";

export class PathTracer{
    //Rendering
    private canvas: HTMLCanvasElement;
    private context: WebGL2RenderingContext;
    private WireFrameCubes: WireFrameCube[]

    //Shaders
    /* //Currently bottom code is irrelevant and does not to be used
    private vertexShader: WebGLShader;
    private fragmentShader: WebGLShader;
    private resolutionLock: WebGLUniformLocation;
    private timeLock: WebGLUniformLocation;*/

    //Classes
    private world: WorldMap;
    private camera: Camera;

    public constructor(canvas: HTMLCanvasElement, context: WebGL2RenderingContext, world: WorldMap, camera: Camera){
        this.canvas = canvas;
        this.context = context;
        this.world = world;
        this.camera = camera;

        ////////////////////// build flat BVH structure
        //Get main mesh
        let mainMesh = new Mesh();
        this.WireFrameCubes = [];
    
        for (const chunk of world.chunks) {
            const triangleMesh = chunk.CreateMarchingCubes();
            triangleMesh.translate(
                vec3.fromValues(chunk.ChunkPosition[0], 0, chunk.ChunkPosition[1])
            );
            mainMesh.merge(triangleMesh);
            this.WireFrameCubes.push(
                GlUtils.createRectangularPrismWireframe(
                    vec3.fromValues(chunk.ChunkPosition[0], 0, chunk.ChunkPosition[1]),
                    vec3.fromValues(world.resolution, world.height, world.resolution)
                )
            );
        }
        //Obtain bvh from mesh.
        const BVHtriangles = mainMesh.exportBVHTriangles();
        const BVHtree = Mesh.exportBVH(BVHtriangles);
        const flatBVHtree = Mesh.flattenBVH(BVHtree);
        console.log(BVHtree);
        console.log(flatBVHtree);

        ////////////// Pack everything float format to send to glsl
        //Pack triangles
        const {vertices, terrains} = this.packTriangles(mainMesh.mesh,mainMesh.type);
        console.log(vertices);
        console.log(terrains);

        /* //Currently bottom code is irrelevant and does not to be used
        //Surely this will be fine (it was not)
        this.vertexShader = this.compileShaderType(this.context.VERTEX_SHADER,MeshVertexShaderCode); //this.compileShaderType(this.context.VERTEX_SHADER,"");
        this.fragmentShader = this.compileShaderType(this.context.VERTEX_SHADER,MeshFragmentShaderCode); //this.compileShaderType(this.context.FRAGMENT_SHADER,"");
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
        this.timeLock = ""; //(b == null ? new WebGLUniformLocation(): b);*/
    }

    public render(time: number){
        /*//Currently bottom code is irrelevant and does not to be used
        this.context.uniform2f(this.resolutionLock, this.canvas.width, this.canvas.height);
        this.context.uniform1f(this.timeLock, time * 0.001);
        */
        this.context.drawArrays(this.context.TRIANGLE_STRIP, 0, 4);
    }

    /**
     * Pack all the triangles into a Float32array(s) which can be passed as a RGBAF32
     * @param tri BVH triangles
     */
    public packTriangles(mesh: Triangle[], types: [number, number, number][]){
        let floatsPerTexel = 4; //Using rgbaf32 format, each texel (or pixel of texture) can hold up to 4 floats
        //Currently only need to pack the vertices and terrain types - Bounding boxes & other attributes don't matter as they will be part of the BVH
        let vertices = new Float32Array(Math.ceil(mesh.length*9/floatsPerTexel)*floatsPerTexel); // Each triangle vertices has 9 attributes (3 vertices, 3 axis)
        let terrains = new Float32Array(Math.ceil(types.length*3/floatsPerTexel)*floatsPerTexel); // 3 vertices each have different terrain values.
        for(let i = 0; i < mesh.length; i++){ //Iterate through triangles
            for(let a = 0; a < mesh[i].length; a++){ //Iterate through vertices in each triangle
                vertices[i*9+3*a] = mesh[i][a][0];
                vertices[i*9+3*a+1] = mesh[i][a][1];
                vertices[i*9+3*a+2] = mesh[i][a][2];

                terrains[i*3+a]=types[i][a];
            }
        }
        return {vertices, terrains};
    }
}