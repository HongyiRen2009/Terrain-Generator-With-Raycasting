import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { RenderUtils } from "../../utils/RenderUtils";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { TextureUtils } from "../../utils/TextureUtils";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { mat4, vec2, vec3 } from "gl-matrix";
import { getUniformLocations } from "../renderSystem/managers/ResourceCache";
import { WorldUtils } from "../../utils/WorldUtils";
import waterVertexShaderSource from "../glsl/Water/Water.vert";
import waterFragmentShaderSource from "../glsl/Water/Water.frag";
import { Color } from "../../map/terrains";
import { SettingsManager } from "../../Settings";
import normalMap from "../../../assets/waterNormalMap.png";
import { texture } from "three/tsl";

export class WaterPass extends RenderPass {
    public VAOInputType: VAOInputType = VAOInputType.WATER;
    public pathtracerRender: boolean = true;
    private normalMapTexture: WebGLTexture;
    private waveProperties = {
        waveCount: 12,
        waveDirs:[] as vec2[],
        waveSpeeds:[] as number[],
        wavePhases:[] as number[]
    }
    
    constructor(gl: WebGL2RenderingContext, resourceCache: ResourceCache, canvas: HTMLCanvasElement, renderGraph?: RenderGraph, name?: string) {
        super(gl, resourceCache, canvas, renderGraph, name);
        this.canvas = canvas;
        this.program = RenderUtils.CreateProgram(gl, waterVertexShaderSource, waterFragmentShaderSource);
        this.uniforms = getUniformLocations(this.gl, this.program!, [
            "view",
            "proj",
            "model",
            "time",
            "cameraPos",
            "WAVE_COUNT",
        ]);
        
        this.initSettings();
        this.GenerateWaveProperties(this.waveProperties.waveCount);
        this.normalMapTexture = this.createNormalMapTexture();
    }
    private initSettings() {
        SettingsManager.instance.createSection(
            document.getElementById("settings-section")!,
            "Water Settings"
        );
        SettingsManager.instance.addColorPickerToSection("Water Settings", {
            id: "waterColor",
            label: "Water Color",
            defaultValue: "#002d57",
        });
        SettingsManager.instance.addColorPickerToSection("Water Settings", {
            id:"shallowWaterColor",
            label: "Shallow Water Color",
            defaultValue: "#0066cc",
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "shallowWaterDepth",
            label: "Shallow Water Depth",
            min: 0.1,
            max: 10.0,
            step: 0.01,
            defaultValue: 2.25,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "waterObscurity",
            label: "Water Obscurity",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            defaultValue: 0.6,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "waterAttenuation",
            label: "Water Attenuation",
            min: 0.001,
            max: 0.1,
            step: 0.001,
            defaultValue: 0.03,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "ambientStrength",
            label: "Ambient Strength",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            defaultValue: 0.1,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "specularStrength",
            label: "Specular Strength",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            defaultValue: 0.5,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "shininess",
            label: "Shininess",
            min: 1.0,
            max: 256.0,
            step: 1.0,
            defaultValue: 32.0,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "waterAmplitude",
            label: "Water Amplitude",
            min: 0.0,
            max: 2.0,
            step: 0.01,
            defaultValue: 0.16,
        });
                SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "waveCount",
            label: "Wave Count",
            min: 1,
            max: 128,
            step: 1,
            defaultValue: this.waveProperties.waveCount,
            onChange: (value: number) => {
                this.GenerateWaveProperties(value);
            }
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "globalWaveSpeed",
            label: "Wave Speed",
            min: 0.0,
            max: 5.0,
            step: 0.01,
            defaultValue: 2.0,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "waterFrequency",
            label: "Water Frequency",
            min: 0.01,
            max: 1.0,
            step: 0.001,
            defaultValue: 0.5,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "persistence",
            label: "Wave Persistence",
            min: 0.1,
            max: 1.0,
            step: 0.01,
            defaultValue: 0.6,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "lacunarity",
            label: "Wave Lacunarity",
            min: 1.0,
            max: 4.0,
            step: 0.1,
            defaultValue: 1.2,
        });
        SettingsManager.instance.addCheckboxToSection("Water Settings", {
            id: "useSSR",
            label: "Use SSR",
            defaultValue: true,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "ssrThickness",
            label: "SSR Thickness",
            min: 0.01,
            max: 1.0,
            step: 0.01,
            defaultValue: 0.03,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "ssrMaxDistance",
            label: "SSR Max Distance",
            min: 1.0,
            max: 500.0,
            step: 1.0,
            defaultValue: 100.0,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "ssrResolution",
            label: "SSR Resolution",
            min: 0.01,
            max: 1.0,
            step: 0.01,
            defaultValue: 0.2,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "fresnelF0",
            label: "Fresnel F0",
            min: 0.0, max: 1.0,
            step: 0.01,
            defaultValue: 0.02,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "fresnelPower",
            label: "Fresnel Power",
            min: 1.0,
            max: 10.0,
            step: 0.1,
            defaultValue: 1.7,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "refractionDistortionStrength",
            label: "Refraction Distortion Strength",
            min: 0.0,
            max: 0.1,
            step: 0.001,
            defaultValue: 0.01,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "normalMapFrequency",
            label: "Normal Map Frequency",
            min: 0.01,
            max: 1.0,
            step: 0.01,
            defaultValue: 0.2,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "normalMapScrollSpeed",
            label: "Normal Map Scroll Speed",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            defaultValue: 0.2,
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "normalMapStrength",
            label: "Normal Map Strength",
            min: 0.0,
            max: 3.0,
            step: 0.01,
            defaultValue: 0.5,
        });

        SettingsManager.instance.attatchProgram(this.program!,
            ["waterColor","shallowWaterColor","shallowWaterDepth","waterObscurity","waterAttenuation", "ambientStrength", "specularStrength", "shininess", "waterAmplitude", "waterFrequency", "persistence", "lacunarity",     "ssrThickness", "ssrMaxDistance", "ssrResolution", "fresnelF0", "fresnelPower","refractionDistortionStrength","normalMapFrequency", "normalMapScrollSpeed", "normalMapStrength","globalWaveSpeed","useSSR"]);

    }
    private GenerateWaveProperties(count: number) {
        const waveCount = count;
        const waveDirs: vec2[] = [];
        const waveSpeeds: number[] = [];
        const wavePhases: number[] = [];
        for(let i = 0; i < waveCount; i++) {
            const angle = Math.random() * 2 * Math.PI;
            waveDirs.push(vec2.fromValues(Math.cos(angle), Math.sin(angle)));
            waveSpeeds.push(1.0 + (Math.random() - 0.5));
            wavePhases.push(Math.random() * 2 * Math.PI);
        }
        this.waveProperties = { waveCount, waveDirs, waveSpeeds, wavePhases };
    }
    private attachWavePropertiesToShader() {
        this.gl.uniform1i(this.uniforms["WAVE_COUNT"], this.waveProperties.waveCount);
        for(let i = 0; i < this.waveProperties.waveCount; i++) {
            this.gl.uniform2fv(this.gl.getUniformLocation(this.program!, `WAVE_DIRS[${i}]`), this.waveProperties.waveDirs[i]);
            this.gl.uniform1f(this.gl.getUniformLocation(this.program!, `WAVE_SPEED[${i}]`), this.waveProperties.waveSpeeds[i]);
            this.gl.uniform1f(this.gl.getUniformLocation(this.program!, `WAVE_PHASE[${i}]`), this.waveProperties.wavePhases[i]);
        }
    }
    protected initRenderTarget(width?: number, height?: number): RenderTarget {
        const w = width || this.canvas.width;
        const h = height || this.canvas.height;
        const waterColorTexture = TextureUtils.createTexture2D(this.gl, w, h,
            this.gl.RGBA8,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE);
        const fbo = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, waterColorTexture, 0);
        this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error("Framebuffer not complete: " + status.toString());
        }
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        return {
            fbo: fbo,
            textures: {
                waterColorTexture
            },
        }
    }
    public render(vao_info: VaoInfo[], pathtracerOn: boolean): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderTarget!.fbo);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.program);
        const gBuffer = this.renderGraph?.getOutputs(this);
        TextureUtils.bindTex(this.gl, this.program!, gBuffer!["depth"], "depthTexture", 0);
        TextureUtils.bindTex(this.gl, this.program!, gBuffer!["sceneTexture"], "sceneTexture", 1);
        TextureUtils.bindTex(this.gl, this.program!, this.normalMapTexture, "normalMap", 2);
        const cameraPos = this.resourceCache.getData("cameraPosition") as
            | vec3
            | undefined;
        if (!cameraPos) return;

        const cameraInfo = this.resourceCache.getData("CameraInfo");
        this.gl.uniformMatrix4fv(this.uniforms["view"], false, cameraInfo.matView);
        this.gl.uniformMatrix4fv(this.uniforms["proj"], false, cameraInfo.matProj);
        this.gl.uniform1f(this.uniforms["time"], performance.now() / 1000);
        this.gl.uniform3fv(this.uniforms["cameraPos"], cameraPos);
        this.attachWavePropertiesToShader();
        SettingsManager.instance.updateProgramUniforms(this.gl, this.program!);
        const disableSun = this.resourceCache.getData("disableSun") ?? false;
        WorldUtils.updateLights(
            this.gl,
            this.program!,
            this.resourceCache.getData("lights"),
            disableSun
                ? { direction: vec3.fromValues(0, -1, 0), color: new Color(255, 255, 255), intensity: 0 }
                : this.resourceCache.getData("sunLight")
        );
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        const viewProj = mat4.create();
        mat4.multiply(viewProj, cameraInfo.matProj, cameraInfo.matView);
        const frustum = WorldUtils.extractFrustumPlanes(viewProj);
        for (const vao of vao_info) {
            if (vao.boundingBox && !WorldUtils.aabbInFrustum(vao.boundingBox, frustum, vao.modelMatrix)) {
                continue;
            }
            this.gl.uniformMatrix4fv(this.uniforms["model"], false, vao.modelMatrix);

            this.gl.bindVertexArray(vao.vao);

            this.gl.drawElements(this.gl.TRIANGLES, vao.indexCount, this.gl.UNSIGNED_INT, 0);
        }
        this.gl.bindVertexArray(null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
    private createNormalMapTexture(): WebGLTexture {
        const normalMapImage = new Image();
        normalMapImage.src = normalMap;
        const texture = this.gl.createTexture()!;
        normalMapImage.onload = () => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, normalMapImage);
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        };
        return texture;
    }
    public resize(width: number, height: number): void {
        this.renderTarget = this.initRenderTarget(width, height);
    }
}