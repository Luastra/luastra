import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";
import { buildProject } from "../project/build-project.mjs";

const prototype = resolve(import.meta.dirname, "..");

test("typed Timer request is acknowledged without Application.resolve and expiry reaches handle", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-timer-api-"));
  const requests = [];
  try {
    const built = await buildProject({
      manifestPath: resolve(prototype, "examples/timer-lab/luastra.json"),
      outputDirectory: workspace,
      target: "bundle",
    });
    const result = await runWasmBundle({
      bundlePath: built.bundlePath,
      runtimeModulePath: resolve(prototype, "platform/artifacts/vm-wasm/luastra-vm.js"),
      allowedCapabilities: ["timer.control", "ui.render"],
      requireRendererTree: true,
      dispatches: [
        { action: "start-timer", target: "timer/start" },
        { action: "timer", target: "timer/next-card", value: "next" },
      ],
      async capabilityHandler(request) {
        requests.push(request);
        return { accepted: true, response: { version: 1, requestId: request.requestId, traceId: request.traceId, status: "ok", payload: "scheduled" } };
      },
    });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].kind, "timer.control");
    assert.equal(requests[0].payload.operation, "timer/next-card");
    assert.equal(requests[0].payload.input, "start:25:next");
    assert.equal(result.renderTree.children[0].properties.text, "1:next");
    assert.equal(result.pendingRequests, 0);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
