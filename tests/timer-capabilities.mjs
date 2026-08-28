import assert from "node:assert/strict";
import test from "node:test";

import { createTimerCapabilities } from "../platform/host/timer-capabilities.mjs";

class FakeClock {
  now = 0;
  nextHandle = 1;
  tasks = new Map();
  setTimeout = (callback, delayMs) => {
    const handle = this.nextHandle++;
    this.tasks.set(handle, { callback, due: this.now + delayMs });
    return handle;
  };
  clearTimeout = (handle) => { this.tasks.delete(handle); };
  advance(milliseconds) {
    this.now += milliseconds;
    for (const [handle, task] of [...this.tasks].sort((left, right) => left[1].due - right[1].due)) {
      if (task.due > this.now || !this.tasks.delete(handle)) continue;
      task.callback();
    }
  }
}

function request(requestId, id, input) {
  return { version: 1, kind: "timer.control", requestId, traceId: `trace-${requestId}`, deadlineMs: 1000, payload: { version: 1, operation: id, input, traceId: `trace-${requestId}`, deadlineMs: 1000 } };
}

test("timer capability replaces by id, emits once and cancels without stale events", async () => {
  const clock = new FakeClock();
  const timer = createTimerCapabilities({ setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout });
  const events = [];
  timer.subscribe((event) => events.push(event));
  assert.equal((await timer.handle(request(1, "game/next-card", "start:100:first"))).response.status, "ok");
  assert.equal((await timer.handle(request(2, "game/next-card", "start:200:second"))).response.status, "ok");
  clock.advance(100);
  assert.deepEqual(events, []);
  clock.advance(100);
  assert.deepEqual(events, [{ action: "timer", target: "game/next-card", value: "second" }]);
  assert.equal(timer.activeCount, 0);

  await timer.handle(request(3, "game/cancelled", "start:10:no"));
  await timer.handle(request(4, "game/cancelled", "cancel"));
  clock.advance(10);
  assert.equal(events.length, 1);
  assert.equal(timer.dispose(), true);
  assert.equal(timer.dispose(), false);
});

test("timer capability queues an elapsed event until the serialized host listener exists", async () => {
  const clock = new FakeClock();
  const timer = createTimerCapabilities({ setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout });
  await timer.handle(request(1, "startup/ready", "start:0:value"));
  clock.advance(0);
  const events = [];
  timer.subscribe((event) => events.push(event));
  assert.deepEqual(events, [{ action: "timer", target: "startup/ready", value: "value" }]);
});

test("timer capability rejects malformed ids, delays and oversized values", async () => {
  const clock = new FakeClock();
  const timer = createTimerCapabilities({ setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout });
  assert.equal((await timer.handle(request(1, "Bad", "start:10:value"))).response.status, "error");
  assert.equal((await timer.handle(request(2, "game/next", "start:60001:value"))).response.status, "error");
  assert.equal((await timer.handle(request(3, "game/next", `start:1:${"x".repeat(4097)}`))).response.status, "error");
  assert.equal(timer.activeCount, 0);
});
