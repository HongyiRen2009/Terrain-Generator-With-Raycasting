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

export interface MaterialMap {
  /**
   * File Locations for each map
   */
  texScale: number;
  colorMap?: string;
  normalMap?: string;
  AOMap?: string;
  roughnessMap?: string;
  metallicityMap?: string;
  displacementMap?: string;
}

/**
 * Our terrain!
 */
export interface Terrain {
  color: Color;
  material?: MaterialMap;
  reflectiveness: number; // Decimal 0-1
  roughness: number; // Decimal 0-1
  metallicity: number; // Decimal 0-1
  emissivity:vec3; // RGB Emissive color (out of 1)
  /** BRDF / shading model: 1=diffuse, 2=specular mirror, 3=glossy, 4=transmission, 5=emission */
  brdfType: 1 | 2 | 3 | 4 | 5;
  /* BRDF types (if unsure, search "BRDF" or "Bidirectional Reflectance Distribution Function"):
  1. Diffuse (Lambertian) – matte; roughness/reflectivity ignored in path tracer (pure Lambertian there; use 3 for microfacet).
  2. Specular – perfect mirror (color unused).
  3. Glossy – microfacet reflection; roughness 0 = mirror, 1 = diffuse; reflectiveness = metallicity.
  4. Transmission – dielectric/glass; roughness = transmission blur; reflectiveness = IOR.
  5. Emission – emissive surface.
  */
  //TODO: More stuff as more implementations
}
/**
 * The class for calculating the information for all our terrain types
 */
export const Terrains: { [id: number]: Terrain } = {
  //NOTE: WHEN ADD TERRAINS CHANGE NUM_TERRAINS in glslPath.ts and Lighting.frag
  // 0: Grass
  0: {
    color: Color.fromHex("#6BAA3A"),
    material: {
      texScale: 0.1,
      colorMap: "assets/textures/grass/Grass005_2K-JPG_Color.jpg", 
      normalMap: "assets/textures/grass/Grass005_2K-JPG_NormalGL.jpg" , 
      AOMap: "assets/textures/grass/Grass005_2K-JPG_AmbientOcclusion.jpg",
      roughnessMap: "assets/textures/grass/Grass005_2K-JPG_Roughness.jpg" , 
      metallicityMap: undefined,
      displacementMap: "assets/textures/grass/Grass005_2K-JPG_Displacement.jpg" 
    },
    reflectiveness: 0.02,
    roughness: 0.9,
    metallicity: 0,
    emissivity: vec3.fromValues(0,0,0),
    brdfType: 3
  },
  // 1: Dirt
  1: {
    color: Color.fromHex("#7A5229"),
    material: {
      texScale: 1,
      colorMap: "assets/textures/dirt/Ground103_2K-JPG_Color.jpg", 
      normalMap: "assets/textures/dirt/Ground103_2K-JPG_NormalGL.jpg" , 
      AOMap: "assets/textures/dirt/Ground103_2K-JPG_AmbientOcclusion.jpg",
      roughnessMap: "assets/textures/dirt/Ground103_2K-JPG_Roughness.jpg" , 
      metallicityMap: undefined,
      displacementMap: "assets/textures/dirt/Ground103_2K-JPG_Displacement.jpg" 
    },
    reflectiveness: 0.03,
    roughness: 0.9,
    metallicity: 0,
    emissivity: vec3.fromValues(0,0,0),
    brdfType: 3
  },
  // 2: Rock
  2: {
    color: Color.fromHex("#8B8F91"),
    material: {
      texScale: 0.1,
      colorMap: "assets/textures/rocks/Rocks024L_2K-JPG_Color.jpg", 
      normalMap: "assets/textures/rocks/Rocks024L_2K-JPG_NormalGL.jpg" , 
      AOMap: "assets/textures/rocks/Rocks024L_2K-JPG_AmbientOcclusion.jpg",
      roughnessMap: "assets/textures/rocks/Rocks024L_2K-JPG_Roughness.jpg" , 
      metallicityMap: undefined,
      displacementMap: "assets/textures/rocks/Rocks024L_2K-JPG_Displacement.jpg" 
    },
    reflectiveness: 0.04,
    roughness: 0.85,
    metallicity: 0,
    emissivity: vec3.fromValues(0,0,0),
    brdfType: 3
  },
  // 3: Snow
  3: {
    color: Color.fromHex("#F7FBFF"),
    reflectiveness: 0.06,
    roughness: 0.95,
    metallicity: 0,
    emissivity: vec3.fromValues(0,0,0),
    brdfType: 3
  },
  // 4: Water (slightly transmissive)
  4: {
    color: Color.fromHex("#2F86D1"),
    reflectiveness: 0.2,
    roughness: 0.1,
    metallicity: 0,
    emissivity: vec3.fromValues(0,0,0),
    brdfType: 4
  },
  // 5: Sand / Beach
  5: {
    color: Color.fromHex("#E3D2A3"),
    material: {
      texScale: 0.1,
      colorMap: "assets/textures/sand/Ground054_2K-JPG_Color.jpg", 
      normalMap: "assets/textures/sand/Ground054_2K-JPG_NormalGL.jpg" , 
      AOMap: "assets/textures/sand/Ground054_2K-JPG_AmbientOcclusion.jpg",
      roughnessMap: "assets/textures/sand/Ground054_2K-JPG_Roughness.jpg" , 
      metallicityMap: undefined,
      displacementMap: "assets/textures/sand/Ground054_2K-JPG_Displacement.jpg" 
    },
    reflectiveness: 0.02,
    roughness: 0.92,
    metallicity: 0,
    emissivity: vec3.fromValues(0,0,0),
    brdfType: 3
  }
};
export const TerrainNorm = Object.values(Terrains).length*2;