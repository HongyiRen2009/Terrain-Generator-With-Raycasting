// Ik this code is a lot of repeat from code in other places, but I do have some things I plan on doing which would make me using the other code less desirable for this purpose

import { mat4, vec3 } from "gl-matrix";
import { WorldMap } from "../map/Map";
import { Mesh } from "../map/Mesh";
import { Camera } from "../render/Camera";
import { Shader } from "../render/Shader";
import { GlUtils} from "../render/GlUtils";
import { DebugMenu } from "../DebugMenu";
import {
  pathTracingFragmentShaderCode,
  pathTracingVertexShaderCode
} from "./glslPath";
import { BVHUtils } from "../map/BVHUtils";

export class PathTracer {
  //Rendering
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  //Shaders
  private shader: Shader;

  //Information
  private vertices: Float32Array;
  private terrains: Float32Array;
  private boundingBoxes: Float32Array;
  private nodes: Float32Array;
  private leafs: Float32Array;
  private terrainTypes: Float32Array;
  private vertexNormals: Float32Array;

  //Classes
  private world: WorldMap;
  private camera: Camera;
  private debug: DebugMenu;

  public constructor(
    canvas: HTMLCanvasElement,
    context: WebGL2RenderingContext,
    world: WorldMap,
    camera: Camera,
    debug: DebugMenu
  ) {
    this.canvas = canvas;
    this.gl = context;
    this.world = world;
    this.camera = camera;
    this.debug = debug;
    this.gl.enable(this.gl.BLEND);

    //shader
    this.shader = new Shader(
      this.gl,
      pathTracingVertexShaderCode,
      pathTracingFragmentShaderCode
    );

    ////////////////////// build flat BVH structure
    //Get main mesh
    let mainMesh = new Mesh();

    for (const chunk of this.world.chunks) {
      const triangleMesh = chunk.CreateMarchingCubes();
      triangleMesh.translate(
        vec3.fromValues(chunk.ChunkPosition[0], 0, chunk.ChunkPosition[1])
      );
      mainMesh.merge(triangleMesh);
    }
    //Obtain bvh from mesh.
    const BVHtriangles = mainMesh.exportBVHTriangles();
    const BVHtree = Mesh.exportBVH(BVHtriangles);
    const flatBVHtree = Mesh.flattenBVH(BVHtree);
    console.log(BVHtree);
    console.log(flatBVHtree);

    ////////////// Pack everything float format to send to glsl
    //Pack triangles
    const { vertices, terrains, normals } = BVHUtils.packTriangles(
      mainMesh.mesh,
      mainMesh.type,
      mainMesh.normals
    );
    console.log(vertices);
    console.log(terrains);
    //Pack BVH
    const { boundingBoxes, nodes, leafs } = BVHUtils.packBVH(flatBVHtree);
    console.log(boundingBoxes);
    console.log(nodes);
    console.log(leafs);
    //Pack terrain Types
    const terrainTypes = BVHUtils.packTerrainTypes();
    console.log(terrainTypes);
    //save
    this.vertices = vertices;
    this.terrains = terrains;
    this.boundingBoxes = boundingBoxes;
    this.nodes = nodes;
    this.leafs = leafs;
    this.terrainTypes = terrainTypes;
    this.vertexNormals = normals;

    this.init();
  }

  public render(time: number) {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    //const resScaleFactor = 1 / (this.world.resolution / 4);
    this.drawMesh();
  }

  public drawMesh() {
    this.gl.useProgram(this.shader.Program!);

    //Put camera position in shader
    this.gl.uniform3fv(
      this.gl.getUniformLocation(this.shader.Program!, "u_cameraPos"),
      this.camera.position
    );
    //Put camera direction in shader
    const viewProjMatrix = this.camera.calculateProjectionMatrix(
      this.canvas.width,
      this.canvas.height
    );
    const invViewProjMatrix = mat4.create();
    mat4.invert(invViewProjMatrix, viewProjMatrix);
    const invVpLoc = this.gl.getUniformLocation(
      this.shader.Program!,
      "u_invViewProjMatrix"
    );
    this.gl.uniformMatrix4fv(invVpLoc, false, invViewProjMatrix);

    //put lights in the shader
    GlUtils.updateLights(this.gl, this.shader.Program!, this.world.lights);

    // Draw
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  public makeVao() {
    const fullscreenTriangle = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(vao);

    const vbo = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      fullscreenTriangle,
      this.gl.STATIC_DRAW
    );

    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
  }

  public init() {
    this.gl.useProgram(this.shader.Program!);
    //Textures
    let verticeTex = GlUtils.packFloatArrayToTexture(this.gl, this.vertices);
    let terrainTex = GlUtils.packFloatArrayToTexture(this.gl, this.terrains);
    let boundingBoxesTex = GlUtils.packFloatArrayToTexture(
      this.gl,
      this.boundingBoxes
    );
    let nodesTex = GlUtils.packFloatArrayToTexture(this.gl, this.nodes);
    let leafsTex = GlUtils.packFloatArrayToTexture(this.gl, this.leafs);
    let terrainTypeTex = GlUtils.packFloatArrayToTexture(
      this.gl,
      this.terrainTypes
    );
    let vertexNormalsTex = GlUtils.packFloatArrayToTexture(
      this.gl,
      this.vertexNormals
    );

    GlUtils.bindTex(this.gl, this.shader.Program!, verticeTex, "u_vertices", 0);
    GlUtils.bindTex(this.gl, this.shader.Program!, terrainTex, "u_terrains", 1);
    GlUtils.bindTex(
      this.gl,
      this.shader.Program!,
      boundingBoxesTex,
      "u_boundingBox",
      2
    );
    GlUtils.bindTex(this.gl, this.shader.Program!, nodesTex, "u_nodesTex", 3);
    GlUtils.bindTex(this.gl, this.shader.Program!, leafsTex, "u_leafsTex", 4);
    GlUtils.bindTex(
      this.gl,
      this.shader.Program!,
      terrainTypeTex,
      "u_terrainTypes",
      5
    );
    GlUtils.bindTex(
      this.gl,
      this.shader.Program!,
      vertexNormalsTex,
      "u_normals",
      6
    );

    this.makeVao();
  }
}
