import assert from "node:assert/strict";
import test from "node:test";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { loadProject } from "../project/load-project.mjs";

test("startup entry must be a separate declared module with no extra configuration", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-startup-manifest-"));
  try {
    await cp(resolve(import.meta.dirname, "../examples/startup-screen"), root, { recursive: true, filter: path => !path.includes(".luastra") });
    const path = resolve(root, "luastra.json");
    const original = JSON.parse(await readFile(path));
    assert.equal((await loadProject(path)).startup.entry, "app/startup");
    for (const startup of [null, {}, { entry: "../escape" }, { entry: "app/missing" }, { entry: "app/main" }, { entry: "app/startup", script: "bad.js" }]) {
      await writeFile(path, JSON.stringify({ ...original, startup }));
      await assert.rejects(loadProject(path), /startup/);
    }
    const { startup, ...legacy } = original;
    await writeFile(path, JSON.stringify(legacy));
    assert.equal((await loadProject(path)).startup, null);
  } finally { await rm(root, { recursive: true, force: true }); }
});
