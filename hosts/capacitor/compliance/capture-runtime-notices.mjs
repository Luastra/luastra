#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

const compliance = import.meta.dirname;
const host = resolve(compliance, "..");
const cache = resolve(host, "android/.gradle-user-home/caches/modules-2/files-2.1");
const output = resolve(compliance, "notices/native-runtime-notices.v1.json");
const noticeName = /^(?:license|notice|copying)(?:[-_.].*)?$/i;

function fail(message) { throw new Error(message); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
function json(value) { return `${JSON.stringify(stable(value), null, 2)}\n`; }
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: null, maxBuffer: 32 * 1024 * 1024, ...options });
  if (result.status !== 0) fail(`${command} failed for ${args.at(-1)}: ${result.stderr?.toString("utf8").trim()}`);
  return result.stdout;
}
async function filesBelow(root) {
  const entries = [];
  for (const name of (await readdir(root)).sort()) {
    const path = resolve(root, name);
    const info = await stat(path);
    if (info.isDirectory()) entries.push(...await filesBelow(path));
    else if (info.isFile()) entries.push(path);
  }
  return entries;
}
function npmName(path) {
  const value = path.slice("node_modules/".length);
  const parts = value.split("/");
  return value.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
}
function npmClosure(lock, roots) {
  const admitted = new Set();
  const visit = (name) => {
    const path = `node_modules/${name}`;
    if (admitted.has(path)) return;
    const entry = lock.packages[path] ?? fail(`npm package missing from lock: ${name}`);
    admitted.add(path);
    for (const dependency of Object.keys(entry.dependencies ?? {}).sort()) visit(dependency);
  };
  for (const root of roots.sort()) visit(root);
  return [...admitted].sort();
}
async function licenseFile(root) {
  const files = (await readdir(root)).filter((name) => noticeName.test(name)).sort();
  if (files.length === 0) fail(`runtime package has no root license or notice: ${root}`);
  return files;
}

const inventory = JSON.parse(await readFile(resolve(compliance, "android/gradle-runtime.v1.json"), "utf8"));
const lock = JSON.parse(await readFile(resolve(host, "package-lock.json"), "utf8"));
const documents = new Map();
function admitDocument(bytes, sourceKind) {
  const digest = sha256(bytes);
  const previous = documents.get(digest);
  if (previous) {
    if (!previous.sourceKinds.includes(sourceKind)) previous.sourceKinds.push(sourceKind);
    return digest;
  }
  documents.set(digest, { bytes: bytes.byteLength, sha256: digest, sourceKinds: [sourceKind], text: bytes.toString("utf8") });
  return digest;
}

const npmPackages = [];
for (const path of npmClosure(lock, ["@capacitor/android", "@capacitor/app", "@capacitor/core", "@capacitor/ios", "@capacitor/preferences"])) {
  const packageRoot = resolve(host, path);
  const references = [];
  for (const name of await licenseFile(packageRoot)) references.push({ name, sha256: admitDocument(await readFile(resolve(packageRoot, name)), "NPM_ROOT") });
  npmPackages.push({ name: npmName(path), version: lock.packages[path].version, references });
}

const swiftLicense = resolve(host, "ios/.swiftpm-checkouts/checkouts/capacitor-swift-pm/LICENSE.md");
const swiftBytes = await readFile(swiftLicense).catch(() => fail("exact capacitor-swift-pm checkout LICENSE.md is absent"));
const swift = { name: "capacitor-swift-pm", version: "8.4.1", references: [{ name: "LICENSE.md", sha256: admitDocument(swiftBytes, "SWIFT_ROOT") }] };

let artifactCount = 0;
const androidModules = [];
for (const module of inventory.modules) {
  const root = resolve(cache, module.group, module.name, module.version);
  const files = await filesBelow(root).catch(() => fail(`Android cache coordinate is absent: ${module.coordinate}`));
  const artifacts = [];
  for (const expected of module.artifacts) {
    const matches = [];
    for (const path of files.filter((entry) => basename(entry) === expected.name)) {
      const bytes = await readFile(path);
      if (bytes.byteLength === expected.bytes && sha256(bytes) === expected.sha256) matches.push(path);
    }
    if (matches.length !== 1) fail(`exact Android artifact match count is ${matches.length}: ${module.coordinate}/${expected.name}`);
    artifactCount += 1;
    const path = matches[0];
    const entries = run("unzip", ["-Z1", path]).toString("utf8").split(/\r?\n/).filter(Boolean).filter((entry) => noticeName.test(basename(entry))).sort();
    const references = entries.map((entry) => ({ entry, sha256: admitDocument(run("unzip", ["-p", path, entry]), "ANDROID_ARCHIVE") }));
    artifacts.push({ bytes: expected.bytes, name: expected.name, references, sha256: expected.sha256 });
  }
  androidModules.push({ artifacts, coordinate: module.coordinate });
}

const result = {
  schemaVersion: 1,
  generatedBy: "Luastra Phase 5 exact native runtime notice capturer v1",
  evidenceBoundary: "Exact npm root files, exact Swift checkout file and exact-hash Android runtime archives. Build-only Gradle dependencies remain outside this host-runtime catalog; the owner-approved Luastra Apache-2.0 license is tracked by the root LICENSE and native SPDX documents.",
  npmPackages,
  swift,
  androidModules,
  documents: [...documents.values()].map((item) => ({ ...item, sourceKinds: item.sourceKinds.sort() })).sort((left, right) => left.sha256.localeCompare(right.sha256)),
  summary: {
    npmPackages: npmPackages.length,
    swiftPackages: 1,
    androidModules: androidModules.length,
    androidArtifacts: artifactCount,
    androidArchivesWithEmbeddedNoticeMaterial: androidModules.flatMap((item) => item.artifacts).filter((item) => item.references.length > 0).length,
    uniqueNoticeDocuments: documents.size,
  },
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, json(result));
process.stdout.write(json({ result: "PASS", ...result.summary }));
