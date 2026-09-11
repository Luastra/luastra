import { createHash, randomUUID } from "node:crypto";
import { access, copyFile, mkdir, readFile, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";

import { admitAsset, maximumProjectAssetBytes } from "../assets/asset-policy.mjs";
import { canonicalJson } from "../assets/package-assets.mjs";

const moduleIdPattern = /^[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;
const libraryIdPattern = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;
const capabilityPattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/;
const versionPattern = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const digestPattern = /^[0-9a-f]{64}$/;
const maximumLibraryFiles = 384;
const maximumLibraryBytes = 8 * 1024 * 1024;
const requireCall = /\brequire\s*\(/g;
const literalRequire = /\brequire\s*\(\s*["']([a-z][a-z0-9_-]*(?:\/[a-z][a-z0-9_-]*)*)["']\s*\)/g;

function fail(message) { throw new Error(message); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function exactObject(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.join("\n") !== expected.join("\n")) fail(`${label} must contain exactly: ${expected.join(", ")}`);
}
function uniqueStrings(value, pattern, label, { minimum = 0, maximum = 256 } = {}) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) fail(`${label} must contain ${minimum} to ${maximum} entries`);
  const seen = new Set();
  for (const item of value) {
    if (typeof item !== "string" || !pattern.test(item)) fail(`${label} contains an invalid value: ${item}`);
    if (seen.has(item)) fail(`${label} contains a duplicate: ${item}`);
    seen.add(item);
  }
  return value;
}
function safePath(value, prefix, suffix, label) {
  if (typeof value !== "string" || value.length < 1 || value.length > 512 || isAbsolute(value)) fail(`${label} must be a safe relative path`);
  const normalized = value.split("\\").join("/");
  if ((prefix && !normalized.startsWith(prefix)) || (suffix && !normalized.endsWith(suffix)) || normalized.split("/").some((part) => part === "" || part === "." || part === "..")) {
    fail(`${label} must be a safe relative path`);
  }
  return normalized;
}
function assertInside(root, candidate, label) {
  const fromRoot = relative(root, candidate);
  if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) fail(`${label} resolves outside its library`);
}
function normalizedVersion(value, label = "library version") {
  if (typeof value !== "string" || value.length > 80 || !versionPattern.test(value)) fail(`${label} must be a semantic version`);
  return value;
}
function libraryDirectoryName(id) { return id; }

function validateSourceImports(manifest, files) {
  for (const module of manifest.modules) {
    const file = files.find((entry) => entry.path === module.source);
    const source = Buffer.from(file.content, "base64").toString("utf8");
    const calls = [...source.matchAll(requireCall)].length;
    const imports = [...source.matchAll(literalRequire)].map((match) => match[1]);
    if (calls !== imports.length) fail(`library module ${module.id} contains a dynamic or malformed require`);
    const undeclared = imports.filter((dependency) => !module.dependencies.includes(dependency));
    if (undeclared.length > 0) fail(`library module ${module.id} requires undeclared dependency: ${undeclared[0]}`);
    const unused = module.dependencies.filter((dependency) => !imports.includes(dependency));
    if (unused.length > 0) fail(`library module ${module.id} declares unused dependencies: ${unused.join(", ")}`);
  }
}

export function validateLibraryManifest(value) {
  exactObject(value, ["schemaVersion", "library", "compatibility", "capabilities", "dependencies", "exports", "modules", "assets", "tests", "license", "notice"], "library manifest");
  if (value.schemaVersion !== 1) fail("library manifest schemaVersion must be 1");
  exactObject(value.library, ["id", "version"], "library identity");
  if (!libraryIdPattern.test(value.library.id ?? "")) fail("invalid library.id");
  normalizedVersion(value.library.version);
  exactObject(value.compatibility, ["sdkContract"], "library compatibility");
  exactObject(value.compatibility.sdkContract, ["minimum", "maximum"], "library SDK compatibility");
  const { minimum, maximum } = value.compatibility.sdkContract;
  if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum < 1 || maximum < minimum || maximum > 1024) fail("library SDK compatibility range is invalid");
  uniqueStrings(value.capabilities, capabilityPattern, "library capabilities", { maximum: 64 });

  if (!Array.isArray(value.dependencies) || value.dependencies.length > 64) fail("library dependencies must contain at most 64 entries");
  const dependencyIds = new Set();
  for (const dependency of value.dependencies) {
    exactObject(dependency, ["id", "version", "contentSha256"], "library dependency");
    if (!libraryIdPattern.test(dependency.id ?? "") || dependencyIds.has(dependency.id)) fail(`invalid or duplicate library dependency: ${dependency.id}`);
    dependencyIds.add(dependency.id);
    normalizedVersion(dependency.version, `library dependency ${dependency.id} version`);
    if (!digestPattern.test(dependency.contentSha256 ?? "")) fail(`library dependency ${dependency.id} has an invalid digest`);
  }

  const exports = uniqueStrings(value.exports, moduleIdPattern, "library exports", { minimum: 1, maximum: 64 });
  if (!Array.isArray(value.modules) || value.modules.length < 1 || value.modules.length > 256) fail("library modules must contain 1 to 256 entries");
  const modules = new Map();
  const moduleSources = new Set();
  for (const module of value.modules) {
    exactObject(module, ["id", "source", "dependencies"], `library module ${module?.id ?? "?"}`);
    if (!moduleIdPattern.test(module.id ?? "") || module.id === "luastra" || module.id.startsWith("luastra/") || modules.has(module.id)) fail(`invalid or duplicate library module ID: ${module.id}`);
    const source = safePath(module.source, "source/", ".luau", `library module ${module.id} source`);
    if (moduleSources.has(source)) fail(`duplicate library module source: ${source}`);
    moduleSources.add(source);
    const dependencies = uniqueStrings(module.dependencies, moduleIdPattern, `library module ${module.id} dependencies`);
    if (dependencies.includes(module.id)) fail(`library module ${module.id} depends on itself`);
    modules.set(module.id, { ...module, source, dependencies });
  }
  for (const id of exports) if (!modules.has(id)) fail(`library export is not a declared module: ${id}`);

  if (!Array.isArray(value.assets) || value.assets.length > 256) fail("library assets must contain at most 256 entries");
  const assetIds = new Set();
  const assetSources = new Set();
  for (const asset of value.assets) {
    exactObject(asset, ["id", "source", "mediaType", "sha256"], `library asset ${asset?.id ?? "?"}`);
    if (!moduleIdPattern.test(asset.id ?? "") || assetIds.has(asset.id)) fail(`invalid or duplicate library asset ID: ${asset.id}`);
    assetIds.add(asset.id);
    const source = safePath(asset.source, "assets/", null, `library asset ${asset.id} source`);
    if (assetSources.has(source)) fail(`duplicate library asset source: ${source}`);
    assetSources.add(source);
    if (!digestPattern.test(asset.sha256 ?? "")) fail(`library asset ${asset.id} has an invalid digest`);
  }
  const tests = uniqueStrings(value.tests, moduleIdPattern, "library tests", { minimum: 1, maximum: 64 });
  for (const id of tests) if (!modules.has(id)) fail(`library test is not a declared module: ${id}`);
  exactObject(value.license, ["spdx", "file"], "library license");
  if (typeof value.license.spdx !== "string" || !/^[A-Za-z0-9.+-]{1,64}$/.test(value.license.spdx)) fail("library license.spdx is invalid");
  const licenseFile = safePath(value.license.file, null, null, "library license file");
  exactObject(value.notice, ["file"], "library notice");
  const noticeFile = safePath(value.notice.file, null, null, "library notice file");
  if (licenseFile === noticeFile) fail("library license and notice files must differ");

  const state = new Map();
  const visit = (id, path = []) => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") fail(`library module dependency cycle: ${[...path, id].join(" -> ")}`);
    state.set(id, "visiting");
    for (const dependency of modules.get(id).dependencies) if (modules.has(dependency)) visit(dependency, [...path, id]);
    state.set(id, "done");
  };
  for (const id of [...modules.keys()].sort()) visit(id);
  return Object.freeze(value);
}

async function readLibrarySource(rootValue) {
  const root = await realpath(resolve(rootValue));
  const info = await stat(root);
  if (!info.isDirectory()) fail("library source must be a directory");
  const manifestPath = resolve(root, "luastra-library.json");
  const manifest = validateLibraryManifest(JSON.parse(await readFile(manifestPath, "utf8")));
  const declared = new Set(["luastra-library.json", manifest.license.file, manifest.notice.file]);
  for (const module of manifest.modules) declared.add(module.source);
  for (const asset of manifest.assets) declared.add(asset.source);
  if (declared.size > maximumLibraryFiles) fail(`library exceeds ${maximumLibraryFiles} declared files`);
  const files = [];
  let totalBytes = 0;
  for (const path of [...declared].sort()) {
    const candidate = await realpath(resolve(root, path)).catch(() => null);
    if (!candidate || !(await stat(candidate)).isFile()) fail(`library declared file not found: ${path}`);
    assertInside(root, candidate, `library file ${path}`);
    const bytes = await readFile(candidate);
    totalBytes += bytes.byteLength;
    if (totalBytes > maximumLibraryBytes) fail(`library exceeds ${maximumLibraryBytes} bytes`);
    const digest = sha256(bytes);
    const asset = manifest.assets.find((entry) => entry.source === path);
    if (asset) {
      if (asset.sha256 !== digest) fail(`library asset integrity mismatch: ${asset.id}`);
      admitAsset({ id: asset.id, source: asset.source, mediaType: asset.mediaType, bytes });
    }
    files.push(Object.freeze({ path, bytes: bytes.byteLength, sha256: digest, content: bytes.toString("base64") }));
  }
  const ledger = files.map(({ content: _content, ...entry }) => entry);
  validateSourceImports(manifest, files);
  const contentSha256 = sha256(canonicalJson({ manifest, files: ledger }));
  return Object.freeze({ root, manifest, files: Object.freeze(files), ledger: Object.freeze(ledger), contentSha256, bytes: totalBytes });
}

function validatePackage(value) {
  exactObject(value, ["schemaVersion", "kind", "manifest", "files", "contentSha256"], "library package");
  if (value.schemaVersion !== 1 || value.kind !== "luastra-library") fail("unsupported library package");
  const manifest = validateLibraryManifest(value.manifest);
  if (!Array.isArray(value.files) || value.files.length < 3 || value.files.length > maximumLibraryFiles) fail("library package has an invalid file count");
  const seen = new Set();
  let totalBytes = 0;
  const files = value.files.map((file) => {
    exactObject(file, ["path", "bytes", "sha256", "encoding", "content"], "library package file");
    const path = safePath(file.path, null, null, "library package file path");
    if (seen.has(path)) fail(`library package contains duplicate file: ${path}`);
    seen.add(path);
    if (file.encoding !== "base64" || !Number.isSafeInteger(file.bytes) || file.bytes < 0 || !digestPattern.test(file.sha256 ?? "") || typeof file.content !== "string") fail(`library package file metadata is invalid: ${path}`);
    const bytes = Buffer.from(file.content, "base64");
    if (bytes.toString("base64") !== file.content || bytes.byteLength !== file.bytes || sha256(bytes) !== file.sha256) fail(`library package file integrity mismatch: ${path}`);
    totalBytes += bytes.byteLength;
    if (totalBytes > maximumLibraryBytes) fail(`library package exceeds ${maximumLibraryBytes} bytes`);
    return Object.freeze({ path, bytes: file.bytes, sha256: file.sha256, content: file.content });
  });
  const required = new Set(["luastra-library.json", manifest.license.file, manifest.notice.file, ...manifest.modules.map((module) => module.source), ...manifest.assets.map((asset) => asset.source)]);
  if (required.size !== seen.size || [...required].some((path) => !seen.has(path))) fail("library package file closure does not match its manifest");
  const embeddedManifest = JSON.parse(Buffer.from(files.find((file) => file.path === "luastra-library.json").content, "base64").toString("utf8"));
  if (canonicalJson(embeddedManifest) !== canonicalJson(manifest)) fail("library package embedded manifest does not match package metadata");
  for (const asset of manifest.assets) {
    const file = files.find((entry) => entry.path === asset.source);
    if (asset.sha256 !== file.sha256) fail(`library asset integrity mismatch: ${asset.id}`);
    admitAsset({ id: asset.id, source: asset.source, mediaType: asset.mediaType, bytes: Buffer.from(file.content, "base64") });
  }
  const ledger = files.map(({ content: _content, ...entry }) => entry);
  validateSourceImports(manifest, files);
  const contentSha256 = sha256(canonicalJson({ manifest, files: ledger }));
  if (value.contentSha256 !== contentSha256) fail("library package content digest mismatch");
  return Object.freeze({ manifest, files: Object.freeze(files), ledger: Object.freeze(ledger), contentSha256, bytes: totalBytes });
}

async function readPackageOrSource(value) {
  const source = resolve(value);
  const info = await stat(source).catch(() => null);
  if (!info) fail(`library source not found: ${source}`);
  if (info.isDirectory()) return readLibrarySource(source);
  if (!info.isFile()) fail("library source must be a directory or regular package file");
  const bytes = await readFile(source);
  if (bytes.byteLength > maximumLibraryBytes * 2) fail("library package exceeds its encoded size budget");
  return validatePackage(JSON.parse(bytes.toString("utf8")));
}

export async function checkLibrary(source = ".") {
  const library = await readPackageOrSource(source);
  return Object.freeze({ result: "PASS", library: library.manifest.library.id, version: library.manifest.library.version, modules: library.manifest.modules.length, assets: library.manifest.assets.length, tests: library.manifest.tests.length, bytes: library.bytes, contentSha256: library.contentSha256 });
}

export async function packLibrary(source = ".", output = null) {
  const library = await readLibrarySource(source);
  const filename = `${library.manifest.library.id}-${library.manifest.library.version}.luastra-library`;
  const destination = resolve(output ?? resolve(library.root, "dist", filename));
  if (await stat(destination).catch(() => null)) fail(`library package output already exists: ${destination}`);
  await mkdir(dirname(destination), { recursive: true });
  const packageValue = {
    schemaVersion: 1,
    kind: "luastra-library",
    manifest: library.manifest,
    files: library.files.map((file) => ({ ...file, encoding: "base64" })),
    contentSha256: library.contentSha256,
  };
  const temporary = `${destination}.tmp-${randomUUID()}`;
  try {
    await writeFile(temporary, canonicalJson(packageValue), { flag: "wx" });
    await rename(temporary, destination);
  } finally { await rm(temporary, { force: true }); }
  return Object.freeze({ ...await checkLibrary(destination), output: destination });
}

async function readLock(projectRoot, { optional = true } = {}) {
  const path = resolve(projectRoot, "luastra.lock.json");
  const bytes = await readFile(path).catch((error) => {
    if (optional && error?.code === "ENOENT") return null;
    throw error;
  });
  if (bytes === null) return { path, value: { schemaVersion: 1, libraries: [] } };
  const text = bytes.toString("utf8");
  const value = JSON.parse(text);
  exactObject(value, ["schemaVersion", "libraries"], "project library lockfile");
  if (value.schemaVersion !== 1 || !Array.isArray(value.libraries) || value.libraries.length > 64) fail("project library lockfile is invalid");
  if (text !== canonicalJson(value)) fail("project library lockfile must use canonical JSON");
  const seen = new Set();
  for (const entry of value.libraries) {
    exactObject(entry, ["id", "version", "contentSha256", "files"], "locked library");
    if (!libraryIdPattern.test(entry.id ?? "") || seen.has(entry.id)) fail(`invalid or duplicate locked library: ${entry.id}`);
    seen.add(entry.id);
    normalizedVersion(entry.version, `locked library ${entry.id} version`);
    if (!digestPattern.test(entry.contentSha256 ?? "") || !Array.isArray(entry.files) || entry.files.length < 3 || entry.files.length > maximumLibraryFiles) fail(`locked library ${entry.id} metadata is invalid`);
    for (const file of entry.files) {
      exactObject(file, ["path", "bytes", "sha256"], `locked library ${entry.id} file`);
      safePath(file.path, null, null, `locked library ${entry.id} file path`);
      if (!Number.isSafeInteger(file.bytes) || file.bytes < 0 || !digestPattern.test(file.sha256 ?? "")) fail(`locked library ${entry.id} file metadata is invalid`);
    }
  }
  return { path, value };
}

function validateLibraryGraph(closure, modules) {
  const libraries = new Map(closure.map((library) => [library.id, library]));
  const moduleOwners = new Map();
  for (const module of modules) {
    if (moduleOwners.has(module.id)) fail(`library module collision: ${module.id}`);
    moduleOwners.set(module.id, module.library);
  }
  for (const library of closure) {
    const allowedLibraries = new Set(library.dependencies.map((dependency) => dependency.id));
    for (const dependency of library.dependencies) {
      if (!libraries.has(dependency.id)) fail(`library dependency is not installed: ${library.id} -> ${dependency.id}@${dependency.version}`);
    }
    for (const module of modules) {
      if (module.library !== library.id) continue;
      for (const dependency of module.dependencies) {
        if (dependency.startsWith("luastra/")) continue;
        const owner = moduleOwners.get(dependency);
        if (owner === library.id) continue;
        if (owner === undefined) fail(`library module ${module.id} requires unavailable module: ${dependency}`);
        if (!allowedLibraries.has(owner)) fail(`library module ${module.id} requires undeclared library dependency: ${owner}`);
      }
    }
  }
  const state = new Map();
  const visit = (id, path = []) => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") fail(`library dependency cycle: ${[...path, id].join(" -> ")}`);
    state.set(id, "visiting");
    for (const dependency of libraries.get(id).dependencies) visit(dependency.id, [...path, id]);
    state.set(id, "done");
  };
  for (const id of [...libraries.keys()].sort()) visit(id);
}

function lockEntry(library) {
  return Object.freeze({ id: library.manifest.library.id, version: library.manifest.library.version, contentSha256: library.contentSha256, files: library.ledger });
}

async function writeLock(path, value) {
  const temporary = `${path}.tmp-${randomUUID()}`;
  try {
    await writeFile(temporary, canonicalJson({ schemaVersion: 1, libraries: [...value.libraries].sort((left, right) => left.id.localeCompare(right.id)) }), { flag: "wx" });
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
}

async function materializeLibrary(library, destination) {
  await mkdir(destination, { recursive: false });
  for (const file of library.files) {
    const target = resolve(destination, file.path);
    assertInside(destination, target, `library file ${file.path}`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(file.content, "base64"), { flag: "wx" });
  }
}

export async function installLibrary({ project, source, expectedVersion = null, update = false }) {
  const projectRoot = await realpath(resolve(project));
  if (!(await stat(projectRoot)).isDirectory() || !(await access(resolve(projectRoot, "luastra.json")).then(() => true, () => false))) fail("library install target is not a Luastra project");
  const library = await readPackageOrSource(source);
  const { id, version } = library.manifest.library;
  if (expectedVersion !== null && version !== expectedVersion) fail(`library version ${version} does not match requested version ${expectedVersion}`);
  const lock = await readLock(projectRoot);
  const existing = lock.value.libraries.find((entry) => entry.id === id);
  if (update && !existing) fail(`library is not installed: ${id}`);
  if (!update && existing) fail(`library is already installed: ${id}`);
  const projectManifest = JSON.parse(await readFile(resolve(projectRoot, "luastra.json"), "utf8"));
  const sdkContract = projectManifest?.sdk?.contract;
  const applicationCapabilities = Array.isArray(projectManifest?.capabilities) ? projectManifest.capabilities : [];
  const compatibility = library.manifest.compatibility.sdkContract;
  if (!Number.isSafeInteger(sdkContract) || sdkContract < compatibility.minimum || sdkContract > compatibility.maximum) fail(`library ${id}@${version} is incompatible with SDK contract ${String(sdkContract)}`);
  const missingCapabilities = library.manifest.capabilities.filter((capability) => !applicationCapabilities.includes(capability));
  if (missingCapabilities.length > 0) fail(`library ${id}@${version} requires undeclared application capabilities: ${missingCapabilities.join(", ")}`);
  for (const dependency of library.manifest.dependencies) {
    const locked = lock.value.libraries.find((candidate) => candidate.id === dependency.id);
    if (!locked || locked.version !== dependency.version || locked.contentSha256 !== dependency.contentSha256) fail(`library dependency mismatch: ${id} -> ${dependency.id}@${dependency.version}`);
  }
  const installedClosure = await loadLockedLibraries(projectRoot, { sdkContract, capabilities: applicationCapabilities });
  const occupiedModules = new Set((projectManifest.modules ?? []).map((module) => module.id));
  const occupiedAssets = new Set((projectManifest.assets ?? []).map((asset) => asset.id));
  for (const module of installedClosure.modules) if (module.library !== id) occupiedModules.add(module.id);
  for (const asset of installedClosure.assets) if (asset.library !== id) occupiedAssets.add(asset.id);
  for (const module of library.manifest.modules) if (occupiedModules.has(module.id)) fail(`library module collision: ${module.id}`);
  for (const asset of library.manifest.assets) if (occupiedAssets.has(asset.id)) fail(`library asset collision: ${asset.id}`);
  validateLibraryGraph(
    [...installedClosure.closure.filter((entry) => entry.id !== id), { id, dependencies: library.manifest.dependencies }],
    [
      ...installedClosure.modules.filter((module) => module.library !== id),
      ...library.manifest.modules.map((module) => ({ ...module, library: id })),
    ],
  );
  const librariesRootPath = resolve(projectRoot, ".luastra/libraries");
  await mkdir(librariesRootPath, { recursive: true });
  const librariesRoot = await realpath(librariesRootPath);
  assertInside(projectRoot, librariesRoot, "project library directory");
  const libraryRootPath = resolve(librariesRoot, libraryDirectoryName(id));
  await mkdir(libraryRootPath, { recursive: true });
  const libraryRoot = await realpath(libraryRootPath);
  assertInside(librariesRoot, libraryRoot, `library directory ${id}`);
  const destination = resolve(libraryRoot, version);
  if (await stat(destination).catch(() => null)) fail(`library installation already exists: ${id}@${version}`);
  const staging = resolve(librariesRoot, `.staging-${randomUUID()}`);
  let installed = false;
  try {
    await materializeLibrary(library, staging);
    await mkdir(dirname(destination), { recursive: true });
    await rename(staging, destination);
    installed = true;
    const next = lock.value.libraries.filter((entry) => entry.id !== id);
    next.push(lockEntry(library));
    await writeLock(lock.path, { schemaVersion: 1, libraries: next });
  } catch (error) {
    if (installed) await rm(destination, { recursive: true, force: true });
    throw error;
  } finally { await rm(staging, { recursive: true, force: true }); }
  if (update && (existing.version !== version || existing.contentSha256 !== library.contentSha256)) {
    const previous = resolve(librariesRoot, libraryDirectoryName(id), existing.version);
    if (previous !== destination) await rm(previous, { recursive: true, force: true });
  }
  return Object.freeze({ result: "PASS", library: id, version, contentSha256: library.contentSha256, previousVersion: existing?.version ?? null });
}

export async function removeLibrary({ project, id }) {
  if (!libraryIdPattern.test(id ?? "")) fail("invalid library ID");
  const projectRoot = await realpath(resolve(project));
  const lock = await readLock(projectRoot, { optional: false });
  const existing = lock.value.libraries.find((entry) => entry.id === id);
  if (!existing) fail(`library is not installed: ${id}`);
  const projectManifest = JSON.parse(await readFile(resolve(projectRoot, "luastra.json"), "utf8"));
  const closure = await loadLockedLibraries(projectRoot, { sdkContract: projectManifest?.sdk?.contract, capabilities: projectManifest?.capabilities ?? [] });
  for (const entry of closure.closure) {
    if (entry.id !== id && entry.dependencies.some((dependency) => dependency.id === id)) fail(`library is required by ${entry.id}: ${id}`);
  }
  const librariesRoot = await realpath(resolve(projectRoot, ".luastra/libraries"));
  assertInside(projectRoot, librariesRoot, "project library directory");
  const installed = await realpath(resolve(librariesRoot, libraryDirectoryName(id), existing.version));
  assertInside(librariesRoot, installed, `installed library ${id}`);
  const quarantine = resolve(librariesRoot, `.remove-${randomUUID()}`);
  await rename(installed, quarantine);
  try {
    await writeLock(lock.path, { schemaVersion: 1, libraries: lock.value.libraries.filter((entry) => entry.id !== id) });
  } catch (error) {
    await rename(quarantine, installed);
    throw error;
  }
  await rm(quarantine, { recursive: true, force: true });
  return Object.freeze({ result: "PASS", library: id, version: existing.version });
}

export async function loadLockedLibraries(projectRoot, { sdkContract, capabilities }) {
  const lock = await readLock(projectRoot);
  const modules = [];
  const assets = [];
  const tests = [];
  const closure = [];
  let totalAssetBytes = 0;
  for (const entry of [...lock.value.libraries].sort((left, right) => left.id.localeCompare(right.id))) {
    const root = await realpath(resolve(projectRoot, ".luastra/libraries", libraryDirectoryName(entry.id), entry.version)).catch(() => null);
    if (!root) fail(`locked library directory is missing: ${entry.id}@${entry.version}`);
    assertInside(projectRoot, root, `locked library ${entry.id}@${entry.version}`);
    const source = await readLibrarySource(root).catch((error) => fail(`locked library ${entry.id}@${entry.version} is invalid: ${error.message}`));
    if (source.manifest.library.id !== entry.id || source.manifest.library.version !== entry.version || source.contentSha256 !== entry.contentSha256 || canonicalJson(source.ledger) !== canonicalJson(entry.files)) fail(`locked library integrity mismatch: ${entry.id}@${entry.version}`);
    const range = source.manifest.compatibility.sdkContract;
    if (sdkContract < range.minimum || sdkContract > range.maximum) fail(`library ${entry.id}@${entry.version} is incompatible with SDK contract ${sdkContract}`);
    const missingCapabilities = source.manifest.capabilities.filter((capability) => !capabilities.includes(capability));
    if (missingCapabilities.length > 0) fail(`library ${entry.id}@${entry.version} requires undeclared application capabilities: ${missingCapabilities.join(", ")}`);
    for (const dependency of source.manifest.dependencies) {
      const locked = lock.value.libraries.find((candidate) => candidate.id === dependency.id);
      if (!locked || locked.version !== dependency.version || locked.contentSha256 !== dependency.contentSha256) fail(`library dependency mismatch: ${entry.id} -> ${dependency.id}@${dependency.version}`);
    }
    for (const module of source.manifest.modules) modules.push(Object.freeze({ id: module.id, source: module.source, sourcePath: resolve(root, module.source), dependencies: Object.freeze([...module.dependencies]), library: entry.id }));
    for (const asset of source.manifest.assets) {
      const file = source.ledger.find((candidate) => candidate.path === asset.source);
      const bytes = await readFile(resolve(root, asset.source));
      const policy = admitAsset({ id: asset.id, source: asset.source, mediaType: asset.mediaType, bytes });
      totalAssetBytes += file.bytes;
      if (totalAssetBytes > maximumProjectAssetBytes) fail(`library assets exceed ${maximumProjectAssetBytes} bytes`);
      assets.push(Object.freeze({ id: asset.id, kind: policy.kind, source: asset.source, sourcePath: resolve(root, asset.source), outputPath: `assets/${asset.id}${policy.outputExtension}`, mediaType: asset.mediaType, bytes: file.bytes, sha256: file.sha256, library: entry.id }));
    }
    tests.push(...source.manifest.tests);
    closure.push(Object.freeze({ id: entry.id, version: entry.version, contentSha256: entry.contentSha256, capabilities: Object.freeze([...source.manifest.capabilities]), dependencies: Object.freeze(source.manifest.dependencies.map((dependency) => Object.freeze({ ...dependency }))), license: Object.freeze({ ...source.manifest.license }), notice: Object.freeze({ ...source.manifest.notice }), licensePath: resolve(root, source.manifest.license.file), noticePath: resolve(root, source.manifest.notice.file) }));
  }
  validateLibraryGraph(closure, modules);
  return Object.freeze({ modules: Object.freeze(modules), assets: Object.freeze(assets), tests: Object.freeze(tests), closure: Object.freeze(closure), lockPath: lock.path });
}

export async function packageLibraryCompliance(project, outputRoot) {
  if (project.libraries.length === 0) return Object.freeze({ libraries: 0, manifestSha256: null, noticesSha256: null, sbomSha256: null });
  const records = project.libraries.map(({ id, version, contentSha256, capabilities, dependencies, license, notice }) => ({ id, version, contentSha256, capabilities: [...capabilities].sort(), dependencies, license, notice }));
  const manifestText = canonicalJson({ schemaVersion: 1, project: project.id, libraries: records });
  const notices = ["# Project library notices", ""];
  for (const library of project.libraries) {
    const noticeText = await readFile(library.noticePath, "utf8");
    notices.push(`## ${library.id} ${library.version}`, "", `License: ${library.license.spdx}`, "", noticeText.trim(), "");
  }
  const noticesText = `${notices.join("\n").trim()}\n`;
  const namespaceDigest = sha256(canonicalJson({ project: project.id, libraries: records.map(({ id, version, contentSha256 }) => ({ id, version, contentSha256 })) }));
  const packages = records.map((library, index) => ({
    name: library.id,
    SPDXID: `SPDXRef-Library-${index + 1}`,
    versionInfo: library.version,
    downloadLocation: "NOASSERTION",
    filesAnalyzed: false,
    licenseConcluded: library.license.spdx,
    licenseDeclared: library.license.spdx,
    checksums: [{ algorithm: "SHA256", checksumValue: library.contentSha256 }],
    copyrightText: "NOASSERTION",
  }));
  const sbomText = canonicalJson({
    spdxVersion: "SPDX-2.3",
    dataLicense: "CC0-1.0",
    SPDXID: "SPDXRef-DOCUMENT",
    name: `${project.id} library closure`,
    documentNamespace: `https://luastra.dev/spdx/project/${namespaceDigest}`,
    creationInfo: { created: "1970-01-01T00:00:00Z", creators: ["Tool: Luastra library packager"] },
    packages,
    relationships: packages.map((item) => ({ spdxElementId: "SPDXRef-DOCUMENT", relationshipType: "DESCRIBES", relatedSpdxElement: item.SPDXID })),
  });
  await Promise.all([
    writeFile(resolve(outputRoot, "project-libraries.json"), manifestText),
    writeFile(resolve(outputRoot, "PROJECT_LIBRARY_NOTICES.md"), noticesText),
    writeFile(resolve(outputRoot, "project-library-sbom.spdx.json"), sbomText),
  ]);
  return Object.freeze({ libraries: records.length, manifestSha256: sha256(manifestText), noticesSha256: sha256(noticesText), sbomSha256: sha256(sbomText) });
}
