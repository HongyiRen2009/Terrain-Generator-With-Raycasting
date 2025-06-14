/**
 * Color class
 */
export class Color {
  public r: number;
  public g: number;
  public b: number;
  constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
}

/**
 * Our terrain!
 */
export interface Terrain {
  color: Color;
  reflectiveness: number; // Decimal 0-1
  roughness: number; // Decimal 0-1
  //TODO: More stuff as more implementations
}
/**
 * The class for calculating the information for all our terrain types
 */
export const Terrains: { [id: number]: Terrain } = {
  0: {
    color: new Color(0, 255, 0),
    reflectiveness: 0.2,
    roughness: 0.8
  },
  1: {
    color: new Color(0, 0, 255),
    reflectiveness: 0.2,
    roughness: 0.8
  },
  2: {
    color: new Color(255, 0, 0),
    reflectiveness: 0.2,
    roughness: 0.8
  }
};
