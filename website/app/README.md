# Luastra SDK Reference dogfood application

Source for the English Luastra-native `0.1.0-alpha` documentation application.
It deliberately uses the same public SDK that it documents and serves as both
the `luastra.dev` source and a web-application dogfood fixture.

## What is here

- `src/main.luau` owns search, navigation, detail pages, copy feedback and live
  examples.
- `src/examples.luau` contains compiled examples that really execute in the
  current runtime. Documentation text is never evaluated as Luau.
- `src/reference-data.luau` is generated from the versioned human-readable
  content in `../site/reference-data.js`.
- `scripts/generate-reference-data.mjs` creates the Luau snapshot and rejects a
  public SDK symbol without exactly one complete detail page.
- `tests/reference-data.luau` protects the 85-function/component and 60-exported-type inventories, candidate SDK
  identities, tutorials, learning path, and per-component page contract.

Each public UI component has its own page with a signature, purpose and mental
model, exact supported parameters, child/layout rules, accessibility notes,
common mistakes and a copyable example. Shared parameter groups remain linked
for deeper explanation but are not a substitute for the component-specific
table.

## Local workflow

From this directory, using the current repository SDK:

```sh
node ../../cli/luastra.mjs check --project=luastra.json
node ../../cli/luastra.mjs test --project=luastra.json
node ../../cli/luastra.mjs run --project=luastra.json
node ../../cli/luastra.mjs build web --project=luastra.json
```

The macOS wrapper and its build commands live in
`..`. Production deployment is controlled by the
repository-level GitHub Pages workflow, not by this application project.
