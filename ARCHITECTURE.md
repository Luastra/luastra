# Luastra architecture

This document describes the Luastra source architecture, including the
`0.5.0-alpha` release. It is a map of responsibilities, not a promise that every
possible host or integration is already supported.

## Design objective

Luastra lets an application author express ordinary application behavior with
the directness familiar from game development while retaining semantic UI,
accessibility, deterministic builds, and host-native capability boundaries.

```text
Luau application
  -> typed luastra/* source SDK
  -> checked render tree, events, routes, state, media, and RPC descriptors
  -> Luau VM + versioned host protocol
  -> semantic renderer and capability adapters
  -> browser / Tauri / Capacitor / local or remote providers
```

## Layers and ownership

### Application project

The project owns `luastra.json`, Luau sources, tests, assets, and optional
server declarations. Application code imports only public `luastra/*` modules.
It must not edit generated web, JavaScript, Rust, Swift, Kotlin, or host files.

### Source SDK

The source SDK provides strict Luau modules such as `luastra/ui`,
`luastra/app`, `luastra/resource`, `luastra/collection`, `luastra/motion`,
`luastra/navigation`, `luastra/state`, `luastra/data`, `luastra/server`,
`luastra/media`, and `luastra/timer`. Constructors validate their public tables
and lower host-facing values to a bounded transport representation. Application
composition and asynchronous state remain pure Luau and do not create a second
renderer or runtime model.

### Reusable libraries

Checked Luastra libraries package ordinary Luau modules, assets, and
conformance tests without extending the renderer protocol. Applications build
domain-neutral blocks such as application bars, empty states, avatars, and
paged-list presentations from the same small `luastra/*` primitives used by
project code. Each library is bound to an exact SDK range, capability set,
dependency graph, file ledger, license, notice, version, and content digest.

Libraries are build-time inputs, not runtime plugins. The CLI admits only a
local source directory or immutable `.luastra-library` archive, installs it
transactionally beneath the project, and records the exact closure in
`luastra.lock.json`. There is no install hook, remote resolver, floating
version, or application-time network load.

### Runtime and protocol

The Luau analyzer, compiler, and WebAssembly VM execute admitted project
modules. A versioned, allowlisted protocol moves render trees, actions, motion,
capability requests, and results across the VM/host boundary. Unknown commands,
malformed payloads, and unsupported capabilities fail closed.

### Renderer

The renderer materializes semantic host UI, owns element identity, reconciles
successive trees, preserves input composition and selection, manages focus and
modal boundaries, and applies motion without re-running the Luau application on
every animation frame.

### Host adapters

- The web host uses the browser DOM, History, storage, media, and accessibility
  APIs.
- The desktop host packages the same web artifact with Tauri and a restrictive
  local-content policy.
- The mobile host packages it with Capacitor and repository-owned native
  adapters where background media, secure credentials, lifecycle, or system
  Back behavior require native integration.
- Provider adapters implement local or remote data and identity behind the
  same project-facing contracts. Vendor SDK objects do not enter public Luau
  application code.

## Render and event model

The composed `app.render()` returns a fresh declarative tree after an application
event changes state. The host reconciles that tree with the current host UI.
`app.handle()` receives bounded actions and updates application state.
`luastra/app` can compose independently reusable feature instances into that
same app contract. It routes target namespaces, owns asynchronous
request correlation, and suppresses results from cancelled or disposed owners.
New applications use `App.compose` as their single authoring entry point.
There is no second application object. Application-owned test state is exposed
through `snapshot`; bounded framework diagnostics remain separate under
`inspect`.

`luastra/resource` provides typed read and mutation state machines, while
`luastra/collection` retains a bounded cursor-paged data window. Neither module
performs I/O. Repositories and admitted host capabilities issue requests; the
application resolves their results into these pure state machines.

`luastra/content` keeps selected files and provider details outside Luau. The
web host validates a browser-owned file and exposes only an opaque preview
handle. A server-created, principal-bound intent authorizes one same-origin
stream outside the RPC envelope; the backend independently validates and
commits it through a local or Supabase adapter. Applications continue to render
the result with the universal `UI.Image` component.

Motion descriptors are registered against renderer-owned element identities.
The host scheduler requests frames only while motion is active and updates the
targeted host properties directly. Timers produce ordinary application events;
they do not introduce an always-running game loop.

## Determinism and distribution

Project checks, bundles, web builds, runtime packages, archives, and clean
exports use canonical ordering and SHA-256 ledgers. Runtime artifacts are tied
to exact source-build and host identities. Installation uses a new immutable
prefix and an admitted receipt; a corrupt or incompatible SDK does not fall
back silently to repository files.

Locked libraries participate in the project digest. Their verified module,
asset, test, dependency, capability, license, and notice closure is emitted as
deterministic project-library metadata, notices, and SPDX evidence.

The future public repository will start from one audited clean export. Private
research history, credentials, device evidence, and local paths are not part of
that public history.

## Security boundaries

- The browser-visible application never receives provider secret keys.
- Authenticated identity and authorization decisions are enforced server-side.
- Private media grants are short-lived and protected content is online-only in
  the bounded alpha policy.
- Persisted navigation and UI state must not contain credentials or provider
  tokens.
- Browser filenames, local paths, provider upload URLs, and access tokens do not
  cross into Luau; image upload authorization is opaque, expiring, purpose- and
  principal-bound, and create-once.
- Native capabilities require explicit project declarations and admitted host
  implementations.
- A green build is not equivalent to production deployment approval.

See [`SECURITY.md`](./SECURITY.md), [`COMPATIBILITY.md`](./COMPATIBILITY.md), and
the version-bound public SDK documentation for detailed contracts and remaining
limits.
