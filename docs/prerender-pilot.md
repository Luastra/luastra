# Documentation prerendering

The accepted one-page proof now renders the complete reference: 39 sections,
320 API/guide pages and the documentation entry page. The previous standalone
article template and reader stylesheet have been removed.

Run `npm ci --prefix website`, then `npm run reference:build --prefix website`.
The complete website is in `website/luastra-site/`. `/docs/` opens the reference;
`/prerender-pilot/` remains a no-index compatibility alias for Offline installation.
The old `reference:prerender-pilot` command now runs the complete build.

## Renderer and controls

The build executes the real documentation Luau application with deterministic
startup capability responses, then uses materializeRendererTree, reconcile and
DomAdapter to produce HTML. Linkedom supplies a build-only DOM. Original Luastra
CSS and markup supply the design, and the real Luau dark theme supplies its CSS
variables. Inline theme declarations are moved to an external stylesheet.

The small `/docs/reader.js` script adds theme persistence, mobile navigation,
Escape/scrim dismissal, clipboard actions with failure feedback, and full-content
search. Copy actions retain the complete source, including split code blocks.
The theme storage key is shared with the existing Luastra documentation app.
The static article itself runs no Wasm, hydration or renderer session. An embedded
example starts its own Luastra runtime only after the reader selects Run example.

Internal reference links use ordinary static paths. The home control is a native
link to Constellation Orbit. Live examples and learning-step controls use an
on-demand iframe application built from the same app/examples module. A small
same-origin message bridge synchronizes theme colors and frame height; example
state and events remain in Luau. No frame or example runtime is loaded initially.
With scripting unavailable, content and links remain available and the mobile
navigation is shown inline; script-dependent buttons are disabled.

## Evidence boundary

The initial same-tab comparison at 1280px matched all 97 identified nodes on
Offline installation in tags, leaf text, bounding rectangles, fonts and colors.
This is a bounded visual proof, not a pixel-equivalence claim for every route.
The complete build validates each canonical path, local link and script/control
inventory. Regression tests cover renderer output, deterministic generation,
copy sources and the live-example boundary. Browser checks cover light/dark,
persistence across pages, copied text, search, mobile navigation and Orbit return.

Physical-device typography fidelity is not inferred from browser checks. Public
deployment is verified separately against the exact release commit.
