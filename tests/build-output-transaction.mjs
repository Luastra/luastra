import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile, symlink, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { withGeneratedOutput } from "../project/output-transaction.mjs";

const cli = resolve(import.meta.dirname, "../cli/luastra.mjs");
function run(args, expected = 0) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
  assert.equal(result.status, expected, result.stdout + result.stderr);
  return result;
}
async function snapshot(root) {
  const entries = [];
  for (const entry of (await readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = resolve(root, entry.name);
    entries.push([entry.name, entry.isDirectory() ? await snapshot(path) : (await readFile(path)).toString("base64")]);
  }
  return entries;
}

for (const target of ["web", "bundle"]) test(`${target} rebuild preserves last success on analysis failure and replaces it on recovery`, async () => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-build-recovery-"));
  try {
    const app = resolve(root, "app");
    run(["create", app]);
    const args = ["build", target, `--project=${app}`];
    const first = JSON.parse(run(args).stdout);
    const output = resolve(app, "dist", target);
    const before = await snapshot(output);
    const sourcePath = resolve(app, "src/main.luau");
    const source = await readFile(sourcePath, "utf8");
    await writeFile(sourcePath, source + "\nnot valid Luau !!!\n");
    assert.match(run(args, 1).stderr, /analysis failed/);
    assert.deepEqual(await snapshot(output), before);
    assert.deepEqual(await readdir(resolve(app, "dist")), [target]);
    await writeFile(sourcePath, source.replace("Interactions:", "Counter:"));
    const second = JSON.parse(run(args).stdout);
    assert.notEqual(second.contentSha256, first.contentSha256);
    assert.notDeepEqual(await snapshot(output), before);
    if (target === "web") assert.equal(second.output, output);
    else assert.equal(second.bundlePath, resolve(output, "luastra.bundle.json"));
    assert.deepEqual(await readdir(resolve(app, "dist")), [target]);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("post-processing failure and concurrent builds leave published output intact", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-output-lock-"));
  const output = resolve(root, "web");
  const build = async (candidate) => {
    await writeFile(resolve(candidate, ".luastra-generated-web-dist"), "marker");
    await writeFile(resolve(candidate, "index.html"), "working");
    return { output: candidate };
  };
  try {
    await withGeneratedOutput(output, "web", build);
    const before = await snapshot(output);
    await assert.rejects(withGeneratedOutput(output, "web", async (candidate) => {
      await build(candidate);
      throw new Error("post-processing failed");
    }), /post-processing failed/);
    assert.deepEqual(await snapshot(output), before);
    await assert.rejects(withGeneratedOutput(output, "web", async (candidate) => {
      await rm(candidate, { recursive: true });
      return { output: candidate };
    }), /ENOENT/);
    assert.deepEqual(await snapshot(output), before);
    let release;
    let entered;
    const ready = new Promise((done) => { entered = done; });
    const first = withGeneratedOutput(output, "web", async (candidate) => {
      entered();
      await new Promise((done) => { release = done; });
      return build(candidate);
    });
    await ready;
    try {
      await assert.rejects(withGeneratedOutput(output, "web", build), /locked by another build/);
      assert.deepEqual(await snapshot(output), before);
    } finally { release(); await first; }
    assert.deepEqual(await readdir(root), ["web"]);
    const foreign = resolve(root, "foreign");
    await mkdir(foreign);
    await writeFile(resolve(foreign, "keep.txt"), "keep");
    await assert.rejects(withGeneratedOutput(foreign, "web", build), /refusing non-Luastra/);
    if (process.platform !== "win32") {
      const linked = resolve(root, "linked");
      await symlink(output, linked);
      await assert.rejects(withGeneratedOutput(linked, "web", build), /not a directory/);
    }
    assert.deepEqual(await snapshot(output), before);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("starter test rejects regressions in the real application handler and render", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-starter-regression-"));
  try {
    const app = resolve(root, "app");
    run(["create", app]);
    run(["test", `--project=${app}`]);
    const path = resolve(app, "src/main.luau");
    const source = await readFile(path, "utf8");
    await writeFile(path, source.replace("interactions += 1", "interactions += 2"));
    run(["check", `--project=${app}`]);
    assert.match(run(["test", `--project=${app}`], 1).stderr, /button must increment/);
    await writeFile(path, source.replace('onTap = "increment"', 'onTap = (42 :: any)'));
    assert.match(run(["test", `--project=${app}`], 1).stderr, /Button onTap/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
