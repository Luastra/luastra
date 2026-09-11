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
  getAttribute(name) { return this.attributes.get(name) ?? null; }
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
  querySelectorAll(selector) {
    const matches = [];
    const visit = (node) => {
      for (const child of node.children) {
        if (selector === "[data-luastra-id]" && child.dataset?.luastraId) matches.push(child);
        visit(child);
      }
    };
    visit(this);
    return matches;
  }
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

test("modal close can be deferred and a reopen cancels stale completion", () => {
  const document = new FakeDocument();
  const root = new FakeElement(document, "div");
  const origin = new FakeElement(document, "button");
  document.activeElement = origin;
  let completeClose = null;
  let cancellations = 0;
  const adapter = new DomAdapter(root, {
    deferModalClose(_dialog, complete) {
      completeClose = complete;
      return () => { cancellations += 1; };
    },
  });
  const open = component("Modal", { id: "details/modal", label: "Details", open: true });
  const closed = component("Modal", { id: "details/modal", label: "Details", open: false });
  adapter.applyBatch(reconcile(null, open));
  const dialog = adapter.node("details/modal");

  adapter.applyBatch(reconcile(open, closed));
  assert.equal(dialog.open, true, "the host transition owns the visible close boundary");
  assert.equal(completeClose(), true);
  assert.equal(dialog.open, false);
  assert.equal(document.activeElement, origin);

  document.activeElement = origin;
  adapter.applyBatch(reconcile(closed, open));
  adapter.applyBatch(reconcile(open, closed));
  const staleCompletion = completeClose;
  adapter.applyBatch(reconcile(closed, open));
  assert.equal(cancellations, 1);
  assert.equal(staleCompletion(), false);
  assert.equal(dialog.open, true, "a reopened modal must not be closed by an obsolete transition");
});

test("deferred modal close observes content before the closing render is applied", () => {
  const document = new FakeDocument();
  const root = new FakeElement(document, "div");
  let titleAtClose = null;
  const adapter = new DomAdapter(root, {
    deferModalClose(dialog) {
      titleAtClose = dialog.children[0]?.textContent ?? null;
      return () => {};
    },
  });
  const open = component("Modal", { id: "details/modal", label: "Details", open: true }, [
    component("Text", { id: "details/title", text: "Interface", variant: "heading" }),
  ]);
  const closed = component("Modal", { id: "details/modal", label: "Selection", open: false }, [
    component("Text", { id: "details/title", text: "Selection", variant: "heading" }),
  ]);

  adapter.applyBatch(reconcile(null, open));
  adapter.applyBatch(reconcile(open, closed));

  assert.equal(titleAtClose, "Interface", "the host must be able to snapshot the last open content");
  assert.equal(adapter.node("details/title").textContent, "Selection", "semantic content still updates immediately");
});

test("Modal moves focus to its declared initial child after insertion", () => {
  const document = new FakeDocument();
  const root = new FakeElement(document, "div");
  const origin = new FakeElement(document, "button");
  document.activeElement = origin;
  const adapter = new DomAdapter(root);
  const open = component("Modal", {
    id: "edit/modal",
    label: "Edit",
    open: true,
    initialFocus: "edit/name",
    descriptionId: "edit/help",
  }, [
    component("Text", { id: "edit/help", text: "Update the name." }),
    component("Button", { id: "edit/name", text: "Save" }),
  ]);
  adapter.applyBatch(reconcile(null, open));
  assert.equal(document.activeElement, adapter.node("edit/name"));
  assert.equal(adapter.node("edit/modal").attributes.get("aria-describedby"), "edit/help");
});
