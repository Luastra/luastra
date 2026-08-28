import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { Protocol, validateRendererTree } from "../platform/protocol/generated/protocol.mjs";
import { component } from "../platform/renderer/reconciler.mjs";

test("TextInput carries bounded native keyboard and credential hints", () => {
  const input = component("TextInput", {
    id: "form/email",
    label: "Email",
    inputType: "email",
    inputMode: "email",
    enterKeyHint: "next",
    autoComplete: "email",
    placeholder: "name@example.com",
    required: true,
  });
  assert.deepEqual(
    {
      type: input.attributes.type,
      inputmode: input.attributes.inputmode,
      enterkeyhint: input.attributes.enterkeyhint,
      autocomplete: input.attributes.autocomplete,
      placeholder: input.attributes.placeholder,
    },
    { type: "email", inputmode: "email", enterkeyhint: "next", autocomplete: "email", placeholder: "name@example.com" },
  );
  assert.ok(Protocol.renderer.attributes.includes("inputmode"));
  assert.ok(Protocol.renderer.attributes.includes("placeholder"));
  assert.ok(validateRendererTree({
    type: "TextInput",
    id: "form/email",
    properties: {
      autoComplete: "email",
      enterKeyHint: "next",
      inputMode: "email",
      inputType: "email",
      label: "Email",
      placeholder: "name@example.com",
    },
    children: [],
  }));
});

test("TextInput rejects unsupported host keyboard hints", () => {
  assert.throws(() => component("TextInput", { id: "form/value", inputMode: "arbitrary" }), /invalid inputMode/);
  assert.throws(() => component("TextInput", { id: "form/value", enterKeyHint: "arbitrary" }), /invalid enterKeyHint/);
  assert.throws(() => component("TextInput", { id: "form/value", autoComplete: "arbitrary" }), /invalid autoComplete/);
  assert.throws(() => component("TextInput", { id: "form/value", placeholder: "x".repeat(161) }), /invalid placeholder/);
});

test("preview shell leaves the single main landmark to the Luastra Screen", async () => {
  const html = await readFile(new URL("../platform/host/index.html", import.meta.url), "utf8");
  const developmentHtml = await readFile(new URL("../host/index.html", import.meta.url), "utf8");
  assert.equal((html.match(/<main(?:\s|>)/g) ?? []).length, 0);
  assert.equal((developmentHtml.match(/<main(?:\s|>)/g) ?? []).length, 0);
  assert.match(html, /class="luastra-preview-shell"/);
  assert.ok(html.indexOf("bootstrap-errors.js") < html.indexOf('type="module"'), "bootstrap error boundary must precede the application module");
  assert.ok(developmentHtml.indexOf("bootstrap-errors.js") < developmentHtml.indexOf('type="module"'), "development bootstrap error boundary must precede the application module");
});

test("bootstrap error boundary turns pre-start module failures into visible bounded evidence", async () => {
  const source = await readFile(new URL("../platform/host/bootstrap-errors.js", import.meta.url), "utf8");
  assert.match(source, /maximumErrors = 8/);
  assert.match(source, /maximumMessageLength = 2048/);
  assert.match(source, /stage: "bootstrap"/);
  assert.match(source, /unhandledrejection/);
});
