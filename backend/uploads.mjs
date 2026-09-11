import { createHash, randomBytes } from "node:crypto";
import { link, mkdir, open, readFile, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { inspectRasterImage } from "../platform/content/image-admission.mjs";

const idPattern = /^[a-z][a-z0-9_-]{0,63}$/;
const tokenPattern = /^[A-Za-z0-9_-]{32,256}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const mediaTypes = new Set(["image/jpeg", "image/png"]);
const maximumIntents = 64;
const maximumConcurrentUploads = 4;
const defaultIntentTtlMs = 5 * 60 * 1000;
const maximumIntentTtlMs = 15 * 60 * 1000;

function fail(message) { throw new Error(message); }
function digest(value) { return createHash("sha256").update(value).digest("hex"); }
function samePrincipal(left, right) { return typeof left?.id === "string" && left.id !== "" && left.id === right?.id; }
function extension(type) { return type === "image/png" ? ".png" : type === "image/jpeg" ? ".jpg" : fail("unsupported upload media type"); }
function admittedMetadata(value, declaration) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join("\n") !== "bytes\nheight\nmediaType\nwidth") fail("invalid upload metadata");
  if (!declaration.mediaTypes.includes(value.mediaType) || !mediaTypes.has(value.mediaType) || !Number.isSafeInteger(value.bytes) || value.bytes < 14 || value.bytes > declaration.maximumBytes ||
      !Number.isSafeInteger(value.width) || value.width < 1 || value.width > declaration.maximumWidth || !Number.isSafeInteger(value.height) || value.height < 1 || value.height > declaration.maximumHeight ||
      value.width * value.height > declaration.maximumPixels) fail("upload metadata exceeds its declaration");
  return Object.freeze({ mediaType: value.mediaType, bytes: value.bytes, width: value.width, height: value.height });
}
function imageResult(objectId, grant, metadata) {
  return Object.freeze({ objectId, source: grant.source, mediaType: metadata.mediaType, bytes: metadata.bytes, width: metadata.width, height: metadata.height, orientation: metadata.orientation });
}

export function createContentUploadStore({
  declarations = [],
  localRoot,
  content,
  remote = null,
  now = () => Date.now(),
  randomToken = () => randomBytes(32).toString("base64url"),
} = {}) {
  if (!Array.isArray(declarations) || declarations.length > 32 || typeof localRoot !== "string" || localRoot.length === 0 || !content || typeof content.issueItem !== "function" || typeof now !== "function" || typeof randomToken !== "function") fail("invalid content upload store configuration");
  if (remote !== null && (!remote || typeof remote.upload !== "function" || typeof remote.inspect !== "function" || typeof remote.delete !== "function")) fail("invalid remote upload adapter");
  const byPurpose = new Map();
  for (const declaration of declarations) {
    if (!declaration || typeof declaration !== "object" || !idPattern.test(declaration.id ?? "") || byPurpose.has(declaration.id) || !["local", "supabase"].includes(declaration.provider) || !Array.isArray(declaration.mediaTypes) || declaration.mediaTypes.length < 1 || declaration.mediaTypes.length > 2 || new Set(declaration.mediaTypes).size !== declaration.mediaTypes.length || !declaration.mediaTypes.every((item) => mediaTypes.has(item)) ||
        !Number.isSafeInteger(declaration.maximumBytes) || declaration.maximumBytes < 14 || declaration.maximumBytes > 25 * 1024 * 1024 || !Number.isSafeInteger(declaration.maximumWidth) || declaration.maximumWidth < 1 || declaration.maximumWidth > 8192 || !Number.isSafeInteger(declaration.maximumHeight) || declaration.maximumHeight < 1 || declaration.maximumHeight > 8192 ||
        !Number.isSafeInteger(declaration.maximumPixels) || declaration.maximumPixels < 1 || declaration.maximumPixels > 40 * 1024 * 1024 || !Number.isSafeInteger(declaration.intentTtlMs) || declaration.intentTtlMs < 1000 || declaration.intentTtlMs > maximumIntentTtlMs ||
        (declaration.provider === "supabase" && (typeof declaration.bucket !== "string" || typeof declaration.prefix !== "string"))) fail("invalid content upload declaration");
    byPurpose.set(declaration.id, Object.freeze({ ...declaration, mediaTypes: Object.freeze([...declaration.mediaTypes]) }));
  }
  const intents = new Map();
  let activeUploads = 0;
  let disposed = false;
  const objectPath = (declaration, principal, objectId, pending = false, type = "image/jpeg") => resolve(localRoot, declaration.id, digest(principal.id), `${objectId}${pending ? ".pending" : extension(type)}`);
  const removeIntentObject = async (intent) => {
    if (!intent) return;
    if (intent.declaration.provider === "local") await rm(intent.pendingPath, { force: true }).catch(() => {});
    else await remote?.delete(intent, { principal: intent.principal }).catch(() => {});
  };
  const prune = async () => {
    const expired = [];
    for (const [hash, intent] of intents) {
      if (intent.expiresAt > now() || intent.state === "uploading") continue;
      intents.delete(hash);
      if (intent.state !== "committed") expired.push(removeIntentObject(intent));
    }
    while (intents.size >= maximumIntents) {
      const candidate = [...intents.entries()].find(([, intent]) => intent.state !== "uploading");
      if (!candidate) fail("upload intent capacity reached");
      const [hash, intent] = candidate;
      intents.delete(hash);
      if (intent.state !== "committed") expired.push(removeIntentObject(intent));
    }
    await Promise.all(expired);
  };
  const declaration = (purpose) => {
    if (!idPattern.test(purpose ?? "") || !byPurpose.has(purpose)) fail("unknown upload purpose");
    return byPurpose.get(purpose);
  };
  const ownedIntent = (token, principal) => {
    if (!tokenPattern.test(token ?? "")) return null;
    const intent = intents.get(digest(token));
    return intent && intent.expiresAt > now() && samePrincipal(intent.principal, principal) ? intent : null;
  };
  const createIntent = async (purpose, metadata, { principal, ttlMs = null } = {}) => {
    if (disposed) fail("content upload store is disposed");
    if (typeof principal?.id !== "string" || principal.id.length < 1) fail("authenticated principal required");
    const admitted = declaration(purpose);
    if (admitted.provider === "supabase" && !uuidPattern.test(principal.id)) fail("Supabase uploads require a UUID principal");
    const selected = admittedMetadata(metadata, admitted);
    const effectiveTtl = ttlMs ?? admitted.intentTtlMs;
    if (!Number.isSafeInteger(effectiveTtl) || effectiveTtl < 1000 || effectiveTtl > admitted.intentTtlMs) fail("invalid upload intent TTL");
    await prune();
    const token = randomToken();
    const objectId = randomToken();
    if (!tokenPattern.test(token) || !tokenPattern.test(objectId) || intents.has(digest(token))) fail("invalid generated upload identifier");
    const intent = {
      declaration: admitted, principal: Object.freeze({ id: principal.id }), metadata: selected, objectId,
      pendingPath: admitted.provider === "local" ? objectPath(admitted, principal, objectId, true, selected.mediaType) : null,
      state: "created", expiresAt: now() + effectiveTtl, uploadedMetadata: null,
    };
    intents.set(digest(token), intent);
    return Object.freeze({ handle: `upload:${token}`, expiresAt: intent.expiresAt });
  };
  const receiveLocal = async (intent, body, signal) => {
    await mkdir(resolve(intent.pendingPath, ".."), { recursive: true });
    const file = await open(intent.pendingPath, "wx", 0o600);
    let received = 0;
    try {
      for await (const chunkValue of body) {
        if (signal?.aborted) fail("upload was cancelled");
        const chunk = Buffer.from(chunkValue);
        received += chunk.byteLength;
        if (received > intent.metadata.bytes || received > intent.declaration.maximumBytes) fail("upload body exceeds its intent");
        await file.write(chunk);
      }
    } catch (error) {
      await file.close().catch(() => {});
      await rm(intent.pendingPath, { force: true }).catch(() => {});
      throw error;
    }
    await file.close();
    if (received !== intent.metadata.bytes) { await rm(intent.pendingPath, { force: true }); fail("upload body size does not match its intent"); }
    const bytes = await readFile(intent.pendingPath);
    const inspected = inspectRasterImage(bytes, {
      declaredMediaType: intent.metadata.mediaType, maximumBytes: intent.declaration.maximumBytes,
      maximumWidth: intent.declaration.maximumWidth, maximumHeight: intent.declaration.maximumHeight, maximumPixels: intent.declaration.maximumPixels,
    });
    if (inspected.width !== intent.metadata.width || inspected.height !== intent.metadata.height) { await rm(intent.pendingPath, { force: true }); fail("upload dimensions do not match its intent"); }
    return Object.freeze({ ...inspected, sha256: digest(bytes) });
  };
  const receive = async (token, { principal, mediaType, contentLength, body, signal = null } = {}) => {
    if (disposed) fail("content upload store is disposed");
    await prune();
    const intent = ownedIntent(token, principal);
    if (!intent || intent.state !== "created") fail("upload intent is unavailable");
    if (signal?.aborted) fail("upload was cancelled");
    if (mediaType !== intent.metadata.mediaType || contentLength !== intent.metadata.bytes || !body || typeof body[Symbol.asyncIterator] !== "function") fail("upload request does not match its intent");
    if (activeUploads >= maximumConcurrentUploads) fail("upload concurrency limit reached");
    activeUploads += 1;
    intent.state = "uploading";
    try {
      intent.uploadedMetadata = intent.declaration.provider === "local"
        ? await receiveLocal(intent, body, signal)
        : await remote.upload(intent, { principal, mediaType, contentLength, body, signal });
      intent.state = "uploaded";
      return Object.freeze({ status: "uploaded", bytes: intent.uploadedMetadata.bytes });
    } catch (error) {
      intents.delete(digest(token));
      await removeIntentObject(intent);
      throw error;
    } finally { activeUploads -= 1; }
  };
  const itemFor = (declarationValue, principal, objectId, metadata) => declarationValue.provider === "local"
    ? { id: `${declarationValue.id}/${objectId}`, provider: "local", path: objectPath(declarationValue, principal, objectId, false, metadata.mediaType), ...metadata }
    : { id: `${declarationValue.id}/${objectId}`, provider: "supabase", uploadId: declarationValue.id, bucket: declarationValue.bucket, path: `${declarationValue.prefix}/${principal.id}/${objectId}${extension(metadata.mediaType)}`, ...metadata };
  const commit = async (handle, { principal, signal = null } = {}) => {
    const token = typeof handle === "string" && handle.startsWith("upload:") ? handle.slice(7) : "";
    await prune();
    const intent = ownedIntent(token, principal);
    if (!intent || intent.state !== "uploaded" || signal?.aborted) fail("uploaded intent is unavailable");
    let metadata = intent.uploadedMetadata;
    if (intent.declaration.provider === "local") {
      const finalPath = objectPath(intent.declaration, principal, intent.objectId, false, metadata.mediaType);
      await link(intent.pendingPath, finalPath);
      await rm(intent.pendingPath, { force: true });
    } else metadata = await remote.inspect(intent, { principal, signal });
    intent.state = "committed";
    intents.delete(digest(token));
    const item = itemFor(intent.declaration, principal, intent.objectId, metadata);
    const grant = await content.issueItem(item, { principal, signal });
    return imageResult(intent.objectId, grant, metadata);
  };
  const openUploaded = async (purpose, objectId, metadata, { principal, signal = null } = {}) => {
    const admitted = declaration(purpose);
    if (!tokenPattern.test(objectId ?? "") || typeof principal?.id !== "string") fail("invalid uploaded object reference");
    const selected = admittedMetadata(metadata, admitted);
    let verified = selected;
    const item = itemFor(admitted, principal, objectId, selected);
    if (admitted.provider === "local") {
      const bytes = await readFile(item.path);
      verified = Object.freeze({ ...inspectRasterImage(bytes, { declaredMediaType: selected.mediaType, maximumBytes: admitted.maximumBytes, maximumWidth: admitted.maximumWidth, maximumHeight: admitted.maximumHeight, maximumPixels: admitted.maximumPixels }), sha256: digest(bytes) });
      if (verified.bytes !== selected.bytes || verified.width !== selected.width || verified.height !== selected.height) fail("uploaded object metadata changed");
    } else verified = await remote.inspect({ declaration: admitted, principal: { id: principal.id }, objectId, metadata: selected }, { principal, signal });
    return imageResult(objectId, await content.issueItem({ ...item, ...verified }, { principal, signal }), verified);
  };
  const deleteUploaded = async (purpose, objectId, metadata, { principal, signal = null } = {}) => {
    const admitted = declaration(purpose);
    if (!tokenPattern.test(objectId ?? "") || typeof principal?.id !== "string") fail("invalid uploaded object reference");
    const selected = admittedMetadata(metadata, admitted);
    if (admitted.provider === "local") {
      const target = objectPath(admitted, principal, objectId, false, selected.mediaType);
      const existing = await stat(target).catch(() => null);
      if (!existing?.isFile()) return false;
      await rm(target, { force: true });
      return true;
    }
    return remote.delete({ declaration: admitted, principal: { id: principal.id }, objectId, metadata: selected }, { principal, signal });
  };
  const dispose = async () => {
    if (disposed) return;
    disposed = true;
    const pending = [...intents.values()].filter((intent) => intent.state !== "committed").map(removeIntentObject);
    intents.clear();
    await Promise.all(pending);
  };
  return Object.freeze({ createIntent, receive, commit, openUploaded, deleteUploaded, cleanup: prune, dispose, get pendingIntents() { return intents.size; }, get activeUploads() { return activeUploads; } });
}

export const contentUploadLimits = Object.freeze({ maximumIntents, maximumConcurrentUploads, defaultIntentTtlMs, maximumIntentTtlMs });
