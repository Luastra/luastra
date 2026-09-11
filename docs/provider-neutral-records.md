# Provider-neutral record collections

Status: included in the `0.5.0-alpha` public-source contract. The collection contract, bounded local
adapter, Supabase keyset-query translation, runtime injection, normal project
runner hook, encrypted Supabase session binding, and conformance tests are
implemented. Ordinary local and Supabase collections can now be declared in
`luastra.json`; the JavaScript hook remains an advanced escape hatch.

Provider-neutral record collections give trusted JavaScript handlers one small
API for local SQLite or memory data, Supabase, and future adapters. They do not
add database access to application Luau. Luau continues to call only declared,
typed backend functions.

## Handler-facing contract

A configured collection exposes five methods:

```js
const page = await context.records.notes.list({
  cursor: input.cursor,
  direction: "forward",
  limit: input.limit,
  sort: "newest",
  equal: { status: "published" },
}, context.principal, { signal: context.signal });

const value = await context.records.notes.get(input.id, context.principal);
const inserted = await context.records.notes.insert(draft, context.principal);
const updated = await context.records.notes.update(input.id, patch, context.principal);
const deleted = await context.records.notes.delete(input.id, context.principal);
```

`list` returns `{ items, previousCursor, nextCursor }`. A cursor is an opaque,
bounded Luastra value. It contains no SQL or PostgREST fragment. It is valid
only for the collection, admitted sort, and equality filters that created it.
Changing any of those inputs rejects the cursor.

The first query surface is deliberately small:

- `cursor`: omitted, `null`, or a cursor returned by the same query;
- `direction`: `forward` or `backward`;
- `limit`: a positive integer no larger than the collection limit;
- `sort`: the name of one predeclared stable order;
- `equal`: scalar equality values for predeclared fields only.

There is no raw table name, field name, operator, order expression, SQL, URL,
or provider query string in a handler request. Each sort must end with `id` as
its unique tie-breaker, so records with equal timestamps retain deterministic
pagination order.

## Construct a collection in a project

Ordinary collections belong in `backend.records` in `luastra.json`. The runner
validates the complete declaration, constructs each provider, and injects the
frozen named collection map into both `createHandlers` and `context.records`:

```json
{
  "backend": {
    "records": {
      "notes": {
        "provider": "local",
        "authorization": { "mode": "owner", "field": "owner_id" },
        "equalityFields": ["status"],
        "mutableFields": ["title", "status"],
        "insertFields": ["id", "owner_id", "created_at", "title", "status"],
        "sorts": {
          "newest": [
            { "field": "created_at", "direction": "desc" },
            { "field": "id", "direction": "desc" }
          ]
        },
        "defaultSort": "newest",
        "maximumLimit": 25
      }
    }
  }
}
```

The local provider requires an explicit authorization mode:

- `public` admits anonymous and authenticated callers;
- `authenticated` requires any valid principal;
- `owner` requires the declared immutable owner field to equal the principal
  ID. That field must be listed in `insertFields` and cannot be mutable.

Public access is therefore never enabled by omission. The provider applies the
rule to every list, read, insert, update, and delete operation server-side.

The minimum useful local declaration is intentionally small:

```json
{
  "provider": "local",
  "authorization": { "mode": "public" }
}
```

Omitted field allowlists are empty. `insertFields` defaults to `id` plus the
mutable fields, `maximumLimit` defaults to 50, and omitted sorts produce one
stable `byId` order using `id asc`.

A Supabase-backed declaration uses the same collection contract:

```json
{
  "backend": {
    "authentication": "session",
    "identity": { "provider": "supabase" },
    "records": {
      "notes": {
        "provider": "supabase",
        "table": "app_notes",
        "equalityFields": ["status"],
        "mutableFields": ["title", "status"],
        "insertFields": ["id", "owner_id", "created_at", "title", "status"],
        "sorts": {
          "newest": [
            { "field": "created_at", "direction": "desc" },
            { "field": "id", "direction": "desc" }
          ]
        },
        "defaultSort": "newest",
        "maximumLimit": 25
      }
    }
  }
}
```

Supabase record declarations require Supabase identity. They intentionally do
not accept an `authorization` property: database grants and RLS policies are the
authorization source of truth. The manifest contains no provider URL,
publishable key, access token, refresh token, or session-encryption key. Luastra
binds those backend-only values through its managed encrypted session boundary.

For a genuinely custom provider or authorization rule, a backend handler may
still export the advanced `createRecordCollections` hook:

```js
export function createRecordCollections({
  database,
  createLocalRecordProvider,
  createRecordCollection,
}) {
  const provider = createLocalRecordProvider({
    database,
    collection: "notes",
    authorize(action, principal, record) {
      return customPolicy(action, principal, record);
    },
  });
  return {
    notes: createRecordCollection({
      provider,
      collection: "notes",
      sorts: { byId: [{ field: "id", direction: "asc" }] },
    }),
  };
}
```

`backend.records` and `createRecordCollections` cannot be used together. This
keeps the ordinary path transparent while preserving one narrow extension point
instead of introducing another public provider abstraction.

`update` accepts only a patch of declared mutable fields. It cannot replace `id`
or other immutable fields. `insert` accepts exactly the declared insert fields.
All record values remain bounded JSON-compatible data and must carry a valid
opaque `id`.

## Supabase adapter

`createSupabaseRecordProvider` keeps its existing CRUD API. A table mapping may
now additionally declare its query allowlist:

```js
const supabase = createSupabaseRecordProvider({
  url,
  publishableKey,
  tables: {
    notes: {
      table: "app_notes",
      updateFields: ["title", "status"],
      query: {
        equalityFields: ["status"],
        sorts: {
          newest: [
            { field: "created_at", direction: "desc" },
            { field: "id", direction: "desc" },
          ],
        },
      },
    },
  },
});
```

`createSupabaseRecordCollectionProvider` adapts that provider to the same
collection facade. It receives an `accessTokenForPrincipal` callback from the
trusted session boundary. The access token is used only by the adapter and does
not enter the cursor, handler result, generated client, or Luau VM. Returning
`null` deliberately makes an anonymous Supabase request that remains subject to
RLS.

During normal `luastra run`, Luastra supplies that callback itself. It resolves
the already-authenticated principal's internal session ID, refreshes expiring
provider credentials under the broker's single-winner lease, verifies that the
provider user still matches the principal, and forwards only the current access
token to the data request. Project hooks cannot replace this managed callback.

The Supabase adapter translates the admitted order into keyset predicates and
requests only `limit + 1` records. It reverses a backward provider query before
returning the canonical display order. Provider error bodies, table names,
tokens, and query syntax are mapped to bounded Luastra errors by the facade.

## Boundaries and remaining work

- The local provider is intentionally bounded by the existing 1,000-record
  development database. It may sort that bounded set in memory; remote adapters
  must push keyset pagination to their provider.
- The collection facade is a trusted-handler building block, not a renderer or
  SDK component. Feature libraries such as a paged list compose typed backend
  calls above it.
- The existing low-level `context.database` API remains compatible during the
  alpha migration. New provider-neutral handlers should prefer named
  `context.records` collections.
- Declarative manifest construction covers the built-in local and Supabase
  providers. The advanced JavaScript hook remains only for custom providers or
  policies that cannot be represented by the three admitted local modes.
- Backend v2 handlers can attach bounded field codes to `VALIDATION` failures as
  documented in `backend-v2.md`. Provider failures still map to stable public
  codes and never ask application code to parse provider messages.

The contract tests live in `tests/record-provider-contract.mjs` and exercise
stable ties, forward and backward cursors, allowlisted filters and patches,
server-side authorization, Supabase query translation, and runtime error
mapping.
