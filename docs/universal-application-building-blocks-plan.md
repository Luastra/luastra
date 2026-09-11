# Universal application building blocks: implementation plan

Status: implementation record for the `0.5.0-alpha` candidate. Slices 0 through
6 are implemented, Slice 7 is deliberately deferred, and Slice 8 records the
remaining exact-candidate and publication gates. A listed contract is a release
claim only where its implementation status and retained evidence say so.

Historical baseline: the private development tree was identical to public
`v0.4.0-alpha` (`50628274769d67d6e9629ca1f74db7b3fa3d0b1e`) before this plan is
introduced. The Instagram-like application is a motivating workload only. It
must not introduce social-network domain concepts into Luastra core, and the
reference application itself is outside this plan.

## 1. Objective

Make Luastra applications composable from a small set of stable primitives and
reusable Luau modules while retaining the existing host-neutral, deterministic,
fail-closed architecture.

An author should be able to add a reusable block, provide data and actions, and
place it in a render tree without manually rebuilding lifecycle, asynchronous
request ownership, pagination, loading, retry, focus, or accessibility behavior.
The same infrastructure must support media feeds, catalogues, search results,
message histories, file browsers, activity logs, and other data-heavy products.

The work has five product outcomes:

1. Reusable blocks can own bounded state and asynchronous work without becoming
   new renderer primitives.
2. Large collections can be browsed indefinitely while DOM and VM memory remain
   bounded.
3. Applications can display, select, validate, and upload user-controlled media
   through opaque host capabilities rather than paths or arbitrary URLs.
4. Provider-neutral typed data contracts support cursor pagination, richer
   values, and production-shaped record and object-storage adapters.
5. Reusable Luau libraries can be installed deterministically, audited, locked,
   and shared across unrelated applications.

## 2. Established boundaries to preserve

The implementation must preserve these existing decisions:

- Core remains domain-neutral. A reference application may prioritize a missing
  contract but may not add names such as post, profile, like, story, or feed to
  the SDK, protocol, renderer, or host capabilities.
- Application Luau owns semantic composition and business rules. The SDK owns
  checked constructors and reusable behavior. Renderers and host adapters own
  DOM, native APIs, viewport mechanics, binary media access, and permissions.
- No application patches generated HTML, JavaScript, Rust, Swift, Kotlin, or
  host CSS as a normal workflow.
- Provider credentials and provider SDK objects never enter Luau, generated web
  output, navigation state, persisted UI state, logs, or public error messages.
- Remote code is never loaded into the Luau VM at runtime. Libraries are
  resolved, verified, and bundled at build time.
- Motion, collection measurement, media progress, and upload progress are event
  driven. Luastra must not introduce a permanent application loop.
- Stable IDs remain the identity boundary for reconciliation, focus, list
  anchoring, tests, and diagnostics.
- Accessibility, reduced motion, keyboard operation, short viewports, long and
  localized labels, lifecycle, direct links, and failure states are functional
  requirements rather than final polish.
- Existing `0.x` APIs remain available during a documented migration window.
  Stored-state changes require a migration or an explicit incompatibility notice.
- Existing release artifacts remain immutable.
- Open local development capabilities remain in the Apache-2.0 core. A future
  operated hosting or registry service may be separate, but ordinary local use
  must not require a Luastra account.

## 3. Target architecture

```text
Application domain modules
  profile / catalogue / message / document / commerce rules
                     |
Optional domain libraries
  composed cards, screens, controllers, repositories
                     |
Universal Luau libraries
  application composition, resources, mutations, paged collections,
  reusable visual compositions, package metadata
                     |
Luastra source SDK
  UI, Data, Navigation, State, Server, Content, Media, Host
                     |
Versioned protocol and runtime
  render events, capabilities, typed RPC, opaque handles
                     |
Host and provider adapters
  DOM, windowed list controller, picker, upload, object storage,
  browser / Tauri / Capacitor / local / Supabase
```

Only behavior requiring semantic host representation or privileged host access
belongs below the universal-library line. A `PostCard`, `ProductCard`, or
`ProfileHeader` is a Luau composition, not a protocol component. The expected
new renderer primitives are limited to `Icon` and, when video work begins,
`Video`. Existing primitives should be extended instead of duplicated.

## 4. Terminology

- **Primitive**: a protocol-admitted semantic node such as `Text`, `Button`,
  `Image`, or `List`.
- **Composition**: a pure Luau function that returns a tree of primitives.
- **Feature**: a bounded Luau object combining rendering, state, event handling,
  and asynchronous request ownership under one stable namespace.
- **Resource**: the state machine for one asynchronous read.
- **Mutation**: a bounded write with idempotency, optimistic-state, retry, and
  rollback policy.
- **Paged collection**: a cursor-based resource retaining a bounded set of
  pages and stable item identities.
- **Windowed list**: a host presentation that materializes only a viewport-sized
  subset and compensating spacers while preserving semantic order and focus.
- **Content handle**: an opaque, time-bounded reference to admitted binary
  content. It is not a filesystem path, provider token, or arbitrary URL.
- **Library**: a build-time, integrity-checked bundle of Luau modules, declared
  assets, compatibility metadata, licenses, and tests.

## 5. Workstream A: application and feature composition

### A1. Add a small composition SDK

Add `luastra/app` with strict types for `Feature`, `ComposeOptions`, and an
application composer. The composer returns the existing app contract;
the VM lifecycle does not gain a second application model.

The first contract should support:

- a stable feature ID and required node-ID prefix;
- `render`, `handle`, `resolve`, lifecycle, and optional debug snapshot hooks;
- deterministic feature ordering;
- action routing by admitted feature namespace;
- explicit ownership of asynchronous request IDs;
- cancellation and disposal without delivering late results;
- duplicate feature IDs, duplicate request ownership, invalid target prefixes,
  and unresolved ownership failing with actionable diagnostics;
- one root render function that places feature output explicitly;
- ordinary hand-written modules returning the required app callbacks remaining
  valid.

Avoid hidden global state. A feature instance owns its state, and two instances
of the same feature must operate independently.

Candidate public API shape:

```luau
local App = require("luastra/app")

local catalogue = Catalogue.new {
    id = "home/catalogue",
    repository = Products,
}

return App.compose {
    features = { catalogue },
    render = function()
        return UI.Screen {
            id = "app",
            catalogue:render(),
        }
    end,
    snapshot = function()
        return { status = "ready" }
    end,
}
```

The exact syntax may change during implementation, but ownership and lifecycle
semantics must be settled before application-facing examples are published.

### A2. Add request ownership and cancellation

Provide a private composer registry or a small public `luastra/task` helper that
records `{ requestId, ownerId, generation, purpose }`. It must:

- reject duplicate active request IDs;
- ignore or diagnose results from disposed generations;
- cancel requests when the host capability supports cancellation;
- otherwise suppress late delivery safely;
- distinguish retry from a new mutation;
- retain idempotency keys only for the lifetime required by the mutation;
- expose bounded diagnostic state without request payloads or secrets.

Do not make `app.resolve` optional at the runtime boundary until the
composer has proven it can reproduce all current resolution semantics.

### A3. Composition acceptance gates

- Two unrelated fixtures use the same composition API: one CRUD form and one
  paged catalogue.
- At least two instances of one feature coexist without ID or request leakage.
- Disposal, late response, cancellation, retry, offline, and rerender behavior
  have real-Wasm tests.
- Hand-written existing applications pass without migration.
- Analyzer errors identify the feature/module and field that failed.

## 6. Workstream B: resource, mutation, and paged-collection state

### B1. Add universal asynchronous resource state

Add `luastra/resource` as pure Luau. It owns no network implementation. The
initial state machine should be explicit:

```text
idle -> loading -> success | empty | error
success -> refreshing -> success | stale-error
error -> retrying -> success | empty | error
any active request -> cancelled or superseded
```

Required behavior:

- request generation numbers prevent stale overwrites;
- duplicate reads can be coalesced by caller-supplied stable keys;
- errors retain stable public codes and retryability;
- refresh can preserve visible data;
- cancellation is separate from failure;
- cache policy is explicit and disabled by default;
- snapshots exclude secret or provider-specific data.

### B2. Add mutations

Add a bounded mutation helper, either in `luastra/resource` or
`luastra/mutation`. It should support:

- idle, submitting, succeeded, failed, and cancelled states;
- required idempotency keys for retryable writes;
- caller-authored optimistic updates and rollback functions;
- affected resource/collection invalidation;
- single-flight or explicitly configured concurrent execution;
- no automatic retry for non-idempotent mutations;
- field-level validation errors without parsing provider messages.

### B3. Add cursor-based `PagedCollection`

Add `luastra/collection` with provider-neutral page contracts:

```luau
export type Page<T> = {
    items: { T },
    previousCursor: string?,
    nextCursor: string?,
    revision: string?,
}
```

The collection must support:

- forward and backward loading;
- refresh from an anchor;
- stable key extraction;
- item insert, replace, remove, and invalidation;
- deduplication across page boundaries;
- bounded page and item retention;
- configurable eviction from the edge farthest from the viewport anchor;
- explicit empty, initial-error, edge-error, refreshing, and stale states;
- cursor-cycle and duplicate-key detection;
- deterministic merge behavior when records change between requests.

Offset pagination may be adapted behind a repository, but the public infinite
collection contract uses opaque cursors. Applications must never infer cursor
contents.

### B4. Collection acceptance gates

- A synthetic fixture traverses at least 100,000 logical records while retaining
  no more than its configured window.
- Forward, backward, refresh, insertion, deletion, duplicate page, cursor cycle,
  cancellation, retry, and reordered-record cases are deterministic.
- VM memory reaches a stable plateau under repeated page traversal.
- No collection state contains access tokens or provider URLs.

## 7. Workstream C: typed backend contract evolution

### C1. Introduce server contract v2 without removing v1

The current flat server wire is suitable for small CRUD fixtures but not for
rich paged records. Introduce a versioned typed transport that supports:

- scalar, object, and array inputs and results;
- optional and nullable fields as distinct concepts;
- bounded enums;
- nested values with declared depth, field, item, and byte limits;
- per-string limits smaller than the envelope where declared;
- cursor page results;
- structured field-validation failures;
- explicit operation result versions;
- deterministic encoding and code generation;
- request cancellation and deadline propagation;
- v1/v2 coexistence during the alpha migration period.

The protocol envelope remains bounded. Raising the current 4 KiB server payload
must be justified by measured page shapes and remain below the existing 64 KiB
capability envelope. Media bytes never use RPC.

### C2. Strengthen generated clients

The generator should produce:

- exact strict Luau input/result types;
- codecs for nested inputs and results;
- optional/nullable handling;
- enum types;
- page and cursor types;
- operation metadata for authorization, mutation, idempotency, and retry;
- stable diagnostics for stale generated output;
- negative analyzer fixtures for every public type family.

Application code must not manually flatten complex values into transport fields.

### C3. Backend v2 acceptance gates

- Existing v1 fixtures pass unchanged.
- A v2 paged-record fixture passes through real Luau/Wasm, HTTP, authorization,
  handler validation, and generated decoding.
- Malformed depth, field count, array length, UTF-8, numeric values, duplicate
  fields, unknown enum members, oversized payloads, and deadline/cancellation
  cases fail closed.
- Fuzz/property tests cover both codec directions and canonical round trips.

## 8. Workstream D: provider-neutral records and object storage

### D1. Promote record providers into the project runtime

The existing Supabase HTTP record adapter is not yet an application runtime
provider. Define provider-neutral trusted-handler interfaces:

- `records.list(query, principal)`;
- `records.get(id, principal)`;
- `records.insert(value, principal)`;
- `records.update(id, patch, principal)`;
- `records.delete(id, principal)`.

Queries must use a declared allowlist rather than accepting arbitrary SQL,
PostgREST fragments, table names, field names, filters, or ordering from Luau.
The first query contract needs cursor, limit, admitted sort, and admitted equality
filters. Provider adapters translate it to local SQLite or Supabase.

### D2. Add provider-neutral object storage

Implementation status: the object-read subset now supports bounded local
content grants and private Supabase Storage delivery through the same opaque
`content:` handle. Supabase signed URLs and provider credentials remain behind
the trusted same-origin broker. Upload intent, commit, inspect, deletion, and
revocation operations remain in later slices.

Define trusted-handler operations for:

- create upload intent;
- commit and validate upload;
- issue read delivery;
- inspect admitted metadata;
- delete an owned object;
- revoke or expire an intent.

Storage records include an opaque object ID, owner, declared media type, byte
size, dimensions/duration where available, integrity digest, lifecycle status,
and timestamps. Luau receives opaque IDs and content handles, not bucket paths.

### D3. Provider configuration and local parity

Implementation status: built-in local and Supabase record collections now use
bounded `backend.records` declarations in `luastra.json`. Custom providers keep
one advanced JavaScript construction hook; a manifest declaration and that hook
cannot be combined.

Evolve the project manifest through an explicit schema migration. Provider
selection belongs in trusted configuration and environment variables. A local
development provider must implement the same interfaces using bounded files and
SQLite so tests do not depend on a hosted service.

Supabase remains an adapter, not a core dependency. RLS and storage policies are
required deployment artifacts for the adapter. Add a second-adapter contract
test using an in-memory/fake provider to prevent Supabase vocabulary from
becoming the public API.

### D4. Provider acceptance gates

- Local and Supabase adapters pass the same conformance suite.
- Pagination order is stable when records share timestamps.
- Authorization is enforced server-side for list, read, update, delete, upload,
  and delivery.
- RLS tests cover owner, follower/member-style relation, anonymous, revoked,
  blocked, and administrative cases without naming these domains in core.
- Provider errors are mapped to bounded Luastra codes and never leak response
  bodies, table names, tokens, or object paths.
- Backup, migration, deletion, and orphan-object behavior are documented.

## 9. Workstream E: dynamic content references

### E1. Extend `UI.Image` rather than add remote-image variants

Implementation status: the existing `UI.Image` now accepts packaged
`Assets.Image` and dynamic `Content.Image` values. `luastra/content` validates
opaque protected/preview handles and bounded image metadata; the renderer adds
packaged placeholders plus load/error actions without introducing another
image component.

Add `luastra/content` and define typed image sources. `UI.Image` should accept:

- a packaged `Assets.image` reference;
- an opaque server-issued content handle;
- a host-local preview handle returned by an admitted picker.

Do not accept arbitrary `https://`, `file://`, `data:`, `blob:`, provider-signed
URLs, filesystem paths, or raw bytes in application Luau. The host resolves an
opaque handle against the owning project and capability grant.

Content metadata should include admitted media type, byte size, pixel dimensions,
orientation, and optional blur/placeholder metadata. The renderer must retain
required alternative text and explicit decorative-image behavior.

### E2. Content lifecycle

Implementation status: protected grants expire closed, dynamic load/decode
failures produce an application-owned error action, and host-local preview
resources are reference-counted and released after their final rendered owner.
The web picker now creates bounded opaque preview handles in Slice 5. Native
picker admission remains separate per host.

- Handles are project-scoped, unforgeable, bounded, revocable, and expiring.
- Expiry during display produces a refreshable content error rather than a raw
  broken URL.
- Object URLs and temporary files are released when their last owner is disposed.
- Image decode errors are bounded host events.
- Cache policy distinguishes public immutable, private revalidating, and
  no-store content.
- Private content is not written to ordinary persisted state or logs.

### E3. Image acceptance gates

- Packaged images remain byte-identical and backward compatible.
- Local-preview and protected remote images render through the same `UI.Image`.
- Expiry, revocation, offline, decode failure, malicious metadata, decompression
  pressure, and oversized dimensions fail safely.
- Browser, Tauri, Android, and iOS evidence is recorded separately.

## 10. Workstream F: media selection and upload

### F1. Add explicit host capabilities

Introduce versioned capabilities such as `content.pick` and `content.upload`.
Final names must remain domain-neutral. The picker contract needs:

- admitted media kinds and maximum selection count;
- maximum bytes and optional image dimension constraints;
- camera/library/files source policy declared by the project;
- cancellation distinct from denial or failure;
- opaque local handles only;
- selected metadata validated by the host, never trusted from filename alone.

The upload contract needs:

- a server-created upload intent tied to principal, purpose, type, size, and TTL;
- streaming transfer outside the Luau RPC envelope;
- bounded progress events and cancellation;
- integrity verification and server-side commit;
- cleanup of abandoned or rejected uploads;
- retry/resume policy defined separately from mutation retry.

### F2. Platform implementations

- Web uses an inaccessible-to-Luau file input and streams the selected `File`.
- Capacitor uses repository-owned or audited native adapters with explicit iOS
  and Android permissions.
- Tauri uses scoped APIs and must not expose unrestricted filesystem paths.
- Unsupported hosts return a declared capability status before interaction.

Camera capture can follow library/file selection after the shared handle and
permission contracts pass. It must not block the first photo-upload slice.

### F3. Upload security gates

- Magic bytes and decode metadata agree with the admitted media type.
- SVG, HTML, scriptable documents, archives, executables, and polyglot files are
  rejected from the initial image/video surface.
- Limits cover bytes, pixels, duration, dimensions, count, rate, concurrent
  uploads, and total owned storage.
- Server-generated object names prevent traversal, overwrite, and enumeration.
- Cancellation, crash, app backgrounding, expired intent, replay, partial data,
  duplicate commit, and malicious provider response have adversarial tests.
- Image metadata privacy policy, including EXIF handling, is explicit.

## 11. Workstream G: windowed `UI.List`

### G1. Extend the existing primitive

Do not introduce `FeedList`, `MessageList`, or `InfiniteList`. Extend `UI.List`
with a windowed presentation contract. Candidate options are:

```luau
UI.List {
    id = "results",
    mode = "windowed",
    estimatedItemSize = 320,
    overscan = 6,
    onStartReached = "results.previous",
    onEndReached = "results.next",
    table.unpack(visibleItems),
}
```

The application and `PagedCollection` own the bounded item/page set. The host
owns viewport observation, dynamic measurement, spacers, and anchoring. Neither
layer pretends that all logical records are resident.

### G2. Required host algorithm

1. Use each direct `ListItem` stable Luastra ID as the item identity.
2. Measure realized item heights and retain a bounded estimate map.
3. Render an overscanned window plus leading and trailing spacers.
4. Dispatch an edge event once per cursor/generation when the threshold enters.
5. Capture `{ anchorItemId, offsetWithinItem }` before reconciliation or eviction.
6. Restore the anchor after insertions, removals, image decode, font load, resize,
   orientation change, and page eviction.
7. Pin a focused item and the minimum required context until focus moves safely.
8. Fall back to a complete ordinary list for small collections and to a bounded
   accessible page when assistive-technology behavior cannot be made equivalent.

The first version supports vertical variable-height lists. Horizontal carousels,
two-dimensional grids, masonry, sticky sections, and reverse chat anchoring are
separate extensions after the vertical contract passes.

### G3. Event and backpressure rules

- Edge events carry no provider cursor in the DOM event; the feature owns cursors.
- Repeated observer notifications do not produce duplicate loads.
- A list allows at most one forward and one backward request concurrently.
- Fast scrolling may skip rendering intermediate items but may not skip logical
  ordering or corrupt the anchor.
- Errors at either edge remain independently retryable.
- Removing old pages is driven by configured item/page budgets, not time.

### G4. Windowed-list acceptance gates

- Traverse at least 100,000 variable-height logical items in both directions.
- DOM node count and VM collection memory stay within declared budgets.
- No visible jump beyond the declared pixel tolerance occurs after page eviction,
  delayed image decode, text wrapping, font scaling, resize, or orientation change.
- Keyboard focus, screen-reader reading order, live announcements, reduced motion,
  and system Back behavior receive explicit browser and native-host evidence.
- Tests cover empty, one-item, slow page, duplicate page, deleted anchor, focus at
  an eviction boundary, and unsupported `ResizeObserver` behavior.

## 12. Workstream H: input, actions, icons, layout, and theming

### H1. Extend existing primitives

- `TextInput`: multiline rendering, maximum length, submit action, disabled,
  required, error, autocomplete, IME, and selection preservation.
- `Button`: explicit pressed/selected state, busy semantics that prevent duplicate
  activation, optional icon child, and text-or-accessible-label requirements.
- `Image`: typed source, placeholder, load/error actions, responsive sizing, and
  existing fit/aspect-ratio behavior.
- `List`: windowed mode, edge actions, busy state per edge, and item count metadata.
- `Modal`: initial focus, return focus, labelled/description relationships, and
  safe behavior on short keyboard-reduced viewports.

### H2. Add only semantically necessary primitives

Add `UI.Icon` as a semantic, theme-aware icon surface with a bounded Luastra icon
set and required accessible-name/decorative rules. Avoid one renderer component
per icon or per button shape.

Add `UI.Video` only after dynamic images and upload handles pass. It should cover
inline visual playback, poster, captions, muted/autoplay policy, controls,
visibility-driven suspension, and lifecycle. Existing `luastra/media` background
audio semantics must not be silently changed to imitate inline video.

### H3. Typed visual tokens

Do not solve application design by baking project-specific CSS classes into the
host. Extend the tokenized UI options only where multiple applications need them:

- semantic spacing and sizing;
- border/radius and surface treatment;
- safe-area-aware top and bottom placement;
- bounded sticky header/footer behavior;
- aspect ratio and overflow;
- selected/pressed/disabled/busy/error states;
- typography roles and inherited theme tokens.

Composition libraries build `AppBar`, `BottomNavigation`, `Avatar`, `IconButton`,
`MediaCard`, `EmptyState`, and similar blocks from primitives. These names do not
enter the renderer protocol.

Theme data may alter presentation but never content, action routing, navigation,
accessibility, responsive availability, or reduced-motion behavior.

### H4. UI acceptance gates

- Long localized labels, 200% text, narrow width, short height, virtual keyboard,
  dark mode, forced colors, and reduced motion retain complete functionality.
- All controls have at least a 44 by 44 CSS-pixel target where the host uses CSS
  pixels.
- IME composition is never dispatched as a premature value or submit.
- Reusable visual compositions pass in at least two unrelated fixtures without
  app-specific host CSS.

## 13. Workstream I: inline video

Video is a later dependent slice, not a prerequisite for the first universal
collection release.

### I1. Contract

- typed packaged or opaque content source;
- optional poster image and caption/subtitle track;
- explicit controls, muted, loop, preload, and autoplay policy;
- play, pause, seek, ended, buffering, visibility, interruption, and error events;
- only one configured number of concurrently active decoders;
- background behavior declared separately and disabled by default;
- reduced-motion and data-saving policies;
- no arbitrary embedded player or remote script.

### I2. Resource management

The windowed-list controller must suspend offscreen videos, release decoders after
a bounded distance, and preserve only lightweight playback state. Host lifecycle
and audio focus remain authoritative. A video must never continue consuming
frames solely because its Luau node was once visible.

### I3. Video acceptance gates

- Repeated traversal through a mixed image/video collection reaches stable memory,
  decoder, CPU, and network budgets.
- Autoplay restrictions, muted policy, captions, controls, interruption,
  background/foreground, lock, route change, and disposal are tested per host.
- Web evidence cannot admit Capacitor or Tauri behavior.

## 14. Workstream J: reusable library packaging

### J1. Add a library manifest and lockfile

Define a versioned library format containing:

- library identity and semantic version;
- compatible Luastra SDK/protocol range;
- exported Luau module IDs;
- exact internal module dependency graph;
- declared assets and their hashes;
- required host capabilities;
- license and notice metadata;
- conformance tests;
- integrity digest and optional publisher signature added as a separate trust
  decision.

Add a project lockfile containing exact library versions and hashes. Builds use
only locked local content. No floating dependency, CDN module, or network fetch
occurs during application execution.

### J2. CLI workflow

Candidate commands:

```text
luastra library check
luastra library pack
luastra add <source-or-package>
luastra remove <library>
luastra update <library> --to <version>
```

The first implementation may install from a local path or immutable archive.
A public marketplace and hosted registry remain out of scope. Installation must
be transactional and must not overwrite project-authored modules or assets.

### J3. First reusable-library proof

Build a domain-neutral library containing, for example:

- `AsyncBoundary`;
- `PagedList` composition;
- `EmptyState` and `RetryState`;
- `Avatar` or generic circular image composition;
- `AppBar` and `BottomNavigation` compositions.

Use it unchanged in at least two unrelated fixtures, such as a catalogue and an
activity log. A future social library can depend on it, but is not part of core
and is not required by this plan.

### J4. Packaging acceptance gates

- Install, update, rollback, remove, offline reinstall, corrupt archive, hash
  mismatch, incompatible SDK, module collision, asset collision, dependency cycle,
  and missing-license cases are deterministic.
- Library code receives no capabilities not declared by the application.
- Clean export, SBOM, notices, and source attribution include library closure.
- An application build remains reproducible from source, lockfile, and admitted
  immutable inputs.

## 15. Workstream K: diagnostics, performance, accessibility, and conformance

### K1. Diagnostics

Add stable diagnostic codes and context for:

- feature/action/request ownership;
- resource transitions and suppressed stale results;
- cursor cycles and duplicate item keys;
- collection window and anchor failures;
- unavailable capabilities and permission outcomes;
- content-handle expiry and decode failure;
- upload intent, validation, cancellation, and commit state;
- provider mapping and bounded public errors;
- library compatibility and integrity failures.

Diagnostics must redact input values, captions, filenames, local paths, URLs,
tokens, provider response bodies, and binary metadata not explicitly classified
as safe.

### K2. Performance budgets

Define budgets before optimizing implementations. At minimum measure:

- VM render and event p50/p95;
- renderer patch count and bytes;
- realized DOM node count;
- retained VM, JS, and host-native memory;
- scroll frame responsiveness;
- image decode concurrency and decoded-pixel pressure;
- active video decoders;
- request and upload concurrency;
- first content, interaction readiness, page append, and anchor-restoration time;
- idle CPU/network activity after all work settles.

Measurements must use deterministic synthetic data plus real host runs. A single
fast desktop browser result does not establish the mobile budget.

### K3. Accessibility and responsive conformance

Extend the executable reference-quality profile for:

- windowed collection semantics and focus pinning;
- loading, empty, refreshing, stale, edge-error, and retry announcements;
- content alternative text and decorative images;
- picker/permission/upload status;
- multiline input and submit semantics;
- video captions and controls;
- bottom navigation and sticky UI under safe areas;
- long labels, localization, RTL-sensitive logical spacing, 200% text, narrow and
  short viewports, orientation changes, forced colors, and reduced motion.

Where virtualization conflicts with assistive technology, correctness wins over
node-count optimization and the host uses a documented bounded fallback.

### K4. Test layers

Every workstream should add proportionate evidence at these boundaries:

1. strict Luau analyzer positive and negative fixtures;
2. pure Luau state-machine tests;
3. protocol schema and generated-code tests;
4. renderer/host unit tests;
5. adversarial backend/provider tests;
6. real Luau/Wasm integration tests;
7. deterministic build and clean-install tests;
8. Chromium and Safari/WebKit browser interaction tests;
9. Tauri host tests where the capability is claimed;
10. Android and iOS simulator tests;
11. selected physical-device evidence for picker, upload, lifecycle, memory, IME,
    accessibility, and video before those hosts are called admitted.

## 16. Recommended delivery slices and dependency order

Version numbers are assigned only after a slice passes its gates. Do not reserve
calendar-based alpha labels.

### Slice 0: baseline and contract freeze

- Confirm private working tree equals the selected public baseline.
- Create the private development branch and record the exact base SHA/tree.
- Write ADRs for composition, paged collection/windowing, typed content handles,
  backend v2, provider interfaces, and library packages.
- Write threat-model deltas before implementing content/upload/package inputs.
- Add failing contract tests before production code.

Exit: contract reviews are complete, negative tests describe the security
boundaries, and no implementation has silently changed protocol v1.

### Slice 1: composition and asynchronous state

- Workstreams A and B except persistent cache.
- Migrate two small existing fixtures to prove reuse while retaining their old
  externally observable behavior.

Exit: reusable features own requests safely; two unrelated applications share
the same resource and collection helpers.

### Slice 2: backend v2 and cursor data

Implementation status: complete for the bounded `0.5.0-alpha` source scope. The
generic collection contract, local and Supabase adapters, managed Supabase
session binding, structured field errors, declarative record construction, and
RLS policy tests are implemented. A real production Supabase deployment,
operations, and backup remain application/operator evidence and are not claimed.

- Workstreams C and the record-query portion of D.
- Local provider first, then Supabase conformance.

Exit: a real-Wasm application traverses mutable cursor-paged records through both
providers with bounded payloads and server-side authorization.

### Slice 3: windowed collections

Implementation status: complete for the supported-browser exit scope. The
vertical variable-height `UI.List` contract, bounded
measurement cache, overscan spacers, stable-boundary edge actions, anchor
restoration, focus pinning, accessible metadata, and ordinary-list fallback are
implemented for the web host. Chromium, Firefox, and Safari gates pass bounded
DOM and measurements, bidirectional eviction/reload, delayed remeasurement,
and disjoint focus pinning. The Chromium gate additionally passes logical
metadata, actual delayed image decode and same-origin WOFF2 loading, long-text
wrapping, 200% text, keyboard activation, accessibility-tree reading order,
polite live-status semantics, browser Back neutrality, layout-width/orientation
reflow, reduced-motion stability, and the two-pixel anchor tolerance. Pure and
real-Wasm tests cover the 100,000-record traversal, bounded retained memory,
empty and one-item lists, an unresolved slow page, duplicate data, deleted
anchors, eviction-boundary focus, and the no-`ResizeObserver` fallback.

The automation verifies the browser accessibility tree consumed by assistive
technology; it is not an owner-observed VoiceOver or NVDA certification. The
windowed presentation owns no History or native Back behavior. Existing browser
and physical Android Back evidence remains in the navigation host, while native
WebView windowing performance and assistive-technology admission remain explicit
unclaimed host-specific follow-up evidence rather than an implication of this
browser slice.

- Workstream G and associated K budgets.
- Start with vertical variable-height lists and ordinary non-windowed fallback.

Exit: 100,000-record traversal, bidirectional reload, eviction, focus, memory,
and anchor gates pass in supported browsers; native claims remain explicit.

### Slice 4: dynamic images

- Workstream E and object-read portion of D.
- Extend existing `UI.Image`; do not yet add video or camera.

Implementation status: complete for packaged, protected same-origin, and
browser-local preview images. Expiry, offline failure, decode admission,
reference counting, replacement, and final-owner release are tested.

Exit: packaged, local-preview, and protected remote images share one public
component contract and pass expiry/offline/decode/resource tests.

### Slice 5: selection and upload

- Workstream F and object-write portion of D.
- Web file selection first; Capacitor and Tauri admitted independently.

Implementation status: the browser PNG/JPEG path covers selection, preview,
explicit cancellation, same-origin streaming, server-created intents, commit,
display, deletion, expiry cleanup, local storage, and the Supabase HTTP/RLS
adapter. Camera, video, resumable transfer, durable multi-instance intents,
Capacitor, and Tauri remain explicitly deferred. This is complete for the
bounded web scope claimed by `0.5.0-alpha`.

Exit: select, preview, cancel, upload, commit, display, delete, and abandoned
upload cleanup pass end to end with provider and authorization evidence.

### Slice 6: reusable libraries and UI completions

- Workstreams H and J, excluding video.
- Package a domain-neutral block library and consume it in two fixtures.

Implementation status: local library sources and canonical immutable archives
are checked against exact SDK, capability, dependency, module, asset, test,
license, notice, and file-integrity contracts. Transactional add/update/remove,
exact locks, offline reinstall, build attribution, notices, SPDX output, and
negative admission tests are implemented. `UI.Icon`, input completion fields,
button states, modal focus relationships, and generic sticky/overflow tokens
complete the non-video UI scope. The same `universal-blocks` package is locked
unchanged by catalogue and activity-log fixtures without host patches.

Exit: clean install/update/rollback and two-application reuse pass without host
patches or application-specific core APIs.

### Slice 7: inline video

- Workstream I plus content/upload extensions.

Release decision: deferred until after `0.5.0-alpha`. No video API or host claim
is included in this candidate.

Exit: the mixed-media performance, lifecycle, caption, focus, memory, decoder,
and per-host evidence gates pass.

### Slice 8: release hardening

- Complete K, documentation, compatibility, migration, installation, host matrix,
  security, clean export, and publication gates.

Implementation status: version-bound diagnostics, compatibility, migration,
installation, release notes, SDK packaging, SBOM/notices, browser/host evidence
boundaries, and exact-candidate procedures are implemented. Final exact-SHA
Daybreak, clean-export regeneration, private CI, and the separately authorized
public promotion sequence remain release actions rather than source features.

Exit: one exact immutable candidate has complete evidence and no later unscanned
delta.

Each slice should be a small private pull request or a narrowly reviewable series
of private pull requests. Do not merge multiple high-risk capabilities merely to
hit a version date.

## 17. Security plan and mandatory Daybreak gate

### 17.1 Security design before implementation

Update the repository threat model for these new boundaries:

- untrusted list records and cursors;
- user-selected binary content;
- metadata parsing and image/video decompression;
- opaque preview and delivery handles;
- upload intents, streaming, commit, cleanup, quota, and replay;
- provider queries, RLS, object paths, and signed delivery;
- library archives, dependency graphs, licenses, integrity, and future signatures;
- windowed DOM/focus state and event amplification;
- cancellation, retries, idempotency, and stale async results.

Threat-model decisions become tests or explicit accepted risks before the related
implementation merges.

### 17.2 Risk-proportionate incremental review

Every security-relevant slice receives a threat-model update, negative tests,
and an exact-diff engineering review. Do not run Daybreak mechanically after
every private slice when those controls are green and the exact-candidate scan
is still pending. Run an incremental Daybreak diff review when the slice exposes
a credible new attack path that cannot be bounded confidently by review and
tests, when a security control fails, or when a previous finding needs formal
fix verification.

Any incremental scan is bound to an exact commit and does not cover later
changes. Validated findings are fixed and reverified before integration. This
risk-proportionate policy does not weaken or replace the mandatory full scan of
the final release candidate below.

### 17.3 Exact-candidate full scan

Before creating a new public version or public pull request:

1. Freeze the private release-candidate commit.
2. Run a full repository Codex Security scan in a dedicated task using the
   Daybreak security model against that exact commit, including generated code,
   release tooling, host adapters, native sources, backend/provider code, CLI,
   package processing, and application-facing SDK contracts.
3. Run focused attack-path analysis for every plausible finding.
4. Fix validated findings on a new private commit and run fix verification.
5. Repeat the full or formally sufficient delta scan until the final candidate
   has no unresolved critical/high finding and every retained lower-severity risk
   has an explicit owner decision.
6. If any byte changes after the scan, perform a Daybreak delta scan from the
   scanned commit to the final candidate. Documentation-only assumptions do not
   exempt executable configuration, workflows, generated files, or manifests.
7. Retain the scan ID, exact SHA/tree, scope, limitations, findings, fixes, and
   verification summary in private release evidence.

Daybreak is mandatory but not sufficient by itself. The candidate must also pass
secret scanning, dependency/advisory review, SBOM/notices generation, license
closure, adversarial tests, protocol fuzz/property tests, archive traversal and
integrity tests, RLS/storage tests, and the complete host-appropriate test matrix.

### 17.4 Security release blockers

Publication is blocked by:

- any unresolved critical/high validated finding;
- a plausible candidate finding without completed validation;
- unscanned executable delta after the last exact-candidate scan;
- secrets, credentials, private endpoints, absolute user paths, or private notes
  in the candidate;
- missing RLS/storage policy tests for a claimed remote provider;
- unrestricted file paths, URLs, media types, redirects, archive entries, or
  library capabilities;
- missing quota/rate/concurrency bounds at an untrusted input boundary;
- incomplete dependency license, notice, or SBOM closure;
- a host capability claimed without its platform-specific validation.

## 18. Private development and public promotion workflow

All implementation occurs in `Luastra/luastra-dev-private` from a verified public
baseline. The public remote remains fetch-only locally until a separately
authorized promotion step.

For every development slice:

1. Recheck that the branch base has the intended public tree.
2. Work on a `codex/` private branch.
3. Keep commits narrow, signed off, and English-only.
4. Run focused tests, full local tests, documentation checks, and clean-export
   audit as appropriate.
5. Push only to the private origin and use the protected private-PR workflow.
6. Record evidence boundaries; do not convert browser proof into native proof.

For a future public release:

1. Select and freeze an exact private candidate.
2. Complete all functional, performance, accessibility, migration, installation,
   multi-host, and Daybreak gates.
3. Regenerate `CLEAN_EXPORT_MANIFEST.json` for every new public candidate file.
4. Run `release/audit-public-candidate.mjs` and verify a deterministic clean
   export from the exact SHA.
5. Compare the clean export with the intended public diff and verify that private
   evidence, plans not intended for publication, credentials, local paths, and
   historical workspaces are absent.
6. Create a narrowly scoped public candidate branch and pull request only after
   explicit owner authorization.
7. Require public CI and exact multi-host checks; re-scan any changed executable
   delta.
8. Merge only the reviewed public tree, verify the exact public commit, then
   create new immutable tag/assets/checksums/SBOM/notices.
9. Verify public installation and production deployment separately.
10. Never rewrite or replace an earlier release asset.

A private commit, private push, private merge, public branch, public pull request,
public main merge, release publication, and production deployment are distinct
states and must be reported separately.

## 19. Documentation and migration deliverables

Before release, publish version-bound documentation for:

- the composition and feature lifecycle;
- resource, mutation, and paged-collection state machines;
- cursor and windowed-list behavior;
- typed content sources and handle expiry;
- picker/upload permissions, limits, cancellation, and errors;
- backend v2 declarations and generated clients;
- local and Supabase provider setup, RLS, storage, backup, and deletion;
- icon, input, list, image, and video APIs;
- library authoring, install, lock, update, rollback, licenses, and capabilities;
- compatibility and per-host capability status;
- migration from server v1, current lists, current images, and project manifest v2;
- performance and accessibility expectations;
- security and privacy responsibilities for user content.

Every public API page needs a checked example and at least one failure example.
Examples must compile against the exact published SDK. Documentation must not
claim provider deployment, production stability, native parity, or accessibility
certification beyond retained evidence.

## 20. Explicit non-goals for this plan

- Building the Instagram-like reference application.
- An Instagram-specific SDK, protocol, database schema, or component family.
- A visual drag-and-drop builder.
- A public component marketplace or hosted registry.
- Algorithmic ranking, recommendations, advertising, analytics, moderation
  service, direct messages, stories, livestreaming, push notifications, location,
  payments, image filters, or server-side media transcoding.
- Arbitrary CSS, JavaScript, HTML, iframe, WebView, remote Luau, URLs, SQL, or
  filesystem access exposed to application code.
- Offline mirroring of an unbounded remote collection. Bounded cache and mutation
  reconciliation require a separate contract after the online path is proven.
- Treating a successful implementation or release as evidence of market demand.

These may become later independently justified projects. They must not expand
this implementation merely because one motivating application could use them.

## 21. Completion definition

The universal-building-blocks program is complete only when:

- application authors can compose reusable stateful features without a monolithic
  `app.handle/resolve` switch;
- one generic paged collection traverses an effectively unbounded data set with
  bounded VM and host memory;
- `UI.List` windowing preserves scroll anchor, focus, semantic order, and failure
  recovery;
- `UI.Image` displays packaged, local-preview, and protected remote content through
  one safe typed contract;
- selection and upload work through opaque handles with server-side validation,
  authorization, quota, integrity, cancellation, and cleanup;
- backend v2 and generated clients support bounded rich page records while v1 has
  a documented compatibility path;
- local and Supabase record/object providers pass the same conformance contract;
- reusable libraries install reproducibly and are consumed unchanged by at least
  two unrelated applications;
- the core contains no motivating-application domain terms;
- supported web, desktop, Android, and iOS claims are backed by separate retained
  evidence;
- documentation, migration, install, rollback, clean export, SBOM, notices, and
  immutable release tests pass;
- Daybreak has scanned the exact final candidate and every later executable delta,
  with no unresolved publication-blocking finding;
- the owner explicitly authorizes the separate public-promotion step.

Until all applicable gates pass, status must be reported precisely as proposed,
implemented locally, committed privately, pushed privately, CI-verified,
browser-verified, simulator-verified, physical-device-verified, security-scanned,
publicly merged, released, or deployed. None of these states implies another.
