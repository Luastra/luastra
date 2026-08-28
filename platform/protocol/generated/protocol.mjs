// Generated from protocol/schema.v1.json. Do not edit.
export const Protocol = Object.freeze({
  "schemaVersion": 1,
  "identity": "luastra-host-protocol",
  "supportedVersions": [
    1
  ],
  "limits": {
    "envelopeBytes": 65536,
    "stringBytes": 4096,
    "traceIdBytes": 64,
    "nestingDepth": 16,
    "collectionItems": 1024,
    "objectProperties": 128,
    "inFlightRequests": 16,
    "minimumDeadlineMs": 1,
    "maximumDeadlineMs": 30000,
    "rendererBatchPatches": 4096
  },
  "capability": {
    "requestKinds": [
      "app.launchurl.get",
      "clipboard.write",
      "media.command",
      "navigation.history",
      "rpc.call",
      "storage.get",
      "storage.set",
      "timer.control",
      "timer.sleep"
    ],
    "resultStatuses": [
      "ok",
      "error",
      "cancelled",
      "deadline"
    ],
    "publicErrorCodes": [
      "CANCELLED",
      "DEADLINE",
      "FORBIDDEN",
      "INTERNAL",
      "NETWORK",
      "UNAUTHORIZED",
      "VALIDATION"
    ]
  },
  "renderer": {
    "patchKinds": [
      "append",
      "attribute",
      "create",
      "event",
      "focus",
      "modal",
      "place",
      "remove",
      "remove-attribute",
      "text"
    ],
    "semanticTags": [
      "a",
      "button",
      "code",
      "dialog",
      "div",
      "h1",
      "h2",
      "h3",
      "hr",
      "img",
      "input",
      "label",
      "li",
      "main",
      "p",
      "pre",
      "section",
      "span",
      "table",
      "td",
      "th",
      "tr",
      "ul"
    ],
    "attributes": [
      "alt",
      "aria-busy",
      "aria-controls",
      "aria-describedby",
      "aria-expanded",
      "aria-hidden",
      "aria-invalid",
      "aria-label",
      "aria-live",
      "autocomplete",
      "class",
      "data-language",
      "data-luastra-aspect-ratio",
      "data-luastra-background-color",
      "data-luastra-corner-radius",
      "data-luastra-document-description",
      "data-luastra-document-language",
      "data-luastra-document-title",
      "data-luastra-fill",
      "data-luastra-height",
      "data-luastra-stroke",
      "data-luastra-stroke-width",
      "data-luastra-text-color",
      "data-luastra-theme-accent",
      "data-luastra-theme-background",
      "data-luastra-theme-danger",
      "data-luastra-theme-muted",
      "data-luastra-theme-success",
      "data-luastra-theme-surface",
      "data-luastra-theme-text",
      "data-luastra-theme-warning",
      "data-luastra-width",
      "decoding",
      "disabled",
      "enterkeyhint",
      "hidden",
      "href",
      "inputmode",
      "loading",
      "rel",
      "required",
      "role",
      "scope",
      "src",
      "target",
      "type",
      "value"
    ],
    "events": [
      "click",
      "dismiss",
      "input"
    ],
    "maximumTreeNodes": 10000,
    "maximumTreeDepth": 64,
    "motion": {
      "durationMs": {
        "minimum": 0,
        "maximum": 60000
      },
      "easing": [
        "linear",
        "easeOutCubic",
        "easeInOutCubic"
      ],
      "properties": {
        "opacity": {
          "minimum": 0,
          "maximum": 1
        },
        "rotationDeg": {
          "minimum": -360000,
          "maximum": 360000
        },
        "rotationYDeg": {
          "minimum": -360000,
          "maximum": 360000
        },
        "scaleX": {
          "minimum": 0,
          "maximum": 100
        },
        "scaleY": {
          "minimum": 0,
          "maximum": 100
        },
        "translateX": {
          "minimum": -100000,
          "maximum": 100000
        },
        "translateY": {
          "minimum": -100000,
          "maximum": 100000
        }
      }
    },
    "components": {
      "Button": {
        "properties": [
          "backgroundColor",
          "busy",
          "className",
          "disabled",
          "hidden",
          "label",
          "motion",
          "onTap",
          "text",
          "textColor"
        ]
      },
      "Code": {
        "properties": [
          "backgroundColor",
          "className",
          "hidden",
          "language",
          "motion",
          "text",
          "textColor"
        ]
      },
      "CodeBlock": {
        "properties": [
          "backgroundColor",
          "className",
          "hidden",
          "language",
          "motion",
          "text",
          "textColor"
        ]
      },
      "Column": {
        "properties": [
          "backgroundColor",
          "className",
          "hidden",
          "label",
          "motion",
          "role",
          "textColor"
        ]
      },
      "Divider": {
        "properties": [
          "className",
          "hidden",
          "label",
          "motion"
        ]
      },
      "FlipCard": {
        "properties": [
          "aspectRatio",
          "className",
          "height",
          "hidden",
          "label",
          "motion",
          "role",
          "width"
        ]
      },
      "Image": {
        "properties": [
          "aspectRatio",
          "className",
          "cornerRadius",
          "height",
          "hidden",
          "label",
          "motion",
          "source",
          "width"
        ]
      },
      "Layer": {
        "properties": [
          "backgroundColor",
          "className",
          "hidden",
          "label",
          "motion",
          "role",
          "textColor"
        ]
      },
      "Link": {
        "properties": [
          "backgroundColor",
          "className",
          "external",
          "hidden",
          "href",
          "label",
          "motion",
          "onTap",
          "text",
          "textColor"
        ]
      },
      "List": {
        "properties": [
          "backgroundColor",
          "busy",
          "className",
          "hidden",
          "label",
          "motion",
          "textColor"
        ]
      },
      "ListItem": {
        "properties": [
          "backgroundColor",
          "className",
          "hidden",
          "motion",
          "text",
          "textColor"
        ]
      },
      "Modal": {
        "properties": [
          "backgroundColor",
          "className",
          "label",
          "motion",
          "onDismiss",
          "open",
          "textColor"
        ]
      },
      "Row": {
        "properties": [
          "backgroundColor",
          "className",
          "hidden",
          "label",
          "motion",
          "role",
          "textColor"
        ]
      },
      "Screen": {
        "properties": [
          "accentColor",
          "backgroundColor",
          "className",
          "dangerColor",
          "documentDescription",
          "documentLanguage",
          "documentTitle",
          "hidden",
          "label",
          "motion",
          "mutedColor",
          "role",
          "successColor",
          "surfaceColor",
          "textColor",
          "warningColor"
        ]
      },
      "Shape": {
        "properties": [
          "className",
          "cornerRadius",
          "fill",
          "height",
          "hidden",
          "label",
          "motion",
          "stroke",
          "strokeWidth",
          "width"
        ]
      },
      "Table": {
        "properties": [
          "backgroundColor",
          "className",
          "hidden",
          "label",
          "motion",
          "textColor"
        ]
      },
      "TableCell": {
        "properties": [
          "backgroundColor",
          "className",
          "header",
          "hidden",
          "motion",
          "scope",
          "text",
          "textColor"
        ]
      },
      "TableRow": {
        "properties": [
          "className",
          "hidden",
          "motion"
        ]
      },
      "Text": {
        "properties": [
          "backgroundColor",
          "className",
          "hidden",
          "motion",
          "role",
          "text",
          "textColor",
          "variant"
        ]
      },
      "TextInput": {
        "properties": [
          "autoComplete",
          "className",
          "disabled",
          "enterKeyHint",
          "errorId",
          "hidden",
          "inputMode",
          "inputType",
          "label",
          "motion",
          "onInput",
          "required",
          "value"
        ]
      }
    }
  },
  "rpc": {
    "operations": {
      "server.call.v1": {
        "authorization": "public",
        "result": "ServerCallResult"
      },
      "tasks.admin.v1": {
        "authorization": "admin",
        "result": "TaskList"
      },
      "tasks.fail.v1": {
        "authorization": "user",
        "result": "TaskList"
      },
      "tasks.list.v1": {
        "authorization": "user",
        "result": "TaskList"
      },
      "tasks.slow.v1": {
        "authorization": "user",
        "result": "TaskList"
      }
    },
    "types": {
      "ServerCallResult": {
        "payload": "string"
      },
      "Task": {
        "id": "string",
        "title": "string"
      },
      "TaskList": {
        "tasks": "Task[]"
      }
    }
  }
});

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
const rpcOperations = new Set(["server.call.v1","tasks.admin.v1","tasks.fail.v1","tasks.list.v1","tasks.slow.v1"]);

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, keys) {
  return record(value) && Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}

function boundedString(value, maximum = limits.stringBytes) {
  return typeof value === "string" && encoder.encode(value).byteLength <= maximum;
}

function identifier(value) {
  return boundedString(value, 128) && /^[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/.test(value);
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
  if (name === "source") return typeof value === "string" && /^asset:image\/[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/.test(value);
  if (name === "href") {
    if (typeof value !== "string" || encoder.encode(value).byteLength > 2048) return false;
    if (/^#[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/.test(value)) return true;
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
    if (depth > Protocol.renderer.maximumTreeDepth) return `renderer tree exceeds maximum depth at ${path}`;
    if (++nodes > Protocol.renderer.maximumTreeNodes) return "renderer tree exceeds maximum node count";
    if (!record(node)) return `renderer node at ${path} must be an object`;
    if (!exactKeys(node, ["type", "id", "properties", "children"])) return `renderer node at ${path} must contain only type, id, properties and children`;
    if (!identifier(node.id)) return `renderer node at ${path} has invalid id: ${String(node.id)}`;
    if (ids.has(node.id)) return `duplicate renderer component id: ${node.id}`;
    if (!components.has(node.type)) return `renderer component ${node.id} has unknown type: ${String(node.type)}`;
    if (!record(node.properties)) return `renderer component ${node.id} properties must be an object`;
    if (!Array.isArray(node.children)) return `renderer component ${node.id} children must be an array`;
    ids.add(node.id);
    const allowed = components.get(node.type);
    const properties = Object.entries(node.properties);
    if (properties.length > limits.objectProperties) return `renderer component ${node.id} exceeds the property limit`;
    for (const [name, item] of properties) {
      if (!allowed.has(name)) return `renderer component ${node.id} (${node.type}) has unsupported property: ${name}`;
      if (!validComponentProperty(node.type, name, item)) return `renderer component ${node.id} (${node.type}) has invalid property: ${name}`;
    }
    if (node.children.length > Protocol.renderer.maximumTreeNodes) return `renderer component ${node.id} exceeds the child limit`;
    for (let index = 0; index < node.children.length; index += 1) {
      const error = visit(node.children[index], depth + 1, `${path}.children[${index}]`);
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
