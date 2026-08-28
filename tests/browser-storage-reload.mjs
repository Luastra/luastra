import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { createPlatformCapabilities } from "../platform/host/platform-capabilities.mjs";
import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";
import { buildProject } from "../project/build-project.mjs";

const prototype = resolve(import.meta.dirname, "..");
const manifestPath = resolve(prototype, "examples/animated-catalogue/luastra.json");
const runtimeModulePath = resolve(prototype, "platform/artifacts/vm-wasm/luastra-vm.js");
const allowedCapabilities = ["app.launchurl.get", "navigation.history", "storage.get", "storage.set", "ui.render"];

function find(root, id) { return root.id === id ? root : root.children.map((child) => find(child, id)).find(Boolean) ?? null; }

test("production web storage handler restores route and selection across fresh VM sessions", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-browser-storage-reload-"));
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const records = new Map();
  const historyCalls = [];
  let currentHistoryState = null;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem(key) { return records.has(key) ? records.get(key) : null; },
      setItem(key, value) { records.set(key, String(value)); },
    },
  });
  try {
    const built = await buildProject({ manifestPath, outputDirectory: workspace, target: "bundle" });
    const run = async (dispatches) => {
      const platform = createPlatformCapabilities("dev.luastra.animated-catalogue", {
        historyTarget: {
          get state() { return currentHistoryState; },
          pushState(state) { currentHistoryState = state; historyCalls.push({ operation: "push", state }); },
          replaceState(state) { currentHistoryState = state; historyCalls.push({ operation: "replace", state }); },
          back() { historyCalls.push({ operation: "back" }); },
        },
        windowTarget: null,
      });
      try {
        return await runWasmBundle({
          bundlePath: built.bundlePath,
          runtimeModulePath,
          allowedCapabilities,
          requireRendererTree: true,
          capabilityHandler: platform.handle,
          dispatches,
        });
      } finally { platform.dispose(); }
    };

    const first = await run([
      { action: "lifecycle", target: "app", value: "launch" },
      { action: "lifecycle", target: "app", value: "online" },
      { action: "open-card", target: "catalogue/focus/open", value: "" },
      { action: "lifecycle", target: "app", value: "background" },
    ]);
    assert.equal(find(first.renderTree, "detail/title").properties.text, "Focus");
    assert.equal(find(first.renderTree, "catalogue/storage-status").properties.text, "Storage: Persisted");
    assert.ok(historyCalls.some((item) => item.operation === "push" && item.state.luastra.token.includes("navigation=2%3A2%3A10%3A%2Fcatalogue13%3A%2Fdetail%2Ffocus")));

    const restored = await run([
      { action: "lifecycle", target: "app", value: "launch" },
      { action: "lifecycle", target: "app", value: "foreground" },
    ]);
    assert.equal(find(restored.renderTree, "detail/title").properties.text, "Focus");
    assert.equal(find(restored.renderTree, "catalogue/storage-status").properties.text, "Storage: Restored");
    assert.equal(restored.pendingRequests, 0);
    assert.equal(historyCalls.at(-1).operation, "replace", "reload must reuse the owned current entry instead of extending History");
    assert.ok(historyCalls.at(-1).state.luastra.token.includes("navigation=2%3A2%3A10%3A%2Fcatalogue13%3A%2Fdetail%2Ffocus"));

    const backed = await run([
      { action: "lifecycle", target: "app", value: "launch" },
      { action: "history", target: "app", value: "v=1&routes=catalogue&selected=catalogue%2Ffocus" },
    ]);
    assert.ok(find(backed.renderTree, "catalogue/cards"));
    assert.equal(find(backed.renderTree, "catalogue/selection-value").properties.text, "catalogue/focus");

    const finalRestore = await run([{ action: "lifecycle", target: "app", value: "launch" }]);
    assert.equal(find(finalRestore.renderTree, "detail/title").properties.text, "Focus", "owned History did not override the newer durable root state");
    assert.equal(find(finalRestore.renderTree, "catalogue/storage-status").properties.text, "Storage: Restored");

    records.set("luastra.dev.luastra.animated-catalogue.catalogue-state", "v=99&routes=detail&selected=catalogue%2Ffocus");
    currentHistoryState = null;
    const rejected = await run([{ action: "lifecycle", target: "app", value: "launch" }]);
    assert.ok(find(rejected.renderTree, "catalogue/cards"));
    assert.equal(find(rejected.renderTree, "catalogue/storage-status").properties.text, "Storage: State rejected: newer_version");
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
    else delete globalThis.localStorage;
    await rm(workspace, { recursive: true, force: true });
  }
});
