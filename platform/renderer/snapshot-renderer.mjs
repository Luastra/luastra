import { validateRendererPatch } from "../protocol/generated/protocol.mjs";

function fail(message) {
  throw new Error(message);
}

export class SnapshotRenderer {
  #nodes = new Map();
  #nextIdentity = 1;

  constructor(rootId = "host-root") {
    this.#nodes.set(rootId, {
      id: rootId,
      tag: "root",
      text: "",
      attributes: new Map(),
      events: new Map(),
      parent: null,
      children: [],
      identity: this.#nextIdentity++,
    });
  }

  get size() {
    return this.#nodes.size;
  }

  identity(id) {
    return this.#nodes.get(id)?.identity ?? null;
  }

  node(id) {
    const node = this.#nodes.get(id);
    if (!node) return null;
    return {
      id: node.id,
      tag: node.tag,
      text: node.text,
      attributes: Object.fromEntries(node.attributes),
      events: Object.fromEntries(node.events),
      parent: node.parent,
      children: [...node.children],
      identity: node.identity,
    };
  }

  applyBatch(patches) {
    if (!Array.isArray(patches) || !patches.every(validateRendererPatch)) {
      fail("renderer batch validation failed");
    }
    const snapshot = structuredClone(this.#nodes);
    const identity = this.#nextIdentity;
    try {
      for (const patch of patches) this.#apply(patch);
    } catch (error) {
      this.#nodes = snapshot;
      this.#nextIdentity = identity;
      throw error;
    }
  }

  #apply(patch) {
    if (patch.kind === "create") {
      if (this.#nodes.has(patch.target)) fail(`duplicate node: ${patch.target}`);
      this.#nodes.set(patch.target, {
        id: patch.target,
        tag: patch.value,
        text: "",
        attributes: new Map(),
        events: new Map(),
        parent: null,
        children: [],
        identity: this.#nextIdentity++,
      });
      return;
    }
    const node = this.#nodes.get(patch.target);
    if (!node) fail(`unknown target: ${patch.target}`);
    if (patch.kind === "text") node.text = patch.value;
    else if (patch.kind === "attribute") node.attributes.set(patch.name, patch.value);
    else if (patch.kind === "remove-attribute") node.attributes.delete(patch.name);
    else if (patch.kind === "event") {
      if (patch.value === "") node.events.delete(patch.name);
      else node.events.set(patch.name, patch.value);
    }
    else if (patch.kind === "place") {
      const child = this.#nodes.get(patch.name);
      if (!child) fail(`unknown child: ${patch.name}`);
      if (child.parent) {
        const oldParent = this.#nodes.get(child.parent);
        oldParent.children.splice(oldParent.children.indexOf(child.id), 1);
      }
      const beforeIndex = patch.value === "" ? node.children.length : node.children.indexOf(patch.value);
      if (beforeIndex < 0) fail(`unknown before node: ${patch.value}`);
      node.children.splice(beforeIndex, 0, child.id);
      child.parent = node.id;
    } else if (patch.kind === "append") {
      this.#apply({ kind: "place", target: patch.target, name: patch.value, value: "" });
    } else if (patch.kind === "remove") this.#remove(node.id);
    else if (patch.kind === "modal") node.attributes.set("open", patch.value);
    else if (patch.kind !== "focus") fail(`unsupported patch: ${patch.kind}`);
  }

  #remove(id) {
    const node = this.#nodes.get(id);
    for (const child of [...node.children]) this.#remove(child);
    if (node.parent) {
      const parent = this.#nodes.get(node.parent);
      parent.children.splice(parent.children.indexOf(id), 1);
    }
    this.#nodes.delete(id);
  }
}
