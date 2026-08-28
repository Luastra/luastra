import { validateCapabilityRequest, validateCapabilityResponse, validateRpcResponse } from "../protocol/generated/protocol.mjs?contract=1-server-call-media-command";

function response(request, payload) {
  return { accepted: true, response: { version: 1, requestId: request.requestId, traceId: request.traceId, status: "ok", payload } };
}
function error(request, code, message) {
  return response(request, { version: 1, success: false, data: null, error: { code, message }, traceId: request.traceId });
}
function retryAdmitted(request) {
  try { return new URLSearchParams(request.payload.input).get("retry") === "true"; }
  catch { return false; }
}

export function createRpcCapabilities({ fetchImpl = globalThis.fetch, endpoint = "/__luastra/rpc", online = () => globalThis.navigator?.onLine !== false, authorizationToken = () => "" } = {}) {
  if (typeof fetchImpl !== "function" || typeof endpoint !== "string" || !endpoint.startsWith("/")) throw new Error("invalid RPC transport configuration");
  const active = new Map();
  let disposed = false;
  const handle = async (request) => {
    if (disposed) return error(request, "CANCELLED", "RPC transport is disposed");
    if (!validateCapabilityRequest(request) || request.kind !== "rpc.call") return { accepted: false, reason: "INVALID_RPC_CAPABILITY_REQUEST" };
    if (!online()) return error(request, "NETWORK", "Network is unavailable");
    const controller = new AbortController();
    active.set(request.requestId, controller);
    const timeout = setTimeout(() => controller.abort("deadline"), request.deadlineMs);
    const attempts = retryAdmitted(request) ? 2 : 1;
    try {
      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          const token = authorizationToken();
          const headers = { "Content-Type": "application/json" };
          if (typeof token === "string" && token !== "") headers.Authorization = `Bearer ${token}`;
          const result = await fetchImpl(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(request),
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
          });
          if (!result.ok) {
            if (result.status >= 500 && attempt < attempts) continue;
            return error(request, result.status >= 500 ? "NETWORK" : "INTERNAL", "Server function transport failed");
          }
          const handled = await result.json();
          if (handled?.accepted !== true || !validateCapabilityResponse(handled.response) || handled.response.requestId !== request.requestId || handled.response.traceId !== request.traceId || handled.response.status !== "ok" || !validateRpcResponse(handled.response.payload, request.traceId, request.payload.operation)) {
            return error(request, "INTERNAL", "Server function returned an invalid response");
          }
          return handled;
        } catch {
          if (controller.signal.aborted) return error(request, controller.signal.reason === "deadline" ? "DEADLINE" : "CANCELLED", controller.signal.reason === "deadline" ? "Server function deadline exceeded" : "Server function cancelled");
          if (attempt === attempts) return error(request, "NETWORK", "Server function is unreachable");
        }
      }
      return error(request, "NETWORK", "Server function is unreachable");
    } finally {
      clearTimeout(timeout);
      active.delete(request.requestId);
    }
  };
  return Object.freeze({
    handle,
    cancel(requestId) {
      const controller = active.get(requestId);
      if (!controller) return false;
      controller.abort("cancelled");
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const controller of active.values()) controller.abort("cancelled");
      active.clear();
    },
    get activeRequests() { return active.size; },
  });
}
