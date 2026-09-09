// Shared route inventory for the planned 0.3 static documentation renderer.
// This module does not publish pages or change the current application routes.
export function documentationRoutes({ sections, pages, origin = "https://luastra.dev" }) {
  const base = new URL(origin);
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash || base.pathname !== "/") {
    throw new Error("documentation origin must be an HTTPS origin");
  }
  const segment = (value) => typeof value === "string" && /^[a-z0-9][a-z0-9-]*$/u.test(value);
  const sectionIds = new Set();
  const paths = new Set();
  const aliases = new Set();
  const result = [];
  const add = (record) => {
    if (paths.has(record.path)) throw new Error(`duplicate documentation path: ${record.path}`);
    for (const alias of record.legacyHashes) {
      if (aliases.has(alias)) throw new Error(`duplicate documentation alias: ${alias}`);
      aliases.add(alias);
    }
    paths.add(record.path);
    result.push(Object.freeze({ ...record, canonical: new URL(record.path, base).href,
      legacyHashes: Object.freeze(record.legacyHashes) }));
  };
  for (const section of sections) {
    if (!segment(section.id)) throw new Error("invalid documentation section id");
    sectionIds.add(section.id);
    add({ kind: "section", sourceId: section.id, path: `/docs/${section.id}/`,
      legacyHashes: [`#/docs/${section.id}`] });
  }
  for (const page of pages) {
    const parts = typeof page.routeId === "string" ? page.routeId.split("/") : [];
    if (parts.length !== 2 || !parts.every(segment) || parts[0] !== page.sectionId || !sectionIds.has(page.sectionId)) {
      throw new Error("invalid documentation page route");
    }
    if (typeof page.id !== "string" || !new RegExp(`^${page.sectionId}/(?:item|table)-[1-9][0-9]*$`, "u").test(page.id)) {
      throw new Error("invalid legacy documentation page id");
    }
    add({ kind: "page", sourceId: page.id, path: `/reference/${page.routeId}/`,
      legacyHashes: [`#/reference/${page.routeId}`, `#/reference/${encodeURIComponent(page.id)}`] });
  }
  return Object.freeze(result);
}
