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
  illuminosity: number; // Decimal 0-1
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
    illuminosity: 1,
    reflectiveness: 0.1,
    roughness: 0.5
  },
  1: {
    color: new Color(0, 0, 255),
    illuminosity: 1,
    reflectiveness: 0,
    roughness: 0.5
  },
  2: {
    color: new Color(255, 0, 0),
    illuminosity: 1,
    reflectiveness: 0,
    roughness: 0.5
  }
};
