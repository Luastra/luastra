import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

import { admitAsset, maximumProjectAssetBytes } from "../assets/asset-policy.mjs";
import { loadBackendContract } from "../backend/contract.mjs";
import { normalizeRecordDeclarations } from "../backend/records.mjs";
import { loadLockedLibraries } from "./library-packages.mjs";

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
  objectShape(manifest, ["schemaVersion", "project", "sdk", "capabilities", "modules"], ["assets", "tests", "backend", "web", "startup"], "manifest");
  if (manifest.schemaVersion !== 2) fail("project schemaVersion must be 2");
  exactObject(manifest.project, ["id", "entry"], "project");
  if (!projectIdPattern.test(manifest.project.id ?? "")) fail("invalid project.id");
  if (!moduleIdPattern.test(manifest.project.entry ?? "")) fail("invalid project.entry");
  exactObject(manifest.sdk, ["contract"], "sdk");
  if (manifest.sdk.contract !== 1) fail(`unsupported SDK contract: ${manifest.sdk.contract}`);
  uniqueStrings(manifest.capabilities, capabilityPattern, "capabilities");
  const libraries = await loadLockedLibraries(projectRoot, { sdkContract: manifest.sdk.contract, capabilities: manifest.capabilities });
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
  const projectModuleIds = new Set(modules.keys());
  for (const module of libraries.modules) {
    if (modules.has(module.id)) fail(`library module collides with another module: ${module.id}`);
    modules.set(module.id, module);
  }
  let startup = null;
  if (manifest.startup !== undefined) {
    exactObject(manifest.startup, ["entry"], "startup");
    if (!moduleIdPattern.test(manifest.startup.entry ?? "") || !projectModuleIds.has(manifest.startup.entry)) fail("startup.entry must name a declared project module");
    if (manifest.startup.entry === manifest.project.entry) fail("startup.entry must differ from the application entry");
    startup = Object.freeze({ entry: manifest.startup.entry });
  }
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
  for (const asset of libraries.assets) {
    if (assetIds.has(asset.id)) fail(`library asset collides with another asset: ${asset.id}`);
    if (assetSources.has(asset.source)) fail(`library asset source collides with another asset: ${asset.source}`);
    if (assetOutputs.has(asset.outputPath)) fail(`library asset output collides with another asset: ${asset.outputPath}`);
    assetIds.add(asset.id);
    assetSources.add(asset.source);
    assetOutputs.add(asset.outputPath);
    totalAssetBytes += asset.bytes;
    if (totalAssetBytes > maximumProjectAssetBytes) fail(`project and library assets exceed ${maximumProjectAssetBytes} bytes`);
    assets.push(asset);
  }
  const projectTests = uniqueStrings(manifest.tests ?? [], moduleIdPattern, "tests");
  const tests = [...projectTests];
  for (const test of libraries.tests) {
    if (tests.includes(test)) fail(`library test collides with another test: ${test}`);
    tests.push(test);
  }
  if (tests.length > 128) fail("project and library tests may contain at most 128 entries");
  for (const test of tests) {
    if (!modules.has(test)) fail(`test module is not declared: ${test}`);
    if (test === manifest.project.entry) fail(`application entry cannot also be a test: ${test}`);
  }
  let web = null;
  if (manifest.web !== undefined) {
    exactObject(manifest.web, ["title", "description", "canonicalUrl", "index"], "web");
    if (typeof manifest.web.title !== "string" || manifest.web.title.trim().length < 1 || manifest.web.title.length > 160) fail("web.title must contain 1 to 160 characters");
    if (typeof manifest.web.description !== "string" || manifest.web.description.trim().length < 1 || manifest.web.description.length > 320) fail("web.description must contain 1 to 320 characters");
    if (typeof manifest.web.index !== "boolean") fail("web.index must be a boolean");
    let canonicalUrl;
    try { canonicalUrl = new URL(manifest.web.canonicalUrl); } catch { fail("web.canonicalUrl must be an absolute HTTPS URL"); }
    if (canonicalUrl.protocol !== "https:" || canonicalUrl.username !== "" || canonicalUrl.password !== "" || canonicalUrl.search !== "" || canonicalUrl.hash !== "") {
      fail("web.canonicalUrl must be an absolute HTTPS URL without credentials, query, or fragment");
    }
    web = Object.freeze({ title: manifest.web.title, description: manifest.web.description, canonicalUrl: canonicalUrl.href, index: manifest.web.index });
  }
  let backend = null;
  if (manifest.backend !== undefined) {
    objectShape(manifest.backend, ["declaration", "handler", "generatedClient", "generatedModule"], ["authentication", "database", "content", "identity", "records", "uploads"], "backend");
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
    const records = normalizeRecordDeclarations(manifest.backend.records, { identityProvider: identity.provider });
    if (!Array.isArray(manifest.backend.content ?? []) || (manifest.backend.content ?? []).length > 64) fail("backend.content must contain at most 64 items");
    const content = [];
    const contentIds = new Set();
    const contentSources = new Set();
    let totalContentBytes = 0;
    for (const item of manifest.backend.content ?? []) {
      const remote = item?.provider === "supabase";
      exactObject(item, remote ? ["id", "provider", "bucket", "path", "mediaType", "bytes", "width", "height"] : ["id", "source", "mediaType"], `backend content ${item?.id ?? "?"}`);
      if (!moduleIdPattern.test(item.id ?? "") || contentIds.has(item.id)) fail(`invalid or duplicate backend content ID: ${item.id}`);
      contentIds.add(item.id);
      if (remote) {
        if (identity.provider !== "supabase") fail("Supabase content requires Supabase identity");
        if (!/^[a-z0-9][a-z0-9._-]{0,62}[a-z0-9]$/.test(item.bucket ?? "")) fail(`backend content ${item.id} has an invalid Supabase bucket`);
        if (typeof item.path !== "string" || item.path.length < 1 || item.path.length > 1024 || item.path.split("/").some((part) => part === "" || part === "." || part === "..")) fail(`backend content ${item.id} has an invalid Supabase object path`);
        if (!["image/avif", "image/jpeg", "image/png", "image/webp"].includes(item.mediaType) || !Number.isSafeInteger(item.bytes) || item.bytes < 4 || item.bytes > 25 * 1024 * 1024 || !Number.isSafeInteger(item.width) || item.width < 1 || item.width > 8192 || !Number.isSafeInteger(item.height) || item.height < 1 || item.height > 8192 || item.width * item.height > 40 * 1024 * 1024) fail(`backend content ${item.id} has invalid image metadata`);
        totalContentBytes += item.bytes;
        if (totalContentBytes > maximumProjectAssetBytes) fail(`backend content exceeds ${maximumProjectAssetBytes} bytes`);
        content.push(Object.freeze({ ...item }));
        continue;
      }
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
      content.push(Object.freeze({ id: item.id, provider: "local", source: normalizedSource, path: sourcePath, mediaType: item.mediaType, bytes: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") }));
    }
    if (!Array.isArray(manifest.backend.uploads ?? []) || (manifest.backend.uploads ?? []).length > 32) fail("backend.uploads must contain at most 32 declarations");
    const uploads = [];
    const uploadIds = new Set();
    for (const item of manifest.backend.uploads ?? []) {
      const remote = item?.provider === "supabase";
      exactObject(item, remote
        ? ["id", "provider", "bucket", "prefix", "mediaTypes", "maximumBytes", "maximumWidth", "maximumHeight"]
        : ["id", "provider", "mediaTypes", "maximumBytes", "maximumWidth", "maximumHeight"], `backend upload ${item?.id ?? "?"}`);
      if (!/^[a-z][a-z0-9_-]{0,63}$/.test(item.id ?? "") || uploadIds.has(item.id)) fail(`invalid or duplicate backend upload ID: ${item.id}`);
      uploadIds.add(item.id);
      if (!Array.isArray(item.mediaTypes) || item.mediaTypes.length < 1 || item.mediaTypes.length > 2 || new Set(item.mediaTypes).size !== item.mediaTypes.length || !item.mediaTypes.every((value) => ["image/jpeg", "image/png"].includes(value))) fail(`backend upload ${item.id} has invalid media types`);
      if (!Number.isSafeInteger(item.maximumBytes) || item.maximumBytes < 14 || item.maximumBytes > 25 * 1024 * 1024 || !Number.isSafeInteger(item.maximumWidth) || item.maximumWidth < 1 || item.maximumWidth > 8192 || !Number.isSafeInteger(item.maximumHeight) || item.maximumHeight < 1 || item.maximumHeight > 8192) fail(`backend upload ${item.id} has invalid limits`);
      if (remote) {
        if (identity.provider !== "supabase") fail("Supabase uploads require Supabase identity");
        if (!/^[a-z0-9][a-z0-9._-]{0,62}[a-z0-9]$/.test(item.bucket ?? "")) fail(`backend upload ${item.id} has an invalid Supabase bucket`);
        if (typeof item.prefix !== "string" || item.prefix.length < 1 || item.prefix.length > 256 || item.prefix.split("/").some((part) => part === "" || part === "." || part === ".." || !/^[A-Za-z0-9_-]+$/.test(part))) fail(`backend upload ${item.id} has an invalid Supabase prefix`);
      }
      uploads.push(Object.freeze({ ...item, mediaTypes: Object.freeze([...item.mediaTypes]), maximumPixels: Math.min(40 * 1024 * 1024, item.maximumWidth * item.maximumHeight), intentTtlMs: 5 * 60 * 1000 }));
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
      records,
      content: Object.freeze(content),
      uploads: Object.freeze(uploads),
    });
  }
  return Object.freeze({
    manifestPath,
    projectRoot,
    id: manifest.project.id,
    entry: manifest.project.entry,
    startup,
    sdkContract: manifest.sdk.contract,
    capabilities: Object.freeze([...manifest.capabilities]),
    modules,
    assets: Object.freeze(assets),
    tests: Object.freeze([...tests]),
    libraries: libraries.closure,
    libraryLockPath: libraries.lockPath,
    web,
    backend,
  });
}
