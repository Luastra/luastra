import assert from "node:assert/strict";
import test from "node:test";
import { documentationRoutes } from "../website/static-docs/routes.mjs";
import { sections } from "../website/site/reference-data.js";
import { generatedPages } from "../website/site/generated-reference-data.js";

test("static documentation inventory covers real content and preserves existing links", () => {
  const routes = documentationRoutes({ sections, pages: generatedPages });
  assert.equal(routes.length, sections.length + generatedPages.length);
  assert.equal(routes.filter((route) => route.kind === "section").length, 40);
  assert.ok(routes.some(route => route.path === "/docs/startup-screens/"));
  const button = routes.find((route) => route.path === "/reference/ui/button/");
  assert.equal(button.canonical, "https://luastra.dev/reference/ui/button/");
  assert.deepEqual(button.legacyHashes, ["#/reference/ui/button", "#/reference/ui%2Fitem-8"]);
  assert.equal(new Set(routes.map((route) => route.canonical)).size, routes.length);
});

test("static routes reject ambiguous or unsafe content identities", () => {
  const section = { id: "ui" };
  const page = { id: "ui/item-1", sectionId: "ui", routeId: "ui/button" };
  const build = (overrides) => documentationRoutes({ sections: [section], pages: [page], ...overrides });
  assert.throws(() => build({ sections: [section, section] }), /duplicate/);
  assert.throws(() => build({ pages: [page, { ...page, id: "ui/item-2" }] }), /duplicate/);
  assert.throws(() => build({ pages: [page, { ...page, routeId: "ui/text" }] }), /alias/);
  assert.throws(() => build({ pages: [{ ...page, routeId: "ui/../button" }] }), /invalid/);
  assert.throws(() => build({ pages: [{ ...page, sectionId: "missing" }] }), /invalid/);
  assert.throws(() => build({ origin: "https://luastra.dev/?tracking=true" }), /origin/);
  assert.throws(() => build({ origin: "https://user:password@luastra.dev" }), /origin/);
});
