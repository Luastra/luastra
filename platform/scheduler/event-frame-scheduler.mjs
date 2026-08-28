function fail(message) { throw new Error(message); }

export class EventFrameScheduler {
  #requestFrame; #cancelFrame; #onError; #tasks = new Map(); #nextTaskId = 1; #frameHandle = null; #disposed = false;
  constructor({ requestFrame, cancelFrame, onError = (error) => { throw error; } } = {}) {
    if (typeof requestFrame !== "function") fail("requestFrame is required");
    if (typeof cancelFrame !== "function") fail("cancelFrame is required");
    if (typeof onError !== "function") fail("onError must be a function");
    this.#requestFrame = requestFrame; this.#cancelFrame = cancelFrame; this.#onError = onError;
  }
  get activeTaskCount() { return this.#tasks.size; }
  get framePending() { return this.#frameHandle !== null; }
  get disposed() { return this.#disposed; }
  subscribe(callback) {
    if (this.#disposed) fail("frame scheduler is disposed");
    if (typeof callback !== "function") fail("frame callback must be a function");
    const id = this.#nextTaskId++; this.#tasks.set(id, callback); this.#ensureFrame();
    return Object.freeze({ id, cancel: () => this.cancel(id) });
  }
  cancel(id) {
    if (!Number.isSafeInteger(id) || id < 1) return false;
    const removed = this.#tasks.delete(id);
    if (this.#tasks.size === 0 && this.#frameHandle !== null) { this.#cancelFrame(this.#frameHandle); this.#frameHandle = null; }
    return removed;
  }
  dispose() {
    if (this.#disposed) return false;
    this.#disposed = true; this.#tasks.clear();
    if (this.#frameHandle !== null) this.#cancelFrame(this.#frameHandle);
    this.#frameHandle = null; return true;
  }
  #ensureFrame() {
    if (this.#disposed || this.#tasks.size === 0 || this.#frameHandle !== null) return;
    this.#frameHandle = this.#requestFrame((timestamp) => this.#runFrame(timestamp));
  }
  #runFrame(timestamp) {
    if (this.#disposed) return;
    this.#frameHandle = null;
    for (const [id, callback] of [...this.#tasks.entries()]) {
      if (!this.#tasks.has(id)) continue;
      try { if (callback(timestamp) !== true) this.#tasks.delete(id); }
      catch (error) { this.#tasks.delete(id); this.#onError(error); }
    }
    this.#ensureFrame();
  }
}
