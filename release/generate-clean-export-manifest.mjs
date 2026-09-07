import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalJson } from "../assets/package-assets.mjs";

const manifestName = "CLEAN_EXPORT_MANIFEST.json";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) { throw new Error(message); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function inside(parent, path) {
  const local = relative(parent, path);
  return local !== ".." && !local.startsWith(`..${sep}`) && !isAbsolute(local);
}

const packageManifest = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
if (!/^[0-9]+\.[0-9]+\.[0-9]+-alpha$/u.test(packageManifest.version)) fail("invalid public alpha version");

const output = execFileSync("git", ["-C", root, "ls-files", "--cached", "--others", "--exclude-standard", "-z"]);
const paths = output.toString("utf8").split("\0").filter((path) => path && path !== manifestName).sort();
const files = [];
for (const local of paths) {
  const path = resolve(root, local);
  if (!inside(root, path)) fail(`candidate path escapes root: ${local}`);
  const info = await lstat(path).catch(() => null);
  if (!info?.isFile() || info.isSymbolicLink()) fail(`candidate path is missing or unsafe: ${local}`);
  const bytes = await readFile(path);
  files.push({
    path: local.split("\\").join("/"),
    mode: info.mode & 0o777,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
  });
}

const base = {
  schemaVersion: 2,
  identity: `luastra-clean-public-candidate/${packageManifest.version}`,
  profile: "luastra-public-source-alpha-clean-candidate-v2",
  publicationAuthorized: false,
  manifestPath: manifestName,
  manifestLedgerRule: "Every regular file except this manifest is bound below; this manifest is canonical JSON and names itself.",
  files,
};
const manifest = { ...base, contentSha256: sha256(Buffer.from(canonicalJson(base))) };
await writeFile(resolve(root, manifestName), canonicalJson(manifest));
process.stdout.write(canonicalJson({ result: "PASS", version: packageManifest.version, files: files.length,
  contentSha256: manifest.contentSha256 }));
