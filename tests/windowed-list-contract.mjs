import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import { createWindowedListController, computeWindow } from "../platform/host/windowed-list-controller.mjs";
import { validateRendererTree } from "../platform/protocol/generated/protocol.mjs";
import { DomAdapter } from "../platform/renderer/dom-adapter.mjs";
import { component, reconcile } from "../platform/renderer/reconciler.mjs";

const { parseHTML } = createRequire(new URL("../website/package.json", import.meta.url))("linkedom");

test("windowed presentation remains independent from browser and native Back", async () => {
  const source = await readFile(new URL("../platform/host/windowed-list-controller.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\b(?:backButton|history|popstate|system_back)\b/);
});

function list(items, properties = {}) {
  return component("List", {
    id: "records",
    label: "Records",
    className: "luastra-list",
    mode: "windowed",
    estimatedItemSize: 50,
    overscan: 2,
    startBusy: false,
    endBusy: false,
    itemOffset: 0,
    itemCount: items.length,
    onEndReached: "records.next",
    ...properties,
  }, items.map((id) => component("ListItem", { id, className: "luastra-list-item", text: id })));
}

test("window calculation handles variable heights, overscan and a pinned focus item", () => {
  assert.deepEqual(computeWindow({
    sizes: [20, 40, 80, 30, 50],
    viewportStart: 55,
    viewportEnd: 125,
    overscan: 1,
  }), { start: 0, end: 4, visibleStart: 1, visibleEnd: 3, leading: 0, trailing: 50, total: 220 });
  assert.deepEqual(computeWindow({
    sizes: Array(20).fill(50),
    viewportStart: 500,
    viewportEnd: 650,
    overscan: 1,
    focusedIndex: 2,
  }), { start: 1, end: 14, visibleStart: 10, visibleEnd: 13, leading: 50, trailing: 300, total: 1000 });
  assert.throws(() => computeWindow({ sizes: [0], viewportStart: 0, viewportEnd: 1, overscan: 1 }), /positive/);
});

test("List materialization emits one reusable windowing contract", () => {
  const item = { type: "ListItem", id: "records/one", properties: { className: "luastra-list-item", text: "One" }, children: [] };
  const raw = {
    type: "List", id: "records", properties: {
      className: "luastra-list", label: "Records", mode: "windowed", estimatedItemSize: 72, overscan: 6,
      startBusy: false, endBusy: true, itemOffset: 40, itemCount: 100, onStartReached: "records.previous", onEndReached: "records.next",
    }, children: [item],
  };
  assert.equal(validateRendererTree(raw), true);
  assert.equal(validateRendererTree({ ...raw, properties: { ...raw.properties, estimatedItemSize: 0 } }), false);
  assert.equal(validateRendererTree({ ...raw, properties: { ...raw.properties, itemCount: -1 } }), false);

  const materialized = list(["records/one"], { itemCount: 100, itemOffset: 40, onStartReached: "records.previous", endBusy: true });
  assert.equal(materialized.attributes["data-luastra-list-mode"], "windowed");
  assert.equal(materialized.attributes["data-luastra-list-item-count"], "100");
  assert.equal(materialized.attributes["aria-busy"], "true");
  assert.equal(materialized.events.startReached, "records.previous");
  assert.throws(() => component("List", { id: "plain", estimatedItemSize: 40 }, []), /require mode/);
  assert.throws(() => component("List", {
    id: "records", mode: "windowed", estimatedItemSize: 50, overscan: 2, startBusy: false, endBusy: false, itemOffset: 0,
  }, [component("Text", { id: "records/text", text: "Not an item" })]), /ListItem/);
});

test("DOM host realizes a bounded list window, restores its anchor and deduplicates edge events", () => {
  const { document } = parseHTML('<html><body><div id="host-root"></div></body></html>');
  const root = document.getElementById("host-root");
  const actions = [];
  const adapter = new DomAdapter(root, { dispatch: (event) => actions.push(event) });
  const ids = Array.from({ length: 100 }, (_, index) => `records/item-${index}`);
  let currentIds = [...ids];
  let tree = list(ids);
  adapter.applyBatch(reconcile(null, tree));

  let scrollTop = 1000;
  const heights = new Map(ids.map((id) => [id, 50]));
  let onScroll = null;
  const scrollTarget = {
    addEventListener(name, listener) { if (name === "scroll") onScroll = listener; },
    removeEventListener(name, listener) { if (name === "scroll" && onScroll === listener) onScroll = null; },
  };
  const frames = [];
  const microtasks = [];
  let notifyResize;
  class ResizeObserver {
    constructor(callback) { notifyResize = callback; }
    observe() {}
    disconnect() {}
  }
  adapter.node("records").getBoundingClientRect = () => ({ top: 0, bottom: 5000, height: 5000 });
  const connectGeometry = (id) => { adapter.node(id).getBoundingClientRect = () => {
    const index = currentIds.indexOf(id);
    const top = currentIds.slice(0, index).reduce((sum, itemId) => sum + (heights.get(itemId) ?? 50), 0) - scrollTop;
    const height = heights.get(id) ?? 50;
    return { top, bottom: top + height, height };
  }; };
  for (const id of ids) connectGeometry(id);
  const controller = createWindowedListController({
    root,
    resolveNode: (id) => adapter.node(id),
    dispatch: (id, eventName, value) => adapter.dispatchHostEvent(id, eventName, value),
    viewport: () => ({ start: scrollTop, end: scrollTop + 300, top: 0, eventTarget: scrollTarget, scrollBy: (delta) => { scrollTop += delta; } }),
    requestFrame: (callback) => { frames.push(callback); return frames.length; },
    cancelFrame() {},
    ResizeObserver,
    queueMicrotask: (callback) => microtasks.push(callback),
  });
  controller.sync(tree);
  assert.ok(adapter.node("records").children.length <= 13, "only the overscanned window and two spacers should remain connected");
  assert.deepEqual(controller.diagnostics()[0], { id: "records", mode: "windowed", retainedItems: 100, realizedItems: 10, measuredItems: 0 });
  assert.equal(adapter.node("records/item-20").getAttribute("aria-posinset"), "21");
  assert.equal(adapter.node("records/item-20").getAttribute("aria-setsize"), "100");
  heights.set("records/item-19", 90);
  notifyResize([{ target: adapter.node("records/item-19"), contentRect: { height: 90 } }]);
  frames.shift()();
  assert.ok(controller.diagnostics()[0].measuredItems > 0, "realized variable heights should enter the bounded measurement cache");
  assert.equal(scrollTop, 1040, "a delayed size change above the anchor should not move visible content");
  heights.set("records/item-18", 70);
  adapter.node("records/item-18").dispatchEvent(new document.defaultView.Event("load", { bubbles: true }));
  while (frames.length > 0) frames.shift()();
  assert.equal(scrollTop, 1060, "a descendant load signal should restore the latest stable anchor");

  controller.prepare();
  const inserted = Array.from({ length: 30 }, (_, index) => `records/new-${index}`);
  const prepended = [...inserted, ...ids];
  const next = list(prepended);
  adapter.applyBatch(reconcile(tree, next));
  currentIds = prepended;
  for (const id of inserted) connectGeometry(id);
  tree = next;
  controller.sync(tree);
  assert.equal(scrollTop, 2560, "prepending a page should preserve the first visible stable item");

  controller.prepare();
  currentIds = prepended.filter((id) => id !== "records/item-20");
  const deleted = list(currentIds);
  adapter.applyBatch(reconcile(tree, deleted));
  tree = deleted;
  controller.sync(tree);
  assert.equal(scrollTop, 2510, "removing the first anchor candidate should preserve the next visible stable item");

  let focused = adapter.node("records/item-21");
  Object.defineProperty(document, "activeElement", { configurable: true, get: () => focused });
  scrollTop = 5000;
  onScroll();
  frames.shift()();
  assert.equal(adapter.node("records/item-21").isConnected, true, "a focused item should remain connected across a distant window");
  assert.ok(controller.diagnostics()[0].realizedItems <= 16, "focus pinning must not realize the entire gap to the viewport");
  assert.equal(adapter.node("records").querySelectorAll(":scope > .luastra-window-spacer").length, 3, "a disjoint focus pin should use one internal spacer");
  focused = null;

  controller.prepare();
  const busy = list(currentIds, { endBusy: true });
  adapter.applyBatch(reconcile(tree, busy));
  tree = busy;
  controller.sync(tree);
  scrollTop = 6200;
  onScroll();
  frames.shift()();
  while (microtasks.length > 0) microtasks.shift()();
  assert.equal(actions.length, 0, "a busy edge should provide backpressure");

  controller.prepare();
  const ready = list(currentIds);
  adapter.applyBatch(reconcile(tree, ready));
  tree = ready;
  controller.sync(tree);
  while (microtasks.length > 0) microtasks.shift()();
  assert.deepEqual(actions.map(({ action, target, value }) => ({ action, target, value })), [
    { action: "records.next", target: "records", value: "" },
  ]);
  onScroll();
  frames.shift()();
  while (microtasks.length > 0) microtasks.shift()();
  assert.equal(actions.length, 1, "the same retained edge must not start a duplicate request");
  controller.dispose();
});

test("empty and one-item windowed lists remain complete and accessible", () => {
  for (const ids of [[], ["records/only"]]) {
    const { document } = parseHTML('<html><body><div id="host-root"></div></body></html>');
    const root = document.getElementById("host-root");
    const adapter = new DomAdapter(root);
    const tree = list(ids, { onEndReached: undefined });
    adapter.applyBatch(reconcile(null, tree));
    class ResizeObserver { observe() {} disconnect() {} }
    const controller = createWindowedListController({
      root,
      resolveNode: (id) => adapter.node(id),
      dispatch: () => {},
      viewport: () => ({ start: 0, end: 300, top: 0, eventTarget: null, scrollBy() {} }),
      requestFrame: () => 1,
      cancelFrame() {},
      ResizeObserver,
      queueMicrotask() {},
    });
    controller.sync(tree);
    assert.equal(adapter.node("records").dataset.luastraListWindowState, "complete");
    assert.equal(adapter.node("records").children.length, ids.length);
    if (ids.length === 1) {
      assert.equal(adapter.node(ids[0]).getAttribute("aria-posinset"), "1");
      assert.equal(adapter.node(ids[0]).getAttribute("aria-setsize"), "1");
    }
    controller.dispose();
  }
});

test("missing ResizeObserver uses the complete bounded accessible fallback", () => {
  const { document } = parseHTML('<html><body><div id="host-root"></div></body></html>');
  const root = document.getElementById("host-root");
  const adapter = new DomAdapter(root);
  const tree = list(Array.from({ length: 30 }, (_, index) => `records/item-${index}`), { onEndReached: undefined });
  adapter.applyBatch(reconcile(null, tree));
  const controller = createWindowedListController({
    root,
    resolveNode: (id) => adapter.node(id),
    dispatch: (id, eventName, value) => adapter.dispatchHostEvent(id, eventName, value),
    viewport: () => ({ start: 0, end: 300, top: 0, eventTarget: null, scrollBy() {} }),
    requestFrame: () => 1,
    cancelFrame() {},
    ResizeObserver: null,
    queueMicrotask() {},
  });
  controller.sync(tree);
  assert.equal(adapter.node("records").children.length, 30);
  assert.equal(adapter.node("records").dataset.luastraListWindowState, "fallback");
  controller.dispose();
});
