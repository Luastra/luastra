import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../platform/host/bootstrap-errors.js", import.meta.url), "utf8");
function host(withStartup = true) {
  const events = {}, documentEvents = {};
  let state = null, focusCount = 0, reloadCount = 0;
  const panel = { focus() { focusCount++; } };
  const startup = {
    getAttribute() { return state; },
    setAttribute(name, value) { state = value; },
    querySelector() { return panel; },
  };
  const status = { hidden: true, classList: { add() {} } }, error = { hidden: true };
  const document = {
    querySelector(selector) { return selector === "#status" ? status : selector === "#error" ? error : withStartup ? startup : null; },
    addEventListener(name, handler) { documentEvents[name] = handler; },
  };
  const window = { location: { reload() { reloadCount++; } }, addEventListener(name, handler) { events[name] = handler; } };
  runInNewContext(source, { window, document });
  return { window, events, documentEvents, status, error, startup,
    counts: () => ({ state, focusCount, reloadCount }) };
}

test("startup failure is focused once, hides technical diagnostics and allows scoped retry", () => {
  const h = host();
  h.events.unhandledrejection({ reason: new Error("Wasm download failed") });
  assert.deepEqual(h.counts(), { state: "failed", focusCount: 1, reloadCount: 0 });
  assert.equal(h.status.hidden, true);
  assert.equal(h.error.hidden, true);
  assert.match(h.error.textContent, /Wasm download failed/);
  h.events.error({ message: "second error" });
  assert.equal(h.counts().focusCount, 1);
  const button = { closest: () => h.startup };
  h.documentEvents.click({ target: { closest: () => button } });
  assert.equal(button.disabled, true);
  assert.equal(h.counts().reloadCount, 1);
  h.documentEvents.click({ target: { closest: () => ({ closest: () => null }) } });
  assert.equal(h.counts().reloadCount, 1);
});

test("projects without startup retain existing failure diagnostics", () => {
  const h = host(false);
  h.events.error({ target: { tagName: "SCRIPT", src: "main.js" } });
  assert.equal(h.status.hidden, false);
  assert.equal(h.error.hidden, false);
  assert.match(h.error.textContent, /Failed to load script: main.js/);
  assert.equal(h.window.__luastraFailStartup(), false);
});
