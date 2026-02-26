//The idea is YOU SHOULD NEVER EDIT THIS FILE, Edit GameEngine.ts - Abstraction is fun or whatever.
import { GameEngine } from "./GameEngine";

const kMainCanvasId = "MainCanvas";
const mainCanvas = document.getElementById(kMainCanvasId)! as HTMLCanvasElement
var rafId: number | null = null;
function setup(){
  const Engine = new GameEngine(mainCanvas);
  const gameTick = (timestamp: number) => {
    Engine.tick(timestamp);
    rafId = requestAnimationFrame(gameTick);
  };

  rafId = requestAnimationFrame(gameTick);
}

/**
 * Handle Context Lost
 * Triggered when the GPU crashes or the OS takes over resources.
 */
mainCanvas.addEventListener('webglcontextlost', (event: Event) => {
    // We must cast the generic Event to WebGLContextEvent to access specific properties if needed,
    // though preventDefault() exists on the base Event type.
    const glEvent = event as WebGLContextEvent;

    // CRITICAL: Tells the browser "Do not assume this app is dead; I will handle restoration."
    glEvent.preventDefault();

    const WEBGL_INFO_TEXT ="WebGL context lost. Pausing simulation... <br>This most likely happens because a shader is too slow <br>Please wait while we recover context <br>" 
    console.warn(WEBGL_INFO_TEXT);
    const infoBox =document.getElementById("loadingBox")!;
    infoBox.style.display = "block";
    infoBox.innerHTML = WEBGL_INFO_TEXT;


    // Stop the render loop to prevent errors from trying to draw to a dead context
    if (rafId) {
        cancelAnimationFrame(rafId);
    }

});

/**
 * Handle Context Restored
 * Triggered by the browser when the GPU is ready again.
 */
mainCanvas.addEventListener('webglcontextrestored', (event: Event) => {
    const WEBGL_INFO_TEXT ="WebGL context restored! Feel free to reload the page." 
    console.warn(WEBGL_INFO_TEXT);
    const infoBox =document.getElementById("loadingBox")!;
    infoBox.innerHTML += WEBGL_INFO_TEXT;
});

setup();

