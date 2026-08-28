const statuses = new Set(["idle", "loading", "ready", "playing", "paused", "buffering", "ended", "error"]);
const maximumQueueItems = 32;
const maximumDurationMs = 24 * 60 * 60 * 1000;

function fail(message) { throw new Error(message); }
function integer(value, minimum, maximum, label) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) fail(`invalid ${label}`);
  return value;
}
function text(value, maximum, label) {
  if (typeof value !== "string" || value.length === 0 || new TextEncoder().encode(value).byteLength > maximum) fail(`invalid ${label}`);
  return value;
}
function item(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join("\n") !== ["artist", "id", "source", "title"].join("\n")) fail("invalid media item shape");
  return Object.freeze({
    id: text(value.id, 128, "media item id"),
    source: text(value.source, 1024, "media source"),
    title: text(value.title, 256, "media title"),
    artist: text(value.artist, 256, "media artist"),
  });
}

function initialState() {
  return Object.freeze({
    revision: 0, status: "idle", item: null, positionMs: 0, durationMs: 0, bufferedMs: 0,
    queueIndex: -1, queueCount: 0, background: false, interruption: "none", route: "default", error: null,
  });
}

export function createMediaStateMachine({ onState = () => {} } = {}) {
  if (typeof onState !== "function") fail("media state listener must be a function");
  let state = initialState();
  let queue = [];
  let resumeAfterInterruption = false;
  let disposed = false;

  const publish = (patch) => {
    if (disposed) return state;
    const next = { ...state, ...patch, revision: state.revision + 1 };
    if (!statuses.has(next.status)) fail("invalid media status");
    next.positionMs = integer(Math.round(next.positionMs), 0, maximumDurationMs, "media position");
    next.durationMs = integer(Math.round(next.durationMs), 0, maximumDurationMs, "media duration");
    next.bufferedMs = integer(Math.round(next.bufferedMs), 0, maximumDurationMs, "media buffered position");
    if (next.durationMs > 0) {
      next.positionMs = Math.min(next.positionMs, next.durationMs);
      next.bufferedMs = Math.min(Math.max(next.bufferedMs, next.positionMs), next.durationMs);
    }
    state = Object.freeze(next);
    onState(state);
    return state;
  };

  const select = (index, status = "loading") => {
    if (queue.length === 0) return publish({ ...initialState(), revision: state.revision, status: "idle" });
    integer(index, 0, queue.length - 1, "queue index");
    return publish({ status, item: queue[index], positionMs: 0, durationMs: 0, bufferedMs: 0, queueIndex: index, queueCount: queue.length, interruption: "none", error: null });
  };

  const command = (name, input = {}) => {
    if (disposed) fail("media state machine is disposed");
    if (name === "queue.set") {
      if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > maximumQueueItems) fail("media queue must contain 1 to 32 items");
      queue = input.items.map(item);
      return select(input.index ?? 0);
    }
    if (name === "play") {
      if (!state.item || !new Set(["ready", "paused", "ended"]).has(state.status)) fail("media cannot play from current state");
      return publish({ status: "playing", positionMs: state.status === "ended" ? 0 : state.positionMs, error: null });
    }
    if (name === "pause") {
      if (!new Set(["playing", "buffering"]).has(state.status)) fail("media cannot pause from current state");
      return publish({ status: "paused" });
    }
    if (name === "seek") {
      if (!state.item || state.durationMs <= 0) fail("media duration is unavailable");
      return publish({ positionMs: integer(input.positionMs, 0, state.durationMs, "seek position") });
    }
    if (name === "queue.next" || name === "queue.previous") {
      if (queue.length === 0) fail("media queue is empty");
      const next = state.queueIndex + (name === "queue.next" ? 1 : -1);
      if (next < 0 || next >= queue.length) fail("media queue boundary reached");
      return select(next);
    }
    if (name === "stop") {
      if (!state.item) return state;
      return publish({ status: "ready", positionMs: 0, bufferedMs: 0, interruption: "none" });
    }
    if (name === "unload") {
      queue = [];
      return publish({ ...initialState(), revision: state.revision });
    }
    if (name === "state") return state;
    fail(`unsupported media command: ${name}`);
  };

  const engine = (name, input = {}) => {
    if (disposed) return state;
    if (name === "loaded") return publish({ status: "ready", durationMs: integer(input.durationMs, 1, maximumDurationMs, "loaded duration"), bufferedMs: 0, error: null });
    if (name === "playing") return publish({ status: "playing", error: null });
    if (name === "paused" && state.status !== "ended") return publish({ status: "paused" });
    if (name === "buffering") return publish({ status: "buffering" });
    if (name === "progress") return publish({ positionMs: integer(input.positionMs, 0, maximumDurationMs, "progress position"), bufferedMs: integer(input.bufferedMs ?? state.bufferedMs, 0, maximumDurationMs, "buffered position") });
    if (name === "ended") return publish({ status: "ended", positionMs: state.durationMs });
    if (name === "error") return publish({ status: "error", error: Object.freeze({ code: text(input.code, 64, "media error code"), message: text(input.message, 512, "media error message") }) });
    if (name === "interruption.begin") {
      resumeAfterInterruption = state.status === "playing";
      return publish({ status: resumeAfterInterruption ? "paused" : state.status, interruption: "active" });
    }
    if (name === "interruption.end") {
      const shouldResume = resumeAfterInterruption && input.mayResume === true;
      resumeAfterInterruption = false;
      return publish({ status: shouldResume ? "playing" : state.status, interruption: "none" });
    }
    if (name === "route.change") return publish({ route: text(input.route, 64, "media route") });
    if (name === "lifecycle.background") return publish({ background: true });
    if (name === "lifecycle.foreground") return publish({ background: false });
    fail(`unsupported media engine event: ${name}`);
  };

  const dispose = () => { if (!disposed) { disposed = true; queue = []; state = initialState(); } };
  return Object.freeze({ command, engine, snapshot: () => state, dispose, limits: Object.freeze({ maximumQueueItems, maximumDurationMs }) });
}
