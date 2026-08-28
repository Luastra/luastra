import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { navigationGroups, release, sdkInventory, sdkTypeInventory, sections } from "../site/reference-data.js";
import { generatedPages } from "../site/generated-reference-data.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidateSdk = resolve(root, "..", "sdk", "luastra");
const namespaceByModule = Object.freeze({
  "luastra/ui": "UI",
  "luastra/assets": "Assets",
  "luastra/data": "Data",
  "luastra/debug": "Debug",
  "luastra/timer": "Timer",
  "luastra/motion": "Motion",
  "luastra/navigation": "Navigation",
  "luastra/state": "State",
  "luastra/host": "Host",
  "luastra/server": "Server",
  "luastra/media": "Media",
});
const sdkPageNames = new Set(Object.entries(sdkInventory).flatMap(([moduleId, names]) => names.map((name) => `${namespaceByModule[moduleId]}.${name}`)));
const sdkTypePageNames = new Set(Object.entries(sdkTypeInventory).flatMap(([moduleId, names]) => names.map((name) => `${namespaceByModule[moduleId]}.${name}`)));

function fail(message) {
  throw new Error(message);
}

function same(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

const sectionIds = sections.map((section) => section.id);
if (new Set(sectionIds).size !== sectionIds.length) fail("reference contains duplicate section IDs");
if (release.version !== "0.1.0-alpha") fail("reference is not bound to 0.1.0-alpha");
if (release.sourceSdk !== "Source SDK contract 10") fail("reference source SDK label is stale");
if (release.runtimeSdk !== "Runtime SDK alpha 8") fail("reference runtime SDK label is stale");
for (const id of ["installation", "quickstart", "learning-path", "beginner-tutorial", "advanced-tutorial", "events-errors", "policies"])
  if (!sectionIds.includes(id)) fail(`reference misses required learning section: ${id}`);
const navigationIds = navigationGroups.flatMap((group) => group.items.map(([id]) => id));
if (new Set(navigationIds).size !== navigationIds.length) fail("navigation contains duplicate targets");
if (!same([...sectionIds].sort(), [...navigationIds].sort())) fail("navigation and section inventories differ");

const searchableReference = JSON.stringify(sections);
if (/[\u0400-\u04ff]/u.test(searchableReference)) fail("public reference contains Cyrillic");
for (const marker of ["$LUASTRA", "0.1.0-private", "Private MVP commands", "Private MVP status", "phase5", "Phase 5", "owner-dogfood", "private-candidates"])
  if (searchableReference.includes(marker)) fail(`public reference contains private marker: ${marker}`);
for (const section of sections) {
  const cards = section.cards ?? [];
  const useWhenValues = cards.map((card) => card.useWhen);
  if (useWhenValues.some((value) => typeof value !== "string" || value.length === 0 || value === section.summary))
    fail(`${section.id} contains missing or generic When to use it guidance`);
  if (new Set(useWhenValues).size !== useWhenValues.length) fail(`${section.id} contains duplicate When to use it guidance`);
  const descriptions = cards.map((card) => card.description);
  if (new Set(descriptions).size !== descriptions.length) fail(`${section.id} contains duplicate detail-page descriptions`);
  for (const card of cards) {
    if (/for this specific purpose|^Provides\b/u.test(card.useWhen ?? "") || /^Provides\b/u.test(card.description ?? ""))
      fail(`${section.id}/${card.name} contains placeholder reference prose`);
    if (sdkPageNames.has(card.name) || sdkTypePageNames.has(card.name)) {
      if ((card.description?.length ?? 0) < 120) fail(`${card.name} needs a complete behavioral description`);
      if ((card.useWhen?.length ?? 0) < 120) fail(`${card.name} needs concrete When to use it guidance`);
      if (card.useWhen.includes(card.description)) fail(`${card.name} repeats its description in When to use it`);
    }
    if (typeof card.code === "string") {
      const longestLine = Math.max(...card.code.split("\n").map((line) => line.length));
      if (longestLine > 120) fail(`${section.id}/${card.name} contains a ${longestLine}-character example line`);
    }
  }
  for (const link of section.links ?? []) {
    let parsed;
    try { parsed = new URL(link.href); } catch { fail(`reference link is not an absolute URL: ${link.href}`); }
    if (parsed.protocol !== "https:" || parsed.hostname !== "github.com" || !parsed.pathname.startsWith("/Luastra/luastra"))
      fail(`reference link is outside the admitted public project boundary: ${link.href}`);
  }
}

for (const section of sections.filter((item) => item.id === item.module?.slice("luastra/".length))) {
  if ((section.summary?.length ?? 0) < 140) fail(`${section.id} needs a complete module overview`);
  if (!Array.isArray(section.guide) || section.guide.length < 2) fail(`${section.id} needs operational module guidance`);
}

const typing = sections.find((section) => section.id === "luau-types");
const typingNames = typing.cards.map((card) => card.name);
for (const name of ["Arrays", "Dictionaries and maps", "Record types", "Optional values", "Unions and type narrowing", "Tagged unions", "Generics", "Function types", "Exported module types", "typeof", "Intersections", "any, unknown, and never", "Type casts with ::", "Runtime immutability with table.freeze"])
  if (!typingNames.includes(name)) fail(`Luau typing reference misses ${name}`);
if (typing.cards.length < 16) fail("Luau typing reference was unexpectedly condensed");
if (typing.cards.find((card) => card.name === "Type casts with ::").code.includes("::") === false) fail(":: page lacks a cast example");
if (typing.cards.find((card) => card.name === "Runtime immutability with table.freeze").code.includes("table.freeze") === false) fail("table.freeze page lacks a freeze example");

const policies = sections.find((section) => section.id === "policies");
if ((policies.links ?? []).length !== 0) fail("bundled policy navigation must not depend on external GitHub links");
if (policies.cards.length !== 5 || policies.cards.some((card) => card.kind !== "guide" || !Array.isArray(card.points) || card.points.length < 3))
  fail("project policies must be complete internal guide pages");
const moduleResults = [];
for (const [moduleId, documentedNames] of Object.entries(sdkInventory)) {
  const moduleName = moduleId.slice("luastra/".length);
  const source = await readFile(resolve(candidateSdk, `${moduleName}.luau`), "utf8");
  const namespace = namespaceByModule[moduleId];
  const pattern = moduleId === "luastra/ui"
    ? /^UI\.([A-Za-z][A-Za-z0-9]*)\s*=\s*function/gm
    : new RegExp(`^function ${namespace}\\.([A-Za-z][A-Za-z0-9]*)\\s*\\(`, "gm");
  const shippedNames = [...source.matchAll(pattern)].map((match) => match[1]).sort();
  const expectedNames = [...documentedNames].sort();
  if (!same(shippedNames, expectedNames)) {
    fail(`${moduleId} inventory mismatch: shipped=${shippedNames.join(",")} documented=${expectedNames.join(",")}`);
  }
  for (const name of documentedNames) {
    const qualified = `${namespace}.${name}`;
    if (!searchableReference.includes(qualified)) fail(`documented symbol has no visible reference entry: ${qualified}`);
    const pages = generatedPages.filter((page) => page.module === moduleId && page.name === qualified);
    if (pages.length !== 1) fail(`generated website must contain exactly one detail card for ${qualified}`);
    const [page] = pages;
    if (!Array.isArray(page.parameters) || (page.parameters.length === 0 && !/\(\s*\)/u.test(page.signature))) {
      fail(`${qualified} generated website card lacks exact parameter documentation`);
    }
    if (typeof page.returns !== "string" || page.returns.length < 20) {
      fail(`${qualified} generated website card lacks return-value documentation`);
    }
    if (typeof page.code !== "string" || page.code.length === 0) {
      fail(`${qualified} generated website card lacks a minimal example`);
    }
  }
  const shippedTypes = [...source.matchAll(/^export type ([A-Za-z][A-Za-z0-9]*)\s*=/gm)].map((match) => match[1]).sort();
  const documentedTypes = [...(sdkTypeInventory[moduleId] ?? [])].sort();
  if (!same(shippedTypes, documentedTypes)) {
    fail(`${moduleId} type inventory mismatch: shipped=${shippedTypes.join(",")} documented=${documentedTypes.join(",")}`);
  }
  for (const name of documentedTypes) {
    const qualified = `${namespace}.${name}`;
    const cards = sections.flatMap((section) => section.cards ?? []).filter((card) => card.name === qualified && card.kind === "type");
    if (cards.length !== 1) fail(`exported type must have exactly one visible reference entry: ${qualified}`);
  }
  moduleResults.push({ module: moduleId, functions: shippedNames.length, types: shippedTypes.length });
}

for (const moduleId of [
  "luastra/ui", "luastra/motion", "luastra/assets", "luastra/data", "luastra/state",
  "luastra/navigation", "luastra/timer", "luastra/host", "luastra/server", "luastra/media",
]) {
  const section = sections.find((item) => item.module === moduleId);
  if (!section || typeof section.example !== "string" || section.example.split("\n").length < 8) {
    fail(`${moduleId} must include one readable module-level example`);
  }
}

for (const name of sdkInventory["luastra/ui"]) {
  const page = generatedPages.find((item) => item.name === `UI.${name}`);
  if (!page.parameters.some((parameter) => parameter.name === "id")) {
    fail(`UI.${name} must document its required stable id on the component card`);
  }
}

const index = await readFile(resolve(root, "site", "index.html"), "utf8");
for (const asset of ["styles.css", "app.js", "assets/mark.svg"]) {
  if (!index.includes(asset)) fail(`index.html does not reference ${asset}`);
}
if (/<script(?![^>]*\bsrc=)/i.test(index)) fail("inline scripts are not allowed");
if (/<style\b/i.test(index)) fail("inline styles are not allowed");

const tauriConfig = JSON.parse(await readFile(resolve(root, "src-tauri", "tauri.conf.json"), "utf8"));
const desktopCsp = tauriConfig?.app?.security?.csp;
if (typeof desktopCsp !== "string" || !desktopCsp.includes("script-src 'self' 'wasm-unsafe-eval'")) {
  fail("desktop CSP must admit the shipped Wasm runtime without enabling general unsafe-eval");
}
if (desktopCsp.includes("'unsafe-eval'")) fail("desktop CSP must not enable general unsafe-eval");

const summary = {
  result: "PASS",
  release: release.version,
  modules: moduleResults.length,
  functions: moduleResults.reduce((total, item) => total + item.functions, 0),
  types: moduleResults.reduce((total, item) => total + item.types, 0),
  components: sdkInventory["luastra/ui"].length,
  sections: sectionIds.length,
  inventory: moduleResults,
};
process.stdout.write(`${JSON.stringify(summary)}\n`);
