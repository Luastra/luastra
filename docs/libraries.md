# Reusable Luastra libraries

Luastra libraries are checked, local, immutable inputs to an application build.
They are not runtime plugins and never download code from a registry, CDN, or
marketplace. A library can export ordinary Luau modules, assets, and conformance
tests while using the same public `luastra/*` SDK as application code.

This keeps the core small. Domain-neutral compositions such as `AppBar`,
`BottomNavigation`, `Avatar`, `AsyncBoundary`, `PagedList`, `EmptyState`, and
`RetryState` can be assembled from `UI.Row`, `UI.Column`, `UI.Button`,
`UI.Icon`, `UI.Image`, and `UI.List` without adding those composition names to
the renderer protocol.

## Source format

A source directory contains `luastra-library.json` plus every declared file.
The version 1 manifest records:

- a DNS-style library ID and semantic version;
- the compatible SDK contract range;
- required application capabilities;
- exact library dependencies by ID, version, and content digest;
- exported modules and the exact dependency list of every module;
- assets with media type and SHA-256;
- conformance test module IDs;
- SPDX license metadata and notice files.

Every `require` in a library source must use a literal module ID and must match
the module's declared dependencies exactly. Library modules may depend on the
public `luastra/*` namespace or on modules inside the same library. A dependency
on another library additionally requires an exact library dependency record.
Dynamic or undeclared imports fail `library check`.

## Commands

Check source or an already packed archive:

```sh
luastra library check ./my-library
luastra library check ./my-library-1.0.0.luastra-library
```

Create a canonical immutable archive:

```sh
luastra library pack ./my-library --out=./dist/my-library-1.0.0.luastra-library
```

Install it into a project, update to an explicitly supplied package, or remove
it:

```sh
luastra add ./dist/my-library-1.0.0.luastra-library --project=./my-app
luastra update ./dist/my-library-1.1.0.luastra-library --to=1.1.0 --project=./my-app
luastra remove dev.example.my-library --project=./my-app
```

`update` deliberately requires both an immutable local input and the expected
version. There is no hidden resolver or network registry. All commands accept a
project directory or its `luastra.json` path through `--project`.

## Lockfile and installed closure

Installation writes exact file hashes and the package content digest to
`luastra.lock.json`. Verified files are materialized beneath:

```text
.luastra/libraries/<library-id>/<exact-version>/
```

The lockfile and installed directory are build inputs. Commit both when the
project must build from a fresh checkout without a separate install step, or
retain the immutable `.luastra-library` archive in the project's controlled
dependency cache and reinstall it offline before building.

Builds fail before analysis when a locked file is missing or modified, the SDK
range is incompatible, a capability is absent, an exact dependency differs, or
a library module or asset collides with application-owned content. Installation
and lock replacement are staged. A rejected package or failed update preserves
the previous lock and installed version. Removal is rejected while another
locked library depends on the target.

## Build evidence and attribution

A build containing libraries emits:

- `project-libraries.json` — exact identity, version, digest, capabilities,
  dependency, license, and notice closure;
- `PROJECT_LIBRARY_NOTICES.md` — concatenated application-distribution notices;
- `project-library-sbom.spdx.json` — deterministic SPDX 2.3 package records.

These records contain no source-machine paths. The library closure also
participates in the project content digest, and library conformance tests run
with `luastra test` in every consuming project.

## Universal Blocks proof

[`libraries/universal-blocks`](../libraries/universal-blocks) is the first
domain-neutral example. The identical `1.0.0` archive is locked by both
[`test-fixtures/library-catalogue`](../test-fixtures/library-catalogue) and
[`test-fixtures/library-activity-log`](../test-fixtures/library-activity-log).
Neither fixture adds host CSS or application-specific core APIs.

The source package is included in every 0.5.0-alpha SDK archive under
`libraries/universal-blocks`, and its Apache-2.0 identity appears in the SDK
SBOM. It remains an ordinary library input rather than an implicitly loaded SDK
module; applications choose whether to pack or install it.

The proof is intentionally a library, not core. Applications can copy its
composition style, install it as-is, or build another package from the same
small semantic primitives.

The real-browser acceptance gate is:

```sh
node scripts/audit-library-blocks-chromium.mjs
```

It executes both fixtures through Luau, Wasm, the web renderer, and headless
Chromium while stressing narrow and short layout, 200% root text, a long
localized label, keyboard focus, minimum control targets, sticky placement,
dark preference, forced colors, and reduced motion. It is automated browser
evidence, not manual VoiceOver or NVDA certification.

## Current limits

- Sources are local directories or `.luastra-library` archives only.
- Publisher signatures and a marketplace trust policy are deferred. The
  content digest proves integrity, not author identity.
- Libraries cannot execute installer scripts or request undeclared host
  capabilities.
- Video and native-widget packages are separate future work.
- Manual VoiceOver and NVDA certification remains deferred; automated semantic,
  focus, keyboard, IME, forced-colors, and responsive tests still apply.
