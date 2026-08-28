# Luastra third-party notices

This file describes the currently admitted `0.1.0-alpha` baseline. Exact
license texts, package hashes, and platform-specific inventories are retained
with the release and native-host compliance records. Every public release must
include the notice set applicable to its exact artifacts.

## Luau 0.731

License: MIT. Copyright notices identify Roblox Corporation and Lua.org,
PUC-Rio. Luastra's analyzer, compiler and WebAssembly VM are built from pinned
commit `f8ca77acdcb50241e3da21af663f8ef97b4b5ce4`.

Source: <https://github.com/luau-lang/luau/tree/0.731>

## Emscripten 6.0.6 generated runtime

License choice: MIT or University of Illinois/NCSA. The admitted source bundle
also retains applicable musl, libc++, libc++abi, compiler-rt and libunwind
texts. The generated JavaScript carries the Emscripten SPDX MIT header.

Source: <https://github.com/emscripten-core/emscripten/tree/6.0.6>

## Capacitor 8.4.1

Capacitor Core and the admitted native packages are MIT-licensed. The alpha
mobile host pins Capacitor 8.4.1, App 8.1.1, Preferences 8.0.1 and
`capacitor-swift-pm` 8.4.1. Each future plugin requires independent admission.

Sources: <https://github.com/ionic-team/capacitor/tree/8.4.1> and
<https://github.com/ionic-team/capacitor-swift-pm/tree/8.4.1>

## AndroidX and Media3

AndroidX Core 1.17.0 and the admitted Media3 1.10.1 modules are Apache-2.0.
The admitted Android inventory records 64 exact Maven modules, 59 AAR/JAR
artifacts, their POM evidence and embedded notice documents.

Sources: <https://github.com/androidx/androidx> and
<https://github.com/androidx/media/tree/1.10.1>

## Development-only tools

The exact alpha npm development lock contains 15 MIT-declared packages in a
separate SPDX document. Supabase CLI 2.114.0 is development-only in the current
prototype and is not represented as an application runtime.

## Tauri desktop boundary

The admitted alpha desktop host pins `@tauri-apps/cli` 2.11.4, `tauri`
2.11.5, and `tauri-build` 2.6.3. Its locked 428-package Cargo graph has a
generated CycloneDX SBOM, exact notices, and zero unresolved license texts.
Clean macOS ARM64, Linux x64, and Windows x64 builds and launches pass. This is
source-host evidence, not a signed installer, notarization, store, updater, or
production-distribution claim.

Tauri project code is MIT or Apache-2.0 where applicable; its logo is licensed
separately and is not a Luastra asset. Exact distribution artifacts must carry
the notices and SBOM generated from their own lock and feature set.
