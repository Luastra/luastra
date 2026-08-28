import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { buildProject } from "../project/build-project.mjs";
import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";

const prototype = resolve(import.meta.dirname, "..");

function flatten(node, result = []) {
  result.push(node);
  for (const child of node.children ?? []) flatten(child, result);
  return result;
}

async function execute(dispatches) {
  const output = await mkdtemp(resolve(tmpdir(), "luastra-accessibility-lab-"));
  try {
    const built = await buildProject({
      manifestPath: resolve(prototype, "test-fixtures/accessibility-lab/luastra.json"),
      outputDirectory: output,
      target: "bundle",
    });
    return await runWasmBundle({
      bundlePath: built.bundlePath,
      runtimeModulePath: resolve(prototype, "platform/artifacts/vm-wasm/luastra-vm.js"),
      allowedCapabilities: ["ui.render"],
      requireRendererTree: true,
      dispatches,
    });
  } finally {
    await rm(output, { recursive: true, force: true });
  }
}

test("accessibility lab binds real-IME hints, validation, bottom-field and modal lifecycle", async () => {
  const invalid = await execute([{ action: "validate", target: "accessibility/validate", value: "" }]);
  const invalidNodes = flatten(invalid.renderTree);
  const email = invalidNodes.find((node) => node.id === "accessibility/email-input");
  assert.equal(email.properties.inputType, "email");
  assert.equal(email.properties.inputMode, "email");
  assert.equal(email.properties.enterKeyHint, "next");
  assert.equal(email.properties.autoComplete, "email");
  assert.equal(email.properties.errorId, "accessibility/email-error");
  assert.equal(invalidNodes.find((node) => node.id === "accessibility/email-error").properties.role, "alert");
  assert.ok(invalidNodes.some((node) => node.id === "accessibility/bottom-input" && node.properties.enterKeyHint === "done"));

  const opened = await execute([{ action: "open-modal", target: "accessibility/open-modal", value: "" }]);
  const modal = flatten(opened.renderTree).find((node) => node.id === "accessibility/modal");
  assert.equal(modal.properties.open, true);
  assert.equal(modal.properties.onDismiss, "close-modal");

  const closed = await execute([
    { action: "open-modal", target: "accessibility/open-modal", value: "" },
    { action: "close-modal", target: "accessibility/modal", value: "escape" },
  ]);
  assert.equal(flatten(closed.renderTree).find((node) => node.id === "accessibility/modal").properties.open, false);
});
