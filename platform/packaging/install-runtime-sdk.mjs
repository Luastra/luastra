import { createHash } from "node:crypto";
import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalJson } from "../../assets/package-assets.mjs";
import { loadRuntimeArchiveAdmission, readVerifiedRuntimeArchivePackage } from "./build-runtime-archives.mjs";
import { verifyRuntimePackage } from "./package-runtime-sdk.mjs";

const installationIdentity = "luastra-runtime-installation/phase5-alpha-2";
const sdkIdentity = "luastra-runtime-sdk/phase5-alpha-8";
const sourceBuildIdentity = "luastra-runtime-source-build/phase5-alpha-8";
const artifactMatrixIdentity = "luastra-artifact-matrix/phase5-alpha-8";
const archiveSetIdentity = "luastra-runtime-archives/phase5-alpha-3";
const installationAdmissionPath = resolve(dirname(fileURLToPath(import.meta.url)), "runtime-installation-admission.v1.json");

function fail(message) { throw new Error(message); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}
function inside(root, path) {
  const local = relative(root, path);
  return local !== ".." && !local.startsWith(`..${sep}`) && !isAbsolute(local);
}
function parseArguments(values) {
  const result = { archiveSet: null, output: null };
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === "--archive-set") result.archiveSet = values[++index] ?? fail("missing value for --archive-set");
    else if (values[index] === "--output") result.output = values[++index] ?? fail("missing value for --output");
    else fail("usage: install-runtime-sdk.mjs --archive-set <directory> --output <new-directory>");
  }
  if (!result.archiveSet || !result.output) fail("usage: install-runtime-sdk.mjs --archive-set <directory> --output <new-directory>");
  return result;
}
function validateHost(host) {
  if (!exactKeys(host, ["platform", "architecture"]) || typeof host.platform !== "string" || typeof host.architecture !== "string" ||
      !/^[a-z0-9]+$/.test(host.platform) || !/^[a-z0-9]+$/.test(host.architecture)) fail("invalid runtime installation host");
  return Object.freeze({ platform: host.platform, architecture: host.architecture });
}
function expectedPaths(targetId) {
  const extension = targetId === "win32-x64" ? ".exe" : "";
  return [
    `bin/luastra_analyze${extension}`,
    `bin/luastra_compile${extension}`,
    "runtime-install.v1.json",
    "runtime-package.v1.json",
    "runtime/luastra-vm.js",
    "runtime/luastra-vm.wasm",
  ].sort();
}
async function inventory(root, directory = root) {
  const files = [];
  const directories = [];
  for (const name of (await readdir(directory)).sort()) {
    const path = resolve(directory, name);
    const local = relative(root, path).split(sep).join("/");
    const info = await lstat(path);
    if (info.isSymbolicLink()) fail(`runtime installation contains a symlink: ${local}`);
    if (info.isDirectory()) {
      directories.push(local);
      const nested = await inventory(root, path);
      directories.push(...nested.directories);
      files.push(...nested.files);
    } else if (info.isFile()) files.push(Object.freeze({ path: local, info }));
    else fail(`runtime installation contains an unsupported entry: ${local}`);
  }
  return { files, directories };
}
async function loadInstallationAdmission() {
  const admission = JSON.parse(await readFile(installationAdmissionPath, "utf8"));
  if (!exactKeys(admission, ["schemaVersion", "identity", "installationIdentity", "sdkIdentity", "archiveSetIdentity", "targets"]) ||
      admission.schemaVersion !== 1 || admission.identity !== "luastra-runtime-installation-admission/phase5-alpha-2" ||
      admission.installationIdentity !== installationIdentity || admission.sdkIdentity !== sdkIdentity || admission.archiveSetIdentity !== archiveSetIdentity ||
      !Array.isArray(admission.targets) || admission.targets.length !== 4) fail("invalid runtime installation admission contract");
  const expectedTargetIds = ["darwin-x64", "darwin-arm64", "linux-x64", "win32-x64"];
  for (let index = 0; index < expectedTargetIds.length; index += 1) {
    const target = admission.targets[index];
    if (!exactKeys(target, ["id", "contentSha256"]) || target.id !== expectedTargetIds[index] || !/^[0-9a-f]{64}$/.test(target.contentSha256)) {
      fail(`invalid runtime installation admission target: ${expectedTargetIds[index]}`);
    }
  }
  return admission;
}

function createInstallationReceipt(selected) {
  const files = selected.files.map((file) => ({
    path: file.path,
    mode: file.mode,
    bytes: file.bytes.byteLength,
    sha256: sha256(file.bytes),
  })).sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  const base = {
    schemaVersion: 1,
    identity: installationIdentity,
    sdkIdentity,
    sourceBuildIdentity,
    artifactMatrixIdentity,
    archiveSet: selected.archiveSet,
    target: selected.target,
    archive: { filename: selected.record.filename, bytes: selected.record.bytes, sha256: selected.record.sha256 },
    packageContentSha256: selected.record.packageContentSha256,
    files,
  };
  return Object.freeze({ ...base, contentSha256: sha256(Buffer.from(canonicalJson(base))) });
}

export async function proposeRuntimeInstallationAdmission(archiveSet) {
  const archiveRoot = await realpath(resolve(archiveSet ?? fail("runtime archive set is required")));
  const targets = [];
  for (const id of ["darwin-x64", "darwin-arm64", "linux-x64", "win32-x64"]) {
    const selected = await readVerifiedRuntimeArchivePackage(archiveRoot, id);
    targets.push({ id, contentSha256: createInstallationReceipt(selected).contentSha256 });
  }
  return Object.freeze({
    schemaVersion: 1,
    identity: "luastra-runtime-installation-admission/phase5-alpha-2",
    installationIdentity,
    sdkIdentity,
    archiveSetIdentity,
    targets: Object.freeze(targets),
  });
}

export async function verifyInstalledRuntimeSdk(installationRoot, expectedHost = { platform: process.platform, architecture: process.arch }) {
  const host = validateHost(expectedHost);
  const root = await realpath(resolve(installationRoot));
  const tree = await inventory(root);
  if (tree.directories.sort().join("\n") !== ["bin", "runtime"].join("\n") ||
      tree.files.map((entry) => entry.path).sort().join("\n") !== expectedPaths(`${host.platform}-${host.architecture}`).join("\n")) fail("runtime installation layout mismatch");
  const receiptBytes = await readFile(resolve(root, "runtime-install.v1.json"));
  const receipt = JSON.parse(receiptBytes);
  if (!exactKeys(receipt, ["schemaVersion", "identity", "sdkIdentity", "sourceBuildIdentity", "artifactMatrixIdentity", "archiveSet", "target", "archive", "packageContentSha256", "files", "contentSha256"]) ||
      receipt.schemaVersion !== 1 || receipt.identity !== installationIdentity || receipt.sdkIdentity !== sdkIdentity ||
      receipt.sourceBuildIdentity !== sourceBuildIdentity || receipt.artifactMatrixIdentity !== artifactMatrixIdentity ||
      !exactKeys(receipt.archiveSet, ["identity", "contentSha256"]) || receipt.archiveSet.identity !== archiveSetIdentity ||
      !/^[0-9a-f]{64}$/.test(receipt.archiveSet.contentSha256) || !exactKeys(receipt.target, ["id", "platform", "architecture"]) ||
      receipt.target.id !== `${host.platform}-${host.architecture}` || receipt.target.platform !== host.platform || receipt.target.architecture !== host.architecture ||
      !exactKeys(receipt.archive, ["filename", "bytes", "sha256"]) || !Number.isSafeInteger(receipt.archive.bytes) || receipt.archive.bytes < 1 ||
      !/^[0-9a-f]{64}$/.test(receipt.archive.sha256) || !/^[0-9a-f]{64}$/.test(receipt.packageContentSha256) || !Array.isArray(receipt.files)) fail("invalid runtime installation receipt");
  if (!receiptBytes.equals(Buffer.from(canonicalJson(receipt)))) fail("runtime installation receipt is not canonical");
  const receiptEntry = tree.files.find((candidate) => candidate.path === "runtime-install.v1.json");
  if (!receiptEntry || (process.platform !== "win32" && (receiptEntry.info.mode & 0o777) !== 0o644)) fail("runtime installation receipt mode mismatch");
  const base = { ...receipt };
  delete base.contentSha256;
  if (sha256(Buffer.from(canonicalJson(base))) !== receipt.contentSha256) fail("runtime installation content identity mismatch");
  const installationAdmission = await loadInstallationAdmission();
  const admittedInstallation = installationAdmission.targets.find((target) => target.id === receipt.target.id);
  if (!admittedInstallation || admittedInstallation.contentSha256 !== receipt.contentSha256) fail("runtime installation receipt is not admitted");
  const admission = await loadRuntimeArchiveAdmission();
  const admittedArchive = admission.targets.find((record) => record.id === receipt.target.id);
  if (!admittedArchive || admittedArchive.filename !== receipt.archive.filename || admittedArchive.bytes !== receipt.archive.bytes ||
      admittedArchive.sha256 !== receipt.archive.sha256 || admittedArchive.packageContentSha256 !== receipt.packageContentSha256 ||
      admission.archiveSetIdentity !== receipt.archiveSet.identity || admission.contentSha256 !== receipt.archiveSet.contentSha256) fail("runtime installation is not archive-admitted");
  const expectedLedgerPaths = expectedPaths(receipt.target.id).filter((path) => path !== "runtime-install.v1.json");
  if (receipt.files.length !== expectedLedgerPaths.length) fail("runtime installation file ledger mismatch");
  for (let index = 0; index < expectedLedgerPaths.length; index += 1) {
    const record = receipt.files[index];
    const expectedPath = expectedLedgerPaths[index];
    if (!exactKeys(record, ["path", "mode", "bytes", "sha256"]) || record.path !== expectedPath ||
        !Number.isSafeInteger(record.mode) || !new Set([0o644, 0o755]).has(record.mode) ||
        !Number.isSafeInteger(record.bytes) || record.bytes < 1 || !/^[0-9a-f]{64}$/.test(record.sha256)) fail(`invalid runtime installation file record: ${expectedPath}`);
    const entry = tree.files.find((candidate) => candidate.path === expectedPath);
    const bytes = await readFile(resolve(root, expectedPath));
    if (!entry || entry.info.size !== record.bytes || sha256(bytes) !== record.sha256) fail(`runtime installation file mismatch: ${expectedPath}`);
    if (process.platform !== "win32" && (entry.info.mode & 0o777) !== record.mode) fail(`runtime installation mode mismatch: ${expectedPath}`);
  }
  const runtimePackage = await verifyRuntimePackage(root);
  if (runtimePackage.manifest.contentSha256 !== receipt.packageContentSha256 || runtimePackage.manifest.sdkIdentity !== receipt.sdkIdentity ||
      runtimePackage.manifest.sourceBuildIdentity !== receipt.sourceBuildIdentity || runtimePackage.manifest.artifactMatrixIdentity !== receipt.artifactMatrixIdentity) fail("runtime installation package identity mismatch");
  return Object.freeze({
    identity: receipt.sdkIdentity,
    sourceBuildIdentity: receipt.sourceBuildIdentity,
    artifactMatrixIdentity: receipt.artifactMatrixIdentity,
    manifestPath: resolve(root, "runtime-install.v1.json"),
    targetId: receipt.target.id,
    host: Object.freeze({ platform: receipt.target.platform, architecture: receipt.target.architecture }),
    artifacts: runtimePackage.artifacts,
    origin: "installation",
    installationIdentity: receipt.identity,
    installationRoot: root,
    archiveSetIdentity: receipt.archiveSet.identity,
  });
}

export async function installRuntimeSdk({ archiveSet, output, expectedHost = { platform: process.platform, architecture: process.arch } } = {}) {
  const host = validateHost(expectedHost);
  const targetId = `${host.platform}-${host.architecture}`;
  const archiveRoot = await realpath(resolve(archiveSet ?? fail("runtime archive set is required")));
  const requested = resolve(output ?? fail("runtime installation output is required"));
  const requestedParent = dirname(requested);
  if (!(await stat(requestedParent).catch(() => null))?.isDirectory()) fail(`runtime installation parent does not exist: ${requestedParent}`);
  const parent = await realpath(requestedParent);
  const destination = resolve(parent, basename(requested));
  if (await lstat(destination).catch(() => null)) fail(`runtime installation output already exists: ${destination}`);
  if (inside(archiveRoot, destination)) fail("runtime installation output must be outside the archive set");
  const temporary = await mkdtemp(resolve(parent, `.${basename(destination)}.partial-`));
  let moved = false;
  try {
    const selected = await readVerifiedRuntimeArchivePackage(archiveRoot, targetId);
    for (const file of selected.files) {
      const path = resolve(temporary, file.path);
      if (!inside(temporary, path)) fail(`runtime installation file escapes root: ${file.path}`);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, file.bytes, { mode: file.mode });
      await chmod(path, file.mode);
    }
    const receipt = createInstallationReceipt(selected);
    await writeFile(resolve(temporary, "runtime-install.v1.json"), canonicalJson(receipt), { mode: 0o644 });
    const verified = await verifyInstalledRuntimeSdk(temporary, host);
    await rename(temporary, destination);
    moved = true;
    return Object.freeze({
      result: "PASS",
      output: destination,
      identity: verified.installationIdentity,
      sdkIdentity: verified.identity,
      targetId: verified.targetId,
      archiveSetIdentity: verified.archiveSetIdentity,
      contentSha256: receipt.contentSha256,
    });
  } finally {
    if (!moved) await rm(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  process.stdout.write(canonicalJson(await installRuntimeSdk(parseArguments(process.argv.slice(2)))));
}
