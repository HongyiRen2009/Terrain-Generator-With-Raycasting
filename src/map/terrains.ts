import { vec3 } from "gl-matrix";

/**
 * Color class
 */
export class Color {
  public r: number;
  public g: number;
  public b: number;
  /**
   * Creates color
   * @param r - Red value (out of 255)
   * @param g - Green value (out of 255)
   * @param b - Blue value (out of 255)
   */
  constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
  /**
   * Creates a vec3 from the color values
   * @returns vec3 with color values. 
   * @remarks Note that these values are automatically switched to out of 1.
   */
  createVec3(){
    return vec3.fromValues(this.r/255,this.g/255,this.b/255);
  }
}

/**
 * Our terrain!
 */
export interface Terrain {
  color: Color;
  reflectiveness: number; // Decimal 0-1
  roughness: number; // Decimal 0-1
  type: number; //
  /* Note about type
  Here is a list of types of surfaces (from chatgpt)
  1. Diffuse (Labertian)
  2. Specular (Perfect Mirror)
  3. Glossy (Microfacet Reflection)
  4. Transmission (Dielectric/Glass)
  5. Glossy Transmission (Rough Glass)
  6. Subsurface Scattering (SSS)
  7. Anisotropic Surfaces
  8. Emission
  8. Coated/Layered (Multiple)

  So the above type basically corresponds to the thing on the list
  */
  //TODO: More stuff as more implementations
}
/**
 * The class for calculating the information for all our terrain types
 */
export const Terrains: { [id: number]: Terrain } = {
  0: {
    color: new Color(0, 255, 0),
    reflectiveness: 0.2,
    roughness: 0.8,
    type: 1,
  },
  1: {
    color: new Color(0, 0, 255),
    reflectiveness: 0.2,
    roughness: 0.8,
    type: 2,
  },
  2: {
    color: new Color(255, 0, 0),
    reflectiveness: 0.2,
    roughness: 0.8,
    type: 1,
  }
};
