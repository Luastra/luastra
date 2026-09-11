# Windowed lists

`UI.List` has one optional windowed presentation mode for long, ordered
collections. It remains the same semantic list primitive; applications do not
need a separate feed, message, or infinite-list component.

```luau
local snapshot = records.snapshot()
local items: { UI.Node } = {}

for _, record in snapshot.items do
    table.insert(items, UI.ListItem {
        id = "results/items/" .. record.id,
        text = record.title,
    })
end

return UI.List {
    id = "results/items",
    label = "Search results",
    mode = "windowed",
    estimatedItemSize = 72,
    overscan = 6,
    itemCount = knownTotal,
    itemOffset = retainedStartIndex,
    startBusy = snapshot.loading == "previous",
    endBusy = snapshot.loading == "next",
    onStartReached = if snapshot.hasPrevious then "results.previous" else nil,
    onEndReached = if snapshot.hasNext then "results.next" else nil,
    table.unpack(items),
}
```

The application owns the bounded retained item set and provider cursors.
`PagedCollection` is the standard data-side companion. The web host owns the
visible window, variable-height measurements, overscan, leading and trailing
spacers, scroll anchoring, and edge observation. Provider cursors never enter
DOM events.

## Properties

- `mode = "windowed"` enables host windowing. Omit `mode` for an ordinary list.
- `estimatedItemSize` is the initial vertical block advance in CSS pixels. It
  defaults to `72` and accepts integers from `16` through `4096`.
- `overscan` is the number of retained items rendered before and after the
  visible range. It defaults to `6` and accepts integers from `1` through `64`.
- `itemOffset` is the zero-based logical position of the first retained child.
  It defaults to `0`.
- `itemCount` is optional known-total metadata. When supplied, it must cover
  `itemOffset` plus every retained child. Omit it when the total is unknown.
- `onStartReached` and `onEndReached` are ordinary Luastra action names. An
  action is emitted once for a stable retained boundary; a changed boundary can
  emit the next action.
- `startBusy` and `endBusy` independently apply backpressure. They default to
  `false`; while an edge is busy, that edge does not emit another action.

All direct children must be `UI.ListItem` nodes with stable IDs. Changing an ID
means changing the item identity and prevents reliable anchoring.

## Accessibility and fallback

The host preserves `ul`/`li` semantics and annotates realized items with their
logical position and known total. A focused item remains connected with its
nearest context until focus can move safely. When focus is far from the current
viewport, an internal gap spacer keeps both regions in logical order without
realizing every item between them. Small retained sets stay complete instead of
being needlessly windowed.

When `ResizeObserver` is unavailable, the host renders the complete bounded
retained page. This is an explicit accessible fallback, not an attempt to keep
an unbounded data set in the DOM. Applications must therefore keep their
`PagedCollection` or equivalent retention budget finite in every mode.

## Current evidence boundary

The contract, reconciliation-safe DOM controller, edge deduplication, deleted
anchor fallback, bounded disjoint focus pinning, busy-edge backpressure,
empty/one-item behavior, unsupported-`ResizeObserver` fallback, and real-Wasm
100,000-record bidirectional traversal have automated coverage. The controller
restores the latest stable anchor across measured height changes, descendant
load signals, font completion, resize, and orientation changes.

`npm run audit:windowed-list:chromium` additionally proves bounded realized DOM,
logical position metadata, backward edge reload, delayed remeasurement,
an actual delayed SVG decode, delayed same-origin WOFF2 `FontFace` load, long-label
wrapping, 200% list text, keyboard entry and activation, browser accessibility
tree reading order, polite live-status semantics, browser Back neutrality,
far-focus retention without a contiguous DOM expansion, layout-width and
orientation reflow, reduced-motion stability, and the two-pixel anchor tolerance
in real Chromium. `npm run audit:windowed-list:firefox` and
`npm run audit:windowed-list:safari` run the shared WebDriver gate for bounded
DOM and measurements, bidirectional eviction/reload, stable-anchor
remeasurement, far-focus retention, and a real browser-window resize.

The browser accessibility tree is the interface exposed to screen readers, but
the automated gate is not an owner-observed VoiceOver or NVDA session and does
not claim universal assistive-technology certification. Windowing is presentation
only and does not subscribe to browser History or native `backButton` events;
the existing browser and physical Android system-Back evidence therefore remains
owned by the navigation host. Native WebViews reuse the packaged web controller,
but native windowing performance and assistive-technology behavior have not been
separately admitted and must not be inferred from the browser results.
