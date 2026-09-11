# Application composition and bounded asynchronous state

Status: included in the `0.5.0-alpha` public-source contract.

This slice adds three domain-neutral source modules:

- `luastra/app` composes feature instances into the existing app
  lifecycle and owns request correlation;
- `luastra/resource` models asynchronous reads and writes without performing
  network or storage work;
- `luastra/collection` merges cursor pages while retaining bounded state.

They are suitable for catalogues, activity histories, search results, messages,
documents, tasks, media metadata, or any other typed records. They contain no
social-network concepts.

## Compose feature instances

A feature owns a stable target namespace. Its render function returns ordinary
semantic UI, and its event handler receives only events routed to that namespace.
Lifecycle events addressed to `app` are delivered to every feature in declaration
order.

```luau
--!strict

local App = require("luastra/app")
local UI = require("luastra/ui")

local function counter(id: string): App.Feature<UI.Node>
    local value = 0
    return {
        id = id,
        render = function(_context: App.Context): UI.Node
            return UI.Button {
                id = id .. "/increment",
                text = tostring(value),
                onTap = "increment",
            }
        end,
        handle = function(_context: App.Context, action: string, target: string, _value: string)
            if action == "increment" and target == id .. "/increment" then value += 1 end
        end,
    }
end

return App.compose {
    features = { counter("primary"), counter("secondary") },
    render = function(outputs: { [string]: UI.Node }): UI.Node
        return UI.Screen { id = "app", outputs.primary, outputs.secondary }
    end,
    snapshot = function()
        return { status = "ready" }
    end,
}
```

Feature IDs use bounded lowercase path segments. Duplicate or overlapping
namespaces fail during composition so one event can never have two owners.

`snapshot` is the application's explicit test and debug state. `App.compose`
returns it unchanged from `app.snapshot()`. Framework diagnostics are
kept separate under `app.inspect()` and contain only feature IDs,
request counts, disposal state, and the suppressed-result count.

## Own asynchronous requests

Capability functions continue to return the VM request ID. A feature claims that
ID immediately and assigns a bounded purpose. `App.compose` then delivers the
completion exactly once to the owning feature.

```luau
local requestId = Host.storageGet("catalogue.page")
local ticket = resource.begin(requestId, "refresh")
tickets[requestId] = ticket
context.claim(requestId, "refresh")
```

The feature's `resolve` callback receives the purpose and owner generation.
Duplicate claims fail. `context.cancel(requestId)` removes ownership; a later
completion is suppressed. Disposing the application invalidates every owner
generation, clears all claims, and invokes each feature's optional `dispose`
hook once.

Flat applications with no features may provide one root `resolve` callback and
keep an explicit pending-request map. Once features are present, a root resolver
is rejected during composition: asynchronous work must belong to the feature
that claimed its request ID, so an unrelated or late result cannot fall through
to application code. This keeps small scripts direct without creating two
resolution paths inside a composed application.

This first contract suppresses late delivery but does not invent a universal
host cancellation command. A later capability-specific cancellation contract may
also stop underlying work where the host can do so safely.

## Model a typed read

`Resource.new` requires an `isEmpty` function. Besides defining application
semantics, its typed parameter anchors the resource value type for the analyzer.

```luau
local Resource = require("luastra/resource")

type Profile = { id: string, displayName: string }

local profile: Resource.ReadState<Profile> = Resource.new {
    isEmpty = function(_value: Profile): boolean return false end,
}

local ticket = profile.begin(requestId, "load")
if success then
    profile.resolve(ticket, decodedProfile)
else
    profile.reject(ticket, Resource.error("NETWORK", true))
end
```

Read states distinguish `idle`, `loading`, `success`, `empty`, `refreshing`,
`retrying`, `stale-error`, `error`, and `cancelled`. Starting a new request
increments the generation. A result carrying an older ticket returns `false`
without changing current state.

Refresh may preserve a previous value. `snapshot().stale` is true while retained
data is refreshing, retrying, invalidated, or accompanied by a stale error.

## Model a typed mutation

Retryable writes require an idempotency key. Non-retryable writes reject one.
Only one execution may be active per mutation instance.

```luau
local saved = false
local mutation: Resource.MutationState<string> = Resource.newMutation {
    retryable = true,
    accept = function(value: string): boolean return #value > 0 end,
}

local ticket = mutation.begin(requestId, {
    idempotencyKey = "save-document-42",
    optimistic = {
        apply = function() saved = true end,
        rollback = function() saved = false end,
    },
})
```

Successful resolution commits the optimistic state by discarding its rollback.
Rejection or cancellation invokes the rollback once. The public snapshot never
contains the idempotency key or callback.

## Retain a bounded cursor collection

`Collection.new` requires a stable key extractor and explicit or default
retention limits.

```luau
local Collection = require("luastra/collection")

type Item = { id: string, title: string }

local items: Collection.State<Item> = Collection.new {
    key = function(item: Item): string return item.id end,
    maxItems = 300,
    maxPages = 3,
    maxPageItems = 100,
}

local ticket = items.begin("next", requestId)
repository.load(ticket.cursor)
```

The cursor in a ticket is opaque. Application code passes it back to the
repository and must not parse or construct it. Resolve the decoded page using the
same ticket:

```luau
local result = items.resolve(ticket, {
    items = decoded.items,
    previousCursor = decoded.previousCursor,
    nextCursor = decoded.nextCursor,
    revision = decoded.revision,
})

if not result.accepted then
    -- result.error is a stable bounded code such as CURSOR_CYCLE.
end
```

The collection supports initial load, refresh, forward load, backward load,
stable-key deduplication, insert, replace, remove, invalidation, cancellation,
and edge-specific failure. Duplicate records arriving at a page boundary move to
the newly resolved edge and replace the older value deterministically.

Whole pages are evicted until both `maxItems` and `maxPages` are satisfied. When
an anchor is set, eviction chooses the page edge farther from that anchor. With no
anchor, forward loading evicts the oldest leading page and backward loading
evicts the trailing page.

## Failure behavior

- A malformed page becomes `INVALID_PAGE` without merging partial data.
- A page larger than configured limits becomes `PAGE_LIMIT_EXCEEDED`.
- An invalid stable key becomes `INVALID_ITEM_KEY`.
- Duplicate keys inside one page become `DUPLICATE_ITEM_KEY`.
- A cursor that repeats in its traversal direction becomes `CURSOR_CYCLE`.
- A resolved or cancelled ticket used again returns `STALE_RESULT`.
- Edge failures preserve retained items and populate only `previousError` or
  `nextError`.
- Resource errors admit stable uppercase codes and bounded field-code maps, not
  provider messages, payloads, paths, URLs, or credentials.

## Current boundary

This slice provides the bounded data half of an effectively unbounded list. It
has a real-Wasm test that traverses 100,000 logical records in both directions
while retaining only 300 items in three pages.

`UI.List { mode = "windowed" }` now provides the web-host presentation half. An
application still renders only the retained or otherwise bounded collection
window; the host then realizes the visible overscan range and spacers. Cursor
pagination alone must not be described as DOM virtualization. See
[`windowed-lists.md`](./windowed-lists.md) for the complete boundary and current
evidence.

The complete executable fixture is in `examples/state-foundations`, and the
cross-boundary tests are in `tests/universal-state-foundations.mjs`.
