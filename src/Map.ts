//Wrapper classes (will write stuff later)
//Check README for implementation pattern

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
    }

}

// Each individual chunk
class Chunk{
    private width: number = 32;
    private length: number = 32;
    private height: number;
    public constructor(height: number){
        this.height = height;
    }
}