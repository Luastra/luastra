const kinds = new Set(["audio", "font", "image"]);
const mediaKind = (mediaType) => typeof mediaType === "string" ? mediaType.split("/", 1)[0] : "";
const referencePattern = /^asset:([a-z][a-z0-9_-]*(?:\/[a-z][a-z0-9_-]*)*)$/;
const safePathPattern = /^assets\/[a-z][a-z0-9_-]*(?:\/[a-z][a-z0-9_-]*)*\.(?:avif|jpg|m4a|mp3|ogg|png|wav|webp|woff2)$/;

function exactKeys(value, expected) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\n") === [...expected].sort().join("\n");
}

function validateManifest(value) {
  if (!exactKeys(value, ["schemaVersion", "project", "assets"]) || value.schemaVersion !== 2 || typeof value.project !== "string" || !Array.isArray(value.assets)) {
    throw new Error("invalid project asset manifest");
  }
  const byId = new Map();
  for (const entry of value.assets) {
    if (!exactKeys(entry, ["id", "kind", "path", "mediaType", "bytes", "sha256"]) || !referencePattern.test(`asset:${entry.id ?? ""}`) ||
        !kinds.has(entry.kind) || mediaKind(entry.mediaType) !== entry.kind || !safePathPattern.test(entry.path ?? "") ||
        !Number.isInteger(entry.bytes) || entry.bytes < 4 || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "") || byId.has(entry.id)) {
      throw new Error("invalid project asset entry");
    }
    byId.set(entry.id, Object.freeze({ ...entry }));
  }
  return Object.freeze({ project: value.project, byId });
}

export function createProjectAssetRegistry({ fetchImpl = globalThis.fetch?.bind(globalThis), manifestUrls = null, assetBaseUrl = import.meta.url } = {}) {
  if (typeof fetchImpl !== "function") throw new Error("asset registry requires fetch");
  const urls = manifestUrls ?? [new URL("../../bundle/project-assets.json", import.meta.url), new URL("../../project-assets.json", import.meta.url)];
  if (!Array.isArray(urls) || urls.length < 1 || urls.some((url) => !(url instanceof URL) && typeof url !== "string")) throw new Error("invalid asset manifest locations");
  let loaded = null;
  let manifest = null;
  const load = async () => {
    if (loaded) return loaded;
    loaded = (async () => {
      for (const url of urls) {
        try {
          const response = await fetchImpl(url, { cache: "no-store" });
          if (response?.ok) { manifest = validateManifest(await response.json()); return manifest; }
        } catch {}
      }
      throw new Error("project asset manifest unavailable");
    })();
    try { return await loaded; } catch (cause) { loaded = null; throw cause; }
  };
  const resolveLoaded = (reference, expectedKind) => {
    if (!kinds.has(expectedKind)) throw new Error("invalid expected asset kind");
    const match = referencePattern.exec(reference ?? "");
    if (!match) throw new Error("invalid asset reference");
    if (!manifest) throw new Error("project asset manifest is not loaded");
    const asset = manifest.byId.get(match[1]);
    if (!asset || asset.kind !== expectedKind) throw new Error(`asset is not admitted ${expectedKind}`);
    return Object.freeze({ ...asset, url: new URL(`../../${asset.path}`, assetBaseUrl).href });
  };
  const resolve = async (reference, expectedKind) => { await load(); return resolveLoaded(reference, expectedKind); };
  return Object.freeze({ load, resolve, resolveLoaded });
}
