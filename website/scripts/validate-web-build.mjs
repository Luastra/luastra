import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

const expectedRobots = "User-agent: *\nAllow: /\nSitemap: https://luastra.dev/sitemap.xml\n";
if (robots !== expectedRobots) fail("production robots.txt differs from the admitted public policy");
requireText(sitemap, "<loc>https://luastra.dev/</loc>", "the root sitemap location");
if (sitemap.includes("#/")) fail("root sitemap must not expose client-side hash routes as documents");

process.stdout.write(`${JSON.stringify({ result: "PASS", artifact: "luastra.dev web metadata" })}\n`);
