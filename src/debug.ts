interface Dictionary<T> {
    [Key: string]: T;
}
type Supplier<T> = () => T;


/**
 * Our class for debug screen
 * Note: using this slows down performance. To disable set the attribute debugMode to false.
 */
export class debugMenu{
    private object: HTMLElement;
    private things: Dictionary<Supplier<number>>; // Only working with numbers to lazy to do smth else
    private _debugMode: boolean = true;
    private lastUpdate: number;
    constructor(mode: boolean = true){
        this.object = document.getElementById("debugMenu")!;
        this.things = {}
        this.debugMode = mode;
        this.lastUpdate = 0;
    }
    update(): void{
        if(this.debugMode){
            //cause our fps is capped at 60, and generally 5 frame of old data won't hurt, we should only update ever 1000/12 milliseconds (editing dom is very slow)
            if(Date.now() - this.lastUpdate >= 1000/12){
                this.object.innerHTML= "";
                for (let key in this.things) {
                    let val = this.things[key];
                    let a = val();
                    this.object.innerHTML += 
                    `
                    <p>${key}: ${a}</p>
                    `;
                }
                this.lastUpdate = Date.now();
            }
        }
    }
    /**
     * Adds thing to be debug
     * @param key The id/identifier on screen
     * @param supplier Has to be the SUPPLIER to the object you now want to read. Essentially, if you want it to always show the variable counter, then you would put ()=>counter in this area
     */
    addElement(key: string, supplier: Supplier<number>): void {
        this.things[key]=supplier;
    }
    removeElement(key: string){
        eval(`delete this.things.${key}`);
    }
    set debugMode(mode: boolean){
        this._debugMode = mode;
        if(mode == true){
            this.object.style.display = 'block';
        }else{
            this.object.style.display = 'none';
        }
    }
    get debugMode(){
        return this._debugMode;
    }
}