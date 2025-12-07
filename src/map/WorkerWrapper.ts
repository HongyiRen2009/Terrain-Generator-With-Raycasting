export class WorkerWrapper {
  public worker: Worker;
  private busy: boolean = false;

  constructor(worker: Worker) {
    this.worker = worker;
  }

  async generate(message: any): Promise<any> {
    if (this.busy) {
      // Wait until not busy
      await new Promise<void>((resolve) => {
        const check = () => {
          if (!this.busy) resolve();
          else setTimeout(check, 10);
        };
        check();
      });
    }
    this.busy = true;
    return new Promise((resolve) => {
      this.worker.onmessage = (event) => {
        this.busy = false;
        resolve(event);
      };
      this.worker.postMessage(message);
    });
  }
}
