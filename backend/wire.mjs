const encoder = new TextEncoder();
const maximumBytes = 4096;
const maximumFields = 128;
const keyPattern = /^[a-z][A-Za-z0-9_.-]{0,127}$/;

function fail(message) { throw new Error(message); }

export function encodeWire(fields) {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) fail("wire fields must be an object");
  const names = Object.keys(fields).sort();
  if (names.length > maximumFields) fail("wire field count exceeded");
  const parts = ["v=1"];
  for (const name of names) {
    if (!keyPattern.test(name)) fail(`invalid wire field: ${name}`);
    const value = fields[name];
    if (typeof value !== "string") fail(`wire field must be a string: ${name}`);
    parts.push(`${name}=${encodeURIComponent(value).replaceAll("!", "%21").replaceAll("'", "%27").replaceAll("(", "%28").replaceAll(")", "%29").replaceAll("*", "%2A")}`);
  }
  const encoded = parts.join("&");
  if (encoder.encode(encoded).byteLength > maximumBytes) fail("wire payload exceeds 4096 bytes");
  return encoded;
}

export function decodeWire(value) {
  if (typeof value !== "string" || value.length === 0 || encoder.encode(value).byteLength > maximumBytes) fail("invalid wire payload size");
  const parts = value.split("&");
  if (parts.shift() !== "v=1" || parts.length > maximumFields) fail("invalid wire version or field count");
  const fields = {};
  for (const part of parts) {
    const separator = part.indexOf("=");
    if (separator < 1) fail("malformed wire field");
    const name = part.slice(0, separator);
    if (!keyPattern.test(name) || Object.hasOwn(fields, name)) fail("invalid or duplicate wire field");
    const encoded = part.slice(separator + 1);
    let decoded;
    try { decoded = decodeURIComponent(encoded); } catch { fail("invalid wire encoding"); }
    if (encodeURIComponent(decoded).replaceAll("!", "%21").replaceAll("'", "%27").replaceAll("(", "%28").replaceAll(")", "%29").replaceAll("*", "%2A") !== encoded) fail("non-canonical wire encoding");
    fields[name] = decoded;
  }
  return Object.freeze(fields);
}

export const wireLimits = Object.freeze({ maximumBytes, maximumFields });
