const keyPattern = /^[a-z][a-z0-9._-]{0,127}$/;
const maximumValueBytes = 4096;
const maximumLocationBytes = 1024;
const encoder = new TextEncoder();
const locationPattern = /^#\/[A-Za-z0-9%._~!$&'()*+,;=:@/?-]+$/;

function admittedAppUrl(value, allowedOrigin = "") {
  if (typeof value !== "string" || encoder.encode(value).byteLength > maximumValueBytes) return "";
  try {
    const url = new URL(value);
    if (url.username !== "" || url.password !== "") return "";
    if (url.protocol === "luastra:") return url.href;
    return (url.protocol === "http:" || url.protocol === "https:") && allowedOrigin !== "" && url.origin === allowedOrigin ? url.href : "";
  } catch {
    return "";
  }
}

function response(request, status, payload) {
  return { accepted: true, response: { version: 1, requestId: request.requestId, traceId: request.traceId, status, payload } };
}
function error(request, code, message) { return response(request, "error", { code, message }); }
function nativePlugin(name) {
  return globalThis.Capacitor?.isNativePlatform?.() === true ? (globalThis.Capacitor.Plugins?.[name] ?? null) : null;
}

export function createPlatformCapabilities(projectId, environment = {}) {
  if (!keyPattern.test(projectId.replaceAll("/", "."))) throw new Error("invalid project ID for platform capability namespace");
  const prefix = `luastra.${projectId}.`;
  const listeners = [];
  const cache = new Map();
  const isNative = Object.hasOwn(environment, "isNative") ? environment.isNative === true : globalThis.Capacitor?.isNativePlatform?.() === true;
  const storage = Object.hasOwn(environment, "storagePlugin") ? environment.storagePlugin : nativePlugin("Preferences");
  const secureCredentials = Object.hasOwn(environment, "secureCredentialsPlugin") ? environment.secureCredentialsPlugin : nativePlugin("LuastraSecureCredentials");
  const app = Object.hasOwn(environment, "appPlugin") ? environment.appPlugin : nativePlugin("App");
  const clipboard = Object.hasOwn(environment, "clipboard") ? environment.clipboard : globalThis.navigator?.clipboard;
  const locationTarget = environment.locationTarget ?? globalThis.location ?? null;
  const historyTarget = environment.historyTarget ?? globalThis.history ?? null;
  const windowTarget = environment.windowTarget ?? globalThis.window ?? null;
  const fullKey = (key) => `${prefix}${key}`;
  const historyState = (token) => ({ luastra: { version: 1, projectId, token } });
  let pendingSystemBack = null;
  let nextSystemBackId = 1;
  let suppressedHistoryHref = "";

  const admittedHistoryToken = (state) => {
    if (!state || typeof state !== "object" || Array.isArray(state) || Object.keys(state).join("\n") !== "luastra") return "";
    const value = state?.luastra;
    if (!value || typeof value !== "object" || Array.isArray(value) ||
        Object.keys(value).sort().join("\n") !== "projectId\ntoken\nversion" || value.version !== 1 ||
        value.projectId !== projectId || typeof value.token !== "string" || value.token.length === 0 ||
        encoder.encode(value.token).byteLength > maximumValueBytes) return "";
    return value.token;
  };

  const admittedLocationPayload = (input) => {
    const separator = input.indexOf(":");
    if (separator < 1 || separator > 4 || !/^[1-9][0-9]*$/.test(input.slice(0, separator))) return null;
    const length = Number(input.slice(0, separator));
    const body = input.slice(separator + 1);
    const location = body.slice(0, length);
    const token = body.slice(length);
    if (location.length !== length || !locationPattern.test(location) || encoder.encode(location).byteLength > maximumLocationBytes ||
        token.length === 0 || encoder.encode(token).byteLength > maximumValueBytes) return null;
    return { location, token };
  };

  const systemBack = async (request, operation, input) => {
    if (!/^[1-9][0-9]*$/.test(input) || !pendingSystemBack || pendingSystemBack.id !== Number(input)) {
      return error(request, "VALIDATION", "Unknown or stale system Back intent");
    }
    const pending = pendingSystemBack;
    if (operation === "system-handled") pendingSystemBack = null;
    else if (operation === "system-history" && historyTarget) {
      pendingSystemBack = null;
      historyTarget.back();
    } else if (operation === "system-exit" && typeof app?.exitApp === "function") {
      pendingSystemBack = null;
      await app.exitApp();
    } else return error(request, "FORBIDDEN", "System Back decision is unavailable in this host");
    return response(request, "ok", operation.slice("system-".length));
  };

  const handle = async (request) => {
    const key = request.payload?.operation;
    const input = request.payload?.input;
    if (typeof key !== "string" || typeof input !== "string") return error(request, "VALIDATION", "Malformed capability payload");
    if (["storage.get", "storage.set"].includes(request.kind) && !keyPattern.test(key)) return error(request, "VALIDATION", "Invalid storage key");
    if (encoder.encode(input).byteLength > maximumValueBytes) return error(request, "VALIDATION", "Storage value exceeds 4096 bytes");
    try {
      if (request.kind === "storage.get") {
        if (isNative && key === "session.token" && typeof secureCredentials?.get !== "function") throw new Error("native secure credentials unavailable");
        const value = isNative && key === "session.token"
          ? (await secureCredentials.get({ key: fullKey(key) })).value
          : storage ? (await storage.get({ key: fullKey(key) })).value : localStorage.getItem(fullKey(key));
        cache.set(key, value ?? "");
        return response(request, "ok", value ?? "");
      }
      if (request.kind === "storage.set") {
        if (isNative && key === "session.token") {
          if (input === "") {
            if (typeof secureCredentials?.remove !== "function") throw new Error("native secure credentials unavailable");
            await secureCredentials.remove({ key: fullKey(key) });
          } else {
            if (typeof secureCredentials?.set !== "function") throw new Error("native secure credentials unavailable");
            await secureCredentials.set({ key: fullKey(key), value: input });
          }
        }
        else if (storage) await storage.set({ key: fullKey(key), value: input });
        else localStorage.setItem(fullKey(key), input);
        cache.set(key, input);
        return response(request, "ok", "stored");
      }
      if (request.kind === "app.launchurl.get" && key === "launch-url") {
        const launch = app ? await app.getLaunchUrl() : { url: locationTarget?.href };
        return response(request, "ok", admittedAppUrl(launch?.url, locationTarget?.origin));
      }
      if (request.kind === "clipboard.write") {
        if (key !== "write-text") return error(request, "VALIDATION", "Invalid clipboard operation");
        if (typeof clipboard?.writeText !== "function") return error(request, "FORBIDDEN", "Clipboard capability is unavailable");
        await clipboard.writeText(input);
        return response(request, "ok", "written");
      }
      if (request.kind === "navigation.history") {
        if (!historyTarget) return error(request, "FORBIDDEN", "History capability is unavailable");
        if (key === "push" && input !== "") historyTarget.pushState(historyState(input), "");
        else if (key === "replace" && input !== "") historyTarget.replaceState(historyState(input), "");
        else if (key === "push-location" || key === "replace-location") {
          const admitted = admittedLocationPayload(input);
          if (!admitted) return error(request, "VALIDATION", "Invalid history location payload");
          historyTarget[`${key === "push-location" ? "push" : "replace"}State`](historyState(admitted.token), "", admitted.location);
        }
        else if (key === "back" && input === "") historyTarget.back();
        else if (key === "current" && input === "") return response(request, "ok", admittedHistoryToken(historyTarget.state));
        else if (key === "system-handled" || key === "system-history" || key === "system-exit") return systemBack(request, key, input);
        else return error(request, "VALIDATION", "Invalid history operation");
        return response(request, "ok", key === "back" ? "requested" : "stored");
      }
      return error(request, "FORBIDDEN", `No admitted handler for ${request.kind}`);
    } catch {
      return error(request, "INTERNAL", "Platform capability failed");
    }
  };

  const subscribeUrlOpen = async (listener) => {
    if (app) {
      listeners.push(await app.addListener("appUrlOpen", ({ url }) => {
        const admitted = admittedAppUrl(url, locationTarget?.origin);
        if (admitted !== "") listener(admitted, "native");
      }));
      return;
    }
    if (!windowTarget?.addEventListener || !windowTarget?.removeEventListener || !locationTarget) return;
    const receive = () => {
      if (suppressedHistoryHref !== "" && locationTarget.href === suppressedHistoryHref) {
        suppressedHistoryHref = "";
        return;
      }
      suppressedHistoryHref = "";
      const admitted = admittedAppUrl(locationTarget.href, locationTarget.origin);
      if (admitted !== "") listener(admitted, "browser");
    };
    windowTarget.addEventListener("hashchange", receive);
    listeners.push({ async remove() { windowTarget.removeEventListener("hashchange", receive); } });
  };
  const subscribeSystemBack = async (listener) => {
    if (!app) return;
    listeners.push(await app.addListener("backButton", ({ canGoBack }) => {
      if (pendingSystemBack) return;
      const id = nextSystemBackId++;
      pendingSystemBack = { id, canGoBack: canGoBack === true };
      listener(`${id}:${canGoBack === true ? "1" : "0"}`);
    }));
  };
  const subscribeHistory = (listener) => {
    if (!windowTarget?.addEventListener || !windowTarget?.removeEventListener) return () => {};
    const receive = (event) => {
      const token = admittedHistoryToken(event.state);
      if (token !== "") {
        suppressedHistoryHref = locationTarget?.href ?? "";
        listener(token);
      }
    };
    windowTarget.addEventListener("popstate", receive);
    return () => windowTarget.removeEventListener("popstate", receive);
  };
  const dispose = () => { pendingSystemBack = null; suppressedHistoryHref = ""; cache.clear(); for (const listener of listeners.splice(0)) listener.remove().catch(() => {}); };
  return { handle, subscribeUrlOpen, subscribeSystemBack, subscribeHistory, dispose, cached(key) { return cache.get(key) ?? ""; } };
}
