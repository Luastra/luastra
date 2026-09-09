import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const cli = resolve(import.meta.dirname, "../cli/luastra.mjs");
test("UI constructor field types reject invalid author inputs before rendering", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-ui-types-"));
  const project = resolve(root, "app");
  const run = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
  try {
    assert.equal(run(["create", project]).status, 0);
    const cases = [
      ['UI.Text { id = "title", textStyle = { size = "big" } }', "size"],
      ['UI.Text { id = "title", textStyle = { fallback = "remote" } }', "fallback"],
      ['UI.Button { id = "action", text = "Go", onTap = 42 }', "onTap"],
      ['UI.Text { id = "title", text = false }', "text"],
      ['UI.TextInput { id = "input", value = 5, onInput = "edit" }', "value"],
      ['UI.TextInput { id = "input", value = "", onInput = true }', "onInput"],
      ['UI.Orbit { id = "orbit", maxVisible = "many" }', "maxVisible"],
      ['UI.Button { text = "Missing ID" }', "id"],
      ['UI.Column { id = "column", "not a node" }', "Node"],
    ];
    for (const [expression, diagnostic] of cases) {
      await writeFile(resolve(project, "src/main.luau"), `--!strict\nlocal UI = require("luastra/ui")\nlocal App = {}\nfunction App.render(): UI.Node\nreturn ${expression}\nend\nfunction App.handle(_action: string, _target: string, _value: string) end\nreturn App\n`);
      const result = run(["check", `--project=${project}`]);
      assert.equal(result.status, 1, expression + result.stdout + result.stderr);
      assert.match(result.stderr, /analysis failed/);
      assert.match(result.stderr, /sources\/app\/main\.luau:5:/, diagnostic + result.stderr);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});
