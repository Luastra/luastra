import { motionDescriptorEndpoints, normalizeMotionDescriptor } from "./descriptor.mjs";
import { TweenEngine } from "./tween-engine.mjs";

const targetPattern = /^[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;
const propertyRanges = Object.freeze({ opacity: [0, 1], translateX: [-100_000, 100_000], translateY: [-100_000, 100_000], scaleX: [0, 100], scaleY: [0, 100], rotationDeg: [-360_000, 360_000], rotationYDeg: [-360_000, 360_000] });
function fail(message) { throw new Error(message); }
function validateChannel(target, property, descriptor) {
  if (typeof target !== "string" || !targetPattern.test(target)) fail(`invalid motion target: ${target}`);
  const range = propertyRanges[property]; if (!range) fail(`unsupported motion property: ${property}`);
  const tweens = descriptor.kind === "tween" ? [descriptor] : descriptor.steps.filter((step) => step.kind === "tween");
  for (const tween of tweens) for (const [name, value] of [["from", tween.from], ["to", tween.to]]) if (value < range[0] || value > range[1]) fail(`${property} ${name} is outside the supported range`);
}

export class MotionRuntime {
  #adapter; #engine; #reducedMotion; #active = new Map(); #disposed = false;
  constructor({ scheduler, adapter, reducedMotion = () => false } = {}) {
    if (!adapter || typeof adapter.applyMotionValue !== "function") fail("motion adapter is required");
    if (typeof reducedMotion !== "function") fail("reducedMotion must be a function");
    this.#adapter = adapter; this.#reducedMotion = reducedMotion; this.#engine = new TweenEngine(scheduler, { reducedMotion });
  }
  get activeCount() { return this.#active.size; }
  get disposed() { return this.#disposed; }
  prepare(target, property, value) {
    if (this.#disposed) fail("motion runtime is disposed");
    const descriptor = normalizeMotionDescriptor(value); validateChannel(target, property, descriptor);
    const key = `${target}\u0000${property}`; const previous = this.#active.get(key); if (previous) this.#cancelRecord(previous, "replaced");
    const reduced = this.#reducedMotion(); const endpoints = motionDescriptorEndpoints(descriptor);
    this.#adapter.applyMotionValue(target, property, reduced ? endpoints.to : endpoints.from, reduced ? 1 : 0);
    return Object.freeze({ descriptor, reduced });
  }
  start(target, property, value, { onComplete = () => {}, onCancel = () => {} } = {}) {
    if (this.#disposed) fail("motion runtime is disposed");
    if (typeof onComplete !== "function" || typeof onCancel !== "function") fail("motion lifecycle callbacks must be functions");
    const descriptor = normalizeMotionDescriptor(value); validateChannel(target, property, descriptor);
    const key = `${target}\u0000${property}`; const previous = this.#active.get(key); if (previous) this.#cancelRecord(previous, "replaced");
    const record = { key, target, property, state: "active", reason: null, tween: null, onCancel }; this.#active.set(key, record);
    const complete = () => { if (this.#active.get(key) === record) this.#active.delete(key); record.state = "completed"; onComplete(); };
    const apply = (next, progress) => { try { this.#adapter.applyMotionValue(target, property, next, progress); } catch (error) { if (this.#active.get(key) === record) this.#active.delete(key); record.state = "failed"; throw error; } };
    if (this.#reducedMotion()) { apply(motionDescriptorEndpoints(descriptor).to, 1); complete(); }
    else if (descriptor.kind === "tween") record.tween = this.#engine.animate({ ...descriptor, onUpdate: apply, onComplete: complete, onCancel: () => { record.state = "cancelled"; record.onCancel(record.reason ?? "cancelled"); } });
    else this.#startSequence(record, descriptor, apply, complete);
    return Object.freeze({ get state() { return record.state; }, cancel: () => this.#cancelRecord(record, "cancelled") });
  }
  disposeTarget(target) {
    if (typeof target !== "string" || !targetPattern.test(target)) fail(`invalid motion target: ${target}`);
    let cancelled = 0; for (const record of [...this.#active.values()]) if (record.target === target && this.#cancelRecord(record, "target-removed")) cancelled++;
    this.#adapter.clearMotionTarget?.(target); return cancelled;
  }
  dispose() { if (this.#disposed) return false; for (const record of [...this.#active.values()]) this.#cancelRecord(record, "session-disposed"); this.#disposed = true; return true; }
  #startSequence(record, descriptor, apply, complete) {
    let stepIndex = 0; let completedIterations = 0; let current = motionDescriptorEndpoints(descriptor).from;
    const advance = () => {
      if (record.state !== "active" || this.#active.get(record.key) !== record) return;
      if (stepIndex >= descriptor.steps.length) {
        completedIterations += 1;
        if (descriptor.iterations !== 0 && completedIterations >= descriptor.iterations) { complete(); return; }
        stepIndex = 0;
      }
      const step = descriptor.steps[stepIndex++];
      const tween = step.kind === "wait" ? { kind: "tween", from: current, to: current, durationMs: step.durationMs, easing: "linear" } : step;
      const stepToken = {};
      record.stepToken = stepToken;
      const stepHandle = this.#engine.animate({ ...tween,
        onUpdate: (next, progress) => { current = next; apply(next, progress); },
        onComplete: advance,
        onCancel: () => { record.state = "cancelled"; record.onCancel(record.reason ?? "cancelled"); },
      });
      if (record.state === "active" && this.#active.get(record.key) === record && record.stepToken === stepToken && !stepHandle.settled) record.tween = stepHandle;
      else stepHandle.cancel();
    };
    advance();
  }
  #cancelRecord(record, reason) { if (record.state !== "active" || this.#active.get(record.key) !== record) return false; this.#active.delete(record.key); record.reason = reason; record.tween?.cancel(); return true; }
}

export const MotionProperties = Object.freeze(Object.keys(propertyRanges));
