const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
const collectionPattern = /^[a-z][a-z0-9_-]{0,63}$/;
const tablePattern = /^[a-z][a-z0-9_]{0,62}[a-z0-9]$/;
const fieldPattern = /^[a-z][a-z0-9_]{0,62}$/;
const recordIdPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const contentIdPattern = /^[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;
const uploadObjectNamePattern = /^[A-Za-z0-9_-]{32,256}\.(png|jpg)$/;
const bucketPattern = /^[a-z0-9][a-z0-9._-]{0,62}[a-z0-9]$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const rolePattern = /^[a-z][a-z0-9_-]{0,31}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publishableKeyPattern = /^sb_publishable_[A-Za-z0-9._-]{16,480}$/;
const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const dangerousKeys = new Set(["__proto__", "constructor", "prototype"]);
const publicErrorCodes = new Set(["CANCELLED", "CONFIGURATION", "FORBIDDEN", "INVALID_CREDENTIALS", "MALFORMED_RESPONSE", "NETWORK", "PROVIDER_SCHEMA", "RATE_LIMITED", "TIMEOUT", "UNAUTHORIZED", "UNAVAILABLE", "VALIDATION"]);
const maximumResponseBytes = 64 * 1024;
const maximumAccessTokenBytes = 16 * 1024;
const maximumRefreshTokenBytes = 4096;
const minimumRefreshTokenBytes = 8;
const minimumSignedDeliveryTtlSeconds = 10;
const maximumSignedDeliveryTtlSeconds = 60;
const maximumStorageUploadTimeoutMs = 15 * 60 * 1000;
const signOutScopes = new Set(["global", "local", "others"]);

function byteLength(value) { return encoder.encode(value).byteLength; }
function record(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function fail(code, message, status = 0) { throw new SupabaseProviderError(code, message, status); }
function boundedString(value, maximum, minimum = 1) { return typeof value === "string" && byteLength(value) >= minimum && byteLength(value) <= maximum; }
function canonicalEmail(value) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return byteLength(email) <= 254 && emailPattern.test(email) ? email : null;
}
function endpoint(value) {
  let parsed;
  try { parsed = new URL(value); } catch { fail("CONFIGURATION", "Supabase endpoint is invalid"); }
  const loopback = new Set(["127.0.0.1", "[::1]", "localhost"]).has(parsed.hostname);
  if ((parsed.protocol !== "https:" && !(parsed.protocol === "http:" && loopback)) || parsed.username || parsed.password || parsed.search || parsed.hash || !["", "/"].includes(parsed.pathname)) {
    fail("CONFIGURATION", "Supabase endpoint must be HTTPS or loopback HTTP without credentials, path, query or fragment");
  }
  parsed.pathname = "/";
  return parsed;
}
function recoveryRedirect(value) {
  if (value === null || value === undefined) return null;
  if (!boundedString(value, 2048)) fail("VALIDATION", "Invalid password recovery redirect");
  let parsed;
  try { parsed = new URL(value); } catch { fail("VALIDATION", "Invalid password recovery redirect"); }
  const loopback = new Set(["127.0.0.1", "[::1]", "localhost"]).has(parsed.hostname);
  if ((parsed.protocol !== "https:" && !(parsed.protocol === "http:" && loopback)) || parsed.username || parsed.password || parsed.hash) fail("VALIDATION", "Invalid password recovery redirect");
  return parsed.href;
}
function publishableKey(value) {
  if (!publishableKeyPattern.test(value ?? "")) fail("CONFIGURATION", "A current Supabase publishable key is required");
  return value;
}
function bearer(value, label = "access token") {
  if (!boundedString(value, maximumAccessTokenBytes) || /[\s\r\n]/.test(value)) fail("VALIDATION", `Invalid ${label}`);
  return value;
}
function refreshCredential(value) {
  if (!boundedString(value, maximumRefreshTokenBytes, minimumRefreshTokenBytes) || /[\s\r\n]/.test(value)) fail("VALIDATION", "Invalid refresh token");
  return value;
}
function pathSegments(value, label) {
  if (typeof value !== "string" || value.startsWith("/") || value.endsWith("/") || value.split("/").some((part) => part.length === 0 || part === "." || part === ".." || byteLength(part) > 255) || byteLength(value) > 1024) fail("CONFIGURATION", `${label} is invalid`);
  return value.split("/").map(encodeURIComponent).join("/");
}
function validJson(value, depth = 0) {
  if (depth > 12) return false;
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return byteLength(value) <= 4096;
  if (Array.isArray(value)) return value.length <= 128 && value.every((item) => validJson(item, depth + 1));
  if (!record(value) || Object.keys(value).length > 64) return false;
  return Object.entries(value).every(([key, item]) => boundedString(key, 128) && !dangerousKeys.has(key) && validJson(item, depth + 1));
}
function admittedRecord(value, code = "MALFORMED_RESPONSE") {
  if (!record(value) || !recordIdPattern.test(value.id ?? "") || !validJson(value)) fail(code, code === "VALIDATION" ? "Invalid record" : "Supabase returned an invalid record");
  return Object.freeze(structuredClone(value));
}
function admittedQueryConfiguration(value) {
  if (value === undefined) return null;
  if (!record(value) || Object.keys(value).some((key) => !["equalityFields", "sorts"].includes(key))) fail("CONFIGURATION", "Supabase record query mapping is invalid");
  const equalityFields = value.equalityFields ?? [];
  if (!Array.isArray(equalityFields) || equalityFields.length > 16 || new Set(equalityFields).size !== equalityFields.length || !equalityFields.every((field) => fieldPattern.test(field))) fail("CONFIGURATION", "Supabase record query mapping is invalid");
  if (!record(value.sorts) || Object.keys(value.sorts).length < 1 || Object.keys(value.sorts).length > 16) fail("CONFIGURATION", "Supabase record query mapping is invalid");
  const sorts = {};
  for (const [name, order] of Object.entries(value.sorts)) {
    if (!/^[a-z][A-Za-z0-9_-]{0,63}$/.test(name) || !Array.isArray(order) || order.length < 1 || order.length > 4 || new Set(order.map((item) => item?.field)).size !== order.length || !order.every((item) => record(item) && Object.keys(item).sort().join("\n") === "direction\nfield" && fieldPattern.test(item.field ?? "") && ["asc", "desc"].includes(item.direction)) || order.at(-1).field !== "id") fail("CONFIGURATION", "Supabase record query mapping is invalid");
    sorts[name] = Object.freeze(order.map((item) => Object.freeze({ ...item })));
  }
  return Object.freeze({ equalityFields: Object.freeze([...equalityFields]), sorts: Object.freeze(sorts) });
}
function queryLiteral(value) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string" && boundedString(value, 4096)) return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
  fail("VALIDATION", "Invalid record query value");
}
function admittedRecordQuery(value, configuration) {
  if (!configuration || !record(value) || Object.keys(value).sort().join("\n") !== "boundary\ndirection\nequality\nlimit\norder\nsort" || !Number.isSafeInteger(value.limit) || value.limit < 1 || value.limit > 128 || !["forward", "backward"].includes(value.direction) || !Object.hasOwn(configuration.sorts, value.sort) || !record(value.equality) || (value.boundary !== null && !Array.isArray(value.boundary))) fail("VALIDATION", "Invalid record query");
  const allowedEquality = new Set(configuration.equalityFields);
  if (Object.entries(value.equality).some(([field, item]) => !allowedEquality.has(field) || !["string", "number", "boolean"].includes(typeof item) || (typeof item === "number" && !Number.isFinite(item)))) fail("VALIDATION", "Invalid record query");
  const order = configuration.sorts[value.sort];
  const invalidOrder = !Array.isArray(value.order) || value.order.length !== order.length || value.order.some((item, index) => item?.field !== order[index].field || item?.direction !== order[index].direction);
  const invalidBoundary = value.boundary !== null && (value.boundary.length !== order.length || value.boundary.some((item) => !["string", "number", "boolean"].includes(typeof item) || (typeof item === "number" && !Number.isFinite(item))));
  if (invalidOrder || invalidBoundary) fail("VALIDATION", "Invalid record query");
  return { ...value, order };
}
function queriedRecordPath(table, query) {
  const parameters = new URLSearchParams({ select: "*" });
  for (const [field, value] of Object.entries(query.equality)) parameters.set(field, `eq.${queryLiteral(value)}`);
  if (query.boundary !== null) {
    const alternatives = query.order.map((item, index) => {
      const parts = query.order.slice(0, index).map((prefix, prefixIndex) => `${prefix.field}.eq.${queryLiteral(query.boundary[prefixIndex])}`);
      const after = query.direction === "forward" ? item.direction === "asc" : item.direction !== "asc";
      parts.push(`${item.field}.${after ? "gt" : "lt"}.${queryLiteral(query.boundary[index])}`);
      return parts.length === 1 ? parts[0] : `and(${parts.join(",")})`;
    });
    parameters.set("or", `(${alternatives.join(",")})`);
  }
  const requestOrder = query.direction === "forward" ? query.order : query.order.map((item) => ({ field: item.field, direction: item.direction === "asc" ? "desc" : "asc" }));
  parameters.set("order", requestOrder.map((item) => `${item.field}.${item.direction}`).join(","));
  parameters.set("limit", String(query.limit + 1));
  return `/rest/v1/${table}?${parameters.toString()}`;
}
function decodeJwtPayload(token) {
  if (!jwtPattern.test(token) || byteLength(token) > maximumAccessTokenBytes) fail("MALFORMED_RESPONSE", "Supabase returned an invalid access token");
  try {
    const payload = token.split(".")[1];
    const bytes = Buffer.from(payload, "base64url");
    if (bytes.byteLength === 0 || bytes.byteLength > 8192) fail("MALFORMED_RESPONSE", "Supabase returned an invalid access token");
    const parsed = JSON.parse(decoder.decode(bytes));
    if (!record(parsed) || !validJson(parsed)) fail("MALFORMED_RESPONSE", "Supabase returned an invalid access token");
    return parsed;
  } catch (error) {
    if (error instanceof SupabaseProviderError) throw error;
    fail("MALFORMED_RESPONSE", "Supabase returned an invalid access token");
  }
}
async function boundedJson(response) {
  const contentType = response.headers?.get?.("content-type") ?? "";
  if (!/^application\/(?:[a-z0-9.+-]*\+)?json(?:;|$)/i.test(contentType)) fail("MALFORMED_RESPONSE", "Supabase returned a non-JSON response", response.status);
  const declared = Number(response.headers?.get?.("content-length"));
  if (Number.isFinite(declared) && declared > maximumResponseBytes) fail("MALFORMED_RESPONSE", "Supabase response exceeds the size limit", response.status);
  const chunks = [];
  let total = 0;
  if (response.body?.getReader) {
    const reader = response.body.getReader();
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > maximumResponseBytes) {
        await reader.cancel().catch(() => {});
        fail("MALFORMED_RESPONSE", "Supabase response exceeds the size limit", response.status);
      }
      chunks.push(next.value);
    }
  } else {
    const bytes = new Uint8Array(await response.arrayBuffer());
    total = bytes.byteLength;
    if (total > maximumResponseBytes) fail("MALFORMED_RESPONSE", "Supabase response exceeds the size limit", response.status);
    chunks.push(bytes);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    const parsed = JSON.parse(decoder.decode(bytes));
    if (!validJson(parsed)) fail("MALFORMED_RESPONSE", "Supabase returned invalid JSON", response.status);
    return parsed;
  } catch (error) {
    if (error instanceof SupabaseProviderError) throw error;
    fail("MALFORMED_RESPONSE", "Supabase returned invalid JSON", response.status);
  }
}
function statusFailure(status, operation) {
  if (status === 429) fail("RATE_LIMITED", "Supabase rate limit reached", status);
  if (status >= 500) fail("UNAVAILABLE", "Supabase is unavailable", status);
  if (status === 401 || (status === 400 && operation === "refresh")) fail(operation === "password" ? "INVALID_CREDENTIALS" : "UNAUTHORIZED", operation === "password" ? "Invalid credentials" : "Supabase session is unauthorized", status);
  if (operation === "storage" && (status === 400 || status === 404)) fail("FORBIDDEN", "Supabase denied protected content delivery", status);
  if (status === 403) fail("FORBIDDEN", "Supabase denied the operation", status);
  if (status === 404 && operation === "data") fail("PROVIDER_SCHEMA", "Supabase Data API resource is unavailable", status);
  if (status >= 400 && status < 500) fail(operation === "password" ? "INVALID_CREDENTIALS" : "VALIDATION", operation === "password" ? "Invalid credentials" : "Supabase rejected the operation", status);
  fail("UNAVAILABLE", "Supabase returned an unexpected status", status);
}
function transport({ baseUrl, key, fetchImpl, timeoutMs }) {
  if (typeof fetchImpl !== "function") fail("CONFIGURATION", "Supabase provider requires fetch");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) fail("CONFIGURATION", "Supabase request timeout is invalid");
  return async (path, { method = "GET", accessToken = null, body = undefined, prefer = null, operation = "provider", signal = null } = {}) => {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    const abort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener?.("abort", abort, { once: true });
    const headers = { Accept: "application/json", apikey: key };
    if (accessToken) headers.Authorization = `Bearer ${bearer(accessToken)}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (prefer) headers.Prefer = prefer;
    let response;
    try {
      response = await fetchImpl(new URL(path, baseUrl), { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "error", signal: controller.signal });
    } catch {
      clearTimeout(timer);
      signal?.removeEventListener?.("abort", abort);
      if (timedOut) fail("TIMEOUT", "Supabase request timed out");
      if (controller.signal.aborted) fail("CANCELLED", "Supabase request was cancelled");
      fail("NETWORK", "Supabase request failed");
    }
    clearTimeout(timer);
    signal?.removeEventListener?.("abort", abort);
    if (!response || !Number.isInteger(response.status)) fail("MALFORMED_RESPONSE", "Supabase transport returned an invalid response");
    if (response.status < 200 || response.status >= 300) statusFailure(response.status, operation);
    if (response.status === 204) return null;
    return boundedJson(response);
  };
}
function userSession(value, { requestedEmail = null, expectedAudience, expectedIssuer, now }) {
  if (!record(value) || !boundedString(value.access_token, maximumAccessTokenBytes) || !boundedString(value.refresh_token, maximumRefreshTokenBytes, minimumRefreshTokenBytes) || value.token_type?.toLowerCase() !== "bearer" || !Number.isSafeInteger(value.expires_in) || value.expires_in < 1 || value.expires_in > 86_400 || !record(value.user) || !uuidPattern.test(value.user.id ?? "")) {
    fail("MALFORMED_RESPONSE", "Supabase returned an invalid session");
  }
  const email = canonicalEmail(value.user.email);
  if (!email || (requestedEmail && email !== requestedEmail)) fail("MALFORMED_RESPONSE", "Supabase session identity does not match the request");
  const claims = decodeJwtPayload(value.access_token);
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.sub !== value.user.id || !audience.includes(expectedAudience) || claims.iss !== expectedIssuer || !Number.isSafeInteger(claims.exp) || claims.exp * 1000 <= now()) fail("MALFORMED_RESPONSE", "Supabase access token claims do not match the session");
  const appRoles = value.user.app_metadata?.roles;
  const roles = appRoles === undefined ? ["user"] : appRoles;
  if (!Array.isArray(roles) || roles.length < 1 || roles.length > 8 || !roles.every((role) => rolePattern.test(role))) fail("MALFORMED_RESPONSE", "Supabase app roles are invalid");
  const expiresAt = claims.exp * 1000;
  if (Math.abs(expiresAt - (now() + value.expires_in * 1000)) > 60_000) fail("MALFORMED_RESPONSE", "Supabase session expiry is inconsistent");
  return Object.freeze({
    provider: "supabase",
    providerUserId: value.user.id,
    email,
    name: email,
    roles: Object.freeze([...new Set(roles)]),
    accessToken: value.access_token,
    refreshToken: value.refresh_token,
    expiresAt,
  });
}

export class SupabaseProviderError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    if (!publicErrorCodes.has(code) || !Number.isInteger(status) || status < 0 || status > 599) throw new Error("invalid Supabase provider error");
    this.name = "SupabaseProviderError";
    this.code = code;
    this.status = status;
  }
}

export function createSupabaseAuthProvider({ url, publishableKey: keyValue, fetchImpl = globalThis.fetch, now = () => Date.now(), timeoutMs = 5000, expectedAudience = "authenticated", expectedIssuer = null } = {}) {
  const baseUrl = endpoint(url);
  const key = publishableKey(keyValue);
  if (typeof now !== "function" || !boundedString(expectedAudience, 128) || (expectedIssuer !== null && !boundedString(expectedIssuer, 512))) fail("CONFIGURATION", "Supabase Auth configuration is invalid");
  const issuer = expectedIssuer ?? new URL("/auth/v1", baseUrl).href.replace(/\/$/, "");
  const send = transport({ baseUrl, key, fetchImpl, timeoutMs });
  return Object.freeze({
    async signInWithPassword(emailValue, password, { signal = null } = {}) {
      const email = canonicalEmail(emailValue);
      if (!email || !boundedString(password, 1024)) fail("VALIDATION", "Email and password are required");
      const value = await send("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password }, operation: "password", signal });
      return userSession(value, { requestedEmail: email, expectedAudience, expectedIssuer: issuer, now });
    },
    async refreshSession(refreshToken, { signal = null } = {}) {
      const value = await send("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: refreshCredential(refreshToken) }, operation: "refresh", signal });
      return userSession(value, { expectedAudience, expectedIssuer: issuer, now });
    },
    async requestPasswordRecovery(emailValue, { redirectTo = null, signal = null } = {}) {
      const email = canonicalEmail(emailValue);
      if (!email) fail("VALIDATION", "Email is required");
      const redirect = recoveryRedirect(redirectTo);
      const path = redirect === null ? "/auth/v1/recover" : `/auth/v1/recover?redirect_to=${encodeURIComponent(redirect)}`;
      await send(path, { method: "POST", body: { email }, operation: "recovery", signal });
      return true;
    },
    async updatePassword(recoveryAccessToken, password, { signal = null } = {}) {
      if (!boundedString(password, 1024, 8)) fail("VALIDATION", "A new password of at least 8 bytes is required");
      const value = await send("/auth/v1/user", { method: "PUT", accessToken: recoveryAccessToken, body: { password }, operation: "password-update", signal });
      if (!record(value) || !uuidPattern.test(value.id ?? "") || !canonicalEmail(value.email)) fail("MALFORMED_RESPONSE", "Supabase returned an invalid password-update identity");
      return true;
    },
    async signOut(accessToken, { scope = "local", signal = null } = {}) {
      if (!signOutScopes.has(scope)) fail("VALIDATION", "Invalid Supabase sign-out scope");
      await send(`/auth/v1/logout?scope=${scope}`, { method: "POST", accessToken, operation: "logout", signal });
      return true;
    },
  });
}

export function createSupabaseRecordProvider({ url, publishableKey: keyValue, tables, fetchImpl = globalThis.fetch, timeoutMs = 5000 } = {}) {
  const baseUrl = endpoint(url);
  const key = publishableKey(keyValue);
  if (!record(tables) || Object.keys(tables).length < 1 || Object.keys(tables).length > 32) fail("CONFIGURATION", "Supabase record tables are invalid");
  const admittedTables = new Map();
  for (const [collection, specification] of Object.entries(tables)) {
    const table = typeof specification === "string" ? specification : specification?.table;
    const updateFields = typeof specification === "string" || specification?.updateFields === undefined ? null : specification.updateFields;
    const query = typeof specification === "string" ? null : admittedQueryConfiguration(specification?.query);
    if (!collectionPattern.test(collection) || !tablePattern.test(table ?? "") || admittedTables.has(collection) || (updateFields !== null && (!Array.isArray(updateFields) || updateFields.length < 1 || updateFields.length > 32 || new Set(updateFields).size !== updateFields.length || updateFields.includes("id") || !updateFields.every((field) => fieldPattern.test(field))))) fail("CONFIGURATION", "Supabase record table mapping is invalid");
    admittedTables.set(collection, Object.freeze({ table, updateFields: updateFields === null ? null : Object.freeze([...updateFields]), query }));
  }
  const send = transport({ baseUrl, key, fetchImpl, timeoutMs });
  const table = (name) => {
    const value = admittedTables.get(name);
    if (!value) fail("VALIDATION", "Unknown record collection");
    return value.table;
  };
  const updateBody = (collection, value) => {
    const fields = admittedTables.get(collection)?.updateFields;
    if (fields === null) return value;
    const patch = Object.fromEntries(fields.filter((field) => Object.hasOwn(value, field)).map((field) => [field, value[field]]));
    if (Object.keys(patch).length === 0) fail("VALIDATION", "Record update contains no admitted fields");
    return patch;
  };
  const rows = (value, maximum = 128) => {
    if (!Array.isArray(value) || value.length > maximum) fail("MALFORMED_RESPONSE", "Supabase returned an invalid record set");
    return Object.freeze(value.map(admittedRecord));
  };
  const recordPath = (collection, id = null) => {
    const target = `/rest/v1/${table(collection)}`;
    if (id === null) return `${target}?select=*`;
    if (!recordIdPattern.test(id ?? "")) fail("VALIDATION", "Invalid record ID");
    return `${target}?id=eq.${encodeURIComponent(id)}&select=*&limit=1`;
  };
  return Object.freeze({
    async list(collection, accessToken, { signal = null, query: queryValue = null } = {}) {
      if (queryValue === null) return rows(await send(recordPath(collection), { accessToken, operation: "data", signal }));
      const specification = admittedTables.get(collection);
      const query = admittedRecordQuery(queryValue, specification?.query);
      let items = rows(await send(queriedRecordPath(specification.table, query), { accessToken, operation: "data", signal }), query.limit + 1);
      if (query.direction === "backward") items = Object.freeze([...items].reverse());
      return Object.freeze({ items, hasMore: items.length > query.limit });
    },
    async get(collection, id, accessToken, { signal = null } = {}) {
      const result = rows(await send(recordPath(collection, id), { accessToken, operation: "data", signal }));
      return result[0] ?? null;
    },
    async insert(collection, value, accessToken, { signal = null } = {}) {
      const admitted = admittedRecord(value, "VALIDATION");
      const result = rows(await send(`/rest/v1/${table(collection)}?select=*`, { method: "POST", accessToken, body: admitted, prefer: "return=representation", operation: "data", signal }));
      if (result.length !== 1 || result[0].id !== admitted.id) fail("MALFORMED_RESPONSE", "Supabase insert result is inconsistent");
      return result[0];
    },
    async update(collection, id, value, accessToken, { signal = null } = {}) {
      if (!recordIdPattern.test(id ?? "")) fail("VALIDATION", "Invalid record ID");
      const admitted = admittedRecord(value, "VALIDATION");
      if (admitted.id !== id) fail("VALIDATION", "Record update cannot change its ID");
      const result = rows(await send(`/rest/v1/${table(collection)}?id=eq.${encodeURIComponent(id)}&select=*`, { method: "PATCH", accessToken, body: updateBody(collection, admitted), prefer: "return=representation", operation: "data", signal }));
      if (result.length !== 1 || result[0].id !== id) fail("FORBIDDEN", "Supabase update did not affect the owned record");
      return result[0];
    },
    async delete(collection, id, accessToken, { signal = null } = {}) {
      if (!recordIdPattern.test(id ?? "")) fail("VALIDATION", "Invalid record ID");
      const result = rows(await send(`/rest/v1/${table(collection)}?id=eq.${encodeURIComponent(id)}&select=id`, { method: "DELETE", accessToken, prefer: "return=representation", operation: "data", signal }));
      if (result.length > 1) fail("MALFORMED_RESPONSE", "Supabase delete result is inconsistent");
      return result.length === 1 && result[0].id === id;
    },
  });
}

export function createSupabaseStorageProvider({ url, publishableKey: keyValue, items = [], uploads = [], fetchImpl = globalThis.fetch, now = () => Date.now(), timeoutMs = 5000 } = {}) {
  const baseUrl = endpoint(url);
  const key = publishableKey(keyValue);
  if (!Array.isArray(items) || items.length > 64 || !Array.isArray(uploads) || uploads.length > 32 || items.length + uploads.length < 1 || typeof now !== "function" || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) fail("CONFIGURATION", "Supabase Storage configuration is invalid");
  const byId = new Map();
  for (const item of items) {
    if (!record(item) || !contentIdPattern.test(item.id ?? "") || !bucketPattern.test(item.bucket ?? "") || byId.has(item.id)) fail("CONFIGURATION", "Supabase Storage item is invalid or duplicated");
    const encodedPath = pathSegments(item.path, "Supabase Storage object path");
    byId.set(item.id, Object.freeze({ id: item.id, bucket: item.bucket, encodedPath }));
  }
  const uploadsById = new Map();
  for (const upload of uploads) {
    if (!record(upload) || !collectionPattern.test(upload.id ?? "") || uploadsById.has(upload.id) || !bucketPattern.test(upload.bucket ?? "")) fail("CONFIGURATION", "Supabase Storage upload declaration is invalid or duplicated");
    pathSegments(upload.prefix, "Supabase Storage upload prefix");
    uploadsById.set(upload.id, Object.freeze({ id: upload.id, bucket: upload.bucket, prefix: upload.prefix }));
  }
  const send = transport({ baseUrl, key, fetchImpl, timeoutMs });
  const object = (value) => {
    if (!record(value) || !collectionPattern.test(value.uploadId ?? "") || !bucketPattern.test(value.bucket ?? "")) fail("VALIDATION", "Invalid Supabase Storage object");
    const upload = uploadsById.get(value.uploadId);
    const suffix = typeof value.path === "string" && upload ? value.path.slice(upload.prefix.length + 1).split("/") : [];
    if (!upload || value.bucket !== upload.bucket || !value.path.startsWith(`${upload.prefix}/`) || suffix.length !== 2 || !uuidPattern.test(suffix[0]) || !uploadObjectNamePattern.test(suffix[1])) fail("VALIDATION", "Supabase Storage object is outside its upload declaration");
    return { bucket: value.bucket, encodedPath: pathSegments(value.path, "Supabase Storage object path") };
  };
  const signedDelivery = async (item, accessToken, ttlSeconds, signal) => {
    if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds < minimumSignedDeliveryTtlSeconds || ttlSeconds > maximumSignedDeliveryTtlSeconds) fail("VALIDATION", "Invalid signed delivery TTL");
    const value = await send(`/storage/v1/object/sign/${encodeURIComponent(item.bucket)}/${item.encodedPath}`, { method: "POST", accessToken, body: { expiresIn: ttlSeconds }, operation: "storage", signal });
    if (!record(value) || !boundedString(value.signedURL, 4096)) fail("MALFORMED_RESPONSE", "Supabase Storage returned an invalid signed URL");
    let delivery;
    try {
      const signedPath = value.signedURL.startsWith("/object/sign/") ? `/storage/v1${value.signedURL}` : value.signedURL;
      delivery = new URL(signedPath, baseUrl);
    } catch { fail("MALFORMED_RESPONSE", "Supabase Storage returned an invalid signed URL"); }
    if (delivery.origin !== baseUrl.origin || delivery.username || delivery.password || delivery.protocol !== baseUrl.protocol || !delivery.pathname.startsWith("/storage/v1/object/sign/")) fail("MALFORMED_RESPONSE", "Supabase Storage signed URL escaped the admitted origin");
    return Object.freeze({ deliveryUrl: delivery.href, expiresAt: now() + ttlSeconds * 1000 });
  };
  const raw = async (urlValue, { method, accessToken, mediaType = null, body = undefined, signal = null, maximumBytes = 25 * 1024 * 1024, deadlineMs = timeoutMs } = {}) => {
    if (!Number.isSafeInteger(deadlineMs) || deadlineMs < 1 || deadlineMs > maximumStorageUploadTimeoutMs) fail("VALIDATION", "Invalid Supabase Storage deadline");
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, deadlineMs);
    const abort = () => controller.abort();
    const cleanup = () => { clearTimeout(timer); signal?.removeEventListener?.("abort", abort); };
    if (signal?.aborted) controller.abort(); else signal?.addEventListener?.("abort", abort, { once: true });
    const headers = { apikey: key, Authorization: `Bearer ${bearer(accessToken)}` };
    if (mediaType) headers["Content-Type"] = mediaType;
    let response;
    try { response = await fetchImpl(urlValue, { method, headers, body, duplex: body === undefined ? undefined : "half", redirect: "error", signal: controller.signal }); }
    catch {
      cleanup();
      if (timedOut) fail("TIMEOUT", "Supabase Storage request timed out");
      if (controller.signal.aborted) fail("CANCELLED", "Supabase Storage request was cancelled");
      fail("NETWORK", "Supabase Storage request failed");
    }
    if (!response || !Number.isInteger(response.status)) { cleanup(); fail("MALFORMED_RESPONSE", "Supabase Storage transport returned an invalid response"); }
    if (response.status < 200 || response.status >= 300) { cleanup(); statusFailure(response.status, "storage"); }
    const chunks = [];
    let total = 0;
    try {
      if (method !== "HEAD") for await (const chunkValue of response.body ?? []) {
        const chunk = Buffer.from(chunkValue);
        total += chunk.byteLength;
        if (total > maximumBytes) fail("MALFORMED_RESPONSE", "Supabase Storage object exceeds the size limit", response.status);
        chunks.push(chunk);
      }
    } catch (error) {
      cleanup();
      if (error instanceof SupabaseProviderError) throw error;
      if (timedOut) fail("TIMEOUT", "Supabase Storage request timed out");
      if (controller.signal.aborted) fail("CANCELLED", "Supabase Storage request was cancelled");
      fail("NETWORK", "Supabase Storage response failed");
    }
    cleanup();
    return Object.freeze({ bytes: Buffer.concat(chunks), mediaType: (response.headers.get("content-type") ?? "").split(";", 1)[0].trim().toLowerCase() });
  };
  return Object.freeze({
    async createSignedDelivery(id, accessToken, { ttlSeconds = 60, signal = null } = {}) {
      const item = byId.get(id);
      if (!item) fail("VALIDATION", "Unknown protected content item");
      return signedDelivery(item, accessToken, ttlSeconds, signal);
    },
    createSignedDeliveryForObject(value, accessToken, { ttlSeconds = 60, signal = null } = {}) {
      return signedDelivery(object(value), accessToken, ttlSeconds, signal);
    },
    async uploadObject(value, accessToken, { mediaType, body, signal = null } = {}) {
      const item = object(value);
      const signed = await send(`/storage/v1/object/upload/sign/${encodeURIComponent(item.bucket)}/${item.encodedPath}`, { method: "POST", accessToken, body: {}, operation: "storage", signal });
      const rawUrl = record(signed) ? signed.url ?? signed.signedURL ?? signed.signedUrl : null;
      if (!boundedString(rawUrl, 4096)) fail("MALFORMED_RESPONSE", "Supabase Storage returned an invalid signed upload URL");
      let uploadUrl;
      try { uploadUrl = new URL(rawUrl.startsWith("/object/upload/sign/") ? `/storage/v1${rawUrl}` : rawUrl, baseUrl); }
      catch { fail("MALFORMED_RESPONSE", "Supabase Storage returned an invalid signed upload URL"); }
      if (uploadUrl.origin !== baseUrl.origin || uploadUrl.protocol !== baseUrl.protocol || uploadUrl.username || uploadUrl.password || !uploadUrl.pathname.startsWith("/storage/v1/object/upload/sign/")) fail("MALFORMED_RESPONSE", "Supabase Storage signed upload URL escaped the admitted origin");
      await raw(uploadUrl, { method: "PUT", accessToken, mediaType, body, signal, maximumBytes: maximumResponseBytes, deadlineMs: maximumStorageUploadTimeoutMs });
      return true;
    },
    async readObject(value, accessToken, { signal = null, maximumBytes = 25 * 1024 * 1024 } = {}) {
      const delivery = await signedDelivery(object(value), accessToken, 10, signal);
      return raw(delivery.deliveryUrl, { method: "GET", accessToken, signal, maximumBytes });
    },
    async deleteObject(value, accessToken, { signal = null } = {}) {
      const item = object(value);
      await send(`/storage/v1/object/${encodeURIComponent(item.bucket)}/${item.encodedPath}`, { method: "DELETE", accessToken, operation: "storage", signal });
      return true;
    },
  });
}

export const supabaseProviderLimits = Object.freeze({ maximumResponseBytes, maximumAccessTokenBytes, maximumRefreshTokenBytes, minimumRefreshTokenBytes, minimumSignedDeliveryTtlSeconds, maximumSignedDeliveryTtlSeconds, maximumStorageUploadTimeoutMs });
