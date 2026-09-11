import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

import { createContentSourceRegistry } from "../platform/host/content-source-registry.mjs";
import { rendererTreeError, validateRendererTree } from "../platform/protocol/generated/protocol.mjs";
import { DomAdapter } from "../platform/renderer/dom-adapter.mjs";
import { materializeRendererTree } from "../platform/renderer/from-protocol-tree.mjs";
import { reconcile } from "../platform/renderer/reconciler.mjs";

const rootPath = resolve(import.meta.dirname, "..");
const token = "abcdefghijklmnopqrstuvwxyz_012345";
const dynamic = {
  type: "Image",
  id: "content/image",
  properties: {
    className: "luastra-image luastra-fit-cover",
    source: `content:${token}`,
    placeholder: "asset:image/placeholder",
    placeholderColor: "#DDE5E2",
    mediaType: "image/png",
    contentBytes: 4096,
    pixelWidth: 640,
    pixelHeight: 480,
    label: "Protected example",
    onLoad: "image.loaded",
    onError: "image.failed",
  },
  children: [],
};

class FakeStyle {
  setProperty() {}
  removeProperty() {}
}
class FakeElement {
  constructor(ownerDocument, tagName) {
    this.ownerDocument = ownerDocument; this.tagName = tagName; this.dataset = {}; this.attributes = new Map();
    this.listeners = new Map(); this.children = []; this.parentElement = null; this.style = new FakeStyle();
  }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  toggleAttribute(name, enabled) { if (enabled) this.attributes.set(name, ""); else this.attributes.delete(name); }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  removeEventListener(name, listener) { if (this.listeners.get(name) === listener) this.listeners.delete(name); }
  insertBefore(child, before) { if (child.parentElement) child.parentElement.children.splice(child.parentElement.children.indexOf(child), 1); const index = before === null ? this.children.length : this.children.indexOf(before); this.children.splice(index, 0, child); child.parentElement = this; }
  append(child) { this.insertBefore(child, null); }
  querySelectorAll() { return []; }
  remove() { if (this.parentElement) this.parentElement.children.splice(this.parentElement.children.indexOf(this), 1); this.parentElement = null; }
}
class FakeDocument { createElement(tagName) { return new FakeElement(this, tagName); } }

function assetRegistry() {
  return { resolveLoaded(reference, kind) {
    if (reference !== "asset:image/placeholder" || kind !== "image") throw new Error("not admitted image");
    return { url: "https://app.test/assets/image/placeholder.png" };
  } };
}

test("one Image protocol admits packaged, protected and preview sources but rejects unbounded metadata", () => {
  assert.equal(validateRendererTree(dynamic), true);
  assert.equal(validateRendererTree({ ...dynamic, properties: { ...dynamic.properties, source: `preview:${token}` } }), true);
  assert.equal(validateRendererTree({ ...dynamic, properties: { ...dynamic.properties, source: "https://example.test/image.png" } }), false);
  assert.equal(validateRendererTree({ ...dynamic, properties: { ...dynamic.properties, contentBytes: 25 * 1024 * 1024 + 1 } }), false);
  assert.equal(rendererTreeError({ ...dynamic, properties: { ...dynamic.properties, onError: "Refresh Image" } }), "renderer component content/image (Image) has invalid property: onError");
  assert.throws(() => materializeRendererTree({ ...dynamic, properties: { ...dynamic.properties, pixelWidth: 8192, pixelHeight: 8192 } }, { resolveAsset: () => "https://app.test/image" }), /metadata is invalid or exceeds its budget/);
});

test("content source registry keeps provider URLs out of the tree and releases the last preview owner", () => {
  let releases = 0;
  const registry = createContentSourceRegistry({
    assetRegistry: assetRegistry(),
    baseUrl: "https://app.test/view",
    resolvePreview(reference) {
      assert.equal(reference, `preview:${token}`);
      return { url: "blob:https://app.test/opaque-preview", release: () => { releases += 1; } };
    },
  });
  assert.equal(registry.resolve(`content:${token}`, "image"), `https://app.test/__luastra/content/${token}`);
  const preview = registry.resolve(`preview:${token}`, "image");
  assert.equal(preview, "blob:https://app.test/opaque-preview");
  registry.retain(preview); registry.retain(preview); registry.release(preview);
  assert.equal(releases, 0);
  registry.release(preview);
  assert.equal(releases, 1);
  assert.throws(() => registry.resolve("https://attacker.test/image.png", "image"), /not available/);
});

test("DOM image lifecycle dispatches bounded load/error actions and releases preview resources on replacement", () => {
  let releases = 0;
  const registry = createContentSourceRegistry({
    assetRegistry: assetRegistry(), baseUrl: "https://app.test/",
    resolvePreview: () => ({ url: "blob:https://app.test/opaque-preview", release: () => { releases += 1; } }),
  });
  const previewTree = { ...dynamic, properties: { ...dynamic.properties, source: `preview:${token}` } };
  const previewNode = materializeRendererTree(previewTree, { resolveAsset: registry.resolve });
  const document = new FakeDocument();
  const root = new FakeElement(document, "main");
  const events = [];
  const adapter = new DomAdapter(root, { dispatch: (event) => events.push(event), retainResource: registry.retain, releaseResource: registry.release });
  adapter.applyBatch(reconcile(null, previewNode));
  const image = adapter.node("content/image");
  assert.equal(image.getAttribute("src"), "blob:https://app.test/opaque-preview");
  image.naturalWidth = 640;
  image.naturalHeight = 480;
  image.listeners.get("load")({ currentTarget: image });
  image.listeners.get("error")({ currentTarget: image });
  assert.deepEqual(events.map(({ action }) => action), ["image.loaded", "image.failed"]);
  image.naturalWidth = 320;
  image.listeners.get("load")({ currentTarget: image });
  assert.deepEqual(events.map(({ action }) => action), ["image.loaded", "image.failed", "image.failed"]);
  const protectedNode = materializeRendererTree(dynamic, { resolveAsset: registry.resolve });
  adapter.applyBatch(reconcile(previewNode, protectedNode));
  assert.equal(releases, 1);
  assert.equal(image.getAttribute("src"), `https://app.test/__luastra/content/${token}`);
});

test("public Luau types accept direct Assets.Image and Content.Image values", () => {
  const hostTarget = `${process.platform}-${process.arch}`;
  const analyzer = resolve(rootPath, `platform/artifacts/${hostTarget}/luastra_analyze${process.platform === "win32" ? ".exe" : ""}`);
  const result = spawnSync(analyzer, [
    "--entry=app/main",
    `app/main=${resolve(rootPath, "test-fixtures/dynamic-image/main.luau")}`,
    `luastra/assets=${resolve(rootPath, "sdk/luastra/assets.luau")}`,
    `luastra/content=${resolve(rootPath, "sdk/luastra/content.luau")}`,
    `luastra/ui=${resolve(rootPath, "sdk/luastra/ui.luau")}`,
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout).diagnostics, []);
});
