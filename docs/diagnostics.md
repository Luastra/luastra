# Diagnostics and failure codes

Luastra uses structured state and bounded machine-readable codes for program
decisions. Human-readable assertion text, provider response bodies, and console
messages are not compatibility contracts and must not be parsed.

## Diagnostic surfaces

| Surface | Stable program data | Bounded context | Never included |
| --- | --- | --- | --- |
| `app.inspect()` | disposed state, feature IDs, active-request count, suppressed-result count | Lowercase feature namespaces and integer counters | request payloads, purposes, tokens, callbacks, user values |
| Resource snapshot | status, generation, request ID, retryability, error and field codes | admitted field names and code tokens | idempotency keys, mutation callbacks, server messages |
| PagedCollection snapshot | status, loading direction, generation, item and page counts, anchor key, edge errors | admitted item keys and bounded public status values | provider cursors, queries, credentials, response bodies |
| Host diagnostics | render sequence, request/task counts, memory and DOM counts, bounded collection layout summaries | semantic node IDs and numeric measurements | text, captions, filenames, URLs, local paths, binary metadata |
| Backend result | public code, bounded message, structured validation field codes | operation-safe public data only | stack traces, provider messages, secrets, access or refresh tokens |
| Content and upload result | status, request ID, byte progress, admitted metadata, bounded code | opaque `content:`, `preview:`, or `upload:` handle where required by the operation | filesystem paths, signed URLs, provider authorization, file contents |
| Library command | package identity/version, compatibility result, collision path or capability name | local package-relative names and integrity digests | credentials, arbitrary archive paths, application data |

Host diagnostics are disabled by default and are enabled for local verification
with the documented host-specific diagnostics switch. They are not production
telemetry and are not sent anywhere by Luastra.

## Stable code families

The following codes are public control-flow values in 0.5.0-alpha. A subsystem
may document a narrower subset, but it must not substitute a provider message.

| Family | Codes |
| --- | --- |
| Request and transport | `CANCELLED`, `DEADLINE`, `TIMEOUT`, `NETWORK`, `UNAVAILABLE`, `IN_FLIGHT_LIMIT`, `RATE_LIMITED` |
| Identity and authorization | `UNAUTHORIZED`, `FORBIDDEN`, `INVALID_CREDENTIALS`, `REFRESH_BUSY` |
| Backend contract | `INVALID_REQUEST`, `INVALID_RESPONSE`, `MALFORMED_RESPONSE`, `VALIDATION`, `INTERNAL` |
| Resource ownership | `STALE_RESULT`, `STALE_OR_UNKNOWN`, `DISPOSED` |
| Paged collections | `INVALID_PAGE`, `PAGE_LIMIT_EXCEEDED`, `INVALID_ITEM_KEY`, `DUPLICATE_ITEM_KEY`, `CURSOR_CYCLE` |
| Protocol and capability | `INVALID_HELLO`, `INCOMPATIBLE_VERSION`, `INVALID_RPC_CAPABILITY_REQUEST`, `INVALID_SERVER_CAPABILITY_REQUEST` |
| Render and conformance | `DUPLICATE_ID`, `ROOT_NOT_SCREEN`, `INVALID_LIST_CHILD`, `ORPHAN_LIST_ITEM`, `QUALITY_BUDGET_EXCEEDED` |
| Media host | `MEDIA_PLAYBACK`, `MEDIA_RESUME`, `MEDIA_NATIVE` |

Navigation and State use their documented lowercase decode and migration codes.
Resource errors use bounded uppercase tokens so applications may define
domain-neutral operation codes without expanding framework core.

## Redaction requirements

Before emitting a diagnostic, retain only the smallest correlation fields needed
to act on it. Never log:

- passwords, session credentials, provider access or refresh tokens, API keys,
  signed URLs, authorization headers, or cookies;
- captions, text-input values, filenames, local paths, complete URLs, provider
  bodies, record payloads, binary bytes, EXIF data, or user identifiers;
- idempotency keys, opaque handle internals, callbacks, stack traces returned to
  applications, or environment values.

Use `Debug.log`, `Debug.warn`, and `Debug.error` only during development. Visible
loading, error, retry, validation, and offline states belong in semantic UI and
must remain usable when the console is unavailable.

## Compatibility rule

Code and structured fields may be used for control flow within the documented
release contract. Diagnostic prose may change. Adding a new code is additive;
changing the meaning of an existing code requires a versioned contract change
and migration guidance.
