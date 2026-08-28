import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { canonicalJson, fileLedger } from "../assets/package-assets.mjs";
import { buildProject } from "./build-project.mjs";
import { loadProject } from "./load-project.mjs";
import { testProject } from "./test-project.mjs";

export const publicAlphaConformanceBudgets = Object.freeze({
  productionModules: 64,
  productionSourceBytes: 512 * 1024,
  bundleBytes: 8 * 1024 * 1024,
  webBytes: 16 * 1024 * 1024,
  testMemoryGrowthBytes: 1024 * 1024,
});

const budgetKeys = Object.freeze(Object.keys(publicAlphaConformanceBudgets));
const requireCall = /\brequire\s*\(/g;
const literalRequire = /\brequire\s*\(\s*["']([a-z][a-z0-9_-]*(?:\/[a-z][a-z0-9_-]*)*)["']\s*\)/g;

function fail(message) { throw new Error(message); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

function admitBudgets(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("conformance budgets must be an object");
  const unknown = Object.keys(value).filter((key) => !budgetKeys.includes(key));
  if (unknown.length > 0) fail(`unknown conformance budget: ${unknown.join(", ")}`);
  const admitted = { ...publicAlphaConformanceBudgets, ...value };
  for (const key of budgetKeys) {
    if (!Number.isSafeInteger(admitted[key]) || admitted[key] < 0) fail(`conformance budget must be a non-negative safe integer: ${key}`);
  }
  return Object.freeze(admitted);
}

function productionModuleIds(project) {
  const visited = new Set();
  const visit = (id) => {
    if (visited.has(id) || id.startsWith("luastra/")) return;
    const module = project.modules.get(id);
    if (!module) fail(`production dependency is not a project or public SDK module: ${id}`);
    visited.add(id);
    for (const dependency of module.dependencies) visit(dependency);
  };
  visit(project.entry);
  return [...visited].sort();
}

async function sourceBoundary(project) {
  let totalBytes = 0;
  let literalImports = 0;
  for (const module of [...project.modules.values()].sort((left, right) => left.id.localeCompare(right.id))) {
    const bytes = await readFile(module.sourcePath);
    const source = bytes.toString("utf8");
    const calls = [...source.matchAll(requireCall)].length;
    const imports = [...source.matchAll(literalRequire)].map((match) => match[1]);
    if (imports.length !== calls) fail(`module ${module.id} contains a dynamic or malformed require; only literal module IDs are allowed`);
    for (const dependency of imports) {
      if (!module.dependencies.includes(dependency)) fail(`module ${module.id} requires undeclared dependency: ${dependency}`);
      if (!project.modules.has(dependency) && !dependency.startsWith("luastra/")) fail(`module ${module.id} reaches a non-project, non-SDK dependency: ${dependency}`);
    }
    const unused = module.dependencies.filter((dependency) => !imports.includes(dependency));
    if (unused.length > 0) fail(`module ${module.id} declares unused dependencies: ${unused.join(", ")}`);
    literalImports += imports.length;
    totalBytes += bytes.byteLength;
  }
  return Object.freeze({ modules: project.modules.size, sourceBytes: totalBytes, literalImports });
}

function ledgerBytes(ledger) { return ledger.reduce((total, entry) => total + entry.bytes, 0); }
function assertBudget(name, actual, budgets) {
  if (actual > budgets[name]) fail(`conformance budget exceeded: ${name} is ${actual}, limit is ${budgets[name]}`);
}

export async function conformProject(manifestPath, { budgets: budgetOverrides = {} } = {}) {
  const budgets = admitBudgets(budgetOverrides);
  const project = await loadProject(manifestPath);
  const boundary = await sourceBoundary(project);
  const productionModules = productionModuleIds(project);
  const productionSourceBytes = (await Promise.all(productionModules.map((id) => readFile(project.modules.get(id).sourcePath)))).reduce((total, bytes) => total + bytes.byteLength, 0);
  assertBudget("productionModules", productionModules.length, budgets);
  assertBudget("productionSourceBytes", productionSourceBytes, budgets);

  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-conformance-"));
  try {
    const bundleAPath = resolve(workspace, "bundle-a");
    const bundleBPath = resolve(workspace, "bundle-b");
    const webAPath = resolve(workspace, "web-a");
    const webBPath = resolve(workspace, "web-b");
    const [bundleA, bundleB, webA, webB, tested] = await Promise.all([
      buildProject({ manifestPath, outputDirectory: bundleAPath, target: "bundle" }),
      buildProject({ manifestPath, outputDirectory: bundleBPath, target: "bundle" }),
      buildProject({ manifestPath, outputDirectory: webAPath, target: "web" }),
      buildProject({ manifestPath, outputDirectory: webBPath, target: "web" }),
      testProject(manifestPath),
    ]);
    const [bundleLedgerA, bundleLedgerB, webLedgerA, webLedgerB] = await Promise.all([
      fileLedger(bundleAPath), fileLedger(bundleBPath), fileLedger(webAPath), fileLedger(webBPath),
    ]);
    assert.deepEqual(bundleLedgerA, bundleLedgerB, "bundle output is not byte-for-byte deterministic");
    assert.deepEqual(webLedgerA, webLedgerB, "web output is not byte-for-byte deterministic");
    assert.equal(bundleA.projectContentSha256, bundleB.projectContentSha256, "bundle project digest changed");
    assert.equal(webA.projectContentSha256, webB.projectContentSha256, "web project digest changed");
    assert.equal(webA.assetManifestSha256, webB.assetManifestSha256, "web asset manifest digest changed");

    const bundleBytes = ledgerBytes(bundleLedgerA);
    const webBytes = ledgerBytes(webLedgerA);
    const testMemoryGrowthBytes = tested.results.reduce((maximum, result) => Math.max(maximum, result.memoryGrowthBytes), 0);
    assertBudget("bundleBytes", bundleBytes, budgets);
    assertBudget("webBytes", webBytes, budgets);
    assertBudget("testMemoryGrowthBytes", testMemoryGrowthBytes, budgets);

    const bundled = JSON.parse(await readFile(resolve(bundleAPath, "luastra.bundle.json"), "utf8"));
    if (bundled.modules.some((module) => project.tests.includes(module.id))) fail("production bundle contains a declared test module");
    const usage = Object.freeze({
      productionModules: productionModules.length,
      productionSourceBytes,
      bundleBytes,
      webBytes,
      testMemoryGrowthBytes,
    });
    return Object.freeze({
      schemaVersion: 1,
      command: "conformance",
      profile: "public-alpha-v1",
      result: "PASS",
      project: project.id,
      sdkContract: project.sdkContract,
      capabilities: Object.freeze([...project.capabilities].sort()),
      sourceBoundary: boundary,
      tests: Object.freeze({ declared: project.tests.length, passed: tested.passed }),
      deterministicBuilds: Object.freeze({
        bundleContentSha256: bundleA.bundleContentSha256,
        projectContentSha256: bundleA.projectContentSha256,
        webAssetManifestSha256: webA.assetManifestSha256,
        bundleFiles: bundleLedgerA.length,
        webFiles: webLedgerA.length,
      }),
      budgets: Object.freeze(Object.fromEntries(budgetKeys.map((key) => [key, Object.freeze({ actual: usage[key], limit: budgets[key], result: "PASS" })]))),
      reportInputSha256: sha256(canonicalJson({ project: project.id, capabilities: [...project.capabilities].sort(), usage, budgets })),
    });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}
