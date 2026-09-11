import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { buildProject } from "../../project/build-project.mjs";
import { runStartupBundle } from "../packaging/run-startup-bundle.mjs";
import { runWasmBundle } from "../packaging/run-wasm-bundle.mjs";
import { admitStartupTree } from "../packaging/startup-tree.mjs";
import { resolveRuntime } from "../resolve-runtime.mjs";

const runtimeModulePath = process.env.LUASTRA_STARTUP_TEST_RUNTIME ?? (await resolveRuntime()).artifacts.runtimeJavaScript;

async function fixture(body, use) {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-startup-test-"));
  try {
    await mkdir(resolve(root, "src"));
    await writeFile(resolve(root, "src/dependency.luau"), `--!nonstrict\n${body}\nreturn true\n`);
    await writeFile(resolve(root, "src/main.luau"), `--!nonstrict
local UI = require("luastra/ui")
local dependency = require("app/dependency")
return { render = function()
  return UI.Screen { id = "startup", UI.Text { id = "startup/title", text = "Loading " .. tostring(math.round(1.2)) } }
end }
`);
    const manifestPath = resolve(root, "luastra.json");
    await writeFile(manifestPath, JSON.stringify({ schemaVersion: 2,
      project: { id: "dev.luastra.startup-test", entry: "app/main" }, sdk: { contract: 1 }, capabilities: ["ui.render"],
      modules: [ { id: "app/main", source: "src/main.luau", dependencies: ["luastra/ui", "app/dependency"] },
        { id: "app/dependency", source: "src/dependency.luau", dependencies: [] } ],
    }));
    const outputDirectory = resolve(root, "bundle");
    await buildProject({ manifestPath, outputDirectory, target: "bundle" });
    await use({ bundlePath: resolve(outputDirectory, "luastra.bundle.json"), runtimeModulePath });
  } finally { await rm(root, { recursive: true, force: true }); }
}

test("real startup VM restricts dependency globals and freezes libraries", async () => {
  await fixture(`
assert(os == nil and coroutine == nil and gcinfo == nil)
assert(getfenv == nil and setfenv == nil and getmetatable == nil and setmetatable == nil)
assert(loadstring == nil and debug == nil and _G == nil)
assert(math.random == nil and math.randomseed == nil)
assert(not pcall(function() return getmetatable("") end))
assert(not pcall(function() return setmetatable({}, {}) end))
assert(not pcall(function() return rawget({}, "key") end))
assert(not pcall(function() return math.random() end))
assert(not pcall(function() math.abs = nil end))
local values = table.clone({ 3, 1, 2 })
table.sort(values)
assert(table.concat(values, ",") == "1,2,3")
`, async options => {
    const tree = await runStartupBundle(options);
    assert.equal(admitStartupTree(tree).children[0].text, "Loading 1");
  });
});

test("normal application VM retains os and coroutine", async () => {
  await fixture('assert(type(os.clock) == "function" and type(coroutine.create) == "function")', async options => {
    const result = await runWasmBundle({ ...options, allowedCapabilities: ["ui.render"], requireRendererTree: true });
    assert.equal(result.renderTree.type, "Screen");
    await assert.rejects(runStartupBundle(options), /startup execution failed/);
  });
});

test("supervisor terminates a Luau infinite loop in a dependency", async () => {
  await fixture("while true do end", async options => {
    await assert.rejects(runStartupBundle({ ...options, timeoutMs: 1000 }), /time or output budget/);
  });
});

test("startup VM refuses excessive Luau allocation", async () => {
  await fixture("local values = table.create(10000000, 1)", async options => {
    // Both outcomes are fail-closed: the VM may reject the allocation directly,
    // or the supervisor may terminate it at the fixed startup budget first.
    await assert.rejects(
      runStartupBundle(options),
      /not enough memory|memory allocation|out of memory|startup execution exceeded its 5000ms time or output budget/i,
    );
  });
});
