export function isPointerLocked() {
  return document.pointerLockElement;
}

export function toRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}
