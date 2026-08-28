import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";
import { buildProject } from "../project/build-project.mjs";

const prototype = resolve(import.meta.dirname, "..");
const manifestPath = resolve(prototype, "examples/animated-catalogue/luastra.json");
const runtimeModulePath = resolve(prototype, "platform/artifacts/vm-wasm/luastra-vm.js");
const capabilities = ["app.launchurl.get", "navigation.history", "storage.get", "storage.set", "ui.render"];

function find(root, id) {
  return root.id === id ? root : root.children.map((child) => find(child, id)).find(Boolean) ?? null;
}

function response(request, status, payload) {
  return { accepted: true, response: { version: 1, requestId: request.requestId, traceId: request.traceId, status, payload } };
}

function platform(storage, launchUrl = "", historyToken = "") {
  return async (request) => {
    const key = request.payload.operation;
    if (request.kind === "storage.get") return response(request, "ok", storage.get(key) ?? "");
    if (request.kind === "storage.set") {
      storage.set(key, request.payload.input);
      return response(request, "ok", "stored");
    }
    if (request.kind === "app.launchurl.get") return response(request, "ok", launchUrl);
    if (request.kind === "navigation.history") return response(request, "ok", request.payload.operation === "current" ? historyToken : request.payload.operation === "back" ? "requested" : "stored");
    return response(request, "error", { code: "FORBIDDEN", message: `Unexpected capability: ${request.kind}` });
  };
}

test("catalogue navigation, URL routing, system Back, persistence and lifecycle survive Wasm sessions", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-navigation-state-"));
  try {
    const built = await buildProject({ manifestPath, outputDirectory: workspace, target: "bundle" });
    const run = (handler, dispatches) => runWasmBundle({
      bundlePath: built.bundlePath,
      runtimeModulePath,
      allowedCapabilities: capabilities,
      requireRendererTree: true,
      capabilityHandler: handler,
      dispatches,
    });

    const storage = new Map();
    const stateFor = (card) => {
      const navigation = `2:2:10:/catalogue${`/detail/${card}`.length}:/detail/${card}`;
      return `v=2&navigation=${encodeURIComponent(navigation)}&selected=${encodeURIComponent(`catalogue/${card}`)}`;
    };
    const first = await run(platform(storage), [
      { action: "lifecycle", target: "app", value: "launch" },
      { action: "lifecycle", target: "app", value: "online" },
      { action: "open-card", target: "catalogue/focus/open", value: "" },
      { action: "lifecycle", target: "app", value: "background" },
    ]);
    assert.equal(find(first.renderTree, "detail/title").properties.text, "Focus");
    assert.equal(find(first.renderTree, "catalogue/storage-status").properties.text, "Storage: Persisted");
    assert.equal(find(first.renderTree, "catalogue/lifecycle-status").properties.text, "Lifecycle: Background");
    assert.equal(find(first.renderTree, "catalogue/connectivity-status").properties.text, "Connection: Online");
    assert.match(storage.get("catalogue-state"), /^v=2&navigation=/);
    assert.equal(first.pendingRequests, 0);
    assert.equal(first.memory.growthBytes, 0);

    const restored = await run(platform(storage), [
      { action: "lifecycle", target: "app", value: "launch" },
      { action: "lifecycle", target: "app", value: "foreground" },
      { action: "lifecycle", target: "app", value: "offline" },
    ]);
    assert.equal(find(restored.renderTree, "detail/title").properties.text, "Focus");
    assert.equal(find(restored.renderTree, "catalogue/storage-status").properties.text, "Storage: Restored");
    assert.equal(find(restored.renderTree, "catalogue/connectivity-status").properties.text, "Connection: Offline");

    const modal = await run(platform(storage), [
      { action: "lifecycle", target: "app", value: "launch" },
      { action: "open-modal", target: "detail/about", value: "" },
    ]);
    assert.equal(find(modal.renderTree, "catalogue/about-modal").properties.open, true);

    const backed = await run(platform(storage), [
      { action: "lifecycle", target: "app", value: "launch" },
      { action: "history", target: "app", value: "v=1&routes=catalogue&selected=catalogue%2Ffocus" },
    ]);
    assert.ok(find(backed.renderTree, "catalogue/cards"));
    assert.equal(find(backed.renderTree, "catalogue/storage-status").properties.text, "Storage: Persisted");

    const invalidStorage = new Map([["catalogue-state", "v=99&routes=catalogue&selected=catalogue%2Fbreathe"]]);
    const invalid = await run(platform(invalidStorage), [
      { action: "lifecycle", target: "app", value: "launch" },
    ]);
    assert.ok(find(invalid.renderTree, "catalogue/cards"));
    assert.equal(find(invalid.renderTree, "catalogue/storage-status").properties.text, "Storage: State rejected: newer_version");

    const deepLinkStorage = new Map();
    const deepLinked = await run(platform(deepLinkStorage, "luastra://detail/focus"), [
      { action: "lifecycle", target: "app", value: "launch" },
    ]);
    assert.equal(find(deepLinked.renderTree, "detail/title").properties.text, "Focus");
    assert.match(deepLinkStorage.get("catalogue-state"), /^v=2&navigation=/);

    const webLinkStorage = new Map();
    const webLinked = await run(platform(webLinkStorage, "https://luastra.test/#/detail/focus"), [
      { action: "lifecycle", target: "app", value: "launch" },
    ]);
    assert.equal(find(webLinked.renderTree, "detail/title").properties.text, "Focus");

    const precedenceStorage = new Map([["catalogue-state", stateFor("breathe")]]);
    const historyWins = await run(platform(precedenceStorage, "", stateFor("focus")), [
      { action: "lifecycle", target: "app", value: "launch" },
    ]);
    assert.equal(find(historyWins.renderTree, "detail/title").properties.text, "Focus", "History did not override durable state at startup");

    const launchWins = await run(platform(precedenceStorage, "luastra://detail/breathe", stateFor("focus")), [
      { action: "lifecycle", target: "app", value: "launch" },
    ]);
    assert.equal(find(launchWins.renderTree, "detail/title").properties.text, "Breathe", "launch URL did not override History and durable state");

    const retainedLaunchHistoryOperations = [];
    const retainedLaunchPlatform = async (request) => {
      if (request.kind === "navigation.history" && request.payload.operation.endsWith("-location")) {
        retainedLaunchHistoryOperations.push(request.payload.operation);
      }
      return platform(new Map(), "luastra://detail/focus")(request);
    };
    const retainedLaunch = await run(retainedLaunchPlatform, [
      { action: "open_url", target: "app", value: "luastra://detail/focus" },
      { action: "lifecycle", target: "app", value: "launch" },
    ]);
    assert.equal(find(retainedLaunch.renderTree, "detail/title").properties.text, "Focus");
    assert.deepEqual(
      retainedLaunchHistoryOperations,
      ["replace-location", "push-location"],
      "retained native launch URL mutated History before startup arbitration",
    );

    const invalidLaunchPreservesHistory = await run(platform(precedenceStorage, "luastra://detail/not-a-card", stateFor("focus")), [
      { action: "lifecycle", target: "app", value: "launch" },
    ]);
    assert.equal(find(invalidLaunchPreservesHistory.renderTree, "detail/title").properties.text, "Focus", "invalid launch URL destroyed the admitted restored route");

    const browserLocationOperations = [];
    const browserLocationPlatform = async (request) => {
      if (request.kind === "navigation.history" && request.payload.operation.endsWith("-location")) browserLocationOperations.push(request.payload.operation);
      return platform(webLinkStorage)(request);
    };
    const browserLocation = await run(browserLocationPlatform, [
      { action: "lifecycle", target: "app", value: "launch" },
      { action: "open_url", target: "browser", value: "https://luastra.test/#/detail/not-a-card" },
    ]);
    assert.equal(find(browserLocation.renderTree, "detail/title").properties.text, "Focus");
    assert.equal(browserLocationOperations.at(-1), "replace-location");

    const systemBackStorage = new Map();
    const systemBackOperations = [];
    const systemBackPlatform = async (request) => {
      if (request.kind === "navigation.history" && request.payload.operation.startsWith("system-")) systemBackOperations.push(request.payload.operation);
      return platform(systemBackStorage)(request);
    };
    const systemBack = await run(systemBackPlatform, [
      { action: "lifecycle", target: "app", value: "launch" },
      { action: "open-card", target: "catalogue/focus/open", value: "" },
      { action: "system_back", target: "app", value: "7:1" },
    ]);
    assert.equal(systemBack.pendingRequests, 0);
    assert.deepEqual(systemBackOperations, ["system-history"]);

    const modalBackOperations = [];
    const modalBackPlatform = async (request) => {
      if (request.kind === "navigation.history" && request.payload.operation.startsWith("system-")) modalBackOperations.push(request.payload.operation);
      return platform(new Map())(request);
    };
    const modalBack = await run(modalBackPlatform, [
      { action: "lifecycle", target: "app", value: "launch" },
      { action: "open-card", target: "catalogue/focus/open", value: "" },
      { action: "open-modal", target: "detail/about", value: "" },
      { action: "system_back", target: "app", value: "8:1" },
    ]);
    assert.equal(find(modalBack.renderTree, "catalogue/about-modal").properties.open, false);
    assert.deepEqual(modalBackOperations, ["system-handled"], "modal did not precede route History in Back arbitration");

    const rootBackOperations = [];
    const rootBackPlatform = async (request) => {
      if (request.kind === "navigation.history" && request.payload.operation.startsWith("system-")) rootBackOperations.push(request.payload.operation);
      return platform(new Map())(request);
    };
    await run(rootBackPlatform, [
      { action: "lifecycle", target: "app", value: "launch" },
      { action: "system_back", target: "app", value: "9:0" },
    ]);
    assert.deepEqual(rootBackOperations, ["system-exit"], "root Back did not request native exit");

    const disposed = await run(platform(new Map()), [
      { action: "lifecycle", target: "app", value: "dispose" },
    ]);
    assert.equal(find(disposed.renderTree, "catalogue/lifecycle-status").properties.text, "Lifecycle: Disposed");
    assert.equal(disposed.pendingRequests, 0);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
