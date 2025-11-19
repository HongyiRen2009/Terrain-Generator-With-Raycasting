import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { ResourceCache, getUniformLocations } from "../renderSystem/managers/ResourceCache";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { RenderUtils } from "../../utils/RenderUtils";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { PointLight } from "../../map/Light";
import { mat4, vec3 } from "gl-matrix";
import CubeShadowsVertexShaderSource from "../glsl/DeferredRendering/CubeShadows.vert";
import CubeShadowsFragmentShaderSource from "../glsl/DeferredRendering/CubeShadows.frag";
import { SettingsSection } from "../../Settings";

export class CubeShadowsPass extends RenderPass {
    public VAOInputType: VAOInputType = VAOInputType.SCENE;
    private currentLightIndex: number = 0;
    protected settingsSection: SettingsSection | null = null;
    constructor(
        gl: WebGL2RenderingContext,
        resourceCache: ResourceCache,
        canvas: HTMLCanvasElement,
        renderGraph?: RenderGraph,
    ){
        super(gl, resourceCache, canvas, renderGraph);
        this.program = RenderUtils.CreateProgram(
            gl,
            CubeShadowsVertexShaderSource,
            CubeShadowsFragmentShaderSource
        )!;
        this.uniforms = getUniformLocations(gl, this.program!, ["lightSpaceMatrix", "model", "lightPos", "lightRadius"]);
        this.renderTarget = this.initRenderTarget();
        this.InitSettings();
    }

    public override getInvocationCount(): number {
        return this.resourceCache.getUniformData("lights")?.length ?? 0;
    }
    public override setInvocationIndex(index: number): void {
        this.currentLightIndex = index;
    }

    public initRenderTarget(): RenderTarget {
        let size = this.resourceCache.getUniformData("CubeShadowsMapSize") ?? 1024;
        // Store the default value if it wasn't set
        if (!this.resourceCache.getUniformData("CubeShadowsMapSize")) {
            this.resourceCache.setUniformData("CubeShadowsMapSize", size);
        }
        const maxTextureSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
        
        // Clamp shadow map size to maximum supported texture size
        if (size > maxTextureSize) {
            console.warn(`[Cube Shadows] Shadow map size ${size} exceeds maximum texture size ${maxTextureSize}. Clamping to ${maxTextureSize}.`);
            size = maxTextureSize;
            this.resourceCache.setUniformData("CubeShadowsMapSize", size);
        }
        const numLights = this.resourceCache.getUniformData("lights")?.length ?? 0;
        const cubeMaps: WebGLTexture[] = [];
        
        const fbo = this.gl.createFramebuffer();
        const depthRenderbuffer = this.gl.createRenderbuffer();
        if (!fbo || !depthRenderbuffer) {
            throw new Error("Failed to create framebuffer");
        }
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthRenderbuffer);
        this.gl.renderbufferStorage(
            this.gl.RENDERBUFFER,
            this.gl.DEPTH_COMPONENT24,
            size,
            size
        );
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
        this.gl.framebufferRenderbuffer(
            this.gl.FRAMEBUFFER,
            this.gl.DEPTH_ATTACHMENT,
            this.gl.RENDERBUFFER,
            depthRenderbuffer
        );
        
        // Create a cube map texture for each light
        for (let lightIndex = 0; lightIndex < numLights; lightIndex++) {
            const cubeMap = this.gl.createTexture();
            if (!cubeMap) {
                throw new Error("Failed to create cube map texture");
            }
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, cubeMap);
            for (let i = 0; i < 6; i++) {
                this.gl.texImage2D(
                    this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                    0,
                    this.gl.R32F,
                    size,
                    size,
                    0,
                    this.gl.RED,
                    this.gl.FLOAT,
                    null
                );
            }
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
            cubeMaps.push(cubeMap);
        }
        
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
        
        return {
            fbo: fbo,
            textures: {
                pointShadowTextures: cubeMaps
            }
        };
    }

    public render(vaosToRender: VaoInfo[]): void {
        const cubeMaps = this.renderTarget!.textures!.pointShadowTextures as WebGLTexture[];
        const currentCubeMap = cubeMaps[this.currentLightIndex];

        const ext = this.gl.getExtension("EXT_color_buffer_float");
        if (!ext) {
            throw new Error("EXT_color_buffer_float not supported");
        }

        const shadowMapSize = this.resourceCache.getUniformData("CubeShadowsMapSize")!;
        
        // Set up render state once
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.disable(this.gl.SCISSOR_TEST); // Disable scissor test to ensure full rendering
        this.gl.useProgram(this.program);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
        
        // Set clear values
        this.gl.clearDepth(1.0);
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0); // White = far plane (max distance normalized)
        
        for (let i = 0; i < 6; i++) {
            // Set viewport for this face
            this.gl.viewport(0, 0, shadowMapSize, shadowMapSize);
            
            // Attach the cube map face to the framebuffer
            this.gl.framebufferTexture2D(
                this.gl.FRAMEBUFFER,
                this.gl.COLOR_ATTACHMENT0,
                this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                currentCubeMap,
                0
            );
            this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
            
            // Verify framebuffer is complete before clearing
            const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
            if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
                console.error(`Framebuffer incomplete for face ${i}: ${status}`);
                continue;
            }
            
            // Clear both color and depth for this face
            this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);
            
            // Set up uniforms for this face
            const lightSpaceMatrix = getLightSpaceMatrix(this.resourceCache, this.resourceCache.getUniformData("lights")![this.currentLightIndex], i);
            this.gl.uniformMatrix4fv(this.uniforms["lightSpaceMatrix"], false, lightSpaceMatrix);
            this.gl.uniform3fv(this.uniforms["lightPos"], this.resourceCache.getUniformData("lights")![this.currentLightIndex].position);
            this.gl.uniform1f(this.uniforms["lightRadius"], this.resourceCache.getUniformData("lights")![this.currentLightIndex].radius);
            
            // Render all geometry for this face
            for (const vaoInfo of vaosToRender) {
                this.gl.bindVertexArray(vaoInfo.vao);
                this.gl.uniformMatrix4fv(this.uniforms["model"], false, vaoInfo.modelMatrix);
                this.gl.drawElements(
                    this.gl.TRIANGLES,
                    vaoInfo.indexCount,
                    this.gl.UNSIGNED_INT,
                    0
                );
            }

            this.gl.bindVertexArray(null);
        }
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    private InitSettings() {
        this.settingsSection = new SettingsSection(
            document.getElementById("settings-section")!,
            "Cube Shadows Settings",
            this.program!
        );
        
        this.settingsSection.addCheckbox({
            id: "showPointShadowMap",
            label: "Show Point Shadow Map",
            defaultValue: false,
            onChange: (value: boolean) => {
                this.resourceCache.setUniformData("showPointShadowMap", value);
            }
        });
    
        
        this.settingsSection.addSlider({
            id: "pointShadowMapIndex",
            label: "Point Shadow Map Index",
            min: 0,
            max: 11,
            step: 1,
            defaultValue: 0,
            numType: "int",
            onChange: (value: number) => {
                this.resourceCache.setUniformData("pointShadowMapIndex", Math.floor(value));
            }
        });
        
        // Add point light shadow map size slider
        this.settingsSection.addSlider({
            id: "CubeShadowsMapSize",
            label: "Point Light Shadow Map Size",
            min: 256,
            max: 4096,
            step: 256,
            defaultValue: 1024,
            numType: "int",
            onChange: (value: number) => {
                const newSize = Math.floor(value);
                this.resourceCache.setUniformData("CubeShadowsMapSize", newSize);
                this.disposeRenderTarget();
                this.renderTarget = this.initRenderTarget();
            }
        });
        
        // Add point light shadow bias slider
        this.settingsSection.addSlider({
            id: "pointShadowBias",
            label: "Point Light Shadow Bias",
            min: 0.0,
            max: 0.1,
            step: 0.001,
            defaultValue: 0.05,
            numType: "float",
            onChange: (value: number) => {
                this.resourceCache.setUniformData("pointShadowBias", value);
            }
        });
        
        // Initialize default values in resourceCache
        this.resourceCache.setUniformData("showPointShadowMap", false);
        this.resourceCache.setUniformData("pointShadowMapIndex", 0);
        this.resourceCache.setUniformData("pointShadowBias", 0.01);
    }
}

function getLightSpaceMatrix(resourceCache: ResourceCache, light: PointLight, face: number): mat4 {
    const lightSpaceMatrix = mat4.create();
    const lightViewMatrix = mat4.create();
    let target = vec3.create();
    let up = vec3.create();
    switch (face) {
        case 0:
            target = vec3.fromValues(light.position[0]+1, light.position[1], light.position[2]);
            up = vec3.fromValues(0.0, -1.0, 0.0);
            break;
        case 1:
            target = vec3.fromValues(light.position[0]-1, light.position[1], light.position[2]);
            up = vec3.fromValues(0.0, -1.0, 0.0);
            break;
        case 2:
            target = vec3.fromValues(light.position[0], light.position[1]+1, light.position[2]);
            up = vec3.fromValues(0.0, 0.0, 1.0);
            break;
        case 3:
            target = vec3.fromValues(light.position[0], light.position[1]-1, light.position[2]);
            up = vec3.fromValues(0.0, 0.0, -1.0);
            break;
        case 4:
            target = vec3.fromValues(light.position[0], light.position[1], light.position[2]+1);
            up = vec3.fromValues(0.0, -1.0, 0.0);
            break;
        case 5:
            target = vec3.fromValues(light.position[0], light.position[1], light.position[2]-1);
            up = vec3.fromValues(0.0, -1.0, 0.0);
            break;
    }
    mat4.lookAt(lightViewMatrix, light.position, target, up);
    const lightProjectionMatrix = mat4.create();
    // Extend shadow map range to 2x radius to cover where light still has meaningful contribution
    // This matches the effective range where attenuation is still significant
    const shadowMapFar = light.radius * 3.0;
    mat4.perspective(lightProjectionMatrix, Math.PI / 2, 1.0, 0.1, shadowMapFar);
    mat4.multiply(lightSpaceMatrix, lightProjectionMatrix, lightViewMatrix);
    return lightSpaceMatrix;
}