import { decodeMediaWire, encodeMediaWire } from "../media/media-wire.mjs";
import { createMediaStateMachine } from "../media/media-state-machine.mjs";
import { createProjectAssetRegistry } from "./asset-registry.mjs";

const commandNames = new Set(["pause", "play", "queue.next", "queue.previous", "queue.set", "seek", "state", "stop", "unload"]);

function response(request, status, payload) {
  return { accepted: true, response: { version: 1, requestId: request.requestId, traceId: request.traceId, status, payload } };
}
function error(request, code, message) { return response(request, "error", { code, message }); }
function integer(value, minimum, maximum, label) {
  if (!/^(0|[1-9][0-9]*)$/.test(value ?? "")) throw new Error(`invalid ${label}`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) throw new Error(`invalid ${label}`);
  return parsed;
}
function stateFields(state) {
  return {
    revision: String(state.revision), status: state.status, itemId: state.item?.id ?? "", title: state.item?.title ?? "", artist: state.item?.artist ?? "",
    positionMs: String(state.positionMs), durationMs: String(state.durationMs), bufferedMs: String(state.bufferedMs),
    queueIndex: String(state.queueIndex), queueCount: String(state.queueCount), background: state.background ? "true" : "false",
    interruption: state.interruption, route: state.route, errorCode: state.error?.code ?? "", errorMessage: state.error?.message ?? "",
  };
}
function parseQueue(fields) {
  const count = integer(fields.count, 1, 32, "media queue count");
  const index = integer(fields.index ?? "0", 0, count - 1, "media queue index");
  const items = [];
  for (let position = 0; position < count; position += 1) {
    const prefix = `item.${position}.`;
    items.push({ id: fields[`${prefix}id`], source: fields[`${prefix}source`], title: fields[`${prefix}title`], artist: fields[`${prefix}artist`] });
  }
  const expected = new Set(["count", "index"]);
  for (let position = 0; position < count; position += 1) for (const name of ["id", "source", "title", "artist"]) expected.add(`item.${position}.${name}`);
  if (Object.keys(fields).some((name) => !expected.has(name))) throw new Error("unknown media queue field");
  return { items, index };
}

async function browserAssetResolver(source) {
  const content = /^content:([A-Za-z0-9_-]{32,256})$/.exec(source);
  if (content) return new URL(`/__luastra/content/${content[1]}`, globalThis.location?.origin ?? import.meta.url).href;
  const asset = await createProjectAssetRegistry().resolve(source, "audio");
  return asset.url;
}

function createBrowserMediaCapabilities({
  audioFactory = () => new Audio(),
  resolveSource = browserAssetResolver,
  mediaSession = globalThis.navigator?.mediaSession ?? null,
  clock = () => performance.now(),
} = {}) {
  if (typeof audioFactory !== "function" || typeof resolveSource !== "function" || typeof clock !== "function") throw new Error("invalid media adapter dependencies");
  const audio = audioFactory();
  const listeners = new Set();
  let handlingCommand = false;
  let lastProgressAt = Number.NEGATIVE_INFINITY;
  let disposed = false;
  const mediaSessionActionNames = [];
  const machine = createMediaStateMachine({ onState(state) {
    updateSystemSession(state);
    if (!handlingCommand) for (const listener of listeners) listener(encodeMediaWire(stateFields(state)));
  } });

  const updateSystemSession = (state) => {
    if (!mediaSession) return;
    if (state.item && typeof globalThis.MediaMetadata === "function") mediaSession.metadata = new MediaMetadata({ title: state.item.title, artist: state.item.artist });
    try { mediaSession.playbackState = state.status === "playing" ? "playing" : state.item ? "paused" : "none"; } catch {}
    if (state.durationMs > 0 && state.positionMs <= state.durationMs) {
      try { mediaSession.setPositionState({ duration: state.durationMs / 1000, playbackRate: audio.playbackRate || 1, position: state.positionMs / 1000 }); } catch {}
    }
  };

  const engine = (name, input) => { try { machine.engine(name, input); } catch {} };
  const eventHandlers = new Map([
    ["loadedmetadata", () => Number.isFinite(audio.duration) && audio.duration > 0 && engine("loaded", { durationMs: Math.round(audio.duration * 1000) })],
    ["playing", () => engine("playing")],
    ["pause", () => { if (!audio.ended) engine("paused"); }],
    ["waiting", () => engine("buffering")],
    ["ended", () => engine("ended")],
    ["error", () => engine("error", { code: "MEDIA_PLAYBACK", message: "Media playback failed" })],
    ["timeupdate", () => {
      const now = clock();
      if (now - lastProgressAt < 250) return;
      lastProgressAt = now;
      let bufferedMs = Math.round((audio.currentTime || 0) * 1000);
      if (audio.buffered?.length > 0) bufferedMs = Math.round(audio.buffered.end(audio.buffered.length - 1) * 1000);
      engine("progress", { positionMs: Math.round((audio.currentTime || 0) * 1000), bufferedMs });
    }],
  ]);
  for (const [name, listener] of eventHandlers) audio.addEventListener(name, listener);

  const applySelectedSource = async () => {
    const selected = machine.snapshot().item;
    if (!selected) return;
    if (!/^(?:asset:[a-z][a-z0-9_-]*(?:\/[a-z][a-z0-9_-]*)*|content:[A-Za-z0-9_-]{32,256})$/.test(selected.source)) throw new Error("media source must be admitted");
    audio.src = await resolveSource(selected.source);
    audio.preload = "metadata";
    audio.load();
    if (mediaSession && typeof globalThis.MediaMetadata === "function") mediaSession.metadata = new MediaMetadata({ title: selected.title, artist: selected.artist });
  };

  const execute = async (operation, fields) => {
    if (operation === "queue.set") {
      machine.command(operation, parseQueue(fields));
      await applySelectedSource();
    } else if (operation === "play") {
      machine.command(operation);
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
    } else if (operation === "pause") {
      machine.command(operation);
      audio.pause();
    } else if (operation === "seek") {
      machine.command(operation, { positionMs: integer(fields.positionMs, 0, 24 * 60 * 60 * 1000, "seek position") });
      audio.currentTime = machine.snapshot().positionMs / 1000;
    } else if (operation === "queue.next" || operation === "queue.previous") {
      machine.command(operation);
      await applySelectedSource();
    } else if (operation === "stop") {
      machine.command(operation);
      audio.pause();
      audio.currentTime = 0;
    } else if (operation === "unload") {
      machine.command(operation);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    } else machine.command("state");
    return encodeMediaWire(stateFields(machine.snapshot()));
  };

  const handle = async (request) => {
    if (disposed) return error(request, "CANCELLED", "Media adapter is disposed");
    if (request.kind !== "media.command" || !commandNames.has(request.payload?.operation) || typeof request.payload?.input !== "string") return error(request, "FORBIDDEN", "Media command is not admitted");
    try {
      const fields = decodeMediaWire(request.payload.input);
      handlingCommand = true;
      const payload = await execute(request.payload.operation, fields);
      return response(request, "ok", payload);
    } catch (cause) {
      const blocked = cause?.name === "NotAllowedError";
      return error(request, blocked ? "FORBIDDEN" : "VALIDATION", blocked ? "Playback requires user interaction" : "Media command was rejected");
    } finally { handlingCommand = false; }
  };

  const handleLifecycle = (value) => {
    if (value === "background") machine.engine("lifecycle.background");
    else if (value === "foreground") machine.engine("lifecycle.foreground");
  };
  const handleRouteChange = (route) => machine.engine("route.change", { route });
  const handleInterruption = ({ active, mayResume = false }) => {
    if (active) { machine.engine("interruption.begin"); audio.pause(); }
    else {
      const state = machine.engine("interruption.end", { mayResume });
      if (state.status === "playing") audio.play().catch(() => machine.engine("error", { code: "MEDIA_RESUME", message: "Media could not resume" }));
    }
  };
  const subscribe = (listener) => { if (typeof listener !== "function") throw new Error("media listener must be a function"); listeners.add(listener); return () => listeners.delete(listener); };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const [name, listener] of eventHandlers) audio.removeEventListener(name, listener);
    listeners.clear();
    audio.pause();
    audio.removeAttribute("src");
    if (mediaSession) {
      for (const name of mediaSessionActionNames) { try { mediaSession.setActionHandler(name, null); } catch {} }
      try { mediaSession.metadata = null; mediaSession.playbackState = "none"; } catch {}
    }
    machine.dispose();
  };

  if (mediaSession) {
    const actions = {
      play: () => execute("play", {}).catch(() => {}),
      pause: () => execute("pause", {}).catch(() => {}),
      seekto: ({ seekTime }) => { if (Number.isFinite(seekTime)) execute("seek", { positionMs: String(Math.round(seekTime * 1000)) }).catch(() => {}); },
      nexttrack: () => execute("queue.next", {}).catch(() => {}),
      previoustrack: () => execute("queue.previous", {}).catch(() => {}),
    };
    for (const [name, listener] of Object.entries(actions)) { try { mediaSession.setActionHandler(name, listener); mediaSessionActionNames.push(name); } catch {} }
  }
  return Object.freeze({ handle, handleLifecycle, handleInterruption, handleRouteChange, subscribe, snapshot: machine.snapshot, dispose });
}

function createNativeMediaCapabilities({ nativePlugin, resolveSource = browserAssetResolver }) {
  if (!nativePlugin || typeof nativePlugin.command !== "function" || typeof nativePlugin.addListener !== "function") throw new Error("invalid native media plugin");
  const listeners = new Set();
  let handlingCommand = false;
  let disposed = false;
  let listenerHandle = null;
  const machine = createMediaStateMachine({ onState(state) {
    if (!handlingCommand) for (const listener of listeners) listener(encodeMediaWire(stateFields(state)));
  } });

  const applyNativeState = (nativeState) => {
    if (!nativeState || nativeState.version !== 1 || disposed) return;
    const durationMs = Math.max(0, Math.round(Number(nativeState.durationMs) || 0));
    const positionMs = Math.max(0, Math.round(Number(nativeState.positionMs) || 0));
    const bufferedMs = Math.max(positionMs, Math.round(Number(nativeState.bufferedMs) || 0));
    let current = machine.snapshot();
    if (durationMs > 0 && current.durationMs !== durationMs) current = machine.engine("loaded", { durationMs });
    if (current.item && durationMs > 0 && (current.positionMs !== positionMs || current.bufferedMs !== bufferedMs)) {
      current = machine.engine("progress", { positionMs, bufferedMs });
    }
    if (nativeState.status === "playing" && current.status !== "playing") machine.engine("playing");
    else if (nativeState.status === "paused" && current.status !== "paused") machine.engine("paused");
    else if (nativeState.status === "buffering" && current.status !== "buffering") machine.engine("buffering");
    else if (nativeState.status === "ended" && current.status !== "ended") machine.engine("ended");
    else if (nativeState.status === "error") machine.engine("error", {
      code: typeof nativeState.errorCode === "string" && nativeState.errorCode ? nativeState.errorCode : "MEDIA_NATIVE",
      message: typeof nativeState.errorMessage === "string" && nativeState.errorMessage ? nativeState.errorMessage : "Native media playback failed",
    });
  };

  const nativeListener = Promise.resolve(nativePlugin.addListener("stateChange", applyNativeState)).then((handle) => {
    listenerHandle = handle;
    if (disposed) return handle?.remove?.();
    return undefined;
  });

  const loadSelected = async () => {
    const selected = machine.snapshot().item;
    if (!selected) return;
    const source = await resolveSource(selected.source);
    const nativeState = await nativePlugin.command({ operation: "load", source, title: selected.title, artist: selected.artist });
    applyNativeState(nativeState);
  };

  const execute = async (operation, fields) => {
    if (operation === "queue.set") {
      machine.command(operation, parseQueue(fields));
      await loadSelected();
    } else if (operation === "play") {
      machine.command(operation);
      applyNativeState(await nativePlugin.command({ operation: "play" }));
    } else if (operation === "pause") {
      machine.command(operation);
      applyNativeState(await nativePlugin.command({ operation: "pause" }));
    } else if (operation === "seek") {
      const positionMs = integer(fields.positionMs, 0, 24 * 60 * 60 * 1000, "seek position");
      machine.command(operation, { positionMs });
      applyNativeState(await nativePlugin.command({ operation: "seek", positionMs }));
    } else if (operation === "queue.next" || operation === "queue.previous") {
      machine.command(operation);
      await loadSelected();
    } else if (operation === "stop") {
      machine.command(operation);
      applyNativeState(await nativePlugin.command({ operation: "stop" }));
    } else if (operation === "unload") {
      machine.command(operation);
      await nativePlugin.command({ operation: "unload" });
    } else applyNativeState(await nativePlugin.command({ operation: "state" }));
    return encodeMediaWire(stateFields(machine.snapshot()));
  };

  const handle = async (request) => {
    if (disposed) return error(request, "CANCELLED", "Media adapter is disposed");
    if (request.kind !== "media.command" || !commandNames.has(request.payload?.operation) || typeof request.payload?.input !== "string") return error(request, "FORBIDDEN", "Media command is not admitted");
    try {
      handlingCommand = true;
      const payload = await execute(request.payload.operation, decodeMediaWire(request.payload.input));
      return response(request, "ok", payload);
    } catch {
      return error(request, "VALIDATION", "Native media command was rejected");
    } finally { handlingCommand = false; }
  };

  const handleLifecycle = (value) => {
    if (value === "background") machine.engine("lifecycle.background");
    else if (value === "foreground") machine.engine("lifecycle.foreground");
  };
  const subscribe = (listener) => { if (typeof listener !== "function") throw new Error("media listener must be a function"); listeners.add(listener); return () => listeners.delete(listener); };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    listeners.clear();
    machine.dispose();
    if (listenerHandle?.remove) listenerHandle.remove();
    else nativeListener.catch(() => {});
  };
  return Object.freeze({ handle, handleLifecycle, handleInterruption() {}, handleRouteChange() {}, subscribe, snapshot: machine.snapshot, dispose });
}

export function createMediaCapabilities(options = {}) {
  const capacitor = globalThis.Capacitor;
  const nativePlugin = options.nativePlugin ?? (capacitor?.isNativePlatform?.() === true ? capacitor?.Plugins?.LuastraMedia : null);
  return nativePlugin ? createNativeMediaCapabilities({ nativePlugin, resolveSource: options.resolveSource }) : createBrowserMediaCapabilities(options);
}
