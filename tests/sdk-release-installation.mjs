import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test, { after, before } from "node:test";

import { canonicalJson } from "../assets/package-assets.mjs";
import { buildSdkRelease, verifySdkReleaseSet } from "../release/build-sdk-release.mjs";
import { detectSupportedHost, doctorSdk, installSdkRelease, listSdkVersions, removeSdkVersion, useSdkVersion, verifyInstalledSdk } from "../release/luastra-install.mjs";

let temporary;
let releaseSet;
let manifest;
let manifestBytes;
const nodeDirectory = dirname(process.execPath);

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function run(command, values, cwd) {
  const result = spawnSync(command, values, { cwd, encoding: "utf8", timeout: 20_000, maxBuffer: 16 * 1024 * 1024, shell: process.platform === "win32",
    env: { ...process.env, PATH: `${nodeDirectory}:${process.env.PATH ?? ""}` } });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}
async function rewriteInstalledVersion(managerRoot, fromVersion, toVersion) {
  const source = resolve(managerRoot, "sdk", fromVersion);
  const destination = resolve(managerRoot, "sdk", toVersion);
  await cp(source, destination, { recursive: true });
  await writeFile(resolve(destination, "platform/product-version.mjs"), `export const productVersion = "${toVersion}";\n`);
  const manifestPath = resolve(destination, "SDK_MANIFEST.json");
  const sdkManifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const product = sdkManifest.files.find((item) => item.path === "platform/product-version.mjs");
  const productBytes = await readFile(resolve(destination, product.path));
  product.bytes = productBytes.byteLength;
  product.sha256 = sha256(productBytes);
  sdkManifest.version = toVersion;
  delete sdkManifest.contentSha256;
  sdkManifest.contentSha256 = sha256(Buffer.from(canonicalJson(sdkManifest)));
  await writeFile(manifestPath, canonicalJson(sdkManifest));
}

before(async () => {
  temporary = await mkdtemp(resolve(tmpdir(), "luastra-sdk-release-test-"));
  releaseSet = resolve(temporary, "release");
  await buildSdkRelease({ output: releaseSet });
  manifestBytes = await readFile(resolve(releaseSet, "luastra-release.v1.json"));
  manifest = JSON.parse(manifestBytes);
});

after(async () => {
  await rm(temporary, { recursive: true, force: true });
});

test("SDK release archives are deterministic, admitted, and exact", { timeout: 60_000 }, async () => {
  const second = resolve(temporary, "release-second");
  const firstResult = await verifySdkReleaseSet(releaseSet);
  const secondResult = await buildSdkRelease({ output: second });
  assert.equal(secondResult.contentSha256, firstResult.manifest.contentSha256);
  for (const name of await readdir(releaseSet)) assert.deepEqual(await readFile(resolve(releaseSet, name)), await readFile(resolve(second, name)));
  assert.equal(firstResult.manifest.hosts.length, 4);
  assert.equal(firstResult.manifest.compliance.sbom.filename, "luastra-sdk-0.1.0-alpha.spdx.json");
});

test("offline installation is atomic and the shim executes the selected SDK", { timeout: 60_000 }, async () => {
  const managerRoot = resolve(temporary, "offline-manager");
  const installed = await installSdkRelease({ manifestSource: resolve(releaseSet, "luastra-release.v1.json"), managerRoot });
  assert.equal(installed.result, "PASS");
  assert.equal(installed.version, "0.1.0-alpha");
  assert.equal((await doctorSdk(managerRoot)).result, "PASS");
  assert.deepEqual((await listSdkVersions(managerRoot)).versions.map(({ version, active, status }) => ({ version, active, status })),
    [{ version: "0.1.0-alpha", active: true, status: "VERIFIED" }]);
  const executable = process.platform === "win32" ? resolve(managerRoot, "bin/luastra.cmd") : resolve(managerRoot, "bin/luastra");
  assert.deepEqual(run(executable, ["version"], temporary), { command: "version", result: "PASS", version: "0.1.0-alpha" });
  assert.equal(run(executable, ["doctor", `--root=${managerRoot}`], temporary).result, "PASS");
  assert.equal(run(executable, ["sdk", "list", `--root=${managerRoot}`], temporary).versions[0].active, true);
  assert.equal(run(executable, ["sdk", "update", `--manifest=${resolve(releaseSet, "luastra-release.v1.json")}`, `--root=${managerRoot}`], temporary).command, "sdk update");
  const application = resolve(temporary, "installed-app");
  assert.equal(run(executable, ["create", application], temporary).result, "PASS");
  assert.equal(run(executable, ["check", `--project=${application}`], temporary).result, "PASS");
});

test("HTTPS installation uses the same verified archive path", async () => {
  const managerRoot = resolve(temporary, "online-manager");
  const host = detectSupportedHost();
  const archive = manifest.hosts.find((item) => item.id === host.id).archive;
  const responses = new Map([
    ["https://releases.example/luastra-release.v1.json", manifestBytes],
    [`https://releases.example/${archive.filename}`, await readFile(resolve(releaseSet, archive.filename))],
  ]);
  const fetchImpl = async (url) => {
    const bytes = responses.get(String(url));
    return bytes ? new Response(bytes, { status: 200 }) : new Response("missing", { status: 404 });
  };
  const result = await installSdkRelease({ manifestSource: "https://releases.example/luastra-release.v1.json", managerRoot, fetchImpl });
  assert.equal(result.result, "PASS");
  assert.equal((await doctorSdk(managerRoot)).version, "0.1.0-alpha");
});

test("tampering, interrupted installs, unsafe transport, and unsupported hosts fail closed", async () => {
  const host = detectSupportedHost();
  const archive = manifest.hosts.find((item) => item.id === host.id).archive;
  const changed = Buffer.from(await readFile(resolve(releaseSet, archive.filename)));
  changed[Math.floor(changed.byteLength / 2)] ^= 0xff;
  const fetchImpl = async (url) => new Response(String(url).endsWith("luastra-release.v1.json") ? manifestBytes : changed, { status: 200 });
  await assert.rejects(() => installSdkRelease({ manifestSource: "https://releases.example/luastra-release.v1.json",
    managerRoot: resolve(temporary, "tampered-download"), fetchImpl }), /archive checksum mismatch/);
  await assert.rejects(() => installSdkRelease({ manifestSource: "http://releases.example/luastra-release.v1.json",
    managerRoot: resolve(temporary, "unsafe-transport") }), /must use HTTPS/);
  const changedManifest = JSON.parse(manifestBytes);
  changedManifest.hosts[0].sdkContentSha256 = "0".repeat(64);
  await writeFile(resolve(temporary, "changed-manifest.json"), canonicalJson(changedManifest));
  await assert.rejects(() => installSdkRelease({ manifestSource: resolve(temporary, "changed-manifest.json"),
    managerRoot: resolve(temporary, "changed-manifest-manager") }), /manifest content identity mismatch/);
  assert.throws(() => detectSupportedHost({ platform: "plan9", architecture: "mips" }), /unsupported Luastra host/);

  const interruptedRoot = resolve(temporary, "interrupted-manager");
  await assert.rejects(() => installSdkRelease({ manifestSource: resolve(releaseSet, "luastra-release.v1.json"), managerRoot: interruptedRoot,
    onBeforeCommit: async () => { throw new Error("simulated interruption"); } }), /simulated interruption/);
  assert.equal(await stat(resolve(interruptedRoot, "sdk/0.1.0-alpha")).catch(() => null), null);
  assert.deepEqual((await readdir(resolve(interruptedRoot, "sdk"))).filter((name) => name.includes("partial")), []);
});

test("doctor detects local tampering and does not fall back", async () => {
  const managerRoot = resolve(temporary, "doctor-tamper-manager");
  await installSdkRelease({ manifestSource: resolve(releaseSet, "luastra-release.v1.json"), managerRoot });
  await writeFile(resolve(managerRoot, "sdk/0.1.0-alpha/README.md"), "tampered\n");
  await assert.rejects(() => verifyInstalledSdk(managerRoot, "0.1.0-alpha"), /file ledger mismatch/);
  await assert.rejects(() => doctorSdk(managerRoot), /file ledger mismatch/);
  assert.equal((await listSdkVersions(managerRoot)).versions[0].status, "CORRUPT");
});

test("explicit use supports rollback and remove refuses the active version", async () => {
  const managerRoot = resolve(temporary, "rollback-manager");
  await installSdkRelease({ manifestSource: resolve(releaseSet, "luastra-release.v1.json"), managerRoot });
  await rewriteInstalledVersion(managerRoot, "0.1.0-alpha", "0.0.9-alpha");
  assert.equal((await useSdkVersion(managerRoot, "0.0.9-alpha")).version, "0.0.9-alpha");
  assert.equal((await doctorSdk(managerRoot)).version, "0.0.9-alpha");
  await assert.rejects(() => removeSdkVersion(managerRoot, "0.0.9-alpha"), /cannot remove active/);
  await useSdkVersion(managerRoot, "0.1.0-alpha");
  assert.equal((await removeSdkVersion(managerRoot, "0.0.9-alpha")).result, "PASS");
  assert.deepEqual((await listSdkVersions(managerRoot)).versions.map((item) => item.version), ["0.1.0-alpha"]);
});

test("release verification rejects rewritten checksums and unexpected files", async () => {
  const changedChecksums = resolve(temporary, "changed-checksums");
  await cp(releaseSet, changedChecksums, { recursive: true });
  await writeFile(resolve(changedChecksums, "SHA256SUMS"), "0".repeat(64) + "  invalid\n");
  await assert.rejects(() => verifySdkReleaseSet(changedChecksums), /checksum file mismatch/);
  const extra = resolve(temporary, "extra-release-file");
  await cp(releaseSet, extra, { recursive: true });
  await writeFile(resolve(extra, "unexpected.txt"), "not admitted\n");
  await assert.rejects(() => verifySdkReleaseSet(extra), /unexpected entries/);
});
