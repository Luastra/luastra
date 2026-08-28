import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";
import { buildProject } from "../project/build-project.mjs";
import { testProject } from "../project/test-project.mjs";
import { loadProject } from "../project/load-project.mjs";
import { createMemoryDatabase } from "../backend/database.mjs";
import { createBackendRuntime, handleServerCapability } from "../backend/runtime.mjs";

const prototype = resolve(import.meta.dirname, "..");
const platform = resolve(prototype, "platform");
const project = resolve(prototype, "examples/forms-crud/luastra.json");
const runtime = resolve(platform, "artifacts/vm-wasm/luastra-vm.js");
const hostTarget = `${process.platform}-${process.arch}`;
const executableExtension = process.platform === "win32" ? ".exe" : "";
const analyzer = resolve(platform, `artifacts/${hostTarget}/luastra_analyze${executableExtension}`);
const dataSource = resolve(prototype, "sdk/luastra/data.luau");
const invalidSchema = resolve(prototype, "examples/forms-crud/src/invalid-schema.luau");

function find(node, id) {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

function nodes(root) {
  return [root, ...root.children.flatMap(nodes)];
}

async function execute(bundlePath, dispatches, capabilityHandler = null) {
  return runWasmBundle({
    bundlePath,
    runtimeModulePath: runtime,
    allowedCapabilities: ["rpc.call", "ui.render"],
    requireRendererTree: true,
    dispatches,
    capabilityHandler,
  });
}

async function backendFixture() {
  const loaded = await loadProject(project);
  const database = createMemoryDatabase();
  const implementation = await import(`${pathToFileURL(loaded.backend.handlerPath).href}?forms-contract=${Date.now()}-${Math.random()}`);
  const handlers = implementation.createHandlers({ database });
  const backend = createBackendRuntime({ contract: loaded.backend.declaration.value, handlers, database });
  return (request) => handleServerCapability(request, { runtime: backend, principal: { id: "local-user", roles: ["user"] } });
}

test("forms fixture performs validated create, read, update and delete through Wasm", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-forms-crud-"));
  try {
    const built = await buildProject({ manifestPath: project, outputDirectory: workspace, target: "bundle" });
    const bundle = JSON.parse(await readFile(resolve(workspace, "luastra.bundle.json"), "utf8"));
    assert.deepEqual(bundle.modules.map((module) => module.id), ["luastra/data", "app/model", "luastra/server", "app/server-functions", "luastra/ui", "app/main"]);
    const capabilityHandler = await backendFixture();

    const invalid = await execute(built.bundlePath, [{ action: "save-record", target: "crud/save", value: "" }]);
    const css = await readFile(resolve(prototype, "host/phase5-ui.css"), "utf8");
    const classTokens = new Set(nodes(invalid.renderTree).flatMap((node) => String(node.properties.className ?? "").split(" ").filter(Boolean)));
    for (const token of classTokens) assert.match(css, new RegExp(`\\.${token}(?:[\\s,{.:]|$)`), `missing form style for ${token}`);
    assert.equal(find(invalid.renderTree, "crud/title-input").properties.errorId, "crud/title-error");
    assert.equal(find(invalid.renderTree, "crud/title-error").properties.role, "alert");
    assert.equal(find(invalid.renderTree, "crud/title-error").properties.text, "Title is required.");

    const created = await execute(built.bundlePath, [
      { action: "lifecycle", target: "app", value: "online" },
      { action: "lifecycle", target: "app", value: "launch" },
      { action: "change-title", target: "crud/title-input", value: "  Publish notes  " },
      { action: "change-details", target: "crud/details-input", value: "  Document the public contract.  " },
      { action: "save-record", target: "crud/save", value: "" },
    ], capabilityHandler);
    assert.equal(find(created.renderTree, "crud/records/count").properties.text, "3 total");
    assert.equal(find(created.renderTree, "crud/card/record-3/title").properties.text, "Publish notes");

    const changed = await execute(built.bundlePath, [
      { action: "lifecycle", target: "app", value: "online" },
      { action: "lifecycle", target: "app", value: "launch" },
      { action: "edit-record", target: "crud/card/record-1/edit", value: "" },
      { action: "change-title", target: "crud/title-input", value: "Plan the bounded alpha" },
      { action: "save-record", target: "crud/save", value: "" },
      { action: "delete-record", target: "crud/card/record-2/delete", value: "" },
    ], capabilityHandler);
    assert.equal(find(changed.renderTree, "crud/records/count").properties.text, "2 total");
    assert.equal(find(changed.renderTree, "crud/card/record-1/title").properties.text, "Plan the bounded alpha");
    assert.equal(find(changed.renderTree, "crud/card/record-2"), null);
    assert.equal(find(changed.renderTree, "crud/backend-status").properties.text, "Record deleted");
    assert.equal(changed.memory.growthBytes, 0);

    const projectTests = await testProject(project);
    assert.equal(projectTests.tests, 3);
    assert.equal(projectTests.passed, 3);
    assert.deepEqual(projectTests.results.map((result) => result.memoryGrowthBytes), [0, 0, 0]);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("typed data schema rejects invalid Luau options at analysis time", () => {
  const result = spawnSync(analyzer, [
    "--entry=app/invalid",
    `app/invalid=${invalidSchema}`,
    `luastra/data=${dataSource}`,
  ], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.success, false);
  assert.equal(report.diagnostics.some((item) => /number\?|minBytes/.test(item.message)), true);
});
