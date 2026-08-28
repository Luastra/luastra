# Phase 5 Tauri desktop host

This repository-owned host consumes the same generated web package used by the
Capacitor media conformance fixture. Application authors do not edit Rust or
generated desktop files during normal Luastra work.

Pinned inputs:

- `@tauri-apps/cli` 2.11.4;
- `tauri` 2.11.5;
- `tauri-build` 2.6.3;
- Rust MSRV 1.77.2.

`npm run web:sync` replaces the ignored `www/` tree with the current
`dev.luastra.media-player` web artifact and writes a bounded host receipt.
`npm run build` creates the unsigned native executable without claiming an OS
installer, signing or notarization result. Those remain release-channel gates.

`npm run compliance` regenerates the locked Cargo CycloneDX SBOM and exact
third-party notices. The repository test
`prototype/tests/tauri-host-closure.mjs` rejects version drift, broader Tauri
capabilities, remote-content CSP expansion, a missing license text or an
incomplete SBOM. The pull-request workflow then builds and launches the native
host on macOS ARM64, Linux x64 and Windows x64.

## Legacy Linux WebKit compatibility

The normal executable remains the default on supported Linux hardware. If an
older x86-64 CPU causes `WebKitWebProcess` to terminate with `invalid opcode`
inside JavaScriptCore, and an older GPU also produces black or stale window
contents, use the opt-in compatibility launcher after a release build:

```sh
./scripts/run-linux-webkit-compat.sh
```

It disables JavaScriptCore JIT and WebKit accelerated compositing only for that
process. This is a compatibility fallback with a performance cost, not a
project-wide runtime default.
