import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

import { admitAsset, maximumProjectAssetBytes } from "../assets/asset-policy.mjs";
import { loadBackendContract } from "../backend/contract.mjs";

const moduleIdPattern = /^[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;
const projectIdPattern = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;
const capabilityPattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/;

function fail(message) {
  throw new Error(message);
}

function exactObject(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.join("\n") !== expected.join("\n")) fail(`${label} must contain exactly: ${expected.join(", ")}`);
}

function objectShape(value, required, optional, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const allowed = new Set([...required, ...optional]);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  const missing = required.filter((key) => !(key in value));
  if (unknown.length > 0 || missing.length > 0) fail(`${label} has invalid fields${unknown.length ? `; unknown: ${unknown.join(", ")}` : ""}${missing.length ? `; missing: ${missing.join(", ")}` : ""}`);
}

function uniqueStrings(value, pattern, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  const seen = new Set();
  for (const item of value) {
    if (typeof item !== "string" || !pattern.test(item)) fail(`${label} contains an invalid value: ${item}`);
    if (seen.has(item)) fail(`${label} contains a duplicate: ${item}`);
    seen.add(item);
  }
  return value;
}

function assertInside(root, candidate, label) {
  const fromRoot = relative(root, candidate);
  if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) fail(`${label} resolves outside the project`);
}

export async function loadProject(manifestValue, { allowMissingGenerated = false } = {}) {
  const manifestPath = resolve(manifestValue);
  const manifestInfo = await stat(manifestPath).catch(() => null);
  if (!manifestInfo?.isFile()) fail(`project manifest not found: ${manifestPath}`);
  const projectRoot = await realpath(dirname(manifestPath));
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  objectShape(manifest, ["schemaVersion", "project", "sdk", "capabilities", "modules"], ["assets", "tests", "backend"], "manifest");
  if (manifest.schemaVersion !== 2) fail("project schemaVersion must be 2");
  exactObject(manifest.project, ["id", "entry"], "project");
  if (!projectIdPattern.test(manifest.project.id ?? "")) fail("invalid project.id");
  if (!moduleIdPattern.test(manifest.project.entry ?? "")) fail("invalid project.entry");
  exactObject(manifest.sdk, ["contract"], "sdk");
  if (manifest.sdk.contract !== 1) fail(`unsupported SDK contract: ${manifest.sdk.contract}`);
  uniqueStrings(manifest.capabilities, capabilityPattern, "capabilities");
  if (!Array.isArray(manifest.modules) || manifest.modules.length < 1 || manifest.modules.length > 256) fail("modules must contain 1 to 256 entries");

  const modules = new Map();
  const sourcePaths = new Set();
  for (const module of manifest.modules) {
    exactObject(module, ["id", "source", "dependencies"], `module ${module?.id ?? "?"}`);
    if (!moduleIdPattern.test(module.id ?? "")) fail(`invalid module ID: ${module.id}`);
    if (module.id === "luastra" || module.id.startsWith("luastra/")) fail(`project module uses reserved SDK namespace: ${module.id}`);
    if (modules.has(module.id)) fail(`duplicate module ID: ${module.id}`);
    if (typeof module.source !== "string" || module.source.length === 0 || isAbsolute(module.source)) fail(`module ${module.id} source must be a relative path`);
    const normalizedSource = module.source.split("\\").join("/");
    if (!normalizedSource.endsWith(".luau") || normalizedSource.split("/").some((part) => part === "" || part === ".." || part === ".")) {
      fail(`module ${module.id} has an invalid Luau source path`);
    }
    if (sourcePaths.has(normalizedSource)) fail(`duplicate module source: ${normalizedSource}`);
    sourcePaths.add(normalizedSource);
    const dependencies = uniqueStrings(module.dependencies, moduleIdPattern, `module ${module.id} dependencies`);
    if (dependencies.includes(module.id)) fail(`module ${module.id} depends on itself`);
    const unresolvedSource = resolve(projectRoot, normalizedSource);
    const sourcePath = await realpath(unresolvedSource).catch(() => allowMissingGenerated && manifest.backend?.generatedClient === normalizedSource ? unresolvedSource : null);
    if (!sourcePath) fail(`module ${module.id} source not found: ${normalizedSource}`);
    assertInside(projectRoot, sourcePath, `module ${module.id} source`);
    if ((await stat(sourcePath).catch(() => null))?.isFile() !== true && !(allowMissingGenerated && manifest.backend?.generatedClient === normalizedSource)) fail(`module ${module.id} source is not a regular file`);
    modules.set(module.id, Object.freeze({ id: module.id, source: normalizedSource, sourcePath, dependencies: Object.freeze([...dependencies]) }));
  }
  if (!modules.has(manifest.project.entry)) fail(`project entry is not declared: ${manifest.project.entry}`);
  if (!Array.isArray(manifest.assets ?? [])) fail("assets must be an array");
  if ((manifest.assets ?? []).length > 256) fail("assets may contain at most 256 entries");
  const assets = [];
  const assetIds = new Set();
  const assetSources = new Set();
  const assetOutputs = new Set();
  let totalAssetBytes = 0;
  for (const asset of manifest.assets ?? []) {
    exactObject(asset, ["id", "source", "mediaType"], `asset ${asset?.id ?? "?"}`);
    if (!moduleIdPattern.test(asset.id ?? "") || assetIds.has(asset.id)) fail(`invalid or duplicate asset ID: ${asset.id}`);
    assetIds.add(asset.id);
    if (typeof asset.source !== "string" || isAbsolute(asset.source)) fail(`asset ${asset.id} source must be relative`);
    const normalizedSource = asset.source.split("\\").join("/");
    if (!normalizedSource.startsWith("assets/") || normalizedSource.split("/").some((part) => part === "" || part === "." || part === "..")) fail(`asset ${asset.id} must use a safe assets/ source path`);
    if (assetSources.has(normalizedSource)) fail(`duplicate asset source: ${normalizedSource}`);
    assetSources.add(normalizedSource);
    const sourcePath = await realpath(resolve(projectRoot, normalizedSource)).catch(() => null);
    if (!sourcePath) fail(`asset ${asset.id} source not found: ${normalizedSource}`);
    assertInside(projectRoot, sourcePath, `asset ${asset.id} source`);
    if (!(await stat(sourcePath)).isFile()) fail(`asset ${asset.id} source is not a regular file`);
    const bytes = await readFile(sourcePath);
    const policy = admitAsset({ id: asset.id, source: normalizedSource, mediaType: asset.mediaType, bytes });
    totalAssetBytes += bytes.byteLength;
    if (totalAssetBytes > maximumProjectAssetBytes) fail(`project assets exceed ${maximumProjectAssetBytes} bytes`);
    const outputPath = `assets/${asset.id}${policy.outputExtension}`;
    if (assetOutputs.has(outputPath)) fail(`duplicate asset output: ${outputPath}`);
    assetOutputs.add(outputPath);
    assets.push(Object.freeze({
      id: asset.id,
      kind: policy.kind,
      source: normalizedSource,
      sourcePath,
      outputPath,
      mediaType: asset.mediaType,
      bytes: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    }));
  }
  const tests = uniqueStrings(manifest.tests ?? [], moduleIdPattern, "tests");
  if (tests.length > 64) fail("tests may contain at most 64 entries");
  for (const test of tests) {
    if (!modules.has(test)) fail(`test module is not declared: ${test}`);
    if (test === manifest.project.entry) fail(`application entry cannot also be a test: ${test}`);
  }
  let backend = null;
  if (manifest.backend !== undefined) {
    objectShape(manifest.backend, ["declaration", "handler", "generatedClient", "generatedModule"], ["authentication", "database", "content", "identity"], "backend");
    const authentication = manifest.backend.authentication ?? "development";
    if (!["development", "session"].includes(authentication)) fail("backend.authentication must be development or session");
    let database = Object.freeze({ provider: "memory", path: null });
    if (manifest.backend.database !== undefined) {
      exactObject(manifest.backend.database, ["provider", "path"], "backend.database");
      if (manifest.backend.database.provider !== "sqlite") fail("backend.database.provider must be sqlite");
      const databaseSource = manifest.backend.database.path;
      if (typeof databaseSource !== "string" || !databaseSource.endsWith(".sqlite") || isAbsolute(databaseSource) || databaseSource.split(/[\\/]/).some((part) => part === "" || part === "." || part === "..")) fail("backend.database.path must be a safe relative .sqlite path");
      const databasePath = resolve(projectRoot, databaseSource);
      assertInside(projectRoot, databasePath, "backend database");
      const existingDatabase = await stat(databasePath).catch(() => null);
      if (existingDatabase && !existingDatabase.isFile()) fail("backend database path is not a regular file");
      if (existingDatabase) assertInside(projectRoot, await realpath(databasePath), "backend database");
      let existingParent = dirname(databasePath);
      while (!(await stat(existingParent).catch(() => null))) {
        const parent = dirname(existingParent);
        if (parent === existingParent) fail("backend database parent is unavailable");
        existingParent = parent;
      }
      assertInside(projectRoot, await realpath(existingParent), "backend database parent");
      database = Object.freeze({ provider: "sqlite", path: databasePath, source: databaseSource.split("\\").join("/") });
    }
    let identity = Object.freeze({ provider: "none" });
    if (manifest.backend.identity !== undefined) {
      exactObject(manifest.backend.identity, ["provider"], "backend.identity");
      if (!["local-password", "supabase"].includes(manifest.backend.identity.provider)) fail("backend.identity.provider must be local-password or supabase");
      if (manifest.backend.identity.provider === "local-password" && database.provider !== "sqlite") fail("local-password identity requires a persistent sqlite database");
      if (manifest.backend.identity.provider === "supabase" && authentication !== "session") fail("supabase identity requires session authentication");
      identity = Object.freeze({ provider: manifest.backend.identity.provider });
    }
    if (!Array.isArray(manifest.backend.content ?? []) || (manifest.backend.content ?? []).length > 64) fail("backend.content must contain at most 64 items");
    const content = [];
    const contentIds = new Set();
    const contentSources = new Set();
    let totalContentBytes = 0;
    for (const item of manifest.backend.content ?? []) {
      exactObject(item, ["id", "source", "mediaType"], `backend content ${item?.id ?? "?"}`);
      if (!moduleIdPattern.test(item.id ?? "") || contentIds.has(item.id)) fail(`invalid or duplicate backend content ID: ${item.id}`);
      contentIds.add(item.id);
      if (typeof item.source !== "string" || isAbsolute(item.source)) fail(`backend content ${item.id} source must be relative`);
      const normalizedSource = item.source.split("\\").join("/");
      if (!normalizedSource.startsWith("content/") || normalizedSource.split("/").some((part) => part === "" || part === "." || part === "..") || contentSources.has(normalizedSource)) fail(`backend content ${item.id} must use a unique safe content/ source path`);
      contentSources.add(normalizedSource);
      const sourcePath = await realpath(resolve(projectRoot, normalizedSource)).catch(() => null);
      if (!sourcePath || !(await stat(sourcePath)).isFile()) fail(`backend content ${item.id} source not found`);
      assertInside(projectRoot, sourcePath, `backend content ${item.id}`);
      const bytes = await readFile(sourcePath);
      admitAsset({ id: item.id, source: normalizedSource, mediaType: item.mediaType, bytes });
      totalContentBytes += bytes.byteLength;
      if (totalContentBytes > maximumProjectAssetBytes) fail(`backend content exceeds ${maximumProjectAssetBytes} bytes`);
      content.push(Object.freeze({ id: item.id, source: normalizedSource, path: sourcePath, mediaType: item.mediaType, bytes: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") }));
    }
    for (const name of ["declaration", "handler", "generatedClient"]) {
      const value = manifest.backend[name];
      if (typeof value !== "string" || value.length === 0 || isAbsolute(value) || value.split(/[\\/]/).some((part) => part === "" || part === "." || part === "..")) fail(`backend.${name} must be a safe relative path`);
    }
    if (!manifest.backend.declaration.endsWith(".json") || !manifest.backend.handler.endsWith(".mjs") || !manifest.backend.generatedClient.endsWith(".luau")) fail("backend paths use invalid file types");
    if (!moduleIdPattern.test(manifest.backend.generatedModule ?? "")) fail("backend.generatedModule is invalid");
    const generated = modules.get(manifest.backend.generatedModule);
    if (!generated || generated.source !== manifest.backend.generatedClient || !generated.dependencies.includes("luastra/server")) fail("backend generated module must declare its generatedClient source and depend on luastra/server");
    const handlerPath = await realpath(resolve(projectRoot, manifest.backend.handler)).catch(() => null);
    if (!handlerPath || !(await stat(handlerPath)).isFile()) fail("backend handler is not a regular file");
    assertInside(projectRoot, handlerPath, "backend handler");
    const handlerBytes = await readFile(handlerPath);
    const contract = await loadBackendContract(manifest.backend.declaration, projectRoot);
    backend = Object.freeze({
      declaration: contract,
      handlerPath,
      handlerSource: manifest.backend.handler.split("\\").join("/"),
      handlerSha256: createHash("sha256").update(handlerBytes).digest("hex"),
      generatedClientPath: resolve(projectRoot, manifest.backend.generatedClient),
      generatedClientSource: manifest.backend.generatedClient.split("\\").join("/"),
      generatedModule: manifest.backend.generatedModule,
      authentication,
      database,
      identity,
      content: Object.freeze(content),
    });
  }
  return Object.freeze({
    manifestPath,
    projectRoot,
    id: manifest.project.id,
    entry: manifest.project.entry,
    sdkContract: manifest.sdk.contract,
    capabilities: Object.freeze([...manifest.capabilities]),
    modules,
    assets: Object.freeze(assets),
    tests: Object.freeze([...tests]),
    backend,
  });
}
