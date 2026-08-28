import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalJson } from "../../assets/package-assets.mjs";
import { verifyRuntimeSdk } from "../resolve-runtime-sdk.mjs";
import { buildRuntimePackage, verifyRuntimePackage } from "./package-runtime-sdk.mjs";

const archiveSetIdentity = "luastra-runtime-archives/phase5-alpha-3";
const packagingRoot = dirname(fileURLToPath(import.meta.url));
const admissionPath = resolve(packagingRoot, "runtime-archive-admission.v1.json");
const sdkIdentity = "luastra-runtime-sdk/phase5-alpha-8";
const sourceBuildIdentity = "luastra-runtime-source-build/phase5-alpha-8";
const artifactMatrixIdentity = "luastra-artifact-matrix/phase5-alpha-8";
const targets = Object.freeze([
  Object.freeze({ id: "darwin-x64", platform: "darwin", architecture: "x64" }),
  Object.freeze({ id: "darwin-arm64", platform: "darwin", architecture: "arm64" }),
  Object.freeze({ id: "linux-x64", platform: "linux", architecture: "x64" }),
  Object.freeze({ id: "win32-x64", platform: "win32", architecture: "x64" }),
]);
const crc32Table = new Uint32Array(256);
for (let index = 0; index < crc32Table.length; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  crc32Table[index] = value >>> 0;
}
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
  let output = null;
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === "--output") output = values[++index] ?? fail("missing value for --output");
    else fail("usage: build-runtime-archives.mjs --output <new-directory>");
  }
  if (!output) fail("usage: build-runtime-archives.mjs --output <new-directory>");
  return { output };
}
function archiveRoot(targetId) { return `luastra-runtime-sdk-phase5-alpha-8-${targetId}`; }
function archiveFilename(targetId) { return `${archiveRoot(targetId)}.tar.gz`; }
function expectedPackagePaths(targetId) {
  const extension = targetId === "win32-x64" ? ".exe" : "";
  return [
    `bin/luastra_analyze${extension}`,
    `bin/luastra_compile${extension}`,
    "runtime/luastra-vm.js",
    "runtime/luastra-vm.wasm",
    "runtime-package.v1.json",
  ].sort();
}
function canonicalMode(path) { return path.startsWith("bin/") ? 0o755 : 0o644; }
function writeString(buffer, offset, length, value) {
  const bytes = Buffer.from(value, "utf8");
  if (bytes.byteLength > length) fail(`tar field is too long: ${value}`);
  bytes.copy(buffer, offset);
}
function writeOctal(buffer, offset, length, value) {
  if (!Number.isSafeInteger(value) || value < 0) fail(`invalid tar integer: ${value}`);
  const encoded = value.toString(8).padStart(length - 1, "0");
  if (encoded.length > length - 1) fail(`tar integer does not fit: ${value}`);
  writeString(buffer, offset, length, `${encoded}\0`);
}
function tarHeader(entry) {
  const header = Buffer.alloc(512);
  let name = entry.path;
  let prefix = "";
  if (Buffer.byteLength(name) > 100) {
    const candidates = [...name.matchAll(/\//g)].map((match) => match.index);
    const split = candidates.reverse().find((index) =>
      Buffer.byteLength(name.slice(0, index)) <= 155 && Buffer.byteLength(name.slice(index + 1)) <= 100);
    if (split === undefined) fail(`tar path is too long: ${entry.path}`);
    prefix = name.slice(0, split);
    name = name.slice(split + 1);
  }
  writeString(header, 0, 100, name);
  writeOctal(header, 100, 8, entry.mode);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, entry.bytes.byteLength);
  writeOctal(header, 136, 12, 0);
  header.fill(0x20, 148, 156);
  header[156] = 0x30;
  writeString(header, 257, 6, "ustar\0");
  writeString(header, 263, 2, "00");
  writeOctal(header, 329, 8, 0);
  writeOctal(header, 337, 8, 0);
  writeString(header, 345, 155, prefix);
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  const encoded = checksum.toString(8).padStart(6, "0");
  writeString(header, 148, 8, `${encoded}\0 `);
  return header;
}
export function buildCanonicalTar(entries) {
  const chunks = [];
  for (const entry of [...entries].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)) {
    chunks.push(tarHeader(entry), entry.bytes);
    const padding = (512 - (entry.bytes.byteLength % 512)) % 512;
    if (padding) chunks.push(Buffer.alloc(padding));
  }
  chunks.push(Buffer.alloc(1024));
  return Buffer.concat(chunks);
}
function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = crc32Table[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
export function buildCanonicalGzip(tar) {
  const chunks = [Buffer.from([0x1f, 0x8b, 8, 0, 0, 0, 0, 0, 0, 255])];
  for (let offset = 0; offset < tar.byteLength; offset += 0xffff) {
    const length = Math.min(0xffff, tar.byteLength - offset);
    const header = Buffer.alloc(5);
    header[0] = offset + length === tar.byteLength ? 1 : 0;
    header.writeUInt16LE(length, 1);
    header.writeUInt16LE(length ^ 0xffff, 3);
    chunks.push(header, tar.subarray(offset, offset + length));
  }
  const trailer = Buffer.alloc(8);
  trailer.writeUInt32LE(crc32(tar), 0);
  trailer.writeUInt32LE(tar.byteLength >>> 0, 4);
  chunks.push(trailer);
  return Buffer.concat(chunks);
}
function readString(buffer, offset, length) {
  const end = buffer.indexOf(0, offset);
  return buffer.subarray(offset, end >= offset && end < offset + length ? end : offset + length).toString("utf8");
}
function readOctal(buffer, offset, length, field) {
  const value = buffer.subarray(offset, offset + length).toString("ascii").replace(/[\0 ]+$/g, "");
  if (!/^[0-7]+$/.test(value)) fail(`invalid tar ${field}`);
  return Number.parseInt(value, 8);
}
export function parseCanonicalTar(tar) {
  const entries = [];
  const names = new Set();
  let offset = 0;
  let zeroBlocks = 0;
  while (offset + 512 <= tar.byteLength) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      zeroBlocks += 1;
      offset += 512;
      break;
    }
    const expectedChecksum = readOctal(header, 148, 8, "checksum");
    const checksumHeader = Buffer.from(header);
    checksumHeader.fill(0x20, 148, 156);
    if (checksumHeader.reduce((sum, byte) => sum + byte, 0) !== expectedChecksum) fail("runtime archive tar checksum mismatch");
    if (readString(header, 257, 6) !== "ustar" || readString(header, 263, 2) !== "00") fail("runtime archive is not canonical ustar");
    if (header[156] !== 0x30) fail("runtime archive contains a non-regular entry");
    const name = readString(header, 0, 100);
    const prefix = readString(header, 345, 155);
    const path = prefix ? `${prefix}/${name}` : name;
    if (!path || isAbsolute(path) || path.includes("\\") || path.split("/").some((part) => part === "" || part === "." || part === "..") || names.has(path)) fail(`unsafe or duplicate runtime archive path: ${path}`);
    const mode = readOctal(header, 100, 8, "mode");
    const uid = readOctal(header, 108, 8, "uid");
    const gid = readOctal(header, 116, 8, "gid");
    const size = readOctal(header, 124, 12, "size");
    const mtime = readOctal(header, 136, 12, "mtime");
    if (uid !== 0 || gid !== 0 || mtime !== 0) fail("runtime archive tar metadata is not canonical");
    offset += 512;
    if (offset + size > tar.byteLength) fail("runtime archive tar entry is truncated");
    entries.push(Object.freeze({ path, mode, bytes: Buffer.from(tar.subarray(offset, offset + size)) }));
    names.add(path);
    offset += size + ((512 - (size % 512)) % 512);
  }
  while (offset + 512 <= tar.byteLength && tar.subarray(offset, offset + 512).every((byte) => byte === 0)) {
    zeroBlocks += 1;
    offset += 512;
  }
  if (zeroBlocks < 2 || offset !== tar.byteLength) fail("runtime archive has invalid end blocks or trailing bytes");
  if (entries.length === 0) fail("runtime archive is empty");
  return entries;
}
async function packageEntries(packageRoot, targetId) {
  const entries = [];
  for (const path of expectedPackagePaths(targetId)) {
    const absolute = resolve(packageRoot, path);
    const info = await lstat(absolute);
    if (!info.isFile() || info.isSymbolicLink()) fail(`runtime package contains an invalid archive input: ${path}`);
    entries.push(Object.freeze({ path: `${archiveRoot(targetId)}/${path}`, mode: canonicalMode(path), bytes: await readFile(absolute) }));
  }
  return entries;
}
async function verifyArchivePayload(archiveBytes, target, packageContentSha256) {
  let tar;
  try { tar = gunzipSync(archiveBytes); } catch { fail(`invalid gzip runtime archive: ${target.id}`); }
  const entries = parseCanonicalTar(tar);
  if (!buildCanonicalTar(entries).equals(tar) || !buildCanonicalGzip(tar).equals(archiveBytes)) fail(`runtime archive is not byte-canonical: ${target.id}`);
  const root = archiveRoot(target.id);
  const expected = expectedPackagePaths(target.id).map((path) => `${root}/${path}`);
  const actual = entries.map((entry) => entry.path);
  if (actual.join("\n") !== expected.join("\n")) fail(`runtime archive layout mismatch: ${target.id}`);
  for (const entry of entries) {
    const local = entry.path.slice(root.length + 1);
    if (entry.mode !== canonicalMode(local)) fail(`runtime archive mode mismatch: ${entry.path}`);
  }
  const extracted = await mkdtemp(resolve(tmpdir(), "luastra-archive-verify-"));
  try {
    for (const entry of entries) {
      const destination = resolve(extracted, entry.path);
      if (!inside(extracted, destination)) fail(`runtime archive extraction escapes root: ${entry.path}`);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, entry.bytes, { mode: entry.mode });
      await chmod(destination, entry.mode);
    }
    const verified = await verifyRuntimePackage(resolve(extracted, root));
    if (verified.manifest.contentSha256 !== packageContentSha256) fail(`runtime archive package identity mismatch: ${target.id}`);
    const sdk = await verifyRuntimeSdk(undefined, { platform: target.platform, architecture: target.architecture });
    for (const role of ["analyzer", "compiler", "runtimeJavaScript", "runtimeWasm"]) {
      const source = await readFile(sdk.artifacts[role]);
      const archived = await readFile(verified.artifacts[role]);
      if (!source.equals(archived)) fail(`runtime archive artifact differs from admitted SDK: ${target.id}/${role}`);
    }
  } finally {
    await rm(extracted, { recursive: true, force: true });
  }
  return entries;
}
function checksumText(records, manifestBytes) {
  return [...records.map((record) => `${record.sha256}  ${record.filename}`), `${sha256(manifestBytes)}  runtime-archives.v1.json`].join("\n") + "\n";
}
async function verifyAdmission(manifest, manifestBytes, checksumsBytes) {
  const admission = await loadRuntimeArchiveAdmission();
  if (admission.contentSha256 !== manifest.contentSha256 || admission.manifestSha256 !== sha256(manifestBytes) ||
      admission.checksumsSha256 !== sha256(checksumsBytes) || canonicalJson(admission.targets) !== canonicalJson(manifest.targets)) {
    const received = { contentSha256: manifest.contentSha256, manifestSha256: sha256(manifestBytes), checksumsSha256: sha256(checksumsBytes), targets: manifest.targets };
    fail(`runtime archive set differs from admitted release contract: ${JSON.stringify(received)}`);
  }
  return admission;
}

export async function loadRuntimeArchiveAdmission() {
  const admission = JSON.parse(await readFile(admissionPath, "utf8"));
  if (!exactKeys(admission, ["schemaVersion", "identity", "archiveSetIdentity", "contentSha256", "manifestSha256", "checksumsSha256", "targets"]) ||
      admission.schemaVersion !== 1 || admission.identity !== "luastra-runtime-archive-admission/phase5-alpha-3" ||
      admission.archiveSetIdentity !== archiveSetIdentity || !/^[0-9a-f]{64}$/.test(admission.contentSha256) ||
      !/^[0-9a-f]{64}$/.test(admission.manifestSha256) || !/^[0-9a-f]{64}$/.test(admission.checksumsSha256) ||
      !Array.isArray(admission.targets) || admission.targets.length !== targets.length) fail("invalid runtime archive admission contract");
  for (let index = 0; index < targets.length; index += 1) {
    const expected = targets[index];
    const record = admission.targets[index];
    if (!exactKeys(record, ["id", "platform", "architecture", "filename", "bytes", "sha256", "packageContentSha256"]) ||
        record.id !== expected.id || record.platform !== expected.platform || record.architecture !== expected.architecture ||
        record.filename !== archiveFilename(expected.id) || !Number.isSafeInteger(record.bytes) || record.bytes < 1 ||
        !/^[0-9a-f]{64}$/.test(record.sha256) || !/^[0-9a-f]{64}$/.test(record.packageContentSha256)) fail(`invalid runtime archive admission target: ${expected.id}`);
  }
  return Object.freeze({ ...admission, targets: Object.freeze(admission.targets.map((record) => Object.freeze(record))) });
}

export async function verifyRuntimeArchiveSet(archiveRootPath) {
  const root = await realpath(resolve(archiveRootPath));
  const expectedNames = new Set(["runtime-archives.v1.json", "SHA256SUMS", ...targets.map(({ id }) => archiveFilename(id))]);
  const actualItems = await readdir(root, { withFileTypes: true });
  if (actualItems.some((item) => !item.isFile() || item.isSymbolicLink()) ||
      actualItems.map((item) => item.name).sort().join("\n") !== [...expectedNames].sort().join("\n")) fail("runtime archive-set directory contains unexpected entries");
  const manifestBytes = await readFile(resolve(root, "runtime-archives.v1.json"));
  const manifest = JSON.parse(manifestBytes);
  if (!exactKeys(manifest, ["schemaVersion", "identity", "sdkIdentity", "sourceBuildIdentity", "artifactMatrixIdentity", "format", "targets", "contentSha256"]) ||
      manifest.schemaVersion !== 1 || manifest.identity !== archiveSetIdentity || manifest.sdkIdentity !== sdkIdentity ||
      manifest.sourceBuildIdentity !== sourceBuildIdentity || manifest.artifactMatrixIdentity !== artifactMatrixIdentity ||
      manifest.format !== "ustar+gzip/stored-deflate-v1") fail("invalid runtime archive-set manifest");
  if (!Array.isArray(manifest.targets) || manifest.targets.length !== targets.length) fail("invalid runtime archive target count");
  const base = { ...manifest };
  delete base.contentSha256;
  if (sha256(Buffer.from(canonicalJson(base))) !== manifest.contentSha256) fail("runtime archive-set content identity mismatch");
  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index];
    const record = manifest.targets[index];
    if (!exactKeys(record, ["id", "platform", "architecture", "filename", "bytes", "sha256", "packageContentSha256"]) ||
        record.id !== target.id || record.platform !== target.platform || record.architecture !== target.architecture ||
        record.filename !== archiveFilename(target.id) || !Number.isSafeInteger(record.bytes) || record.bytes < 1 ||
        !/^[0-9a-f]{64}$/.test(record.sha256) || !/^[0-9a-f]{64}$/.test(record.packageContentSha256)) fail(`invalid runtime archive record: ${target.id}`);
    const archiveBytes = await readFile(resolve(root, record.filename));
    if (archiveBytes.byteLength !== record.bytes || sha256(archiveBytes) !== record.sha256) fail(`runtime archive checksum mismatch: ${target.id}`);
    await verifyArchivePayload(archiveBytes, target, record.packageContentSha256);
  }
  const expectedChecksums = checksumText(manifest.targets, manifestBytes);
  const checksumsBytes = await readFile(resolve(root, "SHA256SUMS"));
  if (checksumsBytes.toString("utf8") !== expectedChecksums) fail("runtime archive external checksum file mismatch");
  const admission = await verifyAdmission(manifest, manifestBytes, checksumsBytes);
  return Object.freeze({ root, manifest: Object.freeze(manifest), admission: Object.freeze(admission), manifestSha256: sha256(manifestBytes), checksumsSha256: sha256(checksumsBytes) });
}

export async function readVerifiedRuntimeArchivePackage(archiveRootPath, targetId) {
  const target = targets.find((candidate) => candidate.id === targetId) ?? fail(`unsupported runtime archive target: ${targetId}`);
  const archiveSet = await verifyRuntimeArchiveSet(archiveRootPath);
  const record = archiveSet.manifest.targets.find((candidate) => candidate.id === target.id);
  if (!record) fail(`runtime archive target is missing: ${target.id}`);
  const archiveBytes = await readFile(resolve(archiveSet.root, record.filename));
  const entries = await verifyArchivePayload(archiveBytes, target, record.packageContentSha256);
  const prefix = `${archiveRoot(target.id)}/`;
  const files = entries.map((entry) => Object.freeze({
    path: entry.path.slice(prefix.length),
    mode: entry.mode,
    bytes: Buffer.from(entry.bytes),
  }));
  return Object.freeze({
    archiveSet: Object.freeze({ identity: archiveSet.manifest.identity, contentSha256: archiveSet.manifest.contentSha256 }),
    target: Object.freeze({ id: target.id, platform: target.platform, architecture: target.architecture }),
    record: Object.freeze(record),
    files: Object.freeze(files),
  });
}

export async function buildRuntimeArchives({ output } = {}) {
  const requested = resolve(output ?? fail("runtime archive output is required"));
  const requestedParent = dirname(requested);
  if (!(await stat(requestedParent).catch(() => null))?.isDirectory()) fail(`runtime archive parent does not exist: ${requestedParent}`);
  const parent = await realpath(requestedParent);
  const destination = resolve(parent, basename(requested));
  if (await stat(destination).catch(() => null)) fail(`runtime archive output already exists: ${destination}`);
  const temporary = await mkdtemp(resolve(parent, `.${basename(destination)}.partial-`));
  const workspace = await mkdtemp(resolve(parent, ".luastra-runtime-archive-work-"));
  let moved = false;
  try {
    const records = [];
    for (const target of targets) {
      const packageRoot = resolve(workspace, target.id);
      const built = await buildRuntimePackage({ targetId: target.id, output: packageRoot });
      await verifyRuntimePackage(packageRoot);
      const archiveBytes = buildCanonicalGzip(buildCanonicalTar(await packageEntries(packageRoot, target.id)));
      const filename = archiveFilename(target.id);
      await writeFile(resolve(temporary, filename), archiveBytes, { mode: 0o644 });
      records.push({ id: target.id, platform: target.platform, architecture: target.architecture, filename, bytes: archiveBytes.byteLength, sha256: sha256(archiveBytes), packageContentSha256: built.contentSha256 });
    }
    const base = { schemaVersion: 1, identity: archiveSetIdentity, sdkIdentity, sourceBuildIdentity, artifactMatrixIdentity, format: "ustar+gzip/stored-deflate-v1", targets: records };
    const manifest = { ...base, contentSha256: sha256(Buffer.from(canonicalJson(base))) };
    const manifestBytes = Buffer.from(canonicalJson(manifest));
    await writeFile(resolve(temporary, "runtime-archives.v1.json"), manifestBytes, { mode: 0o644 });
    await writeFile(resolve(temporary, "SHA256SUMS"), checksumText(records, manifestBytes), { mode: 0o644 });
    const verified = await verifyRuntimeArchiveSet(temporary);
    await rename(temporary, destination);
    moved = true;
    return Object.freeze({ output: destination, identity: manifest.identity, contentSha256: manifest.contentSha256, manifestSha256: verified.manifestSha256, checksumsSha256: verified.checksumsSha256, targets: Object.freeze(records) });
  } finally {
    await rm(workspace, { recursive: true, force: true });
    if (!moved) await rm(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  process.stdout.write(canonicalJson(await buildRuntimeArchives(parseArguments(process.argv.slice(2)))));
}
