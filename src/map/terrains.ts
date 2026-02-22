import { vec3 } from "gl-matrix";

/**
 * Color class
 */
export class Color {
  public r: number;
  public g: number;
  public b: number;

  static fromHex(hex: string): Color {
    // Remove the leading '#' if present
    if (hex.startsWith("#")) {
      hex = hex.slice(1);
    }

    // Parse the hex string
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return new Color(r, g, b);
  }

  /**
   * Creates color object from vec3
   * @param vec Each color should be 0-1
   * @returns Color Object
   */
  static fromVec3(vec: vec3): Color {
    return new Color(
      Math.min(255, Math.max(0, Math.floor(vec[0] * 255))),
      Math.min(255, Math.max(0, Math.floor(vec[1] * 255))),
      Math.min(255, Math.max(0, Math.floor(vec[2] * 255)))
    );
  }

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

  toString(): string {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }
  /**
   * Creates a vec3 from the color values
   * @returns vec3 with color values.
   * @remarks Note that these values are automatically switched to out of 1.
   */
  createVec3() {
    return vec3.fromValues(this.r / 255, this.g / 255, this.b / 255);
  }

  equals(other: Color) {
    return this.r === other.r && this.g === other.g && this.b === other.b;
  }
}

/**
 * Our terrain!
 */
export interface Terrain {
  name: string;
  color: Color;
  reflectiveness: number; // Decimal 0-1
  roughness: number; // Decimal 0-1
  type: 1 | 2 | 3 | 4 | 5; //look below
  /* Note about type (if no like search it up)
  Here is a list of types of surfaces (from chatgpt)
  1. Diffuse (Labertian) ; Regular matte surface
    NOTE: Roughness & Reflectivity takes no affect in the pathracer - we assume it to be pure lambertian. If you want that, see type 3
  2. Specular (Perfect Mirror)
    //Color doesn't matter
  3. Glossy (Microfacet Reflection)
    //Note: roughness 0 = perfect mirror, roughness 1 = diffuse
    // Reflectivity = How metallic it is
  4. Transmission (Dielectric/Glass; Tinted Glass, microfacet transmission)
    // Roughness refers to the blurriness of the transmission. 0 = perfect clear glass, 1 = frosted glass 
    //Note: reflectiveness refers to index of refraction
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
  //NOTE: WHEN ADD TERRAINS CHANGE NUM_TERRAINS in glslPath.ts
  // 0: Grass
  0: {
    name: "Grass",
    color: Color.fromHex("#6BAA3A"),
    reflectiveness: 0.02,
    roughness: 0.9,
    type: 3
  },
  // 1: Dirt
  1: {
    name: "Dirt",
    color: Color.fromHex("#7A5229"),
    reflectiveness: 0.03,
    roughness: 0.9,
    type: 3
  },
  // 2: Rock
  2: {
    name: "Rock",
    color: Color.fromHex("#8B8F91"),
    reflectiveness: 0.04,
    roughness: 0.85,
    type: 3
  },
  // 3: Snow
  3: {
    name: "Snow",
    color: Color.fromHex("#F7FBFF"),
    reflectiveness: 0.06,
    roughness: 0.95,
    type: 3
  },
  // 4: Water (slightly transmissive)
  4: {
    name: "Water",
    color: Color.fromHex("#2F86D1"),
    reflectiveness: 0.2,
    roughness: 0.1,
    type: 4
  },
  // 5: Sand / Beach
  5: {
    name: "Sand",
    color: Color.fromHex("#E3D2A3"),
    reflectiveness: 0.02,
    roughness: 0.92,
    type: 3
  }
};
