import {
  Protocol,
  validateCapabilityRequest,
  validateCapabilityResponse,
} from "./generated/protocol.mjs";

export class RequestLedger {
  #disposed = false;
  #pending = new Map();

  get size() {
    return this.#pending.size;
  }

  begin(request, nowMs) {
    if (this.#disposed) return { accepted: false, reason: "DISPOSED" };
    if (!validateCapabilityRequest(request)) return { accepted: false, reason: "INVALID_REQUEST" };
    if (!Number.isFinite(nowMs)) return { accepted: false, reason: "INVALID_CLOCK" };
    if (this.#pending.has(request.requestId)) return { accepted: false, reason: "DUPLICATE_ID" };
    if (this.#pending.size >= Protocol.limits.inFlightRequests) {
      return { accepted: false, reason: "IN_FLIGHT_LIMIT" };
    }
    this.#pending.set(request.requestId, {
      traceId: request.traceId,
      deadlineAt: nowMs + request.deadlineMs,
    });
    return { accepted: true };
  }

  settle(response, nowMs) {
    if (this.#disposed) return { accepted: false, reason: "DISPOSED" };
    const pending = this.#pending.get(response?.requestId);
    if (!pending) return { accepted: false, reason: "STALE_OR_UNKNOWN" };
    if (response.traceId !== pending.traceId) return { accepted: false, reason: "TRACE_MISMATCH" };
    if (!Number.isFinite(nowMs)) return { accepted: false, reason: "INVALID_CLOCK" };
    if (nowMs >= pending.deadlineAt) {
      this.#pending.delete(response.requestId);
      return { accepted: false, reason: "DEADLINE" };
    }
    if (!validateCapabilityResponse(response)) return { accepted: false, reason: "INVALID_RESPONSE" };
    this.#pending.delete(response.requestId);
    return { accepted: true, status: response.status, payload: response.payload };
  }

  cancel(requestId, traceId) {
    if (this.#disposed) return { accepted: false, reason: "DISPOSED" };
    const pending = this.#pending.get(requestId);
    if (!pending) return { accepted: false, reason: "STALE_OR_UNKNOWN" };
    if (traceId !== pending.traceId) return { accepted: false, reason: "TRACE_MISMATCH" };
    this.#pending.delete(requestId);
    return { accepted: true, status: "cancelled" };
  }

  expire(nowMs) {
    if (this.#disposed || !Number.isFinite(nowMs)) return [];
    const expired = [];
    for (const [requestId, pending] of this.#pending) {
      if (nowMs >= pending.deadlineAt) {
        this.#pending.delete(requestId);
        expired.push({ requestId, traceId: pending.traceId });
      }
    }
    return expired;
  }

  dispose() {
    const stale = [...this.#pending].map(([requestId, pending]) => ({
      requestId,
      traceId: pending.traceId,
    }));
    this.#pending.clear();
    this.#disposed = true;
    return stale;
  }
}
