import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { orbitBrowserBudgets, orbitBrowserTargets } from "../scripts/orbit-browser-budgets.mjs";

const repository = resolve(import.meta.dirname, "..");

test("Orbit browser performance budgets are explicit and wired into the public command", async () => {
  assert.deepEqual(orbitBrowserBudgets, {
    averageLayoutDurationMs: 8,
    collectedHeapGrowthBytes: 8 * 1024 * 1024,
    maximumConstellationCount: 2,
    maximumLayoutDurationMs: 33.34,
    maximumRetainedNodeCount: 54,
    minimumCycles: 10,
    wasmMemoryGrowthBytes: 4 * 1024 * 1024,
  });
  assert.equal(Object.isFrozen(orbitBrowserBudgets), true);
  assert.deepEqual(orbitBrowserTargets, {
    averageLayoutDurationMs: 4,
    maximumLayoutDurationMs: 16.67,
  });
  assert.equal(Object.isFrozen(orbitBrowserTargets), true);

  const packageJson = JSON.parse(await readFile(resolve(repository, "package.json"), "utf8"));
  assert.equal(packageJson.scripts["audit:orbit:chromium"], "node scripts/audit-orbit-chromium.mjs");
  assert.match(packageJson.scripts["audit:orbit:firefox"], /audit-orbit-webdriver\.mjs --browser=firefox/);
  assert.equal(packageJson.scripts["audit:orbit:firefox"].includes(".local-development"), false);
  assert.match(packageJson.scripts["audit:orbit:safari"], /audit-orbit-webdriver\.mjs --browser=safari/);
  assert.equal(packageJson.scripts["audit:luastra-dev:chromium"], "node scripts/audit-luastra-dev-chromium.mjs");

  const documentation = await readFile(resolve(repository, "docs/constellation-orbit.md"), "utf8");
  assert.match(documentation, /average measured interaction-time Orbit layout at or below 8 ms/);
  assert.match(documentation, /maximum measured interaction-time Orbit layout at or below 33\.34 ms/);
  assert.match(documentation, /stricter 60-fps target is reported\s+separately at 4 ms average and 16\.67 ms maximum/);
  assert.match(documentation, /at most two retained constellation layers and 54 retained Orbit nodes/);
  assert.match(documentation, /npm run audit:orbit:safari/);
  assert.match(documentation, /npm run audit:orbit:firefox/);
  assert.match(documentation, /Run the browser performance commands sequentially/);
});
