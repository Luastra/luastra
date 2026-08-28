import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const rolePattern = /^[a-z][a-z0-9_-]{0,31}$/;
const principalPattern = /^[A-Za-z0-9][A-Za-z0-9_.@-]{0,127}$/;
const providerPattern = /^[a-z][a-z0-9_-]{0,31}$/;
const providerUserPattern = /^[A-Za-z0-9][A-Za-z0-9_.:@-]{0,255}$/;
const opaquePattern = /^[A-Za-z0-9_-]{32,256}$/;
const defaultTtlMs = 30 * 24 * 60 * 60 * 1000;
const maximumTtlMs = 90 * 24 * 60 * 60 * 1000;
const maximumProviderTokenBytes = 16 * 1024;
const minimumProviderRefreshTokenBytes = 8;

function digest(value) { return createHash("sha256").update(value).digest("hex"); }
function bytes(value) { return Buffer.byteLength(value, "utf8"); }
function bounded(value, maximum, minimum = 1) { return typeof value === "string" && bytes(value) >= minimum && bytes(value) <= maximum; }
function keyBuffer(value) {
  const key = Buffer.isBuffer(value) ? Buffer.from(value) : value instanceof Uint8Array ? Buffer.from(value) : null;
  if (!key || key.byteLength !== 32) throw new Error("provider session encryption key must contain exactly 32 bytes");
  return key;
}
function principal(value) {
  if (!value || typeof value !== "object" || !principalPattern.test(value.id ?? "") || !Array.isArray(value.roles) || value.roles.length < 1 || value.roles.length > 8 || !value.roles.every((role) => rolePattern.test(role))) throw new Error("invalid provider session principal");
  const name = typeof value.name === "string" && value.name.length >= 1 && value.name.length <= 128 ? value.name : value.id;
  return { id: value.id, name, roles: [...new Set(value.roles)] };
}
function providerSession(value, now) {
  if (!value || typeof value !== "object" || !providerPattern.test(value.provider ?? "") || !providerUserPattern.test(value.providerUserId ?? "") || !bounded(value.accessToken, maximumProviderTokenBytes) || !bounded(value.refreshToken, maximumProviderTokenBytes, minimumProviderRefreshTokenBytes) || !Number.isSafeInteger(value.expiresAt) || value.expiresAt <= now()) throw new Error("invalid provider session material");
  return { provider: value.provider, providerUserId: value.providerUserId, accessToken: value.accessToken, refreshToken: value.refreshToken, expiresAt: value.expiresAt };
}
function token(value, label) {
  if (!opaquePattern.test(value ?? "")) throw new Error(`invalid ${label}`);
  return value;
}
function aad(sessionId, provider, providerUserId) { return Buffer.from(`luastra-provider-session:v1:${sessionId}:${provider}:${providerUserId}`, "utf8"); }
function encrypt(key, random, sessionId, material) {
  const nonce = Buffer.from(random(12));
  if (nonce.byteLength !== 12) throw new Error("provider session nonce source returned an invalid value");
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(aad(sessionId, material.provider, material.providerUserId));
  const plaintext = Buffer.from(JSON.stringify({ accessToken: material.accessToken, refreshToken: material.refreshToken }), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return JSON.stringify({ version: 1, nonce: nonce.toString("base64url"), ciphertext: ciphertext.toString("base64url"), tag: cipher.getAuthTag().toString("base64url") });
}
function decrypt(key, sessionId, row) {
  try {
    const envelope = JSON.parse(row.encrypted_material);
    if (envelope?.version !== 1 || typeof envelope.nonce !== "string" || typeof envelope.ciphertext !== "string" || typeof envelope.tag !== "string") throw new Error("invalid envelope");
    const nonce = Buffer.from(envelope.nonce, "base64url");
    const ciphertext = Buffer.from(envelope.ciphertext, "base64url");
    const tag = Buffer.from(envelope.tag, "base64url");
    if (nonce.byteLength !== 12 || tag.byteLength !== 16 || ciphertext.byteLength === 0 || ciphertext.byteLength > maximumProviderTokenBytes * 2 + 256) throw new Error("invalid envelope");
    const decipher = createDecipheriv("aes-256-gcm", key, nonce);
    decipher.setAAD(aad(sessionId, row.provider, row.provider_user_id));
    decipher.setAuthTag(tag);
    const decoded = JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8"));
    if (!bounded(decoded?.accessToken, maximumProviderTokenBytes) || !bounded(decoded?.refreshToken, maximumProviderTokenBytes, minimumProviderRefreshTokenBytes)) throw new Error("invalid material");
    return { provider: row.provider, providerUserId: row.provider_user_id, accessToken: decoded.accessToken, refreshToken: decoded.refreshToken, expiresAt: Number(row.provider_expires_at) };
  } catch {
    throw new Error("provider session material could not be authenticated");
  }
}
function safeRoles(value) {
  try {
    const roles = JSON.parse(value);
    if (!Array.isArray(roles) || roles.length < 1 || roles.length > 8 || !roles.every((role) => rolePattern.test(role))) throw new Error("invalid roles");
    return Object.freeze([...roles]);
  } catch { throw new Error("provider session contains invalid roles"); }
}

export function createProviderSessionStore({ path, encryptionKey, now = () => Date.now(), randomToken = () => randomBytes(32).toString("base64url"), randomBytesImpl = randomBytes, randomId = randomUUID } = {}) {
  if (!bounded(path, 4096) || typeof now !== "function" || typeof randomToken !== "function" || typeof randomBytesImpl !== "function" || typeof randomId !== "function") throw new Error("invalid provider session store configuration");
  const key = keyBuffer(encryptionKey);
  const databasePath = resolve(path);
  mkdirSync(dirname(databasePath), { recursive: true });
  const sqlite = new DatabaseSync(databasePath);
  sqlite.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS luastra_provider_sessions (
      session_id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL UNIQUE,
      principal_id TEXT NOT NULL,
      principal_name TEXT NOT NULL,
      roles_json TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_user_id TEXT NOT NULL,
      encrypted_material TEXT NOT NULL,
      provider_expires_at INTEGER NOT NULL,
      session_expires_at INTEGER NOT NULL,
      refresh_lease_hash TEXT,
      refresh_lease_until INTEGER,
      revision INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS luastra_provider_sessions_expiry ON luastra_provider_sessions(session_expires_at);
  `);
  if (!sqlite.prepare("PRAGMA table_info(luastra_provider_sessions)").all().some((column) => column.name === "principal_name")) {
    sqlite.exec("ALTER TABLE luastra_provider_sessions ADD COLUMN principal_name TEXT NOT NULL DEFAULT ''; UPDATE luastra_provider_sessions SET principal_name = principal_id WHERE principal_name = '';");
  }
  const insert = sqlite.prepare("INSERT INTO luastra_provider_sessions (session_id, token_hash, principal_id, principal_name, roles_json, provider, provider_user_id, encrypted_material, provider_expires_at, session_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const findToken = sqlite.prepare("SELECT * FROM luastra_provider_sessions WHERE token_hash = ?");
  const findId = sqlite.prepare("SELECT * FROM luastra_provider_sessions WHERE session_id = ?");
  const removeId = sqlite.prepare("DELETE FROM luastra_provider_sessions WHERE session_id = ?");
  const removeExpired = sqlite.prepare("DELETE FROM luastra_provider_sessions WHERE session_expires_at <= ?");
  const acquireLease = sqlite.prepare("UPDATE luastra_provider_sessions SET refresh_lease_hash = ?, refresh_lease_until = ? WHERE session_id = ? AND revision = ? AND (refresh_lease_until IS NULL OR refresh_lease_until <= ?)");
  const finishLease = sqlite.prepare("UPDATE luastra_provider_sessions SET principal_name = ?, roles_json = ?, encrypted_material = ?, provider_expires_at = ?, refresh_lease_hash = NULL, refresh_lease_until = NULL, revision = revision + 1 WHERE session_id = ? AND refresh_lease_hash = ? AND refresh_lease_until > ? AND session_expires_at > ?");
  const clearLease = sqlite.prepare("UPDATE luastra_provider_sessions SET refresh_lease_hash = NULL, refresh_lease_until = NULL WHERE session_id = ? AND refresh_lease_hash = ?");
  let closed = false;
  const open = () => { if (closed) throw new Error("provider session store is closed"); };
  const transaction = (operation) => {
    sqlite.exec("BEGIN IMMEDIATE");
    try { const result = operation(); sqlite.exec("COMMIT"); return result; }
    catch (error) { sqlite.exec("ROLLBACK"); throw error; }
  };
  const activeRow = (opaqueToken) => {
    open();
    if (!opaquePattern.test(opaqueToken ?? "")) return null;
    const row = findToken.get(digest(opaqueToken));
    if (!row) return null;
    if (Number(row.session_expires_at) <= now()) { removeId.run(row.session_id); return null; }
    return row;
  };
  const activeSession = (sessionId) => {
    open();
    if (!opaquePattern.test(sessionId ?? "")) return null;
    const row = findId.get(sessionId);
    if (!row) return null;
    if (Number(row.session_expires_at) <= now()) { removeId.run(row.session_id); return null; }
    return row;
  };
  const resolvePrincipal = (opaqueToken) => {
    const row = activeRow(opaqueToken);
    return row ? Object.freeze({ id: row.principal_id, name: row.principal_name, roles: safeRoles(row.roles_json), session: row.session_id, expiresAt: Number(row.session_expires_at) }) : null;
  };
  return Object.freeze({
    issue(principalValue, providerValue, { ttlMs = defaultTtlMs } = {}) {
      open();
      const owner = principal(principalValue);
      const material = providerSession(providerValue, now);
      if (!Number.isSafeInteger(ttlMs) || ttlMs < 1000 || ttlMs > maximumTtlMs) throw new Error("invalid provider session TTL");
      const opaqueToken = token(randomToken(), "generated provider session token");
      const sessionId = token(randomId().replaceAll("-", "_"), "generated provider session ID");
      const expiresAt = now() + ttlMs;
      insert.run(sessionId, digest(opaqueToken), owner.id, owner.name, JSON.stringify(owner.roles), material.provider, material.providerUserId, encrypt(key, randomBytesImpl, sessionId, material), material.expiresAt, expiresAt);
      return Object.freeze({ token: opaqueToken, expiresAt });
    },
    resolve: resolvePrincipal,
    resolveAuthorization(header) {
      if (typeof header !== "string") return null;
      const match = /^Bearer ([A-Za-z0-9_-]{32,256})$/.exec(header);
      return match ? resolvePrincipal(match[1]) : null;
    },
    readProvider(opaqueToken) {
      const row = activeRow(opaqueToken);
      return row ? Object.freeze({ sessionId: row.session_id, revision: Number(row.revision), ...decrypt(key, row.session_id, row) }) : null;
    },
    readProviderSession(sessionId) {
      const row = activeSession(sessionId);
      return row ? Object.freeze({ sessionId: row.session_id, revision: Number(row.revision), ...decrypt(key, row.session_id, row) }) : null;
    },
    beginRefresh(opaqueToken, { refreshWithinMs = 60_000, leaseMs = 15_000 } = {}) {
      open();
      if (!Number.isSafeInteger(refreshWithinMs) || refreshWithinMs < 0 || refreshWithinMs > 60 * 60 * 1000 || !Number.isSafeInteger(leaseMs) || leaseMs < 1000 || leaseMs > 60_000) throw new Error("invalid provider refresh lease");
      return transaction(() => {
        const row = activeRow(opaqueToken);
        if (!row) return Object.freeze({ state: "invalid" });
        const material = Object.freeze({ sessionId: row.session_id, revision: Number(row.revision), ...decrypt(key, row.session_id, row) });
        const current = now();
        if (material.expiresAt > current + refreshWithinMs) return Object.freeze({ state: "fresh", provider: material });
        if (row.refresh_lease_until !== null && Number(row.refresh_lease_until) > current) return Object.freeze({ state: "busy" });
        const lease = token(randomToken(), "generated provider refresh lease");
        const changed = Number(acquireLease.run(digest(lease), current + leaseMs, row.session_id, Number(row.revision), current).changes);
        return changed === 1 ? Object.freeze({ state: "acquired", lease, provider: material }) : Object.freeze({ state: "busy" });
      });
    },
    completeRefresh(sessionId, lease, providerValue, { principal: principalValue = null } = {}) {
      open(); token(sessionId, "provider session ID"); token(lease, "provider refresh lease");
      const row = findId.get(sessionId);
      if (!row) return false;
      const expected = Buffer.from(row.refresh_lease_hash ?? "", "utf8");
      const supplied = Buffer.from(digest(lease), "utf8");
      if (expected.byteLength !== supplied.byteLength || !timingSafeEqual(expected, supplied)) return false;
      const material = providerSession(providerValue, now);
      if (material.provider !== row.provider || material.providerUserId !== row.provider_user_id) throw new Error("refreshed provider identity changed");
      const owner = principalValue === null ? { id: row.principal_id, name: row.principal_name, roles: [...safeRoles(row.roles_json)] } : principal(principalValue);
      if (owner.id !== row.principal_id) throw new Error("refreshed principal identity changed");
      const current = now();
      return Number(finishLease.run(owner.name, JSON.stringify(owner.roles), encrypt(key, randomBytesImpl, sessionId, material), material.expiresAt, sessionId, supplied.toString("utf8"), current, current).changes) === 1;
    },
    abortRefresh(sessionId, lease) {
      open(); token(sessionId, "provider session ID"); token(lease, "provider refresh lease");
      return Number(clearLease.run(sessionId, digest(lease)).changes) === 1;
    },
    revoke(sessionId) { open(); return opaquePattern.test(sessionId ?? "") && Number(removeId.run(sessionId).changes) === 1; },
    prune() { open(); return Number(removeExpired.run(now()).changes); },
    close() { if (!closed) { closed = true; key.fill(0); sqlite.close(); } },
  });
}

export const providerSessionLimits = Object.freeze({ defaultTtlMs, maximumTtlMs, maximumProviderTokenBytes, encryption: "AES-256-GCM", tokenDigest: "SHA-256" });
