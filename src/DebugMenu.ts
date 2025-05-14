interface Dictionary<T> {
    [Key: string]: T;
}
type Supplier<T> = () => T;


/**
 * Our class for debug screen
 * Note: using this slows down performance. To disable set the attribute debugMode to false.
 */
export class DebugMenu{
    private object: HTMLElement;
    private objects: Dictionary<Supplier<number>>; // Only working with numbers to lazy to do smth else
    private _debugMode: boolean = true;
    private lastUpdate: number;
    private updateSpeed: number; //In fps
    constructor(mode: boolean = true){
        this.object = document.getElementById("debugMenu")!;
        this.objects = {}
        this.debugMode = mode;
        this.lastUpdate = 0;
        this.updateSpeed = 10;
    }
    update(): void{
        if(this.debugMode){
            if(Date.now() - this.lastUpdate >= 1000/this.updateSpeed){
                this.object.innerHTML= "";
                for (let key in this.objects) {
                    let val = this.objects[key];
                    let a = val();
                    let elem = document.createElement("p");
                    elem.textContent = `${key}: ${a}`;
                    this.object.appendChild(elem);
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
        this.objects[key]=supplier;
    }
    removeElement(key: string){
        delete this.objects[key];
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