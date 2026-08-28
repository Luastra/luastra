import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

const operationPattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+\.v[1-9][0-9]*$/;
const clientNamePattern = /^[a-z][A-Za-z0-9]{0,63}$/;
const fieldPattern = /^[a-z][A-Za-z0-9]{0,63}$/;
const typeNamePattern = /^[A-Z][A-Za-z0-9]{0,63}$/;
const scalarTypes = new Set(["string", "number", "boolean"]);
const authorizations = new Set(["public", "user", "admin"]);
const idempotencyModes = new Set(["none", "optional", "required"]);

function fail(message) { throw new Error(message); }
function exact(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join("\n") !== [...keys].sort().join("\n")) fail(`${label} must contain exactly: ${[...keys].sort().join(", ")}`);
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function typeBase(type) { return type.endsWith("[]") ? type.slice(0, -2) : type; }
function validateTypeReference(type, types, label, allowArray) {
  if (typeof type !== "string" || (!allowArray && type.endsWith("[]"))) fail(`${label} has an invalid type`);
  const base = typeBase(type);
  if (!scalarTypes.has(base) && !types.has(base)) fail(`${label} references unknown type: ${type}`);
}
function validateFields(value, types, label, allowArray) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length > 32) fail(`${label} must be a bounded object`);
  for (const [name, type] of Object.entries(value)) {
    if (!fieldPattern.test(name)) fail(`${label} has invalid field: ${name}`);
    validateTypeReference(type, types, `${label}.${name}`, allowArray);
  }
}

export async function loadBackendContract(pathValue, projectRootValue) {
  const projectRoot = await realpath(projectRootValue);
  const path = resolve(projectRoot, pathValue);
  const fromRoot = relative(projectRoot, path);
  if (isAbsolute(pathValue) || fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) fail("backend declaration resolves outside the project");
  if (!(await stat(path).catch(() => null))?.isFile()) fail("backend declaration is not a regular file");
  const source = await readFile(path, "utf8");
  const value = JSON.parse(source);
  exact(value, ["schemaVersion", "types", "functions"], "backend declaration");
  if (value.schemaVersion !== 1) fail("backend declaration schemaVersion must be 1");
  if (!value.types || typeof value.types !== "object" || Array.isArray(value.types) || Object.keys(value.types).length > 64) fail("backend types must be a bounded object");
  const typeNames = new Set(Object.keys(value.types));
  for (const name of typeNames) if (!typeNamePattern.test(name)) fail(`invalid backend type name: ${name}`);
  for (const [name, fields] of Object.entries(value.types)) validateFields(fields, typeNames, `backend type ${name}`, false);
  if (!value.functions || typeof value.functions !== "object" || Array.isArray(value.functions) || Object.keys(value.functions).length < 1 || Object.keys(value.functions).length > 64) fail("backend functions must contain 1 to 64 entries");
  const clientNames = new Set();
  for (const [operation, definition] of Object.entries(value.functions)) {
    if (!operationPattern.test(operation)) fail(`invalid backend operation: ${operation}`);
    exact(definition, ["clientName", "authorization", "mutation", "idempotency", "input", "result"], `backend function ${operation}`);
    if (!clientNamePattern.test(definition.clientName) || clientNames.has(definition.clientName)) fail(`invalid or duplicate backend clientName: ${definition.clientName}`);
    clientNames.add(definition.clientName);
    if (!authorizations.has(definition.authorization)) fail(`invalid authorization for ${operation}`);
    if (typeof definition.mutation !== "boolean" || !idempotencyModes.has(definition.idempotency)) fail(`invalid mutation/idempotency policy for ${operation}`);
    if (!definition.mutation && definition.idempotency === "required") fail(`query cannot require idempotency: ${operation}`);
    validateFields(definition.input, typeNames, `backend function ${operation} input`, false);
    validateFields(definition.result, typeNames, `backend function ${operation} result`, true);
  }
  const normalized = canonical(value);
  const canonicalSource = `${JSON.stringify(normalized, null, 2)}\n`;
  return Object.freeze({ path, sourcePath: pathValue.split("\\").join("/"), value: normalized, sha256: createHash("sha256").update(canonicalSource).digest("hex") });
}

export function validateTypedValue(type, value, types, depth = 0) {
  if (depth > 8) return false;
  if (type.endsWith("[]")) return Array.isArray(value) && value.length <= 128 && value.every((item) => validateTypedValue(type.slice(0, -2), item, types, depth + 1));
  if (type === "string") return typeof value === "string" && new TextEncoder().encode(value).byteLength <= 4096;
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "boolean") return typeof value === "boolean";
  const definition = types[type];
  return Boolean(definition) && value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\n") === Object.keys(definition).sort().join("\n") && Object.entries(definition).every(([name, fieldType]) => validateTypedValue(fieldType, value[name], types, depth + 1));
}

export function validateTypedObject(definition, value, types) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\n") === Object.keys(definition).sort().join("\n") && Object.entries(definition).every(([name, type]) => validateTypedValue(type, value[name], types));
}
