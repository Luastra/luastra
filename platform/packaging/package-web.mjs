#!/usr/bin/env node

import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildBundle } from "./build-bundle.mjs";
import { resolveRuntime } from "../resolve-runtime.mjs";

const platformRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const brandAssets = resolve(platformRoot, "brand");
const markerName = ".luastra-generated-web-dist";

function fail(message) { throw new Error(message); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
function json(value) { return `${JSON.stringify(stable(value), null, 2)}\n`; }

async function prepareOutput(output) {
  const info = await stat(output).catch(() => null);
  if (info) {
    if (!info.isDirectory()) fail(`web output is not a directory: ${output}`);
    const entries = await readdir(output);
    if (entries.length > 0 && !entries.includes(markerName)) fail(`refusing non-Luastra web output: ${output}`);
    if (entries.includes(markerName)) await rm(output, { recursive: true, force: true });
  }
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, markerName), "Luastra generated web distribution v1\n");
}

async function copy(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { force: false, errorOnExist: true });
}

async function listFiles(root, directory = root) {
  const files = [];
  for (const name of (await readdir(directory)).sort()) {
    const path = resolve(directory, name);
    const info = await stat(path);
    if (info.isDirectory()) files.push(...await listFiles(root, path));
    else files.push(relative(root, path).split("\\").join("/"));
  }
  return files;
}

export async function packageWeb({ manifestPath, outputDirectory, rpcProof = false }) {
  const output = resolve(outputDirectory);
  await prepareOutput(output);
  const sdk = await resolveRuntime();
  const bundleRoot = resolve(output, "bundle");
  const bundle = await buildBundle({
    manifestPath,
    outputDirectory: bundleRoot,
    analyzerPath: sdk.artifacts.analyzer,
    compilerPath: sdk.artifacts.compiler,
  });

  const hostHtmlSource = await readFile(resolve(platformRoot, "host/index.html"), "utf8");
  const csp = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
  const hostHtml = hostHtmlSource
    .replace("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />", `<meta name="viewport" content="width=device-width, initial-scale=1" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`)
    .replace("<title>Luastra Preview</title>", "<title>Luastra Application</title>");
  await writeFile(resolve(output, "index.html"), hostHtml);

  const developmentMain = await readFile(resolve(platformRoot, "host/main.js"), "utf8");
  let releaseMain = developmentMain
    .replace(/\nconst reloadEvents = new EventSource\([\s\S]*?showFailure\(new Error\(`Hot reload build failed: \$\{event\.data\}`\)\)\);\n?$/, "\n")
    .replaceAll("/platform/", "./platform/")
    .replaceAll("/bundle/", "./bundle/");
  const proofHandler = `globalThis.__luastraCapabilityHandler = async (request) => ({
  accepted: true,
  response: {
    version: 1,
    requestId: request.requestId,
    traceId: request.traceId,
    status: "ok",
    payload: {
      version: 1,
      success: true,
      data: { tasks: [{ id: "task-browser", title: "Chromium RPC proof" }] },
      error: null,
      traceId: request.traceId,
    },
  },
});`;
  releaseMain = releaseMain.replace(
    /\/\* LUASTRA_RPC_PROOF_START \*\/[\s\S]*?\/\* LUASTRA_RPC_PROOF_END \*\/\n?/,
    rpcProof ? `/* LUASTRA_RPC_PROOF_START */\n${proofHandler}\n/* LUASTRA_RPC_PROOF_END */\n` : "",
  );
  if (releaseMain.includes("EventSource") || releaseMain.includes("__luastra/events")) fail("development reload code leaked into release host");
  await writeFile(resolve(output, "main.js"), releaseMain);

  const copies = [
    [resolve(platformRoot, "host/bootstrap-errors.js"), "bootstrap-errors.js"],
    [resolve(brandAssets, "favicon.svg"), "brand/favicon.svg"],
    [resolve(brandAssets, "app-icon.svg"), "brand/app-icon.svg"],
    [resolve(brandAssets, "mark.svg"), "brand/luastra-mark.svg"],
    [sdk.artifacts.runtimeJavaScript, "platform/artifacts/vm-wasm/luastra-vm.js"],
    [sdk.artifacts.runtimeWasm, "platform/artifacts/vm-wasm/luastra-vm.wasm"],
    [resolve(platformRoot, "protocol/generated/protocol.mjs"), "platform/protocol/generated/protocol.mjs"],
    [resolve(platformRoot, "protocol/request-ledger.mjs"), "platform/protocol/request-ledger.mjs"],
    [resolve(platformRoot, "renderer/from-protocol-tree.mjs"), "platform/renderer/from-protocol-tree.mjs"],
    [resolve(platformRoot, "renderer/reconciler.mjs"), "platform/renderer/reconciler.mjs"],
    [resolve(platformRoot, "renderer/dom-adapter.mjs"), "platform/renderer/dom-adapter.mjs"],
    [resolve(platformRoot, "renderer/dom-motion-adapter.mjs"), "platform/renderer/dom-motion-adapter.mjs"],
    [resolve(platformRoot, "renderer/motion-renderer-session.mjs"), "platform/renderer/motion-renderer-session.mjs"],
    [resolve(platformRoot, "motion/descriptor.mjs"), "platform/motion/descriptor.mjs"],
    [resolve(platformRoot, "motion/tween-engine.mjs"), "platform/motion/tween-engine.mjs"],
    [resolve(platformRoot, "motion/motion-runtime.mjs"), "platform/motion/motion-runtime.mjs"],
    [resolve(platformRoot, "scheduler/event-frame-scheduler.mjs"), "platform/scheduler/event-frame-scheduler.mjs"],
    [resolve(platformRoot, "host/platform-capabilities.mjs"), "platform/host/platform-capabilities.mjs"],
    [resolve(platformRoot, "host/rpc-capabilities.mjs"), "platform/host/rpc-capabilities.mjs"],
    [resolve(platformRoot, "host/media-capabilities.mjs"), "platform/host/media-capabilities.mjs"],
    [resolve(platformRoot, "host/timer-capabilities.mjs"), "platform/host/timer-capabilities.mjs"],
    [resolve(platformRoot, "host/asset-registry.mjs"), "platform/host/asset-registry.mjs"],
    [resolve(platformRoot, "media/media-wire.mjs"), "platform/media/media-wire.mjs"],
    [resolve(platformRoot, "media/media-state-machine.mjs"), "platform/media/media-state-machine.mjs"],
    [resolve(platformRoot, "host/lifecycle-bridge.mjs"), "platform/host/lifecycle-bridge.mjs"],
    [resolve(platformRoot, "host/keyboard-viewport-manager.mjs"), "platform/host/keyboard-viewport-manager.mjs"],
    [resolve(platformRoot, "host/first-paint-gate.mjs"), "platform/host/first-paint-gate.mjs"],
  ];
  for (const [source, destination] of copies) await copy(source, resolve(output, destination));

  const filesBeforeLedger = (await listFiles(output)).filter((file) => file !== markerName && file !== "asset-manifest.json");
  const assets = [];
  for (const file of filesBeforeLedger) {
    const bytes = await readFile(resolve(output, file));
    assets.push({ path: file, bytes: bytes.byteLength, sha256: sha256(bytes) });
  }
  const ledger = {
    schemaVersion: 1,
    profile: rpcProof ? "luastra-browser-rpc-proof" : "luastra-self-contained-web",
    sdkIdentity: sdk.identity,
    applicationContentSha256: bundle.contentSha256,
    assets,
  };
  await writeFile(resolve(output, "asset-manifest.json"), json(ledger));
  return { result: "PASS", output, contentSha256: bundle.contentSha256, assets: assets.length, assetManifestSha256: sha256(json(ledger)) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).map((argument) => {
    const separator = argument.indexOf("=");
    if (separator < 0) fail(`expected --name=value, got ${argument}`);
    return [argument.slice(0, separator), argument.slice(separator + 1)];
  }));
  if (!args["--manifest"] || !args["--out"]) fail("usage: package-web.mjs --manifest=<luastra.json> --out=<directory>");
  console.log(JSON.stringify(await packageWeb({
    manifestPath: resolve(args["--manifest"]),
    outputDirectory: resolve(args["--out"]),
    rpcProof: args["--rpc-proof"] === "tasks",
  }), null, 2));
}
