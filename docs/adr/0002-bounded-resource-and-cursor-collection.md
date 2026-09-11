# ADR 0002: Bounded resource and cursor collection state

Status: accepted for `0.5.0-alpha`.

## Context

Applications repeatedly implement loading, refresh, retry, stale-result
suppression, mutation rollback, pagination, deduplication, and page eviction.
Those behaviors are domain-neutral, but network providers and record schemas are
not.

An offset-based or append-only list cannot reliably represent changing remote
data and eventually grows without a bound.

## Decision

Add pure Luau `luastra/resource` and `luastra/collection` modules.

Resource reads and mutations use monotonically increasing generation tickets.
Only the current ticket can settle state. Retryable mutations require bounded
idempotency keys, and optional optimistic changes always provide their rollback
at the same call site.

Paged collections use opaque forward and backward cursors, stable application
keys, a single in-flight page operation, deterministic boundary deduplication,
cursor-cycle rejection, and explicit item/page limits. Whole-page eviction is
anchor aware. Providers perform I/O and decoding outside the collection.

## Consequences

- The state machines can be used with local, Supabase, or future providers.
- Traversal can be logically unbounded while VM retention remains bounded.
- Single-flight page loading is the initial deterministic contract; concurrent
  edge loading requires a later ordering design.
- Collection retention does not itself virtualize host UI nodes. The separate
  `UI.List { mode = "windowed" }` host contract now realizes the bounded
  viewport while this collection remains responsible for retained data.
- Cursor contents remain private to repositories and are never interpreted by
  the collection.
