import { createHash, randomBytes } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

const contentIdPattern = /^[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;
const tokenPattern = /^[A-Za-z0-9_-]{32,256}$/;
const maximumGrants = 256;
const defaultTtlMs = 60 * 1000;
const maximumTtlMs = 60 * 1000;
const imageMediaTypes = new Set(["image/avif", "image/jpeg", "image/png", "image/webp"]);

function digest(value) { return createHash("sha256").update(value).digest("hex"); }
function admittedItem(item) {
  const remote = item?.provider === "supabase";
  if (!item || typeof item !== "object" || typeof item.id !== "string" || item.id.length < 1 || item.id.length > 512 || typeof item.mediaType !== "string" || !Number.isSafeInteger(item.bytes) || item.bytes < 4 || item.bytes > 25 * 1024 * 1024 ||
      (remote ? (!imageMediaTypes.has(item.mediaType) || typeof item.bucket !== "string" || typeof item.path !== "string" || !Number.isSafeInteger(item.width) || item.width < 1 || item.width > 8192 || !Number.isSafeInteger(item.height) || item.height < 1 || item.height > 8192 || item.width * item.height > 40 * 1024 * 1024) : typeof item.path !== "string" || typeof item.sha256 !== "string")) throw new Error("invalid protected content item");
  return Object.freeze({ ...item });
}

export function createContentGrantStore({ items = [], createRemoteDelivery = null, now = () => Date.now(), randomToken = () => randomBytes(32).toString("base64url") } = {}) {
  if (!Array.isArray(items)) throw new Error("content items must be an array");
  if (createRemoteDelivery !== null && typeof createRemoteDelivery !== "function") throw new Error("remote content delivery must be a function");
  const byId = new Map();
  for (const item of items) {
    if (!contentIdPattern.test(item?.id ?? "") || byId.has(item.id)) throw new Error("invalid or duplicate protected content item");
    byId.set(item.id, admittedItem(item));
  }
  const grants = new Map();
  const prune = () => {
    const current = now();
    for (const [tokenHash, grant] of grants) if (grant.expiresAt <= current) grants.delete(tokenHash);
    while (grants.size >= maximumGrants) grants.delete(grants.keys().next().value);
  };
  const storeGrant = (token, item, expiresAt) => {
    if (!tokenPattern.test(token) || grants.has(digest(token))) throw new Error("invalid generated content token");
    grants.set(digest(token), Object.freeze({ item: Object.freeze(item), expiresAt }));
    return Object.freeze({
      source: `content:${token}`,
      expiresAt,
      metadata: item.provider === "supabase" ? Object.freeze({ mediaType: item.mediaType, bytes: item.bytes, width: item.width, height: item.height, orientation: item.orientation ?? "normal", placeholderColor: item.placeholderColor ?? null }) : null,
    });
  };
  const issueItem = (itemValue, { ttlMs = defaultTtlMs, principal = null, signal = null } = {}) => {
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 1000 || ttlMs > maximumTtlMs) throw new Error("invalid content grant TTL");
    prune();
    const item = admittedItem(itemValue);
    if (item.provider === "supabase") {
      if (ttlMs < 10_000) throw new Error("remote content grants require a TTL of at least 10000 milliseconds");
      if (createRemoteDelivery === null) throw new Error("remote content provider is unavailable");
      return (async () => {
        const delivery = await createRemoteDelivery(item, { ttlMs, principal, signal });
        if (!delivery || typeof delivery.deliveryUrl !== "string" || delivery.deliveryUrl.length > 4096 || !Number.isSafeInteger(delivery.expiresAt) || delivery.expiresAt <= now() || delivery.expiresAt > now() + ttlMs) throw new Error("remote content provider returned an invalid delivery");
        prune();
        return storeGrant(randomToken(), { ...item, deliveryUrl: delivery.deliveryUrl }, delivery.expiresAt);
      })();
    }
    const bytes = readFileSync(item.path);
    if (bytes.byteLength !== item.bytes || digest(bytes) !== item.sha256) throw new Error("protected content integrity mismatch");
    const admittedStat = statSync(item.path);
    const expiresAt = now() + ttlMs;
    return storeGrant(randomToken(), { ...item, mtimeMs: admittedStat.mtimeMs }, expiresAt);
  };
  const issue = (id, options = {}) => {
    if (!contentIdPattern.test(id ?? "") || !byId.has(id)) throw new Error("unknown protected content item");
    return issueItem(byId.get(id), options);
  };
  const resolve = (token) => {
    if (!tokenPattern.test(token ?? "")) return null;
    prune();
    const tokenHash = digest(token);
    const grant = grants.get(tokenHash);
    if (!grant) return null;
    if (grant.item.provider === "supabase") return grant.item;
    const current = (() => { try { return statSync(grant.item.path); } catch { return null; } })();
    if (!current?.isFile() || current.size !== grant.item.bytes || current.mtimeMs !== grant.item.mtimeMs) {
      grants.delete(tokenHash);
      return null;
    }
    return grant.item;
  };
  const dispose = () => grants.clear();
  return Object.freeze({ issue, issueItem, resolve, dispose, get size() { prune(); return grants.size; } });
}

export const contentGrantLimits = Object.freeze({ maximumGrants, defaultTtlMs, maximumTtlMs });
