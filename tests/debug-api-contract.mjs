import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";
import { buildProject } from "../project/build-project.mjs";

const prototype = resolve(import.meta.dirname, "..");

test("luastra/debug emits bounded, level-tagged output from the real Luau VM", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-debug-api-"));
  try {
    const built = await buildProject({
      manifestPath: resolve(prototype, "examples/debug-lab/luastra.json"),
      outputDirectory: workspace,
      target: "bundle",
    });
    const result = await runWasmBundle({
      bundlePath: built.bundlePath,
      runtimeModulePath: resolve(prototype, "platform/artifacts/vm-wasm/luastra-vm.js"),
      allowedCapabilities: ["ui.render"],
      requireRendererTree: true,
    });
    assert.match(result.output, /\[luastra:log\]\s+debug lab\s+7\s+true/);
    assert.match(result.output, /\[luastra:warn\]\s+warning example/);
    assert.match(result.output, /\[luastra:error\]\s+error example/);
    assert.equal(result.renderTree.properties.backgroundColor, "#F4EFE3");
    assert.equal(result.renderTree.properties.textColor, "#16342E");
    assert.equal(result.renderTree.properties.accentColor, "#245C53");
    assert.equal(result.renderTree.properties.theme, undefined);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
