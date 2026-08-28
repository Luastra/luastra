# Luastra SDK Reference

Version-bound English documentation for Luastra `0.1.0-alpha`. The macOS
application and generated `luastra.dev` site run the same Luastra project.

## Commands

```sh
npm install
npm run validate
npm run reference:build
npm run desktop:dev
npm run desktop:build
```

For interactive authoring, run `luastra run` in
`website/app`. The generated production web bundle is
written to `website/luastra-site`.

The macOS application bundle is produced under
`src-tauri/target/release/bundle/macos/`.

The local build is ad-hoc signed and verified automatically. This is suitable
for the owner's local machine; it is not Developer ID signing or notarization
for public distribution.

The production website is deployed from the exact published release tag by
the repository's GitHub Pages workflow. Ordinary pushes do not publish it.

## Source-of-truth boundary

- `site/` retains the previous static implementation only as an internal
  rollback artifact; it is not the publishable site.
- `site/reference-data.js` is the human-readable, version-bound content source.
- `website/app/` is the Luastra application, page
  generator, live examples and Luau tests.
- `luastra-site/` is generated and is never edited by hand.
- `scripts/validate-reference.mjs` compares the documented function and UI
  constructor inventory with the exact candidate SDK and validates the public
  learning and link boundaries.
- `src-tauri/` contains only the desktop shell. The documentation itself does
  not depend on Tauri APIs.

The validators catch missing or extra public symbols and require every SDK
inventory item to resolve to exactly one addressable detail page. Editorial
review still remains mandatory whenever behavior changes.
