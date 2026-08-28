import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

const platformRoot = import.meta.dirname;
const defaultMatrix = resolve(platformRoot, "artifact-matrix.v1.json");

function fail(message) { throw new Error(message); }
function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}

export async function verifyArtifactMatrix(path = defaultMatrix) {
  const matrix = JSON.parse(await readFile(resolve(path), "utf8"));
  if (!exactKeys(matrix, ["schemaVersion", "identity", "runtimeSdkIdentity", "sourceBuildIdentity", "targets"]) || matrix.schemaVersion !== 1) fail("invalid artifact matrix header");
  const expectedTargets = ["darwin-arm64", "darwin-x64", "linux-x64", "wasm32-emscripten", "win32-x64"];
  const targetIds = matrix.targets.map((item) => item.id).sort();
  if (targetIds.join("\n") !== expectedTargets.join("\n")) fail("artifact target matrix is incomplete");
  const available = [];
  const missing = [];
  const targetRoles = new Set();
  const roles = new Set();
  for (const target of matrix.targets) {
    if (!exactKeys(target, ["id", "status", "artifacts"]) || !["AVAILABLE_REPRODUCIBLE", "RECIPE_DEFINED_UNEXECUTED"].includes(target.status) || !Array.isArray(target.artifacts)) fail(`invalid artifact target: ${target.id}`);
    if (target.status === "RECIPE_DEFINED_UNEXECUTED") {
      if (target.artifacts.length !== 0) fail(`unexecuted target exposes artifacts: ${target.id}`);
      missing.push(target.id);
      continue;
    }
    if (target.artifacts.length === 0) fail(`available target has no artifacts: ${target.id}`);
    for (const artifact of target.artifacts) {
      if (!exactKeys(artifact, ["role", "path", "bytes", "sha256"]) || typeof artifact.role !== "string" || typeof artifact.path !== "string" || isAbsolute(artifact.path) || !Number.isSafeInteger(artifact.bytes) || !/^[a-f0-9]{64}$/.test(artifact.sha256)) fail(`invalid artifact record: ${target.id}`);
      const targetRole = `${target.id}:${artifact.role}`;
      if (targetRoles.has(targetRole)) fail(`duplicate artifact role: ${targetRole}`);
      targetRoles.add(targetRole);
      roles.add(artifact.role);
      const absolute = resolve(platformRoot, artifact.path);
      const local = relative(platformRoot, absolute);
      if (local === ".." || local.startsWith(`..${sep}`) || isAbsolute(local)) fail(`artifact escapes platform root: ${artifact.role}`);
      const info = await stat(absolute).catch(() => null);
      if (!info?.isFile() || info.size !== artifact.bytes) fail(`artifact size mismatch: ${artifact.role}`);
      const digest = createHash("sha256").update(await readFile(absolute)).digest("hex");
      if (digest !== artifact.sha256) fail(`artifact hash mismatch: ${artifact.role}`);
      available.push(Object.freeze({ target: target.id, role: artifact.role, path: absolute }));
    }
  }
  for (const role of ["analyzer", "compiler", "runtimeJavaScript", "runtimeWasm"]) if (!roles.has(role)) fail(`missing artifact role: ${role}`);
  return Object.freeze({ matrix: Object.freeze(matrix), available: Object.freeze(available), missing: Object.freeze(missing.sort()) });
}
