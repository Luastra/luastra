import assert from "node:assert/strict";
import test from "node:test";

import { rendererTreeError, validateRendererTree } from "../platform/protocol/generated/protocol.mjs";
import { materializeRendererTree } from "../platform/renderer/from-protocol-tree.mjs";
import { reconcile } from "../platform/renderer/reconciler.mjs";

const tween = { kind: "tween", from: 0, to: 180, durationMs: 500, easing: "easeInOutCubic" };
const tree = {
  type: "Screen", id: "visual/root", properties: { className: "luastra-screen" }, children: [{
    type: "FlipCard", id: "visual/card", properties: {
      className: "luastra-flip-card", width: 220, height: 330, label: "Guessing card",
      motion: { rotationYDeg: tween },
    }, children: [
      { type: "Image", id: "visual/front", properties: { className: "luastra-image luastra-fit-cover", source: "asset:image/card-back", label: "Card back", width: 220, height: 330, cornerRadius: 18 }, children: [] },
      { type: "Shape", id: "visual/back", properties: { className: "luastra-shape luastra-shape-rounded-rectangle", width: 220, height: 330, cornerRadius: 18, fill: "#D4473B", stroke: "text", strokeWidth: 3, label: "Red card" }, children: [] },
    ],
  }],
};

const themedTextTree = {
  type: "Screen", id: "theme/root", properties: {
    className: "luastra-screen", backgroundColor: "#F4EFE3", textColor: "#16342E",
    accentColor: "#2F7568", surfaceColor: "#FFFDF7", mutedColor: "#526A64",
    successColor: "#245C53", dangerColor: "#9C3C32", warningColor: "#E4AD3A",
  }, children: [{
    type: "Text", id: "theme/title", properties: {
      className: "luastra-text luastra-width-full luastra-text-align-center",
      text: "Sixth Sense", variant: "title", textColor: "accent", backgroundColor: "surface",
    }, children: [],
  }],
};

test("protocol admits bounded image, shape and flip-card primitives", () => {
  assert.equal(validateRendererTree(tree), true);
  assert.equal(validateRendererTree({ ...tree, children: [{ ...tree.children[0], properties: { ...tree.children[0].properties, width: 5000 } }] }), false);
  assert.equal(validateRendererTree({ ...tree, children: [{ ...tree.children[0], children: [{ ...tree.children[0].children[0], properties: { ...tree.children[0].children[0].properties, source: "https://example.com/untrusted.png" } }, tree.children[0].children[1]] }] }), false);
});

test("renderer diagnostics identify duplicate IDs and invalid event actions", () => {
  const duplicate = { ...themedTextTree, children: [themedTextTree.children[0], { ...themedTextTree.children[0] }] };
  assert.equal(rendererTreeError(duplicate), "duplicate renderer component id: theme/title");
  const invalidAction = {
    type: "Screen", id: "event/root", properties: { className: "luastra-screen" }, children: [{
      type: "Button", id: "event/start", properties: { className: "luastra-button", text: "Start", onTap: "goGame" }, children: [],
    }],
  };
  assert.equal(rendererTreeError(invalidAction), "renderer component event/start (Button) has invalid property: onTap");
});

test("protocol admits scoped colors on layout containers", () => {
  const scoped = {
    type: "Screen", id: "scope/root", properties: { className: "luastra-screen" }, children: [{
      type: "Column", id: "scope/card", properties: {
        className: "luastra-column", textColor: "warning", backgroundColor: "surface",
      }, children: [{ type: "Text", id: "scope/text", properties: { className: "luastra-text", text: "Scoped" }, children: [] }],
    }],
  };
  assert.equal(validateRendererTree(scoped), true);
  const patches = reconcile(null, materializeRendererTree(scoped));
  assert.equal(patches.some((patch) => patch.target === "scope/card" && patch.name === "data-luastra-text-color" && patch.value === "warning"), true);
  assert.equal(patches.some((patch) => patch.target === "scope/card" && patch.name === "data-luastra-background-color" && patch.value === "surface"), true);
});

test("protocol admits custom button colors without changing button semantics", () => {
  const buttonTree = {
    type: "Screen", id: "button/root", properties: { className: "luastra-screen" }, children: [{
      type: "Button", id: "button/red", properties: {
        className: "luastra-button luastra-action-primary luastra-justify-center",
        text: "Red", onTap: "choose-red", backgroundColor: "danger", textColor: "surface",
      }, children: [],
    }],
  };
  assert.equal(validateRendererTree(buttonTree), true);
  const node = materializeRendererTree(buttonTree);
  assert.equal(node.children[0].tag, "button");
  const patches = reconcile(null, node);
  assert.equal(patches.some((patch) => patch.target === "button/red" && patch.name === "data-luastra-background-color" && patch.value === "danger"), true);
  assert.equal(patches.some((patch) => patch.target === "button/red" && patch.name === "data-luastra-text-color" && patch.value === "surface"), true);
  assert.equal(validateRendererTree({ ...buttonTree, children: [{ ...buttonTree.children[0], properties: { ...buttonTree.children[0].properties, backgroundColor: "red" } }] }), false);
});

test("materialization resolves admitted images and emits safe visual attributes", () => {
  const materialized = materializeRendererTree(tree, { resolveAsset(reference, kind) {
    assert.equal(reference, "asset:image/card-back"); assert.equal(kind, "image");
    return "http://127.0.0.1:4175/assets/image/card-back.png";
  } });
  const patches = reconcile(null, materialized);
  assert.equal(patches.some((patch) => patch.kind === "create" && patch.target === "visual/front" && patch.value === "img"), true);
  assert.equal(patches.some((patch) => patch.kind === "attribute" && patch.target === "visual/front" && patch.name === "src" && patch.value.endsWith("card-back.png")), true);
  assert.equal(patches.some((patch) => patch.kind === "attribute" && patch.target === "visual/back" && patch.name === "data-luastra-fill" && patch.value === "#D4473B"), true);
  assert.equal(patches.some((patch) => patch.kind === "attribute" && patch.target === "visual/card" && patch.name === "data-luastra-width" && patch.value === "220"), true);
});

test("protocol and reconciler admit text styling and screen theme defaults", () => {
  assert.equal(validateRendererTree(themedTextTree), true);
  assert.equal(validateRendererTree({ ...themedTextTree, properties: { ...themedTextTree.properties, accentColor: "accent" } }), false);
  assert.equal(validateRendererTree({ ...themedTextTree, children: [{ ...themedTextTree.children[0], properties: { ...themedTextTree.children[0].properties, textColor: "javascript:red" } }] }), false);
  const patches = reconcile(null, materializeRendererTree(themedTextTree));
  const has = (target, name, value) => patches.some((patch) => patch.kind === "attribute" && patch.target === target && patch.name === name && patch.value === value);
  assert.equal(has("theme/root", "data-luastra-theme-background", "#F4EFE3"), true);
  assert.equal(has("theme/root", "data-luastra-theme-accent", "#2F7568"), true);
  assert.equal(has("theme/title", "data-luastra-text-color", "accent"), true);
  assert.equal(has("theme/title", "data-luastra-background-color", "surface"), true);
  assert.equal(has("theme/title", "class", "luastra-text luastra-width-full luastra-text-align-center"), true);
});
