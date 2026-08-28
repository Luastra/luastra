import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const platformRoot = dirname(fileURLToPath(import.meta.url));
const defaultManifest = resolve(platformRoot, "runtime-manifest.v2.json");
const nativeRoles = Object.freeze(["analyzer", "compiler"]);
const portableRoles = Object.freeze(["runtimeJavaScript", "runtimeWasm"]);
const expectedTargets = Object.freeze([
  Object.freeze({ id: "darwin-x64", platform: "darwin", architecture: "x64" }),
  Object.freeze({ id: "darwin-arm64", platform: "darwin", architecture: "arm64" }),
  Object.freeze({ id: "linux-x64", platform: "linux", architecture: "x64" }),
  Object.freeze({ id: "win32-x64", platform: "win32", architecture: "x64" }),
]);

function fail(message) { throw new Error(message); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}
function inside(root, path) {
  const local = relative(root, path);
  return local !== ".." && !local.startsWith(`..${sep}`) && !isAbsolute(local);
}
function validateArtifactRecord(artifact, targetId) {
  if (!exactKeys(artifact, ["role", "path", "bytes", "sha256"]) || typeof artifact.role !== "string" ||
      typeof artifact.path !== "string" || isAbsolute(artifact.path) || !Number.isSafeInteger(artifact.bytes) ||
      artifact.bytes < 1 || !/^[0-9a-f]{64}$/.test(artifact.sha256)) fail(`invalid artifact record: ${targetId}`);
  return artifact;
}
function artifactsByRole(target, expectedRoles) {
  if (!target || target.status !== "AVAILABLE_REPRODUCIBLE" || !Array.isArray(target.artifacts)) fail(`runtime SDK target unavailable: ${target?.id ?? "missing"}`);
  const artifacts = Object.fromEntries(target.artifacts.map((item) => [item.role, validateArtifactRecord(item, target.id)]));
  if (!exactKeys(artifacts, expectedRoles)) fail(`runtime SDK target roles mismatch: ${target.id}`);
  return artifacts;
}
async function verifyArtifact(artifact, role) {
  const absolute = resolve(platformRoot, artifact.path);
  if (!inside(platformRoot, absolute)) fail(`runtime SDK artifact escapes root: ${role}`);
  const info = await stat(absolute).catch(() => null);
  if (!info?.isFile() || info.size !== artifact.bytes) fail(`runtime SDK artifact size mismatch: ${role}`);
  if (sha256(await readFile(absolute)) !== artifact.sha256) fail(`runtime SDK artifact hash mismatch: ${role}`);
  return absolute;
}

export async function verifyRuntimeSdk(manifestPath = defaultManifest, expectedHost = { platform: process.platform, architecture: process.arch }) {
  const absoluteManifest = resolve(manifestPath);
  const manifest = JSON.parse(await readFile(absoluteManifest, "utf8"));
  if (!exactKeys(manifest, ["schemaVersion", "identity", "sourceBuildIdentity", "artifactMatrix", "supportedHosts", "portableTarget"]) ||
      manifest.schemaVersion !== 2 || manifest.identity !== "luastra-runtime-sdk/phase5-alpha-8" ||
      manifest.sourceBuildIdentity !== "luastra-runtime-source-build/phase5-alpha-8") fail("invalid runtime SDK manifest");
  if (!exactKeys(manifest.artifactMatrix, ["path", "bytes", "sha256"]) || typeof manifest.artifactMatrix.path !== "string" ||
      isAbsolute(manifest.artifactMatrix.path) || !Number.isSafeInteger(manifest.artifactMatrix.bytes) ||
      !/^[0-9a-f]{64}$/.test(manifest.artifactMatrix.sha256)) fail("invalid runtime SDK artifact-matrix admission");
  if (!Array.isArray(manifest.supportedHosts) || manifest.supportedHosts.length !== expectedTargets.length ||
      manifest.supportedHosts.some((host, index) => !exactKeys(host, ["id", "platform", "architecture"]) ||
        host.id !== expectedTargets[index].id || host.platform !== expectedTargets[index].platform || host.architecture !== expectedTargets[index].architecture)) fail("invalid runtime SDK host matrix");
  if (!exactKeys(expectedHost, ["platform", "architecture"]) || typeof expectedHost.platform !== "string" || typeof expectedHost.architecture !== "string") fail("invalid expected runtime host");
  const selectedHost = manifest.supportedHosts.find((host) => host.platform === expectedHost.platform && host.architecture === expectedHost.architecture);
  if (!selectedHost) fail(`unsupported runtime SDK host: ${expectedHost.platform}/${expectedHost.architecture}`);

  const matrixPath = resolve(platformRoot, manifest.artifactMatrix.path);
  if (!inside(platformRoot, matrixPath)) fail("runtime SDK artifact matrix escapes platform root");
  const matrixBytes = await readFile(matrixPath);
  if (matrixBytes.byteLength !== manifest.artifactMatrix.bytes || sha256(matrixBytes) !== manifest.artifactMatrix.sha256) fail("runtime SDK artifact matrix identity mismatch");
  const matrix = JSON.parse(matrixBytes);
  if (!exactKeys(matrix, ["schemaVersion", "identity", "runtimeSdkIdentity", "sourceBuildIdentity", "targets"]) || matrix.schemaVersion !== 1 ||
      matrix.runtimeSdkIdentity !== manifest.identity || matrix.sourceBuildIdentity !== manifest.sourceBuildIdentity || !Array.isArray(matrix.targets)) fail("invalid runtime SDK artifact matrix");
  const hostTarget = matrix.targets.find((target) => target.id === selectedHost.id);
  const portableTarget = matrix.targets.find((target) => target.id === manifest.portableTarget);
  const admitted = { ...artifactsByRole(hostTarget, nativeRoles), ...artifactsByRole(portableTarget, portableRoles) };
  const artifacts = {};
  for (const role of [...nativeRoles, ...portableRoles]) artifacts[role] = await verifyArtifact(admitted[role], role);
  return Object.freeze({
    identity: manifest.identity,
    sourceBuildIdentity: manifest.sourceBuildIdentity,
    artifactMatrixIdentity: matrix.identity,
    manifestPath: absoluteManifest,
    targetId: selectedHost.id,
    host: Object.freeze({ platform: selectedHost.platform, architecture: selectedHost.architecture }),
    artifacts: Object.freeze(artifacts),
  });
}
