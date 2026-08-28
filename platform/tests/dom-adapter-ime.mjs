import assert from "node:assert/strict";

import { DomAdapter } from "../renderer/dom-adapter.mjs";

class FakeElement {
  constructor(ownerDocument, tagName) {
    this.ownerDocument = ownerDocument;
    this.tagName = tagName;
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.children = [];
    this.parentElement = null;
    this.value = "";
    this.selectionStart = 0;
    this.selectionEnd = 0;
    this.selectionDirection = "none";
    this.blurCount = 0;
    this.disabled = false;
    this.hidden = false;
    this.tabIndex = 0;
  }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  toggleAttribute(name, enabled) { if (enabled) this.attributes.set(name, ""); else this.attributes.delete(name); }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  removeEventListener(name, listener) { if (this.listeners.get(name) === listener) this.listeners.delete(name); }
  emit(name, details = {}) {
    const event = {
      type: name,
      currentTarget: this,
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
      ...details,
    };
    this.listeners.get(name)?.(event);
    return event;
  }
  insertBefore(child, before) {
    if (child.parentElement) child.parentElement.children.splice(child.parentElement.children.indexOf(child), 1);
    const index = before === null ? this.children.length : this.children.indexOf(before);
    this.children.splice(index, 0, child);
    child.parentElement = this;
  }
  append(child) { this.insertBefore(child, null); }
  focus() { this.ownerDocument.activeElement = this; }
  blur() {
    this.blurCount += 1;
    if (this.ownerDocument.activeElement === this) this.ownerDocument.activeElement = null;
  }
  setSelectionRange(start, end, direction) {
    this.selectionStart = start;
    this.selectionEnd = end;
    this.selectionDirection = direction;
  }
  querySelectorAll() { return []; }
  closest() { return null; }
  remove() {
    if (this.parentElement) this.parentElement.children.splice(this.parentElement.children.indexOf(this), 1);
    this.parentElement = null;
  }
}

class FakeDocument {
  activeElement = null;
  createElement(tagName) { return new FakeElement(this, tagName); }
  querySelectorAll() {
    const matches = [];
    const visit = (node) => {
      for (const child of node.children) {
        if (["input", "textarea", "select"].includes(child.tagName) || child.getAttribute("contenteditable") === "true") {
          matches.push(child);
        }
        visit(child);
      }
    };
    if (this.root) visit(this.root);
    return matches;
  }
}

const document = new FakeDocument();
const root = new FakeElement(document, "main");
document.root = root;
const dispatched = [];
const adapter = new DomAdapter(root, { dispatch: (event) => dispatched.push(event) });
adapter.applyBatch([
  { kind: "create", target: "name", name: "", value: "input" },
  { kind: "attribute", target: "name", name: "value", value: "Luastra" },
  { kind: "attribute", target: "name", name: "aria-describedby", value: "name-error" },
  { kind: "event", target: "name", name: "input", value: "update-name" },
  { kind: "place", target: "host-root", name: "name", value: "" },
  { kind: "create", target: "name-error", name: "", value: "p" },
  { kind: "place", target: "host-root", name: "name-error", value: "" },
  { kind: "focus", target: "name", name: "", value: "" },
]);

const input = adapter.node("name");
assert.equal(input.id, "name");
assert.equal(adapter.node(input.attributes.get("aria-describedby")).id, "name-error", "described-by target lacks a real DOM ID");
input.setSelectionRange(7, 7, "none");
input.emit("compositionstart");
input.value = "Luastra に";
input.setSelectionRange(9, 9, "none");
input.emit("input", { isComposing: true });
assert.equal(dispatched.length, 0, "intermediate IME input crossed the VM boundary");

adapter.applyBatch([{ kind: "attribute", target: "name", name: "value", value: "stale controlled value" }]);
assert.equal(input.value, "Luastra に", "controlled render overwrote active composition");
assert.deepEqual([input.selectionStart, input.selectionEnd], [9, 9]);

input.value = "Luastra 日本";
input.setSelectionRange(10, 10, "none");
input.emit("compositionend");
input.emit("input", { isComposing: false });
assert.equal(dispatched.length, 1);
assert.deepEqual(
  { action: dispatched[0].action, target: dispatched[0].target, value: dispatched[0].value },
  { action: "update-name", target: "name", value: "Luastra 日本" },
);

adapter.applyBatch([{ kind: "attribute", target: "name", name: "value", value: "Luastra 日本!" }]);
assert.equal(input.value, "Luastra 日本!");
assert.deepEqual([input.selectionStart, input.selectionEnd], [10, 10]);

adapter.applyBatch([{ kind: "event", target: "name", name: "input", value: "" }]);
input.value = "must not dispatch";
input.emit("input", { isComposing: false });
assert.equal(dispatched.length, 1, "removed input listener still dispatched");

adapter.applyBatch([{ kind: "attribute", target: "name", name: "enterkeyhint", value: "done" }]);
input.focus();
input.emit("compositionstart");
const composingEnter = input.emit("keydown", { key: "Enter", keyCode: 229, isComposing: true });
assert.equal(input.blurCount, 0, "Done dismissed the keyboard during active IME composition");
assert.equal(composingEnter.defaultPrevented, false, "composing Enter was cancelled");
input.emit("compositionend");
const doneEnter = input.emit("keydown", { key: "Enter", keyCode: 13, isComposing: false });
assert.equal(input.blurCount, 1, "Done did not finish the editing session");
assert.equal(document.activeElement, null, "Done left the input focused");
assert.equal(doneEnter.defaultPrevented, true, "Done allowed an implicit form submission");

adapter.applyBatch([{ kind: "attribute", target: "name", name: "enterkeyhint", value: "next" }]);
adapter.applyBatch([
  { kind: "create", target: "email", name: "", value: "input" },
  { kind: "place", target: "host-root", name: "email", value: "" },
  { kind: "create", target: "composed", name: "", value: "input" },
  { kind: "place", target: "host-root", name: "composed", value: "" },
]);
input.focus();
const nextEnter = input.emit("keydown", { key: "Enter", keyCode: 13, isComposing: false });
assert.equal(input.blurCount, 1, "non-Done action retained the Done handler");
assert.equal(document.activeElement, adapter.node("email"), "Next did not focus the next editable control");
assert.equal(nextEnter.defaultPrevented, true, "Next allowed an implicit form submission");

adapter.applyBatch([{ kind: "attribute", target: "email", name: "enterkeyhint", value: "next" }]);
adapter.node("email").focus();
adapter.node("email").emit("keydown", { key: "Enter", keyCode: 13, isComposing: false });
assert.equal(document.activeElement, adapter.node("composed"), "Next did not preserve editable document order");

adapter.applyBatch([{ kind: "attribute", target: "name", name: "enterkeyhint", value: "done" }]);
adapter.applyBatch([{ kind: "remove-attribute", target: "name", name: "enterkeyhint", value: "" }]);
input.emit("keydown", { key: "Enter", keyCode: 13, isComposing: false });
assert.equal(input.blurCount, 1, "removed Done attribute retained the Done handler");

console.log(JSON.stringify({
  result: "PASS",
  assertions: 20,
  intermediateCompositionDispatches: 0,
  finalCompositionDispatches: 1,
  activeCompositionOverwritePrevented: true,
  selectionPreservedAfterControlledUpdate: true,
  listenerRemoval: "PASS",
  doneEditingDismissal: "PASS",
  nextEditingFocusTransfer: "PASS",
  composingEnterPreserved: true,
  boundary: "Synthetic composition events are a deterministic regression control, not a real CJK IME test.",
}, null, 2));
