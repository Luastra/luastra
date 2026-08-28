import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";
import { createPlatformCapabilities } from "../platform/host/platform-capabilities.mjs";
import { buildProject } from "../project/build-project.mjs";
import { loadProject } from "../project/load-project.mjs";

const prototype = resolve(import.meta.dirname, "..");
const runtime = resolve(prototype, "platform/artifacts/vm-wasm/luastra-vm.js");
const budgets = Object.freeze({ interactions: 500, p95Ms: 100, memoryGrowthBytes: 4 * 1024 * 1024 });

async function audit(reference, dispatches) {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-post-interaction-"));
  try {
    const manifestPath = resolve(prototype, reference);
    const project = await loadProject(manifestPath);
    const values = new Map();
    const platform = createPlatformCapabilities(project.id, {
      storagePlugin: {
        async get({ key }) { return { value: values.get(key) ?? null }; },
        async set({ key, value }) { values.set(key, value); },
      },
      locationTarget: null,
      historyTarget: null,
      windowTarget: null,
    });
    const built = await buildProject({
      manifestPath,
      outputDirectory: workspace,
      target: "bundle",
    });
    try {
      return await runWasmBundle({
        bundlePath: built.bundlePath,
        runtimeModulePath: runtime,
        allowedCapabilities: [...project.capabilities],
        requireRendererTree: true,
        dispatches,
        capabilityHandler: platform.handle,
      });
    } finally {
      platform.dispose();
    }
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

function assertBudgets(result) {
  assert.equal(result.interaction.count, budgets.interactions);
  assert.ok(result.interaction.p95Ms <= budgets.p95Ms, `interaction p95 ${result.interaction.p95Ms}ms exceeded ${budgets.p95Ms}ms`);
  assert.ok(result.interaction.maximumMemoryGrowthBytes <= budgets.memoryGrowthBytes,
    `interaction memory ${result.interaction.maximumMemoryGrowthBytes} exceeded ${budgets.memoryGrowthBytes}`);
  assert.equal(result.pendingRequests, 0);
}

test("forms and animated catalogue survive 500 post-start interactions within shared budgets", async () => {
  const formEvents = Array.from({ length: budgets.interactions }, (_, index) => ({
    action: "change-title",
    target: "crud/title-input",
    value: `Composed value ${index % 25}`,
  }));
  const forms = await audit("examples/forms-crud/luastra.json", formEvents);
  assertBudgets(forms);

  const cards = ["catalogue/calm", "catalogue/focus", "catalogue/sleep"];
  const catalogueEvents = Array.from({ length: budgets.interactions }, (_, index) => ({
    action: "select-card",
    target: `${cards[index % cards.length]}/select`,
    value: "",
  }));
  const catalogue = await audit("examples/animated-catalogue/luastra.json", catalogueEvents);
  assertBudgets(catalogue);
  if (process.env.LUASTRA_PRINT_POST_INTERACTION === "1") {
    console.log(JSON.stringify({ budgets, forms: forms.interaction, catalogue: catalogue.interaction }, null, 2));
  }
});
