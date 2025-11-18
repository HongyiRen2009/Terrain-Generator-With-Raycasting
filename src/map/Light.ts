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
