# Startup screen example

`startup.entry` selects `src/startup.luau` through the project's module registry.
It returns a table with a `render()` function, just like an application. During
web build this function runs in the restricted startup VM; only HTML and CSS
are shipped. The interactive counter comes from a separate application entry.

This example requires Luastra 0.4.0-alpha with the startup-capable
phase5-alpha-9 runtime; earlier published SDK archives do not include it.

From the repository root:

```sh
node cli/luastra.mjs check --project=examples/startup-screen/luastra.json
node cli/luastra.mjs build web --project=examples/startup-screen/luastra.json
```

No special runtime override is required. Old binaries reject the startup
profile rather than falling back to unrestricted execution.

`luastra check` analyzes both entries. Projects without `startup` continue to
build normally. No animation, custom JavaScript or runtime callbacks are
supported in the startup entry. The documentation link works without the VM.
