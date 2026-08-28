import { createHash } from "node:crypto";
import { chmod, copyFile, lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";

import { canonicalJson } from "../../assets/package-assets.mjs";
import { verifyRuntimeSdk } from "../resolve-runtime-sdk.mjs";

const packageIdentity = "luastra-runtime-package/phase5-alpha-2";
const roles = Object.freeze(["analyzer", "compiler", "runtimeJavaScript", "runtimeWasm"]);
const targets = Object.freeze({
  "darwin-x64": Object.freeze({ platform: "darwin", architecture: "x64", extension: "" }),
  "darwin-arm64": Object.freeze({ platform: "darwin", architecture: "arm64", extension: "" }),
  "linux-x64": Object.freeze({ platform: "linux", architecture: "x64", extension: "" }),
  "win32-x64": Object.freeze({ platform: "win32", architecture: "x64", extension: ".exe" }),
});

function fail(message) { throw new Error(message); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}
function inside(root, path) {
  const local = relative(root, path);
  return local !== ".." && !local.startsWith(`..${sep}`) && !isAbsolute(local);
}
function artifactPaths(target) {
  return Object.freeze({
    analyzer: `bin/luastra_analyze${target.extension}`,
    compiler: `bin/luastra_compile${target.extension}`,
    runtimeJavaScript: "runtime/luastra-vm.js",
    runtimeWasm: "runtime/luastra-vm.wasm",
  });
}
function parseArguments(values) {
  const result = { targetId: null, output: null };
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === "--target") result.targetId = values[++index] ?? fail("missing value for --target");
    else if (values[index] === "--output") result.output = values[++index] ?? fail("missing value for --output");
    else fail("usage: package-runtime-sdk.mjs --target <target-id> --output <new-directory>");
  }
  if (!result.targetId || !result.output) fail("usage: package-runtime-sdk.mjs --target <target-id> --output <new-directory>");
  return result;
}

export async function verifyRuntimePackage(packageRoot) {
  const root = await realpath(resolve(packageRoot));
  const manifest = JSON.parse(await readFile(resolve(root, "runtime-package.v1.json"), "utf8"));
  if (!exactKeys(manifest, ["schemaVersion", "identity", "sdkIdentity", "sourceBuildIdentity", "artifactMatrixIdentity", "target", "artifacts", "contentSha256"]) ||
      manifest.schemaVersion !== 1 || manifest.identity !== packageIdentity || manifest.sdkIdentity !== "luastra-runtime-sdk/phase5-alpha-8" ||
      manifest.sourceBuildIdentity !== "luastra-runtime-source-build/phase5-alpha-8" || manifest.artifactMatrixIdentity !== "luastra-artifact-matrix/phase5-alpha-8") fail("invalid runtime package manifest");
  const admittedTarget = targets[manifest.target?.id];
  if (!admittedTarget || !exactKeys(manifest.target, ["id", "platform", "architecture"]) ||
      manifest.target.platform !== admittedTarget.platform || manifest.target.architecture !== admittedTarget.architecture) fail("invalid runtime package target");
  if (!exactKeys(manifest.artifacts, roles)) fail("invalid runtime package artifact roles");
  const expectedPaths = artifactPaths(admittedTarget);
  const artifacts = {};
  for (const role of roles) {
    const artifact = manifest.artifacts[role];
    if (!exactKeys(artifact, ["path", "bytes", "sha256"]) || artifact.path !== expectedPaths[role] || isAbsolute(artifact.path) ||
        !Number.isSafeInteger(artifact.bytes) || artifact.bytes < 1 || !/^[0-9a-f]{64}$/.test(artifact.sha256)) fail(`invalid runtime package artifact: ${role}`);
    const path = resolve(root, artifact.path);
    if (!inside(root, path)) fail(`runtime package artifact escapes root: ${role}`);
    const info = await lstat(path).catch(() => null);
    if (!info?.isFile() || info.isSymbolicLink() || info.size !== artifact.bytes) fail(`runtime package artifact size mismatch: ${role}`);
    if (sha256(await readFile(path)) !== artifact.sha256) fail(`runtime package artifact hash mismatch: ${role}`);
    if (process.platform !== "win32" && admittedTarget.platform !== "win32" && new Set(["analyzer", "compiler"]).has(role) && (info.mode & 0o111) === 0) fail(`runtime package artifact is not executable: ${role}`);
    artifacts[role] = path;
  }
  const base = { ...manifest };
  delete base.contentSha256;
  if (sha256(Buffer.from(canonicalJson(base))) !== manifest.contentSha256) fail("runtime package content identity mismatch");
  return Object.freeze({ manifest: Object.freeze(manifest), artifacts: Object.freeze(artifacts), root });
}

export async function buildRuntimePackage({ targetId, output } = {}) {
  const target = targets[targetId] ?? fail(`unsupported runtime package target: ${targetId}`);
  const requested = resolve(output ?? fail("runtime package output is required"));
  const requestedParent = dirname(requested);
  if (!(await stat(requestedParent).catch(() => null))?.isDirectory()) fail(`runtime package parent does not exist: ${requestedParent}`);
  const parent = await realpath(requestedParent);
  const destination = resolve(parent, basename(requested));
  if (await stat(destination).catch(() => null)) fail(`runtime package output already exists: ${destination}`);
  const sdk = await verifyRuntimeSdk(undefined, { platform: target.platform, architecture: target.architecture });
  if (sdk.targetId !== targetId) fail("runtime SDK selected an unexpected target");
  const temporary = await mkdtemp(resolve(parent, `.${basename(destination)}.partial-`));
  let moved = false;
  try {
    const paths = artifactPaths(target);
    const artifacts = {};
    for (const role of roles) {
      const source = sdk.artifacts[role];
      const sourceInfo = await lstat(source);
      const path = resolve(temporary, paths[role]);
      await mkdir(dirname(path), { recursive: true });
      await copyFile(source, path);
      await chmod(path, sourceInfo.mode & 0o777);
      const bytes = await readFile(path);
      artifacts[role] = { path: paths[role], bytes: bytes.byteLength, sha256: sha256(bytes) };
    }
    const base = {
      schemaVersion: 1,
      identity: packageIdentity,
      sdkIdentity: sdk.identity,
      sourceBuildIdentity: sdk.sourceBuildIdentity,
      artifactMatrixIdentity: sdk.artifactMatrixIdentity,
      target: { id: targetId, platform: target.platform, architecture: target.architecture },
      artifacts,
    };
    const manifest = { ...base, contentSha256: sha256(Buffer.from(canonicalJson(base))) };
    await writeFile(resolve(temporary, "runtime-package.v1.json"), canonicalJson(manifest), { mode: 0o644 });
    await verifyRuntimePackage(temporary);
    await rename(temporary, destination);
    moved = true;
    return Object.freeze({ output: destination, targetId, contentSha256: manifest.contentSha256, artifacts: Object.freeze(artifacts) });
  } finally {
    if (!moved) await rm(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  process.stdout.write(canonicalJson(await buildRuntimePackage(parseArguments(process.argv.slice(2)))));
}
