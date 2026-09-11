# Luastra 0.5.0-alpha

This release adds the reusable application foundations needed for large,
data-backed interfaces without introducing application-specific core widgets.

- `luastra/app` composes independently reusable features, owns asynchronous
  request IDs, suppresses stale completions, and keeps application snapshots
  separate from bounded framework diagnostics.
- `luastra/resource` and `luastra/collection` provide explicit loading, empty,
  refreshing, retry, stale-error, cancellation, optimistic mutation, cursor,
  deduplication, anchor, and bounded page-eviction state.
- Backend contract v2 carries bounded nested records, nullable and optional
  fields, enums, arrays, structured validation errors, cancellation,
  authorization, conflicts, and idempotency. Backend v1 remains available as an
  alpha compatibility path.
- Declarative local and Supabase record collections share one provider-neutral
  cursor and mutation contract. Provider credentials, RLS decisions, and
  provider syntax remain outside application Luau.
- `UI.List` adds opt-in windowing with bounded realized DOM, variable-height
  measurement, scroll-anchor restoration, focus pinning, bidirectional edge
  backpressure, and a complete accessible fallback.
- `UI.Image` accepts packaged, protected, and host-local preview sources through
  one typed contract. Protected delivery uses expiring same-origin handles and
  releases temporary resources after their final owner.
- Browser PNG/JPEG selection and upload use opaque preview and upload handles,
  server-authorized intents, bounded progress, cancellation, commit, deletion,
  and cleanup. Native picker/camera and production Supabase deployment remain
  separate admission work.
- Local reusable Luau libraries now have checked manifests, canonical archives,
  exact locks, capability containment, transactional install/update/removal,
  offline reinstall, conformance tests, notices, and SPDX attribution. The same
  domain-neutral `universal-blocks` package is consumed unchanged by two
  unrelated fixtures.
- `UI.Icon`, input completion fields, button states, modal focus relationships,
  and safe-area, sticky, and overflow layout tokens complete this non-video UI
  slice without adding social-application components to core.

The source SDK is contract 19 and the runtime family is
`phase5-alpha-10`. Inline video is deliberately deferred to a later release so
its decoder, lifecycle, caption, autoplay, and per-host evidence can be reviewed
independently.

This remains public-source alpha software. APIs may change, the SDK archives and
desktop/mobile applications are unsigned, and no production hosted service,
store distribution, automatic updater, native image picker, or manual
VoiceOver/NVDA certification is claimed. Earlier published release assets remain
immutable.
