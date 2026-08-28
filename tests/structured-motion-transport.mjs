import assert from "node:assert/strict";
import test from "node:test";

import { validateRendererTree } from "../platform/protocol/generated/protocol.mjs";
import { materializeRendererTree } from "../platform/renderer/from-protocol-tree.mjs";
import { MotionRendererSession } from "../platform/renderer/motion-renderer-session.mjs";

const tween = Object.freeze({ kind: "tween", from: 0, to: 1, durationMs: 180, easing: "linear" });
const sequence = Object.freeze({ kind: "sequence", iterations: 0, steps: Object.freeze([
  Object.freeze({ kind: "wait", durationMs: 1200 }),
  Object.freeze({ kind: "tween", from: 0, to: -2, durationMs: 180, easing: "easeInOutCubic" }),
  Object.freeze({ kind: "tween", from: -2, to: 0, durationMs: 180, easing: "easeInOutCubic" }),
]) });
function tree(motion = { opacity: tween }) {
  return { type: "Screen", id: "motion/root", properties: { className: "luastra-screen", motion }, children: [] };
}

test("protocol admits only bounded structured motion descriptors", () => {
  assert.equal(validateRendererTree(tree()), true);
  assert.equal(validateRendererTree(tree({ opacity: { ...tween, to: 2 } })), false);
  assert.equal(validateRendererTree(tree({ width: tween })), false);
  assert.equal(validateRendererTree(tree({ opacity: { ...tween, easing: "bounce" } })), false);
  assert.equal(validateRendererTree(tree({ opacity: { ...tween, extra: true } })), false);
  assert.equal(validateRendererTree(tree({ rotationDeg: sequence })), true);
  assert.equal(validateRendererTree(tree({ rotationDeg: { ...sequence, steps: [{ kind: "wait", durationMs: 10 }] } })), false);
  assert.equal(validateRendererTree(tree({ rotationDeg: { ...sequence, steps: [{ kind: "tween", from: 0, to: 2, durationMs: 1, easing: "linear" }], iterations: 1001 } })), false);
});

test("materialization retains motion metadata outside DOM attributes", () => {
  const node = materializeRendererTree(tree());
  assert.deepEqual(node.motion, { opacity: tween });
  assert.equal("motion" in node.attributes, false);
});

test("declarative motion starts once, restarts on change and disposes with the target", () => {
  const events = [];
  const motion = {
    prepare(target, property, descriptor) { events.push(["prepare", target, property, descriptor.from]); return { descriptor, reduced: false }; },
    start(target, property, descriptor) { events.push(["start", target, property, descriptor.to]); return {}; },
    disposeTarget(target) { events.push(["disposeTarget", target]); },
    dispose() { events.push(["dispose"]); },
  };
  const renderer = { render() { return []; }, dispose() { events.push(["rendererDispose"]); } };
  const session = new MotionRendererSession(renderer, motion);
  const first = materializeRendererTree(tree());
  session.render(first);
  session.render(first);
  session.render(materializeRendererTree(tree({ opacity: { ...tween, to: 0.5 } })));
  session.render(materializeRendererTree({ type: "Screen", id: "other/root", properties: { className: "luastra-screen" }, children: [] }));
  session.dispose();
  assert.deepEqual(events, [
    ["start", "motion/root", "opacity", 1],
    ["disposeTarget", "motion/root"],
    ["start", "motion/root", "opacity", 0.5],
    ["disposeTarget", "motion/root"],
    ["dispose"],
    ["rendererDispose"],
  ]);
});

test("initial declarative motion can prepare behind a native startup boundary and activate after reveal", () => {
  const events = [];
  const motion = {
    prepare(target, property, descriptor) { events.push(["prepare", target, property, descriptor.from]); return { descriptor, reduced: false }; },
    start(target, property, descriptor) { events.push(["start", target, property, descriptor.to]); return {}; },
    disposeTarget(target) { events.push(["disposeTarget", target]); },
    dispose() { events.push(["dispose"]); },
  };
  const renderer = { render() { events.push(["render"]); return []; }, dispose() { events.push(["rendererDispose"]); } };
  const session = new MotionRendererSession(renderer, motion);
  const initial = materializeRendererTree(tree());
  session.render(initial, { deferMotion: true });
  session.render(initial);
  assert.deepEqual(events, [["render"], ["prepare", "motion/root", "opacity", 0], ["render"]]);
  assert.equal(session.activateDeferredMotion(), 1);
  assert.equal(session.activateDeferredMotion(), 0);
  session.dispose();
  assert.deepEqual(events, [
    ["render"],
    ["prepare", "motion/root", "opacity", 0],
    ["render"],
    ["start", "motion/root", "opacity", 1],
    ["dispose"],
    ["rendererDispose"],
  ]);
});

test("a reduced-motion deferred declaration stays at its prepared final state and schedules nothing on reveal", () => {
  const events = [];
  const motion = {
    prepare(target, property, descriptor) { events.push(["prepare", target, property, descriptor.to]); return { descriptor, reduced: true }; },
    start() { events.push(["unexpected-start"]); return {}; },
    disposeTarget() {},
    dispose() {},
  };
  const renderer = { render() { return []; }, dispose() {} };
  const session = new MotionRendererSession(renderer, motion);
  session.render(materializeRendererTree(tree()), { deferMotion: true });
  assert.equal(session.activateDeferredMotion(), 0);
  assert.deepEqual(events, [["prepare", "motion/root", "opacity", 1]]);
});
