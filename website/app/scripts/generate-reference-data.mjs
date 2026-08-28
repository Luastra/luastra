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
    { name: "options.delayMs", values: "integer (0..86400000)", description: "Delay before delivery, in milliseconds." },
    { name: "options.value", values: "string?", description: "Optional bounded value delivered with the timer event." },
  ],
  "Timer.restart": [
    { name: "options.id", values: "string", description: "Existing or new stable timer ID to replace atomically." },
    { name: "options.delayMs", values: "integer (0..86400000)", description: "Fresh delay before the replacement timer fires." },
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
  "Motion.slideIn": `local Motion = require("luastra/motion")\nlocal motion = Motion.slideIn { fromY = 24, durationMs = 300 }`,
  "Motion.scaleIn": `local Motion = require("luastra/motion")\nlocal motion = Motion.scaleIn { from = 0.92, durationMs = 220 }`,
  "Motion.sway": `local Motion = require("luastra/motion")\nlocal motion = Motion.sway { rotationDeg = 2, durationMs = 2400, iterations = 0 }`,
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
  "Host.launchUrl": `local Host = require("luastra/host")\nlocal requestId = Host.launchUrl()`,
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
  "Server.decode": `local Server = require("luastra/server")\nlocal result = Server.decode(payload)\nif result.success then records = result.value end`,
  "Media.setQueue": `local Media = require("luastra/media")\nMedia.setQueue({ { id = "intro", source = "asset:audio/intro", title = "Intro", artist = "Luastra" } })`,
  "Media.play": `local Media = require("luastra/media")\nMedia.play()`,
  "Media.pause": `local Media = require("luastra/media")\nMedia.pause()`,
  "Media.stop": `local Media = require("luastra/media")\nMedia.stop()`,
  "Media.unload": `local Media = require("luastra/media")\nMedia.unload()`,
  "Media.next": `local Media = require("luastra/media")\nMedia.next()`,
  "Media.previous": `local Media = require("luastra/media")\nMedia.previous()`,
  "Media.state": `local Media = require("luastra/media")\nlocal requestId = Media.state()`,
  "Media.seek": `local Media = require("luastra/media")\nMedia.seek(30_000)`,
  "Media.decodeState": `local Media = require("luastra/media")\nlocal state = Media.decodeState(payload)\nif state.success then positionMs = state.positionMs end`,
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
  "UI.Button": [...boxParameters, "textColor", "backgroundColor", "Color tokens", "onTap", "appearance", "label", "hidden", "disabled", "busy", ...motionParameters],
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
  "UI.Button": [direct("id", "lowercase path, required", "Unique ID."), direct("text", "string, required", "Visible button label."), direct("onTap", "action string, required", "Action delivered to Application.handle after activation.")],
  "UI.Link": [direct("id", "lowercase path, required", "Unique link ID."), direct("text", "string, required", "Visible link text."), direct("href", "#fragment | HTTPS URL, required", "Safe internal fragment or external HTTPS destination."), direct("external", "boolean?", "Opens an external destination according to host policy."), direct("onTap", "action string?", "Optional admitted action delivered when the link is activated.")],
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
});

const uiAccessibility = Object.freeze({
  "UI.Screen": "Creates the main landmark and owns document language and metadata. Keep one meaningful h1 on each page.",
  "UI.Text": "variant creates the real h1/h2/h3 hierarchy; textAlign changes visual alignment only, not reading order.",
  "UI.Button": "Keeps native button semantics, keyboard activation, and visible focus. Do not replace it with a tappable Shape.",
  "UI.Link": "Keeps native link semantics. Its visible text should explain the destination without relying on surrounding prose.",
  "UI.TextInput": "label is required. required, disabled, and errorId expose state to screen readers; an error hint should be a visible role=alert.",
  "UI.Image": "label is required; use an empty string only for a genuinely decorative image.",
  "UI.Modal": "The host traps focus inside the open dialog, Escape invokes onDismiss, and closing restores focus to the trigger.",
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
      kind: "entry",
      sectionId: section.id,
      sectionTitle: section.title,
      module: section.module ?? null,
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
