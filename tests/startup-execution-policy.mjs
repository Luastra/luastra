import assert from "node:assert/strict";
import test from "node:test";
import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";
import { runStartupBundle } from "../platform/packaging/run-startup-bundle.mjs";

test("startup runner rejects capabilities and events before loading a runtime", async () => {
  for (const extra of [{ allowedCapabilities: ["storage.get"] }, { dispatches: [{}] }, { cycles: 2 }, { capabilityHandler: () => {} }]) {
    await assert.rejects(runWasmBundle({ executionProfile: "startup", ...extra }), /startup execution forbids/);
  }
  await assert.rejects(runWasmBundle({ executionProfile: "unknown" }), /unknown VM execution profile/);
});

test("startup supervisor rejects invalid limits before starting a process", async () => {
  for (const timeoutMs of [0, -1, 0.5, 30001, Infinity, NaN]) {
    await assert.rejects(runStartupBundle({ timeoutMs }), /startup timeout/);
  }
});
