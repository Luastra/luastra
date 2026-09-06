# Constellation Orbit

Constellation Orbit is an experimental semantic UI family for spatial
application navigation. Luau describes intent and content; the Luastra host
owns coordinates, responsive presentation, focus movement, inactive-layer
isolation, and reduced-motion behavior.

## Components

- `UI.Orbit` is the bounded experience root. `presentation` accepts `auto`,
  `spatial`, or `list`. `orbitTheme` selects one of the themes below, while
  `orbitMotion` accepts `system` or `off`.
- `UI.OrbitPath` contains the current path as `UI.Button` and `UI.Text` nodes.
- `UI.OrbitSearch` creates a labeled search input and live result status for the
  active constellation. The application supplies the query and result counts,
  keeping filtering in Luau rather than hidden host state.
- `UI.OrbitReturn` is a path button used by both pointer input and the Escape
  key to return from a nested constellation.
- `UI.Constellation` is one navigation depth. Exactly one child must be an
  `UI.OrbitCenter`; one to 64 children may be `UI.OrbitNode` or
  `UI.OrbitCluster` values.
- `UI.OrbitCenter` creates its title and optional description from strings.
- `UI.OrbitNode` is an interactive semantic button. `nodeKind` is
  `constellation`, `leaf`, or `action`; optional `ring` and `priority` values
  are integers from 1 through 3. Optional `relatedTo` accepts up to eight stable
  IDs from the same constellation. Optional `signalIcon` selects one bounded
  host-rendered icon (`bolt`, `book`, `check`, `compass`, `gauge`, `grid`,
  `play`, `rocket`, `search`, `settings`, `spark`, or `star`) for the most
  compact semantic zoom level.
- `UI.OrbitNode` and `UI.OrbitCluster` may also provide a bounded `status`
  string and `statusTone` of `neutral`, `active`, `success`, `warning`, or
  `error`. A tone requires status text; color is never the only status signal.
- `UI.OrbitCluster` is an application-authored group entry. It exposes a title
  and item count as one semantic button and opens a local constellation through
  the application's normal navigation action.
- `UI.FocusSurface` is a semantic dialog for leaf content.
- `UI.FocusHeader` is a sticky Focus Surface return rail. It contains exactly
  one visible `UI.Text` heading and one `UI.Button`, keeping identity and the
  dismissal action available while long content scrolls.

```luau
local UI = require("luastra/ui")

return UI.Orbit {
    id = "map",
    label = "Application map",
    presentation = "auto",
    orbitTheme = "luastra",
    orbitMotion = "system",

    UI.Constellation {
        id = "map/root",
        layerState = "active",
        UI.OrbitCenter {
            id = "map/root/center",
            title = "My application",
            description = "Choose a direction.",
        },
        UI.OrbitNode {
            id = "map/root/library",
            title = "Library",
            description = "Browse saved work.",
            signalIcon = "book",
            status = "Ready",
            statusTone = "success",
            nodeKind = "constellation",
            relatedTo = { "map/examples" },
            onTap = "open-library",
        },
        UI.OrbitCluster {
            id = "map/examples",
            title = "Examples",
            count = 48,
            onTap = "open-examples",
        },
    },
}
```

Use stable IDs across renders. Render the active constellation plus, at most,
the neighboring transition layer. Set inactive layers to `behind` or `ahead`;
the host makes them inert and hidden from assistive technology while preserving
their visual transition state. Include an enabled `UI.OrbitReturn` in a nested
path to make the Escape key return through the same Luau action. The host
remembers focus independently for each constellation and restores the exact
node when an ancestor becomes active again.

The active constellation is exposed as a named polite live region; inactive
layers are inert and hidden from assistive technology. A selected leaf uses
`aria-current="page"`, advertises its dialog with `aria-haspopup`, and reports
its expanded state. Focus Surfaces derive their accessible name from their
visible heading. Arrow keys move geometrically, while Enter and Space activate
the focused node and Escape dismisses the current Focus Surface through the
same Luau action as its return control. On open, a long surface starts at the
top with programmatic focus on its heading rather than scrolling to a trailing
control; normal Tab navigation then reaches the interactive content. For long
content, place that heading and the dismissal action in `UI.FocusHeader` so
both remain visible without changing the dialog's reading or focus order.

Pressing `/` outside an editable control focuses and selects the active Orbit
search input. Escape clears a non-empty query first; another Escape can then
continue normal Orbit return behavior. Filtered nodes retain their stable IDs
and actions but are hidden from layout and assistive technology. A zero-result
query leaves the constellation identity visible and announces a readable
`No matching nodes` status with the Escape recovery hint.

The reference application maps semantic states to fragment routes:
`#/orbit` for the root, `#/orbit/build` for the nested constellation, and a
leaf route such as `#/orbit/build/motion` for an open Focus Surface. Browser
Back and Forward restore the same route stack, depth, leaf, and focus outcome.
Theme and motion preferences are intentionally excluded from history entries.
When a direct leaf route has no pointer-origin element, closing its Focus
Surface restores focus to the matching selected node rather than the document.
Search queries are also ephemeral navigation state. The reference keeps one
query per constellation while the application is running, but does not add
queries to URLs or browser-history entries.

Clusters are semantic navigation, not host-generated decoration. The
application declares the group name, count, membership, destination route, and
local constellation. The experimental API does not yet infer clusters from
coordinates or reorder application data. This keeps the meaning stable across
spatial and list presentations and gives the cluster one accessible name that
includes both its title and count.

`relatedTo` expresses a bounded neutral relationship, not application-owned
geometry. Every target must resolve to another node or cluster in the same
constellation; self-links, duplicate targets, missing targets, and more than
eight targets are rejected. Reciprocal declarations collapse to one stable
undirected edge. In spatial presentation the host draws those connections in
a non-interactive layer behind the center and nodes. That decorative SVG is
kept after the semantic children in DOM order and placed behind them only with
stacking order, preserving the center's compact geometry. Center copy has an
independent readable line-length bound and cannot expand the center beneath
surrounding nodes. In list presentation the
lines are hidden, while each connected node retains an accessible description
that names its currently available neighbors. This experimental slice does not
yet promise directed relationship types.

Automatic spatial placement ranks lower numeric priorities first and then uses
relationship degree to choose the bounded inner-ring capacity. Within a ring,
the deterministic order prefers a neighbor of the previously placed node so
connected content tends to remain visually adjacent. An explicit `ring` value
remains authoritative. These semantics are only placement hints: the host's
bounds and collision pass can still select the complete list instead, and list
order always remains the application's authored order.

Orbit semantic zoom is hybrid. The application authors stable meaning through
`title`, optional `description`, `priority`, and optional `signalIcon`; the host
automatically selects the visible detail from container space, density, the
resolved ring, and priority. Applications do not provide responsive
breakpoints. The four levels are:

- **Signal** shows a consistent host-rendered vector icon while retaining the
  complete button name in the accessibility tree. Hover and keyboard focus may
  reveal the title and status as a non-interactive visual reminder, but that
  reveal is never the only source of meaning. The host keeps the icon clear of
  the compact status indicator and suppresses corner navigation or cluster
  markers at this density. A node without `signalIcon` never drops below
  Identity.
- **Identity** keeps the readable title and essential cluster count while
  visually hiding supporting copy without removing it from assistive
  technology. Constellation and cluster nodes reserve an inline-end corner for
  their navigation arrow or count affordance so long titles cannot collide
  with it.
- **Preview** shows the title and a bounded supporting preview. Long supporting
  copy is clamped rather than allowed to enlarge a spatial node into another
  node or the center.
- **Focus** is the existing Focus Surface with full application content and
  controls.

A generous six-node workspace keeps Preview for every node. Under moderate or
dense spatial pressure, higher-priority inner-ring nodes retain more detail and
peripheral nodes progressively use Identity or Signal. List presentation
always returns every node to Preview, so semantic zoom never removes content
from the complete fallback. Detail changes reuse the existing DOM nodes and
run only during an Orbit layout pass; they do not fork application state,
navigation order, focus, or event actions.

Filtering is a zoom input rather than a permanent loss of context: when only
one or two results remain and spatial geometry is still safe, those sparse
results expand back to Preview even if their normal priority would use
Identity or Signal.

Node status is semantic content rather than decoration. `status` must contain
1 to 80 non-control UTF-8 bytes and should stand on its own, such as `Ready`,
`Needs review`, or `Blocked`. `statusTone` adds a redundant symbol, boundary
style, and theme-aware color: neutral uses a dot, active a diamond, success a
check, warning an exclamation mark, and error a cross. Preview and Identity
show the complete status badge with a small separation from the preceding
title or preview copy; cluster counts use the same visual rhythm. Signal keeps
the status text in the accessible button name and replaces the badge with a
small non-interactive indicator.
Long badge text is visually constrained to one line while its complete string
remains available to assistive technology and in the semantic button content.

Action nodes use the same `UI.OrbitNode` contract with `nodeKind = "action"`.
Generic `busy` and `disabled` properties remain authoritative. A busy action
stays visible and participates in layout and relationship rendering, exposes
`aria-busy`, shows a redundant progress indicator, and is skipped by roving
keyboard focus until it becomes available again. Its status is a polite live
region, allowing transitions such as `Ready` to `Working` to `Complete` to be
announced without opening a Focus Surface. Motion-off and system reduced-motion
preferences stop the progress rotation without hiding the busy state.
Forced-colors mode yields both badge and indicator colors to system ButtonText
and ButtonFace while retaining their symbols and border styles.

The reference includes an `Example galaxy` cluster containing 48 application
ideas across eight categories. Its local constellation deliberately selects
the complete scrollable list because its density exceeds the spatial limit.
Search, Focus Surfaces, Back, direct routes such as
`#/orbit/examples/productivity/5`, and exact focus restoration use the same
contracts as the smaller root and Build constellations. A deterministic
50-item layout test guards the upper-density behavior independently of the
reference content.

The reference search has been browser-checked in all eleven themes at a
363 x 479 CSS-pixel viewport. Each theme uses list presentation without page,
input, or status overflow; the minimum rendered search-status contrast is
7.54:1.

## Themes and motion

Orbit ships eleven tokenized themes. Theme changes are immediate and preserve
the same semantic tree, layout algorithm, keyboard behavior, and application
state. Each theme also resolves a dedicated Focus Surface palette for its
background, primary and muted text, boundary, controls, and control text. The
host applies those tokens to both the settled semantic dialog and its
non-interactive closing snapshot. In operating-system forced-colors mode,
decorative patterns, shadows, and theme-specific colors yield to system Canvas,
Button, Highlight, and text colors while semantic state remains visible. Theme
hover filters are disabled in that mode so they cannot alter the user's
system-selected control colors.

| ID | Display name |
| --- | --- |
| `luastra` | Luastra Mineral |
| `abyss` | Abyss Observatory |
| `sakura` | Sakura Ink |
| `atlas` | Desert Atlas |
| `arctic` | Arctic Laboratory |
| `biolume` | Biolume Garden |
| `arcade` | Neon Arcade |
| `bauhaus` | Bauhaus Signal |
| `editorial` | Monochrome Editorial |
| `copper` | Copper Workshop |
| `candy` | Candy Pop |

Use `orbitMotion = "off"` for an application-level no-motion preference. The
default `system` value follows the host's `prefers-reduced-motion` setting.
Both modes keep navigation and state changes functional; only Orbit-owned
decorative transitions and hover displacement are suppressed.

The reference application persists the selected theme and motion value through
the scoped Luastra storage capability. On web, the Orbit host validates and
applies the same versioned preference token before the first Orbit frame, then
Luau restores the authoritative application state. Invalid or obsolete tokens
fall back to `luastra` and `system`. Native persistence uses the same Luau API;
pre-first-paint native behavior requires separate device evidence.

## Adaptive and performance behavior

`auto` evaluates the Orbit container's width and height, not only the browser
width. It selects the list presentation for narrow or short containers and
when the node count or title length exceeds the admitted spatial density. Long
supporting descriptions are handled by semantic zoom rather than forcing a
list when the proposed spatial geometry is otherwise safe. The
layout also checks every proposed node rectangle against the workspace edge,
the center object, and every other node. Any unsafe spatial result becomes the
complete list presentation. `spatial` is therefore a preference rather than
permission to overlap or clip content. This keeps localized or unusually
descriptive labels from overlapping in fixed spatial slots. The list contains
the same semantic nodes and event actions, so application state does not fork
by presentation.

List nodes use a dedicated bounded radius token rather than inheriting
percentage-based spatial geometry. This preserves each theme's shape language
without allowing a tall, wrapped card to curve its boundary through the title
or description.

Spatial nodes may independently increase their logical start padding when a
theme's asymmetric outline enters the content area. Biolume Garden uses this
inset to preserve its organic silhouette without allowing the leading glyphs
to touch the curve; list presentation returns to the compact default inset.

Focus Surfaces have viewport-bounded independent scrolling, contained
overscroll, stable scrollbar space, and a 44 px minimum control target. The
reference application deliberately includes dense semantic content so the
scrolling and focus contract remains continuously testable instead of being an
untested empty-state promise.

Spatial coordinates are deterministic and computed only after a resize or UI
commit. Pointer and keyboard navigation do not continuously measure layout.
Nodes use CSS containment; transitions are limited to opacity and transforms.
The initial unmeasured frame is a readable list, avoiding hidden or misplaced
controls before host layout is ready. The system and application motion
preferences both disable Orbit transitions when requested.

When container dimensions or node count already guarantee list presentation,
the host skips spatial-only text and metadata inspection. List layout also
avoids rewriting unused spatial coordinates, unchanged ARIA state, and
decorative or relationship DOM for nodes that do not declare those features.
These are execution fast paths only: authored content, focus behavior,
relationships, semantic detail, and the resulting DOM attributes remain under
the same public contract.

Applications should retain only the active constellation and, when a return
transition needs it, one neighboring visual layer. The reference keeps the
root plus the active or most recently visited child; it does not retain the
48-item Examples constellation while Build is active. This bounds inactive DOM
without changing route, focus, search, or application state.

Run `npm run benchmark:orbit` to exercise the pure deterministic layout with an
eight-node spatial case and a 50-node list case. The command reports average
and p95 time against deliberately generous development-machine budgets. It is
not browser frame-time or low-end-device evidence. A local preview opened with
`luastraDiagnostics=1` additionally reports measured Orbit layout passes,
durations, node count, and retained constellation count through the existing
host diagnostics surface. Normal applications do not collect those timings.

Run `npm run audit:orbit:chromium` for the repeatable real-browser performance
gate. It alternates between the root, 48-node Examples, and Build
constellations for 20 cycles and requires all of the following:

- average measured interaction-time Orbit layout at or below 8 ms;
- maximum measured interaction-time Orbit layout at or below 33.34 ms;
- at most two retained constellation layers and 54 retained Orbit nodes;
- no root DOM growth after the interaction loop;
- no pending requests, active motion, scheduled frame work, runtime errors, or
  horizontal overflow at rest;
- no more than 8 MiB of garbage-collected JavaScript heap growth and 4 MiB of
  Wasm-memory growth.

These hard regression budgets prevent sustained layout work or a single pass
from consuming more than two 60 Hz frames. A stricter 60-fps target is reported
separately at 4 ms average and 16.67 ms maximum; missing that target does not
silently weaken the cross-browser compatibility result. Neither level is a
claim that every supported device renders at 60 frames per second. Chromium
CDP supplies explicit garbage collection for the JavaScript heap measurement.
`npm run audit:orbit:safari` and
`npm run audit:orbit:firefox` apply the same interaction, layout, DOM, Wasm,
scheduler, error, and overflow gates through each browser's real WebDriver.
The Firefox command expects a compatible `geckodriver` on `PATH`. Safari and
Firefox WebDriver do not expose a comparable explicitly garbage-collected
JavaScript heap measurement. Native shells, assistive technology, and
representative low-end physical hardware still require separate evidence.

Run the browser performance commands sequentially. Concurrent browser runs
compete for CPU and make wall-clock layout thresholds measure test contention
rather than the browser under audit.

Run `npm run audit:luastra-dev:public-baseline` while the published site is
reachable to compare cold Chromium navigation and the documentation handoff
between `https://luastra.dev/` and the current private source candidate. The
report separates encoded transfer bytes from decoded resource bytes because
GitHub Pages applies HTTP compression while the local preview does not. It also
records DOM, JavaScript heap, style, layout, and task measurements. Navigation
timings remain observational because one side uses the public network path, and
the documentation interaction is intentionally asymmetric: the published
baseline already opens as documentation while the candidate transitions from
Orbit. Ratios from this audit are evidence for investigation, not standalone
release budgets.

Use `npm run audit:luastra-dev:public-baseline:firefox` and
`npm run audit:luastra-dev:public-baseline:safari` for the corresponding real
browser engines. WebDriver cannot force an equivalent empty subresource cache
in both engines, so these reports attach a unique document query to each cycle,
record cache-visible resource sizes, and state that limitation explicitly.
Use `firstNavigationResourceRatio` for resource-weight comparison because
WebKit may omit cached subresource sizes from later Performance entries.
Paint Timing is recorded when the engine exposes it and otherwise remains zero
with `paintTimingAvailable: false`; it is never inferred from load timing.
Each sample uses a separate retained tab so repeated measurement does not turn
page teardown into part of the navigation result. Background tabs remain idle
under the same scheduler invariant covered by the Orbit performance gates.

At a 363 x 479 CSS-pixel viewport, used as the reflow equivalent of doubling
the current browser scale, the reference switches to list mode and keeps the
page, nodes, Focus Surface, sticky header, and controls free of horizontal
content overflow across all eleven themes. This verifies the resulting layout;
native browser zoom and platform text-enlargement controls still require their
own host-specific accessibility pass.

The host captures an activated node's geometry before the semantic UI commit.
Nested constellations then use that point as the camera origin. Opening and
closing a Focus Surface animate the actual semantic dialog between the source
node and its final geometry; they do not create a duplicate interactive tree.
When a destination constellation is created on demand instead of being
retained ahead, the host animates that new semantic layer from the activated
constellation or cluster node. Returning from a dense list animates the
reappearing parent from its behind state. This preserves the same directional
grammar without retaining unrelated dense branches merely to prime CSS.
The geometry animation is short-lived, cancels cleanly when state changes, and
is skipped for direct or history-restored routes that have no current origin.
Resize invalidates the in-flight geometry and resolves to the authoritative
semantic state instead of continuing toward stale coordinates. Cancellation
settles cleanup synchronously and idempotently, so a late animation promise
cannot remove state belonging to a newer transition.
`orbitMotion = "off"` and the system reduced-motion preference bypass both the
camera transition and the JavaScript-owned Focus Surface animation.

The build already compiles Luau modules to deterministic bytecode. Build-time
HTML snapshots are intentionally not part of this first Orbit slice: they need
an integrity-covered snapshot format and hydration contract so a stale static
tree cannot diverge from the first Luau render. That optimization should be
introduced as a separate measured feature.

See `examples/constellation-orbit` for nested constellations, an authored
relationship graph and cluster, a 48-item list/search stress case, live theme
selection, Focus Surfaces, and application-owned navigation state.
