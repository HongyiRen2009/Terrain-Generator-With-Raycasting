export class Utilities {
  static worldFieldMap: Map<string, number> = new Map<string, number>();
  static average(l: number[]) {
    return l.reduce((a, b) => a + b) / l.length;
  }
  static setWorldFieldMap(fieldMap: Map<string, number>) {
    this.worldFieldMap = fieldMap;
  }
  static getWorldFieldMap() {
    return this.worldFieldMap;
  }
}
