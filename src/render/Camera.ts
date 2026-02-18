import { glMatrix, mat4, vec3 } from "gl-matrix";
import { GameEngine } from "../GameEngine";
import { DebugMenu } from "../DebugMenu";

export class Camera {
  position: vec3;
  lastPosition:vec3;
  sensitivity = 0.1;
  yaw = 0; // Left right rotation in degrees
  pitch = 0; // Up down rotation in degrees
  //Computed Dynamically
  front = vec3.fromValues(0, 0, -1);
  right = vec3.fromValues(1, 0, 0);
  up = vec3.fromValues(0, 1, 0);
  rayTracingFarPlane = 1000;
  pathtracingFarPlane = 10000000000;
  farPlane: number;
  speed: number;
  nearPlane: number = 0.1;
  fovy: number = 90; // Field of view in degrees
  debug: DebugMenu;
  constructor(position: vec3, debug: DebugMenu) {
    this.position = position;
    this.lastPosition = vec3.clone(position);
    this.debug=debug;
    this.debug.addElement("Pos", () => `${Math.round(position[0])}, ${Math.round(position[1])}, ${Math.round(position[2])}`);

    this.UpdateCameraVectors();
    this.speed = 0.02;
    this.farPlane = this.rayTracingFarPlane;
  }

  //enables Camera.XPosition instead of Camera.position[0]
  get XPosition() {
    return this.position[0];
  }
  set XPosition(value) {
    this.position[0] = value;
  }
  get YPosition() {
    return this.position[1];
  }
  set YPosition(value) {
    this.position[1] = value;
  }
  get ZPosition() {
    return this.position[2];
  }
  set ZPosition(value) {
    this.position[2] = value;
  }
  getPosition() {
    return this.position;
  }
  getViewMatrix() {
    let viewMatrix = mat4.create();
    let target = vec3.create();
    vec3.add(target, this.position, this.front); // Look-at target
    mat4.lookAt(viewMatrix, this.position, target, this.up);
    return viewMatrix;
  }
  calculateProjectionMatrix(canvasWidth: number, canvasHeight: number) {
    const matView = this.getViewMatrix();
    const matProj = mat4.create();
    const matViewProj = mat4.create();
    mat4.perspective(
      matProj,
      /* fovy= */ glMatrix.toRadian(this.fovy),
      /* aspectRatio= */ canvasWidth / canvasHeight,
      /* near, far= */ this.nearPlane,
      this.farPlane
    );
    mat4.multiply(matViewProj, matProj, matView);
    return matViewProj;
  }

  calculateProjectionMatrices(canvasWidth: number, canvasHeight: number) {
    const matView = this.getViewMatrix();
    const matProj = mat4.create();
    mat4.perspective(
      matProj,
      /* fovy= */ glMatrix.toRadian(this.fovy),
      /* aspectRatio= */ canvasWidth / canvasHeight,
      /* near, far= */ this.nearPlane,
      this.farPlane
    );
    return { matView, matProj };
  }

  UpdateCameraVectors() {
    let front = vec3.create();
    front[0] =
      Math.cos(GameEngine.toRadians(this.yaw)) *
      Math.cos(GameEngine.toRadians(this.pitch));
    front[1] = Math.sin(GameEngine.toRadians(this.pitch));
    front[2] =
      Math.sin(GameEngine.toRadians(this.yaw)) *
      Math.cos(GameEngine.toRadians(this.pitch));
    vec3.normalize(this.front, front); // Normalize to maintain unit length
    vec3.cross(this.right, this.front, this.up);
    vec3.normalize(this.right, this.right);
  }

  getNearFarPlanes(): { near: number; far: number } {
    return { near: this.nearPlane, far: this.farPlane };
  }
}
