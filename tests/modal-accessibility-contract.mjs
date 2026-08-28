import assert from "node:assert/strict";
import test from "node:test";

import { DomAdapter } from "../platform/renderer/dom-adapter.mjs";
import { component, reconcile } from "../platform/renderer/reconciler.mjs";

class FakeElement {
  constructor(ownerDocument, tagName) {
    this.ownerDocument = ownerDocument;
    this.tagName = tagName;
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.children = [];
    this.parentElement = null;
    this.open = false;
    this.isConnected = true;
  }
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) { this.attributes.delete(name); }
  toggleAttribute(name, enabled) { if (enabled) this.attributes.set(name, ""); else this.attributes.delete(name); }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  removeEventListener(name, listener) { if (this.listeners.get(name) === listener) this.listeners.delete(name); }
  insertBefore(child, before) {
    const index = before === null ? this.children.length : this.children.indexOf(before);
    this.children.splice(index, 0, child);
    child.parentElement = this;
  }
  append(child) { this.insertBefore(child, null); }
  querySelectorAll() { return []; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  focus() { this.ownerDocument.activeElement = this; }
  remove() {}
}

class FakeDocument {
  activeElement = null;
  createElement(tagName) { return new FakeElement(this, tagName); }
}

test("Escape dismissal remains Luau-owned and restores origin focus", () => {
  const document = new FakeDocument();
  const root = new FakeElement(document, "div");
  const origin = new FakeElement(document, "button");
  document.activeElement = origin;
  const dispatched = [];
  const adapter = new DomAdapter(root, { dispatch: (event) => dispatched.push(event) });
  const open = component("Modal", {
    id: "about/modal",
    label: "About",
    open: true,
    onDismiss: "close-modal",
  });
  adapter.applyBatch(reconcile(null, open));
  const dialog = adapter.node("about/modal");
  assert.equal(dialog.open, true);
  let prevented = false;
  dialog.listeners.get("cancel")({ currentTarget: dialog, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.deepEqual(dispatched.map(({ action, target }) => ({ action, target })), [{ action: "close-modal", target: "about/modal" }]);
  assert.equal(dialog.open, true, "native cancel must wait for Luau state reconciliation");

  const closed = component("Modal", { id: "about/modal", label: "About", open: false, onDismiss: "close-modal" });
  adapter.applyBatch(reconcile(open, closed));
  assert.equal(dialog.open, false);
  assert.equal(document.activeElement, origin);
});
