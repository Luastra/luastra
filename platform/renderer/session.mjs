import { Protocol } from "../protocol/generated/protocol.mjs";
import { chunkPatches, reconcile } from "./reconciler.mjs";

function fail(message) {
  throw new Error(message);
}

export class RendererSession {
  #adapter;
  #tree = null;
  #sequence = -1;
  #disposed = false;

  constructor(adapter) {
    if (!adapter || typeof adapter.applyBatch !== "function") fail("renderer adapter is required");
    this.#adapter = adapter;
  }

  get sequence() { return this.#sequence; }
  get disposed() { return this.#disposed; }

  render(tree, { sequence, focusId = null } = {}) {
    if (this.#disposed) fail("renderer session is disposed");
    if (!Number.isSafeInteger(sequence) || sequence !== this.#sequence + 1) {
      fail(`stale or out-of-order renderer sequence: ${sequence}`);
    }
    const patches = reconcile(this.#tree, tree);
    for (const batch of chunkPatches(patches, Protocol.limits.rendererBatchPatches)) this.#adapter.applyBatch(batch);
    if (focusId !== null) this.#adapter.applyBatch([{ kind: "focus", target: focusId, name: "", value: "" }]);
    this.#tree = tree;
    this.#sequence = sequence;
    return patches;
  }

  dispose() {
    if (this.#disposed) return false;
    if (this.#tree !== null) this.#adapter.applyBatch([{ kind: "remove", target: this.#tree.id, name: "", value: "" }]);
    this.#tree = null;
    this.#disposed = true;
    return true;
  }
}
