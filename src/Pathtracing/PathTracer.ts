// Ik this code is a lot of repeat from code in other places, but I do have some things I plan on doing which would make me using the other code less desirable for this purpose

import { vec3 } from "gl-matrix";
import { WorldMap } from "../map/Map";
import { Chunk } from "../map/marching_cubes";
import { BVHTriangle, flatBVHNode, Mesh, Triangle } from "../map/Mesh";
import { Camera } from "../render/Camera";
import { MeshVertexShaderCode, MeshFragmentShaderCode } from "../render/glsl";
import { GlUtils, WireFrameCube } from "../render/GlUtils";
import { GLRenderer } from "../render/GLRenderer";
import { DebugMenu } from "../DebugMenu";
import { Terrains } from "../map/terrains";

export class PathTracer{
    //Rendering
    private canvas: HTMLCanvasElement;
    private gl: WebGL2RenderingContext;
    private WireFrameCubes: WireFrameCube[]
    private vertices: Float32Array;
    private terrains: Float32Array;
    private boundingBoxes: Float32Array;
    private nodes: Float32Array;
    private leafs: Float32Array;
    private terrainTypes: Float32Array;

    //Shaders
    /* //Currently bottom code is irrelevant and does not to be used
    private vertexShader: WebGLShader;
    private fragmentShader: WebGLShader;
    private resolutionLock: WebGLUniformLocation;
    private timeLock: WebGLUniformLocation;*/

    //Classes
    private world: WorldMap;
    private camera: Camera;
    private rayRender: GLRenderer;
    private debug: DebugMenu;

    public constructor(canvas: HTMLCanvasElement, context: WebGL2RenderingContext, world: WorldMap, camera: Camera, rayRender: GLRenderer, debug: DebugMenu){
        this.canvas = canvas;
        this.gl = context;
        this.world = world;
        this.camera = camera;
        this.rayRender = rayRender;
        this.debug = debug;

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
        //Pack BVH
        const {boundingBoxes, nodes, leafs} = this.packBVH(flatBVHtree);
        console.log(boundingBoxes);
        console.log(nodes);
        console.log(leafs);
        //Pack terrain Types
        const terrainTypes = this.packTerrainTypes();
        console.log(terrainTypes);
        //save
        this.vertices = vertices;
        this.terrains = terrains;
        this.boundingBoxes = boundingBoxes;
        this.nodes = nodes;
        this.leafs = leafs;
        this.terrainTypes = terrainTypes;
    }

    public render(time: number){
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // Clear the color buffer with specified clear color
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        const resScaleFactor = 1 / (this.world.resolution / 4);
        this.drawWireframe(resScaleFactor);
    }

    public drawWireframe(resScaleFactor: number){
        if (this.debug.debugMode) {
            this.rayRender.matViewProj = this.camera.calculateProjectionMatrix(
                this.canvas.width,
                this.canvas.height
            );
            for (const cube of this.WireFrameCubes) {
                this.rayRender.DrawWireFrameCube(
                    GlUtils.CreateTransformations(
                        undefined,
                        undefined,
                        vec3.fromValues(resScaleFactor, resScaleFactor, resScaleFactor)
                    ),
                    cube
                );
            }
        }
    }

    


    /////////////////////////////// Packing BVH
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

    /**
     * Packs flatten BVH to F32 format to be sent to glsl.
     * For how this works @see packTriangles
     * @param BVH 
     */
    public packBVH(BVH: flatBVHNode[]){
        let floatsPerTexel = 4 //See thing in packTriangles Method
        let boundingBoxes = new Float32Array(Math.ceil(BVH.length*6/floatsPerTexel)*floatsPerTexel);
        let nodes = new Float32Array(Math.ceil(BVH.length*2/floatsPerTexel)*floatsPerTexel);
        let leafs = new Float32Array(Math.ceil(BVH.length*4/floatsPerTexel)*floatsPerTexel);
        for(let i = 0; i < BVH.length; i++){
            for(let j = 0; j < 3; j++){
                boundingBoxes[i*6+j] = BVH[i].boundingBoxMin[j];
                boundingBoxes[i*6+3+j] = BVH[i].boundingBoxMax[j];
            }
            nodes[i*2] = BVH[i].left;
            nodes[i*2+1] = BVH[i].right;
            
            leafs[i*4] = BVH[i].t1;
            leafs[i*4+1] = BVH[i].t2;
            leafs[i*4+2] = BVH[i].t3;
            leafs[i*4+3] = BVH[i].t4;
        }
        return{
            boundingBoxes,
            nodes,
            leafs,
        }
    }

    public packTerrainTypes(){
        let floatsPerTexel = 4;
        let numberTerrains = 3;
        let out = new Float32Array(Math.ceil(numberTerrains*5/floatsPerTexel)*floatsPerTexel); //r,g,b,illuminosity, reflectiveness
        let i = 0;
        for(const key in Terrains){
            let terrain = Terrains[key];
            out[i*5] = terrain.color.r;
            out[i*5+1] = terrain.color.g;
            out[i*5+2] = terrain.color.b;
            out[i*5+3] = terrain.illuminosity;
            out[i*5+4] = terrain.reflectiveness;
            i++;
        }
        return out;
    }
}