import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { relative, resolve } from "node:path";
import test from "node:test";

import { runWasmBundle } from "../platform/packaging/run-wasm-bundle.mjs";
import { resolveSourceSdk } from "../sdk/resolve-source-sdk.mjs";

const prototype = resolve(import.meta.dirname, "..");
const cli = resolve(prototype, "cli/luastra.mjs");

function run(args, expected = 0) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
  assert.equal(result.status, expected, `${args.join(" ")}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  return result;
}

function platformResponse(request, payload) {
  return { accepted: true, response: { version: 1, requestId: request.requestId, traceId: request.traceId, status: "ok", payload } };
}

async function inventory(root, directory = root) {
  const entries = [];
  for (const name of (await readdir(directory)).sort()) {
    const path = resolve(directory, name);
    const info = await lstat(path);
    const local = relative(root, path).split("\\").join("/");
    if (info.isDirectory()) entries.push(...await inventory(root, path));
    else if (info.isSymbolicLink()) entries.push([local, "symlink"]);
    else entries.push([local, createHash("sha256").update(await readFile(path)).digest("hex")]);
  }
  return entries;
}

test("create, check and deterministic bundle/web builds use the central SDK", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-v2-workflow-"));
  try {
    const project = resolve(workspace, "calm-catalogue");
    const created = JSON.parse(run(["create", project]).stdout);
    assert.equal(created.sdkCopied, false);
    assert.equal((await readdir(resolve(project, "src"))).includes("luastra"), false);
    assert.match(await readFile(resolve(project, "LUASTRA_TEMPLATE_LICENSE.txt"), "utf8"), /BSD Zero Clause License/);
    assert.match(await readFile(resolve(project, "src/main.luau"), "utf8"), /SPDX-License-Identifier: 0BSD/);
    const manifest = JSON.parse(await readFile(resolve(project, "luastra.json"), "utf8"));
    assert.equal(manifest.schemaVersion, 2);
    assert.deepEqual(manifest.modules.map((module) => module.id), ["app/main", "app/tests/smoke"]);
    assert.deepEqual(manifest.modules[0].dependencies, ["luastra/ui"]);
    const coverBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
    await writeFile(resolve(project, "assets/cover.png"), coverBytes);
    manifest.assets = [{ id: "catalogue/cover", source: "assets/cover.png", mediaType: "image/png" }];
    await writeFile(resolve(project, "luastra.json"), `${JSON.stringify(manifest, null, 2)}\n`);

    const beforeCheck = await inventory(project);
    const checked = JSON.parse(run(["check", `--project=${project}`]).stdout);
    assert.equal(checked.result, "PASS");
    assert.equal(checked.modules, 3);
    assert.equal(checked.projectAssets, 1);
    assert.match(checked.sourceSdkIdentity, /^luastra-source-sdk\//);
    assert.deepEqual(await inventory(project), beforeCheck, "check mutated the user project");

    const bundleA = JSON.parse(run(["build", "bundle", `--project=${project}`, "--out=dist/bundle-a"]).stdout);
    const bundleB = JSON.parse(run(["build", "bundle", `--project=${project}`, "--out=dist/bundle-b"]).stdout);
    assert.equal(bundleA.contentSha256, bundleB.contentSha256);
    assert.deepEqual(await readFile(resolve(project, "dist/bundle-a/luastra.bundle.json")), await readFile(resolve(project, "dist/bundle-b/luastra.bundle.json")));
    const builtBundle = JSON.parse(await readFile(resolve(project, "dist/bundle-a/luastra.bundle.json"), "utf8"));
    assert.deepEqual(builtBundle.modules.map((module) => module.id), ["luastra/ui", "app/main"]);
    assert.equal(builtBundle.modules.some((module) => module.source.startsWith("sources/luastra/")), true);
    assert.equal(builtBundle.modules.some((module) => module.id.includes("tests")), false, "production bundle contains tests");
    const assetLedger = JSON.parse(await readFile(resolve(project, "dist/bundle-a/project-assets.json"), "utf8"));
    assert.deepEqual(assetLedger.assets.map((asset) => asset.path), ["assets/catalogue/cover.png"]);
    assert.deepEqual(await readFile(resolve(project, "dist/bundle-a/assets/catalogue/cover.png")), coverBytes);
    const executed = await runWasmBundle({
      bundlePath: resolve(project, "dist/bundle-a/luastra.bundle.json"),
      runtimeModulePath: resolve(prototype, "platform/artifacts/vm-wasm/luastra-vm.js"),
      allowedCapabilities: ["ui.render"],
      requireRendererTree: true,
      dispatches: [{ action: "increment", target: "continue", value: "" }],
    });
    const title = executed.renderTree.children[0].children[0];
    assert.equal(title.properties.text, "Build apps like games. Interactions: 1");

    const webA = JSON.parse(run(["build", "web", `--project=${project}`, "--out=dist/web-a"]).stdout);
    const webB = JSON.parse(run(["build", "web", `--project=${project}`, "--out=dist/web-b"]).stdout);
    assert.equal(webA.assetManifestSha256, webB.assetManifestSha256);
    assert.deepEqual(await readFile(resolve(project, "dist/web-a/asset-manifest.json")), await readFile(resolve(project, "dist/web-b/asset-manifest.json")));
    const webLedger = JSON.parse(await readFile(resolve(project, "dist/web-a/asset-manifest.json"), "utf8"));
    assert.equal(webLedger.schemaVersion, 2);
    assert.equal(webLedger.assets.some((asset) => asset.path === "assets/catalogue/cover.png"), true);
    assert.equal(webLedger.assets.some((asset) => asset.path === "platform/phase5-ui.css"), true);
    assert.equal(webLedger.assets.some((asset) => asset.path === "bootstrap-errors.js"), true);
    assert.equal(webLedger.assets.some((asset) => asset.path === "platform/host/keyboard-viewport-manager.mjs"), true);
    assert.equal(webLedger.assets.some((asset) => asset.path === "platform/host/first-paint-gate.mjs"), true);
    const webHtml = await readFile(resolve(project, "dist/web-a/index.html"), "utf8");
    assert.match(webHtml, /Content-Security-Policy/);
    assert.match(webHtml, /platform\/phase5-ui\.css/);
    assert.doesNotMatch(webHtml, /luastra-host-brand/);
    assert.match(webHtml, /id="status"[^>]*hidden/);
    assert.doesNotMatch(webHtml, /Luastra development host/);

    const changedCover = Buffer.from(coverBytes);
    changedCover[changedCover.length - 1] ^= 1;
    await writeFile(resolve(project, "assets/cover.png"), changedCover);
    const assetChanged = JSON.parse(run(["build", "bundle", `--project=${project}`, "--out=dist/bundle-asset-change"]).stdout);
    assert.equal(assetChanged.bundleContentSha256, bundleA.bundleContentSha256, "asset edit changed Luau bundle digest");
    assert.notEqual(assetChanged.projectContentSha256, bundleA.projectContentSha256, "asset edit did not change project digest");

    const occupiedBundle = resolve(project, "occupied-bundle");
    await mkdir(occupiedBundle);
    await writeFile(resolve(occupiedBundle, "keep.txt"), "keep");
    assert.match(run(["build", "bundle", `--project=${project}`, "--out=occupied-bundle"], 1).stderr, /refusing non-Luastra bundle output/);
    assert.equal(await readFile(resolve(occupiedBundle, "keep.txt"), "utf8"), "keep");

    const tested = JSON.parse(run(["test", `--project=${project}`]).stdout);
    assert.equal(tested.result, "PASS");
    assert.equal(tested.tests, 1);
    assert.equal(tested.passed, 1);
    assert.equal(tested.results[0].id, "app/tests/smoke");

    const smokePath = resolve(project, "tests/smoke.luau");
    const validSmoke = await readFile(smokePath, "utf8");
    await writeFile(smokePath, validSmoke.replace("return true", "assert(false, \"controlled test failure\")\nreturn true"));
    assert.match(run(["test", `--project=${project}`], 1).stderr, /test failed: app\/tests\/smoke[\s\S]*controlled test failure/);
    await writeFile(smokePath, "--!strict\nwhile true do end\nreturn true\n");
    assert.match(run(["test", `--project=${project}`], 1).stderr, /test timed out after 2000ms: app\/tests\/smoke/);
    await writeFile(smokePath, validSmoke);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("animated catalogue resolves its SDK closure and renders through Wasm", async () => {
  const project = resolve(prototype, "examples/animated-catalogue");
  const checked = JSON.parse(run(["check", `--project=${project}`]).stdout);
  assert.equal(checked.result, "PASS");
  assert.equal(checked.modules, 8);
  const output = await mkdtemp(resolve(tmpdir(), "luastra-catalogue-bundle-"));
  try {
    run(["build", "bundle", `--project=${project}`, `--out=${output}`]);
    const bundle = JSON.parse(await readFile(resolve(output, "luastra.bundle.json"), "utf8"));
    assert.deepEqual(bundle.modules.map((module) => module.id), ["luastra/host", "luastra/motion", "luastra/navigation", "luastra/state", "luastra/ui", "app/main"]);
    const executed = await runWasmBundle({
      bundlePath: resolve(output, "luastra.bundle.json"),
      runtimeModulePath: resolve(prototype, "platform/artifacts/vm-wasm/luastra-vm.js"),
      allowedCapabilities: ["app.launchurl.get", "navigation.history", "storage.get", "storage.set", "ui.render"],
      requireRendererTree: true,
      dispatches: [{ action: "select-card", target: "catalogue/focus/select", value: "" }],
      capabilityHandler: async (request) => platformResponse(request, request.kind === "storage.set" ? "stored" : ""),
    });
    const visit = (node, id) => node.id === id ? node : node.children.map((child) => visit(child, id)).find(Boolean) ?? null;
    assert.match(executed.renderTree.properties.className, /luastra-width-wide/);
    assert.equal(visit(executed.renderTree, "catalogue/selection-value").properties.text, "catalogue/focus");
    assert.equal(executed.memory.growthBytes, 0);
    const tested = JSON.parse(run(["test", `--project=${project}`]).stdout);
    assert.equal(tested.passed, 2);
    assert.equal(tested.results[0].id, "app/tests/catalogue");
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("central SDK integrity mismatch fails before project analysis", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-sdk-integrity-"));
  try {
    const sourceManifest = resolve(prototype, "sdk/source-manifest.v1.json");
    const manifest = JSON.parse(await readFile(sourceManifest, "utf8"));
    manifest.modules[0].sha256 = "0".repeat(64);
    const tampered = resolve(workspace, "source-manifest.v1.json");
    await writeFile(tampered, `${JSON.stringify(manifest, null, 2)}\n`);
    await assert.rejects(resolveSourceSdk(tampered), /integrity mismatch/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("project v2 rejects reserved SDK modules, missing dependencies and escaping sources", async () => {
  const workspace = await mkdtemp(resolve(tmpdir(), "luastra-v2-negative-"));
  try {
    const project = resolve(workspace, "project");
    run(["create", project]);
    const manifestPath = resolve(project, "luastra.json");
    const original = JSON.parse(await readFile(manifestPath, "utf8"));

    await writeFile(resolve(project, "assets/bad.png"), Buffer.from([0, 0, 0, 0]));
    const invalidAsset = structuredClone(original);
    invalidAsset.assets = [{ id: "images/bad", source: "assets/bad.png", mediaType: "image/png" }];
    await writeFile(manifestPath, `${JSON.stringify(invalidAsset, null, 2)}\n`);
    assert.match(run(["check", `--project=${project}`], 1).stderr, /content does not match image\/png/);

    const reserved = structuredClone(original);
    reserved.modules[0].id = "luastra/ui";
    reserved.project.entry = "luastra/ui";
    await writeFile(manifestPath, `${JSON.stringify(reserved, null, 2)}\n`);
    assert.match(run(["check", `--project=${project}`], 1).stderr, /reserved SDK namespace/);

    const missing = structuredClone(original);
    missing.modules[0].dependencies = ["luastra/unknown"];
    await writeFile(manifestPath, `${JSON.stringify(missing, null, 2)}\n`);
    assert.match(run(["check", `--project=${project}`], 1).stderr, /not declared by the project or SDK/);

    const outside = resolve(workspace, "outside.luau");
    await writeFile(outside, "--!strict\nreturn {}\n");
    await rm(resolve(project, "src/main.luau"));
    await symlink(outside, resolve(project, "src/main.luau"));
    await writeFile(manifestPath, `${JSON.stringify(original, null, 2)}\n`);
    assert.match(run(["check", `--project=${project}`], 1).stderr, /resolves outside the project/);

    const occupied = resolve(workspace, "occupied");
    await mkdir(occupied);
    await writeFile(resolve(occupied, "keep.txt"), "keep");
    assert.match(run(["create", occupied], 1).stderr, /destination is not empty/);
    assert.equal(await readFile(resolve(occupied, "keep.txt"), "utf8"), "keep");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
