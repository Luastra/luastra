export const release = Object.freeze({ version: "0.1.0-alpha", date: "2026-08-28", sourceSdk: "Source SDK contract 10", runtimeSdk: "Runtime SDK alpha 8", status: "Public source alpha" });

export const sdkInventory = Object.freeze({
  "luastra/ui": ["Screen", "Column", "Row", "Text", "Button", "Link", "Code", "CodeBlock", "Divider", "Table", "TableRow", "TableCell", "FlipCard", "Image", "Layer", "Shape", "TextInput", "List", "ListItem", "Modal", "Stack", "Grid", "Scroll", "Card", "Field", "Actions"],
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
  Button: ["Creates an accessible native action that supports pointer, touch, keyboard, disabled state, and appearance semantics. Activation sends its declared onTap action and stable component ID to Application.handle.", "Use UI.Button when the user initiates an operation or changes application state. Use UI.Link for navigation to a location; do not simulate a button by making a Shape clickable."],
  Link: ["Creates a semantic link for an admitted internal destination or safe external HTTPS location. Hosts preserve link navigation and accessibility behavior instead of treating it as a generic tap action.", "Use UI.Link when activation changes location or opens a documented resource. Use UI.Button when the action modifies current application state without navigating."],
  Code: ["Renders a short inline literal with code semantics and a monospace presentation while preserving surrounding text flow. The value remains selectable and accessible as text.", "Use UI.Code for command names, identifiers, property values, and short expressions inside explanatory content. Use UI.CodeBlock for multiline source or commands."],
  CodeBlock: ["Renders multiline literal source in a scrollable, selectable code region without interpreting markup. It preserves line breaks and supports long examples within bounded page width.", "Use UI.CodeBlock for complete snippets, terminal sessions, JSON, or other preformatted material. Keep prose and very short identifiers in UI.Text or UI.Code."],
  Divider: ["Creates a visual separator with optional semantic meaning between adjacent content regions. The host supplies consistent thickness and theme-aware coloring.", "Use UI.Divider when grouping is otherwise unclear between neighbouring sections. Mark purely decorative separators accordingly and prefer spacing when separation alone is sufficient."],
  Table: ["Creates semantic tabular data whose direct children are TableRow nodes. Assistive technologies can preserve row and column relationships that a collection of generic rows cannot express.", "Use UI.Table for genuinely two-dimensional data where headers identify values across rows or columns. Use List or Grid for collections that do not require table relationships."],
  TableRow: ["Defines one semantic row inside UI.Table and restricts its direct children to TableCell nodes. Source order becomes the accessible column order.", "Use UI.TableRow only as a direct child of UI.Table, once per header or data row. Keep every row's cell structure consistent with the table headers."],
  TableCell: ["Creates a data cell or a scoped row or column header within a TableRow. Header scope lets assistive technology announce the correct relationship while users move through the table.", "Use UI.TableCell only inside UI.TableRow. Mark cells as headers when they label a row or column; use ordinary cells for values."],
  FlipCard: ["Creates a fixed two-sided 3D surface whose first child is the front and second child is the back. A rotationY motion from Motion.flip controls which face is visible while both sides share the same bounds.", "Use UI.FlipCard for reveal interactions where two complete visual trees occupy one card-sized area. Use Layer inside either face when that face needs an image, shape, and overlaid text."],
  Image: ["Displays an image admitted by luastra.json through a typed Assets.Image reference and URI. Explicit dimensions, aspect ratio, fit, clipping, accessible label, and motion keep rendering deterministic across hosts.", "Use UI.Image for packaged raster or supported vector artwork. Use UI.Shape for geometry that can be expressed without an asset, and supply a meaningful label unless the image is decorative."],
  Layer: ["Places all children in the same coordinate space instead of adding their sizes sequentially. The first child establishes the layer bounds; later children are overlaid and aligned within those bounds.", "Use UI.Layer for text over artwork, badges, card faces, and other overlapping compositions. Put the size-defining background first and wrap overlay content in a full-size Column or Row when it needs predictable alignment."],
  Shape: ["Draws a bounded host-native geometric figure with explicit size, fill, outline, corner radius, label, and optional motion. It avoids shipping an image for simple scalable artwork.", "Use UI.Shape for rectangles, circles, polygons, stars, outlines, and colored card faces. Use UI.Image when the visual contains texture or detail that geometry cannot represent."],
  TextInput: ["Creates a controlled single-line text field with native keyboard hints, autofill metadata, validation semantics, and composition-safe input delivery. The displayed value always comes from application state.", "Use UI.TextInput for editable text, email, password, search, telephone, or numeric entry. Update its state from onInput and return the new value on the following render; use a custom component only for unsupported multiline editing."],
  List: ["Creates an ordered or unordered semantic collection whose direct children are ListItem nodes. It preserves collection boundaries and item count for assistive technology.", "Use UI.List when sibling items form one meaningful sequence or set. Use Column for unrelated blocks and Table for values with row-and-column relationships."],
  ListItem: ["Defines one semantic member of a UI.List while allowing structured content inside the item. The host keeps the item associated with its parent collection.", "Use UI.ListItem only as a direct child of UI.List, once per conceptual item. Put buttons, links, and descriptive content inside the item when they belong to that entry."],
  Modal: ["Creates an accessible dialog above the current screen, moves focus into it, traps navigation within its boundary, and restores focus after dismissal. onDismiss connects host dismissal gestures to application state.", "Use UI.Modal for short blocking decisions or focused information that must be handled before returning to the page. Use an ordinary routed screen for long, independently navigable workflows."],
  Stack: ["Offers a concise vertical composition primitive with the same layout direction as Column and stack-specific host styling. Children remain in normal flow and do not overlap.", "Use UI.Stack for straightforward vertical groups where the semantic name improves readability. Use UI.Column when you want the canonical general-purpose vertical container or need examples shared across all hosts."],
  Grid: ["Creates a responsive multi-column collection using two, three, or adaptive columns while retaining source order. Items reflow as available width changes instead of requiring manual breakpoint calculations.", "Use UI.Grid for galleries, dashboards, feature cards, and repeated items of comparable importance. Use Table for relational data and Row when content must remain one-dimensional."],
  Scroll: ["Creates a bounded vertical or horizontal scrolling region and preserves its children as one navigable group. It prevents oversized content from forcing the surrounding screen beyond its intended bounds.", "Use UI.Scroll when a specific region—not the whole document—must scroll, such as filter chips, long panels, or media strips. Avoid nested scroll regions unless the interaction genuinely needs independent axes."],
  Card: ["Creates a themed surface for grouping related content, with consistent padding, border, elevation, inherited colors, and optional motion. It is a layout container rather than a playing-card animation primitive.", "Use UI.Card to visually group one concept such as a result, article preview, or setting. Use FlipCard for two-sided reveals and plain Column when no surface treatment is needed."],
  Field: ["Groups a form label, input, hint, and validation message into one semantic and visual unit. Shared spacing and inherited state keep the relationship understandable without positioning each element manually.", "Use UI.Field around each form control that needs visible guidance or validation. Keep the input and its related error inside the same field and connect errorId where applicable."],
  Actions: ["Arranges a related set of buttons or links as a wrapping action region with consistent spacing and inherited alignment. It communicates that the controls complete or advance the same local task.", "Use UI.Actions for form submission controls, dialog choices, or page-level action groups. Use Row for horizontal content that is not specifically a set of user actions."],
};
const uiProps = {
  Screen: ["layout", "theme", "semantic"], Column: ["layout", "text-style", "semantic"], Row: ["layout", "text-style", "semantic"], Text: ["text-style", "semantic", "motion"], Button: ["action", "text-style", "semantic"], Link: ["action", "text-style", "semantic"], Code: ["text-style", "semantic"], CodeBlock: ["layout", "text-style", "semantic"], Divider: ["layout", "semantic"], Table: ["layout", "text-style", "semantic"], TableRow: ["layout", "text-style", "semantic"], TableCell: ["layout", "text-style", "semantic"], FlipCard: ["visual", "motion"], Image: ["visual", "label", "motion"], Layer: ["layout", "text-style", "semantic", "motion"], Shape: ["visual", "label", "motion"], TextInput: ["input", "semantic"], List: ["label", "layout", "semantic"], ListItem: ["text", "layout", "semantic"], Modal: ["modal", "semantic"], Stack: ["layout", "semantic"], Grid: ["layout", "columns", "semantic"], Scroll: ["layout", "scroll", "semantic"], Card: ["layout", "surface", "motion", "semantic"], Field: ["layout", "label", "semantic"], Actions: ["layout", "semantic"],
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
    string: ["Builds a runtime schema for string input with optional length, pattern, or other bounded constraints defined by Data.StringOptions. The schema is a description only; validation occurs later through Data.decode.", "Use Data.string for form fields, URL parameters, storage fields, or server properties that must be text at runtime. Add the narrowest useful constraints at the untrusted boundary instead of checking them repeatedly in application logic."],
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
    launchUrl: ["Requests that the host open the URL currently associated with the admitted launch-url event contract and returns a RequestId. The host validates scheme and policy before leaving the application.", "Use Host.launchUrl only in the corresponding host-mediated flow when an external location must open outside Luastra rendering. Prefer UI.Link for ordinary visible navigation initiated directly by a user."],
    clipboardWrite: ["Requests that the host place a bounded string on the system clipboard and returns a RequestId for completion. Clipboard access remains an explicit capability rather than a hidden side effect.", "Use Host.clipboardWrite after a clear user action such as Copy code or Copy link. Confirm success accessibly when useful and avoid copying secrets or personal data without an explicit user expectation."],
    historyPush: ["Adds a new browser-history entry with the supplied opaque application state token while retaining the current location. The asynchronous acknowledgement is delivered through Application.resolve.", "Use Host.historyPush when application navigation should create a Back destination without changing the visible URL. Prefer historyPushLocation when the route also has a canonical location."],
    historyReplace: ["Replaces the current browser-history state token without adding a new Back entry. It keeps the current location and returns a RequestId for host acknowledgement.", "Use Host.historyReplace when correcting or initializing the current entry so Back should not revisit the previous state. Use push for a user-visible navigation step."],
    historyPushLocation: ["Adds a browser-history entry containing both a canonical location and an opaque application state token. This keeps the address bar, deep-link representation, and application stack synchronized.", "Use Host.historyPushLocation after a successful typed route mutation that should be reversible with Back. Generate the location through Navigation.compile rather than concatenating untrusted path or query fragments."],
    historyReplaceLocation: ["Replaces the current browser-history location and state token without extending the Back stack. The host validates and acknowledges the requested history mutation asynchronously.", "Use Host.historyReplaceLocation for redirects, canonicalization, and restoring the initial route when the obsolete location should not remain reachable through Back."],
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
  { id: "overview", title: "Build apps like games", eyebrow: `Luastra ${release.version}`, summary: "Build accessible web, desktop, and mobile applications in strict Luau from one host-neutral project.", hero: true, badges: [release.sourceSdk, release.runtimeSdk, "Luau 0.731", "Web · Desktop · Mobile"], notes: ["This is a version-bound source alpha, not a production-stability promise.", "Start with the interactive learning path, then use the per-symbol reference for exact parameters.", "Every public component has a dedicated page with an example, accessibility guidance, child rules, and common mistakes."] },
  {
    id: "installation",
    title: "Install Luastra",
    module: "0.1.0-alpha release boundary",
    summary: "Install a checksum-verified, host-specific SDK into an immutable version directory.",
    guide: [
      "The release contract provides exact online and offline commands, four host archive names, checksums, SBOM, notices, license texts, and release notes.",
      "Download only from the tagged GitHub release, verify the manifest-bound archive, and run doctor before using the installed SDK.",
    ],
    cards: [
      entry("Release installation contract", "download → verify → atomic install → doctor", "The Node.js bootstrap detects the host, downloads only its archive over HTTPS, verifies the release manifest and archive ledger, then atomically installs the SDK under ~/.luastra/sdk/0.1.0-alpha.", {
        language: "Shell",
        code: `curl -fsSLO https://github.com/Luastra/luastra/releases/download/v0.1.0-alpha/luastra-install.mjs\nnode luastra-install.mjs \\\n  --manifest=https://github.com/Luastra/luastra/releases/download/v0.1.0-alpha/luastra-release.v1.json`,
        useWhen: "Use this when installing Luastra on a supported machine for the first time or when installing an explicitly selected release version.",
        points: ["Supported archives: macOS arm64/x64, Linux x64, and Windows x64.", "A checksum, receipt, or installed-file mismatch fails closed.", "The installer never edits shell profiles or the Windows registry."],
      }),
      entry("Offline installation", "local manifest + one host archive", "Copy the installer, release manifest, and matching host archive into one directory. The same manifest and file-ledger checks run without a network request.", {
        language: "Shell",
        code: `node ./luastra-install.mjs --manifest=./luastra-release.v1.json`,
        useWhen: "Use this on an offline machine or when release assets are transferred through a controlled internal channel.",
      }),
      entry("System requirement", "Node.js 24 or newer", "Node.js 24 or newer is the only runtime prerequisite for packaged CLI workflows. No npm install, Rust, Xcode, Android Studio, or repository checkout is required.", {
        language: "Shell",
        code: `node --version\n# Expected: v24.x or newer`,
        useWhen: "Check this before installation or when the Luastra shim cannot start.",
      }),
      entry("Verify and manage SDKs", "doctor · list · use · update · remove", "Verify the active SDK, retain multiple immutable versions, switch explicitly for rollback, update from another verified manifest, and remove only an inactive verified version.", {
        language: "Shell",
        code: `luastra version\nluastra doctor\nluastra sdk list\nluastra sdk use 0.1.0-alpha\nluastra sdk update --manifest=<path-or-https-url>\nluastra sdk remove <inactive-version>`,
        useWhen: "Run doctor after installation or switching; use an older retained version when an update must be rolled back.",
      }),
    ],
    callout: "SHA-256 proves equality with the manifest obtained from the release channel. The source alpha does not claim publisher signatures, Apple notarization, Windows Authenticode, GUI installers, or stores.",
  },
  { id: "quickstart", title: "Quick start", module: "installed luastra CLI", summary: "Create, verify, test, preview, and build one application without a repository checkout.", cards: [entry("Create and enter a project", "luastra create hello-luastra", "Creates the starter project in a new directory.", { language: "Shell", code: `luastra create hello-luastra\ncd hello-luastra`, useWhen: "Start here when creating a new Luastra application in its own directory." }), entry("Check and test", "luastra check · luastra test", "Analyze the strict Luau graph and run bounded project tests.", { language: "Shell", code: `luastra check\nluastra test`, useWhen: "Run this after editing source or the manifest and before previewing or building the project." }), entry("Preview", "luastra run", "Starts the local development host and prints the URL to open.", { language: "Shell", code: `luastra run`, useWhen: "Use preview while developing interactively and checking changes in a browser with rebuild feedback." }), entry("Build the web target", "luastra build web", "Creates a static web artifact that must be served over HTTP.", { language: "Shell", code: `luastra build web`, useWhen: "Build the web target when you need a production-style static artifact for HTTP serving or deployment verification." })], callout: "Do not open dist/web/index.html with file://. Serve the directory over HTTP so modules and assets use an admitted origin." },
  { id: "workflow", title: "Workflow", summary: "From a new project to a verified web build.", cards: [["Create a project", "create <directory>", "Creates a new starter project in a missing or empty directory.", "Use this once when beginning an application; then enter the created directory before running the remaining commands."], ["Check", "check", "Analyzes the strict Luau graph, manifest, capabilities, assets, and SDK identity.", "Run after changing source code or luastra.json, and always before tests, preview, or a release build."], ["Run tests", "test", "Runs the project’s bounded Luau test modules.", "Run after changing application logic, event handling, state transitions, or SDK-facing code."], ["Run preview", "run", "Starts the local development server with rebuilding and reload feedback.", "Use during interactive development when you want to inspect and debug the application in a browser."], ["Build web", "build web", "Creates the static web output in dist/web.", "Use when you need a production-style web artifact for HTTP serving or deployment verification."], ["Build bundle", "build bundle", "Creates the host-neutral runtime bundle.", "Use when a host workflow needs the compiled Luastra application bundle rather than the complete static website."]].map(([name, command, description, useWhen]) => entry(name, `luastra ${command}`, description, { language: "Shell", code: `luastra ${command}`, useWhen })) },
  { id: "learning-path", title: "Interactive learning path", module: "15–25 minutes · resettable", summary: "Follow a short sequence from project creation to a stateful accessible interaction.", guide: ["Use Next and Back to move through the steps. Reset always returns to the beginning.", "Each step explains one idea and shows the exact Luau or shell fragment to try."], callout: "The controls below are rendered and handled by Luastra itself, not by a separate documentation script." },
  {
    id: "luau-types",
    title: "Luau typing quick reference",
    module: "Luau 0.731 · --!strict",
    summary: "A practical introduction for Lua developers: annotations, arrays, dictionaries, records, unions, generics, module types, casts, and runtime freezing.",
    guide: [
      "Luau types find mistakes during luastra check; they do not change runtime values. Put --!strict on the first line so the analyzer checks arguments, return values, table fields, and unhandled state variants.",
      "Luau has no separate struct keyword, and standalone Luau has no universal Enum. Record types describe structures, singleton unions describe enum-like values, and tagged unions describe state with different fields.",
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
        code: `local colors: {string} = { "red", "green" }

table.insert(colors, "blue")
local first: string = colors[1]

for index, color in ipairs(colors) do
    Debug.log("colors", \`{index}: {color}\`)
end`,
        points: ["An empty number array is local values: {number} = {}.", "Use #values and ipairs only for dense sequences without missing indexes."],
      }),
      entry("Dictionaries and maps", "{[Key]: Value}", "A keyed table that may be sparse. A numeric key does not make a table an array when its indexes are arbitrary.", {
        code: `local pending: {[number]: string} = {}

pending[42] = "save"
pending[105] = "restore"

local operation: string? = pending[42]
pending[42] = nil

for requestId, name in pairs(pending) do
    Debug.log("pending", \`{requestId}: {name}\`)
end`,
        points: ["{[string]: number} means string key to number value.", "Do not use #table or ipairs for a sparse dictionary."],
      }),
      entry("Record types", "type Name = { field: Type }", "A table type is Luau's struct-like construct. The analyzer checks required fields and their value types.", {
        code: `type GameState = {
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
        code: `type Color = "red" | "green" | "blue"

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
        code: `local selectedColor: Color? = nil

if selectedColor ~= nil then
    Debug.log("selection", selectedColor)
end

type Meditation = {
    id: string,
    description: string?,
}`,
      }),
      entry("Unions and type narrowing", "A | B", "A value may match either type. A type, typeof, nil, or tag check narrows the union to a safe branch.", {
        code: `local value: string | number = "hello"

if type(value) == "string" then
    local upper = string.upper(value)
else
    local nextValue = value + 1
end`,
      }),
      entry("Tagged unions", "{ kind: \"a\", ... } | { kind: \"b\", ... }", "A shared literal tag safely models states that expose different fields.", {
        wide: true,
        code: `type GamePhase =
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
end`,
      }),
      entry("Generics", "Type<T> · function name<T>(value: T)", "A type parameter lets one checked pattern work with many value types without losing their exact result type.", {
        wide: true,
        code: `type Result<T> =
    { success: true, value: T }
    | { success: false, error: string }

local function first<T>(items: {T}): T?
    return items[1]
end

local color: Color? = first({ "red" :: Color, "green" :: Color })
local score: number? = first({ 10, 20, 30 })`,
      }),
      entry("Function types", "(Parameters) -> Returns", "Callbacks and ordinary functions can be typed. () after the arrow means the function returns no values.", {
        code: `type TapHandler = (action: string, target: string) -> ()
type Validator = (value: string) -> (boolean, string?)

local validateEmail: Validator = function(value)
    if string.find(value, "@", 1, true) == nil then
        return false, "Email must contain @"
    end
    return true, nil
end`,
      }),
      entry("Exported module types", "export type Name = ...", "A local type stays inside its module. export type lets consumers refer to it through the name bound by require.", {
        wide: true,
        code: `-- app/cards.luau
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
local Cards = require("app/cards")
local card: Cards.Card = Cards.create("card-1", "green")`,
      }),
      entry("typeof", "type Name = typeof(value)", "Derive a type from an existing value. It is convenient for local configuration; an explicit type is often clearer for a public contract.", {
        code: `local defaults = {
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
        code: `type Identified = { id: string }
type Named = { name: string }
type NamedEntity = Identified & Named

local item: NamedEntity = {
    id = "meditation-1",
    name = "Morning calm",
}`,
      }),
      entry("any, unknown, and never", "any · unknown · never", "any largely disables checking, unknown requires narrowing before use, and never describes an impossible value.", {
        code: `local value: unknown = "green"

if type(value) == "string" then
    local upper = string.upper(value)
end

local function impossible(value: never): never
    error("Unhandled value: " .. tostring(value))
end`,
        points: ["Prefer a concrete type whenever possible.", "Use unknown at untrusted boundaries and narrow it before use.", "Keep any as a temporary escape hatch for code that cannot yet be typed.", "Use never to prove that every union alternative was handled."],
      }),
      entry("Type casts with ::", "expression :: Type", "The :: operator tells the analyzer to treat an expression as a compatible type. It does not validate external data or change the runtime value.", {
        code: `type Color = "red" | "green"

local raw = "red"
local selected = raw :: Color

-- Validate unknown storage or server data with luastra/data
-- before casting it to a trusted application type.`,
        points: ["Use :: only when you know more than inference can prove.", "A cast is not a runtime validator and should not be used to silence a real mismatch."],
      }),
      entry("Runtime immutability with table.freeze", "table.freeze(value)", "Freeze a table so later writes fail at runtime. The operation is shallow: nested tables remain mutable unless they are frozen separately.", {
        code: `type Tween = {
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
    ],
    tables: [{
      id: "luau-table-types",
      title: "How to read table types",
      rows: [
        row("{number}", "array of numbers", "Dense values such as { 10, 20, 30 }."),
        row("{Color}", "array of Color", "Every element must be one admitted Color literal."),
        row("{[number]: string}", "number key → string", "A sparse dictionary such as RequestId → operation."),
        row("{[string]: number}", "string key → number", "For example player name → score."),
        row("{ id: string, active: boolean }", "record", "A table with known named fields."),
      ],
    }],
    callout: "Types disappear after analysis and do not verify server, storage, or form payloads. Validate unknown runtime data with luastra/data; use table.freeze separately when runtime immutability is required.",
  },
  { id: "beginner-tutorial", title: "Beginner tutorial: an accessible counter", module: "UI · state · handle", summary: "Build a complete interaction while learning the render and event model.", guide: ["Keep state in module scope, describe the screen from that state, and change state only in an admitted event handler.", "Stable lowercase IDs let the host reconcile nodes without replacing the entire interface."], cards: [entry("1. Import the UI module", `local UI = require("luastra/ui")`, "Only declared public dependencies may be imported.", { code: `local UI = require("luastra/ui")`, useWhen: "Import luastra/ui in every module that constructs or annotates host-neutral UI nodes." }), entry("2. Own application state", "local count = 0", "Module state survives ordinary renders in the current application session.", { code: `local count: number = 0`, useWhen: "Keep small session state in module scope when it must survive renders but does not need persistence across application restarts." }), entry("3. Handle the action", "Application.handle(action: string, target: string, value: string)", "The button emits a bounded action; the handler changes state.", { kind: "function", parameters: [row("action", "string", "The admitted action declared by onTap, onInput, onDismiss, or a host event."), row("target", "string", "The stable component ID or host target that emitted the event."), row("value", "string", "The committed input value or bounded host-event payload; it may be empty.")], returns: "Nothing. After the handler returns, Luastra renders the application again from current state.", useWhen: "Implement Application.handle whenever UI or host events need to validate input, update state, start a capability request, or choose the next screen.", code: `function Application.handle(action: string, target: string, _value: string)\n    if action == "counter.add" and target == "counter/add" then\n        count += 1\n    end\nend` }), entry("4. Render semantic UI", "Application.render() -> UI.Node", "Return the complete host-neutral UI tree for current application state. This example uses Text and Button, but render may compose any supported Luastra UI components.", { kind: "function", returns: "UI.Node — exactly one UI.Screen root containing the current interface.", useWhen: "Implement Application.render in every Luastra entry module to describe the complete current interface from application state, using any supported semantic, layout, visual, input, or media-related UI components.", code: `function Application.render(): UI.Node\n    return UI.Screen {\n        id = "app",\n        UI.Text {\n            id = "counter/title",\n            text = "Counter",\n            variant = "title",\n        },\n        UI.Text {\n            id = "counter/value",\n            text = tostring(count),\n            role = "status",\n        },\n        UI.Button {\n            id = "counter/add",\n            text = "Add",\n            onTap = "counter.add",\n        },\n    }\nend` })], callout: "Run luastra check after every small change; analyzer errors point to the source module and line." },
  { id: "advanced-tutorial", title: "Advanced tutorial: routed persisted data", module: "Navigation · State · Host · Data", summary: "Combine typed routes, versioned state, runtime validation, and asynchronous host requests.", guide: ["Treat navigation and persisted data as application state, not as hidden host state.", "Host operations return RequestId. Record the intended operation and finish it in Application.resolve."], cards: [entry("Compile typed routes", "Navigation.compile", "Define canonical locations once and reject malformed parameters.", { kind: "function", useWhen: "Compile route definitions when URLs must be generated and matched from one typed, canonical path and query contract.", code: `local compiler = Navigation.compile {\n    { name = "home", path = "/" },\n    { name = "item", path = "/item/:id" },\n}` }), entry("Encode a versioned snapshot", "State.encode", "Persist a small deterministic snapshot with an explicit version.", { kind: "function", useWhen: "Encode state before writing a bounded snapshot to host storage so later versions can decode or migrate it explicitly.", code: `local snapshot = State.encode(1, {\n    route = router.encode(),\n    filter = filter,\n})\nlocal requestId = Host.storageSet("app-state", snapshot)\npending[requestId] = "save"` }), entry("Validate restored values", "Data.decode", "Static Luau types do not make storage or server payloads trustworthy.", { kind: "function", useWhen: "Decode with a Data schema whenever a value originates outside trusted Luau state, including forms, storage, URLs, and server payloads.", code: `local result = Data.decode(snapshotSchema, decodedValue)\nif result.success then\n    restore(result.value)\nend` }), entry("Resolve asynchronous work", "Application.resolve", "Match the RequestId and handle bounded failure information.", { kind: "function", parameters: [row("id", "number", "The RequestId returned by the Host, Server, or Media operation."), row("success", "boolean", "Whether the operation completed successfully."), row("payload", "string", "The bounded successful response payload, or an empty string after failure."), row("code", "string", "A stable failure code, or an empty string after success."), row("message", "string", "A bounded diagnostic message, or an empty string after success.")], returns: "Nothing. Update state, clear the pending operation, and let Luastra render again.", useWhen: "Implement Application.resolve when asynchronous Host, Server, or Media requests need to update application state after completion.", code: `function Application.resolve(\n    id: number,\n    success: boolean,\n    payload: string,\n    _code: string,\n    _message: string\n)\n    local operation = pending[id]\n    pending[id] = nil\n    if operation == "load" and success then\n        restore(payload)\n    end\nend` })], callout: "Keep credentials and provider secrets behind trusted server handlers; never persist them in Luau state." },
  { id: "first-app", title: "Complete mini-app", module: "src/main.luau", summary: "handle changes state; render describes the current screen.", cards: [entry("Interaction counter", "Application.render + Application.handle", "A complete minimal app.", { wide: true, useWhen: "Use this complete example when learning how module state, event handling, semantic UI, and repeated rendering fit together in one Luastra entry module.", code: `--!strict
local UI = require("luastra/ui")

local count = 0
local Application = {}

function Application.handle(action: string, _target: string, _value: string)
    if action == "add" then
        count += 1
    end
end

function Application.render(): UI.Node
    return UI.Screen {
        id = "app",
        UI.Text {
            id = "count",
            text = tostring(count),
            role = "status",
        },
        UI.Button {
            id = "add",
            text = "Add",
            onTap = "add",
        },
    }
end

return Application` })] },
  { id: "application", title: "Application contract", module: "app/main", summary: "render is required; handle and resolve are optional.", guide: ["The entry module returns an Application table. render describes current UI, handle processes synchronous events, and resolve completes asynchronous capability requests.", "After handle or resolve returns, Luastra renders again from current module state."], cards: [entry("Application.render", "Application.render() -> UI.Node", "Returns the complete current interface as exactly one UI.Screen root.", { kind: "function", returns: "UI.Node — exactly one UI.Screen root.", useWhen: "Implement render in every application entry module; it is the required source of the complete current host-neutral UI tree.", code: `function Application.render(): UI.Node\n    return UI.Screen {\n        id = "app",\n    }\nend` }), entry("Application.handle", "Application.handle(action: string, target: string, value: string)", "Receives admitted UI and host events before the next render.", { kind: "function", parameters: [row("action", "string", "An onTap/onInput/onDismiss action or a host event such as lifecycle, timer, history, open_url, system_back, or media_state."), row("target", "string", "The stable component ID or host target such as app or browser."), row("value", "string", "The committed input value or bounded event payload; it may be empty.")], returns: "Nothing. State changes become visible in the render that follows the handler.", useWhen: "Implement handle when the application reacts to controls, input, timers, navigation, lifecycle, media state, or other admitted host events.", code: `function Application.handle(\n    action: string,\n    target: string,\n    value: string\n)\n    -- Validate the event and update module state.\nend` }), entry("Application.resolve", "Application.resolve(id: number, success: boolean, payload: string, code: string, message: string)", "Receives the bounded completion of an asynchronous Host, Server, or Media request.", { kind: "function", parameters: [row("id", "number", "The RequestId returned when the operation started."), row("success", "boolean", "Whether the operation completed successfully."), row("payload", "string", "The successful bounded payload, or an empty string after failure."), row("code", "string", "The stable failure code, or an empty string after success."), row("message", "string", "The bounded diagnostic message, or an empty string after success.")], returns: "Nothing. Clear the matching pending operation and update state for the following render.", useWhen: "Implement resolve when the application starts asynchronous Host, Server, or Media operations and must correlate their results by RequestId.", code: `function Application.resolve(\n    id: number,\n    success: boolean,\n    payload: string,\n    code: string,\n    message: string\n)\n    -- Match id, clear pending work, then update state.\nend` })] },
  { id: "events-errors", title: "Events and errors", module: "Application.handle · Application.resolve", summary: "UI, timers, media, system Back, and asynchronous capabilities enter the application through two explicit callbacks.", guide: ["Application.handle receives admitted events that may update state before the next render.", "Application.resolve completes an asynchronous Host, Server, or Media request; correlate it with the saved RequestId. Timer expiry instead arrives through Application.handle.", "Prefer exported Result and Error types when an SDK decoder provides them. Do not parse human-readable assertion text."], tables: [
    { id: "event-delivery", title: "Event delivery", rows: [row("UI action", "handle(action, target, value)", "onTap, onInput, and onDismiss send the declared action plus the stable target ID."), row("Timer expiry", "handle(\"timer\", id, value)", "A started or restarted one-shot timer delivers its ID and optional value."), row("Media state", "handle(\"media_state\", target, payload)", "Decode the payload with Media.decodeState before reading playback fields."), row("System Back", "handle(\"system_back\", target, value)", "Close a modal, navigate back, delegate to history, or acknowledge exit according to current state."), row("Async completion", "resolve(requestId, success, payload, code, message)", "Match the RequestId saved when the capability call was made, then clear the pending entry.")] },
    { id: "error-handling", title: "Error handling", rows: [row("Data validation", "Data.Result · Data.ValidationError", "Branch on success; failure exposes a bounded code and path."), row("State restore", "State.DecodeResult · State.MigrationResult", "Reject invalid snapshots or run explicit ordered migrations."), row("Routes", "Navigation.RouteResult · Navigation.MutationResult", "Inspect success and error.code; do not assume an untrusted location is valid."), row("Server payload", "Server.DecodeResult", "Decode before consuming trusted-backend output."), row("Media state", "Media.DecodeResult · Media.MediaError", "Separate payload decoding failure from a playback error reported inside state."), row("Assertions", "development failure", "Invalid API use fails clearly during check, test, preview, or event handling; fix the call rather than catching message text.")] },
  ], callout: "Never log secrets, tokens, personal data, or complete sensitive payloads while diagnosing an error." },
  { id: "ui", title: "Interface components", module: "luastra/ui", summary: "Builds a complete host-neutral semantic interface tree from validated components with stable lowercase IDs. Web, desktop, and mobile hosts translate the same nodes into accessible native controls and update them after application events.", guide: ["Named fields configure one node, while numeric table entries are its ordered children. Application.render must return exactly one UI.Screen root and may compose any supported containers, content, controls, and visual nodes beneath it.", "Each component card below contains the complete parameter set supported by that component. Shared groups remain available as conceptual explanations, but they are no longer a substitute for the component-specific table."], cards: uiCards, example: moduleExamples["luastra/ui"], callout: "Every render-tree ID must be unique and use lowercase path segments." },
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
  { id: "cli", title: "Command line", module: "bin/luastra", summary: "Machine-readable success and actionable failure output.", tables: [{ title: "Alpha commands", rows: ["version", "create", "check", "test", "conformance", "generate", "run", "build web", "build bundle", "sdk install"].map((name) => row(name, "command", `Runs the ${name} workflow.`)) }] },
  { id: "manifest", title: "Project manifest", module: "luastra.json · schema v2", summary: "Declares entry, dependencies, capabilities, assets, tests, and backend.", cards: [entry("Minimal manifest", "schemaVersion: 2", "check enforces this explicit contract.", { language: "JSON", code: `{\n  "schemaVersion": 2,\n  "project": {\n    "id": "dev.luastra.example",\n    "entry": "app/main"\n  },\n  "sdk": { "contract": 1 },\n  "capabilities": ["ui.render"],\n  "modules": [\n    {\n      "id": "app/main",\n      "source": "src/main.luau",\n      "dependencies": ["luastra/ui"]\n    }\n  ]\n}` }), entry("Assets", "assets[]", "Admitted project files.", { language: "JSON", code: `"assets": [\n  {\n    "id": "image/card-back",\n    "source": "assets/card-back.png",\n    "mediaType": "image/png"\n  }\n]` }), entry("Capabilities", "capabilities[]", "Explicit host privileges.", { language: "JSON", code: `"capabilities": [\n  "ui.render",\n  "storage.get",\n  "storage.set"\n]` }), entry("Backend", "backend{}", "Trusted operations and generated clients.", { language: "JSON", code: `"backend": {\n  "declaration": "backend/functions.json",\n  "handler": "backend/handlers.mjs",\n  "generatedClient": "src/generated/server-functions.luau",\n  "generatedModule": "app/server-functions"\n}` })] },
  { id: "support", title: "Support and boundaries", summary: "Keep SDK contract, host evidence, and public promises separate.", tables: [{ title: "Source alpha status", rows: [row("Core runtime and web", "Verified", "check, test, run, and build."), row("UI, IME, accessibility", "Verified", "Recorded cross-host evidence."), row("Motion and Timer", "Verified", "Lifecycle and cancellation coverage."), row("Media", "Host-dependent", "Production packaging remains separate."), row("Public release", "Source alpha", "Pre-release APIs may change; production stability is not promised.")] }], callout: "A green source build is not evidence of signing, notarization, store admission, or production-service readiness." },
  { id: "policies", title: "Project policies", summary: "Read these policy summaries before adopting, contributing, or reporting a vulnerability.", guide: ["These pages are bundled into the documentation application for offline access.", "The canonical policy files live at the root of the Luastra GitHub repository."], cards: [entry("Security policy", "SECURITY.md", "How to report a suspected vulnerability without exposing it publicly.", { kind: "guide", useWhen: "Read this before reporting a suspected vulnerability or sharing a security proof of concept.", points: ["Do not open a public issue for a suspected vulnerability.", "Use GitHub private vulnerability reporting for confidential coordination.", "Include the exact version or commit, affected hosts, safe reproduction steps, expected impact, and known preconditions.", "Never include real credentials, personal data, production tokens, or unrelated private source."] }), entry("Support policy", "SUPPORT.md", "Best-effort support boundaries for pre-release software.", { kind: "guide", useWhen: "Read this before requesting help, filing a reproducible defect, or proposing a bounded feature.", points: ["The source alpha has no service-level, response-time, production, or compatibility commitment.", "A defect report should include the exact version, host and target, minimal reproduction, expected and actual behavior, and sanitized error output.", "Public issues are for reproducible defects; Discussions are for usage and design questions.", "Commercial support, hosted services, and paid plans are not implied by the open-source license."] }), entry("Licensing boundary", "LICENSING.md", "Which project-owned files use Apache-2.0 or 0BSD and which rights remain separate.", { kind: "guide", useWhen: "Read this before redistributing Luastra, starter fragments, generated output, or a Luastra-built application.", points: ["Project-owned platform code and technical documentation use Apache-2.0 unless a file says otherwise.", "Starter templates and scaffolding fragments use 0BSD so generated applications are not forced to be open source.", "User-authored applications and content remain owned by their respective rights holders.", "Third-party materials retain their upstream licenses, while brand assets remain outside the software licenses."] }), entry("Trademark policy", "TRADEMARKS.md", "Rules for the Luastra name, logo, wordmark, domains, and product identity.", { kind: "guide", useWhen: "Read this before using Luastra branding in a product name, domain, logo, certification claim, or commercial material.", points: ["Apache-2.0 and 0BSD do not grant rights to Luastra brand assets.", "Truthful nominative references such as built with Luastra are intended to be allowed when they do not imply endorsement.", "Product names, domains, confusingly similar logos, merchandise, certification claims, and modified brand assets require separate written permission.", "Forks must use a distinct product identity unless the owner grants permission."] }), entry("Releases", "0.1.0-alpha", "The tagged source-alpha release binds source, host archives, checksums, notices, SBOMs, and installation instructions.", { kind: "guide", useWhen: "Read this when selecting a downloadable release or checking what stability and compatibility the source alpha promises.", points: ["The current release is pre-release software, not a stable production promise.", "Verify downloaded files against the release manifest before installation.", "Use the compatibility and support policies to distinguish verified targets from host-dependent claims."] })], callout: "The bundled summaries remain readable offline; the repository copies are canonical when they differ." },
]);
