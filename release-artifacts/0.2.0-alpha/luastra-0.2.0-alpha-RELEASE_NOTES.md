# Luastra 0.2.0-alpha

Luastra 0.2.0-alpha is a public-source prerelease focused on semantic, game-like application interfaces and a substantially clearer path from installation to a complete app. APIs may still change before beta.

## Highlights

- Constellation Orbit introduces semantic spatial navigation, nested constellations, Focus Surfaces, relationship metadata, deterministic layout, a complete list fallback, bounded signal icons, and eleven tokenized themes.
- Declarative motion remains event-driven and honors the effective reduced-motion preference without requiring an application-owned frame loop.
- The Luastra website is itself a Luastra application and now combines the Orbit product map with a conventional, searchable, page-based documentation view.
- The documentation adds guided beginner and advanced tutorials, complete checked recipes, practical example pages, stable readable API URLs, related-page navigation, exact type and error contracts, and clearer host-boundary guidance.
- Reference examples cover Orbit, an animated catalogue, meditation and media, forms and server functions, typed routing, live visuals, and structured debugging.

## SDK and tooling

- The release ships checksum-verified SDK archives for macOS arm64, macOS x64, Linux x64, and Windows x64.
- `luastra create`, `check`, `test`, `run`, `build bundle`, and `build web` use the same strict project and manifest contracts documented by the release.
- Versioned SDK management supports side-by-side installation, explicit selection, verification with `luastra doctor`, and rollback to an installed earlier release.
- Generated server clients, packaged asset references, typed navigation, versioned state, host capabilities, media commands, and declarative UI are documented from the checked source contracts.

## Compatibility and boundaries

- This is a new alpha, not an in-place rewrite of 0.1.0-alpha. Existing 0.1.0-alpha release assets remain immutable and can stay installed for rollback.
- Constellation Orbit APIs are experimental. Evaluate them against this exact SDK before depending on their shape.
- Current desktop and mobile host sources package the semantic web artifact through Tauri and Capacitor; native capability adapters do not make every UI node a platform-native widget.
- Signed desktop installers, notarization, public mobile-store packages, production backend deployment, and universal device or assistive-technology certification are not claimed by this release.
- `Assets.font` creates a typed packaged font reference, but 0.2.0-alpha does not yet expose a public text-style consumer for applying custom fonts.

## Security

- The Capacitor host uses `@xmldom/xmldom` 0.9.12, resolving GHSA-6gmq-8vp8-gcm6 in the host dependency closure.
- The Tauri GTK3 dependency closure applies the official `glib::VariantStrIter` safety backport for RUSTSEC-2024-0429 to `glib` 0.18.5. The canonical crate archive, exact upstream fix, patched-file digest, license, SBOM, notices, and release-mode Linux integration test are recorded and checked in the repository.
- These host dependencies are not embedded in the checksum-verified SDK archives; their security evidence belongs to the corresponding Capacitor and Tauri host source closures.

## Installation

Download `luastra-install.mjs`, `luastra-release.v1.json`, and the archive matching the destination host from the same GitHub Release. The installer verifies the release manifest, archive checksum, and installed-file ledger before activating the SDK. Run `luastra doctor` after installation.

Every published asset is retained with `SHA256SUMS`; the release manifest binds the host matrix, SDK content identities, SBOM, notices, license bundle, installer, and these notes.

## Retention

Published release assets are immutable. A correction receives a new version; existing bytes are never silently replaced.
