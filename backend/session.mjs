import { createHash, randomBytes, randomUUID } from "node:crypto";

const rolePattern = /^[a-z][a-z0-9_-]{0,31}$/;
const principalPattern = /^[A-Za-z0-9][A-Za-z0-9_.@-]{0,127}$/;
const maximumSessions = 128;
const defaultTtlMs = 60 * 60 * 1000;
const maximumTtlMs = 30 * 24 * 60 * 60 * 1000;

function digest(token) { return createHash("sha256").update(token).digest("hex"); }
function clonePrincipal(value, sessionId, expiresAt) {
  return Object.freeze({ id: value.id, name: value.name, roles: Object.freeze([...value.roles]), session: sessionId, expiresAt });
}

export function createSessionStore({ now = () => Date.now(), randomToken = () => randomBytes(32).toString("base64url") } = {}) {
  const sessions = new Map();
  const byId = new Map();
  const prune = () => {
    const current = now();
    for (const [tokenHash, item] of sessions) {
      if (item.expiresAt <= current) {
        sessions.delete(tokenHash);
        byId.delete(item.sessionId);
      }
    }
    while (sessions.size >= maximumSessions) {
      const [tokenHash, item] = sessions.entries().next().value;
      sessions.delete(tokenHash);
      byId.delete(item.sessionId);
    }
  };
  const issue = (principal, { ttlMs = defaultTtlMs } = {}) => {
    if (!principal || typeof principal !== "object" || !principalPattern.test(principal.id ?? "") || !Array.isArray(principal.roles) || principal.roles.length < 1 || principal.roles.length > 8 || !principal.roles.every((role) => rolePattern.test(role))) {
      throw new Error("invalid session principal");
    }
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 1000 || ttlMs > maximumTtlMs) throw new Error("invalid session TTL");
    prune();
    const token = randomToken();
    if (typeof token !== "string" || token.length < 32 || token.length > 256) throw new Error("invalid generated session token");
    const tokenHash = digest(token);
    if (sessions.has(tokenHash)) throw new Error("duplicate generated session token");
    const sessionId = randomUUID();
    const expiresAt = now() + ttlMs;
    const name = typeof principal.name === "string" && principal.name.length >= 1 && principal.name.length <= 128 ? principal.name : principal.id;
    const item = { sessionId, principal: { id: principal.id, name, roles: [...new Set(principal.roles)] }, expiresAt };
    sessions.set(tokenHash, item);
    byId.set(sessionId, tokenHash);
    return Object.freeze({ token, expiresAt });
  };
  const resolve = (token) => {
    if (typeof token !== "string" || token.length < 32 || token.length > 256) return null;
    prune();
    const item = sessions.get(digest(token));
    return item ? clonePrincipal(item.principal, item.sessionId, item.expiresAt) : null;
  };
  const resolveAuthorization = (header) => {
    if (typeof header !== "string") return null;
    const match = /^Bearer ([A-Za-z0-9_-]{32,256})$/.exec(header);
    return match ? resolve(match[1]) : null;
  };
  const revoke = (sessionId) => {
    if (typeof sessionId !== "string") return false;
    const tokenHash = byId.get(sessionId);
    if (!tokenHash) return false;
    byId.delete(sessionId);
    return sessions.delete(tokenHash);
  };
  return Object.freeze({ issue, resolve, resolveAuthorization, revoke, get size() { prune(); return sessions.size; } });
}

export const sessionLimits = Object.freeze({ maximumSessions, defaultTtlMs, maximumTtlMs });
