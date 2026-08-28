import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";
import { buildProject } from "../project/build-project.mjs";

const prototype = resolve(import.meta.dirname, "..");
const catalogue = resolve(prototype, "examples/animated-catalogue/luastra.json");
const runtime = resolve(prototype, "platform/artifacts/vm-wasm/luastra-vm.js");

function nodes(root) {
  return [root, ...root.children.flatMap(nodes)];
}

test("responsive catalogue classes are admitted by the packaged design system", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-responsive-ui-"));
  try {
    const web = resolve(workspace, "web");
    const bundle = resolve(workspace, "bundle");
    const packaged = await buildProject({ manifestPath: catalogue, outputDirectory: web, target: "web" });
    await buildProject({ manifestPath: catalogue, outputDirectory: bundle, target: "bundle" });
    const css = await readFile(resolve(web, "platform/phase5-ui.css"), "utf8");
    const html = await readFile(resolve(web, "index.html"), "utf8");
    const executed = await runWasmBundle({
      bundlePath: resolve(bundle, "luastra.bundle.json"),
      runtimeModulePath: runtime,
      allowedCapabilities: ["app.launchurl.get", "navigation.history", "storage.get", "storage.set", "ui.render"],
      requireRendererTree: true,
    });
    const treeNodes = nodes(executed.renderTree);
    const classTokens = new Set(treeNodes.flatMap((node) => String(node.properties.className ?? "").split(" ").filter(Boolean)));
    for (const token of classTokens) assert.match(css, new RegExp(`\\.${token}(?:[\\s,{.:]|$)`), `missing packaged style for ${token}`);

    assert.equal(executed.renderTree.type, "Screen");
    const bundleManifest = JSON.parse(await readFile(resolve(bundle, "luastra.bundle.json"), "utf8"));
    assert.deepEqual(bundleManifest.capabilities, ["app.launchurl.get", "navigation.history", "storage.get", "storage.set", "ui.render"], "browser host exposes only the declared application capabilities");
    assert.equal(treeNodes.some((node) => node.type === "Button"), true);
    assert.equal(treeNodes.some((node) => node.properties.className.includes("luastra-grid")), true);
    assert.equal(treeNodes.some((node) => node.properties.className.includes("luastra-responsive")), true);
    assert.match(css, /env\(safe-area-inset-top\)/);
    assert.match(css, /@media \(max-width: 640px\)/);
    assert.match(css, /@media \(prefers-color-scheme: dark\)/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(css, /@media \(forced-colors: active\)/);
    assert.match(css, /@supports \(font: -apple-system-body\)/, "packaged iOS WebKit CSS must opt into Dynamic Type");
    assert.match(css, /@media \(hover: none\)[\s\S]*font: -apple-system-body/, "Dynamic Type must be limited to touch WebKit so macOS sizing is unchanged");
    assert.match(css, /min-height: 44px/);
    assert.match(css, /\[hidden\]\s*\{[^}]*display:\s*none\s*!important/s, "layout classes must not override semantic hidden state");
    assert.match(html, /viewport-fit=cover/);
    assert.match(html, /style-src 'self'/);
    assert.doesNotMatch(html, /<style>/);
    assert.equal(packaged.projectAssets, 0);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
