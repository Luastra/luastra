import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { navigationGroups, release, sdkInventory, sdkTypeInventory, sections } from "../../site/reference-data.js";

function fail(message) {
  throw new Error(message);
}

function publicName(moduleName, item) {
  const prefix = moduleName.slice("luastra/".length);
  const symbol = prefix === "ui" ? "UI" : `${prefix.slice(0, 1).toUpperCase()}${prefix.slice(1)}`;
  return `${symbol}.${item}`;
}

function pageId(sectionId, index) {
  return `${sectionId}/item-${index + 1}`;
}

function pageSlug(name) {
  const publicSymbol = /^[A-Z][A-Za-z0-9]*\.([A-Za-z][A-Za-z0-9]*)$/u.exec(name);
  const unqualified = publicSymbol ? publicSymbol[1] : name;
  const slug = unqualified
    .replace(/^\d+\.\s*/u, "")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!/^[a-z0-9][a-z0-9-]{0,95}$/u.test(slug)) fail(`cannot create a stable route slug for ${name}`);
  return slug;
}

function pageRouteId(sectionId, name) {
  return `${sectionId}/${pageSlug(name)}`;
}

const sdkDirectory = resolve(import.meta.dirname, "../../../sdk/luastra");
const sdkSources = {};
for (const moduleName of Object.keys(sdkInventory)) {
  sdkSources[moduleName] = await readFile(resolve(sdkDirectory, `${moduleName.slice("luastra/".length)}.luau`), "utf8");
}

function exportedTypes(source) {
  const lines = source.split("\n");
  const declarations = {};
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^export type ([A-Za-z][A-Za-z0-9]*)\s*=/);
    if (!match) continue;
    const declaration = [lines[index]];
    let depth = (lines[index].match(/{/g) ?? []).length - (lines[index].match(/}/g) ?? []).length;
    while (depth > 0 && index + 1 < lines.length) {
      index += 1;
      declaration.push(lines[index]);
      depth += (lines[index].match(/{/g) ?? []).length - (lines[index].match(/}/g) ?? []).length;
    }
    declarations[match[1]] = declaration.join("\n").trim();
  }
  return declarations;
}

function exportedFunctions(moduleName, source) {
  const declarations = {};
  if (moduleName === "luastra/ui") {
    for (const match of source.matchAll(/^UI\.([A-Za-z][A-Za-z0-9]*)\s*=\s*function\(([^\n]*)\)(?::\s*([^\n]+?))?(?:\s+return|\s*$)/gm)) {
      declarations[match[1]] = `UI.${match[1]}(${match[2]}): ${match[3]?.trim() ?? "any"}`;
    }
    return declarations;
  }
  const namespace = publicName(moduleName, "").slice(0, -1);
  for (const match of source.matchAll(new RegExp(`^function ${namespace}\\.([A-Za-z][A-Za-z0-9]*)\\(([^\\n]*)\\)(?::\\s*([^\\n]+?))?(?:\\s+return|\\s*$)`, "gm"))) {
    declarations[match[1]] = `${namespace}.${match[1]}(${match[2]}): ${match[3]?.trim() ?? "nil"}`;
  }
  return declarations;
}

const exactTypes = {};
const exactFunctions = {};
const exactFunctionsByPublicName = {};
for (const [moduleName, source] of Object.entries(sdkSources)) {
  exactTypes[moduleName] = exportedTypes(source);
  exactFunctions[moduleName] = exportedFunctions(moduleName, source);
  for (const [shortName, declaration] of Object.entries(exactFunctions[moduleName])) {
    exactFunctionsByPublicName[publicName(moduleName, shortName)] = declaration;
  }
}

function referencedFunction(signature) {
  if (typeof signature !== "string") return null;
  const matches = Object.entries(exactFunctionsByPublicName).filter(([name]) => signature === name || signature.startsWith(`${name}(`));
  return matches.length === 1 ? matches[0][1] : null;
}

function splitTopLevel(value) {
  const values = [];
  let start = 0;
  let depth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === "{" || character === "(" || character === "[") depth += 1;
    if (character === "}" || character === ")" || character === "]") depth -= 1;
    if (character === "," && depth === 0) {
      values.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  const tail = value.slice(start).trim();
  if (tail) values.push(tail);
  return values;
}

const sdkParameterGuidance = Object.freeze({
  "Assets.image": { id: "Manifest asset ID whose declared media type is an admitted image." },
  "Assets.audio": { id: "Manifest asset ID whose declared media type is admitted audio." },
  "Assets.font": { id: "Manifest asset ID whose declared media type is an admitted font." },
  "Assets.uri": { value: "Typed asset reference whose canonical host-neutral URI is required." },
  "Data.string": { optionsValue: "Optional length, trimming, and pattern constraints for accepted strings." },
  "Data.number": { optionsValue: "Optional finite range and integer constraints for accepted numbers." },
  "Data.array": { item: "Schema applied independently to every dense array element.", optionsValue: "Optional minimum and maximum item counts." },
  "Data.object": { fields: "Map from each admitted field name to the schema that validates its value.", optionsValue: "Optional policy controlling object validation, including unknown fields." },
  "Data.optional": { schema: "Schema to validate whenever the value is not nil." },
  "Data.decode": { schema: "Runtime schema that defines the trusted result shape.", value: "Unknown value received from a runtime boundary." },
  "Timer.start": { options: "Stable timer ID, bounded delay in milliseconds, and optional event value." },
  "Timer.restart": { options: "Replacement delay and value for the pending timer with the same stable ID." },
  "Timer.cancel": { id: "Stable string ID of the pending logical timer to cancel." },
  "Motion.tween": { options: "Start, end, duration, and optional easing for one numeric motion channel." },
  "Motion.wait": { durationMs: "Non-negative delay in milliseconds before the next sequence step." },
  "Motion.sequence": { steps: "Ordered dense array containing only Tween or Wait values for one channel.", iterations: "Optional repetition count; use the documented infinite value only for intentional ambient motion." },
  "Motion.fadeIn": { options: "Optional opacity-transition duration, easing, and preset overrides." },
  "Motion.slideIn": { options: "Optional starting translation, duration, and easing overrides." },
  "Motion.scaleIn": { options: "Optional starting scale, duration, and easing overrides." },
  "Motion.sway": { options: "Optional angle, duration, and iteration settings for the rotation preset." },
  "Motion.pulse": { options: "Optional scale, duration, and iteration settings for the pulse preset." },
  "Motion.shake": { options: "Optional distance, duration, and easing settings for bounded feedback." },
  "Motion.flip": { options: "Front and back rotation angles plus duration and easing for UI.FlipCard." },
  "Navigation.decideBack": { options: "Current modal, local-stack, history, and root conditions used to choose one Back decision." },
  "Navigation.create": { options: "Allowed route names, initial route, and optional restoration settings for the named stack." },
  "Navigation.createRouter": { options: "Route compiler, initial typed entry, and optional entry-stack settings." },
  "Navigation.compile": { definitionsValue: "Dense route-definition array containing unique names and canonical path templates." },
  "State.encode": { version: "Positive schema version written into the snapshot envelope.", fields: "Bounded serializable string field map representing current application state." },
  "State.decode": { value: "Untrusted serialized snapshot string read from storage or another boundary.", expectedVersion: "Only version accepted by this direct decode operation." },
  "State.migrate": { value: "Untrusted serialized snapshot that may use an older supported version.", targetVersion: "Version the migration chain must reach.", migrationsValue: "Map from each supported source version to its deterministic next-version function." },
  "Host.storageGet": { name: "Stable application-owned storage key to read." },
  "Host.storageSet": { name: "Stable application-owned storage key to write.", value: "Bounded serialized value to persist." },
  "Host.clipboardWrite": { value: "Bounded text copied after an explicit user action." },
  "Host.historyPush": { stateToken: "Opaque encoded application-navigation state for the new history entry." },
  "Host.historyReplace": { stateToken: "Opaque encoded state replacing the current history entry." },
  "Host.historyPushLocation": { location: "Canonical admitted location for the new entry.", stateToken: "Opaque encoded application state associated with that location." },
  "Host.historyReplaceLocation": { location: "Canonical admitted replacement location.", stateToken: "Opaque encoded application state associated with that location." },
  "Host.systemBackHandled": { intentId: "ID of the pending system-Back intent consumed by application state." },
  "Host.systemBackHistory": { intentId: "ID of the pending system-Back intent delegated to host history." },
  "Host.systemBackExit": { intentId: "ID of the pending root-level system-Back intent requesting exit." },
  "Server.call": { operation: "Declared, versioned backend operation name.", input: "Bounded string map sent as operation input; never include client-side secrets.", options: "Optional deadline and retry policy for the request." },
  "Server.decode": { value: "Successful transport payload whose server envelope must still be validated." },
  "Media.setQueue": { items: "Bounded ordered QueueItem values with stable IDs and admitted sources.", selectedIndex: "Optional one-based item selected after the queue is installed." },
  "Media.seek": { positionMs: "Requested non-negative position in milliseconds within the selected item." },
  "Media.decodeState": { payload: "Untrusted media-state event or state-response payload." },
});

const sdkExpandedParameters = Object.freeze({
  "Motion.tween": [
    { name: "options.from", values: "number", description: "Required finite value at the beginning of the transition." },
    { name: "options.to", values: "number", description: "Required finite value at the end of the transition." },
    { name: "options.durationMs", values: "number (0..60000)", description: "Required transition duration in milliseconds." },
    { name: "options.easing", values: '"linear" | "easeOutCubic" | "easeInOutCubic"?', description: 'Optional interpolation curve; defaults to "linear".' },
  ],
  "Motion.fadeIn": [
    { name: "options.durationMs", values: "number (0..60000)?", description: "Optional fade duration; defaults to 180 ms." },
    { name: "options.easing", values: '"linear" | "easeOutCubic" | "easeInOutCubic"?', description: 'Optional interpolation curve; defaults to "easeOutCubic".' },
  ],
  "Motion.slideIn": [
    { name: "options.x", values: "finite number?", description: "Optional horizontal starting offset; omit it for no horizontal channel." },
    { name: "options.y", values: "finite number?", description: "Optional vertical starting offset; defaults to 18 when x is also omitted." },
    { name: "options.durationMs", values: "number (0..60000)?", description: "Optional movement duration; defaults to 240 ms." },
    { name: "options.easing", values: '"linear" | "easeOutCubic" | "easeInOutCubic"?', description: 'Optional interpolation curve; defaults to "easeOutCubic".' },
  ],
  "Motion.scaleIn": [
    { name: "options.from", values: "number (0..100)?", description: "Optional initial scale; defaults to 0.92 and ends at 1." },
    { name: "options.durationMs", values: "number (0..60000)?", description: "Optional scale duration; defaults to 220 ms." },
    { name: "options.easing", values: '"linear" | "easeOutCubic" | "easeInOutCubic"?', description: 'Optional interpolation curve; defaults to "easeOutCubic".' },
  ],
  "Motion.sway": [
    { name: "options.angleDeg", values: "number (0..45]?", description: "Optional peak rotation in degrees; defaults to 2." },
    { name: "options.durationMs", values: "number (0..60000)?", description: "Duration of each one-way movement; defaults to 180 ms." },
    { name: "options.pauseMs", values: "number (0..60000)?", description: "Delay before each continuous sway cycle; defaults to 2400 ms." },
    { name: "options.easing", values: '"linear" | "easeOutCubic" | "easeInOutCubic"?', description: 'Optional interpolation curve; defaults to "easeInOutCubic".' },
  ],
  "Motion.pulse": [
    { name: "options.scale", values: "number (0..100)?", description: "Optional peak scale; defaults to 1.04." },
    { name: "options.durationMs", values: "number (0..60000)?", description: "Duration of each expand or contract leg; defaults to 420 ms." },
    { name: "options.pauseMs", values: "number (0..60000)?", description: "Optional delay appended after each pulse; defaults to 0." },
    { name: "options.iterations", values: "integer (0..1000)?", description: "Cycle count; defaults to 1 and 0 means continuous." },
    { name: "options.easing", values: '"linear" | "easeOutCubic" | "easeInOutCubic"?', description: 'Optional interpolation curve; defaults to "easeInOutCubic".' },
  ],
  "Motion.shake": [
    { name: "options.distance", values: "number (0..1000]?", description: "Optional horizontal peak distance; defaults to 8." },
    { name: "options.durationMs", values: "number (0..60000)?", description: "Duration of the first and last legs; defaults to 70 ms." },
    { name: "options.iterations", values: "integer (0..1000)?", description: "Shake cycle count; defaults to 1 and 0 means continuous." },
  ],
  "Motion.flip": [
    { name: "options.fromDeg", values: "finite number?", description: "Optional initial Y-axis rotation; defaults to 0 degrees." },
    { name: "options.toDeg", values: "finite number?", description: "Optional final Y-axis rotation; defaults to 180 degrees." },
    { name: "options.durationMs", values: "number (0..60000)?", description: "Optional flip duration; defaults to 500 ms." },
    { name: "options.easing", values: '"linear" | "easeOutCubic" | "easeInOutCubic"?', description: 'Optional interpolation curve; defaults to "easeInOutCubic".' },
  ],
  "Data.string": [
    { name: "optionsValue.minBytes", values: "integer (0..4096)?", description: "Minimum UTF-8 byte length; defaults to 0." },
    { name: "optionsValue.maxBytes", values: "integer (0..4096)?", description: "Maximum UTF-8 byte length; defaults to 4096." },
    { name: "optionsValue.trim", values: "boolean?", description: "Trims surrounding whitespace before validation when true; defaults to false." },
  ],
  "Data.number": [
    { name: "optionsValue.integer", values: "boolean?", description: "Rejects fractional values when true; defaults to false." },
    { name: "optionsValue.min", values: "finite number?", description: "Optional inclusive minimum value." },
    { name: "optionsValue.max", values: "finite number?", description: "Optional inclusive maximum value." },
  ],
  "Data.array": [
    { name: "optionsValue.minItems", values: "integer (0..256)?", description: "Minimum admitted item count; defaults to 0." },
    { name: "optionsValue.maxItems", values: "integer (0..256)?", description: "Maximum admitted item count; defaults to 256." },
  ],
  "Data.object": [
    { name: "optionsValue.exact", values: "boolean?", description: "Rejects undeclared keys unless explicitly set to false; defaults to true." },
  ],
  "Navigation.decideBack": [
    { name: "options.modalOpen", values: "boolean", description: "Whether Back should dismiss the currently open modal first." },
    { name: "options.canBack", values: "boolean", description: "Whether admitted navigation history has an earlier entry." },
  ],
  "Navigation.create": [
    { name: "options.routes", values: "{string} (1..64)", description: "Unique lowercase route names admitted by this stack." },
    { name: "options.initial", values: "string", description: "One admitted route used as the initial stack entry." },
    { name: "options.maximumDepth", values: "integer (1..32)?", description: "Optional history-depth bound; defaults to 32." },
  ],
  "Navigation.createRouter": [
    { name: "options.compiler", values: "RouteCompiler", description: "Compiler previously returned by Navigation.compile." },
    { name: "options.initial", values: "RouteEntry", description: "Initial typed entry that the compiler can generate successfully." },
    { name: "options.maximumDepth", values: "integer (1..32)?", description: "Optional history-depth bound; defaults to 32." },
  ],
  "Timer.start": [
    { name: "options.id", values: "string", description: "Stable lowercase path ID delivered with the one-shot timer event." },
    { name: "options.delayMs", values: "integer (0..60000)", description: "Delay before delivery, in milliseconds." },
    { name: "options.value", values: "string?", description: "Optional bounded value delivered with the timer event." },
  ],
  "Timer.restart": [
    { name: "options.id", values: "string", description: "Existing or new stable timer ID to replace atomically." },
    { name: "options.delayMs", values: "integer (0..60000)", description: "Fresh delay before the replacement timer fires." },
    { name: "options.value", values: "string?", description: "Optional bounded value delivered with the replacement event." },
  ],
  "Server.call": [
    { name: "options.deadlineMs", values: "integer (1..30000)?", description: "Optional request deadline; defaults to 3000 ms." },
    { name: "options.idempotencyKey", values: "string (8..128 bytes)?", description: "Optional stable idempotency key for operations that may be retried." },
    { name: "options.retry", values: "boolean?", description: "Allows the host's bounded retry policy when true; defaults to false." },
  ],
  "Media.setQueue": [
    { name: "items[].id", values: "string (1..128 bytes)", description: "Stable application-owned item identifier." },
    { name: "items[].source", values: "asset:* | content:*", description: "Admitted project asset URI or scoped content grant." },
    { name: "items[].title", values: "string (1..256 bytes)", description: "Track title shown by application and host playback surfaces." },
    { name: "items[].artist", values: "string (1..256 bytes)", description: "Artist or collection label shown by playback surfaces." },
  ],
});

function declarationParameters(signature, publicName) {
  const open = signature.indexOf("(");
  const close = signature.lastIndexOf("):");
  if (open < 0 || close < open) return [];
  const direct = splitTopLevel(signature.slice(open + 1, close)).map((parameter) => {
    const separator = parameter.indexOf(":");
    const name = separator < 0 ? parameter : parameter.slice(0, separator).trim();
    const values = separator < 0 ? "any" : parameter.slice(separator + 1).trim();
    return {
      name,
      values,
      description: sdkParameterGuidance[publicName]?.[name] ?? `Checked ${name} argument accepted by ${publicName}.`,
    };
  });
  return uniqueParameters([...direct, ...(sdkExpandedParameters[publicName] ?? [])]);
}

function declarationReturn(signature, publicName) {
  const close = signature.lastIndexOf("):");
  if (close < 0) return null;
  const type = signature.slice(close + 2).trim();
  if (type === "RequestId" && publicName.startsWith("Timer.")) {
    return "RequestId — an opaque acknowledgement token for the timer control request. Timer acknowledgements do not enter Application.resolve; an uncancelled expiry arrives through Application.handle.";
  }
  const descriptions = {
    Node: "a validated declarative UI node that becomes part of the next host-neutral render tree",
    RequestId: "an opaque request identifier used to correlate the asynchronous completion in Application.resolve",
    MotionMap: "a complete property-to-motion map that can be assigned directly to a supported component motion field",
    Tween: "an immutable descriptor for one bounded numeric transition",
    Wait: "an immutable delay step for a motion sequence",
    Sequence: "an immutable ordered motion-channel sequence containing Tween and Wait steps",
    Image: "a typed image reference admitted from the project manifest",
    Audio: "a typed audio reference admitted from the project manifest",
    Font: "a typed font reference admitted from the project manifest",
    string: "the validated canonical string produced by this operation",
    Schema: "an immutable runtime schema that can be composed or passed to Data.decode",
    Result: "a discriminated validation result; branch on success before reading value or error",
    Stack: "a stateful named-route stack; create it once and call its public methods across renders",
    EntryStack: "a stateful typed-route stack with canonical location and snapshot operations",
    RouteCompiler: "a reusable compiler for matching, generating, and canonicalizing admitted route locations",
    DecodeResult: "a discriminated decode result; branch on success before reading decoded fields or failure data",
  };
  const description = descriptions[type] ?? `the exact ${type} value declared by the SDK contract`;
  return `${type} — ${description}.`;
}

function uniqueParameters(parameters) {
  const seen = new Set();
  return parameters.filter((parameter) => {
    if (!parameter?.name || seen.has(parameter.name)) return false;
    seen.add(parameter.name);
    return true;
  });
}

function typeFieldDescription(publicName, name, values) {
  const exact = {
    "UI.Theme.backgroundColor": "Default screen and inherited component background color.",
    "UI.Theme.textColor": "Default inherited foreground color for text-bearing components.",
    "UI.Theme.accentColor": "Accent color used by primary controls, outlines, and emphasis tokens.",
    "Timer.StartOptions.id": "Stable logical timer ID later delivered as the timer event target.",
    "Timer.StartOptions.delayMs": "Non-negative one-shot delay before Application.handle receives the event.",
    "Timer.StartOptions.value": "Optional bounded value delivered with the timer event.",
    "Media.QueueItem.source": "Admitted asset or supported media source consumed by the host player.",
    "Media.QueueItem.title": "User-visible track title exposed by playback surfaces and host controls.",
    "Media.QueueItem.artist": "User-visible creator or collection label exposed by playback surfaces.",
    "Navigation.Options.routes": "Complete set of unique named routes admitted by the stack.",
    "Navigation.Options.initial": "Route selected when the stack is first created.",
    "Navigation.Options.maximumDepth": "Optional upper bound preventing unbounded route history growth.",
    "Server.Options.deadlineMs": "Optional request deadline after which the operation fails predictably.",
    "Server.Options.idempotencyKey": "Optional stable key allowing a retryable operation to avoid duplicate effects.",
    "Server.Options.retry": "Whether the host may apply its bounded retry policy for eligible failures.",
  }[`${publicName}.${name}`];
  if (exact) return exact;
  const common = {
    kind: "Literal discriminator identifying the exact alternative in this union.",
    id: "Stable identifier used to correlate or address this value across operations.",
    uri: "Canonical host-neutral resource URI derived from the admitted asset.",
    success: "Discriminator that must be checked before reading branch-specific fields.",
    value: "Validated value available on the successful result branch.",
    error: "Bounded failure information, or nil on the successful branch.",
    code: "Stable machine-readable failure code suitable for branching and diagnostics.",
    message: "Bounded human-readable diagnostic that must not be parsed for control flow.",
    version: "Explicit contract version used to validate or migrate the serialized value.",
    fields: "Validated bounded field map carried by the decoded or migrated value.",
    encoded: "Deterministic snapshot string produced after a successful migration.",
    durationMs: "Duration of this motion or delay in milliseconds.",
    iterations: "Number of times the declared sequence or preset repeats.",
    from: "Numeric channel value at the beginning of the transition.",
    to: "Numeric channel value at the end of the transition.",
    easing: "Named interpolation curve used between the start and end values.",
    steps: "Ordered Tween and Wait values executed as one channel sequence.",
    name: "Stable route or entry name used by navigation matching and rendering.",
    params: "Decoded path-parameter values associated with a route entry.",
    query: "Decoded query values associated with a route entry.",
    location: "Canonical path and query location produced or matched by the compiler.",
    changed: "Whether the requested navigation mutation altered the current stack.",
    routes: "Ordered named-route history represented by this snapshot.",
    entries: "Ordered typed route-entry history represented by this snapshot.",
    selectedIndex: "One-based selected queue item, or nil when no item is selected.",
    playback: "Current bounded playback phase reported by the host.",
    positionMs: "Current playback position in milliseconds.",
    durationMs_: "Known media duration in milliseconds, or the declared optional form.",
    state: "Validated typed media state available on the successful decode branch.",
  };
  if (name === "durationMs" && publicName === "Media.State") return common.durationMs_;
  if (common[name]) return common[name];
  if (/^\[/.test(name) || name === "index") return `Index signature mapping ${values}; every key and value must satisfy this contract.`;
  if (values.includes("->")) return `Callable ${name} member exposed by ${publicName}; invoke it through the owning contract rather than replacing internal state.`;
  return `Checked ${name} field of ${publicName}; its exact admitted type is ${values}.`;
}

function typeFields(declaration, publicName) {
  const equals = declaration.indexOf("=");
  const definition = declaration.slice(equals + 1).trim();
  if (!definition.startsWith("{") || !definition.endsWith("}")) {
    return [{ name: "definition", values: definition, description: `Exact alias, union, or callable contract represented by ${publicName}.` }];
  }
  const body = definition.slice(1, -1).trim();
  const fields = splitTopLevel(body.replace(/\n/g, " "));
  if (fields.length === 0) return [{ name: "fields", values: "none", description: "Empty record type." }];
  return fields.map((field) => {
    const separator = field.indexOf(":");
    if (separator < 0) return { name: "index", values: field, description: typeFieldDescription(publicName, "index", field) };
    const name = field.slice(0, separator).trim();
    const values = field.slice(separator + 1).trim();
    return { name, values, description: typeFieldDescription(publicName, name, values) };
  });
}

const propertyGroupTableIds = Object.freeze({
  action: "ui-properties-events",
  columns: "ui-properties-layout",
  input: "ui-properties-input",
  label: "ui-properties-semantics",
  layout: "ui-properties-layout",
  modal: "ui-properties-semantics",
  motion: "ui-properties-events",
  scroll: "ui-properties-layout",
  semantic: "ui-properties-semantics",
  surface: "ui-properties-layout",
  text: "ui-properties-text-style",
  "text-style": "ui-properties-text-style",
  theme: "ui-properties-theme",
  visual: "ui-properties-visual",
});

const uiExamples = Object.freeze({
  "UI.Theme": `local appTheme: UI.Theme = {
    backgroundColor = "#F4EFE3",
    textColor = "#16342E",
    accentColor = "#2F7568",
}

UI.Screen { id = "app/root", theme = appTheme }`,
  "UI.Screen": `return UI.Screen {
    id = "app/root",
    width = "full",
    theme = appTheme,
    documentTitle = "My Luastra app",
    UI.Text { id = "app/title", text = "Hello", variant = "title" },
}`,
  "UI.Column": `UI.Column {
    id = "profile/content",
    width = "full",
    gap = "md",
    align = "center",
    UI.Text { id = "profile/title", text = "Profile", variant = "heading" },
    UI.Text { id = "profile/status", text = "Ready" },
}`,
  "UI.Row": `UI.Row {
    id = "toolbar/actions",
    width = "full",
    gap = "sm",
    justify = "between",
    responsive = true,
    UI.Button { id = "toolbar/back", text = "Back", onTap = "back" },
    UI.Button { id = "toolbar/save", text = "Save", onTap = "save" },
}`,
  "UI.Stack": `UI.Stack {
    id = "article/frame",
    width = "wide",
    gap = "lg",
    UI.Text { id = "article/title", text = "Guide", variant = "title" },
    UI.Text { id = "article/body", text = "Readable content" },
}`,
  "UI.Grid": `UI.Grid {
    id = "catalog/grid",
    width = "full",
    columns = "adaptive",
    gap = "md",
    UI.Card { id = "catalog/one", UI.Text { id = "catalog/one/title", text = "One" } },
    UI.Card { id = "catalog/two", UI.Text { id = "catalog/two/title", text = "Two" } },
}`,
  "UI.Scroll": `UI.Scroll {
    id = "filters/scroll",
    width = "full",
    scroll = "horizontal",
    UI.Row {
        id = "filters/items",
        flow = "nowrap",
        UI.Button { id = "filters/all", text = "All", onTap = "filter-all" },
        UI.Button { id = "filters/new", text = "New", onTap = "filter-new" },
    },
}`,
  "UI.Card": `UI.Card {
    id = "result/card",
    width = "full",
    surface = "elevated",
    padding = "lg",
    gap = "sm",
    UI.Text { id = "result/title", text = "Result", variant = "heading" },
    UI.Text { id = "result/value", text = "42" },
}`,
  "UI.Field": `UI.Field {
    id = "form/email-field",
    label = "Email field",
    gap = "xs",
    UI.Text { id = "form/email-label", text = "Email" },
    UI.TextInput { id = "form/email", label = "Email", value = email, onInput = "email-change" },
}`,
  "UI.Actions": `UI.Actions {
    id = "dialog/actions",
    gap = "sm",
    UI.Button { id = "dialog/cancel", text = "Cancel", appearance = "secondary", onTap = "cancel" },
    UI.Button { id = "dialog/confirm", text = "Confirm", onTap = "confirm" },
}`,
  "UI.Layer": `UI.Layer {
    id = "welcome/layer",
    width = 280,
    height = 380,
    UI.Shape { id = "welcome/background", shape = "roundedRectangle", width = 280, height = 380, fill = "surface" },
    UI.Column { id = "welcome/content", width = "full", align = "center", justify = "center",
        UI.Text { id = "welcome/title", width = "full", textAlign = "center", text = "Welcome" },
    },
}`,
  "UI.Image": `local Assets = require("luastra/assets")

UI.Image {
    id = "card/back",
    source = Assets.uri(Assets.image("image/card-back")),
    width = 274,
    height = 382,
    fit = "cover",
    label = "Card back",
}`,
  "UI.Shape": `UI.Shape {
    id = "status/star",
    shape = "star",
    width = 96,
    height = 96,
    fill = "warning",
    stroke = "accent",
    strokeWidth = 2,
    label = "Achievement",
}`,
  "UI.FlipCard": `UI.FlipCard {
    id = "game/card",
    width = 274,
    height = 382,
    motion = Motion.flip { fromDeg = revealed and 0 or 180, toDeg = revealed and 180 or 0, durationMs = 500 },
    UI.Image { id = "game/card/back", source = cardBack, label = "Hidden card" },
    UI.Shape { id = "game/card/color", shape = "roundedRectangle", width = 274, height = 382, fill = hiddenColor },
}`,
  "UI.Text": `UI.Text {
    id = "page/title",
    width = "full",
    text = "Centered title",
    variant = "title",
    textAlign = "center",
    textColor = "accent",
}`,
  "UI.Button": `UI.Button {
    id = "game/start",
    text = "Start",
    appearance = "primary",
    onTap = "game.start",
    label = "Start the game",
}`,
  "UI.Link": `UI.Link {
    id = "docs/button",
    text = "UI.Button",
    href = "#docs/button",
    onTap = "docs.open-button",
}`,
  "UI.Code": `UI.Code { id = "docs/signature", code = "UI.Button { ... }", language = "Luau" }`,
  "UI.CodeBlock": `UI.CodeBlock { id = "docs/example", code = "local UI = require(\\\"luastra/ui\\\")", language = "Luau" }`,
  "UI.Divider": `UI.Divider { id = "docs/divider", label = "API details" }`,
  "UI.Table": `UI.Table {
    id = "docs/parameters",
    label = "Parameters",
    UI.TableRow {
        id = "docs/parameters/header",
        UI.TableCell {
            id = "docs/parameters/name",
            text = "Name",
            header = true,
            scope = "col",
        },
    },
}`,
  "UI.TableRow": `UI.TableRow {
    id = "docs/row",
    UI.TableCell {
        id = "docs/row/name",
        text = "width",
        header = true,
        scope = "row",
    },
}`,
  "UI.TableCell": `UI.TableCell { id = "docs/cell", text = "full | content | wide" }`,
  "UI.TextInput": `UI.TextInput {
    id = "form/email",
    label = "Email",
    value = email,
    onInput = "form.email-change",
    inputType = "email",
    inputMode = "email",
    enterKeyHint = "next",
    required = true,
}`,
  "UI.List": `UI.List {
    id = "checklist",
    label = "Release checklist",
    UI.ListItem { id = "checklist/check", text = "Run luastra check" },
    UI.ListItem { id = "checklist/test", text = "Run luastra test" },
}`,
  "UI.ListItem": `UI.ListItem {
    id = "steps/build",
    text = "Build the web target",
}`,
  "UI.Modal": `UI.Modal {
    id = "help/modal",
    open = helpOpen,
    label = "Help",
    onDismiss = "help.close",
    UI.Text { id = "help/title", text = "Help", variant = "heading" },
    UI.Button { id = "help/close", text = "Close", onTap = "help.close" },
}`,
  "UI.Orbit": `UI.Orbit {
    id = "map",
    label = "Application map",
    UI.Constellation {
        id = "map/root",
        UI.OrbitCenter { id = "map/root/center", title = "My app" },
        UI.OrbitNode { id = "map/start", title = "Start", onTap = "start" },
    },
}`,
  "UI.OrbitPath": `UI.OrbitPath {
    id = "map/path",
    label = "Orbit path",
    UI.OrbitReturn { id = "map/back", text = "Back", onTap = "back" },
    UI.Text { id = "map/current", text = "Build" },
}`,
  "UI.OrbitSearch": `UI.OrbitSearch {
    id = "map/search",
    query = query,
    resultCount = resultCount,
    totalCount = #nodes,
    onInput = "search",
}`,
  "UI.Constellation": `UI.Constellation {
    id = "map/root",
    layerState = "active",
    UI.OrbitCenter { id = "map/root/center", title = "My app" },
    UI.OrbitNode { id = "map/start", title = "Start", onTap = "start" },
}`,
  "UI.OrbitCenter": `UI.OrbitCenter {
    id = "map/root/center",
    title = "My app",
    description = "Choose a direction.",
}`,
  "UI.OrbitNode": `UI.OrbitNode {
    id = "map/build",
    title = "Build",
    description = "Compose the interface.",
    nodeKind = "constellation",
    signalIcon = "spark",
    priority = 1,
    onTap = "open-build",
}`,
  "UI.OrbitCluster": `UI.OrbitCluster {
    id = "map/examples",
    title = "Examples",
    count = 48,
    signalIcon = "grid",
    onTap = "open-examples",
}`,
  "UI.FocusSurface": `UI.FocusSurface {
    id = "map/focus",
    label = "Build details",
    open = focused,
    onDismiss = "close-focus",
    UI.FocusHeader {
        id = "map/focus/header",
        UI.Text { id = "map/focus/title", text = "Build", variant = "heading" },
        UI.Button { id = "map/focus/close", text = "Back", onTap = "close-focus" },
    },
}`,
  "UI.FocusHeader": `UI.FocusHeader {
    id = "map/focus/header",
    UI.Text { id = "map/focus/title", text = "Build", variant = "heading" },
    UI.Button { id = "map/focus/close", text = "Back", onTap = "close-focus" },
}`,
  "UI.OrbitReturn": `UI.OrbitReturn {
    id = "map/back",
    text = "Back",
    onTap = "back",
    disabled = atRoot,
}`,
});

const apiExamples = Object.freeze({
  "Assets.image": `local Assets = require("luastra/assets")\nlocal cardBack = Assets.image("image/card-back")`,
  "Assets.audio": `local Assets = require("luastra/assets")\nlocal intro = Assets.audio("audio/intro")`,
  "Assets.font": `local Assets = require("luastra/assets")\nlocal displayFont = Assets.font("font/display")`,
  "Assets.uri": `local Assets = require("luastra/assets")\nlocal source = Assets.uri(Assets.audio("audio/intro"))`,
  "Data.string": `local Data = require("luastra/data")\nlocal title = Data.string { minBytes = 1, maxBytes = 80, trim = true }`,
  "Data.number": `local Data = require("luastra/data")\nlocal score = Data.number { integer = true, min = 0, max = 100 }`,
  "Data.boolean": `local Data = require("luastra/data")\nlocal enabled = Data.boolean()`,
  "Data.array": `local Data = require("luastra/data")\nlocal tags = Data.array(Data.string { maxBytes = 40 }, { maxItems = 12 })`,
  "Data.object": `local Data = require("luastra/data")\nlocal form = Data.object({ name = Data.string { minBytes = 1 }, active = Data.boolean() })`,
  "Data.optional": `local Data = require("luastra/data")\nlocal note = Data.optional(Data.string { maxBytes = 240 })`,
  "Data.decode": `local Data = require("luastra/data")
local validatedScore: number? = nil
local result = Data.decode(
    Data.number { integer = true, min = 0 },
    42
)
if result.success then
    validatedScore = result.value
end`,
  "Debug.log": `local Debug = require("luastra/debug")\nDebug.log("game", "round started")`,
  "Debug.warn": `local Debug = require("luastra/debug")\nDebug.warn("storage", "snapshot was empty")`,
  "Debug.error": `local Debug = require("luastra/debug")\nDebug.error("server", "request failed")`,
  "Timer.start": `local Timer = require("luastra/timer")\nTimer.start { id = "game/next-card", delayMs = 1500, value = "advance" }`,
  "Timer.restart": `local Timer = require("luastra/timer")\nTimer.restart { id = "game/next-card", delayMs = 1500, value = "advance" }`,
  "Timer.cancel": `local Timer = require("luastra/timer")\nTimer.cancel("game/next-card")`,
  "Motion.tween": `local Motion = require("luastra/motion")\nlocal grow = Motion.tween { from = 1, to = 1.08, durationMs = 300, easing = "easeOutCubic" }`,
  "Motion.wait": `local Motion = require("luastra/motion")\nlocal pause = Motion.wait(500)`,
  "Motion.sequence": `local Motion = require("luastra/motion")\nlocal reveal = Motion.sequence({\n    Motion.wait(300),\n    Motion.tween { from = 0, to = 180, durationMs = 500 },\n}, 1)\nlocal motion = { rotationYDeg = reveal }`,
  "Motion.fadeIn": `local Motion = require("luastra/motion")\nlocal motion = Motion.fadeIn { durationMs = 240 }`,
  "Motion.slideIn": `local Motion = require("luastra/motion")\nlocal motion = Motion.slideIn { y = 24, durationMs = 300 }`,
  "Motion.scaleIn": `local Motion = require("luastra/motion")\nlocal motion = Motion.scaleIn { from = 0.92, durationMs = 220 }`,
  "Motion.sway": `local Motion = require("luastra/motion")\nlocal motion = Motion.sway { angleDeg = 2, durationMs = 2400, iterations = 0 }`,
  "Motion.pulse": `local Motion = require("luastra/motion")\nlocal motion = Motion.pulse { scale = 1.05, durationMs = 1800, iterations = 0 }`,
  "Motion.shake": `local Motion = require("luastra/motion")\nlocal motion = Motion.shake { distance = 8, durationMs = 360 }`,
  "Motion.flip": `local Motion = require("luastra/motion")\nlocal motion = Motion.flip { fromDeg = 0, toDeg = 180, durationMs = 500 }`,
  "Navigation.decideBack": `local Navigation = require("luastra/navigation")\nlocal decision = Navigation.decideBack { modalOpen = helpOpen, canBack = navigation.canBack() }`,
  "Navigation.create": `local Navigation = require("luastra/navigation")
local navigation = Navigation.create {
    routes = { "home", "game" },
    initial = "home",
}
navigation.push("game")`,
  "Navigation.compile": `local Navigation = require("luastra/navigation")
local compiler = Navigation.compile {
    { name = "home", path = "/" },
    { name = "card", path = "/card/:id" },
}`,
  "Navigation.createRouter": `local Navigation = require("luastra/navigation")
local router = Navigation.createRouter {
    compiler = compiler,
    initial = {
        name = "home",
        params = {},
        query = {},
    },
}`,
  "State.encode": `local State = require("luastra/state")\nlocal snapshot = State.encode(1, { score = tostring(score), screen = "game" })`,
  "State.decode": `local State = require("luastra/state")\nlocal restored = State.decode(snapshot, 1)\nif restored.success then score = tonumber(restored.fields.score) or 0 end`,
  "State.migrate": `local State = require("luastra/state")\nlocal result = State.migrate(oldSnapshot, 2, { [1] = function(fields) return { score = fields.score or "0" } end })`,
  "Host.storageGet": `local Host = require("luastra/host")\nlocal requestId = Host.storageGet("game-state")`,
  "Host.storageSet": `local Host = require("luastra/host")\nlocal requestId = Host.storageSet("game-state", snapshot)`,
  "Host.launchUrl": `local Host = require("luastra/host")
local launchRequestId = Host.launchUrl()

function Application.resolve(id: number, success: boolean, payload: string)
    if id == launchRequestId and success then applyLaunchLocation(payload) end
end`,
  "Host.clipboardWrite": `local Host = require("luastra/host")\nlocal requestId = Host.clipboardWrite("luastra check")`,
  "Host.historyPush": `local Host = require("luastra/host")\nHost.historyPush(router.encode())`,
  "Host.historyReplace": `local Host = require("luastra/host")\nHost.historyReplace(router.encode())`,
  "Host.historyPushLocation": `local Host = require("luastra/host")\nHost.historyPushLocation("#/card/red", router.encode())`,
  "Host.historyReplaceLocation": `local Host = require("luastra/host")\nHost.historyReplaceLocation("#/", router.encode())`,
  "Host.historyBack": `local Host = require("luastra/host")\nHost.historyBack()`,
  "Host.historyCurrent": `local Host = require("luastra/host")\nlocal requestId = Host.historyCurrent()`,
  "Host.systemBackHandled": `local Host = require("luastra/host")\nHost.systemBackHandled(intentId)`,
  "Host.systemBackHistory": `local Host = require("luastra/host")\nHost.systemBackHistory(intentId)`,
  "Host.systemBackExit": `local Host = require("luastra/host")\nHost.systemBackExit(intentId)`,
  "Server.call": `local Server = require("luastra/server")\nlocal requestId = Server.call("records.list.v1", { cursor = "" }, { deadlineMs = 3000, retry = true })`,
  "Server.decode": `local Server = require("luastra/server")
local result = Server.decode(payload)
if result.success then records = result.fields else errorMessage = result.error end`,
  "Media.setQueue": `local Media = require("luastra/media")\nMedia.setQueue({ { id = "intro", source = "asset:audio/intro", title = "Intro", artist = "Luastra" } })`,
  "Media.play": `local Media = require("luastra/media")\nMedia.play()`,
  "Media.pause": `local Media = require("luastra/media")\nMedia.pause()`,
  "Media.stop": `local Media = require("luastra/media")\nMedia.stop()`,
  "Media.unload": `local Media = require("luastra/media")\nMedia.unload()`,
  "Media.next": `local Media = require("luastra/media")\nMedia.next()`,
  "Media.previous": `local Media = require("luastra/media")\nMedia.previous()`,
  "Media.state": `local Media = require("luastra/media")\nlocal requestId = Media.state()`,
  "Media.seek": `local Media = require("luastra/media")\nMedia.seek(30_000)`,
  "Media.decodeState": `local Media = require("luastra/media")
local result = Media.decodeState(payload)
if result.success then positionMs = result.state.positionMs else errorMessage = result.error end`,
});

const layoutParameters = [
  "gap", "padding", "margin", "paddingX / paddingY", "paddingTop / paddingBottom / paddingStart / paddingEnd",
  "marginX / marginY", "marginTop / marginBottom / marginStart / marginEnd", "surface", "width", "align",
  "justify", "flow", "responsive", "className",
];
const semanticParameters = ["tone", "appearance", "variant", "role", "label", "hidden", "disabled", "busy", "required", "errorId"];
const colorParameters = ["textAlign", "textColor", "backgroundColor", "Color tokens"];
const motionParameters = ["motion"];
const containerParameters = [...layoutParameters, ...semanticParameters, "textColor", "backgroundColor", "Color tokens"];
const boxParameters = [
  "padding", "margin", "paddingX / paddingY", "paddingTop / paddingBottom / paddingStart / paddingEnd",
  "marginX / marginY", "marginTop / marginBottom / marginStart / marginEnd", "surface", "width", "className",
];
const framedParameters = [
  "margin", "marginX / marginY", "marginTop / marginBottom / marginStart / marginEnd", "className",
];
const uiAllowedInheritedParameters = Object.freeze({
  "UI.Screen": [...layoutParameters, ...semanticParameters, "theme", "backgroundColor", "textColor", "accentColor", "dangerColor", "mutedColor", "surfaceColor", "successColor", "warningColor"],
  "UI.Column": containerParameters,
  "UI.Row": containerParameters,
  "UI.Stack": containerParameters,
  "UI.Grid": [...containerParameters, "columns"],
  "UI.Scroll": [...containerParameters, "scroll"],
  "UI.Card": [...containerParameters, ...motionParameters],
  "UI.Field": containerParameters,
  "UI.Actions": containerParameters,
  "UI.Layer": [...containerParameters, ...motionParameters],
  "UI.Image": [...framedParameters, "source", "fit", "width / height", "aspectRatio", "cornerRadius", "label", "hidden", ...motionParameters],
  "UI.Shape": [...framedParameters, "width / height", "cornerRadius", "shape", "fill / stroke", "strokeWidth", "label", "hidden", ...motionParameters],
  "UI.FlipCard": [...framedParameters, "width / height", "aspectRatio", "label", "role", "hidden", ...motionParameters],
  "UI.Text": [...boxParameters, ...colorParameters, "tone", "variant", "role", "label", "hidden", "busy", ...motionParameters],
  "UI.Button": [...boxParameters, "textColor", "backgroundColor", "Color tokens", "icon", "onTap", "appearance", "label", "hidden", "disabled", "busy", ...motionParameters],
  "UI.Link": [...boxParameters, "textColor", "backgroundColor", "Color tokens", "onTap", "label", "hidden", "busy", ...motionParameters],
  "UI.Code": [...boxParameters, "textColor", "backgroundColor", "Color tokens", "role", "label", "hidden", ...motionParameters],
  "UI.CodeBlock": [...layoutParameters, "textColor", "backgroundColor", "Color tokens", "role", "label", "hidden"],
  "UI.Divider": [...boxParameters, "label", "hidden", ...motionParameters],
  "UI.Table": [...containerParameters],
  "UI.TableRow": [...layoutParameters, "textColor", "backgroundColor", "Color tokens", "hidden"],
  "UI.TableCell": [...layoutParameters, "textColor", "backgroundColor", "Color tokens", "role", "hidden"],
  "UI.TextInput": [...boxParameters, "inputType", "inputMode", "enterKeyHint", "autoComplete", "value", "onInput", "label", "hidden", "disabled", "busy", "required", "errorId", ...motionParameters],
  "UI.List": [...containerParameters],
  "UI.ListItem": [...containerParameters],
  "UI.Modal": [...boxParameters, "onDismiss", "label", "hidden", "busy", "textColor", "backgroundColor", "Color tokens", ...motionParameters],
  "UI.Orbit": [...containerParameters],
  "UI.OrbitPath": [...containerParameters],
  "UI.OrbitSearch": [...boxParameters, "hidden"],
  "UI.Constellation": [...framedParameters, "label", "hidden"],
  "UI.OrbitCenter": [...boxParameters, "hidden"],
  "UI.OrbitNode": [...boxParameters, "onTap", "label", "hidden", "disabled", "busy"],
  "UI.OrbitCluster": [...boxParameters, "onTap", "label", "hidden", "disabled", "busy"],
  "UI.FocusSurface": [...boxParameters, "onDismiss", "label", "hidden", "busy"],
  "UI.FocusHeader": [...containerParameters],
  "UI.OrbitReturn": [...boxParameters, "onTap", "label", "hidden", "disabled", "busy"],
});

const direct = (name, values, description) => ({ name, values, description });
const uiDirectParameters = Object.freeze({
  "UI.Screen": [
    direct("id", "lowercase path, required", "Unique root-node ID."),
    direct("documentTitle", "string 1…160 bytes", "Document or window title; by default the host preserves its own title."),
    direct("documentDescription", "string 1…320 bytes", "Optional page description for web metadata."),
    direct("documentLanguage", "language tag", "Optional document language, for example en or en-US."),
    direct("children", "UI.Node[]", "Screen content. Application.render returns exactly one Screen."),
  ],
  "UI.Column": [direct("id", "lowercase path, required", "Unique ID."), direct("children", "UI.Node[]", "Items are arranged from top to bottom.")],
  "UI.Row": [direct("id", "lowercase path, required", "Unique ID."), direct("children", "UI.Node[]", "Items flow from left to right and may wrap.")],
  "UI.Stack": [direct("id", "lowercase path, required", "Unique ID."), direct("children", "UI.Node[]", "Vertical stack; semantically equivalent to Column.")],
  "UI.Grid": [direct("id", "lowercase path, required", "Unique ID."), direct("children", "UI.Node[]", "Cards or other repeated grid items.")],
  "UI.Scroll": [direct("id", "lowercase path, required", "Unique ID."), direct("children", "UI.Node[]", "Content of the scrollable region.")],
  "UI.Card": [direct("id", "lowercase path, required", "Unique ID."), direct("children", "UI.Node[]", "Content of one visual card.")],
  "UI.Field": [direct("id", "lowercase path, required", "Unique field-group ID."), direct("children", "label + input + hint/error", "Related elements of one form field.")],
  "UI.Actions": [direct("id", "lowercase path, required", "Unique ID."), direct("children", "Button | Link[]", "Group of primary and secondary actions.")],
  "UI.Layer": [direct("id", "lowercase path, required", "Unique ID."), direct("children", "UI.Node[]", "The first child defines the bounds; later children overlay the same area.")],
  "UI.Image": [direct("id", "lowercase path, required", "Unique ID."), direct("source", "asset:image/... required", "URI from Assets.uri(Assets.image(...))."), direct("label", "string, required", "Accessible description; an empty string marks a decorative image.")],
  "UI.Shape": [direct("id", "lowercase path, required", "Unique ID."), direct("shape", "supported shape, required", "Shape geometry."), direct("width", "number 1…4096, required", "Width in CSS pixels."), direct("height", "number 1…4096, required", "Height in CSS pixels.")],
  "UI.FlipCard": [direct("id", "lowercase path, required", "Unique ID."), direct("children", "exactly 2 UI.Node", "First child is the front and second is the back; FlipCard owns the size.")],
  "UI.Text": [direct("id", "lowercase path, required", "Unique ID."), direct("text", "string, required", "Visible text; use \\n for an explicit line break.")],
  "UI.Button": [direct("id", "lowercase path, required", "Unique ID."), direct("text", "string?", "Visible button label; may be omitted when icon and label are provided."), direct("icon", "activity | palette | pause?", "Host-rendered semantic icon. An icon-only button requires label."), direct("onTap", "action string, required", "Action delivered to Application.handle after activation.")],
  "UI.Link": [direct("id", "lowercase path, required", "Unique link ID."), direct("text", "string, required", "Visible link text."), direct("href", "#fragment | #/route | HTTPS URL, required", "Safe internal fragment, canonical application hash route, or external HTTPS destination."), direct("external", "boolean?", "Opens an external destination according to host policy."), direct("onTap", "action string?", "Optional admitted action delivered when the link is activated.")],
  "UI.Code": [direct("id", "lowercase path, required", "Unique ID."), direct("code", "string ≤ 4096 bytes, required", "Inline source text rendered without interpretation."), direct("language", "safe language name?", "Optional source-language label.")],
  "UI.CodeBlock": [direct("id", "lowercase path, required", "Unique ID."), direct("code", "string ≤ 4096 bytes, required", "Multiline source text rendered without interpretation."), direct("language", "safe language name?", "Optional source-language label.")],
  "UI.Divider": [direct("id", "lowercase path, required", "Unique ID."), direct("label", "string?", "Optional accessible name; omit it for a decorative divider.")],
  "UI.Table": [direct("id", "lowercase path, required", "Unique ID."), direct("children", "UI.TableRow[]", "Table rows only.")],
  "UI.TableRow": [direct("id", "lowercase path, required", "Unique ID."), direct("children", "UI.TableCell[]", "Table cells only.")],
  "UI.TableCell": [direct("id", "lowercase path, required", "Unique ID."), direct("text", "string?", "Short cell text when nested content is unnecessary."), direct("header", "boolean?", "Marks this cell as a row or column header."), direct("scope", "col | row?", "Associates a header cell with its column or row."), direct("children", "UI.Node[]", "Optional nested nodes instead of short text.")],
  "UI.TextInput": [direct("id", "lowercase path, required", "Unique field ID."), direct("label", "string, required", "Accessible field name."), direct("value", "string, required", "Controlled value from application state."), direct("onInput", "action string, required", "Receives committed composition-safe input in Application.handle.")],
  "UI.List": [direct("id", "lowercase path, required", "Unique ID."), direct("children", "UI.ListItem[]", "List items only.")],
  "UI.ListItem": [direct("id", "lowercase path, required", "Unique ID."), direct("text", "string?", "Short text; children may be supplied instead.")],
  "UI.Modal": [direct("id", "lowercase path, required", "Unique dialog ID."), direct("open", "boolean, required", "Shows or hides the modal."), direct("label", "string, required", "Accessible dialog name."), direct("children", "UI.Node[]", "Heading, content, and close action.")],
  "UI.Orbit": [direct("id", "lowercase path, required", "Unique Orbit ID."), direct("presentation", "auto | spatial | list?", "Preferred presentation; unsafe spatial geometry still falls back to list."), direct("orbitTheme", "built-in theme ID?", "One of the curated Orbit themes."), direct("orbitMotion", "system | off?", "Orbit-owned motion preference."), direct("maxVisible", "integer 4…32?", "Density bound before list fallback."), direct("children", "OrbitPath | OrbitSearch | Constellation | FocusSurface[]", "Orbit experience content with at least one constellation.")],
  "UI.OrbitPath": [direct("id", "lowercase path, required", "Unique path ID."), direct("children", "Button | Text[]", "Return controls, current depth, and stable Orbit preferences.")],
  "UI.OrbitSearch": [direct("id", "lowercase path, required", "Unique search ID."), direct("query", "string ≤ 160 bytes?", "Controlled local query."), direct("resultCount", "non-negative integer, required", "Visible matching node count."), direct("totalCount", "integer ≥ resultCount, required", "Total node count before filtering."), direct("label", "string?", "Accessible input name."), direct("placeholder", "string?", "Visible empty-query hint."), direct("onInput", "action string, required", "Committed query action.")],
  "UI.Constellation": [direct("id", "lowercase path, required", "Unique constellation ID."), direct("layerState", "active | behind | ahead?", "Current transition and accessibility state."), direct("depth", "integer 0…32?", "Semantic navigation depth."), direct("children", "one OrbitCenter + 1…64 OrbitNode or OrbitCluster", "Complete content of this navigation depth.")],
  "UI.OrbitCenter": [direct("id", "lowercase path, required", "Unique center ID."), direct("title", "string 1…160 bytes, required", "Current constellation identity."), direct("description", "string ≤ 320 bytes?", "Optional supporting summary.")],
  "UI.OrbitNode": [direct("id", "lowercase path, required", "Unique node ID."), direct("title", "string 1…160 bytes, required", "Stable node identity."), direct("description", "string ≤ 320 bytes?", "Supporting Preview content."), direct("nodeKind", "constellation | leaf | action?", "Semantic activation kind."), direct("priority", "integer 1…3?", "Detail and placement importance; one is highest."), direct("ring", "integer 1…3?", "Optional authoritative ring hint."), direct("relatedTo", "component ID[] 1…8?", "Neutral same-constellation relationships."), direct("signalIcon", "bounded icon name?", "Host-rendered compact Signal icon."), direct("status", "string 1…80 bytes?", "Human-readable state."), direct("statusTone", "neutral | active | success | warning | error?", "Redundant visual state treatment."), direct("selected", "boolean?", "Current leaf selection."), direct("onTap", "action string, required", "Semantic activation action.")],
  "UI.OrbitCluster": [direct("id", "lowercase path, required", "Unique cluster ID."), direct("title", "string 1…160 bytes, required", "Stable group identity."), direct("count", "integer 1…9999, required", "Authored group item count."), direct("priority", "integer 1…3?", "Detail and placement importance."), direct("ring", "integer 1…3?", "Optional authoritative ring hint."), direct("relatedTo", "component ID[] 1…8?", "Neutral same-constellation relationships."), direct("signalIcon", "bounded icon name?", "Host-rendered compact Signal icon."), direct("status", "string 1…80 bytes?", "Human-readable state."), direct("statusTone", "neutral | active | success | warning | error?", "Redundant visual state treatment."), direct("onTap", "action string, required", "Opens the authored local constellation.")],
  "UI.FocusSurface": [direct("id", "lowercase path, required", "Unique focus dialog ID."), direct("open", "boolean?", "Whether the Focus Surface is visible."), direct("label", "string, required", "Accessible dialog name."), direct("onDismiss", "action string, required", "Dismissal action shared by host gestures and application controls."), direct("children", "UI.Node[]", "FocusHeader followed by full leaf content.")],
  "UI.FocusHeader": [direct("id", "lowercase path, required", "Unique header ID."), direct("children", "one heading Text + one available Button", "Sticky visible identity and return action.")],
  "UI.OrbitReturn": [direct("id", "lowercase path, required", "Unique return-control ID."), direct("text", "string, required", "Visible ancestor label."), direct("onTap", "action string, required", "Canonical return action.")],
});

const uiAccessibility = Object.freeze({
  "UI.Screen": "Creates the main landmark and owns document language and metadata. Keep one meaningful h1 on each page.",
  "UI.Text": "variant creates the real h1/h2/h3 hierarchy; textAlign changes visual alignment only, not reading order.",
  "UI.Button": "Keeps native button semantics, keyboard activation, and visible focus. Do not replace it with a tappable Shape.",
  "UI.Link": "Keeps native link semantics. Its visible text should explain the destination without relying on surrounding prose.",
  "UI.TextInput": "label is required. required, disabled, and errorId expose state to screen readers; an error hint should be a visible role=alert.",
  "UI.Image": "label is required; use an empty string only for a genuinely decorative image.",
  "UI.Modal": "The host traps focus inside the open dialog, Escape invokes onDismiss, and closing restores focus to the trigger.",
  "UI.Orbit": "The host preserves one semantic model across spatial and list presentations and isolates every inactive constellation from interaction.",
  "UI.OrbitSearch": "The generated result summary is a live status; Escape clears a non-empty query before it performs Orbit return navigation.",
  "UI.Constellation": "Only the active layer remains interactive and exposed to assistive technology; source order remains the list and reading order.",
  "UI.OrbitNode": "The complete title, description, status, relationships, and native button semantics remain accessible at every semantic zoom tier.",
  "UI.OrbitCluster": "The group title and item count form one accessible button name; cluster membership and navigation remain application-authored.",
  "UI.FocusSurface": "The host names the dialog from its visible heading, traps focus, supports Escape, and restores focus to the originating node.",
  "UI.FocusHeader": "The heading precedes the available return button in reading and focus order even while the header remains visually sticky.",
  "UI.OrbitReturn": "Uses native button semantics and the same Luau action that the host invokes for an eligible Escape return.",
  "UI.Table": "TableRow and TableCell create a real table; header and scope associate headers with columns and rows.",
  "UI.TableRow": "Does not create a separate accessible name; its header cells establish the row meaning.",
  "UI.TableCell": "For a header, set header=true and the appropriate scope=col or scope=row.",
  "UI.List": "Creates a real list; provide label when a nearby heading does not make the list purpose clear.",
  "UI.ListItem": "Must be a direct child of UI.List to preserve correct list semantics.",
  "UI.Divider": "Without label it is decorative; add label only when the divider itself carries meaning.",
});

const uiMistakes = Object.freeze({
  "UI.Screen": ["Returning multiple roots instead of one UI.Screen.", "Expecting width=content on Screen to produce a full-viewport background."],
  "UI.Column": ["Confusing align with vertical alignment: Column uses justify on its vertical axis.", "Expecting Text to center without giving it available width."],
  "UI.Row": ["Confusing align with horizontal alignment: Row uses justify on its horizontal axis.", "Forgetting responsive=true for narrow phones."],
  "UI.Layer": ["Leaving the first child unsized while expecting a stable shared frame.", "Expecting padding on one overlay child to constrain every sibling."],
  "UI.Image": ["Passing a filesystem path or URL instead of an admitted asset URI.", "Omitting the required label."],
  "UI.Shape": ["Using Shape as a button and losing button semantics.", "Omitting the required width and height."],
  "UI.FlipCard": ["Passing anything other than exactly two sides.", "Sizing only a child Shape instead of the FlipCard itself."],
  "UI.Text": ["Treating textAlign=center as node positioning; it aligns lines only within Text width.", "Creating a visual heading without the matching variant."],
  "UI.Button": ["Using uppercase letters or spaces in the onTap action.", "Duplicating the same id across render branches."],
  "UI.TextInput": ["Changing value outside application state.", "Treating intermediate IME composition as committed text."],
  "UI.Modal": ["Removing the close button and relying only on Escape.", "Rendering interactive content outside and above an open modal."],
  "UI.Orbit": ["Adding application-owned absolute coordinates.", "Assuming spatial mode is guaranteed when bounds require the list fallback."],
  "UI.OrbitSearch": ["Filtering only the visual layer while leaving hidden nodes interactive.", "Putting the query into host-only state instead of Luau state."],
  "UI.Constellation": ["Rendering more than one center.", "Referencing a related node outside the same constellation."],
  "UI.OrbitNode": ["Using a single letter instead of a bounded signalIcon.", "Encoding essential status only through statusTone color."],
  "UI.OrbitCluster": ["Using a cluster as visual decoration without a semantic group.", "Supplying a count that does not match the authored destination."],
  "UI.FocusSurface": ["Opening it outside navigation state.", "Removing the explicit return control and relying only on Escape."],
  "UI.FocusHeader": ["Using a non-heading Text for the title.", "Disabling or hiding the required return button."],
  "UI.OrbitReturn": ["Keeping it enabled at the root without a return destination.", "Using a different action from system or keyboard Back."],
});

function uiGuidance(name) {
  if (!name?.startsWith("UI.")) return {};
  const directParameters = uiDirectParameters[name] ?? [];
  const children = directParameters.find((parameter) => parameter.name === "children");
  return {
    mentalModel: "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    childRules: children?.description ?? "This component does not accept arbitrary child nodes; named parameters provide its content.",
    accessibility: uiAccessibility[name] ?? "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    commonMistakes: uiMistakes[name] ?? ["Using a duplicate id or an uppercase path segment.", "Passing a shared-group parameter that is not listed on this component page."],
  };
}

const hostCapabilities = Object.freeze({
  "Host.storageGet": "storage.get",
  "Host.storageSet": "storage.set",
  "Host.launchUrl": "app.launchurl.get",
  "Host.clipboardWrite": "clipboard.write",
  "Host.historyPush": "navigation.history",
  "Host.historyReplace": "navigation.history",
  "Host.historyPushLocation": "navigation.history",
  "Host.historyReplaceLocation": "navigation.history",
  "Host.historyBack": "navigation.history",
  "Host.historyCurrent": "navigation.history",
  "Host.systemBackHandled": "navigation.history",
  "Host.systemBackHistory": "navigation.history",
  "Host.systemBackExit": "navigation.history",
});

function operationalGuidance(name, moduleName, kind) {
  if (typeof moduleName !== "string" || !moduleName.startsWith("luastra/")) return {};
  const dependency = `Add ${moduleName} to this module's dependencies in luastra.json, then import it with require(\"${moduleName}\").`;
  const typePage = kind === "type";
  if (moduleName === "luastra/ui") return {
    beforeYouUse: `${dependency} The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.`,
    lifecycle: typePage
      ? "This type exists during Luau analysis and documents values used by UI constructors or Application.render. It is erased from the runtime bundle as a static type."
      : "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    expectedOutcome: typePage ? "A checked annotation that matches the exact exported declaration." : "A validated declarative node appears after it is returned as part of the current render tree.",
    failureGuidance: typePage ? "If the annotation fails, compare the value with the exact declaration and the producing or consuming function." : "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    availability: name.startsWith("UI.Orbit") || name === "UI.Constellation" || name === "UI.FocusSurface" || name === "UI.FocusHeader"
      ? `Experimental Constellation Orbit API in ${release.publishedVersion}. Verify it against the selected SDK before depending on its shape.`
      : `Public-source alpha API in ${release.publishedVersion}. Verify host-specific behavior against the selected release.`,
  };
  if (moduleName === "luastra/assets") return {
    beforeYouUse: `${dependency} Declare the referenced file in luastra.json with its stable asset id and admitted media type. Image assets are PNG, JPEG, WebP, or AVIF; audio assets and WOFF2 fonts use their own declared types.`,
    lifecycle: typePage ? "Asset types describe checked references and are erased after Luau analysis." : "The constructor validates an asset id and returns a typed reference synchronously. It does not read a file. Assets.uri exposes the packaged asset URI for a consuming UI or Media API.",
    expectedOutcome: typePage ? "A type-safe image, audio, font, or union reference." : "A checked reference or canonical asset URI that a compatible API can consume.",
    failureGuidance: "A malformed id, missing manifest entry, wrong media kind, unsupported media type, or missing source file fails during project checking or packaging. Assets.font is packaged and typed, but this candidate has no public text-style consumer for custom fonts yet.",
    availability: `Public-source alpha API in ${release.publishedVersion}; supported consumers vary by asset kind.`,
  };
  if (moduleName === "luastra/data") return {
    beforeYouUse: `${dependency} No host capability is required. Define schemas outside render when they are reused.`,
    lifecycle: typePage ? "The exported type describes schemas or the tagged success/failure result returned by Data.decode." : name === "Data.decode" ? "Data.decode validates an untrusted value synchronously. Branch on result.success before reading result.value or result.error." : "This pure constructor returns an immutable schema synchronously; Data.decode performs the actual validation later.",
    expectedOutcome: typePage ? "A checked schema/result annotation." : name === "Data.decode" ? "A tagged success containing a trusted value, or a failure containing a bounded code and path." : "An immutable schema ready to compose or pass to Data.decode.",
    failureGuidance: "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    availability: `Public-source alpha API in ${release.publishedVersion}; host-independent and synchronous.`,
  };
  if (moduleName === "luastra/debug") return {
    beforeYouUse: `${dependency} No additional host capability is required. Keep user-visible errors in UI state rather than relying on a developer console.`,
    lifecycle: "The call writes a synchronous development diagnostic. It neither changes application state nor throws merely because the error log level is used.",
    expectedOutcome: "A prefixed diagnostic appears in the active host's development log.",
    failureGuidance: "Never include secrets or personal data. Logging is not telemetry, recovery, or user-facing error handling, and host presentation may differ.",
    availability: `Public-source alpha diagnostic API in ${release.publishedVersion}.`,
  };
  if (moduleName === "luastra/timer") return {
    beforeYouUse: `${dependency} Declare timer.control in luastra.json and implement Application.handle for timer events. The maximum delay is 60,000 ms.`,
    lifecycle: typePage ? "Timer types describe the options or acknowledgement identifier." : "start, restart, and cancel return an acknowledgement RequestId, but timer.control completions are intentionally not delivered to Application.resolve. A one-shot expiry arrives later as Application.handle(\"timer\", timerId, value).",
    expectedOutcome: typePage ? "A checked timer option or acknowledgement annotation." : "The requested timer operation is acknowledged; an uncancelled start or restart later emits one timer event.",
    failureGuidance: "Missing timer.control, an invalid lowercase timer id, a delay outside 0..60000, or an oversized value fails before a timer event is scheduled. Treat late events as stale if the owning state has already changed.",
    availability: `Public-source alpha API in ${release.publishedVersion}; exact background timing remains host-dependent.`,
  };
  if (moduleName === "luastra/motion") return {
    beforeYouUse: `${dependency} Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.`,
    lifecycle: typePage ? "Motion types describe immutable timing data and are erased after analysis." : "The function returns immutable motion data synchronously. Assign a preset MotionMap directly, or place Tween/Sequence values under supported motion channel names; the host animates without rerunning Application.render on every frame.",
    expectedOutcome: typePage ? "A checked descriptor, sequence, channel map, or easing value." : "A descriptor or MotionMap ready to attach to a supported UI node.",
    failureGuidance: "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    availability: `Public-source alpha API in ${release.publishedVersion}; presentation follows host and reduced-motion policy.`,
  };
  if (moduleName === "luastra/navigation") return {
    beforeYouUse: `${dependency} No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.`,
    lifecycle: typePage ? "The type describes a route, stack, compiler, or checked result used by navigation operations." : "The operation updates or creates application-owned navigation state synchronously. Keep stacks and compilers outside Application.render, inspect every result.success field, then render from the accepted current entry.",
    expectedOutcome: typePage ? "A checked route/navigation annotation." : "A validated compiler, stack, decision, or result record; host history changes only when the application requests them separately.",
    failureGuidance: "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    availability: `Public-source alpha API in ${release.publishedVersion}; URL integration is a separate host capability.`,
  };
  if (moduleName === "luastra/state") return {
    beforeYouUse: `${dependency} No capability is required for encoding, decoding, or migration. Persistence additionally needs luastra/host plus storage.get and storage.set.`,
    lifecycle: typePage ? "The type describes string fields, migration functions, or tagged decode/migration results." : "State operations run synchronously over bounded string fields. Encode before storage; after a read, decode or migrate and branch on success before mutating trusted application state.",
    expectedOutcome: typePage ? "A checked snapshot or result annotation." : "A deterministic encoded snapshot or a tagged success/failure result.",
    failureGuidance: "Malformed data, wrong versions, missing migration steps, excessive size, or non-string fields remain explicit failure branches. Do not silently replace corrupt security- or domain-sensitive values with defaults.",
    availability: `Public-source alpha API in ${release.publishedVersion}; persistence support is host-dependent.`,
  };
  if (moduleName === "luastra/host") {
    const capability = hostCapabilities[name] ?? "the capability named on the function page";
    return {
      beforeYouUse: `${dependency} Declare ${capability} in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.`,
      lifecycle: typePage ? "Host.RequestId is an opaque correlation value for one asynchronous host operation." : "The function starts an asynchronous host request and returns immediately. Application.resolve receives its success payload or stable failure code; availability and permission can vary by host.",
      expectedOutcome: typePage ? "An opaque positive request identifier used only for correlation." : "A RequestId now, followed later by one matching Application.resolve completion.",
      failureGuidance: "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
      availability: `Public-source alpha capability API in ${release.publishedVersion}; verify each claimed host independently.`,
    };
  }
  if (moduleName === "luastra/server") return {
    beforeYouUse: `${dependency} Declare rpc.call in luastra.json. Server.call also requires a declared backend operation and deployed trusted handler; save its RequestId and implement Application.resolve.`,
    lifecycle: typePage ? "The type describes request options or the tagged envelope-decoding result." : name === "Server.call" ? "Server.call starts asynchronous trusted work. Application.resolve reports transport success or failure; decode a successful payload with Server.decode and then validate operation-specific fields." : "Server.decode synchronously validates only the Luastra response envelope and returns fields on success; it does not validate your domain model.",
    expectedOutcome: typePage ? "A checked request/result annotation." : name === "Server.call" ? "A RequestId now, then one resolve completion from the configured backend." : "A tagged result containing result.fields or a bounded decode error.",
    failureGuidance: "Handle transport failure, envelope decode failure, and domain validation failure separately. The static web build does not deploy trusted backend handlers, credentials, or production operations for you.",
    availability: `Public-source alpha API in ${release.publishedVersion}; production backend deployment remains application-owned.`,
  };
  if (moduleName === "luastra/media") return {
    beforeYouUse: `${dependency} Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.`,
    lifecycle: typePage ? "The type describes queue input, live playback state, or the tagged state-decoding result." : name === "Media.decodeState" ? "Media.decodeState synchronously validates a media_state or Media.state payload. On success, playback fields are under result.state." : "The command returns a RequestId for acknowledgement. Actual playback truth arrives independently through Application.handle(\"media_state\", target, payload) and must be decoded before rendering.",
    expectedOutcome: typePage ? "A checked media input/state/result annotation." : name === "Media.decodeState" ? "A tagged result containing result.state or a bounded decode error." : "A RequestId now, then command completion and subsequent decoded live-state updates when playback changes.",
    failureGuidance: "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    availability: `Public-source alpha API in ${release.publishedVersion}; background playback and system controls require target-specific verification.`,
  };
  return {};
}

const checkedRecipeSections = sections.filter((section) => section.id.startsWith("recipe-"));
const checkedRecipeCode = new Map(checkedRecipeSections.map((section) => [
  section.id,
  (section.cards ?? []).map((card) => card.code ?? "").join("\n"),
]));
const completeRecipeOverrides = Object.freeze({
  "Server.call": "recipe-server",
  "Server.decode": "recipe-server",
});

const errorCodeGroups = Object.freeze({
  data: {
    module: "luastra/data",
    entries: [
      ["invalid_schema", "The supplied schema is not a valid Data.Schema value."],
      ["maximum_depth", "Nested validation exceeded the supported schema depth."],
      ["schema_cycle", "The schema recursively references itself."],
      ["expected_string", "The value at path is not a string."],
      ["too_short", "A string contains fewer bytes than minBytes."],
      ["too_long", "A string contains more bytes than maxBytes."],
      ["expected_number", "The value is not a finite number."],
      ["expected_integer", "The value is not an integer required by the schema."],
      ["too_small", "A number is below the configured minimum."],
      ["too_large", "A number is above the configured maximum."],
      ["expected_boolean", "The value at path is not a boolean."],
      ["expected_array", "The value is not a dense one-based array."],
      ["too_few_items", "An array contains fewer items than minItems."],
      ["too_many_items", "An array contains more items than maxItems."],
      ["expected_object", "The value at path is not an object table."],
      ["unexpected_field", "An exact object contains a field absent from its schema."],
      ["unknown_schema", "The schema kind is not supported by this SDK version."],
    ],
  },
  stateDecode: {
    module: "luastra/state",
    entries: [
      ["empty", "The encoded state is empty or not a string."],
      ["too_large", "The encoded state exceeds 4096 bytes."],
      ["invalid_expected_version", "expectedVersion is not an integer from 1 through 999."],
      ["malformed", "The version prefix or field structure is malformed."],
      ["unsupported_version", "The encoded version differs from expectedVersion."],
      ["too_many_fields", "The encoded state contains more than 32 fields."],
      ["invalid_field", "A field name is invalid or duplicated."],
      ["invalid_encoding", "A field contains invalid or non-canonical percent encoding."],
    ],
  },
  stateMigration: {
    module: "luastra/state",
    entries: [
      ["empty", "The encoded source state is empty or not a string."],
      ["too_large", "The encoded source state exceeds 4096 bytes."],
      ["invalid_target_version", "targetVersion is not an integer from 1 through 999."],
      ["invalid_migrations", "The migration collection is not a table."],
      ["malformed", "The source version prefix is missing or invalid."],
      ["newer_version", "The source version is newer than the requested target."],
      ["too_many_migrations", "The migration would require more than 32 steps."],
      ["missing_migration", "No migration function exists for the current version."],
      ["migration_failed", "A migration function raised an error."],
      ["invalid_migration", "A migration returned, encoded, or verified an invalid replacement."],
    ],
  },
  navigationRestore: {
    module: "luastra/navigation",
    entries: [
      ["invalid_snapshot", "The snapshot shape, version, or encoded form is invalid."],
      ["invalid_stack", "The restored stack is empty, too deep, sparse, or inconsistent."],
      ["unknown_route", "A restored route is not admitted by the string stack."],
      ["invalid_entry", "A restored typed entry cannot be matched or generated."],
    ],
  },
  navigationRoute: {
    module: "luastra/navigation",
    entries: [
      ["invalid_location", "The location is malformed, non-canonical, or exceeds route segment limits."],
      ["route_not_found", "No compiled route definition matches the location."],
      ["invalid_entry", "The typed route entry has an invalid shape or parameters."],
      ["unknown_route", "The entry names a route absent from the compiler."],
      ["invalid_parameter", "A required path parameter is missing or invalid."],
      ["missing_query", "A required query parameter is absent."],
      ["invalid_query", "A supplied query parameter cannot be decoded or validated."],
      ["location_too_large", "The generated canonical location exceeds 2048 bytes."],
    ],
  },
  navigationMutation: {
    module: "luastra/navigation",
    entries: [
      ["invalid_entry", "The typed route entry cannot be generated."],
      ["unknown_route", "The entry names a route absent from the compiler."],
      ["invalid_parameter", "A required path parameter is missing or invalid."],
      ["missing_query", "A required query parameter is absent."],
      ["invalid_query", "A supplied query parameter cannot be decoded or validated."],
      ["location_too_large", "The generated canonical location exceeds 2048 bytes."],
      ["stack_depth_exceeded", "Push would exceed the configured navigation stack depth."],
    ],
  },
  serverDecode: {
    module: "luastra/server",
    entries: [
      ["invalid_size", "The wire payload is empty, not a string, or larger than 4096 bytes."],
      ["invalid_version", "The wire payload does not declare protocol version v=1."],
      ["malformed", "A field token is missing its name/value separator."],
      ["invalid_field", "A field name, value encoding, or duplicate field is invalid."],
      ["too_many_fields", "The wire payload contains more than 128 fields."],
    ],
  },
  mediaDecode: {
    module: "luastra/media",
    entries: [
      ["invalid_wire", "The media-state wire payload cannot be decoded."],
      ["missing_field", "A required media-state field is absent."],
      ["invalid_state", "The field set, status, or background flag is invalid."],
      ["invalid_number", "A required numeric field is not a valid number."],
      ["invalid_error", "The host error code and message fields are inconsistent."],
    ],
  },
});

const errorCodeTargets = Object.freeze({
  "Data.ValidationError": "data", "Data.Failure": "data", "Data.Result": "data",
  "State.DecodeError": "stateDecode", "State.DecodeFailure": "stateDecode", "State.DecodeResult": "stateDecode",
  "State.MigrationError": "stateMigration", "State.MigrationFailure": "stateMigration", "State.MigrationResult": "stateMigration",
  "Navigation.RestoreError": "navigationRestore", "Navigation.RestoreResult": "navigationRestore",
  "Navigation.RouteError": "navigationRoute", "Navigation.RouteResult": "navigationRoute",
  "Navigation.MutationResult": "navigationMutation",
  "Server.DecodeFailure": "serverDecode", "Server.DecodeResult": "serverDecode",
  "Media.DecodeFailure": "mediaDecode", "Media.DecodeResult": "mediaDecode",
});

const typeFlowFamilies = Object.freeze([
  { types: ["Data.ValidationError", "Data.Success", "Data.Failure", "Data.Result"], producedBy: ["Data.decode"] },
  { types: ["State.DecodeError", "State.DecodeSuccess", "State.DecodeFailure", "State.DecodeResult"], producedBy: ["State.decode"], consumedBy: ["State.migrate"] },
  { types: ["State.MigrationError", "State.MigrationSuccess", "State.MigrationFailure", "State.MigrationResult"], producedBy: ["State.migrate"] },
  { types: ["Navigation.RestoreError", "Navigation.RestoreResult"], producedBy: ["Navigation.create", "Navigation.createRouter"] },
  { types: ["Navigation.RouteError", "Navigation.RouteResult"], producedBy: ["Navigation.compile"] },
  { types: ["Navigation.MutationResult"], producedBy: ["Navigation.createRouter"] },
  { types: ["Server.DecodeSuccess", "Server.DecodeFailure", "Server.DecodeResult"], producedBy: ["Server.decode"] },
  { types: ["Media.MediaError", "Media.DecodeSuccess", "Media.DecodeFailure", "Media.DecodeResult"], producedBy: ["Media.decodeState"] },
]);

function completeRecipeFor(symbol) {
  if (typeof symbol !== "string" || !symbol.includes(".")) return null;
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const exactSymbol = new RegExp(`(^|[^A-Za-z0-9_.])${escaped}(?![A-Za-z0-9_])`, "m");
  const overrideId = completeRecipeOverrides[symbol];
  const section = overrideId == null
    ? checkedRecipeSections.find((candidate) => exactSymbol.test(checkedRecipeCode.get(candidate.id) ?? ""))
    : checkedRecipeSections.find((candidate) => candidate.id === overrideId);
  if (!section) return null;
  return {
    sectionId: section.id,
    title: section.title.replace(/^Recipe:\s*/u, ""),
    evidence: overrideId == null ? "authored-files" : "generated-client",
    description: overrideId == null
      ? `This checked recipe uses ${symbol} inside complete authored files with the required manifest, test, and run steps.`
      : `This checked recipe provides the declaration, generated client, trusted handler, manifest, test, and run context behind ${symbol}.`,
  };
}

const pages = [];
const inventoryPages = {};
const typeInventoryPages = {};
const parameterGroupPages = {};
const parameterTables = {};
for (const section of sections) {
  for (const table of section.tables ?? []) {
    if (table.id) parameterTables[table.id] = table;
  }
}
for (const section of sections) {
  for (const [index, card] of (section.cards ?? []).entries()) {
    const moduleName = section.module;
    const shortName = typeof card.name === "string" && moduleName?.startsWith("luastra/")
      ? card.name.slice(card.name.indexOf(".") + 1)
      : null;
    const typeDeclaration = card.kind === "type" && shortName ? exactTypes[moduleName]?.[shortName] : null;
    const functionDeclaration = card.kind !== "type"
      ? (shortName ? exactFunctions[moduleName]?.[shortName] : null) ?? referencedFunction(card.signature)
      : null;
    if (card.kind === "type" && !typeDeclaration) fail(`${card.name} has no exact exported type declaration`);
    if (shortName && sdkInventory[moduleName]?.includes(shortName) && !functionDeclaration) fail(`${card.name} has no exact exported function declaration`);
    const inheritedParameters = [];
    const allowedInherited = uiAllowedInheritedParameters[card.name];
    const applicableParameterTables = allowedInherited
      ? Object.values(parameterTables)
      : (card.props ?? []).map((group) => parameterTables[propertyGroupTableIds[group]]).filter(Boolean);
    for (const table of applicableParameterTables) {
      for (const parameter of table?.rows ?? []) {
        if (allowedInherited && !allowedInherited.includes(parameter.name)) continue;
        inheritedParameters.push({
          ...parameter,
          description: `${parameter.description} Group: ${table.title}.`,
        });
      }
    }
    pages.push({
      id: pageId(section.id, index),
      routeSlug: pageSlug(card.name),
      routeId: pageRouteId(section.id, card.name),
      kind: "entry",
      sectionId: section.id,
      sectionTitle: section.title,
      module: section.module ?? null,
      ...operationalGuidance(card.name, section.module, card.kind),
      ...uiGuidance(card.name),
      callable: card.kind === "function" || functionDeclaration !== null,
      useWhen: card.useWhen ?? section.summary,
      code: typeDeclaration ?? card.code ?? uiExamples[card.name] ?? apiExamples[card.name] ?? section.example ?? null,
      signature: typeDeclaration ?? functionDeclaration ?? card.signature,
      parameters: typeDeclaration
        ? typeFields(typeDeclaration, card.name)
        : uniqueParameters([...(uiDirectParameters[card.name] ?? declarationParameters(functionDeclaration ?? "", card.name)), ...(card.parameters ?? []), ...inheritedParameters]),
      returns: card.returns ?? (functionDeclaration ? declarationReturn(functionDeclaration, card.name) : (card.name?.startsWith("UI.") ? "UI.Node — a declarative node in the new render tree." : null)),
      ...card,
      ...(completeRecipeFor(card.name) ? { completeRecipe: completeRecipeFor(card.name) } : {}),
      kind: card.kind ?? "entry",
      callable: card.kind === "function" || functionDeclaration !== null,
      signature: typeDeclaration ?? functionDeclaration ?? card.signature,
      code: typeDeclaration ?? card.code ?? uiExamples[card.name] ?? apiExamples[card.name] ?? section.example ?? null,
      parameters: typeDeclaration
        ? typeFields(typeDeclaration, card.name)
        : uniqueParameters([...(uiDirectParameters[card.name] ?? declarationParameters(functionDeclaration ?? "", card.name)), ...(card.parameters ?? []), ...inheritedParameters]),
      returns: card.returns ?? (functionDeclaration ? declarationReturn(functionDeclaration, card.name) : (card.name?.startsWith("UI.") ? "UI.Node — a declarative node in the new render tree." : null)),
    });
  }
  for (const [index, table] of (section.tables ?? []).entries()) {
    const id = `${section.id}/table-${index + 1}`;
    pages.push({
      id,
      routeSlug: pageSlug(table.title),
      routeId: pageRouteId(section.id, table.title),
      kind: "parameter-group",
      sectionId: section.id,
      sectionTitle: section.title,
      module: section.module ?? null,
      name: table.title,
      signature: table.id,
      description: `Shared parameters in the “${table.title}” group. A component page links here only when it supports this group.`,
      parameters: table.rows,
    });
    parameterGroupPages[table.id] = id;
  }
}

const relatedFamilies = [
  ["UI.Screen", "UI.Theme", "UI.Node", "UI.Column"],
  ["UI.Column", "UI.Row", "UI.Stack", "UI.Grid", "UI.Scroll"],
  ["UI.Text", "UI.Code", "UI.CodeBlock", "UI.Image", "UI.Shape"],
  ["UI.Button", "UI.Link", "UI.Actions", "UI.Field", "UI.Modal"],
  ["UI.Table", "UI.TableRow", "UI.TableCell", "UI.List", "UI.ListItem"],
  ["UI.Layer", "UI.FlipCard", "UI.Card", "UI.Image", "UI.Shape"],
  ["UI.Orbit", "UI.OrbitPath", "UI.OrbitSearch", "UI.Constellation", "UI.OrbitCenter", "UI.OrbitNode"],
  ["UI.OrbitNode", "UI.OrbitCluster", "UI.FocusSurface", "UI.FocusHeader", "UI.OrbitReturn"],
  ["Timer.RequestId", "Timer.StartOptions", "Timer.start", "Timer.restart", "Timer.cancel"],
  ["Server.RequestId", "Server.Options", "Server.call", "Server.decode"],
  ["Server.DecodeSuccess", "Server.DecodeFailure", "Server.DecodeResult", "Server.decode"],
  ["Media.RequestId", "Media.QueueItem", "Media.State", "Media.setQueue", "Media.state"],
  ["Media.play", "Media.pause", "Media.stop", "Media.unload", "Media.seek"],
  ["Media.next", "Media.previous", "Media.State", "Media.state"],
  ["Media.DecodeSuccess", "Media.DecodeFailure", "Media.DecodeResult", "Media.decodeState", "Media.State"],
  ["Navigation.Options", "Navigation.Stack", "Navigation.create", "Navigation.Snapshot"],
  ["Navigation.RouteEntry", "Navigation.RouteCompiler", "Navigation.EntryStack", "Navigation.createRouter", "Navigation.compile"],
  ["Navigation.RestoreError", "Navigation.RestoreResult", "Navigation.MutationResult", "Navigation.decideBack"],
];

const pageByName = new Map(pages.map((page) => [page.name, page]));
const routeCandidates = new Map();
for (const page of pages) {
  const candidates = routeCandidates.get(page.routeId) ?? [];
  candidates.push(page);
  routeCandidates.set(page.routeId, candidates);
}
for (const [routeId, candidates] of routeCandidates) {
  if (candidates.length < 2) continue;
  for (const page of candidates) {
    const suffix = page.kind === "type" ? "type" : page.kind === "parameter-group" ? "parameters" : page.callable ? "function" : "guide";
    page.routeSlug = `${page.routeSlug}-${suffix}`;
    page.routeId = `${page.sectionId}/${page.routeSlug}`;
  }
}
const pageByRouteId = new Map();
for (const page of pages) {
  if (pageByRouteId.has(page.routeId)) fail(`duplicate stable page route: ${page.routeId}`);
  pageByRouteId.set(page.routeId, page);
}

function literalErrorCodes(source) {
  const codes = [];
  const pattern = /(?:failure|migrationFailure)\("([a-z_]+)"|code\s*=\s*"([a-z_]+)"|error\s*=\s*"([a-z_]+)"/g;
  for (const match of source.matchAll(pattern)) {
    const code = match[1] ?? match[2] ?? match[3];
    if (!codes.includes(code)) codes.push(code);
  }
  return codes.sort();
}

for (const moduleName of ["luastra/data", "luastra/state", "luastra/navigation", "luastra/server", "luastra/media"]) {
  const documented = [];
  for (const group of Object.values(errorCodeGroups)) {
    if (group.module !== moduleName) continue;
    for (const [code] of group.entries) if (!documented.includes(code)) documented.push(code);
  }
  documented.sort();
  const actual = literalErrorCodes(sdkSources[moduleName]);
  if (JSON.stringify(documented) !== JSON.stringify(actual)) {
    fail(`${moduleName} error-code documentation differs from SDK literals: documented=${documented.join(",")} actual=${actual.join(",")}`);
  }
}

for (const [pageName, groupName] of Object.entries(errorCodeTargets)) {
  const page = pageByName.get(pageName);
  const group = errorCodeGroups[groupName];
  if (!page || !group) fail(`${pageName} error-code target is unavailable`);
  page.errorCodes = group.entries.map(([code, meaning]) => ({ code, meaning }));
  page.errorCodeNote = "This is the complete closed vocabulary emitted by the named operation in this Source SDK contract.";
}

const mediaErrorPage = pageByName.get("Media.MediaError");
if (!mediaErrorPage) fail("Media.MediaError page is unavailable");
mediaErrorPage.description = "Media.MediaError reports an admitted playback failure from the active host. Its code is stable for that reported failure, but the set of possible codes is host-specific rather than a portable SDK-wide enum.";
mediaErrorPage.useWhen = "Use this type after a media event reports a playback failure. Branch only on codes explicitly documented by the active host or target, show a safe message, and keep playback state recoverable.";
for (const parameter of mediaErrorPage.parameters ?? []) {
  if (parameter.name === "code") {
    parameter.description = "Stable machine-readable code for this failure. The vocabulary is defined by the active host or target and may differ across hosts.";
  }
}
mediaErrorPage.errorCodeNote = "MediaError.code and message describe an admitted host playback failure. The code vocabulary is host-specific and intentionally not presented as one portable closed list; handle the visible message and preserve a safe playback state.";

for (const family of typeFlowFamilies) {
  const producerPageIds = family.producedBy.map((name) => pageByName.get(name)?.id ?? fail(`${name} producer page is unavailable`));
  const consumerPageIds = (family.consumedBy ?? []).map((name) => pageByName.get(name)?.id ?? fail(`${name} consumer page is unavailable`));
  for (const typeName of family.types) {
    const page = pageByName.get(typeName);
    if (!page) fail(`${typeName} flow target is unavailable`);
    page.producerPageIds = producerPageIds;
    page.consumerPageIds = consumerPageIds;
  }
}

const explicitRelated = new Map();
for (const family of relatedFamilies) {
  const admitted = family.filter((name) => pageByName.has(name));
  for (const name of admitted) {
    const values = explicitRelated.get(name) ?? [];
    for (const relatedName of admitted) {
      if (relatedName !== name && !values.includes(relatedName)) values.push(relatedName);
    }
    explicitRelated.set(name, values);
  }
}

function relationText(page) {
  return [page.signature, page.description, page.useWhen, page.code].filter(Boolean).join("\n");
}

function mentionsPage(text, page) {
  const shortName = page.name.includes(".") ? page.name.slice(page.name.indexOf(".") + 1) : page.name;
  return text.includes(page.name) || (shortName.length >= 4 && text.includes(shortName));
}

function relationshipFor(page, candidate) {
  if (mentionsPage(relationText(page), candidate)) return "prerequisite";
  if (mentionsPage(relationText(candidate), page)) return "next-step";
  return "companion";
}

for (const section of sections) {
  const sectionPages = pages.filter((page) => page.sectionId === section.id);
  for (const [index, page] of sectionPages.entries()) {
    page.previousPageId = sectionPages[index - 1]?.id ?? null;
    page.nextPageId = sectionPages[index + 1]?.id ?? null;
    const excluded = new Set([page.id, page.previousPageId, page.nextPageId].filter(Boolean));
    const selected = [];
    const add = (candidate) => {
      if (candidate && !excluded.has(candidate.id) && !selected.includes(candidate.id) && selected.length < 4) {
        selected.push(candidate.id);
      }
    };
    for (const name of explicitRelated.get(page.name) ?? []) add(pageByName.get(name));

    const sourceText = relationText(page);
    const scored = sectionPages
      .filter((candidate) => !excluded.has(candidate.id) && !selected.includes(candidate.id))
      .map((candidate, candidateIndex) => {
        const shortName = candidate.name.includes(".") ? candidate.name.slice(candidate.name.indexOf(".") + 1) : candidate.name;
        const reciprocal = relationText(candidate);
        let score = 0;
        if (sourceText.includes(candidate.name)) score += 12;
        if (shortName.length >= 4 && sourceText.includes(shortName)) score += 5;
        if (reciprocal.includes(page.name)) score += 8;
        if (page.kind !== candidate.kind) score += 2;
        score -= Math.abs(index - candidateIndex) / 100;
        return { candidate, score };
      })
      .sort((left, right) => right.score - left.score || left.candidate.id.localeCompare(right.candidate.id));
    for (const item of scored) {
      if (selected.length < 3 && item.score >= 8) add(item.candidate);
    }
    page.relatedPageIds = selected;
    page.relatedPageRoles = selected.map((relatedId) => {
      const candidate = pages.find((item) => item.id === relatedId);
      if (!candidate) fail(`${page.id} links to missing related page ${relatedId}`);
      return relationshipFor(page, candidate);
    });
  }
}

for (const [moduleName, items] of Object.entries(sdkTypeInventory)) {
  typeInventoryPages[moduleName] = {};
  for (const item of items) {
    const expected = publicName(moduleName, item);
    const matches = pages.filter((page) => page.module === moduleName && page.name === expected && page.kind === "type");
    if (matches.length !== 1) fail(`${expected} type must have exactly one detail page, received ${matches.length}`);
    const [page] = matches;
    if (!page.description || !page.signature || !page.code) fail(`${expected} type page must include purpose and exact declaration`);
    if (page.description.length < 120 || page.useWhen.length < 120) fail(`${expected} type page must include complete purpose and usage guidance`);
    if (/for this specific purpose|^Provides\b/u.test(page.description) || /for this specific purpose/u.test(page.useWhen)) fail(`${expected} type page contains placeholder prose`);
    if (!page.parameters || page.parameters.length === 0) fail(`${expected} type page must describe its fields or definition`);
    typeInventoryPages[moduleName][item] = page.id;
  }
}

for (const section of sections) {
  const detailPages = pages.filter((page) => page.sectionId === section.id && page.kind !== "parameter-group");
  const useWhenValues = [];
  for (const page of detailPages) {
    if (!page.useWhen || page.useWhen === section.summary || page.useWhen === page.description) {
      fail(`${page.name} must include specific When to use it guidance`);
    }
    if (!page.code && page.kind !== "guide") fail(`${page.name} detail page must include a minimal example or exact declaration`);
    if (page.callable === true && (!page.parameters || page.parameters.length === 0) && !/\(\s*\)/u.test(page.signature ?? "")) {
      fail(`${page.name} is callable with arguments but has no parameter documentation`);
    }
    if (`${page.signature}\n${page.code}`.includes("$LUASTRA")) fail(`${page.name} uses the retired CLI variable`);
    if ((page.language ?? "Luau") === "Luau" && /\bprint\s*\(/u.test(page.code)) fail(`${page.name} uses unavailable print instead of luastra/debug or explicit state`);
    if (page.code) {
      const longestLine = Math.max(...page.code.split("\n").map((line) => line.length));
      if (longestLine > 120) fail(`${page.name} contains a ${longestLine}-character example line; format it for reading`);
    }
    useWhenValues.push(page.useWhen);
  }
  if (new Set(useWhenValues).size !== useWhenValues.length) fail(`${section.id} contains duplicate When to use it guidance`);
}

for (const [moduleName, items] of Object.entries(sdkInventory)) {
  inventoryPages[moduleName] = {};
  for (const item of items) {
    const expected = publicName(moduleName, item);
    const matches = pages.filter((page) => page.module === moduleName && page.name === expected);
    if (matches.length !== 1) fail(`${expected} must have exactly one detail page, received ${matches.length}`);
    const [page] = matches;
    if (!page.description || !page.signature) fail(`${expected} detail page must describe purpose and signature`);
    if (page.description.length < 120 || page.useWhen.length < 120) fail(`${expected} detail page must include complete purpose and usage guidance`);
    if (/for this specific purpose|^Provides\b/u.test(page.description) || /for this specific purpose/u.test(page.useWhen)) fail(`${expected} detail page contains placeholder prose`);
    if (!page.code) fail(`${expected} detail page must include an example`);
    if (expected.startsWith("UI.") && (!page.parameters || page.parameters.length === 0)) {
      fail(`${expected} detail page must include its supported parameters`);
    }
    inventoryPages[moduleName][item] = matches[0].id;
  }
}

function key(value) {
  return `[${JSON.stringify(value)}]`;
}

function luau(value, depth = 0) {
  const indent = "    ".repeat(depth);
  const childIndent = "    ".repeat(depth + 1);
  if (value === null) return "nil";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "{}";
    return `{\n${value.map((item) => `${childIndent}${luau(item, depth + 1)},`).join("\n")}\n${indent}}`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    if (entries.length === 0) return "{}";
    return `{\n${entries.map(([name, item]) => `${childIndent}${key(name)} = ${luau(item, depth + 1)},`).join("\n")}\n${indent}}`;
  }
  throw new Error(`unsupported reference value: ${typeof value}`);
}

const snapshot = { release, sdkInventory, sdkTypeInventory, inventoryPages, typeInventoryPages, navigationGroups, pages, parameterGroupPages, sections };
const output = `--!strict\n-- Generated from website/site/reference-data.js. Do not edit by hand.\n\nlocal ReferenceData: any = ${luau(snapshot)}\n\nreturn table.freeze(ReferenceData)\n`;
const destination = resolve(import.meta.dirname, "../src/reference-data.luau");
await writeFile(destination, output);
const webDestination = resolve(import.meta.dirname, "../../site/generated-reference-data.js");
const webOutput = `// Generated from the checked Luastra SDK and reference-data.js. Do not edit by hand.\n\nexport const generatedPages = Object.freeze(${JSON.stringify(pages, null, 2)});\n`;
await writeFile(webDestination, webOutput);
process.stdout.write(`${JSON.stringify({ result: "PASS", destination, webDestination, sections: sections.length, pages: pages.length })}\n`);
