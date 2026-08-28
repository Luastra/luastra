import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";
import { buildProject } from "../project/build-project.mjs";

const prototype = resolve(import.meta.dirname, "..");

function find(root, id) {
  return root.id === id ? root : root.children.map((child) => find(child, id)).find(Boolean) ?? null;
}

test("independent project uses central typed nested routing without generated-host edits", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-routing-fixture-"));
  try {
    const built = await buildProject({
      manifestPath: resolve(prototype, "examples/routing-lab/luastra.json"),
      outputDirectory: workspace,
      target: "bundle",
    });
    assert.equal(built.modules, 3);
    const result = await runWasmBundle({
      bundlePath: built.bundlePath,
      runtimeModulePath: resolve(prototype, "platform/artifacts/vm-wasm/luastra-vm.js"),
      allowedCapabilities: ["ui.render"],
      requireRendererTree: true,
      dispatches: [
        { action: "open-workspace", target: "routing/workspace", value: "" },
        { action: "open-document", target: "routing/document", value: "" },
      ],
    });
    assert.equal(find(result.renderTree, "routing/name").properties.text, "Route: document");
    assert.equal(find(result.renderTree, "routing/location").properties.text, "/workspaces/7/documents/release-notes?mode=edit");
    assert.equal(result.pendingRequests, 0);
    assert.equal(result.memory.growthBytes, 0);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
