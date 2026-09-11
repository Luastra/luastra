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
const reservedV2FieldNames = new Set(["length", "null", "present"]);
const enumValuePattern = /^[a-z][A-Za-z0-9_-]{0,63}$/;

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

function integer(value, minimum, maximum, label) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) fail(`${label} must be an integer from ${minimum} to ${maximum}`);
  return value;
}

function validateV2Descriptor(value, names, limits, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be a field descriptor`);
  const admitted = new Set(["type", "optional", "nullable", "array", "maximumItems", "maximumBytes"]);
  if (Object.keys(value).some((key) => !admitted.has(key)) || typeof value.type !== "string") fail(`${label} has an invalid field descriptor`);
  if (!scalarTypes.has(value.type) && !names.has(value.type)) fail(`${label} references unknown type: ${value.type}`);
  for (const flag of ["optional", "nullable", "array"]) if (value[flag] !== undefined && typeof value[flag] !== "boolean") fail(`${label}.${flag} must be boolean`);
  if (value.maximumBytes !== undefined) {
    if (value.type !== "string" || value.array === true) fail(`${label}.maximumBytes is valid only for scalar strings`);
    integer(value.maximumBytes, 1, limits.maximumStringBytes, `${label}.maximumBytes`);
  }
  if (value.maximumItems !== undefined) {
    if (value.array !== true) fail(`${label}.maximumItems requires array=true`);
    integer(value.maximumItems, 1, limits.maximumItems, `${label}.maximumItems`);
  }
}

function validateV2Fields(value, names, limits, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length > limits.maximumFields) fail(`${label} must be a bounded object`);
  for (const [name, descriptor] of Object.entries(value)) {
    if (!fieldPattern.test(name) || reservedV2FieldNames.has(name)) fail(`${label} has invalid or reserved field: ${name}`);
    validateV2Descriptor(descriptor, names, limits, `${label}.${name}`);
  }
}

function validateV2AcyclicTypes(types, limits) {
  const state = new Map();
  const depths = new Map();
  const visit = (name, path) => {
    if (state.get(name) === "visiting") fail(`backend v2 type cycle: ${[...path, name].join(" -> ")}`);
    if (state.get(name) === "done") return depths.get(name);
    state.set(name, "visiting");
    let depth = 1;
    for (const descriptor of Object.values(types[name] ?? {})) if (types[descriptor.type]) depth = Math.max(depth, 1 + visit(descriptor.type, [...path, name]));
    state.set(name, "done");
    depths.set(name, depth);
    return depth;
  };
  for (const name of Object.keys(types)) {
    const depth = visit(name, []);
    if (depth > limits.maximumDepth) fail(`backend v2 type depth exceeds ${limits.maximumDepth}: ${name}`);
  }
}

function maximumV2EncodedFields(definition, types, limits) {
  const typeCosts = new Map();
  const scalarCost = (descriptor) => {
    if (scalarTypes.has(descriptor.type) || !types[descriptor.type]) return 1;
    if (typeCosts.has(descriptor.type)) return typeCosts.get(descriptor.type);
    const cost = objectCost(types[descriptor.type]);
    typeCosts.set(descriptor.type, cost);
    return cost;
  };
  const fieldCost = (descriptor) => {
    const valueCost = descriptor.array === true
      ? 1 + (descriptor.maximumItems ?? limits.maximumItems) * scalarCost(descriptor)
      : scalarCost(descriptor);
    const nullableCost = descriptor.nullable === true ? Math.max(1, valueCost) : valueCost;
    return (descriptor.optional === true ? 1 : 0) + nullableCost;
  };
  const objectCost = (fields) => Object.values(fields).reduce((total, descriptor) => total + fieldCost(descriptor), 0);
  return objectCost(definition);
}

function maximumV2EncodedPathLength(definition, types, limits, prefix) {
  const scalarPathLength = (descriptor, path) => types[descriptor.type]
    ? objectPathLength(types[descriptor.type], path)
    : path.length;
  const fieldPathLength = (descriptor, path) => {
    const candidates = [path.length];
    if (descriptor.optional === true) candidates.push(`${path}.present`.length);
    if (descriptor.nullable === true) candidates.push(`${path}.null`.length);
    if (descriptor.array === true) {
      candidates.push(`${path}.length`.length);
      candidates.push(scalarPathLength(descriptor, `${path}.${descriptor.maximumItems ?? limits.maximumItems}`));
    } else {
      candidates.push(scalarPathLength(descriptor, path));
    }
    return Math.max(...candidates);
  };
  const objectPathLength = (fields, objectPrefix) => Math.max(objectPrefix.length, ...Object.entries(fields).map(([name, descriptor]) => fieldPathLength(descriptor, `${objectPrefix}.${name}`)));
  return objectPathLength(definition, prefix);
}

function validateV2Contract(value) {
  exact(value, ["schemaVersion", "limits", "enums", "types", "functions"], "backend v2 declaration");
  exact(value.limits, ["maximumDepth", "maximumFields", "maximumItems", "maximumStringBytes", "maximumPayloadBytes"], "backend v2 limits");
  const limits = {
    maximumDepth: integer(value.limits.maximumDepth, 1, 8, "backend v2 maximumDepth"),
    maximumFields: integer(value.limits.maximumFields, 1, 256, "backend v2 maximumFields"),
    maximumItems: integer(value.limits.maximumItems, 1, 128, "backend v2 maximumItems"),
    maximumStringBytes: integer(value.limits.maximumStringBytes, 1, 4096, "backend v2 maximumStringBytes"),
    maximumPayloadBytes: integer(value.limits.maximumPayloadBytes, 1024, 4096, "backend v2 maximumPayloadBytes"),
  };
  if (!value.enums || typeof value.enums !== "object" || Array.isArray(value.enums) || Object.keys(value.enums).length > 64) fail("backend v2 enums must be a bounded object");
  if (!value.types || typeof value.types !== "object" || Array.isArray(value.types) || Object.keys(value.types).length > 64) fail("backend v2 types must be a bounded object");
  const enumNames = new Set(Object.keys(value.enums));
  const typeNames = new Set(Object.keys(value.types));
  const names = new Set([...enumNames, ...typeNames]);
  for (const name of names) if (!typeNamePattern.test(name) || (enumNames.has(name) && typeNames.has(name))) fail(`invalid or duplicate backend v2 type name: ${name}`);
  for (const [name, members] of Object.entries(value.enums)) {
    if (!Array.isArray(members) || members.length < 1 || members.length > 64 || new Set(members).size !== members.length || members.some((member) => typeof member !== "string" || !enumValuePattern.test(member))) fail(`backend v2 enum ${name} must contain 1 to 64 unique bounded values`);
  }
  for (const [name, fields] of Object.entries(value.types)) validateV2Fields(fields, names, limits, `backend v2 type ${name}`);
  validateV2AcyclicTypes(value.types, limits);
  if (!value.functions || typeof value.functions !== "object" || Array.isArray(value.functions) || Object.keys(value.functions).length < 1 || Object.keys(value.functions).length > 64) fail("backend v2 functions must contain 1 to 64 entries");
  const clientNames = new Set();
  for (const [operation, definition] of Object.entries(value.functions)) {
    if (!operationPattern.test(operation)) fail(`invalid backend operation: ${operation}`);
    exact(definition, ["clientName", "authorization", "mutation", "idempotency", "resultVersion", "input", "result"], `backend v2 function ${operation}`);
    if (!clientNamePattern.test(definition.clientName) || clientNames.has(definition.clientName)) fail(`invalid or duplicate backend clientName: ${definition.clientName}`);
    clientNames.add(definition.clientName);
    if (!authorizations.has(definition.authorization)) fail(`invalid authorization for ${operation}`);
    if (typeof definition.mutation !== "boolean" || !idempotencyModes.has(definition.idempotency)) fail(`invalid mutation/idempotency policy for ${operation}`);
    if (!definition.mutation && definition.idempotency === "required") fail(`query cannot require idempotency: ${operation}`);
    integer(definition.resultVersion, 1, 2147483647, `backend v2 function ${operation} resultVersion`);
    validateV2Fields(definition.input, names, limits, `backend v2 function ${operation} input`);
    validateV2Fields(definition.result, names, limits, `backend v2 function ${operation} result`);
    if (maximumV2EncodedFields(definition.input, value.types, limits) + 3 > limits.maximumFields) fail(`backend v2 function ${operation} input exceeds the encoded field budget`);
    if (maximumV2EncodedFields(definition.result, value.types, limits) + 1 > limits.maximumFields) fail(`backend v2 function ${operation} result exceeds the encoded field budget`);
    if (maximumV2EncodedPathLength(definition.input, value.types, limits, "input") > 128) fail(`backend v2 function ${operation} input exceeds the encoded path limit`);
    if (maximumV2EncodedPathLength(definition.result, value.types, limits, "result") > 128) fail(`backend v2 function ${operation} result exceeds the encoded path limit`);
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
  if (value.schemaVersion === 2) validateV2Contract(value);
  else {
    exact(value, ["schemaVersion", "types", "functions"], "backend declaration");
    if (value.schemaVersion !== 1) fail("backend declaration schemaVersion must be 1 or 2");
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

function validateV2Field(descriptor, value, contract, depth) {
  if (depth > contract.limits.maximumDepth) return false;
  if (value === undefined) return descriptor.optional === true;
  if (value === null) return descriptor.nullable === true;
  if (descriptor.array === true) {
    const maximumItems = descriptor.maximumItems ?? contract.limits.maximumItems;
    if (!Array.isArray(value) || value.length > maximumItems) return false;
    return value.every((item) => validateV2Field({ ...descriptor, array: false, optional: false, nullable: false, maximumItems: undefined }, item, contract, depth + 1));
  }
  if (descriptor.type === "string") return typeof value === "string" && new TextEncoder().encode(value).byteLength <= (descriptor.maximumBytes ?? contract.limits.maximumStringBytes);
  if (descriptor.type === "number") return typeof value === "number" && Number.isInteger(value) && value >= -2147483647 && value <= 2147483647;
  if (descriptor.type === "boolean") return typeof value === "boolean";
  if (contract.enums[descriptor.type]) return typeof value === "string" && contract.enums[descriptor.type].includes(value);
  return validateV2Object(contract.types[descriptor.type], value, contract, depth + 1);
}

export function validateV2Object(definition, value, contract, depth = 0) {
  if (depth > contract.limits.maximumDepth || value === null || typeof value !== "object" || Array.isArray(value)) return false;
  if (Object.keys(value).some((name) => !Object.hasOwn(definition, name))) return false;
  return Object.entries(definition).every(([name, descriptor]) => validateV2Field(descriptor, value[name], contract, depth));
}

export function validateBackendObject(definition, value, contract) {
  return contract.schemaVersion === 2 ? validateV2Object(definition, value, contract) : validateTypedObject(definition, value, contract.types);
}
