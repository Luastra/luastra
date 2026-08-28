#!/usr/bin/env node

import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const releaseIdentityPrefix = "luastra-sdk-release/";
const sdkManifestIdentity = "luastra-sdk-installation/v1";
const stateIdentity = "luastra-sdk-manager-state/v1";
const supportedHosts = Object.freeze([
  Object.freeze({ id: "darwin-arm64", platform: "darwin", architecture: "arm64" }),
  Object.freeze({ id: "darwin-x64", platform: "darwin", architecture: "x64" }),
  Object.freeze({ id: "linux-x64", platform: "linux", architecture: "x64" }),
  Object.freeze({ id: "win32-x64", platform: "win32", architecture: "x64" }),
]);

function fail(message) { throw new Error(message); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
function canonicalJson(value) { return `${JSON.stringify(stable(value), null, 2)}\n`; }
function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}
function inside(root, path) {
  const local = relative(root, path);
  return local !== ".." && !local.startsWith(`..${sep}`) && !isAbsolute(local);
}
function validDigest(value) { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function validVersion(value) { return typeof value === "string" && /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/.test(value); }
function readString(buffer, offset, length) {
  const end = buffer.indexOf(0, offset);
  return buffer.subarray(offset, end >= offset && end < offset + length ? end : offset + length).toString("utf8");
}
function readOctal(buffer, offset, length, field) {
  const value = buffer.subarray(offset, offset + length).toString("ascii").replace(/[\0 ]+$/g, "");
  if (!/^[0-7]+$/.test(value)) fail(`invalid archive ${field}`);
  return Number.parseInt(value, 8);
}
function parseTar(tar) {
  const entries = [];
  const names = new Set();
  let offset = 0;
  let zeroBlocks = 0;
  while (offset + 512 <= tar.byteLength) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) { zeroBlocks += 1; offset += 512; break; }
    const expectedChecksum = readOctal(header, 148, 8, "checksum");
    const checksumHeader = Buffer.from(header);
    checksumHeader.fill(0x20, 148, 156);
    if (checksumHeader.reduce((sum, byte) => sum + byte, 0) !== expectedChecksum) fail("archive tar checksum mismatch");
    if (readString(header, 257, 6) !== "ustar" || readString(header, 263, 2) !== "00" || header[156] !== 0x30) {
      fail("archive contains a non-canonical or non-regular entry");
    }
    const name = readString(header, 0, 100);
    const prefix = readString(header, 345, 155);
    const path = prefix ? `${prefix}/${name}` : name;
    if (!path || isAbsolute(path) || path.includes("\\") || path.split("/").some((part) => part === "" || part === "." || part === "..") || names.has(path)) {
      fail(`unsafe or duplicate archive path: ${path}`);
    }
    const mode = readOctal(header, 100, 8, "mode");
    const uid = readOctal(header, 108, 8, "uid");
    const gid = readOctal(header, 116, 8, "gid");
    const size = readOctal(header, 124, 12, "size");
    const mtime = readOctal(header, 136, 12, "mtime");
    if (uid !== 0 || gid !== 0 || mtime !== 0 || !new Set([0o644, 0o755]).has(mode)) fail("archive metadata is not canonical");
    offset += 512;
    if (offset + size > tar.byteLength) fail("archive entry is truncated");
    entries.push(Object.freeze({ path, mode, bytes: Buffer.from(tar.subarray(offset, offset + size)) }));
    names.add(path);
    offset += size + ((512 - (size % 512)) % 512);
  }
  while (offset + 512 <= tar.byteLength && tar.subarray(offset, offset + 512).every((byte) => byte === 0)) {
    zeroBlocks += 1;
    offset += 512;
  }
  if (zeroBlocks < 2 || offset !== tar.byteLength || entries.length === 0) fail("archive has invalid end blocks or trailing bytes");
  return entries;
}
async function bytesFromSource(source, fetchImpl = fetch) {
  if (/^https:\/\//.test(source)) {
    const response = await fetchImpl(source);
    if (!response.ok) fail(`download failed: ${response.status} ${source}`);
    return Buffer.from(await response.arrayBuffer());
  }
  if (/^http:\/\//.test(source)) fail("release downloads must use HTTPS");
  return readFile(resolve(source));
}
function relatedSource(manifestSource, filename) {
  if (/^https:\/\//.test(manifestSource)) return new URL(filename, manifestSource).href;
  return resolve(dirname(manifestSource), filename);
}
function validateAsset(asset, field) {
  if (!exactKeys(asset, ["filename", "bytes", "sha256"]) || typeof asset.filename !== "string" ||
      asset.filename.includes("/") || asset.filename.includes("\\") || !Number.isSafeInteger(asset.bytes) || asset.bytes < 1 || !validDigest(asset.sha256)) {
    fail(`invalid release ${field}`);
  }
}

export function detectSupportedHost(host = { platform: process.platform, architecture: process.arch }) {
  const selected = supportedHosts.find((candidate) => candidate.platform === host.platform && candidate.architecture === host.architecture);
  if (!selected) fail(`unsupported Luastra host: ${host.platform}/${host.architecture}`);
  return selected;
}

export function verifyReleaseManifestBytes(bytes) {
  const manifest = JSON.parse(bytes.toString("utf8"));
  if (!exactKeys(manifest, ["schemaVersion", "identity", "version", "channel", "publication", "node", "hosts", "installer", "compliance", "releaseNotes", "contentSha256"]) ||
      manifest.schemaVersion !== 1 || manifest.identity !== `${releaseIdentityPrefix}${manifest.version}` || !validVersion(manifest.version) ||
      manifest.channel !== "alpha" || !["NOT_AUTHORIZED", "PUBLIC_SOURCE_ALPHA"].includes(manifest.publication) || manifest.node !== ">=24" || !Array.isArray(manifest.hosts) ||
      manifest.hosts.length !== supportedHosts.length || !validDigest(manifest.contentSha256)) fail("invalid Luastra release manifest");
  validateAsset(manifest.installer, "installer");
  validateAsset(manifest.releaseNotes, "release notes");
  if (!exactKeys(manifest.compliance, ["sbom", "notices", "licenseBundle"])) fail("invalid release compliance bundle");
  for (const [name, asset] of Object.entries(manifest.compliance)) validateAsset(asset, name);
  for (let index = 0; index < supportedHosts.length; index += 1) {
    const expected = supportedHosts[index];
    const record = manifest.hosts[index];
    if (!exactKeys(record, ["id", "platform", "architecture", "root", "archive", "sdkContentSha256"]) || record.id !== expected.id ||
        record.platform !== expected.platform || record.architecture !== expected.architecture || typeof record.root !== "string" ||
        record.root !== `luastra-sdk-${manifest.version}-${record.id}` || !validDigest(record.sdkContentSha256)) fail(`invalid release host: ${expected.id}`);
    validateAsset(record.archive, `${expected.id} archive`);
  }
  const base = { ...manifest };
  delete base.contentSha256;
  if (sha256(Buffer.from(canonicalJson(base))) !== manifest.contentSha256) fail("release manifest content identity mismatch");
  if (!bytes.equals(Buffer.from(canonicalJson(manifest)))) fail("release manifest is not canonical");
  return Object.freeze(manifest);
}

export function verifySdkArchiveBytes(archiveBytes, manifest, hostRecord) {
  let tar;
  try { tar = gunzipSync(archiveBytes); } catch { fail(`invalid gzip SDK archive: ${hostRecord.id}`); }
  const entries = parseTar(tar);
  if (entries.some((entry) => !entry.path.startsWith(`${hostRecord.root}/`))) fail("SDK archive has an unexpected root");
  const manifestEntry = entries.find((entry) => entry.path === `${hostRecord.root}/SDK_MANIFEST.json`) ?? fail("SDK manifest is missing from archive");
  const sdkManifest = JSON.parse(manifestEntry.bytes.toString("utf8"));
  if (!exactKeys(sdkManifest, ["schemaVersion", "identity", "version", "target", "node", "files", "contentSha256"]) ||
      sdkManifest.schemaVersion !== 1 || sdkManifest.identity !== sdkManifestIdentity || sdkManifest.version !== manifest.version ||
      !exactKeys(sdkManifest.target, ["id", "platform", "architecture"]) || sdkManifest.target.id !== hostRecord.id ||
      sdkManifest.target.platform !== hostRecord.platform || sdkManifest.target.architecture !== hostRecord.architecture ||
      sdkManifest.node !== ">=24" || !Array.isArray(sdkManifest.files) || !validDigest(sdkManifest.contentSha256)) fail("invalid SDK installation manifest");
  if (!manifestEntry.bytes.equals(Buffer.from(canonicalJson(sdkManifest)))) fail("SDK installation manifest is not canonical");
  const base = { ...sdkManifest };
  delete base.contentSha256;
  if (sha256(Buffer.from(canonicalJson(base))) !== sdkManifest.contentSha256 || sdkManifest.contentSha256 !== hostRecord.sdkContentSha256) {
    fail("SDK installation content identity mismatch");
  }
  const payload = entries.filter((entry) => entry !== manifestEntry).map((entry) => ({
    path: entry.path.slice(hostRecord.root.length + 1), mode: entry.mode, bytes: entry.bytes.byteLength, sha256: sha256(entry.bytes),
  })).sort((left, right) => left.path.localeCompare(right.path));
  if (canonicalJson(payload) !== canonicalJson(sdkManifest.files)) fail("SDK archive file ledger mismatch");
  return Object.freeze({ entries, sdkManifest: Object.freeze(sdkManifest) });
}

async function writeState(root, activeVersion) {
  const state = { schemaVersion: 1, identity: stateIdentity, activeVersion };
  const temporary = resolve(root, `.state.v1.json.${process.pid}.partial`);
  await writeFile(temporary, canonicalJson(state), { mode: 0o644 });
  await rename(temporary, resolve(root, "state.v1.json"));
}
async function writeShims(root) {
  await mkdir(resolve(root, "bin"), { recursive: true });
  const shell = "#!/bin/sh\nset -eu\nLUASTRA_ROOT=$(CDPATH= cd -- \"$(dirname -- \"$0\")/..\" && pwd)\nexec node \"$LUASTRA_ROOT/shim.mjs\" \"$@\"\n";
  const command = "@echo off\r\nnode \"%~dp0..\\shim.mjs\" %*\r\n";
  const shim = `import { spawn } from "node:child_process";\nimport { readFile } from "node:fs/promises";\nimport { dirname, resolve } from "node:path";\nimport { fileURLToPath } from "node:url";\nconst root=dirname(fileURLToPath(import.meta.url));\nconst state=JSON.parse(await readFile(resolve(root,"state.v1.json"),"utf8"));\nconst cli=resolve(root,"sdk",state.activeVersion,"cli/luastra.mjs");\nconst child=spawn(process.execPath,[cli,...process.argv.slice(2)],{stdio:"inherit"});\nchild.once("error",(error)=>{console.error(\`Luastra: \${error.message}\`);process.exitCode=1;});\nchild.once("exit",(code,signal)=>{if(signal)process.kill(process.pid,signal);else process.exitCode=code??1;});\n`;
  await writeFile(resolve(root, "bin/luastra"), shell, { mode: 0o755 });
  await chmod(resolve(root, "bin/luastra"), 0o755);
  await writeFile(resolve(root, "bin/luastra.cmd"), command, { mode: 0o644 });
  await writeFile(resolve(root, "shim.mjs"), shim, { mode: 0o644 });
}
async function inventoryInstalled(root, directory = root) {
  const files = [];
  for (const name of (await readdir(directory)).sort()) {
    const path = resolve(directory, name);
    const local = relative(root, path).split(sep).join("/");
    const info = await lstat(path);
    if (info.isSymbolicLink()) fail(`installed SDK contains a symlink: ${local}`);
    if (info.isDirectory()) files.push(...await inventoryInstalled(root, path));
    else if (info.isFile()) files.push({ path: local, mode: info.mode & 0o777, bytes: info.size, sha256: sha256(await readFile(path)) });
    else fail(`installed SDK contains an unsupported entry: ${local}`);
  }
  return files.sort((left, right) => left.path.localeCompare(right.path));
}
function assertLedger(actual, expected, hostPlatform, message) {
  if (actual.length !== expected.length) fail(message);
  for (let index = 0; index < expected.length; index += 1) {
    const received = actual[index];
    const admitted = expected[index];
    if (received.path !== admitted.path || received.bytes !== admitted.bytes || received.sha256 !== admitted.sha256 ||
        (hostPlatform !== "win32" && received.mode !== admitted.mode)) fail(message);
  }
}

export async function verifyInstalledSdk(managerRoot = resolve(homedir(), ".luastra"), version, expectedHost = detectSupportedHost()) {
  if (!validVersion(version)) fail(`invalid SDK version: ${version}`);
  const root = await realpath(resolve(managerRoot, "sdk", version));
  const manifestBytes = await readFile(resolve(root, "SDK_MANIFEST.json"));
  const manifest = JSON.parse(manifestBytes);
  if (!exactKeys(manifest, ["schemaVersion", "identity", "version", "target", "node", "files", "contentSha256"]) ||
      manifest.schemaVersion !== 1 || manifest.identity !== sdkManifestIdentity || manifest.version !== version || manifest.node !== ">=24" ||
      manifest.target?.id !== expectedHost.id || manifest.target.platform !== expectedHost.platform || manifest.target.architecture !== expectedHost.architecture ||
      !Array.isArray(manifest.files) || !validDigest(manifest.contentSha256) || !manifestBytes.equals(Buffer.from(canonicalJson(manifest)))) fail("invalid installed SDK manifest");
  const base = { ...manifest }; delete base.contentSha256;
  if (sha256(Buffer.from(canonicalJson(base))) !== manifest.contentSha256) fail("installed SDK content identity mismatch");
  const files = (await inventoryInstalled(root)).filter((entry) => entry.path !== "SDK_MANIFEST.json");
  assertLedger(files, manifest.files, expectedHost.platform, "installed SDK file ledger mismatch");
  return Object.freeze({ result: "PASS", version, targetId: expectedHost.id, root, contentSha256: manifest.contentSha256 });
}

export async function installSdkRelease({ manifestSource, managerRoot = resolve(homedir(), ".luastra"), expectedHost = detectSupportedHost(), activate = true, fetchImpl = fetch, onBeforeCommit = null } = {}) {
  if (typeof manifestSource !== "string" || manifestSource.length === 0) fail("release manifest source is required");
  const manifestBytes = await bytesFromSource(manifestSource, fetchImpl);
  const manifest = verifyReleaseManifestBytes(manifestBytes);
  const hostRecord = manifest.hosts.find((record) => record.id === expectedHost.id) ?? fail(`release does not support host: ${expectedHost.id}`);
  const archiveBytes = await bytesFromSource(relatedSource(manifestSource, hostRecord.archive.filename), fetchImpl);
  if (archiveBytes.byteLength !== hostRecord.archive.bytes || sha256(archiveBytes) !== hostRecord.archive.sha256) fail("SDK archive checksum mismatch");
  const verified = verifySdkArchiveBytes(archiveBytes, manifest, hostRecord);
  const root = resolve(managerRoot);
  await mkdir(resolve(root, "sdk"), { recursive: true });
  const destination = resolve(root, "sdk", manifest.version);
  if (await lstat(destination).catch(() => null)) {
    const installed = await verifyInstalledSdk(root, manifest.version, expectedHost);
    if (installed.contentSha256 !== hostRecord.sdkContentSha256) fail(`SDK version already exists with different content: ${manifest.version}`);
    if (activate) await useSdkVersion(root, manifest.version, expectedHost);
    return Object.freeze({ ...installed, command: "sdk install", result: "ALREADY_INSTALLED", active: activate });
  }
  const temporary = await mkdtemp(resolve(root, "sdk", `.${manifest.version}.partial-`));
  let moved = false;
  try {
    for (const entry of verified.entries) {
      const local = entry.path.slice(hostRecord.root.length + 1);
      const target = resolve(temporary, local);
      if (!inside(temporary, target)) fail(`SDK archive extraction escapes root: ${entry.path}`);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, entry.bytes, { mode: entry.mode });
      await chmod(target, entry.mode);
    }
    const stagedRoot = await realpath(temporary);
    const stagedManifest = JSON.parse(await readFile(resolve(stagedRoot, "SDK_MANIFEST.json"), "utf8"));
    const stagedFiles = (await inventoryInstalled(stagedRoot)).filter((entry) => entry.path !== "SDK_MANIFEST.json");
    assertLedger(stagedFiles, stagedManifest.files, expectedHost.platform, "staged SDK file ledger mismatch");
    if (onBeforeCommit) await onBeforeCommit(stagedRoot);
    await rename(temporary, destination);
    moved = true;
    await writeShims(root);
    if (activate) await writeState(root, manifest.version);
    return Object.freeze({ command: "sdk install", result: "PASS", version: manifest.version, targetId: expectedHost.id, root: destination,
      contentSha256: hostRecord.sdkContentSha256, active: activate });
  } finally {
    if (!moved) await rm(temporary, { recursive: true, force: true });
  }
}

export async function listSdkVersions(managerRoot = resolve(homedir(), ".luastra"), expectedHost = detectSupportedHost()) {
  const root = resolve(managerRoot);
  const state = JSON.parse(await readFile(resolve(root, "state.v1.json"), "utf8").catch(() => "null"));
  const sdkRoot = resolve(root, "sdk");
  const names = (await readdir(sdkRoot).catch(() => [])).filter((name) => !name.startsWith(".")).sort();
  const versions = [];
  for (const version of names) {
    try {
      const verified = await verifyInstalledSdk(root, version, expectedHost);
      versions.push({ version, active: state?.activeVersion === version, status: "VERIFIED", contentSha256: verified.contentSha256 });
    } catch (error) {
      versions.push({ version, active: state?.activeVersion === version, status: "CORRUPT", error: String(error?.message ?? error) });
    }
  }
  return Object.freeze({ command: "sdk list", result: "PASS", versions: Object.freeze(versions) });
}

export async function useSdkVersion(managerRoot = resolve(homedir(), ".luastra"), version, expectedHost = detectSupportedHost()) {
  const root = resolve(managerRoot);
  const verified = await verifyInstalledSdk(root, version, expectedHost);
  await writeShims(root);
  await writeState(root, version);
  return Object.freeze({ command: "sdk use", result: "PASS", version, targetId: verified.targetId, contentSha256: verified.contentSha256 });
}

export async function removeSdkVersion(managerRoot = resolve(homedir(), ".luastra"), version, expectedHost = detectSupportedHost()) {
  const root = resolve(managerRoot);
  const state = JSON.parse(await readFile(resolve(root, "state.v1.json"), "utf8").catch(() => "null"));
  if (state?.activeVersion === version) fail(`cannot remove active SDK version: ${version}`);
  await verifyInstalledSdk(root, version, expectedHost);
  await rm(resolve(root, "sdk", version), { recursive: true, force: false });
  return Object.freeze({ command: "sdk remove", result: "PASS", version });
}

export async function doctorSdk(managerRoot = resolve(homedir(), ".luastra"), expectedHost = detectSupportedHost()) {
  const root = resolve(managerRoot);
  const major = Number(process.versions.node.split(".")[0]);
  if (!Number.isInteger(major) || major < 24) fail(`Node.js 24 or newer is required; found ${process.version}`);
  const stateBytes = await readFile(resolve(root, "state.v1.json"));
  const state = JSON.parse(stateBytes);
  if (!exactKeys(state, ["schemaVersion", "identity", "activeVersion"]) || state.schemaVersion !== 1 || state.identity !== stateIdentity ||
      !validVersion(state.activeVersion) || !stateBytes.equals(Buffer.from(canonicalJson(state)))) fail("invalid SDK manager state");
  const installed = await verifyInstalledSdk(root, state.activeVersion, expectedHost);
  for (const path of [resolve(root, "shim.mjs"), resolve(root, "bin/luastra"), resolve(root, "bin/luastra.cmd")]) {
    if (!(await stat(path).catch(() => null))?.isFile()) fail(`SDK shim is missing: ${basename(path)}`);
  }
  return Object.freeze({ command: "doctor", result: "PASS", node: process.version, version: state.activeVersion,
    targetId: expectedHost.id, installationRoot: installed.root, contentSha256: installed.contentSha256 });
}

function parseArguments(values) {
  const options = {};
  for (const value of values) {
    if (!value.startsWith("--") || !value.includes("=")) fail("usage: luastra-install.mjs --manifest=<path-or-https-url> [--root=<directory>] [--no-use=true]");
    const [name, ...parts] = value.slice(2).split("=");
    if (!new Set(["manifest", "root", "no-use"]).has(name) || options[name] !== undefined) fail(`invalid or duplicate option: --${name}`);
    options[name] = parts.join("=");
  }
  if (!options.manifest) fail("--manifest is required");
  if (options["no-use"] !== undefined && options["no-use"] !== "true") fail("--no-use must equal true");
  return options;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const options = parseArguments(process.argv.slice(2));
  installSdkRelease({ manifestSource: options.manifest, managerRoot: options.root, activate: options["no-use"] !== "true" })
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { process.stderr.write(`Luastra installer: ${String(error?.message ?? error)}\n`); process.exitCode = 1; });
}
