import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const prototype = resolve(import.meta.dirname, "..");

test("opt-in host diagnostics expose bounded idle signals without application data", async () => {
  const source = await readFile(resolve(prototype, "platform/host/main.js"), "utf8");
  assert.match(source, /get\("luastraDiagnostics"\) === "1"/);
  assert.match(source, /Object\.defineProperty\(window, "__luastraDiagnostics", \{ configurable: true, value: diagnostics \}\)/);
  assert.match(source, /cwrap\("luastra_vm_wasm_memory_bytes", "number", \[\]\)/);
  for (const signal of [
    "pendingRequests",
    "activeMotionCount",
    "activeFrameTaskCount",
    "framePending",
    "wasmMemoryBytes",
    "domNodeCount",
  ]) assert.match(source, new RegExp(`\\b${signal}:`));
  assert.doesNotMatch(source, /__luastraDiagnostics[\s\S]{0,160}(authorization|token|content|storage)/i);
  assert.match(source, /clearDiagnostics\(\);[\s\S]*motionSession\.dispose\(\)/);
});
