import assert from "node:assert/strict";
import test from "node:test";

import { createPlatformCapabilities } from "../platform/host/platform-capabilities.mjs";

function request(requestId, operation, input = "") {
  return { version: 1, kind: "navigation.history", requestId, traceId: `history-${requestId}`, deadlineMs: 1000, payload: { operation, input } };
}

function platformRequest(requestId, kind, operation, input = "") {
  return { version: 1, kind, requestId, traceId: `platform-${requestId}`, deadlineMs: 1000, payload: { operation, input } };
}

function locationPayload(location, token) { return `${location.length}:${location}${token}`; }

function fakeEnvironment() {
  const listeners = new Map([["popstate", new Set()], ["hashchange", new Set()]]);
  const calls = [];
  return {
    calls,
    historyTarget: {
      state: null,
      pushState(state, title, location) { this.state = state; calls.push({ operation: "push", state, title, ...(location === undefined ? {} : { location }) }); },
      replaceState(state, title, location) { this.state = state; calls.push({ operation: "replace", state, title, ...(location === undefined ? {} : { location }) }); },
      back() { calls.push({ operation: "back" }); },
    },
    windowTarget: {
      addEventListener(name, listener) { listeners.get(name)?.add(listener); },
      removeEventListener(name, listener) { listeners.get(name)?.delete(listener); },
      emit(state) { for (const listener of listeners.get("popstate")) listener({ state }); },
      emitHash() { for (const listener of listeners.get("hashchange")) listener({}); },
    },
  };
}

test("history capability binds opaque state to the project and rejects foreign popstate", async () => {
  const environment = fakeEnvironment();
  const platform = createPlatformCapabilities("dev.luastra.catalogue", environment);
  const received = [];
  const unsubscribe = platform.subscribeHistory((token) => received.push(token));
  try {
    assert.equal((await platform.handle(request(1, "replace", "state-0"))).response.status, "ok");
    assert.equal((await platform.handle(request(2, "push", "state-1"))).response.status, "ok");
    assert.equal((await platform.handle(request(3, "back"))).response.status, "ok");
    assert.equal((await platform.handle(request(4, "current"))).response.payload, "state-1");
    assert.deepEqual(environment.calls, [
      { operation: "replace", state: { luastra: { version: 1, projectId: "dev.luastra.catalogue", token: "state-0" } }, title: "" },
      { operation: "push", state: { luastra: { version: 1, projectId: "dev.luastra.catalogue", token: "state-1" } }, title: "" },
      { operation: "back" },
    ]);

    environment.windowTarget.emit(environment.calls[0].state);
    environment.windowTarget.emit({ luastra: { version: 1, projectId: "dev.luastra.foreign", token: "foreign" } });
    environment.windowTarget.emit({ luastra: { version: 1, projectId: "dev.luastra.catalogue", token: "", extra: true } });
    environment.windowTarget.emit({ luastra: { version: 1, projectId: "dev.luastra.catalogue", token: "state" }, extra: true });
    environment.windowTarget.emit(null);
    assert.deepEqual(received, ["state-0"]);

    assert.equal((await platform.handle(request(5, "push", ""))).response.payload.code, "VALIDATION");
    assert.equal((await platform.handle(request(6, "unknown", "state"))).response.payload.code, "VALIDATION");
    assert.equal((await platform.handle(request(7, "back", "unexpected"))).response.payload.code, "VALIDATION");
  } finally {
    unsubscribe();
    platform.dispose();
  }
  environment.windowTarget.emit(environment.calls[1].state);
  assert.deepEqual(received, ["state-0"]);
});

test("history capability fails closed when the host surface is unavailable", async () => {
  const platform = createPlatformCapabilities("dev.luastra.catalogue", { historyTarget: null, windowTarget: null });
  try {
    const result = await platform.handle(request(1, "push", "state"));
    assert.equal(result.response.status, "error");
    assert.equal(result.response.payload.code, "FORBIDDEN");
  } finally { platform.dispose(); }
});

test("history location operations bind a safe fragment to the same opaque project state", async () => {
  const environment = fakeEnvironment();
  const platform = createPlatformCapabilities("dev.luastra.catalogue", environment);
  try {
    assert.equal((await platform.handle(request(1, "replace-location", locationPayload("#/catalogue", "state-0")))).response.status, "ok");
    assert.equal((await platform.handle(request(2, "push-location", locationPayload("#/detail/focus", "state-1")))).response.status, "ok");
    assert.deepEqual(environment.calls, [
      { operation: "replace", state: { luastra: { version: 1, projectId: "dev.luastra.catalogue", token: "state-0" } }, title: "", location: "#/catalogue" },
      { operation: "push", state: { luastra: { version: 1, projectId: "dev.luastra.catalogue", token: "state-1" } }, title: "", location: "#/detail/focus" },
    ]);
    for (const [id, input] of [
      [3, "0:state"],
      [4, locationPayload("https://evil.example/", "state")],
      [5, locationPayload("#/detail/💥", "state")],
      [6, "9999:#/shortstate"],
      [7, locationPayload("#/detail/focus", "")],
    ]) assert.equal((await platform.handle(request(id, "push-location", input))).response.payload.code, "VALIDATION");
  } finally { platform.dispose(); }
});

test("web launch URL admits only same-origin HTTP(S) locations without credentials", async () => {
  const locationTarget = { href: "https://luastra.test/#/detail/focus", origin: "https://luastra.test" };
  const platform = createPlatformCapabilities("dev.luastra.catalogue", { appPlugin: null, locationTarget });
  try {
    assert.equal((await platform.handle(platformRequest(1, "app.launchurl.get", "launch-url"))).response.payload, locationTarget.href);
    locationTarget.href = "https://user:secret@luastra.test/#/detail/focus";
    assert.equal((await platform.handle(platformRequest(2, "app.launchurl.get", "launch-url"))).response.payload, "");
    locationTarget.href = "javascript:alert(1)";
    assert.equal((await platform.handle(platformRequest(3, "app.launchurl.get", "launch-url"))).response.payload, "");
  } finally { platform.dispose(); }
});

test("browser hash admission ignores the hashchange paired with an owned popstate", async () => {
  const environment = fakeEnvironment();
  environment.appPlugin = null;
  environment.locationTarget = { href: "https://luastra.test/#/catalogue", origin: "https://luastra.test" };
  const platform = createPlatformCapabilities("dev.luastra.catalogue", environment);
  const locations = [];
  const states = [];
  await platform.subscribeUrlOpen((url, source) => locations.push({ url, source }));
  const unsubscribeHistory = platform.subscribeHistory((token) => states.push(token));
  try {
    environment.locationTarget.href = "https://luastra.test/#/detail/focus";
    environment.windowTarget.emitHash();
    assert.deepEqual(locations, [{ url: environment.locationTarget.href, source: "browser" }]);

    const owned = { luastra: { version: 1, projectId: "dev.luastra.catalogue", token: "state-0" } };
    environment.locationTarget.href = "https://luastra.test/#/catalogue";
    environment.windowTarget.emit(owned);
    environment.windowTarget.emitHash();
    assert.deepEqual(states, ["state-0"]);
    assert.equal(locations.length, 1, "owned popstate was delivered again as an external URL");
  } finally {
    unsubscribeHistory();
    platform.dispose();
  }
  environment.windowTarget.emitHash();
  assert.equal(locations.length, 1);
});

test("Android system Back requires one fresh intent and honors the Luau decision", async () => {
  const environment = fakeEnvironment();
  let backListener;
  let exits = 0;
  environment.appPlugin = {
    async addListener(name, listener) {
      assert.equal(name, "backButton");
      backListener = listener;
      return { async remove() { backListener = undefined; } };
    },
    async exitApp() { exits += 1; },
  };
  const platform = createPlatformCapabilities("dev.luastra.catalogue", environment);
  const intents = [];
  await platform.subscribeSystemBack((intent) => intents.push(intent));
  try {
    backListener({ canGoBack: true });
    backListener({ canGoBack: false });
    assert.deepEqual(intents, ["1:1"], "a second hardware event entered while the first intent was pending");
    assert.equal((await platform.handle(request(1, "system-history", "1"))).response.status, "ok");
    assert.equal(environment.calls.at(-1).operation, "back");
    assert.equal((await platform.handle(request(2, "system-history", "1"))).response.payload.code, "VALIDATION");

    backListener({ canGoBack: false });
    assert.deepEqual(intents, ["1:1", "2:0"]);
    assert.equal((await platform.handle(request(3, "system-handled", "2"))).response.payload, "handled");
    assert.equal(exits, 0);

    backListener({ canGoBack: false });
    assert.equal((await platform.handle(request(4, "system-exit", "3"))).response.payload, "exit");
    assert.equal(exits, 1);
  } finally { platform.dispose(); }
  assert.equal(backListener, undefined);
});
