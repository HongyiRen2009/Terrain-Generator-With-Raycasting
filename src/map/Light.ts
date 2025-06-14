import { vec3 } from "gl-matrix";

/**
 *  Represents a light source in the world.
 */
export class Light {
  position: vec3;
  color: vec3;
  intensity: number;
  radius: number; // Default radius, can be adjusted

  constructor(position: vec3, color: vec3, intensity: number, radius: number) {
    this.position = position;
    this.color = color;
    this.intensity = intensity;
    this.radius = radius;
  }
  public setPosition(position: vec3) {
    this.position = position;
  }
  public addPosition(position: vec3) {
    vec3.add(this.position, this.position, position);
  }
}
