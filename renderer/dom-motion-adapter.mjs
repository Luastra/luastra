const supportedProperties = new Set(["opacity", "translateX", "translateY", "scaleX", "scaleY", "rotationDeg", "rotationYDeg"]);

function fail(message) {
  throw new Error(message);
}

function compact(value) {
  return String(Number(value.toFixed(6)));
}

export class DomMotionAdapter {
  #resolveNode;
  #states = new Map();

  constructor(resolveNode) {
    if (typeof resolveNode !== "function") fail("DOM motion node resolver is required");
    this.#resolveNode = resolveNode;
  }

  applyMotionValue(target, property, value) {
    if (!supportedProperties.has(property) || !Number.isFinite(value)) fail("invalid DOM motion update");
    const node = this.#resolveNode(target);
    if (!node?.style) fail(`unknown DOM motion target: ${target}`);
    const state = this.#states.get(target) ?? {
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      rotationDeg: 0,
      rotationYDeg: 0,
    };
    this.#states.set(target, state);
    if (property === "opacity") node.style.opacity = compact(value);
    else {
      state[property] = value;
      node.style.transform = `perspective(800px) translate3d(${compact(state.translateX)}px, ${compact(state.translateY)}px, 0) rotate(${compact(state.rotationDeg)}deg) rotateY(${compact(state.rotationYDeg)}deg) scale(${compact(state.scaleX)}, ${compact(state.scaleY)})`;
    }
  }

  clearMotionTarget(target) {
    const node = this.#resolveNode(target);
    if (node?.style) {
      node.style.opacity = "";
      node.style.transform = "";
    }
    return this.#states.delete(target);
  }
}
