import assert from "node:assert/strict";
import test from "node:test";
import { TweenEngine } from "../motion/tween-engine.mjs";
import { EventFrameScheduler } from "../scheduler/event-frame-scheduler.mjs";

class FakeFrameHost {
  callbacks = new Map();
  nextHandle = 1;
  requestCount = 0;
  cancelCount = 0;

  requestFrame = (callback) => {
    const handle = this.nextHandle;
    this.nextHandle += 1;
    this.requestCount += 1;
    this.callbacks.set(handle, callback);
    return handle;
  };

  cancelFrame = (handle) => {
    if (this.callbacks.delete(handle)) this.cancelCount += 1;
  };

  step(timestamp) {
    assert.equal(this.callbacks.size, 1, "expected exactly one pending host frame");
    const [[handle, callback]] = this.callbacks.entries();
    this.callbacks.delete(handle);
    callback(timestamp);
  }
}

function setup(options = {}) {
  const host = new FakeFrameHost();
  const errors = [];
  const scheduler = new EventFrameScheduler({
    requestFrame: host.requestFrame,
    cancelFrame: host.cancelFrame,
    onError: (error) => errors.push(error),
  });
  const motion = new TweenEngine(scheduler, options);
  return { host, scheduler, motion, errors };
}

test("idle scheduler requests no frames", () => {
  const { host, scheduler } = setup();
  assert.equal(host.requestCount, 0);
  assert.equal(host.callbacks.size, 0);
  assert.equal(scheduler.activeTaskCount, 0);
  assert.equal(scheduler.framePending, false);
});

test("multiple tasks share one pending host frame", () => {
  const { host, scheduler } = setup();
  scheduler.subscribe(() => false);
  scheduler.subscribe(() => false);
  assert.equal(host.requestCount, 1);
  assert.equal(host.callbacks.size, 1);
  host.step(10);
  assert.equal(scheduler.activeTaskCount, 0);
  assert.equal(host.callbacks.size, 0);
});

test("tween progresses deterministically and becomes idle", () => {
  const { host, scheduler, motion } = setup();
  const samples = [];
  let completed = 0;
  const controller = motion.animate({
    from: 10,
    to: 20,
    durationMs: 100,
    onUpdate: (value, progress) => samples.push([value, progress]),
    onComplete: () => { completed += 1; },
  });

  host.step(1_000);
  host.step(1_050);
  host.step(1_100);

  assert.deepEqual(samples, [[10, 0], [15, 0.5], [20, 1]]);
  assert.equal(completed, 1);
  assert.equal(controller.settled, true);
  assert.equal(scheduler.activeTaskCount, 0);
  assert.equal(scheduler.framePending, false);
  assert.equal(host.callbacks.size, 0);
});

test("cancelling the last tween cancels the pending frame", () => {
  const { host, scheduler, motion } = setup();
  let cancelled = 0;
  const controller = motion.animate({
    from: 0,
    to: 1,
    durationMs: 500,
    onUpdate: () => {},
    onCancel: () => { cancelled += 1; },
  });
  assert.equal(controller.cancel(), true);
  assert.equal(controller.cancel(), false);
  assert.equal(cancelled, 1);
  assert.equal(host.cancelCount, 1);
  assert.equal(host.callbacks.size, 0);
  assert.equal(scheduler.activeTaskCount, 0);
});

test("zero-duration and reduced-motion tweens do not request a frame", () => {
  for (const reducedMotion of [false, true]) {
    const { host, motion } = setup({ reducedMotion: () => reducedMotion });
    const values = [];
    let completed = 0;
    motion.animate({
      from: 3,
      to: 9,
      durationMs: reducedMotion ? 250 : 0,
      onUpdate: (value, progress) => values.push([value, progress]),
      onComplete: () => { completed += 1; },
    });
    assert.deepEqual(values, [[9, 1]]);
    assert.equal(completed, 1);
    assert.equal(host.requestCount, 0);
  }
});

test("scheduler isolates a failed task and returns to idle", () => {
  const { host, scheduler, errors } = setup();
  scheduler.subscribe(() => { throw new Error("controlled failure"); });
  host.step(0);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /controlled failure/);
  assert.equal(scheduler.activeTaskCount, 0);
  assert.equal(host.callbacks.size, 0);
});

test("dispose releases a pending frame and rejects new work", () => {
  const { host, scheduler } = setup();
  scheduler.subscribe(() => true);
  assert.equal(scheduler.dispose(), true);
  assert.equal(scheduler.dispose(), false);
  assert.equal(host.callbacks.size, 0);
  assert.equal(host.cancelCount, 1);
  assert.throws(() => scheduler.subscribe(() => false), /disposed/);
});

test("invalid animation contracts fail closed", () => {
  const { motion } = setup();
  assert.throws(() => motion.animate({ from: 0, to: 1, durationMs: -1, onUpdate() {} }), /durationMs/);
  assert.throws(() => motion.animate({ from: 0, to: 1, durationMs: 10, easing: "unknown", onUpdate() {} }), /unknown easing/);
  assert.throws(() => motion.animate({ from: 0, to: 1, durationMs: 10 }), /onUpdate/);
});
