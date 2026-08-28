const exactKeys = (value, keys) => value && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");

const easingNames = new Set(["linear", "easeOutCubic", "easeInOutCubic"]);

function fail(message) {
  throw new Error(message);
}

export function normalizeTweenDescriptor(value) {
  if (!exactKeys(value, ["kind", "from", "to", "durationMs", "easing"])) fail("invalid tween descriptor shape");
  if (value.kind !== "tween") fail("unsupported motion descriptor kind");
  if (!Number.isFinite(value.from) || !Number.isFinite(value.to)) fail("motion endpoints must be finite numbers");
  if (!Number.isFinite(value.durationMs) || value.durationMs < 0 || value.durationMs > 60_000) {
    fail("motion durationMs must be between 0 and 60000");
  }
  if (!easingNames.has(value.easing)) fail(`unsupported motion easing: ${value.easing}`);
  return Object.freeze({
    kind: "tween",
    from: value.from,
    to: value.to,
    durationMs: value.durationMs,
    easing: value.easing,
  });
}

export function normalizeMotionDescriptor(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("invalid motion descriptor shape");
  if (value.kind === "tween") return normalizeTweenDescriptor(value);
  if (!exactKeys(value, ["kind", "steps", "iterations"]) || value.kind !== "sequence" ||
      !Number.isInteger(value.iterations) || value.iterations < 0 || value.iterations > 1000 ||
      !Array.isArray(value.steps) || value.steps.length < 1 || value.steps.length > 32) fail("invalid motion sequence shape");
  let hasTween = false;
  const steps = value.steps.map((step) => {
    if (step?.kind === "tween") { hasTween = true; return normalizeTweenDescriptor(step); }
    if (!exactKeys(step, ["kind", "durationMs"]) || step.kind !== "wait" || !Number.isFinite(step.durationMs) || step.durationMs < 0 || step.durationMs > 60_000) {
      fail("invalid motion wait descriptor");
    }
    return Object.freeze({ kind: "wait", durationMs: step.durationMs });
  });
  if (!hasTween) fail("motion sequence requires at least one tween");
  if (value.iterations !== 1 && steps.reduce((total, step) => total + step.durationMs, 0) === 0) fail("repeated motion sequence requires a positive duration");
  return Object.freeze({ kind: "sequence", steps: Object.freeze(steps), iterations: value.iterations });
}

export function motionDescriptorEndpoints(descriptor) {
  const normalized = normalizeMotionDescriptor(descriptor);
  if (normalized.kind === "tween") return Object.freeze({ from: normalized.from, to: normalized.to });
  const tweens = normalized.steps.filter((step) => step.kind === "tween");
  return Object.freeze({ from: tweens[0].from, to: tweens.at(-1).to });
}

export const MotionEasingNames = Object.freeze([...easingNames]);
