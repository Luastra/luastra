#!/usr/bin/env node

import { access, cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildProject } from "../project/build-project.mjs";
import { conformProject } from "../project/conform-project.mjs";
import { writeGeneratedClient } from "../backend/generate-client.mjs";
import { loadProject } from "../project/load-project.mjs";
import { runProject } from "../project/run-project.mjs";
import { testProject } from "../project/test-project.mjs";
import { installRuntimeSdk } from "../platform/packaging/install-runtime-sdk.mjs";
import { productVersion } from "../platform/product-version.mjs";
import { doctorSdk, installSdkRelease, listSdkVersions, removeSdkVersion, useSdkVersion } from "../release/luastra-install.mjs";

const prototype = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const template = resolve(prototype, "templates/starter");

function fail(message) { throw new Error(message); }
function print(value) { process.stdout.write(`${JSON.stringify(value)}\n`); }

function parseArguments(values) {
  const positional = [];
  const options = {};
  for (const value of values) {
    if (!value.startsWith("--")) positional.push(value);
    else {
      const separator = value.indexOf("=");
      const name = separator < 0 ? value.slice(2) : value.slice(2, separator);
      if (!/^[a-z][a-z-]*$/.test(name) || options[name] !== undefined) fail(`invalid or duplicate option: ${value}`);
      options[name] = separator < 0 ? true : value.slice(separator + 1);
    }
  }
  return { positional, options };
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function manifestPath(projectValue = ".") {
  const candidate = resolve(projectValue);
  return (await stat(candidate).catch(() => null))?.isFile() ? candidate : resolve(candidate, "luastra.json");
}

async function createProject(destination) {
  if (!destination) fail("usage: luastra create <directory>");
  const target = resolve(destination);
  if (target === resolve(".") || target === dirname(target)) fail("refusing unsafe project destination");
  if (await exists(target)) {
    const info = await stat(target);
    if (!info.isDirectory() || (await readdir(target)).length !== 0) fail(`destination is not empty: ${target}`);
  } else await mkdir(target, { recursive: true });
  for (const name of await readdir(template)) await cp(resolve(template, name), resolve(target, name), { recursive: true, errorOnExist: true, force: false });
  const path = resolve(target, "luastra.json");
  const manifest = JSON.parse(await readFile(path, "utf8"));
  const rawSlug = basename(target).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "app";
  const slug = /^[a-z]/.test(rawSlug) ? rawSlug : `app-${rawSlug}`;
  manifest.project.id = `dev.luastra.${slug}`;
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
  return { command: "create", result: "PASS", project: target, manifest: path, sdkCopied: false };
}

async function checkProject(path) {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-v2-check-"));
  try {
    const project = await loadProject(path);
    const result = await buildProject({ manifestPath: path, outputDirectory: temporary, target: "bundle", roots: [...project.modules.keys()] });
    return {
      command: "check",
      result: "PASS",
      project: result.project,
      modules: result.modules,
      contentSha256: result.projectContentSha256,
      bundleContentSha256: result.bundleContentSha256,
      projectAssets: result.projectAssets,
      sourceSdkIdentity: result.sourceSdkIdentity,
      binarySdkIdentity: result.binarySdkIdentity,
      binarySdkOrigin: result.binarySdkOrigin,
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

async function generateProject(path) {
  const project = await loadProject(path, { allowMissingGenerated: true });
  if (!project.backend) fail("project does not declare a backend");
  const generated = await writeGeneratedClient(project.backend.declaration, project.backend.generatedClientPath);
  return { command: "generate", result: "PASS", project: project.id, module: project.backend.generatedModule, contractSha256: project.backend.declaration.sha256, clientSha256: generated.sha256, output: generated.path };
}

async function main() {
  const command = process.argv[2];
  const { positional, options } = parseArguments(process.argv.slice(3));
  if (command === "version" || command === "--version") {
    if (positional.length !== 0 || Object.keys(options).length !== 0) fail("usage: luastra version");
    return print({ command: "version", result: "PASS", version: productVersion });
  }
  if (command === "create") {
    if (positional.length !== 1 || Object.keys(options).length !== 0) fail("usage: luastra create <directory>");
    return print(await createProject(positional[0]));
  }
  if (command === "sdk") {
    const action = positional[0];
    const managerRoot = typeof options.root === "string" ? options.root : undefined;
    if (action === "install" && options["archive-set"] !== undefined) {
      if (positional.length !== 1 || Object.keys(options).some((name) => !new Set(["archive-set", "out"]).has(name)) ||
          typeof options["archive-set"] !== "string" || typeof options.out !== "string") {
        fail("usage: luastra sdk install --archive-set=<directory> --out=<new-directory>");
      }
      return print({ command: "sdk install", ...await installRuntimeSdk({ archiveSet: options["archive-set"], output: options.out }) });
    }
    if (action === "install" || action === "update") {
      const allowedOptions = action === "install" ? new Set(["manifest", "root", "no-use"]) : new Set(["manifest", "root"]);
      if (positional.length !== 1 || Object.keys(options).some((name) => !allowedOptions.has(name)) ||
          typeof options.manifest !== "string" || (options.root !== undefined && typeof options.root !== "string") ||
          (options["no-use"] !== undefined && options["no-use"] !== true)) {
        fail(action === "install"
          ? "usage: luastra sdk install --manifest=<path-or-https-url> [--root=<directory>] [--no-use]"
          : "usage: luastra sdk update --manifest=<path-or-https-url> [--root=<directory>]");
      }
      const installed = await installSdkRelease({ manifestSource: options.manifest, managerRoot,
        activate: action === "update" || options["no-use"] !== true });
      return print({ ...installed, command: `sdk ${action}` });
    }
    if (action === "list") {
      if (positional.length !== 1 || Object.keys(options).some((name) => name !== "root") || (options.root !== undefined && typeof options.root !== "string")) {
        fail("usage: luastra sdk list [--root=<directory>]");
      }
      return print(await listSdkVersions(managerRoot));
    }
    if (action === "use" || action === "remove") {
      if (positional.length !== 2 || Object.keys(options).some((name) => name !== "root") || (options.root !== undefined && typeof options.root !== "string")) {
        fail(`usage: luastra sdk ${action} <version> [--root=<directory>]`);
      }
      return print(action === "use" ? await useSdkVersion(managerRoot, positional[1]) : await removeSdkVersion(managerRoot, positional[1]));
    }
    if (action === "doctor") {
      if (positional.length !== 1 || Object.keys(options).some((name) => name !== "root") || (options.root !== undefined && typeof options.root !== "string")) {
        fail("usage: luastra sdk doctor [--root=<directory>]");
      }
      return print(await doctorSdk(managerRoot));
    }
    fail("usage: luastra sdk <install|list|use|update|remove|doctor>");
  }
  if (command === "doctor") {
    if (positional.length !== 0 || Object.keys(options).some((name) => name !== "root") || (options.root !== undefined && typeof options.root !== "string")) {
      fail("usage: luastra doctor [--root=<directory>]");
    }
    return print(await doctorSdk(typeof options.root === "string" ? options.root : undefined));
  }
  if (!new Set(["generate", "check", "test", "conformance", "build", "run"]).has(command)) fail("usage: luastra <version|create|sdk|doctor|generate|check|test|conformance|build|run>");
  const projectOption = options.project === true ? "." : options.project ?? ".";
  const manifest = await manifestPath(projectOption);
  if (command === "generate") {
    if (positional.length !== 0 || Object.keys(options).some((name) => name !== "project")) fail("usage: luastra generate [--project=<path>]");
    return print(await generateProject(manifest));
  }
  if (command === "check") {
    if (positional.length !== 0 || Object.keys(options).some((name) => name !== "project")) fail("usage: luastra check [--project=<path>]");
    return print(await checkProject(manifest));
  }
  if (command === "test") {
    if (positional.length !== 0 || Object.keys(options).some((name) => name !== "project")) fail("usage: luastra test [--project=<path>]");
    return print(await testProject(manifest));
  }
  if (command === "conformance") {
    if (positional.length !== 0 || Object.keys(options).some((name) => name !== "project")) fail("usage: luastra conformance [--project=<path>]");
    return print(await conformProject(manifest));
  }
  if (command === "run") {
    if (positional.length !== 0 || Object.keys(options).some((name) => !new Set(["project", "port", "no-watch"]).has(name))) {
      fail("usage: luastra run [--project=<path>] [--port=<port>] [--no-watch]");
    }
    if (options["no-watch"] !== undefined && options["no-watch"] !== true) fail("--no-watch does not accept a value");
    const port = options.port === undefined || options.port === true ? 4175 : Number(options.port);
    const controller = await runProject({ manifestPath: manifest, port, watch: options["no-watch"] !== true, onEvent: print });
    const stop = () => { controller.close().catch((error) => { process.stderr.write(`Luastra: ${String(error?.message ?? error)}\n`); }); };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    await controller.closed;
    return;
  }
  if (positional.length !== 1 || !new Set(["bundle", "web"]).has(positional[0]) || Object.keys(options).some((name) => !new Set(["project", "out"]).has(name))) {
    fail("usage: luastra build <bundle|web> [--project=<path>] [--out=<path>]");
  }
  const target = positional[0];
  const root = dirname(manifest);
  const output = resolve(root, options.out === true ? `dist/${target}` : options.out ?? `dist/${target}`);
  const result = await buildProject({ manifestPath: manifest, outputDirectory: output, target });
  return print({ command: "build", result: "PASS", ...result, output });
}

main().catch((error) => {
  process.stderr.write(`Luastra: ${String(error?.message ?? error)}\n`);
  process.exitCode = 1;
});
