# Luastra 0.4.0-alpha

This release adds project-authored web startup screens.

- An optional `startup.entry` in `luastra.json` selects a separate Luau module.
  Its `render()` and optional `renderFailure()` functions run during the web
  build and produce initial HTML and external CSS through the Luastra renderer.
- Startup admits Screen, Column, Row, Text, Image, Shape, Divider and HTTPS
  Link, with existing typography and declared assets. Failure screens may also
  use Button with `onTap = "startup.retry"` for a platform-owned document reload.
- A restricted build-time VM profile removes OS/environment access, coroutines,
  GC controls, host capabilities and nondeterministic library functions before
  project dependencies execute. Memory budgets and external termination bound
  execution. Startup bytecode and author JavaScript are not shipped.
- The host removes the screen after application initialization. Failed loading
  reveals the prebuilt failure screen; disabled JavaScript leaves an explanatory
  notice and usable links. Projects without startup retain their existing flow.
- The reference website authors its branded loading and failure states in Luau.
  Its 365 static documentation pages remain independent of the startup screen
  and VM. Documentation now covers startup authoring and the project manifest.
- Literal replacement characters in startup text are preserved during HTML
  insertion. Orbit focus buttons retain readable, centered labels.
- Source SDK contract 15 is unchanged; the runtime advances to phase5-alpha-9.

This is a web startup feature, not hydration, general static-fragment reuse or
a native pre-WebView splash screen. Motion and general event handlers are not
admitted; startup uses one authored palette. Earlier visible content does not
establish faster VM startup. Native behavior retains its existing evidence
boundaries. Alpha APIs may change; published earlier archives remain immutable.
