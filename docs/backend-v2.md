# Backend contract v2

Status: included in the `0.5.0-alpha` public-source contract. Backend v1 remains supported. The
provider-neutral record collection foundation is implemented and documented in
`provider-neutral-records.md`; encrypted Supabase session integration and
structured field-validation errors are available, and built-in local or
Supabase collections can be declared directly in `luastra.json`.

Backend contract v2 lets generated strict Luau clients send and receive bounded
nested records, arrays, enums, optional fields, and explicit null values. It
does not expose JSON, SQL, provider filters, URLs, tokens, or arbitrary maps to
application code.

## Declaration

A v2 declaration contains exact top-level `limits`, `enums`, `types`, and
`functions` objects. Limits can be made smaller per project but cannot exceed:

- nesting depth: 8;
- encoded fields: 256;
- items in one array: 128;
- bytes in one string: 4,096;
- bytes in the complete request or result payload: 4,096.

The complete payload stays at 4 KiB because that is the current host RPC string
limit. Cursor pages should therefore use deliberately small page sizes. A later
increase requires a separate protocol and host review backed by measured page
shapes.

The declaration is also rejected when its maximum array expansion could exceed
the encoded-field budget, so a legal value cannot allocate a larger temporary
wire object before the final payload check. Encoded paths are limited to 128
characters. In this first deterministic codec, `number` means a signed integer
from -2,147,483,647 through 2,147,483,647; fractional and non-finite values are
rejected rather than serialized differently by Luau and JavaScript.

Field descriptors have a required `type` and may add:

- `optional: true` to allow the field to be absent;
- `nullable: true` to allow an explicit null;
- `array: true` with an optional smaller `maximumItems`;
- `maximumBytes` on a scalar string.

Named record references must be acyclic. The field names `length`, `null`, and
`present` are reserved because the deterministic wire uses them as structural
markers.

Every function also declares `resultVersion`. A generated decoder rejects a
result from any other version instead of guessing compatibility.

## Generate and use the client

Run the existing generator after changing a declaration:

```sh
luastra generate --project=path/to/luastra.json
```

Application code imports the generated module. It does not flatten fields:

```luau
local Api = require("app/generated/server-functions")

local requestId = Api.pageRecords({
    cursor = Api.nullValue(),
    direction = "forward",
    limit = 20,
}, { retry = true })
```

Optional and nullable are distinct. Omitting `cursor` means it is absent;
`Api.nullValue()` means it is explicitly null; `Api.value("cursor-2")` carries a
non-null value. Generated result types preserve the same distinction through
`Server.Nullable<T>`.

Decode only the response that belongs to the request:

```luau
local result = Api.decodePageRecords(payload)
if result == nil then
    -- Fail closed: malformed, over-limit, or unexpected result version.
    return
end

for _, record in ipairs(result.page.items) do
    -- record is a generated strict type
end
```

## Structured validation errors

Trusted handlers may attach stable field codes only to a `VALIDATION` error:

```js
context.reject("VALIDATION", "Invalid profile fields", {
  displayName: "REQUIRED",
  "profile.bio": "TOO_LONG",
});
```

The generated client exposes the shared decoder. It returns the original public
message and a bounded field-code map that can be passed directly to
`Resource.error`; application code never parses a provider message:

```luau
local decoded = Api.decodeError(errorCode, errorMessage)
if decoded ~= nil then
    mutation.reject(ticket, Resource.error(
        decoded.code,
        decoded.code == "NETWORK" or decoded.code == "DEADLINE",
        decoded.fields
    ))
end
```

Field names, codes, count, and the complete encoded error remain bounded. Codes
use stable uppercase tokens such as `REQUIRED`, `TOO_LONG`, or `CONFLICT`.
Provider-specific messages, SQL details, URLs, table names, and credentials must
not be copied into this map. Errors without fields keep their existing plain
message behavior, and backend v1 clients receive the same shared decoder.

## Compatibility and security boundary

- A schema-v1 declaration still generates the byte-compatible v1 client.
- Both schema versions use the already admitted `server.call.v1` host capability
  envelope; the inner deterministic payload identifies `v=1` or `v=2`.
- The runtime validates authorization and input before invoking a handler, and
  validates the complete handler result before encoding it.
- Unknown or duplicate fields, invalid enums, contract cycles, non-canonical
  encodings, and values beyond declared limits fail closed.
- Cancellation, deadlines, idempotency, and bounded retry continue to use the
  existing host/runtime path.

The executable example is `test-fixtures/backend-v2-cursor`; it traverses a
nested cursor page through the generated client, real Luau/Wasm, runtime
validation, authorization, and the trusted JavaScript handler.
