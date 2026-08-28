#!/usr/bin/env node

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(await readFile(resolve(root, "schema.v1.json"), "utf8"));
const output = resolve(root, "generated");
await mkdir(output, { recursive: true });

const json = (value) => JSON.stringify(value);
const quotedCpp = (values) => values.map((value) => `"${value}"`).join(", ");
const quotedLuau = (values) => values.map((value) => `["${value}"] = true`).join(", ");
const operationNames = Object.keys(schema.rpc.operations).sort();
const componentNames = Object.keys(schema.renderer.components).sort();
const motionPropertyNames = Object.keys(schema.renderer.motion.properties).sort();

const javascript = `// Generated from protocol/schema.v1.json. Do not edit.
export const Protocol = Object.freeze(${JSON.stringify(schema, null, 2)});

const limits = Protocol.limits;
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
const capabilityKinds = new Set(Protocol.capability.requestKinds);
const resultStatuses = new Set(Protocol.capability.resultStatuses);
const errorCodes = new Set(Protocol.capability.publicErrorCodes);
const patchKinds = new Set(Protocol.renderer.patchKinds);
const semanticTags = new Set(Protocol.renderer.semanticTags);
const attributes = new Set(Protocol.renderer.attributes);
const rendererEvents = new Set(Protocol.renderer.events);
const components = new Map(Object.entries(Protocol.renderer.components).map(([name, definition]) => [name, new Set(definition.properties)]));
const motionProperties = new Map(Object.entries(Protocol.renderer.motion.properties));
const motionEasings = new Set(Protocol.renderer.motion.easing);
const rpcOperations = new Set(${json(operationNames)});

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, keys) {
  return record(value) && Object.keys(value).sort().join("\\n") === [...keys].sort().join("\\n");
}

function boundedString(value, maximum = limits.stringBytes) {
  return typeof value === "string" && encoder.encode(value).byteLength <= maximum;
}

function identifier(value) {
  return boundedString(value, 128) && /^[a-z][a-z0-9_-]*(\\/[a-z][a-z0-9_-]*)*$/.test(value);
}

function traceId(value) {
  return boundedString(value, limits.traceIdBytes) && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value);
}

function deadline(value) {
  return Number.isInteger(value) && value >= limits.minimumDeadlineMs && value <= limits.maximumDeadlineMs;
}

export function validateJsonShape(value, depth = 0) {
  if (depth > limits.nestingDepth) return false;
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return boundedString(value);
  if (Array.isArray(value)) {
    return value.length <= limits.collectionItems && value.every((item) => validateJsonShape(item, depth + 1));
  }
  if (record(value)) {
    const entries = Object.entries(value);
    return entries.length <= limits.objectProperties && entries.every(([key, item]) => boundedString(key, 128) && validateJsonShape(item, depth + 1));
  }
  return false;
}

export function decodeEnvelope(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (view.byteLength === 0 || view.byteLength > limits.envelopeBytes) throw new Error("ENVELOPE_SIZE");
  let text;
  try { text = decoder.decode(view); } catch { throw new Error("INVALID_UTF8"); }
  let value;
  try { value = JSON.parse(text); } catch { throw new Error("MALFORMED_JSON"); }
  if (!validateJsonShape(value)) throw new Error("INVALID_JSON_SHAPE");
  return value;
}

export function negotiate(hello) {
  if (!exactKeys(hello, ["kind", "supportedVersions"]) || hello.kind !== "hello" ||
      !Array.isArray(hello.supportedVersions) || hello.supportedVersions.length === 0 ||
      hello.supportedVersions.length > 16 || !hello.supportedVersions.every(Number.isInteger)) {
    return { kind: "reject", code: "INVALID_HELLO", supportedVersions: Protocol.supportedVersions };
  }
  const shared = Protocol.supportedVersions.filter((version) => hello.supportedVersions.includes(version));
  if (shared.length === 0) return { kind: "reject", code: "INCOMPATIBLE_VERSION", supportedVersions: Protocol.supportedVersions };
  return { kind: "accept", version: Math.max(...shared) };
}

export function validateCapabilityRequest(value) {
  return exactKeys(value, ["version", "kind", "requestId", "traceId", "deadlineMs", "payload"]) &&
    value.version === 1 && capabilityKinds.has(value.kind) && Number.isSafeInteger(value.requestId) && value.requestId > 0 &&
    traceId(value.traceId) && deadline(value.deadlineMs) && validateJsonShape(value.payload);
}

export function validateCapabilityResponse(value) {
  if (!exactKeys(value, ["version", "requestId", "traceId", "status", "payload"])) return false;
  if (value.version !== 1 || !Number.isSafeInteger(value.requestId) || value.requestId <= 0 ||
      !traceId(value.traceId) || !resultStatuses.has(value.status) || !validateJsonShape(value.payload)) return false;
  if (value.status === "error") {
    return exactKeys(value.payload, ["code", "message"]) && errorCodes.has(value.payload.code) &&
      boundedString(value.payload.message, 512) && value.payload.message.length > 0;
  }
  return true;
}

export function validateRendererPatch(value) {
  if (!exactKeys(value, ["kind", "target", "name", "value"]) || !patchKinds.has(value.kind) || !identifier(value.target)) return false;
  if (!boundedString(value.name, 128) || !boundedString(value.value)) return false;
  if (value.kind === "create") return value.name === "" && semanticTags.has(value.value);
  if (value.kind === "attribute") return attributes.has(value.name);
  if (value.kind === "remove-attribute") return attributes.has(value.name) && value.value === "";
  if (value.kind === "event") return rendererEvents.has(value.name) && (value.value === "" || /^[a-z][a-z0-9._-]*$/.test(value.value));
  if (value.kind === "append") return value.name === "" && identifier(value.value);
  if (value.kind === "place") return identifier(value.name) && (value.value === "" || identifier(value.value));
  if (["focus", "remove"].includes(value.kind)) return value.name === "" && value.value === "";
  if (value.kind === "modal") return value.name === "" && ["open", "closed"].includes(value.value);
  return value.kind === "text" && value.name === "";
}

export function validateRendererBatch(value) {
  return exactKeys(value, ["version", "sequence", "patches"]) && value.version === 1 &&
    Number.isSafeInteger(value.sequence) && value.sequence >= 0 && Array.isArray(value.patches) &&
    value.patches.length <= limits.rendererBatchPatches && value.patches.every(validateRendererPatch);
}

function validTween(range, descriptor) {
  return exactKeys(descriptor, ["kind", "from", "to", "durationMs", "easing"]) && descriptor.kind === "tween" &&
    Number.isFinite(descriptor.from) && descriptor.from >= range.minimum && descriptor.from <= range.maximum &&
    Number.isFinite(descriptor.to) && descriptor.to >= range.minimum && descriptor.to <= range.maximum &&
    Number.isFinite(descriptor.durationMs) && descriptor.durationMs >= Protocol.renderer.motion.durationMs.minimum &&
    descriptor.durationMs <= Protocol.renderer.motion.durationMs.maximum && motionEasings.has(descriptor.easing);
}

function validMotionStep(range, descriptor) {
  if (!record(descriptor)) return false;
  if (descriptor.kind === "tween") return validTween(range, descriptor);
  return exactKeys(descriptor, ["kind", "durationMs"]) && descriptor.kind === "wait" &&
    Number.isFinite(descriptor.durationMs) && descriptor.durationMs >= Protocol.renderer.motion.durationMs.minimum &&
    descriptor.durationMs <= Protocol.renderer.motion.durationMs.maximum;
}

function validMotionDescriptor(range, descriptor) {
  if (!record(descriptor)) return false;
  if (descriptor.kind === "tween") return validTween(range, descriptor);
  return exactKeys(descriptor, ["kind", "steps", "iterations"]) && descriptor.kind === "sequence" &&
    Number.isInteger(descriptor.iterations) && descriptor.iterations >= 0 && descriptor.iterations <= 1000 &&
    Array.isArray(descriptor.steps) && descriptor.steps.length >= 1 && descriptor.steps.length <= 32 &&
    descriptor.steps.some((step) => step?.kind === "tween") && descriptor.steps.every((step) => validMotionStep(range, step)) &&
    (descriptor.iterations === 1 || descriptor.steps.reduce((total, step) => total + step.durationMs, 0) > 0);
}

function validMotion(value) {
  if (!record(value) || Object.keys(value).length === 0 || Object.keys(value).length > motionProperties.size) return false;
  return Object.entries(value).every(([property, descriptor]) => {
    const range = motionProperties.get(property);
    return range && validMotionDescriptor(range, descriptor);
  });
}

function validComponentProperty(componentName, name, value) {
  if (name === "motion") return validMotion(value);
  if (["busy", "disabled", "external", "header", "hidden", "open", "required"].includes(name)) return typeof value === "boolean";
  if (["width", "height"].includes(name)) return Number.isFinite(value) && value >= 1 && value <= 4096;
  if (name === "aspectRatio") return Number.isFinite(value) && value >= 0.05 && value <= 20;
  if (name === "cornerRadius") return Number.isFinite(value) && value >= 0 && value <= 2048;
  if (name === "strokeWidth") return Number.isFinite(value) && value >= 0 && value <= 64;
  if (["fill", "stroke"].includes(name)) return typeof value === "string" && (/^#[0-9a-fA-F]{6}$/.test(value) || ["accent", "danger", "muted", "surface", "success", "text", "transparent", "warning"].includes(value));
  if (["textColor", "backgroundColor", "accentColor", "dangerColor", "mutedColor", "surfaceColor", "successColor", "warningColor"].includes(name)) {
    if (componentName === "Screen") return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
    return typeof value === "string" && (/^#[0-9a-fA-F]{6}$/.test(value) || ["accent", "danger", "muted", "surface", "success", "text", "transparent", "warning"].includes(value));
  }
  if (name === "source") return typeof value === "string" && /^asset:image\\/[a-z][a-z0-9_-]*(\\/[a-z][a-z0-9_-]*)*$/.test(value);
  if (name === "href") {
    if (typeof value !== "string" || encoder.encode(value).byteLength > 2048) return false;
    if (/^#[a-z][a-z0-9_-]*(\\/[a-z][a-z0-9_-]*)*$/.test(value)) return true;
    try { const url = new URL(value); return url.protocol === "https:" && url.username === "" && url.password === ""; } catch { return false; }
  }
  if (name === "language") return typeof value === "string" && /^[A-Za-z0-9_+.-]{1,32}$/.test(value);
  if (name === "scope") return ["col", "row"].includes(value);
  if (name === "documentTitle") return typeof value === "string" && encoder.encode(value).byteLength >= 1 && encoder.encode(value).byteLength <= 160;
  if (name === "documentDescription") return typeof value === "string" && encoder.encode(value).byteLength >= 1 && encoder.encode(value).byteLength <= 320;
  if (name === "documentLanguage") return typeof value === "string" && /^[a-z]{2,3}(-[A-Z]{2})?$/.test(value);
  if (name === "variant") return ["body", "heading", "subheading", "title"].includes(value);
  if (name === "inputType") return ["email", "password", "text"].includes(value);
  if (name === "inputMode") return ["decimal", "email", "numeric", "search", "tel", "text", "url"].includes(value);
  if (name === "enterKeyHint") return ["done", "enter", "go", "next", "previous", "search", "send"].includes(value);
  if (name === "autoComplete") return ["current-password", "email", "name", "new-password", "off", "on", "one-time-code", "username"].includes(value);
  if (["onDismiss", "onTap", "onInput"].includes(name)) return typeof value === "string" && /^[a-z][a-z0-9._-]*$/.test(value) && encoder.encode(value).byteLength <= 64;
  return boundedString(value);
}

export function rendererTreeError(value) {
  let nodes = 0;
  const ids = new Set();
  const visit = (node, depth, path) => {
    if (depth > Protocol.renderer.maximumTreeDepth) return \`renderer tree exceeds maximum depth at \${path}\`;
    if (++nodes > Protocol.renderer.maximumTreeNodes) return "renderer tree exceeds maximum node count";
    if (!record(node)) return \`renderer node at \${path} must be an object\`;
    if (!exactKeys(node, ["type", "id", "properties", "children"])) return \`renderer node at \${path} must contain only type, id, properties and children\`;
    if (!identifier(node.id)) return \`renderer node at \${path} has invalid id: \${String(node.id)}\`;
    if (ids.has(node.id)) return \`duplicate renderer component id: \${node.id}\`;
    if (!components.has(node.type)) return \`renderer component \${node.id} has unknown type: \${String(node.type)}\`;
    if (!record(node.properties)) return \`renderer component \${node.id} properties must be an object\`;
    if (!Array.isArray(node.children)) return \`renderer component \${node.id} children must be an array\`;
    ids.add(node.id);
    const allowed = components.get(node.type);
    const properties = Object.entries(node.properties);
    if (properties.length > limits.objectProperties) return \`renderer component \${node.id} exceeds the property limit\`;
    for (const [name, item] of properties) {
      if (!allowed.has(name)) return \`renderer component \${node.id} (\${node.type}) has unsupported property: \${name}\`;
      if (!validComponentProperty(node.type, name, item)) return \`renderer component \${node.id} (\${node.type}) has invalid property: \${name}\`;
    }
    if (node.children.length > Protocol.renderer.maximumTreeNodes) return \`renderer component \${node.id} exceeds the child limit\`;
    for (let index = 0; index < node.children.length; index += 1) {
      const error = visit(node.children[index], depth + 1, \`\${path}.children[\${index}]\`);
      if (error !== null) return error;
    }
    return null;
  };
  return visit(value, 0, "root");
}

export function validateRendererTree(value) {
  return rendererTreeError(value) === null;
}

export function validateRpcRequest(value) {
  return exactKeys(value, ["version", "operation", "input", "traceId", "deadlineMs"]) && value.version === 1 &&
    rpcOperations.has(value.operation) && traceId(value.traceId) && deadline(value.deadlineMs) && validateJsonShape(value.input);
}

function validateRpcType(typeName, value, depth = 0) {
  if (depth > limits.nestingDepth) return false;
  if (typeName.endsWith("[]")) {
    const itemType = typeName.slice(0, -2);
    return Array.isArray(value) && value.length <= limits.collectionItems && value.every((item) => validateRpcType(itemType, item, depth + 1));
  }
  if (typeName === "string") return boundedString(value);
  if (typeName === "number") return typeof value === "number" && Number.isFinite(value);
  if (typeName === "boolean") return typeof value === "boolean";
  const definition = Protocol.rpc.types[typeName];
  if (!definition || !exactKeys(value, Object.keys(definition))) return false;
  return Object.entries(definition).every(([name, fieldType]) => validateRpcType(fieldType, value[name], depth + 1));
}

export function validateRpcResult(operation, value) {
  const resultType = Protocol.rpc.operations[operation]?.result;
  return typeof resultType === "string" && validateRpcType(resultType, value);
}

export function validateRpcResponse(value, expectedTraceId, operation = null) {
  if (!exactKeys(value, ["version", "success", "data", "error", "traceId"]) || value.version !== 1 ||
      value.traceId !== expectedTraceId || typeof value.success !== "boolean") return false;
  if (value.success) return value.error === null && validateJsonShape(value.data) && (operation === null || validateRpcResult(operation, value.data));
  return value.data === null && exactKeys(value.error, ["code", "message"]) && errorCodes.has(value.error.code) &&
    boundedString(value.error.message, 512) && value.error.message.length > 0;
}
`;

const luau = `-- Generated from protocol/schema.v1.json. Do not edit.
--!strict

export type CapabilityRequest = { version: number, kind: string, requestId: number, traceId: string, deadlineMs: number, payload: any }
export type CapabilityResponse = { version: number, requestId: number, traceId: string, status: string, payload: any }
export type RendererPatch = { kind: string, target: string, name: string, value: string }
export type RendererBatch = { version: number, sequence: number, patches: { RendererPatch } }
export type RpcRequest = { version: number, operation: string, input: any, traceId: string, deadlineMs: number }
export type RpcError = { code: string, message: string }
export type RpcResponse = { version: number, success: boolean, data: any?, error: RpcError?, traceId: string }

local Protocol = {}
Protocol.version = 1
Protocol.limits = {
    envelopeBytes = ${schema.limits.envelopeBytes}, stringBytes = ${schema.limits.stringBytes}, traceIdBytes = ${schema.limits.traceIdBytes},
    nestingDepth = ${schema.limits.nestingDepth}, collectionItems = ${schema.limits.collectionItems}, objectProperties = ${schema.limits.objectProperties},
    inFlightRequests = ${schema.limits.inFlightRequests}, minimumDeadlineMs = ${schema.limits.minimumDeadlineMs}, maximumDeadlineMs = ${schema.limits.maximumDeadlineMs},
    rendererBatchPatches = ${schema.limits.rendererBatchPatches},
}
local capabilityKinds = { ${quotedLuau(schema.capability.requestKinds)} }
local patchKinds = { ${quotedLuau(schema.renderer.patchKinds)} }
local semanticTags = { ${quotedLuau(schema.renderer.semanticTags)} }
local attributes = { ${quotedLuau(schema.renderer.attributes)} }
local rendererEvents = { ${quotedLuau(schema.renderer.events)} }
local componentTypes = { ${quotedLuau(componentNames)} }
local rpcOperations = { ${quotedLuau(operationNames)} }
local capabilityRequestKeys = { version = true, kind = true, requestId = true, traceId = true, deadlineMs = true, payload = true }
local capabilityResponseKeys = { version = true, requestId = true, traceId = true, status = true, payload = true }
local rendererPatchKeys = { kind = true, target = true, name = true, value = true }
local rpcRequestKeys = { version = true, operation = true, input = true, traceId = true, deadlineMs = true }
local resultStatuses = { ${quotedLuau(schema.capability.resultStatuses)} }
local errorCodes = { ${quotedLuau(schema.capability.publicErrorCodes)} }

local function exactKeys(value: any, allowed: { [string]: boolean }, expected: number): boolean
    if type(value) ~= "table" then return false end
    local count = 0
    for key in pairs(value) do
        if type(key) ~= "string" or allowed[key] ~= true then return false end
        count += 1
    end
    return count == expected
end

local function boundedString(value: any, maximum: number): boolean
    return type(value) == "string" and #value <= maximum
end

local function identifier(value: any): boolean
    return boundedString(value, 128) and string.match(value, "^[a-z][a-z0-9_/-]*$") ~= nil and string.find(value, "//", 1, true) == nil
end

local function traceId(value: any): boolean
    return boundedString(value, Protocol.limits.traceIdBytes) and string.match(value, "^[A-Za-z0-9][A-Za-z0-9%._:%-]*$") ~= nil
end

local function deadline(value: any): boolean
    return type(value) == "number" and value % 1 == 0 and value >= Protocol.limits.minimumDeadlineMs and value <= Protocol.limits.maximumDeadlineMs
end

function Protocol.validateCapabilityRequest(value: any): boolean
    return exactKeys(value, capabilityRequestKeys, 6) and value.version == 1 and capabilityKinds[value.kind] == true and
        type(value.requestId) == "number" and value.requestId > 0 and value.requestId % 1 == 0 and
        traceId(value.traceId) and deadline(value.deadlineMs) and value.payload ~= nil
end

function Protocol.validateCapabilityResponse(value: any): boolean
    if not exactKeys(value, capabilityResponseKeys, 5) or value.version ~= 1 or resultStatuses[value.status] ~= true or
        type(value.requestId) ~= "number" or value.requestId <= 0 or value.requestId % 1 ~= 0 or not traceId(value.traceId) then return false end
    if value.status == "error" then
        return type(value.payload) == "table" and errorCodes[value.payload.code] == true and boundedString(value.payload.message, 512)
    end
    return value.payload ~= nil
end

function Protocol.validateRendererPatch(value: any): boolean
    if not exactKeys(value, rendererPatchKeys, 4) or patchKinds[value.kind] ~= true or not identifier(value.target) or
        not boundedString(value.name, 128) or not boundedString(value.value, Protocol.limits.stringBytes) then return false end
    if value.kind == "create" then return value.name == "" and semanticTags[value.value] == true end
    if value.kind == "attribute" then return attributes[value.name] == true end
    if value.kind == "remove-attribute" then return attributes[value.name] == true and value.value == "" end
    if value.kind == "event" then return rendererEvents[value.name] == true and boundedString(value.value, 64) end
    if value.kind == "append" then return value.name == "" and identifier(value.value) end
    if value.kind == "place" then return identifier(value.name) and (value.value == "" or identifier(value.value)) end
    if value.kind == "focus" or value.kind == "remove" then return value.name == "" and value.value == "" end
    if value.kind == "modal" then return value.name == "" and (value.value == "open" or value.value == "closed") end
    return value.kind == "text" and value.name == ""
end

function Protocol.validComponentType(value: any): boolean
    return type(value) == "string" and componentTypes[value] == true
end

function Protocol.validateRpcRequest(value: any): boolean
    return exactKeys(value, rpcRequestKeys, 5) and value.version == 1 and rpcOperations[value.operation] == true and
        traceId(value.traceId) and deadline(value.deadlineMs) and value.input ~= nil
end

return Protocol
`;

const cpp = `// Generated from protocol/schema.v1.json. Do not edit.
#pragma once

#include <array>
#include <cstddef>
#include <string_view>

namespace Luastra::ProtocolV1
{
inline constexpr int version = 1;
inline constexpr std::size_t envelopeBytes = ${schema.limits.envelopeBytes};
inline constexpr std::size_t stringBytes = ${schema.limits.stringBytes};
inline constexpr std::size_t traceIdBytes = ${schema.limits.traceIdBytes};
inline constexpr std::size_t nestingDepth = ${schema.limits.nestingDepth};
inline constexpr std::size_t collectionItems = ${schema.limits.collectionItems};
inline constexpr std::size_t objectProperties = ${schema.limits.objectProperties};
inline constexpr std::size_t inFlightRequests = ${schema.limits.inFlightRequests};
inline constexpr int minimumDeadlineMs = ${schema.limits.minimumDeadlineMs};
inline constexpr int maximumDeadlineMs = ${schema.limits.maximumDeadlineMs};
inline constexpr std::size_t rendererBatchPatches = ${schema.limits.rendererBatchPatches};
inline constexpr std::size_t maximumTreeNodes = ${schema.renderer.maximumTreeNodes};
inline constexpr std::size_t maximumTreeDepth = ${schema.renderer.maximumTreeDepth};

inline constexpr std::array capabilityKinds{${quotedCpp(schema.capability.requestKinds)}};
inline constexpr std::array resultStatuses{${quotedCpp(schema.capability.resultStatuses)}};
inline constexpr std::array publicErrorCodes{${quotedCpp(schema.capability.publicErrorCodes)}};
inline constexpr std::array patchKinds{${quotedCpp(schema.renderer.patchKinds)}};
inline constexpr std::array semanticTags{${quotedCpp(schema.renderer.semanticTags)}};
inline constexpr std::array attributes{${quotedCpp(schema.renderer.attributes)}};
inline constexpr std::array rendererEvents{${quotedCpp(schema.renderer.events)}};
inline constexpr std::array componentTypes{${quotedCpp(componentNames)}};
inline constexpr std::array motionProperties{${quotedCpp(motionPropertyNames)}};
inline constexpr std::array motionEasings{${quotedCpp(schema.renderer.motion.easing)}};
inline constexpr std::array rpcOperations{${quotedCpp(operationNames)}};

struct CapabilityRequestView
{
    int version;
    std::string_view kind;
    std::size_t requestId;
    std::string_view traceId;
    int deadlineMs;
};

struct RendererPatchView
{
    std::string_view kind;
    std::string_view target;
    std::string_view name;
    std::string_view value;
};

struct RpcRequestView
{
    int version;
    std::string_view operation;
    std::string_view traceId;
    int deadlineMs;
};

template<std::size_t Size>
inline bool contains(const std::array<const char*, Size>& values, std::string_view value)
{
    for (const char* candidate : values) if (value == candidate) return true;
    return false;
}

inline bool validDeadline(int value) { return value >= minimumDeadlineMs && value <= maximumDeadlineMs; }
inline bool boundedString(std::string_view value, std::size_t maximum = stringBytes) { return value.size() <= maximum; }
inline bool validTraceId(std::string_view value)
{
    if (value.empty() || !boundedString(value, traceIdBytes)) return false;
    for (unsigned char c : value)
        if (!((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '.' || c == '_' || c == ':' || c == '-')) return false;
    return true;
}
inline bool validCapabilityKind(std::string_view value) { return contains(capabilityKinds, value); }
inline bool validResultStatus(std::string_view value) { return contains(resultStatuses, value); }
inline bool validErrorCode(std::string_view value) { return contains(publicErrorCodes, value); }
inline bool validPatchKind(std::string_view value) { return contains(patchKinds, value); }
inline bool validSemanticTag(std::string_view value) { return contains(semanticTags, value); }
inline bool validAttribute(std::string_view value) { return contains(attributes, value); }
inline bool validRendererEvent(std::string_view value) { return contains(rendererEvents, value); }
inline bool validComponentType(std::string_view value) { return contains(componentTypes, value); }
inline bool validRpcOperation(std::string_view value) { return contains(rpcOperations, value); }
inline bool validCapabilityRequest(const CapabilityRequestView& value)
{
    return value.version == version && validCapabilityKind(value.kind) && value.requestId > 0 &&
        validTraceId(value.traceId) && validDeadline(value.deadlineMs);
}
inline bool validRendererPatch(const RendererPatchView& value)
{
    if (!validPatchKind(value.kind) || value.target.empty() || !boundedString(value.target, 128) ||
        !boundedString(value.name, 128) || !boundedString(value.value)) return false;
    if (value.kind == "create") return value.name.empty() && validSemanticTag(value.value);
    if (value.kind == "attribute") return validAttribute(value.name);
    if (value.kind == "remove-attribute") return validAttribute(value.name) && value.value.empty();
    if (value.kind == "event") return validRendererEvent(value.name) && boundedString(value.value, 64);
    if (value.kind == "append") return value.name.empty() && !value.value.empty() && boundedString(value.value, 128);
    if (value.kind == "place") return !value.name.empty() && boundedString(value.name, 128) && boundedString(value.value, 128);
    if (value.kind == "focus" || value.kind == "remove") return value.name.empty() && value.value.empty();
    if (value.kind == "modal") return value.name.empty() && (value.value == "open" || value.value == "closed");
    return value.kind == "text" && value.name.empty();
}
inline bool validRpcRequest(const RpcRequestView& value)
{
    return value.version == version && validRpcOperation(value.operation) && validTraceId(value.traceId) && validDeadline(value.deadlineMs);
}
} // namespace Luastra::ProtocolV1
`;

await Promise.all([
  writeFile(resolve(output, "protocol.mjs"), javascript),
  writeFile(resolve(output, "protocol.luau"), luau),
  writeFile(resolve(output, "protocol.hpp"), cpp),
]);

console.log(JSON.stringify({
  result: "PASS",
  schemaVersion: schema.schemaVersion,
  outputs: ["protocol.mjs", "protocol.luau", "protocol.hpp"],
  operations: operationNames.length,
}, null, 2));
