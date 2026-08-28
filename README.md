# Luastra

**Build apps like games.**

Luastra is a Luau-first application platform for building web, desktop, and
mobile applications from one host-neutral project. Application code owns the
UI tree, state, routes, events, timers, media commands, and server declarations;
Luastra supplies the checked SDK, runtime, renderer, and admitted host adapters.

> **Release status:** `0.1.0-alpha` is an early public-source release. APIs may
> change, and no signed installer, store release, production service, or
> production-stability guarantee is included.

## Why Luastra

- Write strict Luau instead of maintaining separate HTML, CSS, JavaScript,
  Swift, Kotlin, and Rust application implementations.
- Describe semantic, responsive UI with a small typed component model.
- Use event-driven motion and timers without a permanent game loop.
- Share navigation, versioned state, validation, media, and typed server
  contracts across hosts.
- Build deterministic web output and host packages from integrity-checked SDK
  artifacts.
- Keep user applications and generated content under the user's chosen terms.

## A small Luastra application

```luau
--!strict

local UI = require("luastra/ui")

local interactions = 0
local Application = {}

function Application.render()
    return UI.Screen {
        id = "app",

        UI.Column {
            id = "welcome",

            UI.Text {
                id = "title",
                text = `Build apps like games. Interactions: {interactions}`,
                variant = "title",
            },

            UI.Button {
                id = "continue",
                text = "Continue",
                onTap = "increment",
            },
        },
    }
end

function Application.handle(action: string, target: string, _value: string)
    if action == "increment" and target == "continue" then
        interactions += 1
    end
end

return Application
```

## Quick start

Luastra requires Node.js 24 or newer. Download the bootstrap installer and let
it select and verify the SDK archive for the current host:

```sh
curl -fsSLO https://github.com/Luastra/luastra/releases/download/v0.1.0-alpha/luastra-install.mjs
node luastra-install.mjs \
  --manifest=https://github.com/Luastra/luastra/releases/download/v0.1.0-alpha/luastra-release.v1.json
```

Add `~/.luastra/bin` to `PATH` if necessary, then use the installed CLI without
a repository checkout:

```sh
luastra create hello-luastra
cd hello-luastra
luastra check
luastra test
luastra run
```

Open the local URL printed by `luastra run`. Use `luastra build web` to create a
static web build. See the [installation and verification guide](./docs/installation.md)
for offline installation, checksums, `doctor`, updates, rollback, and removal.

## Documentation

The complete version-bound SDK reference, Luau onboarding, tutorials, and live
examples are published at [luastra.dev](https://luastra.dev). The website is
itself a Luastra application built from
[`website/app`](https://github.com/Luastra/luastra/tree/main/website/app).

## Alpha scope

The bounded source alpha includes:

- project creation, analysis, tests, preview, conformance, and web builds;
- semantic UI, responsive layout, typed resources, shapes, images, themes,
  motion, timers, accessibility, and IME-safe inputs;
- routes, browser history, versioned persisted state, and lifecycle events;
- typed data validation and project-owned server-function declarations;
- local data providers plus a bounded Supabase adapter boundary;
- media queues, background-audio adapters, and host media controls;
- deterministic runtime packages, archives, checksums, SBOMs, and notices;
- web, Tauri desktop, and Capacitor mobile host sources and validation evidence.

This alpha does **not** claim production stability, signed installers, app-store
availability, an automatic updater, production hosted services, arbitrary
remote Luau execution, or support for Location, Notifications, or Payments.
See [compatibility and limitations](./COMPATIBILITY.md) before adopting it.

## Project map

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — layers, ownership, and trust boundaries.
- [`COMPATIBILITY.md`](./COMPATIBILITY.md) — exact alpha host and feature matrix.
- [`ROADMAP.md`](./ROADMAP.md) — ordered work after the first source alpha.
- [`CHANGELOG.md`](./CHANGELOG.md) — public release-facing changes.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — contribution workflow and validation rules.
- [`SECURITY.md`](./SECURITY.md) — supported versions and vulnerability reporting.

The repository uses product-oriented directories such as `cli/`, `sdk/`,
`platform/`, `hosts/`, `templates/`, `examples/`, `docs/`, and `tests/`.
Internal research phases, planning records, private evidence, and owner-only
dogfood work are not part of that public tree. This repository starts from one
reviewed, deterministic export rather than exposing private research history.

## Contributing and support

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before proposing a change. Commits
require a Developer Certificate of Origin sign-off. Use [`SUPPORT.md`](./SUPPORT.md)
for questions and reproducible defects, and follow [`SECURITY.md`](./SECURITY.md)
for vulnerabilities. Community participation is governed by
[`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## Licensing

Project-owned platform code and technical documentation are licensed under the
[Apache License 2.0](./LICENSE). Luastra starter fragments are licensed under
0BSD. User-authored applications remain owned by their respective rights
holders. The Luastra name and brand assets are reserved. See
[`LICENSING.md`](./LICENSING.md), [`NOTICE`](./NOTICE),
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md), and
[`TRADEMARKS.md`](./TRADEMARKS.md) for the complete boundary.
