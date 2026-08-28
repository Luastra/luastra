import assert from "node:assert/strict";
import test from "node:test";

import { rendererTreeError, validateRendererTree } from "../platform/protocol/generated/protocol.mjs";
import { createPlatformCapabilities } from "../platform/host/platform-capabilities.mjs";
import { materializeRendererTree } from "../platform/renderer/from-protocol-tree.mjs";
import { reconcile } from "../platform/renderer/reconciler.mjs";

const tree = {
  type: "Screen", id: "docs/root", properties: {
    className: "luastra-screen", documentTitle: "Luastra SDK Reference",
    documentDescription: "Private Luastra SDK reference", documentLanguage: "ru",
  }, children: [{
    type: "Text", id: "docs/heading", properties: { className: "luastra-text", text: "UI.Link", variant: "subheading" }, children: [],
  }, {
    type: "Text", id: "docs/summary", properties: { className: "luastra-text", text: "Read the " }, children: [{
      type: "Link", id: "docs/types-link", properties: { className: "luastra-link", text: "Luau type guide", href: "https://luau.org/types/", external: true }, children: [],
    }],
  }, {
    type: "CodeBlock", id: "docs/example", properties: { className: "luastra-code-block", text: "UI.Text { text = \"Hello\" }", language: "Luau" }, children: [],
  }, {
    type: "Table", id: "docs/table", properties: { className: "luastra-table", label: "Link parameters" }, children: [{
      type: "TableRow", id: "docs/table/head", properties: { className: "luastra-table-row" }, children: [{
        type: "TableCell", id: "docs/table/head/name", properties: { className: "luastra-table-cell", text: "Name", header: true, scope: "col" }, children: [],
      }, {
        type: "TableCell", id: "docs/table/head/type", properties: { className: "luastra-table-cell", text: "Type", header: true, scope: "col" }, children: [],
      }],
    }, {
      type: "TableRow", id: "docs/table/href", properties: { className: "luastra-table-row" }, children: [{
        type: "TableCell", id: "docs/table/href/name", properties: { className: "luastra-table-cell", text: "href" }, children: [],
      }, {
        type: "TableCell", id: "docs/table/href/type", properties: { className: "luastra-table-cell" }, children: [{
          type: "Code", id: "docs/table/href/code", properties: { className: "luastra-code", text: "string" }, children: [],
        }],
      }],
    }],
  }, {
    type: "Divider", id: "docs/end", properties: { className: "luastra-divider" }, children: [],
  }],
};

test("protocol admits semantic documentation primitives and metadata", () => {
  assert.equal(rendererTreeError(tree), null);
  const materialized = materializeRendererTree(tree);
  assert.equal(materialized.children[0].tag, "h3");
  assert.equal(materialized.children[1].children[0].tag, "a");
  assert.equal(materialized.children[2].tag, "pre");
  assert.equal(materialized.children[3].tag, "table");
  assert.equal(materialized.children[3].children[0].children[0].tag, "th");
  const patches = reconcile(null, materialized);
  const has = (target, name, value) => patches.some((item) => item.kind === "attribute" && item.target === target && item.name === name && item.value === value);
  assert.equal(has("docs/types-link", "href", "https://luau.org/types/"), true);
  assert.equal(has("docs/types-link", "rel", "noopener noreferrer"), true);
  assert.equal(has("docs/example", "data-language", "Luau"), true);
  assert.equal(has("docs/root", "data-luastra-document-title", "Luastra SDK Reference"), true);
});

test("documentation primitives reject unsafe links and malformed table semantics", () => {
  const link = tree.children[1].children[0];
  assert.equal(validateRendererTree({ ...tree, children: [{ ...link, properties: { ...link.properties, href: "javascript:alert(1)" } }] }), false);
  assert.equal(validateRendererTree({ ...tree, children: [{ ...link, properties: { ...link.properties, href: "https://user:secret@example.com/" } }] }), false);
  const table = tree.children[3];
  assert.equal(validateRendererTree({ ...tree, children: [{ ...table, children: [tree.children[0]] }] }), true, "protocol validates shape; reconciler enforces table child semantics");
  assert.throws(() => materializeRendererTree({ ...tree, children: [{ ...table, children: [tree.children[0]] }] }), /Table children/);
  const cell = table.children[1].children[0];
  assert.throws(() => materializeRendererTree({ ...tree, children: [{ ...cell, properties: { ...cell.properties, scope: "col" } }] }), /scope/);
});

function request(id, operation, input) {
  return { version: 1, kind: "clipboard.write", requestId: id, traceId: `trace-${id}`, deadlineMs: 1000, payload: { version: 1, operation, input, traceId: `trace-${id}`, deadlineMs: 1000 } };
}

test("clipboard capability writes bounded text and fails closed when unavailable", async () => {
  const writes = [];
  const capability = createPlatformCapabilities("dev.luastra.docs", { clipboard: { async writeText(value) { writes.push(value); } }, isNative: false });
  assert.equal((await capability.handle(request(1, "write-text", "local value"))).response.status, "ok");
  assert.deepEqual(writes, ["local value"]);
  assert.equal((await capability.handle(request(2, "unknown", "value"))).response.status, "error");
  const unavailable = createPlatformCapabilities("dev.luastra.docs", { clipboard: null, isNative: false });
  assert.equal((await unavailable.handle(request(3, "write-text", "value"))).response.payload.code, "FORBIDDEN");
});
