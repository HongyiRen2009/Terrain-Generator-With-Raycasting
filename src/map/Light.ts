import { vec3 } from "gl-matrix";
import { Color } from "./terrains";

/**
 *  Represents a light source in the world.
 */
export class Light {
  position: vec3;
  color: Color; //Emission color
  showColor: Color; //color of what the light looks 
  /*Note:
  The idea is that color is the color emmitted, while showColor is the color it looks like. This is useful in sun-like lights where it emits white light but looks yellow. 
  */
  intensity: number;
  radius: number; // Default radius, can be adjusted

  constructor(
    position: vec3,
    color: Color,
    intensity: number,
    radius: number,
    showColor?: Color
  ) {
    this.position = position;
    this.color = color;
    this.intensity = intensity;
    this.radius = radius;
    this.showColor = showColor ? showColor : this.color;
  }
  public setPosition(position: vec3) {
    this.position = position;
  }
  public addPosition(position: vec3) {
    vec3.add(this.position, this.position, position);
  }
}
