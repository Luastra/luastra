#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, realpath, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const moduleIdPattern = /^[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;
const projectIdPattern = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;
const capabilityPattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/;

function fail(message) {
  throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

function canonicalJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function assertExactKeys(value, allowed, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) fail(`${label} has unknown field(s): ${unknown.join(", ")}`);
}

function validateManifest(manifest) {
  assertExactKeys(
    manifest,
    ["schemaVersion", "project", "compatibility", "capabilities", "modules"],
    "manifest",
  );
  if (manifest.schemaVersion !== 1) fail("schemaVersion must be 1");

  assertExactKeys(manifest.project, ["id", "entry"], "project");
  if (!projectIdPattern.test(manifest.project.id ?? "")) fail("invalid project.id");
  if (!moduleIdPattern.test(manifest.project.entry ?? "")) fail("invalid project.entry");

  assertExactKeys(
    manifest.compatibility,
    ["analyzer", "compiler", "vm", "protocol"],
    "compatibility",
  );
  if (!manifest.compatibility.analyzer || !manifest.compatibility.compiler || !manifest.compatibility.vm) {
    fail("analyzer, compiler and VM identities are required");
  }
  if (!Number.isInteger(manifest.compatibility.protocol) || manifest.compatibility.protocol < 1) {
    fail("compatibility.protocol must be a positive integer");
  }

  if (!Array.isArray(manifest.capabilities)) fail("capabilities must be an array");
  const capabilities = new Set();
  for (const capability of manifest.capabilities) {
    if (!capabilityPattern.test(capability)) fail(`invalid capability: ${capability}`);
    if (capabilities.has(capability)) fail(`duplicate capability: ${capability}`);
    capabilities.add(capability);
  }

  if (!Array.isArray(manifest.modules) || manifest.modules.length === 0) {
    fail("modules must be a non-empty array");
  }

  const byId = new Map();
  const sourcePaths = new Set();
  for (const module of manifest.modules) {
    assertExactKeys(module, ["id", "source", "dependencies"], `module ${module?.id ?? "?"}`);
    if (!moduleIdPattern.test(module.id ?? "")) fail(`invalid module ID: ${module.id}`);
    if (byId.has(module.id)) fail(`duplicate module ID: ${module.id}`);
    if (typeof module.source !== "string" || module.source.length === 0 || isAbsolute(module.source)) {
      fail(`module ${module.id} source must be a non-empty relative path`);
    }
    const normalizedSource = module.source.split("\\").join("/");
    if (normalizedSource.split("/").some((segment) => segment === ".." || segment === "")) {
      fail(`module ${module.id} has unsafe source path`);
    }
    if (sourcePaths.has(normalizedSource)) fail(`duplicate source path: ${normalizedSource}`);
    sourcePaths.add(normalizedSource);
    if (!Array.isArray(module.dependencies)) fail(`module ${module.id} dependencies must be an array`);
    const dependencies = new Set();
    for (const dependency of module.dependencies) {
      if (!moduleIdPattern.test(dependency)) fail(`module ${module.id} has invalid dependency ${dependency}`);
      if (dependency === module.id) fail(`module ${module.id} depends on itself`);
      if (dependencies.has(dependency)) fail(`module ${module.id} duplicates dependency ${dependency}`);
      dependencies.add(dependency);
    }
    byId.set(module.id, { ...module, source: normalizedSource });
  }

  if (!byId.has(manifest.project.entry)) fail(`entry module is missing: ${manifest.project.entry}`);
  for (const module of byId.values()) {
    for (const dependency of module.dependencies) {
      if (!byId.has(dependency)) fail(`module ${module.id} has missing dependency ${dependency}`);
    }
  }
  return byId;
}

function dependencyOrder(byId) {
  const order = [];
  const state = new Map();
  const visit = (id, path) => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") {
      const start = path.indexOf(id);
      fail(`module cycle: ${[...path.slice(start), id].join(" -> ")}`);
    }
    state.set(id, "visiting");
    const nextPath = [...path, id];
    for (const dependency of [...byId.get(id).dependencies].sort()) visit(dependency, nextPath);
    state.set(id, "done");
    order.push(id);
  };
  for (const id of [...byId.keys()].sort()) visit(id, []);
  return order;
}

async function assertInsideProject(projectRoot, sourcePath, moduleId) {
  const resolvedSource = await realpath(resolve(projectRoot, sourcePath));
  const pathFromRoot = relative(projectRoot, resolvedSource);
  if (pathFromRoot === ".." || pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot)) {
    fail(`module ${moduleId} resolves outside the project root`);
  }
  return resolvedSource;
}

export async function buildBundle({ manifestPath, outputDirectory, analyzerPath, compilerPath }) {
  const absoluteManifest = resolve(manifestPath);
  const projectRoot = await realpath(dirname(absoluteManifest));
  const manifest = JSON.parse(await readFile(absoluteManifest, "utf8"));
  const byId = validateManifest(manifest);
  const order = dependencyOrder(byId);

  const analyzerVersion = spawnSync(analyzerPath, ["--version"], { encoding: "utf8" });
  if (analyzerVersion.status !== 0) {
    fail(`analyzer identity failed: ${analyzerVersion.stderr || analyzerVersion.error}`);
  }
  const actualAnalyzer = analyzerVersion.stdout.trim();
  if (actualAnalyzer !== manifest.compatibility.analyzer) {
    fail(`analyzer mismatch: expected ${manifest.compatibility.analyzer}, got ${actualAnalyzer}`);
  }

  const version = spawnSync(compilerPath, ["--version"], { encoding: "utf8" });
  if (version.status !== 0) fail(`compiler identity failed: ${version.stderr || version.error}`);
  const actualCompiler = version.stdout.trim();
  if (actualCompiler !== manifest.compatibility.compiler) {
    fail(`compiler mismatch: expected ${manifest.compatibility.compiler}, got ${actualCompiler}`);
  }

  const absoluteOutput = resolve(outputDirectory);
  const moduleDirectory = resolve(absoluteOutput, "modules");
  await mkdir(moduleDirectory, { recursive: true });
  for (const file of await readdir(moduleDirectory)) {
    if (/^(?:[0-9a-f]{64}\.luauc|\.building-[a-z0-9-]+\.luauc)$/.test(file)) {
      await unlink(resolve(moduleDirectory, file));
    }
  }
  const builtModules = [];

  const resolvedSources = new Map();
  for (const id of order) {
    const module = byId.get(id);
    resolvedSources.set(id, await assertInsideProject(projectRoot, module.source, id));
  }
  const analysis = spawnSync(
    analyzerPath,
    [
      `--entry=${manifest.project.entry}`,
      ...order.map((id) => `${id}=${resolvedSources.get(id)}`),
    ],
    { encoding: "utf8" },
  );
  if (analysis.status !== 0) {
    let detail = (analysis.stderr || analysis.error || "unknown analysis error").trim();
    try {
      const report = JSON.parse(analysis.stdout);
      detail = report.diagnostics
        .map(
          (item) =>
            `${byId.get(item.module)?.source ?? item.file}:${item.startLine}:${item.startColumn} [${item.module}] ${item.message}`,
        )
        .join("\n");
    } catch {
      if (analysis.stdout?.trim()) detail = analysis.stdout.trim();
    }
    fail(`analysis failed:\n${detail}`);
  }

  for (const id of order) {
    const module = byId.get(id);
    const sourcePath = resolvedSources.get(id);
    const source = await readFile(sourcePath);
    const temporaryBytecode = resolve(moduleDirectory, `.building-${id.replaceAll("/", "-")}.luauc`);
    const compile = spawnSync(compilerPath, [sourcePath, temporaryBytecode], { encoding: "utf8" });
    if (compile.status !== 0) {
      fail(`compile failed for ${id} (${module.source}): ${(compile.stderr || compile.error || "unknown error").trim()}`);
    }
    const bytecode = await readFile(temporaryBytecode);
    await unlink(temporaryBytecode);
    const bytecodeHash = sha256(bytecode);
    const bytecodeFile = `${bytecodeHash}.luauc`;
    await writeFile(resolve(moduleDirectory, bytecodeFile), bytecode);
    builtModules.push({
      id,
      source: module.source,
      dependencies: [...module.dependencies].sort(),
      sourceBytes: source.byteLength,
      sourceSha256: sha256(source),
      bytecodeBytes: bytecode.byteLength,
      bytecodeSha256: bytecodeHash,
      bytecodeFile: `modules/${bytecodeFile}`,
    });
  }

  const content = {
    schemaVersion: 1,
    project: { id: manifest.project.id, entry: manifest.project.entry },
    compatibility: manifest.compatibility,
    profile: "trusted-vm-only",
    capabilities: [...manifest.capabilities].sort(),
    modules: builtModules,
  };
  const contentSha256 = sha256(canonicalJson(content));
  const bundle = { ...content, contentSha256 };
  const bundlePath = resolve(absoluteOutput, "luastra.bundle.json");
  await writeFile(bundlePath, canonicalJson(bundle));
  return { bundlePath, contentSha256, modules: builtModules.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(
    process.argv.slice(2).map((argument) => {
      const separator = argument.indexOf("=");
      if (separator < 0) fail(`expected --name=value argument, got ${argument}`);
      return [argument.slice(0, separator), argument.slice(separator + 1)];
    }),
  );
  if (!args["--manifest"] || !args["--out"] || !args["--analyzer"] || !args["--compiler"]) {
    fail("usage: build-bundle.mjs --manifest=<luastra.json> --out=<dir> --analyzer=<luastra_analyze> --compiler=<luastra_compile>");
  }
  const result = await buildBundle({
    manifestPath: args["--manifest"],
    outputDirectory: args["--out"],
    analyzerPath: resolve(args["--analyzer"]),
    compilerPath: resolve(args["--compiler"]),
  });
  console.log(JSON.stringify(result, null, 2));
}
