//Wrapper classes (will write stuff later)

import { Chunk } from "./marching_cubes";

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