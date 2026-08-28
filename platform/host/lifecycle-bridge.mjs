function fail(message) { throw new Error(message); }

export function createSerializedEventQueue({ dispatch, onError }) {
  if (typeof dispatch !== "function" || typeof onError !== "function") fail("event queue callbacks are invalid");
  let pending = Promise.resolve();
  let disposed = false;
  let nextIntentId = 1;
  const pendingKeys = new Set();

  const enqueue = (event, { dedupeKey = null } = {}) => {
    if (disposed) return Promise.resolve(false);
    if (!event || typeof event !== "object" || Array.isArray(event) ||
        typeof event.action !== "string" || typeof event.target !== "string" || typeof event.value !== "string") {
      return Promise.reject(new Error("host event is invalid"));
    }
    const key = dedupeKey === null ? null : String(dedupeKey);
    if (key !== null && pendingKeys.has(key)) return pending.then(() => false);
    if (key !== null) pendingKeys.add(key);
    const admitted = Object.freeze({ action: event.action, target: event.target, value: event.value, intentId: nextIntentId++ });
    let dispatched = false;
    pending = pending.then(async () => {
      if (disposed) return;
      dispatched = true;
      await dispatch(admitted);
    }).catch(onError).finally(() => { if (key !== null) pendingKeys.delete(key); });
    return pending.then(() => dispatched);
  };

  return Object.freeze({
    enqueue,
    settled() { return pending; },
    dispose() { disposed = true; pendingKeys.clear(); },
    get disposed() { return disposed; },
  });
}

export function createLifecycleBridge({ windowTarget, documentTarget, navigatorState, appPlugin = null, dispatch, onError, eventQueue = null }) {
  if (!windowTarget?.addEventListener || !windowTarget?.removeEventListener) fail("lifecycle window target is invalid");
  if (!appPlugin && (!documentTarget?.addEventListener || !documentTarget?.removeEventListener)) fail("lifecycle document target is invalid");
  if (typeof dispatch !== "function" || typeof onError !== "function") fail("lifecycle callbacks are invalid");
  if (eventQueue && (typeof eventQueue.enqueue !== "function" || typeof eventQueue.settled !== "function")) fail("lifecycle event queue is invalid");
  const listeners = [];
  const nativeListeners = [];
  let started = false;
  let disposed = false;
  const ownsQueue = eventQueue === null;
  const queue = eventQueue ?? createSerializedEventQueue({ dispatch, onError });

  const enqueue = (value) => {
    if (disposed) return queue.settled();
    return queue.enqueue({ action: "lifecycle", target: "app", value }, { dedupeKey: `lifecycle:${value}` });
  };
  const listen = (target, event, value) => {
    const listener = () => { enqueue(typeof value === "function" ? value() : value); };
    target.addEventListener(event, listener);
    listeners.push([target, event, listener]);
  };
  const visibility = () => documentTarget.visibilityState === "hidden" ? "background" : "foreground";
  const connectivity = () => navigatorState?.onLine === false ? "offline" : "online";

  return Object.freeze({
    async start() {
      if (disposed) fail("lifecycle bridge is disposed");
      if (started) return queue.settled();
      started = true;
      if (appPlugin) {
        const state = typeof appPlugin.getState === "function" ? await appPlugin.getState() : { isActive: true };
        nativeListeners.push(await appPlugin.addListener("appStateChange", ({ isActive }) => enqueue(isActive === true ? "foreground" : "background")));
        await enqueue("launch");
        await enqueue(state?.isActive === false ? "background" : "foreground");
      } else {
        listen(documentTarget, "visibilitychange", visibility);
        await enqueue("launch");
        await enqueue(visibility());
      }
      listen(windowTarget, "online", "online");
      listen(windowTarget, "offline", "offline");
      await enqueue(connectivity());
    },
    settled() { return queue.settled(); },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const [target, event, listener] of listeners.splice(0)) target.removeEventListener(event, listener);
      for (const listener of nativeListeners.splice(0)) listener.remove().catch(onError);
      if (ownsQueue) queue.dispose();
    },
    get disposed() { return disposed; },
  });
}
