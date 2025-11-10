import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { ResourceCache, getUniformLocations } from "../renderSystem/managers/ResourceCache";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { TextureUtils } from "../../utils/TextureUtils";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { RenderUtils } from "../../utils/RenderUtils";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import  CSMVertexShaderSource  from "../glsl/DeferredRendering/CSM.vert";
import  CSMFragmentShaderSource  from "../glsl/DeferredRendering/CSM.frag";
import { SettingsSection } from "../../Settings";
import { mat4, vec4, vec3 } from "gl-matrix";
import { DirectionalLight } from "../../map/Light";

export class CSMPass extends RenderPass {
    public VAOInputType: VAOInputType = VAOInputType.SCENE;
    protected settingsSection: SettingsSection | null = null;
    private currentCascadeIndex: number = 0;
    constructor(
        gl: WebGL2RenderingContext,
        resourceCache: ResourceCache,
        canvas: HTMLCanvasElement,
        renderGraph?: RenderGraph
    ){
        super(gl, resourceCache, canvas, renderGraph);
        this.program = RenderUtils.CreateProgram(
            gl,
            CSMVertexShaderSource,
            CSMFragmentShaderSource
        );
        this.renderTarget = this.initRenderTarget();
        this.uniforms = getUniformLocations(gl, this.program!, ["lightSpaceMatrix", "model"]);
        this.InitSettings();
    }
    public override getInvocationCount(): number { return 3; }
    public override setInvocationIndex(index: number): void { this.currentCascadeIndex = index; }
    
    protected initRenderTarget(): RenderTarget {
        // Use DEPTH_COMPONENT32F for float depth, or DEPTH_COMPONENT24 with UNSIGNED_INT
        // For shadow maps, DEPTH_COMPONENT32F with FLOAT is more reliable
        const shadowMapSize = 2048; // Higher resolution for shadow maps
        this.resourceCache.setUniformData("shadowMapSize", shadowMapSize);
        const depthInternalFormat = this.gl.DEPTH_COMPONENT32F;
        const depthFormat = this.gl.DEPTH_COMPONENT;
        const depthType = this.gl.FLOAT;
        const shadowDepthTexture0 = TextureUtils.createTexture2D(this.gl, shadowMapSize, shadowMapSize, depthInternalFormat, depthFormat, depthType);
        const shadowDepthTexture1 = TextureUtils.createTexture2D(this.gl, shadowMapSize, shadowMapSize, depthInternalFormat, depthFormat, depthType);
        const shadowDepthTexture2 = TextureUtils.createTexture2D(this.gl, shadowMapSize, shadowMapSize, depthInternalFormat, depthFormat, depthType);
        
        const textures = [shadowDepthTexture0, shadowDepthTexture1, shadowDepthTexture2];
        for (const tex of textures) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_COMPARE_MODE, this.gl.NONE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        
        const fbo = this.gl.createFramebuffer();
        if (!fbo) {
            throw new Error("Failed to create framebuffer");
        }
        // Attachments are switched per-cascade during render()
        return {
            fbo: fbo,
            textures: {
                shadowDepthTexture0: shadowDepthTexture0,
                shadowDepthTexture1: shadowDepthTexture1,
                shadowDepthTexture2: shadowDepthTexture2
            }
        }
    }

    render(vaosToRender: VaoInfo[]){
        // Check if CSM is enabled
        const csmEnabled = this.resourceCache.getUniformData("csmEnabled") ?? true;
        if (!csmEnabled) {
            console.log("[CSM] CSM is disabled");
            return;
        }
        
        if (!this.renderTarget) {
            console.error("[CSM] No render target!");
            return;
        }
        const textures = this.renderTarget.textures!;
        const depthKey = `shadowDepthTexture${this.currentCascadeIndex}` as const;
        const depthTex = (textures as any)[depthKey] as WebGLTexture;

        if (!depthTex) {
            console.error(`[CSM] Shadow depth texture ${depthKey} not found!`);
            return;
        }

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget.fbo);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, depthTex, 0);
        // Check framebuffer completeness
        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error(`Framebuffer not complete: ${status}`);
        }
        this.gl.drawBuffers([this.gl.NONE]);
        if (this.gl.readBuffer) {
            this.gl.readBuffer(this.gl.NONE);
        }
        this.gl.colorMask(false, false, false, false);

        const shadowMapSize = 2048;
        this.gl.viewport(0, 0, shadowMapSize, shadowMapSize);
        this.gl.clearDepth(1.0);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
        this.gl.depthMask(true);

        this.gl.useProgram(this.program!);

        const lights = this.resourceCache.getUniformData("lights");
        if (!lights || lights.length === 0) {
            console.warn("[CSM] No lights found!");
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            this.gl.colorMask(true, true, true, true);
            return;
        }

        const lightSpaceMatrices = getLightSpaceMatrices(this.resourceCache, lights[0], this.settingsSection?.getSliderValue("lambda") ?? 0.5, this.settingsSection?.getSliderValue("zMultiplier") ?? 10.0);
        const lightSpaceMatrix = lightSpaceMatrices[this.currentCascadeIndex];
        this.gl.uniformMatrix4fv(this.uniforms["lightSpaceMatrix"], false, lightSpaceMatrix);

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
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.colorMask(true, true, true, true);
    }

    private InitSettings() {
        this.settingsSection = new SettingsSection(
            document.getElementById("settings-section")!,
            "CSM Settings",
            this.program!
        );
        this.settingsSection.addCheckbox({
            id: "csmEnabled",
            label: "Enable CSM",
            defaultValue: true,
            onChange: (value: boolean) => {
                this.resourceCache.setUniformData("csmEnabled", value);
            }
        });
        this.settingsSection.addSlider({
            id: "lambda",
            label: "Lambda",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            defaultValue: 0.25,
            numType: "float"
        });
        this.settingsSection.addSlider({
            id: "zMultiplier",
            label: "Z Multiplier",
            min: 0.0,
            max: 15.0,
            step: 0.1,
            defaultValue: 10.0,
            numType: "float"
        });
        this.settingsSection.addCheckbox({
            id: "usingPCF",
            label: "Using PCF",
            defaultValue: true,
            onChange: (value: boolean) => {
                this.resourceCache.setUniformData("usingPCF", value);
            }
        });
        this.settingsSection.addSlider({
            id: "shadowBias",
            label: "Shadow Bias",
            min: 0.0,
            max: 0.1,
            step: 0.001,
            defaultValue: 0.01,
            numType: "float",
            onChange: (value: number) => {
                this.resourceCache.setUniformData("shadowBias", value);
            }
        });
        this.settingsSection.addCheckbox({
            id: "cascadeDebug",
            label: "Cascade Debug",
            defaultValue: false,
            onChange: (value: boolean) => {
                this.resourceCache.setUniformData("cascadeDebug", value);
            }
        });
        this.settingsSection.addCheckbox({
            id: "debugPause",
            label: "Debug Pause Mode",
            defaultValue: false,
            onChange: (value: boolean) => {
                this.resourceCache.setUniformData("debugPauseMode", value);
            }
        });
        this.settingsSection.addCheckbox({
            id: "showShadowMap",
            label: "Show Shadow Map",
            defaultValue: false,
            onChange: (value: boolean) => {
                this.resourceCache.setUniformData("showShadowMap", value);
            }
        });
        this.settingsSection.addSlider({
            id: "shadowMapCascade",
            label: "Shadow Map Cascade (0-2)",
            min: 0,
            max: 2,
            step: 1,
            defaultValue: 0,
            numType: "int",
            onChange: (value: number) => {
                this.resourceCache.setUniformData("shadowMapCascade", Math.floor(value));
            }
        });
    }
}

function getCascadeSplits(resourceCache: ResourceCache, lambda: number) : number[] {
    const cascadeSplits : number[] = [];
    const nearFarPlanes = resourceCache.getUniformData("pausedNearFarPlanes");
    const nearPlane = nearFarPlanes.near;
    const farPlane = nearFarPlanes.far;
    const clipRange = farPlane - nearPlane;
    const ratio = farPlane / nearPlane;
    for (let i = 0; i < 3; ++i){
        const p = (i+1) / 3.0;
        const logSplit = nearPlane * Math.pow(ratio,p);
        const uniSplit = nearPlane + clipRange * p;
        cascadeSplits[i] = uniSplit * (1.0-lambda) + logSplit * lambda;
    }
    resourceCache.setUniformData("cascadeSplits", cascadeSplits);
    return cascadeSplits;
}

// Helper function to compute frustum corners from a view-projection matrix
function computeFrustumCornersFromViewProj(invViewProjMatrix: mat4): vec4[] {
    const frustumCorners: vec4[] = [];
    // Generate all 8 corners of the NDC frustum cube [-1, 1]^3
    for (let x = 0; x < 2; ++x){
        for (let y = 0; y < 2; ++y){
            for (let z = 0; z < 2; ++z){
                // NDC coordinates: (2*x-1, 2*y-1, 2*z-1) maps [0,1] to [-1,1]
                // where z=0 corresponds to near plane (NDC z=-1) and z=1 to far plane (NDC z=1)
                const ndcPoint = vec4.fromValues(
                    2.0 * x - 1.0,
                    2.0 * y - 1.0,
                    2.0 * z - 1.0,
                    1.0
                );
                // Transform from NDC/clip space to world space (homogeneous coordinates)
                const pt = vec4.create();
                vec4.transformMat4(pt, ndcPoint, invViewProjMatrix);
                // Perspective divide: divide x, y, z by w to get world space coordinates
                // vec4.divide performs component-wise division: (x/w, y/w, z/w, w/w)
                frustumCorners.push(vec4.divide(vec4.create(), pt, vec4.fromValues(pt[3], pt[3], pt[3], pt[3])));
            }
        }
    }
    return frustumCorners;
}

function getWorldSpaceFrustumCorners(resourceCache: ResourceCache) : vec4[] {
    const cameraInfo = resourceCache.getUniformData("pausedCameraInfo");
    const invViewProjMatrix = mat4.create();
    mat4.invert(invViewProjMatrix, cameraInfo.matViewProj);
    const corners = computeFrustumCornersFromViewProj(invViewProjMatrix);
    const serialized = corners.map((corner) => Array.from(corner));
    resourceCache.setUniformData("cameraFrustumCorners", serialized);
    return corners;
}
    
function getSubfrustumCorners(resourceCache: ResourceCache, lambda: number) : vec4[][] {
    const subFrustumCorners : vec4[][] = [];
    const nearFarPlanes = resourceCache.getUniformData("pausedNearFarPlanes");
    const cascadeSplits = getCascadeSplits(resourceCache, lambda);
    const nearPlane = nearFarPlanes.near;
    const farPlane = nearFarPlanes.far;

    // Get the full camera frustum corners in world space (order: x, y, then z)
    const fullFrustumCorners = getWorldSpaceFrustumCorners(resourceCache);

    for (let i = 0; i < 3; i++){
        // Determine near and far distances for this cascade
        const cascadeNear = i === 0 ? nearPlane : cascadeSplits[i - 1];
        const cascadeFar = cascadeSplits[i];

        // Interpolation factors are identical for all rays (proof from plane-ray intersection)
        const tNear = (cascadeNear - nearPlane) / (farPlane - nearPlane);
        const tFar = (cascadeFar - nearPlane) / (farPlane - nearPlane);

        // Generate 8 corners for this cascade matching the original ordering (x, y, then z)
        const cascadeCorners: vec4[] = [];
        for (let x = 0; x < 2; ++x){
            for (let y = 0; y < 2; ++y){
                // Near index for this (x,y), far index is nearIdx + 1
                const nearIdx = 4 * x + 2 * y;   // 0,2,4,6
                const farIdx = nearIdx + 1;      // 1,3,5,7

                const nearCorner = fullFrustumCorners[nearIdx];
                const farCorner = fullFrustumCorners[farIdx];

                // z = 0 (cascade near), then z = 1 (cascade far)
                const cascadeNearCorner = vec4.create();
                vec4.lerp(cascadeNearCorner, nearCorner, farCorner, tNear);
                cascadeCorners.push(cascadeNearCorner);

                const cascadeFarCorner = vec4.create();
                vec4.lerp(cascadeFarCorner, nearCorner, farCorner, tFar);
                cascadeCorners.push(cascadeFarCorner);
            }
        }
        subFrustumCorners.push(cascadeCorners);
    }
    const serialized = subFrustumCorners.map((cascadeCorners) =>
        cascadeCorners.map((corner) => Array.from(corner))
    );
    resourceCache.setUniformData("cameraSubFrusta", serialized);
    return subFrustumCorners;
}

function getLightSpaceMatrices(resourceCache: ResourceCache, light: DirectionalLight, lambda: number, zMultiplier : number) : mat4[] {
    const lightSpaceMatrices : mat4[] = [];
    const normalizedLightDir = vec3.normalize(vec3.create(), light.direction);
    const parallelThreshold = 0.99;
    for (let i = 0; i < 3; i++){
        const LightViewMatrix = mat4.create();
        const subFrustumCorners = getSubfrustumCorners(resourceCache, lambda);
        const center = vec3.fromValues(0.0, 0.0, 0.0);
        for (const corner of subFrustumCorners[i]){
            vec3.add(center, center, vec3.fromValues(corner[0], corner[1], corner[2]));
        }
        vec3.scale(center, center, 1.0 / subFrustumCorners[i].length);
        let upDirection = vec3.fromValues(0.0, 1.0, 0.0);
        if (Math.abs(vec3.dot(normalizedLightDir, upDirection)) > parallelThreshold) {
            upDirection = vec3.fromValues(1.0, 0.0, 0.0);
            if (Math.abs(vec3.dot(normalizedLightDir, upDirection)) > parallelThreshold) {
                upDirection = vec3.fromValues(0.0, 0.0, 1.0);
            }
        }
        const lightEye = vec3.subtract(vec3.create(), center, light.direction);
        mat4.lookAt(LightViewMatrix, lightEye, center, upDirection);

        const LightProjectionMatrix = mat4.create();
        let minX : number = Number.MAX_VALUE;
        let maxX : number = -Number.MAX_VALUE;
        let minY : number = Number.MAX_VALUE;
        let maxY : number = -Number.MAX_VALUE;
        let minZ : number = Number.MAX_VALUE;
        let maxZ : number = -Number.MAX_VALUE;
        for (const corner of subFrustumCorners[i]){
            const trf = vec4.create();
            vec4.transformMat4(trf, corner, LightViewMatrix);
            minX = Math.min(minX, trf[0]);
            maxX = Math.max(maxX, trf[0]);
            minY = Math.min(minY, trf[1]);
            maxY = Math.max(maxY, trf[1]);
            minZ = Math.min(minZ, trf[2]);
            maxZ = Math.max(maxZ, trf[2]);
        }
        if (minZ < 0){
            minZ *= zMultiplier;
        }
        else{
            minZ /= zMultiplier;
        }
        if (maxZ < 0){
            maxZ /= zMultiplier;
        }
        else{
            maxZ *= zMultiplier;
        }
        mat4.ortho(LightProjectionMatrix, minX, maxX, minY, maxY, minZ, maxZ);
        lightSpaceMatrices.push(mat4.multiply(mat4.create(), LightProjectionMatrix, LightViewMatrix));
    }
    resourceCache.setUniformData("lightSpaceMatrices", lightSpaceMatrices);
    return lightSpaceMatrices;
}

