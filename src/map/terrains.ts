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
    if (r < 0 || r > 255)
      throw new Error(
        `Incorrect color value: red is ${r}; expect a float from 0 to 255`
      );
    if (g < 0 || g > 255)
      throw new Error(
        `Incorrect color value: green is ${g}; expect a float from 0 to 255`
      );
    if (b < 0 || b > 255)
      throw new Error(
        `Incorrect color value: blue is ${b}; expect a float from 0 to 255`
      );
    this.r = r;
    this.g = g;
    this.b = b;
  }
  /**
   * Creates a vec3 from the color values
   * @returns vec3 with color values.
   * @remarks Note that these values are automatically switched to out of 1.
   */
  createVec3() {
    return vec3.fromValues(this.r / 255, this.g / 255, this.b / 255);
  }
}

/**
 * Our terrain!
 */
export interface Terrain {
  color: Color;
  reflectiveness: number; // Decimal 0-1
  roughness: number; // Decimal 0-1
  type: 1 | 2 | 3 | 4 | 5; //look below
  /* Note about type (if no like search it up)
  Here is a list of types of surfaces (from chatgpt)
  1. Diffuse (Labertian) ; Regular matte surface
  2. Specular (Perfect Mirror)
    //Color doesn't matter
  3. Glossy (Microfacet Reflection)
    //Note: roughness 0 = perfect mirror, roughness 1 = diffuse
  4. Transmission (Dielectric/Glass; Tinted Glass)
    //Note: roughness refers to index of refraction
  5. Emission; Emissive surface (not as strong as regular light)


  //Future: consider Anisotropic surfaces (like brushed metal); Basically needs full textures

  So the above type basically corresponds to the thing on the list
  */
  //TODO: More stuff as more implementations
}
/**
 * The class for calculating the information for all our terrain types
 */
export const Terrains: { [id: number]: Terrain } = {
  //NOTE: WHEN ADD TERRAINS CHANGE numberTerrains in packTerrainTypes in BVHUtils.ts and NUM_TERRAINS in glslPath.ts
  0: {
    //Regular ground
    color: new Color(0, 255, 0),
    reflectiveness: 0.2,
    roughness: 0.8,
    type: 1
  },
  1: {
    // Perfect mirror
    color: new Color(0, 0, 255),
    reflectiveness: 0.2,
    roughness: 0.8,
    type: 2
  },
  2: {
    // Glossy surface
    color: new Color(255, 0, 0),
    reflectiveness: 0.2,
    roughness: 0.0,
    type: 3
  },
  3: {
    // Tinted glass
    color: new Color(100, 0, 0), //red tint
    reflectiveness: 0.2,
    roughness: 1.5, //Index of refraction (look up)
    type: 4
  },
  4: {
    // Emissive surface
    color: new Color(255, 0, 0),
    reflectiveness: 0.2,
    roughness: 0.8,
    type: 5
  }
};
