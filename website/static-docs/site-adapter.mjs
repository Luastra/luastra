// Website deployment policy; the shared SDK and native application routes are unchanged.
export function createSiteAdapter(BaseDomAdapter, { aliases, paths }) {
  const documents = new Set(paths);
  return class SiteDomAdapter extends BaseDomAdapter {
    applyBatch(patches) {
      // OrbitNode is a button in the SDK. The website's reference node is a native link.
      const references = new Set(["landing/reference", "landing/path/docs"]);
      super.applyBatch(patches.filter(p => !(references.has(p.target) && p.kind === "event"))
        .map(p => references.has(p.target) && p.kind === "create" ? { ...p, value: "a" } : p));
      for (const target of new Set(patches.map(p => p.target))) {
        const element = this.node(target);
        if (!element || element.tagName.toLowerCase() !== "a") continue;
        const href = element.getAttribute("href");
        const path = references.has(target) ? "/docs/overview/"
          : aliases[href] ?? (href?.startsWith("https://luastra.dev/") ? href.slice("https://luastra.dev".length) : href);
        if (documents.has(path)) {
          element.setAttribute("href", path);
          element.removeAttribute("type");
        }
      }
    }
  }
}
