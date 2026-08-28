import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { createProjectAssetRegistry } from "../platform/host/asset-registry.mjs";
import { loadProject } from "../project/load-project.mjs";

const prototype = resolve(import.meta.dirname, "..");

function response(value) { return { ok: true, async json() { return value; } }; }
function entry(overrides = {}) {
  return { id: "audio/focus", kind: "audio", path: "assets/audio/focus.wav", mediaType: "audio/wav", bytes: 44, sha256: "a".repeat(64), ...overrides };
}

test("project admission derives immutable asset kinds and schema-v2 ledger fields", async () => {
  const project = await loadProject(resolve(prototype, "examples/media-player/luastra.json"));
  assert.deepEqual(project.assets.map(({ id, kind }) => ({ id, kind })), [
    { id: "audio/focus", kind: "audio" },
    { id: "audio/rest", kind: "audio" },
  ]);
  const source = await readFile(resolve(prototype, "sdk/luastra/assets.luau"), "utf8");
  assert.match(source, /export type Image/);
  assert.match(source, /export type Audio/);
  assert.match(source, /export type Font/);
});

test("host registry resolves only an admitted reference of the requested kind", async () => {
  const manifest = { schemaVersion: 2, project: "dev.luastra.fixture", assets: [entry()] };
  const registry = createProjectAssetRegistry({ fetchImpl: async () => response(manifest), manifestUrls: ["https://fixture.test/project-assets.json"], assetBaseUrl: new URL("https://fixture.test/platform/host/asset-registry.mjs") });
  const resolved = await registry.resolve("asset:audio/focus", "audio");
  assert.equal(resolved.kind, "audio");
  assert.equal(resolved.url, "https://fixture.test/assets/audio/focus.wav");
  await assert.rejects(registry.resolve("asset:audio/focus", "image"), /not admitted image/);
  await assert.rejects(registry.resolve("https://example.invalid/focus.wav", "audio"), /invalid asset reference/);
});

test("host registry rejects forged kind, MIME, path and digest metadata", async () => {
  for (const forged of [
    entry({ kind: "image" }),
    entry({ mediaType: "image/png" }),
    entry({ path: "../focus.wav" }),
    entry({ sha256: "0" }),
  ]) {
    const registry = createProjectAssetRegistry({ fetchImpl: async () => response({ schemaVersion: 2, project: "dev.luastra.fixture", assets: [forged] }), manifestUrls: ["fixture"] });
    await assert.rejects(registry.load(), /project asset manifest unavailable/);
  }
});
