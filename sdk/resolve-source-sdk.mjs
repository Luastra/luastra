import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const sdkRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const defaultManifest = resolve(sdkRoot, "source-manifest.v1.json");
const moduleIdPattern = /^luastra\/[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;

function fail(message) { throw new Error(message); }
function exactObject(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join("\n") !== [...keys].sort().join("\n")) {
    fail(`invalid ${label}`);
  }
}
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }

export async function resolveSourceSdk(manifestValue = defaultManifest) {
  const manifestPath = resolve(manifestValue);
  const canonicalSdkRoot = await realpath(sdkRoot);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  exactObject(manifest, ["schemaVersion", "identity", "compatibility", "modules"], "source SDK manifest");
  if (manifest.schemaVersion !== 1 || manifest.identity !== "luastra-source-sdk/phase5-contract-10") fail("unsupported source SDK identity");
  exactObject(manifest.compatibility, ["analyzer", "compiler", "vm", "protocol"], "source SDK compatibility");
  if (!["analyzer", "compiler", "vm"].every((name) => typeof manifest.compatibility[name] === "string" && manifest.compatibility[name].length > 0) || manifest.compatibility.protocol !== 1) {
    fail("invalid source SDK compatibility");
  }
  if (!Array.isArray(manifest.modules) || manifest.modules.length === 0) fail("source SDK modules are required");
  const modules = new Map();
  for (const module of manifest.modules) {
    exactObject(module, ["id", "source", "dependencies", "bytes", "sha256"], `source SDK module ${module?.id ?? "?"}`);
    if (!moduleIdPattern.test(module.id ?? "") || modules.has(module.id)) fail(`invalid or duplicate source SDK module: ${module.id}`);
    if (typeof module.source !== "string" || isAbsolute(module.source) || module.source.split("/").some((part) => part === "" || part === "." || part === "..")) fail(`unsafe source SDK path: ${module.source}`);
    if (!Array.isArray(module.dependencies) || !module.dependencies.every((item) => moduleIdPattern.test(item)) || new Set(module.dependencies).size !== module.dependencies.length || module.dependencies.includes(module.id)) {
      fail(`invalid dependencies for source SDK module: ${module.id}`);
    }
    if (!Number.isSafeInteger(module.bytes) || module.bytes < 1 || !/^[0-9a-f]{64}$/.test(module.sha256)) fail(`invalid source SDK integrity record: ${module.id}`);
    const sourcePath = await realpath(resolve(sdkRoot, module.source)).catch(() => null);
    if (!sourcePath) fail(`source SDK module not found: ${module.id}`);
    const fromRoot = relative(canonicalSdkRoot, sourcePath);
    if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) fail(`source SDK module escapes root: ${module.id}`);
    const info = await stat(sourcePath);
    const bytes = await readFile(sourcePath);
    if (!info.isFile() || info.size !== module.bytes || sha256(bytes) !== module.sha256) fail(`source SDK integrity mismatch: ${module.id}`);
    modules.set(module.id, Object.freeze({ id: module.id, sourcePath, dependencies: Object.freeze([...module.dependencies]) }));
  }
  for (const module of modules.values()) {
    for (const dependency of module.dependencies) if (!modules.has(dependency)) fail(`source SDK dependency is missing: ${module.id} -> ${dependency}`);
  }
  const states = new Map();
  const visit = (id, path) => {
    if (states.get(id) === "done") return;
    if (states.get(id) === "visiting") fail(`source SDK module cycle: ${[...path, id].join(" -> ")}`);
    states.set(id, "visiting");
    for (const dependency of modules.get(id).dependencies) visit(dependency, [...path, id]);
    states.set(id, "done");
  };
  for (const id of modules.keys()) visit(id, []);
  return Object.freeze({ identity: manifest.identity, compatibility: Object.freeze({ ...manifest.compatibility }), modules });
}
