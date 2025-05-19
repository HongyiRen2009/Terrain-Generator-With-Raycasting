import { glMatrix, mat4, vec3 } from "gl-matrix";
import { GameEngine } from "../GameEngine";

export class Camera {
  position: vec3;
  sensitivity = 0.1;
  yaw = -90; // Left right rotation in degrees
  pitch = 0; // Up down rotation in degrees
  //Computed Dynamically
  front = vec3.fromValues(0, 0, -1);
  right = vec3.fromValues(1, 0, 0);
  up = vec3.fromValues(0, 1, 0);
  speed = 0.02;
  constructor(position: vec3) {
    this.position = position;

    this.UpdateCameraVectors();
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
  getViewMatrix() {
    let viewMatrix = mat4.create();
    let target = vec3.create();
    vec3.add(target, this.position, this.front); // Look-at target
    mat4.lookAt(viewMatrix, this.position, target, this.up);
    return viewMatrix;
  }
  calculateProjectionMatrix(canvasWidth: number, canvasHeight: number) {
    const matViewProj = mat4.create();
    const matView = this.getViewMatrix();
    const matProj = mat4.create();
    mat4.perspective(
      matProj,
      /* fovy= */ glMatrix.toRadian(90),
      /* aspectRatio= */ canvasWidth / canvasHeight,
      /* near, far= */ 0.1,
      100.0
    );
    mat4.multiply(matViewProj, matProj, matView);
    return matViewProj;
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
}
