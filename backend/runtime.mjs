import { createHash } from "node:crypto";

import { validateCapabilityRequest, validateRpcRequest } from "../platform/protocol/generated/protocol.mjs";
import { decodeWire, encodeWire } from "./wire.mjs";
import { validateTypedObject } from "./contract.mjs";

const publicCodes = new Set(["CANCELLED", "DEADLINE", "FORBIDDEN", "INTERNAL", "NETWORK", "UNAUTHORIZED", "VALIDATION"]);
const functionPattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+\.v[1-9][0-9]*$/;
const idempotencyPattern = /^[A-Za-z0-9][A-Za-z0-9_:%-]{7,127}$/;
const maximumIdempotencyEntries = 256;
const idempotencyTtlMs = 5 * 60 * 1000;

function publicError(traceId, code, message) {
  return { version: 1, success: false, data: null, error: { code, message }, traceId };
}
function success(traceId, payload) { return { version: 1, success: true, data: { payload }, error: null, traceId }; }
function capabilityResponse(request, payload) { return { accepted: true, response: { version: 1, requestId: request.requestId, traceId: request.traceId, status: "ok", payload } }; }
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function digest(value) { return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex"); }
function roles(principal) { return new Set(Array.isArray(principal?.roles) ? principal.roles : []); }
function authorized(principal, policy) {
  if (policy === "public") return true;
  const admitted = roles(principal);
  if (policy === "admin") return admitted.has("admin");
  return admitted.has("user") || admitted.has("admin");
}
function convertScalar(type, value) {
  if (type === "string") return value;
  if (type === "number") {
    const number = Number(value);
    return Number.isFinite(number) && String(number) === value ? number : undefined;
  }
  if (type === "boolean") return value === "true" ? true : value === "false" ? false : undefined;
  return undefined;
}
function decodeInput(fields, definition) {
  const admitted = new Set(["function", "idempotency", "retry"]);
  const input = {};
  for (const [name, type] of Object.entries(definition.input)) {
    const key = `input.${name}`;
    admitted.add(key);
    if (!Object.hasOwn(fields, key)) return null;
    const converted = convertScalar(type, fields[key]);
    if (converted === undefined) return null;
    input[name] = converted;
  }
  if (Object.keys(fields).some((name) => !admitted.has(name))) return null;
  return input;
}
function scalarWire(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  throw new Error("unsupported backend wire scalar");
}
function flattenObject(fields, prefix, definition, value) {
  for (const [name, type] of Object.entries(definition)) fields[`${prefix}.${name}`] = scalarWire(value[name], type);
}
function encodeResult(definition, value, types) {
  const fields = {};
  for (const [name, type] of Object.entries(definition)) {
    const prefix = `result.${name}`;
    if (type.endsWith("[]")) {
      const itemType = type.slice(0, -2);
      fields[`${prefix}.length`] = String(value[name].length);
      value[name].forEach((item, index) => {
        if (types[itemType]) flattenObject(fields, `${prefix}.${index + 1}`, types[itemType], item);
        else fields[`${prefix}.${index + 1}`] = scalarWire(item);
      });
    } else if (types[type]) flattenObject(fields, prefix, types[type], value[name]);
    else fields[prefix] = scalarWire(value[name]);
  }
  return encodeWire(fields);
}

export class BackendPublicError extends Error {
  constructor(code, message) {
    super(message);
    if (!publicCodes.has(code) || code === "INTERNAL") throw new Error("invalid public backend error code");
    this.code = code;
  }
}

export function createBackendRuntime({ contract, handlers, database = null, sessions = null, content = null, identity = null, now = () => Date.now() }) {
  if (!contract?.functions || !contract?.types || !handlers || typeof handlers !== "object") throw new Error("invalid backend runtime configuration");
  const idempotency = new Map();
  const prune = () => {
    const current = now();
    for (const [key, item] of idempotency) if (item.expiresAt <= current) idempotency.delete(key);
    while (idempotency.size > maximumIdempotencyEntries) idempotency.delete(idempotency.keys().next().value);
  };
  const execute = async ({ operation, definition, input, principal, signal, traceId }) => {
    if (signal?.aborted) throw new BackendPublicError("CANCELLED", "Request cancelled");
    const handler = handlers[operation];
    if (typeof handler !== "function") throw new Error("missing backend handler");
    const sessionApi = sessions ? Object.freeze({
      issue(nextPrincipal, options) { return sessions.issue(nextPrincipal, options); },
      revokeCurrent() { return typeof principal?.session === "string" && sessions.revoke(principal.session); },
    }) : null;
    const contentApi = content ? Object.freeze({
      issue(id, options) { return content.issue(id, options); },
    }) : null;
    const identityApi = identity ? Object.freeze({
      async signInWithPassword(email, password) {
        try { return await identity.signInWithPassword(email, password, { signal }); }
        catch (error) {
          if (error?.code === "INVALID_CREDENTIALS" || error?.code === "UNAUTHORIZED") throw new BackendPublicError("UNAUTHORIZED", "Invalid credentials");
          if (error?.code === "CANCELLED") throw new BackendPublicError("CANCELLED", "Request cancelled");
          if (error?.code === "VALIDATION") throw new BackendPublicError("VALIDATION", "Invalid authentication input");
          if (error?.code === "RATE_LIMITED" || error?.code === "REFRESH_BUSY" || error?.code === "UNAVAILABLE") throw new BackendPublicError("NETWORK", "Authentication service is temporarily unavailable");
          throw error;
        }
      },
      async signOutCurrent() {
        if (typeof principal?.session !== "string") return Object.freeze({ revoked: false, providerRevoked: false });
        return identity.signOutCurrent(principal.session, { signal });
      },
    }) : null;
    const result = await handler(Object.freeze({ ...input }), Object.freeze({
      traceId,
      principal: principal ? Object.freeze({ ...principal, roles: Object.freeze([...(principal.roles ?? [])]) }) : null,
      signal,
      database,
      sessions: sessionApi,
      content: contentApi,
      identity: identityApi,
      reject(code, message) { throw new BackendPublicError(code, message); },
    }));
    if (signal?.aborted) throw new BackendPublicError("CANCELLED", "Request cancelled");
    if (!validateTypedObject(definition.result, result, contract.types)) throw new Error("invalid backend handler result");
    return encodeResult(definition.result, result, contract.types);
  };
  const call = async ({ payload, principal = null, signal = null, traceId }) => {
    try {
      const fields = decodeWire(payload);
      const operation = fields.function;
      if (!functionPattern.test(operation ?? "") || !contract.functions[operation]) return publicError(traceId, "VALIDATION", "Unknown server function");
      const definition = contract.functions[operation];
      if (!authorized(principal, definition.authorization)) {
        const authenticated = Array.isArray(principal?.roles) && principal.roles.length > 0;
        return publicError(traceId, authenticated ? "FORBIDDEN" : "UNAUTHORIZED", authenticated ? "You do not have permission for this operation" : "Authentication required");
      }
      const input = decodeInput(fields, definition);
      if (!input || !validateTypedObject(definition.input, input, contract.types)) return publicError(traceId, "VALIDATION", "Invalid server function input");
      const retry = fields.retry === "true";
      if (fields.retry !== "true" && fields.retry !== "false") return publicError(traceId, "VALIDATION", "Invalid retry policy");
      const key = fields.idempotency;
      if (key !== undefined && !idempotencyPattern.test(key)) return publicError(traceId, "VALIDATION", "Invalid idempotency key");
      if (definition.idempotency === "required" && key === undefined) return publicError(traceId, "VALIDATION", "Idempotency key required");
      if (definition.idempotency === "none" && key !== undefined) return publicError(traceId, "VALIDATION", "Idempotency key is not allowed");
      if (retry && definition.mutation && key === undefined) return publicError(traceId, "VALIDATION", "Mutation retry requires an idempotency key");
      const invocation = { operation, definition, input, principal, signal, traceId };
      if (!definition.mutation || key === undefined) return success(traceId, await execute(invocation));
      prune();
      const principalId = typeof principal?.id === "string" ? principal.id : "anonymous";
      const cacheKey = `${principalId}:${operation}:${key}`;
      const inputHash = digest(input);
      const existing = idempotency.get(cacheKey);
      if (existing) {
        if (existing.inputHash !== inputHash) return publicError(traceId, "VALIDATION", "Idempotency key was reused with different input");
        return success(traceId, await existing.promise);
      }
      const promise = execute(invocation);
      idempotency.set(cacheKey, { inputHash, promise, expiresAt: now() + idempotencyTtlMs });
      try { return success(traceId, await promise); }
      catch (error) { idempotency.delete(cacheKey); throw error; }
    } catch (error) {
      if (error instanceof BackendPublicError) return publicError(traceId, error.code, error.message);
      return publicError(traceId, "INTERNAL", "The request could not be completed");
    }
  };
  return Object.freeze({ call, get idempotencyEntries() { prune(); return idempotency.size; } });
}

export async function handleServerCapability(request, { runtime, principal = null, signal = null } = {}) {
  if (!validateCapabilityRequest(request) || request.kind !== "rpc.call" || !validateRpcRequest(request.payload) || request.payload.operation !== "server.call.v1") {
    return { accepted: false, reason: "INVALID_SERVER_CAPABILITY_REQUEST" };
  }
  const rpc = await runtime.call({ payload: request.payload.input, principal, signal, traceId: request.traceId });
  return capabilityResponse(request, rpc);
}
