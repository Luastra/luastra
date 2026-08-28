import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DomAdapter } from "../platform/renderer/dom-adapter.mjs";

class FakeStyle {
  values = new Map();
  setProperty(name, value) { this.values.set(name, value); }
  removeProperty(name) { this.values.delete(name); }
  getPropertyValue(name) { return this.values.get(name) ?? ""; }
}

class FakeElement {
  constructor(ownerDocument, tagName) {
    this.ownerDocument = ownerDocument;
    this.tagName = tagName;
    this.dataset = {};
    this.attributes = new Map();
    this.children = [];
    this.parentElement = null;
    this.style = new FakeStyle();
  }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  insertBefore(child, before) {
    if (child.parentElement) child.parentElement.children.splice(child.parentElement.children.indexOf(child), 1);
    const index = before === null ? this.children.length : this.children.indexOf(before);
    this.children.splice(index, 0, child);
    child.parentElement = this;
  }
  append(child) { this.insertBefore(child, null); }
  querySelectorAll() { return []; }
  remove() {
    if (this.parentElement) this.parentElement.children.splice(this.parentElement.children.indexOf(this), 1);
    this.parentElement = null;
  }
}

class FakeDocument {
  constructor() {
    this.title = "Luastra preview";
    this.documentElement = { lang: "en" };
    this.head = new FakeElement(this, "head");
  }
  createElement(tagName) { return new FakeElement(this, tagName); }
  querySelector(selector) {
    if (selector !== 'meta[name="description"]') return null;
    return this.head.children.find((child) => child.tagName === "meta" && child.getAttribute("name") === "description") ?? null;
  }
}

test("DOM adapter maps theme and scoped colors to CSS variables", () => {
  const document = new FakeDocument();
  const root = new FakeElement(document, "div");
  const adapter = new DomAdapter(root);
  adapter.applyBatch([
    { kind: "create", target: "theme/root", name: "", value: "main" },
    { kind: "attribute", target: "theme/root", name: "data-luastra-theme-text", value: "#16342E" },
    { kind: "attribute", target: "theme/root", name: "data-luastra-theme-background", value: "#F4EFE3" },
    { kind: "attribute", target: "theme/root", name: "data-luastra-theme-accent", value: "#2F7568" },
    { kind: "attribute", target: "theme/root", name: "data-luastra-theme-surface", value: "#FFFDF7" },
    { kind: "place", target: "host-root", name: "theme/root", value: "" },
    { kind: "create", target: "theme/title", name: "", value: "h1" },
    { kind: "attribute", target: "theme/title", name: "data-luastra-text-color", value: "accent" },
    { kind: "attribute", target: "theme/title", name: "data-luastra-background-color", value: "surface" },
    { kind: "place", target: "theme/root", name: "theme/title", value: "" },
  ]);
  const screen = adapter.node("theme/root");
  const text = adapter.node("theme/title");
  assert.equal(screen.style.getPropertyValue("--luastra-color-text"), "#16342E");
  assert.equal(screen.style.getPropertyValue("--luastra-color-bg"), "#F4EFE3");
  assert.equal(screen.style.getPropertyValue("--luastra-color-accent"), "#2F7568");
  assert.equal(screen.style.getPropertyValue("--luastra-color-accent-text"), "#2F7568");
  assert.equal(screen.style.getPropertyValue("--luastra-color-accent-strong"), "#2F7568");
  assert.equal(screen.style.getPropertyValue("--luastra-color-on-accent"), "#FFFFFF");
  assert.equal(screen.style.getPropertyValue("--luastra-color-surface"), "#FFFDF7");
  assert.equal(screen.style.getPropertyValue("--luastra-color-surface-raised"), "#FFFDF7");
  assert.equal(text.style.getPropertyValue("--luastra-local-text-color"), "var(--luastra-color-accent)");
  assert.equal(text.style.getPropertyValue("--luastra-local-background-color"), "var(--luastra-color-surface)");
});

test("host stylesheet contains text alignment and scoped color rules", async () => {
  const css = await readFile(new URL("../host/phase5-ui.css", import.meta.url), "utf8");
  assert.match(css, /#host-root \{ width: 100%; \}/);
  assert.doesNotMatch(css, /#host-root \{[^}]*1180px/);
  assert.match(css, /\.luastra-width-wide \{ width: min\(100%, 1180px\);/);
  assert.match(css, /\.luastra-text-align-center \{ text-align: center; \}/);
  assert.match(css, /\.luastra-justify-center \{ justify-content: center; \}/);
  assert.match(css, /\.luastra-button\[data-luastra-background-color\] \{ background: var\(--luastra-local-background-color\); \}/);
  assert.match(css, /\[data-luastra-text-color\] \{ color: var\(--luastra-local-text-color\); \}/);
  assert.match(css, /\[data-luastra-background-color\] \{ background-color: var\(--luastra-local-background-color\); \}/);
  assert.match(css, /#host-root p \{ color: var\(--luastra-local-text-color, var\(--luastra-color-muted\)\); \}/);
  assert.match(css, /\.luastra-screen \{[^}]*background: var\(--luastra-color-bg\)/);
  assert.match(css, /\.luastra-surface-accent \{[^}]*--luastra-local-text-color: var\(--luastra-color-on-accent\)/);
  assert.match(css, /\.luastra-layer > :not\(:first-child\) \{ position: absolute; inset: 0;/);
  for (const size of ["none", "xs", "sm", "md", "lg", "xl"]) {
    assert.match(css, new RegExp(`\\.luastra-padding-${size} \\{`));
    assert.match(css, new RegExp(`\\.luastra-paddingX-${size} \\{`));
    assert.match(css, new RegExp(`\\.luastra-marginEnd-${size} \\{`));
  }
});

test("DOM adapter applies and restores Screen-owned document metadata", () => {
  const document = new FakeDocument();
  const root = new FakeElement(document, "div");
  const adapter = new DomAdapter(root);
  adapter.applyBatch([
    { kind: "create", target: "docs/root", name: "", value: "main" },
    { kind: "attribute", target: "docs/root", name: "data-luastra-document-title", value: "Luastra SDK Reference" },
    { kind: "attribute", target: "docs/root", name: "data-luastra-document-language", value: "ru" },
    { kind: "attribute", target: "docs/root", name: "data-luastra-document-description", value: "Private reference" },
    { kind: "place", target: "host-root", name: "docs/root", value: "" },
  ]);
  assert.equal(document.title, "Luastra SDK Reference");
  assert.equal(document.documentElement.lang, "ru");
  assert.equal(document.querySelector('meta[name="description"]').getAttribute("content"), "Private reference");
  adapter.applyBatch([
    { kind: "remove-attribute", target: "docs/root", name: "data-luastra-document-title", value: "" },
    { kind: "remove-attribute", target: "docs/root", name: "data-luastra-document-language", value: "" },
    { kind: "remove-attribute", target: "docs/root", name: "data-luastra-document-description", value: "" },
  ]);
  assert.equal(document.title, "Luastra preview");
  assert.equal(document.documentElement.lang, "en");
  assert.equal(document.querySelector('meta[name="description"]').getAttribute("content"), "");
});
