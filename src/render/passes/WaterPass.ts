import { RenderPass, VAOInputType } from "../renderSystem/RenderPass";
import { RenderUtils } from "../../utils/RenderUtils";
import { ResourceCache } from "../renderSystem/managers/ResourceCache";
import { TextureUtils } from "../../utils/TextureUtils";
import { RenderTarget } from "../renderSystem/RenderTarget";
import { VaoInfo } from "../renderSystem/managers/VaoManager";
import { RenderGraph } from "../renderSystem/RenderGraph";
import { mat4, vec3 } from "gl-matrix";
import { getUniformLocations } from "../renderSystem/managers/ResourceCache";
import { WorldUtils } from "../../utils/WorldUtils";
import waterVertexShaderSource from "../glsl/Water/Water.vert";
import waterFragmentShaderSource from "../glsl/Water/Water.frag";
import { Color } from "../../map/terrains";
import { SettingsManager } from "../../Settings";
export class WaterPass extends RenderPass {
    public VAOInputType: VAOInputType = VAOInputType.WATER;
    public pathtracerRender: boolean = true;
    constructor(gl: WebGL2RenderingContext, resourceCache: ResourceCache, canvas: HTMLCanvasElement, renderGraph?: RenderGraph, name?: string) {
        super(gl, resourceCache, canvas, renderGraph, name);
        this.canvas = canvas;
        this.program = RenderUtils.CreateProgram(gl, waterVertexShaderSource, waterFragmentShaderSource);
        this.uniforms = getUniformLocations(this.gl, this.program!, [
            "view",
            "proj",
            "model",
            "time",
            "cameraPos"
        ]);
        this.initSettings();
    }
    private initSettings() {
        SettingsManager.instance.createSection(
            document.getElementById("settings-section")!,
            "Water Settings"
        );
        SettingsManager.instance.addColorPickerToSection("Water Settings", {
            id: "waterColor",
            label: "Water Color",
            defaultValue: "#0a4580",
        });
        SettingsManager.instance.addSliderToSection("Water Settings", {
            id: "waterObscurity",
            label: "Water Obscurity",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            defaultValue: 0.8,
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
            id: "diffuseStrength",
            label: "Diffuse Strength",
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
            defaultValue: 0.5,
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

        SettingsManager.instance.attatchProgram(this.program!,
            ["waterColor", "waterObscurity","waterAttenuation", "ambientStrength", "diffuseStrength", "specularStrength", "shininess", "waterAmplitude", "waterFrequency","ssrThickness", "ssrMaxDistance", "ssrResolution", "fresnelF0", "fresnelPower"]);

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
        const cameraPos = this.resourceCache.getData("cameraPosition") as
            | vec3
            | undefined;
        if (!cameraPos) return;

        const cameraInfo = this.resourceCache.getData("CameraInfo");
        this.gl.uniformMatrix4fv(this.uniforms["view"], false, cameraInfo.matView);
        this.gl.uniformMatrix4fv(this.uniforms["proj"], false, cameraInfo.matProj);
        this.gl.uniform1f(this.uniforms["time"], performance.now() / 1000);
        this.gl.uniform3fv(this.uniforms["cameraPos"], cameraPos);
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
    public resize(width: number, height: number): void {
        this.renderTarget = this.initRenderTarget(width, height);
    }
}