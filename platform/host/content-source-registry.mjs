const assetPattern = /^asset:[a-z][a-z0-9_-]*(?:\/[a-z][a-z0-9_-]*)*$/;
const contentPattern = /^content:([A-Za-z0-9_-]{32,256})$/;
const previewPattern = /^preview:[A-Za-z0-9_-]{32,256}$/;

function fail(message) { throw new Error(message); }

export function createContentSourceRegistry({ assetRegistry, baseUrl = globalThis.location?.href, resolvePreview = null } = {}) {
  if (!assetRegistry || typeof assetRegistry.resolveLoaded !== "function") fail("content source registry requires an asset registry");
  if (typeof baseUrl !== "string" || baseUrl.length === 0) fail("content source registry requires a base URL");
  if (resolvePreview !== null && typeof resolvePreview !== "function") fail("preview resolver must be a function");
  const previewsByReference = new Map();
  const previewsByUrl = new Map();

  const resolve = (reference, expectedKind) => {
    if (expectedKind !== "image") return assetRegistry.resolveLoaded(reference, expectedKind).url;
    if (assetPattern.test(reference ?? "")) return assetRegistry.resolveLoaded(reference, expectedKind).url;
    const protectedMatch = contentPattern.exec(reference ?? "");
    if (protectedMatch) return new URL(`/__luastra/content/${protectedMatch[1]}`, baseUrl).href;
    if (!previewPattern.test(reference ?? "") || resolvePreview === null) fail("image source is not available to this host");
    const cached = previewsByReference.get(reference);
    if (cached) return cached.url;
    const resolved = resolvePreview(reference);
    if (!resolved || typeof resolved.url !== "string" || typeof resolved.release !== "function") fail("preview resolver returned an invalid resource");
    let url;
    try { url = new URL(resolved.url, baseUrl); } catch { fail("preview resolver returned an invalid URL"); }
    const base = new URL(baseUrl);
    if (url.protocol !== "blob:" && url.origin !== base.origin) fail("preview resolver escaped the host origin");
    const entry = { reference, url: url.href, release: resolved.release, owners: 0 };
    previewsByReference.set(reference, entry);
    previewsByUrl.set(entry.url, entry);
    return entry.url;
  };

  const retain = (url) => {
    const entry = previewsByUrl.get(url);
    if (entry) entry.owners += 1;
  };
  const release = (url) => {
    const entry = previewsByUrl.get(url);
    if (!entry || entry.owners < 1) return;
    entry.owners -= 1;
    if (entry.owners !== 0) return;
    previewsByUrl.delete(entry.url);
    previewsByReference.delete(entry.reference);
    entry.release();
  };
  const dispose = () => {
    for (const entry of previewsByReference.values()) entry.release();
    previewsByReference.clear();
    previewsByUrl.clear();
  };
  return Object.freeze({ resolve, retain, release, dispose });
}
