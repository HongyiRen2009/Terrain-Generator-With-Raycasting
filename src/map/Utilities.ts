export class Utilities {
  static average(l: number[]) {
    return l.reduce((a, b) => a + b) / l.length;
  }
}
