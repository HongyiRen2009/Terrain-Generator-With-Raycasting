//The idea is YOU SHOULD NEVER EDIT THIS FILE, Edit GameEngine.ts - Abstraction is fun or whatever.
import { GameEngine } from "./GameEngine";

const kMainCanvasId = "#MainCanvas";
const Engine = new GameEngine(kMainCanvasId);
let rafId: number | null = null;
const gameTick = (timestamp: number) => {
  Engine.tick(timestamp);
  rafId = requestAnimationFrame(gameTick);
};

rafId = requestAnimationFrame(gameTick);
