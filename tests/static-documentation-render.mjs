import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { generateStaticDocumentation, renderDocumentationDOM } from "../website/static-docs/render.mjs";
import { sections, release } from "../website/site/reference-data.js";
import { generatedPages } from "../website/site/generated-reference-data.js";
import { buildProject } from "../project/build-project.mjs";
import { fileLedger } from "../assets/package-assets.mjs";

test("static documentation preserves Luastra DOM, copy source and deterministic output", async () => {
  const output = await mkdtemp(resolve(tmpdir(), "luastra-prerender-"));
  try {
    await buildProject({ manifestPath: resolve(import.meta.dirname, "../website/app/luastra.json"), target: "web", outputDirectory: output });
    const onlyPaths = ["/reference/installation/offline-installation/", "/docs/overview/", "/docs/learning-path/", "/reference/ui/text-style/"];
    const options = { output, sections, pages: generatedPages, version: release.version, onlyPaths };
    const result = await generateStaticDocumentation(options);
    assert.equal(result.documents, onlyPaths.length);
    const offline = await readFile(resolve(output, "reference/installation/offline-installation/index.html"), "utf8");
    assert.match(offline, /src="\/docs\/reader.js"/);
    assert.doesNotMatch(offline, /\.wasm|src="[^\"]*main.js|reader.css/);
    assert.match(offline, /href="\/docs\/installation\/"/);
    assert.match(offline, /href="\/#\/"/);
    assert.match(offline, /id="docs-copy-source"/);
    const original = await renderDocumentationDOM({ output, shell: await readFile(resolve(output, "index.html"), "utf8"), route: "#/reference/installation/offline-installation" });
    // Every original paragraph and code block survives serialization; no replacement article template.
    for (const element of original.querySelectorAll('[id="docs/detail"] p,[id="docs/detail"] pre')) {
      const text = element.textContent.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
      assert.ok(offline.includes(text), element.id);
    }
    assert.match(await readFile(resolve(output, "docs/prerender.css"), "utf8"), /html\[data-docs-theme="dark"\]/);
    const overview = await readFile(resolve(output, "docs/overview/index.html"), "utf8");
    assert.doesNotMatch(overview, /id="live\/increment"/);
    assert.match(overview, /Live Luastra example/);
    assert.match(overview, /data-docs-example="\/live-example\/"/);
    assert.doesNotMatch(overview, /<iframe/);
    const learning = await readFile(resolve(output, "docs/learning-path/index.html"), "utf8");
    assert.match(learning, /data-docs-example="\/live-example\/#learning"/);
    const before = await fileLedger(output);
    await generateStaticDocumentation(options);
    assert.deepEqual(await fileLedger(output), before);
  } finally { await rm(output, { recursive: true, force: true }); }
});
