# Migrating to 0.5.0-alpha

Luastra 0.5.0-alpha is an additive alpha migration from 0.4.0-alpha. It does not
silently rewrite application source, manifests, persisted state, provider data,
or installed SDKs. Keep the older verified SDK installed until the application
passes its own checks with the new version.

## Recommended sequence

1. Install 0.5.0-alpha without removing 0.4.0-alpha.
2. Select the new SDK with `luastra sdk use 0.5.0-alpha`.
3. Run `luastra doctor`, `luastra check`, `luastra test`, and a clean web build.
4. Exercise the application's storage migrations, backend operations, empty and
   failure states, keyboard flow, responsive layouts, and host-specific
   capabilities.
5. Retain 0.4.0-alpha until the application evidence is complete. Roll back with
   `luastra sdk use 0.4.0-alpha`; do not combine files from different release
   manifests.

## Application entry and composition

Use `require("luastra/app")` and return `App.compose { ... }`. The root owns
`render`, optional `handle` or `resolve`, and `snapshot`. Feature-based
composition is opt-in: an existing flat application can use an empty feature
list and keep its root callbacks. A root `resolve` cannot coexist with composed
features because each asynchronous request must have one unambiguous owner.

When extracting a reusable feature, give it a stable lowercase path ID, place
its controls under that ID, claim each request through the feature context, and
release listeners or resources from `dispose`. Application snapshots remain
application data; `app.inspect()` is a separate bounded diagnostic view.

## Resources, collections, and lists

Existing application-owned loading state remains valid. Migrate only when the
explicit Resource or PagedCollection state machine removes duplicated logic.
The state machines reject stale tickets rather than applying out-of-order
results.

Ordinary `UI.List` behavior is unchanged. Windowing is enabled explicitly with
`mode = "windowed"` plus bounded item and overscan settings. Item IDs must be
stable across pages. Render loading, empty, stale, edge-error, retry, and end
states from collection state; do not infer them from scroll position.

## Backend v2 and record collections

Backend v1 remains available during the alpha migration window. Existing v1
operations do not become v2 automatically. Adopt v2 per versioned operation,
regenerate the checked client, and commit the generated module with the matching
declaration. Do not parse provider errors or expose provider credentials to
Luau.

Declarative record collections are opt-in manifest entries. Local and Supabase
providers share the public contract, but deployment, RLS, storage policy,
backup, restore, and deletion evidence remain operator responsibilities. Run the
included Supabase policy tests before claiming a deployed remote provider.

## Images and uploads

Packaged `Assets.Image` values remain supported by `UI.Image`. Protected remote
content and local selections add typed `Content.Image` values; they do not turn
URLs or filesystem paths into public application data. Treat `content:` and
`preview:` handles as opaque and short-lived.

Selection and upload are opt-in capabilities. Declare bounded media types,
bytes, dimensions, and upload purposes. Transfer completion and backend commit
are separate states. Release previews, cancel abandoned transfers, and clean up
expired intents. This release admits browser PNG/JPEG selection only.

## Reusable libraries

Libraries are installed from a local source directory or immutable archive and
recorded in the exact project lock. Installation is transactional and never
grants capabilities beyond the application manifest. Do not edit installed
library files or the lock by hand; update or remove through the CLI and rerun
the library conformance tests.

## Persisted data

The release does not require a global stored-data rewrite. Applications that
change their own stored meaning must increment their State schema version and
provide deterministic, tested migration steps. Unknown future versions and
invalid data must fail explicitly rather than being reinterpreted or replaced
silently.

## Intentional deferrals

Inline video, native picker/camera adapters, resumable upload, remote library
registries, publisher signatures, and production hosted services are not part
of 0.5.0-alpha. Do not add compatibility shims that imply these capabilities.
