# Luastra `0.5.0-alpha` compatibility

This matrix distinguishes verified source-alpha evidence from distribution or
production claims. `Verified` means the named path passed the repository's
bounded tests; it does not imply signing, store admission, or support for every
device and operating-system version.

## Development hosts

The immutable runtime SDK selects only the following admitted host identities:

| Host | Architecture | Alpha status |
|---|---|---|
| macOS | Apple Silicon (`arm64`) | Verified in clean CI and local dogfood |
| macOS | Intel (`x64`) | Verified runtime/tool host |
| Linux | `x64` | Verified in clean CI |
| Windows | `x64` | Verified in clean CI and physical-host dogfood |

Node.js 24 or newer is required by the source and contributor workflow.
Linux ARM, Windows ARM, and other host combinations are not admitted in
`0.5.0-alpha` even if an upstream tool happens to provide binaries for them.

## Application targets

| Target | Verified alpha surface | Explicit limit |
|---|---|---|
| Web | Deterministic static build; Chromium and Safari execution; semantic DOM, History, storage, media, accessibility, IME, responsive layout | Serve over HTTP(S); opening the build through `file://` is unsupported |
| macOS desktop | Tauri ARM64 clean build/launch; additional Intel physical-host dogfood | Unsigned; no notarized installer or updater |
| Linux desktop | Tauri x64 clean build and WebKitGTK launch | Unsigned; distribution-specific packaging is not promised |
| Windows desktop | Tauri x64 clean build/launch and physical Windows 11 dogfood | Unsigned; no MSIX/store installer or updater |
| Android | Capacitor build, emulator and physical Pixel validation including Back, lifecycle, accessibility, IME, secure credentials, and background media | No Play Store package or production App Links claim |
| iOS | Simulator and physical iPhone validation including lifecycle, accessibility, IME, secure credentials, and background media | Requires developer tooling/signing; no App Store package or Universal Links claim |

## Capability status

Available in bounded alpha form:

- semantic UI and responsive layouts;
- themes, images, shapes, layers, flip cards, motion, and timers;
- controlled text input, composition, focus, modal, and screen-reader behavior;
- validation, versioned state, routes, browser history, and lifecycle events;
- typed server functions, local data, and provider-neutral identity/data seams;
- media queues, background playback adapters, and system media controls;
- browser PNG/JPEG selection, opaque previews, bounded upload progress and
  cancellation, and provider-neutral private-image commit/open/delete;
- local reusable-library source and immutable archive admission, exact project
  locks, transactional install/update/removal, offline reinstall, conformance
  tests, and deterministic attribution/SBOM output;
- feature composition with unambiguous asynchronous request ownership;
- bounded Resource and PagedCollection state machines with stale-result
  suppression, bidirectional cursors, stable item keys, anchors, and eviction;
- opt-in windowed `UI.List` rendering with variable-height measurement, focus
  pinning, edge backpressure, anchor restoration, and an accessible fallback;
- backend v2 nested records and structured validation plus declarative local and
  Supabase record collections;
- one typed `UI.Image` path for packaged assets, protected same-origin delivery,
  and host-local previews;
- `UI.Icon`, input completion semantics, explicit button states, modal focus
  relationships, and reusable safe-area, sticky, and overflow layout tokens;
- deterministic SDK packaging, archives, checksums, notices, and SBOMs.

Partial or intentionally bounded:

- the component inventory and complex layout primitives are not complete;
- backend deployment, operations, backup/restore, and production key management
  remain application/operator responsibilities;
- remote identity evidence is bounded and does not promise a hosted Luastra
  service;
- private protected media is online-only with short-lived grants;
- image selection/upload is web-only; native camera/library adapters, resumable
  transfer, EXIF stripping, and multi-instance upload intents are not admitted;
- Supabase upload evidence uses contract mocks; a real deployed project and RLS
  policy remain a production certification gate;
- external media accessories and broad device/OS coverage are not certified;
- manual VoiceOver and NVDA certification for image selection remains deferred;
- remote library registries, dependency solving, publisher signatures, install
  hooks, and native binary libraries are not admitted;
- inline video, autoplay policy, caption tracks, and decoder lifecycle are
  deferred to a separately admitted release;
- HTTPS App Links and Universal Links are not part of the alpha claim.

Deferred beyond this alpha:

- Location;
- Notifications;
- Payments;
- visual builders and AI application generation;
- a public marketplace;
- a remote reusable-library resolver or publisher trust service;
- production multi-tenant Luastra Cloud;
- arbitrary remote executable Luau.

## Version policy

The `0.x` series may change public APIs, project manifests, persisted-state
formats, and generated output. A change that affects stored data must include a
bounded migration or an explicit incompatibility notice. Exact support and
upgrade guarantees will be introduced only after the alpha evidence justifies
them.
