import assert from "node:assert/strict";
import test from "node:test";
import { createPlatformCapabilities } from "../platform/host/platform-capabilities.mjs";
import { createLifecycleBridge } from "../platform/host/lifecycle-bridge.mjs";

const request = (kind, operation, input = "") => ({
  version: 1, requestId: `${kind}-${operation}`, traceId: "native-contract", kind,
  payload: { operation, input },
});

test("native session token uses only secure credentials and removes empty values", async () => {
  const calls = [];
  const secureCredentialsPlugin = {
    async get(options) { calls.push(["get", options]); return { value: "persisted" }; },
    async set(options) { calls.push(["set", options]); },
    async remove(options) { calls.push(["remove", options]); },
  };
  const storagePlugin = { async get() { assert.fail("Preferences must not read session.token"); }, async set() { assert.fail("Preferences must not write session.token"); } };
  const capabilities = createPlatformCapabilities("reference", { isNative: true, secureCredentialsPlugin, storagePlugin });
  assert.equal((await capabilities.handle(request("storage.get", "session.token"))).response.payload, "persisted");
  await capabilities.handle(request("storage.set", "session.token", "bearer"));
  await capabilities.handle(request("storage.set", "session.token", ""));
  assert.deepEqual(calls, [
    ["get", { key: "luastra.reference.session.token" }],
    ["set", { key: "luastra.reference.session.token", value: "bearer" }],
    ["remove", { key: "luastra.reference.session.token" }],
  ]);
});

test("native session token fails closed without secure plugin", async () => {
  const capabilities = createPlatformCapabilities("reference", { isNative: true, secureCredentialsPlugin: null, storagePlugin: null });
  const result = await capabilities.handle(request("storage.get", "session.token"));
  assert.equal(result.response.status, "error");
  assert.equal(result.response.payload.code, "INTERNAL");
});

test("native app state events drive lifecycle without document visibility", async () => {
  const windowListeners = new Map(), events = [];
  let appStateListener;
  const windowTarget = {
    addEventListener(name, listener) { windowListeners.set(name, listener); },
    removeEventListener(name) { windowListeners.delete(name); },
  };
  const appPlugin = {
    async getState() { return { isActive: true }; },
    async addListener(name, listener) { assert.equal(name, "appStateChange"); appStateListener = listener; return { async remove() { appStateListener = null; } }; },
  };
  const bridge = createLifecycleBridge({ windowTarget, documentTarget: null, navigatorState: { onLine: true }, appPlugin,
    async dispatch(event) { events.push(event.value); }, onError(error) { throw error; } });
  await bridge.start();
  appStateListener({ isActive: false });
  appStateListener({ isActive: true });
  await bridge.settled();
  assert.deepEqual(events, ["launch", "foreground", "online", "background", "foreground"]);
  bridge.dispose();
});
