import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { conformProject } from "../project/conform-project.mjs";
import { testProject } from "../project/test-project.mjs";
import { conformReferenceProjects } from "../scripts/conform-references.mjs";

const prototype = resolve(import.meta.dirname, "..");
const cli = resolve(prototype, "cli/luastra.mjs");

test("deep reference and independent fixtures pass one deterministic public-alpha conformance profile", async () => {
  const report = await conformReferenceProjects();
  assert.equal(report.result, "PASS");
  assert.equal(report.projects.length, 4);
  assert.equal(report.requiredRolesPassed, 3);
  assert.ok(report.independentCapabilityProfiles >= 3);
  assert.match(report.reportSha256, /^[a-f0-9]{64}$/);
  for (const project of report.projects) {
    assert.equal(project.profile, "public-alpha-v1");
    assert.equal(project.tests.declared, project.tests.passed);
    assert.ok(project.sourceBoundary.literalImports > 0);
    assert.ok(Object.values(project.budgets).every((budget) => budget.result === "PASS"));
    assert.match(project.deterministicBuilds.bundleContentSha256, /^[a-f0-9]{64}$/);
    assert.match(project.deterministicBuilds.webAssetManifestSha256, /^[a-f0-9]{64}$/);
    assert.match(project.reportInputSha256, /^[a-f0-9]{64}$/);
  }
});

test("CLI exposes the same conformance contract for an arbitrary project", () => {
  const project = resolve(prototype, "examples/animated-catalogue");
  const execution = spawnSync(process.execPath, [cli, "conformance", `--project=${project}`], { encoding: "utf8", timeout: 30_000, maxBuffer: 1024 * 1024 });
  assert.equal(execution.status, 0, execution.stderr);
  const report = JSON.parse(execution.stdout);
  assert.equal(report.command, "conformance");
  assert.equal(report.project, "dev.luastra.animated-catalogue");
  assert.equal(report.result, "PASS");
  assert.equal(report.tests.passed, 2);
});

test("Wasm runtime preserves repeated Luau protected-call semantics", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-pcall-regression-"));
  try {
    const project = resolve(workspace, "catalogue");
    await cp(resolve(prototype, "examples/animated-catalogue"), project, { recursive: true });
    const manifestPath = resolve(project, "luastra.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const testModule = manifest.modules.find((module) => module.id === "app/tests/catalogue");
    testModule.dependencies = [];
    manifest.tests = [testModule.id];
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(resolve(project, testModule.source), `--!strict
local first = pcall(function() error("first controlled failure") end)
local second = pcall(function() assert(false, "second controlled failure") end)
assert(not first and not second, "pcall admitted a controlled failure")
return true
`);
    const result = await testProject(manifestPath);
    assert.equal(result.passed, 1);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("conformance rejects undeclared imports, dynamic imports and exceeded budgets before a PASS report", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-conformance-negative-"));
  try {
    const source = resolve(prototype, "examples/animated-catalogue");
    const project = resolve(workspace, "catalogue");
    await cp(source, project, { recursive: true });
    const manifestPath = resolve(project, "luastra.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.modules.find((module) => module.id === "app/main").dependencies = manifest.modules.find((module) => module.id === "app/main").dependencies.filter((dependency) => dependency !== "luastra/ui");
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await assert.rejects(conformProject(manifestPath), /requires undeclared dependency: luastra\/ui/);

    await cp(source, project, { recursive: true, force: true });
    const mainPath = resolve(project, "src/main.luau");
    await writeFile(mainPath, `${await readFile(mainPath, "utf8")}\nlocal moduleName = "luastra/ui"\nrequire(moduleName)\n`);
    await assert.rejects(conformProject(manifestPath), /dynamic or malformed require/);

    await cp(source, project, { recursive: true, force: true });
    await assert.rejects(conformProject(manifestPath, { budgets: { productionSourceBytes: 1 } }), /budget exceeded: productionSourceBytes/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
