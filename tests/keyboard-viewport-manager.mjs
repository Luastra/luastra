import assert from "node:assert/strict";
import test from "node:test";

import { createKeyboardViewportManager } from "../platform/host/keyboard-viewport-manager.mjs";

class Events {
  listeners = new Map();
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  removeEventListener(name, listener) { if (this.listeners.get(name) === listener) this.listeners.delete(name); }
  emit(name, event = {}) { this.listeners.get(name)?.(event); }
}

function fixture(bounds) {
  const viewport = new Events();
  viewport.height = 400;
  viewport.offsetTop = 0;
  const windowTarget = new Events();
  const frames = new Map();
  let sequence = 0;
  const scrolls = [];
  windowTarget.visualViewport = viewport;
  windowTarget.innerHeight = 800;
  windowTarget.requestAnimationFrame = (callback) => { frames.set(++sequence, callback); return sequence; };
  windowTarget.cancelAnimationFrame = (id) => frames.delete(id);
  windowTarget.scrollBy = (value) => scrolls.push(value);
  const input = {
    matches: (selector) => selector.includes("input"),
    getBoundingClientRect: () => bounds,
  };
  const root = new Events();
  root.contains = (value) => value === input;
  const documentTarget = { activeElement: input };
  const flush = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    for (const callback of callbacks) callback();
  };
  return { viewport, windowTarget, documentTarget, input, root, scrolls, frames, flush };
}

test("active field is moved above a shrunken software-keyboard viewport", () => {
  const value = fixture({ top: 390, bottom: 434 });
  const manager = createKeyboardViewportManager(value);
  value.root.emit("focusin", { target: value.input });
  value.flush();
  assert.deepEqual(value.scrolls, [{ top: 50, left: 0, behavior: "auto" }]);
  manager.dispose();
  assert.equal(value.root.listeners.size, 0);
  assert.equal(value.viewport.listeners.size, 0);
  assert.equal(value.windowTarget.listeners.size, 0);
});

test("visible or blurred fields do not move the viewport", () => {
  const value = fixture({ top: 120, bottom: 164 });
  const manager = createKeyboardViewportManager(value);
  value.root.emit("focusin", { target: value.input });
  value.flush();
  assert.deepEqual(value.scrolls, []);
  value.root.emit("focusout", { target: value.input });
  value.viewport.emit("resize");
  value.flush();
  assert.deepEqual(value.scrolls, []);
  manager.dispose();
});

test("viewport animation coalesces to one visibility check per frame", () => {
  const value = fixture({ top: 390, bottom: 434 });
  const manager = createKeyboardViewportManager(value);
  value.root.emit("focusin", { target: value.input });
  value.viewport.emit("resize");
  value.viewport.emit("scroll");
  assert.equal(value.frames.size, 1);
  value.flush();
  assert.equal(value.scrolls.length, 1);
  manager.dispose();
});
