const encoder = new TextEncoder();
const keyPattern = /^[a-z][A-Za-z0-9_.-]{0,127}$/;
const metadataNames = new Set(["function", "idempotency", "retry"]);

function fail(message) { throw new Error(message); }
function scalarDescriptor(descriptor) { return { ...descriptor, optional: false, nullable: false, array: false }; }
function encodeValue(value) {
  return encodeURIComponent(value).replaceAll("!", "%21").replaceAll("'", "%27").replaceAll("(", "%28").replaceAll(")", "%29").replaceAll("*", "%2A");
}

export function encodeWireV2(fields, limits) {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) fail("v2 wire fields must be an object");
  const names = Object.keys(fields).sort();
  if (names.length > limits.maximumFields) fail("v2 wire field count exceeded");
  const parts = ["v=2"];
  for (const name of names) {
    if (!keyPattern.test(name)) fail(`invalid v2 wire field: ${name}`);
    if (typeof fields[name] !== "string") fail(`v2 wire field must be a string: ${name}`);
    parts.push(`${name}=${encodeValue(fields[name])}`);
  }
  const payload = parts.join("&");
  if (encoder.encode(payload).byteLength > limits.maximumPayloadBytes) fail(`v2 wire payload exceeds ${limits.maximumPayloadBytes} bytes`);
  return payload;
}

export function decodeWireV2(payload, limits) {
  if (typeof payload !== "string" || payload.length === 0 || encoder.encode(payload).byteLength > limits.maximumPayloadBytes) fail("invalid v2 wire payload size");
  const parts = payload.split("&");
  if (parts.shift() !== "v=2" || parts.length > limits.maximumFields) fail("invalid v2 wire version or field count");
  const fields = {};
  for (const part of parts) {
    const separator = part.indexOf("=");
    if (separator < 1) fail("malformed v2 wire field");
    const name = part.slice(0, separator);
    if (!keyPattern.test(name) || Object.hasOwn(fields, name)) fail("invalid or duplicate v2 wire field");
    const source = part.slice(separator + 1);
    let value;
    try { value = decodeURIComponent(source); } catch { fail("invalid v2 wire encoding"); }
    if (encodeValue(value) !== source) fail("non-canonical v2 wire encoding");
    fields[name] = value;
  }
  return fields;
}

function encodeScalar(fields, path, descriptor, value, contract) {
  if (descriptor.type === "string") {
    if (typeof value !== "string" || encoder.encode(value).byteLength > (descriptor.maximumBytes ?? contract.limits.maximumStringBytes)) fail(`invalid v2 string: ${path}`);
    fields[path] = value;
  } else if (descriptor.type === "number") {
    if (typeof value !== "number" || !Number.isInteger(value) || value < -2147483647 || value > 2147483647) fail(`invalid v2 number: ${path}`);
    fields[path] = String(value);
  } else if (descriptor.type === "boolean") {
    if (typeof value !== "boolean") fail(`invalid v2 boolean: ${path}`);
    fields[path] = value ? "true" : "false";
  } else if (contract.enums[descriptor.type]) {
    if (typeof value !== "string" || !contract.enums[descriptor.type].includes(value)) fail(`invalid v2 enum: ${path}`);
    fields[path] = value;
  } else {
    encodeObject(fields, path, contract.types[descriptor.type], value, contract);
  }
}

function encodeField(fields, path, descriptor, value, contract) {
  if (value === undefined) {
    if (descriptor.optional === true) return;
    fail(`missing v2 field: ${path}`);
  }
  if (descriptor.optional === true) fields[`${path}.present`] = "true";
  if (value === null) {
    if (descriptor.nullable !== true) fail(`v2 field is not nullable: ${path}`);
    fields[`${path}.null`] = "true";
    return;
  }
  if (descriptor.array === true) {
    const maximumItems = descriptor.maximumItems ?? contract.limits.maximumItems;
    if (!Array.isArray(value) || value.length > maximumItems) fail(`invalid v2 array: ${path}`);
    fields[`${path}.length`] = String(value.length);
    value.forEach((item, index) => {
      if (item === null || item === undefined) fail(`v2 array items cannot be optional or nullable: ${path}`);
      encodeScalar(fields, `${path}.${index + 1}`, scalarDescriptor(descriptor), item, contract);
    });
    return;
  }
  encodeScalar(fields, path, descriptor, value, contract);
}

function encodeObject(fields, prefix, definition, value, contract) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`invalid v2 object: ${prefix}`);
  const unknown = Object.keys(value).find((name) => !Object.hasOwn(definition, name));
  if (unknown !== undefined) fail(`unknown field in v2 object: ${prefix}.${unknown}`);
  for (const [name, descriptor] of Object.entries(definition)) encodeField(fields, `${prefix}.${name}`, descriptor, value[name], contract);
}

function take(fields, used, name, required = true) {
  if (!Object.hasOwn(fields, name)) {
    if (required) fail(`missing v2 wire field: ${name}`);
    return undefined;
  }
  if (used.has(name)) fail(`duplicate v2 wire consumption: ${name}`);
  used.add(name);
  return fields[name];
}

function decodeScalar(fields, used, path, descriptor, contract) {
  if (descriptor.type === "string") {
    const value = take(fields, used, path);
    if (encoder.encode(value).byteLength > (descriptor.maximumBytes ?? contract.limits.maximumStringBytes)) fail(`invalid v2 string: ${path}`);
    return value;
  }
  if (descriptor.type === "number") {
    const source = take(fields, used, path);
    const value = Number(source);
    if (!Number.isInteger(value) || value < -2147483647 || value > 2147483647 || String(value) !== source) fail(`invalid v2 number: ${path}`);
    return value;
  }
  if (descriptor.type === "boolean") {
    const value = take(fields, used, path);
    if (value !== "true" && value !== "false") fail(`invalid v2 boolean: ${path}`);
    return value === "true";
  }
  if (contract.enums[descriptor.type]) {
    const value = take(fields, used, path);
    if (!contract.enums[descriptor.type].includes(value)) fail(`invalid v2 enum: ${path}`);
    return value;
  }
  return decodeObject(fields, used, path, contract.types[descriptor.type], contract);
}

function decodeField(fields, used, path, descriptor, contract) {
  if (descriptor.optional === true) {
    const present = take(fields, used, `${path}.present`, false);
    if (present === undefined) return undefined;
    if (present !== "true") fail(`invalid v2 presence marker: ${path}`);
  }
  if (descriptor.nullable === true) {
    const nullMarker = take(fields, used, `${path}.null`, false);
    if (nullMarker !== undefined) {
      if (nullMarker !== "true") fail(`invalid v2 null marker: ${path}`);
      return null;
    }
  }
  if (descriptor.array === true) {
    const source = take(fields, used, `${path}.length`);
    if (!/^(0|[1-9][0-9]*)$/.test(source)) fail(`invalid v2 array length: ${path}`);
    const length = Number(source);
    if (length > (descriptor.maximumItems ?? contract.limits.maximumItems)) fail(`invalid v2 array length: ${path}`);
    return Array.from({ length }, (_, index) => decodeScalar(fields, used, `${path}.${index + 1}`, scalarDescriptor(descriptor), contract));
  }
  return decodeScalar(fields, used, path, descriptor, contract);
}

function decodeObject(fields, used, prefix, definition, contract) {
  const value = {};
  for (const [name, descriptor] of Object.entries(definition)) {
    const decoded = decodeField(fields, used, `${prefix}.${name}`, descriptor, contract);
    if (decoded !== undefined) value[name] = decoded;
  }
  return value;
}

function exactConsumption(fields, used) {
  const extra = Object.keys(fields).find((name) => !used.has(name));
  if (extra !== undefined) fail(`unexpected v2 wire field: ${extra}`);
}

export function encodeBackendV2Request({ operation, input, retry = false, idempotencyKey }, contract) {
  const definition = contract.functions[operation];
  if (!definition) fail("unknown backend v2 function");
  const fields = { function: operation, retry: retry ? "true" : "false" };
  if (idempotencyKey !== undefined) fields.idempotency = idempotencyKey;
  encodeObject(fields, "input", definition.input, input, contract);
  return encodeWireV2(fields, contract.limits);
}

export function decodeBackendV2Request(payload, contract) {
  const fields = decodeWireV2(payload, contract.limits);
  const used = new Set();
  const operation = take(fields, used, "function");
  const retryValue = take(fields, used, "retry");
  if (retryValue !== "true" && retryValue !== "false") fail("invalid v2 retry policy");
  const idempotencyKey = take(fields, used, "idempotency", false);
  const definition = contract.functions[operation];
  if (!definition) fail("unknown backend v2 function");
  const input = decodeObject(fields, used, "input", definition.input, contract);
  exactConsumption(fields, used);
  return { operation, retry: retryValue === "true", idempotencyKey, input };
}

export function encodeBackendV2Result(definition, result, contract) {
  const fields = { resultVersion: String(definition.resultVersion) };
  encodeObject(fields, "result", definition.result, result, contract);
  return encodeWireV2(fields, contract.limits);
}

export function decodeBackendV2Result(payload, definition, contract) {
  const fields = decodeWireV2(payload, contract.limits);
  const used = new Set();
  if (take(fields, used, "resultVersion") !== String(definition.resultVersion)) fail("unexpected backend v2 result version");
  const result = decodeObject(fields, used, "result", definition.result, contract);
  exactConsumption(fields, used);
  return result;
}

export const wireV2Names = Object.freeze({ metadata: Object.freeze([...metadataNames]) });
