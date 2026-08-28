const easingFunctions = Object.freeze({
  linear: (value) => value,
  easeOutCubic: (value) => 1 - ((1 - value) ** 3),
  easeInOutCubic: (value) => value < 0.5 ? 4 * value ** 3 : 1 - ((-2 * value + 2) ** 3) / 2,
});

function fail(message) { throw new Error(message); }
function finiteNumber(value, name) { if (!Number.isFinite(value)) fail(`${name} must be a finite number`); }

export class TweenEngine {
  #scheduler;
  #reducedMotion;

  constructor(scheduler, { reducedMotion = () => false } = {}) {
    if (!scheduler || typeof scheduler.subscribe !== "function") fail("event frame scheduler is required");
    if (typeof reducedMotion !== "function") fail("reducedMotion must be a function");
    this.#scheduler = scheduler;
    this.#reducedMotion = reducedMotion;
  }

  animate({ from, to, durationMs, easing = "linear", onUpdate, onComplete = () => {}, onCancel = () => {} } = {}) {
    finiteNumber(from, "from"); finiteNumber(to, "to"); finiteNumber(durationMs, "durationMs");
    if (durationMs < 0 || durationMs > 60_000) fail("durationMs must be between 0 and 60000");
    if (typeof onUpdate !== "function") fail("onUpdate is required");
    if (typeof onComplete !== "function" || typeof onCancel !== "function") fail("completion callbacks must be functions");
    const easingFunction = typeof easing === "function" ? easing : easingFunctions[easing];
    if (typeof easingFunction !== "function") fail(`unknown easing: ${easing}`);
    let settled = false;
    let subscription = null;
    if (durationMs === 0 || this.#reducedMotion()) { onUpdate(to, 1); onComplete(); settled = true; }
    else {
      let startedAt = null;
      subscription = this.#scheduler.subscribe((timestamp) => {
        finiteNumber(timestamp, "frame timestamp"); startedAt ??= timestamp;
        const progress = Math.min(1, Math.max(0, (timestamp - startedAt) / durationMs));
        const eased = easingFunction(progress); finiteNumber(eased, "eased progress");
        onUpdate(from + (to - from) * eased, progress);
        if (progress < 1) return true;
        settled = true; onComplete(); return false;
      });
    }
    return Object.freeze({
      get settled() { return settled; },
      cancel() { if (settled) return false; settled = true; const cancelled = subscription?.cancel() ?? false; onCancel(); return cancelled; },
    });
  }
}

export const MotionEasing = Object.freeze(Object.keys(easingFunctions));
