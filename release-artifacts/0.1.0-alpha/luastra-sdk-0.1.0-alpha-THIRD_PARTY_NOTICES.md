# Luastra SDK third-party notices

This notice bundle applies to the downloadable Luastra SDK `0.1.0-alpha`
archives. The archives contain Luastra project code, starter templates, Luau
native developer tools, and the Emscripten-generated Luau WebAssembly runtime.

## Luau 0.731

License: MIT. Copyright notices identify Roblox Corporation and Lua.org,
PUC-Rio. The analyzer, compiler, and WebAssembly VM are built from pinned
commit `f8ca77acdcb50241e3da21af663f8ef97b4b5ce4`.

Source: <https://github.com/luau-lang/luau/tree/0.731>

The complete license text is retained as `licenses/Luau-0.731-LICENSE.txt`.

## Emscripten 6.0.6 generated runtime

License choice: MIT or University of Illinois/NCSA. The generated runtime also
retains the applicable musl, libc++, libc++abi, compiler-rt, and libunwind
license or copyright texts. The generated JavaScript carries the Emscripten
SPDX MIT header.

Source: <https://github.com/emscripten-core/emscripten/tree/6.0.6>

The exact seven-file runtime license bundle is described by
`runtime-license-bundle.v1.json` and is also available as a separately
checksummed release asset.

## Excluded development and host dependencies

The SDK archives do not contain the Tauri desktop host, Capacitor mobile host,
Supabase CLI, npm development dependencies, Rust crates, Android Maven
artifacts, or Apple Swift packages. Their notices and SBOMs remain part of the
source distribution rather than this SDK binary archive set.
