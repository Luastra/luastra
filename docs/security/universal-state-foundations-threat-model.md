# Universal state foundations: threat-model delta

Status: `0.5.0-alpha` implementation boundary. This document does not replace the
repository security policy or the mandatory exact-candidate Daybreak scan.

## Assets and trust boundaries

- Correct application state after asynchronous completion, retry, cancellation,
  and disposal.
- Stable item identity and ordering across cursor pages.
- Bounded VM memory and bounded diagnostic output.
- Separation between application features sharing one VM session.
- Provider payloads, cursor contents, credentials, URLs, paths, and user data that
  must not enter framework diagnostics.

Repositories and host capabilities are outside these pure Luau modules. Their
decoded values, errors, cursors, and request IDs are untrusted inputs when passed
to the state machines.

## Threats and controls

| Threat | Control | Executable evidence |
|---|---|---|
| Late response overwrites current data | Monotonic generation tickets; non-current settlement returns false | Stale read and cancelled page tests |
| One feature receives another feature's result | Exact request ownership and non-overlapping target namespaces | Two-instance real-Wasm test |
| Duplicate or replayed completion | Ownership is removed before callback delivery | App contract test |
| Result arrives after cancellation or disposal | Ownership removal and feature-generation invalidation | Cancelled and disposed late-result tests |
| Cursor loop causes infinite requests | Directional consumed-cursor ledger and cycle rejection | Cursor-cycle real-Wasm test |
| Duplicate records corrupt identity | Per-page duplicate rejection and deterministic cross-page replacement | Boundary-deduplication test |
| Unbounded page retention | Enforced item, page, and page-size limits with whole-page eviction | 100,000-record bounded-window test |
| Malformed key extractor or page shape | Protected key extraction, dense-array checks, bounded keys/cursors/revisions | Collection contract fixture |
| Optimistic failure leaves false committed state | Required paired rollback, invoked once on reject or cancel | Mutation rollback test |
| Secrets enter framework diagnostics | Resource and collection snapshots plus `app.inspect()` omit idempotency keys, callbacks, payloads, purposes, cursor contents, and error messages | Static API review and fixture assertions |

## Residual risks and deferred work

- A malicious application callback can throw; application-authored code remains a
  project responsibility, although framework ownership is cleared before result
  callbacks.
- `app.snapshot` is application-authored test state and may contain
  application data. Projects must keep credentials and provider payloads out of
  it; only `app.inspect()` is a bounded framework diagnostic contract.
- A flat app-level resolver remains responsible for rejecting unknown or replayed
  request IDs through its own pending-request map. `App.compose` rejects that
  resolver as soon as feature ownership is enabled, preventing ambiguous result
  delivery.
- Capability-specific cancellation can stop underlying work only after each host
  contract defines it. The current composer suppresses unsafe late delivery.
- Collection cursors are bounded but not cryptographically protected here.
  Provider/backend contracts must issue and validate them.
- Collection retention bounds VM data only. Host node virtualization, focus
  pinning, measurement, and scroll anchoring remain the windowed `UI.List` slice.
- Performance evidence currently uses deterministic Wasm fixtures. Browser and
  native host measurements are required before host-specific release claims.

Before any new public version, Daybreak must scan the exact frozen candidate and
any later executable delta as required by the implementation plan.
