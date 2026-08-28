import { createHash, randomBytes } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

const contentIdPattern = /^[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;
const tokenPattern = /^[A-Za-z0-9_-]{32,256}$/;
const maximumGrants = 256;
const defaultTtlMs = 60 * 1000;
const maximumTtlMs = 60 * 1000;

function digest(value) { return createHash("sha256").update(value).digest("hex"); }

export function createContentGrantStore({ items = [], now = () => Date.now(), randomToken = () => randomBytes(32).toString("base64url") } = {}) {
  if (!Array.isArray(items)) throw new Error("content items must be an array");
  const byId = new Map();
  for (const item of items) {
    if (!item || typeof item !== "object" || !contentIdPattern.test(item.id ?? "") || byId.has(item.id) || typeof item.path !== "string" || typeof item.mediaType !== "string" || !Number.isSafeInteger(item.bytes) || item.bytes < 1) throw new Error("invalid or duplicate protected content item");
    byId.set(item.id, Object.freeze({ ...item }));
  }
  const grants = new Map();
  const prune = () => {
    const current = now();
    for (const [tokenHash, grant] of grants) if (grant.expiresAt <= current) grants.delete(tokenHash);
    while (grants.size >= maximumGrants) grants.delete(grants.keys().next().value);
  };
  const issue = (id, { ttlMs = defaultTtlMs } = {}) => {
    if (!contentIdPattern.test(id ?? "") || !byId.has(id)) throw new Error("unknown protected content item");
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 1000 || ttlMs > maximumTtlMs) throw new Error("invalid content grant TTL");
    prune();
    const token = randomToken();
    if (!tokenPattern.test(token) || grants.has(digest(token))) throw new Error("invalid generated content token");
    const item = byId.get(id);
    const bytes = readFileSync(item.path);
    if (bytes.byteLength !== item.bytes || digest(bytes) !== item.sha256) throw new Error("protected content integrity mismatch");
    const admittedStat = statSync(item.path);
    const expiresAt = now() + ttlMs;
    grants.set(digest(token), Object.freeze({ item: Object.freeze({ ...item, mtimeMs: admittedStat.mtimeMs }), expiresAt }));
    return Object.freeze({ source: `content:${token}`, expiresAt });
  };
  const resolve = (token) => {
    if (!tokenPattern.test(token ?? "")) return null;
    prune();
    const tokenHash = digest(token);
    const grant = grants.get(tokenHash);
    if (!grant) return null;
    const current = (() => { try { return statSync(grant.item.path); } catch { return null; } })();
    if (!current?.isFile() || current.size !== grant.item.bytes || current.mtimeMs !== grant.item.mtimeMs) {
      grants.delete(tokenHash);
      return null;
    }
    return grant.item;
  };
  const dispose = () => grants.clear();
  return Object.freeze({ issue, resolve, dispose, get size() { prune(); return grants.size; } });
}

export const contentGrantLimits = Object.freeze({ maximumGrants, defaultTtlMs, maximumTtlMs });
