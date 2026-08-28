import assert from "node:assert/strict";
import test from "node:test";

import { createLifecycleBridge, createSerializedEventQueue } from "../platform/host/lifecycle-bridge.mjs";

class FakeTarget {
  listeners = new Map();
  addEventListener(name, listener) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(listener);
  }
  removeEventListener(name, listener) { this.listeners.get(name)?.delete(listener); }
  emit(name) { for (const listener of this.listeners.get(name) ?? []) listener({ type: name }); }
  listenerCount() { return [...this.listeners.values()].reduce((total, values) => total + values.size, 0); }
}

test("lifecycle bridge serializes host state and releases every listener", async () => {
  const windowTarget = new FakeTarget();
  const documentTarget = new FakeTarget();
  documentTarget.visibilityState = "visible";
  const navigatorState = { onLine: true };
  const events = [];
  const failures = [];
  const bridge = createLifecycleBridge({
    windowTarget,
    documentTarget,
    navigatorState,
    async dispatch(event) { events.push(event); },
    onError(error) { failures.push(error); },
  });

  await bridge.start();
  assert.deepEqual(events.map((event) => event.value), ["launch", "foreground", "online"]);
  assert.equal(windowTarget.listenerCount() + documentTarget.listenerCount(), 3);

  documentTarget.visibilityState = "hidden";
  documentTarget.emit("visibilitychange");
  navigatorState.onLine = false;
  windowTarget.emit("offline");
  await bridge.settled();
  assert.deepEqual(events.map((event) => event.value), ["launch", "foreground", "online", "background", "offline"]);
  assert.equal(events.every((event) => event.action === "lifecycle" && event.target === "app"), true);
  assert.deepEqual(failures, []);

  bridge.dispose();
  assert.equal(bridge.disposed, true);
  assert.equal(windowTarget.listenerCount() + documentTarget.listenerCount(), 0);
  windowTarget.emit("online");
  await bridge.settled();
  assert.equal(events.length, 5, "disposed bridge emitted another lifecycle event");
});

test("one host queue serializes URL, History and lifecycle intents and suppresses pending duplicates", async () => {
  const events = [];
  const failures = [];
  let releaseFirst;
  const firstGate = new Promise((resolve) => { releaseFirst = resolve; });
  const queue = createSerializedEventQueue({
    async dispatch(event) {
      if (events.length === 0) await firstGate;
      events.push(event);
    },
    onError(error) { failures.push(error); },
  });

  const first = queue.enqueue({ action: "open_url", target: "app", value: "luastra://detail/focus" }, { dedupeKey: "url:luastra://detail/focus" });
  const duplicate = queue.enqueue({ action: "open_url", target: "app", value: "luastra://detail/focus" }, { dedupeKey: "url:luastra://detail/focus" });
  const history = queue.enqueue({ action: "history", target: "app", value: "state-1" }, { dedupeKey: "history:state-1" });
  const lifecycle = queue.enqueue({ action: "lifecycle", target: "app", value: "foreground" }, { dedupeKey: "lifecycle:foreground" });
  releaseFirst();

  assert.equal(await first, true);
  assert.equal(await duplicate, false);
  assert.equal(await history, true);
  assert.equal(await lifecycle, true);
  assert.deepEqual(events.map(({ action, intentId }) => [action, intentId]), [
    ["open_url", 1],
    ["history", 2],
    ["lifecycle", 3],
  ]);
  assert.deepEqual(failures, []);

  queue.dispose();
  assert.equal(await queue.enqueue({ action: "lifecycle", target: "app", value: "background" }), false);
  assert.equal(events.length, 3, "disposed queue dispatched another host event");
});
