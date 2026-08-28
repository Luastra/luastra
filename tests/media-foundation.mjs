import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { createMediaCapabilities } from "../platform/host/media-capabilities.mjs";
import { decodeMediaWire, encodeMediaWire } from "../platform/media/media-wire.mjs";
import { createMediaStateMachine } from "../platform/media/media-state-machine.mjs";
import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";
import { buildProject } from "../project/build-project.mjs";

const prototype = resolve(import.meta.dirname, "..");
const manifestPath = resolve(prototype, "examples/media-player/luastra.json");
const runtimeModulePath = resolve(prototype, "platform/artifacts/vm-wasm/luastra-vm.js");

class FakeAudio {
  constructor() {
    this.listeners = new Map(); this.src = ""; this.preload = ""; this.duration = 60; this.currentTime = 0; this.playbackRate = 1; this.ended = false;
    this.buffered = { length: 1, end: () => 20 }; this.loadCount = 0; this.playCount = 0; this.pauseCount = 0;
  }
  addEventListener(name, listener) { const values = this.listeners.get(name) ?? new Set(); values.add(listener); this.listeners.set(name, values); }
  removeEventListener(name, listener) { this.listeners.get(name)?.delete(listener); }
  emit(name) { for (const listener of this.listeners.get(name) ?? []) listener(); }
  load() { this.loadCount += 1; if (this.src !== "") this.emit("loadedmetadata"); }
  async play() { this.playCount += 1; this.emit("playing"); }
  pause() { this.pauseCount += 1; this.emit("pause"); }
  removeAttribute(name) { if (name === "src") this.src = ""; }
}

function request(operation, fields = {}) {
  return { version: 1, kind: "media.command", requestId: 1, traceId: "trace-media", deadlineMs: 3000, payload: { version: 1, operation, input: encodeMediaWire(fields), traceId: "trace-media", deadlineMs: 3000 } };
}
function queueFields() {
  return {
    count: "2", index: "0",
    "item.0.id": "focus", "item.0.source": "asset:audio/focus", "item.0.title": "Focus", "item.0.artist": "Luastra",
    "item.1.id": "rest", "item.1.source": "asset:audio/rest", "item.1.title": "Rest", "item.1.artist": "Luastra",
  };
}
function find(root, id) { return root.id === id ? root : root.children.map((child) => find(child, id)).find(Boolean) ?? null; }

test("media state machine covers queue, playback, interruption, lifecycle and failure", () => {
  const revisions = [];
  const media = createMediaStateMachine({ onState: (state) => revisions.push(state.revision) });
  media.command("queue.set", { items: [
    { id: "one", source: "asset:audio/one", title: "One", artist: "Author" },
    { id: "two", source: "asset:audio/two", title: "Two", artist: "Author" },
  ], index: 0 });
  assert.equal(media.snapshot().status, "loading");
  media.engine("loaded", { durationMs: 10_000 });
  media.command("play");
  media.engine("progress", { positionMs: 2500, bufferedMs: 8000 });
  media.engine("interruption.begin");
  assert.equal(media.snapshot().interruption, "active");
  assert.equal(media.snapshot().status, "paused");
  media.engine("interruption.end", { mayResume: true });
  assert.equal(media.snapshot().status, "playing");
  media.engine("lifecycle.background");
  assert.equal(media.snapshot().background, true);
  assert.equal(media.snapshot().status, "playing");
  media.command("queue.next");
  assert.equal(media.snapshot().item.id, "two");
  assert.throws(() => media.command("queue.next"), /boundary/);
  media.engine("error", { code: "MEDIA_DECODE", message: "Unable to decode" });
  assert.equal(media.snapshot().error.code, "MEDIA_DECODE");
  media.command("unload");
  assert.equal(media.snapshot().status, "idle");
  assert.ok(revisions.length >= 10);
  media.dispose();
  assert.throws(() => media.command("state"), /disposed/);
});

test("browser media adapter is event-driven, bounded and source-admitted", async () => {
  const audio = new FakeAudio();
  let now = 0;
  const updates = [];
  const sessionActions = new Map();
  const mediaSession = { playbackState: "none", metadata: null, setPositionState() {}, setActionHandler(name, handler) { if (handler === null) sessionActions.delete(name); else sessionActions.set(name, handler); } };
  const adapter = createMediaCapabilities({ audioFactory: () => audio, resolveSource: async (source) => `/admitted/${source.slice(6)}.wav`, mediaSession, clock: () => now });
  adapter.subscribe((wire) => updates.push(decodeMediaWire(wire)));

  const loaded = await adapter.handle(request("queue.set", queueFields()));
  assert.equal(loaded.response.status, "ok");
  assert.equal(decodeMediaWire(loaded.response.payload).status, "ready");
  assert.equal(audio.src, "/admitted/audio/focus.wav");
  const played = await adapter.handle(request("play"));
  assert.equal(decodeMediaWire(played.response.payload).status, "playing");

  audio.currentTime = 1; now = 0; audio.emit("timeupdate");
  audio.currentTime = 2; now = 100; audio.emit("timeupdate");
  audio.currentTime = 3; now = 300; audio.emit("timeupdate");
  assert.equal(updates.filter((entry) => entry.positionMs !== "0").length, 2, "progress is capped at four updates per second");
  adapter.handleLifecycle("background");
  assert.equal(adapter.snapshot().background, true);
  assert.equal(adapter.snapshot().status, "playing", "background does not force a pause");
  adapter.handleRouteChange("bluetooth");
  assert.equal(adapter.snapshot().route, "bluetooth");
  adapter.handleInterruption({ active: true });
  assert.equal(adapter.snapshot().interruption, "active");
  adapter.handleInterruption({ active: false, mayResume: true });
  await Promise.resolve();
  assert.equal(adapter.snapshot().status, "playing");
  assert.ok(sessionActions.has("play") && sessionActions.has("pause") && sessionActions.has("seekto"));

  audio.ended = true; audio.currentTime = audio.duration; audio.emit("ended");
  const replayed = await adapter.handle(request("play"));
  assert.equal(audio.currentTime, 0, "replay after ended restarts at the beginning");
  assert.equal(decodeMediaWire(replayed.response.payload).status, "playing");

  const invalid = await adapter.handle(request("queue.set", { ...queueFields(), "item.0.source": "https://example.invalid/private.mp3" }));
  assert.equal(invalid.response.status, "error");
  assert.equal(invalid.response.payload.code, "VALIDATION");
  adapter.dispose();
  assert.equal(audio.src, "");
  assert.equal(sessionActions.size, 0);
  assert.equal([...audio.listeners.values()].reduce((sum, values) => sum + values.size, 0), 0);
});

test("Capacitor media adapter preserves the host-neutral queue and state contract", async () => {
  let listener = null;
  let removed = false;
  let nativeState = { version: 1, status: "idle", positionMs: 0, durationMs: 0, bufferedMs: 0 };
  const commands = [];
  const nativePlugin = {
    async addListener(name, next) {
      assert.equal(name, "stateChange");
      listener = next;
      return { remove: async () => { removed = true; } };
    },
    async command(command) {
      commands.push(command);
      if (command.operation === "load") nativeState = { version: 1, status: "ready", positionMs: 0, durationMs: command.title === "Focus" ? 8000 : 6000, bufferedMs: 1000 };
      else if (command.operation === "play") nativeState = { ...nativeState, status: "playing" };
      else if (command.operation === "pause") nativeState = { ...nativeState, status: "paused" };
      else if (command.operation === "seek") nativeState = { ...nativeState, positionMs: command.positionMs };
      else if (command.operation === "stop") nativeState = { ...nativeState, status: "ready", positionMs: 0 };
      else if (command.operation === "unload") nativeState = { version: 1, status: "idle", positionMs: 0, durationMs: 0, bufferedMs: 0 };
      return nativeState;
    },
  };
  const updates = [];
  const adapter = createMediaCapabilities({ nativePlugin, resolveSource: async (source) => `https://localhost/assets/${source.slice(6)}.wav` });
  adapter.subscribe((wire) => updates.push(decodeMediaWire(wire)));

  let handled = await adapter.handle(request("queue.set", queueFields()));
  assert.equal(decodeMediaWire(handled.response.payload).status, "ready");
  assert.equal(commands[0].source, "https://localhost/assets/audio/focus.wav");
  handled = await adapter.handle(request("play"));
  assert.equal(decodeMediaWire(handled.response.payload).status, "playing");
  listener({ ...nativeState, positionMs: 1250, bufferedMs: 4000 });
  assert.equal(adapter.snapshot().positionMs, 1250);
  handled = await adapter.handle(request("pause"));
  assert.equal(decodeMediaWire(handled.response.payload).status, "paused");
  handled = await adapter.handle(request("queue.next"));
  assert.equal(decodeMediaWire(handled.response.payload).title, "Rest");
  assert.equal(adapter.snapshot().durationMs, 6000);
  assert.ok(updates.some((state) => state.positionMs === "1250"));
  adapter.dispose();
  await Promise.resolve();
  assert.equal(removed, true);
});

test("media reference fixture drives the public Luau API through Wasm", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-media-foundation-"));
  try {
    const built = await buildProject({ manifestPath, outputDirectory: workspace, target: "bundle" });
    const audio = new FakeAudio();
    const operations = [];
    const adapter = createMediaCapabilities({ audioFactory: () => audio, resolveSource: async (source) => `/fixture/${source.slice(6)}.wav`, mediaSession: null });
    const result = await runWasmBundle({
      bundlePath: built.bundlePath,
      runtimeModulePath,
      allowedCapabilities: ["media.command", "ui.render"],
      requireRendererTree: true,
      capabilityHandler: async (capability) => { operations.push(capability.payload.operation); return adapter.handle(capability); },
      dispatches: [
        { action: "lifecycle", target: "app", value: "launch" },
        { action: "media-play", target: "media/play", value: "" },
        { action: "media-seek", target: "media/seek", value: "" },
        { action: "media-next", target: "media/next", value: "" },
      ],
    });
    assert.deepEqual(operations, ["queue.set", "play", "seek", "queue.next"]);
    assert.equal(find(result.renderTree, "media/item").properties.text, "Rest sample");
    assert.equal(find(result.renderTree, "media/status").properties.text, "Status: ready");
    assert.equal(result.pendingRequests, 0);
    assert.equal(result.memory.growthBytes, 0);
    adapter.dispose();
  } finally { await rm(workspace, { recursive: true, force: true }); }
});
