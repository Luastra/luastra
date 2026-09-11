# Startup runtime admission: phase5-alpha-10

The 0.5.0-alpha source tree admits the portable `phase5-alpha-10` Wasm runtime.
Previously published SDK archives remain immutable.

## Source and reproducibility

Two clean Wasm-only builds used the source-build contract, Luau 0.731 commit
`f8ca77acdcb50241e3da21af663f8ef97b4b5ce4`, the admitted source archive SHA-256
`c5cd8883a49b99170d66c6e791aacb8d15e1d96c3690b0eb5dde2b0037ac0733`, and
Emscripten 6.0.6. Separate build directories produced byte-identical artifacts:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| JavaScript | 26392 | `137bd026d98675a302ca9ec24229bc73d7e68e6fc2d7b16b82e15e11a74b2c7b` |
| Wasm | 502102 | `1fd2385e4a1ac32db859dd963813e420723a31dc1728664b42c7ec4283bb6c79` |

The native analyzer/compiler source files and admitted binaries are unchanged.
Their existing four-target artifacts are reused. The new Wasm reproducibility
evidence is local macOS x64 evidence; it does not claim a new native build or
application run on Linux, Windows or macOS ARM64.

## Admission and installation

The runtime manifest and artifact matrix bind the exact new bytes. Runtime
package validators require phase5-alpha-10. Archive and installation admission
records were regenerated from verified packages for all four targets. The
archive-set content SHA-256 is
`a471c31d6916d61de5b849ec8e2ee82035588cb6209dbbcd3e5c0a67dc8f6d09`.

On the development Mac, the runtime was installed into a fresh isolated
directory and selected through `LUASTRA_RUNTIME_SDK_ROOT`. The normal CLI built
the startup example successfully. Repository-runtime and installed-runtime
builds produced identical web file inventories and bytes. No user installation
or published release archive was replaced.

The standard test command includes real-Wasm restricted-execution and web-export
tests. The current source candidate passed deterministic archive and SDK
installation checks for macOS ARM64/x64, Linux x64 and Windows x64. This is not
new physical-host evidence and not an exhaustive upstream Luau or binary audit.
Loading and failure screens and reference integration remain implemented;
automatic startup themes remain outside the bounded contract.
