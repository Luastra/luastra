# Luastra 0.2.1-alpha — unpublished development candidate

This local candidate fixes developer feedback and rebuild recovery. It is not
an announced release, a public download, or a completed native-host admission.

- Failed web and bundle builds preserve the last successful output. Output
  replacement happens after compilation, asset packaging and ledger creation.
  Concurrent writes to the same output are rejected with a lock diagnostic.
- The starter test exercises the actual application render and counter action.
- UI constructors accept a checked UI.Input table. Incorrect primitive field
  types are analyzer errors. Runtime validation still owns component-specific
  fields, value ranges, vocabularies, motion and child structure; explicit any
  remains a Luau escape hatch.
- List-mode Orbit introductions remain fully readable. Documentation routes
  expose distinct document titles using the existing Screen metadata API.

Source SDK identity: phase5-contract-14; runtime VM/protocol are unchanged.
Existing correctly typed applications retain their behavior. Code passing
incorrectly typed UI fields must be corrected before check/build succeeds.

The published 0.1.0-alpha and 0.2.0-alpha assets remain immutable. Public
publication requires exact-candidate review and separate host/browser evidence.
