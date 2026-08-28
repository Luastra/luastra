import assert from "node:assert/strict";
import test from "node:test";

import { component } from "../platform/renderer/reconciler.mjs";
import { RendererSession } from "../platform/renderer/session.mjs";
import { SnapshotRenderer } from "../platform/renderer/snapshot-renderer.mjs";
import { MotionRuntime } from "../motion/motion-runtime.mjs";
import { DomMotionAdapter } from "../renderer/dom-motion-adapter.mjs";
import { MotionRendererSession } from "../renderer/motion-renderer-session.mjs";
import { EventFrameScheduler } from "../scheduler/event-frame-scheduler.mjs";
import { catalogueCards, startCatalogueEntrance } from "../examples/animated-catalogue/catalogue-motion.mjs";

class FakeFrameHost {
  callbacks = new Map();
  nextHandle = 1;
  requested = 0;
  cancelled = 0;

  requestFrame = (callback) => {
    const handle = this.nextHandle++;
    this.requested += 1;
    this.callbacks.set(handle, callback);
    return handle;
  };

  cancelFrame = (handle) => {
    if (this.callbacks.delete(handle)) this.cancelled += 1;
  };

  step(timestamp) {
    assert.equal(this.callbacks.size, 1);
    const [[handle, callback]] = this.callbacks;
    this.callbacks.delete(handle);
    callback(timestamp);
  }
}

class MemoryMotionAdapter {
  samples = [];
  cleared = [];

  applyMotionValue(target, property, value, progress) {
    this.samples.push({ target, property, value, progress });
  }

  clearMotionTarget(target) {
    this.cleared.push(target);
  }
}

function setup({ reducedMotion = false, adapter = new MemoryMotionAdapter() } = {}) {
  const host = new FakeFrameHost();
  const errors = [];
  const scheduler = new EventFrameScheduler({
    requestFrame: host.requestFrame,
    cancelFrame: host.cancelFrame,
    onError: (error) => errors.push(error),
  });
  const motion = new MotionRuntime({ scheduler, adapter, reducedMotion: () => reducedMotion });
  return { host, adapter, scheduler, motion, errors };
}

function catalogueTree(includeFocus = true) {
  const cards = catalogueCards.filter((card) => includeFocus || card.id !== "catalogue/focus");
  return component("Screen", { id: "catalogue" }, [
    component("List", { id: "catalogue/cards", label: "Catalogue" }, cards.map((card) =>
      component("ListItem", { id: card.id, text: card.id.split("/").at(-1) }))),
  ]);
}

test("catalogue animations share frames and finish at idle", () => {
  const { host, adapter, scheduler, motion } = setup();
  const session = new MotionRendererSession(new RendererSession(new SnapshotRenderer()), motion);
  session.render(catalogueTree(), { sequence: 0 });
  const handles = startCatalogueEntrance(session);
  assert.equal(handles.length, 4);
  assert.equal(motion.activeCount, 4);
  assert.equal(host.requested, 1, "all channels must share one pending frame");

  host.step(1_000);
  host.step(1_140);
  host.step(1_220);
  host.step(1_280);

  assert.equal(motion.activeCount, 0);
  assert.equal(scheduler.activeTaskCount, 0);
  assert.equal(host.callbacks.size, 0);
  assert.equal(handles.every((handle) => handle.state === "completed"), true);
  assert.equal(adapter.samples.some((sample) => sample.target === "catalogue/focus" && sample.property === "translateY" && sample.value === 0), true);
});

test("removing a rendered target cancels all of its channels", () => {
  const { host, adapter, motion } = setup();
  const session = new MotionRendererSession(new RendererSession(new SnapshotRenderer()), motion);
  session.render(catalogueTree(), { sequence: 0 });
  const cancellations = [];
  const opacity = session.animate("catalogue/focus", "opacity", catalogueCards[1].entrance.opacity, { onCancel: (reason) => cancellations.push(reason) });
  const translation = session.animate("catalogue/focus", "translateY", catalogueCards[1].entrance.translateY, { onCancel: (reason) => cancellations.push(reason) });
  assert.equal(host.callbacks.size, 1);

  session.render(catalogueTree(false), { sequence: 1 });
  assert.deepEqual(cancellations, ["target-removed", "target-removed"]);
  assert.equal(opacity.state, "cancelled");
  assert.equal(translation.state, "cancelled");
  assert.equal(motion.activeCount, 0);
  assert.equal(host.callbacks.size, 0);
  assert.deepEqual(adapter.cleared, ["catalogue/focus"]);
});

test("replacement owns the property channel and session disposal releases it", () => {
  const { host, motion } = setup();
  const session = new MotionRendererSession(new RendererSession(new SnapshotRenderer()), motion);
  session.render(catalogueTree(), { sequence: 0 });
  const reasons = [];
  const first = session.animate("catalogue/breathe", "opacity", catalogueCards[0].entrance.opacity, { onCancel: (reason) => reasons.push(reason) });
  const second = session.animate("catalogue/breathe", "opacity", { kind: "tween", from: 1, to: 0.5, durationMs: 500, easing: "linear" }, { onCancel: (reason) => reasons.push(reason) });
  assert.equal(first.state, "cancelled");
  assert.deepEqual(reasons, ["replaced"]);
  assert.equal(motion.activeCount, 1);

  assert.equal(session.dispose(), true);
  assert.equal(session.dispose(), false);
  assert.equal(second.state, "cancelled");
  assert.deepEqual(reasons, ["replaced", "session-disposed"]);
  assert.equal(host.callbacks.size, 0);
  assert.equal(motion.activeCount, 0);
  assert.throws(() => session.animate("catalogue/breathe", "opacity", catalogueCards[0].entrance.opacity), /disposed/);
});

test("reduced motion applies final state without requesting a frame", () => {
  const { host, adapter, motion } = setup({ reducedMotion: true });
  const session = new MotionRendererSession(new RendererSession(new SnapshotRenderer()), motion);
  session.render(catalogueTree(), { sequence: 0 });
  const handle = session.animate("catalogue/breathe", "translateY", catalogueCards[0].entrance.translateY);
  assert.equal(handle.state, "completed");
  assert.equal(host.requested, 0);
  assert.equal(motion.activeCount, 0);
  assert.deepEqual(adapter.samples, [{ target: "catalogue/breathe", property: "translateY", value: 0, progress: 1 }]);
});

test("deferred motion preparation applies the correct pre-reveal state without scheduling", () => {
  const ordinary = setup();
  const ordinaryPrepared = ordinary.motion.prepare("catalogue/breathe", "translateY", catalogueCards[0].entrance.translateY);
  assert.equal(ordinaryPrepared.reduced, false);
  assert.equal(ordinary.host.requested, 0);
  assert.deepEqual(ordinary.adapter.samples, [{ target: "catalogue/breathe", property: "translateY", value: 18, progress: 0 }]);

  const reduced = setup({ reducedMotion: true });
  const reducedPrepared = reduced.motion.prepare("catalogue/breathe", "translateY", catalogueCards[0].entrance.translateY);
  assert.equal(reducedPrepared.reduced, true);
  assert.equal(reduced.host.requested, 0);
  assert.deepEqual(reduced.adapter.samples, [{ target: "catalogue/breathe", property: "translateY", value: 0, progress: 1 }]);
});

test("DOM adapter composes safe transform channels and rejects arbitrary properties", () => {
  const node = { style: { opacity: "", transform: "" } };
  const adapter = new DomMotionAdapter((target) => target === "catalogue/breathe" ? node : null);
  adapter.applyMotionValue("catalogue/breathe", "opacity", 0.625);
  adapter.applyMotionValue("catalogue/breathe", "translateX", 12);
  adapter.applyMotionValue("catalogue/breathe", "scaleY", 1.25);
  assert.equal(node.style.opacity, "0.625");
  adapter.applyMotionValue("catalogue/breathe", "rotationYDeg", 180);
  assert.equal(node.style.transform, "perspective(800px) translate3d(12px, 0px, 0) rotate(0deg) rotateY(180deg) scale(1, 1.25)");
  assert.throws(() => adapter.applyMotionValue("catalogue/breathe", "backgroundImage", 1), /invalid DOM motion update/);
  assert.throws(() => adapter.applyMotionValue("catalogue/missing", "opacity", 1), /unknown DOM motion target/);
  adapter.clearMotionTarget("catalogue/breathe");
  assert.equal(node.style.opacity, "");
  assert.equal(node.style.transform, "");
});

test("motion sequences and waits share the event scheduler and settle without an application loop", () => {
  const { host, adapter, scheduler, motion } = setup();
  const descriptor = {
    kind: "sequence",
    iterations: 1,
    steps: [
      { kind: "tween", from: 0, to: -2, durationMs: 100, easing: "linear" },
      { kind: "wait", durationMs: 100 },
      { kind: "tween", from: -2, to: 0, durationMs: 100, easing: "linear" },
    ],
  };
  const handle = motion.start("catalogue/breathe", "rotationDeg", descriptor);
  for (const timestamp of [0, 100, 200, 300, 400, 500]) if (host.callbacks.size > 0) host.step(timestamp);
  assert.equal(handle.state, "completed");
  assert.equal(motion.activeCount, 0);
  assert.equal(scheduler.activeTaskCount, 0);
  assert.equal(host.callbacks.size, 0);
  assert.equal(adapter.samples.at(-1).value, 0);
});

test("zero-duration sequence steps cannot retain a stale frame after target disposal", () => {
  const { host, scheduler, motion } = setup();
  const descriptor = {
    kind: "sequence",
    iterations: 0,
    steps: [
      { kind: "tween", from: 1, to: 1.1, durationMs: 10, easing: "linear" },
      { kind: "tween", from: 1.1, to: 1, durationMs: 10, easing: "linear" },
      { kind: "wait", durationMs: 0 },
    ],
  };
  motion.start("catalogue/breathe", "scaleX", descriptor);
  host.step(0);
  host.step(10);
  host.step(20);
  assert.equal(motion.activeCount, 1);
  assert.equal(motion.disposeTarget("catalogue/breathe"), 1);
  assert.equal(motion.activeCount, 0);
  assert.equal(scheduler.activeTaskCount, 0);
  assert.equal(host.callbacks.size, 0);
});

test("invalid descriptors and unknown semantic targets fail before scheduling", () => {
  const { host, motion } = setup();
  const session = new MotionRendererSession(new RendererSession(new SnapshotRenderer()), motion);
  session.render(catalogueTree(), { sequence: 0 });
  assert.throws(() => session.animate("catalogue/missing", "opacity", catalogueCards[0].entrance.opacity), /not rendered/);
  assert.throws(() => session.animate("catalogue/breathe", "width", catalogueCards[0].entrance.opacity), /unsupported motion property/);
  assert.throws(() => session.animate("catalogue/breathe", "opacity", { ...catalogueCards[0].entrance.opacity, to: 2 }), /outside the supported range/);
  assert.equal(host.requested, 0);
});

test("host adapter failure releases the property channel and frame", () => {
  const adapter = {
    applyMotionValue() { throw new Error("controlled adapter failure"); },
  };
  const { host, scheduler, motion, errors } = setup({ adapter });
  const session = new MotionRendererSession(new RendererSession(new SnapshotRenderer()), motion);
  session.render(catalogueTree(), { sequence: 0 });
  const handle = session.animate("catalogue/breathe", "opacity", catalogueCards[0].entrance.opacity);
  host.step(100);
  assert.equal(handle.state, "failed");
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /controlled adapter failure/);
  assert.equal(motion.activeCount, 0);
  assert.equal(scheduler.activeTaskCount, 0);
  assert.equal(host.callbacks.size, 0);
});
