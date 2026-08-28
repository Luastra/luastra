function fail(message) { throw new Error(message); }
function stable(value) { if (Array.isArray(value)) return value.map(stable); if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])); return value; }
function collect(root) {
  if (!root || typeof root !== "object") fail("semantic renderer tree is required");
  const ids = new Set(); const motions = new Map(); const active = new Set();
  const visit = (node, depth) => {
    if (!node || typeof node !== "object" || typeof node.id !== "string" || !Array.isArray(node.children)) fail("invalid semantic renderer node");
    if (depth > 64 || ids.size >= 10_000) fail("semantic renderer tree exceeds motion lifecycle limits");
    if (active.has(node)) fail("semantic renderer tree cycle"); if (ids.has(node.id)) fail(`duplicate semantic renderer target: ${node.id}`);
    active.add(node); ids.add(node.id);
    if (node.motion !== null && node.motion !== undefined) motions.set(node.id, { value: node.motion, signature: JSON.stringify(stable(node.motion)) });
    for (const child of node.children) visit(child, depth + 1); active.delete(node);
  };
  visit(root, 0); return { ids, motions };
}

export class MotionRendererSession {
  #renderer; #motion; #targets = new Set(); #declarations = new Map(); #deferred = new Map(); #deferActive = false; #disposed = false;
  constructor(renderer, motion) {
    if (!renderer || typeof renderer.render !== "function" || typeof renderer.dispose !== "function") fail("renderer session is required");
    if (!motion || typeof motion.prepare !== "function" || typeof motion.start !== "function" || typeof motion.disposeTarget !== "function" || typeof motion.dispose !== "function") fail("motion runtime is required");
    this.#renderer = renderer; this.#motion = motion;
  }
  get disposed() { return this.#disposed; }
  get targetCount() { return this.#targets.size; }
  render(tree, options) {
    if (this.#disposed) fail("motion renderer session is disposed");
    if (options?.deferMotion === true) this.#deferActive = true;
    const next = collect(tree); const patches = this.#renderer.render(tree, options);
    for (const target of this.#targets) if (!next.ids.has(target)) { this.#motion.disposeTarget(target); this.#clearDeferredTarget(target); }
    for (const [target, previous] of this.#declarations) if (next.ids.has(target) && next.motions.get(target)?.signature !== previous.signature) { this.#motion.disposeTarget(target); this.#clearDeferredTarget(target); }
    for (const [target, declaration] of next.motions) {
      if (this.#declarations.get(target)?.signature === declaration.signature) continue;
      for (const [property, descriptor] of Object.entries(declaration.value)) {
        if (this.#deferActive) this.#deferred.set(`${target}\u0000${property}`, { target, property, descriptor, prepared: this.#motion.prepare(target, property, descriptor) });
        else this.#motion.start(target, property, descriptor);
      }
    }
    this.#targets = next.ids; this.#declarations = next.motions; return patches;
  }
  activateDeferredMotion() {
    if (this.#disposed) fail("motion renderer session is disposed");
    if (!this.#deferActive) return 0;
    this.#deferActive = false;
    const deferred = [...this.#deferred.values()]; this.#deferred.clear();
    let started = 0;
    for (const entry of deferred) {
      if (entry.prepared.reduced) continue;
      this.#motion.start(entry.target, entry.property, entry.descriptor); started += 1;
    }
    return started;
  }
  animate(target, property, descriptor, options) { if (this.#disposed) fail("motion renderer session is disposed"); if (!this.#targets.has(target)) fail(`motion target is not rendered: ${target}`); return this.#motion.start(target, property, descriptor, options); }
  dispose() { if (this.#disposed) return false; this.#motion.dispose(); this.#targets.clear(); this.#declarations.clear(); this.#deferred.clear(); this.#deferActive = false; this.#disposed = true; this.#renderer.dispose(); return true; }
  #clearDeferredTarget(target) { for (const [key, entry] of this.#deferred) if (entry.target === target) this.#deferred.delete(key); }
}
