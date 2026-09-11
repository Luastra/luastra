# ADR 0001: Feature composition and request ownership

Status: accepted for `0.5.0-alpha`.

## Context

Large applications currently concentrate event and asynchronous-result routing
inside one hand-written `app.handle` and `app.resolve` table.
Reusable visual functions alone do not provide lifecycle isolation or safe
request ownership.

Introducing feature-specific renderer components would move application domains
into core and multiply protocol concepts. Introducing a second application
runtime would also split lifecycle and compatibility behavior.

## Decision

Add a pure Luau `luastra/app` composer that returns the existing app contract.

Each feature instance has one bounded, non-overlapping target namespace. The
composer routes ordinary events by target namespace and broadcasts lifecycle
events in declaration order. A feature can claim a VM request ID with a bounded
purpose. The composer delivers its completion once to that feature and suppresses
unowned, cancelled, or disposed results.

Feature generations are invalidated on disposal. The composer exposes only
bounded diagnostic counts and feature IDs; it does not retain request payloads,
error messages, credentials, or provider data.

`App.compose` is the canonical entry point for newly authored applications.
Application code supplies its explicit test snapshot, while the composer's
bounded internal diagnostics are exposed separately through `inspect`.
For direct migration, a flat application with no features may retain one root
resolver and its explicit pending-request map. Root resolution and feature
resolution cannot be enabled together.

## Consequences

- Existing hand-written app modules remain runtime-compatible, while
  the starter and new documentation use `App.compose`.
- Two instances of one feature can coexist under different namespaces.
- Application libraries can package stateful compositions without extending the
  renderer protocol.
- Underlying host work is not automatically cancelled yet; this contract safely
  suppresses delivery until capability-specific cancellation exists.
- Overlapping namespaces and duplicate request ownership fail immediately rather
  than choosing an implicit winner.
