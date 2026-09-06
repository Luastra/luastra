# Changelog

All notable public Luastra changes will be recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases use
semantic versioning where the `0.x` series remains explicitly unstable.

## [Unreleased]

### Added

- Full-content documentation search with an explicit clear action, copy support
  for section examples, and versioned persistence for the luastra.dev Orbit,
  Motion, and documentation-theme preferences.
- Optional bounded `web` manifest metadata that produces escaped title,
  description, canonical, robots, Open Graph, and Twitter tags plus
  deterministic `robots.txt`, root `sitemap.xml`, and no-script summary in web
  builds.
- Private `luastra.dev` dogfood candidate using Constellation Orbit for the
  landing experience, product map, and real-example discovery while retaining
  the conventional searchable SDK documentation and API-reference reading
  surface, canonical direct-link hash routes with browser History restoration,
  a compact eleven-option theme picker, and a single-icon Motion control.
- English public repository, architecture, compatibility, roadmap, governance,
  support, security, and community surfaces.
- Experimental Constellation Orbit semantic UI components, deterministic
  container-, label-, bounds-, and collision-aware layout, accessible list
  fallback, bounded dense Focus Surface scrolling, Luau-owned local
  constellation search with live results and keyboard recovery,
  bounded application-authored semantic relationships and connections,
  host-selected Signal, Identity, Preview, and Focus semantic zoom with
  bounded cross-platform vector signal icons and hover/focus identity reveal,
  bounded neutral, active, success, warning, and error node statuses with
  redundant accessible text, symbols, boundaries, and forced-colors behavior,
  visible disabled and asynchronous action nodes with accessible busy state,
  live status updates, reduced-motion progress treatment, and timer-backed
  reference behavior, opt-in Orbit layout/retained-DOM diagnostics, a
  repeatable pure-layout benchmark, and bounded reference-layer retention that
  keeps only the root plus the active or most recently visited child,
  application-authored clusters with bounded count semantics, a 48-item
  reference stress constellation, keyboard navigation,
  explicit Enter/Space/Escape handling, screen-reader state semantics,
  per-constellation and direct-link focus restoration, Focus Surfaces, eleven
  tokenized themes with presentation-safe node geometry,
  persisted theme and Orbit-owned motion preferences with web first-frame
  bootstrap, contrast-checked per-theme Focus Surface palettes, sticky semantic
  Focus Surface return headers, source-origin
  camera and synchronously invalidated Focus Surface transitions,
  forced-colors fallbacks without theme hover filtering,
  compact center geometry protected from decorative relationship-layer
  ordering, bounded center-copy measure, collision-safe node corner
  affordances, readable badge rhythm, and Signal status spacing, on-demand
  constellation entry and dense-list return animation without pre-retaining
  unrelated branches, and URL/history restoration in the reference
  application.

### Fixed

- Routed locations now open at the start of the document, horizontal
  `UI.Scroll` regions no longer trap vertical page-wheel input, and links keep
  their scoped foreground contrast when hovered on accent surfaces.

### Changed

- The Beginner tutorial is now a complete checked counter project with its
  manifest, entry module, deterministic interaction test, CLI outcomes, live
  browser checklist, and first safe modification. The existing Complete
  mini-app route remains as a compatibility checkpoint and next-recipe guide.
- The Advanced tutorial is now a complete checked routed reading-list project
  that keeps typed navigation, versioned state, external-data validation, and
  asynchronous storage distinct, with deterministic and host evidence clearly
  separated.
- Every Luau typing example is now self-contained strict code checked by the
  real analyzer, with a guided exercise and field-by-field workflow for reading
  and repairing `luastra check` diagnostics.
- Concurrent `luastra run` sessions for one project now use isolated generated
  bundle directories, preventing a temporary audit preview from leaving an
  existing server alive with bundle HTTP 404 responses.
- Events and errors documentation now specifies exact UI, lifecycle, timer,
  History, URL, system Back, media, and resolve payloads with explicit
  state-preserving recovery policies and checked recipe links.

## [0.1.0-alpha] - 2026-08-28

### Added

- Luau-first project, UI, motion, timer, data, state, navigation, host, server,
  and media SDK contracts.
- Analyzer/compiler and WebAssembly Luau runtime with a versioned host protocol.
- Deterministic create, check, test, preview, conformance, bundle, and web-build
  workflows.
- Web, Tauri desktop, and Capacitor mobile hosts with bounded cross-host
  evidence.
- Reference applications for meditation, forms/data, animated catalogue,
  accessibility/IME, media, routing, and independently authored dogfood.
- Deterministic runtime packages, archives, immutable installation receipts,
  checksums, SBOMs, notices, and clean-export controls.

[Unreleased]: https://github.com/Luastra/luastra/compare/v0.1.0-alpha...HEAD
[0.1.0-alpha]: https://github.com/Luastra/luastra/releases/tag/v0.1.0-alpha
