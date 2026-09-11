# ADR 0003: Backend v2 typed wire

Status: accepted for `0.5.0-alpha`.

## Context

Backend contract v1 deliberately supports a small flat scalar request and a
bounded flat or one-level-array response. Cursor pages and reusable record
repositories need nested records, arrays, enums, optional fields, and values
that distinguish absence from an explicit null. Exposing JSON, provider query
syntax, or arbitrary untyped maps to application code would weaken both the
generated-client guarantee and the provider-neutral boundary.

## Decision

Backend declaration schema v2 coexists with schema v1. A project selects one
schema through its backend declaration; existing v1 declarations, generated
clients, and `server.call.v1` transport remain unchanged.

Schema v2 uses the existing `server.call.v1` host capability envelope with a
versioned `v=2` payload, so adopting typed contracts does not require a host ABI
change. It uses named enums, named acyclic record types, and bounded field
descriptors. Each descriptor declares its referenced type and may declare
`optional`, `nullable`, `array`, `maximumItems`, or `maximumBytes`. The contract
also declares hard maximums for nesting depth, encoded fields, collection items,
individual strings, and the complete payload. The initial complete-payload
ceiling remains 4 KiB because that is the currently admitted host RPC string
limit. Raising it requires a separate measured protocol and host change.
Contracts whose worst-case array expansion exceeds their field budget are
rejected before client generation. Encoded paths are limited to 128 characters,
and the initial numeric wire accepts signed 32-bit-range integers only so Luau
and JavaScript produce the same canonical spelling.

The v2 wire is a deterministic, percent-encoded flat representation generated
from the trusted contract. Structural paths and explicit `present`, `null`, and
`length` markers preserve optional-versus-null semantics without exposing a
general parser to Luau. The generated client is the only application-facing
codec. JavaScript handlers receive ordinary nested objects, arrays, missing
optional properties, and JavaScript `null` values.

Generated Luau represents nullable values as `Server.Nullable<T>`:

```luau
local absent = nil
local explicitNull = Api.nullValue()
local present = Api.value("cursor-2")
```

Every v2 operation declares a positive `resultVersion`. Unknown fields,
duplicate fields, non-canonical numbers or encodings, over-limit values,
contract cycles, transport-version mismatches, and unexpected result versions
fail closed.

## Consequences

- Backend v1 remains a compatibility path during alpha migration and existing
  hosts can carry either bounded payload version.
- Rich application values no longer need manual string flattening.
- Providers receive already validated domain-neutral values; provider-specific
  filters, table names, URLs, and tokens remain outside the Luau boundary.
- Record-provider conformance and structured validation-error details are built
  as separate reviewable changes on this transport. The full Slice 2 exit gate
  still requires deployment-backed provider authorization evidence.
