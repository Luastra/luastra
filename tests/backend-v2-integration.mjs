import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import test from "node:test";

import { createBackendRuntime, handleServerCapability } from "../backend/runtime.mjs";
import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";
import { buildProject } from "../project/build-project.mjs";
import { loadProject } from "../project/load-project.mjs";

const prototype = resolve(import.meta.dirname, "..");
const fixture = resolve(prototype, "test-fixtures/backend-v2-cursor/luastra.json");

function find(root, id) {
  return root.id === id ? root : root.children.map((child) => find(child, id)).find(Boolean) ?? null;
}

test("backend v2 generated client traverses a nested cursor page through real Luau and Wasm", async () => {
  const project = await loadProject(fixture);
  const implementation = await import(`${pathToFileURL(project.backend.handlerPath).href}?backend-v2=${Date.now()}`);
  const runtime = createBackendRuntime({ contract: project.backend.declaration.value, handlers: implementation.createHandlers() });
  const output = await mkdtemp(resolve(tmpdir(), "luastra-backend-v2-integration-"));
  const operations = [];
  try {
    const built = await buildProject({ manifestPath: fixture, outputDirectory: output, target: "bundle" });
    const result = await runWasmBundle({
      bundlePath: built.bundlePath,
      runtimeModulePath: resolve(prototype, "platform/artifacts/vm-wasm/luastra-vm.js"),
      allowedCapabilities: ["rpc.call", "ui.render"],
      requireRendererTree: true,
      dispatches: [{ action: "load-page", target: "backend-v2/load", value: "" }],
      capabilityHandler: async (request) => {
        operations.push(request.payload.operation);
        return handleServerCapability(request, { runtime, principal: { id: "user-1", roles: ["user"] } });
      },
    });
    assert.deepEqual(operations, ["server.call.v1"]);
    assert.equal(find(result.renderTree, "backend-v2/status").properties.text, "loaded 2");
    assert.equal(find(result.renderTree, "backend-v2/first-title").properties.text, "First reusable record");
    assert.equal(find(result.renderTree, "backend-v2/next-cursor").properties.text, "cursor-2");
    assert.equal(result.pendingRequests, 0);
    assert.equal(result.memory.growthBytes, 0);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("backend v2 delivers structured validation fields through real Luau and Wasm", async () => {
  const project = await loadProject(fixture);
  const implementation = await import(`${pathToFileURL(project.backend.handlerPath).href}?backend-v2-fields=${Date.now()}`);
  const runtime = createBackendRuntime({ contract: project.backend.declaration.value, handlers: implementation.createHandlers() });
  const output = await mkdtemp(resolve(tmpdir(), "luastra-backend-v2-fields-"));
  try {
    const built = await buildProject({ manifestPath: fixture, outputDirectory: output, target: "bundle" });
    const result = await runWasmBundle({
      bundlePath: built.bundlePath,
      runtimeModulePath: resolve(prototype, "platform/artifacts/vm-wasm/luastra-vm.js"),
      allowedCapabilities: ["rpc.call", "ui.render"],
      requireRendererTree: true,
      dispatches: [{ action: "reject-rename", target: "backend-v2/reject", value: "" }],
      capabilityHandler: async (request) => handleServerCapability(request, { runtime, principal: { id: "user-1", roles: ["user"] } }),
    });
    assert.equal(find(result.renderTree, "backend-v2/status").properties.text, "VALIDATION: Invalid record fields");
    assert.equal(find(result.renderTree, "backend-v2/title-error").properties.text, "REQUIRED");
    assert.equal(result.pendingRequests, 0);
    assert.equal(result.memory.growthBytes, 0);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
