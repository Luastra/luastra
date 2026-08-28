import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { canonicalJson } from "../assets/package-assets.mjs";

const manifestName = "CLEAN_EXPORT_MANIFEST.json";
const forbiddenPathSegments = new Set([
  ".git", "owner-dogfood", "private-candidates", "Project Planning",
  "Phase 1 - Project Research Pack", "Phase 2 - Focused Competitor Analysis",
  "Phase 2.5 - Legal and Architecture Clearance", "Phase 3 - Technical Feasibility",
  "Phase 4 - Build vs Buy Validation", "Phase 5 - Platform MVP and Reference Applications",
]);
const forbiddenContent = [
  /Phase 5 - Platform MVP and Reference Applications\//,
  /(?:^|["'`\s])owner-dogfood\//m,
  /(?:^|["'`\s])private-candidates\//m,
  /\/Users\/viacheslavbeliaev\//,
  /[A-Za-z]:\\Users\\[^\\]+\\/,
];
const secretContent = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bsb_secret_[A-Za-z0-9_-]{20,}\b/,
];
const admittedSyntheticSecrets = ["sb_secret_0123456789abcdefghijklmnopqrstuvwxyz"];

function fail(message) { throw new Error(message); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function normalize(path) { return path.split("\\").join("/"); }
function inside(root, path) {
  const local = relative(root, path);
  return local !== ".." && !local.startsWith(`..${sep}`) && !isAbsolute(local);
}
function generated(path) {
  if (path === ".git" || path.startsWith(".git/")) return true;
  const segments = path.split("/");
  return segments.includes("node_modules") || segments.includes(".luastra") || segments.includes("target") ||
    /^examples\/[^/]+\/dist(?:\/|$)/.test(path) || path.startsWith("website/luastra-site/") ||
    path.startsWith("hosts/tauri/www/") || /(?:^|\/)src-tauri\/gen(?:\/|$)/.test(path);
}

async function actualFiles(root, directory = root) {
  const files = [];
  for (const name of (await readdir(directory)).sort()) {
    const path = resolve(directory, name);
    const local = normalize(relative(root, path));
    if (generated(local)) continue;
    const info = await lstat(path);
    if (info.isSymbolicLink()) fail(`candidate contains a symlink: ${local}`);
    if (info.isDirectory()) files.push(...await actualFiles(root, path));
    else if (info.isFile()) files.push(local);
    else fail(`candidate contains an unsupported entry: ${local}`);
  }
  return files.sort();
}

export async function auditCleanCandidate({ root = resolve(dirname(fileURLToPath(import.meta.url)), "..") } = {}) {
  const candidate = await realpath(resolve(root));
  const manifestBytes = await readFile(resolve(candidate, manifestName));
  const manifest = JSON.parse(manifestBytes);
  if (manifest.schemaVersion !== 2 || manifest.identity !== "luastra-clean-public-candidate/0.1.0-alpha" ||
      manifest.publicationAuthorized !== false || manifest.manifestPath !== manifestName || !Array.isArray(manifest.files)) {
    fail("invalid clean candidate manifest");
  }
  if (!manifestBytes.equals(Buffer.from(canonicalJson(manifest)))) fail("clean candidate manifest is not canonical JSON");
  const base = { ...manifest }; delete base.contentSha256;
  if (manifest.contentSha256 !== sha256(Buffer.from(canonicalJson(base)))) fail("clean candidate content identity mismatch");
  const seen = new Set();
  for (const entry of manifest.files) {
    if (!entry || typeof entry.path !== "string" || !Number.isInteger(entry.mode) || !Number.isInteger(entry.bytes) ||
        !/^[a-f0-9]{64}$/.test(entry.sha256) || seen.has(entry.path)) fail(`invalid manifest ledger entry: ${entry?.path ?? "unknown"}`);
    seen.add(entry.path);
    const forbidden = entry.path.split("/").find((segment) => forbiddenPathSegments.has(segment));
    if (forbidden) fail(`manifest path contains forbidden private segment ${forbidden}: ${entry.path}`);
    const path = resolve(candidate, entry.path);
    if (!inside(candidate, path)) fail(`manifest path escapes candidate: ${entry.path}`);
    const info = await lstat(path).catch(() => null);
    if (!info?.isFile() || info.isSymbolicLink()) fail(`manifest file is missing or unsafe: ${entry.path}`);
    const bytes = await readFile(path);
    if (bytes.byteLength !== entry.bytes || sha256(bytes) !== entry.sha256 ||
        (process.platform !== "win32" && (info.mode & 0o777) !== entry.mode)) fail(`manifest file mismatch: ${entry.path}`);
    if (!bytes.includes(0) && entry.path !== "release/audit-public-candidate.mjs") {
      const text = bytes.toString("utf8");
      const match = forbiddenContent.find((pattern) => pattern.test(text));
      if (match) fail(`private source reference found in ${entry.path}: ${match}`);
      const secretScanText = admittedSyntheticSecrets.reduce((value, marker) => value.split(marker).join("[admitted synthetic secret]"), text);
      const secret = secretContent.find((pattern) => pattern.test(secretScanText));
      if (secret) fail(`secret-like content found in ${entry.path}: ${secret}`);
    }
  }
  const actual = await actualFiles(candidate);
  const expected = [...seen, manifestName].sort();
  if (canonicalJson(actual) !== canonicalJson(expected)) {
    const actualSet = new Set(actual);
    const expectedSet = new Set(expected);
    const extra = actual.filter((path) => !expectedSet.has(path));
    const missing = expected.filter((path) => !actualSet.has(path));
    fail(`candidate file inventory mismatch: extra=${extra.join(",") || "none"}; missing=${missing.join(",") || "none"}`);
  }
  for (const required of ["README.md", "LICENSE", "package.json", "cli/luastra.mjs", "sdk/luastra/ui.luau",
    "website/app/luastra.json", "examples/test-sixth-sense/luastra.json", "docs/installation.md",
    ".github/PAGES_DEPLOYMENT.md", ".github/workflows/public-alpha-quality.yml",
    ".github/workflows/publish-luastra-dev.yml"]) {
    if (!seen.has(required)) fail(`required public file is not bound: ${required}`);
  }
  const workflows = manifest.files.filter((entry) => entry.path.startsWith(".github/workflows/") && entry.path.endsWith(".yml"));
  for (const entry of workflows) {
    const text = await readFile(resolve(candidate, entry.path), "utf8");
    for (const match of text.matchAll(/uses:\s*([^\s#]+)/gu)) {
      if (!/@[a-f0-9]{40}$/u.test(match[1])) fail(`workflow action is not SHA-pinned: ${entry.path}: ${match[1]}`);
    }
  }
  const pages = await readFile(resolve(candidate, ".github/workflows/publish-luastra-dev.yml"), "utf8");
  if (!/^  release:\n    types:\n      - published$/mu.test(pages) || /^  push:/mu.test(pages) ||
      !/^  workflow_dispatch:\n    inputs:\n      source_sha:/mu.test(pages) ||
      !/ref: \$\{\{ github\.event\.release\.tag_name \|\| inputs\.source_sha \}\}/u.test(pages) ||
      !/\^\[0-9a-f\]\{40\}\$/u.test(pages) || !/git rev-parse HEAD/u.test(pages) ||
      !/^      pages: write$/mu.test(pages) || !/^      id-token: write$/mu.test(pages)) {
    fail("unsafe or incomplete luastra.dev publishing workflow");
  }
  const releaseModule = await import(`${pathToFileURL(resolve(candidate, "release/build-sdk-release.mjs")).href}?audit=${Date.now()}`);
  const release = await releaseModule.verifySdkReleaseSet(resolve(candidate, "release-artifacts/0.1.0-alpha"));
  return Object.freeze({ result: "PASS", identity: manifest.identity, files: manifest.files.length + 1,
    contentSha256: manifest.contentSha256, releaseContentSha256: release.manifest.contentSha256,
    publicationAuthorized: manifest.publicationAuthorized });
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.stdout.write(canonicalJson(await auditCleanCandidate()));
}
