//Wrapper classes (will write stuff later)

//Check README for implementation pattern
//Center chunk starts at 0,0 (probably)

//Entirety of the map
class Map{
    private height: number;
    //In Chunks
    private width: number;
    private length: number;
    
    private chunks: Chunk[];

    //TODO: Insert parameters
    public constructor(width: number, length: number, height: number){
        this.width = width;
        this.length = length;
        this.height = height;
        this.chunks = [];
        this.generate();
    }

    //Generates map
    public generate(){

    }

    //Renders map (later implementation we don't care abt it rn.)
    public render(){
    
    }

}

// Each individual chunk
class Chunk{
    // # "cubes"
    private width: number = 32;
    private length: number = 32;
    private height: number;

    private matrice: Point[];
    public constructor(height: number){
        this.height = height;
        this.matrice = [];
    }
}

class Point{
    //TODO: Write thingies
    private elevation: number;
    private x: number;
    private y: number;
    private type: string; //String for now. Probably should switch to a class later on. Will be stuff like "ground, water, etc."
    public constructor(x: number, y: number, elevation: number, type: string){
        this.x = x;
        this.y = y;
        this.elevation = elevation;
        this.type = type;
    }
}