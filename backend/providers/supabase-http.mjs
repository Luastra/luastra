const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
const collectionPattern = /^[a-z][a-z0-9_-]{0,63}$/;
const tablePattern = /^[a-z][a-z0-9_]{0,62}[a-z0-9]$/;
const fieldPattern = /^[a-z][a-z0-9_]{0,62}$/;
const recordIdPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const contentIdPattern = /^[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;
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
    if (!collectionPattern.test(collection) || !tablePattern.test(table ?? "") || admittedTables.has(collection) || (updateFields !== null && (!Array.isArray(updateFields) || updateFields.length < 1 || updateFields.length > 32 || new Set(updateFields).size !== updateFields.length || updateFields.includes("id") || !updateFields.every((field) => fieldPattern.test(field))))) fail("CONFIGURATION", "Supabase record table mapping is invalid");
    admittedTables.set(collection, Object.freeze({ table, updateFields: updateFields === null ? null : Object.freeze([...updateFields]) }));
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
  const rows = (value) => {
    if (!Array.isArray(value) || value.length > 128) fail("MALFORMED_RESPONSE", "Supabase returned an invalid record set");
    return Object.freeze(value.map(admittedRecord));
  };
  const recordPath = (collection, id = null) => {
    const target = `/rest/v1/${table(collection)}`;
    if (id === null) return `${target}?select=*`;
    if (!recordIdPattern.test(id ?? "")) fail("VALIDATION", "Invalid record ID");
    return `${target}?id=eq.${encodeURIComponent(id)}&select=*&limit=1`;
  };
  return Object.freeze({
    async list(collection, accessToken, { signal = null } = {}) { return rows(await send(recordPath(collection), { accessToken, operation: "data", signal })); },
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

export function createSupabaseStorageProvider({ url, publishableKey: keyValue, items, fetchImpl = globalThis.fetch, now = () => Date.now(), timeoutMs = 5000 } = {}) {
  const baseUrl = endpoint(url);
  const key = publishableKey(keyValue);
  if (!Array.isArray(items) || items.length < 1 || items.length > 64 || typeof now !== "function") fail("CONFIGURATION", "Supabase Storage items are invalid");
  const byId = new Map();
  for (const item of items) {
    if (!record(item) || !contentIdPattern.test(item.id ?? "") || !bucketPattern.test(item.bucket ?? "") || byId.has(item.id)) fail("CONFIGURATION", "Supabase Storage item is invalid or duplicated");
    const encodedPath = pathSegments(item.path, "Supabase Storage object path");
    byId.set(item.id, Object.freeze({ id: item.id, bucket: item.bucket, encodedPath }));
  }
  const send = transport({ baseUrl, key, fetchImpl, timeoutMs });
  return Object.freeze({
    async createSignedDelivery(id, accessToken, { ttlSeconds = 60, signal = null } = {}) {
      const item = byId.get(id);
      if (!item) fail("VALIDATION", "Unknown protected content item");
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
    },
  });
}

export const supabaseProviderLimits = Object.freeze({ maximumResponseBytes, maximumAccessTokenBytes, maximumRefreshTokenBytes, minimumRefreshTokenBytes, minimumSignedDeliveryTtlSeconds, maximumSignedDeliveryTtlSeconds });
