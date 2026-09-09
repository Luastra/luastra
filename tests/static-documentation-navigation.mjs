import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { DomAdapter } from "../platform/renderer/dom-adapter.mjs";
import { reconcile, component } from "../platform/renderer/reconciler.mjs";
import { createSiteAdapter } from "../website/static-docs/site-adapter.mjs";

const { parseHTML } = createRequire(new URL("../website/package.json", import.meta.url))("linkedom");
test("Orbit documentation links use native navigation while application buttons retain actions", () => {
  const { document, window } = parseHTML('<html><body><div id="host-root"></div></body></html>');
  const actions = [];
  const Adapter = createSiteAdapter(DomAdapter, { aliases: {}, paths: ["/docs/overview/", "/docs/ui/", "/docs/host/"] });
  const adapter = new Adapter(document.getElementById("host-root"), { dispatch: event => actions.push(event) });
  const materialize = node => component(node.type, node.properties, node.children.map(materialize));
  const tree = href => materialize({ type: "Column", id: "landing", properties: { id: "landing" }, children: [
    { type: "Button", id: "landing/reference", properties: { id: "landing/reference", text: "SDK Reference", onTap: "landing.open-reference" }, children: [] },
    { type: "Button", id: "landing/path/docs", properties: { id: "landing/path/docs", text: "Documentation", onTap: "landing.open-reference" }, children: [] },
    { type: "Button", id: "landing/product", properties: { id: "landing/product", text: "Product", onTap: "landing.open-product" }, children: [] },
    { type: "Link", id: "landing/focus/docs", properties: { id: "landing/focus/docs", text: "Read documentation", href }, children: [] },
  ] });
  const first = tree("https://luastra.dev/docs/ui/");
  adapter.applyBatch(reconcile(null, first));
  for (const id of ["landing/reference", "landing/path/docs", "landing/focus/docs"]) {
    const element = adapter.node(id);
    assert.equal(element.tagName.toLowerCase(), "a");
    assert.ok(element.getAttribute("href").startsWith("/docs/"));
    const click = new window.Event("click", { bubbles: true, cancelable: true });
    element.dispatchEvent(click);
    assert.equal(click.defaultPrevented, false);
  }
  assert.equal(actions.length, 0);
  adapter.node("landing/product").click();
  assert.equal(actions[0].action, "landing.open-product");
  const second = tree("https://luastra.dev/docs/host/");
  adapter.applyBatch(reconcile(first, second));
  assert.equal(adapter.node("landing/focus/docs").getAttribute("href"), "/docs/host/");
  adapter.applyBatch(reconcile(second, tree("https://example.com/docs/ui/")));
  assert.equal(adapter.node("landing/focus/docs").getAttribute("href"), "https://example.com/docs/ui/");
});
