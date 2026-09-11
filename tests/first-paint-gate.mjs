import assert from "node:assert/strict";
import test from "node:test";

import { waitForFirstPaint } from "../platform/host/first-paint-gate.mjs";

test("native work waits for two animation frames so WebKit can paint once", async () => {
  const callbacks = [];
  let settled = false;
  const waiting = waitForFirstPaint((callback) => callbacks.push(callback)).then(() => { settled = true; });

  assert.equal(callbacks.length, 1);
  callbacks.shift()();
  await Promise.resolve();
  assert.equal(settled, false, "the first frame only schedules the post-paint frame");
  assert.equal(callbacks.length, 1);

  callbacks.shift()();
  await waiting;
  assert.equal(settled, true);
});

test("first-paint gate rejects an unavailable frame scheduler", () => {
  assert.throws(() => waitForFirstPaint(null), /requires requestAnimationFrame/);
  assert.throws(() => waitForFirstPaint(() => {}, { timeoutMs: 0 }), /fallback is invalid/);
});

test("web first-paint gate has a bounded fallback when frames are throttled", async () => {
  let fallback = null;
  let cancelled = false;
  const waiting = waitForFirstPaint(() => {}, {
    timeoutMs: 1_000,
    scheduleTimeout(callback, milliseconds) {
      assert.equal(milliseconds, 1_000);
      fallback = callback;
      return 7;
    },
    cancelTimeout(handle) {
      assert.equal(handle, 7);
      cancelled = true;
    },
  });
  assert.equal(typeof fallback, "function");
  fallback();
  await waiting;
  assert.equal(cancelled, true);
});
