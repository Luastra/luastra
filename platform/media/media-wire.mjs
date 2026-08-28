const encoder = new TextEncoder();
const maximumBytes = 4096;
const maximumFields = 128;
const keyPattern = /^[a-z][A-Za-z0-9_.-]{0,127}$/;

function fail(message) { throw new Error(message); }
function encodeValue(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function encodeMediaWire(fields) {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) fail("media fields must be an object");
  const names = Object.keys(fields).sort();
  if (names.length > maximumFields) fail("media field count exceeded");
  const tokens = ["v=1"];
  for (const name of names) {
    if (!keyPattern.test(name) || typeof fields[name] !== "string") fail("invalid media field");
    tokens.push(`${name}=${encodeValue(fields[name])}`);
  }
  const result = tokens.join("&");
  if (encoder.encode(result).byteLength > maximumBytes) fail("media payload exceeds 4096 bytes");
  return result;
}

export function decodeMediaWire(value) {
  if (typeof value !== "string" || value.length === 0 || encoder.encode(value).byteLength > maximumBytes) fail("invalid media payload size");
  const tokens = value.split("&");
  if (tokens.shift() !== "v=1" || tokens.length > maximumFields) fail("unsupported media payload");
  const fields = Object.create(null);
  for (const token of tokens) {
    const separator = token.indexOf("=");
    const name = separator > 0 ? token.slice(0, separator) : "";
    if (!keyPattern.test(name) || Object.hasOwn(fields, name)) fail("invalid media field");
    let decoded;
    try { decoded = decodeURIComponent(token.slice(separator + 1)); } catch { fail("invalid media field encoding"); }
    if (encodeValue(decoded) !== token.slice(separator + 1)) fail("non-canonical media field encoding");
    fields[name] = decoded;
  }
  return Object.freeze(fields);
}

export const MediaWireLimits = Object.freeze({ maximumBytes, maximumFields });
