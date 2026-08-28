import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { verifyRuntimeSdk } from "../platform/resolve-runtime-sdk.mjs";

const prototype = resolve(import.meta.dirname, "..");

function admittedCopy(source) {
  const local = relative(prototype, source);
  if (local === "") return true;
  const parts = local.split(sep);
  const generated = new Set(["node_modules", ".luastra", "dist", "target", "build", ".gradle", ".gradle-user-home", ".swiftpm-checkouts"]);
  return !parts.some((part) => generated.has(part));
}

test("runtime SDK owns and verifies the promoted Phase 5 artifact closure", async () => {
  const sdk = await verifyRuntimeSdk();
  assert.equal(sdk.identity, "luastra-runtime-sdk/phase5-alpha-8");
  assert.equal(sdk.targetId, `${process.platform}-${process.arch}`);
  assert.equal(sdk.artifactMatrixIdentity, "luastra-artifact-matrix/phase5-alpha-8");
  assert.deepEqual(Object.keys(sdk.artifacts).sort(), ["analyzer", "compiler", "runtimeJavaScript", "runtimeWasm"]);
  if (process.platform !== "win32") {
    assert.equal((await stat(sdk.artifacts.analyzer)).mode & 0o111, 0o111);
    assert.equal((await stat(sdk.artifacts.compiler)).mode & 0o111, 0o111);
  }
});

test("runtime SDK v2 selects exact native tools and shared Wasm for every admitted host", async () => {
  const targets = [
    { id: "darwin-x64", platform: "darwin", architecture: "x64", extension: "" },
    { id: "darwin-arm64", platform: "darwin", architecture: "arm64", extension: "" },
    { id: "linux-x64", platform: "linux", architecture: "x64", extension: "" },
    { id: "win32-x64", platform: "win32", architecture: "x64", extension: ".exe" },
  ];
  const wasm = new Set();
  for (const target of targets) {
    const sdk = await verifyRuntimeSdk(undefined, { platform: target.platform, architecture: target.architecture });
    const analyzerPath = sdk.artifacts.analyzer.split(sep).join("/");
    const compilerPath = sdk.artifacts.compiler.split(sep).join("/");
    assert.equal(sdk.targetId, target.id);
    assert.equal(analyzerPath.endsWith(`artifacts/${target.id}/luastra_analyze${target.extension}`), true);
    assert.equal(compilerPath.endsWith(`artifacts/${target.id}/luastra_compile${target.extension}`), true);
    wasm.add(sdk.artifacts.runtimeWasm);
  }
  assert.equal(wasm.size, 1, "portable Wasm must be shared across host selections");
  await assert.rejects(() => verifyRuntimeSdk(undefined, { platform: "linux", architecture: "arm64" }), /unsupported runtime SDK host/);
});

test("runtime SDK v2 rejects a manifest that does not bind the exact artifact matrix", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-runtime-manifest-"));
  try {
    const manifest = JSON.parse(await readFile(resolve(prototype, "platform/runtime-manifest.v2.json"), "utf8"));
    manifest.artifactMatrix.sha256 = "0".repeat(64);
    const path = resolve(temporary, "runtime-manifest.v2.json");
    await writeFile(path, JSON.stringify(manifest));
    await assert.rejects(() => verifyRuntimeSdk(path), /artifact matrix identity mismatch/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("an isolated Phase 5 copy builds a deterministic web application without historical workspaces", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "luastra-standalone-sdk-"));
  const isolated = resolve(temporary, "prototype");
  try {
    await cp(prototype, isolated, { recursive: true, filter: admittedCopy });
    const buildModule = pathToFileURL(resolve(isolated, "project/build-project.mjs")).href;
    const manifestPath = resolve(isolated, "examples/animated-catalogue/luastra.json");
    const firstOutput = resolve(temporary, "web-a");
    const secondOutput = resolve(temporary, "web-b");
    const script = `
      import { buildProject } from ${JSON.stringify(buildModule)};
      const first = await buildProject({ manifestPath: ${JSON.stringify(manifestPath)}, outputDirectory: ${JSON.stringify(firstOutput)}, target: "web" });
      const second = await buildProject({ manifestPath: ${JSON.stringify(manifestPath)}, outputDirectory: ${JSON.stringify(secondOutput)}, target: "web" });
      process.stdout.write(JSON.stringify({ first, second }));
    `;
    const execution = spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
      cwd: isolated,
      encoding: "utf8",
      timeout: 20_000,
      maxBuffer: 1024 * 1024,
    });
    assert.equal(execution.status, 0, execution.stderr || execution.stdout);
    const result = JSON.parse(execution.stdout);
    assert.equal(result.first.binarySdkIdentity, "luastra-runtime-sdk/phase5-alpha-8");
    assert.equal(result.first.projectContentSha256, result.second.projectContentSha256);
    assert.equal(result.first.assetManifestSha256, result.second.assetManifestSha256);
    assert.equal((await stat(resolve(firstOutput, "platform/artifacts/vm-wasm/luastra-vm.wasm"))).isFile(), true);
    assert.match(await readFile(resolve(firstOutput, "index.html"), "utf8"), /Luastra Application/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
