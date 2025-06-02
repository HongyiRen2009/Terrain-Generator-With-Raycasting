// Ik this code is a lot of repeat from code in other places, but I do have some things I plan on doing which would make me using the other code less desirable for this purpose

import { vec3 } from "gl-matrix";
import { WorldMap } from "../map/Map";
import { flatBVHNode, Mesh, Triangle } from "../map/Mesh";
import { Camera } from "../render/Camera";
import { Shader } from "../render/glsl";
import { GlUtils, WireFrameCube } from "../render/GlUtils";
import { GLRenderer } from "../render/GLRenderer";
import { DebugMenu } from "../DebugMenu";
import { Terrains } from "../map/terrains";
import { pathTracingFragmentShaderCode, pathTracingVertexShaderCode } from "./glslPath";

export class PathTracer{
    //Rendering
    private canvas: HTMLCanvasElement;
    private gl: WebGL2RenderingContext;
    private WireFrameCubes: WireFrameCube[]
    //Shaders
    private shader: Shader;

    //Information
    private vertices: Float32Array;
    private terrains: Float32Array;
    private boundingBoxes: Float32Array;
    private nodes: Float32Array;
    private leafs: Float32Array;
    private terrainTypes: Float32Array;

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
        this.gl.enable(this.gl.BLEND)

        //shader
        this.shader = new Shader(this.gl,pathTracingVertexShaderCode,pathTracingFragmentShaderCode);

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
        this.drawMesh();
    }

    /**
     * Renders the wireframe representation of cubes if debug mode is enabled.
     *
     * @param resScaleFactor - The scaling factor applied to the wireframe cubes' transformations.
     *
     * This method updates the view-projection matrix for the ray renderer using the current camera and canvas dimensions.
     * It then iterates over all cubes in `WireFrameCubes`, drawing each as a wireframe with the specified scale.
     * Wireframe rendering only occurs when debug mode is active.
     */
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

    public drawMesh(){
        this.gl.useProgram(this.shader.Program!);
        this.makeVao();

        let verticeTex = this.packFloatArrayToTexture(this.vertices);
        let terrainTex = this.packFloatArrayToTexture(this.terrains);
        let boundingBoxesTex = this.packFloatArrayToTexture(this.boundingBoxes);
        let nodesTex = this.packFloatArrayToTexture(this.nodes);
        let leafsTex = this.packFloatArrayToTexture(this.leafs);
        let terrainTypeTex = this.packFloatArrayToTexture(this.terrainTypes);

        this.bindTex(verticeTex,"u_vertices");
        this.bindTex(terrainTex,"u_terrains");
        this.bindTex(boundingBoxesTex,"u_boundingBox");
        this.bindTex(nodesTex,"u_nodesTex");
        this.bindTex(leafsTex,"u_leafsTex");
        this.bindTex(terrainTypeTex,"u_terrainTypes");

        // === Drawing
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }

    public makeVao(){
        const fullscreenTriangle = new Float32Array([
            -1, -1,
            3, -1,
            -1,  3
        ]);
        const vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);

        const vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, fullscreenTriangle, this.gl.STATIC_DRAW);

        this.gl.enableVertexAttribArray(0);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
    }

    /**
     * Binds a given WebGL texture to texture unit 0 and sets the corresponding sampler uniform in the shader program.
     *
     * @param tex - The WebGLTexture to bind.
     * @param key - The name of the sampler uniform in the shader program to associate with the texture.
     *
     * @remarks
     * If the specified uniform cannot be found in the shader program, a warning is logged to the console.
     */
    public bindTex(tex: WebGLTexture,key: string){
        // Bind to texture unit
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        let loc = this.gl.getUniformLocation(this.shader.Program!, key);
        if(loc === null){
            console.warn(`Cannot find ${key} in fragmentShader`)
        }
        this.gl.uniform1i(loc, 0);
    }

    /////////////////////////////// Packing 
    /**
     * Uploads a Float32Array to GPU as a 2D RGBA32F texture.
     * Each texel stores 4 floats (R, G, B, A).
     * (totally not vibecoded)
     * @param gl         - WebGL2RenderingContext
     * @param data       - Float32Array containing your raw float data
     * @param widthHint  - Optional: manual texture width (default auto-calculated)
     * @returns texture: WebGLTexture
     */
    public packFloatArrayToTexture(data: Float32Array, widthHint?: number) {
        if (data.length % 4 !== 0) {
            console.warn(`[packFloatArrayToTexture] Padding input from ${data.length} to multiple of 4`);
            const padded = new Float32Array(Math.ceil(data.length / 4) * 4);
            padded.set(data);
            data = padded;
        }

        const totalTexels = data.length / 4;

        const width = widthHint || Math.ceil(Math.sqrt(totalTexels));
        const height = Math.ceil(totalTexels / width);

        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA32F,     // Internal format
            width,
            height,
            0,
            this.gl.RGBA,        // Format of incoming data
            this.gl.FLOAT,
            new Float32Array(width * height * 4).fill(0).map((_, i) => data[i] ?? 0) // Fill/pad if needed
        );

        // NEAREST = no filtering/interpolation
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        return texture;
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

    /**
     * Packs terrain type properties into a Float32Array for efficient GPU transfer.
     *
     * Each terrain type's properties (color components, illuminosity, and reflectiveness)
     * are stored sequentially in the output array. The array is padded to ensure its length
     * is a multiple of `floatsPerTexel`.
     *
     * @returns {Float32Array} A packed array containing the terrain types' color (r, g, b),
     * illuminosity, and reflectiveness values.
     */
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