import packageManifest from "../../package.json" with { type: "json" };
import releaseAdmission from "../../release/sdk-release-admission.v1.json" with { type: "json" };
import sourceManifest from "../../sdk/source-manifest.v1.json" with { type: "json" };
import runtimeManifest from "../../platform/runtime-manifest.v2.json" with { type: "json" };
import sourceBuildContract from "../../platform/source-build/source-build-contract.v1.json" with { type: "json" };

function numberedIdentity(identity, pattern, label) {
  const match = pattern.exec(identity);
  if (!match) throw new Error(`unsupported ${label} identity: ${identity}`);
  return `${label} ${match[1]}`;
}

export const release = Object.freeze({
  version: packageManifest.version,
  publishedVersion: releaseAdmission.version,
  date: "2026-09-07",
  sourceSdk: numberedIdentity(sourceManifest.identity, /\/phase5-contract-(\d+)$/u, "Source SDK contract"),
  runtimeSdk: numberedIdentity(runtimeManifest.identity, /\/phase5-alpha-(\d+)$/u, "Runtime SDK alpha"),
  luauVersion: sourceBuildContract.luau.tag,
  status: `Public-source alpha ${releaseAdmission.version}`,
});

export const sdkInventory = Object.freeze({
  "luastra/ui": ["Screen", "Column", "Row", "Text", "Button", "Link", "Code", "CodeBlock", "Divider", "Table", "TableRow", "TableCell", "FlipCard", "Image", "Layer", "Shape", "TextInput", "List", "ListItem", "Modal", "Orbit", "OrbitPath", "OrbitSearch", "Constellation", "OrbitCenter", "OrbitNode", "OrbitCluster", "FocusSurface", "FocusHeader", "OrbitReturn", "Stack", "Grid", "Scroll", "Card", "Field", "Actions"],
  "luastra/assets": ["image", "audio", "font", "uri"], "luastra/data": ["string", "number", "boolean", "array", "object", "optional", "decode"],
  "luastra/debug": ["log", "warn", "error"], "luastra/timer": ["start", "restart", "cancel"],
  "luastra/motion": ["tween", "wait", "sequence", "fadeIn", "slideIn", "scaleIn", "sway", "pulse", "shake", "flip"],
  "luastra/navigation": ["decideBack", "create", "createRouter", "compile"], "luastra/state": ["encode", "decode", "migrate"],
  "luastra/host": ["storageGet", "storageSet", "launchUrl", "clipboardWrite", "historyPush", "historyReplace", "historyPushLocation", "historyReplaceLocation", "historyBack", "historyCurrent", "systemBackHandled", "systemBackHistory", "systemBackExit"],
  "luastra/server": ["call", "decode"], "luastra/media": ["setQueue", "play", "pause", "stop", "unload", "next", "previous", "state", "seek", "decodeState"],
});

export const sdkTypeInventory = Object.freeze({
  "luastra/ui": ["Properties", "Theme", "Node"],
  "luastra/assets": ["Image", "Audio", "Font", "Reference"],
  "luastra/data": ["ValidationError", "Success", "Failure", "Result", "StringOptions", "NumberOptions", "ArrayOptions", "ObjectOptions", "Schema"],
  "luastra/debug": [],
  "luastra/timer": ["RequestId", "StartOptions"],
  "luastra/motion": ["Easing", "TweenOptions", "Tween", "Wait", "Sequence", "Descriptor", "MotionMap"],
  "luastra/navigation": ["Snapshot", "RestoreError", "RestoreResult", "Options", "Stack", "RouteError", "RouteEntry", "RouteResult", "RouteCompiler", "EntrySnapshot", "MutationResult", "EntryStack"],
  "luastra/state": ["Fields", "DecodeError", "DecodeSuccess", "DecodeFailure", "DecodeResult", "MigrationError", "MigrationSuccess", "MigrationFailure", "MigrationResult", "Migration"],
  "luastra/host": ["RequestId"],
  "luastra/server": ["RequestId", "Options", "DecodeSuccess", "DecodeFailure", "DecodeResult"],
  "luastra/media": ["RequestId", "QueueItem", "MediaError", "State", "DecodeSuccess", "DecodeFailure", "DecodeResult"],
});

export const navigationGroups = Object.freeze([
  { label: "Start", items: [["overview", "Overview"], ["installation", "Installation"], ["quickstart", "Quick start"], ["workflow", "CLI workflow"]] },
  { label: "Learn", items: [["learning-path", "Interactive learning path"], ["luau-types", "Luau typing"], ["beginner-tutorial", "Beginner tutorial"], ["advanced-tutorial", "Advanced tutorial"], ["first-app", "Complete mini-app"], ["application", "Application contract"], ["events-errors", "Events and errors"]] },
  { label: "Build recipes", items: [["recipes", "How to use recipes"], ["recipe-timer", "Delayed action"], ["recipe-navigation", "Typed navigation"], ["recipe-storage", "Persist state"], ["recipe-history", "Browser and system Back"], ["recipe-form-modal", "Form and modal"], ["recipe-assets-visuals", "Assets and visuals"], ["recipe-motion", "Declarative motion"], ["recipe-server", "Server function"], ["recipe-media", "Audio playback"], ["recipe-orbit", "Constellation Orbit"]] },
  { label: "Interface", items: [["ui", "luastra/ui"], ["ui-properties", "UI parameters"], ["visuals", "Images and shapes"], ["motion", "luastra/motion"]] },
  { label: "Data and state", items: [["assets", "luastra/assets"], ["data", "luastra/data"], ["state", "luastra/state"], ["navigation", "luastra/navigation"]] },
  { label: "Host capabilities", items: [["timer", "luastra/timer"], ["host", "luastra/host"], ["server", "luastra/server"], ["media", "luastra/media"]] },
  { label: "Tools", items: [["debug", "luastra/debug"], ["cli", "CLI"], ["manifest", "luastra.json"], ["support", "Support and boundaries"], ["policies", "Project policies"]] },
]);

const row = (name, values, description) => ({ name, values, description });
const entry = (name, signature, description, options = {}) => ({
  name,
  signature,
  description,
  useWhen: options.useWhen ?? `Read this page when you need to apply ${name}, verify its exact contract, and adapt the example without bypassing validation or host boundaries.`,
  ...options,
});
const publicPrefix = (moduleName) => moduleName === "luastra/ui" ? "UI" : `${moduleName[8].toUpperCase()}${moduleName.slice(9)}`;
const typePurpose = (moduleName, name) => {
  const qualified = `${publicPrefix(moduleName)}.${name}`;
  if (name === "RequestId" && moduleName === "luastra/timer") return `${qualified} is the numeric acknowledgement returned by a timer control call. It confirms that the command crossed the SDK boundary, while the stable string timer ID identifies the later expiry delivered to Application.handle.`;
  if (name === "RequestId") return `${qualified} is an opaque numeric identifier allocated for one asynchronous operation. Store it with the operation's purpose so Application.resolve can correlate out-of-order completions without inspecting payload text.`;
  if (name.endsWith("Options")) return `${qualified} is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted.`;
  if (name.endsWith("Error") || name.endsWith("Failure")) return `${qualified} represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message.`;
  if (name.endsWith("Success")) return `${qualified} represents the successful branch of a discriminated SDK result. Its value and success-specific fields are safe to read only after the shared success tag has narrowed the union.`;
  if (name.endsWith("Result") && moduleName === "luastra/navigation") return `${qualified} is a result record with a boolean success field and optional success- or failure-specific fields. Check success before reading entry, location, changed, or error; the exported declaration does not encode automatic Luau union narrowing.`;
  if (name.endsWith("Result")) return `${qualified} is a discriminated union covering successful output and bounded failure. Branching on success narrows the value to the correct exported record and makes error handling explicit.`;
  if (name === "Node") return "UI.Node is the host-neutral declarative value produced by every UI constructor. Nodes contain a validated component kind, stable ID, properties, and children that hosts translate into native semantic interface elements.";
  if (name === "Theme") return "UI.Theme is a reusable record of optional screen color overrides. Direct UI.Screen color fields take precedence, while every omitted field inherits Luastra's built-in accessible palette.";
  if (name === "Properties") return "UI.Properties is the validated map stored on a declarative UI node after constructor checks. It carries only serializable, admitted property values that host renderers can interpret consistently.";
  if (name.includes("Stack") || name.includes("Compiler")) return `${qualified} is a stateful navigation contract that owns route history or translates between route entries and canonical locations. Its public methods validate mutations and return bounded results instead of exposing internal tables.`;
  if (["Tween", "Wait", "Sequence", "Descriptor", "MotionMap", "Easing"].includes(name)) return `${qualified} is part of the declarative motion model consumed by supported UI motion properties. It describes deterministic values and timing; the host scheduler applies frames without rerunning Application.render for every animation frame.`;
  return `${qualified} is an exported, statically checked data contract of ${moduleName}. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis.`;
};
const typeUseWhen = (moduleName, name) => {
  const qualified = `${publicPrefix(moduleName)}.${name}`;
  if (name === "RequestId" && moduleName === "luastra/timer") return `Use ${qualified} when recording the acknowledgement returned by start, restart, or cancel. Do not wait for Application.resolve: the timer expiry is delivered as a timer event to Application.handle.`;
  if (name === "RequestId") return `Use ${qualified} as the key in a pending-operation map after starting an asynchronous ${publicPrefix(moduleName)} request. Match and remove that key in Application.resolve instead of relying on completion order.`;
  if (name.endsWith("Options")) return `Use ${qualified} when a reusable variable or helper passes configuration to the related SDK operation. The exported type keeps optional and required fields aligned with the checked public contract.`;
  if (name.endsWith("Error") || name.endsWith("Failure")) return `Use ${qualified} on the unsuccessful branch of the related result. Read its stable fields for control flow or diagnostics; do not parse human-readable assertion or error text.`;
  if (name.endsWith("Success")) return `Use ${qualified} after narrowing the related result with success == true. Only this branch guarantees access to the decoded value and other success-specific fields.`;
  if (name.endsWith("Result") && moduleName === "luastra/navigation") return `Use ${qualified} for checked navigation operations. Test result.success first, then explicitly verify the optional field needed by that branch; do not assume the boolean field narrows this record as a tagged union.`;
  if (name.endsWith("Result")) return `Use ${qualified} at the boundary where untrusted or versioned input is decoded. Branch on result.success before reading value or error so both outcomes remain explicit and type-safe.`;
  if (name === "Node") return "Use UI.Node as the return type of helpers that construct interface fragments and as the required return type of Application.render. Application code should create nodes through UI constructors rather than assembling raw node tables.";
  if (name === "Theme") return "Use UI.Theme to define one reusable palette and pass it to multiple UI.Screen roots. Override only the colors your product owns; omitted fields intentionally retain Luastra's accessible defaults.";
  if (name === "Properties") return "Use UI.Properties when a generic helper needs to inspect or pass a validated node property map. Most applications should prefer the named fields of individual UI constructors instead of constructing this map directly.";
  if (name.includes("Stack") || name.includes("Compiler")) return `Use ${qualified} as long-lived application state when navigation must survive repeated renders. Create it once, mutate it through its public methods, and render from its current route rather than rebuilding it on every render.`;
  if (["Tween", "Wait", "Sequence", "Descriptor", "MotionMap", "Easing"].includes(name)) return `Use ${qualified} when declaring motion separately from UI layout and assigning it to a component's motion property. Keep the value deterministic and within the documented channels so every host can reproduce the same transition.`;
  return `Use ${qualified} when annotating values that cross the public ${moduleName} boundary or when exporting helpers built on that module. The type documents the exact checked shape and prevents unrelated tables from being substituted accidentally.`;
};
const typeCards = (moduleName) => sdkTypeInventory[moduleName].map((name) => entry(`${publicPrefix(moduleName)}.${name}`, `export type ${name}`, typePurpose(moduleName, name), { kind: "type", useWhen: typeUseWhen(moduleName, name) }));

const uiGuidance = {
  Screen: ["Creates the single root of a rendered interface. It establishes document metadata, the content-width policy, and the inherited color theme that descendants use unless they provide a local override.", "Use UI.Screen exactly once at the root of Application.render. Choose it when starting a page or route; use Column, Row, or another container for every nested region."],
  Column: ["Arranges child nodes vertically in source order and applies gap, cross-axis alignment, main-axis distribution, spacing, and inherited colors to that group. Its measured size participates in the surrounding layout.", "Use UI.Column for forms, articles, settings, and other top-to-bottom flows. Choose Layer instead when children must overlap, or Row when the primary flow is horizontal."],
  Row: ["Arranges child nodes horizontally and can wrap or switch to a narrow-screen layout when configured as responsive. align controls the vertical cross axis while justify distributes space along the horizontal main axis.", "Use UI.Row for toolbars, compact metadata, button groups, and side-by-side content. Enable wrapping or responsive behavior when the combined child widths may exceed a phone viewport."],
  Text: ["Renders selectable semantic text with body or heading meaning, line alignment, status roles, and inherited or local foreground and background colors. Width controls the box in which textAlign operates.", "Use UI.Text for every visible label, paragraph, heading, status announcement, or validation message that is not the built-in label of another control. Pick a heading variant only when it represents the document hierarchy."],
  Button: ["Creates an accessible native action that supports pointer, touch, keyboard, disabled state, appearance semantics, and a bounded host-rendered icon vocabulary. Activation sends its declared onTap action and stable component ID to Application.handle.", "Use UI.Button when the user initiates an operation or changes application state. Icon-only buttons require a descriptive label. Use UI.Link for navigation to a location; do not simulate a button by making a Shape clickable."],
  Link: ["Creates a semantic link for an admitted node fragment, canonical hash route, or safe external HTTPS location. Hosts preserve link navigation and accessibility behavior instead of treating it as a generic tap action.", "Use UI.Link when activation changes location or opens a documented resource. Use a canonical #/ route for application navigation, a # fragment for one rendered node, and UI.Button when the action only modifies current state."],
  Code: ["Renders a short inline literal with code semantics and a monospace presentation while preserving surrounding text flow. The value remains selectable and accessible as text.", "Use UI.Code for command names, identifiers, property values, and short expressions inside explanatory content. Use UI.CodeBlock for multiline source or commands."],
  CodeBlock: ["Renders multiline literal source in a scrollable, selectable code region without interpreting markup. It preserves line breaks and supports long examples within bounded page width.", "Use UI.CodeBlock for complete snippets, terminal sessions, JSON, or other preformatted material. Keep prose and very short identifiers in UI.Text or UI.Code."],
  Divider: ["Creates a visual separator with optional semantic meaning between adjacent content regions. The host supplies consistent thickness and theme-aware coloring.", "Use UI.Divider when grouping is otherwise unclear between neighbouring sections. Mark purely decorative separators accordingly and prefer spacing when separation alone is sufficient."],
  Table: ["Creates semantic tabular data whose direct children are TableRow nodes. Assistive technologies can preserve row and column relationships that a collection of generic rows cannot express.", "Use UI.Table for genuinely two-dimensional data where headers identify values across rows or columns. Use List or Grid for collections that do not require table relationships."],
  TableRow: ["Defines one semantic row inside UI.Table and restricts its direct children to TableCell nodes. Source order becomes the accessible column order.", "Use UI.TableRow only as a direct child of UI.Table, once per header or data row. Keep every row's cell structure consistent with the table headers."],
  TableCell: ["Creates a data cell or a scoped row or column header within a TableRow. Header scope lets assistive technology announce the correct relationship while users move through the table.", "Use UI.TableCell only inside UI.TableRow. Mark cells as headers when they label a row or column; use ordinary cells for values."],
  FlipCard: ["Creates a fixed two-sided 3D surface whose first child is the front and second child is the back. A rotationY motion from Motion.flip controls which face is visible while both sides share the same bounds.", "Use UI.FlipCard for reveal interactions where two complete visual trees occupy one card-sized area. Use Layer inside either face when that face needs an image, shape, and overlaid text."],
  Image: ["Displays an image admitted by luastra.json through a typed Assets.Image reference and URI. Explicit dimensions, aspect ratio, fit, clipping, accessible label, and motion keep rendering deterministic across hosts.", "Use UI.Image for packaged PNG, JPEG, WebP, or AVIF artwork. Use UI.Shape for scalable geometry that does not need an asset, and supply a meaningful label unless the image is genuinely decorative."],
  Layer: ["Places all children in the same coordinate space instead of adding their sizes sequentially. The first child establishes the layer bounds; later children are overlaid and aligned within those bounds.", "Use UI.Layer for text over artwork, badges, card faces, and other overlapping compositions. Put the size-defining background first and wrap overlay content in a full-size Column or Row when it needs predictable alignment."],
  Shape: ["Draws a bounded host-native geometric figure with explicit size, fill, outline, corner radius, label, and optional motion. It avoids shipping an image for simple scalable artwork.", "Use UI.Shape for rectangles, circles, polygons, stars, outlines, and colored card faces. Use UI.Image when the visual contains texture or detail that geometry cannot represent."],
  TextInput: ["Creates a controlled single-line text field with native keyboard hints, autofill metadata, validation semantics, and composition-safe input delivery. The displayed value always comes from application state.", "Use UI.TextInput for editable text, email, password, search, telephone, or numeric entry. Update its state from onInput and return the new value on the following render; use a custom component only for unsupported multiline editing."],
  List: ["Creates an ordered or unordered semantic collection whose direct children are ListItem nodes. It preserves collection boundaries and item count for assistive technology.", "Use UI.List when sibling items form one meaningful sequence or set. Use Column for unrelated blocks and Table for values with row-and-column relationships."],
  ListItem: ["Defines one semantic member of a UI.List while allowing structured content inside the item. The host keeps the item associated with its parent collection.", "Use UI.ListItem only as a direct child of UI.List, once per conceptual item. Put buttons, links, and descriptive content inside the item when they belong to that entry."],
  Modal: ["Creates an accessible dialog above the current screen, moves focus into it, traps navigation within its boundary, and restores focus after dismissal. onDismiss connects host dismissal gestures to application state.", "Use UI.Modal for short blocking decisions or focused information that must be handled before returning to the page. Use an ordinary routed screen for long, independently navigable workflows."],
  Orbit: ["Creates the bounded root for Constellation Orbit navigation and delegates geometry, semantic zoom, focus movement, inactive-depth isolation, themes, and reduced-motion behavior to the host.", "Use UI.Orbit when an application benefits from spatial discovery while still requiring a complete list fallback, stable navigation state, keyboard access, and identical meaning across host presentations."],
  OrbitPath: ["Creates the stable navigation and preference rail above an Orbit, containing only semantic buttons and text while the active constellation and Focus Surface change beneath it.", "Use UI.OrbitPath for ancestor return controls, the current depth label, and Orbit-wide preferences that must remain available without being duplicated inside every constellation."],
  OrbitSearch: ["Creates a controlled local-constellation search input plus a live result summary. The application owns filtering and supplies both the current result count and total count.", "Use UI.OrbitSearch when the active constellation can become difficult to scan. Keep the query in Luau state, preserve stable node IDs, and hide non-matching nodes instead of creating a parallel result model."],
  Constellation: ["Creates one Orbit navigation depth with exactly one semantic center and between one and sixty-four nodes or clusters. The host owns spatial placement and list fallback.", "Use UI.Constellation for each root or nested content space in an Orbit. Keep inactive neighbours as behind or ahead only when they are needed for bounded transitions."],
  OrbitCenter: ["Creates the non-interactive identity at the center of a constellation from a required title and optional description. The host preserves it in both spatial and list presentations.", "Use UI.OrbitCenter exactly once in each UI.Constellation to name the current semantic space. Do not use it as an action or encode application coordinates in its content."],
  OrbitNode: ["Creates an interactive leaf, constellation destination, or bounded action with priority, optional ring hint, relationships, compact icon, status, selection, busy, and disabled semantics.", "Use UI.OrbitNode for every individually actionable concept in a constellation. Supply stable meaning and state; let the host select coordinates and the visible Signal, Identity, or Preview tier."],
  OrbitCluster: ["Creates one semantic entry for an application-authored group and exposes its bounded item count. It participates in relationships, priority placement, semantic zoom, and list fallback as one button.", "Use UI.OrbitCluster when several nodes have a real domain grouping and a local destination constellation. Do not group items only because their current screen coordinates happen to be close."],
  FocusSurface: ["Creates the full-detail dialog opened from an Orbit leaf while retaining deterministic focus restoration, host-owned transition geometry, bounded scrolling, and reduced-motion behavior.", "Use UI.FocusSurface for focused leaf content that belongs to the current Orbit route. Keep open state and dismissal in Luau navigation so Back, direct links, and visible controls reach the same outcome."],
  FocusHeader: ["Creates the sticky identity and return rail inside a Focus Surface. It requires exactly one visible heading Text and one available Button in a stable reading order.", "Use UI.FocusHeader at the beginning of every scrollable Focus Surface so the current leaf title and explicit return action remain visible without changing dialog focus order."],
  OrbitReturn: ["Creates the canonical semantic return button used by an Orbit path. The host can route Escape through the same declared action, preserving one application-owned navigation outcome.", "Use UI.OrbitReturn for returning from a nested constellation. Disable the root control when no ancestor exists, and do not add a second hidden Back implementation."],
  Stack: ["Offers a concise vertical composition primitive with the same layout direction as Column and stack-specific host styling. Children remain in normal flow and do not overlap.", "Use UI.Stack for straightforward vertical groups where the semantic name improves readability. Use UI.Column when you want the canonical general-purpose vertical container or need examples shared across all hosts."],
  Grid: ["Creates a responsive multi-column collection using two, three, or adaptive columns while retaining source order. Items reflow as available width changes instead of requiring manual breakpoint calculations.", "Use UI.Grid for galleries, dashboards, feature cards, and repeated items of comparable importance. Use Table for relational data and Row when content must remain one-dimensional."],
  Scroll: ["Creates a bounded vertical or horizontal scrolling region and preserves its children as one navigable group. It prevents oversized content from forcing the surrounding screen beyond its intended bounds while allowing wheel input on the unused axis to continue through the surrounding page.", "Use UI.Scroll when a specific region—not the whole document—must scroll, such as filter chips, long panels, or media strips. Avoid nested scroll regions unless the interaction genuinely needs independent axes."],
  Card: ["Creates a themed surface for grouping related content, with consistent padding, border, elevation, inherited colors, and optional motion. It is a layout container rather than a playing-card animation primitive.", "Use UI.Card to visually group one concept such as a result, article preview, or setting. Use FlipCard for two-sided reveals and plain Column when no surface treatment is needed."],
  Field: ["Groups a form label, input, hint, and validation message into one semantic and visual unit. Shared spacing and inherited state keep the relationship understandable without positioning each element manually.", "Use UI.Field around each form control that needs visible guidance or validation. Keep the input and its related error inside the same field and connect errorId where applicable."],
  Actions: ["Arranges a related set of buttons or links as a wrapping action region with consistent spacing and inherited alignment. It communicates that the controls complete or advance the same local task.", "Use UI.Actions for form submission controls, dialog choices, or page-level action groups. Use Row for horizontal content that is not specifically a set of user actions."],
};
const uiProps = {
  Screen: ["layout", "theme", "semantic"], Column: ["layout", "text-style", "semantic"], Row: ["layout", "text-style", "semantic"], Text: ["text-style", "semantic", "motion"], Button: ["action", "text-style", "semantic"], Link: ["action", "text-style", "semantic"], Code: ["text-style", "semantic"], CodeBlock: ["layout", "text-style", "semantic"], Divider: ["layout", "semantic"], Table: ["layout", "text-style", "semantic"], TableRow: ["layout", "text-style", "semantic"], TableCell: ["layout", "text-style", "semantic"], FlipCard: ["visual", "motion"], Image: ["visual", "label", "motion"], Layer: ["layout", "text-style", "semantic", "motion"], Shape: ["visual", "label", "motion"], TextInput: ["input", "semantic"], List: ["label", "layout", "semantic"], ListItem: ["text", "layout", "semantic"], Modal: ["modal", "semantic"], Orbit: ["layout", "semantic"], OrbitPath: ["layout", "semantic"], OrbitSearch: ["semantic"], Constellation: ["semantic"], OrbitCenter: ["semantic"], OrbitNode: ["action", "semantic"], OrbitCluster: ["action", "semantic"], FocusSurface: ["modal", "semantic"], FocusHeader: ["layout", "semantic"], OrbitReturn: ["action", "semantic"], Stack: ["layout", "semantic"], Grid: ["layout", "columns", "semantic"], Scroll: ["layout", "scroll", "semantic"], Card: ["layout", "surface", "motion", "semantic"], Field: ["layout", "label", "semantic"], Actions: ["layout", "semantic"],
};
const uiCards = [...typeCards("luastra/ui"), ...sdkInventory["luastra/ui"].map((item) => entry(`UI.${item}`, `UI.${item} { ... } -> UI.Node`, uiGuidance[item][0], { useWhen: uiGuidance[item][1], props: uiProps[item] }))];

const apiGuidance = {
  "luastra/assets": {
    image: ["Creates a typed reference to an image declared in luastra.json. Construction validates the asset identifier and preserves its media kind so an image cannot be passed accidentally where audio or a font is required.", "Use Assets.image at module initialization or in a small asset helper when UI.Image needs packaged artwork. The identifier must match an admitted image asset; this function does not load arbitrary files or remote URLs."],
    audio: ["Creates a typed reference to an admitted audio asset while retaining the asset kind and canonical asset URI. The reference can be stored safely before a media queue is assembled.", "Use Assets.audio when building Media.QueueItem values for sounds shipped with the application. Use a trusted HTTPS source only where the media contract explicitly admits one; do not disguise a filesystem path as an asset ID."],
    font: ["Creates a typed reference to a font declared by the project manifest. The result distinguishes font resources from images and audio before a host attempts to consume them.", "Use Assets.font when a supported styling or host workflow requests a packaged font reference. Keep font licensing and the manifest declaration alongside the asset; creating the reference alone does not apply the font to text."],
    uri: ["Returns the canonical asset URI carried by a typed Image, Audio, Font, or general Reference. The URI is host-neutral and points only to a resource already admitted by the project manifest.", "Use Assets.uri at the final SDK boundary that expects a URI string, such as UI.Image.source or a media queue item. Keep the typed reference until that boundary so asset kinds remain checked for as long as possible."],
  },
  "luastra/data": {
    string: ["Builds a runtime schema for string input with optional UTF-8 byte-length bounds and trimming defined by Data.StringOptions. The schema is a description only; validation occurs later through Data.decode.", "Use Data.string for form fields, URL parameters, storage fields, or server properties that must be text at runtime. Add the narrowest useful byte bounds at the untrusted boundary; this alpha has no pattern option, so validate application-specific formats separately."],
    number: ["Builds a schema that accepts finite numeric values and can enforce the documented minimum, maximum, or integer constraints. Non-numbers and non-finite values fail with structured validation information.", "Use Data.number whenever an external value becomes a score, index, duration, amount, or other numeric application value. Constrain the range before using it in layout, navigation, persistence, or calculations."],
    boolean: ["Builds a strict boolean schema that accepts only true or false. It does not coerce strings such as \"true\", numeric flags, or other truthy values.", "Use Data.boolean for persisted toggles and server fields whose wire contract is genuinely Boolean. Normalize legacy encodings before this boundary or migrate them explicitly rather than relying on implicit coercion."],
    array: ["Builds a dense-array schema whose every element must satisfy the supplied item schema, with optional array-length bounds. Validation records the failing index so callers can identify malformed members.", "Use Data.array for ordered JSON-style collections with contiguous indexes and one element contract. Use Data.object for named fields or a custom migration when the input is a sparse keyed map."],
    object: ["Builds a schema for a table with named fields, validating each field through its own child schema and applying the object options for unknown keys. Nested schemas preserve a structured path to every failure.", "Use Data.object at storage, server, or form boundaries where several named values must be accepted together. Declare all trusted fields explicitly and decide deliberately whether unknown fields should be rejected."],
    optional: ["Wraps another schema so nil is accepted in addition to the wrapped value. A non-nil value still passes through the complete nested validation contract.", "Use Data.optional for fields that may be absent by design, not merely because validation is inconvenient. Keep required identifiers, security decisions, and version fields non-optional."],
    decode: ["Validates an unknown runtime value against a Schema and returns a discriminated Data.Result instead of throwing for ordinary invalid input. Success contains the trusted value; failure contains a bounded code and path.", "Use Data.decode immediately after receiving untrusted form, URL, storage, or server data and before casting it to an application type. Branch on result.success and present or log only appropriate bounded failure details."],
  },
  "luastra/debug": {
    log: ["Emits a development diagnostic at the ordinary log level, serializing the supplied values through the host's bounded debug channel. It has no role in application state or user-visible status.", "Use Debug.log for temporary progress, state-transition, and correlation diagnostics during local development. Remove noisy calls before release and never include credentials, tokens, personal data, or complete sensitive payloads."],
    warn: ["Emits a warning-level development diagnostic for an unexpected but recoverable condition. Hosts may distinguish it visually from normal logs while preserving the same bounded argument handling.", "Use Debug.warn when the application can continue but a fallback, stale value, or unusual branch deserves developer attention. User-correctable validation belongs in the UI, not only in the debug console."],
    error: ["Emits an error-level diagnostic without replacing structured application error handling or automatically terminating execution. The message is intended for developers observing a failing operation.", "Use Debug.error when an operation reaches a failure branch that should be conspicuous during development. Still update user-visible state and handle the Result or resolve failure explicitly; do not use logging as control flow."],
  },
  "luastra/timer": {
    start: ["Registers a one-shot timer under the supplied stable string ID and returns an acknowledgement RequestId. After the delay, Luastra sends handle(\"timer\", id, value); it does not call Application.resolve for expiry.", "Use Timer.start for delayed transitions, temporary feedback, debouncing, or advancing a game after the user has had time to see a result. Choose a stable purpose-specific ID and handle repeated starts deliberately rather than creating unbounded timers."],
    restart: ["Replaces the pending one-shot timer with the same ID and schedules a fresh delay and value. This makes repeated input postpone one logical deadline instead of allowing several expiries to race.", "Use Timer.restart for inactivity deadlines, search debounce, and any timeout whose countdown must begin again after a new event. Use start for a new logical timer and cancel when the pending work is no longer relevant."],
    cancel: ["Cancels the pending timer identified by the stable string ID and returns a request acknowledgement. A successfully cancelled timer will not later emit its timer event.", "Use Timer.cancel when leaving the owning screen, completing work early, or replacing an automatic transition with a user decision. Cancellation should be safe even if application state has already moved on."],
  },
  "luastra/motion": {
    tween: ["Creates one deterministic numeric transition from a starting value to an ending value over a bounded duration and easing curve. A Tween becomes meaningful only when assigned to a supported motion channel or placed in a Sequence.", "Use Motion.tween when you need direct control of one opacity, translation, scale, or rotation channel. Prefer a named preset when it already expresses the intended interaction and respect reduced-motion behavior supplied by the host."],
    wait: ["Creates a non-visual delay step for Motion.sequence. It advances no property itself and exists only to postpone the next Tween in the same channel.", "Use Motion.wait between sequence steps when timing is part of the visual story, such as holding a revealed state before returning. Use Timer instead when the delay must change application state or dispatch application logic."],
    sequence: ["Combines Tween and Wait steps into one ordered value for a single motion channel, optionally repeating the sequence. Each step begins after the previous step finishes, so timing remains deterministic across hosts.", "Use Motion.sequence for multi-stage motion of one property, such as fade-hold-fade or rotate-return. It is not a MotionMap by itself: assign the Sequence as a channel value inside the component's motion table."],
    fadeIn: ["Returns a complete MotionMap that transitions opacity from a lower value to fully visible using bounded preset defaults and optional overrides. The map can be assigned directly to a component's motion property.", "Use Motion.fadeIn for newly appearing supporting content when opacity communicates entry without changing layout. Avoid it for essential immediate feedback or when reduced motion should present the final state instantly."],
    slideIn: ["Returns a MotionMap that combines translation with the preset's arrival timing, moving content from an offset into its final layout position. Layout is calculated at the destination; motion changes only the rendered transform.", "Use Motion.slideIn to introduce a panel, card, or route whose direction reinforces where it came from. Do not use it to repair layout spacing, and keep the distance modest for frequently repeated elements."],
    scaleIn: ["Returns a MotionMap that grows a component from a smaller scale to its final size without changing the space reserved by layout. Optional values tune the starting scale, duration, and easing within admitted bounds.", "Use Motion.scaleIn for a newly created card, badge, or focused object when gentle emphasis helps orientation. Avoid scaling dense text or controls so often that reading and targeting become unstable."],
    sway: ["Returns a repeating rotation MotionMap that alternates around the resting angle, producing a gentle rocking effect. Iteration and duration options control whether it settles or continues.", "Use Motion.sway for occasional ambient motion on a decorative or game-like object, such as a hidden card. Keep the angle small, stop it when the object is inactive, and rely on host reduced-motion handling."],
    pulse: ["Returns a repeating scale MotionMap that expands and contracts around the component's normal size. The component keeps its original layout bounds while the transform provides visual emphasis.", "Use Motion.pulse sparingly for a current target, waiting object, or time-sensitive affordance. Do not run it continuously on many elements or use motion as the only way to convey status."],
    shake: ["Returns a short horizontal translation MotionMap that moves away from and back to the resting position. It is designed as bounded feedback rather than an ambient loop.", "Use Motion.shake after a rejected guess or invalid action when the UI also exposes an accessible text or status explanation. Do not use it for ordinary errors that have not yet been caused by user action."],
    flip: ["Returns a rotationY MotionMap tailored to UI.FlipCard, moving between front and back angles over a bounded duration. The FlipCard host uses the channel to hide the reverse face correctly during the 3D transition.", "Use Motion.flip only with UI.FlipCard when application state changes which of its two children is visible. Update the state and angle together; use a general rotation tween for single-sided objects."],
  },
  "luastra/navigation": {
    decideBack: ["Evaluates the current modal, application stack, browser history, and root-exit conditions and returns the bounded Back action the application should take. It centralizes priority so platform Back behaves consistently.", "Use Navigation.decideBack inside a system_back handler when several layers may consume Back. Execute the returned decision explicitly—close a modal, pop a route, delegate to history, acknowledge handled, or request exit."],
    create: ["Creates a named-route stack initialized from Navigation.Options and exposes operations such as current, push, replace, back, encode, and restore. The stack is ordinary application state and survives renders when created once at module scope.", "Use Navigation.create for an application whose routes can be represented by stable names and optional state tokens without typed path parameters. Render from stack.current() and mutate the same stack in Application.handle."],
    createRouter: ["Creates an entry-based navigation stack whose entries carry a route name, parameters, query values, and optional state. Mutations return structured results rather than relying on unchecked table shapes.", "Use Navigation.createRouter when each history entry needs typed route data that can later be compiled to or restored from a location. Prefer Navigation.create for a simpler name-only stack."],
    compile: ["Compiles route definitions into a RouteCompiler that generates canonical locations and matches incoming path and query strings back to typed route entries. Invalid definitions and malformed locations produce bounded route errors.", "Use Navigation.compile once at module initialization when web URLs or deep links must share one source of truth with application routes. Generate links through the compiler and validate incoming locations before changing the navigation stack."],
  },
  "luastra/state": {
    encode: ["Serializes a finite field map together with an explicit positive version into Luastra's deterministic snapshot format. The output is suitable for host storage and can be compared or migrated predictably.", "Use State.encode immediately before Host.storageSet when small application state must survive restarts. Persist only bounded non-secret data and increment the version whenever the stored schema changes incompatibly."],
    decode: ["Parses a snapshot string, verifies its structure and version, and returns a discriminated DecodeResult. A version mismatch or malformed value remains a normal failure branch rather than becoming trusted state.", "Use State.decode after reading storage when only the current snapshot version is accepted. Branch on success before restoring fields; use State.migrate when older admitted versions must be upgraded."],
    migrate: ["Decodes a snapshot and applies explicitly ordered Migration functions until it reaches the requested target version. The result records structured failure if a step is missing, invalid, or does not advance correctly.", "Use State.migrate during application startup when released versions must preserve user state across schema changes. Keep every migration deterministic, test each supported starting version, and never silently reinterpret unknown future data."],
  },
  "luastra/host": {
    storageGet: ["Starts an asynchronous read of the named host storage entry and returns a RequestId. Completion arrives in Application.resolve with the stored string or a bounded failure code.", "Use Host.storageGet during startup or on demand for small persisted application data. Record the RequestId before returning, distinguish missing data from other failures, and decode the payload before trusting it."],
    storageSet: ["Starts an asynchronous write of a bounded string to the named host storage entry and returns a RequestId. Resolve confirms whether the host committed the value.", "Use Host.storageSet after State.encode or another explicit serialization step. Track the RequestId when UI must report save progress or failure, and never store credentials merely because the API accepts a string."],
    launchUrl: ["Requests the URL or fragment with which the host launched the application and returns a RequestId. The host answers through Application.resolve; this function reads launch context and never opens an external destination.", "Use Host.launchUrl during startup when a deep link or host-provided launch location must select initial application state. Save the RequestId, validate the resolve payload before routing, and use UI.Link—not Host.launchUrl—to open a visible external HTTPS link."],
    clipboardWrite: ["Requests that the host place a bounded string on the system clipboard and returns a RequestId for completion. Clipboard access remains an explicit capability rather than a hidden side effect.", "Use Host.clipboardWrite after a clear user action such as Copy code or Copy link. Confirm success accessibly when useful and avoid copying secrets or personal data without an explicit user expectation."],
    historyPush: ["Adds a new browser-history entry with the supplied opaque application state token while retaining the current location. The asynchronous acknowledgement is delivered through Application.resolve.", "Use Host.historyPush when application navigation should create a Back destination without changing the visible URL. Prefer historyPushLocation when the route also has a canonical location."],
    historyReplace: ["Replaces the current browser-history state token without adding a new Back entry. It keeps the current location and returns a RequestId for host acknowledgement.", "Use Host.historyReplace when correcting or initializing the current entry so Back should not revisit the previous state. Use push for a user-visible navigation step."],
    historyPushLocation: ["Adds a browser-history entry containing both a canonical location and an opaque application state token, then returns the document viewport to its start. This keeps the address bar, deep-link representation, application stack, and newly opened page position synchronized.", "Use Host.historyPushLocation after a successful typed route mutation that should be reversible with Back. Generate the location through Navigation.compile rather than concatenating untrusted path or query fragments."],
    historyReplaceLocation: ["Replaces the current browser-history location and state token without extending the Back stack, then returns the document viewport to its start. The host validates and acknowledges the requested history mutation asynchronously.", "Use Host.historyReplaceLocation for redirects, canonicalization, and restoring the initial route when the obsolete location should not remain reachable through Back."],
    historyBack: ["Requests one step back in the host browser history and returns a RequestId. The resulting location or system-Back event remains part of the normal navigation event flow.", "Use Host.historyBack after Navigation.decideBack delegates to browser history or when a UI Back control intentionally mirrors browser Back. Do not also pop application state independently unless the history event contract requires it."],
    historyCurrent: ["Requests the host's current location and associated state token, returning a RequestId whose payload can initialize or reconcile application navigation.", "Use Host.historyCurrent at startup or after an external history change when the application must match the browser's current entry. Validate and compile the returned location before rendering a route."],
    systemBackHandled: ["Acknowledges that the application consumed a specific system-Back intent without delegating to browser history or exiting. The intent ID prevents an unrelated or stale Back request from being acknowledged.", "Use Host.systemBackHandled after closing an open modal or handling Back entirely in application state. Call it once for the current intent after the state change has been accepted."],
    systemBackHistory: ["Delegates a specific system-Back intent to the host history mechanism and returns a RequestId. It preserves platform navigation behavior when an earlier history entry is available.", "Use Host.systemBackHistory when Navigation.decideBack determines that browser or host history owns the next Back step. Do not use it when an application modal or local route must close first."],
    systemBackExit: ["Acknowledges a root-level system-Back intent by requesting the host's admitted exit behavior. The intent ID correlates the decision with the exact pending Back event.", "Use Host.systemBackExit only when no modal, local route, or history entry can consume Back and the platform permits root exit. Desktop and web hosts may interpret this boundary differently."],
  },
  "luastra/server": {
    call: ["Starts a versioned request to a trusted backend operation with a bounded string map and optional request settings, returning a RequestId. Server authentication, authorization, validation, and secrets remain outside client Luau.", "Use Server.call for declared backend work that cannot safely or reliably run in the client, such as privileged data access. Track the RequestId, handle transport failure in Application.resolve, and validate successful payloads before use."],
    decode: ["Parses the bounded payload returned by a Luastra server operation into a discriminated DecodeResult. It separates envelope validity from the transport success reported to Application.resolve.", "Use Server.decode on a successful server resolve payload before reading operation data. Treat decode failure as an untrusted or incompatible response and keep application state unchanged or move to an explicit error state."],
  },
  "luastra/media": {
    setQueue: ["Replaces the host playback queue with validated QueueItem values and optionally selects a one-based item, returning a RequestId. The host reports later playback changes through media_state events.", "Use Media.setQueue before play when the application owns a new playlist, meditation sequence, or sound set. Keep stable item IDs, validate the selected index, and avoid rebuilding an unchanged queue on every render."],
    play: ["Requests playback of the selected queue item, resuming from the current position when the host state permits it. The returned RequestId acknowledges the command; live truth comes from media_state.", "Use Media.play after a user action or admitted autoplay decision when a queue item is selected. Update visible controls from decoded media state rather than assuming the command succeeded immediately."],
    pause: ["Requests that playback pause while retaining the selected item and current position for a later resume. Completion and subsequent live state are delivered through the normal media contracts.", "Use Media.pause when the user temporarily stops listening or application lifecycle policy requires a resumable pause. Use stop when position should return to the beginning."],
    stop: ["Requests that playback stop and reset the current item according to the host contract while retaining the queue. It differs from unload, which releases the active media resources.", "Use Media.stop when the session ends but the same queue may be played again. Use pause for a resumable interruption and unload when the queue is no longer needed."],
    unload: ["Requests release of the active media queue and playback resources, clearing state that should not survive the current media session. A later play requires setting an appropriate queue again.", "Use Media.unload when leaving the media feature, signing out, or replacing the session with unrelated content. Do not unload for a brief pause because it discards resumable host state."],
    next: ["Requests selection of the next item in the current queue according to host queue boundaries. The actual selected index and playback state arrive through media_state.", "Use Media.next for an explicit Next control or a policy that advances after completion. Disable or explain the control when decoded media state shows that no next item is available."],
    previous: ["Requests selection of the previous item in the current queue according to host queue boundaries. It does not let application code assume whether the host restarts or changes items without observing state.", "Use Media.previous for an explicit Previous control and derive availability from decoded media state. Define separately whether a near-start press should restart the current item in application UX."],
    state: ["Requests a current snapshot of queue, selection, playback, position, duration, and bounded media error state. The asynchronous payload is decoded with Media.decodeState.", "Use Media.state to initialize controls after startup, restoration, or a suspected missed event. Prefer live media_state events for routine updates instead of polling continuously."],
    seek: ["Requests movement of the selected media item to the supplied non-negative millisecond position. The host clamps or rejects values according to the current duration and reports the resulting state asynchronously.", "Use Media.seek for a user-operated scrubber, skip control, or explicit chapter jump. Base the target on decoded duration and position, and do not issue a request for every unthrottled pointer movement."],
    decodeState: ["Validates and decodes a media-state payload into a discriminated Media.DecodeResult containing the typed playback State or a bounded failure. This keeps host strings outside trusted application state until checked.", "Use Media.decodeState for every media_state event and successful Media.state response before updating controls, lock-screen-facing state, or persistence. Preserve the previous known state when decoding fails."],
  },
};
const apiCards = (moduleName) => sdkInventory[moduleName].map((item) => {
  const guidance = apiGuidance[moduleName]?.[item];
  if (!guidance) throw new Error(`Missing API guidance for ${moduleName}.${item}`);
  return entry(`${publicPrefix(moduleName)}.${item}`, `${item}(...)`, guidance[0], { useWhen: guidance[1] });
});

const uiTables = [
  { id: "ui-properties-layout", title: "Layout and surfaces", rows: [row("gap", "none | xs | sm | md | lg | xl", "Space between children."), row("padding", "none | xs | sm | md | lg | xl | responsive", "All-side inner spacing; responsive is supported only by padding."), row("margin", "none | xs | sm | md | lg | xl", "All-side outer spacing."), row("paddingX / paddingY", "none | xs | sm | md | lg | xl", "Axis-specific inner spacing."), row("paddingTop / paddingBottom / paddingStart / paddingEnd", "none | xs | sm | md | lg | xl", "Logical side-specific inner spacing."), row("marginX / marginY", "none | xs | sm | md | lg | xl", "Axis-specific outer spacing."), row("marginTop / marginBottom / marginStart / marginEnd", "none | xs | sm | md | lg | xl", "Logical side-specific outer spacing."), row("surface", "plain | card | elevated | accent", "Background, border, and elevation."), row("width", "full | content | wide", "Available width, 720 px maximum, or 1180 px maximum."), row("align", "start | center | end | stretch | between", "Cross-axis alignment."), row("justify", "start | center | end | between", "Main-axis alignment."), row("flow", "wrap | nowrap", "Flex wrapping."), row("columns", "adaptive | two | three", "Grid columns."), row("scroll", "vertical | horizontal", "Scroll axis."), row("responsive", "boolean", "Narrow-screen adaptation."), row("className", "safe string ≤ 256 bytes", "Additional admitted class tokens.")] },
  { id: "ui-properties-semantics", title: "State and semantics", rows: [row("tone", "muted | error | success", "Semantic text tone."), row("appearance", "primary | secondary | danger | ghost", "Action appearance."), row("variant", "body | subheading | heading | title", "Body text or h3, h2, and h1 heading semantics."), row("role", "alert | group | status", "Supported ARIA role."), row("label", "string", "Accessible name."), row("hidden", "boolean", "Visibility state."), row("disabled", "boolean", "Disabled state."), row("busy", "boolean", "aria-busy state."), row("required", "boolean", "Required input state."), row("errorId", "component id", "Associates a visible role=alert.")] },
  { id: "ui-properties-text-style", title: "Text and local colors", rows: [row("textAlign", "start | center | end", "Aligns lines within Text width."), row("textColor", "token | #RRGGBB", "Local or inherited foreground."), row("backgroundColor", "token | #RRGGBB", "Component-box background."), row("Color tokens", "accent | danger | muted | surface | success | text | transparent | warning", "Current Screen theme colors.")] },
  { id: "ui-properties-theme", title: "UI.Screen theme", rows: [row("theme", "UI.Theme", "Reusable optional colors; direct fields win."), ...["background", "text", "accent", "danger", "muted", "surface", "success", "warning"].map((name) => row(`${name}Color`, "#RRGGBB", `${name} theme color.`))] },
  { id: "ui-properties-input", title: "TextInput", rows: [row("inputType", "text | email | password", "Native field type."), row("inputMode", "decimal | email | numeric | search | tel | text | url", "Preferred mobile keyboard."), row("enterKeyHint", "done | enter | go | next | previous | search | send", "Enter-key behavior."), row("autoComplete", "supported token", "Autofill hint."), row("placeholder", "string", "Short hint shown while the controlled value is empty."), row("value", "string", "Controlled value."), row("onInput", "action string", "Committed IME update action.")] },
  { id: "ui-properties-events", title: "Events and motion", rows: [row("onTap", "action string", "Activation action."), row("onInput", "action string", "Input action."), row("onDismiss", "action string", "Modal dismissal action."), row("motion", "{ [property]: Tween | Sequence }", "Opacity, rotation, scale, and translation channels.")] },
  { id: "ui-properties-visual", title: "Image, Shape, and FlipCard", rows: [row("source", "asset:image/...", "Typed image URI."), row("fit", "contain | cover | fill | none | scaleDown", "Image scaling."), row("width / height", "1…4096", "CSS-pixel size."), row("aspectRatio", "0.05…20", "Aspect ratio."), row("cornerRadius", "0…2048", "Corner radius."), row("shape", "rectangle | roundedRectangle | circle | oval | triangle | diamond | pentagon | hexagon | star", "Shape geometry."), row("fill / stroke", "token | #RRGGBB", "Fill and outline."), row("strokeWidth", "0…64", "Outline thickness.")] },
];
const moduleNarrative = {
  "luastra/motion": ["Declares host-neutral transitions and reusable animation presets without putting a frame loop in application code. Motion values are attached to supported UI properties; host schedulers interpolate them independently and honor reduced-motion preferences.", ["Build a Tween for one numeric channel, combine Tween and Wait steps with Sequence, or use a preset that returns a complete MotionMap.", "Motion changes presentation, not application state. Use Timer and Application.handle when a delay must advance game logic or replace content."]],
  "luastra/assets": ["Turns manifest-declared project files into kind-safe references and canonical host-neutral URIs. This keeps arbitrary paths and asset-kind mistakes out of UI and media APIs.", ["Declare every packaged file in luastra.json, create the matching Image, Audio, or Font reference, and convert it to a URI only at the consuming SDK boundary.", "Asset references do not download remote content and do not grant filesystem access."]],
  "luastra/data": ["Builds composable runtime schemas for values that static Luau types cannot trust, then returns structured success or failure from decoding. Nested object and array schemas retain an exact path to invalid data.", ["Create schemas once near the application boundary and decode values arriving from forms, storage, locations, or servers before assigning them to typed state.", "Schemas validate runtime data; they do not replace useful Luau annotations inside trusted application code."]],
  "luastra/state": ["Encodes small deterministic snapshots with explicit schema versions, decodes current snapshots, and migrates supported older versions through ordered functions. It separates serialization compatibility from the host used to persist the resulting string.", ["Keep snapshot fields bounded and free of secrets, store the encoded string through Host.storageSet, and check every DecodeResult or MigrationResult before restoring state.", "Changing stored meaning requires a new version and tested migrations rather than an unchecked cast."]],
  "luastra/navigation": ["Maintains application-owned route history and optionally compiles typed route entries to canonical path and query locations. Named stacks, entry stacks, and browser-history integration remain explicit rather than hidden in the renderer.", ["Create the chosen stack once in module scope, mutate it in Application.handle, and select the rendered screen from its current entry.", "Use the compiler for deep links and visible URLs; use decideBack to resolve modal, local-stack, browser-history, and root-exit priority."]],
  "luastra/timer": ["Schedules cancellable one-shot application deadlines identified by stable strings. Expiry enters Application.handle as a timer event, allowing ordinary state transitions and a following render without exposing a platform timer object.", ["Start or restart a timer after a state change, handle only the expected ID, and cancel it when the owning workflow ends.", "Use Motion.wait for a visual pause inside one animation channel; use Timer when application logic must run after the delay."]],
  "luastra/host": ["Exposes bounded asynchronous capabilities supplied by the current host, including storage, clipboard, external launch, browser history, and system-Back decisions. Every request returns an opaque RequestId and completes through Application.resolve.", ["Declare the corresponding capability in luastra.json, save each RequestId with its purpose, then validate the completion before changing application state.", "Host support and user permission may vary, so a valid call is not proof of successful completion."]],
  "luastra/server": ["Calls declared versioned operations implemented by a trusted backend and decodes their bounded response envelopes. Client Luau supplies ordinary input data but never receives server credentials or authorization authority.", ["Use a backend operation for privileged data access or secrets, validate inputs again on the server, and correlate the RequestId in Application.resolve.", "A successful transport response still requires Server.decode and operation-specific data validation before use."]],
  "luastra/media": ["Controls a bounded audio queue through asynchronous commands and reports live playback through typed media-state events. Queue selection, command acknowledgement, and actual playback state remain separate so web and native hosts can implement the same contract.", ["Set a stable queue, issue commands from explicit user or lifecycle actions, and render controls from Media.decodeState output rather than optimistic assumptions.", "Background playback, hardware controls, and packaging are host evidence boundaries; verify them on each claimed target before release."]],
  "luastra/debug": ["Emits bounded development diagnostics at log, warning, and error levels through the active host. Debug output is intentionally separate from UI status, structured Results, and production telemetry.", ["Use concise category and context values while diagnosing local behavior, then remove noisy output before release.", "Never log tokens, credentials, personal data, or full sensitive storage and server payloads."]],
};
const moduleExamples = Object.freeze({
  "luastra/ui": `local UI = require("luastra/ui")

return UI.Screen {
    id = "app",
    UI.Column {
        id = "welcome/content",
        gap = "md",
        align = "center",
        UI.Text {
            id = "welcome/title",
            text = "Welcome to Luastra",
            variant = "title",
            textAlign = "center",
        },
        UI.Button {
            id = "welcome/start",
            text = "Start",
            onTap = "welcome.start",
        },
    },
}`,
  "luastra/motion": `local Motion = require("luastra/motion")
local UI = require("luastra/ui")

local entrance = Motion.fadeIn {
    durationMs = 240,
}

return UI.Card {
    id = "catalogue/card",
    motion = entrance,
    UI.Text {
        id = "catalogue/title",
        text = "Breathe",
        variant = "heading",
    },
}`,
  "luastra/assets": `local Assets = require("luastra/assets")
local UI = require("luastra/ui")

local cardBack = Assets.image("image/card-back")

return UI.Image {
    id = "game/card-back",
    source = Assets.uri(cardBack),
    label = "Decorative card back",
    width = 274,
    height = 382,
}`,
  "luastra/data": `local Data = require("luastra/data")

local profileSchema = Data.object({
    name = Data.string({ minBytes = 1, maxBytes = 80, trim = true }),
    score = Data.number({ integer = true, min = 0 }),
})

local result = Data.decode(profileSchema, unknownValue)
if result.success then
    profile = result.value
else
    validationMessage = result.error.code .. " at " .. result.error.path
end`,
  "luastra/state": `local State = require("luastra/state")

local snapshot = State.encode(1, {
    route = "game",
    score = tostring(score),
})

local restored = State.decode(snapshot, 1)
if restored.success then
    score = tonumber(restored.fields.score) or 0
end`,
  "luastra/navigation": `local Navigation = require("luastra/navigation")

local routes = Navigation.create {
    routes = { "home", "game", "results" },
    initial = "home",
}

if routes.current() == "home" then
    routes.push("game")
end

local currentRoute = routes.current()`,
  "luastra/timer": `local Timer = require("luastra/timer")

Timer.start {
    id = "game/next-card",
    delayMs = 1500,
    value = "reveal-complete",
}

function Application.handle(action: string, target: string, value: string)
    if action == "timer" and target == "game/next-card" then
        showNextCard(value)
    end
end`,
  "luastra/host": `local Host = require("luastra/host")

local pending: { [number]: string } = {}
local requestId = Host.storageGet("game-state")
pending[requestId] = "restore"

function Application.resolve(
    id: number,
    success: boolean,
    payload: string,
    _code: string,
    _message: string
)
    if pending[id] == "restore" and success then
        restoreGame(payload)
    end
    pending[id] = nil
end`,
  "luastra/server": `local Server = require("luastra/server")

local requestId = Server.call(
    "records.list.v1",
    { cursor = "" },
    { deadlineMs = 3000, retry = true }
)
pending[requestId] = "list-records"

-- In Application.resolve, decode a successful payload first.
local decoded = Server.decode(payload)
if decoded.success then
    consumeRecordFields(decoded.fields)
end`,
  "luastra/media": `local Assets = require("luastra/assets")
local Media = require("luastra/media")

Media.setQueue({
    {
        id = "focus",
        source = Assets.uri(Assets.audio("audio/focus")),
        title = "Focus",
        artist = "Luastra",
    },
})

Media.play()

-- Decode every media_state payload before updating controls.
local result = Media.decodeState(payload)
if result.success then
    playbackState = result.state
end`,
});
const moduleSection = (id, title, module, _summary, _guide) => {
  const [summary, guide] = moduleNarrative[module];
  return { id, title, module, summary, guide, cards: [...typeCards(module), ...apiCards(module)], example: moduleExamples[module] };
};

export const sections = Object.freeze([
  {
    id: "overview",
    title: "Start here: build apps like games",
    eyebrow: `Luastra ${release.version} public-source alpha`,
    summary: "Write strict Luau that returns semantic UI from explicit state. Luastra checks and compiles the project, then its current web-based hosts render the same application model on web, desktop, and mobile.",
    hero: true,
    badges: [release.sourceSdk, release.runtimeSdk, `Luau ${release.luauVersion}`, "Web · Tauri · Capacitor"],
    guide: [
      "The mental model is state → Application.render → semantic UI. A button or host event enters Application.handle, asynchronous capability work completes in Application.resolve, and Luastra renders the new state.",
      "New here? Follow Installation, Quick start, and Beginner tutorial in that order. Use API pages after the first app runs, and read Support and boundaries before choosing a production target.",
    ],
    notes: [
      `The public installer selects the immutable ${release.publishedVersion} SDK. The older 0.1.0-alpha release remains available as a separate rollback boundary.`,
      "Desktop and mobile host sources package the web artifact through Tauri and Capacitor; the installed CLI currently exposes application-facing bundle and web builds only.",
      "Host-neutral means application state and semantic nodes stay in Luau. It does not mean every visual is a platform-native widget or that every host capability behaves identically.",
    ],
    cards: [
      entry("The four moving parts", "Luau application → SDK → runtime → host", "Your Luau module owns state and returns a semantic tree. The SDK validates declarations, the Wasm runtime executes admitted code, and the host reconciles the tree while providing explicit capabilities.", { kind: "guide", useWhen: "Read this before the tutorials when terms such as runtime, host, semantic UI, or capability are unfamiliar.", points: ["Application: your strict Luau modules, tests, assets, and manifest.", "SDK: checked constructors and functions imported through declared dependencies.", "Runtime: executes the admitted module graph and dispatches events.", "Host: renders UI and performs declared storage, history, timer, server, or media work."] }),
      entry("Choose your path", "first app · API lookup · evaluation", "Use one deliberate route instead of reading every detail page in order.", { kind: "guide", useWhen: "Use this when deciding what to read next.", points: ["First app: Installation → Quick start → Beginner tutorial.", "Build a feature: open its module overview, then the exact symbol pages and module-level complete example.", "Evaluate Luastra: Overview → Support and boundaries → Project manifest → the relevant host capability."] }),
      entry("Small glossary", "admitted · bounded · capability · stable id", "The reference uses these words to describe safety and portability boundaries, not extra syntax you must memorize.", { kind: "guide", useWhen: "Use this whenever recurring Luastra terminology makes an otherwise simple instruction hard to follow.", points: ["Admitted: declared and accepted by the manifest, SDK, runtime, or host contract.", "Bounded: checked against an explicit size, count, duration, or format limit.", "Capability: a host operation explicitly listed in luastra.json.", "Stable id: a unique lowercase path that identifies the same UI element across renders.", "Source alpha: usable for evaluation, with breaking changes and incomplete production packaging still possible."] }),
    ],
  },
  {
    id: "installation",
    title: "Install Luastra",
    module: `${release.publishedVersion} release boundary`,
    summary: "Install a checksum-verified, host-specific SDK into an immutable version directory.",
    guide: [
      "First run node --version and confirm v24 or newer. Then use the online installer on macOS or Linux, or download the same installer and run it with Node on Windows.",
      "The installer writes only under your user-owned .luastra directory and does not edit shell configuration. If luastra is not found afterward, add the bin directory to PATH, open a new terminal, then run luastra version and luastra doctor.",
    ],
    cards: [
      entry("Release installation contract", "download → verify → atomic install → doctor", `The Node.js bootstrap detects the host, downloads only its archive over HTTPS, verifies the release manifest and archive ledger, then atomically installs the SDK under ~/.luastra/sdk/${release.publishedVersion}.`, {
        language: "Shell",
        code: `curl -fsSLO https://github.com/Luastra/luastra/releases/download/v${release.publishedVersion}/luastra-install.mjs\nnode luastra-install.mjs \\\n  --manifest=https://github.com/Luastra/luastra/releases/download/v${release.publishedVersion}/luastra-release.v1.json`,
        useWhen: "Use this when installing Luastra on a supported machine for the first time or when installing an explicitly selected release version.",
        points: ["Supported archives: macOS arm64/x64, Linux x64, and Windows x64.", "A checksum, receipt, or installed-file mismatch fails closed.", "The installer never edits shell profiles or the Windows registry."],
      }),
      entry("Offline installation", "GitHub Release assets → one transfer directory → verified install", `On a connected machine, open the v${release.publishedVersion} GitHub Release and download three assets: luastra-install.mjs, luastra-release.v1.json, and exactly one SDK archive matching the offline destination machine. Copy those three files, without renaming them, into one directory on the offline machine.`, {
        language: "Shell",
        code: `# Every required file is in this release's Assets list:
# https://github.com/Luastra/luastra/releases/tag/v${release.publishedVersion}

# Run from the directory containing the three downloaded files:
node ./luastra-install.mjs --manifest=./luastra-release.v1.json`,
        useWhen: "Use this on an offline machine or when release assets are transferred through a controlled internal channel.",
        points: [
          `macOS Apple Silicon (M1 or newer): luastra-sdk-${release.publishedVersion}-darwin-arm64.tar.gz.`,
          `macOS Intel: luastra-sdk-${release.publishedVersion}-darwin-x64.tar.gz.`,
          `Linux x64: luastra-sdk-${release.publishedVersion}-linux-x64.tar.gz.`,
          `Windows x64: luastra-sdk-${release.publishedVersion}-win32-x64.tar.gz.`,
          "GitHub may collapse the list behind Show all assets. Download the archives from the Release page, not from the repository Code tab.",
          "Keep the original filenames: the manifest selects the current host and the installer verifies the matching archive and its internal file ledger.",
        ],
      }),
      entry("System requirement", "Node.js 24 or newer", "Node.js 24 or newer is the only runtime prerequisite for packaged CLI workflows. No npm install, Rust, Xcode, Android Studio, or repository checkout is required.", {
        language: "Shell",
        code: `node --version\n# Expected: v24.x or newer`,
        useWhen: "Check this before installation or when the Luastra shim cannot start.",
      }),
      entry("Make the command available", "add ~/.luastra/bin to PATH", "The installer deliberately leaves shell configuration unchanged. Add its bin directory when a new terminal cannot find the luastra command.", {
        language: "Shell",
        code: `# zsh (macOS default)\necho 'export PATH="$HOME/.luastra/bin:$PATH"' >> ~/.zshrc\nsource ~/.zshrc\n\n# bash\necho 'export PATH="$HOME/.luastra/bin:$PATH"' >> ~/.bashrc\nsource ~/.bashrc\n\n# PowerShell, current window\n$env:Path = "$HOME\\.luastra\\bin;$env:Path"\n\nluastra version\nluastra doctor`,
        useWhen: "Use this only when installation succeeds but the shell reports command not found or does not recognize luastra.",
        points: ["For a permanent Windows setting, add %USERPROFILE%\\.luastra\\bin to your user PATH, then open a new terminal.", `A successful version command prints JSON whose result is PASS and whose version is ${release.publishedVersion}.`, "A successful doctor command prints JSON with result PASS. Do not continue if doctor reports a checksum, receipt, host, or installed-file mismatch."],
      }),
      entry("Verify and manage SDKs", "doctor · list · use · update · remove", "Verify the active SDK, retain multiple immutable versions, switch explicitly for rollback, update from another verified manifest, and remove only an inactive verified version.", {
        language: "Shell",
        code: `luastra version\nluastra doctor\nluastra sdk list\nluastra sdk use ${release.publishedVersion}\nluastra sdk update --manifest=<path-or-https-url>\nluastra sdk remove <inactive-version>`,
        useWhen: "Run doctor after installation or switching; use an older retained version when an update must be rolled back.",
      }),
    ],
    links: [
      {
        text: `Open the v${release.publishedVersion} Release assets`,
        href: `https://github.com/Luastra/luastra/releases/tag/v${release.publishedVersion}`,
      },
    ],
    callout: "SHA-256 proves equality with the manifest obtained from the release channel. The source alpha does not claim publisher signatures, Apple notarization, Windows Authenticode, GUI installers, or stores.",
  },
  {
    id: "quickstart",
    title: "Quick start: run your first app",
    module: "installed luastra CLI · about 10 minutes",
    summary: "Create a starter, understand its files, make one visible change, verify it, and open the live preview.",
    guide: ["Complete Installation and confirm luastra doctor reports PASS before starting.", "Run the commands from the project directory. The CLI prints one JSON object per completed command; result=PASS means the step succeeded, while failures begin with Luastra: on stderr."],
    cards: [
      entry("1. Create and enter a project", "luastra create hello-luastra", "Creates a missing or empty directory, copies the starter, and derives a project id from the directory name.", { language: "Shell", code: `luastra create hello-luastra\ncd hello-luastra`, useWhen: "Start here once Luastra is installed and doctor passes.", points: ["The created tree contains luastra.json, src/main.luau, tests/smoke.luau, assets/, and the starter license.", "Open src/main.luau first: it owns state, event handling, and the rendered screen.", "luastra.json declares which modules may be imported and which host capabilities the app may use."] }),
      entry("2. Make a visible change", "edit src/main.luau", "Change the starter title before running it so you can see the connection between Luau source and host UI.", { language: "Luau", code: `UI.Text {\n    id = "title",\n    text = \`Hello from my first Luastra app: {interactions}\`,\n    variant = "title",\n}`, useWhen: "Use this after project creation to replace the existing UI.Text block inside Application.render." }),
      entry("3. Check and test", "luastra check · luastra test", "check validates strict Luau, the module graph, manifest, assets, capabilities, and SDK identity; test executes the test modules declared in luastra.json.", { language: "Shell", code: `luastra check\nluastra test`, useWhen: "Run this after each small source or manifest change and before previewing or building.", points: ["Both commands should emit JSON with result set to PASS.", "A check failure names the source or manifest problem; fix that first instead of continuing to preview.", "The generated smoke test checks SDK construction, not every interaction you add later."] }),
      entry("4. Preview and interact", "luastra run", "Starts a watch-mode server on 127.0.0.1, prints the authoritative READY URL, and rebuilds after saved changes.", { language: "Shell", code: `luastra run\n# Open the READY URL, press Continue, then stop with Ctrl+C.`, useWhen: "Use this during development after check and test pass.", points: ["The page should show your edited title and a Continue button.", "Each press updates module state through Application.handle and the next render shows a larger interaction count.", "Keep the terminal open while previewing; Ctrl+C stops the local server."] }),
      entry("5. Build the web target", "luastra build web", "Creates the production-style static artifact in dist/web by default.", { language: "Shell", code: `luastra build web\n# Output: ./dist/web`, useWhen: "Use this after the interactive preview works and you need a deployable web artifact.", points: ["The command should emit JSON with result=PASS and the output directory.", "The installed CLI builds web and host-neutral bundle targets; application-facing desktop/mobile packaging is not yet a CLI command.", "Serve dist/web through an HTTP server or hosting provider. Opening index.html through file:// is unsupported."] }),
    ],
    example: `luastra create hello-luastra\ncd hello-luastra\n# Edit src/main.luau, then run:\nluastra check\nluastra test\nluastra run`,
    callout: "Do not open dist/web/index.html with file://. Luastra does not yet ship a separate serve command; luastra run is the supported local preview, while deployment or another HTTP server owns a built dist/web directory.",
  },
  { id: "workflow", title: "Workflow", summary: "From a new project to a verified web build.", cards: [["Create a project", "create <directory>", "Creates a new starter project in a missing or empty directory.", "Use this once when beginning an application; then enter the created directory before running the remaining commands."], ["Check", "check", "Analyzes the strict Luau graph, manifest, capabilities, assets, and SDK identity.", "Run after changing source code or luastra.json, and always before tests, preview, or a release build."], ["Run tests", "test", "Runs the project’s bounded Luau test modules.", "Run after changing application logic, event handling, state transitions, or SDK-facing code."], ["Run preview", "run", "Starts the local development server with rebuilding and reload feedback.", "Use during interactive development when you want to inspect and debug the application in a browser."], ["Build web", "build web", "Creates a complete static web application in dist/web: the compiled bundle plus the compatible Wasm VM, browser host, renderer, HTML, CSS, JavaScript, and project assets.", "Use when you need a production-style web artifact for HTTP serving or deployment verification.", { points: ["This is the build users can open through an HTTP server or deploy to static hosting.", "Opening dist/web/index.html through file:// is unsupported.", "Use luastra run instead when you need watch-mode rebuilding during development."] }], ["Build bundle", "build bundle", "Creates the host-neutral integration artifact in dist/bundle. It contains luastra.bundle.json, content-addressed compiled Luau modules, project-assets.json, and declared project assets, but no VM, renderer, HTML page, or native window.", "Use when a compatible Luastra host or packaging workflow needs the compiled application separately from its presentation and platform runtime.", { points: ["The bundle is not a standalone executable or website and cannot be opened directly.", "Use luastra run for an interactive development preview or luastra build web for a browser-ready artifact.", "A custom desktop, mobile, embedded, or test host must verify the bundle manifest, VM/protocol compatibility, capabilities, module hashes, and asset ledger before loading it into the matching Luastra VM.", "The public alpha CLI intentionally has no application-facing run-bundle command; repository runners are integration tools and do not replace a complete host UI."] }]].map(([name, command, description, useWhen, details]) => entry(name, `luastra ${command}`, description, { language: "Shell", code: `luastra ${command}`, useWhen, ...(details ?? {}) })) },
  { id: "learning-path", title: "Interactive learning path", module: "15–25 minutes · resettable", summary: "Follow one cumulative sequence from a verified installation to a stateful accessible interaction.", guide: ["Prerequisite: finish Installation and confirm luastra doctor reports PASS.", "Use Next and Back to move through the steps. Step 2 is a complete src/main.luau file; later steps verify, test, and preview that same file."], callout: "The controls below are rendered and handled by Luastra itself. Completing buttons here does not run commands on your computer; copy each step into your own terminal or editor." },
  {
    id: "recipes",
    title: "How to use the build recipes",
    module: "copy · verify · understand · adapt",
    summary: "Build one complete capability at a time from files that are checked against the candidate SDK.",
    guide: [
      "Finish Quick start first. Each recipe then starts from a fresh project, replaces the named files, runs check and test, and tells you exactly what to do in the preview.",
      "Copy a whole file before adapting it. Focused API snippets omit surrounding state on purpose; recipe files do not. Read the lifecycle explanation after the example works once.",
    ],
    cards: [
      entry("Recipe contract", "goal → files → checks → interaction → explanation", "A recipe is complete only when its imports, manifest dependencies, capabilities, event path, expected UI, and verification boundary are all explicit.", {
        kind: "guide",
        useWhen: "Use this checklist whenever you follow or write a Luastra recipe.",
        points: [
          "Goal: know the visible behavior before copying code.",
          "Files: replace exactly the listed files in a fresh starter project.",
          "Checks: do not continue until luastra check and luastra test report result=PASS.",
          "Interaction: follow the stated clicks and compare the visible result.",
          "Boundary: automated checks prove contracts; the named browser or device interaction proves presentation.",
        ],
      }),
      entry("Choose the next recipe", "stateful UI → timer → navigation → storage → history → form → assets → motion → server → media → Orbit", "Begin with the smallest new lifecycle concept and keep the previous recipe available for comparison.", {
        kind: "guide",
        useWhen: "Use this order when you have no particular feature in mind yet.",
        points: [
          "Complete mini-app teaches render and handle.",
          "Delayed action adds a host event without Application.resolve.",
          "Typed navigation adds checked route state and Back behavior.",
          "Storage and History add asynchronous host acknowledgements and platform-owned navigation.",
          "The Form and modal recipe adds controlled input, validation, and accessible focus behavior.",
          "The Assets and visuals recipe adds packaged images plus semantic host-native geometry.",
          "Declarative motion adds host-scheduled presentation without an application frame loop.",
          "The Server Function recipe adds a generated client, trusted handler, and asynchronous result decoding.",
          "The Audio Playback recipe adds command completion plus event-driven live media state.",
          "The Constellation Orbit recipe combines semantic nodes, bounded depth, relationships, and focused detail without application-owned coordinates.",
        ],
      }),
    ],
    callout: `These recipes are verified against the ${release.publishedVersion} repository and SDK contracts. An older installed SDK can expose an older contract until you explicitly install and select this release.`,
  },
  {
    id: "recipe-timer",
    title: "Recipe: run a delayed action",
    module: "luastra/timer · Application.handle · about 10 minutes",
    summary: "Start a one-shot timer from a button and update visible state when its event arrives.",
    guide: [
      "You will build a page whose status starts at 0:waiting. Press Start and, after 25 ms, expect 1:next.",
      "This recipe demonstrates the timer exception: start returns an acknowledgement RequestId, but expiry enters Application.handle and never Application.resolve.",
    ],
    cards: [
      entry("1. Create the project", "luastra create timer-recipe", "Start from a normal generated project, then replace its manifest, entry module, and smoke test with the three complete files below.", {
        language: "Shell",
        code: `luastra create timer-recipe
cd timer-recipe`,
        useWhen: "Run this in the directory that should contain the new project.",
      }),
      entry("2. Replace luastra.json", "timer.control + ui.render", "The manifest admits the two imported SDK modules and the host capability required to control timers.", {
        language: "JSON",
        code: `{
  "schemaVersion": 2,
  "project": {
    "id": "dev.luastra.timer-recipe",
    "entry": "app/main"
  },
  "sdk": {
    "contract": 1
  },
  "capabilities": ["timer.control", "ui.render"],
  "modules": [
    {
      "id": "app/main",
      "source": "src/main.luau",
      "dependencies": ["luastra/timer", "luastra/ui"]
    },
    {
      "id": "app/tests/timer",
      "source": "tests/smoke.luau",
      "dependencies": ["app/main"]
    }
  ],
  "tests": ["app/tests/timer"]
}`,
        useWhen: "Replace the generated manifest before running check; undeclared timer.control or luastra/timer usage is rejected.",
      }),
      entry("3. Replace src/main.luau", "complete runnable entry module", "The button starts work; the timer event changes module state; the following render exposes that change.", {
        wide: true,
        code: `--!strict

local Timer = require("luastra/timer")
local UI = require("luastra/ui")

local Application = {}
local elapsed = 0
local lastValue = "waiting"

function Application.render(): UI.Node
    return UI.Screen {
        id = "timer-lab",
        UI.Text { id = "timer/status", text = \`{elapsed}:{lastValue}\` },
        UI.Button {
            id = "timer/start",
            text = "Start",
            onTap = "start-timer",
        },
    }
end

function Application.handle(action: string, target: string, value: string)
    if action == "start-timer" and target == "timer/start" then
        Timer.start { id = "timer/next-card", delayMs = 25, value = "next" }
    elseif action == "timer" and target == "timer/next-card" then
        elapsed += 1
        lastValue = value
    end
end

function Application.snapshot()
    return { elapsed = elapsed, value = lastValue }
end

return Application`,
        useWhen: "Replace the entire generated src/main.luau file so every referenced name and lifecycle callback is present.",
      }),
      entry("4. Replace tests/smoke.luau", "deterministic state-transition test", "The test invokes the same timer event that the host delivers and verifies the state read by the following render.", {
        wide: true,
        code: `--!strict

local Application = require("app/main")

local initial = Application.snapshot()
assert(initial.elapsed == 0, "timer recipe must start at zero")
assert(initial.value == "waiting", "timer recipe initial value is invalid")

Application.handle("timer", "timer/next-card", "next")

local elapsed = Application.snapshot()
assert(elapsed.elapsed == 1, "timer event did not advance state")
assert(elapsed.value == "next", "timer event did not preserve its value")

return true`,
        useWhen: "Replace the generated smoke test so luastra test verifies application behavior rather than only an isolated UI constructor.",
      }),
      entry("5. Check and run", "PASS → Start → 1:next", "First prove the project contract, then verify the visible event path in the live preview.", {
        language: "Shell",
        code: `luastra check
luastra test
luastra run
# Open the READY URL, press Start, expect 1:next, then stop with Ctrl+C.`,
        useWhen: "Run from timer-recipe after all three files are saved.",
        points: ["check must report result=PASS.", "test must report tests=1 and passed=1.", "The test proves the state transition; the preview interaction separately proves that this browser host scheduled and delivered the timer event."],
      }),
      entry("6. Understand and adapt", "handle(start-timer) → Timer.start → handle(timer)", "The stable timer id is the event target, while value carries the optional bounded payload.", {
        kind: "guide",
        useWhen: "Read this after the unmodified recipe works once.",
        points: ["Use restart to replace the delay for the same id.", "Use cancel when the owning screen or state is no longer active.", "Treat an unexpected late timer event as stale instead of applying it to unrelated state.", "Keep delays at or below 60,000 ms; use persisted time or a backend scheduler for longer durable work."],
      }),
    ],
    callout: "Do not add Application.resolve for timer expiry. Timer control acknowledgements are consumed by the runtime; only the expiry event is application-visible.",
  },
  {
    id: "recipe-navigation",
    title: "Recipe: add typed navigation",
    module: "luastra/navigation · checked parameters · about 15 minutes",
    summary: "Move through named routes, generate canonical locations, and return through application-owned history.",
    guide: [
      "You will build Home → workspace 7 → release-notes in edit mode, then return through the router stack.",
      "This first navigation recipe keeps history inside Luau. Browser URL and system-Back integration are a separate host-capability step.",
    ],
    cards: [
      entry("1. Create the project", "luastra create navigation-recipe", "Start from a normal generated project, then replace its manifest, entry module, and smoke test with the three complete files below.", {
        language: "Shell",
        code: `luastra create navigation-recipe
cd navigation-recipe`,
        useWhen: "Run this in the directory that should contain the new project.",
      }),
      entry("2. Replace luastra.json", "luastra/navigation + luastra/ui", "Pure typed navigation needs no host capability beyond rendering because this recipe does not yet modify browser History.", {
        language: "JSON",
        code: `{
  "schemaVersion": 2,
  "project": {
    "id": "dev.luastra.navigation-recipe",
    "entry": "app/main"
  },
  "sdk": {
    "contract": 1
  },
  "capabilities": ["ui.render"],
  "modules": [
    {
      "id": "app/main",
      "source": "src/main.luau",
      "dependencies": ["luastra/navigation", "luastra/ui"]
    },
    {
      "id": "app/tests/routing",
      "source": "tests/smoke.luau",
      "dependencies": ["app/main"]
    }
  ],
  "tests": ["app/tests/routing"]
}`,
        useWhen: "Use this minimal manifest for in-memory typed routing; add navigation.history only when calling the matching Host history API.",
      }),
      entry("3. Replace src/main.luau", "complete runnable entry module", "Route definitions validate parameters and queries before a mutation can enter the stack.", {
        wide: true,
        code: `--!strict

local Navigation = require("luastra/navigation")
local UI = require("luastra/ui")

local routes = Navigation.compile {
    { name = "home", path = "/" },
    {
        name = "workspace",
        path = "/workspaces/:workspace_id",
        params = { workspace_id = { type = "integer", minimum = 1, maximum = 999 } },
    },
    {
        name = "document",
        parent = "workspace",
        path = "documents/:document_slug",
        params = { document_slug = { type = "string", maximumLength = 32 } },
        query = { mode = { type = "enum", values = { "read", "edit" }, required = true } },
    },
}

local router = Navigation.createRouter {
    compiler = routes,
    initial = { name = "home", params = {}, query = {} },
}

local Application = {}

function Application.render(): UI.Node
    local current = router.current()
    return UI.Screen {
        id = "routing-lab",
        UI.Text { id = "routing/title", text = "Routing lab", variant = "title" },
        UI.Text { id = "routing/name", text = "Route: " .. current.name },
        UI.Text { id = "routing/location", text = router.currentLocation(), role = "status" },
        UI.Actions {
            id = "routing/actions",
            UI.Button {
                id = "routing/workspace",
                text = "Open workspace",
                onTap = "open-workspace",
            },
            UI.Button {
                id = "routing/document",
                text = "Open document",
                onTap = "open-document",
            },
            UI.Button {
                id = "routing/back",
                text = "Back",
                onTap = "back",
                disabled = not router.canBack(),
            },
        },
    }
end

function Application.handle(action: string, target: string, _value: string)
    if action == "open-workspace" and target == "routing/workspace" then
        router.push { name = "workspace", params = { workspace_id = 7 }, query = {} }
    elseif action == "open-document" and target == "routing/document" then
        router.push {
            name = "document",
            params = { workspace_id = 7, document_slug = "release-notes" },
            query = { mode = "edit" },
        }
    elseif action == "back" and target == "routing/back" then
        router.back()
    end
end

function Application.snapshot()
    return {
        name = router.current().name,
        location = router.currentLocation(),
    }
end

return Application`,
        useWhen: "Replace the entire generated src/main.luau file; the compact layout intentionally omits host History so the router contract is visible first.",
      }),
      entry("4. Replace tests/smoke.luau", "route sequence test", "The test drives the same actions as the buttons and checks every canonical location without needing a browser.", {
        wide: true,
        code: `--!strict

local Application = require("app/main")

assert(Application.snapshot().location == "/", "recipe did not start at home")

Application.handle("open-workspace", "routing/workspace", "")
assert(Application.snapshot().location == "/workspaces/7", "workspace route failed")

Application.handle("open-document", "routing/document", "")
local document = Application.snapshot()
assert(document.name == "document", "document route name is invalid")
assert(
    document.location == "/workspaces/7/documents/release-notes?mode=edit",
    "document location is invalid"
)

Application.handle("back", "routing/back", "")
assert(Application.snapshot().location == "/workspaces/7", "Back failed")

return true`,
        useWhen: "Replace the generated smoke test so luastra test verifies the route transitions that the preview exposes.",
      }),
      entry("5. Check and run", "home → workspace → document → Back", "Verify both route names and canonical locations after every interaction.", {
        language: "Shell",
        code: `luastra check
luastra test
luastra run
# Open the READY URL.
# Press Open workspace: expect /workspaces/7.
# Press Open document: expect /workspaces/7/documents/release-notes?mode=edit.
# Press Back: expect /workspaces/7.`,
        useWhen: "Run from navigation-recipe after all three files are saved.",
        points: ["check must report result=PASS and test must report tests=1 and passed=1.", "The Back button is disabled at the first route.", "An invalid parameter or missing required query produces a bounded unsuccessful mutation instead of a malformed location."],
      }),
      entry("6. Understand and extend", "definitions → compiler → router → render", "The compiler owns path rules; the router owns the current stack; render reads it; handle requests checked mutations.", {
        kind: "guide",
        useWhen: "Read this after the unmodified route sequence works once.",
        points: ["Inspect each mutation result before assuming the route changed in product code.", "Persist router.encode() with State and Host storage only when navigation must survive restart.", "Use Host.historyPushLocation and navigation.history when browser Back and the visible URL must mirror Luau state.", "Never concatenate untrusted path fragments when a compiled route can validate and encode them."],
      }),
    ],
    callout: "This recipe proves the Luau navigation stack, not browser History integration. Add that capability only after the in-memory route model behaves correctly.",
  },
  {
    id: "recipe-storage",
    title: "Recipe: persist and restore state",
    module: "luastra/state · luastra/host · Application.resolve · about 15 minutes",
    summary: "Save a versioned counter snapshot, restore it asynchronously, and reject malformed stored data without losing current state.",
    guide: [
      "You will increment a counter, save it, change it again, then load the saved value. Reload the preview and load again to verify host persistence.",
      "State.encode/decode is synchronous and deterministic; Host storage is asynchronous, so every request is correlated in Application.resolve.",
    ],
    cards: [
      entry("1. Create the project", "luastra create storage-recipe", "Create a starter, then replace its manifest, entry module, and smoke test with the complete files below.", { language: "Shell", code: `luastra create storage-recipe\ncd storage-recipe`, useWhen: "Run this in the directory that should contain the new project." }),
      entry("2. Replace luastra.json", "storage.get + storage.set + ui.render", "The manifest admits State, Host, and UI modules plus both storage capabilities.", {
        language: "JSON",
        code: `{
  "schemaVersion": 2,
  "project": { "id": "dev.luastra.storage-recipe", "entry": "app/main" },
  "sdk": { "contract": 1 },
  "capabilities": ["storage.get", "storage.set", "ui.render"],
  "modules": [
    {
      "id": "app/main",
      "source": "src/main.luau",
      "dependencies": ["luastra/host", "luastra/state", "luastra/ui"]
    },
    {
      "id": "app/tests/storage",
      "source": "tests/smoke.luau",
      "dependencies": ["app/main", "luastra/state"]
    }
  ],
  "tests": ["app/tests/storage"]
}`,
        useWhen: "Replace the generated manifest before importing Host or State; storage reads and writes require separate capabilities.",
      }),
      entry("3. Replace src/main.luau", "complete asynchronous storage lifecycle", "Pending request IDs distinguish save and load completions that may arrive out of order.", {
        wide: true,
        code: `--!strict

local Host = require("luastra/host")
local State = require("luastra/state")
local UI = require("luastra/ui")

local Application = {}
local count = 0
local message = "Nothing saved yet"
local pending: { [number]: string } = {}

local function track(id: number, operation: string)
    pending[id] = operation
end

function Application.restore(payload: string): boolean
    local decoded = State.decode(payload, 1)
    if not decoded.success then return false end
    local restored = tonumber(decoded.fields.count)
    if restored == nil or restored < 0 or restored % 1 ~= 0 then return false end
    count = restored
    return true
end

function Application.render(): UI.Node
    return UI.Screen {
        id = "storage-recipe",
        UI.Text { id = "counter/title", text = "Persistent counter", variant = "title" },
        UI.Text { id = "counter/value", text = tostring(count), role = "status" },
        UI.Text { id = "counter/message", text = message, role = "status" },
        UI.Actions {
            id = "counter/actions",
            UI.Button { id = "counter/add", text = "Add", onTap = "counter.add" },
            UI.Button { id = "counter/save", text = "Save", onTap = "counter.save" },
            UI.Button { id = "counter/load", text = "Load", onTap = "counter.load" },
        },
    }
end

function Application.handle(action: string, target: string, _value: string)
    if action == "counter.add" and target == "counter/add" then
        count += 1
    elseif action == "counter.save" and target == "counter/save" then
        local snapshot = State.encode(1, { count = tostring(count) })
        track(Host.storageSet("counter-state", snapshot), "save")
        message = "Saving…"
    elseif action == "counter.load" and target == "counter/load" then
        track(Host.storageGet("counter-state"), "load")
        message = "Loading…"
    end
end

function Application.resolve(
    id: number,
    success: boolean,
    payload: string,
    code: string,
    _errorMessage: string
)
    local operation = pending[id]
    pending[id] = nil
    if operation == nil then return end
    if not success then message = operation .. " failed: " .. code return end
    if operation == "save" then message = "Saved"
    elseif Application.restore(payload) then message = "Loaded"
    else message = "Stored state is invalid" end
end

function Application.snapshot()
    return { count = count, message = message }
end

return Application`,
        useWhen: "Replace the entire entry module. Keep restore separate so malformed persisted data can be tested without a real host request.",
      }),
      entry("4. Replace tests/smoke.luau", "round-trip and rejection test", "The test proves valid state restoration and confirms malformed data leaves the current counter unchanged.", {
        wide: true,
        code: `--!strict

local Application = require("app/main")
local State = require("luastra/state")

Application.handle("counter.add", "counter/add", "")
assert(Application.snapshot().count == 1, "counter action failed")

local snapshot = State.encode(1, { count = "7" })
assert(Application.restore(snapshot), "valid snapshot was rejected")
assert(Application.snapshot().count == 7, "valid count was not restored")

assert(not Application.restore("v=1&count=invalid"), "invalid count was accepted")
assert(Application.snapshot().count == 7, "invalid restore changed current state")

return true`,
        useWhen: "Replace the generated smoke test so test covers both the successful and rejected restore paths.",
      }),
      entry("5. Check and run", "save → change → load → reload → load", "Automated tests verify deterministic state logic; the preview verifies the browser storage adapter and asynchronous resolve path.", {
        language: "Shell",
        code: `luastra check
luastra test
luastra run
# Add twice, Save, Add again, then Load: expect 2.
# Reload the page, press Load again, and expect 2.`,
        useWhen: "Run from storage-recipe after all three files are saved.",
        points: ["check must report result=PASS and test must report tests=1 and passed=1.", "Loading before the first save may produce a bounded failure or empty payload; keep the current count.", "A browser-host pass does not prove persistence in every desktop or mobile host."],
      }),
      entry("6. Understand and extend", "encode → storageSet → resolve · storageGet → resolve → decode", "Serialization, transport, and domain validation are three separate boundaries.", {
        kind: "guide",
        useWhen: "Read this after the unmodified save/load sequence works once.",
        points: ["Increment the snapshot version when its meaning changes.", "Use State.migrate when an older released version must remain readable.", "Never store credentials merely because storage accepts a string.", "Ignore unknown RequestIds and clear every matched pending entry before applying a completion."],
      }),
    ],
    callout: "A successful storage read only proves that bytes were returned. Decode the versioned snapshot and validate domain values before replacing current application state.",
  },
  {
    id: "recipe-history",
    title: "Recipe: synchronize Browser and system Back",
    module: "luastra/navigation · luastra/host · navigation.history · about 20 minutes",
    summary: "Keep typed Luau navigation, the visible fragment URL, Browser Back, and platform Back on one validated route stack.",
    guide: [
      "You will open #/detail, return with Browser Back, and delegate a platform Back intent to history or root exit.",
      "Every app-owned push writes both the canonical location and encoded router state. Every host-owned history event validates that state before rendering it.",
    ],
    cards: [
      entry("1. Create the project", "luastra create history-recipe", "Create a starter, then replace its manifest, entry module, and smoke test.", { language: "Shell", code: `luastra create history-recipe\ncd history-recipe`, useWhen: "Run this in the directory that should contain the new project." }),
      entry("2. Replace luastra.json", "navigation.history + ui.render", "The host capability is required for URL/history mutations and platform Back responses.", {
        language: "JSON",
        code: `{
  "schemaVersion": 2,
  "project": { "id": "dev.luastra.history-recipe", "entry": "app/main" },
  "sdk": { "contract": 1 },
  "capabilities": ["navigation.history", "ui.render"],
  "modules": [
    {
      "id": "app/main",
      "source": "src/main.luau",
      "dependencies": ["luastra/host", "luastra/navigation", "luastra/ui"]
    },
    {
      "id": "app/tests/history",
      "source": "tests/smoke.luau",
      "dependencies": ["app/main", "luastra/navigation"]
    }
  ],
  "tests": ["app/tests/history"]
}`,
        useWhen: "Replace the generated manifest before calling any Host history or system Back response API.",
      }),
      entry("3. Replace src/main.luau", "one router owns every navigation outcome", "The application pushes; the host moves Back; both end by rendering the same validated router.", {
        wide: true,
        code: `--!strict

local Host = require("luastra/host")
local Navigation = require("luastra/navigation")
local UI = require("luastra/ui")

local routes = Navigation.compile {
    { name = "home", path = "/" },
    { name = "detail", path = "/detail" },
}
local router = Navigation.createRouter {
    compiler = routes,
    initial = { name = "home", params = {}, query = {} },
}
local Application = {}
local message = "At home"

local function location(): string
    return "#" .. router.currentLocation()
end

function Application.restoreHistory(value: string): boolean
    local result = router.restoreEncoded(value)
    if result.success then message = "History restored" end
    return result.success
end

function Application.render(): UI.Node
    return UI.Screen {
        id = "history-recipe",
        UI.Text { id = "history/title", text = "Route: " .. router.current().name, variant = "title" },
        UI.Text { id = "history/location", text = location(), role = "status" },
        UI.Text { id = "history/message", text = message, role = "status" },
        UI.Button { id = "history/open", text = "Open detail", onTap = "route.open" },
    }
end

function Application.handle(action: string, target: string, value: string)
    if action == "lifecycle" and target == "app" and value == "launch" then
        Host.historyReplaceLocation(location(), router.encode())
    elseif action == "route.open" and target == "history/open" then
        local result = router.push { name = "detail", params = {}, query = {} }
        if result.success and result.changed then
            Host.historyPushLocation(location(), router.encode())
            message = "Detail opened"
        end
    elseif action == "history" and target == "app" then
        if not Application.restoreHistory(value) then message = "Rejected history state" end
    elseif action == "system_back" and target == "app" then
        local intent = tonumber(string.match(value, "^([1-9][0-9]*):[01]$"))
        if intent ~= nil then
            if router.canBack() then Host.systemBackHistory(intent)
            else Host.systemBackExit(intent) end
        end
    end
end

function Application.resolve(
    _id: number,
    success: boolean,
    _payload: string,
    code: string,
    diagnostic: string
)
    if not success then
        message = "History request failed: " .. code .. " — " .. diagnostic
    end
end

function Application.snapshot()
    return { name = router.current().name, location = location() }
end

return Application`,
        useWhen: "Replace the complete entry module. resolve reports rejected host requests; only history events restore router state, and only system_back events carry platform Back intents.",
      }),
      entry("4. Replace tests/smoke.luau", "valid and invalid history restoration", "The test supplies encoded router state directly and proves malformed history cannot replace the current route.", {
        wide: true,
        code: `--!strict

local Application = require("app/main")
local Navigation = require("luastra/navigation")

local routes = Navigation.compile {
    { name = "home", path = "/" },
    { name = "detail", path = "/detail" },
}
local source = Navigation.createRouter {
    compiler = routes,
    initial = { name = "home", params = {}, query = {} },
}
assert(source.push { name = "detail", params = {}, query = {} }.success)
assert(Application.restoreHistory(source.encode()), "valid history was rejected")
assert(Application.snapshot().location == "#/detail", "detail history was not restored")
assert(not Application.restoreHistory("invalid"), "malformed history was accepted")
assert(Application.snapshot().location == "#/detail", "failed restore changed the route")
assert(Navigation.decideBack { modalOpen = false, canBack = true } == "history")

return true`,
        useWhen: "Replace the generated smoke test to verify atomic history restoration before opening a browser.",
      }),
      entry("5. Check and run", "Open detail → Browser Back → Home", "The test proves state validation; the browser interaction proves URL and popstate integration in this host.", {
        language: "Shell",
        code: `luastra check
luastra test
luastra run
# Press Open detail: expect #/detail.
# Use Browser Back: expect #/ and Route: home.`,
        useWhen: "Run from history-recipe after all three files are saved.",
        points: ["check and test must report PASS with one passing test.", "On a mobile host, Back at detail delegates to history; Back at root may request application exit.", "Desktop, web, Android, and iOS Back behavior must still be verified independently."],
      }),
      entry("6. Understand the arbitration", "modal → history → exit", "Navigation.decideBack defines priority; the application performs one matching host response for each fresh intent.", {
        kind: "guide",
        useWhen: "Read this before adding a modal or another local navigation layer.",
        points: ["Dismiss application-owned modal state and acknowledge handled.", "Delegate to host history when a previous route exists.", "Request exit only at the application root where the platform supports it.", "Ignore malformed or repeated intent values; never respond twice to one intent."],
      }),
    ],
    callout: "Do not call router.back() and Host.systemBackHistory for the same Back press. The host history event will restore the router after the platform moves Back.",
  },
  {
    id: "recipe-form-modal",
    title: "Recipe: validate a form and confirm in a modal",
    module: "luastra/ui · luastra/data · controlled input · about 20 minutes",
    summary: "Collect a name and email, expose field-specific accessible errors, review normalized values in a modal, and confirm without trusting raw input.",
    guide: [
      "You will submit an empty form, correct both highlighted fields, review trimmed values in a modal, and either return to editing or confirm.",
      "TextInput is controlled: onInput updates Luau state, and the next render returns that value. Data validates byte bounds; the application adds its own small email-format rule.",
    ],
    cards: [
      entry("1. Create the project", "luastra create form-modal-recipe", "Create a starter, then replace its manifest, entry module, and smoke test.", {
        language: "Shell",
        code: `luastra create form-modal-recipe
cd form-modal-recipe`,
        useWhen: "Run this in the directory that should contain the new project.",
      }),
      entry("2. Replace luastra.json", "luastra/data + luastra/ui", "Form validation and modal state are synchronous application logic, so this recipe needs only ui.render.", {
        language: "JSON",
        code: `{
  "schemaVersion": 2,
  "project": { "id": "dev.luastra.form-modal-recipe", "entry": "app/main" },
  "sdk": { "contract": 1 },
  "capabilities": ["ui.render"],
  "modules": [
    {
      "id": "app/main",
      "source": "src/main.luau",
      "dependencies": ["luastra/data", "luastra/ui"]
    },
    {
      "id": "app/tests/form-modal",
      "source": "tests/smoke.luau",
      "dependencies": ["app/main"]
    }
  ],
  "tests": ["app/tests/form-modal"]
}`,
        useWhen: "Replace the generated manifest before importing Data or composing the form primitives.",
      }),
      entry("3. Replace src/main.luau", "controlled fields → validation → modal → confirmation", "Every visible value and error comes from Luau state; the modal opens only after normalized values pass both validation layers.", {
        wide: true,
        code: `--!strict

local Data = require("luastra/data")
local UI = require("luastra/ui")

local nameSchema = Data.string { minBytes = 2, maxBytes = 60, trim = true }
local emailSchema = Data.string { minBytes = 3, maxBytes = 160, trim = true }

local Application = {}
local name = ""
local email = ""
local nameError: string? = nil
local emailError: string? = nil
local modalOpen = false
local status = "Complete both fields"
local submittedName: string? = nil

local function validEmail(value: string): boolean
    return string.match(value, "^[^%s@]+@[^%s@]+%.[^%s@]+$") ~= nil
end

local function validate(): boolean
    local checkedName = Data.decode(nameSchema, name)
    local checkedEmail = Data.decode(emailSchema, email)
    if checkedName.success then nameError = nil
    else nameError = "Enter 2 to 60 bytes." end
    if checkedEmail.success then emailError = nil
    else emailError = "Enter an email address." end
    if checkedEmail.success and not validEmail(checkedEmail.value) then
        emailError = "Use a format such as name@example.com."
    end
    if not checkedName.success or not checkedEmail.success or emailError ~= nil then
        status = "Fix the highlighted fields"
        return false
    end
    name = checkedName.value
    email = checkedEmail.value
    modalOpen = true
    status = "Review the normalized values"
    return true
end

function Application.render(): UI.Node
    return UI.Screen {
        id = "profile",
        width = "content",
        padding = "responsive",
        UI.Card {
            id = "profile/form",
            gap = "md",
            padding = "lg",
            surface = "elevated",
            UI.Text { id = "profile/title", text = "Create profile", variant = "title" },
            UI.Field {
                id = "profile/name-field",
                gap = "xs",
                role = "group",
                label = "Name field",
                UI.Text { id = "profile/name-label", text = "Name" },
                UI.TextInput {
                    id = "profile/name",
                    label = "Name",
                    value = name,
                    onInput = "form.name",
                    autoComplete = "name",
                    enterKeyHint = "next",
                    required = true,
                    errorId = nameError ~= nil and "profile/name-error" or nil,
                },
                UI.Text {
                    id = "profile/name-error",
                    text = nameError or "",
                    role = "alert",
                    tone = "error",
                    hidden = nameError == nil,
                },
            },
            UI.Field {
                id = "profile/email-field",
                gap = "xs",
                role = "group",
                label = "Email field",
                UI.Text { id = "profile/email-label", text = "Email" },
                UI.TextInput {
                    id = "profile/email",
                    label = "Email",
                    value = email,
                    onInput = "form.email",
                    inputType = "email",
                    inputMode = "email",
                    autoComplete = "email",
                    enterKeyHint = "done",
                    required = true,
                    errorId = emailError ~= nil and "profile/email-error" or nil,
                },
                UI.Text {
                    id = "profile/email-error",
                    text = emailError or "",
                    role = "alert",
                    tone = "error",
                    hidden = emailError == nil,
                },
            },
            UI.Text { id = "profile/status", text = status, role = "status" },
            UI.Actions {
                id = "profile/actions",
                responsive = true,
                UI.Button {
                    id = "profile/review",
                    text = "Review",
                    onTap = "form.review",
                    appearance = "primary",
                },
            },
        },
        UI.Modal {
            id = "profile/confirm-modal",
            label = "Confirm profile",
            open = modalOpen,
            onDismiss = "form.cancel-review",
            UI.Stack {
                id = "profile/confirm-content",
                gap = "md",
                padding = "lg",
                UI.Text { id = "profile/confirm-title", text = "Confirm profile", variant = "heading" },
                UI.Text { id = "profile/confirm-name", text = "Name: " .. name },
                UI.Text { id = "profile/confirm-email", text = "Email: " .. email },
                UI.Actions {
                    id = "profile/confirm-actions",
                    responsive = true,
                    UI.Button {
                        id = "profile/confirm",
                        text = "Confirm",
                        onTap = "form.confirm",
                        appearance = "primary",
                    },
                    UI.Button {
                        id = "profile/cancel",
                        text = "Keep editing",
                        onTap = "form.cancel-review",
                        appearance = "secondary",
                    },
                },
            },
        },
    }
end

function Application.handle(action: string, target: string, value: string)
    if action == "form.name" and target == "profile/name" then
        name = value
        nameError = nil
    elseif action == "form.email" and target == "profile/email" then
        email = value
        emailError = nil
    elseif action == "form.review" and target == "profile/review" then
        validate()
    elseif action == "form.cancel-review"
        and (target == "profile/cancel" or target == "profile/confirm-modal") then
        modalOpen = false
        status = "Continue editing"
    elseif action == "form.confirm" and target == "profile/confirm" and modalOpen then
        modalOpen = false
        submittedName = name
        status = "Profile confirmed for " .. name
    end
end

function Application.snapshot()
    return {
        name = name,
        email = email,
        nameError = nameError,
        emailError = emailError,
        modalOpen = modalOpen,
        status = status,
        submittedName = submittedName,
    }
end

return Application`,
        useWhen: "Replace the complete entry module. Keep modal visibility in state and use the same dismissal action for Escape, backdrop dismissal, and the visible cancel button.",
      }),
      entry("4. Replace tests/smoke.luau", "invalid → corrected → dismissed → confirmed", "The test drives the same actions as the controls and inspects both application state and accessible render properties.", {
        wide: true,
        code: `--!strict

local Application = require("app/main")

local function find(node: any, id: string): any?
    if node.id == id then return node end
    for _, child in node.children or {} do
        local result = find(child, id)
        if result ~= nil then return result end
    end
    return nil
end

Application.handle("form.review", "profile/review", "")
local invalidTree = Application.render()
assert(Application.snapshot().modalOpen == false, "invalid form opened the modal")
assert((find(invalidTree, "profile/name") :: any).properties.errorId == "profile/name-error")
assert((find(invalidTree, "profile/email-error") :: any).properties.role == "alert")

Application.handle("form.name", "profile/name", "  Ada  ")
Application.handle("form.email", "profile/email", "not-an-email")
Application.handle("form.review", "profile/review", "")
assert(Application.snapshot().emailError ~= nil, "invalid email was accepted")

Application.handle("form.email", "profile/email", "ada@example.test")
Application.handle("form.review", "profile/review", "")
assert(Application.snapshot().modalOpen == true, "valid form did not open the modal")
assert(Application.snapshot().name == "Ada", "validated name was not trimmed")
assert((find(Application.render(), "profile/confirm-modal") :: any).properties.open == true)

Application.handle("form.cancel-review", "profile/confirm-modal", "escape")
assert(Application.snapshot().modalOpen == false, "modal dismissal was ignored")
Application.handle("form.review", "profile/review", "")
Application.handle("form.confirm", "profile/confirm", "")
assert(Application.snapshot().submittedName == "Ada", "confirmation was not recorded")

return true`,
        useWhen: "Replace the generated smoke test to cover invalid input, normalization, both modal exit paths, and confirmation.",
      }),
      entry("5. Check and run", "errors → review → dismiss or confirm", "Automated checks prove state and semantics; the preview separately proves native input, focus, and dialog behavior in this browser.", {
        language: "Shell",
        code: `luastra check
luastra test
luastra run
# Press Review while empty: expect two field errors.
# Enter a name and email, then Review: expect the confirmation modal.
# Dismiss once, reopen, then Confirm.`,
        useWhen: "Run from form-modal-recipe after all three files are saved.",
        points: [
          "check and test must report PASS with one passing test.",
          "Tab order follows source order; the modal traps focus and returns it to Review after dismissal.",
          "At 200% zoom and on a phone, actions must wrap and the focused field must remain reachable above the software keyboard.",
        ],
      }),
      entry("6. Understand the boundaries", "input → state → decode → domain rule → review → commit", "Static types, runtime schemas, application rules, and accessible presentation solve different parts of the form.", {
        kind: "guide",
        useWhen: "Read this before adding persistence, server submission, or more fields.",
        points: [
          "Luau types check your code; Data.decode validates values received at runtime.",
          "Data string limits count UTF-8 bytes, not visible characters.",
          "The email pattern is a small UI check, not proof that an address exists or can receive mail.",
          "Clear a field error when that field changes, then validate the complete form again on Review.",
          "Keep the modal in the tree with open=false so the host can close it and restore focus deterministically.",
        ],
      }),
    ],
    callout: "Validation failure is ordinary application state. Do not throw, log personal form values, or open the modal until every required rule passes.",
  },
  {
    id: "recipe-assets-visuals",
    title: "Recipe: package an image and compose visuals",
    module: "luastra/assets · UI.Image · UI.Shape · about 15 minutes",
    summary: "Admit a PNG in the project manifest, keep its reference typed until UI.Image, and combine it with scalable semantic and decorative shapes.",
    guide: [
      "You will download the public Luastra sample mark, render it inside a bounded image frame, toggle contain versus cover, and add both decorative and meaningful geometry.",
      "The manifest admits bytes and media type. Assets.image validates the typed ID, Assets.uri creates the host-neutral URI, and UI.Image provides layout and accessibility meaning.",
    ],
    cards: [
      entry("1. Create the project", "luastra create visuals-recipe", "Create a starter and place a real PNG at the exact path that the manifest will admit.", {
        language: "Shell",
        code: `luastra create visuals-recipe
cd visuals-recipe
mkdir -p assets
curl -fL https://raw.githubusercontent.com/Luastra/luastra/main/examples/live-visuals/assets/luastra-mark.png \\
  -o assets/luastra-mark.png
# Windows PowerShell alternative:
# New-Item -ItemType Directory -Force assets
# Invoke-WebRequest <the same URL> -OutFile assets/luastra-mark.png`,
        useWhen: "Run this online for the sample, or save your own PNG as assets/luastra-mark.png before continuing.",
        points: [
          "The sample is a 512 × 512 RGBA PNG from the public Luastra repository.",
          "If you use another image format, change both the filename and mediaType in the manifest.",
        ],
      }),
      entry("2. Replace luastra.json", "admit image/luastra-mark", "The asset entry binds a stable typed ID to one project-relative file and its exact media type.", {
        language: "JSON",
        code: `{
  "schemaVersion": 2,
  "project": { "id": "dev.luastra.visuals-recipe", "entry": "app/main" },
  "sdk": { "contract": 1 },
  "capabilities": ["ui.render"],
  "assets": [
    {
      "id": "image/luastra-mark",
      "source": "assets/luastra-mark.png",
      "mediaType": "image/png"
    }
  ],
  "modules": [
    {
      "id": "app/main",
      "source": "src/main.luau",
      "dependencies": ["luastra/assets", "luastra/ui"]
    },
    {
      "id": "app/tests/visuals",
      "source": "tests/smoke.luau",
      "dependencies": ["app/main", "luastra/assets"]
    }
  ],
  "tests": ["app/tests/visuals"]
}`,
        useWhen: "Replace the generated manifest after the image file exists; check fails closed when the path, type, or asset kind is inconsistent.",
      }),
      entry("3. Replace src/main.luau", "typed asset → URI → image · shapes stay code-native", "The bitmap supplies detailed artwork, while Shape supplies resolution-independent geometry without another packaged file.", {
        wide: true,
        code: `--!strict

local Assets = require("luastra/assets")
local UI = require("luastra/ui")

local mark = Assets.image("image/luastra-mark")
local markSource = Assets.uri(mark)
local cover = false
local Application = {}

function Application.render(): UI.Node
    return UI.Screen {
        id = "visuals",
        width = "content",
        padding = "responsive",
        UI.Card {
            id = "visuals/card",
            gap = "lg",
            padding = "lg",
            surface = "elevated",
            UI.Text { id = "visuals/title", text = "Packaged visuals", variant = "title" },
            UI.Image {
                id = "visuals/mark",
                source = markSource,
                label = "Luastra orbit mark",
                width = 280,
                height = 180,
                fit = cover and "cover" or "contain",
                cornerRadius = 24,
            },
            UI.Text {
                id = "visuals/fit-status",
                text = cover and "Fit: cover" or "Fit: contain",
                role = "status",
            },
            UI.Button {
                id = "visuals/toggle-fit",
                text = cover and "Show complete image" or "Fill the frame",
                onTap = "visuals.toggle-fit",
            },
            UI.Row {
                id = "visuals/shapes",
                gap = "lg",
                responsive = true,
                UI.Shape {
                    id = "visuals/decoration",
                    shape = "circle",
                    width = 72,
                    height = 72,
                    fill = "accent",
                    label = "",
                },
                UI.Shape {
                    id = "visuals/featured",
                    shape = "star",
                    width = 88,
                    height = 88,
                    fill = "warning",
                    stroke = "text",
                    strokeWidth = 2,
                    label = "Featured visual",
                },
            },
        },
    }
end

function Application.handle(action: string, target: string, _value: string)
    if action == "visuals.toggle-fit" and target == "visuals/toggle-fit" then
        cover = not cover
    end
end

function Application.snapshot()
    return { source = markSource, cover = cover }
end

return Application`,
        useWhen: "Replace the complete entry module. Keep the typed reference at module scope and convert it to a URI only at the consuming SDK boundary.",
      }),
      entry("4. Replace tests/smoke.luau", "asset identity + render semantics + interaction", "The test verifies the typed asset contract, image accessibility, decorative geometry, meaningful geometry, and fit toggle.", {
        wide: true,
        code: `--!strict

local Application = require("app/main")
local Assets = require("luastra/assets")

local function find(node: any, id: string): any?
    if node.id == id then return node end
    for _, child in node.children or {} do
        local result = find(child, id)
        if result ~= nil then return result end
    end
    return nil
end

local reference = Assets.image("image/luastra-mark")
assert(reference.kind == "image")
assert(reference.id == "image/luastra-mark")
assert(Assets.uri(reference) == "asset:image/luastra-mark")

local initial = Application.render()
local image = find(initial, "visuals/mark") :: any
assert(image.properties.source == "asset:image/luastra-mark")
assert(image.properties.label == "Luastra orbit mark")
assert(string.find(tostring(image.properties.className), "luastra-fit-contain", 1, true) ~= nil)
assert((find(initial, "visuals/decoration") :: any).properties.label == "")
assert((find(initial, "visuals/featured") :: any).properties.label == "Featured visual")

Application.handle("visuals.toggle-fit", "visuals/toggle-fit", "")
assert(Application.snapshot().cover == true)
local changedImage = find(Application.render(), "visuals/mark") :: any
assert(string.find(tostring(changedImage.properties.className), "luastra-fit-cover", 1, true) ~= nil)

return true`,
        useWhen: "Replace the generated smoke test so the recipe proves both static asset wiring and its visible state transition.",
      }),
      entry("5. Check and run", "contain → cover → contain", "Check verifies packaged asset admission; the browser preview separately verifies decoded pixels, sizing, clipping, and accessible presentation.", {
        language: "Shell",
        code: `luastra check
luastra test
luastra run
# Expect the complete mark inside a 280 × 180 frame.
# Press Fill the frame: expect cropping and Fit: cover.`,
        useWhen: "Run from visuals-recipe after the PNG and all three text files are saved.",
        points: [
          "check and test must report PASS with one passing test.",
          "A successful build proves the file ledger and contract, not that every browser can decode arbitrary image bytes.",
          "Resize and zoom the preview: the frame stays bounded while contain preserves the complete image and cover may crop it.",
        ],
      }),
      entry("6. Understand the boundaries", "file → manifest → typed reference → URI → semantic node", "Each boundary prevents a different class of accidental mismatch and keeps host packaging deterministic.", {
        kind: "guide",
        useWhen: "Read this before adding application artwork, thumbnails, or generated visuals.",
        points: [
          "Use UI.Image for admitted PNG, JPEG, WebP, or AVIF detail; SVG is not admitted by this candidate contract.",
          "Use UI.Shape for supported scalable geometry; do not make a Shape act like a button.",
          "Give meaningful images and shapes concise labels. Use label=\"\" only when the visual adds no information.",
          "width and height reserve stable layout space; fit controls scaling inside that frame.",
          "Asset IDs are stable application identifiers, while source paths are project implementation details.",
        ],
      }),
    ],
    callout: "Do not pass a filesystem path, data URL, or arbitrary remote URL to UI.Image. Package the file, admit it in luastra.json, and pass Assets.uri(Assets.image(id)).",
  },
  {
    id: "recipe-motion",
    title: "Recipe: replay declarative motion",
    module: "luastra/motion · stable UI identity · about 15 minutes",
    summary: "Animate a card from alternating directions without a frame loop, layout mutation, timer, or animation state in application code.",
    guide: [
      "You will render one stable card, replay its entrance from the opposite side after each button press, and keep the visible run count in ordinary Luau state.",
      "Motion descriptors declare presentation. The host scheduler owns frames and easing; Application.handle changes only meaningful state and the next render supplies the new descriptor.",
    ],
    cards: [
      entry("1. Create the project", "luastra create motion-recipe", "Start from the generated project, then replace its manifest, entry module, and smoke test.", {
        language: "Shell",
        code: `luastra create motion-recipe
cd motion-recipe`,
        useWhen: "Run this in the directory that should contain the new project.",
      }),
      entry("2. Replace luastra.json", "luastra/motion + luastra/ui", "Declarative UI motion needs no host capability beyond rendering.", {
        language: "JSON",
        code: `{
  "schemaVersion": 2,
  "project": { "id": "dev.luastra.motion-recipe", "entry": "app/main" },
  "sdk": { "contract": 1 },
  "capabilities": ["ui.render"],
  "modules": [
    {
      "id": "app/main",
      "source": "src/main.luau",
      "dependencies": ["luastra/motion", "luastra/ui"]
    },
    {
      "id": "app/tests/motion",
      "source": "tests/smoke.luau",
      "dependencies": ["app/main"]
    }
  ],
  "tests": ["app/tests/motion"]
}`,
        useWhen: "Replace the generated manifest before importing Motion. Do not add timer.control because animation frames are host-owned presentation work.",
      }),
      entry("3. Replace src/main.luau", "state changes once · host animates frames", "The card keeps one ID while its changed translateX descriptor deliberately restarts that channel.", {
        wide: true,
        code: `--!strict

local Motion = require("luastra/motion")
local UI = require("luastra/ui")

local Application = {}
local run = 0
local fromLeft = true

local function entrance(): Motion.MotionMap
    local offset = if fromLeft then -28 else 28
    return {
        opacity = Motion.tween {
            from = 0,
            to = 1,
            durationMs = 180,
            easing = "easeOutCubic",
        },
        translateX = Motion.tween {
            from = offset,
            to = 0,
            durationMs = 260,
            easing = "easeOutCubic",
        },
    }
end

function Application.render(): UI.Node
    local side = if fromLeft then "left" else "right"
    local nextSide = if fromLeft then "right" else "left"
    return UI.Screen {
        id = "motion-recipe",
        width = "content",
        padding = "responsive",
        UI.Card {
            id = "motion/card",
            gap = "lg",
            padding = "lg",
            surface = "elevated",
            motion = entrance(),
            UI.Text { id = "motion/title", text = "Declarative entrance", variant = "title" },
            UI.Text {
                id = "motion/status",
                text = "Run " .. tostring(run) .. ": from " .. side,
                role = "status",
            },
            UI.Text {
                id = "motion/explanation",
                text = "Luau changes state once; the host animates the frames.",
                tone = "muted",
            },
            UI.Button {
                id = "motion/replay",
                text = "Replay from " .. nextSide,
                onTap = "motion.replay",
            },
        },
    }
end

function Application.handle(action: string, target: string, _value: string)
    if action == "motion.replay" and target == "motion/replay" then
        run += 1
        fromLeft = not fromLeft
    end
end

function Application.snapshot()
    return { run = run, fromLeft = fromLeft }
end

return Application`,
        useWhen: "Replace the complete entry module. Keep the card ID stable: a descriptor change restarts the affected channels without discarding semantic identity.",
      }),
      entry("4. Replace tests/smoke.luau", "descriptor contract + one state transition", "The test verifies the initial descriptors, drives the real button action, and proves the changed direction with the same node ID.", {
        wide: true,
        code: `--!strict

local Application = require("app/main")

local function find(node: any, id: string): any?
    if node.id == id then return node end
    for _, child in node.children or {} do
        local result = find(child, id)
        if result ~= nil then return result end
    end
    return nil
end

local initialCard = find(Application.render(), "motion/card") :: any
local initialMotion = initialCard.properties.motion :: any
local initialOpacity = initialMotion.opacity :: any
local initialTranslation = initialMotion.translateX :: any
assert(initialCard.id == "motion/card")
assert(initialOpacity.kind == "tween")
assert(initialOpacity.from == 0 and initialOpacity.to == 1)
assert(initialTranslation.from == -28)
assert(initialTranslation.to == 0)

Application.handle("motion.replay", "motion/replay", "")
local snapshot = Application.snapshot()
assert(snapshot.run == 1 and snapshot.fromLeft == false)

local changedCard = find(Application.render(), "motion/card") :: any
local changedMotion = changedCard.properties.motion :: any
local changedTranslation = changedMotion.translateX :: any
assert(changedCard.id == initialCard.id)
assert(changedTranslation.from == 28)
assert(changedTranslation.to == 0)

return true`,
        useWhen: "Replace the generated smoke test so luastra test checks application intent and the public motion descriptors without simulating private scheduler frames.",
      }),
      entry("5. Check and run", "left → right → left", "Automated checks prove the descriptor and state contracts; the preview separately proves visible scheduling in this browser.", {
        language: "Shell",
        code: `luastra check
luastra test
luastra run
# Expect Run 0: from left.
# Press Replay from right, then expect Run 1: from right.`,
        useWhen: "Run from motion-recipe after all three files are saved.",
        points: [
          "check and test must report PASS with one passing test.",
          "Each press updates Luau once; Application.render is not called for every animation frame.",
          "Enable reduced motion in the operating system or browser and reload: content must appear immediately in its final position.",
          "The animation must never be the only indication of the run or direction; the status text carries the same meaning.",
        ],
      }),
      entry("6. Understand the boundaries", "state → render descriptor → host scheduler → final presentation", "Motion remains an optional presentation layer over deterministic layout and semantic content.", {
        kind: "guide",
        useWhen: "Read this before adding route entrances, feedback motion, or ambient effects.",
        points: [
          "Supported channels are opacity, translateX, translateY, scaleX, scaleY, rotationDeg, and rotationYDeg.",
          "Use Motion.tween for one channel, Motion.sequence for ordered Tween/Wait steps, and a named preset when it already fits.",
          "Use Timer only when elapsed time must change application state; never use it to drive animation frames.",
          "Layout is calculated at the final position. Translation, scale, and rotation do not repair spacing or reserve new bounds.",
          "Avoid continuous motion by default. If it is useful, keep it sparse, stop it when inactive, and preserve the same meaning with motion reduced.",
        ],
      }),
    ],
    callout: "Do not implement requestAnimationFrame or per-frame state in Luau. Declare bounded motion on a stable semantic node and let the host scheduler honor reduced-motion preferences.",
  },
  {
    id: "recipe-server",
    title: "Recipe: call a server function",
    module: "generated Luau client · trusted JavaScript handler · about 25 minutes",
    summary: "Declare one public query, generate its typed Luau client, run its trusted handler locally, and correlate the asynchronous result before showing it.",
    guide: [
      "You will send a name from Luau to greeting.message.v1. The local backend validates it, returns a greeting, and the generated decoder admits the result before UI state changes.",
      "The declaration is the shared contract. Luastra uses it to validate the trusted handler boundary and generate client functions; the handler itself is never bundled into client Luau.",
    ],
    cards: [
      entry("1. Create the project", "luastra create server-recipe", "Create a starter, then add the backend declaration and handler before generating the client module.", {
        language: "Shell",
        code: `luastra create server-recipe
cd server-recipe
mkdir backend`,
        useWhen: "Run this in the directory that should contain the new project. The backend directory holds trusted code that is separate from client Luau.",
      }),
      entry("2. Replace luastra.json", "rpc.call + generated module + backend files", "The manifest declares the capability, trusted files, generated client path, and dependency edge explicitly.", {
        language: "JSON",
        code: `{
  "schemaVersion": 2,
  "project": { "id": "dev.luastra.server-recipe", "entry": "app/main" },
  "sdk": { "contract": 1 },
  "capabilities": ["rpc.call", "ui.render"],
  "backend": {
    "declaration": "backend/functions.json",
    "handler": "backend/handlers.mjs",
    "generatedClient": "src/generated/server-functions.luau",
    "generatedModule": "app/server-functions"
  },
  "modules": [
    {
      "id": "app/main",
      "source": "src/main.luau",
      "dependencies": ["app/server-functions", "luastra/ui"]
    },
    {
      "id": "app/server-functions",
      "source": "src/generated/server-functions.luau",
      "dependencies": ["luastra/server"]
    },
    {
      "id": "app/tests/server",
      "source": "tests/smoke.luau",
      "dependencies": ["app/main", "app/server-functions"]
    }
  ],
  "tests": ["app/tests/server"]
}`,
        useWhen: "Replace the generated manifest. rpc.call is required for Server calls; ui.render remains required for the visible application.",
      }),
      entry("3. Create backend/functions.json", "one versioned query contract", "The declaration names the public operation and gives both sides exact typed fields.", {
        language: "JSON",
        code: `{
  "schemaVersion": 1,
  "types": {},
  "functions": {
    "greeting.message.v1": {
      "clientName": "greet",
      "authorization": "public",
      "mutation": false,
      "idempotency": "none",
      "input": { "name": "string" },
      "result": { "message": "string" }
    }
  }
}`,
        useWhen: "Create this declaration before generation. Add a new versioned operation instead of silently changing incompatible input or result meaning.",
        points: [
          "authorization: public means no signed-in principal is required; it does not make input trustworthy.",
          "mutation: false declares a read-only query, so this operation does not need an idempotency key.",
          "clientName becomes greet and decodeGreet in the generated Luau module.",
        ],
      }),
      entry("4. Create backend/handlers.mjs", "trusted validation and result", "The handler validates untrusted input again and returns exactly the declared result shape.", {
        language: "JavaScript",
        code: `export function createHandlers() {
  return Object.freeze({
    async "greeting.message.v1"(input, context) {
      const name = input.name.trim();
      const bytes = new TextEncoder().encode(name).byteLength;
      if (bytes < 2 || bytes > 60) {
        context.reject("VALIDATION", "Name must contain 2 to 60 bytes");
      }
      return { message: \`Hello, \${name}!\` };
    },
  });
}`,
        useWhen: "Create this trusted local-backend module. Keep secrets and privileged provider calls here, never in generated or handwritten client Luau.",
        points: [
          "The operation key must exactly match the declaration.",
          "context.reject produces a bounded failure code and message for Application.resolve.",
          "Luastra validates the returned object against the declared result before it crosses the RPC boundary.",
        ],
      }),
      entry("5. Generate the typed Luau client", "declaration → src/generated/server-functions.luau", "Generation creates the only client call and decoder names used by application code.", {
        language: "Shell",
        code: `luastra generate
# Expect result: PASS and module: app/server-functions`,
        useWhen: "Run after creating or changing backend/functions.json. Commit the generated module, but never edit it by hand.",
        points: [
          "greet(input, options) starts the request and returns a numeric RequestId, not the greeting.",
          "decodeGreet(payload) returns the declared result or nil for malformed, missing, or extra fields.",
          "luastra check rejects a missing or stale generated client.",
        ],
      }),
      entry("6. Replace src/main.luau", "input → RequestId → resolve → decode → state", "The application stores each request ID and changes visible state only after the matching completion is decoded.", {
        wide: true,
        code: `--!strict

local ServerFunctions = require("app/server-functions")
local UI = require("luastra/ui")

local Application = {}
local name = "Ada"
local status = "Ready"
local pending: {[number]: boolean} = {}

local function busy(): boolean
    return next(pending) ~= nil
end

function Application.render(): UI.Node
    return UI.Screen {
        id = "server-recipe",
        width = "content",
        padding = "responsive",
        UI.Card {
            id = "greeting/card",
            gap = "md",
            padding = "lg",
            surface = "elevated",
            UI.Text { id = "greeting/title", text = "Server greeting", variant = "title" },
            UI.Field {
                id = "greeting/name-field",
                gap = "xs",
                role = "group",
                label = "Name field",
                UI.Text { id = "greeting/name-label", text = "Name" },
                UI.TextInput {
                    id = "greeting/name",
                    label = "Name",
                    value = name,
                    onInput = "greeting.name",
                    autoComplete = "name",
                    enterKeyHint = "done",
                    required = true,
                },
            },
            UI.Button {
                id = "greeting/send",
                text = if busy() then "Waiting..." else "Ask the server",
                onTap = "greeting.send",
                disabled = busy(),
            },
            UI.Text { id = "greeting/status", text = status, role = "status" },
        },
    }
end

function Application.handle(action: string, target: string, value: string)
    if action == "greeting.name" and target == "greeting/name" then
        name = value
        status = "Ready"
    elseif action == "greeting.send" and target == "greeting/send" and not busy() then
        local requestId = ServerFunctions.greet({ name = name }, { deadlineMs = 2000, retry = true })
        pending[requestId] = true
        status = "Waiting for the server..."
    end
end

function Application.resolve(
    requestId: number,
    success: boolean,
    payload: string,
    errorCode: string,
    errorMessage: string
)
    if pending[requestId] ~= true then return end
    pending[requestId] = nil
    if not success then
        status = errorCode .. ": " .. errorMessage
        return
    end
    local result = ServerFunctions.decodeGreet(payload)
    if result == nil then
        status = "INTERNAL: Invalid greeting response"
        return
    end
    status = result.message
end

function Application.snapshot()
    return { name = name, status = status, busy = busy() }
end

return Application`,
        useWhen: "Replace the entry module after generation. This is the complete asynchronous client lifecycle rather than a synchronous function return.",
      }),
      entry("7. Replace tests/smoke.luau", "generated decoder + controlled UI", "The smoke test proves the offline contracts without pretending that its isolated VM owns a live backend.", {
        wide: true,
        code: `--!strict

local Application = require("app/main")
local ServerFunctions = require("app/server-functions")

local decoded = ServerFunctions.decodeGreet("v=1&result.message=Hello%2C%20Ada%21")
assert(decoded ~= nil and decoded.message == "Hello, Ada!")
assert(ServerFunctions.decodeGreet("v=1") == nil)
assert(ServerFunctions.decodeGreet("v=1&result.message=Hello&extra=value") == nil)

local initial = Application.snapshot()
assert(initial.name == "Ada" and initial.status == "Ready" and not initial.busy)
Application.handle("greeting.name", "greeting/name", "Grace")
local changed = Application.snapshot()
assert(changed.name == "Grace" and changed.status == "Ready")
assert(Application.render().type == "Screen")

return true`,
        useWhen: "Replace the smoke test so checkable decoder and UI behavior stay deterministic without introducing a fake network response.",
      }),
      entry("8. Check and run", "generate → check → test → live local RPC", "The first three commands verify files and types; the preview then exercises the real local handler boundary.", {
        language: "Shell",
        code: `luastra generate
luastra check
luastra test
luastra run
# Open the printed local URL and press Ask the server.
# Expect: Hello, Ada!`,
        useWhen: "Run from server-recipe after all five authored files are saved. Leave luastra run active while testing the browser flow.",
        points: [
          "generate, check, and test must report PASS with one passing test.",
          "The browser request reaches the trusted local handler served by luastra run.",
          "Try a one-character name: expect VALIDATION and the handler message without a client crash.",
          "The numeric RequestId only correlates completion; it is never the operation result.",
        ],
      }),
      entry("9. Follow one request", "Luau → RPC transport → handler → typed envelope → Luau", "Each stage owns one explicit responsibility, so client state never trusts transport text directly.", {
        kind: "guide",
        useWhen: "Read this when a server call appears to start but the expected result does not reach the interface.",
        points: [
          "greet encodes declared input and returns a RequestId immediately.",
          "The host sends server.call.v1 to the local RPC endpoint with the operation name and deadline.",
          "The backend selects greeting.message.v1, enforces authorization, validates input, and validates its result.",
          "Application.resolve matches the RequestId and separates transport failure from successful payload decoding.",
          "decodeGreet admits only the exact declared result before status changes.",
        ],
      }),
      entry("10. Keep the production boundary honest", "local backend support is not hosted deployment", "The recipe proves local development behavior, not production infrastructure, secrets, or service availability.", {
        kind: "guide",
        useWhen: "Read this before adding authentication, database access, provider credentials, or publishing a server-backed application.",
        points: [
          "Client Luau and generated client code are public application artifacts. Never place a secret in either one.",
          "Public operations still require validation, rate limits, abuse controls, and safe error messages in production.",
          "Use user or admin authorization for protected work and enforce ownership inside the handler.",
          "Retries are safe for this read-only query. Mutations need an intentional idempotency policy and stable key.",
          "The candidate includes a local backend for luastra run; production backend deployment is a separate host decision.",
        ],
      }),
    ],
    callout: "A Server function is not a remote Luau function call. It is an asynchronous request to trusted JavaScript code through a declared, validated, versioned contract.",
  },
  {
    id: "recipe-media",
    title: "Recipe: play packaged audio",
    module: "luastra/media · live media_state events · about 20 minutes",
    summary: "Load one packaged WAV file, control playback, and render only decoded host state without polling or an application-owned progress loop.",
    guide: [
      "You will copy one audio fixture, install it as a one-item queue at launch, and expose Play and Pause controls whose enabled state follows the host.",
      "Media commands return RequestId values and complete in Application.resolve. Ongoing playback truth arrives as media_state events in Application.handle; both payload paths use Media.decodeState.",
    ],
    cards: [
      entry("1. Create the project and copy audio", "starter + admitted WAV fixture", "Start from a normal project and copy the recipe fixture into its assets directory.", {
        language: "Shell",
        code: `luastra create media-recipe
cd media-recipe
# Copy focus.wav from this recipe into assets/focus.wav.`,
        useWhen: "Run this where the new project should live, then save the supplied focus.wav fixture at exactly assets/focus.wav.",
        points: [
          "The documentation validator tests the same WAV fixture from examples/media-player/assets/focus.wav.",
          "Use your own admitted WAV, MP3, M4A, or OGG file later; browser codec support still varies by format.",
        ],
      }),
      entry("2. Replace luastra.json", "asset + media.command + ui.render", "The manifest admits both the packaged bytes and the host capability that controls playback.", {
        language: "JSON",
        code: `{
  "schemaVersion": 2,
  "project": { "id": "dev.luastra.media-recipe", "entry": "app/main" },
  "sdk": { "contract": 1 },
  "capabilities": ["media.command", "ui.render"],
  "assets": [
    {
      "id": "audio/focus",
      "source": "assets/focus.wav",
      "mediaType": "audio/wav"
    }
  ],
  "modules": [
    {
      "id": "app/main",
      "source": "src/main.luau",
      "dependencies": ["luastra/assets", "luastra/media", "luastra/ui"]
    },
    {
      "id": "app/tests/media",
      "source": "tests/smoke.luau",
      "dependencies": ["app/main", "luastra/media"]
    }
  ],
  "tests": ["app/tests/media"]
}`,
        useWhen: "Replace the generated manifest after copying the WAV file. A source path alone is not a playable or portable asset reference.",
      }),
      entry("3. Replace src/main.luau", "launch → queue → commands + events → decoded state", "The host owns playback and progress; Luau only issues intent and renders validated snapshots.", {
        wide: true,
        code: `--!strict

local Assets = require("luastra/assets")
local Media = require("luastra/media")
local UI = require("luastra/ui")

local media: Media.State = {
    revision = 0,
    status = "idle",
    itemId = "",
    title = "",
    artist = "",
    positionMs = 0,
    durationMs = 0,
    bufferedMs = 0,
    queueIndex = -1,
    queueCount = 0,
    background = false,
    interruption = "none",
    route = "default",
    error = nil,
}
local pending: {[number]: string} = {}
local message = "Waiting for launch"
local Application = {}

local queue: {Media.QueueItem} = {
    {
        id = "focus",
        source = Assets.uri(Assets.audio("audio/focus")),
        title = "Focus sample",
        artist = "Luastra",
    },
}

local function track(requestId: number, label: string)
    pending[requestId] = label
    message = label .. " requested"
end

local function applyState(payload: string, nextMessage: string?): boolean
    local decoded = Media.decodeState(payload)
    if not decoded.success then
        message = "Rejected media state: " .. decoded.error
        return false
    end
    media = decoded.state
    if nextMessage ~= nil then message = nextMessage end
    return true
end

function Application.render(): UI.Node
    local elapsed = math.floor(media.positionMs / 1000)
    local duration = math.floor(media.durationMs / 1000)
    return UI.Screen {
        id = "media-recipe",
        width = "content",
        padding = "responsive",
        UI.Card {
            id = "player/card",
            gap = "md",
            padding = "lg",
            surface = "elevated",
            UI.Text { id = "player/title", text = "Packaged audio", variant = "title" },
            UI.Text {
                id = "player/item",
                text = if media.title == "" then "Nothing loaded" else media.title,
                variant = "heading",
            },
            UI.Text {
                id = "player/state",
                text = "Status: " .. media.status,
                role = "status",
                tone = if media.status == "error" then "error" else nil,
            },
            UI.Text {
                id = "player/progress",
                text = "Progress: " .. tostring(elapsed) .. "s / " .. tostring(duration) .. "s",
            },
            UI.Text { id = "player/message", text = message, role = "status", tone = "muted" },
            UI.Actions {
                id = "player/actions",
                gap = "sm",
                responsive = true,
                UI.Button {
                    id = "player/play",
                    text = "Play",
                    onTap = "media.play",
                    disabled = media.status ~= "ready" and media.status ~= "paused" and media.status ~= "ended",
                },
                UI.Button {
                    id = "player/pause",
                    text = "Pause",
                    onTap = "media.pause",
                    appearance = "secondary",
                    disabled = media.status ~= "playing" and media.status ~= "buffering",
                },
            },
        },
    }
end

function Application.handle(action: string, target: string, value: string)
    if action == "lifecycle" and target == "app" and value == "launch" then
        if media.queueCount == 0 then track(Media.setQueue(queue, 1), "Queue load") end
    elseif action == "media_state" then
        applyState(value, nil)
    elseif action == "media.play" and target == "player/play" then
        track(Media.play(), "Play")
    elseif action == "media.pause" and target == "player/pause" then
        track(Media.pause(), "Pause")
    end
end

function Application.resolve(
    requestId: number,
    success: boolean,
    payload: string,
    errorCode: string,
    errorMessage: string
)
    local label = pending[requestId]
    if label == nil then return end
    pending[requestId] = nil
    if not success then
        message = label .. " failed: " .. errorCode .. " — " .. errorMessage
        return
    end
    applyState(payload, label .. " completed")
end

function Application.snapshot()
    return { status = media.status, title = media.title, message = message }
end

return Application`,
        useWhen: "Replace the complete entry module. Do not add a timer or frame loop: the host emits bounded progress and lifecycle updates.",
      }),
      entry("4. Replace tests/smoke.luau", "valid event + malformed state rejection", "The smoke test drives the same media_state path as the host without pretending to play audio in the isolated test VM.", {
        wide: true,
        code: `--!strict

local Application = require("app/main")
local Media = require("luastra/media")

local ready = table.concat({
    "v=1",
    "artist=Luastra",
    "background=false",
    "bufferedMs=1000",
    "durationMs=8000",
    "errorCode=",
    "errorMessage=",
    "interruption=none",
    "itemId=focus",
    "positionMs=0",
    "queueCount=1",
    "queueIndex=0",
    "revision=1",
    "route=default",
    "status=ready",
    "title=Focus%20sample",
}, "&")

local decoded = Media.decodeState(ready)
assert(decoded.success and decoded.state.title == "Focus sample")
Application.handle("media_state", "player", ready)
local current = Application.snapshot()
assert(current.status == "ready" and current.title == "Focus sample")

Application.handle("media_state", "player", "v=2&status=playing")
local rejected = Application.snapshot()
assert(rejected.status == "ready")
assert(rejected.message == "Rejected media state: invalid_wire")
assert(Application.render().type == "Screen")

return true`,
        useWhen: "Replace the generated smoke test so state admission and rejection are verified independently of browser audio policy.",
      }),
      entry("5. Check and run", "ready → playing → paused", "Automated checks prove the contract; the preview separately proves audible playback in the current browser.", {
        language: "Shell",
        code: `luastra check
luastra test
luastra run
# Wait for Status: ready, then press Play.
# Expect audible audio and Status: playing.
# Press Pause and expect Status: paused.`,
        useWhen: "Run from media-recipe after the manifest, Luau files, and assets/focus.wav are saved.",
        points: [
          "check and test must report PASS with one passing test.",
          "Play begins only after an explicit user action, which satisfies common browser autoplay policy.",
          "The progress text should advance from host events; Application.render does not run on an application timer.",
          "If decoding or playback fails, keep the last admitted state and show a bounded message.",
        ],
      }),
      entry("6. Separate command completion from live truth", "resolve acknowledges · media_state observes", "A completed command and current playback are related signals, not interchangeable promises.", {
        kind: "guide",
        useWhen: "Read this when controls appear to lag, playback changes outside the app, or command success conflicts with a later media event.",
        points: [
          "setQueue, play, and pause return RequestId immediately; store it only for command correlation.",
          "Application.resolve reports whether that command completed and may carry a decodable state snapshot.",
          "media_state reports later changes such as progress, ending, buffering, interruption, route, and errors.",
          "Render from the newest decoded Media.State rather than assuming that a pressed button already changed playback.",
          "Ignore unknown RequestIds and reject malformed state payloads without erasing the last valid UI state.",
        ],
      }),
      entry("7. Understand sources and queues", "asset: for packaged files · content: for scoped grants", "Media accepts admitted sources and a bounded queue rather than arbitrary filesystem or network URLs.", {
        kind: "guide",
        useWhen: "Read this before adding another track, protected content, Next and Previous controls, or seeking.",
        points: [
          "Use Assets.audio and Assets.uri for files declared in luastra.json.",
          "Use content grants issued by a trusted backend for protected media; a content: token is not a public URL.",
          "Raw https://, file://, absolute paths, data URLs, and short forged content tokens are rejected.",
          "A queue contains 1 to 32 items. selectedIndex is one-based in Luau even though decoded queueIndex is zero-based.",
          "Enable Next, Previous, and Seek from decoded queue and duration fields, not from assumptions about the source.",
        ],
      }),
      entry("8. Keep host claims evidence-bound", "web playback ≠ native background proof", "Foreground browser success does not establish background audio, lock-screen controls, or interruption behavior everywhere.", {
        kind: "guide",
        useWhen: "Read this before promising playback behavior for web, Tauri, Android, iOS, or a packaged release.",
        points: [
          "Verify audible foreground playback separately in each supported browser and packaged host.",
          "Mobile background playback requires a native build, lifecycle configuration, and a physical-device check.",
          "Lock-screen metadata and hardware controls require explicit target evidence; source code alone is insufficient.",
          "Test calls, headphones, Bluetooth route changes, audio focus, screen lock, and application disposal where claimed.",
          "Avoid polling. Supported hosts own event cadence and should stay idle when playback and UI are idle.",
        ],
      }),
    ],
    callout: "A successful Media.play completion is not permission to invent playing state. Decode host state and let media_state remain authoritative as playback changes.",
  },
  {
    id: "recipe-orbit",
    title: "Recipe: build a small Constellation Orbit",
    module: "luastra/ui · semantic spatial navigation · about 25 minutes",
    summary: "Build two navigable constellation depths and a Focus Surface from semantic Luau nodes while the host owns geometry, list fallback, focus, and motion.",
    guide: [
      "You will create a root constellation, enter a smaller Build constellation, open one leaf in a Focus Surface, and return through the same application state.",
      "The Luau model declares identity, priority, relationships, depth, and selection. It never declares x/y coordinates, viewport breakpoints, animation frames, or a separate mobile tree.",
    ],
    cards: [
      entry("1. Create the project", "one semantic model · two depths · one detail surface", "Start from the normal project skeleton; this recipe needs no assets or asynchronous host capability.", {
        language: "Shell",
        code: `luastra create orbit-recipe
cd orbit-recipe`,
        useWhen: "Run this where the new project should live, then replace the three generated files shown below.",
      }),
      entry("2. Replace luastra.json", "ui.render only", "The first Orbit needs only the semantic renderer; navigation state stays local and bounded in this introductory example.", {
        language: "JSON",
        code: `{
  "schemaVersion": 2,
  "project": { "id": "dev.luastra.orbit-recipe", "entry": "app/main" },
  "sdk": { "contract": 1 },
  "capabilities": ["ui.render"],
  "modules": [
    {
      "id": "app/main",
      "source": "src/main.luau",
      "dependencies": ["luastra/ui"]
    },
    {
      "id": "app/tests/orbit",
      "source": "tests/smoke.luau",
      "dependencies": ["app/main"]
    }
  ],
  "tests": ["app/tests/orbit"]
}`,
        useWhen: "Replace the generated manifest before adding Orbit components. Add navigation.history or storage capabilities only when a later version of the app actually calls them.",
      }),
      entry("3. Replace src/main.luau", "constellations → nodes → Focus Surface", "One small state machine controls active depth and focused leaf; every visual placement decision remains host-owned.", {
        wide: true,
        code: `--!strict

local UI = require("luastra/ui")

local Application = {}
local depth = "root"
local visitedBuild = false
local selected: string? = nil

local details = {
    ["orbit/learn"] = "Learn the semantic model before adding host capabilities.",
    ["orbit/ship"] = "Verify each target separately before making a platform claim.",
    ["orbit/build/interface"] = "Compose meaning in Luau and let the host place it.",
    ["orbit/build/adaptive"] = "The same nodes become a readable list when space is constrained.",
    ["orbit/build/accessible"] = "Keyboard, pointer, and assistive technology reach the same actions.",
}

local function titleFor(id: string?): string
    if id == "orbit/learn" then return "Learn" end
    if id == "orbit/ship" then return "Ship" end
    if id == "orbit/build/interface" then return "Interface" end
    if id == "orbit/build/adaptive" then return "Adaptive" end
    if id == "orbit/build/accessible" then return "Accessible" end
    return "Node details"
end

function Application.render(): UI.Node
    local focusTitle = titleFor(selected)
    local children: {UI.Node} = {
        UI.OrbitPath {
            id = "orbit/path",
            label = "Orbit path",
            UI.OrbitReturn {
                id = "orbit/path/root",
                text = "Luastra",
                onTap = "return-root",
                disabled = depth == "root",
            },
            UI.Text {
                id = "orbit/path/current",
                text = depth == "root" and "Home" or "Build",
            },
        },
        UI.Constellation {
            id = "orbit/root",
            label = "Luastra concepts",
            depth = 0,
            layerState = depth == "root" and "active" or "behind",
            UI.OrbitCenter {
                id = "orbit/root/center",
                title = "Luastra",
                description = "Build apps like games.",
            },
            UI.OrbitNode {
                id = "orbit/build",
                title = "Build",
                description = "Enter the next constellation.",
                nodeKind = "constellation",
                priority = 1,
                signalIcon = "compass",
                relatedTo = { "orbit/learn" },
                onTap = "open-build",
            },
            UI.OrbitNode {
                id = "orbit/learn",
                title = "Learn",
                description = "Understand the semantic model.",
                priority = 1,
                signalIcon = "book",
                status = "Guide",
                selected = selected == "orbit/learn",
                relatedTo = { "orbit/build", "orbit/ship" },
                onTap = "open-focus",
            },
            UI.OrbitNode {
                id = "orbit/ship",
                title = "Ship",
                description = "Verify web, desktop, and mobile.",
                priority = 2,
                signalIcon = "rocket",
                selected = selected == "orbit/ship",
                relatedTo = { "orbit/learn" },
                onTap = "open-focus",
            },
        },
    }

    if visitedBuild then
        table.insert(children, UI.Constellation {
            id = "orbit/build-space",
            label = "Build an interface",
            depth = 1,
            layerState = depth == "build" and "active" or "ahead",
            UI.OrbitCenter {
                id = "orbit/build-space/center",
                title = "Build",
                description = "Semantic, adaptive, accessible.",
            },
            UI.OrbitNode {
                id = "orbit/build/interface",
                title = "Interface",
                description = "Describe content and actions.",
                priority = 1,
                signalIcon = "spark",
                selected = selected == "orbit/build/interface",
                relatedTo = { "orbit/build/adaptive", "orbit/build/accessible" },
                onTap = "open-focus",
            },
            UI.OrbitNode {
                id = "orbit/build/adaptive",
                title = "Adaptive",
                description = "Keep every node available in a list.",
                priority = 2,
                selected = selected == "orbit/build/adaptive",
                relatedTo = { "orbit/build/interface" },
                onTap = "open-focus",
            },
            UI.OrbitNode {
                id = "orbit/build/accessible",
                title = "Accessible",
                description = "Preserve labels, focus, and actions.",
                priority = 1,
                signalIcon = "check",
                status = "Required",
                statusTone = "success",
                selected = selected == "orbit/build/accessible",
                relatedTo = { "orbit/build/interface" },
                onTap = "open-focus",
            },
        })
    end

    table.insert(children, UI.FocusSurface {
        id = "orbit/focus",
        label = focusTitle .. " details",
        open = selected ~= nil,
        onDismiss = "close-focus",
        UI.FocusHeader {
            id = "orbit/focus/header",
            UI.Text { id = "orbit/focus/title", text = focusTitle, variant = "heading" },
            UI.Button {
                id = "orbit/focus/close",
                text = "Return to the constellation",
                onTap = "close-focus",
            },
        },
        UI.Stack {
            id = "orbit/focus/content",
            gap = "md",
            UI.Text {
                id = "orbit/focus/copy",
                text = if selected == nil then "Choose a node." else details[selected],
            },
        },
    })

    return UI.Screen {
        id = "orbit-recipe",
        documentTitle = "Orbit recipe — Luastra",
        width = "wide",
        UI.Orbit {
            id = "orbit",
            label = "Luastra learning orbit",
            presentation = "auto",
            orbitTheme = "luastra",
            orbitMotion = "system",
            maxVisible = 8,
            table.unpack(children),
        },
    }
end

function Application.handle(action: string, target: string, _value: string)
    if action == "open-build" and target == "orbit/build" then
        depth = "build"
        visitedBuild = true
        selected = nil
    elseif action == "return-root" then
        depth = "root"
        selected = nil
    elseif action == "open-focus" and details[target] ~= nil then
        selected = target
    elseif action == "close-focus" then
        selected = nil
    end
end

function Application.snapshot()
    return { depth = depth, visitedBuild = visitedBuild, selected = selected }
end

return Application`,
        useWhen: "Replace the complete entry module. Keep the component IDs stable: relationships, selection, focus restoration, tests, and future routes all depend on semantic identity.",
      }),
      entry("4. Replace tests/smoke.luau", "root → nested depth → focus → return", "The test follows the meaningful interaction states without asserting host-calculated coordinates or animation frames.", {
        wide: true,
        code: `--!strict

local Application = require("app/main")

local function byId(node: any, id: string): any
    if node.id == id then return node end
    for _, child in node.children do
        local found = byId(child, id)
        if found ~= nil then return found end
    end
    return nil
end

local function hasClass(node: any, name: string): boolean
    return string.find(" " .. node.properties.className .. " ", " " .. name .. " ", 1, true) ~= nil
end

local initial = Application.render()
assert(initial.type == "Screen")
assert(hasClass(byId(initial, "orbit"), "luastra-orbit"))
assert(hasClass(byId(initial, "orbit/root"), "luastra-constellation-state-active"))
assert(byId(initial, "orbit/build-space") == nil)
assert(byId(initial, "orbit/build").properties.orbitRelatedTo == "orbit/learn")

Application.handle("open-build", "orbit/build", "")
local nested = Application.render()
assert(hasClass(byId(nested, "orbit/root"), "luastra-constellation-state-behind"))
assert(hasClass(byId(nested, "orbit/build-space"), "luastra-constellation-state-active"))

Application.handle("open-focus", "orbit/build/interface", "")
local focused = Application.render()
assert(byId(focused, "orbit/focus").properties.open == true)
assert(hasClass(byId(focused, "orbit/build/interface"), "luastra-orbit-selected"))
assert(byId(focused, "orbit/focus/title").properties.text == "Interface")

Application.handle("close-focus", "orbit/focus/close", "")
assert(byId(Application.render(), "orbit/focus").properties.open == false)

Application.handle("return-root", "orbit/path/root", "")
local returned = Application.render()
assert(hasClass(byId(returned, "orbit/root"), "luastra-constellation-state-active"))
assert(hasClass(byId(returned, "orbit/build-space"), "luastra-constellation-state-ahead"))
assert(Application.snapshot().depth == "root")

return true`,
        useWhen: "Replace the smoke test. Test semantic states and contracts in Luau; verify actual layout, motion, focus order, and list fallback separately in supported hosts.",
      }),
      entry("5. Check and run", "spatial when suitable · complete list when constrained", "The same authored tree should remain navigable as the host changes presentation for the available viewport.", {
        language: "Shell",
        code: `luastra check
luastra test
luastra run
# Open the printed local URL.
# Select Build, open Interface, close the Focus Surface,
# then resize the viewport until the host chooses list presentation.`,
        useWhen: "Run from orbit-recipe after saving all three files.",
        points: [
          "check and test must report PASS with one passing test.",
          "Build moves the root constellation behind and makes the nested depth active.",
          "Interface opens a labelled Focus Surface and closing it returns focus to the originating node.",
          "A constrained viewport presents the same nodes and actions as a scrollable list; it is not a second application screen.",
        ],
      }),
      entry("6. Read the Orbit anatomy", "Orbit → Path + Constellation(s) + Focus Surface", "Each primitive owns one semantic responsibility and enforces a bounded structure.", {
        kind: "guide",
        useWhen: "Read this before adding nodes or another navigation depth.",
        points: [
          "UI.Orbit is the presentation boundary and accepts path, search, constellation, and Focus Surface children.",
          "UI.Constellation represents one depth and requires exactly one center plus 1 to 64 actionable nodes or clusters.",
          "UI.OrbitCenter names the current space; it is identity, not a button.",
          "UI.OrbitNode declares a leaf, constellation destination, or action. UI.OrbitCluster represents a real grouped destination.",
          "UI.FocusSurface contains full leaf detail while the originating constellation remains the navigation context.",
        ],
      }),
      entry("7. Author meaning, not coordinates", "priority + relationships + state → host layout", "Orbit placement is derived from bounded semantic hints, so the same model can survive resizing and different targets.", {
        kind: "guide",
        useWhen: "Read this when you are tempted to position a node manually or build a separate mobile layout.",
        points: [
          "priority expresses relative importance from 1 to 3; it is not a pixel radius.",
          "relatedTo contains IDs from the same constellation and influences stable neighbourhoods without creating navigation by itself.",
          "layerState marks one depth active and retained neighbours behind or ahead for bounded transitions.",
          "presentation = auto lets the host choose spatial or list mode from width, height, density, and label pressure.",
          "Every hidden, disabled, busy, selected, status, and action value still comes from Luau application state.",
        ],
      }),
      entry("8. Add routing only when URLs matter", "local state first · typed Navigation next", "This recipe isolates Orbit composition; a production information space should make depth and focused leaves restorable when its product requires deep links or system Back.", {
        kind: "guide",
        useWhen: "Read this after the local interaction works and you need reload restoration, browser history, app links, or mobile system Back.",
        points: [
          "Use the Typed Navigation and Browser/system Back recipes before replacing depth and selected with route entries.",
          "Make each constellation and focusable leaf a canonical route when users should link to it directly.",
          "Orbit Path is hierarchical navigation state, not an unlimited log of visited nodes.",
          "Retain only the bounded adjacent layers needed for transitions; do not keep every historical constellation rendered.",
        ],
      }),
      entry("9. Verify presentation claims separately", "semantic test ≠ browser/device evidence", "Passing Luau tests proves the model and event transitions, but visual and platform claims need host-specific checks.", {
        kind: "guide",
        useWhen: "Read this before publishing an Orbit application or promising accessibility and performance across targets.",
        points: [
          "Check desktop, tablet, phone, and short-landscape sizes; width alone does not determine usable spatial layout.",
          "Verify keyboard entry, directional movement, Escape dismissal, focus restoration, and complete list-mode parity.",
          "Test orbitMotion = system with operating-system reduced motion and orbitMotion = off without delayed state changes.",
          "Check every selected theme for normal text, status, controls, retained layers, and Focus Surface contrast.",
          "Measure idle work and transition responsiveness with diagnostics; visual smoothness is not a substitute for a budget.",
        ],
      }),
    ],
    callout: "Constellation Orbit is an information architecture, not a space-themed skin. Declare stable meaning and bounded state in Luau; let the host provide geometry, motion, focus, and the complete list fallback.",
  },
  {
    id: "luau-types",
    title: "Luau typing quick reference",
    module: "Luau 0.731 · --!strict",
    summary: "A practical introduction for Lua developers: annotations, arrays, dictionaries, records, unions, generics, module types, casts, and runtime freezing.",
    guide: [
      "Luau types find mistakes during luastra check; they do not change runtime values. Put --!strict on the first line so the analyzer checks arguments, return values, table fields, and unhandled state variants.",
      "Luau has no separate struct keyword, and standalone Luau has no universal Enum. Record types describe structures, singleton unions describe enum-like values, and tagged unions describe state with different fields.",
      "Every example below is self-contained and checked by the documentation validator. Uncomment only the explicitly marked error line when practising how to read a failing luastra check.",
    ],
    cards: [
      entry("Annotations and inference", "local name: Type · parameter: Type · function(): Type", "A colon declares the expected type. Luau can infer obvious local values, while function and module boundaries benefit from explicit annotations.", {
        code: `--!strict

local interactions: number = 0
local title: string = "Sixth Sense"

local function increment(value: number): number
    return value + 1
end

interactions = increment(interactions)
-- interactions = "one" -- luastra check reports a type error`,
      }),
      entry("Arrays", "{T}", "A dense 1-based table whose elements share one type. Luau does not use a [] array literal.", {
        code: `--!strict

local colors: {string} = { "red", "green" }
local labels: {string} = {}

table.insert(colors, "blue")
local first: string = colors[1]

for index, color in ipairs(colors) do
    labels[index] = \`{index}: {color}\`
end

assert(first == "red" and labels[3] == "3: blue")`,
        points: ["An empty number array is local values: {number} = {}.", "Use #values and ipairs only for dense sequences without missing indexes."],
      }),
      entry("Dictionaries and maps", "{[Key]: Value}", "A keyed table that may be sparse. A numeric key does not make a table an array when its indexes are arbitrary.", {
        code: `--!strict

local pending: {[number]: string} = {}

pending[42] = "save"
pending[105] = "restore"

local operation: string? = pending[42]
pending[42] = nil

local remaining = 0
for requestId, name in pairs(pending) do
    assert(requestId > 0 and #name > 0)
    remaining += 1
end

assert(operation == "save" and remaining == 1)`,
        points: ["{[string]: number} means string key to number value.", "Do not use #table or ipairs for a sparse dictionary."],
      }),
      entry("Record types", "type Name = { field: Type }", "A table type is Luau's struct-like construct. The analyzer checks required fields and their value types.", {
        code: `--!strict

type Color = "red" | "green" | "blue"
type GameState = {
    interactions: number,
    correctAnswers: number,
    selectedColor: Color?,
    cardRevealed: boolean,
}

local state: GameState = {
    interactions = 0,
    correctAnswers = 0,
    selectedColor = nil,
    cardRevealed = false,
}`,
      }),
      entry("Enum-like singleton unions", "type Color = \"red\" | \"green\"", "A union of literal strings limits a value to known alternatives. A separate frozen table can provide convenient runtime constants.", {
        code: `--!strict

type Color = "red" | "green" | "blue"

local selected: Color = "green"
-- selected = "yellow" -- type error

local Colors: { Red: Color, Green: Color, Blue: Color } = {
    Red = "red",
    Green = "green",
    Blue = "blue",
}

table.freeze(Colors)`,
        points: ["Color exists only for the analyzer.", "Colors is a runtime table containing named constants."],
      }),
      entry("Optional values", "T? = T | nil", "A question mark means that a value may be absent. Narrow away nil before using the value as T.", {
        code: `--!strict

type Color = "red" | "green" | "blue"
local selectedColor: Color? = "green"
local label = "No selection"

if selectedColor ~= nil then
    label = "Selected: " .. selectedColor
end

type Meditation = {
    id: string,
    description: string?,
}

local session: Meditation = { id = "morning" }
assert(label == "Selected: green" and session.description == nil)`,
      }),
      entry("Unions and type narrowing", "A | B", "A value may match either type. A type, typeof, nil, or tag check narrows the union to a safe branch.", {
        code: `--!strict

local value: string | number = "hello"
local description: string

if type(value) == "string" then
    description = string.upper(value)
else
    description = tostring(value + 1)
end

assert(description == "HELLO")`,
      }),
      entry("Tagged unions", "{ kind: \"a\", ... } | { kind: \"b\", ... }", "A shared literal tag safely models states that expose different fields.", {
        wide: true,
        code: `--!strict

type Color = "red" | "green" | "blue"
type GamePhase =
    { kind: "waiting" }
    | { kind: "guessing", hiddenColor: Color }
    | {
        kind: "revealed",
        hiddenColor: Color,
        guessedColor: Color,
        correct: boolean,
    }

local function describe(phase: GamePhase): string
    if phase.kind == "waiting" then
        return "Press Start"
    elseif phase.kind == "guessing" then
        return "Choose a color"
    else
        return phase.correct and "Correct" or "Try again"
    end
end

local phase: GamePhase = { kind = "guessing", hiddenColor = "blue" }
assert(describe(phase) == "Choose a color")`,
      }),
      entry("Generics", "Type<T> · function name<T>(value: T)", "A type parameter lets one checked pattern work with many value types without losing their exact result type.", {
        wide: true,
        code: `--!strict

type Color = "red" | "green" | "blue"
type Result<T> =
    { success: true, value: T }
    | { success: false, error: string }

local function first<T>(items: {T}): T?
    return items[1]
end

local color: Color? = first({ "red" :: Color, "green" :: Color })
local score: number? = first({ 10, 20, 30 })`,
      }),
      entry("Function types", "(Parameters) -> Returns", "Callbacks and ordinary functions can be typed. () after the arrow means the function returns no values.", {
        code: `--!strict

type TapHandler = (action: string, target: string) -> ()
type Validator = (value: string) -> (boolean, string?)

local validateEmail: Validator = function(value)
    if string.find(value, "@", 1, true) == nil then
        return false, "Email must contain @"
    end
    return true, nil
end

local accepted, message = validateEmail("reader@example.com")
assert(accepted and message == nil)`,
      }),
      entry("Exported module types", "export type Name = ...", "A local type stays inside its module. export type lets consumers refer to it through the name bound by require.", {
        wide: true,
        code: `-- app/cards.luau
--!strict

export type Card = {
    id: string,
    color: "red" | "green",
}

local Cards = {}

function Cards.create(id: string, color: "red" | "green"): Card
    return { id = id, color = color }
end

return table.freeze(Cards)

-- app/main.luau
--!strict

local Cards = require("app/cards")
local card: Cards.Card = Cards.create("card-1", "green")

assert(card.id == "card-1" and card.color == "green")`,
      }),
      entry("typeof", "type Name = typeof(value)", "Derive a type from an existing value. It is convenient for local configuration; an explicit type is often clearer for a public contract.", {
        code: `--!strict

local defaults = {
    soundEnabled = true,
    volume = 0.8,
}

type Settings = typeof(defaults)

local settings: Settings = {
    soundEnabled = false,
    volume = 0.5,
}`,
      }),
      entry("Intersections", "A & B", "Require a value to satisfy both types, which is useful when combining small reusable contracts.", {
        code: `--!strict

type Identified = { id: string }
type Named = { name: string }
type NamedEntity = Identified & Named

local item: NamedEntity = {
    id = "meditation-1",
    name = "Morning calm",
}`,
      }),
      entry("any, unknown, and never", "any · unknown · never", "any largely disables checking, unknown requires narrowing before use, and never describes an impossible value.", {
        code: `--!strict

local value: unknown = "green"

if type(value) == "string" then
    local upper = string.upper(value)
end

local function impossible(value: never): never
    error("Unhandled value: " .. tostring(value))
end`,
        points: ["Prefer a concrete type whenever possible.", "Use unknown at untrusted boundaries and narrow it before use.", "Keep any as a temporary escape hatch for code that cannot yet be typed.", "Use never to prove that every union alternative was handled."],
      }),
      entry("Type casts with ::", "expression :: Type", "The :: operator tells the analyzer to treat an expression as a compatible type. It does not validate external data or change the runtime value.", {
        code: `--!strict

type Color = "red" | "green"

local raw = "red"
local selected = raw :: Color

-- Validate unknown storage or server data with luastra/data
-- before casting it to a trusted application type.`,
        points: ["Use :: only when you know more than inference can prove.", "A cast is not a runtime validator and should not be used to silence a real mismatch."],
      }),
      entry("Runtime immutability with table.freeze", "table.freeze(value)", "Freeze a table so later writes fail at runtime. The operation is shallow: nested tables remain mutable unless they are frozen separately.", {
        code: `--!strict

type Tween = {
    kind: "tween",
    from: number,
    to: number,
}

local tween = table.freeze({
    kind = "tween",
    from = 0,
    to = 1,
}) :: Tween

-- tween.to = 2 -- runtime error: the table is frozen`,
        points: ["table.freeze affects runtime mutation; it is separate from static typing.", "Freeze each nested table separately when deep immutability is required.", "Freezing a returned module API prevents consumers from replacing its exported fields."],
      }),
      entry("Read analyzer errors", "path:line:column · message · first cause", "Treat analyzer output as a source location plus a mismatch to repair, not as a verdict on the whole application.", {
        wide: true,
        code: `--!strict

type CounterState = {
    count: number,
}

local state: CounterState = { count = 0 }
state.count += 1

-- Uncomment this line, run luastra check, and inspect its location:
-- state.count = "one"

assert(state.count == 1)`,
        useWhen: "Use this exercise when luastra check reports a type error and you are unsure which part of the diagnostic should guide the fix.",
        points: ["Start with the first diagnostic that names one of your source files; later messages may be consequences of that mismatch.", "Open the reported line and inspect the complete expression, function call, or table literal—not only the highlighted token.", "Compare the required type with the value actually supplied. Here count is declared number, while the uncommented value would be string.", "Fix the source contract or value instead of adding :: or any merely to silence the analyzer.", "Run luastra check again. A real fix removes the diagnostic without creating a wider, less precise type."],
      }),
    ],
    tables: [
      {
        id: "luau-table-types",
        title: "How to read table types",
        rows: [
          row("{number}", "array of numbers", "Dense values such as { 10, 20, 30 }."),
          row("{Color}", "array of Color", "Every element must be one admitted Color literal."),
          row("{[number]: string}", "number key → string", "A sparse dictionary such as RequestId → operation."),
          row("{[string]: number}", "string key → number", "For example player name → score."),
          row("{ id: string, active: boolean }", "record", "A table with known named fields."),
        ],
      },
      {
        id: "luau-diagnostic-reading",
        title: "How to read a check diagnostic",
        rows: [
          row("Source location", "path plus line and column", "Open that exact file and inspect the full surrounding expression."),
          row("Required side", "the declared parameter, return, variable, or field type", "This is the contract the code promised to satisfy."),
          row("Supplied side", "the inferred type of the actual value", "Trace where that value was created or narrowed."),
          row("First repair", "change the incorrect value or the genuinely incorrect contract", "Do not begin with a cast, any, or disabled strict mode."),
          row("Confirmation", "run luastra check again", "The original error should disappear while useful type precision remains."),
        ],
      },
    ],
    callout: "Types disappear after analysis and do not verify server, storage, or form payloads. Validate unknown runtime data with luastra/data; use table.freeze separately when runtime immutability is required.",
  },
  {
    id: "beginner-tutorial",
    title: "Beginner tutorial: build an accessible counter",
    module: "luastra/ui · Application.render · Application.handle · about 15 minutes",
    summary: "Create, understand, test, run, and safely change one complete Luastra application.",
    guide: [
      "Start here after Installation and Quick start. You need only basic Luau tables, functions, if statements, and local variables.",
      "You will create one project whose visible count begins at 0. Add one changes it to 1; Reset returns it to 0 and is disabled when there is nothing to reset.",
      "Copy each complete file exactly before adapting it. The documentation validator materializes these same files and requires both luastra check and luastra test to pass.",
    ],
    cards: [
      entry("1. Create the project", "luastra create beginner-counter", "The CLI creates the normal project structure. Enter that directory before replacing the three files below.", {
        language: "Shell",
        code: `luastra create beginner-counter
cd beginner-counter`,
        useWhen: "Run this in the parent directory where the new project folder should be created.",
        points: ["Expect JSON with result=PASS.", "You should now have luastra.json, src/main.luau, and tests/smoke.luau.", "If create rejects the destination, choose a missing or empty safe directory rather than deleting existing work."],
      }),
      entry("2. Replace luastra.json", "one app module · one test module · ui.render", "The manifest declares every source file, dependency, test, and host capability used by this tutorial.", {
        language: "JSON",
        code: `{
  "schemaVersion": 2,
  "project": {
    "id": "dev.luastra.beginner-counter",
    "entry": "app/main"
  },
  "sdk": {
    "contract": 1
  },
  "capabilities": ["ui.render"],
  "modules": [
    {
      "id": "app/main",
      "source": "src/main.luau",
      "dependencies": ["luastra/ui"]
    },
    {
      "id": "app/tests/counter",
      "source": "tests/smoke.luau",
      "dependencies": ["app/main"]
    }
  ],
  "tests": ["app/tests/counter"]
}`,
        useWhen: "Replace the generated manifest before checking the project so the test can import the application and the application can import luastra/ui.",
        points: ["ui.render admits host rendering; it does not grant storage, network, media, or filesystem access.", "Dependencies are per module: app/main imports luastra/ui, while the test imports app/main.", "The test module is listed in both modules and tests because declaration and execution are separate manifest responsibilities."],
      }),
      entry("3. Replace src/main.luau", "complete runnable application", "Module state owns the count, render describes the current interface, and handle admits exactly two actions from stable controls.", {
        wide: true,
        code: `--!strict

local UI = require("luastra/ui")

local Application = {}
local count: number = 0

function Application.render(): UI.Node
    return UI.Screen {
        id = "counter",
        documentTitle = "Beginner counter",
        width = "full",

        UI.Column {
            id = "counter/content",
            width = "content",
            padding = "responsive",
            gap = "md",

            UI.Text {
                id = "counter/title",
                text = "My first Luastra app",
                variant = "title",
            },
            UI.Text {
                id = "counter/value",
                text = \`Count: {count}\`,
                role = "status",
                label = \`Current count: {count}\`,
            },
            UI.Row {
                id = "counter/actions",
                gap = "sm",
                responsive = true,

                UI.Button {
                    id = "counter/add",
                    text = "Add one",
                    onTap = "counter.add",
                },
                UI.Button {
                    id = "counter/reset",
                    text = "Reset",
                    appearance = "secondary",
                    disabled = count == 0,
                    onTap = "counter.reset",
                },
            },
        },
    }
end

function Application.handle(action: string, target: string, _value: string)
    if action == "counter.add" and target == "counter/add" then
        count += 1
    elseif action == "counter.reset" and target == "counter/reset" then
        count = 0
    end
end

function Application.snapshot()
    return { count = count }
end

return Application`,
        useWhen: "Replace the complete generated entry module; do not paste only render or handle because the imports, state, snapshot, and returned Application table belong to the same file.",
        points: ["--!strict lets luastra check analyze this entire module.", "Application.render has no side effects: it returns a fresh description of UI from count.", "onTap contains an action name; the clicked component's stable id arrives separately as target.", "role=status announces the changed count without moving keyboard focus.", "snapshot is a small test seam used by tests/smoke.luau; the host never calls it."],
      }),
      entry("4. Replace tests/smoke.luau", "deterministic interaction test", "The test imports the real entry module, exercises the same actions emitted by the buttons, and proves that an unrelated target cannot mutate state.", {
        wide: true,
        code: `--!strict

local Application = require("app/main")

assert(Application.snapshot().count == 0, "counter must start at zero")

local initialTree = Application.render()
assert(initialTree.type == "Screen", "render must return one Screen root")
assert(initialTree.id == "counter", "screen id must remain stable")

Application.handle("counter.add", "counter/add", "")
assert(Application.snapshot().count == 1, "Add one must increment the count")

Application.handle("counter.add", "another/control", "")
assert(Application.snapshot().count == 1, "an unrelated target must not change state")

Application.handle("counter.reset", "counter/reset", "")
assert(Application.snapshot().count == 0, "Reset must restore zero")

return true`,
        useWhen: "Replace the generated smoke test so luastra test verifies this application's behavior instead of only constructing an unrelated SDK node.",
        points: ["The test calls handle directly, so it is deterministic and does not need a browser.", "The live preview separately proves pointer, keyboard, DOM, and visible status behavior in the current host.", "When you add a new product rule, add its state transition here before relying on manual testing alone."],
      }),
      entry("5. Check before running", "luastra check → luastra test", "First validate the manifest and strict module graph, then execute the declared behavior test.", {
        language: "Shell",
        code: `luastra check
luastra test`,
        useWhen: "Run these commands from beginner-counter after all three files are saved.",
        points: ["check must report result=PASS and project=dev.luastra.beginner-counter.", "test must report tests=1 and passed=1.", "A check error names the source or manifest problem. Fix its first concrete path or line before interpreting later errors.", "If test fails, read the assertion message: it names the product behavior that no longer matches the code."],
      }),
      entry("6. Run and verify the interface", "luastra run → READY URL", "Keep the terminal open, visit the printed local URL, and exercise the actual browser host.", {
        language: "Shell",
        code: `luastra run
# Open the READY URL printed by Luastra.
# Expect Count: 0 and a disabled Reset button.
# Press Add one: expect Count: 1 and an enabled Reset button.
# Press Reset: expect Count: 0 and Reset disabled again.
# Press Tab and Enter to repeat the flow without a mouse.
# Stop the preview with Ctrl+C.`,
        useWhen: "Run only after check and test pass; the preview stays available while this command owns the terminal.",
        points: ["The URL may use a different free port; use the exact READY URL.", "Keyboard focus should remain on the activated button while the status text changes.", "Automated state tests and live host interaction are complementary evidence, not substitutes for each other."],
      }),
      entry("7. Make one safe change", "edit → check → test → preview", "Change the visible title to your own app name, then repeat the same development loop.", {
        kind: "guide",
        useWhen: "Do this only after the copied tutorial works unchanged once.",
        points: ["Change only counter/title.text first; the existing interaction test should still pass.", "Run luastra check and luastra test after the edit.", "Refresh or return to the live preview and confirm the new title without losing counter behavior.", "For a behavior change such as adding Subtract, update render, handle, and the test together.", "Next, use the Delayed action recipe to add time, Typed navigation to add screens, or Persist state to survive reloads."],
      }),
    ],
    tables: [{
      id: "beginner-counter-flow",
      title: "How one click becomes visible state",
      rows: [
        row("1. Declare", "UI.Button onTap=counter.add", "render describes an accessible action and its stable target id."),
        row("2. Activate", "pointer, touch, Enter, or Space", "the host emits the admitted action and target without embedding application logic."),
        row("3. Update", "Application.handle", "the application validates both strings and changes count."),
        row("4. Render", "Application.render", "Luastra requests the complete current tree again."),
        row("5. Reconcile", "stable node ids", "the host updates the count and disabled state without replacing unrelated UI."),
      ],
    }],
    callout: "The tutorial test proves deterministic application state. The live preview separately proves the selected browser host and interaction path; neither alone proves every desktop, mobile, or assistive-technology target.",
  },
  {
    id: "advanced-tutorial",
    title: "Advanced tutorial: build a routed reading list",
    module: "Navigation · State · Data · Host · about 30 minutes",
    summary: "Combine a typed route stack, validated versioned snapshots, and asynchronous storage in one checked application.",
    guide: [
      "Complete Beginner tutorial first. This walkthrough assumes you already understand module state, render, handle, stable IDs, check, test, and run.",
      "You will open note 7, switch to a favorites filter, save both values, change them, and restore the exact saved route and filter.",
      "Copy the three complete files unchanged once. The documentation validator materializes these same files and requires both luastra check and luastra test to pass.",
    ],
    cards: [
      entry("1. Create the project", "luastra create routed-reading-list", "Create a normal starter and enter it before replacing the complete manifest, entry module, and test below.", {
        language: "Shell",
        code: `luastra create routed-reading-list
cd routed-reading-list`,
        useWhen: "Run this in the parent directory where the new project folder should be created.",
        points: ["Expect JSON with result=PASS.", "Keep the generated files until you have the three replacements below ready.", "Use the focused Navigation and Storage recipes first if either capability is still unfamiliar."],
      }),
      entry("2. Replace luastra.json", "four SDK modules · three host capabilities", "The manifest admits rendering plus storage reads and writes; every imported module is declared on the exact source file that uses it.", {
        language: "JSON",
        code: `{
  "schemaVersion": 2,
  "project": {
    "id": "dev.luastra.routed-reading-list",
    "entry": "app/main"
  },
  "sdk": {
    "contract": 1
  },
  "capabilities": ["storage.get", "storage.set", "ui.render"],
  "modules": [
    {
      "id": "app/main",
      "source": "src/main.luau",
      "dependencies": ["luastra/data", "luastra/host", "luastra/navigation", "luastra/state", "luastra/ui"]
    },
    {
      "id": "app/tests/reading-list",
      "source": "tests/smoke.luau",
      "dependencies": ["app/main"]
    }
  ],
  "tests": ["app/tests/reading-list"]
}`,
        useWhen: "Replace the generated manifest before importing Navigation, State, Data, or Host.",
        points: ["Navigation, State, and Data are deterministic SDK modules and need no host capability.", "storage.get and storage.set are separate permissions because reading and writing are separate effects.", "This tutorial does not synchronize the browser URL; navigation.history belongs to the dedicated Browser and system Back recipe."],
      }),
      entry("3. Replace src/main.luau", "complete routed and persisted application", "One router owns navigation, one versioned snapshot carries the router plus filter, and RequestIds correlate asynchronous storage completions.", {
        wide: true,
        code: `--!strict

local Data = require("luastra/data")
local Host = require("luastra/host")
local Navigation = require("luastra/navigation")
local State = require("luastra/state")
local UI = require("luastra/ui")

local routes = Navigation.compile {
    { name = "library", path = "/" },
    {
        name = "note",
        path = "/notes/:note_id",
        params = { note_id = { type = "integer", minimum = 1, maximum = 99 } },
    },
}

local router = Navigation.createRouter {
    compiler = routes,
    initial = { name = "library", params = {}, query = {} },
}

local snapshotSchema = Data.object({
    navigation = Data.string({ minBytes = 5, maxBytes = 4096 }),
    filter = Data.string({ minBytes = 3, maxBytes = 9 }),
})

local Application = {}
local filter = "all"
local message = "Nothing saved yet"
local pending: { [number]: string } = {}

local function encodeSnapshot(): string
    return State.encode(1, {
        navigation = router.encode(),
        filter = filter,
    })
end

local function track(id: number, operation: string)
    pending[id] = operation
end

function Application.restore(payload: string): boolean
    local decoded = State.decode(payload, 1)
    if not decoded.success then return false end

    local checked = Data.decode(snapshotSchema, decoded.fields)
    if not checked.success then return false end
    local fields = checked.value :: { [string]: any }
    if fields.filter ~= "all" and fields.filter ~= "favorites" then return false end

    local restored = router.restoreEncoded(fields.navigation)
    if not restored.success then return false end
    filter = fields.filter
    return true
end

function Application.render(): UI.Node
    local current = router.current()
    local location = router.currentLocation()
    return UI.Screen {
        id = "reading-list",
        documentTitle = "Routed reading list",
        UI.Column {
            id = "reading/content",
            width = "content",
            padding = "responsive",
            gap = "md",

            UI.Text { id = "reading/title", text = "Routed reading list", variant = "title" },
            UI.Text { id = "reading/route", text = "Route: " .. current.name .. " (" .. location .. ")" },
            UI.Text { id = "reading/filter", text = "Filter: " .. filter },
            UI.Text { id = "reading/message", text = message, role = "status" },
            UI.Actions {
                id = "reading/navigation",
                UI.Button { id = "reading/open", text = "Open note 7", onTap = "reading.open" },
                UI.Button {
                    id = "reading/back",
                    text = "Back to library",
                    onTap = "reading.back",
                    disabled = not router.canBack(),
                },
                UI.Button { id = "reading/filter-toggle", text = "Toggle filter", onTap = "reading.filter" },
            },
            UI.Actions {
                id = "reading/storage",
                UI.Button { id = "reading/save", text = "Save view", onTap = "reading.save" },
                UI.Button { id = "reading/load", text = "Restore view", onTap = "reading.load" },
            },
        },
    }
end

function Application.handle(action: string, target: string, _value: string)
    if action == "reading.open" and target == "reading/open" then
        local result = router.push { name = "note", params = { note_id = 7 }, query = {} }
        message = result.success and "Opened note 7" or "Could not open note"
    elseif action == "reading.back" and target == "reading/back" then
        if router.back() then message = "Returned to library" end
    elseif action == "reading.filter" and target == "reading/filter-toggle" then
        filter = if filter == "all" then "favorites" else "all"
        message = "Filter changed"
    elseif action == "reading.save" and target == "reading/save" then
        track(Host.storageSet("reading-list-view", encodeSnapshot()), "save")
        message = "Saving…"
    elseif action == "reading.load" and target == "reading/load" then
        track(Host.storageGet("reading-list-view"), "load")
        message = "Loading…"
    end
end

function Application.resolve(
    id: number,
    success: boolean,
    payload: string,
    code: string,
    _errorMessage: string
)
    local operation = pending[id]
    pending[id] = nil
    if operation == nil then return end
    if not success then message = operation .. " failed: " .. code return end
    if operation == "save" then message = "View saved"
    elseif Application.restore(payload) then message = "View restored"
    else message = "Saved view is invalid" end
end

function Application.snapshot()
    return {
        name = router.current().name,
        location = router.currentLocation(),
        filter = filter,
        message = message,
        encoded = encodeSnapshot(),
    }
end

return Application`,
        useWhen: "Replace the entire generated entry module. Keep encode and restore near each other so snapshot version, fields, validation, and route restoration remain auditable.",
        points: ["Navigation.compile validates note_id before a route can enter the stack.", "State.decode checks framing and version; Data.decode then checks the decoded field shapes; the application finally admits only known filter values.", "router.restoreEncoded validates every restored route before replacing the active stack.", "Application.resolve ignores unknown RequestIds and clears known requests before applying their result.", "Rendering reads current state; storage effects start only from admitted button actions."],
      }),
      entry("4. Replace tests/smoke.luau", "route, round-trip, and rejection test", "The deterministic test drives route and filter actions, restores their saved snapshot, and proves malformed external data cannot replace current state.", {
        wide: true,
        code: `--!strict

local Application = require("app/main")

local initial = Application.snapshot()
assert(initial.location == "/", "application must start at the library")
assert(initial.filter == "all", "application must start with the all filter")

Application.handle("reading.open", "reading/open", "")
Application.handle("reading.filter", "reading/filter-toggle", "")
local saved = Application.snapshot()
assert(saved.location == "/notes/7", "note route was not generated")
assert(saved.filter == "favorites", "filter did not change")

Application.handle("reading.back", "reading/back", "")
Application.handle("reading.filter", "reading/filter-toggle", "")
assert(Application.snapshot().location == "/", "Back did not return to the library")
assert(Application.snapshot().filter == "all", "filter did not return to all")

assert(Application.restore(saved.encoded), "valid snapshot was rejected")
assert(Application.snapshot().location == "/notes/7", "saved route was not restored")
assert(Application.snapshot().filter == "favorites", "saved filter was not restored")

local beforeInvalid = Application.snapshot()
assert(not Application.restore("v=1&filter=unknown&navigation=invalid"), "invalid snapshot was accepted")
local afterInvalid = Application.snapshot()
assert(afterInvalid.location == beforeInvalid.location, "invalid restore changed the route")
assert(afterInvalid.filter == beforeInvalid.filter, "invalid restore changed the filter")

return true`,
        useWhen: "Replace the generated smoke test so check and test cover the complete deterministic state boundary without depending on a browser storage implementation.",
        points: ["The encoded snapshot comes from the real application rather than a duplicated hand-written encoding.", "The test changes current state before restoring, so a false-positive no-op cannot pass.", "The invalid payload check proves the previously valid route and filter remain intact."],
      }),
      entry("5. Check the deterministic model", "luastra check → luastra test", "Validate the manifest and strict module graph first, then run the route, snapshot, and rejection behavior test.", {
        language: "Shell",
        code: `luastra check
luastra test`,
        useWhen: "Run from routed-reading-list after all three files are saved.",
        points: ["check must report result=PASS and project=dev.luastra.routed-reading-list.", "test must report tests=1 and passed=1.", "This proves pure routing, encoding, validation, and restoration logic; it does not prove that a host persisted bytes."],
      }),
      entry("6. Run the storage round trip", "save → change → restore → reload → restore", "Use the printed preview URL to verify the asynchronous browser-storage boundary separately from the deterministic test.", {
        language: "Shell",
        code: `luastra run
# Open the READY URL printed by Luastra.
# Press Open note 7, Toggle filter, then Save view.
# Press Back to library and Toggle filter: expect / and all.
# Press Restore view: expect /notes/7 and favorites.
# Reload the page, press Restore view again, and expect the same saved view.
# Stop the preview with Ctrl+C.`,
        useWhen: "Run only after check and test pass; keep the terminal open while verifying the current browser host.",
        points: ["Saving… and Loading… are immediate application states; View saved or View restored arrives through Application.resolve.", "Restoring before the first save may fail or return empty data; the current route and filter must remain usable.", "A browser-host pass does not prove storage behavior in every desktop or mobile host."],
      }),
      entry("7. Understand the trust boundaries", "route model → snapshot → transport → validated restore", "Each layer solves one problem; keeping them separate makes failures recoverable and tests meaningful.", {
        kind: "guide",
        useWhen: "Read this after both the deterministic test and live storage round trip work unchanged.",
        points: ["Navigation validates and serializes the route stack; it does not persist anything.", "State provides bounded versioned string framing; it does not decide whether fields are valid product data.", "Data validates decoded external fields; the application still admits domain values such as all or favorites.", "Host transports the string asynchronously; RequestIds prevent an older completion from being mistaken for another operation.", "For a released schema change, increment the State version and add a tested State.migrate path before shipping the new writer."],
      }),
    ],
    tables: [{
      id: "advanced-evidence-boundaries",
      title: "What each verification proves",
      rows: [
        row("luastra check", "Manifest, dependencies, strict Luau, and admitted SDK calls", "It does not execute the behavior test or a host adapter."),
        row("luastra test", "Route transitions, snapshot round trip, and invalid-data preservation", "It does not prove browser storage or visible interaction."),
        row("Browser preview", "Buttons, status updates, storage requests, reload, and current web host", "It does not prove Tauri, Capacitor, or another browser."),
        row("Target-specific QA", "The packaged host and device combination you actually exercised", "Record it separately instead of generalizing it to every target."),
      ],
    }],
    links: [
      { text: "Review the focused typed navigation recipe", href: "#/docs/recipe-navigation" },
      { text: "Review the focused persistence recipe", href: "#/docs/recipe-storage" },
      { text: "Add Browser and system Back after this works", href: "#/docs/recipe-history" },
    ],
    callout: "Do not add Server functions here. First make the local route and persistence boundary predictable; the checked Server recipe introduces trusted backend work as a separate concern.",
  },
  {
    id: "first-app",
    title: "Complete mini-app checkpoint",
    module: "Beginner tutorial · verified manifest · application test",
    summary: "Use the checked counter as your first complete project, then choose one bounded feature to add.",
    guide: [
      "The former standalone counter snippet now lives in Beginner tutorial as a complete project with its manifest, entry module, interaction test, commands, expected browser behavior, and troubleshooting guidance.",
      "Keep this route as a checkpoint after finishing that tutorial: you should be able to explain where state lives, why render stays deterministic, how actions reach handle, and what check, test, and run each prove.",
    ],
    links: [
      { text: "Open the complete Beginner tutorial", href: "#/docs/beginner-tutorial" },
      { text: "Add a delayed action", href: "#/docs/recipe-timer" },
      { text: "Add typed navigation", href: "#/docs/recipe-navigation" },
      { text: "Persist state across reloads", href: "#/docs/recipe-storage" },
    ],
    cards: [
      entry("Completion checklist", "copy → understand → verify → change", "Finish each checkpoint before treating the counter as a working first application.", {
        kind: "guide",
        useWhen: "Use this after completing Beginner tutorial and before moving to a capability recipe.",
        points: [
          "The three displayed files were copied into one project and both check and test reported PASS.",
          "The browser showed Count: 0, Add one changed it to 1, and Reset restored 0.",
          "The same interaction worked with Tab and Enter.",
          "You changed the title, repeated check and test, and confirmed the preview still behaved correctly.",
          "You can identify which claims came from the deterministic test and which came from the live browser check.",
        ],
      }),
      entry("Choose the next capability", "time · routes · persistence", "Add one concept at a time through a complete checked recipe instead of combining several unfamiliar host boundaries at once.", {
        kind: "guide",
        useWhen: "Use this when choosing the first extension to your counter.",
        points: [
          "Delayed action teaches timer events delivered to Application.handle.",
          "Typed navigation teaches named routes and validated canonical locations.",
          "Persist state teaches versioned snapshots plus asynchronous Host requests and Application.resolve.",
          "Return to the API reference only after the matching recipe works, then use symbol pages for exact signatures and edge cases.",
        ],
      }),
    ],
    callout: "Do not paste isolated snippets from several recipes into the counter at once. Make one bounded change, update its test, and repeat check → test → run—the Luastra development loop behind Build apps like games.",
  },
  { id: "application", title: "Application contract", module: "app/main", summary: "render is always required; handle is required when events can arrive; resolve is required when non-timer capability requests can complete.", guide: ["The entry module creates and returns an Application table. Initial render describes the screen without side effects; later handle or resolve calls update module state, then Luastra renders again.", "Implement handle before declaring controls, timers, lifecycle behavior, history, or media-state events. Implement resolve before starting Host, Server, or Media requests. Timer acknowledgements do not enter resolve; timer expiry enters handle."], cards: [entry("Application.render", "Application.render() -> UI.Node", "Returns the complete current interface as exactly one UI.Screen root.", { kind: "function", returns: "UI.Node — exactly one UI.Screen root.", useWhen: "Implement render in every application entry module; it is the required source of the complete current host-neutral UI tree.", code: `function Application.render(): UI.Node\n    return UI.Screen {\n        id = "app",\n    }\nend` }), entry("Application.handle", "Application.handle(action: string, target: string, value: string)", "Receives admitted UI and host events before the next render.", { kind: "function", parameters: [row("action", "string", "An onTap/onInput/onDismiss action or a host event such as lifecycle, timer, history, open_url, system_back, or media_state."), row("target", "string", "The stable component ID or host target such as app or browser."), row("value", "string", "The committed input value or bounded event payload; it may be empty.")], returns: "Nothing. State changes become visible in the render that follows the handler.", useWhen: "Implement handle when the application reacts to controls, input, timers, navigation, lifecycle, media state, or other admitted host events.", code: `function Application.handle(\n    action: string,\n    target: string,\n    value: string\n)\n    -- Validate the event and update module state.\nend` }), entry("Application.resolve", "Application.resolve(id: number, success: boolean, payload: string, code: string, message: string)", "Receives the bounded completion of an asynchronous Host, Server, or Media request.", { kind: "function", parameters: [row("id", "number", "The RequestId returned when the operation started."), row("success", "boolean", "Whether the operation completed successfully."), row("payload", "string", "The successful bounded payload, or an empty string after failure."), row("code", "string", "The stable failure code, or an empty string after success."), row("message", "string", "The bounded diagnostic message, or an empty string after success.")], returns: "Nothing. Clear the matching pending operation and update state for the following render.", useWhen: "Implement resolve when the application starts asynchronous Host, Server, or Media operations and must correlate their results by RequestId.", code: `function Application.resolve(\n    id: number,\n    success: boolean,\n    payload: string,\n    code: string,\n    message: string\n)\n    -- Match id, clear pending work, then update state.\nend` })], callout: "Keep Application.render deterministic: describe UI from current state, and start timers, storage, media, or server work from initialization or event logic—not as a render side effect." },
  {
    id: "events-errors",
    title: "Events and errors",
    module: "Application.handle · Application.resolve · exact host payloads",
    summary: "Route UI and host events through Application.handle, correlate asynchronous capability completions in Application.resolve, and recover without replacing valid state with malformed external data.",
    guide: [
      "Application.handle receives admitted UI actions and host events before the next render. Always match the action and the expected stable target before mutating state.",
      "Application.resolve completes Host, Server, and Media requests. Save the operation under the returned RequestId, remove it before applying the completion, and ignore unknown or stale IDs.",
      "Timer expiry and ongoing media state are events, not resolve completions. Decode structured strings with their SDK decoder and preserve the last valid application state when decoding fails.",
    ],
    cards: [
      entry("Route handle events explicitly", "action + target + value", "One callback may receive unrelated UI, lifecycle, navigation, timer, and media events, so every mutation needs a narrow branch.", {
        wide: true,
        code: `function Application.handle(action: string, target: string, value: string)
    if action == "counter.add" and target == "counter/add" then
        count += 1
    elseif action == "lifecycle" and target == "app" then
        handleLifecycle(value)
    elseif action == "timer" and target == "refresh" then
        refresh(value)
    end
end`,
        useWhen: "Use this dispatch shape whenever an application has more than one event source.",
        points: ["action identifies the declared operation or host event family.", "target identifies the stable UI node, timer ID, or app host target.", "value is source-specific and may be empty; never assign it directly to trusted state without validation.", "Ignoring an unknown event is safer than applying it to the nearest-looking state branch."],
      }),
      entry("Handle lifecycle state", "handle(\"lifecycle\", \"app\", value)", "The current hosts emit launch, foreground/background visibility, and online/offline connectivity as serialized application events.", {
        code: `if action == "lifecycle" and target == "app" then
    if value == "launch" then
        status = "Starting"
    elseif value == "foreground" then
        status = "Visible"
    elseif value == "background" then
        status = "Background"
    elseif value == "online" then
        connectivity = "online"
    elseif value == "offline" then
        connectivity = "offline"
    end
end`,
        useWhen: "Use lifecycle events for resumable state and user-visible connectivity, not as proof that a remote request succeeded.",
        points: ["Initial web delivery is launch, current visibility, then current connectivity.", "Native app-state integration emits launch and current foreground/background state, followed by connectivity.", "Repeated pending equivalents may be deduplicated; code must not depend on duplicate delivery.", "Background is a state transition, not permission to promise unrestricted background execution."],
      }),
      entry("Decode a system Back intent", "handle(\"system_back\", \"app\", \"intent:canGoBack\")", "Native Back carries a positive intent ID plus a 1 or 0 host-history hint; the application must answer that exact intent once.", {
        wide: true,
        code: `local intentText, canGoBackText = string.match(value, "^([1-9][0-9]*):([01])$")
local intent = if intentText == nil then nil else tonumber(intentText)

if action == "system_back" and target == "app" and intent ~= nil then
    if modalOpen then
        modalOpen = false
        Host.systemBackHandled(intent)
    elseif router.canBack() then
        Host.systemBackHistory(intent)
    elseif canGoBackText == "0" then
        Host.systemBackExit(intent)
    else
        Host.systemBackHistory(intent)
    end
end`,
        useWhen: "Use this only after declaring navigation.history and deciding which application state owns Back priority.",
        points: ["Close app-owned transient UI such as a modal before changing navigation.", "Use the parsed positive intent ID, never a locally invented number.", "A stale or repeated intent is rejected by the host.", "systemBackExit is host-dependent and must remain the final root-level decision."],
      }),
      entry("Restore History and opened URLs", "history token · admitted URL", "Browser History carries only an app-authored state token, while open_url carries an admitted browser fragment or native application URL.", {
        wide: true,
        code: `if action == "history" and target == "app" then
    if not router.restoreEncoded(value).success then
        message = "Ignored invalid history state"
    end
elseif action == "open_url" and (target == "browser" or target == "app") then
    local matched = routes.match(extractLocation(value))
    if matched.success and matched.entry ~= nil then
        router.replace(matched.entry)
    else
        message = "Ignored unsupported link"
    end
end`,
        useWhen: "Use the History recipe for the complete checked implementation; this card explains the two distinct incoming boundaries.",
        points: ["history target is app and value is the bounded token previously written by this project.", "open_url target is browser for admitted web fragment changes and app for admitted native URL opens.", "Parse and validate the URL into a compiled route; do not concatenate its fragments into application state.", "On failure, keep the current route and show a recoverable status if the user needs feedback."],
      }),
      entry("Decode live media state", "handle(\"media_state\", \"app\", payload)", "Playback truth arrives independently of command acknowledgements and must pass Media.decodeState before its fields are read.", {
        code: `if action == "media_state" and target == "app" then
    local decoded = Media.decodeState(value)
    if decoded.success then
        mediaState = decoded.state
        mediaMessage = decoded.state.error == nil
            and "Playback updated"
            or "Playback error: " .. decoded.state.error.code
    else
        mediaMessage = "Ignored invalid media state"
    end
end`,
        useWhen: "Use this for every media_state event, including interruptions, buffering, background changes, and playback errors.",
        points: ["A successful command resolve means the request was accepted; it is not the ongoing playback position.", "A decode failure describes an invalid payload, while state.error describes a valid media state reporting playback failure.", "Keep the previous decoded state when a new payload is invalid."],
      }),
      entry("Correlate asynchronous completions", "pending[RequestId] → resolve", "The RequestId returned by a capability is the only reliable link between a later completion and the operation that started it.", {
        wide: true,
        code: `local pending: {[number]: string} = {}

local requestId = Host.storageGet("app-state")
pending[requestId] = "restore"

function Application.resolve(
    id: number,
    success: boolean,
    payload: string,
    code: string,
    _message: string
)
    local operation = pending[id]
    pending[id] = nil
    if operation == nil then return end
    if not success then
        status = operation .. " failed: " .. code
    elseif operation == "restore" and not restore(payload) then
        status = "Stored state is invalid"
    end
end`,
        useWhen: "Use this for Host, Server, and Media requests that return RequestId.",
        points: ["Store the intended operation immediately after receiving the RequestId.", "Clear the matching entry before decoding or mutating state so an error cannot leave it reusable.", "Ignore unknown IDs because they may be stale, duplicated, or belong to state that no longer exists.", "Use code for program decisions; message is bounded human-readable diagnostic context and must not be parsed."],
      }),
      entry("Choose a recovery policy", "reject · preserve · retry · replace", "A recoverable error should have an explicit state outcome instead of merely writing a console message.", {
        kind: "guide",
        useWhen: "Use this checklist when adding any decoder, capability, or host-event branch.",
        points: ["Malformed external data: reject it and preserve the last valid state.", "User-correctable input: keep the input, attach an accessible field or form error, and retain focus.", "Transient operation failure: expose retry only when repeating the operation is safe; use idempotency for retryable server mutations.", "Unauthorized or forbidden operation: clear invalid session assumptions and return to an admitted state instead of looping retries.", "Unknown or stale event/completion: ignore it without mutating unrelated state.", "Programming assertion: fix the violated contract during development; do not parse or branch on assertion prose."],
      }),
    ],
    tables: [
      { id: "event-delivery", title: "Exact event delivery", rows: [
        row("UI tap", "handle(onTap, component id, \"\")", "Match both declared action and stable target."),
        row("UI input", "handle(onInput, component id, committed value)", "Validate value before trusting it."),
        row("Dismiss", "handle(onDismiss, dismissible component id, \"\")", "Close only the matching transient surface."),
        row("Lifecycle", "handle(\"lifecycle\", \"app\", launch|foreground|background|online|offline)", "Treat visibility and connectivity as state, not completed work."),
        row("Timer expiry", "handle(\"timer\", timer id, configured value)", "Reject stale IDs after the owning state ends."),
        row("History", "handle(\"history\", \"app\", app-authored token)", "Restore through the typed router."),
        row("Opened URL", "handle(\"open_url\", browser|app, admitted URL)", "Parse into a compiled route."),
        row("System Back", "handle(\"system_back\", \"app\", positive-id:0|1)", "Answer the exact intent through Host."),
        row("Media state", "handle(\"media_state\", \"app\", encoded state)", "Decode with Media.decodeState."),
      ] },
      { id: "resolve-delivery", title: "Exact resolve delivery", rows: [
        row("id", "positive RequestId", "Match and delete pending[id] before applying the completion."),
        row("success", "boolean", "Only true admits the successful payload path."),
        row("payload", "bounded string or empty on failure", "Decode with the operation-specific SDK before trusting it."),
        row("code", "stable error code or empty on success", "Use for bounded control flow and user-facing recovery choice."),
        row("message", "bounded diagnostic or empty on success", "Useful for development context; never parse it as a protocol."),
      ] },
      { id: "error-handling", title: "Decoder and recovery map", rows: [
        row("Data validation", "Data.Result · code + path", "Keep input and show a field/form error."),
        row("State restore", "State.DecodeResult · State.MigrationResult", "Keep current state or run an explicit tested migration."),
        row("Routes", "Navigation.RouteResult · MutationResult", "Keep the current route when generation, match, or mutation fails."),
        row("Server payload", "Server.DecodeResult", "Keep previous trusted data and expose bounded retry where safe."),
        row("Media state", "Media.DecodeResult · state.error", "Distinguish malformed transport from a valid playback failure."),
        row("Assertion", "development contract failure", "Fix the API call or invariant; never catch message text as product flow."),
      ] },
    ],
    links: [
      { text: "Practise timer event delivery", href: "#/docs/recipe-timer" },
      { text: "Practise asynchronous storage recovery", href: "#/docs/recipe-storage" },
      { text: "Practise Browser and system Back", href: "#/docs/recipe-history" },
      { text: "Practise media state decoding", href: "#/docs/recipe-media" },
    ],
    callout: "Never log secrets, tokens, personal data, complete storage snapshots, server payloads, or system Back intent details while diagnosing an error.",
  },
  { id: "ui", title: "Interface components", module: "luastra/ui", summary: "Builds a complete host-neutral semantic interface tree from validated components with stable lowercase IDs. Current web, Tauri, and Capacitor hosts render the tree as accessible semantic DOM and update it after application events.", guide: ["Named fields configure one node, while numeric table entries are its ordered children. Application.render must return exactly one UI.Screen root and may compose any supported containers, content, controls, and visual nodes beneath it.", "Each component card below contains the complete parameter set supported by that component. Shared groups remain available as conceptual explanations, but they are no longer a substitute for the component-specific table."], cards: uiCards, example: moduleExamples["luastra/ui"], callout: "Every render-tree ID must be unique and use lowercase path segments. Native adapters currently serve capability boundaries rather than replacing the semantic DOM renderer with platform-native widgets." },
  { id: "ui-properties", title: "UI parameters", module: "luastra/ui", summary: "Bounded design-system values fail clearly when invalid.", tables: uiTables },
  { id: "visuals", title: "Images, shapes, layers, and flip cards", module: "luastra/ui · luastra/assets · luastra/motion", summary: "Typed assets and host-native geometry compose into live visuals.", cards: [entry("Admitted image", "Assets.image → Assets.uri → UI.Image", "check verifies the file before display.", { useWhen: "Use an admitted image when application artwork must be packaged, integrity-checked, and rendered without accepting an arbitrary path or URL.", code: `local source = Assets.uri(Assets.image("image/card-back"))\n\nUI.Image {\n    id = "card/back",\n    source = source,\n    label = "Card back",\n}` }), entry("Shape overlay", "UI.Layer { base, overlay }", "The first child defines shared bounds.", { useWhen: "Use a Layer when later children must occupy the same visual bounds as the first child, such as text or status content over a Shape.", code: `UI.Layer {\n    id = "answer",\n    UI.Shape {\n        id = "answer/base",\n        shape = "circle",\n        width = 96,\n        height = 96,\n    },\n    UI.Text {\n        id = "answer/text",\n        text = "Correct",\n    },\n}` })] },
  moduleSection("motion", "Declarative motion", "luastra/motion", "Tween, Sequence, and predefined MotionMaps.", ["A sequence is one channel value and accepts only Tween or Wait steps."]),
  moduleSection("assets", "Typed assets", "luastra/assets", "Prevents mixing asset kinds and rejects arbitrary paths.", ["Declare, create a typed reference, then use Assets.uri."]),
  moduleSection("data", "Runtime data validation", "luastra/data", "Validates user, storage, and server values.", ["Build a Schema, decode, and branch on result.success."]),
  moduleSection("state", "Versioned state", "luastra/state", "Deterministic small snapshots with explicit migrations.", ["Persist encoded strings through Host storage."]),
  moduleSection("navigation", "Navigation and routes", "luastra/navigation", "Named stacks or typed canonical routes.", ["Keep the stack in module state and select the screen from current()."]),
  moduleSection("timer", "Application timers", "luastra/timer", "One-shot delays delivered to handle(\"timer\", id, value).", ["The same ID replaces the old timer."]),
  moduleSection("host", "Host capabilities", "luastra/host", "Asynchronous storage, clipboard, history, and Back operations.", ["Record pending[RequestId] and complete it in resolve."]),
  moduleSection("server", "Server functions", "luastra/server", "Versioned RPC to trusted handlers.", ["Never put secrets in client Luau; handlers authenticate, authorize, and validate."]),
  moduleSection("media", "Audio and media queue", "luastra/media", "Queue and playback contract for web and native hosts.", ["resolve confirms commands; media_state reports live playback changes."]),
  moduleSection("debug", "Debug output", "luastra/debug", "Levelled development logs.", ["Never log secrets, tokens, or personal data."]),
  {
    id: "cli",
    title: "Command line",
    module: "installed luastra CLI",
    summary: "Run project and SDK workflows with explicit paths, JSON success output, and non-zero failures prefixed by Luastra: on stderr.",
    guide: ["Project commands use ./luastra.json by default. Pass --project=<directory-or-manifest> when running them from elsewhere.", "There is no general --help command in this alpha. The exact admitted syntax is listed below; unknown commands and options fail with a usage line.", "Use run for a development preview, build web for a browser-ready static application, and build bundle only when another compatible Luastra host or packaging workflow will supply the VM, renderer, and platform shell."],
    tables: [{ id: "cli-commands", title: "Commands and outputs", rows: [
      row("version", "luastra version", "Prints JSON containing command, result=PASS, and the selected product version."),
      row("doctor", "luastra doctor [--root=<directory>]", "Verifies Node, host selection, manager state, the active SDK receipt, every installed file, and the PATH shim."),
      row("create", "luastra create <directory>", "Copies the starter into a missing or empty safe directory and derives project.id from its name."),
      row("check", "luastra check [--project=<path>]", "Analyzes strict Luau, manifest, modules, capabilities, assets, and SDK identities without keeping a build artifact."),
      row("test", "luastra test [--project=<path>]", "Executes every test module listed in the project manifest and prints a bounded result summary."),
      row("conformance", "luastra conformance [--project=<path>]", "Builds the project and checks its declared behavior against the supported conformance contract."),
      row("generate", "luastra generate [--project=<path>]", "Regenerates the typed server client. The manifest must declare backend.declaration, handler, generatedClient, and generatedModule."),
      row("run", "luastra run [--project=<path>] [--port=<port>] [--no-watch]", "Builds and serves a local preview. Default port is 4175; watch mode rebuilds after source changes; Ctrl+C stops it."),
      row("build web", "luastra build web [--project=<path>] [--out=<path>]", "Writes a static web artifact to dist/web by default. The destination must satisfy the build's safety and replacement rules."),
      row("build bundle", "luastra build bundle [--project=<path>] [--out=<path>]", "Writes the compiled host-neutral application bundle to dist/bundle by default. It contains bytecode, manifest metadata, hashes, and project assets, but no VM or UI host; it is not directly runnable."),
      row("sdk install", "luastra sdk install --manifest=<path-or-https-url> [--no-use]", "Verifies and installs an immutable release; activates it unless --no-use is supplied."),
      row("sdk list", "luastra sdk list [--root=<directory>]", "Lists installed immutable SDK versions and identifies the active selection."),
      row("sdk use", "luastra sdk use <version> [--root=<directory>]", "Selects a previously installed verified version; use this for rollback."),
      row("sdk update", "luastra sdk update --manifest=<path-or-https-url>", "Installs and activates the version named by another verified release manifest."),
      row("sdk remove", "luastra sdk remove <inactive-version>", "Removes a verified inactive SDK. Removing the active version is rejected."),
    ] }],
    callout: "A PASS from check proves project validity for the selected SDK; it does not prove tests, browser behavior, native packaging, signing, deployment, or production service readiness.",
  },
  { id: "manifest", title: "Project manifest", module: "luastra.json · schema v2", summary: "Declares entry, dependencies, capabilities, assets, tests, web metadata, and backend.", cards: [entry("Minimal manifest", "schemaVersion: 2", "check enforces this explicit contract.", { language: "JSON", code: `{\n  "schemaVersion": 2,\n  "project": {\n    "id": "dev.luastra.example",\n    "entry": "app/main"\n  },\n  "sdk": { "contract": 1 },\n  "capabilities": ["ui.render"],\n  "modules": [\n    {\n      "id": "app/main",\n      "source": "src/main.luau",\n      "dependencies": ["luastra/ui"]\n    }\n  ]\n}` }), entry("Web metadata", "web{}", "Optional bounded metadata for an indexable production web shell.", { language: "JSON", code: `"web": {\n  "title": "My Luastra app",\n  "description": "A concise description for search and social previews.",\n  "canonicalUrl": "https://example.com/",\n  "index": true\n}`, points: ["The web build emits title, description, canonical, robots, Open Graph, and Twitter metadata.", "index=true emits robots.txt and a one-location sitemap.xml; hash routes are not separate indexable documents.", "The build escapes metadata and rejects credentials, query strings, fragments, and non-HTTPS canonical URLs."] }), entry("Assets", "assets[]", "Admitted project files.", { language: "JSON", code: `"assets": [\n  {\n    "id": "image/card-back",\n    "source": "assets/card-back.png",\n    "mediaType": "image/png"\n  }\n]` }), entry("Capabilities", "capabilities[]", "Explicit host privileges.", { language: "JSON", code: `"capabilities": [\n  "ui.render",\n  "storage.get",\n  "storage.set"\n]` }), entry("Backend", "backend{}", "Trusted operations and generated clients.", { language: "JSON", code: `"backend": {\n  "declaration": "backend/functions.json",\n  "handler": "backend/handlers.mjs",\n  "generatedClient": "src/generated/server-functions.luau",\n  "generatedModule": "app/server-functions"\n}` })] },
  { id: "support", title: "Support and boundaries", summary: "Keep source contracts, automated checks, browser/device evidence, packaging, and production promises separate.", guide: ["Verified below means repository tests or recorded host evidence for a named version—not universal device coverage or production readiness.", `The public ${release.publishedVersion} release is immutable. The 0.1.0-alpha assets remain separately available for deliberate rollback and historical verification.`], tables: [{ title: "Current evidence boundary", rows: [row("CLI, runtime, and web build", "Repository-verified", "create, check, test, run, bundle, and static web build have automated coverage for the release checkout."), row("Web UI and accessibility", "Browser-verified", "Semantic DOM, keyboard, zoom, IME, responsive layout, and selected flows have bounded browser evidence; this is not every assistive technology."), row("Desktop host sources", "Tauri evidence", "The web artifact has bounded macOS, Linux, and Windows build/launch evidence; no signed installer, notarization, store package, or updater is promised."), row("Mobile host sources", "Capacitor evidence", "Android/iOS simulator and selected physical-device flows have bounded evidence; no public store package or universal device certification is promised."), row("Media and background behavior", "Host-dependent", "Autoplay, interruption, background playback, hardware controls, and packaging require target-specific verification."), row("Public release", release.publishedVersion, "Pre-release APIs may change. The public installer exposes bundle and web builds; native packaging remains a separately evidenced source workflow.")] }], callout: "A green test, source build, or one-device run is not evidence of signing, notarization, store admission, universal accessibility, hosted backend deployment, or production-service readiness." },
  {
    id: "policies",
    title: "Project policies",
    summary: "Read these policy summaries before adopting, contributing, requesting support, or reporting a vulnerability.",
    guide: [
      "These pages are bundled into the documentation application for offline access.",
      "The canonical policy and contact files live at the root of the Luastra GitHub repository.",
    ],
    cards: [
      entry("Contact routes", "CONTACT.md", "Dedicated addresses for general, support, security, privacy, and legal enquiries.", {
        kind: "guide",
        useWhen: "Read this when a message should be private or when you need to select the correct Luastra contact route.",
        points: [
          "General project enquiries: hello@luastra.dev.",
          "Private user support: support@luastra.dev.",
          "Security reports: security@luastra.dev; prefer GitHub private vulnerability reporting when available.",
          "Privacy enquiries: privacy@luastra.dev. Licensing, trademark, and legal enquiries: legal@luastra.dev.",
        ],
      }),
      entry("Security policy", "SECURITY.md", "How to report a suspected vulnerability without exposing it publicly.", {
        kind: "guide",
        useWhen: "Read this before reporting a suspected vulnerability or sharing a security proof of concept.",
        points: [
          "Do not open a public issue for a suspected vulnerability.",
          "Use GitHub private vulnerability reporting for confidential coordination; use security@luastra.dev if that route is unavailable.",
          "Include the exact version or commit, affected hosts, safe reproduction steps, expected impact, and known preconditions.",
          "Never include real credentials, personal data, production tokens, or unrelated private source.",
        ],
      }),
      entry("Support policy", "SUPPORT.md", "Best-effort support boundaries for pre-release software.", {
        kind: "guide",
        useWhen: "Read this before requesting help, filing a reproducible defect, or proposing a bounded feature.",
        points: [
          "The source alpha has no service-level, response-time, production, or compatibility commitment.",
          "A defect report should include the exact version, host and target, minimal reproduction, expected and actual behavior, and sanitized error output.",
          "Public issues are for reproducible defects; Discussions are for usage and design questions.",
          "Use support@luastra.dev only when a support or conduct enquiry contains context that should not be public.",
        ],
      }),
      entry("Privacy notice", "PRIVACY.md", "Limited data handling for the official documentation site and direct project correspondence.", {
        kind: "guide",
        useWhen: "Read this before sending personal information to a Luastra contact address or when asking how the official website handles visitor data.",
        points: [
          "The project does not intentionally operate advertising, behavioural analytics, user accounts, or a contact form on luastra.dev.",
          "A local presentation preference may remain on the visitor's device; GitHub Pages may process technical request information under GitHub's own terms.",
          "Direct email provides the sender address, message, attachments, and any information the sender chooses to include.",
          "Privacy questions and requests concerning information sent to the project may be addressed to privacy@luastra.dev.",
        ],
      }),
      entry("Licensing boundary", "LICENSING.md", "Which project-owned files use Apache-2.0 or 0BSD and which rights remain separate.", {
        kind: "guide",
        useWhen: "Read this before redistributing Luastra, starter fragments, generated output, or a Luastra-built application.",
        points: [
          "Project-owned platform code and technical documentation use Apache-2.0 unless a file says otherwise.",
          "Starter templates and scaffolding fragments use 0BSD so generated applications are not forced to be open source.",
          "User-authored applications and content remain owned by their respective rights holders.",
          "Send licensing questions to legal@luastra.dev; an email response changes no license unless it expressly says so in writing.",
        ],
      }),
      entry("Trademark policy", "TRADEMARKS.md", "Rules for the Luastra name, logo, wordmark, domains, and product identity.", {
        kind: "guide",
        useWhen: "Read this before using Luastra branding in a product name, domain, logo, certification claim, or commercial material.",
        points: [
          "Apache-2.0 and 0BSD do not grant rights to Luastra brand assets.",
          "Truthful nominative references such as built with Luastra are intended to be allowed when they do not imply endorsement.",
          "Product names, domains, confusingly similar logos, merchandise, certification claims, and modified brand assets require separate written permission.",
          "Send permission requests to legal@luastra.dev; sending an enquiry does not itself grant permission.",
        ],
      }),
      entry("Releases", release.publishedVersion, "The tagged source-alpha release binds source, host archives, checksums, notices, SBOMs, and installation instructions.", {
        kind: "guide",
        useWhen: "Read this when selecting a downloadable release or checking what stability and compatibility the source alpha promises.",
        points: [
          "The current release is pre-release software, not a stable production promise.",
          "Verify downloaded files against the release manifest before installation.",
          "Use the compatibility and support policies to distinguish verified targets from host-dependent claims.",
        ],
      }),
    ],
    callout: "The bundled summaries remain readable offline; the repository copies are canonical when they differ.",
  },
]);
