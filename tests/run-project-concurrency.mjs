import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { runProject } from "../project/run-project.mjs";

test("concurrent previews of one project keep independent bundles", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-concurrent-run-"));
  const source = resolve(root, "src/main.luau");
  const manifest = resolve(root, "luastra.json");
  await mkdir(resolve(root, "src"), { recursive: true });
  await writeFile(source, `--!strict

local UI = require("luastra/ui")
local Application = {}
function Application.render(): UI.Node
    return UI.Screen { id = "concurrent-preview" }
end
return Application
`, "utf8");
  await writeFile(manifest, `${JSON.stringify({
    schemaVersion: 2,
    project: { id: "dev.luastra.concurrent-preview", entry: "app/main" },
    sdk: { contract: 1 },
    capabilities: ["ui.render"],
    modules: [{ id: "app/main", source: "src/main.luau", dependencies: ["luastra/ui"] }],
    tests: [],
  }, null, 2)}\n`, "utf8");

  let first = null;
  let second = null;
  const bundleStatus = (controller) => fetch(new URL("/bundle/luastra.bundle.json", controller.url)).then((response) => response.status);
  try {
    first = await runProject({ manifestPath: manifest, port: 0, watch: false });
    assert.equal(await bundleStatus(first), 200);

    second = await runProject({ manifestPath: manifest, port: 0, watch: false });
    assert.equal(await bundleStatus(first), 200);
    assert.equal(await bundleStatus(second), 200);

    await second.close();
    second = null;
    assert.equal(await bundleStatus(first), 200);
  } finally {
    await second?.close();
    await first?.close();
    await rm(root, { recursive: true, force: true });
  }
});
