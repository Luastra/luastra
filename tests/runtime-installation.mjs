import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test, { after, before } from "node:test";

import { buildRuntimeArchives } from "../platform/packaging/build-runtime-archives.mjs";
import { installRuntimeSdk, proposeRuntimeInstallationAdmission, verifyInstalledRuntimeSdk } from "../platform/packaging/install-runtime-sdk.mjs";
import { resolveRuntime } from "../platform/resolve-runtime.mjs";
import { canonicalJson } from "../assets/package-assets.mjs";

const prototype = resolve(import.meta.dirname, "..");
let temporary;
let archiveSet;

before(async () => {
  temporary = await mkdtemp(resolve(tmpdir(), "luastra-runtime-installation-"));
  archiveSet = resolve(temporary, "archive-set");
  await buildRuntimeArchives({ output: archiveSet });
});

after(async () => {
  await rm(temporary, { recursive: true, force: true });
});

test("runtime installer materializes every admitted target with an exact receipt", async () => {
  const targets = [
    { id: "darwin-x64", platform: "darwin", architecture: "x64", contentSha256: "3e30076725b3b6b14b1799a80753a52b051e085d25ed58dbc84d507aed169d68" },
    { id: "darwin-arm64", platform: "darwin", architecture: "arm64", contentSha256: "8ca7f76bb3b389c4b831408137c873458fd1786a815ed25ebc728203d11ed045" },
    { id: "linux-x64", platform: "linux", architecture: "x64", contentSha256: "11f93e742847abe89f6896ae97fd8cf96990c0324c2448ba5e1af93887bfbfa1" },
    { id: "win32-x64", platform: "win32", architecture: "x64", contentSha256: "344fbdb512ba92b63d0d93b9fc2e70a60ac7ed5ac070ef238966533f1937b42d" },
  ];
  const identities = new Set();
  for (const target of targets) {
    const output = resolve(temporary, `installed-${target.id}`);
    const installed = await installRuntimeSdk({ archiveSet, output, expectedHost: { platform: target.platform, architecture: target.architecture } });
    assert.equal(installed.targetId, target.id);
    assert.equal(installed.contentSha256, target.contentSha256);
    identities.add(installed.contentSha256);
    const verified = await verifyInstalledRuntimeSdk(output, { platform: target.platform, architecture: target.architecture });
    assert.equal(verified.targetId, target.id);
    assert.equal(verified.origin, "installation");
  }
  assert.equal(identities.size, targets.length);
});

test("installation admission proposal reproduces the reviewed trust anchor", async () => {
  const proposed = await proposeRuntimeInstallationAdmission(archiveSet);
  const admitted = JSON.parse(await readFile(resolve(prototype, "platform/packaging/runtime-installation-admission.v1.json"), "utf8"));
  assert.deepEqual(proposed, admitted);
});

test("runtime installer atomically materializes and resolves the current host SDK", async () => {
  const output = resolve(temporary, "installed-current");
  const installed = await installRuntimeSdk({ archiveSet, output });
  assert.equal(installed.result, "PASS");
  assert.equal(installed.identity, "luastra-runtime-installation/phase5-alpha-2");
  assert.equal(installed.sdkIdentity, "luastra-runtime-sdk/phase5-alpha-8");
  assert.equal(installed.targetId, `${process.platform}-${process.arch}`);
  const verified = await verifyInstalledRuntimeSdk(output);
  assert.equal(verified.origin, "installation");
  assert.equal(verified.installationRoot, await realpath(output));
  const resolved = await resolveRuntime({ installationRoot: output, environment: {} });
  assert.equal(resolved.origin, "installation");
  assert.equal(resolved.artifacts.runtimeWasm, resolve(verified.installationRoot, "runtime/luastra-vm.wasm"));

  const execution = spawnSync(process.execPath, ["cli/luastra.mjs", "check", `--project=${resolve(prototype, "examples/animated-catalogue")}`], {
    cwd: prototype,
    env: { ...process.env, LUASTRA_RUNTIME_SDK_ROOT: output },
    encoding: "utf8",
    timeout: 10_000,
    maxBuffer: 1024 * 1024,
  });
  assert.equal(execution.status, 0, execution.stderr || execution.stdout);
  const result = JSON.parse(execution.stdout);
  assert.equal(result.binarySdkOrigin, "installation");
  assert.equal(result.binarySdkIdentity, "luastra-runtime-sdk/phase5-alpha-8");

  const cliOutput = resolve(temporary, "installed-cli");
  const cliInstall = spawnSync(process.execPath, ["cli/luastra.mjs", "sdk", "install", `--archive-set=${archiveSet}`, `--out=${cliOutput}`], {
    cwd: prototype,
    encoding: "utf8",
    timeout: 15_000,
    maxBuffer: 1024 * 1024,
  });
  assert.equal(cliInstall.status, 0, cliInstall.stderr || cliInstall.stdout);
  const cliResult = JSON.parse(cliInstall.stdout);
  assert.equal(cliResult.command, "sdk install");
  assert.equal(cliResult.targetId, `${process.platform}-${process.arch}`);
  assert.equal((await verifyInstalledRuntimeSdk(cliOutput)).origin, "installation");
});

test("configured installed SDK fails closed after tampering without repository fallback", async () => {
  const output = resolve(temporary, "installed-tampered");
  await installRuntimeSdk({ archiveSet, output });
  const analyzer = resolve(output, `bin/luastra_analyze${process.platform === "win32" ? ".exe" : ""}`);
  await writeFile(analyzer, "tampered\n");
  await assert.rejects(() => verifyInstalledRuntimeSdk(output), /runtime installation file mismatch/);
  await assert.rejects(() => resolveRuntime({ installationRoot: output, environment: {} }), /runtime installation file mismatch/);
  const execution = spawnSync(process.execPath, ["cli/luastra.mjs", "check", `--project=${resolve(prototype, "examples/animated-catalogue")}`], {
    cwd: prototype,
    env: { ...process.env, LUASTRA_RUNTIME_SDK_ROOT: output },
    encoding: "utf8",
    timeout: 10_000,
    maxBuffer: 1024 * 1024,
  });
  assert.notEqual(execution.status, 0);
  assert.match(execution.stderr, /runtime installation file mismatch/);
});

test("runtime installer and verifier reject unsafe destinations, mutable layouts and wrong hosts", async () => {
  const output = resolve(temporary, "installed-controls");
  await installRuntimeSdk({ archiveSet, output });
  await assert.rejects(() => installRuntimeSdk({ archiveSet, output }), /output already exists/);
  await assert.rejects(() => installRuntimeSdk({ archiveSet, output: resolve(archiveSet, "nested") }), /outside the archive set/);
  const dangling = resolve(temporary, "dangling-output");
  await symlink(resolve(temporary, "missing-output-target"), dangling);
  await assert.rejects(() => installRuntimeSdk({ archiveSet, output: dangling }), /output already exists/);
  await assert.rejects(() => resolveRuntime({ installationRoot: "relative-sdk", environment: {} }), /non-empty absolute path/);
  const wrongHost = process.platform === "linux"
    ? { platform: "darwin", architecture: "x64" }
    : { platform: "linux", architecture: "x64" };
  await assert.rejects(() => verifyInstalledRuntimeSdk(output, wrongHost), /layout mismatch|invalid runtime installation receipt/);
  await writeFile(resolve(output, "unexpected.txt"), "not admitted\n");
  await assert.rejects(() => verifyInstalledRuntimeSdk(output), /layout mismatch/);

  const symlinkOutput = resolve(temporary, "installed-symlink");
  await installRuntimeSdk({ archiveSet, output: symlinkOutput });
  await symlink(resolve(symlinkOutput, "runtime/luastra-vm.js"), resolve(symlinkOutput, "unexpected-link"));
  await assert.rejects(() => verifyInstalledRuntimeSdk(symlinkOutput), /contains a symlink/);
});

test("runtime installation receipt cannot be rewritten to admit a different package", async () => {
  const output = resolve(temporary, "installed-receipt");
  await installRuntimeSdk({ archiveSet, output });
  const receiptPath = resolve(output, "runtime-install.v1.json");
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  receipt.packageContentSha256 = "0".repeat(64);
  await writeFile(receiptPath, canonicalJson(receipt));
  await assert.rejects(() => verifyInstalledRuntimeSdk(output), /content identity mismatch/);
});
