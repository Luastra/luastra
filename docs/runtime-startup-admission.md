# Startup runtime admission: phase5-alpha-9

The 0.4.0-alpha source tree admits a new portable Wasm runtime.
Previously published SDK archives remain immutable.

## Source and reproducibility

Two clean Wasm-only builds used the source-build contract, Luau 0.731 commit
`f8ca77acdcb50241e3da21af663f8ef97b4b5ce4`, the admitted source archive SHA-256
`c5cd8883a49b99170d66c6e791aacb8d15e1d96c3690b0eb5dde2b0037ac0733`, and
Emscripten 6.0.6. Separate build directories produced byte-identical artifacts:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| JavaScript | 26392 | `137bd026d98675a302ca9ec24229bc73d7e68e6fc2d7b16b82e15e11a74b2c7b` |
| Wasm | 501976 | `b73ceae1cc659533e94990db5d8cfc21b9f6bedf05dce24b8a88719dd0791366` |

The native analyzer/compiler source files and admitted binaries are unchanged
from 0.3.0-alpha. Their existing four-target artifacts are reused. The new
Wasm reproducibility evidence is local macOS x64 evidence; it does not claim a
new native build or application run on Linux, Windows or macOS ARM64.

## Admission and installation

The runtime manifest and artifact matrix bind the exact new bytes. Runtime
package validators require phase5-alpha-9. Archive and installation admission
records were regenerated from verified packages for all four targets. The
archive-set content SHA-256 is
`16a52ab7670047bc2badc9279fd0461193dec716af47a67f7c1b2386b0f30131`.

On the development Mac, the runtime was installed into a fresh isolated
directory and selected through `LUASTRA_RUNTIME_SDK_ROOT`. The normal CLI built
the startup example successfully. Repository-runtime and installed-runtime
builds produced identical web file inventories and bytes. No user installation
or published release archive was replaced.

The standard test command includes real-Wasm restricted-execution and web-export
tests. The release candidate passed SDK installation and web-build checks on
macOS ARM64/x64, Linux x64 and Windows x64, plus bounded Tauri host probes.
The startup change received a source-level security review and targeted tests;
this is not an exhaustive upstream Luau or binary audit. Loading and failure
screens and reference integration are implemented; automatic startup themes
are intentionally outside this release.
