function fail(message) {
  throw new Error(message);
}

function collectIds(root) {
  if (!root || typeof root !== "object") fail("semantic renderer tree is required");
  const ids = new Set();
  const active = new Set();
  const visit = (node, depth) => {
    if (!node || typeof node !== "object" || typeof node.id !== "string" || !Array.isArray(node.children)) fail("invalid semantic renderer node");
    if (depth > 64 || ids.size >= 10_000) fail("semantic renderer tree exceeds motion lifecycle limits");
    if (active.has(node)) fail("semantic renderer tree cycle");
    if (ids.has(node.id)) fail(`duplicate semantic renderer target: ${node.id}`);
    active.add(node);
    ids.add(node.id);
    for (const child of node.children) visit(child, depth + 1);
    active.delete(node);
  };
  visit(root, 0);
  return ids;
}

export class MotionRendererSession {
  #renderer;
  #motion;
  #targets = new Set();
  #disposed = false;

  constructor(renderer, motion) {
    if (!renderer || typeof renderer.render !== "function" || typeof renderer.dispose !== "function") fail("renderer session is required");
    if (!motion || typeof motion.start !== "function" || typeof motion.disposeTarget !== "function" || typeof motion.dispose !== "function") fail("motion runtime is required");
    this.#renderer = renderer;
    this.#motion = motion;
  }

  get disposed() { return this.#disposed; }
  get targetCount() { return this.#targets.size; }

  render(tree, options) {
    if (this.#disposed) fail("motion renderer session is disposed");
    const nextTargets = collectIds(tree);
    const patches = this.#renderer.render(tree, options);
    for (const target of this.#targets) {
      if (!nextTargets.has(target)) this.#motion.disposeTarget(target);
    }
    this.#targets = nextTargets;
    return patches;
  }

  animate(target, property, descriptor, options) {
    if (this.#disposed) fail("motion renderer session is disposed");
    if (!this.#targets.has(target)) fail(`motion target is not rendered: ${target}`);
    return this.#motion.start(target, property, descriptor, options);
  }

  dispose() {
    if (this.#disposed) return false;
    this.#motion.dispose();
    this.#targets.clear();
    this.#disposed = true;
    this.#renderer.dispose();
    return true;
  }
}
