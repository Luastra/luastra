import { parseHTML } from "linkedom";
import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const websiteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(websiteRoot, "luastra-site");

function fail(message) {
  throw new Error(message);
}

function requireText(source, expected, label) {
  if (!source.includes(expected)) fail(`production web build misses ${label}`);
}

const html = await readFile(resolve(output, "index.html"), "utf8");
const robots = await readFile(resolve(output, "robots.txt"), "utf8");
const sitemap = await readFile(resolve(output, "sitemap.xml"), "utf8");

requireText(html, "<title>Luastra — Build apps like games</title>", "the public title");
requireText(html, '<meta name="description" content="Luastra is a Luau-first cross-platform application framework for building web, desktop, and mobile apps with a game-like development loop." />', "the public description");
requireText(html, '<meta name="robots" content="index,follow" />', "the crawler policy");
requireText(html, '<link rel="canonical" href="https://luastra.dev/" />', "the canonical URL");
requireText(html, '<meta property="og:title" content="Luastra — Build apps like games" />', "the Open Graph title");
requireText(html, '<meta name="twitter:card" content="summary" />', "the Twitter card");
requireText(html, "<noscript>", "the no-script fallback");
requireText(html, "<h1>Luastra — Build apps like games</h1>", "the no-script heading");
requireText(html, 'src="./site-entry.mjs"', "the static documentation bookmark resolver");
const { aliases, paths } = await import(pathToFileURL(resolve(output, "documentation-navigation.mjs")));
for (const path of [...paths, ...Object.values(aliases)]) {
  if (!/^\/(docs|reference)\/[a-z0-9/-]+\/$/u.test(path)) fail(`unsafe documentation destination: ${path}`);
  await stat(resolve(output, path.slice(1), "index.html"));
}

const expectedRobots = "User-agent: *\nAllow: /\nSitemap: https://luastra.dev/sitemap.xml\n";
if (robots !== expectedRobots) fail("production robots.txt differs from the admitted public policy");
requireText(sitemap, "<loc>https://luastra.dev/</loc>", "the root sitemap location");
if (sitemap.includes("#/")) fail("root sitemap must not expose client-side hash routes as documents");

process.stdout.write(`${JSON.stringify({ result: "PASS", artifact: "luastra.dev web metadata" })}\n`);

const routes = JSON.parse(await readFile(resolve(output, "docs/routes.json"), "utf8")).routes;
for (const path of ["/docs/", ...routes.map(route => route.path)]) {
  const page = await readFile(resolve(output, `.${path}index.html`), "utf8");
  requireText(page, 'src="/docs/reader.js"', `progressive controls for ${path}`);
  const { document } = parseHTML(page);
  const scripts = [...document.querySelectorAll("script")];
  if (document.querySelector("iframe")) fail(`example must load only after a reader action: ${path}`);
  for (const control of document.querySelectorAll("[data-docs-example]")) {
    const href = control.getAttribute("data-docs-example");
    if (!["/live-example/", "/live-example/#learning"].includes(href)) fail(`unknown embedded example: ${href}`);
    await stat(resolve(output, "live-example/index.html"));
  }
  if (scripts.length !== 1 || scripts[0].getAttribute("src") !== "/docs/reader.js") fail(`unexpected script in ${path}`);
  for (const element of document.querySelectorAll("a[href],link[href],script[src]")) {
    const href = element.getAttribute("href") ?? element.getAttribute("src");
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const pathname = href.split(/[?#]/u)[0];
    const file = resolve(output, `.${pathname}`, pathname.endsWith("/") ? "index.html" : "");
    if (!(await stat(file)).isFile()) fail(`broken link in ${path}: ${href}`);
  }
  for (const button of document.querySelectorAll("button")) {
    if (!["docs/header/menu", "docs/header/theme", "docs/navigation-scrim", "docs/detail/copy", "docs/section/copy", "docs/example/run"].includes(button.id)) fail(`unhandled static control: ${button.id}`);
  }
  requireText(page, "<main", `main content for ${path}`);
  requireText(page, `href="https://luastra.dev${path}"`, `canonical for ${path}`);
  requireText(sitemap, `<loc>https://luastra.dev${path}</loc>`, `sitemap entry for ${path}`);
  if (/\.wasm|src="[^"]*(?:main\.js|bootstrap-errors)/u.test(page)) fail(`static page starts a runtime: ${path}`);
}
console.log(JSON.stringify({ result: "PASS", staticDocuments: routes.length + 1 }));
