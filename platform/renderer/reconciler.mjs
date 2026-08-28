import { validateRendererPatch } from "../protocol/generated/protocol.mjs";

const componentTags = Object.freeze({
  Button: "button",
  Code: "code",
  CodeBlock: "pre",
  Column: "section",
  Divider: "hr",
  FlipCard: "div",
  Image: "img",
  Layer: "div",
  Link: "a",
  List: "ul",
  ListItem: "li",
  Modal: "dialog",
  Row: "section",
  Screen: "main",
  Shape: "span",
  Table: "table",
  TableCell: "td",
  TableRow: "tr",
  Text: "p",
  TextInput: "input",
});
const idPattern = /^[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;
const assetImagePattern = /^asset:image\/[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;
const colorPattern = /^#[0-9a-fA-F]{6}$/;
const colorTokens = new Set(["accent", "danger", "muted", "surface", "success", "text", "transparent", "warning"]);
const fragmentPattern = /^#[a-z][a-z0-9_-]*(\/[a-z][a-z0-9_-]*)*$/;
const languagePattern = /^[A-Za-z0-9_+.-]{1,32}$/;
const screenThemeAttributes = Object.freeze({
  accentColor: "data-luastra-theme-accent",
  backgroundColor: "data-luastra-theme-background",
  dangerColor: "data-luastra-theme-danger",
  mutedColor: "data-luastra-theme-muted",
  successColor: "data-luastra-theme-success",
  surfaceColor: "data-luastra-theme-surface",
  textColor: "data-luastra-theme-text",
  warningColor: "data-luastra-theme-warning",
});

function fail(message) {
  throw new Error(message);
}

function patch(kind, target, name = "", value = "") {
  const result = { kind, target, name, value };
  if (!validateRendererPatch(result)) fail(`reconciler produced invalid ${kind} patch`);
  return result;
}

function safeHref(value) {
  if (typeof value !== "string" || new TextEncoder().encode(value).byteLength > 2048) return false;
  if (fragmentPattern.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

export function component(type, properties = {}, children = [], { resolveAsset = (reference) => reference } = {}) {
  if (!componentTags[type]) fail(`unknown component type: ${type}`);
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) fail("component properties must be an object");
  const id = properties.id;
  if (typeof id !== "string" || !idPattern.test(id)) fail(`invalid component ID: ${id}`);
  if (!Array.isArray(children)) fail(`children must be an array: ${id}`);
  if (typeof resolveAsset !== "function") fail("asset resolver must be a function");
  if (["Code", "CodeBlock", "Divider", "Image", "Link", "Shape"].includes(type) && children.length !== 0) fail(`${type} does not accept children`);
  if (type === "FlipCard" && children.length !== 2) fail("FlipCard requires exactly two children");
  const attributes = { ...(properties.attributes ?? {}) };
  const events = {};
  if (properties.onTap !== undefined) events.click = String(properties.onTap);
  if (properties.onInput !== undefined) events.input = String(properties.onInput);
  if (properties.onDismiss !== undefined) events.dismiss = String(properties.onDismiss);
  if (type === "Button") attributes.type ??= "button";
  if (type === "Link") {
    if (!safeHref(properties.href) || typeof properties.text !== "string") fail("Link requires string text and a safe fragment or HTTPS href");
    attributes.href = properties.href;
    if (properties.external === true) {
      if (!properties.href.startsWith("https://")) fail("Only an HTTPS Link can be external");
      attributes.target = "_blank";
      attributes.rel = "noopener noreferrer";
    } else if (properties.external !== undefined && properties.external !== false) fail("Link external must be a boolean");
  }
  if (["Code", "CodeBlock"].includes(type)) {
    if (typeof properties.text !== "string") fail(`${type} requires string source text`);
    if (properties.language !== undefined) {
      if (typeof properties.language !== "string" || !languagePattern.test(properties.language)) fail(`${type} has an invalid language`);
      attributes["data-language"] = properties.language;
    }
  }
  if (type === "TextInput") {
    if (properties.inputType !== undefined && !new Set(["email", "password", "text"]).has(properties.inputType)) fail("TextInput has an invalid inputType");
    if (properties.inputMode !== undefined && !new Set(["decimal", "email", "numeric", "search", "tel", "text", "url"]).has(properties.inputMode)) fail("TextInput has an invalid inputMode");
    if (properties.enterKeyHint !== undefined && !new Set(["done", "enter", "go", "next", "previous", "search", "send"]).has(properties.enterKeyHint)) fail("TextInput has an invalid enterKeyHint");
    if (properties.autoComplete !== undefined && !new Set(["current-password", "email", "name", "new-password", "off", "on", "one-time-code", "username"]).has(properties.autoComplete)) fail("TextInput has an invalid autoComplete");
    attributes.type = properties.inputType ?? "text";
    if (properties.inputMode !== undefined) attributes.inputmode = properties.inputMode;
    if (properties.enterKeyHint !== undefined) attributes.enterkeyhint = properties.enterKeyHint;
    if (properties.autoComplete !== undefined) attributes.autocomplete = properties.autoComplete;
    if (properties.placeholder !== undefined) {
      if (typeof properties.placeholder !== "string" || new TextEncoder().encode(properties.placeholder).byteLength > 160) fail("TextInput has an invalid placeholder");
      attributes.placeholder = properties.placeholder;
    }
  }
  if (properties.label !== undefined && type !== "Image") attributes["aria-label"] = properties.label;
  if (properties.className !== undefined) attributes.class = properties.className;
  if (properties.busy !== undefined) attributes["aria-busy"] = properties.busy ? "true" : "false";
  if (properties.errorId !== undefined) {
    attributes["aria-invalid"] = "true";
    attributes["aria-describedby"] = properties.errorId;
  }
  if (properties.disabled !== undefined) attributes.disabled = properties.disabled ? "true" : "false";
  if (properties.hidden !== undefined) attributes.hidden = properties.hidden ? "true" : "false";
  if (properties.required !== undefined) attributes.required = properties.required ? "true" : "false";
  if (properties.role !== undefined) attributes.role = properties.role;
  if (properties.value !== undefined) attributes.value = String(properties.value);
  if (type === "Image") {
    if (!assetImagePattern.test(properties.source ?? "") || typeof properties.label !== "string") fail("Image requires an admitted source and string label");
    const resolved = resolveAsset(properties.source, "image");
    if (typeof resolved !== "string" || resolved.length < 1 || resolved.length > 4096) fail("Image asset resolver returned an invalid URL");
    attributes.src = resolved;
    attributes.alt = properties.label;
    attributes.loading = "lazy";
    attributes.decoding = "async";
  }
  if (type === "Shape") {
    if (properties.label === undefined || properties.label === "") attributes["aria-hidden"] = "true";
    else attributes.role = "img";
    for (const name of ["fill", "stroke"]) if (properties[name] !== undefined && !colorPattern.test(properties[name]) && !colorTokens.has(properties[name])) fail(`Shape has an invalid ${name}`);
  }
  if (type === "Divider") {
    if (properties.label === undefined || properties.label === "") attributes["aria-hidden"] = "true";
  }
  if (type === "Table") {
    if (!children.every((child) => child.type === "TableRow")) fail("Table children must be TableRow nodes");
  }
  if (type === "TableRow") {
    if (!children.every((child) => child.type === "TableCell")) fail("TableRow children must be TableCell nodes");
  }
  if (type === "TableCell") {
    if (properties.header !== undefined && typeof properties.header !== "boolean") fail("TableCell header must be a boolean");
    if (properties.scope !== undefined) {
      if (properties.header !== true || !["col", "row"].includes(properties.scope)) fail("TableCell has an invalid scope");
      attributes.scope = properties.scope;
    }
  }
  if (["Button", "Code", "CodeBlock", "Column", "Layer", "Link", "List", "ListItem", "Modal", "Row", "Table", "TableCell", "Text"].includes(type)) {
    for (const name of ["textColor", "backgroundColor"]) {
      if (properties[name] !== undefined && !colorPattern.test(properties[name]) && !colorTokens.has(properties[name])) fail(`${type} has an invalid ${name}`);
    }
    if (properties.textColor !== undefined) attributes["data-luastra-text-color"] = properties.textColor;
    if (properties.backgroundColor !== undefined) attributes["data-luastra-background-color"] = properties.backgroundColor;
  }
  if (type === "Screen") {
    for (const [name, attribute] of Object.entries(screenThemeAttributes)) {
      if (properties[name] === undefined) continue;
      if (!colorPattern.test(properties[name])) fail(`Screen has an invalid ${name}`);
      attributes[attribute] = properties[name];
    }
    if (properties.documentTitle !== undefined) {
      if (typeof properties.documentTitle !== "string" || properties.documentTitle.length < 1 || properties.documentTitle.length > 160) fail("Screen has an invalid documentTitle");
      attributes["data-luastra-document-title"] = properties.documentTitle;
    }
    if (properties.documentDescription !== undefined) {
      if (typeof properties.documentDescription !== "string" || properties.documentDescription.length < 1 || properties.documentDescription.length > 320) fail("Screen has an invalid documentDescription");
      attributes["data-luastra-document-description"] = properties.documentDescription;
    }
    if (properties.documentLanguage !== undefined) {
      if (typeof properties.documentLanguage !== "string" || !/^[a-z]{2,3}(-[A-Z]{2})?$/.test(properties.documentLanguage)) fail("Screen has an invalid documentLanguage");
      attributes["data-luastra-document-language"] = properties.documentLanguage;
    }
  }
  for (const [property, attribute, minimum, maximum] of [
    ["width", "data-luastra-width", 1, 4096], ["height", "data-luastra-height", 1, 4096],
    ["aspectRatio", "data-luastra-aspect-ratio", 0.05, 20], ["cornerRadius", "data-luastra-corner-radius", 0, 2048],
    ["strokeWidth", "data-luastra-stroke-width", 0, 64],
  ]) {
    if (properties[property] === undefined) continue;
    if (!Number.isFinite(properties[property]) || properties[property] < minimum || properties[property] > maximum) fail(`${type} has an invalid ${property}`);
    attributes[attribute] = String(properties[property]);
  }
  if (properties.fill !== undefined) attributes["data-luastra-fill"] = properties.fill;
  if (properties.stroke !== undefined) attributes["data-luastra-stroke"] = properties.stroke;
  let tag = componentTags[type];
  if (type === "Text" && properties.variant === "title") tag = "h1";
  if (type === "Text" && properties.variant === "heading") tag = "h2";
  if (type === "Text" && properties.variant === "subheading") tag = "h3";
  if (type === "TableCell" && properties.header === true) tag = "th";
  return Object.freeze({
    id,
    type,
    tag,
    text: properties.text === undefined ? "" : String(properties.text),
    modal: type === "Modal" ? (properties.open === true ? "open" : "closed") : null,
    motion: properties.motion ?? null,
    events: Object.freeze(events),
    attributes: Object.freeze(attributes),
    children: Object.freeze(children),
  });
}

function validateTree(node, seen = new Set()) {
  if (!node || typeof node !== "object" || !componentTags[node.type] || !idPattern.test(node.id ?? "")) {
    fail("invalid renderer tree node");
  }
  if (seen.has(node.id)) fail(`duplicate renderer key: ${node.id}`);
  seen.add(node.id);
  for (const [name, value] of Object.entries(node.attributes)) {
    patch("attribute", node.id, name, String(value));
  }
  for (const [name, value] of Object.entries(node.events)) patch("event", node.id, name, value);
  for (const child of node.children) validateTree(child, seen);
  return node;
}

function emitCreate(node, parentId, output) {
  output.push(patch("create", node.id, "", node.tag));
  for (const [name, value] of Object.entries(node.attributes).sort(([left], [right]) => left.localeCompare(right))) {
    output.push(patch("attribute", node.id, name, String(value)));
  }
  if (node.text !== "") output.push(patch("text", node.id, "", node.text));
  if (node.modal !== null) output.push(patch("modal", node.id, "", node.modal));
  for (const [name, value] of Object.entries(node.events).sort(([left], [right]) => left.localeCompare(right))) {
    output.push(patch("event", node.id, name, value));
  }
  for (const child of node.children) emitCreate(child, node.id, output);
  output.push(patch("place", parentId, node.id, ""));
}

function sameOrder(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function reconcileNode(previous, next, parentId, output) {
  if (previous.id !== next.id || previous.tag !== next.tag) {
    output.push(patch("remove", previous.id));
    emitCreate(next, parentId, output);
    return;
  }

  const attributeNames = new Set([...Object.keys(previous.attributes), ...Object.keys(next.attributes)]);
  for (const name of [...attributeNames].sort()) {
    if (!(name in next.attributes)) output.push(patch("remove-attribute", next.id, name, ""));
    else if (String(previous.attributes[name]) !== String(next.attributes[name])) {
      output.push(patch("attribute", next.id, name, String(next.attributes[name])));
    }
  }
  if (previous.text !== next.text) output.push(patch("text", next.id, "", next.text));
  if (previous.modal !== next.modal) output.push(patch("modal", next.id, "", next.modal));
  const eventNames = new Set([...Object.keys(previous.events), ...Object.keys(next.events)]);
  for (const name of [...eventNames].sort()) {
    if (previous.events[name] !== next.events[name]) output.push(patch("event", next.id, name, next.events[name] ?? ""));
  }

  const previousById = new Map(previous.children.map((child) => [child.id, child]));
  const nextById = new Map(next.children.map((child) => [child.id, child]));
  const currentOrder = previous.children.map((child) => child.id);

  for (const child of previous.children) {
    if (!nextById.has(child.id)) {
      output.push(patch("remove", child.id));
      currentOrder.splice(currentOrder.indexOf(child.id), 1);
    }
  }
  for (const child of next.children) {
    const oldChild = previousById.get(child.id);
    if (oldChild) reconcileNode(oldChild, child, next.id, output);
    else {
      emitCreate(child, next.id, output);
      currentOrder.push(child.id);
    }
  }

  const desiredOrder = next.children.map((child) => child.id);
  if (!sameOrder(currentOrder, desiredOrder)) {
    for (let index = desiredOrder.length - 1; index >= 0; index -= 1) {
      const childId = desiredOrder[index];
      const beforeId = desiredOrder[index + 1] ?? "";
      const childIndex = currentOrder.indexOf(childId);
      const correctlyPlaced = beforeId === ""
        ? childIndex === currentOrder.length - 1
        : currentOrder[childIndex + 1] === beforeId;
      if (!correctlyPlaced) {
        output.push(patch("place", next.id, childId, beforeId));
        currentOrder.splice(childIndex, 1);
        const beforeIndex = beforeId === "" ? currentOrder.length : currentOrder.indexOf(beforeId);
        currentOrder.splice(beforeIndex, 0, childId);
      }
    }
  }
}

export function reconcile(previous, next, rootId = "host-root") {
  validateTree(next);
  const output = [];
  if (!previous) emitCreate(next, rootId, output);
  else {
    validateTree(previous);
    reconcileNode(previous, next, rootId, output);
  }
  return output;
}

export function chunkPatches(patches, maximum) {
  if (!Number.isInteger(maximum) || maximum < 1) fail("invalid patch chunk limit");
  const chunks = [];
  for (let index = 0; index < patches.length; index += maximum) chunks.push(patches.slice(index, index + maximum));
  return chunks;
}
