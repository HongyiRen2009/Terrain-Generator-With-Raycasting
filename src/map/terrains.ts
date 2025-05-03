export class Color{
    public r : number;
    public g: number;
    public b: number;
    constructor(r: number, g: number, b: number){
        this.r = r;
        this.g = g;
        this.b = b;
    }
}

export interface Terrain{
    color: Color;
    illuminosity: number; // Decimal 0-1
    reflectiveness: number; // Decimal 0-1
    //TODO: More stuff as more implementations
}

export var Terrains: { [id: number]: Terrain; } = {
    0: {color: new Color(0,255,0), illuminosity: 1, reflectiveness: 0},
};