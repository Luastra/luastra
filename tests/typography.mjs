import assert from "node:assert/strict";
import test from "node:test";
import { projectTypographyCss } from "../assets/typography.mjs";
import { fontClass, validateTypographyClasses } from "../platform/renderer/typography.mjs";
import { component } from "../platform/renderer/reconciler.mjs";
import { createProjectAssetRegistry } from "../platform/host/asset-registry.mjs";
import { buildProject } from "../project/build-project.mjs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

test("packaged typography binds the CSS, declared font and renderer asset checks", async () => {
  const output = await mkdtemp(resolve(tmpdir(), "luastra-typography-"));
  try {
    await buildProject({ manifestPath: resolve(import.meta.dirname, "../examples/typography/luastra.json"), target: "web", outputDirectory: output });
    const ledger = JSON.parse(await readFile(resolve(output, "project-assets.json"), "utf8"));
    const css = await readFile(resolve(output, "project-typography.css"), "utf8");
    assert.match(await readFile(resolve(output, "index.html"), "utf8"), /href="\.\/project-typography.css"/);
    assert.ok(css.includes(ledger.assets[0].path));
    assert.equal((await readFile(resolve(output, ledger.assets[0].path))).subarray(0, 4).toString(), "wOF2");
    const registry = createProjectAssetRegistry({ fetchImpl: async () => ({ ok: true, json: async () => ledger }) });
    await registry.load();
    validateTypographyClasses(fontClass(ledger.assets[0].id), registry.resolveLoaded);
    assert.throws(() => validateTypographyClasses(fontClass("brand/missing"), registry.resolveLoaded), /not admitted/);
    const wrong = createProjectAssetRegistry({ fetchImpl: async () => ({ ok: true, json: async () => ({ ...ledger, assets: ledger.assets.map(a => ({ ...a, kind: "image", mediaType: "image/png", path: "assets/font/atkinson-regular.png" })) }) }) });
    await wrong.load();
    assert.throws(() => validateTypographyClasses(fontClass(ledger.assets[0].id), wrong.resolveLoaded), /not admitted/);
  } finally { await rm(output, { recursive: true, force: true }); }
});

test("font classes resolve only admitted font assets and reject malformed or conflicting styles", () => {
  const token = fontClass("font/brand/regular");
  const calls = [];
  component("Text", { id: "title", text: "Hello", className: `${token} luastra-type-size-32` }, [], { resolveAsset: (...args) => calls.push(args) });
  assert.deepEqual(calls, [["asset:font/brand/regular", "font"]]);
  assert.throws(() => validateTypographyClasses(token, () => { throw new Error("asset not admitted"); }), /not admitted/);
  for (const value of ["luastra-type-font-zz", "luastra-type-size-999", "luastra-type-leading-99", "luastra-type-weight-401", "luastra-type-fallback-remote", "luastra-type-size-16 luastra-type-size-20"]) assert.throws(() => validateTypographyClasses(value, () => {}));
  assert.throws(() => fontClass("INVALID/logo"), /invalid/);
});

test("font CSS uses local declared WOFF2, accessible units and a visible fallback", () => {
  const css = projectTypographyCss([{ id: "font/brand", kind: "font", path: "assets/font/brand.woff2", mediaType: "font/woff2" }]);
  assert.match(css, /font-display:swap/);
  assert.match(css, /src:url\("\.\/assets\/font\/brand.woff2"\)/);
  assert.match(css, /luastra-type-size-32\{font-size:2rem/);
  assert.match(css, /luastra-type-leading-160\{line-height:1.6/);
  assert.doesNotMatch(css, /https?:/);
  assert.throws(() => projectTypographyCss([{ id: "font/brand", kind: "font", path: 'https://bad/font.woff2', mediaType: "font/woff2" }]), /invalid/);
});
