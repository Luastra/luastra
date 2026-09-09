import assert from "node:assert/strict";
import test from "node:test";
import { admitStartupTree } from "../platform/packaging/startup-tree.mjs";

const node = (type, id, properties = {}, children = []) => ({ type, id, properties, children });
const screen = child => node("Screen", "startup", {}, [child]);

test("startup output admits a static screen and preserves text as data", () => {
  const tree = screen(node("Text", "startup/title", { text: '<script>alert("x")</script>' }));
  const result = admitStartupTree(tree);
  assert.equal(result.children[0].text, '<script>alert("x")</script>');
  assert.equal(result.children[0].tag, "p");
});

test("startup output rejects interactive components and event handlers", () => {
  assert.throws(() => admitStartupTree(screen(node("Button", "startup/action", { text: "Run" }))), /unsupported component/);
  assert.throws(() => admitStartupTree(screen(node("Link", "startup/link", { href: "https://luastra.dev/docs/", onTap: "open" }))), /onTap requires runtime/);
  assert.doesNotThrow(() => admitStartupTree(screen(node("Link", "startup/link", { href: "https://luastra.dev/docs/", text: "Documentation" }))));
});

test("startup output rejects runtime routes, unsafe URLs and nested screens", () => {
  for (const href of ["#/docs", "javascript:alert(1)", "data:text/html,test", "https://", "http://example.com"]) {
    assert.throws(() => admitStartupTree(screen(node("Link", "startup/link", { href }))));
  }
  assert.throws(() => admitStartupTree(screen(node("Screen", "startup/nested"))), /nested Screen/);
});

test("startup output retains protocol validation for unknown properties and duplicate IDs", () => {
  assert.throws(() => admitStartupTree(screen(node("Text", "startup/title", { innerHTML: "<img>" }))));
  assert.throws(() => admitStartupTree(screen(node("Text", "startup", { text: "duplicate" }))));
});

test("startup output rejects motion instead of exporting a frozen animation", () => {
  assert.throws(() => admitStartupTree(screen(node("Text", "startup/title", {
    text: "Loading", motion: { opacity: { kind: "tween", from: 0, to: 1, durationMs: 500, easing: "linear" } },
  }))));
});

test("startup output requires project asset admission", () => {
  const tree = screen(node("Image", "startup/logo", { source: "asset:image/brand/logo", label: "Logo" }));
  assert.throws(() => admitStartupTree(tree), /requires a project asset resolver/);
  const calls = [];
  const result = admitStartupTree(tree, { resolveAsset: (...args) => {
    calls.push(args);
    return "./assets/brand/logo.png";
  } });
  assert.deepEqual(calls, [["asset:image/brand/logo", "image"]]);
  assert.equal(result.children[0].attributes.src, "./assets/brand/logo.png");
});
