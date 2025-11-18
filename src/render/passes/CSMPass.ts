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
        const numCascades = this.resourceCache.getUniformData("numCascades") ?? 3;
        return numCascades;
    }
    public override setInvocationIndex(index: number): void { this.currentCascadeIndex = index; }
    
    protected initRenderTarget(): RenderTarget {
        // Use DEPTH_COMPONENT32F for float depth, or DEPTH_COMPONENT24 with UNSIGNED_INT
        // For shadow maps, DEPTH_COMPONENT32F with FLOAT is more reliable
        let shadowMapSize = this.resourceCache.getUniformData("shadowMapSize") ?? 4096; // Default to 4096 if not set
        // Store the default value if it wasn't set
        if (!this.resourceCache.getUniformData("shadowMapSize")) {
            this.resourceCache.setUniformData("shadowMapSize", shadowMapSize);
        }
        const numCascades = this.resourceCache.getUniformData("numCascades") ?? 3;
        const maxTextureSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
        
        // Clamp shadow map size to maximum supported texture size
        if (shadowMapSize > maxTextureSize) {
            console.warn(`[CSM] Shadow map size ${shadowMapSize} exceeds maximum texture size ${maxTextureSize}. Clamping to ${maxTextureSize}.`);
            shadowMapSize = maxTextureSize;
            this.resourceCache.setUniformData("shadowMapSize", shadowMapSize);
        }
        
        // Calculate memory requirements for texture array
        // DEPTH_COMPONENT32F with FLOAT uses 4 bytes per pixel
        const bytesPerPixel = 4;
        const totalMemoryBytes = shadowMapSize * shadowMapSize * numCascades * bytesPerPixel;
        
        // Conservative memory limit: 512MB (536,870,912 bytes)
        // Many GPUs, especially integrated or older ones, can't allocate more than this for a single texture
        const maxSafeMemoryBytes = 512 * 1024 * 1024; // 512 MB
        
        if (totalMemoryBytes > maxSafeMemoryBytes) {
            // Calculate the maximum safe size based on memory limit
            const maxSafeTexelsPerLayer = Math.floor(maxSafeMemoryBytes / (numCascades * bytesPerPixel));
            const maxSafeSize = Math.floor(Math.sqrt(maxSafeTexelsPerLayer));
            
            // Ensure we don't exceed MAX_TEXTURE_SIZE
            const clampedSize = Math.min(maxSafeSize, maxTextureSize);
            
            if (clampedSize < shadowMapSize) {
                console.warn(
                    `[CSM] Shadow map size ${shadowMapSize} would require ${(totalMemoryBytes / (1024 * 1024)).toFixed(2)}MB ` +
                    `(${shadowMapSize}×${shadowMapSize}×${numCascades}×4 bytes), exceeding safe limit of ${(maxSafeMemoryBytes / (1024 * 1024)).toFixed(0)}MB. ` +
                    `Clamping to ${clampedSize}×${clampedSize} (${((clampedSize * clampedSize * numCascades * bytesPerPixel) / (1024 * 1024)).toFixed(2)}MB).`
                );
                shadowMapSize = clampedSize;
                this.resourceCache.setUniformData("shadowMapSize", shadowMapSize);
            }
        }
        
        const depthInternalFormat = this.gl.DEPTH_COMPONENT32F;
        const depthFormat = this.gl.DEPTH_COMPONENT;
        const depthType = this.gl.FLOAT;
        
        // Create a single texture array instead of individual textures
        const shadowDepthTextureArray = TextureUtils.createTexture2DArray(
            this.gl, 
            shadowMapSize,  
            shadowMapSize, 
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
        if (this.resourceCache.getUniformData("disableSun")){
            return;
        }
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

        const shadowMapSize = this.resourceCache.getUniformData("shadowMapSize");
        this.gl.viewport(0, 0, shadowMapSize, shadowMapSize);
        this.gl.clearDepth(1.0);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
        this.gl.depthMask(true);

        this.gl.useProgram(this.program!);

        const sunLight = this.resourceCache.getUniformData("sunLight");
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
                this.resourceCache.setUniformData("csmEnabled", value);
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
                this.resourceCache.setUniformData("numCascades", newNumCascades);
                
                // Update shadowBias array to match new number of cascades
                const currentBiasArray = this.resourceCache.getUniformData("shadowBias") as number[] | undefined;
                const newBiasArray = Array.from({ length: newNumCascades }, (_, i) => {
                    if (currentBiasArray && i < currentBiasArray.length) {
                        // Keep existing values if available
                        return currentBiasArray[i];
                    }
                    // Otherwise use default: 0.001 * 0.5^i
                    return 0.001 * Math.pow(0.5, i);
                });
                this.resourceCache.setUniformData("shadowBias", newBiasArray);
                
                // Update the shadowBias slider array length if it exists
                const shadowBiasSetting = this.settingsSection?.getSetting("shadowBias");
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
        this.resourceCache.setUniformData("numCascades", 3);
        this.settingsSection.addSlider({
            id: "shadowMapSize",
            label: "Shadow Map Size",
            min: 1024,
            max: 6000,
            step: 1,
            defaultValue: 4096,
            numType: "int",
            onChange: (value: number) => {
                this.resourceCache.setUniformData("shadowMapSize", value);
                this.disposeRenderTarget();
                this.renderTarget = this.initRenderTarget();
            }
        });
        // Initialize the default value in resource cache since onChange is only called on user interaction
        this.resourceCache.setUniformData("shadowMapSize", 4096);
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
        this.settingsSection.addCheckbox({
            id: "usingPCF",
            label: "Using PCF",
            defaultValue: true,
            onChange: (value: boolean) => {
                this.resourceCache.setUniformData("usingPCF", value);
            }
        });
        const numCascades = this.resourceCache.getUniformData("numCascades") ?? 3;
        // Initialize shadowBias array with decreasing values for further cascades
        const defaultBiasArray = Array.from({ length: numCascades }, (_, i) => {
            // Further cascades should have less bias
            // Start with 0.001 for first cascade, reduce by 50% for each subsequent cascade
            return 0.001 * Math.pow(0.5, i);
        });
        this.resourceCache.setUniformData("shadowBias", defaultBiasArray);
        
        this.settingsSection.addSlider({
            id: "shadowBias",
            label: "Shadow Bias",
            min: 0.0, // Same min for all cascades
            max: 0.01, // Same max for all cascades
            step: 0.0001, // Same step for all cascades
            defaultValue: defaultBiasArray, // Array of default values - each cascade gets its own default
            numType: "float",
            isArray: true,
            arrayLength: numCascades,
            arrayIndex: 0,
            onChange: (value: number) => {
                const biasArray = this.settingsSection?.getSliderArray("shadowBias") ?? defaultBiasArray;
                this.resourceCache.setUniformData("shadowBias", biasArray);
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
            id: "drawCascadeDebug",
            label: "Draw Cascade Frusta",
            defaultValue: false,
            onChange: (value: boolean) => {
                this.resourceCache.setUniformData("drawCascadeDebug", value);
            }
        });
        // Initialize the default value in resource cache
        this.resourceCache.setUniformData("drawCascadeDebug", false);
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
        // Reuse numCascades from above (line 260)
        const shadowMapCascadeMax = this.resourceCache.getUniformData("numCascades") ?? 3;
        this.settingsSection.addSlider({
            id: "shadowMapCascade",
            label: `Shadow Map Cascade (0-${shadowMapCascadeMax - 1})`,
            min: 0,
            max: shadowMapCascadeMax - 1,
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
    const numCascades = resourceCache.getUniformData("numCascades") ?? 3;
    const nearFarPlanes = resourceCache.getUniformData("pausedNearFarPlanes");
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
    const numCascades = resourceCache.getUniformData("numCascades") ?? 3;
    const nearFarPlanes = resourceCache.getUniformData("pausedNearFarPlanes");
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
    resourceCache.setUniformData("cameraSubFrusta", serialized);
    return subFrustumCorners;
}

function getLightSpaceMatrices(resourceCache: ResourceCache, light: DirectionalLight, lambda: number, zMultiplier : number) : mat4[] {
    const lightSpaceMatrices : mat4[] = [];
    const numCascades = resourceCache.getUniformData("numCascades") ?? 3;
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
    resourceCache.setUniformData("lightSpaceMatrices", lightSpaceMatrices);
    return lightSpaceMatrices;
}

