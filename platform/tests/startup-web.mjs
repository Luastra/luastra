import assert from "node:assert/strict";
import test from "node:test";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { buildProject } from "../../project/build-project.mjs";
import { fileLedger } from "../../assets/package-assets.mjs";

test("project startup web export is deterministic, excludes startup bytecode and preserves output on failure", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "luastra-startup-web-"));
  try {
    const project = resolve(root, "project");
    await cp(resolve(import.meta.dirname, "../../examples/startup-screen"), project, { recursive: true, filter: path => !path.includes(".luastra") });
    const literal = "$& $$ $` $'";
    const startupPath = resolve(project, "src/startup.luau");
    await writeFile(startupPath, (await readFile(startupPath, "utf8"))
      .replace('"Preparing your application…"', () => JSON.stringify(`Preparing your application… ${literal}`)));
    const options = { manifestPath: resolve(project, "luastra.json"), outputDirectory: resolve(root, "site"), target: "web" };
    const first = await buildProject(options);
    const ledger = await fileLedger(options.outputDirectory);
    const html = await readFile(resolve(options.outputDirectory, "index.html"), "utf8");
    assert.match(html, /Preparing your application/);
    assert.ok(html.includes("$&amp; $$ $` $'"), "startup text must preserve literal replacement metacharacters");
    assert.equal((html.match(/id="host-root"/g) ?? []).length, 1);
    assert.match(html, /href="\.\/startup.css"/);
    assert.doesNotMatch(html, / style=|<script[^>]*>[^<]+/);
    const bundle = JSON.parse(await readFile(resolve(options.outputDirectory, "bundle/luastra.bundle.json")));
    assert.ok(!bundle.modules.some(module => module.id === "app/startup"));
    assert.ok(ledger.some(entry => entry.path === "startup.css"));
    assert.ok(!ledger.some(entry => /startup.*luauc|compiled\//.test(entry.path)));
    const second = await buildProject(options);
    assert.equal(first.startupContentSha256, second.startupContentSha256);
    assert.deepEqual(await fileLedger(options.outputDirectory), ledger);
    await writeFile(startupPath, (await readFile(startupPath, "utf8")).replace("Preparing your application…", "Loading a new revision…"));
    const changed = await buildProject(options);
    assert.notEqual(changed.startupContentSha256, first.startupContentSha256);
    assert.notEqual(changed.projectContentSha256, first.projectContentSha256);
    const existing = await readFile(startupPath, "utf8");
    await writeFile(startupPath, existing.replace("return {", 'return { renderFailure = function() return UI.Screen { id = "failure", UI.Text { id = "custom", text = "Authored failure" }, UI.Button { id = "retry", text = "Retry build", onTap = "startup.retry" } } end,'));
    const authored = await buildProject(options);
    assert.notEqual(authored.startupContentSha256, changed.startupContentSha256);
    const authoredHtml = await readFile(resolve(options.outputDirectory, "index.html"), "utf8");
    assert.match(authoredHtml, /Authored failure/);
    assert.match(authoredHtml, /data-startup-retry/);
    const validOutput = await fileLedger(options.outputDirectory);
    await writeFile(startupPath, existing.replace("return {", 'return { renderFailure = function() error("Failure export rejected") end,'));
    await assert.rejects(buildProject(options), /Failure export rejected/);
    assert.deepEqual(await fileLedger(options.outputDirectory), validOutput);
    await writeFile(startupPath, '--!strict\nlocal UI = require("luastra/ui")\nreturn { render = function() return UI.Screen { id = "startup", UI.Button { id = "bad", text = "Invalid" } } end }\n');
    await assert.rejects(buildProject(options), /unsupported component Button/);
    assert.deepEqual(await fileLedger(options.outputDirectory), validOutput);
  } finally { await rm(root, { recursive: true, force: true }); }
});
