import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { parseHTML } from "linkedom";
import { runWasmBundle } from "../../platform/packaging/run-wasm-bundle.mjs";
import { materializeRendererTree } from "../../platform/renderer/from-protocol-tree.mjs";
import { reconcile } from "../../platform/renderer/reconciler.mjs";
import { DomAdapter } from "../../platform/renderer/dom-adapter.mjs";
import { documentationRoutes } from "./routes.mjs";

export const escapeHtml = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const root = resolve(import.meta.dirname, "../..");
const digest = text => createHash("sha256").update(text).digest("hex");

export async function renderDocumentationDOM({ output, shell, route, dark = false }) {
  const result = await runWasmBundle({
    bundlePath: resolve(output, "bundle/luastra.bundle.json"),
    runtimeModulePath: resolve(root, "platform/artifacts/vm-wasm/luastra-vm.js"),
    allowedCapabilities: ["ui.render", "app.launchurl.get", "navigation.history", "storage.get", "storage.set", "clipboard.write", "timer.control"],
    requireRendererTree: true,
    dispatches: [{ action: "lifecycle", target: "app", value: "launch" }, ...(dark ? [{ action: "docs.toggle-theme", target: "docs/header/theme", value: "" }] : [])],
    capabilityHandler: async request => {
      assert.ok(["app.launchurl.get", "navigation.history", "storage.get", "storage.set"].includes(request.kind), `Unexpected prerender side effect: ${request.kind}`);
      return { accepted: true, response: { version: 1, requestId: request.requestId, traceId: request.traceId, status: "ok", payload: request.kind === "app.launchurl.get" ? `https://luastra.dev/${route}` : "" } };
    },
  });
  assert.equal(result.pendingRequests, 0);
  const { document } = parseHTML(shell);
  for (const element of document.querySelectorAll("script,noscript")) element.remove();
  const adapter = new DomAdapter(document.getElementById("host-root"), { dispatch: () => { throw new Error("No events during prerender"); } });
  adapter.applyBatch(reconcile(null, materializeRendererTree(result.renderTree)));
  assert.ok(document.getElementById("docs/root"), `Not a documentation route: ${route}`);
  return document;
}

function setMeta(document, name, content, property = false) {
  const attribute = property ? "property" : "name";
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, name); document.head.append(element); }
  element.setAttribute("content", content);
}

export async function generateStaticDocumentation({ output, sections, pages, version, origin = "https://luastra.dev", onlyPaths = null }) {
  const inventory = documentationRoutes({ sections, pages, origin });
  const routes = onlyPaths ? inventory.filter(r => onlyPaths.includes(r.path)) : inventory;
  if (onlyPaths && routes.length !== onlyPaths.length) throw new Error("Unknown selected documentation path");
  const aliases = new Map(inventory.flatMap(r => r.legacyHashes.map(hash => [hash, r.path])));
  const shell = await readFile(resolve(output, "index.html"), "utf8");
  const styleRules = new Map();
  const styles = document => {
    for (const element of document.querySelectorAll("[style]")) {
      const text = element.getAttribute("style"), id = digest(text).slice(0, 20);
      styleRules.set(id, text); element.setAttribute("data-prerender-style", id); element.removeAttribute("style");
    }
  };
  const dark = await renderDocumentationDOM({ output, shell, route: "#/docs/overview", dark: true });
  const darkStyle = dark.getElementById("docs/root").getAttribute("style");
  const index = [];
  for (const route of inventory) {
    const content = route.kind === "section" ? sections.find(s => s.id === route.sourceId) : pages.find(p => p.id === route.sourceId);
    index.push({ path: route.path, title: content.title ?? content.name, description: content.summary ?? content.description ?? "", text: JSON.stringify(content).toLowerCase() });
  }
  await mkdir(resolve(output, "docs"), { recursive: true });
  for (const route of routes) {
    const document = await renderDocumentationDOM({ output, shell, route: route.legacyHashes[0] });
    const content = route.kind === "section" ? sections.find(s => s.id === route.sourceId) : pages.find(p => p.id === route.sourceId);
    styles(document);
    for (const element of document.querySelectorAll("link[href]")) {
      const href = element.getAttribute("href");
      if (href.startsWith("./")) element.setAttribute("href", href.slice(1));
    }
    for (const href of ["/platform/host/orbit.css", "/platform/host/controls.css", "/docs/prerender.css"]) {
      const link = document.createElement("link"); link.setAttribute("rel", "stylesheet"); link.setAttribute("href", href); document.head.append(link);
    }
    for (const link of document.querySelectorAll("a[href]")) {
      const href = link.getAttribute("href");
      if (aliases.has(href)) link.setAttribute("href", aliases.get(href));
      else if (href.startsWith("#/")) link.setAttribute("href", `/${href}`);
    }
    // A native link keeps Orbit navigation usable even without scripting.
    const home = document.getElementById("docs/header/home");
    const anchor = document.createElement("a");
    for (const attr of home.attributes) if (!["type", "disabled"].includes(attr.name)) anchor.setAttribute(attr.name, attr.value);
    anchor.setAttribute("href", "/#/"); anchor.textContent = home.textContent; home.replaceWith(anchor);
    for (const id of ["docs/header/theme", "docs/header/menu", "docs/search"]) document.getElementById(id)?.setAttribute("disabled", "");
    const copy = document.getElementById("docs/detail/copy") ?? document.getElementById("docs/section/copy");
    if (copy) {
      const text = content.code ?? content.example;
      assert.equal(typeof text, "string", `Copy source missing: ${route.path}`);
      const source = document.createElement("template"); source.id = "docs-copy-source"; source.textContent = text; document.body.append(source);
      copy.setAttribute("data-docs-copy", ""); copy.setAttribute("disabled", "");
    }
    // Preserve the Luastra-rendered introduction; load the interactive app only on request.
    for (const id of ["live/example", "learn/card"]) {
      const live = document.getElementById(id);
      if (live) {
        const learning = id === "learn/card";
        if (!learning) live.querySelector('[id="live/description"]').textContent = "Run the example to try real Luastra buttons and state inside this page.";
        live.querySelector(learning ? '[id="learn/actions"]' : '[id="live/actions"]')?.remove();
        const button = document.createElement("button"); button.id = "docs/example/run";
        button.className = "luastra-button"; button.textContent = "Run example"; button.disabled = true;
        button.setAttribute("data-docs-example", learning ? "/live-example/#learning" : "/live-example/");
        const status = document.createElement("p"); status.id = "docs/example/status"; status.className = "luastra-text luastra-tone-muted";
        status.setAttribute("role", "status"); status.textContent = "Run this example to load Luastra. JavaScript is required.";
        live.append(button, status);
      }
    }
    document.querySelector('link[rel="canonical"]').setAttribute("href", route.canonical);
    const description = (content.summary ?? content.description ?? "Luastra SDK reference").slice(0, 300);
    setMeta(document, "description", description);
    for (const property of ["og:title", "twitter:title"]) setMeta(document, property, document.title, property.startsWith("og:"));
    for (const property of ["og:description", "twitter:description"]) setMeta(document, property, description, property.startsWith("og:"));
    setMeta(document, "og:type", "article", true); setMeta(document, "og:url", route.canonical, true);
    document.querySelector('meta[http-equiv="Content-Security-Policy"]').setAttribute("content", "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'none'");
    const script = document.createElement("script"); script.setAttribute("src", "/docs/reader.js"); document.head.append(script);
    const directory = resolve(output, `.${route.path}`); await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, "index.html"), "<!doctype html>\n" + document.documentElement.outerHTML + "\n");
  }
  const rules = [...styleRules].sort(([a], [b]) => a.localeCompare(b)).map(([id, text]) => `[data-prerender-style="${id}"]{${text}}`).join("\n");
  await writeFile(resolve(output, "docs/prerender.css"), rules + `\nhtml[data-docs-theme="dark"] [id="docs/root"]{${darkStyle}}\n` + await readFile(resolve(import.meta.dirname, "enhancements.css"), "utf8"));
  await copyFile(resolve(import.meta.dirname, "reader.js"), resolve(output, "docs/reader.js"));
  await writeFile(resolve(output, "docs/search-index.json"), JSON.stringify(index));
  await writeFile(resolve(output, "docs/routes.json"), JSON.stringify({ version, routes: inventory }, null, 2) + "\n");
  if (!onlyPaths) {
    const overview = await readFile(resolve(output, "docs/overview/index.html"), "utf8");
    await mkdir(resolve(output, "prerender-pilot"), { recursive: true });
    const pilot = await readFile(resolve(output, "reference/installation/offline-installation/index.html"), "utf8");
    await writeFile(resolve(output, "prerender-pilot/index.html"), pilot.replace('content="index,follow"', 'content="noindex,follow"'));
    await writeFile(resolve(output, "docs/index.html"), overview.replaceAll(`${origin}/docs/overview/`, `${origin}/docs/`));
    await writeFile(resolve(output, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${["/", "/docs/", ...inventory.map(r => r.path)].map(path => `<url><loc>${escapeHtml(new URL(path, origin).href)}</loc></url>`).join("")}</urlset>\n`);
  }
  return { documents: routes.length + (onlyPaths ? 0 : 1), routes };
}
