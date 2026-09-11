import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateRendererTree } from "../platform/protocol/generated/protocol.mjs";
import { component } from "../platform/renderer/reconciler.mjs";

test("Icon remains one bounded semantic primitive rather than one component per glyph", () => {
  const informative = { type: "Icon", id: "icon/search", properties: { className: "luastra-icon", icon: "search", decorative: false, label: "Search" }, children: [] };
  assert.equal(validateRendererTree(informative), true);
  const materialized = component("Icon", { id: "icon/search", className: "luastra-icon", icon: "search", decorative: false, label: "Search" });
  assert.equal(materialized.tag, "span");
  assert.equal(materialized.attributes.role, "img");
  assert.equal(materialized.attributes["aria-label"], "Search");
  assert.equal(materialized.attributes["data-luastra-icon"], "search");
  assert.equal(component("Icon", { id: "icon/check", icon: "check", decorative: true }).attributes["aria-hidden"], "true");
  assert.throws(() => component("Icon", { id: "icon/bad", icon: "script", decorative: true }), /invalid icon/);
  assert.throws(() => component("Icon", { id: "icon/unlabelled", icon: "search", decorative: false }), /requires a label/);
});

test("Button states are explicit and busy activation is disabled", () => {
  const busy = component("Button", { id: "action/save", text: "Save", busy: true, onTap: "save" });
  assert.equal(busy.attributes["aria-busy"], "true");
  assert.equal(busy.attributes.disabled, "true");
  assert.equal(component("Button", { id: "action/pin", text: "Pin", pressed: true }).attributes["aria-pressed"], "true");
  const selected = component("Button", { id: "navigation/home", text: "Home", selected: true });
  assert.equal(selected.attributes["aria-current"], "page");
  assert.equal(selected.attributes["data-luastra-selected"], "true");
  assert.throws(() => component("Button", { id: "action/unlabelled" }), /requires text, child content, or a label/);
  assert.throws(() => component("Button", { id: "action/ambiguous", text: "Ambiguous", pressed: true, selected: true }), /both pressed and selected/);
});

test("TextInput and Modal expose bounded completion semantics", () => {
  const input = component("TextInput", { id: "form/note", label: "Note", multiline: true, maximumLength: 400, onInput: "note.edit", onSubmit: "note.submit" });
  assert.equal(input.tag, "textarea");
  assert.equal(input.attributes.maxlength, "400");
  assert.equal(input.events.submit, "note.submit");
  assert.throws(() => component("TextInput", { id: "form/bad", label: "Bad", maximumLength: 5000 }), /maximumLength/);
  assert.throws(() => component("TextInput", { id: "form/unlabelled" }), /requires a label/);
  const modal = component("Modal", { id: "dialog/edit", label: "Edit item", open: true, initialFocus: "dialog/title", descriptionId: "dialog/help" });
  assert.equal(modal.attributes["data-luastra-initial-focus"], "dialog/title");
  assert.equal(modal.attributes["aria-describedby"], "dialog/help");
});

test("generic layout tokens include bounded safe-area sticky and overflow behavior", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../sdk/luastra/ui.luau", import.meta.url), "utf8"),
    readFile(new URL("../host/phase5-ui.css", import.meta.url), "utf8"),
  ]);
  assert.match(source, /sticky = \{ top = "luastra-sticky-top", bottom = "luastra-sticky-bottom" \}/);
  assert.match(source, /overflow = \{ visible = "luastra-overflow-visible", clip = "luastra-overflow-clip", scroll = "luastra-overflow-scroll" \}/);
  assert.match(css, /\.luastra-sticky-top[^}]+safe-area-inset-top/s);
  assert.match(css, /\.luastra-sticky-bottom[^}]+safe-area-inset-bottom/s);
  assert.match(css, /\.luastra-overflow-clip\s*\{\s*overflow:\s*clip/);
});
