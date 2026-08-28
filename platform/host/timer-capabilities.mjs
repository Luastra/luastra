const timerIdPattern = /^[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;
const encoder = new TextEncoder();
const maximumDelayMs = 60_000;
const maximumValueBytes = 4096;
const maximumActiveTimers = 128;

function response(request, status, payload) {
  return { accepted: true, response: { version: 1, requestId: request.requestId, traceId: request.traceId, status, payload } };
}
function error(request, code, message) { return response(request, "error", { code, message }); }

export function createTimerCapabilities(environment = {}) {
  const schedule = environment.setTimeout ?? globalThis.setTimeout?.bind(globalThis);
  const unschedule = environment.clearTimeout ?? globalThis.clearTimeout?.bind(globalThis);
  if (typeof schedule !== "function" || typeof unschedule !== "function") throw new Error("timer host is unavailable");
  const active = new Map();
  const queued = [];
  let listener = null;
  let disposed = false;
  let generation = 0;

  const emit = (event) => {
    if (disposed) return;
    if (listener) listener(event);
    else queued.push(event);
  };
  const cancel = (id) => {
    const record = active.get(id);
    if (!record) return false;
    active.delete(id);
    unschedule(record.handle);
    return true;
  };

  const handle = async (request) => {
    if (disposed) return error(request, "CANCELLED", "Timer host is disposed");
    if (request.kind !== "timer.control" || !timerIdPattern.test(request.payload?.operation ?? "")) return error(request, "VALIDATION", "Invalid timer request");
    const id = request.payload.operation;
    const input = request.payload?.input;
    if (input === "cancel") {
      cancel(id);
      return response(request, "ok", "cancelled");
    }
    const match = /^start:([0-9]+):([^]*)$/.exec(input ?? "");
    const delayMs = match ? Number(match[1]) : -1;
    const value = match?.[2] ?? "";
    if (!Number.isSafeInteger(delayMs) || delayMs < 0 || delayMs > maximumDelayMs || encoder.encode(value).byteLength > maximumValueBytes) {
      return error(request, "VALIDATION", "Invalid timer start payload");
    }
    if (!active.has(id) && active.size >= maximumActiveTimers) return error(request, "FORBIDDEN", "Timer limit exceeded");
    cancel(id);
    const token = ++generation;
    const handleValue = schedule(() => {
      const record = active.get(id);
      if (!record || record.token !== token) return;
      active.delete(id);
      emit({ action: "timer", target: id, value });
    }, delayMs);
    active.set(id, { handle: handleValue, token });
    return response(request, "ok", "scheduled");
  };

  const subscribe = (next) => {
    if (typeof next !== "function") throw new Error("timer listener must be a function");
    if (listener) throw new Error("timer listener is already registered");
    listener = next;
    for (const event of queued.splice(0)) listener(event);
    return () => { if (listener === next) listener = null; };
  };
  const dispose = () => {
    if (disposed) return false;
    disposed = true;
    for (const id of [...active.keys()]) cancel(id);
    queued.length = 0;
    listener = null;
    return true;
  };

  return Object.freeze({ handle, subscribe, dispose, get activeCount() { return active.size; } });
}
