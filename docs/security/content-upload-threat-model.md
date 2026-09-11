# Content selection and upload threat model

Status: `0.5.0-alpha` implementation boundary. This document covers the first web
image-selection and upload path. It does not certify camera capture, video,
Capacitor, Tauri, native permission behavior, resumable upload, or multi-instance
deployment.

## Assets and trust boundaries

The protected assets are the user's selected bytes and metadata, authenticated
identity, storage quota, provider credentials, signed provider URLs, committed
objects, and the availability of the host and backend. Untrusted data crosses
four boundaries:

1. A browser `File` enters the host through an input that Luau cannot inspect.
2. Luau receives only an opaque preview handle and bounded validated metadata.
3. The browser streams bytes to a same-origin Luastra upload route outside RPC.
4. The backend streams to a configured object provider and issues an opaque
   committed-object reference only after validation.

Luau, filenames, extensions, browser MIME labels, dimensions supplied by the
application, RPC payloads, upload handles, and provider responses are all
untrusted. Provider credentials and signed provider URLs must remain outside
Luau and ordinary application logs.

## Required controls

| Threat | Required control and evidence |
| --- | --- |
| Path traversal, overwrite, and enumeration | Ignore client filenames. Generate random object identifiers and reconstruct provider paths from an admitted purpose, authenticated principal, and server-owned identifier. Reject unknown purposes and identifiers before provider access. |
| Cross-user upload, commit, read, or delete | Bind every intent to the authenticated principal and purpose. Re-check the principal at upload, commit, display, and delete. Provider policies are defense in depth, not the only authorization layer. |
| Forged, replayed, or expired handle | Use high-entropy opaque handles, single successful upload and commit transitions, short local intent expiry, constant-shape errors, and remove terminal intents immediately. |
| Signed URL or credential disclosure | Create provider upload authorization only in the backend, immediately before streaming. The browser talks only to the same-origin Luastra route. Never return provider paths, URLs, tokens, or service credentials to Luau. |
| Oversized body, decompression bomb, or resource exhaustion | Enforce declared byte and pixel limits before selection, at the HTTP boundary, while streaming, and after decode. Limit pending intents, concurrent uploads, progress frequency, and cleanup work. Stop consuming and reject after a limit or cancellation. |
| MIME spoofing, scriptable content, or polyglot input | The initial surface admits raster images only. Validate magic bytes and decode dimensions on the host for UX and independently on the backend for authority. Reject SVG, HTML, archives, executables, unknown trailing structures, and metadata/type disagreements. |
| Partial upload, cancellation, crash, or provider failure | Upload into a pending object, commit only after integrity validation, delete rejected or abandoned objects on a best-effort cleanup path, and never expose pending objects through content delivery. |
| Metadata privacy | Do not expose filenames or local paths. The first slice does not promise EXIF removal, so uploaded originals must be treated as potentially containing private metadata; an explicit transcode/strip policy is required before claiming metadata sanitization. |
| Event amplification or stale progress | Coalesce progress to a bounded rate, bind it to the capability request identifier, ignore terminal/stale events, and keep progress payloads numeric and size-bounded. |
| Mutation retry ambiguity | Upload intent creation and commit are non-retryable mutations unless an application supplies an idempotency key. File transfer retry/resume is a separate future protocol. |

## Accepted risks and deferred gates

- The original raster bytes are retained; EXIF and other embedded metadata are
  not stripped in this slice. Documentation and APIs must not imply otherwise.
- Web file selection is the only admitted picker. Camera, directory access,
  clipboard images, native paths, Capacitor, and Tauri return a declared
  unsupported capability until separately implemented and tested.
- Supabase evidence covers current HTTP contracts, RLS policy contracts, and
  mocked provider integration. A real project with representative RLS and
  authenticated users is required before production certification.
- Intent state is process-local in the first implementation. It is safe for a
  single runtime but not durable across restart or shared across instances.
  Multi-instance deployment requires an external intent store and atomic state
  transitions.
- Manual assistive-technology certification remains deferred by project choice;
  automated semantics and keyboard behavior are still release gates.

Each required control above must map to an automated contract, integration, or
browser test before Slice 5 is considered complete. The final release candidate
still requires the repository-wide Daybreak scan defined by the release plan.
