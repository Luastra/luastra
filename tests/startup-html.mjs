import assert from "node:assert/strict";
import test from "node:test";
import { renderStartupHtml } from "../platform/packaging/startup-html.mjs";

const node = (type, id, properties = {}, children = []) => ({ type, id, properties, children });
const screen = child => node("Screen", "startup", { accentColor: "#123456" }, [child]);

test("startup HTML escapes text and uses shared renderer colors in external CSS", () => {
  const tree = screen(node("Text", "startup/title", { text: '<script>alert("x")</script>' }));
  const result = renderStartupHtml(tree, []);
  assert.match(result.html, /&lt;script&gt;/);
  assert.doesNotMatch(result.html, /<script| style=/);
  assert.match(result.css, /--luastra-color-accent:#123456/);
  assert.match(result.css, /--luastra-color-on-accent:#FFFFFF/);
  assert.deepEqual(renderStartupHtml(tree, []), result);
});

test("startup HTML eagerly loads admitted images and rejects external asset substitutions", () => {
  const tree = screen(node("Image", "startup/logo", { source: "asset:image/logo", label: "Logo" }));
  const asset = { id: "image/logo", kind: "image", path: "assets/image/logo.png" };
  assert.match(renderStartupHtml(tree, [asset]).html, /loading="eager"/);
  for (const path of ["https://example.com/logo.png", "assets/../secret", 'assets/image/a".png']) {
    assert.throws(() => renderStartupHtml(tree, [{ ...asset, path }]));
  }
});

test("startup rejects document metadata instead of silently ignoring renderer side effects", () => {
  assert.throws(() => renderStartupHtml(node("Screen", "startup", { documentTitle: "Hidden title" }), []), /project web metadata/);
});

test("authored failure exports only the retry action with independent IDs", () => {
  const failureTree = screen(node("Button", "startup/title", { text: "Retry safely", onTap: "startup.retry" }));
  const result = renderStartupHtml(screen(node("Text", "startup/title", { text: "Loading" })), [], { failureTree });
  assert.match(result.html, /id="luastra-startup-failure\/startup\/title"/);
  assert.match(result.html, /data-startup-retry=""/);
  assert.doesNotMatch(result.html, /onclick=|onTap=/);
  failureTree.children[0].properties.onTap = "app.reset";
  assert.throws(() => renderStartupHtml(screen(node("Text", "x", { text: "Loading" })), [], { failureTree }), /unsupported component Button/);
});
