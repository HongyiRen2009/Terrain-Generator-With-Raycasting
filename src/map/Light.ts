import { vec3 } from "gl-matrix";
import { Color } from "./terrains";

/**
 *  Represents a light source in the world.
 */
export class PointLight {
  position: vec3;
  color: Color; //Emission color
  intensity: number;
  radius: number; // Default radius, can be adjusted
  showColor?: Color; //color of what the light looks
  direction?: vec3;
  name: string;
  visualizerEnabled: boolean;
  showShadowMap: boolean;

  constructor(
    position: vec3,
    color: Color,
    intensity: number,
    radius: number,
    showColor?: Color,
    name: string = "Point Light"
  ) {
    this.position = position;
    this.color = color;
    this.intensity = intensity;
    this.radius = radius;
    this.showColor = showColor ? showColor : this.color;
    this.name = name;
    this.visualizerEnabled = false;
    this.showShadowMap = false;
  }
  public setPosition(position: vec3) {
    this.position = position;
  }
  public addPosition(position: vec3) {
    vec3.add(this.position, this.position, position);
  }
}

export class DirectionalLight {
  direction: vec3;
  color: Color;
  intensity: number;
  constructor(direction: vec3, color: Color, intensity: number) {
    this.direction = direction;
    this.color = color;
    this.intensity = intensity;
  }
}

export function enableShadow(lights: PointLight[], lightIndex: number, numShadowedLights: number): {lights: PointLight[], numShadowedLights: number} {
   if (lightIndex < numShadowedLights) return {lights, numShadowedLights};
  const light = lights[lightIndex];
  let newLights = [...lights];
  newLights.splice(lightIndex, 1);
  newLights.splice(numShadowedLights, 0, light);
  return {lights: newLights, numShadowedLights: numShadowedLights + 1};
}

export function disableShadow(lights: PointLight[], lightIndex: number, numShadowedLights: number): {lights: PointLight[], numShadowedLights: number} {
  if (lightIndex >= numShadowedLights) return {lights, numShadowedLights};
  const light = lights[lightIndex];
  let newLights = [...lights];
  newLights.splice(lightIndex, 1);
  newLights.push(light);
  return {lights: newLights, numShadowedLights: numShadowedLights - 1};
}

export function addShadowedLight(lights: PointLight[], light: PointLight, numShadowedLights: number): {lights: PointLight[], numShadowedLights: number} {
  if (numShadowedLights >= lights.length) return { lights, numShadowedLights };
  let newLights = [...lights];
  newLights.splice(numShadowedLights, 0, light);
  return { lights: newLights, numShadowedLights: numShadowedLights + 1 };
}