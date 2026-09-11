# Build-time startup screens (0.4.0-alpha)

A startup screen belongs to a Luastra project. It is not a website template.
Declare a separate module and select it in the optional manifest field:

```json
"startup": { "entry": "app/startup" }
```

The module returns a table with `render(): UI.Node`. It uses existing Luastra
components and returns one Screen. The web build compiles its dependency closure
separately, executes it in the restricted VM and exports the resulting renderer
tree to initial HTML plus `startup.css`. The startup bundle is deleted with the
build workspace. It is never included in the application's browser bundle.

Supported components: Screen, Column, Row, Text, Image, Shape, Divider and Link.
Use existing spacing, layout, color and TextStyle options. Images and fonts must
be declared project assets. Startup images load eagerly. Links require HTTPS;
application hash routes need a running application and are rejected. Configure
document metadata through the project's `web` field, not startup Screen props.

Use the existing `UI.Link { ..., external = true }` option to keep the application
loading while a visitor reads another page. It exports `target="_blank"` and
`rel="noopener noreferrer"` in static HTML, without JavaScript. The browser and
visitor preferences determine whether the new browsing context is a tab or a
window. Indicate this behavior in the link text or accessible label.

No author JavaScript, raw HTML/CSS, callbacks or Motion are exported. Functions,
loops and imported helpers execute at build time under the same restricted
profile. Unsupported output fails the build. The original successful output is
preserved if execution, asset admission or HTML generation fails.

HTML export consumes the platform renderer's normalized components and shares
dynamic style conversion with the DOM adapter. Styles are external, compatible
with `style-src 'self'`; text and attributes are escaped. Startup IDs are
namespaced to keep them separate from application IDs. No additional npm runtime
dependency is introduced.

The host removes its startup container after lifecycle initialization and the
first render/paint gate. On bootstrap failure the prebuilt failure screen replaces the loading content.
It moves keyboard focus to an alert, presents a retry button and retains technical
diagnostics in the host error record instead of showing a stack trace to visitors.
Retry reloads the document, creating a new JavaScript/Wasm session. Projects
without a startup screen retain their existing error presentation. A no-script
notice explains why the application cannot start while HTTPS links remain usable.

Without renderFailure, the fallback is platform-provided, with English copy and a fixed light
palette. Automatic theme selection is intentionally outside 0.4 scope; this does not introduce callbacks or JavaScript into startup modules.

## Development verification boundary

The integration passes real-Wasm export tests, deterministic output checks,
manifest rejection tests and rollback checks. The example at
`examples/startup-screen` has been checked in a browser both without the main
module and with the running counter after startup removal.

The current source SDK admits the startup-capable phase5-alpha-10 runtime.
The normal CLI works with the repository runtime or an independently installed
and verified runtime. The temporary `startupRuntimeModulePath` injection has
been removed. Published SDK archives remain unchanged. See
[runtime admission](runtime-startup-admission.md).

```sh
node cli/luastra.mjs build web --project=examples/startup-screen/luastra.json
node --test platform/tests/startup-execution.mjs platform/tests/startup-web.mjs
```

Native pre-WebView splash screens, CSS Motion export and arbitrary reusable
static fragments remain outside this initial web implementation.

## Reference website

The website declares its own `app/startup` module in
`website/app/src/startup.luau`. Its mineral palette, original raster logo,
layout, copy and external documentation link use the same admitted SDK as other
projects. This first design uses a fixed light palette; automatic theme selection is intentionally deferred. The website now also authors its failure screen.

The documentation prerender removes the startup container and stylesheet from
every static document. Those pages are already usable without starting the VM.
The website build validator rejects any remaining startup overlay or stylesheet.

## Authoring the failure state

Export an optional `renderFailure(): UI.Node` alongside `render()` from the
startup module. Both execute at build time in separate restricted VM sessions;
module state is not shared between them. The failure function receives no
runtime error, storage value or host capability. A malformed export or an
invalid tree fails the build transaction. Omitting it selects the default.

The failure tree admits the same components plus `UI.Button` with exactly
`onTap = "startup.retry"`. Its label, placement and admitted styling belong to
the Luau project; the platform owns full-document reload. Other actions, Motion
and event handlers remain rejected. Normal application SDK behavior is unchanged.
The two states have distinct HTML ID namespaces, so authored IDs may be reused.
See the website module and the Startup screens reference section for examples.
