import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { chmod, cp, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalJson } from "../assets/package-assets.mjs";
import { buildCanonicalGzip, buildCanonicalTar, parseCanonicalTar } from "../platform/packaging/build-runtime-archives.mjs";
import { verifyReleaseManifestBytes, verifySdkArchiveBytes } from "./luastra-install.mjs";

const version = "0.1.0-alpha";
const releaseIdentity = `luastra-sdk-release/${version}`;
const sdkIdentity = "luastra-sdk-installation/v1";
const releaseRoot = dirname(fileURLToPath(import.meta.url));
const prototypeRoot = resolve(releaseRoot, "..");
const repositoryRoot = existsSync(resolve(prototypeRoot, "LICENSE")) ? prototypeRoot : resolve(prototypeRoot, "../..");
const admissionPath = resolve(releaseRoot, "sdk-release-admission.v1.json");
const productDirectories = Object.freeze(["assets", "backend", "cli", "host", "platform", "project", "sdk", "templates"]);
const legalFiles = Object.freeze(["LICENSE", "NOTICE", "THIRD_PARTY_NOTICES.md", "TRADEMARKS.md"]);
const hosts = Object.freeze([
  Object.freeze({ id: "darwin-arm64", platform: "darwin", architecture: "arm64" }),
  Object.freeze({ id: "darwin-x64", platform: "darwin", architecture: "x64" }),
  Object.freeze({ id: "linux-x64", platform: "linux", architecture: "x64" }),
  Object.freeze({ id: "win32-x64", platform: "win32", architecture: "x64" }),
]);

function fail(message) { throw new Error(message); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function inside(root, path) {
  const local = relative(root, path);
  return local !== ".." && !local.startsWith(`..${sep}`) && !isAbsolute(local);
}
function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}
function canonicalMode(path) {
  if (path === "bin/luastra" || /^platform\/artifacts\/(?!vm-wasm\/)/.test(path)) return 0o755;
  return 0o644;
}
function archiveRoot(host) { return `luastra-sdk-${version}-${host.id}`; }
function archiveFilename(host) { return `${archiveRoot(host)}.tar.gz`; }
function asset(filename, bytes) { return Object.freeze({ filename, bytes: bytes.byteLength, sha256: sha256(bytes) }); }
async function sdkLicenseLedgerBytes() {
  const source = JSON.parse(await readFile(resolve(releaseRoot, "license-bundle.v1.json"), "utf8"));
  if (source.schemaVersion !== 1 || !Array.isArray(source.files) || source.files.length !== 7) fail("invalid source runtime license bundle");
  return Buffer.from(canonicalJson({ schemaVersion: 1, identity: `luastra-sdk-license-bundle/${version}`, version, files: source.files }));
}
function parseArguments(values) {
  if (values.length !== 2 || values[0] !== "--output" || !values[1]) fail("usage: build-sdk-release.mjs --output <new-directory>");
  return values[1];
}
async function inventory(root, directory = root, excluded = new Set()) {
  const files = [];
  for (const name of (await readdir(directory)).sort()) {
    if (name.startsWith("._") || name === ".DS_Store") fail(`SDK contains operating-system metadata: ${name}`);
    const path = resolve(directory, name);
    const local = relative(root, path).split(sep).join("/");
    if (excluded.has(local)) continue;
    if (!inside(root, path)) fail(`SDK path escapes root: ${local}`);
    const info = await lstat(path);
    if (info.isSymbolicLink()) fail(`SDK contains a symlink: ${local}`);
    if (info.isDirectory()) files.push(...await inventory(root, path, excluded));
    else if (info.isFile()) {
      const bytes = await readFile(path);
      files.push(Object.freeze({ path: local, mode: canonicalMode(local), bytes: bytes.byteLength, sha256: sha256(bytes), content: bytes }));
    } else fail(`SDK contains an unsupported entry: ${local}`);
  }
  return files.sort((left, right) => left.path.localeCompare(right.path));
}
function publicReadme(host) {
  return `# Luastra SDK ${version}\n\n` +
    `Target: ${host.id}. This is a checksum-verified public-source alpha candidate.\n\n` +
    "Requirements: Node.js 24 or newer. No npm install or repository checkout is required.\n\n" +
    "Run `luastra doctor` after installation, then use `luastra create <directory>`.\n";
}
async function scaffoldSdk(root, host) {
  await mkdir(resolve(root, "bin"), { recursive: true });
  const shell = "#!/bin/sh\nset -eu\nLUASTRA_HOME=$(CDPATH= cd -- \"$(dirname -- \"$0\")/..\" && pwd)\nexec node \"$LUASTRA_HOME/cli/luastra.mjs\" \"$@\"\n";
  const command = "@echo off\r\nnode \"%~dp0..\\cli\\luastra.mjs\" %*\r\n";
  await writeFile(resolve(root, "bin/luastra"), shell, { mode: 0o755 });
  await chmod(resolve(root, "bin/luastra"), 0o755);
  await writeFile(resolve(root, "bin/luastra.cmd"), command, { mode: 0o644 });
  await writeFile(resolve(root, "README.md"), publicReadme(host), { mode: 0o644 });
  await writeFile(resolve(root, "package.json"), `${JSON.stringify({
    name: "@luastra/sdk", version, private: false, license: "Apache-2.0", type: "module", engines: { node: ">=24" }, bin: { luastra: "./cli/luastra.mjs" },
  }, null, 2)}\n`, { mode: 0o644 });
  await writeFile(resolve(root, "platform/product-version.mjs"), `export const productVersion = "${version}";\n`, { mode: 0o644 });
}
async function copySdk(root, host) {
  for (const directory of productDirectories) await cp(resolve(prototypeRoot, directory), resolve(root, directory), { recursive: true, errorOnExist: true, force: false });
  for (const name of legalFiles) await cp(resolve(repositoryRoot, name), resolve(root, name), { errorOnExist: true, force: false });
  await cp(resolve(releaseRoot, "licenses"), resolve(root, "licenses"), { recursive: true, errorOnExist: true, force: false });
  await writeFile(resolve(root, "runtime-license-bundle.v1.json"), await sdkLicenseLedgerBytes(), { mode: 0o644 });
  await mkdir(resolve(root, "release"), { recursive: true });
  await cp(resolve(releaseRoot, "luastra-install.mjs"), resolve(root, "release/luastra-install.mjs"), { errorOnExist: true, force: false });
  for (const target of hosts) if (target.id !== host.id) await rm(resolve(root, "platform/artifacts", target.id), { recursive: true, force: true });
  await scaffoldSdk(root, host);
}
async function buildSdkArchive(workspace, host) {
  const root = resolve(workspace, host.id);
  await copySdk(root, host);
  const files = await inventory(root, root, new Set(["SDK_MANIFEST.json"]));
  const ledger = files.map(({ path, mode, bytes, sha256: digest }) => ({ path, mode, bytes, sha256: digest }));
  const base = { schemaVersion: 1, identity: sdkIdentity, version,
    target: { id: host.id, platform: host.platform, architecture: host.architecture }, node: ">=24", files: ledger };
  const sdkManifest = { ...base, contentSha256: sha256(Buffer.from(canonicalJson(base))) };
  const sdkManifestBytes = Buffer.from(canonicalJson(sdkManifest));
  const entries = [...files.map((file) => ({ path: `${archiveRoot(host)}/${file.path}`, mode: file.mode, bytes: file.content })),
    { path: `${archiveRoot(host)}/SDK_MANIFEST.json`, mode: 0o644, bytes: sdkManifestBytes }];
  const archiveBytes = buildCanonicalGzip(buildCanonicalTar(entries));
  return Object.freeze({ host, root: archiveRoot(host), filename: archiveFilename(host), archiveBytes, sdkManifest, sdkManifestBytes });
}
function generateSdkSbom() {
  const packages = [
    ["luastra-core", "Luastra SDK and CLI", version, "Apache-2.0"],
    ["luastra-templates", "Luastra starter templates", version, "0BSD"],
    ["luau", "Luau", "0.731+f8ca77acdcb50241e3da21af663f8ef97b4b5ce4", "MIT"],
    ["emscripten-runtime", "Emscripten generated runtime", "6.0.6", "(MIT OR NCSA)"],
  ].map(([id, name, versionInfo, license]) => ({ SPDXID: `SPDXRef-${id}`, name, versionInfo, downloadLocation: "NOASSERTION",
    filesAnalyzed: false, licenseConcluded: license, licenseDeclared: license, copyrightText: id.startsWith("luastra-") ? "Copyright 2026 Viacheslav Beliaev" : "NOASSERTION" }));
  return Buffer.from(canonicalJson({ spdxVersion: "SPDX-2.3", dataLicense: "CC0-1.0", SPDXID: "SPDXRef-DOCUMENT",
    name: `Luastra SDK ${version} release inventory`, documentNamespace: `https://luastra.dev/spdx/sdk/${version}`,
    creationInfo: { created: "2026-08-28T00:00:00Z", creators: ["Tool: Luastra SDK release builder v1"] },
    documentDescribes: packages.map((item) => item.SPDXID), packages }));
}
function releaseNotes() {
  return Buffer.from(`# Luastra ${version}\n\n` +
    "Public-source alpha release. This is pre-release software with bounded support and compatibility guarantees.\n\n" +
    "## Assets\n\n" +
    `Host archives use \`luastra-sdk-${version}-<host>.tar.gz\`. Download the release manifest and installer from the same GitHub Release, then run the installer.\n\n` +
    "Every asset is retained with `SHA256SUMS`; the manifest binds the host matrix, SDK content identities, SBOM, notices, license bundle, and installer.\n\n" +
    "## Retention\n\nPublished release assets are immutable. A correction receives a new version; existing bytes are never silently replaced.\n");
}
async function buildLicenseArchive() {
  const licensesRoot = resolve(releaseRoot, "licenses");
  const files = await inventory(licensesRoot, licensesRoot);
  const entries = files.map((file) => ({ path: `luastra-sdk-${version}-licenses/licenses/${file.path}`, mode: 0o644, bytes: file.content }));
  entries.push({ path: `luastra-sdk-${version}-licenses/runtime-license-bundle.v1.json`, mode: 0o644,
    bytes: await sdkLicenseLedgerBytes() });
  return buildCanonicalGzip(buildCanonicalTar(entries));
}
function checksumText(assets, manifestBytes) {
  return [...assets.map((item) => `${item.sha256}  ${item.filename}`), `${sha256(manifestBytes)}  luastra-release.v1.json`]
    .sort((left, right) => left.localeCompare(right)).join("\n") + "\n";
}
async function loadAdmission() {
  const bytes = await readFile(admissionPath);
  const admission = JSON.parse(bytes);
  if (!exactKeys(admission, ["schemaVersion", "identity", "version", "manifestSha256", "checksumsSha256", "contentSha256", "assets"]) ||
      admission.schemaVersion !== 1 || admission.identity !== "luastra-sdk-release-admission/v1" || admission.version !== version ||
      !Array.isArray(admission.assets)) fail("invalid SDK release admission contract");
  if (!bytes.equals(Buffer.from(canonicalJson(admission)))) fail("SDK release admission contract is not canonical");
  return admission;
}
function verifySbom(bytes) {
  const sbom = JSON.parse(bytes);
  if (sbom.spdxVersion !== "SPDX-2.3" || sbom.name !== `Luastra SDK ${version} release inventory` ||
      !Array.isArray(sbom.packages) || sbom.packages.length !== 4 || sbom.packages.some((item) => item.licenseDeclared === "NOASSERTION")) {
    fail("SDK release SBOM is incomplete");
  }
  if (!bytes.equals(Buffer.from(canonicalJson(sbom)))) fail("SDK release SBOM is not canonical");
}
function verifyLicenseArchive(bytes) {
  let tar;
  try { tar = gunzipSync(bytes); } catch { fail("invalid gzip SDK license bundle"); }
  const entries = parseCanonicalTar(tar);
  if (!buildCanonicalTar(entries).equals(tar) || !buildCanonicalGzip(tar).equals(bytes)) fail("SDK license bundle is not byte-canonical");
  const root = `luastra-sdk-${version}-licenses`;
  const manifestEntry = entries.find((entry) => entry.path === `${root}/runtime-license-bundle.v1.json`) ?? fail("SDK license ledger is missing");
  const ledger = JSON.parse(manifestEntry.bytes);
  if (ledger.identity !== `luastra-sdk-license-bundle/${version}` || ledger.version !== version || !Array.isArray(ledger.files) || ledger.files.length !== 7) {
    fail("invalid SDK license ledger");
  }
  const expected = [`${root}/runtime-license-bundle.v1.json`, ...ledger.files.map((item) => `${root}/${item.path}`)].sort();
  if (entries.map((entry) => entry.path).sort().join("\n") !== expected.join("\n")) fail("SDK license bundle layout mismatch");
  for (const item of ledger.files) {
    const entry = entries.find((candidate) => candidate.path === `${root}/${item.path}`);
    if (!entry || entry.bytes.byteLength !== item.bytes || sha256(entry.bytes) !== item.sha256) fail(`SDK license text mismatch: ${item.path}`);
  }
}

export async function verifySdkReleaseSet(releaseSet, { requireAdmission = true } = {}) {
  const root = await realpath(resolve(releaseSet));
  const manifestBytes = await readFile(resolve(root, "luastra-release.v1.json"));
  const manifest = verifyReleaseManifestBytes(manifestBytes);
  const expectedAssets = [...manifest.hosts.map((record) => record.archive), manifest.installer, ...Object.values(manifest.compliance), manifest.releaseNotes]
    .sort((left, right) => left.filename.localeCompare(right.filename));
  const names = (await readdir(root)).sort();
  const expectedNames = [...expectedAssets.map((item) => item.filename), "SHA256SUMS", "luastra-release.v1.json"].sort();
  if (names.join("\n") !== expectedNames.join("\n")) fail("SDK release set contains unexpected entries");
  for (const record of expectedAssets) {
    const bytes = await readFile(resolve(root, record.filename));
    if (bytes.byteLength !== record.bytes || sha256(bytes) !== record.sha256) fail(`SDK release asset mismatch: ${record.filename}`);
  }
  for (const host of manifest.hosts) verifySdkArchiveBytes(await readFile(resolve(root, host.archive.filename)), manifest, host);
  verifySbom(await readFile(resolve(root, manifest.compliance.sbom.filename)));
  verifyLicenseArchive(await readFile(resolve(root, manifest.compliance.licenseBundle.filename)));
  const notices = await readFile(resolve(root, manifest.compliance.notices.filename), "utf8");
  if (!notices.includes("Luau 0.731") || !notices.includes("Emscripten 6.0.6") || !notices.includes("Excluded development and host dependencies")) {
    fail("SDK third-party notices are incomplete");
  }
  const checksumsBytes = await readFile(resolve(root, "SHA256SUMS"));
  if (checksumsBytes.toString("utf8") !== checksumText(expectedAssets, manifestBytes)) fail("SDK release checksum file mismatch");
  const evidence = { schemaVersion: 1, identity: "luastra-sdk-release-admission/v1", version,
    manifestSha256: sha256(manifestBytes), checksumsSha256: sha256(checksumsBytes), contentSha256: manifest.contentSha256,
    assets: expectedAssets.map((item) => ({ filename: item.filename, bytes: item.bytes, sha256: item.sha256 })) };
  if (requireAdmission && canonicalJson(evidence) !== canonicalJson(await loadAdmission())) fail("SDK release set differs from admitted contract");
  return Object.freeze({ result: "PASS", root, manifest: Object.freeze(manifest), admission: Object.freeze(evidence) });
}

export async function buildSdkRelease({ output, requireAdmission = true } = {}) {
  const requested = resolve(output ?? fail("SDK release output is required"));
  const parentPath = dirname(requested);
  if (!(await stat(parentPath).catch(() => null))?.isDirectory()) fail(`SDK release parent does not exist: ${parentPath}`);
  const parent = await realpath(parentPath);
  const destination = resolve(parent, basename(requested));
  if (await lstat(destination).catch(() => null)) fail(`SDK release output already exists: ${destination}`);
  const temporary = await mkdtemp(resolve(parent, `.${basename(destination)}.partial-`));
  const workspace = await mkdtemp(resolve(parent, ".luastra-sdk-release-work-"));
  let moved = false;
  try {
    const builtHosts = [];
    for (const host of hosts) {
      const built = await buildSdkArchive(workspace, host);
      await writeFile(resolve(temporary, built.filename), built.archiveBytes, { mode: 0o644 });
      builtHosts.push({ id: host.id, platform: host.platform, architecture: host.architecture, root: built.root,
        archive: asset(built.filename, built.archiveBytes), sdkContentSha256: built.sdkManifest.contentSha256 });
    }
    const installerBytes = await readFile(resolve(releaseRoot, "luastra-install.mjs"));
    const sbomBytes = generateSdkSbom();
    const noticesBytes = await readFile(resolve(releaseRoot, "SDK_THIRD_PARTY_NOTICES.md"));
    const licenseBytes = await buildLicenseArchive();
    const notesBytes = releaseNotes();
    const installer = asset("luastra-install.mjs", installerBytes);
    const compliance = {
      sbom: asset(`luastra-sdk-${version}.spdx.json`, sbomBytes),
      notices: asset(`luastra-sdk-${version}-THIRD_PARTY_NOTICES.md`, noticesBytes),
      licenseBundle: asset(`luastra-sdk-${version}-licenses.tar.gz`, licenseBytes),
    };
    const releaseNotesAsset = asset(`luastra-${version}-RELEASE_NOTES.md`, notesBytes);
    const base = { schemaVersion: 1, identity: releaseIdentity, version, channel: "alpha", publication: "PUBLIC_SOURCE_ALPHA", node: ">=24",
      hosts: builtHosts, installer, compliance, releaseNotes: releaseNotesAsset };
    const manifest = { ...base, contentSha256: sha256(Buffer.from(canonicalJson(base))) };
    const manifestBytes = Buffer.from(canonicalJson(manifest));
    const assets = [...builtHosts.map((record) => record.archive), installer, ...Object.values(compliance), releaseNotesAsset]
      .sort((left, right) => left.filename.localeCompare(right.filename));
    for (const [record, bytes] of [[installer, installerBytes], [compliance.sbom, sbomBytes], [compliance.notices, noticesBytes],
      [compliance.licenseBundle, licenseBytes], [releaseNotesAsset, notesBytes]]) await writeFile(resolve(temporary, record.filename), bytes, { mode: 0o644 });
    await writeFile(resolve(temporary, "luastra-release.v1.json"), manifestBytes, { mode: 0o644 });
    await writeFile(resolve(temporary, "SHA256SUMS"), checksumText(assets, manifestBytes), { mode: 0o644 });
    const verified = await verifySdkReleaseSet(temporary, { requireAdmission });
    await rename(temporary, destination);
    moved = true;
    return Object.freeze({ result: "PASS", output: destination, version, hosts: builtHosts.length,
      contentSha256: manifest.contentSha256, manifestSha256: verified.admission.manifestSha256,
      checksumsSha256: verified.admission.checksumsSha256, admission: verified.admission });
  } finally {
    await rm(workspace, { recursive: true, force: true });
    if (!moved) await rm(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.stdout.write(canonicalJson(await buildSdkRelease({ output: parseArguments(process.argv.slice(2)) })));
}
