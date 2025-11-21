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
    public override getInvocationCount(): number { 
        const numCascades = this.resourceCache.getData("numCascades") ?? 3;
        return numCascades;
    }
    public override setInvocationIndex(index: number): void { this.currentCascadeIndex = index; }
    
    protected initRenderTarget(): RenderTarget {
        // Use DEPTH_COMPONENT32F for float depth, or DEPTH_COMPONENT24 with UNSIGNED_INT
        // For shadow maps, DEPTH_COMPONENT32F with FLOAT is more reliable
        let csmShadowMapSize = this.resourceCache.getData("csmShadowMapSize") ?? 4096; // Default to 4096 if not set
        // Store the default value if it wasn't set
        if (!this.resourceCache.getData("csmShadowMapSize")) {
            this.resourceCache.setData("csmShadowMapSize", csmShadowMapSize);
        }
        const numCascades = this.resourceCache.getData("numCascades") ?? 3;
        const maxTextureSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
        
        // Clamp shadow map size to maximum supported texture size
        if (csmShadowMapSize > maxTextureSize) {
            console.warn(`[CSM] Shadow map size ${csmShadowMapSize} exceeds maximum texture size ${maxTextureSize}. Clamping to ${maxTextureSize}.`);
            csmShadowMapSize = maxTextureSize;
            this.resourceCache.setData("csmShadowMapSize", csmShadowMapSize);
        }
        
        // Calculate memory requirements for texture array
        // DEPTH_COMPONENT32F with FLOAT uses 4 bytes per pixel
        const bytesPerPixel = 4;
        const totalMemoryBytes = csmShadowMapSize * csmShadowMapSize * numCascades * bytesPerPixel;
        
        // Conservative memory limit: 512MB (536,870,912 bytes)
        // Many GPUs, especially integrated or older ones, can't allocate more than this for a single texture
        const maxSafeMemoryBytes = 512 * 1024 * 1024; // 512 MB
        
        if (totalMemoryBytes > maxSafeMemoryBytes) {
            // Calculate the maximum safe size based on memory limit
            const maxSafeTexelsPerLayer = Math.floor(maxSafeMemoryBytes / (numCascades * bytesPerPixel));
            const maxSafeSize = Math.floor(Math.sqrt(maxSafeTexelsPerLayer));
            
            // Ensure we don't exceed MAX_TEXTURE_SIZE
            const clampedSize = Math.min(maxSafeSize, maxTextureSize);
            
            if (clampedSize < csmShadowMapSize) {
                console.warn(
                    `[CSM] Shadow map size ${csmShadowMapSize} would require ${(totalMemoryBytes / (1024 * 1024)).toFixed(2)}MB ` +
                    `(${csmShadowMapSize}×${csmShadowMapSize}×${numCascades}×4 bytes), exceeding safe limit of ${(maxSafeMemoryBytes / (1024 * 1024)).toFixed(0)}MB. ` +
                    `Clamping to ${clampedSize}×${clampedSize} (${((clampedSize * clampedSize * numCascades * bytesPerPixel) / (1024 * 1024)).toFixed(2)}MB).`
                );
                csmShadowMapSize = clampedSize;
                this.resourceCache.setData("csmShadowMapSize", csmShadowMapSize);
            }
        }
        
        const depthInternalFormat = this.gl.DEPTH_COMPONENT32F;
        const depthFormat = this.gl.DEPTH_COMPONENT;
        const depthType = this.gl.FLOAT;
        
        // Create a single texture array instead of individual textures
        const shadowDepthTextureArray = TextureUtils.createTexture2DArray(
            this.gl, 
            csmShadowMapSize,  
            csmShadowMapSize, 
            numCascades,
            depthInternalFormat, 
            depthFormat, 
            depthType
        );
        
        // Set texture parameters for the array
        this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, shadowDepthTextureArray);
        this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_COMPARE_MODE, this.gl.NONE);

        this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, null);
        
        const fbo = this.gl.createFramebuffer();
        if (!fbo) {
            throw new Error("Failed to create framebuffer");
        }
        // Attachments are switched per-cascade during render() using framebufferTextureLayer
        return {
            fbo: fbo,
            textures: {
                shadowDepthTextureArray: shadowDepthTextureArray
            }
        }
    }

    render(vaosToRender: VaoInfo[]){
        if (this.resourceCache.getData("disableSun")){
            return;
        }
        // Check if CSM is enabled
        const csmEnabled = this.resourceCache.getData("csmEnabled") ?? true;
        if (!csmEnabled) {
            console.log("[CSM] CSM is disabled");
            return;
        }
        
        if (!this.renderTarget) {
            console.error("[CSM] No render target!");
            return;
        }
        const textures = this.renderTarget.textures!;
        const shadowDepthTextureArray = textures["shadowDepthTextureArray"] as WebGLTexture;

        if (!shadowDepthTextureArray) {
            console.error(`[CSM] Shadow depth texture array not found!`);
            return;
        }

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget.fbo);
        // Use framebufferTextureLayer to attach a specific layer of the texture array
        this.gl.framebufferTextureLayer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, shadowDepthTextureArray, 0, this.currentCascadeIndex);
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

        const csmShadowMapSize = this.resourceCache.getData("csmShadowMapSize");
        this.gl.viewport(0, 0, csmShadowMapSize, csmShadowMapSize);
        this.gl.clearDepth(1.0);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
        this.gl.depthMask(true);

        this.gl.useProgram(this.program!);

        const sunLight = this.resourceCache.getData("sunLight");
        if (!sunLight) {
            console.error("[CSM] No sun light found in resource cache!");
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            this.gl.colorMask(true, true, true, true);
            return;
        }
        const lightSpaceMatrices = getLightSpaceMatrices(this.resourceCache, sunLight, this.settingsSection?.getSliderValue("lambda") ?? 0.5, this.settingsSection?.getSliderValue("zMultiplier") ?? 10.0);
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
                this.resourceCache.setData("csmEnabled", value);
            }
        });
        this.settingsSection.addSlider({
            id: "numCascades",
            label: "Number of Cascades",
            min: 1,
            max: 8,
            step: 1,
            defaultValue: 3,
            numType: "int",
            onChange: (value: number) => {
                const newNumCascades = Math.floor(value);
                this.resourceCache.setData("numCascades", newNumCascades);
                
                // Update csmShadowBias array to match new number of cascades
                const currentBiasArray = this.resourceCache.getData("csmShadowBias") as number[] | undefined;
                const newBiasArray = Array.from({ length: newNumCascades }, (_, i) => {
                    if (currentBiasArray && i < currentBiasArray.length) {
                        // Keep existing values if available
                        return currentBiasArray[i];
                    }
                    // Otherwise use default: 0.001 * 0.5^i
                    return 0.001 * Math.pow(0.5, i);
                });
                this.resourceCache.setData("csmShadowBias", newBiasArray);
                
                // Update the csmShadowBias slider array length if it exists
                const shadowBiasSetting = this.settingsSection?.getSetting("csmShadowBias");
                if (shadowBiasSetting && shadowBiasSetting.type === "slider" && shadowBiasSetting.isArray) {
                    // We need to recreate the slider with new array length
                    // For now, just update the array length property
                    shadowBiasSetting.arrayLength = newNumCascades;
                    shadowBiasSetting.value = newBiasArray as any;
                }
                
                this.disposeRenderTarget();
                this.renderTarget = this.initRenderTarget();
            }
        });
        // Initialize the default value in resource cache
        this.resourceCache.setData("numCascades", 3);
        this.settingsSection.addSlider({
            id: "csmShadowMapSize",
            label: "CSM Shadow Map Size",
            min: 1024,
            max: 6000,
            step: 1,
            defaultValue: 4096,
            numType: "int",
            onChange: (value: number) => {
                this.resourceCache.setData("csmShadowMapSize", value);
                this.disposeRenderTarget();
                this.renderTarget = this.initRenderTarget();
            }
        });
        // Initialize the default value in resource cache since onChange is only called on user interaction
        this.resourceCache.setData("csmShadowMapSize", 4096);
        this.settingsSection.addSlider({
            id: "lambda",
            label: "Lambda",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            defaultValue: 0.8,
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
        this.settingsSection.addSlider({
            id: "pcfRadius",
            label: "PCF Radius",
            min: 0.0,
            max: 15.0,
            step: 0.1,
            defaultValue: 7.0,
            numType: "float",
            onChange: (value: number) => {
                this.resourceCache.setData("pcfRadius", value);
            }
        });
        this.resourceCache.setData("pcfRadius", 7.0);
        this.settingsSection.addSlider({
            id: "jitterSize",
            label: "Jitter Size",
            min: 5,
            max: 32,
            step: 1,
            defaultValue: 8,
            numType: "int",
            onChange: (value: number) => {
                this.resourceCache.setData("jitterSize", value);
                this.requestJitterTextureUpdate();
            }
        });
        this.resourceCache.setData("jitterSize", 8);
        this.settingsSection.addSlider({
            id: "filterSize",
            label: "Filter Size",
            min: 1,
            max: 16,
            step: 1,
            defaultValue: 4,
            numType: "int",
            onChange: (value: number) => {
                this.resourceCache.setData("filterSize", value);
                this.requestJitterTextureUpdate();
            }
        });
        this.resourceCache.setData("filterSize", 4);
        this.settingsSection.addCheckbox({
            id: "usingPCF",
            label: "Using PCF",
            defaultValue: true,
            onChange: (value: boolean) => {
                this.resourceCache.setData("usingPCF", value);
            }
        });
        const numCascades = this.resourceCache.getData("numCascades") ?? 3;
        // Initialize csmShadowBias array with decreasing values for further cascades
        const defaultBiasArray = Array.from({ length: numCascades }, (_, i) => {
            // Further cascades should have less bias
            // Start with 0.001 for first cascade, reduce by 50% for each subsequent cascade
            return 0.001 * Math.pow(0.5, i);
        });
        this.resourceCache.setData("csmShadowBias", defaultBiasArray);
        
        this.settingsSection.addSlider({
            id: "csmShadowBias",
            label: "CSM Shadow Bias",
            min: 0.0, // Same min for all cascades
            max: 0.01, // Same max for all cascades
            step: 0.0001, // Same step for all cascades
            defaultValue: defaultBiasArray, // Array of default values - each cascade gets its own default
            numType: "float",
            isArray: true,
            arrayLength: numCascades,
            arrayIndex: 0,
            onChange: (value: number) => {
                const biasArray = this.settingsSection?.getSliderArray("csmShadowBias") ?? defaultBiasArray;
                this.resourceCache.setData("csmShadowBias", biasArray);
            }
        });
        this.settingsSection.addCheckbox({
            id: "cascadeDebug",
            label: "Cascade Debug",
            defaultValue: false,
            onChange: (value: boolean) => {
                this.resourceCache.setData("cascadeDebug", value);
            }
        });
        this.settingsSection.addCheckbox({
            id: "drawCascadeDebug",
            label: "Draw Cascade Frusta",
            defaultValue: false,
            onChange: (value: boolean) => {
                this.resourceCache.setData("drawCascadeDebug", value);
            }
        });
        // Initialize the default value in resource cache
        this.resourceCache.setData("drawCascadeDebug", false);
        this.settingsSection.addCheckbox({
            id: "debugPause",
            label: "Debug Pause Mode",
            defaultValue: false,
            onChange: (value: boolean) => {
                this.resourceCache.setData("debugPauseMode", value);
            }
        });
        this.settingsSection.addCheckbox({
            id: "showShadowMap",
            label: "Show Shadow Map",
            defaultValue: false,
            onChange: (value: boolean) => {
                this.resourceCache.setData("showShadowMap", value);
            }
        });
        // Reuse numCascades from above (line 260)
        const shadowMapCascadeMax = this.resourceCache.getData("numCascades") ?? 3;
        this.settingsSection.addSlider({
            id: "shadowMapCascade",
            label: `Shadow Map Cascade (0-${shadowMapCascadeMax - 1})`,
            min: 0,
            max: shadowMapCascadeMax - 1,
            step: 1,
            defaultValue: 0,
            numType: "int",
            onChange: (value: number) => {
                this.resourceCache.setData("shadowMapCascade", Math.floor(value));
            }
        });
    }

    private requestJitterTextureUpdate(): void {
        const updateJitterTexture = this.resourceCache.getData("updateJitterTexture");
        if (typeof updateJitterTexture !== "function") {
            return;
        }
        const jitterSize =
            this.settingsSection?.getSliderValue("jitterSize") ??
            this.resourceCache.getData("jitterSize") ??
            8;
        const filterSize =
            this.settingsSection?.getSliderValue("filterSize") ??
            this.resourceCache.getData("filterSize") ??
            4;
        updateJitterTexture(jitterSize, filterSize);
    }
}

function getCascadeSplits(resourceCache: ResourceCache, lambda: number) : number[] {
    const cascadeSplits : number[] = [];
    const numCascades = resourceCache.getData("numCascades") ?? 3;
    const nearFarPlanes = resourceCache.getData("pausedNearFarPlanes");
    const nearPlane = nearFarPlanes.near;
    const farPlane = nearFarPlanes.far;
    const clipRange = farPlane - nearPlane;
    const ratio = farPlane / nearPlane;
    for (let i = 0; i < numCascades; ++i){
        const p = (i+1) / numCascades;
        const logSplit = nearPlane * Math.pow(ratio,p);
        const uniSplit = nearPlane + clipRange * p;
        cascadeSplits[i] = uniSplit * (1.0-lambda) + logSplit * lambda;
    }
    resourceCache.setData("cascadeSplits", cascadeSplits);
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
    const cameraInfo = resourceCache.getData("pausedCameraInfo");
    const invViewProjMatrix = mat4.create();
    mat4.invert(invViewProjMatrix, cameraInfo.matViewProj);
    const corners = computeFrustumCornersFromViewProj(invViewProjMatrix);
    const serialized = corners.map((corner) => Array.from(corner));
    resourceCache.setData("cameraFrustumCorners", serialized);
    return corners;
}
    
function getSubfrustumCorners(resourceCache: ResourceCache, lambda: number) : vec4[][] {
    const subFrustumCorners : vec4[][] = [];
    const numCascades = resourceCache.getData("numCascades") ?? 3;
    const nearFarPlanes = resourceCache.getData("pausedNearFarPlanes");
    const cascadeSplits = getCascadeSplits(resourceCache, lambda);
    const nearPlane = nearFarPlanes.near;
    const farPlane = nearFarPlanes.far;

    // Get the full camera frustum corners in world space (order: x, y, then z)
    const fullFrustumCorners = getWorldSpaceFrustumCorners(resourceCache);

    for (let i = 0; i < numCascades; i++){
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
    resourceCache.setData("cameraSubFrusta", serialized);
    return subFrustumCorners;
}

function getLightSpaceMatrices(resourceCache: ResourceCache, light: DirectionalLight, lambda: number, zMultiplier : number) : mat4[] {
    const lightSpaceMatrices : mat4[] = [];
    const numCascades = resourceCache.getData("numCascades") ?? 3;
    const normalizedLightDir = vec3.normalize(vec3.create(), light.direction);
    const parallelThreshold = 0.99;
    for (let i = 0; i < numCascades; i++){
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
    resourceCache.setData("lightSpaceMatrices", lightSpaceMatrices);
    return lightSpaceMatrices;
}

