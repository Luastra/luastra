import { createHash } from "node:crypto";
import { admitStartupTree } from "./startup-tree.mjs";
import { rendererStyleDeclarations } from "../renderer/dom-adapter.mjs";

const escape = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function renderStartupHtml(tree, assets, { failureTree } = {}) {
  const byReference = new Map(assets.map(asset => [`asset:${asset.id}`, asset]));
  const normalize = (value, failure = false) => admitStartupTree(value, { failure, resolveAsset: (reference, kind) => {
    const asset = byReference.get(reference);
    if (!asset || asset.kind !== kind || !/^assets\/[a-z0-9_./-]+$/.test(asset.path) || asset.path.split("/").includes("..")) {
      throw new Error(`startup asset is not admitted: ${reference}`);
    }
    return `./${asset.path}`;
  } });
  const normalized = normalize(tree);
  const rules = new Map();
  const visit = (node, prefix = "luastra-startup") => {
    const attributes = { id: `${prefix}/${node.id}`, "data-luastra-id": `${prefix}/${node.id}`, ...node.attributes };
    const declarations = Object.entries(node.attributes).flatMap(([name, value]) => rendererStyleDeclarations(name, String(value)));
    if (declarations.length) {
      const css = declarations.map(([name, value]) => `${name}:${value}`).join(";");
      const key = createHash("sha256").update(css).digest("hex").slice(0, 20);
      rules.set(key, css);
      attributes["data-startup-style"] = key;
    }
    if (node.tag === "button" && node.events?.click === "startup.retry") attributes["data-startup-retry"] = true;
    // Startup images are immediately visible; runtime images keep lazy loading.
    if (node.tag === "img") attributes.loading = "eager";
    const attrs = Object.entries(attributes).sort(([a], [b]) => a.localeCompare(b)).filter(([, value]) => value !== false)
      .map(([name, value]) => ` ${name}="${escape(value === true ? "" : value)}"`).join("");
    const open = `<${node.tag}${attrs}>`;
    return ["img", "hr"].includes(node.tag) ? open : `${open}${escape(node.text)}${node.children.map(child => visit(child, prefix)).join("")}</${node.tag}>`;
  };
  const failureHtml = failureTree ? visit(normalize(failureTree, true), "luastra-startup-failure") : '<h1>We couldn’t open the application.</h1><p>Check your connection and try again.</p><button type="button" data-startup-retry>Try again</button>';
  const html = `<section id="luastra-startup" data-luastra-startup-host="v1" aria-label="Application startup"><noscript><p data-startup-no-script>JavaScript is disabled. Enable it to open the application. Links on this screen still work.</p></noscript>${visit(normalized)}<div data-startup-failure role="alert" tabindex="-1">${failureHtml}</div></section>`;
  const css = [...rules].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `[data-startup-style="${key}"]{${value}}`).join("\n") + "\n";
  return { html, css };
}
