import { RenderPass } from "../renderSystem/RenderPass";
import {
    ResourceCache,
    getUniformLocations
} from "../renderSystem/managers/ResourceCache";
import { mat4, vec4 } from "gl-matrix";
import { RenderGraph } from "../renderSystem/RenderGraph";
import DebugVertexShaderSource from "../glsl/Debug/Debug.vert";
import DebugFragmentShaderSource from "../glsl/Debug/Debug.frag";
import { RenderUtils } from "../../utils/RenderUtils";
import { RenderTarget } from "../renderSystem/RenderTarget";

interface LightDebugCube {
    center: [number, number, number];
    halfExtent: number;
    intensity: number;
    name?: string;
}

export class DebugPass extends RenderPass {
    private positionBuffer: WebGLBuffer | null = null;
    private colorBuffer: WebGLBuffer | null = null;
    private vao: WebGLVertexArrayObject | null = null;
    private vertexCount: number = 0;

    private static readonly FRUSTUM_EDGES: Array<[number, number]> = [
        [0, 4],
        [4, 6],
        [6, 2],
        [2, 0],
        [1, 5],
        [5, 7],
        [7, 3],
        [3, 1],
        [0, 1],
        [4, 5],
        [6, 7],
        [2, 3]
    ];

    private static readonly NDC_CORNERS: vec4[] = (() => {
        const corners: vec4[] = [];
        for (let x = 0; x < 2; ++x) {
            for (let y = 0; y < 2; ++y) {
                for (let z = 0; z < 2; ++z) {
                    corners.push(
                        vec4.fromValues(
                            2.0 * x - 1.0,
                            2.0 * y - 1.0,
                            2.0 * z - 1.0,
                            1.0
                        )
                    );
                }
            }
        }
        return corners;
    })();

    private static readonly UNIT_CUBE_CORNERS: Array<[number, number, number]> = [
        [-1, -1, -1],
        [1, -1, -1],
        [1, 1, -1],
        [-1, 1, -1],
        [-1, -1, 1],
        [1, -1, 1],
        [1, 1, 1],
        [-1, 1, 1]
    ];

    private static readonly LIGHT_CUBE_EDGES: Array<[number, number]> = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4],
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7]
    ];

    private static readonly CAMERA_FRUSTUM_COLOR: [number, number, number] = [
        0.0,
        1.0,
        0.0
    ];

    private static readonly CASCADE_COLORS: Array<[number, number, number]> = [
        [1.0, 0.0, 1.0], // magenta
        [0.0, 1.0, 1.0], // cyan
        [1.0, 1.0, 0.0], // yellow
        [1.0, 0.0, 0.0], // red
        [0.0, 1.0, 0.0], // green
        [0.0, 0.0, 1.0], // blue
        [1.0, 0.5, 0.0], // orange
        [0.5, 0.0, 1.0]  // purple
    ];

    private static readonly LIGHT_FRUSTUM_COLOR: [number, number, number] = [
        1.0,
        0.5,
        0.0
    ];
    private static readonly LIGHT_FRUSTUM_NEAR_PLANE_COLOR: [number, number, number] = [
        1.0,
        0.2,
        0.2
    ];
    private static readonly NEAR_PLANE_EDGE_COUNT = 4;

    constructor(gl: WebGL2RenderingContext, resourceCache: ResourceCache, canvas: HTMLCanvasElement, renderGraph?: RenderGraph) {
        super(gl, resourceCache, canvas, renderGraph);
        this.program = RenderUtils.CreateProgram(gl, DebugVertexShaderSource, DebugFragmentShaderSource)!;
        this.uniforms = getUniformLocations(gl, this.program!, [
            "viewProj"
        ]);
        this.renderTarget = this.initRenderTarget();
        this.initBuffers();
    }
    protected initRenderTarget(): RenderTarget {
        return {
            fbo: null,
            textures: {}
        };
    }
    private initBuffers(): void {
        this.positionBuffer = this.gl.createBuffer();
        this.colorBuffer = this.gl.createBuffer();
        this.vao = this.gl.createVertexArray();

        if (!this.positionBuffer || !this.colorBuffer || !this.vao) {
            throw new Error("[DebugPass] Failed to allocate buffers for frustum debug rendering");
        }

        this.gl.bindVertexArray(this.vao);

        const positionLocation = this.gl.getAttribLocation(this.program!, "position");
        if (positionLocation !== -1) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, 0, this.gl.DYNAMIC_DRAW);
            this.gl.enableVertexAttribArray(positionLocation);
            this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0);
        }

        const colorLocation = this.gl.getAttribLocation(this.program!, "color");
        if (colorLocation !== -1) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, 0, this.gl.DYNAMIC_DRAW);
            this.gl.enableVertexAttribArray(colorLocation);
            this.gl.vertexAttribPointer(colorLocation, 3, this.gl.FLOAT, false, 0, 0);
        }

        this.gl.bindVertexArray(null);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }
    public render(): void {
        const drawCascadeDebug = this.resourceCache.getData("drawCascadeDebug") as boolean | undefined;
        const lightDebugCubes = this.resourceCache.getData("lightDebugCubes") as LightDebugCube[] | undefined;
        const shouldRender = !!drawCascadeDebug || (lightDebugCubes && lightDebugCubes.length > 0);
        if (!shouldRender) {
            return;
        }
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.useProgram(this.program!);
        this.gl.bindVertexArray(this.vao!);

        const lineData = this.buildLineBuffers(drawCascadeDebug === true, lightDebugCubes);
        if (!lineData) {
            this.gl.bindVertexArray(null);
            return;
        }

        const { positions, colors, vertexCount } = lineData;
        this.vertexCount = vertexCount;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array(positions),
            this.gl.DYNAMIC_DRAW
        );

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array(colors),
            this.gl.DYNAMIC_DRAW
        );

        const viewProj = this.resourceCache.getData("CameraInfo").matViewProj;
        this.gl.uniformMatrix4fv(this.uniforms["viewProj"], false, viewProj);

        this.gl.drawArrays(this.gl.LINES, 0, this.vertexCount);
        this.gl.bindVertexArray(null);
    }

    private buildLineBuffers(
        includeCascadeDebug: boolean,
        lightDebugCubes?: LightDebugCube[]
    ):
        | { positions: number[]; colors: number[]; vertexCount: number }
        | null {
        const positions: number[] = [];
        const colors: number[] = [];

        const pushFrustum = (
            corners: number[][] | undefined,
            color: [number, number, number],
            nearPlaneColor?: [number, number, number]
        ) => {
            if (!corners || corners.length < 8) {
                return;
            }
            DebugPass.FRUSTUM_EDGES.forEach(([startIndex, endIndex], edgeIndex) => {
                const start = corners[startIndex];
                const end = corners[endIndex];
                if (!start || !end) {
                    return;
                }
                positions.push(start[0], start[1], start[2]);
                positions.push(end[0], end[1], end[2]);

                const edgeColor =
                    nearPlaneColor && edgeIndex < DebugPass.NEAR_PLANE_EDGE_COUNT
                        ? nearPlaneColor
                        : color;
                colors.push(edgeColor[0], edgeColor[1], edgeColor[2]);
                colors.push(edgeColor[0], edgeColor[1], edgeColor[2]);
            });
        };

        if (includeCascadeDebug) {
            const cameraFrustum = this.resourceCache.getData("cameraFrustumCorners") as number[][] | undefined;
            pushFrustum(cameraFrustum, DebugPass.CAMERA_FRUSTUM_COLOR);

            const numCascades = this.resourceCache.getData("numCascades") ?? 3;
            const cameraSubFrusta = this.resourceCache.getData("cameraSubFrusta") as number[][][] | undefined;
            if (cameraSubFrusta && cameraSubFrusta.length > 0) {
                const maxCascades = Math.min(cameraSubFrusta.length, numCascades);
                for (let i = 0; i < maxCascades; i++) {
                    const color = DebugPass.CASCADE_COLORS[i % DebugPass.CASCADE_COLORS.length];
                    pushFrustum(cameraSubFrusta[i], color);
                }
            }

            const lightSpaceMatrices = this.resourceCache.getData("lightSpaceMatrices") as mat4[] | undefined;
            if (lightSpaceMatrices && lightSpaceMatrices.length > 0) {
                const cascadeIndex = Math.max(
                    0,
                    Math.min(
                        lightSpaceMatrices.length - 1,
                        (this.resourceCache.getData("shadowMapCascade") as number | undefined) ?? 0
                    )
                );
                const cascadeCorners = this.computeCascadeWorldCorners(lightSpaceMatrices[cascadeIndex]);
                pushFrustum(
                    cascadeCorners,
                    DebugPass.LIGHT_FRUSTUM_COLOR,
                    DebugPass.LIGHT_FRUSTUM_NEAR_PLANE_COLOR
                );
            }
        }

        if (lightDebugCubes && lightDebugCubes.length > 0) {
            lightDebugCubes.forEach((cube) =>
                this.pushWireCube(positions, colors, cube)
            );
        }

        if (positions.length === 0) {
            return null;
        }

        return {
            positions,
            colors,
            vertexCount: positions.length / 3
        };
    }

    private computeCascadeWorldCorners(lightSpaceMatrix: mat4): number[][] | undefined {
        const inverse = mat4.invert(mat4.create(), lightSpaceMatrix);
        if (!inverse) {
            return undefined;
        }

        const corners: number[][] = [];
        for (const ndcCorner of DebugPass.NDC_CORNERS) {
            const worldPoint = vec4.transformMat4(vec4.create(), ndcCorner, inverse);
            const w = worldPoint[3] === 0 ? 1.0 : worldPoint[3];
            corners.push([worldPoint[0] / w, worldPoint[1] / w, worldPoint[2] / w]);
        }

        return corners;
    }

    private pushWireCube(
        positions: number[],
        colors: number[],
        cube: LightDebugCube
    ) {
        const { center, halfExtent, intensity } = cube;
        const colorValue = Math.min(1, Math.max(0, intensity));
        const edgeColor: [number, number, number] = [
            colorValue,
            colorValue,
            colorValue
        ];
        const corners = DebugPass.UNIT_CUBE_CORNERS.map(([x, y, z]) => [
            center[0] + x * halfExtent,
            center[1] + y * halfExtent,
            center[2] + z * halfExtent
        ]);

        DebugPass.LIGHT_CUBE_EDGES.forEach(([startIndex, endIndex]) => {
            const start = corners[startIndex];
            const end = corners[endIndex];
            if (!start || !end) {
                return;
            }
            positions.push(start[0], start[1], start[2]);
            positions.push(end[0], end[1], end[2]);
            colors.push(edgeColor[0], edgeColor[1], edgeColor[2]);
            colors.push(edgeColor[0], edgeColor[1], edgeColor[2]);
        });
    }
}