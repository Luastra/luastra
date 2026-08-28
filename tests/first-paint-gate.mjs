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
});
