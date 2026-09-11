import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { buildProject } from "../project/build-project.mjs";
import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";

const root = resolve(import.meta.dirname, "..");
const project = resolve(root, "examples/state-foundations/luastra.json");
const runtime = resolve(root, "platform/artifacts/vm-wasm/luastra-vm.js");
const hostTarget = `${process.platform}-${process.arch}`;
const executableExtension = process.platform === "win32" ? ".exe" : "";
const analyzer = resolve(root, `platform/artifacts/${hostTarget}/luastra_analyze${executableExtension}`);

function find(node, id) {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

function text(rootNode, id) {
  const node = find(rootNode, id);
  assert.ok(node, `missing node ${id}`);
  return node.properties.text;
}

async function withBundle(entry, callback) {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-state-foundations-"));
  try {
    const built = await buildProject({ manifestPath: project, outputDirectory: workspace, target: "bundle", entry });
    return await callback(built.bundlePath);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

test("generic Resource rejects a value of the wrong static type", () => {
  const result = spawnSync(analyzer, [
    "--entry=app/invalid",
    `app/invalid=${resolve(root, "examples/state-foundations/src/invalid-resource-value.luau")}`,
    `luastra/resource=${resolve(root, "sdk/luastra/resource.luau")}`,
  ], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.success, false);
  assert.equal(report.diagnostics.some((item) => /number|string/.test(item.message)), true);
});

test("App routes owned requests once and suppresses duplicate or cancelled late results", async () => {
  await withBundle("app/contract", async (bundlePath) => {
    const result = await runWasmBundle({ bundlePath, runtimeModulePath: runtime, allowedCapabilities: ["storage.get", "ui.render"], requireRendererTree: true });
    assert.equal(text(result.renderTree, "deliveries"), "1");
    assert.equal(text(result.renderTree, "purpose"), "load");
    assert.equal(text(result.renderTree, "duplicate"), "true");
    assert.equal(text(result.renderTree, "active"), "0");
    assert.equal(text(result.renderTree, "suppressed"), "3");
    assert.equal(text(result.renderTree, "features"), "first,second");
    assert.equal(text(result.renderTree, "disposed"), "true");
    assert.equal(text(result.renderTree, "disposed-features"), "1");
    assert.equal(result.memory.growthBytes, 0);
  });
});

test("PagedCollection covers bidirectional merge, anchor eviction, mutation, cancellation and edge failure", async () => {
  await withBundle("app/collection-contract", async (bundlePath) => {
    const result = await runWasmBundle({
      bundlePath,
      runtimeModulePath: runtime,
      allowedCapabilities: ["storage.get", "ui.render"],
      requireRendererTree: true,
    });
    assert.equal(text(result.renderTree, "contract-status"), "PASS");
    assert.equal(text(result.renderTree, "contract-window"), "5:8");
    assert.equal(result.memory.growthBytes, 0);
  });
});

test("two feature instances remain isolated while Resource settles through real Wasm capability resolution", async () => {
  await withBundle("app/main", async (bundlePath) => {
    const result = await runWasmBundle({
      bundlePath,
      runtimeModulePath: runtime,
      allowedCapabilities: ["storage.get", "ui.render"],
      requireRendererTree: true,
      dispatches: [{ action: "start", target: "alpha/start", value: "" }],
      async capabilityHandler(request) {
        assert.equal(request.kind, "storage.get");
        return { accepted: true, response: { version: 1, requestId: request.requestId, traceId: request.traceId, status: "ok", payload: "resolved-alpha" } };
      },
    });
    assert.equal(text(result.renderTree, "alpha/status"), "success");
    assert.equal(text(result.renderTree, "alpha/value"), "resolved-alpha");
    assert.equal(text(result.renderTree, "alpha/purpose"), "load");
    assert.equal(text(result.renderTree, "beta/status"), "idle");
    assert.equal(text(result.renderTree, "beta/value"), "none");
    assert.equal(result.pendingRequests, 0);
    assert.equal(result.memory.growthBytes, 0);
  });
});

test("Resource suppresses stale reads and rolls back a failed optimistic mutation", async () => {
  await withBundle("app/main", async (bundlePath) => {
    const result = await runWasmBundle({
      bundlePath,
      runtimeModulePath: runtime,
      allowedCapabilities: ["storage.get", "ui.render"],
      requireRendererTree: true,
      dispatches: [{ action: "probes", target: "records/probes", value: "" }],
    });
    assert.equal(text(result.renderTree, "records/probe"), "true");
    assert.equal(text(result.renderTree, "records/optimistic"), "before");
    assert.equal(result.memory.growthBytes, 0);
  });
});

test("PagedCollection deduplicates page boundaries and rejects cursor cycles", async () => {
  await withBundle("app/main", async (bundlePath) => {
    const merged = await runWasmBundle({
      bundlePath,
      runtimeModulePath: runtime,
      allowedCapabilities: ["storage.get", "ui.render"],
      requireRendererTree: true,
      dispatches: [
        { action: "load", target: "records/load", value: "" },
        { action: "duplicate", target: "records/duplicate", value: "" },
      ],
    });
    assert.equal(text(merged.renderTree, "records/count"), "101");
    assert.equal(text(merged.renderTree, "records/first"), "1");
    assert.equal(text(merged.renderTree, "records/last"), "101");

    const cycled = await runWasmBundle({
      bundlePath,
      runtimeModulePath: runtime,
      allowedCapabilities: ["storage.get", "ui.render"],
      requireRendererTree: true,
      dispatches: [
        { action: "load", target: "records/load", value: "" },
        { action: "cycle", target: "records/cycle", value: "" },
      ],
    });
    assert.equal(text(cycled.renderTree, "records/status"), "ready");
    assert.equal(text(cycled.renderTree, "records/next-error"), "CURSOR_CYCLE");
  });
});

test("PagedCollection traverses 100000 logical records with a bounded retained window", async () => {
  await withBundle("app/main", async (bundlePath) => {
    const dispatches = [{ action: "load", target: "records/load", value: "" }];
    for (let page = 1; page < 1000; page += 1) dispatches.push({ action: "next", target: "records/next", value: "" });
    const result = await runWasmBundle({
      bundlePath,
      runtimeModulePath: runtime,
      allowedCapabilities: ["storage.get", "ui.render"],
      requireRendererTree: true,
      dispatches,
    });
    assert.equal(text(result.renderTree, "records/status"), "ready");
    assert.equal(text(result.renderTree, "records/count"), "300");
    assert.equal(text(result.renderTree, "records/pages"), "3");
    assert.equal(text(result.renderTree, "records/first"), "99701");
    assert.equal(text(result.renderTree, "records/last"), "100000");
    assert.equal(text(result.renderTree, "records/traversed"), "100000");
    assert.equal(result.interaction.count, 1000);
    assert.equal(result.memory.growthBytes, 0);
    const windowed = find(result.renderTree, "records/items");
    assert.equal(windowed.properties.mode, "windowed");
    assert.equal(windowed.properties.itemCount, 100000);
    assert.equal(windowed.properties.itemOffset, 99700);
    assert.equal(windowed.children.length, 300);
    assert.equal(windowed.children.every((item) => item.type === "ListItem" && item.children.length === 1 && item.children[0].type === "Button"), true);

    const reloaded = await runWasmBundle({
      bundlePath,
      runtimeModulePath: runtime,
      allowedCapabilities: ["storage.get", "ui.render"],
      requireRendererTree: true,
      dispatches: [...dispatches, { action: "previous", target: "records/items", value: "" }],
    });
    assert.equal(text(reloaded.renderTree, "records/first"), "99601");
    assert.equal(text(reloaded.renderTree, "records/last"), "99900");
    assert.equal(find(reloaded.renderTree, "records/items").properties.itemOffset, 99600);
  });
});

test("windowed records compose existing controls and expose a polite selection status", async () => {
  await withBundle("app/main", async (bundlePath) => {
    const result = await runWasmBundle({
      bundlePath,
      runtimeModulePath: runtime,
      allowedCapabilities: ["storage.get", "ui.render"],
      requireRendererTree: true,
      dispatches: [
        { action: "load", target: "records/load", value: "" },
        { action: "inspect", target: "records/items/record-1/open", value: "" },
      ],
    });
    const status = find(result.renderTree, "records/announcement");
    assert.equal(status.properties.role, "status");
    assert.equal(status.properties.text, "Selected record 1.");
    assert.equal(find(result.renderTree, "records/items/record-1/open").properties.text, "Record 1");
  });
});
