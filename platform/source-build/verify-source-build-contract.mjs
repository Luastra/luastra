import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

const root = import.meta.dirname;
const defaultContractPath = resolve(root, "source-build-contract.v1.json");

function fail(message) { throw new Error(message); }
function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}

export async function verifySourceBuildContract(path = defaultContractPath) {
  const absoluteContract = resolve(path);
  const contractRoot = dirname(absoluteContract);
  const contract = JSON.parse(await readFile(absoluteContract, "utf8"));
  if (!exactKeys(contract, ["schemaVersion", "identity", "sourceDateEpoch", "luau", "emscripten", "sourceFiles", "protocolFiles", "targets"]) || contract.schemaVersion !== 1) fail("invalid source-build contract header");
  if (!exactKeys(contract.luau, ["tag", "commit", "tree", "archiveUrl", "archiveBytes", "archiveSha256", "extractedDirectory"]) ||
      contract.luau.tag !== "0.731" || !/^[a-f0-9]{40}$/.test(contract.luau.commit) || !/^[a-f0-9]{40}$/.test(contract.luau.tree) ||
      !Number.isSafeInteger(contract.luau.archiveBytes) || !/^[a-f0-9]{64}$/.test(contract.luau.archiveSha256)) fail("invalid Luau source identity");
  if (!exactKeys(contract.emscripten, ["version", "commit"]) || contract.emscripten.version !== "6.0.6" || !/^[a-f0-9]{40}$/.test(contract.emscripten.commit)) fail("invalid Emscripten identity");
  if (!Number.isSafeInteger(contract.sourceDateEpoch) || contract.sourceDateEpoch < 1) fail("invalid source date epoch");
  if (!Array.isArray(contract.sourceFiles) || contract.sourceFiles.length === 0) fail("source files are required");
  const admittedFiles = [];
  for (const item of contract.sourceFiles) {
    if (!exactKeys(item, ["path", "bytes", "sha256"]) || typeof item.path !== "string" || isAbsolute(item.path) || !Number.isSafeInteger(item.bytes) || item.bytes < 1 || !/^[a-f0-9]{64}$/.test(item.sha256)) fail("invalid source file record");
    const absolute = resolve(contractRoot, item.path);
    const local = relative(contractRoot, absolute);
    if (local === ".." || local.startsWith(`..${sep}`) || isAbsolute(local)) fail(`source file escapes root: ${item.path}`);
    const info = await stat(absolute).catch(() => null);
    if (!info?.isFile() || info.size !== item.bytes) fail(`source file size mismatch: ${item.path}`);
    const digest = createHash("sha256").update(await readFile(absolute)).digest("hex");
    if (digest !== item.sha256) fail(`source file hash mismatch: ${item.path}`);
    admittedFiles.push(absolute);
  }
  if (!Array.isArray(contract.protocolFiles) || contract.protocolFiles.length === 0) fail("generated protocol files are required");
  const protocolRoot = resolve(contractRoot, "../protocol/generated");
  const admittedProtocolFiles = [];
  for (const item of contract.protocolFiles) {
    if (!exactKeys(item, ["path", "bytes", "sha256"]) || typeof item.path !== "string" || isAbsolute(item.path) || !Number.isSafeInteger(item.bytes) || item.bytes < 1 || !/^[a-f0-9]{64}$/.test(item.sha256)) fail("invalid generated protocol file record");
    const absolute = resolve(protocolRoot, item.path);
    const local = relative(protocolRoot, absolute);
    if (local === ".." || local.startsWith(`..${sep}`) || isAbsolute(local)) fail(`generated protocol file escapes root: ${item.path}`);
    const info = await stat(absolute).catch(() => null);
    if (!info?.isFile() || info.size !== item.bytes) fail(`generated protocol file size mismatch: ${item.path}`);
    const digest = createHash("sha256").update(await readFile(absolute)).digest("hex");
    if (digest !== item.sha256) fail(`generated protocol file hash mismatch: ${item.path}`);
    admittedProtocolFiles.push(absolute);
  }
  const targetIds = contract.targets.map((item) => item.id);
  if (new Set(targetIds).size !== targetIds.length || !["darwin-x64", "darwin-arm64", "linux-x64", "win32-x64", "wasm32-emscripten"].every((id) => targetIds.includes(id))) fail("source-build target matrix is incomplete");
  for (const target of contract.targets) {
    if (!exactKeys(target, ["id", "platform", "architecture", "kind", "status"]) || !["LOCALLY_REPRODUCIBLE", "CI_REPRODUCIBLE", "RECIPE_DEFINED_UNEXECUTED"].includes(target.status)) fail(`invalid source-build target: ${target.id}`);
  }
  return Object.freeze({ contract: Object.freeze(contract), sourceFiles: Object.freeze(admittedFiles), protocolFiles: Object.freeze(admittedProtocolFiles) });
}
