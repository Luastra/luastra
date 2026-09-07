# Luastra SDK Reference dogfood application

Source for the English Luastra-native documentation application for
`0.2.0-alpha`. It deliberately uses the same SDK that it documents and serves
as both the `luastra.dev` source and a web-application dogfood fixture. The
immutable `0.1.0-alpha` release remains available as a separate historical
rollback boundary.

## What is here

- `src/main.luau` owns full-content search, navigation, detail pages, curated
  related-page links, sequential Previous/Next navigation, section and
  detail-example copy feedback, versioned preferences, and live examples.
  Canonical hash routes and opaque History state keep direct links, reloads and
  browser Back aligned with the rendered Luau state.
- `src/landing.luau` owns the Constellation Orbit product map, its compact
  modal theme picker and the single-icon Motion preference control.
- `src/examples.luau` contains compiled examples that really execute in the
  current runtime. Documentation text is never evaluated as Luau.
- `src/reference-data.luau` is generated from the versioned human-readable
  content in `../site/reference-data.js`.
- `scripts/generate-reference-data.mjs` creates the Luau snapshot and rejects a
  public SDK symbol without exactly one complete detail page. It also emits
  bounded related-page and same-section sequence metadata; weak inferred
  relationships are omitted instead of padding the list with unrelated links.
- `tests/reference-data.luau` protects the 95-function/component and 60-exported-type inventories, candidate SDK
  identities, tutorials, learning path, and per-component page contract.

Each public UI component has its own page with a signature, purpose and mental
model, exact supported parameters, child/layout rules, accessibility notes,
common mistakes and a copyable example. Shared parameter groups remain linked
for deeper explanation but are not a substitute for the component-specific
table.

Every public SDK function and exported type must additionally document what to
declare or import before use, where it belongs in the application lifecycle,
what result or event follows, how bounded failures are handled, and whether the
contract is part of the current release or requires host-specific
verification. Focused snippets are not labelled as standalone runnable apps;
complete workflows live in the tutorials and module-level examples.

The Beginner tutorial, Advanced tutorial, and Build recipes go further: every
admitted checked project includes a full manifest, entry module, behavior test,
commands, expected interaction, and evidence boundary.
`../scripts/validate-recipes.mjs` extracts those displayed files into temporary
projects and requires both `luastra check` and `luastra test` to pass.
`../scripts/validate-typing-examples.mjs` also materializes every Luau typing
example as a strict project and requires the real analyzer to accept it.

## Local workflow

From this directory, using the current repository SDK:

```sh
node ../../cli/luastra.mjs check --project=luastra.json
node ../../cli/luastra.mjs test --project=luastra.json
node ../../cli/luastra.mjs run --project=luastra.json
node ../../cli/luastra.mjs build web --project=luastra.json
```

From the repository root, `npm run audit:luastra-dev:chromium` runs the
candidate-specific responsive and accessibility matrix in real headless
Chromium. The gate covers the documented desktop, tablet, short-landscape and
phone viewports, every Orbit theme, minimum target sizes, icon rendering,
the canonical brand lockup, Focus Surface bounds, keyboard-only navigation,
emulated forced colors and emulated reduced motion. Its evidence boundary does
not include real browser zoom, assistive technology or another browser engine.

`npm run audit:luastra-dev:firefox` and
`npm run audit:luastra-dev:safari` run the corresponding real-engine
WebDriver matrix for the migrated site. They cover representative desktop,
tablet, short-landscape and narrow windows, every Orbit theme, Focus Surface
geometry, minimum target sizes, documentation reflow, and the canonical brand
asset. WebDriver window-manager minimums are recorded explicitly and are not
presented as exact phone-device emulation. Firefox requires `geckodriver` on
`PATH`; Safari requires macOS with Safari Remote Automation enabled.

The macOS wrapper and its build commands live in
`..`. Production deployment is controlled by the
repository-level GitHub Pages workflow, not by this application project.

## Addressable routes

- `#/` opens the Orbit landing constellation.
- `#/product` and `#/examples` open child constellations.
- `#/product/:topic`, `#/examples/:example`, and `#/about/:topic` open Focus
  Surfaces directly.
- `#/docs/:section` opens one conventional documentation section.
- `#/reference/:page` opens one API-reference page using its encoded page ID.

The previous `#docs/content` location remains a compatibility alias for
`#/docs/overview`. Unknown routes and unknown reference page IDs do not enter
application state.

The project manifest also supplies bounded production web metadata. A web
build emits the canonical root URL, search and social descriptions,
`robots.txt`, `sitemap.xml`, and a no-script summary. Hash routes remain
application locations rather than independently indexable documents.

The application stores `orbit-preferences` and `docs-theme` through the public
host storage capability. Presentation preferences never enter route or History
state.
