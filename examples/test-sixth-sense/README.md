# Test Sixth Sense

A small game created during early owner dogfooding of Luastra. The player tries
to guess whether a hidden card is red or black. After a choice, the card flips,
reveals the correct color, and automatically advances to the next round. One
game contains ten cards.

The project was independently authored through the public Luau SDK and ordinary
Luastra commands. It does not require edits to HTML, CSS, JavaScript, generated
web hosts, or internal platform files.

## What the example demonstrates

- reusable `UI.Theme` colors and semantic tokens;
- layout with `UI.Screen`, `UI.Column`, `UI.Row`, `UI.Actions`, and `UI.Layer`;
- images, shapes, and a two-sided `UI.FlipCard`;
- declarative `Motion.sway`, `Motion.pulse`, and `Motion.flip`;
- navigation between the welcome screen and the game;
- input handling through `Application.handle`;
- one-shot `Timer.start`, chained timer events, and timer cancellation;
- strict Luau types and two automated tests.

## Layout

```text
assets/images/card-back.png  original 412x573 card-back illustration
src/main.luau                UI, state, and game flow
tests/smoke.luau             basic public-SDK check
tests/game-flow.luau         welcome -> game -> timers -> finish -> home
luastra.json                 modules, capabilities, assets, and tests
```

## Requirements

Requirements: Node.js 24 or newer and an installed Luastra 0.1.0-alpha SDK. Run the following commands from this application directory.

## Check and test

```sh
luastra version
luastra check
luastra test
```

The expected result is `PASS`: one smoke test and one game-flow test. The flow
test replaces the host timer, verifies scheduled delays, and delivers timer
events manually without waiting for real time.

## Local development

```sh
luastra run
```

The preview is available at the URL printed by the command (by default
`http://127.0.0.1:4175/`). Luau changes rebuild automatically.

## Web build

```sh
luastra build web
```

Static output is written to `dist/web`. Do not open `index.html` through
`file://`: JavaScript modules and Wasm require HTTP. To inspect the build:

```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory dist/web
```

Open `http://127.0.0.1:8080/` and stop the server with `Ctrl+C`.

## Card asset

`assets/images/card-back.png` is an original illustration created specifically
for this application on August 27, 2026 with OpenAI image generation. The
third-party image previously found through Google was removed and was not used
as a generation reference. The current asset contains no text, logos, or
third-party trademarks.

## Status

This is an public example application rather than a narrow
fixture under `prototype/reference-apps`. It discovered and helped close
DOGFOOD-001 through DOGFOOD-010. The final private-MVP run uses the frozen
`0.1.0-private.2` candidate; the scenario will be repeated before a separately
authorized public release.

The Luastra starter is provided under 0BSD; see
`LUASTRA_TEMPLATE_LICENSE.txt`. Generated `dist` and `.luastra` directories are
not editable application source.
