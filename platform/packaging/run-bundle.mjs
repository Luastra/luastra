#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile, realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const moduleIdPattern = /^[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;

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

function expectedOrder(byId) {
  const order = [];
  const state = new Map();
  const visit = (id, path) => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") {
      const start = path.indexOf(id);
      fail(`bundle module cycle: ${[...path.slice(start), id].join(" -> ")}`);
    }
    const module = byId.get(id);
    if (!module) fail(`bundle dependency is missing: ${id}`);
    state.set(id, "visiting");
    const nextPath = [...path, id];
    for (const dependency of [...module.dependencies].sort()) visit(dependency, nextPath);
    state.set(id, "done");
    order.push(id);
  };
  for (const id of [...byId.keys()].sort()) visit(id, []);
  return order;
}

export async function verifyBundle({
  bundlePath,
  expectedVm,
  allowedCapabilities = [],
  supportedProtocol = 1,
}) {
  const absoluteBundlePath = resolve(bundlePath);
  const bundleRoot = await realpath(dirname(absoluteBundlePath));
  const bundle = JSON.parse(await readFile(absoluteBundlePath, "utf8"));
  if (bundle.schemaVersion !== 1) fail(`unsupported bundle schema: ${bundle.schemaVersion}`);
  if (bundle.profile !== "trusted-vm-only") fail(`unsupported bundle profile: ${bundle.profile}`);
  if (!bundle.project || !moduleIdPattern.test(bundle.project.entry ?? "")) fail("invalid bundle entry");
  if (!bundle.compatibility || !Array.isArray(bundle.modules)) fail("incomplete bundle manifest");

  const content = { ...bundle };
  delete content.contentSha256;
  const actualContentHash = sha256(canonicalJson(content));
  if (actualContentHash !== bundle.contentSha256) fail("bundle content digest mismatch");
  if (bundle.compatibility.protocol !== supportedProtocol) {
    fail(
      `protocol mismatch: expected host protocol ${supportedProtocol}, got ${bundle.compatibility.protocol}`,
    );
  }

  const allowed = new Set(allowedCapabilities);
  for (const capability of bundle.capabilities ?? []) {
    if (!allowed.has(capability)) fail(`bundle capability is not allowed: ${capability}`);
  }

  if (expectedVm !== bundle.compatibility.vm) {
    fail(`VM mismatch: expected ${bundle.compatibility.vm}, got ${expectedVm}`);
  }

  const byId = new Map();
  for (const module of bundle.modules) {
    if (!moduleIdPattern.test(module.id ?? "")) fail(`invalid bundle module ID: ${module.id}`);
    if (byId.has(module.id)) fail(`duplicate bundle module ID: ${module.id}`);
    if (!Array.isArray(module.dependencies)) fail(`invalid dependencies for ${module.id}`);
    byId.set(module.id, module);
  }
  if (!byId.has(bundle.project.entry)) fail(`bundle entry is missing: ${bundle.project.entry}`);
  const order = expectedOrder(byId);
  if (order.join("\n") !== bundle.modules.map((module) => module.id).join("\n")) {
    fail("bundle module order is not canonical");
  }

  const moduleArguments = [];
  const verifiedModules = [];
  for (const module of bundle.modules) {
    if (!/^[a-f0-9]{64}$/.test(module.bytecodeSha256 ?? "")) {
      fail(`invalid bytecode hash for ${module.id}`);
    }
    const expectedFile = `modules/${module.bytecodeSha256}.luauc`;
    if (module.bytecodeFile !== expectedFile) fail(`non-canonical bytecode file for ${module.id}`);
    const bytecodePath = await realpath(resolve(bundleRoot, module.bytecodeFile));
    const pathFromRoot = relative(bundleRoot, bytecodePath);
    if (pathFromRoot === ".." || pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot)) {
      fail(`bytecode for ${module.id} resolves outside bundle`);
    }
    const bytecode = await readFile(bytecodePath);
    if (bytecode.byteLength !== module.bytecodeBytes) fail(`bytecode size mismatch for ${module.id}`);
    if (sha256(bytecode) !== module.bytecodeSha256) fail(`bytecode hash mismatch for ${module.id}`);
    moduleArguments.push(`${module.id}=${bytecodePath}`);
    verifiedModules.push({ ...module, bytecodePath, bytecode });
  }

  return { bundle, moduleArguments, verifiedModules };
}

export async function runBundle({
  bundlePath,
  vmPath,
  allowedCapabilities = [],
  supportedProtocol = 1,
}) {
  const vmVersion = spawnSync(vmPath, ["--version"], { encoding: "utf8" });
  if (vmVersion.status !== 0) fail(`VM identity failed: ${vmVersion.stderr || vmVersion.error}`);
  const actualVm = vmVersion.stdout.trim();
  const { bundle, moduleArguments } = await verifyBundle({
    bundlePath,
    expectedVm: actualVm,
    allowedCapabilities,
    supportedProtocol,
  });

  const execution = spawnSync(
    vmPath,
    [`--entry=${bundle.project.entry}`, ...moduleArguments],
    { encoding: "utf8" },
  );
  if (execution.status !== 0) {
    fail(`VM execution failed: ${(execution.stderr || execution.error || "unknown error").trim()}`);
  }
  const result = JSON.parse(execution.stdout);
  if (result.success !== true || result.vm !== actualVm) fail("VM returned an invalid result envelope");
  return { ...result, contentSha256: bundle.contentSha256 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(
    process.argv.slice(2).map((argument) => {
      const separator = argument.indexOf("=");
      if (separator < 0) fail(`expected --name=value argument, got ${argument}`);
      return [argument.slice(0, separator), argument.slice(separator + 1)];
    }),
  );
  if (!args["--bundle"] || !args["--vm"]) {
    fail("usage: run-bundle.mjs --bundle=<luastra.bundle.json> --vm=<luastra_vm_control> [--allow=a,b]");
  }
  const result = await runBundle({
    bundlePath: args["--bundle"],
    vmPath: resolve(args["--vm"]),
    allowedCapabilities: args["--allow"] ? args["--allow"].split(",").filter(Boolean) : [],
    supportedProtocol: args["--protocol"] ? Number(args["--protocol"]) : 1,
  });
  console.log(JSON.stringify(result, null, 2));
}
