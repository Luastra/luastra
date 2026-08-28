import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const prototype = resolve(import.meta.dirname, "..");
const platform = resolve(prototype, "platform");
const hostTarget = `${process.platform}-${process.arch}`;
const executableExtension = process.platform === "win32" ? ".exe" : "";
const analyzer = resolve(platform, `artifacts/${hostTarget}/luastra_analyze${executableExtension}`);
const compiler = resolve(platform, `artifacts/${hostTarget}/luastra_compile${executableExtension}`);
const dataSource = resolve(prototype, "sdk/luastra/data.luau");
const hostSource = resolve(prototype, "sdk/luastra/host.luau");
const motionSource = resolve(prototype, "sdk/luastra/motion.luau");
const navigationSource = resolve(prototype, "sdk/luastra/navigation.luau");
const stateSource = resolve(prototype, "sdk/luastra/state.luau");
const uiSource = resolve(prototype, "sdk/luastra/ui.luau");
const appSource = resolve(prototype, "examples/animated-catalogue/src/main.luau");
const invalidSource = resolve(prototype, "examples/animated-catalogue/src/invalid-easing.luau");

function analyze(entrySource) {
  return spawnSync(analyzer, [
    "--entry=app/main",
    `app/main=${entrySource}`,
    `luastra/host=${hostSource}`,
    `luastra/motion=${motionSource}`,
    `luastra/navigation=${navigationSource}`,
    `luastra/state=${stateSource}`,
    `luastra/ui=${uiSource}`,
  ], { encoding: "utf8" });
}

test("animated catalogue type-checks against the public Luau Motion API", () => {
  const result = analyze(appSource);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.success, true);
  assert.deepEqual(report.diagnostics, []);
  assert.match(report.analyzer, /^luau-analysis\//);
});

test("Luau analyzer rejects an unsupported easing at the application boundary", () => {
  const result = analyze(invalidSource);
  assert.notEqual(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.success, false);
  assert.equal(report.diagnostics.some((item) => /bounce|Easing/.test(item.message)), true);
});

test("pinned Luau compiler accepts both public Motion and reference app modules", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-motion-"));
  try {
    for (const [name, source] of [["data", dataSource], ["host", hostSource], ["motion", motionSource], ["navigation", navigationSource], ["state", stateSource], ["ui", uiSource], ["catalogue", appSource]]) {
      const result = spawnSync(compiler, [source, resolve(temporary, `${name}.luauc`)], { encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr || result.stdout);
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
