// Generated from the checked Luastra SDK and reference-data.js. Do not edit by hand.

export const generatedPages = Object.freeze([
  {
    "id": "overview/item-1",
    "kind": "guide",
    "sectionId": "overview",
    "sectionTitle": "Start here: build apps like games",
    "module": null,
    "callable": false,
    "useWhen": "Read this before the tutorials when terms such as runtime, host, semantic UI, or capability are unfamiliar.",
    "code": null,
    "signature": "Luau application → SDK → runtime → host",
    "parameters": [],
    "returns": null,
    "name": "The four moving parts",
    "description": "Your Luau module owns state and returns a semantic tree. The SDK validates declarations, the Wasm runtime executes admitted code, and the host reconciles the tree while providing explicit capabilities.",
    "points": [
      "Application: your strict Luau modules, tests, assets, and manifest.",
      "SDK: checked constructors and functions imported through declared dependencies.",
      "Runtime: executes the admitted module graph and dispatches events.",
      "Host: renders UI and performs declared storage, history, timer, server, or media work."
    ],
    "previousPageId": null,
    "nextPageId": "overview/item-2",
    "relatedPageIds": []
  },
  {
    "id": "overview/item-2",
    "kind": "guide",
    "sectionId": "overview",
    "sectionTitle": "Start here: build apps like games",
    "module": null,
    "callable": false,
    "useWhen": "Use this when deciding what to read next.",
    "code": null,
    "signature": "first app · API lookup · evaluation",
    "parameters": [],
    "returns": null,
    "name": "Choose your path",
    "description": "Use one deliberate route instead of reading every detail page in order.",
    "points": [
      "First app: Installation → Quick start → Beginner tutorial.",
      "Build a feature: open its module overview, then the exact symbol pages and module-level complete example.",
      "Evaluate Luastra: Overview → Support and boundaries → Project manifest → the relevant host capability."
    ],
    "previousPageId": "overview/item-1",
    "nextPageId": "overview/item-3",
    "relatedPageIds": []
  },
  {
    "id": "overview/item-3",
    "kind": "guide",
    "sectionId": "overview",
    "sectionTitle": "Start here: build apps like games",
    "module": null,
    "callable": false,
    "useWhen": "Use this whenever recurring Luastra terminology makes an otherwise simple instruction hard to follow.",
    "code": null,
    "signature": "admitted · bounded · capability · stable id",
    "parameters": [],
    "returns": null,
    "name": "Small glossary",
    "description": "The reference uses these words to describe safety and portability boundaries, not extra syntax you must memorize.",
    "points": [
      "Admitted: declared and accepted by the manifest, SDK, runtime, or host contract.",
      "Bounded: checked against an explicit size, count, duration, or format limit.",
      "Capability: a host operation explicitly listed in luastra.json.",
      "Stable id: a unique lowercase path that identifies the same UI element across renders.",
      "Source alpha: usable for evaluation, with breaking changes and incomplete production packaging still possible."
    ],
    "previousPageId": "overview/item-2",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "installation/item-1",
    "kind": "entry",
    "sectionId": "installation",
    "sectionTitle": "Install Luastra",
    "module": "0.1.0-alpha release boundary",
    "callable": false,
    "useWhen": "Use this when installing Luastra on a supported machine for the first time or when installing an explicitly selected release version.",
    "code": "curl -fsSLO https://github.com/Luastra/luastra/releases/download/v0.1.0-alpha/luastra-install.mjs\nnode luastra-install.mjs \\\n  --manifest=https://github.com/Luastra/luastra/releases/download/v0.1.0-alpha/luastra-release.v1.json",
    "signature": "download → verify → atomic install → doctor",
    "parameters": [],
    "returns": null,
    "name": "Release installation contract",
    "description": "The Node.js bootstrap detects the host, downloads only its archive over HTTPS, verifies the release manifest and archive ledger, then atomically installs the SDK under ~/.luastra/sdk/0.1.0-alpha.",
    "language": "Shell",
    "points": [
      "Supported archives: macOS arm64/x64, Linux x64, and Windows x64.",
      "A checksum, receipt, or installed-file mismatch fails closed.",
      "The installer never edits shell profiles or the Windows registry."
    ],
    "previousPageId": null,
    "nextPageId": "installation/item-2",
    "relatedPageIds": []
  },
  {
    "id": "installation/item-2",
    "kind": "entry",
    "sectionId": "installation",
    "sectionTitle": "Install Luastra",
    "module": "0.1.0-alpha release boundary",
    "callable": false,
    "useWhen": "Use this on an offline machine or when release assets are transferred through a controlled internal channel.",
    "code": "node ./luastra-install.mjs --manifest=./luastra-release.v1.json",
    "signature": "local manifest + one host archive",
    "parameters": [],
    "returns": null,
    "name": "Offline installation",
    "description": "Copy the installer, release manifest, and matching host archive into one directory. The same manifest and file-ledger checks run without a network request.",
    "language": "Shell",
    "previousPageId": "installation/item-1",
    "nextPageId": "installation/item-3",
    "relatedPageIds": []
  },
  {
    "id": "installation/item-3",
    "kind": "entry",
    "sectionId": "installation",
    "sectionTitle": "Install Luastra",
    "module": "0.1.0-alpha release boundary",
    "callable": false,
    "useWhen": "Check this before installation or when the Luastra shim cannot start.",
    "code": "node --version\n# Expected: v24.x or newer",
    "signature": "Node.js 24 or newer",
    "parameters": [],
    "returns": null,
    "name": "System requirement",
    "description": "Node.js 24 or newer is the only runtime prerequisite for packaged CLI workflows. No npm install, Rust, Xcode, Android Studio, or repository checkout is required.",
    "language": "Shell",
    "previousPageId": "installation/item-2",
    "nextPageId": "installation/item-4",
    "relatedPageIds": []
  },
  {
    "id": "installation/item-4",
    "kind": "entry",
    "sectionId": "installation",
    "sectionTitle": "Install Luastra",
    "module": "0.1.0-alpha release boundary",
    "callable": false,
    "useWhen": "Use this only when installation succeeds but the shell reports command not found or does not recognize luastra.",
    "code": "# zsh (macOS default)\necho 'export PATH=\"$HOME/.luastra/bin:$PATH\"' >> ~/.zshrc\nsource ~/.zshrc\n\n# bash\necho 'export PATH=\"$HOME/.luastra/bin:$PATH\"' >> ~/.bashrc\nsource ~/.bashrc\n\n# PowerShell, current window\n$env:Path = \"$HOME\\.luastra\\bin;$env:Path\"\n\nluastra version\nluastra doctor",
    "signature": "add ~/.luastra/bin to PATH",
    "parameters": [],
    "returns": null,
    "name": "Make the command available",
    "description": "The installer deliberately leaves shell configuration unchanged. Add its bin directory when a new terminal cannot find the luastra command.",
    "language": "Shell",
    "points": [
      "For a permanent Windows setting, add %USERPROFILE%\\.luastra\\bin to your user PATH, then open a new terminal.",
      "A successful version command prints JSON whose result is PASS and whose version is 0.1.0-alpha.",
      "A successful doctor command prints JSON with result PASS. Do not continue if doctor reports a checksum, receipt, host, or installed-file mismatch."
    ],
    "previousPageId": "installation/item-3",
    "nextPageId": "installation/item-5",
    "relatedPageIds": []
  },
  {
    "id": "installation/item-5",
    "kind": "entry",
    "sectionId": "installation",
    "sectionTitle": "Install Luastra",
    "module": "0.1.0-alpha release boundary",
    "callable": false,
    "useWhen": "Run doctor after installation or switching; use an older retained version when an update must be rolled back.",
    "code": "luastra version\nluastra doctor\nluastra sdk list\nluastra sdk use 0.1.0-alpha\nluastra sdk update --manifest=<path-or-https-url>\nluastra sdk remove <inactive-version>",
    "signature": "doctor · list · use · update · remove",
    "parameters": [],
    "returns": null,
    "name": "Verify and manage SDKs",
    "description": "Verify the active SDK, retain multiple immutable versions, switch explicitly for rollback, update from another verified manifest, and remove only an inactive verified version.",
    "language": "Shell",
    "previousPageId": "installation/item-4",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "quickstart/item-1",
    "kind": "entry",
    "sectionId": "quickstart",
    "sectionTitle": "Quick start: run your first app",
    "module": "installed luastra CLI · about 10 minutes",
    "callable": false,
    "useWhen": "Start here once Luastra is installed and doctor passes.",
    "code": "luastra create hello-luastra\ncd hello-luastra",
    "signature": "luastra create hello-luastra",
    "parameters": [],
    "returns": null,
    "name": "1. Create and enter a project",
    "description": "Creates a missing or empty directory, copies the starter, and derives a project id from the directory name.",
    "language": "Shell",
    "points": [
      "The created tree contains luastra.json, src/main.luau, tests/smoke.luau, assets/, and the starter license.",
      "Open src/main.luau first: it owns state, event handling, and the rendered screen.",
      "luastra.json declares which modules may be imported and which host capabilities the app may use."
    ],
    "previousPageId": null,
    "nextPageId": "quickstart/item-2",
    "relatedPageIds": []
  },
  {
    "id": "quickstart/item-2",
    "kind": "entry",
    "sectionId": "quickstart",
    "sectionTitle": "Quick start: run your first app",
    "module": "installed luastra CLI · about 10 minutes",
    "callable": false,
    "useWhen": "Use this after project creation to replace the existing UI.Text block inside Application.render.",
    "code": "UI.Text {\n    id = \"title\",\n    text = `Hello from my first Luastra app: {interactions}`,\n    variant = \"title\",\n}",
    "signature": "edit src/main.luau",
    "parameters": [],
    "returns": null,
    "name": "2. Make a visible change",
    "description": "Change the starter title before running it so you can see the connection between Luau source and host UI.",
    "language": "Luau",
    "previousPageId": "quickstart/item-1",
    "nextPageId": "quickstart/item-3",
    "relatedPageIds": []
  },
  {
    "id": "quickstart/item-3",
    "kind": "entry",
    "sectionId": "quickstart",
    "sectionTitle": "Quick start: run your first app",
    "module": "installed luastra CLI · about 10 minutes",
    "callable": false,
    "useWhen": "Run this after each small source or manifest change and before previewing or building.",
    "code": "luastra check\nluastra test",
    "signature": "luastra check · luastra test",
    "parameters": [],
    "returns": null,
    "name": "3. Check and test",
    "description": "check validates strict Luau, the module graph, manifest, assets, capabilities, and SDK identity; test executes the test modules declared in luastra.json.",
    "language": "Shell",
    "points": [
      "Both commands should emit JSON with result set to PASS.",
      "A check failure names the source or manifest problem; fix that first instead of continuing to preview.",
      "The generated smoke test checks SDK construction, not every interaction you add later."
    ],
    "previousPageId": "quickstart/item-2",
    "nextPageId": "quickstart/item-4",
    "relatedPageIds": []
  },
  {
    "id": "quickstart/item-4",
    "kind": "entry",
    "sectionId": "quickstart",
    "sectionTitle": "Quick start: run your first app",
    "module": "installed luastra CLI · about 10 minutes",
    "callable": false,
    "useWhen": "Use this during development after check and test pass.",
    "code": "luastra run\n# Open the READY URL, press Continue, then stop with Ctrl+C.",
    "signature": "luastra run",
    "parameters": [],
    "returns": null,
    "name": "4. Preview and interact",
    "description": "Starts a watch-mode server on 127.0.0.1, prints the authoritative READY URL, and rebuilds after saved changes.",
    "language": "Shell",
    "points": [
      "The page should show your edited title and a Continue button.",
      "Each press updates module state through Application.handle and the next render shows a larger interaction count.",
      "Keep the terminal open while previewing; Ctrl+C stops the local server."
    ],
    "previousPageId": "quickstart/item-3",
    "nextPageId": "quickstart/item-5",
    "relatedPageIds": []
  },
  {
    "id": "quickstart/item-5",
    "kind": "entry",
    "sectionId": "quickstart",
    "sectionTitle": "Quick start: run your first app",
    "module": "installed luastra CLI · about 10 minutes",
    "callable": false,
    "useWhen": "Use this after the interactive preview works and you need a deployable web artifact.",
    "code": "luastra build web\n# Output: ./dist/web",
    "signature": "luastra build web",
    "parameters": [],
    "returns": null,
    "name": "5. Build the web target",
    "description": "Creates the production-style static artifact in dist/web by default.",
    "language": "Shell",
    "points": [
      "The command should emit JSON with result=PASS and the output directory.",
      "The installed CLI builds web and host-neutral bundle targets; application-facing desktop/mobile packaging is not yet a CLI command.",
      "Serve dist/web through an HTTP server or hosting provider. Opening index.html through file:// is unsupported."
    ],
    "previousPageId": "quickstart/item-4",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "workflow/item-1",
    "kind": "entry",
    "sectionId": "workflow",
    "sectionTitle": "Workflow",
    "module": null,
    "callable": false,
    "useWhen": "Use this once when beginning an application; then enter the created directory before running the remaining commands.",
    "code": "luastra create <directory>",
    "signature": "luastra create <directory>",
    "parameters": [],
    "returns": null,
    "name": "Create a project",
    "description": "Creates a new starter project in a missing or empty directory.",
    "language": "Shell",
    "previousPageId": null,
    "nextPageId": "workflow/item-2",
    "relatedPageIds": []
  },
  {
    "id": "workflow/item-2",
    "kind": "entry",
    "sectionId": "workflow",
    "sectionTitle": "Workflow",
    "module": null,
    "callable": false,
    "useWhen": "Run after changing source code or luastra.json, and always before tests, preview, or a release build.",
    "code": "luastra check",
    "signature": "luastra check",
    "parameters": [],
    "returns": null,
    "name": "Check",
    "description": "Analyzes the strict Luau graph, manifest, capabilities, assets, and SDK identity.",
    "language": "Shell",
    "previousPageId": "workflow/item-1",
    "nextPageId": "workflow/item-3",
    "relatedPageIds": []
  },
  {
    "id": "workflow/item-3",
    "kind": "entry",
    "sectionId": "workflow",
    "sectionTitle": "Workflow",
    "module": null,
    "callable": false,
    "useWhen": "Run after changing application logic, event handling, state transitions, or SDK-facing code.",
    "code": "luastra test",
    "signature": "luastra test",
    "parameters": [],
    "returns": null,
    "name": "Run tests",
    "description": "Runs the project’s bounded Luau test modules.",
    "language": "Shell",
    "previousPageId": "workflow/item-2",
    "nextPageId": "workflow/item-4",
    "relatedPageIds": []
  },
  {
    "id": "workflow/item-4",
    "kind": "entry",
    "sectionId": "workflow",
    "sectionTitle": "Workflow",
    "module": null,
    "callable": false,
    "useWhen": "Use during interactive development when you want to inspect and debug the application in a browser.",
    "code": "luastra run",
    "signature": "luastra run",
    "parameters": [],
    "returns": null,
    "name": "Run preview",
    "description": "Starts the local development server with rebuilding and reload feedback.",
    "language": "Shell",
    "previousPageId": "workflow/item-3",
    "nextPageId": "workflow/item-5",
    "relatedPageIds": []
  },
  {
    "id": "workflow/item-5",
    "kind": "entry",
    "sectionId": "workflow",
    "sectionTitle": "Workflow",
    "module": null,
    "callable": false,
    "useWhen": "Use when you need a production-style web artifact for HTTP serving or deployment verification.",
    "code": "luastra build web",
    "signature": "luastra build web",
    "parameters": [],
    "returns": null,
    "name": "Build web",
    "description": "Creates the static web output in dist/web.",
    "language": "Shell",
    "previousPageId": "workflow/item-4",
    "nextPageId": "workflow/item-6",
    "relatedPageIds": []
  },
  {
    "id": "workflow/item-6",
    "kind": "entry",
    "sectionId": "workflow",
    "sectionTitle": "Workflow",
    "module": null,
    "callable": false,
    "useWhen": "Use when a host workflow needs the compiled Luastra application bundle rather than the complete static website.",
    "code": "luastra build bundle",
    "signature": "luastra build bundle",
    "parameters": [],
    "returns": null,
    "name": "Build bundle",
    "description": "Creates the host-neutral runtime bundle.",
    "language": "Shell",
    "previousPageId": "workflow/item-5",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "recipes/item-1",
    "kind": "guide",
    "sectionId": "recipes",
    "sectionTitle": "How to use the build recipes",
    "module": "copy · verify · understand · adapt",
    "callable": false,
    "useWhen": "Use this checklist whenever you follow or write a Luastra recipe.",
    "code": null,
    "signature": "goal → files → checks → interaction → explanation",
    "parameters": [],
    "returns": null,
    "name": "Recipe contract",
    "description": "A recipe is complete only when its imports, manifest dependencies, capabilities, event path, expected UI, and verification boundary are all explicit.",
    "points": [
      "Goal: know the visible behavior before copying code.",
      "Files: replace exactly the listed files in a fresh starter project.",
      "Checks: do not continue until luastra check and luastra test report result=PASS.",
      "Interaction: follow the stated clicks and compare the visible result.",
      "Boundary: automated checks prove contracts; the named browser or device interaction proves presentation."
    ],
    "previousPageId": null,
    "nextPageId": "recipes/item-2",
    "relatedPageIds": []
  },
  {
    "id": "recipes/item-2",
    "kind": "guide",
    "sectionId": "recipes",
    "sectionTitle": "How to use the build recipes",
    "module": "copy · verify · understand · adapt",
    "callable": false,
    "useWhen": "Use this order when you have no particular feature in mind yet.",
    "code": null,
    "signature": "stateful UI → timer → navigation → storage → history → form → assets → motion → server → media → Orbit",
    "parameters": [],
    "returns": null,
    "name": "Choose the next recipe",
    "description": "Begin with the smallest new lifecycle concept and keep the previous recipe available for comparison.",
    "points": [
      "Complete mini-app teaches render and handle.",
      "Delayed action adds a host event without Application.resolve.",
      "Typed navigation adds checked route state and Back behavior.",
      "Storage and History add asynchronous host acknowledgements and platform-owned navigation.",
      "The Form and modal recipe adds controlled input, validation, and accessible focus behavior.",
      "The Assets and visuals recipe adds packaged images plus semantic host-native geometry.",
      "Declarative motion adds host-scheduled presentation without an application frame loop.",
      "The Server Function recipe adds a generated client, trusted handler, and asynchronous result decoding.",
      "The Audio Playback recipe adds command completion plus event-driven live media state.",
      "The Constellation Orbit recipe combines semantic nodes, bounded depth, relationships, and focused detail without application-owned coordinates."
    ],
    "previousPageId": "recipes/item-1",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "recipe-timer/item-1",
    "kind": "entry",
    "sectionId": "recipe-timer",
    "sectionTitle": "Recipe: run a delayed action",
    "module": "luastra/timer · Application.handle · about 10 minutes",
    "callable": false,
    "useWhen": "Run this in the directory that should contain the new project.",
    "code": "luastra create timer-recipe\ncd timer-recipe",
    "signature": "luastra create timer-recipe",
    "parameters": [],
    "returns": null,
    "name": "1. Create the project",
    "description": "Start from a normal generated project, then replace its manifest, entry module, and smoke test with the three complete files below.",
    "language": "Shell",
    "previousPageId": null,
    "nextPageId": "recipe-timer/item-2",
    "relatedPageIds": []
  },
  {
    "id": "recipe-timer/item-2",
    "kind": "entry",
    "sectionId": "recipe-timer",
    "sectionTitle": "Recipe: run a delayed action",
    "module": "luastra/timer · Application.handle · about 10 minutes",
    "callable": false,
    "useWhen": "Replace the generated manifest before running check; undeclared timer.control or luastra/timer usage is rejected.",
    "code": "{\n  \"schemaVersion\": 2,\n  \"project\": {\n    \"id\": \"dev.luastra.timer-recipe\",\n    \"entry\": \"app/main\"\n  },\n  \"sdk\": {\n    \"contract\": 1\n  },\n  \"capabilities\": [\"timer.control\", \"ui.render\"],\n  \"modules\": [\n    {\n      \"id\": \"app/main\",\n      \"source\": \"src/main.luau\",\n      \"dependencies\": [\"luastra/timer\", \"luastra/ui\"]\n    },\n    {\n      \"id\": \"app/tests/timer\",\n      \"source\": \"tests/smoke.luau\",\n      \"dependencies\": [\"app/main\"]\n    }\n  ],\n  \"tests\": [\"app/tests/timer\"]\n}",
    "signature": "timer.control + ui.render",
    "parameters": [],
    "returns": null,
    "name": "2. Replace luastra.json",
    "description": "The manifest admits the two imported SDK modules and the host capability required to control timers.",
    "language": "JSON",
    "previousPageId": "recipe-timer/item-1",
    "nextPageId": "recipe-timer/item-3",
    "relatedPageIds": []
  },
  {
    "id": "recipe-timer/item-3",
    "kind": "entry",
    "sectionId": "recipe-timer",
    "sectionTitle": "Recipe: run a delayed action",
    "module": "luastra/timer · Application.handle · about 10 minutes",
    "callable": false,
    "useWhen": "Replace the entire generated src/main.luau file so every referenced name and lifecycle callback is present.",
    "code": "--!strict\n\nlocal Timer = require(\"luastra/timer\")\nlocal UI = require(\"luastra/ui\")\n\nlocal Application = {}\nlocal elapsed = 0\nlocal lastValue = \"waiting\"\n\nfunction Application.render(): UI.Node\n    return UI.Screen {\n        id = \"timer-lab\",\n        UI.Text { id = \"timer/status\", text = `{elapsed}:{lastValue}` },\n        UI.Button {\n            id = \"timer/start\",\n            text = \"Start\",\n            onTap = \"start-timer\",\n        },\n    }\nend\n\nfunction Application.handle(action: string, target: string, value: string)\n    if action == \"start-timer\" and target == \"timer/start\" then\n        Timer.start { id = \"timer/next-card\", delayMs = 25, value = \"next\" }\n    elseif action == \"timer\" and target == \"timer/next-card\" then\n        elapsed += 1\n        lastValue = value\n    end\nend\n\nfunction Application.snapshot()\n    return { elapsed = elapsed, value = lastValue }\nend\n\nreturn Application",
    "signature": "complete runnable entry module",
    "parameters": [],
    "returns": null,
    "name": "3. Replace src/main.luau",
    "description": "The button starts work; the timer event changes module state; the following render exposes that change.",
    "wide": true,
    "previousPageId": "recipe-timer/item-2",
    "nextPageId": "recipe-timer/item-4",
    "relatedPageIds": []
  },
  {
    "id": "recipe-timer/item-4",
    "kind": "entry",
    "sectionId": "recipe-timer",
    "sectionTitle": "Recipe: run a delayed action",
    "module": "luastra/timer · Application.handle · about 10 minutes",
    "callable": false,
    "useWhen": "Replace the generated smoke test so luastra test verifies application behavior rather than only an isolated UI constructor.",
    "code": "--!strict\n\nlocal Application = require(\"app/main\")\n\nlocal initial = Application.snapshot()\nassert(initial.elapsed == 0, \"timer recipe must start at zero\")\nassert(initial.value == \"waiting\", \"timer recipe initial value is invalid\")\n\nApplication.handle(\"timer\", \"timer/next-card\", \"next\")\n\nlocal elapsed = Application.snapshot()\nassert(elapsed.elapsed == 1, \"timer event did not advance state\")\nassert(elapsed.value == \"next\", \"timer event did not preserve its value\")\n\nreturn true",
    "signature": "deterministic state-transition test",
    "parameters": [],
    "returns": null,
    "name": "4. Replace tests/smoke.luau",
    "description": "The test invokes the same timer event that the host delivers and verifies the state read by the following render.",
    "wide": true,
    "previousPageId": "recipe-timer/item-3",
    "nextPageId": "recipe-timer/item-5",
    "relatedPageIds": []
  },
  {
    "id": "recipe-timer/item-5",
    "kind": "entry",
    "sectionId": "recipe-timer",
    "sectionTitle": "Recipe: run a delayed action",
    "module": "luastra/timer · Application.handle · about 10 minutes",
    "callable": false,
    "useWhen": "Run from timer-recipe after all three files are saved.",
    "code": "luastra check\nluastra test\nluastra run\n# Open the READY URL, press Start, expect 1:next, then stop with Ctrl+C.",
    "signature": "PASS → Start → 1:next",
    "parameters": [],
    "returns": null,
    "name": "5. Check and run",
    "description": "First prove the project contract, then verify the visible event path in the live preview.",
    "language": "Shell",
    "points": [
      "check must report result=PASS.",
      "test must report tests=1 and passed=1.",
      "The test proves the state transition; the preview interaction separately proves that this browser host scheduled and delivered the timer event."
    ],
    "previousPageId": "recipe-timer/item-4",
    "nextPageId": "recipe-timer/item-6",
    "relatedPageIds": []
  },
  {
    "id": "recipe-timer/item-6",
    "kind": "guide",
    "sectionId": "recipe-timer",
    "sectionTitle": "Recipe: run a delayed action",
    "module": "luastra/timer · Application.handle · about 10 minutes",
    "callable": false,
    "useWhen": "Read this after the unmodified recipe works once.",
    "code": null,
    "signature": "handle(start-timer) → Timer.start → handle(timer)",
    "parameters": [],
    "returns": null,
    "name": "6. Understand and adapt",
    "description": "The stable timer id is the event target, while value carries the optional bounded payload.",
    "points": [
      "Use restart to replace the delay for the same id.",
      "Use cancel when the owning screen or state is no longer active.",
      "Treat an unexpected late timer event as stale instead of applying it to unrelated state.",
      "Keep delays at or below 60,000 ms; use persisted time or a backend scheduler for longer durable work."
    ],
    "previousPageId": "recipe-timer/item-5",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "recipe-navigation/item-1",
    "kind": "entry",
    "sectionId": "recipe-navigation",
    "sectionTitle": "Recipe: add typed navigation",
    "module": "luastra/navigation · checked parameters · about 15 minutes",
    "callable": false,
    "useWhen": "Run this in the directory that should contain the new project.",
    "code": "luastra create navigation-recipe\ncd navigation-recipe",
    "signature": "luastra create navigation-recipe",
    "parameters": [],
    "returns": null,
    "name": "1. Create the project",
    "description": "Start from a normal generated project, then replace its manifest, entry module, and smoke test with the three complete files below.",
    "language": "Shell",
    "previousPageId": null,
    "nextPageId": "recipe-navigation/item-2",
    "relatedPageIds": []
  },
  {
    "id": "recipe-navigation/item-2",
    "kind": "entry",
    "sectionId": "recipe-navigation",
    "sectionTitle": "Recipe: add typed navigation",
    "module": "luastra/navigation · checked parameters · about 15 minutes",
    "callable": false,
    "useWhen": "Use this minimal manifest for in-memory typed routing; add navigation.history only when calling the matching Host history API.",
    "code": "{\n  \"schemaVersion\": 2,\n  \"project\": {\n    \"id\": \"dev.luastra.navigation-recipe\",\n    \"entry\": \"app/main\"\n  },\n  \"sdk\": {\n    \"contract\": 1\n  },\n  \"capabilities\": [\"ui.render\"],\n  \"modules\": [\n    {\n      \"id\": \"app/main\",\n      \"source\": \"src/main.luau\",\n      \"dependencies\": [\"luastra/navigation\", \"luastra/ui\"]\n    },\n    {\n      \"id\": \"app/tests/routing\",\n      \"source\": \"tests/smoke.luau\",\n      \"dependencies\": [\"app/main\"]\n    }\n  ],\n  \"tests\": [\"app/tests/routing\"]\n}",
    "signature": "luastra/navigation + luastra/ui",
    "parameters": [],
    "returns": null,
    "name": "2. Replace luastra.json",
    "description": "Pure typed navigation needs no host capability beyond rendering because this recipe does not yet modify browser History.",
    "language": "JSON",
    "previousPageId": "recipe-navigation/item-1",
    "nextPageId": "recipe-navigation/item-3",
    "relatedPageIds": []
  },
  {
    "id": "recipe-navigation/item-3",
    "kind": "entry",
    "sectionId": "recipe-navigation",
    "sectionTitle": "Recipe: add typed navigation",
    "module": "luastra/navigation · checked parameters · about 15 minutes",
    "callable": false,
    "useWhen": "Replace the entire generated src/main.luau file; the compact layout intentionally omits host History so the router contract is visible first.",
    "code": "--!strict\n\nlocal Navigation = require(\"luastra/navigation\")\nlocal UI = require(\"luastra/ui\")\n\nlocal routes = Navigation.compile {\n    { name = \"home\", path = \"/\" },\n    {\n        name = \"workspace\",\n        path = \"/workspaces/:workspace_id\",\n        params = { workspace_id = { type = \"integer\", minimum = 1, maximum = 999 } },\n    },\n    {\n        name = \"document\",\n        parent = \"workspace\",\n        path = \"documents/:document_slug\",\n        params = { document_slug = { type = \"string\", maximumLength = 32 } },\n        query = { mode = { type = \"enum\", values = { \"read\", \"edit\" }, required = true } },\n    },\n}\n\nlocal router = Navigation.createRouter {\n    compiler = routes,\n    initial = { name = \"home\", params = {}, query = {} },\n}\n\nlocal Application = {}\n\nfunction Application.render(): UI.Node\n    local current = router.current()\n    return UI.Screen {\n        id = \"routing-lab\",\n        UI.Text { id = \"routing/title\", text = \"Routing lab\", variant = \"title\" },\n        UI.Text { id = \"routing/name\", text = \"Route: \" .. current.name },\n        UI.Text { id = \"routing/location\", text = router.currentLocation(), role = \"status\" },\n        UI.Actions {\n            id = \"routing/actions\",\n            UI.Button {\n                id = \"routing/workspace\",\n                text = \"Open workspace\",\n                onTap = \"open-workspace\",\n            },\n            UI.Button {\n                id = \"routing/document\",\n                text = \"Open document\",\n                onTap = \"open-document\",\n            },\n            UI.Button {\n                id = \"routing/back\",\n                text = \"Back\",\n                onTap = \"back\",\n                disabled = not router.canBack(),\n            },\n        },\n    }\nend\n\nfunction Application.handle(action: string, target: string, _value: string)\n    if action == \"open-workspace\" and target == \"routing/workspace\" then\n        router.push { name = \"workspace\", params = { workspace_id = 7 }, query = {} }\n    elseif action == \"open-document\" and target == \"routing/document\" then\n        router.push {\n            name = \"document\",\n            params = { workspace_id = 7, document_slug = \"release-notes\" },\n            query = { mode = \"edit\" },\n        }\n    elseif action == \"back\" and target == \"routing/back\" then\n        router.back()\n    end\nend\n\nfunction Application.snapshot()\n    return {\n        name = router.current().name,\n        location = router.currentLocation(),\n    }\nend\n\nreturn Application",
    "signature": "complete runnable entry module",
    "parameters": [],
    "returns": null,
    "name": "3. Replace src/main.luau",
    "description": "Route definitions validate parameters and queries before a mutation can enter the stack.",
    "wide": true,
    "previousPageId": "recipe-navigation/item-2",
    "nextPageId": "recipe-navigation/item-4",
    "relatedPageIds": []
  },
  {
    "id": "recipe-navigation/item-4",
    "kind": "entry",
    "sectionId": "recipe-navigation",
    "sectionTitle": "Recipe: add typed navigation",
    "module": "luastra/navigation · checked parameters · about 15 minutes",
    "callable": false,
    "useWhen": "Replace the generated smoke test so luastra test verifies the route transitions that the preview exposes.",
    "code": "--!strict\n\nlocal Application = require(\"app/main\")\n\nassert(Application.snapshot().location == \"/\", \"recipe did not start at home\")\n\nApplication.handle(\"open-workspace\", \"routing/workspace\", \"\")\nassert(Application.snapshot().location == \"/workspaces/7\", \"workspace route failed\")\n\nApplication.handle(\"open-document\", \"routing/document\", \"\")\nlocal document = Application.snapshot()\nassert(document.name == \"document\", \"document route name is invalid\")\nassert(\n    document.location == \"/workspaces/7/documents/release-notes?mode=edit\",\n    \"document location is invalid\"\n)\n\nApplication.handle(\"back\", \"routing/back\", \"\")\nassert(Application.snapshot().location == \"/workspaces/7\", \"Back failed\")\n\nreturn true",
    "signature": "route sequence test",
    "parameters": [],
    "returns": null,
    "name": "4. Replace tests/smoke.luau",
    "description": "The test drives the same actions as the buttons and checks every canonical location without needing a browser.",
    "wide": true,
    "previousPageId": "recipe-navigation/item-3",
    "nextPageId": "recipe-navigation/item-5",
    "relatedPageIds": []
  },
  {
    "id": "recipe-navigation/item-5",
    "kind": "entry",
    "sectionId": "recipe-navigation",
    "sectionTitle": "Recipe: add typed navigation",
    "module": "luastra/navigation · checked parameters · about 15 minutes",
    "callable": false,
    "useWhen": "Run from navigation-recipe after all three files are saved.",
    "code": "luastra check\nluastra test\nluastra run\n# Open the READY URL.\n# Press Open workspace: expect /workspaces/7.\n# Press Open document: expect /workspaces/7/documents/release-notes?mode=edit.\n# Press Back: expect /workspaces/7.",
    "signature": "home → workspace → document → Back",
    "parameters": [],
    "returns": null,
    "name": "5. Check and run",
    "description": "Verify both route names and canonical locations after every interaction.",
    "language": "Shell",
    "points": [
      "check must report result=PASS and test must report tests=1 and passed=1.",
      "The Back button is disabled at the first route.",
      "An invalid parameter or missing required query produces a bounded unsuccessful mutation instead of a malformed location."
    ],
    "previousPageId": "recipe-navigation/item-4",
    "nextPageId": "recipe-navigation/item-6",
    "relatedPageIds": []
  },
  {
    "id": "recipe-navigation/item-6",
    "kind": "guide",
    "sectionId": "recipe-navigation",
    "sectionTitle": "Recipe: add typed navigation",
    "module": "luastra/navigation · checked parameters · about 15 minutes",
    "callable": false,
    "useWhen": "Read this after the unmodified route sequence works once.",
    "code": null,
    "signature": "definitions → compiler → router → render",
    "parameters": [],
    "returns": null,
    "name": "6. Understand and extend",
    "description": "The compiler owns path rules; the router owns the current stack; render reads it; handle requests checked mutations.",
    "points": [
      "Inspect each mutation result before assuming the route changed in product code.",
      "Persist router.encode() with State and Host storage only when navigation must survive restart.",
      "Use Host.historyPushLocation and navigation.history when browser Back and the visible URL must mirror Luau state.",
      "Never concatenate untrusted path fragments when a compiled route can validate and encode them."
    ],
    "previousPageId": "recipe-navigation/item-5",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "recipe-storage/item-1",
    "kind": "entry",
    "sectionId": "recipe-storage",
    "sectionTitle": "Recipe: persist and restore state",
    "module": "luastra/state · luastra/host · Application.resolve · about 15 minutes",
    "callable": false,
    "useWhen": "Run this in the directory that should contain the new project.",
    "code": "luastra create storage-recipe\ncd storage-recipe",
    "signature": "luastra create storage-recipe",
    "parameters": [],
    "returns": null,
    "name": "1. Create the project",
    "description": "Create a starter, then replace its manifest, entry module, and smoke test with the complete files below.",
    "language": "Shell",
    "previousPageId": null,
    "nextPageId": "recipe-storage/item-2",
    "relatedPageIds": []
  },
  {
    "id": "recipe-storage/item-2",
    "kind": "entry",
    "sectionId": "recipe-storage",
    "sectionTitle": "Recipe: persist and restore state",
    "module": "luastra/state · luastra/host · Application.resolve · about 15 minutes",
    "callable": false,
    "useWhen": "Replace the generated manifest before importing Host or State; storage reads and writes require separate capabilities.",
    "code": "{\n  \"schemaVersion\": 2,\n  \"project\": { \"id\": \"dev.luastra.storage-recipe\", \"entry\": \"app/main\" },\n  \"sdk\": { \"contract\": 1 },\n  \"capabilities\": [\"storage.get\", \"storage.set\", \"ui.render\"],\n  \"modules\": [\n    {\n      \"id\": \"app/main\",\n      \"source\": \"src/main.luau\",\n      \"dependencies\": [\"luastra/host\", \"luastra/state\", \"luastra/ui\"]\n    },\n    {\n      \"id\": \"app/tests/storage\",\n      \"source\": \"tests/smoke.luau\",\n      \"dependencies\": [\"app/main\", \"luastra/state\"]\n    }\n  ],\n  \"tests\": [\"app/tests/storage\"]\n}",
    "signature": "storage.get + storage.set + ui.render",
    "parameters": [],
    "returns": null,
    "name": "2. Replace luastra.json",
    "description": "The manifest admits State, Host, and UI modules plus both storage capabilities.",
    "language": "JSON",
    "previousPageId": "recipe-storage/item-1",
    "nextPageId": "recipe-storage/item-3",
    "relatedPageIds": []
  },
  {
    "id": "recipe-storage/item-3",
    "kind": "entry",
    "sectionId": "recipe-storage",
    "sectionTitle": "Recipe: persist and restore state",
    "module": "luastra/state · luastra/host · Application.resolve · about 15 minutes",
    "callable": false,
    "useWhen": "Replace the entire entry module. Keep restore separate so malformed persisted data can be tested without a real host request.",
    "code": "--!strict\n\nlocal Host = require(\"luastra/host\")\nlocal State = require(\"luastra/state\")\nlocal UI = require(\"luastra/ui\")\n\nlocal Application = {}\nlocal count = 0\nlocal message = \"Nothing saved yet\"\nlocal pending: { [number]: string } = {}\n\nlocal function track(id: number, operation: string)\n    pending[id] = operation\nend\n\nfunction Application.restore(payload: string): boolean\n    local decoded = State.decode(payload, 1)\n    if not decoded.success then return false end\n    local restored = tonumber(decoded.fields.count)\n    if restored == nil or restored < 0 or restored % 1 ~= 0 then return false end\n    count = restored\n    return true\nend\n\nfunction Application.render(): UI.Node\n    return UI.Screen {\n        id = \"storage-recipe\",\n        UI.Text { id = \"counter/title\", text = \"Persistent counter\", variant = \"title\" },\n        UI.Text { id = \"counter/value\", text = tostring(count), role = \"status\" },\n        UI.Text { id = \"counter/message\", text = message, role = \"status\" },\n        UI.Actions {\n            id = \"counter/actions\",\n            UI.Button { id = \"counter/add\", text = \"Add\", onTap = \"counter.add\" },\n            UI.Button { id = \"counter/save\", text = \"Save\", onTap = \"counter.save\" },\n            UI.Button { id = \"counter/load\", text = \"Load\", onTap = \"counter.load\" },\n        },\n    }\nend\n\nfunction Application.handle(action: string, target: string, _value: string)\n    if action == \"counter.add\" and target == \"counter/add\" then\n        count += 1\n    elseif action == \"counter.save\" and target == \"counter/save\" then\n        local snapshot = State.encode(1, { count = tostring(count) })\n        track(Host.storageSet(\"counter-state\", snapshot), \"save\")\n        message = \"Saving…\"\n    elseif action == \"counter.load\" and target == \"counter/load\" then\n        track(Host.storageGet(\"counter-state\"), \"load\")\n        message = \"Loading…\"\n    end\nend\n\nfunction Application.resolve(\n    id: number,\n    success: boolean,\n    payload: string,\n    code: string,\n    _errorMessage: string\n)\n    local operation = pending[id]\n    pending[id] = nil\n    if operation == nil then return end\n    if not success then message = operation .. \" failed: \" .. code return end\n    if operation == \"save\" then message = \"Saved\"\n    elseif Application.restore(payload) then message = \"Loaded\"\n    else message = \"Stored state is invalid\" end\nend\n\nfunction Application.snapshot()\n    return { count = count, message = message }\nend\n\nreturn Application",
    "signature": "complete asynchronous storage lifecycle",
    "parameters": [],
    "returns": null,
    "name": "3. Replace src/main.luau",
    "description": "Pending request IDs distinguish save and load completions that may arrive out of order.",
    "wide": true,
    "previousPageId": "recipe-storage/item-2",
    "nextPageId": "recipe-storage/item-4",
    "relatedPageIds": []
  },
  {
    "id": "recipe-storage/item-4",
    "kind": "entry",
    "sectionId": "recipe-storage",
    "sectionTitle": "Recipe: persist and restore state",
    "module": "luastra/state · luastra/host · Application.resolve · about 15 minutes",
    "callable": false,
    "useWhen": "Replace the generated smoke test so test covers both the successful and rejected restore paths.",
    "code": "--!strict\n\nlocal Application = require(\"app/main\")\nlocal State = require(\"luastra/state\")\n\nApplication.handle(\"counter.add\", \"counter/add\", \"\")\nassert(Application.snapshot().count == 1, \"counter action failed\")\n\nlocal snapshot = State.encode(1, { count = \"7\" })\nassert(Application.restore(snapshot), \"valid snapshot was rejected\")\nassert(Application.snapshot().count == 7, \"valid count was not restored\")\n\nassert(not Application.restore(\"v=1&count=invalid\"), \"invalid count was accepted\")\nassert(Application.snapshot().count == 7, \"invalid restore changed current state\")\n\nreturn true",
    "signature": "round-trip and rejection test",
    "parameters": [],
    "returns": null,
    "name": "4. Replace tests/smoke.luau",
    "description": "The test proves valid state restoration and confirms malformed data leaves the current counter unchanged.",
    "wide": true,
    "previousPageId": "recipe-storage/item-3",
    "nextPageId": "recipe-storage/item-5",
    "relatedPageIds": []
  },
  {
    "id": "recipe-storage/item-5",
    "kind": "entry",
    "sectionId": "recipe-storage",
    "sectionTitle": "Recipe: persist and restore state",
    "module": "luastra/state · luastra/host · Application.resolve · about 15 minutes",
    "callable": false,
    "useWhen": "Run from storage-recipe after all three files are saved.",
    "code": "luastra check\nluastra test\nluastra run\n# Add twice, Save, Add again, then Load: expect 2.\n# Reload the page, press Load again, and expect 2.",
    "signature": "save → change → load → reload → load",
    "parameters": [],
    "returns": null,
    "name": "5. Check and run",
    "description": "Automated tests verify deterministic state logic; the preview verifies the browser storage adapter and asynchronous resolve path.",
    "language": "Shell",
    "points": [
      "check must report result=PASS and test must report tests=1 and passed=1.",
      "Loading before the first save may produce a bounded failure or empty payload; keep the current count.",
      "A browser-host pass does not prove persistence in every desktop or mobile host."
    ],
    "previousPageId": "recipe-storage/item-4",
    "nextPageId": "recipe-storage/item-6",
    "relatedPageIds": []
  },
  {
    "id": "recipe-storage/item-6",
    "kind": "guide",
    "sectionId": "recipe-storage",
    "sectionTitle": "Recipe: persist and restore state",
    "module": "luastra/state · luastra/host · Application.resolve · about 15 minutes",
    "callable": false,
    "useWhen": "Read this after the unmodified save/load sequence works once.",
    "code": null,
    "signature": "encode → storageSet → resolve · storageGet → resolve → decode",
    "parameters": [],
    "returns": null,
    "name": "6. Understand and extend",
    "description": "Serialization, transport, and domain validation are three separate boundaries.",
    "points": [
      "Increment the snapshot version when its meaning changes.",
      "Use State.migrate when an older released version must remain readable.",
      "Never store credentials merely because storage accepts a string.",
      "Ignore unknown RequestIds and clear every matched pending entry before applying a completion."
    ],
    "previousPageId": "recipe-storage/item-5",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "recipe-history/item-1",
    "kind": "entry",
    "sectionId": "recipe-history",
    "sectionTitle": "Recipe: synchronize Browser and system Back",
    "module": "luastra/navigation · luastra/host · navigation.history · about 20 minutes",
    "callable": false,
    "useWhen": "Run this in the directory that should contain the new project.",
    "code": "luastra create history-recipe\ncd history-recipe",
    "signature": "luastra create history-recipe",
    "parameters": [],
    "returns": null,
    "name": "1. Create the project",
    "description": "Create a starter, then replace its manifest, entry module, and smoke test.",
    "language": "Shell",
    "previousPageId": null,
    "nextPageId": "recipe-history/item-2",
    "relatedPageIds": []
  },
  {
    "id": "recipe-history/item-2",
    "kind": "entry",
    "sectionId": "recipe-history",
    "sectionTitle": "Recipe: synchronize Browser and system Back",
    "module": "luastra/navigation · luastra/host · navigation.history · about 20 minutes",
    "callable": false,
    "useWhen": "Replace the generated manifest before calling any Host history or system Back response API.",
    "code": "{\n  \"schemaVersion\": 2,\n  \"project\": { \"id\": \"dev.luastra.history-recipe\", \"entry\": \"app/main\" },\n  \"sdk\": { \"contract\": 1 },\n  \"capabilities\": [\"navigation.history\", \"ui.render\"],\n  \"modules\": [\n    {\n      \"id\": \"app/main\",\n      \"source\": \"src/main.luau\",\n      \"dependencies\": [\"luastra/host\", \"luastra/navigation\", \"luastra/ui\"]\n    },\n    {\n      \"id\": \"app/tests/history\",\n      \"source\": \"tests/smoke.luau\",\n      \"dependencies\": [\"app/main\", \"luastra/navigation\"]\n    }\n  ],\n  \"tests\": [\"app/tests/history\"]\n}",
    "signature": "navigation.history + ui.render",
    "parameters": [],
    "returns": null,
    "name": "2. Replace luastra.json",
    "description": "The host capability is required for URL/history mutations and platform Back responses.",
    "language": "JSON",
    "previousPageId": "recipe-history/item-1",
    "nextPageId": "recipe-history/item-3",
    "relatedPageIds": []
  },
  {
    "id": "recipe-history/item-3",
    "kind": "entry",
    "sectionId": "recipe-history",
    "sectionTitle": "Recipe: synchronize Browser and system Back",
    "module": "luastra/navigation · luastra/host · navigation.history · about 20 minutes",
    "callable": false,
    "useWhen": "Replace the complete entry module. resolve reports rejected host requests; only history events restore router state, and only system_back events carry platform Back intents.",
    "code": "--!strict\n\nlocal Host = require(\"luastra/host\")\nlocal Navigation = require(\"luastra/navigation\")\nlocal UI = require(\"luastra/ui\")\n\nlocal routes = Navigation.compile {\n    { name = \"home\", path = \"/\" },\n    { name = \"detail\", path = \"/detail\" },\n}\nlocal router = Navigation.createRouter {\n    compiler = routes,\n    initial = { name = \"home\", params = {}, query = {} },\n}\nlocal Application = {}\nlocal message = \"At home\"\n\nlocal function location(): string\n    return \"#\" .. router.currentLocation()\nend\n\nfunction Application.restoreHistory(value: string): boolean\n    local result = router.restoreEncoded(value)\n    if result.success then message = \"History restored\" end\n    return result.success\nend\n\nfunction Application.render(): UI.Node\n    return UI.Screen {\n        id = \"history-recipe\",\n        UI.Text { id = \"history/title\", text = \"Route: \" .. router.current().name, variant = \"title\" },\n        UI.Text { id = \"history/location\", text = location(), role = \"status\" },\n        UI.Text { id = \"history/message\", text = message, role = \"status\" },\n        UI.Button { id = \"history/open\", text = \"Open detail\", onTap = \"route.open\" },\n    }\nend\n\nfunction Application.handle(action: string, target: string, value: string)\n    if action == \"lifecycle\" and target == \"app\" and value == \"launch\" then\n        Host.historyReplaceLocation(location(), router.encode())\n    elseif action == \"route.open\" and target == \"history/open\" then\n        local result = router.push { name = \"detail\", params = {}, query = {} }\n        if result.success and result.changed then\n            Host.historyPushLocation(location(), router.encode())\n            message = \"Detail opened\"\n        end\n    elseif action == \"history\" and target == \"app\" then\n        if not Application.restoreHistory(value) then message = \"Rejected history state\" end\n    elseif action == \"system_back\" and target == \"app\" then\n        local intent = tonumber(string.match(value, \"^([1-9][0-9]*):[01]$\"))\n        if intent ~= nil then\n            if router.canBack() then Host.systemBackHistory(intent)\n            else Host.systemBackExit(intent) end\n        end\n    end\nend\n\nfunction Application.resolve(\n    _id: number,\n    success: boolean,\n    _payload: string,\n    code: string,\n    diagnostic: string\n)\n    if not success then\n        message = \"History request failed: \" .. code .. \" — \" .. diagnostic\n    end\nend\n\nfunction Application.snapshot()\n    return { name = router.current().name, location = location() }\nend\n\nreturn Application",
    "signature": "one router owns every navigation outcome",
    "parameters": [],
    "returns": null,
    "name": "3. Replace src/main.luau",
    "description": "The application pushes; the host moves Back; both end by rendering the same validated router.",
    "wide": true,
    "previousPageId": "recipe-history/item-2",
    "nextPageId": "recipe-history/item-4",
    "relatedPageIds": []
  },
  {
    "id": "recipe-history/item-4",
    "kind": "entry",
    "sectionId": "recipe-history",
    "sectionTitle": "Recipe: synchronize Browser and system Back",
    "module": "luastra/navigation · luastra/host · navigation.history · about 20 minutes",
    "callable": false,
    "useWhen": "Replace the generated smoke test to verify atomic history restoration before opening a browser.",
    "code": "--!strict\n\nlocal Application = require(\"app/main\")\nlocal Navigation = require(\"luastra/navigation\")\n\nlocal routes = Navigation.compile {\n    { name = \"home\", path = \"/\" },\n    { name = \"detail\", path = \"/detail\" },\n}\nlocal source = Navigation.createRouter {\n    compiler = routes,\n    initial = { name = \"home\", params = {}, query = {} },\n}\nassert(source.push { name = \"detail\", params = {}, query = {} }.success)\nassert(Application.restoreHistory(source.encode()), \"valid history was rejected\")\nassert(Application.snapshot().location == \"#/detail\", \"detail history was not restored\")\nassert(not Application.restoreHistory(\"invalid\"), \"malformed history was accepted\")\nassert(Application.snapshot().location == \"#/detail\", \"failed restore changed the route\")\nassert(Navigation.decideBack { modalOpen = false, canBack = true } == \"history\")\n\nreturn true",
    "signature": "valid and invalid history restoration",
    "parameters": [],
    "returns": null,
    "name": "4. Replace tests/smoke.luau",
    "description": "The test supplies encoded router state directly and proves malformed history cannot replace the current route.",
    "wide": true,
    "previousPageId": "recipe-history/item-3",
    "nextPageId": "recipe-history/item-5",
    "relatedPageIds": []
  },
  {
    "id": "recipe-history/item-5",
    "kind": "entry",
    "sectionId": "recipe-history",
    "sectionTitle": "Recipe: synchronize Browser and system Back",
    "module": "luastra/navigation · luastra/host · navigation.history · about 20 minutes",
    "callable": false,
    "useWhen": "Run from history-recipe after all three files are saved.",
    "code": "luastra check\nluastra test\nluastra run\n# Press Open detail: expect #/detail.\n# Use Browser Back: expect #/ and Route: home.",
    "signature": "Open detail → Browser Back → Home",
    "parameters": [],
    "returns": null,
    "name": "5. Check and run",
    "description": "The test proves state validation; the browser interaction proves URL and popstate integration in this host.",
    "language": "Shell",
    "points": [
      "check and test must report PASS with one passing test.",
      "On a mobile host, Back at detail delegates to history; Back at root may request application exit.",
      "Desktop, web, Android, and iOS Back behavior must still be verified independently."
    ],
    "previousPageId": "recipe-history/item-4",
    "nextPageId": "recipe-history/item-6",
    "relatedPageIds": []
  },
  {
    "id": "recipe-history/item-6",
    "kind": "guide",
    "sectionId": "recipe-history",
    "sectionTitle": "Recipe: synchronize Browser and system Back",
    "module": "luastra/navigation · luastra/host · navigation.history · about 20 minutes",
    "callable": false,
    "useWhen": "Read this before adding a modal or another local navigation layer.",
    "code": null,
    "signature": "modal → history → exit",
    "parameters": [],
    "returns": null,
    "name": "6. Understand the arbitration",
    "description": "Navigation.decideBack defines priority; the application performs one matching host response for each fresh intent.",
    "points": [
      "Dismiss application-owned modal state and acknowledge handled.",
      "Delegate to host history when a previous route exists.",
      "Request exit only at the application root where the platform supports it.",
      "Ignore malformed or repeated intent values; never respond twice to one intent."
    ],
    "previousPageId": "recipe-history/item-5",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "recipe-form-modal/item-1",
    "kind": "entry",
    "sectionId": "recipe-form-modal",
    "sectionTitle": "Recipe: validate a form and confirm in a modal",
    "module": "luastra/ui · luastra/data · controlled input · about 20 minutes",
    "callable": false,
    "useWhen": "Run this in the directory that should contain the new project.",
    "code": "luastra create form-modal-recipe\ncd form-modal-recipe",
    "signature": "luastra create form-modal-recipe",
    "parameters": [],
    "returns": null,
    "name": "1. Create the project",
    "description": "Create a starter, then replace its manifest, entry module, and smoke test.",
    "language": "Shell",
    "previousPageId": null,
    "nextPageId": "recipe-form-modal/item-2",
    "relatedPageIds": []
  },
  {
    "id": "recipe-form-modal/item-2",
    "kind": "entry",
    "sectionId": "recipe-form-modal",
    "sectionTitle": "Recipe: validate a form and confirm in a modal",
    "module": "luastra/ui · luastra/data · controlled input · about 20 minutes",
    "callable": false,
    "useWhen": "Replace the generated manifest before importing Data or composing the form primitives.",
    "code": "{\n  \"schemaVersion\": 2,\n  \"project\": { \"id\": \"dev.luastra.form-modal-recipe\", \"entry\": \"app/main\" },\n  \"sdk\": { \"contract\": 1 },\n  \"capabilities\": [\"ui.render\"],\n  \"modules\": [\n    {\n      \"id\": \"app/main\",\n      \"source\": \"src/main.luau\",\n      \"dependencies\": [\"luastra/data\", \"luastra/ui\"]\n    },\n    {\n      \"id\": \"app/tests/form-modal\",\n      \"source\": \"tests/smoke.luau\",\n      \"dependencies\": [\"app/main\"]\n    }\n  ],\n  \"tests\": [\"app/tests/form-modal\"]\n}",
    "signature": "luastra/data + luastra/ui",
    "parameters": [],
    "returns": null,
    "name": "2. Replace luastra.json",
    "description": "Form validation and modal state are synchronous application logic, so this recipe needs only ui.render.",
    "language": "JSON",
    "previousPageId": "recipe-form-modal/item-1",
    "nextPageId": "recipe-form-modal/item-3",
    "relatedPageIds": []
  },
  {
    "id": "recipe-form-modal/item-3",
    "kind": "entry",
    "sectionId": "recipe-form-modal",
    "sectionTitle": "Recipe: validate a form and confirm in a modal",
    "module": "luastra/ui · luastra/data · controlled input · about 20 minutes",
    "callable": false,
    "useWhen": "Replace the complete entry module. Keep modal visibility in state and use the same dismissal action for Escape, backdrop dismissal, and the visible cancel button.",
    "code": "--!strict\n\nlocal Data = require(\"luastra/data\")\nlocal UI = require(\"luastra/ui\")\n\nlocal nameSchema = Data.string { minBytes = 2, maxBytes = 60, trim = true }\nlocal emailSchema = Data.string { minBytes = 3, maxBytes = 160, trim = true }\n\nlocal Application = {}\nlocal name = \"\"\nlocal email = \"\"\nlocal nameError: string? = nil\nlocal emailError: string? = nil\nlocal modalOpen = false\nlocal status = \"Complete both fields\"\nlocal submittedName: string? = nil\n\nlocal function validEmail(value: string): boolean\n    return string.match(value, \"^[^%s@]+@[^%s@]+%.[^%s@]+$\") ~= nil\nend\n\nlocal function validate(): boolean\n    local checkedName = Data.decode(nameSchema, name)\n    local checkedEmail = Data.decode(emailSchema, email)\n    if checkedName.success then nameError = nil\n    else nameError = \"Enter 2 to 60 bytes.\" end\n    if checkedEmail.success then emailError = nil\n    else emailError = \"Enter an email address.\" end\n    if checkedEmail.success and not validEmail(checkedEmail.value) then\n        emailError = \"Use a format such as name@example.com.\"\n    end\n    if not checkedName.success or not checkedEmail.success or emailError ~= nil then\n        status = \"Fix the highlighted fields\"\n        return false\n    end\n    name = checkedName.value\n    email = checkedEmail.value\n    modalOpen = true\n    status = \"Review the normalized values\"\n    return true\nend\n\nfunction Application.render(): UI.Node\n    return UI.Screen {\n        id = \"profile\",\n        width = \"content\",\n        padding = \"responsive\",\n        UI.Card {\n            id = \"profile/form\",\n            gap = \"md\",\n            padding = \"lg\",\n            surface = \"elevated\",\n            UI.Text { id = \"profile/title\", text = \"Create profile\", variant = \"title\" },\n            UI.Field {\n                id = \"profile/name-field\",\n                gap = \"xs\",\n                role = \"group\",\n                label = \"Name field\",\n                UI.Text { id = \"profile/name-label\", text = \"Name\" },\n                UI.TextInput {\n                    id = \"profile/name\",\n                    label = \"Name\",\n                    value = name,\n                    onInput = \"form.name\",\n                    autoComplete = \"name\",\n                    enterKeyHint = \"next\",\n                    required = true,\n                    errorId = nameError ~= nil and \"profile/name-error\" or nil,\n                },\n                UI.Text {\n                    id = \"profile/name-error\",\n                    text = nameError or \"\",\n                    role = \"alert\",\n                    tone = \"error\",\n                    hidden = nameError == nil,\n                },\n            },\n            UI.Field {\n                id = \"profile/email-field\",\n                gap = \"xs\",\n                role = \"group\",\n                label = \"Email field\",\n                UI.Text { id = \"profile/email-label\", text = \"Email\" },\n                UI.TextInput {\n                    id = \"profile/email\",\n                    label = \"Email\",\n                    value = email,\n                    onInput = \"form.email\",\n                    inputType = \"email\",\n                    inputMode = \"email\",\n                    autoComplete = \"email\",\n                    enterKeyHint = \"done\",\n                    required = true,\n                    errorId = emailError ~= nil and \"profile/email-error\" or nil,\n                },\n                UI.Text {\n                    id = \"profile/email-error\",\n                    text = emailError or \"\",\n                    role = \"alert\",\n                    tone = \"error\",\n                    hidden = emailError == nil,\n                },\n            },\n            UI.Text { id = \"profile/status\", text = status, role = \"status\" },\n            UI.Actions {\n                id = \"profile/actions\",\n                responsive = true,\n                UI.Button {\n                    id = \"profile/review\",\n                    text = \"Review\",\n                    onTap = \"form.review\",\n                    appearance = \"primary\",\n                },\n            },\n        },\n        UI.Modal {\n            id = \"profile/confirm-modal\",\n            label = \"Confirm profile\",\n            open = modalOpen,\n            onDismiss = \"form.cancel-review\",\n            UI.Stack {\n                id = \"profile/confirm-content\",\n                gap = \"md\",\n                padding = \"lg\",\n                UI.Text { id = \"profile/confirm-title\", text = \"Confirm profile\", variant = \"heading\" },\n                UI.Text { id = \"profile/confirm-name\", text = \"Name: \" .. name },\n                UI.Text { id = \"profile/confirm-email\", text = \"Email: \" .. email },\n                UI.Actions {\n                    id = \"profile/confirm-actions\",\n                    responsive = true,\n                    UI.Button {\n                        id = \"profile/confirm\",\n                        text = \"Confirm\",\n                        onTap = \"form.confirm\",\n                        appearance = \"primary\",\n                    },\n                    UI.Button {\n                        id = \"profile/cancel\",\n                        text = \"Keep editing\",\n                        onTap = \"form.cancel-review\",\n                        appearance = \"secondary\",\n                    },\n                },\n            },\n        },\n    }\nend\n\nfunction Application.handle(action: string, target: string, value: string)\n    if action == \"form.name\" and target == \"profile/name\" then\n        name = value\n        nameError = nil\n    elseif action == \"form.email\" and target == \"profile/email\" then\n        email = value\n        emailError = nil\n    elseif action == \"form.review\" and target == \"profile/review\" then\n        validate()\n    elseif action == \"form.cancel-review\"\n        and (target == \"profile/cancel\" or target == \"profile/confirm-modal\") then\n        modalOpen = false\n        status = \"Continue editing\"\n    elseif action == \"form.confirm\" and target == \"profile/confirm\" and modalOpen then\n        modalOpen = false\n        submittedName = name\n        status = \"Profile confirmed for \" .. name\n    end\nend\n\nfunction Application.snapshot()\n    return {\n        name = name,\n        email = email,\n        nameError = nameError,\n        emailError = emailError,\n        modalOpen = modalOpen,\n        status = status,\n        submittedName = submittedName,\n    }\nend\n\nreturn Application",
    "signature": "controlled fields → validation → modal → confirmation",
    "parameters": [],
    "returns": null,
    "name": "3. Replace src/main.luau",
    "description": "Every visible value and error comes from Luau state; the modal opens only after normalized values pass both validation layers.",
    "wide": true,
    "previousPageId": "recipe-form-modal/item-2",
    "nextPageId": "recipe-form-modal/item-4",
    "relatedPageIds": []
  },
  {
    "id": "recipe-form-modal/item-4",
    "kind": "entry",
    "sectionId": "recipe-form-modal",
    "sectionTitle": "Recipe: validate a form and confirm in a modal",
    "module": "luastra/ui · luastra/data · controlled input · about 20 minutes",
    "callable": false,
    "useWhen": "Replace the generated smoke test to cover invalid input, normalization, both modal exit paths, and confirmation.",
    "code": "--!strict\n\nlocal Application = require(\"app/main\")\n\nlocal function find(node: any, id: string): any?\n    if node.id == id then return node end\n    for _, child in node.children or {} do\n        local result = find(child, id)\n        if result ~= nil then return result end\n    end\n    return nil\nend\n\nApplication.handle(\"form.review\", \"profile/review\", \"\")\nlocal invalidTree = Application.render()\nassert(Application.snapshot().modalOpen == false, \"invalid form opened the modal\")\nassert((find(invalidTree, \"profile/name\") :: any).properties.errorId == \"profile/name-error\")\nassert((find(invalidTree, \"profile/email-error\") :: any).properties.role == \"alert\")\n\nApplication.handle(\"form.name\", \"profile/name\", \"  Ada  \")\nApplication.handle(\"form.email\", \"profile/email\", \"not-an-email\")\nApplication.handle(\"form.review\", \"profile/review\", \"\")\nassert(Application.snapshot().emailError ~= nil, \"invalid email was accepted\")\n\nApplication.handle(\"form.email\", \"profile/email\", \"ada@example.test\")\nApplication.handle(\"form.review\", \"profile/review\", \"\")\nassert(Application.snapshot().modalOpen == true, \"valid form did not open the modal\")\nassert(Application.snapshot().name == \"Ada\", \"validated name was not trimmed\")\nassert((find(Application.render(), \"profile/confirm-modal\") :: any).properties.open == true)\n\nApplication.handle(\"form.cancel-review\", \"profile/confirm-modal\", \"escape\")\nassert(Application.snapshot().modalOpen == false, \"modal dismissal was ignored\")\nApplication.handle(\"form.review\", \"profile/review\", \"\")\nApplication.handle(\"form.confirm\", \"profile/confirm\", \"\")\nassert(Application.snapshot().submittedName == \"Ada\", \"confirmation was not recorded\")\n\nreturn true",
    "signature": "invalid → corrected → dismissed → confirmed",
    "parameters": [],
    "returns": null,
    "name": "4. Replace tests/smoke.luau",
    "description": "The test drives the same actions as the controls and inspects both application state and accessible render properties.",
    "wide": true,
    "previousPageId": "recipe-form-modal/item-3",
    "nextPageId": "recipe-form-modal/item-5",
    "relatedPageIds": []
  },
  {
    "id": "recipe-form-modal/item-5",
    "kind": "entry",
    "sectionId": "recipe-form-modal",
    "sectionTitle": "Recipe: validate a form and confirm in a modal",
    "module": "luastra/ui · luastra/data · controlled input · about 20 minutes",
    "callable": false,
    "useWhen": "Run from form-modal-recipe after all three files are saved.",
    "code": "luastra check\nluastra test\nluastra run\n# Press Review while empty: expect two field errors.\n# Enter a name and email, then Review: expect the confirmation modal.\n# Dismiss once, reopen, then Confirm.",
    "signature": "errors → review → dismiss or confirm",
    "parameters": [],
    "returns": null,
    "name": "5. Check and run",
    "description": "Automated checks prove state and semantics; the preview separately proves native input, focus, and dialog behavior in this browser.",
    "language": "Shell",
    "points": [
      "check and test must report PASS with one passing test.",
      "Tab order follows source order; the modal traps focus and returns it to Review after dismissal.",
      "At 200% zoom and on a phone, actions must wrap and the focused field must remain reachable above the software keyboard."
    ],
    "previousPageId": "recipe-form-modal/item-4",
    "nextPageId": "recipe-form-modal/item-6",
    "relatedPageIds": []
  },
  {
    "id": "recipe-form-modal/item-6",
    "kind": "guide",
    "sectionId": "recipe-form-modal",
    "sectionTitle": "Recipe: validate a form and confirm in a modal",
    "module": "luastra/ui · luastra/data · controlled input · about 20 minutes",
    "callable": false,
    "useWhen": "Read this before adding persistence, server submission, or more fields.",
    "code": null,
    "signature": "input → state → decode → domain rule → review → commit",
    "parameters": [],
    "returns": null,
    "name": "6. Understand the boundaries",
    "description": "Static types, runtime schemas, application rules, and accessible presentation solve different parts of the form.",
    "points": [
      "Luau types check your code; Data.decode validates values received at runtime.",
      "Data string limits count UTF-8 bytes, not visible characters.",
      "The email pattern is a small UI check, not proof that an address exists or can receive mail.",
      "Clear a field error when that field changes, then validate the complete form again on Review.",
      "Keep the modal in the tree with open=false so the host can close it and restore focus deterministically."
    ],
    "previousPageId": "recipe-form-modal/item-5",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "recipe-assets-visuals/item-1",
    "kind": "entry",
    "sectionId": "recipe-assets-visuals",
    "sectionTitle": "Recipe: package an image and compose visuals",
    "module": "luastra/assets · UI.Image · UI.Shape · about 15 minutes",
    "callable": false,
    "useWhen": "Run this online for the sample, or save your own PNG as assets/luastra-mark.png before continuing.",
    "code": "luastra create visuals-recipe\ncd visuals-recipe\nmkdir -p assets\ncurl -fL https://raw.githubusercontent.com/Luastra/luastra/main/examples/live-visuals/assets/luastra-mark.png \\\n  -o assets/luastra-mark.png\n# Windows PowerShell alternative:\n# New-Item -ItemType Directory -Force assets\n# Invoke-WebRequest <the same URL> -OutFile assets/luastra-mark.png",
    "signature": "luastra create visuals-recipe",
    "parameters": [],
    "returns": null,
    "name": "1. Create the project",
    "description": "Create a starter and place a real PNG at the exact path that the manifest will admit.",
    "language": "Shell",
    "points": [
      "The sample is a 512 × 512 RGBA PNG from the public Luastra repository.",
      "If you use another image format, change both the filename and mediaType in the manifest."
    ],
    "previousPageId": null,
    "nextPageId": "recipe-assets-visuals/item-2",
    "relatedPageIds": []
  },
  {
    "id": "recipe-assets-visuals/item-2",
    "kind": "entry",
    "sectionId": "recipe-assets-visuals",
    "sectionTitle": "Recipe: package an image and compose visuals",
    "module": "luastra/assets · UI.Image · UI.Shape · about 15 minutes",
    "callable": false,
    "useWhen": "Replace the generated manifest after the image file exists; check fails closed when the path, type, or asset kind is inconsistent.",
    "code": "{\n  \"schemaVersion\": 2,\n  \"project\": { \"id\": \"dev.luastra.visuals-recipe\", \"entry\": \"app/main\" },\n  \"sdk\": { \"contract\": 1 },\n  \"capabilities\": [\"ui.render\"],\n  \"assets\": [\n    {\n      \"id\": \"image/luastra-mark\",\n      \"source\": \"assets/luastra-mark.png\",\n      \"mediaType\": \"image/png\"\n    }\n  ],\n  \"modules\": [\n    {\n      \"id\": \"app/main\",\n      \"source\": \"src/main.luau\",\n      \"dependencies\": [\"luastra/assets\", \"luastra/ui\"]\n    },\n    {\n      \"id\": \"app/tests/visuals\",\n      \"source\": \"tests/smoke.luau\",\n      \"dependencies\": [\"app/main\", \"luastra/assets\"]\n    }\n  ],\n  \"tests\": [\"app/tests/visuals\"]\n}",
    "signature": "admit image/luastra-mark",
    "parameters": [],
    "returns": null,
    "name": "2. Replace luastra.json",
    "description": "The asset entry binds a stable typed ID to one project-relative file and its exact media type.",
    "language": "JSON",
    "previousPageId": "recipe-assets-visuals/item-1",
    "nextPageId": "recipe-assets-visuals/item-3",
    "relatedPageIds": []
  },
  {
    "id": "recipe-assets-visuals/item-3",
    "kind": "entry",
    "sectionId": "recipe-assets-visuals",
    "sectionTitle": "Recipe: package an image and compose visuals",
    "module": "luastra/assets · UI.Image · UI.Shape · about 15 minutes",
    "callable": false,
    "useWhen": "Replace the complete entry module. Keep the typed reference at module scope and convert it to a URI only at the consuming SDK boundary.",
    "code": "--!strict\n\nlocal Assets = require(\"luastra/assets\")\nlocal UI = require(\"luastra/ui\")\n\nlocal mark = Assets.image(\"image/luastra-mark\")\nlocal markSource = Assets.uri(mark)\nlocal cover = false\nlocal Application = {}\n\nfunction Application.render(): UI.Node\n    return UI.Screen {\n        id = \"visuals\",\n        width = \"content\",\n        padding = \"responsive\",\n        UI.Card {\n            id = \"visuals/card\",\n            gap = \"lg\",\n            padding = \"lg\",\n            surface = \"elevated\",\n            UI.Text { id = \"visuals/title\", text = \"Packaged visuals\", variant = \"title\" },\n            UI.Image {\n                id = \"visuals/mark\",\n                source = markSource,\n                label = \"Luastra orbit mark\",\n                width = 280,\n                height = 180,\n                fit = cover and \"cover\" or \"contain\",\n                cornerRadius = 24,\n            },\n            UI.Text {\n                id = \"visuals/fit-status\",\n                text = cover and \"Fit: cover\" or \"Fit: contain\",\n                role = \"status\",\n            },\n            UI.Button {\n                id = \"visuals/toggle-fit\",\n                text = cover and \"Show complete image\" or \"Fill the frame\",\n                onTap = \"visuals.toggle-fit\",\n            },\n            UI.Row {\n                id = \"visuals/shapes\",\n                gap = \"lg\",\n                responsive = true,\n                UI.Shape {\n                    id = \"visuals/decoration\",\n                    shape = \"circle\",\n                    width = 72,\n                    height = 72,\n                    fill = \"accent\",\n                    label = \"\",\n                },\n                UI.Shape {\n                    id = \"visuals/featured\",\n                    shape = \"star\",\n                    width = 88,\n                    height = 88,\n                    fill = \"warning\",\n                    stroke = \"text\",\n                    strokeWidth = 2,\n                    label = \"Featured visual\",\n                },\n            },\n        },\n    }\nend\n\nfunction Application.handle(action: string, target: string, _value: string)\n    if action == \"visuals.toggle-fit\" and target == \"visuals/toggle-fit\" then\n        cover = not cover\n    end\nend\n\nfunction Application.snapshot()\n    return { source = markSource, cover = cover }\nend\n\nreturn Application",
    "signature": "typed asset → URI → image · shapes stay code-native",
    "parameters": [],
    "returns": null,
    "name": "3. Replace src/main.luau",
    "description": "The bitmap supplies detailed artwork, while Shape supplies resolution-independent geometry without another packaged file.",
    "wide": true,
    "previousPageId": "recipe-assets-visuals/item-2",
    "nextPageId": "recipe-assets-visuals/item-4",
    "relatedPageIds": []
  },
  {
    "id": "recipe-assets-visuals/item-4",
    "kind": "entry",
    "sectionId": "recipe-assets-visuals",
    "sectionTitle": "Recipe: package an image and compose visuals",
    "module": "luastra/assets · UI.Image · UI.Shape · about 15 minutes",
    "callable": false,
    "useWhen": "Replace the generated smoke test so the recipe proves both static asset wiring and its visible state transition.",
    "code": "--!strict\n\nlocal Application = require(\"app/main\")\nlocal Assets = require(\"luastra/assets\")\n\nlocal function find(node: any, id: string): any?\n    if node.id == id then return node end\n    for _, child in node.children or {} do\n        local result = find(child, id)\n        if result ~= nil then return result end\n    end\n    return nil\nend\n\nlocal reference = Assets.image(\"image/luastra-mark\")\nassert(reference.kind == \"image\")\nassert(reference.id == \"image/luastra-mark\")\nassert(Assets.uri(reference) == \"asset:image/luastra-mark\")\n\nlocal initial = Application.render()\nlocal image = find(initial, \"visuals/mark\") :: any\nassert(image.properties.source == \"asset:image/luastra-mark\")\nassert(image.properties.label == \"Luastra orbit mark\")\nassert(string.find(tostring(image.properties.className), \"luastra-fit-contain\", 1, true) ~= nil)\nassert((find(initial, \"visuals/decoration\") :: any).properties.label == \"\")\nassert((find(initial, \"visuals/featured\") :: any).properties.label == \"Featured visual\")\n\nApplication.handle(\"visuals.toggle-fit\", \"visuals/toggle-fit\", \"\")\nassert(Application.snapshot().cover == true)\nlocal changedImage = find(Application.render(), \"visuals/mark\") :: any\nassert(string.find(tostring(changedImage.properties.className), \"luastra-fit-cover\", 1, true) ~= nil)\n\nreturn true",
    "signature": "asset identity + render semantics + interaction",
    "parameters": [],
    "returns": null,
    "name": "4. Replace tests/smoke.luau",
    "description": "The test verifies the typed asset contract, image accessibility, decorative geometry, meaningful geometry, and fit toggle.",
    "wide": true,
    "previousPageId": "recipe-assets-visuals/item-3",
    "nextPageId": "recipe-assets-visuals/item-5",
    "relatedPageIds": []
  },
  {
    "id": "recipe-assets-visuals/item-5",
    "kind": "entry",
    "sectionId": "recipe-assets-visuals",
    "sectionTitle": "Recipe: package an image and compose visuals",
    "module": "luastra/assets · UI.Image · UI.Shape · about 15 minutes",
    "callable": false,
    "useWhen": "Run from visuals-recipe after the PNG and all three text files are saved.",
    "code": "luastra check\nluastra test\nluastra run\n# Expect the complete mark inside a 280 × 180 frame.\n# Press Fill the frame: expect cropping and Fit: cover.",
    "signature": "contain → cover → contain",
    "parameters": [],
    "returns": null,
    "name": "5. Check and run",
    "description": "Check verifies packaged asset admission; the browser preview separately verifies decoded pixels, sizing, clipping, and accessible presentation.",
    "language": "Shell",
    "points": [
      "check and test must report PASS with one passing test.",
      "A successful build proves the file ledger and contract, not that every browser can decode arbitrary image bytes.",
      "Resize and zoom the preview: the frame stays bounded while contain preserves the complete image and cover may crop it."
    ],
    "previousPageId": "recipe-assets-visuals/item-4",
    "nextPageId": "recipe-assets-visuals/item-6",
    "relatedPageIds": []
  },
  {
    "id": "recipe-assets-visuals/item-6",
    "kind": "guide",
    "sectionId": "recipe-assets-visuals",
    "sectionTitle": "Recipe: package an image and compose visuals",
    "module": "luastra/assets · UI.Image · UI.Shape · about 15 minutes",
    "callable": false,
    "useWhen": "Read this before adding application artwork, thumbnails, or generated visuals.",
    "code": null,
    "signature": "file → manifest → typed reference → URI → semantic node",
    "parameters": [],
    "returns": null,
    "name": "6. Understand the boundaries",
    "description": "Each boundary prevents a different class of accidental mismatch and keeps host packaging deterministic.",
    "points": [
      "Use UI.Image for admitted PNG, JPEG, WebP, or AVIF detail; SVG is not admitted by this candidate contract.",
      "Use UI.Shape for supported scalable geometry; do not make a Shape act like a button.",
      "Give meaningful images and shapes concise labels. Use label=\"\" only when the visual adds no information.",
      "width and height reserve stable layout space; fit controls scaling inside that frame.",
      "Asset IDs are stable application identifiers, while source paths are project implementation details."
    ],
    "previousPageId": "recipe-assets-visuals/item-5",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "recipe-motion/item-1",
    "kind": "entry",
    "sectionId": "recipe-motion",
    "sectionTitle": "Recipe: replay declarative motion",
    "module": "luastra/motion · stable UI identity · about 15 minutes",
    "callable": false,
    "useWhen": "Run this in the directory that should contain the new project.",
    "code": "luastra create motion-recipe\ncd motion-recipe",
    "signature": "luastra create motion-recipe",
    "parameters": [],
    "returns": null,
    "name": "1. Create the project",
    "description": "Start from the generated project, then replace its manifest, entry module, and smoke test.",
    "language": "Shell",
    "previousPageId": null,
    "nextPageId": "recipe-motion/item-2",
    "relatedPageIds": []
  },
  {
    "id": "recipe-motion/item-2",
    "kind": "entry",
    "sectionId": "recipe-motion",
    "sectionTitle": "Recipe: replay declarative motion",
    "module": "luastra/motion · stable UI identity · about 15 minutes",
    "callable": false,
    "useWhen": "Replace the generated manifest before importing Motion. Do not add timer.control because animation frames are host-owned presentation work.",
    "code": "{\n  \"schemaVersion\": 2,\n  \"project\": { \"id\": \"dev.luastra.motion-recipe\", \"entry\": \"app/main\" },\n  \"sdk\": { \"contract\": 1 },\n  \"capabilities\": [\"ui.render\"],\n  \"modules\": [\n    {\n      \"id\": \"app/main\",\n      \"source\": \"src/main.luau\",\n      \"dependencies\": [\"luastra/motion\", \"luastra/ui\"]\n    },\n    {\n      \"id\": \"app/tests/motion\",\n      \"source\": \"tests/smoke.luau\",\n      \"dependencies\": [\"app/main\"]\n    }\n  ],\n  \"tests\": [\"app/tests/motion\"]\n}",
    "signature": "luastra/motion + luastra/ui",
    "parameters": [],
    "returns": null,
    "name": "2. Replace luastra.json",
    "description": "Declarative UI motion needs no host capability beyond rendering.",
    "language": "JSON",
    "previousPageId": "recipe-motion/item-1",
    "nextPageId": "recipe-motion/item-3",
    "relatedPageIds": []
  },
  {
    "id": "recipe-motion/item-3",
    "kind": "entry",
    "sectionId": "recipe-motion",
    "sectionTitle": "Recipe: replay declarative motion",
    "module": "luastra/motion · stable UI identity · about 15 minutes",
    "callable": false,
    "useWhen": "Replace the complete entry module. Keep the card ID stable: a descriptor change restarts the affected channels without discarding semantic identity.",
    "code": "--!strict\n\nlocal Motion = require(\"luastra/motion\")\nlocal UI = require(\"luastra/ui\")\n\nlocal Application = {}\nlocal run = 0\nlocal fromLeft = true\n\nlocal function entrance(): Motion.MotionMap\n    local offset = if fromLeft then -28 else 28\n    return {\n        opacity = Motion.tween {\n            from = 0,\n            to = 1,\n            durationMs = 180,\n            easing = \"easeOutCubic\",\n        },\n        translateX = Motion.tween {\n            from = offset,\n            to = 0,\n            durationMs = 260,\n            easing = \"easeOutCubic\",\n        },\n    }\nend\n\nfunction Application.render(): UI.Node\n    local side = if fromLeft then \"left\" else \"right\"\n    local nextSide = if fromLeft then \"right\" else \"left\"\n    return UI.Screen {\n        id = \"motion-recipe\",\n        width = \"content\",\n        padding = \"responsive\",\n        UI.Card {\n            id = \"motion/card\",\n            gap = \"lg\",\n            padding = \"lg\",\n            surface = \"elevated\",\n            motion = entrance(),\n            UI.Text { id = \"motion/title\", text = \"Declarative entrance\", variant = \"title\" },\n            UI.Text {\n                id = \"motion/status\",\n                text = \"Run \" .. tostring(run) .. \": from \" .. side,\n                role = \"status\",\n            },\n            UI.Text {\n                id = \"motion/explanation\",\n                text = \"Luau changes state once; the host animates the frames.\",\n                tone = \"muted\",\n            },\n            UI.Button {\n                id = \"motion/replay\",\n                text = \"Replay from \" .. nextSide,\n                onTap = \"motion.replay\",\n            },\n        },\n    }\nend\n\nfunction Application.handle(action: string, target: string, _value: string)\n    if action == \"motion.replay\" and target == \"motion/replay\" then\n        run += 1\n        fromLeft = not fromLeft\n    end\nend\n\nfunction Application.snapshot()\n    return { run = run, fromLeft = fromLeft }\nend\n\nreturn Application",
    "signature": "state changes once · host animates frames",
    "parameters": [],
    "returns": null,
    "name": "3. Replace src/main.luau",
    "description": "The card keeps one ID while its changed translateX descriptor deliberately restarts that channel.",
    "wide": true,
    "previousPageId": "recipe-motion/item-2",
    "nextPageId": "recipe-motion/item-4",
    "relatedPageIds": []
  },
  {
    "id": "recipe-motion/item-4",
    "kind": "entry",
    "sectionId": "recipe-motion",
    "sectionTitle": "Recipe: replay declarative motion",
    "module": "luastra/motion · stable UI identity · about 15 minutes",
    "callable": false,
    "useWhen": "Replace the generated smoke test so luastra test checks application intent and the public motion descriptors without simulating private scheduler frames.",
    "code": "--!strict\n\nlocal Application = require(\"app/main\")\n\nlocal function find(node: any, id: string): any?\n    if node.id == id then return node end\n    for _, child in node.children or {} do\n        local result = find(child, id)\n        if result ~= nil then return result end\n    end\n    return nil\nend\n\nlocal initialCard = find(Application.render(), \"motion/card\") :: any\nlocal initialMotion = initialCard.properties.motion :: any\nlocal initialOpacity = initialMotion.opacity :: any\nlocal initialTranslation = initialMotion.translateX :: any\nassert(initialCard.id == \"motion/card\")\nassert(initialOpacity.kind == \"tween\")\nassert(initialOpacity.from == 0 and initialOpacity.to == 1)\nassert(initialTranslation.from == -28)\nassert(initialTranslation.to == 0)\n\nApplication.handle(\"motion.replay\", \"motion/replay\", \"\")\nlocal snapshot = Application.snapshot()\nassert(snapshot.run == 1 and snapshot.fromLeft == false)\n\nlocal changedCard = find(Application.render(), \"motion/card\") :: any\nlocal changedMotion = changedCard.properties.motion :: any\nlocal changedTranslation = changedMotion.translateX :: any\nassert(changedCard.id == initialCard.id)\nassert(changedTranslation.from == 28)\nassert(changedTranslation.to == 0)\n\nreturn true",
    "signature": "descriptor contract + one state transition",
    "parameters": [],
    "returns": null,
    "name": "4. Replace tests/smoke.luau",
    "description": "The test verifies the initial descriptors, drives the real button action, and proves the changed direction with the same node ID.",
    "wide": true,
    "previousPageId": "recipe-motion/item-3",
    "nextPageId": "recipe-motion/item-5",
    "relatedPageIds": []
  },
  {
    "id": "recipe-motion/item-5",
    "kind": "entry",
    "sectionId": "recipe-motion",
    "sectionTitle": "Recipe: replay declarative motion",
    "module": "luastra/motion · stable UI identity · about 15 minutes",
    "callable": false,
    "useWhen": "Run from motion-recipe after all three files are saved.",
    "code": "luastra check\nluastra test\nluastra run\n# Expect Run 0: from left.\n# Press Replay from right, then expect Run 1: from right.",
    "signature": "left → right → left",
    "parameters": [],
    "returns": null,
    "name": "5. Check and run",
    "description": "Automated checks prove the descriptor and state contracts; the preview separately proves visible scheduling in this browser.",
    "language": "Shell",
    "points": [
      "check and test must report PASS with one passing test.",
      "Each press updates Luau once; Application.render is not called for every animation frame.",
      "Enable reduced motion in the operating system or browser and reload: content must appear immediately in its final position.",
      "The animation must never be the only indication of the run or direction; the status text carries the same meaning."
    ],
    "previousPageId": "recipe-motion/item-4",
    "nextPageId": "recipe-motion/item-6",
    "relatedPageIds": []
  },
  {
    "id": "recipe-motion/item-6",
    "kind": "guide",
    "sectionId": "recipe-motion",
    "sectionTitle": "Recipe: replay declarative motion",
    "module": "luastra/motion · stable UI identity · about 15 minutes",
    "callable": false,
    "useWhen": "Read this before adding route entrances, feedback motion, or ambient effects.",
    "code": null,
    "signature": "state → render descriptor → host scheduler → final presentation",
    "parameters": [],
    "returns": null,
    "name": "6. Understand the boundaries",
    "description": "Motion remains an optional presentation layer over deterministic layout and semantic content.",
    "points": [
      "Supported channels are opacity, translateX, translateY, scaleX, scaleY, rotationDeg, and rotationYDeg.",
      "Use Motion.tween for one channel, Motion.sequence for ordered Tween/Wait steps, and a named preset when it already fits.",
      "Use Timer only when elapsed time must change application state; never use it to drive animation frames.",
      "Layout is calculated at the final position. Translation, scale, and rotation do not repair spacing or reserve new bounds.",
      "Avoid continuous motion by default. If it is useful, keep it sparse, stop it when inactive, and preserve the same meaning with motion reduced."
    ],
    "previousPageId": "recipe-motion/item-5",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "recipe-server/item-1",
    "kind": "entry",
    "sectionId": "recipe-server",
    "sectionTitle": "Recipe: call a server function",
    "module": "generated Luau client · trusted JavaScript handler · about 25 minutes",
    "callable": false,
    "useWhen": "Run this in the directory that should contain the new project. The backend directory holds trusted code that is separate from client Luau.",
    "code": "luastra create server-recipe\ncd server-recipe\nmkdir backend",
    "signature": "luastra create server-recipe",
    "parameters": [],
    "returns": null,
    "name": "1. Create the project",
    "description": "Create a starter, then add the backend declaration and handler before generating the client module.",
    "language": "Shell",
    "previousPageId": null,
    "nextPageId": "recipe-server/item-2",
    "relatedPageIds": []
  },
  {
    "id": "recipe-server/item-2",
    "kind": "entry",
    "sectionId": "recipe-server",
    "sectionTitle": "Recipe: call a server function",
    "module": "generated Luau client · trusted JavaScript handler · about 25 minutes",
    "callable": false,
    "useWhen": "Replace the generated manifest. rpc.call is required for Server calls; ui.render remains required for the visible application.",
    "code": "{\n  \"schemaVersion\": 2,\n  \"project\": { \"id\": \"dev.luastra.server-recipe\", \"entry\": \"app/main\" },\n  \"sdk\": { \"contract\": 1 },\n  \"capabilities\": [\"rpc.call\", \"ui.render\"],\n  \"backend\": {\n    \"declaration\": \"backend/functions.json\",\n    \"handler\": \"backend/handlers.mjs\",\n    \"generatedClient\": \"src/generated/server-functions.luau\",\n    \"generatedModule\": \"app/server-functions\"\n  },\n  \"modules\": [\n    {\n      \"id\": \"app/main\",\n      \"source\": \"src/main.luau\",\n      \"dependencies\": [\"app/server-functions\", \"luastra/ui\"]\n    },\n    {\n      \"id\": \"app/server-functions\",\n      \"source\": \"src/generated/server-functions.luau\",\n      \"dependencies\": [\"luastra/server\"]\n    },\n    {\n      \"id\": \"app/tests/server\",\n      \"source\": \"tests/smoke.luau\",\n      \"dependencies\": [\"app/main\", \"app/server-functions\"]\n    }\n  ],\n  \"tests\": [\"app/tests/server\"]\n}",
    "signature": "rpc.call + generated module + backend files",
    "parameters": [],
    "returns": null,
    "name": "2. Replace luastra.json",
    "description": "The manifest declares the capability, trusted files, generated client path, and dependency edge explicitly.",
    "language": "JSON",
    "previousPageId": "recipe-server/item-1",
    "nextPageId": "recipe-server/item-3",
    "relatedPageIds": []
  },
  {
    "id": "recipe-server/item-3",
    "kind": "entry",
    "sectionId": "recipe-server",
    "sectionTitle": "Recipe: call a server function",
    "module": "generated Luau client · trusted JavaScript handler · about 25 minutes",
    "callable": false,
    "useWhen": "Create this declaration before generation. Add a new versioned operation instead of silently changing incompatible input or result meaning.",
    "code": "{\n  \"schemaVersion\": 1,\n  \"types\": {},\n  \"functions\": {\n    \"greeting.message.v1\": {\n      \"clientName\": \"greet\",\n      \"authorization\": \"public\",\n      \"mutation\": false,\n      \"idempotency\": \"none\",\n      \"input\": { \"name\": \"string\" },\n      \"result\": { \"message\": \"string\" }\n    }\n  }\n}",
    "signature": "one versioned query contract",
    "parameters": [],
    "returns": null,
    "name": "3. Create backend/functions.json",
    "description": "The declaration names the public operation and gives both sides exact typed fields.",
    "language": "JSON",
    "points": [
      "authorization: public means no signed-in principal is required; it does not make input trustworthy.",
      "mutation: false declares a read-only query, so this operation does not need an idempotency key.",
      "clientName becomes greet and decodeGreet in the generated Luau module."
    ],
    "previousPageId": "recipe-server/item-2",
    "nextPageId": "recipe-server/item-4",
    "relatedPageIds": []
  },
  {
    "id": "recipe-server/item-4",
    "kind": "entry",
    "sectionId": "recipe-server",
    "sectionTitle": "Recipe: call a server function",
    "module": "generated Luau client · trusted JavaScript handler · about 25 minutes",
    "callable": false,
    "useWhen": "Create this trusted local-backend module. Keep secrets and privileged provider calls here, never in generated or handwritten client Luau.",
    "code": "export function createHandlers() {\n  return Object.freeze({\n    async \"greeting.message.v1\"(input, context) {\n      const name = input.name.trim();\n      const bytes = new TextEncoder().encode(name).byteLength;\n      if (bytes < 2 || bytes > 60) {\n        context.reject(\"VALIDATION\", \"Name must contain 2 to 60 bytes\");\n      }\n      return { message: `Hello, ${name}!` };\n    },\n  });\n}",
    "signature": "trusted validation and result",
    "parameters": [],
    "returns": null,
    "name": "4. Create backend/handlers.mjs",
    "description": "The handler validates untrusted input again and returns exactly the declared result shape.",
    "language": "JavaScript",
    "points": [
      "The operation key must exactly match the declaration.",
      "context.reject produces a bounded failure code and message for Application.resolve.",
      "Luastra validates the returned object against the declared result before it crosses the RPC boundary."
    ],
    "previousPageId": "recipe-server/item-3",
    "nextPageId": "recipe-server/item-5",
    "relatedPageIds": []
  },
  {
    "id": "recipe-server/item-5",
    "kind": "entry",
    "sectionId": "recipe-server",
    "sectionTitle": "Recipe: call a server function",
    "module": "generated Luau client · trusted JavaScript handler · about 25 minutes",
    "callable": false,
    "useWhen": "Run after creating or changing backend/functions.json. Commit the generated module, but never edit it by hand.",
    "code": "luastra generate\n# Expect result: PASS and module: app/server-functions",
    "signature": "declaration → src/generated/server-functions.luau",
    "parameters": [],
    "returns": null,
    "name": "5. Generate the typed Luau client",
    "description": "Generation creates the only client call and decoder names used by application code.",
    "language": "Shell",
    "points": [
      "greet(input, options) starts the request and returns a numeric RequestId, not the greeting.",
      "decodeGreet(payload) returns the declared result or nil for malformed, missing, or extra fields.",
      "luastra check rejects a missing or stale generated client."
    ],
    "previousPageId": "recipe-server/item-4",
    "nextPageId": "recipe-server/item-6",
    "relatedPageIds": []
  },
  {
    "id": "recipe-server/item-6",
    "kind": "entry",
    "sectionId": "recipe-server",
    "sectionTitle": "Recipe: call a server function",
    "module": "generated Luau client · trusted JavaScript handler · about 25 minutes",
    "callable": false,
    "useWhen": "Replace the entry module after generation. This is the complete asynchronous client lifecycle rather than a synchronous function return.",
    "code": "--!strict\n\nlocal ServerFunctions = require(\"app/server-functions\")\nlocal UI = require(\"luastra/ui\")\n\nlocal Application = {}\nlocal name = \"Ada\"\nlocal status = \"Ready\"\nlocal pending: {[number]: boolean} = {}\n\nlocal function busy(): boolean\n    return next(pending) ~= nil\nend\n\nfunction Application.render(): UI.Node\n    return UI.Screen {\n        id = \"server-recipe\",\n        width = \"content\",\n        padding = \"responsive\",\n        UI.Card {\n            id = \"greeting/card\",\n            gap = \"md\",\n            padding = \"lg\",\n            surface = \"elevated\",\n            UI.Text { id = \"greeting/title\", text = \"Server greeting\", variant = \"title\" },\n            UI.Field {\n                id = \"greeting/name-field\",\n                gap = \"xs\",\n                role = \"group\",\n                label = \"Name field\",\n                UI.Text { id = \"greeting/name-label\", text = \"Name\" },\n                UI.TextInput {\n                    id = \"greeting/name\",\n                    label = \"Name\",\n                    value = name,\n                    onInput = \"greeting.name\",\n                    autoComplete = \"name\",\n                    enterKeyHint = \"done\",\n                    required = true,\n                },\n            },\n            UI.Button {\n                id = \"greeting/send\",\n                text = if busy() then \"Waiting...\" else \"Ask the server\",\n                onTap = \"greeting.send\",\n                disabled = busy(),\n            },\n            UI.Text { id = \"greeting/status\", text = status, role = \"status\" },\n        },\n    }\nend\n\nfunction Application.handle(action: string, target: string, value: string)\n    if action == \"greeting.name\" and target == \"greeting/name\" then\n        name = value\n        status = \"Ready\"\n    elseif action == \"greeting.send\" and target == \"greeting/send\" and not busy() then\n        local requestId = ServerFunctions.greet({ name = name }, { deadlineMs = 2000, retry = true })\n        pending[requestId] = true\n        status = \"Waiting for the server...\"\n    end\nend\n\nfunction Application.resolve(\n    requestId: number,\n    success: boolean,\n    payload: string,\n    errorCode: string,\n    errorMessage: string\n)\n    if pending[requestId] ~= true then return end\n    pending[requestId] = nil\n    if not success then\n        status = errorCode .. \": \" .. errorMessage\n        return\n    end\n    local result = ServerFunctions.decodeGreet(payload)\n    if result == nil then\n        status = \"INTERNAL: Invalid greeting response\"\n        return\n    end\n    status = result.message\nend\n\nfunction Application.snapshot()\n    return { name = name, status = status, busy = busy() }\nend\n\nreturn Application",
    "signature": "input → RequestId → resolve → decode → state",
    "parameters": [],
    "returns": null,
    "name": "6. Replace src/main.luau",
    "description": "The application stores each request ID and changes visible state only after the matching completion is decoded.",
    "wide": true,
    "previousPageId": "recipe-server/item-5",
    "nextPageId": "recipe-server/item-7",
    "relatedPageIds": []
  },
  {
    "id": "recipe-server/item-7",
    "kind": "entry",
    "sectionId": "recipe-server",
    "sectionTitle": "Recipe: call a server function",
    "module": "generated Luau client · trusted JavaScript handler · about 25 minutes",
    "callable": false,
    "useWhen": "Replace the smoke test so checkable decoder and UI behavior stay deterministic without introducing a fake network response.",
    "code": "--!strict\n\nlocal Application = require(\"app/main\")\nlocal ServerFunctions = require(\"app/server-functions\")\n\nlocal decoded = ServerFunctions.decodeGreet(\"v=1&result.message=Hello%2C%20Ada%21\")\nassert(decoded ~= nil and decoded.message == \"Hello, Ada!\")\nassert(ServerFunctions.decodeGreet(\"v=1\") == nil)\nassert(ServerFunctions.decodeGreet(\"v=1&result.message=Hello&extra=value\") == nil)\n\nlocal initial = Application.snapshot()\nassert(initial.name == \"Ada\" and initial.status == \"Ready\" and not initial.busy)\nApplication.handle(\"greeting.name\", \"greeting/name\", \"Grace\")\nlocal changed = Application.snapshot()\nassert(changed.name == \"Grace\" and changed.status == \"Ready\")\nassert(Application.render().type == \"Screen\")\n\nreturn true",
    "signature": "generated decoder + controlled UI",
    "parameters": [],
    "returns": null,
    "name": "7. Replace tests/smoke.luau",
    "description": "The smoke test proves the offline contracts without pretending that its isolated VM owns a live backend.",
    "wide": true,
    "previousPageId": "recipe-server/item-6",
    "nextPageId": "recipe-server/item-8",
    "relatedPageIds": []
  },
  {
    "id": "recipe-server/item-8",
    "kind": "entry",
    "sectionId": "recipe-server",
    "sectionTitle": "Recipe: call a server function",
    "module": "generated Luau client · trusted JavaScript handler · about 25 minutes",
    "callable": false,
    "useWhen": "Run from server-recipe after all five authored files are saved. Leave luastra run active while testing the browser flow.",
    "code": "luastra generate\nluastra check\nluastra test\nluastra run\n# Open the printed local URL and press Ask the server.\n# Expect: Hello, Ada!",
    "signature": "generate → check → test → live local RPC",
    "parameters": [],
    "returns": null,
    "name": "8. Check and run",
    "description": "The first three commands verify files and types; the preview then exercises the real local handler boundary.",
    "language": "Shell",
    "points": [
      "generate, check, and test must report PASS with one passing test.",
      "The browser request reaches the trusted local handler served by luastra run.",
      "Try a one-character name: expect VALIDATION and the handler message without a client crash.",
      "The numeric RequestId only correlates completion; it is never the operation result."
    ],
    "previousPageId": "recipe-server/item-7",
    "nextPageId": "recipe-server/item-9",
    "relatedPageIds": []
  },
  {
    "id": "recipe-server/item-9",
    "kind": "guide",
    "sectionId": "recipe-server",
    "sectionTitle": "Recipe: call a server function",
    "module": "generated Luau client · trusted JavaScript handler · about 25 minutes",
    "callable": false,
    "useWhen": "Read this when a server call appears to start but the expected result does not reach the interface.",
    "code": null,
    "signature": "Luau → RPC transport → handler → typed envelope → Luau",
    "parameters": [],
    "returns": null,
    "name": "9. Follow one request",
    "description": "Each stage owns one explicit responsibility, so client state never trusts transport text directly.",
    "points": [
      "greet encodes declared input and returns a RequestId immediately.",
      "The host sends server.call.v1 to the local RPC endpoint with the operation name and deadline.",
      "The backend selects greeting.message.v1, enforces authorization, validates input, and validates its result.",
      "Application.resolve matches the RequestId and separates transport failure from successful payload decoding.",
      "decodeGreet admits only the exact declared result before status changes."
    ],
    "previousPageId": "recipe-server/item-8",
    "nextPageId": "recipe-server/item-10",
    "relatedPageIds": []
  },
  {
    "id": "recipe-server/item-10",
    "kind": "guide",
    "sectionId": "recipe-server",
    "sectionTitle": "Recipe: call a server function",
    "module": "generated Luau client · trusted JavaScript handler · about 25 minutes",
    "callable": false,
    "useWhen": "Read this before adding authentication, database access, provider credentials, or publishing a server-backed application.",
    "code": null,
    "signature": "local backend support is not hosted deployment",
    "parameters": [],
    "returns": null,
    "name": "10. Keep the production boundary honest",
    "description": "The recipe proves local development behavior, not production infrastructure, secrets, or service availability.",
    "points": [
      "Client Luau and generated client code are public application artifacts. Never place a secret in either one.",
      "Public operations still require validation, rate limits, abuse controls, and safe error messages in production.",
      "Use user or admin authorization for protected work and enforce ownership inside the handler.",
      "Retries are safe for this read-only query. Mutations need an intentional idempotency policy and stable key.",
      "The candidate includes a local backend for luastra run; production backend deployment is a separate host decision."
    ],
    "previousPageId": "recipe-server/item-9",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "recipe-media/item-1",
    "kind": "entry",
    "sectionId": "recipe-media",
    "sectionTitle": "Recipe: play packaged audio",
    "module": "luastra/media · live media_state events · about 20 minutes",
    "callable": false,
    "useWhen": "Run this where the new project should live, then save the supplied focus.wav fixture at exactly assets/focus.wav.",
    "code": "luastra create media-recipe\ncd media-recipe\n# Copy focus.wav from this recipe into assets/focus.wav.",
    "signature": "starter + admitted WAV fixture",
    "parameters": [],
    "returns": null,
    "name": "1. Create the project and copy audio",
    "description": "Start from a normal project and copy the recipe fixture into its assets directory.",
    "language": "Shell",
    "points": [
      "The documentation validator tests the same WAV fixture from examples/media-player/assets/focus.wav.",
      "Use your own admitted WAV, MP3, M4A, or OGG file later; browser codec support still varies by format."
    ],
    "previousPageId": null,
    "nextPageId": "recipe-media/item-2",
    "relatedPageIds": []
  },
  {
    "id": "recipe-media/item-2",
    "kind": "entry",
    "sectionId": "recipe-media",
    "sectionTitle": "Recipe: play packaged audio",
    "module": "luastra/media · live media_state events · about 20 minutes",
    "callable": false,
    "useWhen": "Replace the generated manifest after copying the WAV file. A source path alone is not a playable or portable asset reference.",
    "code": "{\n  \"schemaVersion\": 2,\n  \"project\": { \"id\": \"dev.luastra.media-recipe\", \"entry\": \"app/main\" },\n  \"sdk\": { \"contract\": 1 },\n  \"capabilities\": [\"media.command\", \"ui.render\"],\n  \"assets\": [\n    {\n      \"id\": \"audio/focus\",\n      \"source\": \"assets/focus.wav\",\n      \"mediaType\": \"audio/wav\"\n    }\n  ],\n  \"modules\": [\n    {\n      \"id\": \"app/main\",\n      \"source\": \"src/main.luau\",\n      \"dependencies\": [\"luastra/assets\", \"luastra/media\", \"luastra/ui\"]\n    },\n    {\n      \"id\": \"app/tests/media\",\n      \"source\": \"tests/smoke.luau\",\n      \"dependencies\": [\"app/main\", \"luastra/media\"]\n    }\n  ],\n  \"tests\": [\"app/tests/media\"]\n}",
    "signature": "asset + media.command + ui.render",
    "parameters": [],
    "returns": null,
    "name": "2. Replace luastra.json",
    "description": "The manifest admits both the packaged bytes and the host capability that controls playback.",
    "language": "JSON",
    "previousPageId": "recipe-media/item-1",
    "nextPageId": "recipe-media/item-3",
    "relatedPageIds": []
  },
  {
    "id": "recipe-media/item-3",
    "kind": "entry",
    "sectionId": "recipe-media",
    "sectionTitle": "Recipe: play packaged audio",
    "module": "luastra/media · live media_state events · about 20 minutes",
    "callable": false,
    "useWhen": "Replace the complete entry module. Do not add a timer or frame loop: the host emits bounded progress and lifecycle updates.",
    "code": "--!strict\n\nlocal Assets = require(\"luastra/assets\")\nlocal Media = require(\"luastra/media\")\nlocal UI = require(\"luastra/ui\")\n\nlocal media: Media.State = {\n    revision = 0,\n    status = \"idle\",\n    itemId = \"\",\n    title = \"\",\n    artist = \"\",\n    positionMs = 0,\n    durationMs = 0,\n    bufferedMs = 0,\n    queueIndex = -1,\n    queueCount = 0,\n    background = false,\n    interruption = \"none\",\n    route = \"default\",\n    error = nil,\n}\nlocal pending: {[number]: string} = {}\nlocal message = \"Waiting for launch\"\nlocal Application = {}\n\nlocal queue: {Media.QueueItem} = {\n    {\n        id = \"focus\",\n        source = Assets.uri(Assets.audio(\"audio/focus\")),\n        title = \"Focus sample\",\n        artist = \"Luastra\",\n    },\n}\n\nlocal function track(requestId: number, label: string)\n    pending[requestId] = label\n    message = label .. \" requested\"\nend\n\nlocal function applyState(payload: string, nextMessage: string?): boolean\n    local decoded = Media.decodeState(payload)\n    if not decoded.success then\n        message = \"Rejected media state: \" .. decoded.error\n        return false\n    end\n    media = decoded.state\n    if nextMessage ~= nil then message = nextMessage end\n    return true\nend\n\nfunction Application.render(): UI.Node\n    local elapsed = math.floor(media.positionMs / 1000)\n    local duration = math.floor(media.durationMs / 1000)\n    return UI.Screen {\n        id = \"media-recipe\",\n        width = \"content\",\n        padding = \"responsive\",\n        UI.Card {\n            id = \"player/card\",\n            gap = \"md\",\n            padding = \"lg\",\n            surface = \"elevated\",\n            UI.Text { id = \"player/title\", text = \"Packaged audio\", variant = \"title\" },\n            UI.Text {\n                id = \"player/item\",\n                text = if media.title == \"\" then \"Nothing loaded\" else media.title,\n                variant = \"heading\",\n            },\n            UI.Text {\n                id = \"player/state\",\n                text = \"Status: \" .. media.status,\n                role = \"status\",\n                tone = if media.status == \"error\" then \"error\" else nil,\n            },\n            UI.Text {\n                id = \"player/progress\",\n                text = \"Progress: \" .. tostring(elapsed) .. \"s / \" .. tostring(duration) .. \"s\",\n            },\n            UI.Text { id = \"player/message\", text = message, role = \"status\", tone = \"muted\" },\n            UI.Actions {\n                id = \"player/actions\",\n                gap = \"sm\",\n                responsive = true,\n                UI.Button {\n                    id = \"player/play\",\n                    text = \"Play\",\n                    onTap = \"media.play\",\n                    disabled = media.status ~= \"ready\" and media.status ~= \"paused\" and media.status ~= \"ended\",\n                },\n                UI.Button {\n                    id = \"player/pause\",\n                    text = \"Pause\",\n                    onTap = \"media.pause\",\n                    appearance = \"secondary\",\n                    disabled = media.status ~= \"playing\" and media.status ~= \"buffering\",\n                },\n            },\n        },\n    }\nend\n\nfunction Application.handle(action: string, target: string, value: string)\n    if action == \"lifecycle\" and target == \"app\" and value == \"launch\" then\n        if media.queueCount == 0 then track(Media.setQueue(queue, 1), \"Queue load\") end\n    elseif action == \"media_state\" then\n        applyState(value, nil)\n    elseif action == \"media.play\" and target == \"player/play\" then\n        track(Media.play(), \"Play\")\n    elseif action == \"media.pause\" and target == \"player/pause\" then\n        track(Media.pause(), \"Pause\")\n    end\nend\n\nfunction Application.resolve(\n    requestId: number,\n    success: boolean,\n    payload: string,\n    errorCode: string,\n    errorMessage: string\n)\n    local label = pending[requestId]\n    if label == nil then return end\n    pending[requestId] = nil\n    if not success then\n        message = label .. \" failed: \" .. errorCode .. \" — \" .. errorMessage\n        return\n    end\n    applyState(payload, label .. \" completed\")\nend\n\nfunction Application.snapshot()\n    return { status = media.status, title = media.title, message = message }\nend\n\nreturn Application",
    "signature": "launch → queue → commands + events → decoded state",
    "parameters": [],
    "returns": null,
    "name": "3. Replace src/main.luau",
    "description": "The host owns playback and progress; Luau only issues intent and renders validated snapshots.",
    "wide": true,
    "previousPageId": "recipe-media/item-2",
    "nextPageId": "recipe-media/item-4",
    "relatedPageIds": []
  },
  {
    "id": "recipe-media/item-4",
    "kind": "entry",
    "sectionId": "recipe-media",
    "sectionTitle": "Recipe: play packaged audio",
    "module": "luastra/media · live media_state events · about 20 minutes",
    "callable": false,
    "useWhen": "Replace the generated smoke test so state admission and rejection are verified independently of browser audio policy.",
    "code": "--!strict\n\nlocal Application = require(\"app/main\")\nlocal Media = require(\"luastra/media\")\n\nlocal ready = table.concat({\n    \"v=1\",\n    \"artist=Luastra\",\n    \"background=false\",\n    \"bufferedMs=1000\",\n    \"durationMs=8000\",\n    \"errorCode=\",\n    \"errorMessage=\",\n    \"interruption=none\",\n    \"itemId=focus\",\n    \"positionMs=0\",\n    \"queueCount=1\",\n    \"queueIndex=0\",\n    \"revision=1\",\n    \"route=default\",\n    \"status=ready\",\n    \"title=Focus%20sample\",\n}, \"&\")\n\nlocal decoded = Media.decodeState(ready)\nassert(decoded.success and decoded.state.title == \"Focus sample\")\nApplication.handle(\"media_state\", \"player\", ready)\nlocal current = Application.snapshot()\nassert(current.status == \"ready\" and current.title == \"Focus sample\")\n\nApplication.handle(\"media_state\", \"player\", \"v=2&status=playing\")\nlocal rejected = Application.snapshot()\nassert(rejected.status == \"ready\")\nassert(rejected.message == \"Rejected media state: invalid_wire\")\nassert(Application.render().type == \"Screen\")\n\nreturn true",
    "signature": "valid event + malformed state rejection",
    "parameters": [],
    "returns": null,
    "name": "4. Replace tests/smoke.luau",
    "description": "The smoke test drives the same media_state path as the host without pretending to play audio in the isolated test VM.",
    "wide": true,
    "previousPageId": "recipe-media/item-3",
    "nextPageId": "recipe-media/item-5",
    "relatedPageIds": []
  },
  {
    "id": "recipe-media/item-5",
    "kind": "entry",
    "sectionId": "recipe-media",
    "sectionTitle": "Recipe: play packaged audio",
    "module": "luastra/media · live media_state events · about 20 minutes",
    "callable": false,
    "useWhen": "Run from media-recipe after the manifest, Luau files, and assets/focus.wav are saved.",
    "code": "luastra check\nluastra test\nluastra run\n# Wait for Status: ready, then press Play.\n# Expect audible audio and Status: playing.\n# Press Pause and expect Status: paused.",
    "signature": "ready → playing → paused",
    "parameters": [],
    "returns": null,
    "name": "5. Check and run",
    "description": "Automated checks prove the contract; the preview separately proves audible playback in the current browser.",
    "language": "Shell",
    "points": [
      "check and test must report PASS with one passing test.",
      "Play begins only after an explicit user action, which satisfies common browser autoplay policy.",
      "The progress text should advance from host events; Application.render does not run on an application timer.",
      "If decoding or playback fails, keep the last admitted state and show a bounded message."
    ],
    "previousPageId": "recipe-media/item-4",
    "nextPageId": "recipe-media/item-6",
    "relatedPageIds": []
  },
  {
    "id": "recipe-media/item-6",
    "kind": "guide",
    "sectionId": "recipe-media",
    "sectionTitle": "Recipe: play packaged audio",
    "module": "luastra/media · live media_state events · about 20 minutes",
    "callable": false,
    "useWhen": "Read this when controls appear to lag, playback changes outside the app, or command success conflicts with a later media event.",
    "code": null,
    "signature": "resolve acknowledges · media_state observes",
    "parameters": [],
    "returns": null,
    "name": "6. Separate command completion from live truth",
    "description": "A completed command and current playback are related signals, not interchangeable promises.",
    "points": [
      "setQueue, play, and pause return RequestId immediately; store it only for command correlation.",
      "Application.resolve reports whether that command completed and may carry a decodable state snapshot.",
      "media_state reports later changes such as progress, ending, buffering, interruption, route, and errors.",
      "Render from the newest decoded Media.State rather than assuming that a pressed button already changed playback.",
      "Ignore unknown RequestIds and reject malformed state payloads without erasing the last valid UI state."
    ],
    "previousPageId": "recipe-media/item-5",
    "nextPageId": "recipe-media/item-7",
    "relatedPageIds": []
  },
  {
    "id": "recipe-media/item-7",
    "kind": "guide",
    "sectionId": "recipe-media",
    "sectionTitle": "Recipe: play packaged audio",
    "module": "luastra/media · live media_state events · about 20 minutes",
    "callable": false,
    "useWhen": "Read this before adding another track, protected content, Next and Previous controls, or seeking.",
    "code": null,
    "signature": "asset: for packaged files · content: for scoped grants",
    "parameters": [],
    "returns": null,
    "name": "7. Understand sources and queues",
    "description": "Media accepts admitted sources and a bounded queue rather than arbitrary filesystem or network URLs.",
    "points": [
      "Use Assets.audio and Assets.uri for files declared in luastra.json.",
      "Use content grants issued by a trusted backend for protected media; a content: token is not a public URL.",
      "Raw https://, file://, absolute paths, data URLs, and short forged content tokens are rejected.",
      "A queue contains 1 to 32 items. selectedIndex is one-based in Luau even though decoded queueIndex is zero-based.",
      "Enable Next, Previous, and Seek from decoded queue and duration fields, not from assumptions about the source."
    ],
    "previousPageId": "recipe-media/item-6",
    "nextPageId": "recipe-media/item-8",
    "relatedPageIds": []
  },
  {
    "id": "recipe-media/item-8",
    "kind": "guide",
    "sectionId": "recipe-media",
    "sectionTitle": "Recipe: play packaged audio",
    "module": "luastra/media · live media_state events · about 20 minutes",
    "callable": false,
    "useWhen": "Read this before promising playback behavior for web, Tauri, Android, iOS, or a packaged release.",
    "code": null,
    "signature": "web playback ≠ native background proof",
    "parameters": [],
    "returns": null,
    "name": "8. Keep host claims evidence-bound",
    "description": "Foreground browser success does not establish background audio, lock-screen controls, or interruption behavior everywhere.",
    "points": [
      "Verify audible foreground playback separately in each supported browser and packaged host.",
      "Mobile background playback requires a native build, lifecycle configuration, and a physical-device check.",
      "Lock-screen metadata and hardware controls require explicit target evidence; source code alone is insufficient.",
      "Test calls, headphones, Bluetooth route changes, audio focus, screen lock, and application disposal where claimed.",
      "Avoid polling. Supported hosts own event cadence and should stay idle when playback and UI are idle."
    ],
    "previousPageId": "recipe-media/item-7",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "recipe-orbit/item-1",
    "kind": "entry",
    "sectionId": "recipe-orbit",
    "sectionTitle": "Recipe: build a small Constellation Orbit",
    "module": "luastra/ui · semantic spatial navigation · about 25 minutes",
    "callable": false,
    "useWhen": "Run this where the new project should live, then replace the three generated files shown below.",
    "code": "luastra create orbit-recipe\ncd orbit-recipe",
    "signature": "one semantic model · two depths · one detail surface",
    "parameters": [],
    "returns": null,
    "name": "1. Create the project",
    "description": "Start from the normal project skeleton; this recipe needs no assets or asynchronous host capability.",
    "language": "Shell",
    "previousPageId": null,
    "nextPageId": "recipe-orbit/item-2",
    "relatedPageIds": []
  },
  {
    "id": "recipe-orbit/item-2",
    "kind": "entry",
    "sectionId": "recipe-orbit",
    "sectionTitle": "Recipe: build a small Constellation Orbit",
    "module": "luastra/ui · semantic spatial navigation · about 25 minutes",
    "callable": false,
    "useWhen": "Replace the generated manifest before adding Orbit components. Add navigation.history or storage capabilities only when a later version of the app actually calls them.",
    "code": "{\n  \"schemaVersion\": 2,\n  \"project\": { \"id\": \"dev.luastra.orbit-recipe\", \"entry\": \"app/main\" },\n  \"sdk\": { \"contract\": 1 },\n  \"capabilities\": [\"ui.render\"],\n  \"modules\": [\n    {\n      \"id\": \"app/main\",\n      \"source\": \"src/main.luau\",\n      \"dependencies\": [\"luastra/ui\"]\n    },\n    {\n      \"id\": \"app/tests/orbit\",\n      \"source\": \"tests/smoke.luau\",\n      \"dependencies\": [\"app/main\"]\n    }\n  ],\n  \"tests\": [\"app/tests/orbit\"]\n}",
    "signature": "ui.render only",
    "parameters": [],
    "returns": null,
    "name": "2. Replace luastra.json",
    "description": "The first Orbit needs only the semantic renderer; navigation state stays local and bounded in this introductory example.",
    "language": "JSON",
    "previousPageId": "recipe-orbit/item-1",
    "nextPageId": "recipe-orbit/item-3",
    "relatedPageIds": []
  },
  {
    "id": "recipe-orbit/item-3",
    "kind": "entry",
    "sectionId": "recipe-orbit",
    "sectionTitle": "Recipe: build a small Constellation Orbit",
    "module": "luastra/ui · semantic spatial navigation · about 25 minutes",
    "callable": false,
    "useWhen": "Replace the complete entry module. Keep the component IDs stable: relationships, selection, focus restoration, tests, and future routes all depend on semantic identity.",
    "code": "--!strict\n\nlocal UI = require(\"luastra/ui\")\n\nlocal Application = {}\nlocal depth = \"root\"\nlocal visitedBuild = false\nlocal selected: string? = nil\n\nlocal details = {\n    [\"orbit/learn\"] = \"Learn the semantic model before adding host capabilities.\",\n    [\"orbit/ship\"] = \"Verify each target separately before making a platform claim.\",\n    [\"orbit/build/interface\"] = \"Compose meaning in Luau and let the host place it.\",\n    [\"orbit/build/adaptive\"] = \"The same nodes become a readable list when space is constrained.\",\n    [\"orbit/build/accessible\"] = \"Keyboard, pointer, and assistive technology reach the same actions.\",\n}\n\nlocal function titleFor(id: string?): string\n    if id == \"orbit/learn\" then return \"Learn\" end\n    if id == \"orbit/ship\" then return \"Ship\" end\n    if id == \"orbit/build/interface\" then return \"Interface\" end\n    if id == \"orbit/build/adaptive\" then return \"Adaptive\" end\n    if id == \"orbit/build/accessible\" then return \"Accessible\" end\n    return \"Node details\"\nend\n\nfunction Application.render(): UI.Node\n    local focusTitle = titleFor(selected)\n    local children: {UI.Node} = {\n        UI.OrbitPath {\n            id = \"orbit/path\",\n            label = \"Orbit path\",\n            UI.OrbitReturn {\n                id = \"orbit/path/root\",\n                text = \"Luastra\",\n                onTap = \"return-root\",\n                disabled = depth == \"root\",\n            },\n            UI.Text {\n                id = \"orbit/path/current\",\n                text = depth == \"root\" and \"Home\" or \"Build\",\n            },\n        },\n        UI.Constellation {\n            id = \"orbit/root\",\n            label = \"Luastra concepts\",\n            depth = 0,\n            layerState = depth == \"root\" and \"active\" or \"behind\",\n            UI.OrbitCenter {\n                id = \"orbit/root/center\",\n                title = \"Luastra\",\n                description = \"Build apps like games.\",\n            },\n            UI.OrbitNode {\n                id = \"orbit/build\",\n                title = \"Build\",\n                description = \"Enter the next constellation.\",\n                nodeKind = \"constellation\",\n                priority = 1,\n                signalIcon = \"compass\",\n                relatedTo = { \"orbit/learn\" },\n                onTap = \"open-build\",\n            },\n            UI.OrbitNode {\n                id = \"orbit/learn\",\n                title = \"Learn\",\n                description = \"Understand the semantic model.\",\n                priority = 1,\n                signalIcon = \"book\",\n                status = \"Guide\",\n                selected = selected == \"orbit/learn\",\n                relatedTo = { \"orbit/build\", \"orbit/ship\" },\n                onTap = \"open-focus\",\n            },\n            UI.OrbitNode {\n                id = \"orbit/ship\",\n                title = \"Ship\",\n                description = \"Verify web, desktop, and mobile.\",\n                priority = 2,\n                signalIcon = \"rocket\",\n                selected = selected == \"orbit/ship\",\n                relatedTo = { \"orbit/learn\" },\n                onTap = \"open-focus\",\n            },\n        },\n    }\n\n    if visitedBuild then\n        table.insert(children, UI.Constellation {\n            id = \"orbit/build-space\",\n            label = \"Build an interface\",\n            depth = 1,\n            layerState = depth == \"build\" and \"active\" or \"ahead\",\n            UI.OrbitCenter {\n                id = \"orbit/build-space/center\",\n                title = \"Build\",\n                description = \"Semantic, adaptive, accessible.\",\n            },\n            UI.OrbitNode {\n                id = \"orbit/build/interface\",\n                title = \"Interface\",\n                description = \"Describe content and actions.\",\n                priority = 1,\n                signalIcon = \"spark\",\n                selected = selected == \"orbit/build/interface\",\n                relatedTo = { \"orbit/build/adaptive\", \"orbit/build/accessible\" },\n                onTap = \"open-focus\",\n            },\n            UI.OrbitNode {\n                id = \"orbit/build/adaptive\",\n                title = \"Adaptive\",\n                description = \"Keep every node available in a list.\",\n                priority = 2,\n                selected = selected == \"orbit/build/adaptive\",\n                relatedTo = { \"orbit/build/interface\" },\n                onTap = \"open-focus\",\n            },\n            UI.OrbitNode {\n                id = \"orbit/build/accessible\",\n                title = \"Accessible\",\n                description = \"Preserve labels, focus, and actions.\",\n                priority = 1,\n                signalIcon = \"check\",\n                status = \"Required\",\n                statusTone = \"success\",\n                selected = selected == \"orbit/build/accessible\",\n                relatedTo = { \"orbit/build/interface\" },\n                onTap = \"open-focus\",\n            },\n        })\n    end\n\n    table.insert(children, UI.FocusSurface {\n        id = \"orbit/focus\",\n        label = focusTitle .. \" details\",\n        open = selected ~= nil,\n        onDismiss = \"close-focus\",\n        UI.FocusHeader {\n            id = \"orbit/focus/header\",\n            UI.Text { id = \"orbit/focus/title\", text = focusTitle, variant = \"heading\" },\n            UI.Button {\n                id = \"orbit/focus/close\",\n                text = \"Return to the constellation\",\n                onTap = \"close-focus\",\n            },\n        },\n        UI.Stack {\n            id = \"orbit/focus/content\",\n            gap = \"md\",\n            UI.Text {\n                id = \"orbit/focus/copy\",\n                text = if selected == nil then \"Choose a node.\" else details[selected],\n            },\n        },\n    })\n\n    return UI.Screen {\n        id = \"orbit-recipe\",\n        documentTitle = \"Orbit recipe — Luastra\",\n        width = \"wide\",\n        UI.Orbit {\n            id = \"orbit\",\n            label = \"Luastra learning orbit\",\n            presentation = \"auto\",\n            orbitTheme = \"luastra\",\n            orbitMotion = \"system\",\n            maxVisible = 8,\n            table.unpack(children),\n        },\n    }\nend\n\nfunction Application.handle(action: string, target: string, _value: string)\n    if action == \"open-build\" and target == \"orbit/build\" then\n        depth = \"build\"\n        visitedBuild = true\n        selected = nil\n    elseif action == \"return-root\" then\n        depth = \"root\"\n        selected = nil\n    elseif action == \"open-focus\" and details[target] ~= nil then\n        selected = target\n    elseif action == \"close-focus\" then\n        selected = nil\n    end\nend\n\nfunction Application.snapshot()\n    return { depth = depth, visitedBuild = visitedBuild, selected = selected }\nend\n\nreturn Application",
    "signature": "constellations → nodes → Focus Surface",
    "parameters": [],
    "returns": null,
    "name": "3. Replace src/main.luau",
    "description": "One small state machine controls active depth and focused leaf; every visual placement decision remains host-owned.",
    "wide": true,
    "previousPageId": "recipe-orbit/item-2",
    "nextPageId": "recipe-orbit/item-4",
    "relatedPageIds": []
  },
  {
    "id": "recipe-orbit/item-4",
    "kind": "entry",
    "sectionId": "recipe-orbit",
    "sectionTitle": "Recipe: build a small Constellation Orbit",
    "module": "luastra/ui · semantic spatial navigation · about 25 minutes",
    "callable": false,
    "useWhen": "Replace the smoke test. Test semantic states and contracts in Luau; verify actual layout, motion, focus order, and list fallback separately in supported hosts.",
    "code": "--!strict\n\nlocal Application = require(\"app/main\")\n\nlocal function byId(node: any, id: string): any\n    if node.id == id then return node end\n    for _, child in node.children do\n        local found = byId(child, id)\n        if found ~= nil then return found end\n    end\n    return nil\nend\n\nlocal function hasClass(node: any, name: string): boolean\n    return string.find(\" \" .. node.properties.className .. \" \", \" \" .. name .. \" \", 1, true) ~= nil\nend\n\nlocal initial = Application.render()\nassert(initial.type == \"Screen\")\nassert(hasClass(byId(initial, \"orbit\"), \"luastra-orbit\"))\nassert(hasClass(byId(initial, \"orbit/root\"), \"luastra-constellation-state-active\"))\nassert(byId(initial, \"orbit/build-space\") == nil)\nassert(byId(initial, \"orbit/build\").properties.orbitRelatedTo == \"orbit/learn\")\n\nApplication.handle(\"open-build\", \"orbit/build\", \"\")\nlocal nested = Application.render()\nassert(hasClass(byId(nested, \"orbit/root\"), \"luastra-constellation-state-behind\"))\nassert(hasClass(byId(nested, \"orbit/build-space\"), \"luastra-constellation-state-active\"))\n\nApplication.handle(\"open-focus\", \"orbit/build/interface\", \"\")\nlocal focused = Application.render()\nassert(byId(focused, \"orbit/focus\").properties.open == true)\nassert(hasClass(byId(focused, \"orbit/build/interface\"), \"luastra-orbit-selected\"))\nassert(byId(focused, \"orbit/focus/title\").properties.text == \"Interface\")\n\nApplication.handle(\"close-focus\", \"orbit/focus/close\", \"\")\nassert(byId(Application.render(), \"orbit/focus\").properties.open == false)\n\nApplication.handle(\"return-root\", \"orbit/path/root\", \"\")\nlocal returned = Application.render()\nassert(hasClass(byId(returned, \"orbit/root\"), \"luastra-constellation-state-active\"))\nassert(hasClass(byId(returned, \"orbit/build-space\"), \"luastra-constellation-state-ahead\"))\nassert(Application.snapshot().depth == \"root\")\n\nreturn true",
    "signature": "root → nested depth → focus → return",
    "parameters": [],
    "returns": null,
    "name": "4. Replace tests/smoke.luau",
    "description": "The test follows the meaningful interaction states without asserting host-calculated coordinates or animation frames.",
    "wide": true,
    "previousPageId": "recipe-orbit/item-3",
    "nextPageId": "recipe-orbit/item-5",
    "relatedPageIds": []
  },
  {
    "id": "recipe-orbit/item-5",
    "kind": "entry",
    "sectionId": "recipe-orbit",
    "sectionTitle": "Recipe: build a small Constellation Orbit",
    "module": "luastra/ui · semantic spatial navigation · about 25 minutes",
    "callable": false,
    "useWhen": "Run from orbit-recipe after saving all three files.",
    "code": "luastra check\nluastra test\nluastra run\n# Open the printed local URL.\n# Select Build, open Interface, close the Focus Surface,\n# then resize the viewport until the host chooses list presentation.",
    "signature": "spatial when suitable · complete list when constrained",
    "parameters": [],
    "returns": null,
    "name": "5. Check and run",
    "description": "The same authored tree should remain navigable as the host changes presentation for the available viewport.",
    "language": "Shell",
    "points": [
      "check and test must report PASS with one passing test.",
      "Build moves the root constellation behind and makes the nested depth active.",
      "Interface opens a labelled Focus Surface and closing it returns focus to the originating node.",
      "A constrained viewport presents the same nodes and actions as a scrollable list; it is not a second application screen."
    ],
    "previousPageId": "recipe-orbit/item-4",
    "nextPageId": "recipe-orbit/item-6",
    "relatedPageIds": []
  },
  {
    "id": "recipe-orbit/item-6",
    "kind": "guide",
    "sectionId": "recipe-orbit",
    "sectionTitle": "Recipe: build a small Constellation Orbit",
    "module": "luastra/ui · semantic spatial navigation · about 25 minutes",
    "callable": false,
    "useWhen": "Read this before adding nodes or another navigation depth.",
    "code": null,
    "signature": "Orbit → Path + Constellation(s) + Focus Surface",
    "parameters": [],
    "returns": null,
    "name": "6. Read the Orbit anatomy",
    "description": "Each primitive owns one semantic responsibility and enforces a bounded structure.",
    "points": [
      "UI.Orbit is the presentation boundary and accepts path, search, constellation, and Focus Surface children.",
      "UI.Constellation represents one depth and requires exactly one center plus 1 to 64 actionable nodes or clusters.",
      "UI.OrbitCenter names the current space; it is identity, not a button.",
      "UI.OrbitNode declares a leaf, constellation destination, or action. UI.OrbitCluster represents a real grouped destination.",
      "UI.FocusSurface contains full leaf detail while the originating constellation remains the navigation context."
    ],
    "previousPageId": "recipe-orbit/item-5",
    "nextPageId": "recipe-orbit/item-7",
    "relatedPageIds": []
  },
  {
    "id": "recipe-orbit/item-7",
    "kind": "guide",
    "sectionId": "recipe-orbit",
    "sectionTitle": "Recipe: build a small Constellation Orbit",
    "module": "luastra/ui · semantic spatial navigation · about 25 minutes",
    "callable": false,
    "useWhen": "Read this when you are tempted to position a node manually or build a separate mobile layout.",
    "code": null,
    "signature": "priority + relationships + state → host layout",
    "parameters": [],
    "returns": null,
    "name": "7. Author meaning, not coordinates",
    "description": "Orbit placement is derived from bounded semantic hints, so the same model can survive resizing and different targets.",
    "points": [
      "priority expresses relative importance from 1 to 3; it is not a pixel radius.",
      "relatedTo contains IDs from the same constellation and influences stable neighbourhoods without creating navigation by itself.",
      "layerState marks one depth active and retained neighbours behind or ahead for bounded transitions.",
      "presentation = auto lets the host choose spatial or list mode from width, height, density, and label pressure.",
      "Every hidden, disabled, busy, selected, status, and action value still comes from Luau application state."
    ],
    "previousPageId": "recipe-orbit/item-6",
    "nextPageId": "recipe-orbit/item-8",
    "relatedPageIds": []
  },
  {
    "id": "recipe-orbit/item-8",
    "kind": "guide",
    "sectionId": "recipe-orbit",
    "sectionTitle": "Recipe: build a small Constellation Orbit",
    "module": "luastra/ui · semantic spatial navigation · about 25 minutes",
    "callable": false,
    "useWhen": "Read this after the local interaction works and you need reload restoration, browser history, app links, or mobile system Back.",
    "code": null,
    "signature": "local state first · typed Navigation next",
    "parameters": [],
    "returns": null,
    "name": "8. Add routing only when URLs matter",
    "description": "This recipe isolates Orbit composition; a production information space should make depth and focused leaves restorable when its product requires deep links or system Back.",
    "points": [
      "Use the Typed Navigation and Browser/system Back recipes before replacing depth and selected with route entries.",
      "Make each constellation and focusable leaf a canonical route when users should link to it directly.",
      "Orbit Path is hierarchical navigation state, not an unlimited log of visited nodes.",
      "Retain only the bounded adjacent layers needed for transitions; do not keep every historical constellation rendered."
    ],
    "previousPageId": "recipe-orbit/item-7",
    "nextPageId": "recipe-orbit/item-9",
    "relatedPageIds": []
  },
  {
    "id": "recipe-orbit/item-9",
    "kind": "guide",
    "sectionId": "recipe-orbit",
    "sectionTitle": "Recipe: build a small Constellation Orbit",
    "module": "luastra/ui · semantic spatial navigation · about 25 minutes",
    "callable": false,
    "useWhen": "Read this before publishing an Orbit application or promising accessibility and performance across targets.",
    "code": null,
    "signature": "semantic test ≠ browser/device evidence",
    "parameters": [],
    "returns": null,
    "name": "9. Verify presentation claims separately",
    "description": "Passing Luau tests proves the model and event transitions, but visual and platform claims need host-specific checks.",
    "points": [
      "Check desktop, tablet, phone, and short-landscape sizes; width alone does not determine usable spatial layout.",
      "Verify keyboard entry, directional movement, Escape dismissal, focus restoration, and complete list-mode parity.",
      "Test orbitMotion = system with operating-system reduced motion and orbitMotion = off without delayed state changes.",
      "Check every selected theme for normal text, status, controls, retained layers, and Focus Surface contrast.",
      "Measure idle work and transition responsiveness with diagnostics; visual smoothness is not a substitute for a budget."
    ],
    "previousPageId": "recipe-orbit/item-8",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-1",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply Annotations and inference, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "--!strict\n\nlocal interactions: number = 0\nlocal title: string = \"Sixth Sense\"\n\nlocal function increment(value: number): number\n    return value + 1\nend\n\ninteractions = increment(interactions)\n-- interactions = \"one\" -- luastra check reports a type error",
    "signature": "local name: Type · parameter: Type · function(): Type",
    "parameters": [],
    "returns": null,
    "name": "Annotations and inference",
    "description": "A colon declares the expected type. Luau can infer obvious local values, while function and module boundaries benefit from explicit annotations.",
    "previousPageId": null,
    "nextPageId": "luau-types/item-2",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-2",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply Arrays, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "local colors: {string} = { \"red\", \"green\" }\n\ntable.insert(colors, \"blue\")\nlocal first: string = colors[1]\n\nfor index, color in ipairs(colors) do\n    Debug.log(\"colors\", `{index}: {color}`)\nend",
    "signature": "{T}",
    "parameters": [],
    "returns": null,
    "name": "Arrays",
    "description": "A dense 1-based table whose elements share one type. Luau does not use a [] array literal.",
    "points": [
      "An empty number array is local values: {number} = {}.",
      "Use #values and ipairs only for dense sequences without missing indexes."
    ],
    "previousPageId": "luau-types/item-1",
    "nextPageId": "luau-types/item-3",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-3",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply Dictionaries and maps, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "local pending: {[number]: string} = {}\n\npending[42] = \"save\"\npending[105] = \"restore\"\n\nlocal operation: string? = pending[42]\npending[42] = nil\n\nfor requestId, name in pairs(pending) do\n    Debug.log(\"pending\", `{requestId}: {name}`)\nend",
    "signature": "{[Key]: Value}",
    "parameters": [],
    "returns": null,
    "name": "Dictionaries and maps",
    "description": "A keyed table that may be sparse. A numeric key does not make a table an array when its indexes are arbitrary.",
    "points": [
      "{[string]: number} means string key to number value.",
      "Do not use #table or ipairs for a sparse dictionary."
    ],
    "previousPageId": "luau-types/item-2",
    "nextPageId": "luau-types/item-4",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-4",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply Record types, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "type GameState = {\n    interactions: number,\n    correctAnswers: number,\n    selectedColor: Color?,\n    cardRevealed: boolean,\n}\n\nlocal state: GameState = {\n    interactions = 0,\n    correctAnswers = 0,\n    selectedColor = nil,\n    cardRevealed = false,\n}",
    "signature": "type Name = { field: Type }",
    "parameters": [],
    "returns": null,
    "name": "Record types",
    "description": "A table type is Luau's struct-like construct. The analyzer checks required fields and their value types.",
    "previousPageId": "luau-types/item-3",
    "nextPageId": "luau-types/item-5",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-5",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply Enum-like singleton unions, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "type Color = \"red\" | \"green\" | \"blue\"\n\nlocal selected: Color = \"green\"\n-- selected = \"yellow\" -- type error\n\nlocal Colors: { Red: Color, Green: Color, Blue: Color } = {\n    Red = \"red\",\n    Green = \"green\",\n    Blue = \"blue\",\n}\n\ntable.freeze(Colors)",
    "signature": "type Color = \"red\" | \"green\"",
    "parameters": [],
    "returns": null,
    "name": "Enum-like singleton unions",
    "description": "A union of literal strings limits a value to known alternatives. A separate frozen table can provide convenient runtime constants.",
    "points": [
      "Color exists only for the analyzer.",
      "Colors is a runtime table containing named constants."
    ],
    "previousPageId": "luau-types/item-4",
    "nextPageId": "luau-types/item-6",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-6",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply Optional values, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "local selectedColor: Color? = nil\n\nif selectedColor ~= nil then\n    Debug.log(\"selection\", selectedColor)\nend\n\ntype Meditation = {\n    id: string,\n    description: string?,\n}",
    "signature": "T? = T | nil",
    "parameters": [],
    "returns": null,
    "name": "Optional values",
    "description": "A question mark means that a value may be absent. Narrow away nil before using the value as T.",
    "previousPageId": "luau-types/item-5",
    "nextPageId": "luau-types/item-7",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-7",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply Unions and type narrowing, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "local value: string | number = \"hello\"\n\nif type(value) == \"string\" then\n    local upper = string.upper(value)\nelse\n    local nextValue = value + 1\nend",
    "signature": "A | B",
    "parameters": [],
    "returns": null,
    "name": "Unions and type narrowing",
    "description": "A value may match either type. A type, typeof, nil, or tag check narrows the union to a safe branch.",
    "previousPageId": "luau-types/item-6",
    "nextPageId": "luau-types/item-8",
    "relatedPageIds": [
      "luau-types/item-12"
    ]
  },
  {
    "id": "luau-types/item-8",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply Tagged unions, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "type GamePhase =\n    { kind: \"waiting\" }\n    | { kind: \"guessing\", hiddenColor: Color }\n    | {\n        kind: \"revealed\",\n        hiddenColor: Color,\n        guessedColor: Color,\n        correct: boolean,\n    }\n\nlocal function describe(phase: GamePhase): string\n    if phase.kind == \"waiting\" then\n        return \"Press Start\"\n    elseif phase.kind == \"guessing\" then\n        return \"Choose a color\"\n    else\n        return phase.correct and \"Correct\" or \"Try again\"\n    end\nend",
    "signature": "{ kind: \"a\", ... } | { kind: \"b\", ... }",
    "parameters": [],
    "returns": null,
    "name": "Tagged unions",
    "description": "A shared literal tag safely models states that expose different fields.",
    "wide": true,
    "previousPageId": "luau-types/item-7",
    "nextPageId": "luau-types/item-9",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-9",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply Generics, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "type Result<T> =\n    { success: true, value: T }\n    | { success: false, error: string }\n\nlocal function first<T>(items: {T}): T?\n    return items[1]\nend\n\nlocal color: Color? = first({ \"red\" :: Color, \"green\" :: Color })\nlocal score: number? = first({ 10, 20, 30 })",
    "signature": "Type<T> · function name<T>(value: T)",
    "parameters": [],
    "returns": null,
    "name": "Generics",
    "description": "A type parameter lets one checked pattern work with many value types without losing their exact result type.",
    "wide": true,
    "previousPageId": "luau-types/item-8",
    "nextPageId": "luau-types/item-10",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-10",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply Function types, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "type TapHandler = (action: string, target: string) -> ()\ntype Validator = (value: string) -> (boolean, string?)\n\nlocal validateEmail: Validator = function(value)\n    if string.find(value, \"@\", 1, true) == nil then\n        return false, \"Email must contain @\"\n    end\n    return true, nil\nend",
    "signature": "(Parameters) -> Returns",
    "parameters": [],
    "returns": null,
    "name": "Function types",
    "description": "Callbacks and ordinary functions can be typed. () after the arrow means the function returns no values.",
    "previousPageId": "luau-types/item-9",
    "nextPageId": "luau-types/item-11",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-11",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply Exported module types, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "-- app/cards.luau\nexport type Card = {\n    id: string,\n    color: \"red\" | \"green\",\n}\n\nlocal Cards = {}\n\nfunction Cards.create(id: string, color: \"red\" | \"green\"): Card\n    return { id = id, color = color }\nend\n\nreturn table.freeze(Cards)\n\n-- app/main.luau\nlocal Cards = require(\"app/cards\")\nlocal card: Cards.Card = Cards.create(\"card-1\", \"green\")",
    "signature": "export type Name = ...",
    "parameters": [],
    "returns": null,
    "name": "Exported module types",
    "description": "A local type stays inside its module. export type lets consumers refer to it through the name bound by require.",
    "wide": true,
    "previousPageId": "luau-types/item-10",
    "nextPageId": "luau-types/item-12",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-12",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply typeof, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "local defaults = {\n    soundEnabled = true,\n    volume = 0.8,\n}\n\ntype Settings = typeof(defaults)\n\nlocal settings: Settings = {\n    soundEnabled = false,\n    volume = 0.5,\n}",
    "signature": "type Name = typeof(value)",
    "parameters": [],
    "returns": null,
    "name": "typeof",
    "description": "Derive a type from an existing value. It is convenient for local configuration; an explicit type is often clearer for a public contract.",
    "previousPageId": "luau-types/item-11",
    "nextPageId": "luau-types/item-13",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-13",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply Intersections, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "type Identified = { id: string }\ntype Named = { name: string }\ntype NamedEntity = Identified & Named\n\nlocal item: NamedEntity = {\n    id = \"meditation-1\",\n    name = \"Morning calm\",\n}",
    "signature": "A & B",
    "parameters": [],
    "returns": null,
    "name": "Intersections",
    "description": "Require a value to satisfy both types, which is useful when combining small reusable contracts.",
    "previousPageId": "luau-types/item-12",
    "nextPageId": "luau-types/item-14",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-14",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply any, unknown, and never, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "local value: unknown = \"green\"\n\nif type(value) == \"string\" then\n    local upper = string.upper(value)\nend\n\nlocal function impossible(value: never): never\n    error(\"Unhandled value: \" .. tostring(value))\nend",
    "signature": "any · unknown · never",
    "parameters": [],
    "returns": null,
    "name": "any, unknown, and never",
    "description": "any largely disables checking, unknown requires narrowing before use, and never describes an impossible value.",
    "points": [
      "Prefer a concrete type whenever possible.",
      "Use unknown at untrusted boundaries and narrow it before use.",
      "Keep any as a temporary escape hatch for code that cannot yet be typed.",
      "Use never to prove that every union alternative was handled."
    ],
    "previousPageId": "luau-types/item-13",
    "nextPageId": "luau-types/item-15",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-15",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply Type casts with ::, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "type Color = \"red\" | \"green\"\n\nlocal raw = \"red\"\nlocal selected = raw :: Color\n\n-- Validate unknown storage or server data with luastra/data\n-- before casting it to a trusted application type.",
    "signature": "expression :: Type",
    "parameters": [],
    "returns": null,
    "name": "Type casts with ::",
    "description": "The :: operator tells the analyzer to treat an expression as a compatible type. It does not validate external data or change the runtime value.",
    "points": [
      "Use :: only when you know more than inference can prove.",
      "A cast is not a runtime validator and should not be used to silence a real mismatch."
    ],
    "previousPageId": "luau-types/item-14",
    "nextPageId": "luau-types/item-16",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/item-16",
    "kind": "entry",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "callable": false,
    "useWhen": "Read this page when you need to apply Runtime immutability with table.freeze, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "type Tween = {\n    kind: \"tween\",\n    from: number,\n    to: number,\n}\n\nlocal tween = table.freeze({\n    kind = \"tween\",\n    from = 0,\n    to = 1,\n}) :: Tween\n\n-- tween.to = 2 -- runtime error: the table is frozen",
    "signature": "table.freeze(value)",
    "parameters": [],
    "returns": null,
    "name": "Runtime immutability with table.freeze",
    "description": "Freeze a table so later writes fail at runtime. The operation is shallow: nested tables remain mutable unless they are frozen separately.",
    "points": [
      "table.freeze affects runtime mutation; it is separate from static typing.",
      "Freeze each nested table separately when deep immutability is required.",
      "Freezing a returned module API prevents consumers from replacing its exported fields."
    ],
    "previousPageId": "luau-types/item-15",
    "nextPageId": "luau-types/table-1",
    "relatedPageIds": []
  },
  {
    "id": "luau-types/table-1",
    "kind": "parameter-group",
    "sectionId": "luau-types",
    "sectionTitle": "Luau typing quick reference",
    "module": "Luau 0.731 · --!strict",
    "name": "How to read table types",
    "signature": "luau-table-types",
    "description": "Shared parameters in the “How to read table types” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "{number}",
        "values": "array of numbers",
        "description": "Dense values such as { 10, 20, 30 }."
      },
      {
        "name": "{Color}",
        "values": "array of Color",
        "description": "Every element must be one admitted Color literal."
      },
      {
        "name": "{[number]: string}",
        "values": "number key → string",
        "description": "A sparse dictionary such as RequestId → operation."
      },
      {
        "name": "{[string]: number}",
        "values": "string key → number",
        "description": "For example player name → score."
      },
      {
        "name": "{ id: string, active: boolean }",
        "values": "record",
        "description": "A table with known named fields."
      }
    ],
    "previousPageId": "luau-types/item-16",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "beginner-tutorial/item-1",
    "kind": "entry",
    "sectionId": "beginner-tutorial",
    "sectionTitle": "Beginner tutorial: build an accessible counter",
    "module": "luastra/ui · Application.render · Application.handle · about 15 minutes",
    "callable": false,
    "useWhen": "Run this in the parent directory where the new project folder should be created.",
    "code": "luastra create beginner-counter\ncd beginner-counter",
    "signature": "luastra create beginner-counter",
    "parameters": [],
    "returns": null,
    "name": "1. Create the project",
    "description": "The CLI creates the normal project structure. Enter that directory before replacing the three files below.",
    "language": "Shell",
    "points": [
      "Expect JSON with result=PASS.",
      "You should now have luastra.json, src/main.luau, and tests/smoke.luau.",
      "If create rejects the destination, choose a missing or empty safe directory rather than deleting existing work."
    ],
    "previousPageId": null,
    "nextPageId": "beginner-tutorial/item-2",
    "relatedPageIds": []
  },
  {
    "id": "beginner-tutorial/item-2",
    "kind": "entry",
    "sectionId": "beginner-tutorial",
    "sectionTitle": "Beginner tutorial: build an accessible counter",
    "module": "luastra/ui · Application.render · Application.handle · about 15 minutes",
    "callable": false,
    "useWhen": "Replace the generated manifest before checking the project so the test can import the application and the application can import luastra/ui.",
    "code": "{\n  \"schemaVersion\": 2,\n  \"project\": {\n    \"id\": \"dev.luastra.beginner-counter\",\n    \"entry\": \"app/main\"\n  },\n  \"sdk\": {\n    \"contract\": 1\n  },\n  \"capabilities\": [\"ui.render\"],\n  \"modules\": [\n    {\n      \"id\": \"app/main\",\n      \"source\": \"src/main.luau\",\n      \"dependencies\": [\"luastra/ui\"]\n    },\n    {\n      \"id\": \"app/tests/counter\",\n      \"source\": \"tests/smoke.luau\",\n      \"dependencies\": [\"app/main\"]\n    }\n  ],\n  \"tests\": [\"app/tests/counter\"]\n}",
    "signature": "one app module · one test module · ui.render",
    "parameters": [],
    "returns": null,
    "name": "2. Replace luastra.json",
    "description": "The manifest declares every source file, dependency, test, and host capability used by this tutorial.",
    "language": "JSON",
    "points": [
      "ui.render admits host rendering; it does not grant storage, network, media, or filesystem access.",
      "Dependencies are per module: app/main imports luastra/ui, while the test imports app/main.",
      "The test module is listed in both modules and tests because declaration and execution are separate manifest responsibilities."
    ],
    "previousPageId": "beginner-tutorial/item-1",
    "nextPageId": "beginner-tutorial/item-3",
    "relatedPageIds": []
  },
  {
    "id": "beginner-tutorial/item-3",
    "kind": "entry",
    "sectionId": "beginner-tutorial",
    "sectionTitle": "Beginner tutorial: build an accessible counter",
    "module": "luastra/ui · Application.render · Application.handle · about 15 minutes",
    "callable": false,
    "useWhen": "Replace the complete generated entry module; do not paste only render or handle because the imports, state, snapshot, and returned Application table belong to the same file.",
    "code": "--!strict\n\nlocal UI = require(\"luastra/ui\")\n\nlocal Application = {}\nlocal count: number = 0\n\nfunction Application.render(): UI.Node\n    return UI.Screen {\n        id = \"counter\",\n        documentTitle = \"Beginner counter\",\n        width = \"full\",\n\n        UI.Column {\n            id = \"counter/content\",\n            width = \"content\",\n            padding = \"responsive\",\n            gap = \"md\",\n\n            UI.Text {\n                id = \"counter/title\",\n                text = \"My first Luastra app\",\n                variant = \"title\",\n            },\n            UI.Text {\n                id = \"counter/value\",\n                text = `Count: {count}`,\n                role = \"status\",\n                label = `Current count: {count}`,\n            },\n            UI.Row {\n                id = \"counter/actions\",\n                gap = \"sm\",\n                responsive = true,\n\n                UI.Button {\n                    id = \"counter/add\",\n                    text = \"Add one\",\n                    onTap = \"counter.add\",\n                },\n                UI.Button {\n                    id = \"counter/reset\",\n                    text = \"Reset\",\n                    appearance = \"secondary\",\n                    disabled = count == 0,\n                    onTap = \"counter.reset\",\n                },\n            },\n        },\n    }\nend\n\nfunction Application.handle(action: string, target: string, _value: string)\n    if action == \"counter.add\" and target == \"counter/add\" then\n        count += 1\n    elseif action == \"counter.reset\" and target == \"counter/reset\" then\n        count = 0\n    end\nend\n\nfunction Application.snapshot()\n    return { count = count }\nend\n\nreturn Application",
    "signature": "complete runnable application",
    "parameters": [],
    "returns": null,
    "name": "3. Replace src/main.luau",
    "description": "Module state owns the count, render describes the current interface, and handle admits exactly two actions from stable controls.",
    "wide": true,
    "points": [
      "--!strict lets luastra check analyze this entire module.",
      "Application.render has no side effects: it returns a fresh description of UI from count.",
      "onTap contains an action name; the clicked component's stable id arrives separately as target.",
      "role=status announces the changed count without moving keyboard focus.",
      "snapshot is a small test seam used by tests/smoke.luau; the host never calls it."
    ],
    "previousPageId": "beginner-tutorial/item-2",
    "nextPageId": "beginner-tutorial/item-4",
    "relatedPageIds": []
  },
  {
    "id": "beginner-tutorial/item-4",
    "kind": "entry",
    "sectionId": "beginner-tutorial",
    "sectionTitle": "Beginner tutorial: build an accessible counter",
    "module": "luastra/ui · Application.render · Application.handle · about 15 minutes",
    "callable": false,
    "useWhen": "Replace the generated smoke test so luastra test verifies this application's behavior instead of only constructing an unrelated SDK node.",
    "code": "--!strict\n\nlocal Application = require(\"app/main\")\n\nassert(Application.snapshot().count == 0, \"counter must start at zero\")\n\nlocal initialTree = Application.render()\nassert(initialTree.type == \"Screen\", \"render must return one Screen root\")\nassert(initialTree.id == \"counter\", \"screen id must remain stable\")\n\nApplication.handle(\"counter.add\", \"counter/add\", \"\")\nassert(Application.snapshot().count == 1, \"Add one must increment the count\")\n\nApplication.handle(\"counter.add\", \"another/control\", \"\")\nassert(Application.snapshot().count == 1, \"an unrelated target must not change state\")\n\nApplication.handle(\"counter.reset\", \"counter/reset\", \"\")\nassert(Application.snapshot().count == 0, \"Reset must restore zero\")\n\nreturn true",
    "signature": "deterministic interaction test",
    "parameters": [],
    "returns": null,
    "name": "4. Replace tests/smoke.luau",
    "description": "The test imports the real entry module, exercises the same actions emitted by the buttons, and proves that an unrelated target cannot mutate state.",
    "wide": true,
    "points": [
      "The test calls handle directly, so it is deterministic and does not need a browser.",
      "The live preview separately proves pointer, keyboard, DOM, and visible status behavior in the current host.",
      "When you add a new product rule, add its state transition here before relying on manual testing alone."
    ],
    "previousPageId": "beginner-tutorial/item-3",
    "nextPageId": "beginner-tutorial/item-5",
    "relatedPageIds": []
  },
  {
    "id": "beginner-tutorial/item-5",
    "kind": "entry",
    "sectionId": "beginner-tutorial",
    "sectionTitle": "Beginner tutorial: build an accessible counter",
    "module": "luastra/ui · Application.render · Application.handle · about 15 minutes",
    "callable": false,
    "useWhen": "Run these commands from beginner-counter after all three files are saved.",
    "code": "luastra check\nluastra test",
    "signature": "luastra check → luastra test",
    "parameters": [],
    "returns": null,
    "name": "5. Check before running",
    "description": "First validate the manifest and strict module graph, then execute the declared behavior test.",
    "language": "Shell",
    "points": [
      "check must report result=PASS and project=dev.luastra.beginner-counter.",
      "test must report tests=1 and passed=1.",
      "A check error names the source or manifest problem. Fix its first concrete path or line before interpreting later errors.",
      "If test fails, read the assertion message: it names the product behavior that no longer matches the code."
    ],
    "previousPageId": "beginner-tutorial/item-4",
    "nextPageId": "beginner-tutorial/item-6",
    "relatedPageIds": []
  },
  {
    "id": "beginner-tutorial/item-6",
    "kind": "entry",
    "sectionId": "beginner-tutorial",
    "sectionTitle": "Beginner tutorial: build an accessible counter",
    "module": "luastra/ui · Application.render · Application.handle · about 15 minutes",
    "callable": false,
    "useWhen": "Run only after check and test pass; the preview stays available while this command owns the terminal.",
    "code": "luastra run\n# Open the READY URL printed by Luastra.\n# Expect Count: 0 and a disabled Reset button.\n# Press Add one: expect Count: 1 and an enabled Reset button.\n# Press Reset: expect Count: 0 and Reset disabled again.\n# Press Tab and Enter to repeat the flow without a mouse.\n# Stop the preview with Ctrl+C.",
    "signature": "luastra run → READY URL",
    "parameters": [],
    "returns": null,
    "name": "6. Run and verify the interface",
    "description": "Keep the terminal open, visit the printed local URL, and exercise the actual browser host.",
    "language": "Shell",
    "points": [
      "The URL may use a different free port; use the exact READY URL.",
      "Keyboard focus should remain on the activated button while the status text changes.",
      "Automated state tests and live host interaction are complementary evidence, not substitutes for each other."
    ],
    "previousPageId": "beginner-tutorial/item-5",
    "nextPageId": "beginner-tutorial/item-7",
    "relatedPageIds": []
  },
  {
    "id": "beginner-tutorial/item-7",
    "kind": "guide",
    "sectionId": "beginner-tutorial",
    "sectionTitle": "Beginner tutorial: build an accessible counter",
    "module": "luastra/ui · Application.render · Application.handle · about 15 minutes",
    "callable": false,
    "useWhen": "Do this only after the copied tutorial works unchanged once.",
    "code": null,
    "signature": "edit → check → test → preview",
    "parameters": [],
    "returns": null,
    "name": "7. Make one safe change",
    "description": "Change the visible title to your own app name, then repeat the same development loop.",
    "points": [
      "Change only counter/title.text first; the existing interaction test should still pass.",
      "Run luastra check and luastra test after the edit.",
      "Refresh or return to the live preview and confirm the new title without losing counter behavior.",
      "For a behavior change such as adding Subtract, update render, handle, and the test together.",
      "Next, use the Delayed action recipe to add time, Typed navigation to add screens, or Persist state to survive reloads."
    ],
    "previousPageId": "beginner-tutorial/item-6",
    "nextPageId": "beginner-tutorial/table-1",
    "relatedPageIds": []
  },
  {
    "id": "beginner-tutorial/table-1",
    "kind": "parameter-group",
    "sectionId": "beginner-tutorial",
    "sectionTitle": "Beginner tutorial: build an accessible counter",
    "module": "luastra/ui · Application.render · Application.handle · about 15 minutes",
    "name": "How one click becomes visible state",
    "signature": "beginner-counter-flow",
    "description": "Shared parameters in the “How one click becomes visible state” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "1. Declare",
        "values": "UI.Button onTap=counter.add",
        "description": "render describes an accessible action and its stable target id."
      },
      {
        "name": "2. Activate",
        "values": "pointer, touch, Enter, or Space",
        "description": "the host emits the admitted action and target without embedding application logic."
      },
      {
        "name": "3. Update",
        "values": "Application.handle",
        "description": "the application validates both strings and changes count."
      },
      {
        "name": "4. Render",
        "values": "Application.render",
        "description": "Luastra requests the complete current tree again."
      },
      {
        "name": "5. Reconcile",
        "values": "stable node ids",
        "description": "the host updates the count and disabled state without replacing unrelated UI."
      }
    ],
    "previousPageId": "beginner-tutorial/item-7",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "advanced-tutorial/item-1",
    "kind": "function",
    "sectionId": "advanced-tutorial",
    "sectionTitle": "Advanced tutorial: routed persisted data",
    "module": "Navigation · State · Host · Data",
    "callable": true,
    "useWhen": "Compile route definitions when URLs must be generated and matched from one typed, canonical path and query contract.",
    "code": "local compiler = Navigation.compile {\n    { name = \"home\", path = \"/\" },\n    { name = \"item\", path = \"/item/:id\" },\n}",
    "signature": "Navigation.compile(definitionsValue: any): RouteCompiler",
    "parameters": [
      {
        "name": "definitionsValue",
        "values": "any",
        "description": "Checked definitionsValue argument accepted by Compile typed routes."
      }
    ],
    "returns": "RouteCompiler — a reusable compiler for matching, generating, and canonicalizing admitted route locations.",
    "name": "Compile typed routes",
    "description": "Define canonical locations once and reject malformed parameters.",
    "previousPageId": null,
    "nextPageId": "advanced-tutorial/item-2",
    "relatedPageIds": []
  },
  {
    "id": "advanced-tutorial/item-2",
    "kind": "function",
    "sectionId": "advanced-tutorial",
    "sectionTitle": "Advanced tutorial: routed persisted data",
    "module": "Navigation · State · Host · Data",
    "callable": true,
    "useWhen": "Encode state before writing a bounded snapshot to host storage so later versions can decode or migrate it explicitly.",
    "code": "local snapshot = State.encode(1, {\n    route = router.encode(),\n    filter = filter,\n})\nlocal requestId = Host.storageSet(\"app-state\", snapshot)\npending[requestId] = \"save\"",
    "signature": "State.encode(version: number, fields: Fields): string",
    "parameters": [
      {
        "name": "version",
        "values": "number",
        "description": "Checked version argument accepted by Encode a versioned snapshot."
      },
      {
        "name": "fields",
        "values": "Fields",
        "description": "Checked fields argument accepted by Encode a versioned snapshot."
      }
    ],
    "returns": "string — the validated canonical string produced by this operation.",
    "name": "Encode a versioned snapshot",
    "description": "Persist a small deterministic snapshot with an explicit version.",
    "previousPageId": "advanced-tutorial/item-1",
    "nextPageId": "advanced-tutorial/item-3",
    "relatedPageIds": []
  },
  {
    "id": "advanced-tutorial/item-3",
    "kind": "function",
    "sectionId": "advanced-tutorial",
    "sectionTitle": "Advanced tutorial: routed persisted data",
    "module": "Navigation · State · Host · Data",
    "callable": true,
    "useWhen": "Decode with a Data schema whenever a value originates outside trusted Luau state, including forms, storage, URLs, and server payloads.",
    "code": "local result = Data.decode(snapshotSchema, decodedValue)\nif result.success then\n    restore(result.value)\nend",
    "signature": "Data.decode(schema: Schema, value: any): Result",
    "parameters": [
      {
        "name": "schema",
        "values": "Schema",
        "description": "Checked schema argument accepted by Validate restored values."
      },
      {
        "name": "value",
        "values": "any",
        "description": "Checked value argument accepted by Validate restored values."
      }
    ],
    "returns": "Result — a discriminated validation result; branch on success before reading value or error.",
    "name": "Validate restored values",
    "description": "Static Luau types do not make storage or server payloads trustworthy.",
    "previousPageId": "advanced-tutorial/item-2",
    "nextPageId": "advanced-tutorial/item-4",
    "relatedPageIds": []
  },
  {
    "id": "advanced-tutorial/item-4",
    "kind": "function",
    "sectionId": "advanced-tutorial",
    "sectionTitle": "Advanced tutorial: routed persisted data",
    "module": "Navigation · State · Host · Data",
    "callable": true,
    "useWhen": "Implement Application.resolve when asynchronous Host, Server, or Media requests need to update application state after completion.",
    "code": "function Application.resolve(\n    id: number,\n    success: boolean,\n    payload: string,\n    _code: string,\n    _message: string\n)\n    local operation = pending[id]\n    pending[id] = nil\n    if operation == \"load\" and success then\n        restore(payload)\n    end\nend",
    "signature": "Application.resolve",
    "parameters": [
      {
        "name": "id",
        "values": "number",
        "description": "The RequestId returned by the Host, Server, or Media operation."
      },
      {
        "name": "success",
        "values": "boolean",
        "description": "Whether the operation completed successfully."
      },
      {
        "name": "payload",
        "values": "string",
        "description": "The bounded successful response payload, or an empty string after failure."
      },
      {
        "name": "code",
        "values": "string",
        "description": "A stable failure code, or an empty string after success."
      },
      {
        "name": "message",
        "values": "string",
        "description": "A bounded diagnostic message, or an empty string after success."
      }
    ],
    "returns": "Nothing. Update state, clear the pending operation, and let Luastra render again.",
    "name": "Resolve asynchronous work",
    "description": "Match the RequestId and handle bounded failure information.",
    "previousPageId": "advanced-tutorial/item-3",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "first-app/item-1",
    "kind": "guide",
    "sectionId": "first-app",
    "sectionTitle": "Complete mini-app checkpoint",
    "module": "Beginner tutorial · verified manifest · application test",
    "callable": false,
    "useWhen": "Use this after completing Beginner tutorial and before moving to a capability recipe.",
    "code": null,
    "signature": "copy → understand → verify → change",
    "parameters": [],
    "returns": null,
    "name": "Completion checklist",
    "description": "Finish each checkpoint before treating the counter as a working first application.",
    "points": [
      "The three displayed files were copied into one project and both check and test reported PASS.",
      "The browser showed Count: 0, Add one changed it to 1, and Reset restored 0.",
      "The same interaction worked with Tab and Enter.",
      "You changed the title, repeated check and test, and confirmed the preview still behaved correctly.",
      "You can identify which claims came from the deterministic test and which came from the live browser check."
    ],
    "previousPageId": null,
    "nextPageId": "first-app/item-2",
    "relatedPageIds": []
  },
  {
    "id": "first-app/item-2",
    "kind": "guide",
    "sectionId": "first-app",
    "sectionTitle": "Complete mini-app checkpoint",
    "module": "Beginner tutorial · verified manifest · application test",
    "callable": false,
    "useWhen": "Use this when choosing the first extension to your counter.",
    "code": null,
    "signature": "time · routes · persistence",
    "parameters": [],
    "returns": null,
    "name": "Choose the next capability",
    "description": "Add one concept at a time through a complete checked recipe instead of combining several unfamiliar host boundaries at once.",
    "points": [
      "Delayed action teaches timer events delivered to Application.handle.",
      "Typed navigation teaches named routes and validated canonical locations.",
      "Persist state teaches versioned snapshots plus asynchronous Host requests and Application.resolve.",
      "Return to the API reference only after the matching recipe works, then use symbol pages for exact signatures and edge cases."
    ],
    "previousPageId": "first-app/item-1",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "application/item-1",
    "kind": "function",
    "sectionId": "application",
    "sectionTitle": "Application contract",
    "module": "app/main",
    "callable": true,
    "useWhen": "Implement render in every application entry module; it is the required source of the complete current host-neutral UI tree.",
    "code": "function Application.render(): UI.Node\n    return UI.Screen {\n        id = \"app\",\n    }\nend",
    "signature": "Application.render() -> UI.Node",
    "parameters": [],
    "returns": "UI.Node — exactly one UI.Screen root.",
    "name": "Application.render",
    "description": "Returns the complete current interface as exactly one UI.Screen root.",
    "completeRecipe": {
      "sectionId": "recipe-timer",
      "title": "run a delayed action",
      "evidence": "authored-files",
      "description": "This checked recipe uses Application.render inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": null,
    "nextPageId": "application/item-2",
    "relatedPageIds": []
  },
  {
    "id": "application/item-2",
    "kind": "function",
    "sectionId": "application",
    "sectionTitle": "Application contract",
    "module": "app/main",
    "callable": true,
    "useWhen": "Implement handle when the application reacts to controls, input, timers, navigation, lifecycle, media state, or other admitted host events.",
    "code": "function Application.handle(\n    action: string,\n    target: string,\n    value: string\n)\n    -- Validate the event and update module state.\nend",
    "signature": "Application.handle(action: string, target: string, value: string)",
    "parameters": [
      {
        "name": "action",
        "values": "string",
        "description": "An onTap/onInput/onDismiss action or a host event such as lifecycle, timer, history, open_url, system_back, or media_state."
      },
      {
        "name": "target",
        "values": "string",
        "description": "The stable component ID or host target such as app or browser."
      },
      {
        "name": "value",
        "values": "string",
        "description": "The committed input value or bounded event payload; it may be empty."
      }
    ],
    "returns": "Nothing. State changes become visible in the render that follows the handler.",
    "name": "Application.handle",
    "description": "Receives admitted UI and host events before the next render.",
    "completeRecipe": {
      "sectionId": "recipe-timer",
      "title": "run a delayed action",
      "evidence": "authored-files",
      "description": "This checked recipe uses Application.handle inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "application/item-1",
    "nextPageId": "application/item-3",
    "relatedPageIds": []
  },
  {
    "id": "application/item-3",
    "kind": "function",
    "sectionId": "application",
    "sectionTitle": "Application contract",
    "module": "app/main",
    "callable": true,
    "useWhen": "Implement resolve when the application starts asynchronous Host, Server, or Media operations and must correlate their results by RequestId.",
    "code": "function Application.resolve(\n    id: number,\n    success: boolean,\n    payload: string,\n    code: string,\n    message: string\n)\n    -- Match id, clear pending work, then update state.\nend",
    "signature": "Application.resolve(id: number, success: boolean, payload: string, code: string, message: string)",
    "parameters": [
      {
        "name": "id",
        "values": "number",
        "description": "The RequestId returned when the operation started."
      },
      {
        "name": "success",
        "values": "boolean",
        "description": "Whether the operation completed successfully."
      },
      {
        "name": "payload",
        "values": "string",
        "description": "The successful bounded payload, or an empty string after failure."
      },
      {
        "name": "code",
        "values": "string",
        "description": "The stable failure code, or an empty string after success."
      },
      {
        "name": "message",
        "values": "string",
        "description": "The bounded diagnostic message, or an empty string after success."
      }
    ],
    "returns": "Nothing. Clear the matching pending operation and update state for the following render.",
    "name": "Application.resolve",
    "description": "Receives the bounded completion of an asynchronous Host, Server, or Media request.",
    "completeRecipe": {
      "sectionId": "recipe-storage",
      "title": "persist and restore state",
      "evidence": "authored-files",
      "description": "This checked recipe uses Application.resolve inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "application/item-2",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "events-errors/table-1",
    "kind": "parameter-group",
    "sectionId": "events-errors",
    "sectionTitle": "Events and errors",
    "module": "Application.handle · Application.resolve",
    "name": "Event delivery",
    "signature": "event-delivery",
    "description": "Shared parameters in the “Event delivery” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "UI action",
        "values": "handle(action, target, value)",
        "description": "onTap, onInput, and onDismiss send the declared action plus the stable target ID."
      },
      {
        "name": "Timer expiry",
        "values": "handle(\"timer\", id, value)",
        "description": "A started or restarted one-shot timer delivers its ID and optional value."
      },
      {
        "name": "Media state",
        "values": "handle(\"media_state\", target, payload)",
        "description": "Decode the payload with Media.decodeState before reading playback fields."
      },
      {
        "name": "System Back",
        "values": "handle(\"system_back\", target, value)",
        "description": "Close a modal, navigate back, delegate to history, or acknowledge exit according to current state."
      },
      {
        "name": "Async completion",
        "values": "resolve(requestId, success, payload, code, message)",
        "description": "Match the RequestId saved when the capability call was made, then clear the pending entry."
      }
    ],
    "previousPageId": null,
    "nextPageId": "events-errors/table-2",
    "relatedPageIds": []
  },
  {
    "id": "events-errors/table-2",
    "kind": "parameter-group",
    "sectionId": "events-errors",
    "sectionTitle": "Events and errors",
    "module": "Application.handle · Application.resolve",
    "name": "Error handling",
    "signature": "error-handling",
    "description": "Shared parameters in the “Error handling” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "Data validation",
        "values": "Data.Result · Data.ValidationError",
        "description": "Branch on success; failure exposes a bounded code and path."
      },
      {
        "name": "State restore",
        "values": "State.DecodeResult · State.MigrationResult",
        "description": "Reject invalid snapshots or run explicit ordered migrations."
      },
      {
        "name": "Routes",
        "values": "Navigation.RouteResult · Navigation.MutationResult",
        "description": "Inspect success and error.code; do not assume an untrusted location is valid."
      },
      {
        "name": "Server payload",
        "values": "Server.DecodeResult",
        "description": "Decode before consuming trusted-backend output."
      },
      {
        "name": "Media state",
        "values": "Media.DecodeResult · Media.MediaError",
        "description": "Separate payload decoding failure from a playback error reported inside state."
      },
      {
        "name": "Assertions",
        "values": "development failure",
        "description": "Invalid API use fails clearly during check, test, preview, or event handling; fix the call rather than catching message text."
      }
    ],
    "previousPageId": "events-errors/table-1",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "ui/item-1",
    "kind": "type",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "This type exists during Luau analysis and documents values used by UI constructors or Application.render. It is erased from the runtime bundle as a static type.",
    "expectedOutcome": "A checked annotation that matches the exact exported declaration.",
    "failureGuidance": "If the annotation fails, compare the value with the exact declaration and the producing or consuming function.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": false,
    "useWhen": "Use UI.Properties when a generic helper needs to inspect or pass a validated node property map. Most applications should prefer the named fields of individual UI constructors instead of constructing this map directly.",
    "code": "export type Properties = { [string]: any }",
    "signature": "export type Properties = { [string]: any }",
    "parameters": [
      {
        "name": "[string]",
        "values": "any",
        "description": "Index signature mapping any; every key and value must satisfy this contract."
      }
    ],
    "returns": "UI.Node — a declarative node in the new render tree.",
    "name": "UI.Properties",
    "description": "UI.Properties is the validated map stored on a declarative UI node after constructor checks. It carries only serializable, admitted property values that host renderers can interpret consistently.",
    "previousPageId": null,
    "nextPageId": "ui/item-2",
    "relatedPageIds": []
  },
  {
    "id": "ui/item-2",
    "kind": "type",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "This type exists during Luau analysis and documents values used by UI constructors or Application.render. It is erased from the runtime bundle as a static type.",
    "expectedOutcome": "A checked annotation that matches the exact exported declaration.",
    "failureGuidance": "If the annotation fails, compare the value with the exact declaration and the producing or consuming function.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": false,
    "useWhen": "Use UI.Theme to define one reusable palette and pass it to multiple UI.Screen roots. Override only the colors your product owns; omitted fields intentionally retain Luastra's accessible defaults.",
    "code": "export type Theme = {\n    backgroundColor: string?,\n    textColor: string?,\n    accentColor: string?,\n    mutedColor: string?,\n    surfaceColor: string?,\n    successColor: string?,\n    warningColor: string?,\n    dangerColor: string?,\n}",
    "signature": "export type Theme = {\n    backgroundColor: string?,\n    textColor: string?,\n    accentColor: string?,\n    mutedColor: string?,\n    surfaceColor: string?,\n    successColor: string?,\n    warningColor: string?,\n    dangerColor: string?,\n}",
    "parameters": [
      {
        "name": "backgroundColor",
        "values": "string?",
        "description": "Default screen and inherited component background color."
      },
      {
        "name": "textColor",
        "values": "string?",
        "description": "Default inherited foreground color for text-bearing components."
      },
      {
        "name": "accentColor",
        "values": "string?",
        "description": "Accent color used by primary controls, outlines, and emphasis tokens."
      },
      {
        "name": "mutedColor",
        "values": "string?",
        "description": "Checked mutedColor field of UI.Theme; its exact admitted type is string?."
      },
      {
        "name": "surfaceColor",
        "values": "string?",
        "description": "Checked surfaceColor field of UI.Theme; its exact admitted type is string?."
      },
      {
        "name": "successColor",
        "values": "string?",
        "description": "Checked successColor field of UI.Theme; its exact admitted type is string?."
      },
      {
        "name": "warningColor",
        "values": "string?",
        "description": "Checked warningColor field of UI.Theme; its exact admitted type is string?."
      },
      {
        "name": "dangerColor",
        "values": "string?",
        "description": "Checked dangerColor field of UI.Theme; its exact admitted type is string?."
      }
    ],
    "returns": "UI.Node — a declarative node in the new render tree.",
    "name": "UI.Theme",
    "description": "UI.Theme is a reusable record of optional screen color overrides. Direct UI.Screen color fields take precedence, while every omitted field inherits Luastra's built-in accessible palette.",
    "previousPageId": "ui/item-1",
    "nextPageId": "ui/item-3",
    "relatedPageIds": [
      "ui/item-4",
      "ui/item-5"
    ]
  },
  {
    "id": "ui/item-3",
    "kind": "type",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "This type exists during Luau analysis and documents values used by UI constructors or Application.render. It is erased from the runtime bundle as a static type.",
    "expectedOutcome": "A checked annotation that matches the exact exported declaration.",
    "failureGuidance": "If the annotation fails, compare the value with the exact declaration and the producing or consuming function.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": false,
    "useWhen": "Use UI.Node as the return type of helpers that construct interface fragments and as the required return type of Application.render. Application code should create nodes through UI constructors rather than assembling raw node tables.",
    "code": "export type Node = {\n    type: string,\n    id: string,\n    properties: Properties,\n    children: { Node },\n}",
    "signature": "export type Node = {\n    type: string,\n    id: string,\n    properties: Properties,\n    children: { Node },\n}",
    "parameters": [
      {
        "name": "type",
        "values": "string",
        "description": "Checked type field of UI.Node; its exact admitted type is string."
      },
      {
        "name": "id",
        "values": "string",
        "description": "Stable identifier used to correlate or address this value across operations."
      },
      {
        "name": "properties",
        "values": "Properties",
        "description": "Checked properties field of UI.Node; its exact admitted type is Properties."
      },
      {
        "name": "children",
        "values": "{ Node }",
        "description": "Checked children field of UI.Node; its exact admitted type is { Node }."
      }
    ],
    "returns": "UI.Node — a declarative node in the new render tree.",
    "name": "UI.Node",
    "description": "UI.Node is the host-neutral declarative value produced by every UI constructor. Nodes contain a validated component kind, stable ID, properties, and children that hosts translate into native semantic interface elements.",
    "completeRecipe": {
      "sectionId": "recipe-timer",
      "title": "run a delayed action",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.Node inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-2",
    "nextPageId": "ui/item-4",
    "relatedPageIds": [
      "ui/item-5"
    ]
  },
  {
    "id": "ui/item-4",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Screen content. Application.render returns exactly one Screen.",
    "accessibility": "Creates the main landmark and owns document language and metadata. Keep one meaningful h1 on each page.",
    "commonMistakes": [
      "Returning multiple roots instead of one UI.Screen.",
      "Expecting width=content on Screen to produce a full-viewport background."
    ],
    "callable": true,
    "useWhen": "Use UI.Screen exactly once at the root of Application.render. Choose it when starting a page or route; use Column, Row, or another container for every nested region.",
    "code": "return UI.Screen {\n    id = \"app/root\",\n    width = \"full\",\n    theme = appTheme,\n    documentTitle = \"My Luastra app\",\n    UI.Text { id = \"app/title\", text = \"Hello\", variant = \"title\" },\n}",
    "signature": "UI.Screen(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique root-node ID."
      },
      {
        "name": "documentTitle",
        "values": "string 1…160 bytes",
        "description": "Document or window title; by default the host preserves its own title."
      },
      {
        "name": "documentDescription",
        "values": "string 1…320 bytes",
        "description": "Optional page description for web metadata."
      },
      {
        "name": "documentLanguage",
        "values": "language tag",
        "description": "Optional document language, for example en or en-US."
      },
      {
        "name": "children",
        "values": "UI.Node[]",
        "description": "Screen content. Application.render returns exactly one Screen."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "theme",
        "values": "UI.Theme",
        "description": "Reusable optional colors; direct fields win. Group: UI.Screen theme."
      },
      {
        "name": "accentColor",
        "values": "#RRGGBB",
        "description": "accent theme color. Group: UI.Screen theme."
      },
      {
        "name": "dangerColor",
        "values": "#RRGGBB",
        "description": "danger theme color. Group: UI.Screen theme."
      },
      {
        "name": "mutedColor",
        "values": "#RRGGBB",
        "description": "muted theme color. Group: UI.Screen theme."
      },
      {
        "name": "surfaceColor",
        "values": "#RRGGBB",
        "description": "surface theme color. Group: UI.Screen theme."
      },
      {
        "name": "successColor",
        "values": "#RRGGBB",
        "description": "success theme color. Group: UI.Screen theme."
      },
      {
        "name": "warningColor",
        "values": "#RRGGBB",
        "description": "warning theme color. Group: UI.Screen theme."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Screen",
    "description": "Creates the single root of a rendered interface. It establishes document metadata, the content-width policy, and the inherited color theme that descendants use unless they provide a local override.",
    "props": [
      "layout",
      "theme",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-timer",
      "title": "run a delayed action",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.Screen inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-3",
    "nextPageId": "ui/item-5",
    "relatedPageIds": [
      "ui/item-2",
      "ui/item-7"
    ]
  },
  {
    "id": "ui/item-5",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Items are arranged from top to bottom.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Confusing align with vertical alignment: Column uses justify on its vertical axis.",
      "Expecting Text to center without giving it available width."
    ],
    "callable": true,
    "useWhen": "Use UI.Column for forms, articles, settings, and other top-to-bottom flows. Choose Layer instead when children must overlap, or Row when the primary flow is horizontal.",
    "code": "UI.Column {\n    id = \"profile/content\",\n    width = \"full\",\n    gap = \"md\",\n    align = \"center\",\n    UI.Text { id = \"profile/title\", text = \"Profile\", variant = \"heading\" },\n    UI.Text { id = \"profile/status\", text = \"Ready\" },\n}",
    "signature": "UI.Column(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "children",
        "values": "UI.Node[]",
        "description": "Items are arranged from top to bottom."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Column",
    "description": "Arranges child nodes vertically in source order and applies gap, cross-axis alignment, main-axis distribution, spacing, and inherited colors to that group. Its measured size participates in the surrounding layout.",
    "props": [
      "layout",
      "text-style",
      "semantic"
    ],
    "previousPageId": "ui/item-4",
    "nextPageId": "ui/item-6",
    "relatedPageIds": [
      "ui/item-2",
      "ui/item-3",
      "ui/item-34",
      "ui/item-35"
    ]
  },
  {
    "id": "ui/item-6",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Items flow from left to right and may wrap.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Confusing align with horizontal alignment: Row uses justify on its horizontal axis.",
      "Forgetting responsive=true for narrow phones."
    ],
    "callable": true,
    "useWhen": "Use UI.Row for toolbars, compact metadata, button groups, and side-by-side content. Enable wrapping or responsive behavior when the combined child widths may exceed a phone viewport.",
    "code": "UI.Row {\n    id = \"toolbar/actions\",\n    width = \"full\",\n    gap = \"sm\",\n    justify = \"between\",\n    responsive = true,\n    UI.Button { id = \"toolbar/back\", text = \"Back\", onTap = \"back\" },\n    UI.Button { id = \"toolbar/save\", text = \"Save\", onTap = \"save\" },\n}",
    "signature": "UI.Row(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "children",
        "values": "UI.Node[]",
        "description": "Items flow from left to right and may wrap."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Row",
    "description": "Arranges child nodes horizontally and can wrap or switch to a narrow-screen layout when configured as responsive. align controls the vertical cross axis while justify distributes space along the horizontal main axis.",
    "props": [
      "layout",
      "text-style",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-assets-visuals",
      "title": "package an image and compose visuals",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.Row inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-5",
    "nextPageId": "ui/item-7",
    "relatedPageIds": [
      "ui/item-34",
      "ui/item-35",
      "ui/item-36"
    ]
  },
  {
    "id": "ui/item-7",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "variant creates the real h1/h2/h3 hierarchy; textAlign changes visual alignment only, not reading order.",
    "commonMistakes": [
      "Treating textAlign=center as node positioning; it aligns lines only within Text width.",
      "Creating a visual heading without the matching variant."
    ],
    "callable": true,
    "useWhen": "Use UI.Text for every visible label, paragraph, heading, status announcement, or validation message that is not the built-in label of another control. Pick a heading variant only when it represents the document hierarchy.",
    "code": "UI.Text {\n    id = \"page/title\",\n    width = \"full\",\n    text = \"Centered title\",\n    variant = \"title\",\n    textAlign = \"center\",\n    textColor = \"accent\",\n}",
    "signature": "UI.Text(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "text",
        "values": "string, required",
        "description": "Visible text; use \\n for an explicit line break."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "textAlign",
        "values": "start | center | end",
        "description": "Aligns lines within Text width. Group: Text and local colors."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      },
      {
        "name": "motion",
        "values": "{ [property]: Tween | Sequence }",
        "description": "Opacity, rotation, scale, and translation channels. Group: Events and motion."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Text",
    "description": "Renders selectable semantic text with body or heading meaning, line alignment, status roles, and inherited or local foreground and background colors. Width controls the box in which textAlign operates.",
    "props": [
      "text-style",
      "semantic",
      "motion"
    ],
    "completeRecipe": {
      "sectionId": "recipe-timer",
      "title": "run a delayed action",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.Text inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-6",
    "nextPageId": "ui/item-8",
    "relatedPageIds": [
      "ui/item-10",
      "ui/item-11",
      "ui/item-17",
      "ui/item-19"
    ]
  },
  {
    "id": "ui/item-8",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "Keeps native button semantics, keyboard activation, and visible focus. Do not replace it with a tappable Shape.",
    "commonMistakes": [
      "Using uppercase letters or spaces in the onTap action.",
      "Duplicating the same id across render branches."
    ],
    "callable": true,
    "useWhen": "Use UI.Button when the user initiates an operation or changes application state. Icon-only buttons require a descriptive label. Use UI.Link for navigation to a location; do not simulate a button by making a Shape clickable.",
    "code": "UI.Button {\n    id = \"game/start\",\n    text = \"Start\",\n    appearance = \"primary\",\n    onTap = \"game.start\",\n    label = \"Start the game\",\n}",
    "signature": "UI.Button(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "text",
        "values": "string?",
        "description": "Visible button label; may be omitted when icon and label are provided."
      },
      {
        "name": "icon",
        "values": "activity | palette | pause?",
        "description": "Host-rendered semantic icon. An icon-only button requires label."
      },
      {
        "name": "onTap",
        "values": "action string, required",
        "description": "Action delivered to Application.handle after activation."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      },
      {
        "name": "motion",
        "values": "{ [property]: Tween | Sequence }",
        "description": "Opacity, rotation, scale, and translation channels. Group: Events and motion."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Button",
    "description": "Creates an accessible native action that supports pointer, touch, keyboard, disabled state, appearance semantics, and a bounded host-rendered icon vocabulary. Activation sends its declared onTap action and stable component ID to Application.handle.",
    "props": [
      "action",
      "text-style",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-timer",
      "title": "run a delayed action",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.Button inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-7",
    "nextPageId": "ui/item-9",
    "relatedPageIds": [
      "ui/item-39",
      "ui/item-38",
      "ui/item-23"
    ]
  },
  {
    "id": "ui/item-9",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "Keeps native link semantics. Its visible text should explain the destination without relying on surrounding prose.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.Link when activation changes location or opens a documented resource. Use a canonical #/ route for application navigation, a # fragment for one rendered node, and UI.Button when the action only modifies current state.",
    "code": "UI.Link {\n    id = \"docs/button\",\n    text = \"UI.Button\",\n    href = \"#docs/button\",\n    onTap = \"docs.open-button\",\n}",
    "signature": "UI.Link(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique link ID."
      },
      {
        "name": "text",
        "values": "string, required",
        "description": "Visible link text."
      },
      {
        "name": "href",
        "values": "#fragment | #/route | HTTPS URL, required",
        "description": "Safe internal fragment, canonical application hash route, or external HTTPS destination."
      },
      {
        "name": "external",
        "values": "boolean?",
        "description": "Opens an external destination according to host policy."
      },
      {
        "name": "onTap",
        "values": "action string?",
        "description": "Optional admitted action delivered when the link is activated."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      },
      {
        "name": "motion",
        "values": "{ [property]: Tween | Sequence }",
        "description": "Opacity, rotation, scale, and translation channels. Group: Events and motion."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Link",
    "description": "Creates a semantic link for an admitted node fragment, canonical hash route, or safe external HTTPS location. Hosts preserve link navigation and accessibility behavior instead of treating it as a generic tap action.",
    "props": [
      "action",
      "text-style",
      "semantic"
    ],
    "previousPageId": "ui/item-8",
    "nextPageId": "ui/item-10",
    "relatedPageIds": [
      "ui/item-39",
      "ui/item-38",
      "ui/item-23"
    ]
  },
  {
    "id": "ui/item-10",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.Code for command names, identifiers, property values, and short expressions inside explanatory content. Use UI.CodeBlock for multiline source or commands.",
    "code": "UI.Code { id = \"docs/signature\", code = \"UI.Button { ... }\", language = \"Luau\" }",
    "signature": "UI.Code(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "code",
        "values": "string ≤ 4096 bytes, required",
        "description": "Inline source text rendered without interpretation."
      },
      {
        "name": "language",
        "values": "safe language name?",
        "description": "Optional source-language label."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      },
      {
        "name": "motion",
        "values": "{ [property]: Tween | Sequence }",
        "description": "Opacity, rotation, scale, and translation channels. Group: Events and motion."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Code",
    "description": "Renders a short inline literal with code semantics and a monospace presentation while preserving surrounding text flow. The value remains selectable and accessible as text.",
    "props": [
      "text-style",
      "semantic"
    ],
    "previousPageId": "ui/item-9",
    "nextPageId": "ui/item-11",
    "relatedPageIds": [
      "ui/item-7",
      "ui/item-17",
      "ui/item-19"
    ]
  },
  {
    "id": "ui/item-11",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.CodeBlock for complete snippets, terminal sessions, JSON, or other preformatted material. Keep prose and very short identifiers in UI.Text or UI.Code.",
    "code": "UI.CodeBlock { id = \"docs/example\", code = \"local UI = require(\\\"luastra/ui\\\")\", language = \"Luau\" }",
    "signature": "UI.CodeBlock(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "code",
        "values": "string ≤ 4096 bytes, required",
        "description": "Multiline source text rendered without interpretation."
      },
      {
        "name": "language",
        "values": "safe language name?",
        "description": "Optional source-language label."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.CodeBlock",
    "description": "Renders multiline literal source in a scrollable, selectable code region without interpreting markup. It preserves line breaks and supports long examples within bounded page width.",
    "props": [
      "layout",
      "text-style",
      "semantic"
    ],
    "previousPageId": "ui/item-10",
    "nextPageId": "ui/item-12",
    "relatedPageIds": [
      "ui/item-7",
      "ui/item-17",
      "ui/item-19"
    ]
  },
  {
    "id": "ui/item-12",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "Without label it is decorative; add label only when the divider itself carries meaning.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.Divider when grouping is otherwise unclear between neighbouring sections. Mark purely decorative separators accordingly and prefer spacing when separation alone is sufficient.",
    "code": "UI.Divider { id = \"docs/divider\", label = \"API details\" }",
    "signature": "UI.Divider(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "label",
        "values": "string?",
        "description": "Optional accessible name; omit it for a decorative divider."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "motion",
        "values": "{ [property]: Tween | Sequence }",
        "description": "Opacity, rotation, scale, and translation channels. Group: Events and motion."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Divider",
    "description": "Creates a visual separator with optional semantic meaning between adjacent content regions. The host supplies consistent thickness and theme-aware coloring.",
    "props": [
      "layout",
      "semantic"
    ],
    "previousPageId": "ui/item-11",
    "nextPageId": "ui/item-13",
    "relatedPageIds": []
  },
  {
    "id": "ui/item-13",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Table rows only.",
    "accessibility": "TableRow and TableCell create a real table; header and scope associate headers with columns and rows.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.Table for genuinely two-dimensional data where headers identify values across rows or columns. Use List or Grid for collections that do not require table relationships.",
    "code": "UI.Table {\n    id = \"docs/parameters\",\n    label = \"Parameters\",\n    UI.TableRow {\n        id = \"docs/parameters/header\",\n        UI.TableCell {\n            id = \"docs/parameters/name\",\n            text = \"Name\",\n            header = true,\n            scope = \"col\",\n        },\n    },\n}",
    "signature": "UI.Table(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "children",
        "values": "UI.TableRow[]",
        "description": "Table rows only."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Table",
    "description": "Creates semantic tabular data whose direct children are TableRow nodes. Assistive technologies can preserve row and column relationships that a collection of generic rows cannot express.",
    "props": [
      "layout",
      "text-style",
      "semantic"
    ],
    "previousPageId": "ui/item-12",
    "nextPageId": "ui/item-14",
    "relatedPageIds": [
      "ui/item-15",
      "ui/item-21",
      "ui/item-22"
    ]
  },
  {
    "id": "ui/item-14",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Table cells only.",
    "accessibility": "Does not create a separate accessible name; its header cells establish the row meaning.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.TableRow only as a direct child of UI.Table, once per header or data row. Keep every row's cell structure consistent with the table headers.",
    "code": "UI.TableRow {\n    id = \"docs/row\",\n    UI.TableCell {\n        id = \"docs/row/name\",\n        text = \"width\",\n        header = true,\n        scope = \"row\",\n    },\n}",
    "signature": "UI.TableRow(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "children",
        "values": "UI.TableCell[]",
        "description": "Table cells only."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.TableRow",
    "description": "Defines one semantic row inside UI.Table and restricts its direct children to TableCell nodes. Source order becomes the accessible column order.",
    "props": [
      "layout",
      "text-style",
      "semantic"
    ],
    "previousPageId": "ui/item-13",
    "nextPageId": "ui/item-15",
    "relatedPageIds": [
      "ui/item-21",
      "ui/item-22"
    ]
  },
  {
    "id": "ui/item-15",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Optional nested nodes instead of short text.",
    "accessibility": "For a header, set header=true and the appropriate scope=col or scope=row.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.TableCell only inside UI.TableRow. Mark cells as headers when they label a row or column; use ordinary cells for values.",
    "code": "UI.TableCell { id = \"docs/cell\", text = \"full | content | wide\" }",
    "signature": "UI.TableCell(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "text",
        "values": "string?",
        "description": "Short cell text when nested content is unnecessary."
      },
      {
        "name": "header",
        "values": "boolean?",
        "description": "Marks this cell as a row or column header."
      },
      {
        "name": "scope",
        "values": "col | row?",
        "description": "Associates a header cell with its column or row."
      },
      {
        "name": "children",
        "values": "UI.Node[]",
        "description": "Optional nested nodes instead of short text."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.TableCell",
    "description": "Creates a data cell or a scoped row or column header within a TableRow. Header scope lets assistive technology announce the correct relationship while users move through the table.",
    "props": [
      "layout",
      "text-style",
      "semantic"
    ],
    "previousPageId": "ui/item-14",
    "nextPageId": "ui/item-16",
    "relatedPageIds": [
      "ui/item-13",
      "ui/item-21",
      "ui/item-22"
    ]
  },
  {
    "id": "ui/item-16",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "First child is the front and second is the back; FlipCard owns the size.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Passing anything other than exactly two sides.",
      "Sizing only a child Shape instead of the FlipCard itself."
    ],
    "callable": true,
    "useWhen": "Use UI.FlipCard for reveal interactions where two complete visual trees occupy one card-sized area. Use Layer inside either face when that face needs an image, shape, and overlaid text.",
    "code": "UI.FlipCard {\n    id = \"game/card\",\n    width = 274,\n    height = 382,\n    motion = Motion.flip { fromDeg = revealed and 0 or 180, toDeg = revealed and 180 or 0, durationMs = 500 },\n    UI.Image { id = \"game/card/back\", source = cardBack, label = \"Hidden card\" },\n    UI.Shape { id = \"game/card/color\", shape = \"roundedRectangle\", width = 274, height = 382, fill = hiddenColor },\n}",
    "signature": "UI.FlipCard(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "children",
        "values": "exactly 2 UI.Node",
        "description": "First child is the front and second is the back; FlipCard owns the size."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "motion",
        "values": "{ [property]: Tween | Sequence }",
        "description": "Opacity, rotation, scale, and translation channels. Group: Events and motion."
      },
      {
        "name": "width / height",
        "values": "1…4096",
        "description": "CSS-pixel size. Group: Image, Shape, and FlipCard."
      },
      {
        "name": "aspectRatio",
        "values": "0.05…20",
        "description": "Aspect ratio. Group: Image, Shape, and FlipCard."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.FlipCard",
    "description": "Creates a fixed two-sided 3D surface whose first child is the front and second child is the back. A rotationY motion from Motion.flip controls which face is visible while both sides share the same bounds.",
    "props": [
      "visual",
      "motion"
    ],
    "previousPageId": "ui/item-15",
    "nextPageId": "ui/item-17",
    "relatedPageIds": [
      "ui/item-18",
      "ui/item-37",
      "ui/item-19"
    ]
  },
  {
    "id": "ui/item-17",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "label is required; use an empty string only for a genuinely decorative image.",
    "commonMistakes": [
      "Passing a filesystem path or URL instead of an admitted asset URI.",
      "Omitting the required label."
    ],
    "callable": true,
    "useWhen": "Use UI.Image for packaged PNG, JPEG, WebP, or AVIF artwork. Use UI.Shape for scalable geometry that does not need an asset, and supply a meaningful label unless the image is genuinely decorative.",
    "code": "local Assets = require(\"luastra/assets\")\n\nUI.Image {\n    id = \"card/back\",\n    source = Assets.uri(Assets.image(\"image/card-back\")),\n    width = 274,\n    height = 382,\n    fit = \"cover\",\n    label = \"Card back\",\n}",
    "signature": "UI.Image(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "source",
        "values": "asset:image/... required",
        "description": "URI from Assets.uri(Assets.image(...))."
      },
      {
        "name": "label",
        "values": "string, required",
        "description": "Accessible description; an empty string marks a decorative image."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "motion",
        "values": "{ [property]: Tween | Sequence }",
        "description": "Opacity, rotation, scale, and translation channels. Group: Events and motion."
      },
      {
        "name": "fit",
        "values": "contain | cover | fill | none | scaleDown",
        "description": "Image scaling. Group: Image, Shape, and FlipCard."
      },
      {
        "name": "width / height",
        "values": "1…4096",
        "description": "CSS-pixel size. Group: Image, Shape, and FlipCard."
      },
      {
        "name": "aspectRatio",
        "values": "0.05…20",
        "description": "Aspect ratio. Group: Image, Shape, and FlipCard."
      },
      {
        "name": "cornerRadius",
        "values": "0…2048",
        "description": "Corner radius. Group: Image, Shape, and FlipCard."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Image",
    "description": "Displays an image admitted by luastra.json through a typed Assets.Image reference and URI. Explicit dimensions, aspect ratio, fit, clipping, accessible label, and motion keep rendering deterministic across hosts.",
    "props": [
      "visual",
      "label",
      "motion"
    ],
    "completeRecipe": {
      "sectionId": "recipe-assets-visuals",
      "title": "package an image and compose visuals",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.Image inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-16",
    "nextPageId": "ui/item-18",
    "relatedPageIds": [
      "ui/item-7",
      "ui/item-10",
      "ui/item-11",
      "ui/item-19"
    ]
  },
  {
    "id": "ui/item-18",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "The first child defines the bounds; later children overlay the same area.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Leaving the first child unsized while expecting a stable shared frame.",
      "Expecting padding on one overlay child to constrain every sibling."
    ],
    "callable": true,
    "useWhen": "Use UI.Layer for text over artwork, badges, card faces, and other overlapping compositions. Put the size-defining background first and wrap overlay content in a full-size Column or Row when it needs predictable alignment.",
    "code": "UI.Layer {\n    id = \"welcome/layer\",\n    width = 280,\n    height = 380,\n    UI.Shape { id = \"welcome/background\", shape = \"roundedRectangle\", width = 280, height = 380, fill = \"surface\" },\n    UI.Column { id = \"welcome/content\", width = \"full\", align = \"center\", justify = \"center\",\n        UI.Text { id = \"welcome/title\", width = \"full\", textAlign = \"center\", text = \"Welcome\" },\n    },\n}",
    "signature": "UI.Layer(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "children",
        "values": "UI.Node[]",
        "description": "The first child defines the bounds; later children overlay the same area."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      },
      {
        "name": "motion",
        "values": "{ [property]: Tween | Sequence }",
        "description": "Opacity, rotation, scale, and translation channels. Group: Events and motion."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Layer",
    "description": "Places all children in the same coordinate space instead of adding their sizes sequentially. The first child establishes the layer bounds; later children are overlaid and aligned within those bounds.",
    "props": [
      "layout",
      "text-style",
      "semantic",
      "motion"
    ],
    "previousPageId": "ui/item-17",
    "nextPageId": "ui/item-19",
    "relatedPageIds": [
      "ui/item-16",
      "ui/item-37",
      "ui/item-7"
    ]
  },
  {
    "id": "ui/item-19",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Using Shape as a button and losing button semantics.",
      "Omitting the required width and height."
    ],
    "callable": true,
    "useWhen": "Use UI.Shape for rectangles, circles, polygons, stars, outlines, and colored card faces. Use UI.Image when the visual contains texture or detail that geometry cannot represent.",
    "code": "UI.Shape {\n    id = \"status/star\",\n    shape = \"star\",\n    width = 96,\n    height = 96,\n    fill = \"warning\",\n    stroke = \"accent\",\n    strokeWidth = 2,\n    label = \"Achievement\",\n}",
    "signature": "UI.Shape(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "shape",
        "values": "supported shape, required",
        "description": "Shape geometry."
      },
      {
        "name": "width",
        "values": "number 1…4096, required",
        "description": "Width in CSS pixels."
      },
      {
        "name": "height",
        "values": "number 1…4096, required",
        "description": "Height in CSS pixels."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "motion",
        "values": "{ [property]: Tween | Sequence }",
        "description": "Opacity, rotation, scale, and translation channels. Group: Events and motion."
      },
      {
        "name": "width / height",
        "values": "1…4096",
        "description": "CSS-pixel size. Group: Image, Shape, and FlipCard."
      },
      {
        "name": "cornerRadius",
        "values": "0…2048",
        "description": "Corner radius. Group: Image, Shape, and FlipCard."
      },
      {
        "name": "fill / stroke",
        "values": "token | #RRGGBB",
        "description": "Fill and outline. Group: Image, Shape, and FlipCard."
      },
      {
        "name": "strokeWidth",
        "values": "0…64",
        "description": "Outline thickness. Group: Image, Shape, and FlipCard."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Shape",
    "description": "Draws a bounded host-native geometric figure with explicit size, fill, outline, corner radius, label, and optional motion. It avoids shipping an image for simple scalable artwork.",
    "props": [
      "visual",
      "label",
      "motion"
    ],
    "completeRecipe": {
      "sectionId": "recipe-assets-visuals",
      "title": "package an image and compose visuals",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.Shape inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-18",
    "nextPageId": "ui/item-20",
    "relatedPageIds": [
      "ui/item-7",
      "ui/item-10",
      "ui/item-11",
      "ui/item-17"
    ]
  },
  {
    "id": "ui/item-20",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "label is required. required, disabled, and errorId expose state to screen readers; an error hint should be a visible role=alert.",
    "commonMistakes": [
      "Changing value outside application state.",
      "Treating intermediate IME composition as committed text."
    ],
    "callable": true,
    "useWhen": "Use UI.TextInput for editable text, email, password, search, telephone, or numeric entry. Update its state from onInput and return the new value on the following render; use a custom component only for unsupported multiline editing.",
    "code": "UI.TextInput {\n    id = \"form/email\",\n    label = \"Email\",\n    value = email,\n    onInput = \"form.email-change\",\n    inputType = \"email\",\n    inputMode = \"email\",\n    enterKeyHint = \"next\",\n    required = true,\n}",
    "signature": "UI.TextInput(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique field ID."
      },
      {
        "name": "label",
        "values": "string, required",
        "description": "Accessible field name."
      },
      {
        "name": "value",
        "values": "string, required",
        "description": "Controlled value from application state."
      },
      {
        "name": "onInput",
        "values": "action string, required",
        "description": "Receives committed composition-safe input in Application.handle."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "inputType",
        "values": "text | email | password",
        "description": "Native field type. Group: TextInput."
      },
      {
        "name": "inputMode",
        "values": "decimal | email | numeric | search | tel | text | url",
        "description": "Preferred mobile keyboard. Group: TextInput."
      },
      {
        "name": "enterKeyHint",
        "values": "done | enter | go | next | previous | search | send",
        "description": "Enter-key behavior. Group: TextInput."
      },
      {
        "name": "autoComplete",
        "values": "supported token",
        "description": "Autofill hint. Group: TextInput."
      },
      {
        "name": "motion",
        "values": "{ [property]: Tween | Sequence }",
        "description": "Opacity, rotation, scale, and translation channels. Group: Events and motion."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.TextInput",
    "description": "Creates a controlled single-line text field with native keyboard hints, autofill metadata, validation semantics, and composition-safe input delivery. The displayed value always comes from application state.",
    "props": [
      "input",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-form-modal",
      "title": "validate a form and confirm in a modal",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.TextInput inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-19",
    "nextPageId": "ui/item-21",
    "relatedPageIds": [
      "ui/item-7"
    ]
  },
  {
    "id": "ui/item-21",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "List items only.",
    "accessibility": "Creates a real list; provide label when a nearby heading does not make the list purpose clear.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.List when sibling items form one meaningful sequence or set. Use Column for unrelated blocks and Table for values with row-and-column relationships.",
    "code": "UI.List {\n    id = \"checklist\",\n    label = \"Release checklist\",\n    UI.ListItem { id = \"checklist/check\", text = \"Run luastra check\" },\n    UI.ListItem { id = \"checklist/test\", text = \"Run luastra test\" },\n}",
    "signature": "UI.List(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "children",
        "values": "UI.ListItem[]",
        "description": "List items only."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.List",
    "description": "Creates an ordered or unordered semantic collection whose direct children are ListItem nodes. It preserves collection boundaries and item count for assistive technology.",
    "props": [
      "label",
      "layout",
      "semantic"
    ],
    "previousPageId": "ui/item-20",
    "nextPageId": "ui/item-22",
    "relatedPageIds": [
      "ui/item-13",
      "ui/item-14",
      "ui/item-15"
    ]
  },
  {
    "id": "ui/item-22",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "Must be a direct child of UI.List to preserve correct list semantics.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.ListItem only as a direct child of UI.List, once per conceptual item. Put buttons, links, and descriptive content inside the item when they belong to that entry.",
    "code": "UI.ListItem {\n    id = \"steps/build\",\n    text = \"Build the web target\",\n}",
    "signature": "UI.ListItem(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "text",
        "values": "string?",
        "description": "Short text; children may be supplied instead."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.ListItem",
    "description": "Defines one semantic member of a UI.List while allowing structured content inside the item. The host keeps the item associated with its parent collection.",
    "props": [
      "text",
      "layout",
      "semantic"
    ],
    "previousPageId": "ui/item-21",
    "nextPageId": "ui/item-23",
    "relatedPageIds": [
      "ui/item-13",
      "ui/item-14",
      "ui/item-15"
    ]
  },
  {
    "id": "ui/item-23",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Heading, content, and close action.",
    "accessibility": "The host traps focus inside the open dialog, Escape invokes onDismiss, and closing restores focus to the trigger.",
    "commonMistakes": [
      "Removing the close button and relying only on Escape.",
      "Rendering interactive content outside and above an open modal."
    ],
    "callable": true,
    "useWhen": "Use UI.Modal for short blocking decisions or focused information that must be handled before returning to the page. Use an ordinary routed screen for long, independently navigable workflows.",
    "code": "UI.Modal {\n    id = \"help/modal\",\n    open = helpOpen,\n    label = \"Help\",\n    onDismiss = \"help.close\",\n    UI.Text { id = \"help/title\", text = \"Help\", variant = \"heading\" },\n    UI.Button { id = \"help/close\", text = \"Close\", onTap = \"help.close\" },\n}",
    "signature": "UI.Modal(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique dialog ID."
      },
      {
        "name": "open",
        "values": "boolean, required",
        "description": "Shows or hides the modal."
      },
      {
        "name": "label",
        "values": "string, required",
        "description": "Accessible dialog name."
      },
      {
        "name": "children",
        "values": "UI.Node[]",
        "description": "Heading, content, and close action."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      },
      {
        "name": "onDismiss",
        "values": "action string",
        "description": "Modal dismissal action. Group: Events and motion."
      },
      {
        "name": "motion",
        "values": "{ [property]: Tween | Sequence }",
        "description": "Opacity, rotation, scale, and translation channels. Group: Events and motion."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Modal",
    "description": "Creates an accessible dialog above the current screen, moves focus into it, traps navigation within its boundary, and restores focus after dismissal. onDismiss connects host dismissal gestures to application state.",
    "props": [
      "modal",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-form-modal",
      "title": "validate a form and confirm in a modal",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.Modal inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-22",
    "nextPageId": "ui/item-24",
    "relatedPageIds": [
      "ui/item-8",
      "ui/item-9",
      "ui/item-39",
      "ui/item-38"
    ]
  },
  {
    "id": "ui/item-24",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Development candidate: experimental Constellation Orbit API. Verify it against the selected candidate SDK before depending on it.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Orbit experience content with at least one constellation.",
    "accessibility": "The host preserves one semantic model across spatial and list presentations and isolates every inactive constellation from interaction.",
    "commonMistakes": [
      "Adding application-owned absolute coordinates.",
      "Assuming spatial mode is guaranteed when bounds require the list fallback."
    ],
    "callable": true,
    "useWhen": "Use UI.Orbit when an application benefits from spatial discovery while still requiring a complete list fallback, stable navigation state, keyboard access, and identical meaning across host presentations.",
    "code": "UI.Orbit {\n    id = \"map\",\n    label = \"Application map\",\n    UI.Constellation {\n        id = \"map/root\",\n        UI.OrbitCenter { id = \"map/root/center\", title = \"My app\" },\n        UI.OrbitNode { id = \"map/start\", title = \"Start\", onTap = \"start\" },\n    },\n}",
    "signature": "UI.Orbit(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique Orbit ID."
      },
      {
        "name": "presentation",
        "values": "auto | spatial | list?",
        "description": "Preferred presentation; unsafe spatial geometry still falls back to list."
      },
      {
        "name": "orbitTheme",
        "values": "built-in theme ID?",
        "description": "One of the curated Orbit themes."
      },
      {
        "name": "orbitMotion",
        "values": "system | off?",
        "description": "Orbit-owned motion preference."
      },
      {
        "name": "maxVisible",
        "values": "integer 4…32?",
        "description": "Density bound before list fallback."
      },
      {
        "name": "children",
        "values": "OrbitPath | OrbitSearch | Constellation | FocusSurface[]",
        "description": "Orbit experience content with at least one constellation."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Orbit",
    "description": "Creates the bounded root for Constellation Orbit navigation and delegates geometry, semantic zoom, focus movement, inactive-depth isolation, themes, and reduced-motion behavior to the host.",
    "props": [
      "layout",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-orbit",
      "title": "build a small Constellation Orbit",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.Orbit inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-23",
    "nextPageId": "ui/item-25",
    "relatedPageIds": [
      "ui/item-26",
      "ui/item-27",
      "ui/item-28",
      "ui/item-29"
    ]
  },
  {
    "id": "ui/item-25",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Development candidate: experimental Constellation Orbit API. Verify it against the selected candidate SDK before depending on it.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Return controls, current depth, and stable Orbit preferences.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.OrbitPath for ancestor return controls, the current depth label, and Orbit-wide preferences that must remain available without being duplicated inside every constellation.",
    "code": "UI.OrbitPath {\n    id = \"map/path\",\n    label = \"Orbit path\",\n    UI.OrbitReturn { id = \"map/back\", text = \"Back\", onTap = \"back\" },\n    UI.Text { id = \"map/current\", text = \"Build\" },\n}",
    "signature": "UI.OrbitPath(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique path ID."
      },
      {
        "name": "children",
        "values": "Button | Text[]",
        "description": "Return controls, current depth, and stable Orbit preferences."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.OrbitPath",
    "description": "Creates the stable navigation and preference rail above an Orbit, containing only semantic buttons and text while the active constellation and Focus Surface change beneath it.",
    "props": [
      "layout",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-orbit",
      "title": "build a small Constellation Orbit",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.OrbitPath inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-24",
    "nextPageId": "ui/item-26",
    "relatedPageIds": [
      "ui/item-27",
      "ui/item-28",
      "ui/item-29"
    ]
  },
  {
    "id": "ui/item-26",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Development candidate: experimental Constellation Orbit API. Verify it against the selected candidate SDK before depending on it.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "The generated result summary is a live status; Escape clears a non-empty query before it performs Orbit return navigation.",
    "commonMistakes": [
      "Filtering only the visual layer while leaving hidden nodes interactive.",
      "Putting the query into host-only state instead of Luau state."
    ],
    "callable": true,
    "useWhen": "Use UI.OrbitSearch when the active constellation can become difficult to scan. Keep the query in Luau state, preserve stable node IDs, and hide non-matching nodes instead of creating a parallel result model.",
    "code": "UI.OrbitSearch {\n    id = \"map/search\",\n    query = query,\n    resultCount = resultCount,\n    totalCount = #nodes,\n    onInput = \"search\",\n}",
    "signature": "UI.OrbitSearch(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique search ID."
      },
      {
        "name": "query",
        "values": "string ≤ 160 bytes?",
        "description": "Controlled local query."
      },
      {
        "name": "resultCount",
        "values": "non-negative integer, required",
        "description": "Visible matching node count."
      },
      {
        "name": "totalCount",
        "values": "integer ≥ resultCount, required",
        "description": "Total node count before filtering."
      },
      {
        "name": "label",
        "values": "string?",
        "description": "Accessible input name."
      },
      {
        "name": "placeholder",
        "values": "string?",
        "description": "Visible empty-query hint."
      },
      {
        "name": "onInput",
        "values": "action string, required",
        "description": "Committed query action."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.OrbitSearch",
    "description": "Creates a controlled local-constellation search input plus a live result summary. The application owns filtering and supplies both the current result count and total count.",
    "props": [
      "semantic"
    ],
    "previousPageId": "ui/item-25",
    "nextPageId": "ui/item-27",
    "relatedPageIds": [
      "ui/item-24",
      "ui/item-28",
      "ui/item-29"
    ]
  },
  {
    "id": "ui/item-27",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Development candidate: experimental Constellation Orbit API. Verify it against the selected candidate SDK before depending on it.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Complete content of this navigation depth.",
    "accessibility": "Only the active layer remains interactive and exposed to assistive technology; source order remains the list and reading order.",
    "commonMistakes": [
      "Rendering more than one center.",
      "Referencing a related node outside the same constellation."
    ],
    "callable": true,
    "useWhen": "Use UI.Constellation for each root or nested content space in an Orbit. Keep inactive neighbours as behind or ahead only when they are needed for bounded transitions.",
    "code": "UI.Constellation {\n    id = \"map/root\",\n    layerState = \"active\",\n    UI.OrbitCenter { id = \"map/root/center\", title = \"My app\" },\n    UI.OrbitNode { id = \"map/start\", title = \"Start\", onTap = \"start\" },\n}",
    "signature": "UI.Constellation(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique constellation ID."
      },
      {
        "name": "layerState",
        "values": "active | behind | ahead?",
        "description": "Current transition and accessibility state."
      },
      {
        "name": "depth",
        "values": "integer 0…32?",
        "description": "Semantic navigation depth."
      },
      {
        "name": "children",
        "values": "one OrbitCenter + 1…64 OrbitNode or OrbitCluster",
        "description": "Complete content of this navigation depth."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Constellation",
    "description": "Creates one Orbit navigation depth with exactly one semantic center and between one and sixty-four nodes or clusters. The host owns spatial placement and list fallback.",
    "props": [
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-orbit",
      "title": "build a small Constellation Orbit",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.Constellation inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-26",
    "nextPageId": "ui/item-28",
    "relatedPageIds": [
      "ui/item-24",
      "ui/item-25",
      "ui/item-29"
    ]
  },
  {
    "id": "ui/item-28",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Development candidate: experimental Constellation Orbit API. Verify it against the selected candidate SDK before depending on it.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.OrbitCenter exactly once in each UI.Constellation to name the current semantic space. Do not use it as an action or encode application coordinates in its content.",
    "code": "UI.OrbitCenter {\n    id = \"map/root/center\",\n    title = \"My app\",\n    description = \"Choose a direction.\",\n}",
    "signature": "UI.OrbitCenter(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique center ID."
      },
      {
        "name": "title",
        "values": "string 1…160 bytes, required",
        "description": "Current constellation identity."
      },
      {
        "name": "description",
        "values": "string ≤ 320 bytes?",
        "description": "Optional supporting summary."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.OrbitCenter",
    "description": "Creates the non-interactive identity at the center of a constellation from a required title and optional description. The host preserves it in both spatial and list presentations.",
    "props": [
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-orbit",
      "title": "build a small Constellation Orbit",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.OrbitCenter inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-27",
    "nextPageId": "ui/item-29",
    "relatedPageIds": [
      "ui/item-24",
      "ui/item-25",
      "ui/item-26"
    ]
  },
  {
    "id": "ui/item-29",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Development candidate: experimental Constellation Orbit API. Verify it against the selected candidate SDK before depending on it.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "The complete title, description, status, relationships, and native button semantics remain accessible at every semantic zoom tier.",
    "commonMistakes": [
      "Using a single letter instead of a bounded signalIcon.",
      "Encoding essential status only through statusTone color."
    ],
    "callable": true,
    "useWhen": "Use UI.OrbitNode for every individually actionable concept in a constellation. Supply stable meaning and state; let the host select coordinates and the visible Signal, Identity, or Preview tier.",
    "code": "UI.OrbitNode {\n    id = \"map/build\",\n    title = \"Build\",\n    description = \"Compose the interface.\",\n    nodeKind = \"constellation\",\n    signalIcon = \"spark\",\n    priority = 1,\n    onTap = \"open-build\",\n}",
    "signature": "UI.OrbitNode(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique node ID."
      },
      {
        "name": "title",
        "values": "string 1…160 bytes, required",
        "description": "Stable node identity."
      },
      {
        "name": "description",
        "values": "string ≤ 320 bytes?",
        "description": "Supporting Preview content."
      },
      {
        "name": "nodeKind",
        "values": "constellation | leaf | action?",
        "description": "Semantic activation kind."
      },
      {
        "name": "priority",
        "values": "integer 1…3?",
        "description": "Detail and placement importance; one is highest."
      },
      {
        "name": "ring",
        "values": "integer 1…3?",
        "description": "Optional authoritative ring hint."
      },
      {
        "name": "relatedTo",
        "values": "component ID[] 1…8?",
        "description": "Neutral same-constellation relationships."
      },
      {
        "name": "signalIcon",
        "values": "bounded icon name?",
        "description": "Host-rendered compact Signal icon."
      },
      {
        "name": "status",
        "values": "string 1…80 bytes?",
        "description": "Human-readable state."
      },
      {
        "name": "statusTone",
        "values": "neutral | active | success | warning | error?",
        "description": "Redundant visual state treatment."
      },
      {
        "name": "selected",
        "values": "boolean?",
        "description": "Current leaf selection."
      },
      {
        "name": "onTap",
        "values": "action string, required",
        "description": "Semantic activation action."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.OrbitNode",
    "description": "Creates an interactive leaf, constellation destination, or bounded action with priority, optional ring hint, relationships, compact icon, status, selection, busy, and disabled semantics.",
    "props": [
      "action",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-orbit",
      "title": "build a small Constellation Orbit",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.OrbitNode inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-28",
    "nextPageId": "ui/item-30",
    "relatedPageIds": [
      "ui/item-24",
      "ui/item-25",
      "ui/item-26",
      "ui/item-27"
    ]
  },
  {
    "id": "ui/item-30",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Development candidate: experimental Constellation Orbit API. Verify it against the selected candidate SDK before depending on it.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "The group title and item count form one accessible button name; cluster membership and navigation remain application-authored.",
    "commonMistakes": [
      "Using a cluster as visual decoration without a semantic group.",
      "Supplying a count that does not match the authored destination."
    ],
    "callable": true,
    "useWhen": "Use UI.OrbitCluster when several nodes have a real domain grouping and a local destination constellation. Do not group items only because their current screen coordinates happen to be close.",
    "code": "UI.OrbitCluster {\n    id = \"map/examples\",\n    title = \"Examples\",\n    count = 48,\n    signalIcon = \"grid\",\n    onTap = \"open-examples\",\n}",
    "signature": "UI.OrbitCluster(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique cluster ID."
      },
      {
        "name": "title",
        "values": "string 1…160 bytes, required",
        "description": "Stable group identity."
      },
      {
        "name": "count",
        "values": "integer 1…9999, required",
        "description": "Authored group item count."
      },
      {
        "name": "priority",
        "values": "integer 1…3?",
        "description": "Detail and placement importance."
      },
      {
        "name": "ring",
        "values": "integer 1…3?",
        "description": "Optional authoritative ring hint."
      },
      {
        "name": "relatedTo",
        "values": "component ID[] 1…8?",
        "description": "Neutral same-constellation relationships."
      },
      {
        "name": "signalIcon",
        "values": "bounded icon name?",
        "description": "Host-rendered compact Signal icon."
      },
      {
        "name": "status",
        "values": "string 1…80 bytes?",
        "description": "Human-readable state."
      },
      {
        "name": "statusTone",
        "values": "neutral | active | success | warning | error?",
        "description": "Redundant visual state treatment."
      },
      {
        "name": "onTap",
        "values": "action string, required",
        "description": "Opens the authored local constellation."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.OrbitCluster",
    "description": "Creates one semantic entry for an application-authored group and exposes its bounded item count. It participates in relationships, priority placement, semantic zoom, and list fallback as one button.",
    "props": [
      "action",
      "semantic"
    ],
    "previousPageId": "ui/item-29",
    "nextPageId": "ui/item-31",
    "relatedPageIds": [
      "ui/item-32",
      "ui/item-33",
      "ui/item-24"
    ]
  },
  {
    "id": "ui/item-31",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Development candidate: experimental Constellation Orbit API. Verify it against the selected candidate SDK before depending on it.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "FocusHeader followed by full leaf content.",
    "accessibility": "The host names the dialog from its visible heading, traps focus, supports Escape, and restores focus to the originating node.",
    "commonMistakes": [
      "Opening it outside navigation state.",
      "Removing the explicit return control and relying only on Escape."
    ],
    "callable": true,
    "useWhen": "Use UI.FocusSurface for focused leaf content that belongs to the current Orbit route. Keep open state and dismissal in Luau navigation so Back, direct links, and visible controls reach the same outcome.",
    "code": "UI.FocusSurface {\n    id = \"map/focus\",\n    label = \"Build details\",\n    open = focused,\n    onDismiss = \"close-focus\",\n    UI.FocusHeader {\n        id = \"map/focus/header\",\n        UI.Text { id = \"map/focus/title\", text = \"Build\", variant = \"heading\" },\n        UI.Button { id = \"map/focus/close\", text = \"Back\", onTap = \"close-focus\" },\n    },\n}",
    "signature": "UI.FocusSurface(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique focus dialog ID."
      },
      {
        "name": "open",
        "values": "boolean?",
        "description": "Whether the Focus Surface is visible."
      },
      {
        "name": "label",
        "values": "string, required",
        "description": "Accessible dialog name."
      },
      {
        "name": "onDismiss",
        "values": "action string, required",
        "description": "Dismissal action shared by host gestures and application controls."
      },
      {
        "name": "children",
        "values": "UI.Node[]",
        "description": "FocusHeader followed by full leaf content."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.FocusSurface",
    "description": "Creates the full-detail dialog opened from an Orbit leaf while retaining deterministic focus restoration, host-owned transition geometry, bounded scrolling, and reduced-motion behavior.",
    "props": [
      "modal",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-orbit",
      "title": "build a small Constellation Orbit",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.FocusSurface inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-30",
    "nextPageId": "ui/item-32",
    "relatedPageIds": [
      "ui/item-29",
      "ui/item-33",
      "ui/item-8"
    ]
  },
  {
    "id": "ui/item-32",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Development candidate: experimental Constellation Orbit API. Verify it against the selected candidate SDK before depending on it.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Sticky visible identity and return action.",
    "accessibility": "The heading precedes the available return button in reading and focus order even while the header remains visually sticky.",
    "commonMistakes": [
      "Using a non-heading Text for the title.",
      "Disabling or hiding the required return button."
    ],
    "callable": true,
    "useWhen": "Use UI.FocusHeader at the beginning of every scrollable Focus Surface so the current leaf title and explicit return action remain visible without changing dialog focus order.",
    "code": "UI.FocusHeader {\n    id = \"map/focus/header\",\n    UI.Text { id = \"map/focus/title\", text = \"Build\", variant = \"heading\" },\n    UI.Button { id = \"map/focus/close\", text = \"Back\", onTap = \"close-focus\" },\n}",
    "signature": "UI.FocusHeader(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique header ID."
      },
      {
        "name": "children",
        "values": "one heading Text + one available Button",
        "description": "Sticky visible identity and return action."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.FocusHeader",
    "description": "Creates the sticky identity and return rail inside a Focus Surface. It requires exactly one visible heading Text and one available Button in a stable reading order.",
    "props": [
      "layout",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-orbit",
      "title": "build a small Constellation Orbit",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.FocusHeader inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-31",
    "nextPageId": "ui/item-33",
    "relatedPageIds": [
      "ui/item-29",
      "ui/item-30",
      "ui/item-8"
    ]
  },
  {
    "id": "ui/item-33",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Development candidate: experimental Constellation Orbit API. Verify it against the selected candidate SDK before depending on it.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "Uses native button semantics and the same Luau action that the host invokes for an eligible Escape return.",
    "commonMistakes": [
      "Keeping it enabled at the root without a return destination.",
      "Using a different action from system or keyboard Back."
    ],
    "callable": true,
    "useWhen": "Use UI.OrbitReturn for returning from a nested constellation. Disable the root control when no ancestor exists, and do not add a second hidden Back implementation.",
    "code": "UI.OrbitReturn {\n    id = \"map/back\",\n    text = \"Back\",\n    onTap = \"back\",\n    disabled = atRoot,\n}",
    "signature": "UI.OrbitReturn(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique return-control ID."
      },
      {
        "name": "text",
        "values": "string, required",
        "description": "Visible ancestor label."
      },
      {
        "name": "onTap",
        "values": "action string, required",
        "description": "Canonical return action."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.OrbitReturn",
    "description": "Creates the canonical semantic return button used by an Orbit path. The host can route Escape through the same declared action, preserving one application-owned navigation outcome.",
    "props": [
      "action",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-orbit",
      "title": "build a small Constellation Orbit",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.OrbitReturn inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-32",
    "nextPageId": "ui/item-34",
    "relatedPageIds": [
      "ui/item-29",
      "ui/item-30",
      "ui/item-31"
    ]
  },
  {
    "id": "ui/item-34",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Vertical stack; semantically equivalent to Column.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.Stack for straightforward vertical groups where the semantic name improves readability. Use UI.Column when you want the canonical general-purpose vertical container or need examples shared across all hosts.",
    "code": "UI.Stack {\n    id = \"article/frame\",\n    width = \"wide\",\n    gap = \"lg\",\n    UI.Text { id = \"article/title\", text = \"Guide\", variant = \"title\" },\n    UI.Text { id = \"article/body\", text = \"Readable content\" },\n}",
    "signature": "UI.Stack(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "children",
        "values": "UI.Node[]",
        "description": "Vertical stack; semantically equivalent to Column."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Stack",
    "description": "Offers a concise vertical composition primitive with the same layout direction as Column and stack-specific host styling. Children remain in normal flow and do not overlap.",
    "props": [
      "layout",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-form-modal",
      "title": "validate a form and confirm in a modal",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.Stack inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-33",
    "nextPageId": "ui/item-35",
    "relatedPageIds": [
      "ui/item-5",
      "ui/item-6",
      "ui/item-36"
    ]
  },
  {
    "id": "ui/item-35",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Cards or other repeated grid items.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.Grid for galleries, dashboards, feature cards, and repeated items of comparable importance. Use Table for relational data and Row when content must remain one-dimensional.",
    "code": "UI.Grid {\n    id = \"catalog/grid\",\n    width = \"full\",\n    columns = \"adaptive\",\n    gap = \"md\",\n    UI.Card { id = \"catalog/one\", UI.Text { id = \"catalog/one/title\", text = \"One\" } },\n    UI.Card { id = \"catalog/two\", UI.Text { id = \"catalog/two/title\", text = \"Two\" } },\n}",
    "signature": "UI.Grid(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "children",
        "values": "UI.Node[]",
        "description": "Cards or other repeated grid items."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "columns",
        "values": "adaptive | two | three",
        "description": "Grid columns. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Grid",
    "description": "Creates a responsive multi-column collection using two, three, or adaptive columns while retaining source order. Items reflow as available width changes instead of requiring manual breakpoint calculations.",
    "props": [
      "layout",
      "columns",
      "semantic"
    ],
    "previousPageId": "ui/item-34",
    "nextPageId": "ui/item-36",
    "relatedPageIds": [
      "ui/item-5",
      "ui/item-6",
      "ui/item-37"
    ]
  },
  {
    "id": "ui/item-36",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Content of the scrollable region.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.Scroll when a specific region—not the whole document—must scroll, such as filter chips, long panels, or media strips. Avoid nested scroll regions unless the interaction genuinely needs independent axes.",
    "code": "UI.Scroll {\n    id = \"filters/scroll\",\n    width = \"full\",\n    scroll = \"horizontal\",\n    UI.Row {\n        id = \"filters/items\",\n        flow = \"nowrap\",\n        UI.Button { id = \"filters/all\", text = \"All\", onTap = \"filter-all\" },\n        UI.Button { id = \"filters/new\", text = \"New\", onTap = \"filter-new\" },\n    },\n}",
    "signature": "UI.Scroll(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "children",
        "values": "UI.Node[]",
        "description": "Content of the scrollable region."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "scroll",
        "values": "vertical | horizontal",
        "description": "Scroll axis. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Scroll",
    "description": "Creates a bounded vertical or horizontal scrolling region and preserves its children as one navigable group. It prevents oversized content from forcing the surrounding screen beyond its intended bounds while allowing wheel input on the unused axis to continue through the surrounding page.",
    "props": [
      "layout",
      "scroll",
      "semantic"
    ],
    "previousPageId": "ui/item-35",
    "nextPageId": "ui/item-37",
    "relatedPageIds": [
      "ui/item-5",
      "ui/item-6",
      "ui/item-34"
    ]
  },
  {
    "id": "ui/item-37",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Content of one visual card.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.Card to visually group one concept such as a result, article preview, or setting. Use FlipCard for two-sided reveals and plain Column when no surface treatment is needed.",
    "code": "UI.Card {\n    id = \"result/card\",\n    width = \"full\",\n    surface = \"elevated\",\n    padding = \"lg\",\n    gap = \"sm\",\n    UI.Text { id = \"result/title\", text = \"Result\", variant = \"heading\" },\n    UI.Text { id = \"result/value\", text = \"42\" },\n}",
    "signature": "UI.Card(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "children",
        "values": "UI.Node[]",
        "description": "Content of one visual card."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      },
      {
        "name": "motion",
        "values": "{ [property]: Tween | Sequence }",
        "description": "Opacity, rotation, scale, and translation channels. Group: Events and motion."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Card",
    "description": "Creates a themed surface for grouping related content, with consistent padding, border, elevation, inherited colors, and optional motion. It is a layout container rather than a playing-card animation primitive.",
    "props": [
      "layout",
      "surface",
      "motion",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-form-modal",
      "title": "validate a form and confirm in a modal",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.Card inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-36",
    "nextPageId": "ui/item-38",
    "relatedPageIds": [
      "ui/item-18",
      "ui/item-16",
      "ui/item-17",
      "ui/item-19"
    ]
  },
  {
    "id": "ui/item-38",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Related elements of one form field.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.Field around each form control that needs visible guidance or validation. Keep the input and its related error inside the same field and connect errorId where applicable.",
    "code": "UI.Field {\n    id = \"form/email-field\",\n    label = \"Email field\",\n    gap = \"xs\",\n    UI.Text { id = \"form/email-label\", text = \"Email\" },\n    UI.TextInput { id = \"form/email\", label = \"Email\", value = email, onInput = \"email-change\" },\n}",
    "signature": "UI.Field(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique field-group ID."
      },
      {
        "name": "children",
        "values": "label + input + hint/error",
        "description": "Related elements of one form field."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Field",
    "description": "Groups a form label, input, hint, and validation message into one semantic and visual unit. Shared spacing and inherited state keep the relationship understandable without positioning each element manually.",
    "props": [
      "layout",
      "label",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-form-modal",
      "title": "validate a form and confirm in a modal",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.Field inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-37",
    "nextPageId": "ui/item-39",
    "relatedPageIds": [
      "ui/item-8",
      "ui/item-9",
      "ui/item-23"
    ]
  },
  {
    "id": "ui/item-39",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "beforeYouUse": "Add luastra/ui to this module's dependencies in luastra.json, then import it with require(\"luastra/ui\"). The project must declare the ui.render capability. Application.render must return one UI.Screen root; place this node inside that tree rather than invoking it for a hidden side effect.",
    "lifecycle": "The constructor validates its fields immediately and returns a UI.Node. After Application.render returns, the host reconciles that node by stable id with the current semantic DOM-based interface. Current desktop and mobile hosts package the same web artifact; native adapters are used at capability boundaries.",
    "expectedOutcome": "A validated declarative node appears after it is returned as part of the current render tree.",
    "failureGuidance": "Invalid fields, duplicate IDs, unsupported child combinations, or a missing ui.render capability fail during check, render-tree validation, or host startup.",
    "availability": "Current development candidate API. The public installer still selects the immutable 0.1.0-alpha release until the next release is published.",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "Group of primary and secondary actions.",
    "accessibility": "A stable id, logical render-tree order, and visible labels preserve predictable keyboard and screen-reader navigation.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.Actions for form submission controls, dialog choices, or page-level action groups. Use Row for horizontal content that is not specifically a set of user actions.",
    "code": "UI.Actions {\n    id = \"dialog/actions\",\n    gap = \"sm\",\n    UI.Button { id = \"dialog/cancel\", text = \"Cancel\", appearance = \"secondary\", onTap = \"cancel\" },\n    UI.Button { id = \"dialog/confirm\", text = \"Confirm\", onTap = \"confirm\" },\n}",
    "signature": "UI.Actions(input: any): Node",
    "parameters": [
      {
        "name": "id",
        "values": "lowercase path, required",
        "description": "Unique ID."
      },
      {
        "name": "children",
        "values": "Button | Link[]",
        "description": "Group of primary and secondary actions."
      },
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children. Group: Layout and surfaces."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding. Group: Layout and surfaces."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing. Group: Layout and surfaces."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation. Group: Layout and surfaces."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum. Group: Layout and surfaces."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment. Group: Layout and surfaces."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping. Group: Layout and surfaces."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation. Group: Layout and surfaces."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens. Group: Layout and surfaces."
      },
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone. Group: State and semantics."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance. Group: State and semantics."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics. Group: State and semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role. Group: State and semantics."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name. Group: State and semantics."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state. Group: State and semantics."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state. Group: State and semantics."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state. Group: State and semantics."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state. Group: State and semantics."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert. Group: State and semantics."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground. Group: Text and local colors."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background. Group: Text and local colors."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors. Group: Text and local colors."
      }
    ],
    "returns": "Node — a validated declarative UI node that becomes part of the next host-neutral render tree.",
    "name": "UI.Actions",
    "description": "Arranges a related set of buttons or links as a wrapping action region with consistent spacing and inherited alignment. It communicates that the controls complete or advance the same local task.",
    "props": [
      "layout",
      "semantic"
    ],
    "completeRecipe": {
      "sectionId": "recipe-navigation",
      "title": "add typed navigation",
      "evidence": "authored-files",
      "description": "This checked recipe uses UI.Actions inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "ui/item-38",
    "nextPageId": null,
    "relatedPageIds": [
      "ui/item-8",
      "ui/item-9",
      "ui/item-23"
    ]
  },
  {
    "id": "ui-properties/table-1",
    "kind": "parameter-group",
    "sectionId": "ui-properties",
    "sectionTitle": "UI parameters",
    "module": "luastra/ui",
    "name": "Layout and surfaces",
    "signature": "ui-properties-layout",
    "description": "Shared parameters in the “Layout and surfaces” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "gap",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Space between children."
      },
      {
        "name": "padding",
        "values": "none | xs | sm | md | lg | xl | responsive",
        "description": "All-side inner spacing; responsive is supported only by padding."
      },
      {
        "name": "margin",
        "values": "none | xs | sm | md | lg | xl",
        "description": "All-side outer spacing."
      },
      {
        "name": "paddingX / paddingY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific inner spacing."
      },
      {
        "name": "paddingTop / paddingBottom / paddingStart / paddingEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific inner spacing."
      },
      {
        "name": "marginX / marginY",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Axis-specific outer spacing."
      },
      {
        "name": "marginTop / marginBottom / marginStart / marginEnd",
        "values": "none | xs | sm | md | lg | xl",
        "description": "Logical side-specific outer spacing."
      },
      {
        "name": "surface",
        "values": "plain | card | elevated | accent",
        "description": "Background, border, and elevation."
      },
      {
        "name": "width",
        "values": "full | content | wide",
        "description": "Available width, 720 px maximum, or 1180 px maximum."
      },
      {
        "name": "align",
        "values": "start | center | end | stretch | between",
        "description": "Cross-axis alignment."
      },
      {
        "name": "justify",
        "values": "start | center | end | between",
        "description": "Main-axis alignment."
      },
      {
        "name": "flow",
        "values": "wrap | nowrap",
        "description": "Flex wrapping."
      },
      {
        "name": "columns",
        "values": "adaptive | two | three",
        "description": "Grid columns."
      },
      {
        "name": "scroll",
        "values": "vertical | horizontal",
        "description": "Scroll axis."
      },
      {
        "name": "responsive",
        "values": "boolean",
        "description": "Narrow-screen adaptation."
      },
      {
        "name": "className",
        "values": "safe string ≤ 256 bytes",
        "description": "Additional admitted class tokens."
      }
    ],
    "previousPageId": null,
    "nextPageId": "ui-properties/table-2",
    "relatedPageIds": []
  },
  {
    "id": "ui-properties/table-2",
    "kind": "parameter-group",
    "sectionId": "ui-properties",
    "sectionTitle": "UI parameters",
    "module": "luastra/ui",
    "name": "State and semantics",
    "signature": "ui-properties-semantics",
    "description": "Shared parameters in the “State and semantics” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "tone",
        "values": "muted | error | success",
        "description": "Semantic text tone."
      },
      {
        "name": "appearance",
        "values": "primary | secondary | danger | ghost",
        "description": "Action appearance."
      },
      {
        "name": "variant",
        "values": "body | subheading | heading | title",
        "description": "Body text or h3, h2, and h1 heading semantics."
      },
      {
        "name": "role",
        "values": "alert | group | status",
        "description": "Supported ARIA role."
      },
      {
        "name": "label",
        "values": "string",
        "description": "Accessible name."
      },
      {
        "name": "hidden",
        "values": "boolean",
        "description": "Visibility state."
      },
      {
        "name": "disabled",
        "values": "boolean",
        "description": "Disabled state."
      },
      {
        "name": "busy",
        "values": "boolean",
        "description": "aria-busy state."
      },
      {
        "name": "required",
        "values": "boolean",
        "description": "Required input state."
      },
      {
        "name": "errorId",
        "values": "component id",
        "description": "Associates a visible role=alert."
      }
    ],
    "previousPageId": "ui-properties/table-1",
    "nextPageId": "ui-properties/table-3",
    "relatedPageIds": []
  },
  {
    "id": "ui-properties/table-3",
    "kind": "parameter-group",
    "sectionId": "ui-properties",
    "sectionTitle": "UI parameters",
    "module": "luastra/ui",
    "name": "Text and local colors",
    "signature": "ui-properties-text-style",
    "description": "Shared parameters in the “Text and local colors” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "textAlign",
        "values": "start | center | end",
        "description": "Aligns lines within Text width."
      },
      {
        "name": "textColor",
        "values": "token | #RRGGBB",
        "description": "Local or inherited foreground."
      },
      {
        "name": "backgroundColor",
        "values": "token | #RRGGBB",
        "description": "Component-box background."
      },
      {
        "name": "Color tokens",
        "values": "accent | danger | muted | surface | success | text | transparent | warning",
        "description": "Current Screen theme colors."
      }
    ],
    "previousPageId": "ui-properties/table-2",
    "nextPageId": "ui-properties/table-4",
    "relatedPageIds": []
  },
  {
    "id": "ui-properties/table-4",
    "kind": "parameter-group",
    "sectionId": "ui-properties",
    "sectionTitle": "UI parameters",
    "module": "luastra/ui",
    "name": "UI.Screen theme",
    "signature": "ui-properties-theme",
    "description": "Shared parameters in the “UI.Screen theme” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "theme",
        "values": "UI.Theme",
        "description": "Reusable optional colors; direct fields win."
      },
      {
        "name": "backgroundColor",
        "values": "#RRGGBB",
        "description": "background theme color."
      },
      {
        "name": "textColor",
        "values": "#RRGGBB",
        "description": "text theme color."
      },
      {
        "name": "accentColor",
        "values": "#RRGGBB",
        "description": "accent theme color."
      },
      {
        "name": "dangerColor",
        "values": "#RRGGBB",
        "description": "danger theme color."
      },
      {
        "name": "mutedColor",
        "values": "#RRGGBB",
        "description": "muted theme color."
      },
      {
        "name": "surfaceColor",
        "values": "#RRGGBB",
        "description": "surface theme color."
      },
      {
        "name": "successColor",
        "values": "#RRGGBB",
        "description": "success theme color."
      },
      {
        "name": "warningColor",
        "values": "#RRGGBB",
        "description": "warning theme color."
      }
    ],
    "previousPageId": "ui-properties/table-3",
    "nextPageId": "ui-properties/table-5",
    "relatedPageIds": []
  },
  {
    "id": "ui-properties/table-5",
    "kind": "parameter-group",
    "sectionId": "ui-properties",
    "sectionTitle": "UI parameters",
    "module": "luastra/ui",
    "name": "TextInput",
    "signature": "ui-properties-input",
    "description": "Shared parameters in the “TextInput” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "inputType",
        "values": "text | email | password",
        "description": "Native field type."
      },
      {
        "name": "inputMode",
        "values": "decimal | email | numeric | search | tel | text | url",
        "description": "Preferred mobile keyboard."
      },
      {
        "name": "enterKeyHint",
        "values": "done | enter | go | next | previous | search | send",
        "description": "Enter-key behavior."
      },
      {
        "name": "autoComplete",
        "values": "supported token",
        "description": "Autofill hint."
      },
      {
        "name": "placeholder",
        "values": "string",
        "description": "Short hint shown while the controlled value is empty."
      },
      {
        "name": "value",
        "values": "string",
        "description": "Controlled value."
      },
      {
        "name": "onInput",
        "values": "action string",
        "description": "Committed IME update action."
      }
    ],
    "previousPageId": "ui-properties/table-4",
    "nextPageId": "ui-properties/table-6",
    "relatedPageIds": []
  },
  {
    "id": "ui-properties/table-6",
    "kind": "parameter-group",
    "sectionId": "ui-properties",
    "sectionTitle": "UI parameters",
    "module": "luastra/ui",
    "name": "Events and motion",
    "signature": "ui-properties-events",
    "description": "Shared parameters in the “Events and motion” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "onTap",
        "values": "action string",
        "description": "Activation action."
      },
      {
        "name": "onInput",
        "values": "action string",
        "description": "Input action."
      },
      {
        "name": "onDismiss",
        "values": "action string",
        "description": "Modal dismissal action."
      },
      {
        "name": "motion",
        "values": "{ [property]: Tween | Sequence }",
        "description": "Opacity, rotation, scale, and translation channels."
      }
    ],
    "previousPageId": "ui-properties/table-5",
    "nextPageId": "ui-properties/table-7",
    "relatedPageIds": []
  },
  {
    "id": "ui-properties/table-7",
    "kind": "parameter-group",
    "sectionId": "ui-properties",
    "sectionTitle": "UI parameters",
    "module": "luastra/ui",
    "name": "Image, Shape, and FlipCard",
    "signature": "ui-properties-visual",
    "description": "Shared parameters in the “Image, Shape, and FlipCard” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "source",
        "values": "asset:image/...",
        "description": "Typed image URI."
      },
      {
        "name": "fit",
        "values": "contain | cover | fill | none | scaleDown",
        "description": "Image scaling."
      },
      {
        "name": "width / height",
        "values": "1…4096",
        "description": "CSS-pixel size."
      },
      {
        "name": "aspectRatio",
        "values": "0.05…20",
        "description": "Aspect ratio."
      },
      {
        "name": "cornerRadius",
        "values": "0…2048",
        "description": "Corner radius."
      },
      {
        "name": "shape",
        "values": "rectangle | roundedRectangle | circle | oval | triangle | diamond | pentagon | hexagon | star",
        "description": "Shape geometry."
      },
      {
        "name": "fill / stroke",
        "values": "token | #RRGGBB",
        "description": "Fill and outline."
      },
      {
        "name": "strokeWidth",
        "values": "0…64",
        "description": "Outline thickness."
      }
    ],
    "previousPageId": "ui-properties/table-6",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "visuals/item-1",
    "kind": "entry",
    "sectionId": "visuals",
    "sectionTitle": "Images, shapes, layers, and flip cards",
    "module": "luastra/ui · luastra/assets · luastra/motion",
    "callable": false,
    "useWhen": "Use an admitted image when application artwork must be packaged, integrity-checked, and rendered without accepting an arbitrary path or URL.",
    "code": "local source = Assets.uri(Assets.image(\"image/card-back\"))\n\nUI.Image {\n    id = \"card/back\",\n    source = source,\n    label = \"Card back\",\n}",
    "signature": "Assets.image → Assets.uri → UI.Image",
    "parameters": [],
    "returns": null,
    "name": "Admitted image",
    "description": "check verifies the file before display.",
    "previousPageId": null,
    "nextPageId": "visuals/item-2",
    "relatedPageIds": []
  },
  {
    "id": "visuals/item-2",
    "kind": "entry",
    "sectionId": "visuals",
    "sectionTitle": "Images, shapes, layers, and flip cards",
    "module": "luastra/ui · luastra/assets · luastra/motion",
    "callable": false,
    "useWhen": "Use a Layer when later children must occupy the same visual bounds as the first child, such as text or status content over a Shape.",
    "code": "UI.Layer {\n    id = \"answer\",\n    UI.Shape {\n        id = \"answer/base\",\n        shape = \"circle\",\n        width = 96,\n        height = 96,\n    },\n    UI.Text {\n        id = \"answer/text\",\n        text = \"Correct\",\n    },\n}",
    "signature": "UI.Layer { base, overlay }",
    "parameters": [],
    "returns": null,
    "name": "Shape overlay",
    "description": "The first child defines shared bounds.",
    "previousPageId": "visuals/item-1",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "motion/item-1",
    "kind": "type",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "Motion types describe immutable timing data and are erased after analysis.",
    "expectedOutcome": "A checked descriptor, sequence, channel map, or easing value.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": false,
    "useWhen": "Use Motion.Easing when declaring motion separately from UI layout and assigning it to a component's motion property. Keep the value deterministic and within the documented channels so every host can reproduce the same transition.",
    "code": "export type Easing = \"linear\" | \"easeOutCubic\" | \"easeInOutCubic\"",
    "signature": "export type Easing = \"linear\" | \"easeOutCubic\" | \"easeInOutCubic\"",
    "parameters": [
      {
        "name": "definition",
        "values": "\"linear\" | \"easeOutCubic\" | \"easeInOutCubic\"",
        "description": "Exact alias, union, or callable contract represented by Motion.Easing."
      }
    ],
    "returns": null,
    "name": "Motion.Easing",
    "description": "Motion.Easing is part of the declarative motion model consumed by supported UI motion properties. It describes deterministic values and timing; the host scheduler applies frames without rerunning Application.render for every animation frame.",
    "previousPageId": null,
    "nextPageId": "motion/item-2",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-2",
    "kind": "type",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "Motion types describe immutable timing data and are erased after analysis.",
    "expectedOutcome": "A checked descriptor, sequence, channel map, or easing value.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": false,
    "useWhen": "Use Motion.TweenOptions when a reusable variable or helper passes configuration to the related SDK operation. The exported type keeps optional and required fields aligned with the checked public contract.",
    "code": "export type TweenOptions = {\n    from: number,\n    to: number,\n    durationMs: number,\n    easing: Easing?,\n}",
    "signature": "export type TweenOptions = {\n    from: number,\n    to: number,\n    durationMs: number,\n    easing: Easing?,\n}",
    "parameters": [
      {
        "name": "from",
        "values": "number",
        "description": "Numeric channel value at the beginning of the transition."
      },
      {
        "name": "to",
        "values": "number",
        "description": "Numeric channel value at the end of the transition."
      },
      {
        "name": "durationMs",
        "values": "number",
        "description": "Duration of this motion or delay in milliseconds."
      },
      {
        "name": "easing",
        "values": "Easing?",
        "description": "Named interpolation curve used between the start and end values."
      }
    ],
    "returns": null,
    "name": "Motion.TweenOptions",
    "description": "Motion.TweenOptions is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted.",
    "previousPageId": "motion/item-1",
    "nextPageId": "motion/item-3",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-3",
    "kind": "type",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "Motion types describe immutable timing data and are erased after analysis.",
    "expectedOutcome": "A checked descriptor, sequence, channel map, or easing value.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": false,
    "useWhen": "Use Motion.Tween when declaring motion separately from UI layout and assigning it to a component's motion property. Keep the value deterministic and within the documented channels so every host can reproduce the same transition.",
    "code": "export type Tween = {\n    kind: \"tween\",\n    from: number,\n    to: number,\n    durationMs: number,\n    easing: Easing,\n}",
    "signature": "export type Tween = {\n    kind: \"tween\",\n    from: number,\n    to: number,\n    durationMs: number,\n    easing: Easing,\n}",
    "parameters": [
      {
        "name": "kind",
        "values": "\"tween\"",
        "description": "Literal discriminator identifying the exact alternative in this union."
      },
      {
        "name": "from",
        "values": "number",
        "description": "Numeric channel value at the beginning of the transition."
      },
      {
        "name": "to",
        "values": "number",
        "description": "Numeric channel value at the end of the transition."
      },
      {
        "name": "durationMs",
        "values": "number",
        "description": "Duration of this motion or delay in milliseconds."
      },
      {
        "name": "easing",
        "values": "Easing",
        "description": "Named interpolation curve used between the start and end values."
      }
    ],
    "returns": null,
    "name": "Motion.Tween",
    "description": "Motion.Tween is part of the declarative motion model consumed by supported UI motion properties. It describes deterministic values and timing; the host scheduler applies frames without rerunning Application.render for every animation frame.",
    "previousPageId": "motion/item-2",
    "nextPageId": "motion/item-4",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-4",
    "kind": "type",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "Motion types describe immutable timing data and are erased after analysis.",
    "expectedOutcome": "A checked descriptor, sequence, channel map, or easing value.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": false,
    "useWhen": "Use Motion.Wait when declaring motion separately from UI layout and assigning it to a component's motion property. Keep the value deterministic and within the documented channels so every host can reproduce the same transition.",
    "code": "export type Wait = { kind: \"wait\", durationMs: number }",
    "signature": "export type Wait = { kind: \"wait\", durationMs: number }",
    "parameters": [
      {
        "name": "kind",
        "values": "\"wait\"",
        "description": "Literal discriminator identifying the exact alternative in this union."
      },
      {
        "name": "durationMs",
        "values": "number",
        "description": "Duration of this motion or delay in milliseconds."
      }
    ],
    "returns": null,
    "name": "Motion.Wait",
    "description": "Motion.Wait is part of the declarative motion model consumed by supported UI motion properties. It describes deterministic values and timing; the host scheduler applies frames without rerunning Application.render for every animation frame.",
    "previousPageId": "motion/item-3",
    "nextPageId": "motion/item-5",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-5",
    "kind": "type",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "Motion types describe immutable timing data and are erased after analysis.",
    "expectedOutcome": "A checked descriptor, sequence, channel map, or easing value.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": false,
    "useWhen": "Use Motion.Sequence when declaring motion separately from UI layout and assigning it to a component's motion property. Keep the value deterministic and within the documented channels so every host can reproduce the same transition.",
    "code": "export type Sequence = { kind: \"sequence\", steps: { Tween | Wait }, iterations: number }",
    "signature": "export type Sequence = { kind: \"sequence\", steps: { Tween | Wait }, iterations: number }",
    "parameters": [
      {
        "name": "kind",
        "values": "\"sequence\"",
        "description": "Literal discriminator identifying the exact alternative in this union."
      },
      {
        "name": "steps",
        "values": "{ Tween | Wait }",
        "description": "Ordered Tween and Wait values executed as one channel sequence."
      },
      {
        "name": "iterations",
        "values": "number",
        "description": "Number of times the declared sequence or preset repeats."
      }
    ],
    "returns": null,
    "name": "Motion.Sequence",
    "description": "Motion.Sequence is part of the declarative motion model consumed by supported UI motion properties. It describes deterministic values and timing; the host scheduler applies frames without rerunning Application.render for every animation frame.",
    "previousPageId": "motion/item-4",
    "nextPageId": "motion/item-6",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-6",
    "kind": "type",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "Motion types describe immutable timing data and are erased after analysis.",
    "expectedOutcome": "A checked descriptor, sequence, channel map, or easing value.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": false,
    "useWhen": "Use Motion.Descriptor when declaring motion separately from UI layout and assigning it to a component's motion property. Keep the value deterministic and within the documented channels so every host can reproduce the same transition.",
    "code": "export type Descriptor = Tween | Sequence",
    "signature": "export type Descriptor = Tween | Sequence",
    "parameters": [
      {
        "name": "definition",
        "values": "Tween | Sequence",
        "description": "Exact alias, union, or callable contract represented by Motion.Descriptor."
      }
    ],
    "returns": null,
    "name": "Motion.Descriptor",
    "description": "Motion.Descriptor is part of the declarative motion model consumed by supported UI motion properties. It describes deterministic values and timing; the host scheduler applies frames without rerunning Application.render for every animation frame.",
    "previousPageId": "motion/item-5",
    "nextPageId": "motion/item-7",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-7",
    "kind": "type",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "Motion types describe immutable timing data and are erased after analysis.",
    "expectedOutcome": "A checked descriptor, sequence, channel map, or easing value.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": false,
    "useWhen": "Use Motion.MotionMap when declaring motion separately from UI layout and assigning it to a component's motion property. Keep the value deterministic and within the documented channels so every host can reproduce the same transition.",
    "code": "export type MotionMap = { [string]: Descriptor }",
    "signature": "export type MotionMap = { [string]: Descriptor }",
    "parameters": [
      {
        "name": "[string]",
        "values": "Descriptor",
        "description": "Index signature mapping Descriptor; every key and value must satisfy this contract."
      }
    ],
    "returns": null,
    "name": "Motion.MotionMap",
    "description": "Motion.MotionMap is part of the declarative motion model consumed by supported UI motion properties. It describes deterministic values and timing; the host scheduler applies frames without rerunning Application.render for every animation frame.",
    "completeRecipe": {
      "sectionId": "recipe-motion",
      "title": "replay declarative motion",
      "evidence": "authored-files",
      "description": "This checked recipe uses Motion.MotionMap inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "motion/item-6",
    "nextPageId": "motion/item-8",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-8",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "The function returns immutable motion data synchronously. Assign a preset MotionMap directly, or place Tween/Sequence values under supported motion channel names; the host animates without rerunning Application.render on every frame.",
    "expectedOutcome": "A descriptor or MotionMap ready to attach to a supported UI node.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": true,
    "useWhen": "Use Motion.tween when you need direct control of one opacity, translation, scale, or rotation channel. Prefer a named preset when it already expresses the intended interaction and respect reduced-motion behavior supplied by the host.",
    "code": "local Motion = require(\"luastra/motion\")\nlocal grow = Motion.tween { from = 1, to = 1.08, durationMs = 300, easing = \"easeOutCubic\" }",
    "signature": "Motion.tween(options: TweenOptions): Tween",
    "parameters": [
      {
        "name": "options",
        "values": "TweenOptions",
        "description": "Start, end, duration, and optional easing for one numeric motion channel."
      },
      {
        "name": "options.from",
        "values": "number",
        "description": "Required finite value at the beginning of the transition."
      },
      {
        "name": "options.to",
        "values": "number",
        "description": "Required finite value at the end of the transition."
      },
      {
        "name": "options.durationMs",
        "values": "number (0..60000)",
        "description": "Required transition duration in milliseconds."
      },
      {
        "name": "options.easing",
        "values": "\"linear\" | \"easeOutCubic\" | \"easeInOutCubic\"?",
        "description": "Optional interpolation curve; defaults to \"linear\"."
      }
    ],
    "returns": "Tween — an immutable descriptor for one bounded numeric transition.",
    "name": "Motion.tween",
    "description": "Creates one deterministic numeric transition from a starting value to an ending value over a bounded duration and easing curve. A Tween becomes meaningful only when assigned to a supported motion channel or placed in a Sequence.",
    "completeRecipe": {
      "sectionId": "recipe-motion",
      "title": "replay declarative motion",
      "evidence": "authored-files",
      "description": "This checked recipe uses Motion.tween inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "motion/item-7",
    "nextPageId": "motion/item-9",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-9",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "The function returns immutable motion data synchronously. Assign a preset MotionMap directly, or place Tween/Sequence values under supported motion channel names; the host animates without rerunning Application.render on every frame.",
    "expectedOutcome": "A descriptor or MotionMap ready to attach to a supported UI node.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": true,
    "useWhen": "Use Motion.wait between sequence steps when timing is part of the visual story, such as holding a revealed state before returning. Use Timer instead when the delay must change application state or dispatch application logic.",
    "code": "local Motion = require(\"luastra/motion\")\nlocal pause = Motion.wait(500)",
    "signature": "Motion.wait(durationMs: number): Wait",
    "parameters": [
      {
        "name": "durationMs",
        "values": "number",
        "description": "Non-negative delay in milliseconds before the next sequence step."
      }
    ],
    "returns": "Wait — an immutable delay step for a motion sequence.",
    "name": "Motion.wait",
    "description": "Creates a non-visual delay step for Motion.sequence. It advances no property itself and exists only to postpone the next Tween in the same channel.",
    "previousPageId": "motion/item-8",
    "nextPageId": "motion/item-10",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-10",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "The function returns immutable motion data synchronously. Assign a preset MotionMap directly, or place Tween/Sequence values under supported motion channel names; the host animates without rerunning Application.render on every frame.",
    "expectedOutcome": "A descriptor or MotionMap ready to attach to a supported UI node.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": true,
    "useWhen": "Use Motion.sequence for multi-stage motion of one property, such as fade-hold-fade or rotate-return. It is not a MotionMap by itself: assign the Sequence as a channel value inside the component's motion table.",
    "code": "local Motion = require(\"luastra/motion\")\nlocal reveal = Motion.sequence({\n    Motion.wait(300),\n    Motion.tween { from = 0, to = 180, durationMs = 500 },\n}, 1)\nlocal motion = { rotationYDeg = reveal }",
    "signature": "Motion.sequence(steps: { Tween | Wait }, iterations: number?): Sequence",
    "parameters": [
      {
        "name": "steps",
        "values": "{ Tween | Wait }",
        "description": "Ordered dense array containing only Tween or Wait values for one channel."
      },
      {
        "name": "iterations",
        "values": "number?",
        "description": "Optional repetition count; use the documented infinite value only for intentional ambient motion."
      }
    ],
    "returns": "Sequence — an immutable ordered motion-channel sequence containing Tween and Wait steps.",
    "name": "Motion.sequence",
    "description": "Combines Tween and Wait steps into one ordered value for a single motion channel, optionally repeating the sequence. Each step begins after the previous step finishes, so timing remains deterministic across hosts.",
    "previousPageId": "motion/item-9",
    "nextPageId": "motion/item-11",
    "relatedPageIds": [
      "motion/item-8"
    ]
  },
  {
    "id": "motion/item-11",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "The function returns immutable motion data synchronously. Assign a preset MotionMap directly, or place Tween/Sequence values under supported motion channel names; the host animates without rerunning Application.render on every frame.",
    "expectedOutcome": "A descriptor or MotionMap ready to attach to a supported UI node.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": true,
    "useWhen": "Use Motion.fadeIn for newly appearing supporting content when opacity communicates entry without changing layout. Avoid it for essential immediate feedback or when reduced motion should present the final state instantly.",
    "code": "local Motion = require(\"luastra/motion\")\nlocal motion = Motion.fadeIn { durationMs = 240 }",
    "signature": "Motion.fadeIn(options: any?): MotionMap",
    "parameters": [
      {
        "name": "options",
        "values": "any?",
        "description": "Optional opacity-transition duration, easing, and preset overrides."
      },
      {
        "name": "options.durationMs",
        "values": "number (0..60000)?",
        "description": "Optional fade duration; defaults to 180 ms."
      },
      {
        "name": "options.easing",
        "values": "\"linear\" | \"easeOutCubic\" | \"easeInOutCubic\"?",
        "description": "Optional interpolation curve; defaults to \"easeOutCubic\"."
      }
    ],
    "returns": "MotionMap — a complete property-to-motion map that can be assigned directly to a supported component motion field.",
    "name": "Motion.fadeIn",
    "description": "Returns a complete MotionMap that transitions opacity from a lower value to fully visible using bounded preset defaults and optional overrides. The map can be assigned directly to a component's motion property.",
    "previousPageId": "motion/item-10",
    "nextPageId": "motion/item-12",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-12",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "The function returns immutable motion data synchronously. Assign a preset MotionMap directly, or place Tween/Sequence values under supported motion channel names; the host animates without rerunning Application.render on every frame.",
    "expectedOutcome": "A descriptor or MotionMap ready to attach to a supported UI node.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": true,
    "useWhen": "Use Motion.slideIn to introduce a panel, card, or route whose direction reinforces where it came from. Do not use it to repair layout spacing, and keep the distance modest for frequently repeated elements.",
    "code": "local Motion = require(\"luastra/motion\")\nlocal motion = Motion.slideIn { y = 24, durationMs = 300 }",
    "signature": "Motion.slideIn(options: any?): MotionMap",
    "parameters": [
      {
        "name": "options",
        "values": "any?",
        "description": "Optional starting translation, duration, and easing overrides."
      },
      {
        "name": "options.x",
        "values": "finite number?",
        "description": "Optional horizontal starting offset; omit it for no horizontal channel."
      },
      {
        "name": "options.y",
        "values": "finite number?",
        "description": "Optional vertical starting offset; defaults to 18 when x is also omitted."
      },
      {
        "name": "options.durationMs",
        "values": "number (0..60000)?",
        "description": "Optional movement duration; defaults to 240 ms."
      },
      {
        "name": "options.easing",
        "values": "\"linear\" | \"easeOutCubic\" | \"easeInOutCubic\"?",
        "description": "Optional interpolation curve; defaults to \"easeOutCubic\"."
      }
    ],
    "returns": "MotionMap — a complete property-to-motion map that can be assigned directly to a supported component motion field.",
    "name": "Motion.slideIn",
    "description": "Returns a MotionMap that combines translation with the preset's arrival timing, moving content from an offset into its final layout position. Layout is calculated at the destination; motion changes only the rendered transform.",
    "previousPageId": "motion/item-11",
    "nextPageId": "motion/item-13",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-13",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "The function returns immutable motion data synchronously. Assign a preset MotionMap directly, or place Tween/Sequence values under supported motion channel names; the host animates without rerunning Application.render on every frame.",
    "expectedOutcome": "A descriptor or MotionMap ready to attach to a supported UI node.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": true,
    "useWhen": "Use Motion.scaleIn for a newly created card, badge, or focused object when gentle emphasis helps orientation. Avoid scaling dense text or controls so often that reading and targeting become unstable.",
    "code": "local Motion = require(\"luastra/motion\")\nlocal motion = Motion.scaleIn { from = 0.92, durationMs = 220 }",
    "signature": "Motion.scaleIn(options: any?): MotionMap",
    "parameters": [
      {
        "name": "options",
        "values": "any?",
        "description": "Optional starting scale, duration, and easing overrides."
      },
      {
        "name": "options.from",
        "values": "number (0..100)?",
        "description": "Optional initial scale; defaults to 0.92 and ends at 1."
      },
      {
        "name": "options.durationMs",
        "values": "number (0..60000)?",
        "description": "Optional scale duration; defaults to 220 ms."
      },
      {
        "name": "options.easing",
        "values": "\"linear\" | \"easeOutCubic\" | \"easeInOutCubic\"?",
        "description": "Optional interpolation curve; defaults to \"easeOutCubic\"."
      }
    ],
    "returns": "MotionMap — a complete property-to-motion map that can be assigned directly to a supported component motion field.",
    "name": "Motion.scaleIn",
    "description": "Returns a MotionMap that grows a component from a smaller scale to its final size without changing the space reserved by layout. Optional values tune the starting scale, duration, and easing within admitted bounds.",
    "previousPageId": "motion/item-12",
    "nextPageId": "motion/item-14",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-14",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "The function returns immutable motion data synchronously. Assign a preset MotionMap directly, or place Tween/Sequence values under supported motion channel names; the host animates without rerunning Application.render on every frame.",
    "expectedOutcome": "A descriptor or MotionMap ready to attach to a supported UI node.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": true,
    "useWhen": "Use Motion.sway for occasional ambient motion on a decorative or game-like object, such as a hidden card. Keep the angle small, stop it when the object is inactive, and rely on host reduced-motion handling.",
    "code": "local Motion = require(\"luastra/motion\")\nlocal motion = Motion.sway { angleDeg = 2, durationMs = 2400, iterations = 0 }",
    "signature": "Motion.sway(options: any?): MotionMap",
    "parameters": [
      {
        "name": "options",
        "values": "any?",
        "description": "Optional angle, duration, and iteration settings for the rotation preset."
      },
      {
        "name": "options.angleDeg",
        "values": "number (0..45]?",
        "description": "Optional peak rotation in degrees; defaults to 2."
      },
      {
        "name": "options.durationMs",
        "values": "number (0..60000)?",
        "description": "Duration of each one-way movement; defaults to 180 ms."
      },
      {
        "name": "options.pauseMs",
        "values": "number (0..60000)?",
        "description": "Delay before each continuous sway cycle; defaults to 2400 ms."
      },
      {
        "name": "options.easing",
        "values": "\"linear\" | \"easeOutCubic\" | \"easeInOutCubic\"?",
        "description": "Optional interpolation curve; defaults to \"easeInOutCubic\"."
      }
    ],
    "returns": "MotionMap — a complete property-to-motion map that can be assigned directly to a supported component motion field.",
    "name": "Motion.sway",
    "description": "Returns a repeating rotation MotionMap that alternates around the resting angle, producing a gentle rocking effect. Iteration and duration options control whether it settles or continues.",
    "previousPageId": "motion/item-13",
    "nextPageId": "motion/item-15",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-15",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "The function returns immutable motion data synchronously. Assign a preset MotionMap directly, or place Tween/Sequence values under supported motion channel names; the host animates without rerunning Application.render on every frame.",
    "expectedOutcome": "A descriptor or MotionMap ready to attach to a supported UI node.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": true,
    "useWhen": "Use Motion.pulse sparingly for a current target, waiting object, or time-sensitive affordance. Do not run it continuously on many elements or use motion as the only way to convey status.",
    "code": "local Motion = require(\"luastra/motion\")\nlocal motion = Motion.pulse { scale = 1.05, durationMs = 1800, iterations = 0 }",
    "signature": "Motion.pulse(options: any?): MotionMap",
    "parameters": [
      {
        "name": "options",
        "values": "any?",
        "description": "Optional scale, duration, and iteration settings for the pulse preset."
      },
      {
        "name": "options.scale",
        "values": "number (0..100)?",
        "description": "Optional peak scale; defaults to 1.04."
      },
      {
        "name": "options.durationMs",
        "values": "number (0..60000)?",
        "description": "Duration of each expand or contract leg; defaults to 420 ms."
      },
      {
        "name": "options.pauseMs",
        "values": "number (0..60000)?",
        "description": "Optional delay appended after each pulse; defaults to 0."
      },
      {
        "name": "options.iterations",
        "values": "integer (0..1000)?",
        "description": "Cycle count; defaults to 1 and 0 means continuous."
      },
      {
        "name": "options.easing",
        "values": "\"linear\" | \"easeOutCubic\" | \"easeInOutCubic\"?",
        "description": "Optional interpolation curve; defaults to \"easeInOutCubic\"."
      }
    ],
    "returns": "MotionMap — a complete property-to-motion map that can be assigned directly to a supported component motion field.",
    "name": "Motion.pulse",
    "description": "Returns a repeating scale MotionMap that expands and contracts around the component's normal size. The component keeps its original layout bounds while the transform provides visual emphasis.",
    "previousPageId": "motion/item-14",
    "nextPageId": "motion/item-16",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-16",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "The function returns immutable motion data synchronously. Assign a preset MotionMap directly, or place Tween/Sequence values under supported motion channel names; the host animates without rerunning Application.render on every frame.",
    "expectedOutcome": "A descriptor or MotionMap ready to attach to a supported UI node.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": true,
    "useWhen": "Use Motion.shake after a rejected guess or invalid action when the UI also exposes an accessible text or status explanation. Do not use it for ordinary errors that have not yet been caused by user action.",
    "code": "local Motion = require(\"luastra/motion\")\nlocal motion = Motion.shake { distance = 8, durationMs = 360 }",
    "signature": "Motion.shake(options: any?): MotionMap",
    "parameters": [
      {
        "name": "options",
        "values": "any?",
        "description": "Optional distance, duration, and easing settings for bounded feedback."
      },
      {
        "name": "options.distance",
        "values": "number (0..1000]?",
        "description": "Optional horizontal peak distance; defaults to 8."
      },
      {
        "name": "options.durationMs",
        "values": "number (0..60000)?",
        "description": "Duration of the first and last legs; defaults to 70 ms."
      },
      {
        "name": "options.iterations",
        "values": "integer (0..1000)?",
        "description": "Shake cycle count; defaults to 1 and 0 means continuous."
      }
    ],
    "returns": "MotionMap — a complete property-to-motion map that can be assigned directly to a supported component motion field.",
    "name": "Motion.shake",
    "description": "Returns a short horizontal translation MotionMap that moves away from and back to the resting position. It is designed as bounded feedback rather than an ambient loop.",
    "previousPageId": "motion/item-15",
    "nextPageId": "motion/item-17",
    "relatedPageIds": []
  },
  {
    "id": "motion/item-17",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "beforeYouUse": "Add luastra/motion to this module's dependencies in luastra.json, then import it with require(\"luastra/motion\"). Motion itself needs no capability; a visible result requires ui.render and a component that accepts the returned descriptor through its motion field.",
    "lifecycle": "The function returns immutable motion data synchronously. Assign a preset MotionMap directly, or place Tween/Sequence values under supported motion channel names; the host animates without rerunning Application.render on every frame.",
    "expectedOutcome": "A descriptor or MotionMap ready to attach to a supported UI node.",
    "failureGuidance": "Unknown options, invalid bounds, or unsupported channels fail validation. Motion must not drive application logic; use Timer for state changes, and rely on the host to present the final state when reduced motion is enabled.",
    "availability": "Current development candidate API; presentation follows host and reduced-motion policy.",
    "callable": true,
    "useWhen": "Use Motion.flip only with UI.FlipCard when application state changes which of its two children is visible. Update the state and angle together; use a general rotation tween for single-sided objects.",
    "code": "local Motion = require(\"luastra/motion\")\nlocal motion = Motion.flip { fromDeg = 0, toDeg = 180, durationMs = 500 }",
    "signature": "Motion.flip(options: any?): MotionMap",
    "parameters": [
      {
        "name": "options",
        "values": "any?",
        "description": "Front and back rotation angles plus duration and easing for UI.FlipCard."
      },
      {
        "name": "options.fromDeg",
        "values": "finite number?",
        "description": "Optional initial Y-axis rotation; defaults to 0 degrees."
      },
      {
        "name": "options.toDeg",
        "values": "finite number?",
        "description": "Optional final Y-axis rotation; defaults to 180 degrees."
      },
      {
        "name": "options.durationMs",
        "values": "number (0..60000)?",
        "description": "Optional flip duration; defaults to 500 ms."
      },
      {
        "name": "options.easing",
        "values": "\"linear\" | \"easeOutCubic\" | \"easeInOutCubic\"?",
        "description": "Optional interpolation curve; defaults to \"easeInOutCubic\"."
      }
    ],
    "returns": "MotionMap — a complete property-to-motion map that can be assigned directly to a supported component motion field.",
    "name": "Motion.flip",
    "description": "Returns a rotationY MotionMap tailored to UI.FlipCard, moving between front and back angles over a bounded duration. The FlipCard host uses the channel to hide the reverse face correctly during the 3D transition.",
    "previousPageId": "motion/item-16",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "assets/item-1",
    "kind": "type",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
    "beforeYouUse": "Add luastra/assets to this module's dependencies in luastra.json, then import it with require(\"luastra/assets\"). Declare the referenced file in luastra.json with its stable asset id and admitted media type. Image assets are PNG, JPEG, WebP, or AVIF; audio assets and WOFF2 fonts use their own declared types.",
    "lifecycle": "Asset types describe checked references and are erased after Luau analysis.",
    "expectedOutcome": "A type-safe image, audio, font, or union reference.",
    "failureGuidance": "A malformed id, missing manifest entry, wrong media kind, unsupported media type, or missing source file fails during project checking or packaging. Assets.font is packaged and typed, but this candidate has no public text-style consumer for custom fonts yet.",
    "availability": "Current development candidate API; supported consumers vary by asset kind.",
    "callable": false,
    "useWhen": "Use Assets.Image when annotating values that cross the public luastra/assets boundary or when exporting helpers built on that module. The type documents the exact checked shape and prevents unrelated tables from being substituted accidentally.",
    "code": "export type Image = { kind: \"image\", id: string, uri: string }",
    "signature": "export type Image = { kind: \"image\", id: string, uri: string }",
    "parameters": [
      {
        "name": "kind",
        "values": "\"image\"",
        "description": "Literal discriminator identifying the exact alternative in this union."
      },
      {
        "name": "id",
        "values": "string",
        "description": "Stable identifier used to correlate or address this value across operations."
      },
      {
        "name": "uri",
        "values": "string",
        "description": "Canonical host-neutral resource URI derived from the admitted asset."
      }
    ],
    "returns": null,
    "name": "Assets.Image",
    "description": "Assets.Image is an exported, statically checked data contract of luastra/assets. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis.",
    "previousPageId": null,
    "nextPageId": "assets/item-2",
    "relatedPageIds": []
  },
  {
    "id": "assets/item-2",
    "kind": "type",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
    "beforeYouUse": "Add luastra/assets to this module's dependencies in luastra.json, then import it with require(\"luastra/assets\"). Declare the referenced file in luastra.json with its stable asset id and admitted media type. Image assets are PNG, JPEG, WebP, or AVIF; audio assets and WOFF2 fonts use their own declared types.",
    "lifecycle": "Asset types describe checked references and are erased after Luau analysis.",
    "expectedOutcome": "A type-safe image, audio, font, or union reference.",
    "failureGuidance": "A malformed id, missing manifest entry, wrong media kind, unsupported media type, or missing source file fails during project checking or packaging. Assets.font is packaged and typed, but this candidate has no public text-style consumer for custom fonts yet.",
    "availability": "Current development candidate API; supported consumers vary by asset kind.",
    "callable": false,
    "useWhen": "Use Assets.Audio when annotating values that cross the public luastra/assets boundary or when exporting helpers built on that module. The type documents the exact checked shape and prevents unrelated tables from being substituted accidentally.",
    "code": "export type Audio = { kind: \"audio\", id: string, uri: string }",
    "signature": "export type Audio = { kind: \"audio\", id: string, uri: string }",
    "parameters": [
      {
        "name": "kind",
        "values": "\"audio\"",
        "description": "Literal discriminator identifying the exact alternative in this union."
      },
      {
        "name": "id",
        "values": "string",
        "description": "Stable identifier used to correlate or address this value across operations."
      },
      {
        "name": "uri",
        "values": "string",
        "description": "Canonical host-neutral resource URI derived from the admitted asset."
      }
    ],
    "returns": null,
    "name": "Assets.Audio",
    "description": "Assets.Audio is an exported, statically checked data contract of luastra/assets. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis.",
    "previousPageId": "assets/item-1",
    "nextPageId": "assets/item-3",
    "relatedPageIds": []
  },
  {
    "id": "assets/item-3",
    "kind": "type",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
    "beforeYouUse": "Add luastra/assets to this module's dependencies in luastra.json, then import it with require(\"luastra/assets\"). Declare the referenced file in luastra.json with its stable asset id and admitted media type. Image assets are PNG, JPEG, WebP, or AVIF; audio assets and WOFF2 fonts use their own declared types.",
    "lifecycle": "Asset types describe checked references and are erased after Luau analysis.",
    "expectedOutcome": "A type-safe image, audio, font, or union reference.",
    "failureGuidance": "A malformed id, missing manifest entry, wrong media kind, unsupported media type, or missing source file fails during project checking or packaging. Assets.font is packaged and typed, but this candidate has no public text-style consumer for custom fonts yet.",
    "availability": "Current development candidate API; supported consumers vary by asset kind.",
    "callable": false,
    "useWhen": "Use Assets.Font when annotating values that cross the public luastra/assets boundary or when exporting helpers built on that module. The type documents the exact checked shape and prevents unrelated tables from being substituted accidentally.",
    "code": "export type Font = { kind: \"font\", id: string, uri: string }",
    "signature": "export type Font = { kind: \"font\", id: string, uri: string }",
    "parameters": [
      {
        "name": "kind",
        "values": "\"font\"",
        "description": "Literal discriminator identifying the exact alternative in this union."
      },
      {
        "name": "id",
        "values": "string",
        "description": "Stable identifier used to correlate or address this value across operations."
      },
      {
        "name": "uri",
        "values": "string",
        "description": "Canonical host-neutral resource URI derived from the admitted asset."
      }
    ],
    "returns": null,
    "name": "Assets.Font",
    "description": "Assets.Font is an exported, statically checked data contract of luastra/assets. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis.",
    "previousPageId": "assets/item-2",
    "nextPageId": "assets/item-4",
    "relatedPageIds": []
  },
  {
    "id": "assets/item-4",
    "kind": "type",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
    "beforeYouUse": "Add luastra/assets to this module's dependencies in luastra.json, then import it with require(\"luastra/assets\"). Declare the referenced file in luastra.json with its stable asset id and admitted media type. Image assets are PNG, JPEG, WebP, or AVIF; audio assets and WOFF2 fonts use their own declared types.",
    "lifecycle": "Asset types describe checked references and are erased after Luau analysis.",
    "expectedOutcome": "A type-safe image, audio, font, or union reference.",
    "failureGuidance": "A malformed id, missing manifest entry, wrong media kind, unsupported media type, or missing source file fails during project checking or packaging. Assets.font is packaged and typed, but this candidate has no public text-style consumer for custom fonts yet.",
    "availability": "Current development candidate API; supported consumers vary by asset kind.",
    "callable": false,
    "useWhen": "Use Assets.Reference when annotating values that cross the public luastra/assets boundary or when exporting helpers built on that module. The type documents the exact checked shape and prevents unrelated tables from being substituted accidentally.",
    "code": "export type Reference = Image | Audio | Font",
    "signature": "export type Reference = Image | Audio | Font",
    "parameters": [
      {
        "name": "definition",
        "values": "Image | Audio | Font",
        "description": "Exact alias, union, or callable contract represented by Assets.Reference."
      }
    ],
    "returns": null,
    "name": "Assets.Reference",
    "description": "Assets.Reference is an exported, statically checked data contract of luastra/assets. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis.",
    "previousPageId": "assets/item-3",
    "nextPageId": "assets/item-5",
    "relatedPageIds": []
  },
  {
    "id": "assets/item-5",
    "kind": "entry",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
    "beforeYouUse": "Add luastra/assets to this module's dependencies in luastra.json, then import it with require(\"luastra/assets\"). Declare the referenced file in luastra.json with its stable asset id and admitted media type. Image assets are PNG, JPEG, WebP, or AVIF; audio assets and WOFF2 fonts use their own declared types.",
    "lifecycle": "The constructor validates an asset id and returns a typed reference synchronously. It does not read a file. Assets.uri exposes the packaged asset URI for a consuming UI or Media API.",
    "expectedOutcome": "A checked reference or canonical asset URI that a compatible API can consume.",
    "failureGuidance": "A malformed id, missing manifest entry, wrong media kind, unsupported media type, or missing source file fails during project checking or packaging. Assets.font is packaged and typed, but this candidate has no public text-style consumer for custom fonts yet.",
    "availability": "Current development candidate API; supported consumers vary by asset kind.",
    "callable": true,
    "useWhen": "Use Assets.image at module initialization or in a small asset helper when UI.Image needs packaged artwork. The identifier must match an admitted image asset; this function does not load arbitrary files or remote URLs.",
    "code": "local Assets = require(\"luastra/assets\")\nlocal cardBack = Assets.image(\"image/card-back\")",
    "signature": "Assets.image(id: string): Image",
    "parameters": [
      {
        "name": "id",
        "values": "string",
        "description": "Manifest asset ID whose declared media type is an admitted image."
      }
    ],
    "returns": "Image — a typed image reference admitted from the project manifest.",
    "name": "Assets.image",
    "description": "Creates a typed reference to an image declared in luastra.json. Construction validates the asset identifier and preserves its media kind so an image cannot be passed accidentally where audio or a font is required.",
    "completeRecipe": {
      "sectionId": "recipe-assets-visuals",
      "title": "package an image and compose visuals",
      "evidence": "authored-files",
      "description": "This checked recipe uses Assets.image inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "assets/item-4",
    "nextPageId": "assets/item-6",
    "relatedPageIds": []
  },
  {
    "id": "assets/item-6",
    "kind": "entry",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
    "beforeYouUse": "Add luastra/assets to this module's dependencies in luastra.json, then import it with require(\"luastra/assets\"). Declare the referenced file in luastra.json with its stable asset id and admitted media type. Image assets are PNG, JPEG, WebP, or AVIF; audio assets and WOFF2 fonts use their own declared types.",
    "lifecycle": "The constructor validates an asset id and returns a typed reference synchronously. It does not read a file. Assets.uri exposes the packaged asset URI for a consuming UI or Media API.",
    "expectedOutcome": "A checked reference or canonical asset URI that a compatible API can consume.",
    "failureGuidance": "A malformed id, missing manifest entry, wrong media kind, unsupported media type, or missing source file fails during project checking or packaging. Assets.font is packaged and typed, but this candidate has no public text-style consumer for custom fonts yet.",
    "availability": "Current development candidate API; supported consumers vary by asset kind.",
    "callable": true,
    "useWhen": "Use Assets.audio when building Media.QueueItem values for sounds shipped with the application. Use a trusted HTTPS source only where the media contract explicitly admits one; do not disguise a filesystem path as an asset ID.",
    "code": "local Assets = require(\"luastra/assets\")\nlocal intro = Assets.audio(\"audio/intro\")",
    "signature": "Assets.audio(id: string): Audio",
    "parameters": [
      {
        "name": "id",
        "values": "string",
        "description": "Manifest asset ID whose declared media type is admitted audio."
      }
    ],
    "returns": "Audio — a typed audio reference admitted from the project manifest.",
    "name": "Assets.audio",
    "description": "Creates a typed reference to an admitted audio asset while retaining the asset kind and canonical asset URI. The reference can be stored safely before a media queue is assembled.",
    "completeRecipe": {
      "sectionId": "recipe-media",
      "title": "play packaged audio",
      "evidence": "authored-files",
      "description": "This checked recipe uses Assets.audio inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "assets/item-5",
    "nextPageId": "assets/item-7",
    "relatedPageIds": []
  },
  {
    "id": "assets/item-7",
    "kind": "entry",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
    "beforeYouUse": "Add luastra/assets to this module's dependencies in luastra.json, then import it with require(\"luastra/assets\"). Declare the referenced file in luastra.json with its stable asset id and admitted media type. Image assets are PNG, JPEG, WebP, or AVIF; audio assets and WOFF2 fonts use their own declared types.",
    "lifecycle": "The constructor validates an asset id and returns a typed reference synchronously. It does not read a file. Assets.uri exposes the packaged asset URI for a consuming UI or Media API.",
    "expectedOutcome": "A checked reference or canonical asset URI that a compatible API can consume.",
    "failureGuidance": "A malformed id, missing manifest entry, wrong media kind, unsupported media type, or missing source file fails during project checking or packaging. Assets.font is packaged and typed, but this candidate has no public text-style consumer for custom fonts yet.",
    "availability": "Current development candidate API; supported consumers vary by asset kind.",
    "callable": true,
    "useWhen": "Use Assets.font when a supported styling or host workflow requests a packaged font reference. Keep font licensing and the manifest declaration alongside the asset; creating the reference alone does not apply the font to text.",
    "code": "local Assets = require(\"luastra/assets\")\nlocal displayFont = Assets.font(\"font/display\")",
    "signature": "Assets.font(id: string): Font",
    "parameters": [
      {
        "name": "id",
        "values": "string",
        "description": "Manifest asset ID whose declared media type is an admitted font."
      }
    ],
    "returns": "Font — a typed font reference admitted from the project manifest.",
    "name": "Assets.font",
    "description": "Creates a typed reference to a font declared by the project manifest. The result distinguishes font resources from images and audio before a host attempts to consume them.",
    "previousPageId": "assets/item-6",
    "nextPageId": "assets/item-8",
    "relatedPageIds": []
  },
  {
    "id": "assets/item-8",
    "kind": "entry",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
    "beforeYouUse": "Add luastra/assets to this module's dependencies in luastra.json, then import it with require(\"luastra/assets\"). Declare the referenced file in luastra.json with its stable asset id and admitted media type. Image assets are PNG, JPEG, WebP, or AVIF; audio assets and WOFF2 fonts use their own declared types.",
    "lifecycle": "The constructor validates an asset id and returns a typed reference synchronously. It does not read a file. Assets.uri exposes the packaged asset URI for a consuming UI or Media API.",
    "expectedOutcome": "A checked reference or canonical asset URI that a compatible API can consume.",
    "failureGuidance": "A malformed id, missing manifest entry, wrong media kind, unsupported media type, or missing source file fails during project checking or packaging. Assets.font is packaged and typed, but this candidate has no public text-style consumer for custom fonts yet.",
    "availability": "Current development candidate API; supported consumers vary by asset kind.",
    "callable": true,
    "useWhen": "Use Assets.uri at the final SDK boundary that expects a URI string, such as UI.Image.source or a media queue item. Keep the typed reference until that boundary so asset kinds remain checked for as long as possible.",
    "code": "local Assets = require(\"luastra/assets\")\nlocal source = Assets.uri(Assets.audio(\"audio/intro\"))",
    "signature": "Assets.uri(value: Reference): string",
    "parameters": [
      {
        "name": "value",
        "values": "Reference",
        "description": "Typed asset reference whose canonical host-neutral URI is required."
      }
    ],
    "returns": "string — the validated canonical string produced by this operation.",
    "name": "Assets.uri",
    "description": "Returns the canonical asset URI carried by a typed Image, Audio, Font, or general Reference. The URI is host-neutral and points only to a resource already admitted by the project manifest.",
    "completeRecipe": {
      "sectionId": "recipe-assets-visuals",
      "title": "package an image and compose visuals",
      "evidence": "authored-files",
      "description": "This checked recipe uses Assets.uri inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "assets/item-7",
    "nextPageId": null,
    "relatedPageIds": [
      "assets/item-6"
    ]
  },
  {
    "id": "data/item-1",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "The exported type describes schemas or the tagged success/failure result returned by Data.decode.",
    "expectedOutcome": "A checked schema/result annotation.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": false,
    "useWhen": "Use Data.ValidationError on the unsuccessful branch of the related result. Read its stable fields for control flow or diagnostics; do not parse human-readable assertion or error text.",
    "code": "export type ValidationError = {\n    code: string,\n    path: string,\n}",
    "signature": "export type ValidationError = {\n    code: string,\n    path: string,\n}",
    "parameters": [
      {
        "name": "code",
        "values": "string",
        "description": "Stable machine-readable failure code suitable for branching and diagnostics."
      },
      {
        "name": "path",
        "values": "string",
        "description": "Checked path field of Data.ValidationError; its exact admitted type is string."
      }
    ],
    "returns": null,
    "name": "Data.ValidationError",
    "description": "Data.ValidationError represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message.",
    "previousPageId": null,
    "nextPageId": "data/item-2",
    "relatedPageIds": []
  },
  {
    "id": "data/item-2",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "The exported type describes schemas or the tagged success/failure result returned by Data.decode.",
    "expectedOutcome": "A checked schema/result annotation.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": false,
    "useWhen": "Use Data.Success after narrowing the related result with success == true. Only this branch guarantees access to the decoded value and other success-specific fields.",
    "code": "export type Success = { success: true, value: any, error: nil }",
    "signature": "export type Success = { success: true, value: any, error: nil }",
    "parameters": [
      {
        "name": "success",
        "values": "true",
        "description": "Discriminator that must be checked before reading branch-specific fields."
      },
      {
        "name": "value",
        "values": "any",
        "description": "Validated value available on the successful result branch."
      },
      {
        "name": "error",
        "values": "nil",
        "description": "Bounded failure information, or nil on the successful branch."
      }
    ],
    "returns": null,
    "name": "Data.Success",
    "description": "Data.Success represents the successful branch of a discriminated SDK result. Its value and success-specific fields are safe to read only after the shared success tag has narrowed the union.",
    "previousPageId": "data/item-1",
    "nextPageId": "data/item-3",
    "relatedPageIds": []
  },
  {
    "id": "data/item-3",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "The exported type describes schemas or the tagged success/failure result returned by Data.decode.",
    "expectedOutcome": "A checked schema/result annotation.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": false,
    "useWhen": "Use Data.Failure on the unsuccessful branch of the related result. Read its stable fields for control flow or diagnostics; do not parse human-readable assertion or error text.",
    "code": "export type Failure = { success: false, value: nil, error: ValidationError }",
    "signature": "export type Failure = { success: false, value: nil, error: ValidationError }",
    "parameters": [
      {
        "name": "success",
        "values": "false",
        "description": "Discriminator that must be checked before reading branch-specific fields."
      },
      {
        "name": "value",
        "values": "nil",
        "description": "Validated value available on the successful result branch."
      },
      {
        "name": "error",
        "values": "ValidationError",
        "description": "Bounded failure information, or nil on the successful branch."
      }
    ],
    "returns": null,
    "name": "Data.Failure",
    "description": "Data.Failure represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message.",
    "previousPageId": "data/item-2",
    "nextPageId": "data/item-4",
    "relatedPageIds": []
  },
  {
    "id": "data/item-4",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "The exported type describes schemas or the tagged success/failure result returned by Data.decode.",
    "expectedOutcome": "A checked schema/result annotation.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": false,
    "useWhen": "Use Data.Result at the boundary where untrusted or versioned input is decoded. Branch on result.success before reading value or error so both outcomes remain explicit and type-safe.",
    "code": "export type Result = Success | Failure",
    "signature": "export type Result = Success | Failure",
    "parameters": [
      {
        "name": "definition",
        "values": "Success | Failure",
        "description": "Exact alias, union, or callable contract represented by Data.Result."
      }
    ],
    "returns": null,
    "name": "Data.Result",
    "description": "Data.Result is a discriminated union covering successful output and bounded failure. Branching on success narrows the value to the correct exported record and makes error handling explicit.",
    "previousPageId": "data/item-3",
    "nextPageId": "data/item-5",
    "relatedPageIds": [
      "data/item-16"
    ]
  },
  {
    "id": "data/item-5",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "The exported type describes schemas or the tagged success/failure result returned by Data.decode.",
    "expectedOutcome": "A checked schema/result annotation.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": false,
    "useWhen": "Use Data.StringOptions when a reusable variable or helper passes configuration to the related SDK operation. The exported type keeps optional and required fields aligned with the checked public contract.",
    "code": "export type StringOptions = { minBytes: number?, maxBytes: number?, trim: boolean? }",
    "signature": "export type StringOptions = { minBytes: number?, maxBytes: number?, trim: boolean? }",
    "parameters": [
      {
        "name": "minBytes",
        "values": "number?",
        "description": "Checked minBytes field of Data.StringOptions; its exact admitted type is number?."
      },
      {
        "name": "maxBytes",
        "values": "number?",
        "description": "Checked maxBytes field of Data.StringOptions; its exact admitted type is number?."
      },
      {
        "name": "trim",
        "values": "boolean?",
        "description": "Checked trim field of Data.StringOptions; its exact admitted type is boolean?."
      }
    ],
    "returns": null,
    "name": "Data.StringOptions",
    "description": "Data.StringOptions is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted.",
    "previousPageId": "data/item-4",
    "nextPageId": "data/item-6",
    "relatedPageIds": [
      "data/item-10"
    ]
  },
  {
    "id": "data/item-6",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "The exported type describes schemas or the tagged success/failure result returned by Data.decode.",
    "expectedOutcome": "A checked schema/result annotation.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": false,
    "useWhen": "Use Data.NumberOptions when a reusable variable or helper passes configuration to the related SDK operation. The exported type keeps optional and required fields aligned with the checked public contract.",
    "code": "export type NumberOptions = { integer: boolean?, min: number?, max: number? }",
    "signature": "export type NumberOptions = { integer: boolean?, min: number?, max: number? }",
    "parameters": [
      {
        "name": "integer",
        "values": "boolean?",
        "description": "Checked integer field of Data.NumberOptions; its exact admitted type is boolean?."
      },
      {
        "name": "min",
        "values": "number?",
        "description": "Checked min field of Data.NumberOptions; its exact admitted type is number?."
      },
      {
        "name": "max",
        "values": "number?",
        "description": "Checked max field of Data.NumberOptions; its exact admitted type is number?."
      }
    ],
    "returns": null,
    "name": "Data.NumberOptions",
    "description": "Data.NumberOptions is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted.",
    "previousPageId": "data/item-5",
    "nextPageId": "data/item-7",
    "relatedPageIds": []
  },
  {
    "id": "data/item-7",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "The exported type describes schemas or the tagged success/failure result returned by Data.decode.",
    "expectedOutcome": "A checked schema/result annotation.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": false,
    "useWhen": "Use Data.ArrayOptions when a reusable variable or helper passes configuration to the related SDK operation. The exported type keeps optional and required fields aligned with the checked public contract.",
    "code": "export type ArrayOptions = { minItems: number?, maxItems: number? }",
    "signature": "export type ArrayOptions = { minItems: number?, maxItems: number? }",
    "parameters": [
      {
        "name": "minItems",
        "values": "number?",
        "description": "Checked minItems field of Data.ArrayOptions; its exact admitted type is number?."
      },
      {
        "name": "maxItems",
        "values": "number?",
        "description": "Checked maxItems field of Data.ArrayOptions; its exact admitted type is number?."
      }
    ],
    "returns": null,
    "name": "Data.ArrayOptions",
    "description": "Data.ArrayOptions is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted.",
    "previousPageId": "data/item-6",
    "nextPageId": "data/item-8",
    "relatedPageIds": []
  },
  {
    "id": "data/item-8",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "The exported type describes schemas or the tagged success/failure result returned by Data.decode.",
    "expectedOutcome": "A checked schema/result annotation.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": false,
    "useWhen": "Use Data.ObjectOptions when a reusable variable or helper passes configuration to the related SDK operation. The exported type keeps optional and required fields aligned with the checked public contract.",
    "code": "export type ObjectOptions = { exact: boolean? }",
    "signature": "export type ObjectOptions = { exact: boolean? }",
    "parameters": [
      {
        "name": "exact",
        "values": "boolean?",
        "description": "Checked exact field of Data.ObjectOptions; its exact admitted type is boolean?."
      }
    ],
    "returns": null,
    "name": "Data.ObjectOptions",
    "description": "Data.ObjectOptions is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted.",
    "previousPageId": "data/item-7",
    "nextPageId": "data/item-9",
    "relatedPageIds": []
  },
  {
    "id": "data/item-9",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "The exported type describes schemas or the tagged success/failure result returned by Data.decode.",
    "expectedOutcome": "A checked schema/result annotation.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": false,
    "useWhen": "Use Data.Schema when annotating values that cross the public luastra/data boundary or when exporting helpers built on that module. The type documents the exact checked shape and prevents unrelated tables from being substituted accidentally.",
    "code": "export type Schema = {\n    kind: string,\n    optional: boolean?,\n    options: { [string]: any }?,\n    item: Schema?,\n    fields: { [string]: Schema }?,\n}",
    "signature": "export type Schema = {\n    kind: string,\n    optional: boolean?,\n    options: { [string]: any }?,\n    item: Schema?,\n    fields: { [string]: Schema }?,\n}",
    "parameters": [
      {
        "name": "kind",
        "values": "string",
        "description": "Literal discriminator identifying the exact alternative in this union."
      },
      {
        "name": "optional",
        "values": "boolean?",
        "description": "Checked optional field of Data.Schema; its exact admitted type is boolean?."
      },
      {
        "name": "options",
        "values": "{ [string]: any }?",
        "description": "Checked options field of Data.Schema; its exact admitted type is { [string]: any }?."
      },
      {
        "name": "item",
        "values": "Schema?",
        "description": "Checked item field of Data.Schema; its exact admitted type is Schema?."
      },
      {
        "name": "fields",
        "values": "{ [string]: Schema }?",
        "description": "Validated bounded field map carried by the decoded or migrated value."
      }
    ],
    "returns": null,
    "name": "Data.Schema",
    "description": "Data.Schema is an exported, statically checked data contract of luastra/data. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis.",
    "previousPageId": "data/item-8",
    "nextPageId": "data/item-10",
    "relatedPageIds": []
  },
  {
    "id": "data/item-10",
    "kind": "entry",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "This pure constructor returns an immutable schema synchronously; Data.decode performs the actual validation later.",
    "expectedOutcome": "An immutable schema ready to compose or pass to Data.decode.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": true,
    "useWhen": "Use Data.string for form fields, URL parameters, storage fields, or server properties that must be text at runtime. Add the narrowest useful byte bounds at the untrusted boundary; this alpha has no pattern option, so validate application-specific formats separately.",
    "code": "local Data = require(\"luastra/data\")\nlocal title = Data.string { minBytes = 1, maxBytes = 80, trim = true }",
    "signature": "Data.string(optionsValue: StringOptions?): Schema",
    "parameters": [
      {
        "name": "optionsValue",
        "values": "StringOptions?",
        "description": "Optional length, trimming, and pattern constraints for accepted strings."
      },
      {
        "name": "optionsValue.minBytes",
        "values": "integer (0..4096)?",
        "description": "Minimum UTF-8 byte length; defaults to 0."
      },
      {
        "name": "optionsValue.maxBytes",
        "values": "integer (0..4096)?",
        "description": "Maximum UTF-8 byte length; defaults to 4096."
      },
      {
        "name": "optionsValue.trim",
        "values": "boolean?",
        "description": "Trims surrounding whitespace before validation when true; defaults to false."
      }
    ],
    "returns": "Schema — an immutable runtime schema that can be composed or passed to Data.decode.",
    "name": "Data.string",
    "description": "Builds a runtime schema for string input with optional UTF-8 byte-length bounds and trimming defined by Data.StringOptions. The schema is a description only; validation occurs later through Data.decode.",
    "completeRecipe": {
      "sectionId": "recipe-form-modal",
      "title": "validate a form and confirm in a modal",
      "evidence": "authored-files",
      "description": "This checked recipe uses Data.string inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "data/item-9",
    "nextPageId": "data/item-11",
    "relatedPageIds": [
      "data/item-5",
      "data/item-16",
      "data/item-15"
    ]
  },
  {
    "id": "data/item-11",
    "kind": "entry",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "This pure constructor returns an immutable schema synchronously; Data.decode performs the actual validation later.",
    "expectedOutcome": "An immutable schema ready to compose or pass to Data.decode.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": true,
    "useWhen": "Use Data.number whenever an external value becomes a score, index, duration, amount, or other numeric application value. Constrain the range before using it in layout, navigation, persistence, or calculations.",
    "code": "local Data = require(\"luastra/data\")\nlocal score = Data.number { integer = true, min = 0, max = 100 }",
    "signature": "Data.number(optionsValue: NumberOptions?): Schema",
    "parameters": [
      {
        "name": "optionsValue",
        "values": "NumberOptions?",
        "description": "Optional finite range and integer constraints for accepted numbers."
      },
      {
        "name": "optionsValue.integer",
        "values": "boolean?",
        "description": "Rejects fractional values when true; defaults to false."
      },
      {
        "name": "optionsValue.min",
        "values": "finite number?",
        "description": "Optional inclusive minimum value."
      },
      {
        "name": "optionsValue.max",
        "values": "finite number?",
        "description": "Optional inclusive maximum value."
      }
    ],
    "returns": "Schema — an immutable runtime schema that can be composed or passed to Data.decode.",
    "name": "Data.number",
    "description": "Builds a schema that accepts finite numeric values and can enforce the documented minimum, maximum, or integer constraints. Non-numbers and non-finite values fail with structured validation information.",
    "previousPageId": "data/item-10",
    "nextPageId": "data/item-12",
    "relatedPageIds": []
  },
  {
    "id": "data/item-12",
    "kind": "entry",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "This pure constructor returns an immutable schema synchronously; Data.decode performs the actual validation later.",
    "expectedOutcome": "An immutable schema ready to compose or pass to Data.decode.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": true,
    "useWhen": "Use Data.boolean for persisted toggles and server fields whose wire contract is genuinely Boolean. Normalize legacy encodings before this boundary or migrate them explicitly rather than relying on implicit coercion.",
    "code": "local Data = require(\"luastra/data\")\nlocal enabled = Data.boolean()",
    "signature": "Data.boolean(): Schema",
    "parameters": [],
    "returns": "Schema — an immutable runtime schema that can be composed or passed to Data.decode.",
    "name": "Data.boolean",
    "description": "Builds a strict boolean schema that accepts only true or false. It does not coerce strings such as \"true\", numeric flags, or other truthy values.",
    "previousPageId": "data/item-11",
    "nextPageId": "data/item-13",
    "relatedPageIds": []
  },
  {
    "id": "data/item-13",
    "kind": "entry",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "This pure constructor returns an immutable schema synchronously; Data.decode performs the actual validation later.",
    "expectedOutcome": "An immutable schema ready to compose or pass to Data.decode.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": true,
    "useWhen": "Use Data.array for ordered JSON-style collections with contiguous indexes and one element contract. Use Data.object for named fields or a custom migration when the input is a sparse keyed map.",
    "code": "local Data = require(\"luastra/data\")\nlocal tags = Data.array(Data.string { maxBytes = 40 }, { maxItems = 12 })",
    "signature": "Data.array(item: Schema, optionsValue: ArrayOptions?): Schema",
    "parameters": [
      {
        "name": "item",
        "values": "Schema",
        "description": "Schema applied independently to every dense array element."
      },
      {
        "name": "optionsValue",
        "values": "ArrayOptions?",
        "description": "Optional minimum and maximum item counts."
      },
      {
        "name": "optionsValue.minItems",
        "values": "integer (0..256)?",
        "description": "Minimum admitted item count; defaults to 0."
      },
      {
        "name": "optionsValue.maxItems",
        "values": "integer (0..256)?",
        "description": "Maximum admitted item count; defaults to 256."
      }
    ],
    "returns": "Schema — an immutable runtime schema that can be composed or passed to Data.decode.",
    "name": "Data.array",
    "description": "Builds a dense-array schema whose every element must satisfy the supplied item schema, with optional array-length bounds. Validation records the failing index so callers can identify malformed members.",
    "previousPageId": "data/item-12",
    "nextPageId": "data/item-14",
    "relatedPageIds": [
      "data/item-10"
    ]
  },
  {
    "id": "data/item-14",
    "kind": "entry",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "This pure constructor returns an immutable schema synchronously; Data.decode performs the actual validation later.",
    "expectedOutcome": "An immutable schema ready to compose or pass to Data.decode.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": true,
    "useWhen": "Use Data.object at storage, server, or form boundaries where several named values must be accepted together. Declare all trusted fields explicitly and decide deliberately whether unknown fields should be rejected.",
    "code": "local Data = require(\"luastra/data\")\nlocal form = Data.object({ name = Data.string { minBytes = 1 }, active = Data.boolean() })",
    "signature": "Data.object(fields: { [string]: Schema }, optionsValue: ObjectOptions?): Schema",
    "parameters": [
      {
        "name": "fields",
        "values": "{ [string]: Schema }",
        "description": "Map from each admitted field name to the schema that validates its value."
      },
      {
        "name": "optionsValue",
        "values": "ObjectOptions?",
        "description": "Optional policy controlling object validation, including unknown fields."
      },
      {
        "name": "optionsValue.exact",
        "values": "boolean?",
        "description": "Rejects undeclared keys unless explicitly set to false; defaults to true."
      }
    ],
    "returns": "Schema — an immutable runtime schema that can be composed or passed to Data.decode.",
    "name": "Data.object",
    "description": "Builds a schema for a table with named fields, validating each field through its own child schema and applying the object options for unknown keys. Nested schemas preserve a structured path to every failure.",
    "previousPageId": "data/item-13",
    "nextPageId": "data/item-15",
    "relatedPageIds": [
      "data/item-12",
      "data/item-10"
    ]
  },
  {
    "id": "data/item-15",
    "kind": "entry",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "This pure constructor returns an immutable schema synchronously; Data.decode performs the actual validation later.",
    "expectedOutcome": "An immutable schema ready to compose or pass to Data.decode.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": true,
    "useWhen": "Use Data.optional for fields that may be absent by design, not merely because validation is inconvenient. Keep required identifiers, security decisions, and version fields non-optional.",
    "code": "local Data = require(\"luastra/data\")\nlocal note = Data.optional(Data.string { maxBytes = 240 })",
    "signature": "Data.optional(schema: Schema): Schema",
    "parameters": [
      {
        "name": "schema",
        "values": "Schema",
        "description": "Schema to validate whenever the value is not nil."
      }
    ],
    "returns": "Schema — an immutable runtime schema that can be composed or passed to Data.decode.",
    "name": "Data.optional",
    "description": "Wraps another schema so nil is accepted in addition to the wrapped value. A non-nil value still passes through the complete nested validation contract.",
    "previousPageId": "data/item-14",
    "nextPageId": "data/item-16",
    "relatedPageIds": [
      "data/item-10"
    ]
  },
  {
    "id": "data/item-16",
    "kind": "entry",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "beforeYouUse": "Add luastra/data to this module's dependencies in luastra.json, then import it with require(\"luastra/data\"). No host capability is required. Define schemas outside render when they are reused.",
    "lifecycle": "Data.decode validates an untrusted value synchronously. Branch on result.success before reading result.value or result.error.",
    "expectedOutcome": "A tagged success containing a trusted value, or a failure containing a bounded code and path.",
    "failureGuidance": "Ordinary invalid input is a Data.decode failure, not an exception. Invalid schema options are programmer errors and fail immediately. String bounds count UTF-8 bytes; Data.string has no pattern option in this alpha.",
    "availability": "Current development candidate API; host-independent and synchronous.",
    "callable": true,
    "useWhen": "Use Data.decode immediately after receiving untrusted form, URL, storage, or server data and before casting it to an application type. Branch on result.success and present or log only appropriate bounded failure details.",
    "code": "local Data = require(\"luastra/data\")\nlocal validatedScore: number? = nil\nlocal result = Data.decode(\n    Data.number { integer = true, min = 0 },\n    42\n)\nif result.success then\n    validatedScore = result.value\nend",
    "signature": "Data.decode(schema: Schema, value: any): Result",
    "parameters": [
      {
        "name": "schema",
        "values": "Schema",
        "description": "Runtime schema that defines the trusted result shape."
      },
      {
        "name": "value",
        "values": "any",
        "description": "Unknown value received from a runtime boundary."
      }
    ],
    "returns": "Result — a discriminated validation result; branch on success before reading value or error.",
    "name": "Data.decode",
    "description": "Validates an unknown runtime value against a Schema and returns a discriminated Data.Result instead of throwing for ordinary invalid input. Success contains the trusted value; failure contains a bounded code and path.",
    "completeRecipe": {
      "sectionId": "recipe-form-modal",
      "title": "validate a form and confirm in a modal",
      "evidence": "authored-files",
      "description": "This checked recipe uses Data.decode inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "data/item-15",
    "nextPageId": null,
    "relatedPageIds": [
      "data/item-4",
      "data/item-11"
    ]
  },
  {
    "id": "state/item-1",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
    "beforeYouUse": "Add luastra/state to this module's dependencies in luastra.json, then import it with require(\"luastra/state\"). No capability is required for encoding, decoding, or migration. Persistence additionally needs luastra/host plus storage.get and storage.set.",
    "lifecycle": "The type describes string fields, migration functions, or tagged decode/migration results.",
    "expectedOutcome": "A checked snapshot or result annotation.",
    "failureGuidance": "Malformed data, wrong versions, missing migration steps, excessive size, or non-string fields remain explicit failure branches. Do not silently replace corrupt security- or domain-sensitive values with defaults.",
    "availability": "Current development candidate API; persistence support is host-dependent.",
    "callable": false,
    "useWhen": "Use State.Fields when annotating values that cross the public luastra/state boundary or when exporting helpers built on that module. The type documents the exact checked shape and prevents unrelated tables from being substituted accidentally.",
    "code": "export type Fields = { [string]: string }",
    "signature": "export type Fields = { [string]: string }",
    "parameters": [
      {
        "name": "[string]",
        "values": "string",
        "description": "Index signature mapping string; every key and value must satisfy this contract."
      }
    ],
    "returns": null,
    "name": "State.Fields",
    "description": "State.Fields is an exported, statically checked data contract of luastra/state. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis.",
    "previousPageId": null,
    "nextPageId": "state/item-2",
    "relatedPageIds": []
  },
  {
    "id": "state/item-2",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
    "beforeYouUse": "Add luastra/state to this module's dependencies in luastra.json, then import it with require(\"luastra/state\"). No capability is required for encoding, decoding, or migration. Persistence additionally needs luastra/host plus storage.get and storage.set.",
    "lifecycle": "The type describes string fields, migration functions, or tagged decode/migration results.",
    "expectedOutcome": "A checked snapshot or result annotation.",
    "failureGuidance": "Malformed data, wrong versions, missing migration steps, excessive size, or non-string fields remain explicit failure branches. Do not silently replace corrupt security- or domain-sensitive values with defaults.",
    "availability": "Current development candidate API; persistence support is host-dependent.",
    "callable": false,
    "useWhen": "Use State.DecodeError on the unsuccessful branch of the related result. Read its stable fields for control flow or diagnostics; do not parse human-readable assertion or error text.",
    "code": "export type DecodeError = { code: string }",
    "signature": "export type DecodeError = { code: string }",
    "parameters": [
      {
        "name": "code",
        "values": "string",
        "description": "Stable machine-readable failure code suitable for branching and diagnostics."
      }
    ],
    "returns": null,
    "name": "State.DecodeError",
    "description": "State.DecodeError represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message.",
    "previousPageId": "state/item-1",
    "nextPageId": "state/item-3",
    "relatedPageIds": []
  },
  {
    "id": "state/item-3",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
    "beforeYouUse": "Add luastra/state to this module's dependencies in luastra.json, then import it with require(\"luastra/state\"). No capability is required for encoding, decoding, or migration. Persistence additionally needs luastra/host plus storage.get and storage.set.",
    "lifecycle": "The type describes string fields, migration functions, or tagged decode/migration results.",
    "expectedOutcome": "A checked snapshot or result annotation.",
    "failureGuidance": "Malformed data, wrong versions, missing migration steps, excessive size, or non-string fields remain explicit failure branches. Do not silently replace corrupt security- or domain-sensitive values with defaults.",
    "availability": "Current development candidate API; persistence support is host-dependent.",
    "callable": false,
    "useWhen": "Use State.DecodeSuccess after narrowing the related result with success == true. Only this branch guarantees access to the decoded value and other success-specific fields.",
    "code": "export type DecodeSuccess = { success: true, version: number, fields: Fields, error: nil }",
    "signature": "export type DecodeSuccess = { success: true, version: number, fields: Fields, error: nil }",
    "parameters": [
      {
        "name": "success",
        "values": "true",
        "description": "Discriminator that must be checked before reading branch-specific fields."
      },
      {
        "name": "version",
        "values": "number",
        "description": "Explicit contract version used to validate or migrate the serialized value."
      },
      {
        "name": "fields",
        "values": "Fields",
        "description": "Validated bounded field map carried by the decoded or migrated value."
      },
      {
        "name": "error",
        "values": "nil",
        "description": "Bounded failure information, or nil on the successful branch."
      }
    ],
    "returns": null,
    "name": "State.DecodeSuccess",
    "description": "State.DecodeSuccess represents the successful branch of a discriminated SDK result. Its value and success-specific fields are safe to read only after the shared success tag has narrowed the union.",
    "previousPageId": "state/item-2",
    "nextPageId": "state/item-4",
    "relatedPageIds": []
  },
  {
    "id": "state/item-4",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
    "beforeYouUse": "Add luastra/state to this module's dependencies in luastra.json, then import it with require(\"luastra/state\"). No capability is required for encoding, decoding, or migration. Persistence additionally needs luastra/host plus storage.get and storage.set.",
    "lifecycle": "The type describes string fields, migration functions, or tagged decode/migration results.",
    "expectedOutcome": "A checked snapshot or result annotation.",
    "failureGuidance": "Malformed data, wrong versions, missing migration steps, excessive size, or non-string fields remain explicit failure branches. Do not silently replace corrupt security- or domain-sensitive values with defaults.",
    "availability": "Current development candidate API; persistence support is host-dependent.",
    "callable": false,
    "useWhen": "Use State.DecodeFailure on the unsuccessful branch of the related result. Read its stable fields for control flow or diagnostics; do not parse human-readable assertion or error text.",
    "code": "export type DecodeFailure = { success: false, version: nil, fields: nil, error: DecodeError }",
    "signature": "export type DecodeFailure = { success: false, version: nil, fields: nil, error: DecodeError }",
    "parameters": [
      {
        "name": "success",
        "values": "false",
        "description": "Discriminator that must be checked before reading branch-specific fields."
      },
      {
        "name": "version",
        "values": "nil",
        "description": "Explicit contract version used to validate or migrate the serialized value."
      },
      {
        "name": "fields",
        "values": "nil",
        "description": "Validated bounded field map carried by the decoded or migrated value."
      },
      {
        "name": "error",
        "values": "DecodeError",
        "description": "Bounded failure information, or nil on the successful branch."
      }
    ],
    "returns": null,
    "name": "State.DecodeFailure",
    "description": "State.DecodeFailure represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message.",
    "previousPageId": "state/item-3",
    "nextPageId": "state/item-5",
    "relatedPageIds": []
  },
  {
    "id": "state/item-5",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
    "beforeYouUse": "Add luastra/state to this module's dependencies in luastra.json, then import it with require(\"luastra/state\"). No capability is required for encoding, decoding, or migration. Persistence additionally needs luastra/host plus storage.get and storage.set.",
    "lifecycle": "The type describes string fields, migration functions, or tagged decode/migration results.",
    "expectedOutcome": "A checked snapshot or result annotation.",
    "failureGuidance": "Malformed data, wrong versions, missing migration steps, excessive size, or non-string fields remain explicit failure branches. Do not silently replace corrupt security- or domain-sensitive values with defaults.",
    "availability": "Current development candidate API; persistence support is host-dependent.",
    "callable": false,
    "useWhen": "Use State.DecodeResult at the boundary where untrusted or versioned input is decoded. Branch on result.success before reading value or error so both outcomes remain explicit and type-safe.",
    "code": "export type DecodeResult = DecodeSuccess | DecodeFailure",
    "signature": "export type DecodeResult = DecodeSuccess | DecodeFailure",
    "parameters": [
      {
        "name": "definition",
        "values": "DecodeSuccess | DecodeFailure",
        "description": "Exact alias, union, or callable contract represented by State.DecodeResult."
      }
    ],
    "returns": null,
    "name": "State.DecodeResult",
    "description": "State.DecodeResult is a discriminated union covering successful output and bounded failure. Branching on success narrows the value to the correct exported record and makes error handling explicit.",
    "previousPageId": "state/item-4",
    "nextPageId": "state/item-6",
    "relatedPageIds": []
  },
  {
    "id": "state/item-6",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
    "beforeYouUse": "Add luastra/state to this module's dependencies in luastra.json, then import it with require(\"luastra/state\"). No capability is required for encoding, decoding, or migration. Persistence additionally needs luastra/host plus storage.get and storage.set.",
    "lifecycle": "The type describes string fields, migration functions, or tagged decode/migration results.",
    "expectedOutcome": "A checked snapshot or result annotation.",
    "failureGuidance": "Malformed data, wrong versions, missing migration steps, excessive size, or non-string fields remain explicit failure branches. Do not silently replace corrupt security- or domain-sensitive values with defaults.",
    "availability": "Current development candidate API; persistence support is host-dependent.",
    "callable": false,
    "useWhen": "Use State.MigrationError on the unsuccessful branch of the related result. Read its stable fields for control flow or diagnostics; do not parse human-readable assertion or error text.",
    "code": "export type MigrationError = { code: string }",
    "signature": "export type MigrationError = { code: string }",
    "parameters": [
      {
        "name": "code",
        "values": "string",
        "description": "Stable machine-readable failure code suitable for branching and diagnostics."
      }
    ],
    "returns": null,
    "name": "State.MigrationError",
    "description": "State.MigrationError represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message.",
    "previousPageId": "state/item-5",
    "nextPageId": "state/item-7",
    "relatedPageIds": [
      "state/item-10"
    ]
  },
  {
    "id": "state/item-7",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
    "beforeYouUse": "Add luastra/state to this module's dependencies in luastra.json, then import it with require(\"luastra/state\"). No capability is required for encoding, decoding, or migration. Persistence additionally needs luastra/host plus storage.get and storage.set.",
    "lifecycle": "The type describes string fields, migration functions, or tagged decode/migration results.",
    "expectedOutcome": "A checked snapshot or result annotation.",
    "failureGuidance": "Malformed data, wrong versions, missing migration steps, excessive size, or non-string fields remain explicit failure branches. Do not silently replace corrupt security- or domain-sensitive values with defaults.",
    "availability": "Current development candidate API; persistence support is host-dependent.",
    "callable": false,
    "useWhen": "Use State.MigrationSuccess after narrowing the related result with success == true. Only this branch guarantees access to the decoded value and other success-specific fields.",
    "code": "export type MigrationSuccess = { success: true, version: number, fields: Fields, encoded: string, error: nil }",
    "signature": "export type MigrationSuccess = { success: true, version: number, fields: Fields, encoded: string, error: nil }",
    "parameters": [
      {
        "name": "success",
        "values": "true",
        "description": "Discriminator that must be checked before reading branch-specific fields."
      },
      {
        "name": "version",
        "values": "number",
        "description": "Explicit contract version used to validate or migrate the serialized value."
      },
      {
        "name": "fields",
        "values": "Fields",
        "description": "Validated bounded field map carried by the decoded or migrated value."
      },
      {
        "name": "encoded",
        "values": "string",
        "description": "Deterministic snapshot string produced after a successful migration."
      },
      {
        "name": "error",
        "values": "nil",
        "description": "Bounded failure information, or nil on the successful branch."
      }
    ],
    "returns": null,
    "name": "State.MigrationSuccess",
    "description": "State.MigrationSuccess represents the successful branch of a discriminated SDK result. Its value and success-specific fields are safe to read only after the shared success tag has narrowed the union.",
    "previousPageId": "state/item-6",
    "nextPageId": "state/item-8",
    "relatedPageIds": [
      "state/item-10"
    ]
  },
  {
    "id": "state/item-8",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
    "beforeYouUse": "Add luastra/state to this module's dependencies in luastra.json, then import it with require(\"luastra/state\"). No capability is required for encoding, decoding, or migration. Persistence additionally needs luastra/host plus storage.get and storage.set.",
    "lifecycle": "The type describes string fields, migration functions, or tagged decode/migration results.",
    "expectedOutcome": "A checked snapshot or result annotation.",
    "failureGuidance": "Malformed data, wrong versions, missing migration steps, excessive size, or non-string fields remain explicit failure branches. Do not silently replace corrupt security- or domain-sensitive values with defaults.",
    "availability": "Current development candidate API; persistence support is host-dependent.",
    "callable": false,
    "useWhen": "Use State.MigrationFailure on the unsuccessful branch of the related result. Read its stable fields for control flow or diagnostics; do not parse human-readable assertion or error text.",
    "code": "export type MigrationFailure = { success: false, version: nil, fields: nil, encoded: nil, error: MigrationError }",
    "signature": "export type MigrationFailure = { success: false, version: nil, fields: nil, encoded: nil, error: MigrationError }",
    "parameters": [
      {
        "name": "success",
        "values": "false",
        "description": "Discriminator that must be checked before reading branch-specific fields."
      },
      {
        "name": "version",
        "values": "nil",
        "description": "Explicit contract version used to validate or migrate the serialized value."
      },
      {
        "name": "fields",
        "values": "nil",
        "description": "Validated bounded field map carried by the decoded or migrated value."
      },
      {
        "name": "encoded",
        "values": "nil",
        "description": "Deterministic snapshot string produced after a successful migration."
      },
      {
        "name": "error",
        "values": "MigrationError",
        "description": "Bounded failure information, or nil on the successful branch."
      }
    ],
    "returns": null,
    "name": "State.MigrationFailure",
    "description": "State.MigrationFailure represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message.",
    "previousPageId": "state/item-7",
    "nextPageId": "state/item-9",
    "relatedPageIds": [
      "state/item-10"
    ]
  },
  {
    "id": "state/item-9",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
    "beforeYouUse": "Add luastra/state to this module's dependencies in luastra.json, then import it with require(\"luastra/state\"). No capability is required for encoding, decoding, or migration. Persistence additionally needs luastra/host plus storage.get and storage.set.",
    "lifecycle": "The type describes string fields, migration functions, or tagged decode/migration results.",
    "expectedOutcome": "A checked snapshot or result annotation.",
    "failureGuidance": "Malformed data, wrong versions, missing migration steps, excessive size, or non-string fields remain explicit failure branches. Do not silently replace corrupt security- or domain-sensitive values with defaults.",
    "availability": "Current development candidate API; persistence support is host-dependent.",
    "callable": false,
    "useWhen": "Use State.MigrationResult at the boundary where untrusted or versioned input is decoded. Branch on result.success before reading value or error so both outcomes remain explicit and type-safe.",
    "code": "export type MigrationResult = MigrationSuccess | MigrationFailure",
    "signature": "export type MigrationResult = MigrationSuccess | MigrationFailure",
    "parameters": [
      {
        "name": "definition",
        "values": "MigrationSuccess | MigrationFailure",
        "description": "Exact alias, union, or callable contract represented by State.MigrationResult."
      }
    ],
    "returns": null,
    "name": "State.MigrationResult",
    "description": "State.MigrationResult is a discriminated union covering successful output and bounded failure. Branching on success narrows the value to the correct exported record and makes error handling explicit.",
    "previousPageId": "state/item-8",
    "nextPageId": "state/item-10",
    "relatedPageIds": []
  },
  {
    "id": "state/item-10",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
    "beforeYouUse": "Add luastra/state to this module's dependencies in luastra.json, then import it with require(\"luastra/state\"). No capability is required for encoding, decoding, or migration. Persistence additionally needs luastra/host plus storage.get and storage.set.",
    "lifecycle": "The type describes string fields, migration functions, or tagged decode/migration results.",
    "expectedOutcome": "A checked snapshot or result annotation.",
    "failureGuidance": "Malformed data, wrong versions, missing migration steps, excessive size, or non-string fields remain explicit failure branches. Do not silently replace corrupt security- or domain-sensitive values with defaults.",
    "availability": "Current development candidate API; persistence support is host-dependent.",
    "callable": false,
    "useWhen": "Use State.Migration when annotating values that cross the public luastra/state boundary or when exporting helpers built on that module. The type documents the exact checked shape and prevents unrelated tables from being substituted accidentally.",
    "code": "export type Migration = (fields: Fields) -> Fields",
    "signature": "export type Migration = (fields: Fields) -> Fields",
    "parameters": [
      {
        "name": "definition",
        "values": "(fields: Fields) -> Fields",
        "description": "Exact alias, union, or callable contract represented by State.Migration."
      }
    ],
    "returns": null,
    "name": "State.Migration",
    "description": "State.Migration is an exported, statically checked data contract of luastra/state. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis.",
    "previousPageId": "state/item-9",
    "nextPageId": "state/item-11",
    "relatedPageIds": []
  },
  {
    "id": "state/item-11",
    "kind": "entry",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
    "beforeYouUse": "Add luastra/state to this module's dependencies in luastra.json, then import it with require(\"luastra/state\"). No capability is required for encoding, decoding, or migration. Persistence additionally needs luastra/host plus storage.get and storage.set.",
    "lifecycle": "State operations run synchronously over bounded string fields. Encode before storage; after a read, decode or migrate and branch on success before mutating trusted application state.",
    "expectedOutcome": "A deterministic encoded snapshot or a tagged success/failure result.",
    "failureGuidance": "Malformed data, wrong versions, missing migration steps, excessive size, or non-string fields remain explicit failure branches. Do not silently replace corrupt security- or domain-sensitive values with defaults.",
    "availability": "Current development candidate API; persistence support is host-dependent.",
    "callable": true,
    "useWhen": "Use State.encode immediately before Host.storageSet when small application state must survive restarts. Persist only bounded non-secret data and increment the version whenever the stored schema changes incompatibly.",
    "code": "local State = require(\"luastra/state\")\nlocal snapshot = State.encode(1, { score = tostring(score), screen = \"game\" })",
    "signature": "State.encode(version: number, fields: Fields): string",
    "parameters": [
      {
        "name": "version",
        "values": "number",
        "description": "Positive schema version written into the snapshot envelope."
      },
      {
        "name": "fields",
        "values": "Fields",
        "description": "Bounded serializable string field map representing current application state."
      }
    ],
    "returns": "string — the validated canonical string produced by this operation.",
    "name": "State.encode",
    "description": "Serializes a finite field map together with an explicit positive version into Luastra's deterministic snapshot format. The output is suitable for host storage and can be compared or migrated predictably.",
    "completeRecipe": {
      "sectionId": "recipe-storage",
      "title": "persist and restore state",
      "evidence": "authored-files",
      "description": "This checked recipe uses State.encode inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "state/item-10",
    "nextPageId": "state/item-12",
    "relatedPageIds": []
  },
  {
    "id": "state/item-12",
    "kind": "entry",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
    "beforeYouUse": "Add luastra/state to this module's dependencies in luastra.json, then import it with require(\"luastra/state\"). No capability is required for encoding, decoding, or migration. Persistence additionally needs luastra/host plus storage.get and storage.set.",
    "lifecycle": "State operations run synchronously over bounded string fields. Encode before storage; after a read, decode or migrate and branch on success before mutating trusted application state.",
    "expectedOutcome": "A deterministic encoded snapshot or a tagged success/failure result.",
    "failureGuidance": "Malformed data, wrong versions, missing migration steps, excessive size, or non-string fields remain explicit failure branches. Do not silently replace corrupt security- or domain-sensitive values with defaults.",
    "availability": "Current development candidate API; persistence support is host-dependent.",
    "callable": true,
    "useWhen": "Use State.decode after reading storage when only the current snapshot version is accepted. Branch on success before restoring fields; use State.migrate when older admitted versions must be upgraded.",
    "code": "local State = require(\"luastra/state\")\nlocal restored = State.decode(snapshot, 1)\nif restored.success then score = tonumber(restored.fields.score) or 0 end",
    "signature": "State.decode(value: string, expectedVersion: number): DecodeResult",
    "parameters": [
      {
        "name": "value",
        "values": "string",
        "description": "Untrusted serialized snapshot string read from storage or another boundary."
      },
      {
        "name": "expectedVersion",
        "values": "number",
        "description": "Only version accepted by this direct decode operation."
      }
    ],
    "returns": "DecodeResult — a discriminated decode result; branch on success before reading decoded fields or failure data.",
    "name": "State.decode",
    "description": "Parses a snapshot string, verifies its structure and version, and returns a discriminated DecodeResult. A version mismatch or malformed value remains a normal failure branch rather than becoming trusted state.",
    "completeRecipe": {
      "sectionId": "recipe-storage",
      "title": "persist and restore state",
      "evidence": "authored-files",
      "description": "This checked recipe uses State.decode inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "state/item-11",
    "nextPageId": "state/item-13",
    "relatedPageIds": []
  },
  {
    "id": "state/item-13",
    "kind": "entry",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
    "beforeYouUse": "Add luastra/state to this module's dependencies in luastra.json, then import it with require(\"luastra/state\"). No capability is required for encoding, decoding, or migration. Persistence additionally needs luastra/host plus storage.get and storage.set.",
    "lifecycle": "State operations run synchronously over bounded string fields. Encode before storage; after a read, decode or migrate and branch on success before mutating trusted application state.",
    "expectedOutcome": "A deterministic encoded snapshot or a tagged success/failure result.",
    "failureGuidance": "Malformed data, wrong versions, missing migration steps, excessive size, or non-string fields remain explicit failure branches. Do not silently replace corrupt security- or domain-sensitive values with defaults.",
    "availability": "Current development candidate API; persistence support is host-dependent.",
    "callable": true,
    "useWhen": "Use State.migrate during application startup when released versions must preserve user state across schema changes. Keep every migration deterministic, test each supported starting version, and never silently reinterpret unknown future data.",
    "code": "local State = require(\"luastra/state\")\nlocal result = State.migrate(oldSnapshot, 2, { [1] = function(fields) return { score = fields.score or \"0\" } end })",
    "signature": "State.migrate(value: string, targetVersion: number, migrationsValue: any): MigrationResult",
    "parameters": [
      {
        "name": "value",
        "values": "string",
        "description": "Untrusted serialized snapshot that may use an older supported version."
      },
      {
        "name": "targetVersion",
        "values": "number",
        "description": "Version the migration chain must reach."
      },
      {
        "name": "migrationsValue",
        "values": "any",
        "description": "Map from each supported source version to its deterministic next-version function."
      }
    ],
    "returns": "MigrationResult — the exact MigrationResult value declared by the SDK contract.",
    "name": "State.migrate",
    "description": "Decodes a snapshot and applies explicitly ordered Migration functions until it reaches the requested target version. The result records structured failure if a step is missing, invalid, or does not advance correctly.",
    "previousPageId": "state/item-12",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "navigation/item-1",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The type describes a route, stack, compiler, or checked result used by navigation operations.",
    "expectedOutcome": "A checked route/navigation annotation.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": false,
    "useWhen": "Use Navigation.Snapshot when annotating values that cross the public luastra/navigation boundary or when exporting helpers built on that module. The type documents the exact checked shape and prevents unrelated tables from being substituted accidentally.",
    "code": "export type Snapshot = { version: number, routes: { string } }",
    "signature": "export type Snapshot = { version: number, routes: { string } }",
    "parameters": [
      {
        "name": "version",
        "values": "number",
        "description": "Explicit contract version used to validate or migrate the serialized value."
      },
      {
        "name": "routes",
        "values": "{ string }",
        "description": "Ordered named-route history represented by this snapshot."
      }
    ],
    "returns": null,
    "name": "Navigation.Snapshot",
    "description": "Navigation.Snapshot is an exported, statically checked data contract of luastra/navigation. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis.",
    "previousPageId": null,
    "nextPageId": "navigation/item-2",
    "relatedPageIds": [
      "navigation/item-4",
      "navigation/item-5",
      "navigation/item-14"
    ]
  },
  {
    "id": "navigation/item-2",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The type describes a route, stack, compiler, or checked result used by navigation operations.",
    "expectedOutcome": "A checked route/navigation annotation.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": false,
    "useWhen": "Use Navigation.RestoreError on the unsuccessful branch of the related result. Read its stable fields for control flow or diagnostics; do not parse human-readable assertion or error text.",
    "code": "export type RestoreError = { code: string }",
    "signature": "export type RestoreError = { code: string }",
    "parameters": [
      {
        "name": "code",
        "values": "string",
        "description": "Stable machine-readable failure code suitable for branching and diagnostics."
      }
    ],
    "returns": null,
    "name": "Navigation.RestoreError",
    "description": "Navigation.RestoreError represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message.",
    "previousPageId": "navigation/item-1",
    "nextPageId": "navigation/item-3",
    "relatedPageIds": [
      "navigation/item-11",
      "navigation/item-13"
    ]
  },
  {
    "id": "navigation/item-3",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The type describes a route, stack, compiler, or checked result used by navigation operations.",
    "expectedOutcome": "A checked route/navigation annotation.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": false,
    "useWhen": "Use Navigation.RestoreResult for checked navigation operations. Test result.success first, then explicitly verify the optional field needed by that branch; do not assume the boolean field narrows this record as a tagged union.",
    "code": "export type RestoreResult = { success: boolean, error: RestoreError? }",
    "signature": "export type RestoreResult = { success: boolean, error: RestoreError? }",
    "parameters": [
      {
        "name": "success",
        "values": "boolean",
        "description": "Discriminator that must be checked before reading branch-specific fields."
      },
      {
        "name": "error",
        "values": "RestoreError?",
        "description": "Bounded failure information, or nil on the successful branch."
      }
    ],
    "returns": null,
    "name": "Navigation.RestoreResult",
    "description": "Navigation.RestoreResult is a result record with a boolean success field and optional success- or failure-specific fields. Check success before reading entry, location, changed, or error; the exported declaration does not encode automatic Luau union narrowing.",
    "previousPageId": "navigation/item-2",
    "nextPageId": "navigation/item-4",
    "relatedPageIds": [
      "navigation/item-11",
      "navigation/item-13"
    ]
  },
  {
    "id": "navigation/item-4",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The type describes a route, stack, compiler, or checked result used by navigation operations.",
    "expectedOutcome": "A checked route/navigation annotation.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": false,
    "useWhen": "Use Navigation.Options when a reusable variable or helper passes configuration to the related SDK operation. The exported type keeps optional and required fields aligned with the checked public contract.",
    "code": "export type Options = { routes: { string }, initial: string, maximumDepth: number? }",
    "signature": "export type Options = { routes: { string }, initial: string, maximumDepth: number? }",
    "parameters": [
      {
        "name": "routes",
        "values": "{ string }",
        "description": "Complete set of unique named routes admitted by the stack."
      },
      {
        "name": "initial",
        "values": "string",
        "description": "Route selected when the stack is first created."
      },
      {
        "name": "maximumDepth",
        "values": "number?",
        "description": "Optional upper bound preventing unbounded route history growth."
      }
    ],
    "returns": null,
    "name": "Navigation.Options",
    "description": "Navigation.Options is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted.",
    "previousPageId": "navigation/item-3",
    "nextPageId": "navigation/item-5",
    "relatedPageIds": [
      "navigation/item-14",
      "navigation/item-1"
    ]
  },
  {
    "id": "navigation/item-5",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The type describes a route, stack, compiler, or checked result used by navigation operations.",
    "expectedOutcome": "A checked route/navigation annotation.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": false,
    "useWhen": "Use Navigation.Stack as long-lived application state when navigation must survive repeated renders. Create it once, mutate it through its public methods, and render from its current route rather than rebuilding it on every render.",
    "code": "export type Stack = {\n    current: () -> string,\n    canBack: () -> boolean,\n    push: (route: string) -> boolean,\n    replace: (route: string) -> boolean,\n    back: () -> boolean,\n    snapshot: () -> Snapshot,\n    restore: (snapshot: any) -> RestoreResult,\n}",
    "signature": "export type Stack = {\n    current: () -> string,\n    canBack: () -> boolean,\n    push: (route: string) -> boolean,\n    replace: (route: string) -> boolean,\n    back: () -> boolean,\n    snapshot: () -> Snapshot,\n    restore: (snapshot: any) -> RestoreResult,\n}",
    "parameters": [
      {
        "name": "current",
        "values": "() -> string",
        "description": "Callable current member exposed by Navigation.Stack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "canBack",
        "values": "() -> boolean",
        "description": "Callable canBack member exposed by Navigation.Stack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "push",
        "values": "(route: string) -> boolean",
        "description": "Callable push member exposed by Navigation.Stack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "replace",
        "values": "(route: string) -> boolean",
        "description": "Callable replace member exposed by Navigation.Stack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "back",
        "values": "() -> boolean",
        "description": "Callable back member exposed by Navigation.Stack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "snapshot",
        "values": "() -> Snapshot",
        "description": "Callable snapshot member exposed by Navigation.Stack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "restore",
        "values": "(snapshot: any) -> RestoreResult",
        "description": "Callable restore member exposed by Navigation.Stack; invoke it through the owning contract rather than replacing internal state."
      }
    ],
    "returns": null,
    "name": "Navigation.Stack",
    "description": "Navigation.Stack is a stateful navigation contract that owns route history or translates between route entries and canonical locations. Its public methods validate mutations and return bounded results instead of exposing internal tables.",
    "previousPageId": "navigation/item-4",
    "nextPageId": "navigation/item-6",
    "relatedPageIds": [
      "navigation/item-14",
      "navigation/item-1"
    ]
  },
  {
    "id": "navigation/item-6",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The type describes a route, stack, compiler, or checked result used by navigation operations.",
    "expectedOutcome": "A checked route/navigation annotation.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": false,
    "useWhen": "Use Navigation.RouteError on the unsuccessful branch of the related result. Read its stable fields for control flow or diagnostics; do not parse human-readable assertion or error text.",
    "code": "export type RouteError = { code: string }",
    "signature": "export type RouteError = { code: string }",
    "parameters": [
      {
        "name": "code",
        "values": "string",
        "description": "Stable machine-readable failure code suitable for branching and diagnostics."
      }
    ],
    "returns": null,
    "name": "Navigation.RouteError",
    "description": "Navigation.RouteError represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message.",
    "previousPageId": "navigation/item-5",
    "nextPageId": "navigation/item-7",
    "relatedPageIds": []
  },
  {
    "id": "navigation/item-7",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The type describes a route, stack, compiler, or checked result used by navigation operations.",
    "expectedOutcome": "A checked route/navigation annotation.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": false,
    "useWhen": "Use Navigation.RouteEntry when annotating values that cross the public luastra/navigation boundary or when exporting helpers built on that module. The type documents the exact checked shape and prevents unrelated tables from being substituted accidentally.",
    "code": "export type RouteEntry = { name: string, params: { [string]: any }, query: { [string]: any } }",
    "signature": "export type RouteEntry = { name: string, params: { [string]: any }, query: { [string]: any } }",
    "parameters": [
      {
        "name": "name",
        "values": "string",
        "description": "Stable route or entry name used by navigation matching and rendering."
      },
      {
        "name": "params",
        "values": "{ [string]: any }",
        "description": "Decoded path-parameter values associated with a route entry."
      },
      {
        "name": "query",
        "values": "{ [string]: any }",
        "description": "Decoded query values associated with a route entry."
      }
    ],
    "returns": null,
    "name": "Navigation.RouteEntry",
    "description": "Navigation.RouteEntry is an exported, statically checked data contract of luastra/navigation. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis.",
    "previousPageId": "navigation/item-6",
    "nextPageId": "navigation/item-8",
    "relatedPageIds": [
      "navigation/item-9",
      "navigation/item-12",
      "navigation/item-15",
      "navigation/item-16"
    ]
  },
  {
    "id": "navigation/item-8",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The type describes a route, stack, compiler, or checked result used by navigation operations.",
    "expectedOutcome": "A checked route/navigation annotation.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": false,
    "useWhen": "Use Navigation.RouteResult for checked navigation operations. Test result.success first, then explicitly verify the optional field needed by that branch; do not assume the boolean field narrows this record as a tagged union.",
    "code": "export type RouteResult = { success: boolean, entry: RouteEntry?, location: string?, error: RouteError? }",
    "signature": "export type RouteResult = { success: boolean, entry: RouteEntry?, location: string?, error: RouteError? }",
    "parameters": [
      {
        "name": "success",
        "values": "boolean",
        "description": "Discriminator that must be checked before reading branch-specific fields."
      },
      {
        "name": "entry",
        "values": "RouteEntry?",
        "description": "Checked entry field of Navigation.RouteResult; its exact admitted type is RouteEntry?."
      },
      {
        "name": "location",
        "values": "string?",
        "description": "Canonical path and query location produced or matched by the compiler."
      },
      {
        "name": "error",
        "values": "RouteError?",
        "description": "Bounded failure information, or nil on the successful branch."
      }
    ],
    "returns": null,
    "name": "Navigation.RouteResult",
    "description": "Navigation.RouteResult is a result record with a boolean success field and optional success- or failure-specific fields. Check success before reading entry, location, changed, or error; the exported declaration does not encode automatic Luau union narrowing.",
    "previousPageId": "navigation/item-7",
    "nextPageId": "navigation/item-9",
    "relatedPageIds": []
  },
  {
    "id": "navigation/item-9",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The type describes a route, stack, compiler, or checked result used by navigation operations.",
    "expectedOutcome": "A checked route/navigation annotation.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": false,
    "useWhen": "Use Navigation.RouteCompiler as long-lived application state when navigation must survive repeated renders. Create it once, mutate it through its public methods, and render from its current route rather than rebuilding it on every render.",
    "code": "export type RouteCompiler = {\n    match: (location: string) -> RouteResult,\n    generate: (entry: any) -> RouteResult,\n    canonicalize: (location: string) -> RouteResult,\n}",
    "signature": "export type RouteCompiler = {\n    match: (location: string) -> RouteResult,\n    generate: (entry: any) -> RouteResult,\n    canonicalize: (location: string) -> RouteResult,\n}",
    "parameters": [
      {
        "name": "match",
        "values": "(location: string) -> RouteResult",
        "description": "Callable match member exposed by Navigation.RouteCompiler; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "generate",
        "values": "(entry: any) -> RouteResult",
        "description": "Callable generate member exposed by Navigation.RouteCompiler; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "canonicalize",
        "values": "(location: string) -> RouteResult",
        "description": "Callable canonicalize member exposed by Navigation.RouteCompiler; invoke it through the owning contract rather than replacing internal state."
      }
    ],
    "returns": null,
    "name": "Navigation.RouteCompiler",
    "description": "Navigation.RouteCompiler is a stateful navigation contract that owns route history or translates between route entries and canonical locations. Its public methods validate mutations and return bounded results instead of exposing internal tables.",
    "previousPageId": "navigation/item-8",
    "nextPageId": "navigation/item-10",
    "relatedPageIds": [
      "navigation/item-7",
      "navigation/item-12",
      "navigation/item-15",
      "navigation/item-16"
    ]
  },
  {
    "id": "navigation/item-10",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The type describes a route, stack, compiler, or checked result used by navigation operations.",
    "expectedOutcome": "A checked route/navigation annotation.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": false,
    "useWhen": "Use Navigation.EntrySnapshot when annotating values that cross the public luastra/navigation boundary or when exporting helpers built on that module. The type documents the exact checked shape and prevents unrelated tables from being substituted accidentally.",
    "code": "export type EntrySnapshot = { version: number, entries: { RouteEntry } }",
    "signature": "export type EntrySnapshot = { version: number, entries: { RouteEntry } }",
    "parameters": [
      {
        "name": "version",
        "values": "number",
        "description": "Explicit contract version used to validate or migrate the serialized value."
      },
      {
        "name": "entries",
        "values": "{ RouteEntry }",
        "description": "Ordered typed route-entry history represented by this snapshot."
      }
    ],
    "returns": null,
    "name": "Navigation.EntrySnapshot",
    "description": "Navigation.EntrySnapshot is an exported, statically checked data contract of luastra/navigation. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis.",
    "previousPageId": "navigation/item-9",
    "nextPageId": "navigation/item-11",
    "relatedPageIds": []
  },
  {
    "id": "navigation/item-11",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The type describes a route, stack, compiler, or checked result used by navigation operations.",
    "expectedOutcome": "A checked route/navigation annotation.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": false,
    "useWhen": "Use Navigation.MutationResult for checked navigation operations. Test result.success first, then explicitly verify the optional field needed by that branch; do not assume the boolean field narrows this record as a tagged union.",
    "code": "export type MutationResult = { success: boolean, changed: boolean, error: RouteError? }",
    "signature": "export type MutationResult = { success: boolean, changed: boolean, error: RouteError? }",
    "parameters": [
      {
        "name": "success",
        "values": "boolean",
        "description": "Discriminator that must be checked before reading branch-specific fields."
      },
      {
        "name": "changed",
        "values": "boolean",
        "description": "Whether the requested navigation mutation altered the current stack."
      },
      {
        "name": "error",
        "values": "RouteError?",
        "description": "Bounded failure information, or nil on the successful branch."
      }
    ],
    "returns": null,
    "name": "Navigation.MutationResult",
    "description": "Navigation.MutationResult is a result record with a boolean success field and optional success- or failure-specific fields. Check success before reading entry, location, changed, or error; the exported declaration does not encode automatic Luau union narrowing.",
    "previousPageId": "navigation/item-10",
    "nextPageId": "navigation/item-12",
    "relatedPageIds": [
      "navigation/item-2",
      "navigation/item-3",
      "navigation/item-13"
    ]
  },
  {
    "id": "navigation/item-12",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The type describes a route, stack, compiler, or checked result used by navigation operations.",
    "expectedOutcome": "A checked route/navigation annotation.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": false,
    "useWhen": "Use Navigation.EntryStack as long-lived application state when navigation must survive repeated renders. Create it once, mutate it through its public methods, and render from its current route rather than rebuilding it on every render.",
    "code": "export type EntryStack = {\n    current: () -> RouteEntry,\n    currentLocation: () -> string,\n    canBack: () -> boolean,\n    push: (entry: any) -> MutationResult,\n    pushLocation: (location: string) -> MutationResult,\n    replace: (entry: any) -> MutationResult,\n    replaceLocation: (location: string) -> MutationResult,\n    back: () -> boolean,\n    snapshot: () -> EntrySnapshot,\n    encode: () -> string,\n    restore: (snapshot: any) -> RestoreResult,\n    restoreEncoded: (value: string) -> RestoreResult,\n}",
    "signature": "export type EntryStack = {\n    current: () -> RouteEntry,\n    currentLocation: () -> string,\n    canBack: () -> boolean,\n    push: (entry: any) -> MutationResult,\n    pushLocation: (location: string) -> MutationResult,\n    replace: (entry: any) -> MutationResult,\n    replaceLocation: (location: string) -> MutationResult,\n    back: () -> boolean,\n    snapshot: () -> EntrySnapshot,\n    encode: () -> string,\n    restore: (snapshot: any) -> RestoreResult,\n    restoreEncoded: (value: string) -> RestoreResult,\n}",
    "parameters": [
      {
        "name": "current",
        "values": "() -> RouteEntry",
        "description": "Callable current member exposed by Navigation.EntryStack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "currentLocation",
        "values": "() -> string",
        "description": "Callable currentLocation member exposed by Navigation.EntryStack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "canBack",
        "values": "() -> boolean",
        "description": "Callable canBack member exposed by Navigation.EntryStack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "push",
        "values": "(entry: any) -> MutationResult",
        "description": "Callable push member exposed by Navigation.EntryStack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "pushLocation",
        "values": "(location: string) -> MutationResult",
        "description": "Callable pushLocation member exposed by Navigation.EntryStack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "replace",
        "values": "(entry: any) -> MutationResult",
        "description": "Callable replace member exposed by Navigation.EntryStack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "replaceLocation",
        "values": "(location: string) -> MutationResult",
        "description": "Callable replaceLocation member exposed by Navigation.EntryStack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "back",
        "values": "() -> boolean",
        "description": "Callable back member exposed by Navigation.EntryStack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "snapshot",
        "values": "() -> EntrySnapshot",
        "description": "Callable snapshot member exposed by Navigation.EntryStack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "encode",
        "values": "() -> string",
        "description": "Callable encode member exposed by Navigation.EntryStack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "restore",
        "values": "(snapshot: any) -> RestoreResult",
        "description": "Callable restore member exposed by Navigation.EntryStack; invoke it through the owning contract rather than replacing internal state."
      },
      {
        "name": "restoreEncoded",
        "values": "(value: string) -> RestoreResult",
        "description": "Callable restoreEncoded member exposed by Navigation.EntryStack; invoke it through the owning contract rather than replacing internal state."
      }
    ],
    "returns": null,
    "name": "Navigation.EntryStack",
    "description": "Navigation.EntryStack is a stateful navigation contract that owns route history or translates between route entries and canonical locations. Its public methods validate mutations and return bounded results instead of exposing internal tables.",
    "previousPageId": "navigation/item-11",
    "nextPageId": "navigation/item-13",
    "relatedPageIds": [
      "navigation/item-7",
      "navigation/item-9",
      "navigation/item-15",
      "navigation/item-16"
    ]
  },
  {
    "id": "navigation/item-13",
    "kind": "entry",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The operation updates or creates application-owned navigation state synchronously. Keep stacks and compilers outside Application.render, inspect every result.success field, then render from the accepted current entry.",
    "expectedOutcome": "A validated compiler, stack, decision, or result record; host history changes only when the application requests them separately.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": true,
    "useWhen": "Use Navigation.decideBack inside a system_back handler when several layers may consume Back. Execute the returned decision explicitly—close a modal, pop a route, delegate to history, acknowledge handled, or request exit.",
    "code": "local Navigation = require(\"luastra/navigation\")\nlocal decision = Navigation.decideBack { modalOpen = helpOpen, canBack = navigation.canBack() }",
    "signature": "Navigation.decideBack(options: any): string",
    "parameters": [
      {
        "name": "options",
        "values": "any",
        "description": "Current modal, local-stack, history, and root conditions used to choose one Back decision."
      },
      {
        "name": "options.modalOpen",
        "values": "boolean",
        "description": "Whether Back should dismiss the currently open modal first."
      },
      {
        "name": "options.canBack",
        "values": "boolean",
        "description": "Whether admitted navigation history has an earlier entry."
      }
    ],
    "returns": "string — the validated canonical string produced by this operation.",
    "name": "Navigation.decideBack",
    "description": "Evaluates the current modal, application stack, browser history, and root-exit conditions and returns the bounded Back action the application should take. It centralizes priority so platform Back behaves consistently.",
    "completeRecipe": {
      "sectionId": "recipe-history",
      "title": "synchronize Browser and system Back",
      "evidence": "authored-files",
      "description": "This checked recipe uses Navigation.decideBack inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "navigation/item-12",
    "nextPageId": "navigation/item-14",
    "relatedPageIds": [
      "navigation/item-2",
      "navigation/item-3",
      "navigation/item-11"
    ]
  },
  {
    "id": "navigation/item-14",
    "kind": "entry",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The operation updates or creates application-owned navigation state synchronously. Keep stacks and compilers outside Application.render, inspect every result.success field, then render from the accepted current entry.",
    "expectedOutcome": "A validated compiler, stack, decision, or result record; host history changes only when the application requests them separately.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": true,
    "useWhen": "Use Navigation.create for an application whose routes can be represented by stable names and optional state tokens without typed path parameters. Render from stack.current() and mutate the same stack in Application.handle.",
    "code": "local Navigation = require(\"luastra/navigation\")\nlocal navigation = Navigation.create {\n    routes = { \"home\", \"game\" },\n    initial = \"home\",\n}\nnavigation.push(\"game\")",
    "signature": "Navigation.create(options: Options): Stack",
    "parameters": [
      {
        "name": "options",
        "values": "Options",
        "description": "Allowed route names, initial route, and optional restoration settings for the named stack."
      },
      {
        "name": "options.routes",
        "values": "{string} (1..64)",
        "description": "Unique lowercase route names admitted by this stack."
      },
      {
        "name": "options.initial",
        "values": "string",
        "description": "One admitted route used as the initial stack entry."
      },
      {
        "name": "options.maximumDepth",
        "values": "integer (1..32)?",
        "description": "Optional history-depth bound; defaults to 32."
      }
    ],
    "returns": "Stack — a stateful named-route stack; create it once and call its public methods across renders.",
    "name": "Navigation.create",
    "description": "Creates a named-route stack initialized from Navigation.Options and exposes operations such as current, push, replace, back, encode, and restore. The stack is ordinary application state and survives renders when created once at module scope.",
    "previousPageId": "navigation/item-13",
    "nextPageId": "navigation/item-15",
    "relatedPageIds": [
      "navigation/item-4",
      "navigation/item-5",
      "navigation/item-1"
    ]
  },
  {
    "id": "navigation/item-15",
    "kind": "entry",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The operation updates or creates application-owned navigation state synchronously. Keep stacks and compilers outside Application.render, inspect every result.success field, then render from the accepted current entry.",
    "expectedOutcome": "A validated compiler, stack, decision, or result record; host history changes only when the application requests them separately.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": true,
    "useWhen": "Use Navigation.createRouter when each history entry needs typed route data that can later be compiled to or restored from a location. Prefer Navigation.create for a simpler name-only stack.",
    "code": "local Navigation = require(\"luastra/navigation\")\nlocal router = Navigation.createRouter {\n    compiler = compiler,\n    initial = {\n        name = \"home\",\n        params = {},\n        query = {},\n    },\n}",
    "signature": "Navigation.createRouter(options: any): EntryStack",
    "parameters": [
      {
        "name": "options",
        "values": "any",
        "description": "Route compiler, initial typed entry, and optional entry-stack settings."
      },
      {
        "name": "options.compiler",
        "values": "RouteCompiler",
        "description": "Compiler previously returned by Navigation.compile."
      },
      {
        "name": "options.initial",
        "values": "RouteEntry",
        "description": "Initial typed entry that the compiler can generate successfully."
      },
      {
        "name": "options.maximumDepth",
        "values": "integer (1..32)?",
        "description": "Optional history-depth bound; defaults to 32."
      }
    ],
    "returns": "EntryStack — a stateful typed-route stack with canonical location and snapshot operations.",
    "name": "Navigation.createRouter",
    "description": "Creates an entry-based navigation stack whose entries carry a route name, parameters, query values, and optional state. Mutations return structured results rather than relying on unchecked table shapes.",
    "completeRecipe": {
      "sectionId": "recipe-navigation",
      "title": "add typed navigation",
      "evidence": "authored-files",
      "description": "This checked recipe uses Navigation.createRouter inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "navigation/item-14",
    "nextPageId": "navigation/item-16",
    "relatedPageIds": [
      "navigation/item-7",
      "navigation/item-9",
      "navigation/item-12"
    ]
  },
  {
    "id": "navigation/item-16",
    "kind": "entry",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "beforeYouUse": "Add luastra/navigation to this module's dependencies in luastra.json, then import it with require(\"luastra/navigation\"). No host capability is required for in-memory navigation. Browser URL/history synchronization additionally needs luastra/host and navigation.history.",
    "lifecycle": "The operation updates or creates application-owned navigation state synchronously. Keep stacks and compilers outside Application.render, inspect every result.success field, then render from the accepted current entry.",
    "expectedOutcome": "A validated compiler, stack, decision, or result record; host history changes only when the application requests them separately.",
    "failureGuidance": "Invalid definitions, unknown routes, malformed parameters, excessive history depth, or incompatible snapshots return bounded errors or fail construction. Navigation result records use success:boolean with optional fields, so verify the field you need after checking success.",
    "availability": "Current development candidate API; URL integration is a separate host capability.",
    "callable": true,
    "useWhen": "Use Navigation.compile once at module initialization when web URLs or deep links must share one source of truth with application routes. Generate links through the compiler and validate incoming locations before changing the navigation stack.",
    "code": "local Navigation = require(\"luastra/navigation\")\nlocal compiler = Navigation.compile {\n    { name = \"home\", path = \"/\" },\n    { name = \"card\", path = \"/card/:id\" },\n}",
    "signature": "Navigation.compile(definitionsValue: any): RouteCompiler",
    "parameters": [
      {
        "name": "definitionsValue",
        "values": "any",
        "description": "Dense route-definition array containing unique names and canonical path templates."
      }
    ],
    "returns": "RouteCompiler — a reusable compiler for matching, generating, and canonicalizing admitted route locations.",
    "name": "Navigation.compile",
    "description": "Compiles route definitions into a RouteCompiler that generates canonical locations and matches incoming path and query strings back to typed route entries. Invalid definitions and malformed locations produce bounded route errors.",
    "completeRecipe": {
      "sectionId": "recipe-navigation",
      "title": "add typed navigation",
      "evidence": "authored-files",
      "description": "This checked recipe uses Navigation.compile inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "navigation/item-15",
    "nextPageId": null,
    "relatedPageIds": [
      "navigation/item-7",
      "navigation/item-9",
      "navigation/item-12"
    ]
  },
  {
    "id": "timer/item-1",
    "kind": "type",
    "sectionId": "timer",
    "sectionTitle": "Application timers",
    "module": "luastra/timer",
    "beforeYouUse": "Add luastra/timer to this module's dependencies in luastra.json, then import it with require(\"luastra/timer\"). Declare timer.control in luastra.json and implement Application.handle for timer events. The maximum delay is 60,000 ms.",
    "lifecycle": "Timer types describe the options or acknowledgement identifier.",
    "expectedOutcome": "A checked timer option or acknowledgement annotation.",
    "failureGuidance": "Missing timer.control, an invalid lowercase timer id, a delay outside 0..60000, or an oversized value fails before a timer event is scheduled. Treat late events as stale if the owning state has already changed.",
    "availability": "Current development candidate API; exact background timing remains host-dependent.",
    "callable": false,
    "useWhen": "Use Timer.RequestId when recording the acknowledgement returned by start, restart, or cancel. Do not wait for Application.resolve: the timer expiry is delivered as a timer event to Application.handle.",
    "code": "export type RequestId = number",
    "signature": "export type RequestId = number",
    "parameters": [
      {
        "name": "definition",
        "values": "number",
        "description": "Exact alias, union, or callable contract represented by Timer.RequestId."
      }
    ],
    "returns": null,
    "name": "Timer.RequestId",
    "description": "Timer.RequestId is the numeric acknowledgement returned by a timer control call. It confirms that the command crossed the SDK boundary, while the stable string timer ID identifies the later expiry delivered to Application.handle.",
    "previousPageId": null,
    "nextPageId": "timer/item-2",
    "relatedPageIds": [
      "timer/item-3",
      "timer/item-4",
      "timer/item-5"
    ]
  },
  {
    "id": "timer/item-2",
    "kind": "type",
    "sectionId": "timer",
    "sectionTitle": "Application timers",
    "module": "luastra/timer",
    "beforeYouUse": "Add luastra/timer to this module's dependencies in luastra.json, then import it with require(\"luastra/timer\"). Declare timer.control in luastra.json and implement Application.handle for timer events. The maximum delay is 60,000 ms.",
    "lifecycle": "Timer types describe the options or acknowledgement identifier.",
    "expectedOutcome": "A checked timer option or acknowledgement annotation.",
    "failureGuidance": "Missing timer.control, an invalid lowercase timer id, a delay outside 0..60000, or an oversized value fails before a timer event is scheduled. Treat late events as stale if the owning state has already changed.",
    "availability": "Current development candidate API; exact background timing remains host-dependent.",
    "callable": false,
    "useWhen": "Use Timer.StartOptions when a reusable variable or helper passes configuration to the related SDK operation. The exported type keeps optional and required fields aligned with the checked public contract.",
    "code": "export type StartOptions = {\n    id: string,\n    delayMs: number,\n    value: string?,\n}",
    "signature": "export type StartOptions = {\n    id: string,\n    delayMs: number,\n    value: string?,\n}",
    "parameters": [
      {
        "name": "id",
        "values": "string",
        "description": "Stable logical timer ID later delivered as the timer event target."
      },
      {
        "name": "delayMs",
        "values": "number",
        "description": "Non-negative one-shot delay before Application.handle receives the event."
      },
      {
        "name": "value",
        "values": "string?",
        "description": "Optional bounded value delivered with the timer event."
      }
    ],
    "returns": null,
    "name": "Timer.StartOptions",
    "description": "Timer.StartOptions is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted.",
    "previousPageId": "timer/item-1",
    "nextPageId": "timer/item-3",
    "relatedPageIds": [
      "timer/item-4",
      "timer/item-5"
    ]
  },
  {
    "id": "timer/item-3",
    "kind": "entry",
    "sectionId": "timer",
    "sectionTitle": "Application timers",
    "module": "luastra/timer",
    "beforeYouUse": "Add luastra/timer to this module's dependencies in luastra.json, then import it with require(\"luastra/timer\"). Declare timer.control in luastra.json and implement Application.handle for timer events. The maximum delay is 60,000 ms.",
    "lifecycle": "start, restart, and cancel return an acknowledgement RequestId, but timer.control completions are intentionally not delivered to Application.resolve. A one-shot expiry arrives later as Application.handle(\"timer\", timerId, value).",
    "expectedOutcome": "The requested timer operation is acknowledged; an uncancelled start or restart later emits one timer event.",
    "failureGuidance": "Missing timer.control, an invalid lowercase timer id, a delay outside 0..60000, or an oversized value fails before a timer event is scheduled. Treat late events as stale if the owning state has already changed.",
    "availability": "Current development candidate API; exact background timing remains host-dependent.",
    "callable": true,
    "useWhen": "Use Timer.start for delayed transitions, temporary feedback, debouncing, or advancing a game after the user has had time to see a result. Choose a stable purpose-specific ID and handle repeated starts deliberately rather than creating unbounded timers.",
    "code": "local Timer = require(\"luastra/timer\")\nTimer.start { id = \"game/next-card\", delayMs = 1500, value = \"advance\" }",
    "signature": "Timer.start(options: StartOptions): RequestId",
    "parameters": [
      {
        "name": "options",
        "values": "StartOptions",
        "description": "Stable timer ID, bounded delay in milliseconds, and optional event value."
      },
      {
        "name": "options.id",
        "values": "string",
        "description": "Stable lowercase path ID delivered with the one-shot timer event."
      },
      {
        "name": "options.delayMs",
        "values": "integer (0..60000)",
        "description": "Delay before delivery, in milliseconds."
      },
      {
        "name": "options.value",
        "values": "string?",
        "description": "Optional bounded value delivered with the timer event."
      }
    ],
    "returns": "RequestId — an opaque acknowledgement token for the timer control request. Timer acknowledgements do not enter Application.resolve; an uncancelled expiry arrives through Application.handle.",
    "name": "Timer.start",
    "description": "Registers a one-shot timer under the supplied stable string ID and returns an acknowledgement RequestId. After the delay, Luastra sends handle(\"timer\", id, value); it does not call Application.resolve for expiry.",
    "completeRecipe": {
      "sectionId": "recipe-timer",
      "title": "run a delayed action",
      "evidence": "authored-files",
      "description": "This checked recipe uses Timer.start inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "timer/item-2",
    "nextPageId": "timer/item-4",
    "relatedPageIds": [
      "timer/item-1",
      "timer/item-5"
    ]
  },
  {
    "id": "timer/item-4",
    "kind": "entry",
    "sectionId": "timer",
    "sectionTitle": "Application timers",
    "module": "luastra/timer",
    "beforeYouUse": "Add luastra/timer to this module's dependencies in luastra.json, then import it with require(\"luastra/timer\"). Declare timer.control in luastra.json and implement Application.handle for timer events. The maximum delay is 60,000 ms.",
    "lifecycle": "start, restart, and cancel return an acknowledgement RequestId, but timer.control completions are intentionally not delivered to Application.resolve. A one-shot expiry arrives later as Application.handle(\"timer\", timerId, value).",
    "expectedOutcome": "The requested timer operation is acknowledged; an uncancelled start or restart later emits one timer event.",
    "failureGuidance": "Missing timer.control, an invalid lowercase timer id, a delay outside 0..60000, or an oversized value fails before a timer event is scheduled. Treat late events as stale if the owning state has already changed.",
    "availability": "Current development candidate API; exact background timing remains host-dependent.",
    "callable": true,
    "useWhen": "Use Timer.restart for inactivity deadlines, search debounce, and any timeout whose countdown must begin again after a new event. Use start for a new logical timer and cancel when the pending work is no longer relevant.",
    "code": "local Timer = require(\"luastra/timer\")\nTimer.restart { id = \"game/next-card\", delayMs = 1500, value = \"advance\" }",
    "signature": "Timer.restart(options: StartOptions): RequestId",
    "parameters": [
      {
        "name": "options",
        "values": "StartOptions",
        "description": "Replacement delay and value for the pending timer with the same stable ID."
      },
      {
        "name": "options.id",
        "values": "string",
        "description": "Existing or new stable timer ID to replace atomically."
      },
      {
        "name": "options.delayMs",
        "values": "integer (0..60000)",
        "description": "Fresh delay before the replacement timer fires."
      },
      {
        "name": "options.value",
        "values": "string?",
        "description": "Optional bounded value delivered with the replacement event."
      }
    ],
    "returns": "RequestId — an opaque acknowledgement token for the timer control request. Timer acknowledgements do not enter Application.resolve; an uncancelled expiry arrives through Application.handle.",
    "name": "Timer.restart",
    "description": "Replaces the pending one-shot timer with the same ID and schedules a fresh delay and value. This makes repeated input postpone one logical deadline instead of allowing several expiries to race.",
    "previousPageId": "timer/item-3",
    "nextPageId": "timer/item-5",
    "relatedPageIds": [
      "timer/item-1",
      "timer/item-2"
    ]
  },
  {
    "id": "timer/item-5",
    "kind": "entry",
    "sectionId": "timer",
    "sectionTitle": "Application timers",
    "module": "luastra/timer",
    "beforeYouUse": "Add luastra/timer to this module's dependencies in luastra.json, then import it with require(\"luastra/timer\"). Declare timer.control in luastra.json and implement Application.handle for timer events. The maximum delay is 60,000 ms.",
    "lifecycle": "start, restart, and cancel return an acknowledgement RequestId, but timer.control completions are intentionally not delivered to Application.resolve. A one-shot expiry arrives later as Application.handle(\"timer\", timerId, value).",
    "expectedOutcome": "The requested timer operation is acknowledged; an uncancelled start or restart later emits one timer event.",
    "failureGuidance": "Missing timer.control, an invalid lowercase timer id, a delay outside 0..60000, or an oversized value fails before a timer event is scheduled. Treat late events as stale if the owning state has already changed.",
    "availability": "Current development candidate API; exact background timing remains host-dependent.",
    "callable": true,
    "useWhen": "Use Timer.cancel when leaving the owning screen, completing work early, or replacing an automatic transition with a user decision. Cancellation should be safe even if application state has already moved on.",
    "code": "local Timer = require(\"luastra/timer\")\nTimer.cancel(\"game/next-card\")",
    "signature": "Timer.cancel(id: string): RequestId",
    "parameters": [
      {
        "name": "id",
        "values": "string",
        "description": "Stable string ID of the pending logical timer to cancel."
      }
    ],
    "returns": "RequestId — an opaque acknowledgement token for the timer control request. Timer acknowledgements do not enter Application.resolve; an uncancelled expiry arrives through Application.handle.",
    "name": "Timer.cancel",
    "description": "Cancels the pending timer identified by the stable string ID and returns a request acknowledgement. A successfully cancelled timer will not later emit its timer event.",
    "previousPageId": "timer/item-4",
    "nextPageId": null,
    "relatedPageIds": [
      "timer/item-1",
      "timer/item-2",
      "timer/item-3"
    ]
  },
  {
    "id": "host/item-1",
    "kind": "type",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "beforeYouUse": "Add luastra/host to this module's dependencies in luastra.json, then import it with require(\"luastra/host\"). Declare the capability named on the function page in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.",
    "lifecycle": "Host.RequestId is an opaque correlation value for one asynchronous host operation.",
    "expectedOutcome": "An opaque positive request identifier used only for correlation.",
    "failureGuidance": "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
    "availability": "Current development candidate capability API; verify each claimed host independently.",
    "callable": false,
    "useWhen": "Use Host.RequestId as the key in a pending-operation map after starting an asynchronous Host request. Match and remove that key in Application.resolve instead of relying on completion order.",
    "code": "export type RequestId = number",
    "signature": "export type RequestId = number",
    "parameters": [
      {
        "name": "definition",
        "values": "number",
        "description": "Exact alias, union, or callable contract represented by Host.RequestId."
      }
    ],
    "returns": null,
    "name": "Host.RequestId",
    "description": "Host.RequestId is an opaque numeric identifier allocated for one asynchronous operation. Store it with the operation's purpose so Application.resolve can correlate out-of-order completions without inspecting payload text.",
    "previousPageId": null,
    "nextPageId": "host/item-2",
    "relatedPageIds": []
  },
  {
    "id": "host/item-2",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "beforeYouUse": "Add luastra/host to this module's dependencies in luastra.json, then import it with require(\"luastra/host\"). Declare storage.get in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.",
    "lifecycle": "The function starts an asynchronous host request and returns immediately. Application.resolve receives its success payload or stable failure code; availability and permission can vary by host.",
    "expectedOutcome": "A RequestId now, followed later by one matching Application.resolve completion.",
    "failureGuidance": "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
    "availability": "Current development candidate capability API; verify each claimed host independently.",
    "callable": true,
    "useWhen": "Use Host.storageGet during startup or on demand for small persisted application data. Record the RequestId before returning, distinguish missing data from other failures, and decode the payload before trusting it.",
    "code": "local Host = require(\"luastra/host\")\nlocal requestId = Host.storageGet(\"game-state\")",
    "signature": "Host.storageGet(name: string): RequestId",
    "parameters": [
      {
        "name": "name",
        "values": "string",
        "description": "Stable application-owned storage key to read."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.storageGet",
    "description": "Starts an asynchronous read of the named host storage entry and returns a RequestId. Completion arrives in Application.resolve with the stored string or a bounded failure code.",
    "completeRecipe": {
      "sectionId": "recipe-storage",
      "title": "persist and restore state",
      "evidence": "authored-files",
      "description": "This checked recipe uses Host.storageGet inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "host/item-1",
    "nextPageId": "host/item-3",
    "relatedPageIds": []
  },
  {
    "id": "host/item-3",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "beforeYouUse": "Add luastra/host to this module's dependencies in luastra.json, then import it with require(\"luastra/host\"). Declare storage.set in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.",
    "lifecycle": "The function starts an asynchronous host request and returns immediately. Application.resolve receives its success payload or stable failure code; availability and permission can vary by host.",
    "expectedOutcome": "A RequestId now, followed later by one matching Application.resolve completion.",
    "failureGuidance": "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
    "availability": "Current development candidate capability API; verify each claimed host independently.",
    "callable": true,
    "useWhen": "Use Host.storageSet after State.encode or another explicit serialization step. Track the RequestId when UI must report save progress or failure, and never store credentials merely because the API accepts a string.",
    "code": "local Host = require(\"luastra/host\")\nlocal requestId = Host.storageSet(\"game-state\", snapshot)",
    "signature": "Host.storageSet(name: string, value: string): RequestId",
    "parameters": [
      {
        "name": "name",
        "values": "string",
        "description": "Stable application-owned storage key to write."
      },
      {
        "name": "value",
        "values": "string",
        "description": "Bounded serialized value to persist."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.storageSet",
    "description": "Starts an asynchronous write of a bounded string to the named host storage entry and returns a RequestId. Resolve confirms whether the host committed the value.",
    "completeRecipe": {
      "sectionId": "recipe-storage",
      "title": "persist and restore state",
      "evidence": "authored-files",
      "description": "This checked recipe uses Host.storageSet inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "host/item-2",
    "nextPageId": "host/item-4",
    "relatedPageIds": []
  },
  {
    "id": "host/item-4",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "beforeYouUse": "Add luastra/host to this module's dependencies in luastra.json, then import it with require(\"luastra/host\"). Declare app.launchurl.get in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.",
    "lifecycle": "The function starts an asynchronous host request and returns immediately. Application.resolve receives its success payload or stable failure code; availability and permission can vary by host.",
    "expectedOutcome": "A RequestId now, followed later by one matching Application.resolve completion.",
    "failureGuidance": "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
    "availability": "Current development candidate capability API; verify each claimed host independently.",
    "callable": true,
    "useWhen": "Use Host.launchUrl during startup when a deep link or host-provided launch location must select initial application state. Save the RequestId, validate the resolve payload before routing, and use UI.Link—not Host.launchUrl—to open a visible external HTTPS link.",
    "code": "local Host = require(\"luastra/host\")\nlocal launchRequestId = Host.launchUrl()\n\nfunction Application.resolve(id: number, success: boolean, payload: string)\n    if id == launchRequestId and success then applyLaunchLocation(payload) end\nend",
    "signature": "Host.launchUrl(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.launchUrl",
    "description": "Requests the URL or fragment with which the host launched the application and returns a RequestId. The host answers through Application.resolve; this function reads launch context and never opens an external destination.",
    "previousPageId": "host/item-3",
    "nextPageId": "host/item-5",
    "relatedPageIds": []
  },
  {
    "id": "host/item-5",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "beforeYouUse": "Add luastra/host to this module's dependencies in luastra.json, then import it with require(\"luastra/host\"). Declare clipboard.write in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.",
    "lifecycle": "The function starts an asynchronous host request and returns immediately. Application.resolve receives its success payload or stable failure code; availability and permission can vary by host.",
    "expectedOutcome": "A RequestId now, followed later by one matching Application.resolve completion.",
    "failureGuidance": "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
    "availability": "Current development candidate capability API; verify each claimed host independently.",
    "callable": true,
    "useWhen": "Use Host.clipboardWrite after a clear user action such as Copy code or Copy link. Confirm success accessibly when useful and avoid copying secrets or personal data without an explicit user expectation.",
    "code": "local Host = require(\"luastra/host\")\nlocal requestId = Host.clipboardWrite(\"luastra check\")",
    "signature": "Host.clipboardWrite(value: string): RequestId",
    "parameters": [
      {
        "name": "value",
        "values": "string",
        "description": "Bounded text copied after an explicit user action."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.clipboardWrite",
    "description": "Requests that the host place a bounded string on the system clipboard and returns a RequestId for completion. Clipboard access remains an explicit capability rather than a hidden side effect.",
    "previousPageId": "host/item-4",
    "nextPageId": "host/item-6",
    "relatedPageIds": []
  },
  {
    "id": "host/item-6",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "beforeYouUse": "Add luastra/host to this module's dependencies in luastra.json, then import it with require(\"luastra/host\"). Declare navigation.history in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.",
    "lifecycle": "The function starts an asynchronous host request and returns immediately. Application.resolve receives its success payload or stable failure code; availability and permission can vary by host.",
    "expectedOutcome": "A RequestId now, followed later by one matching Application.resolve completion.",
    "failureGuidance": "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
    "availability": "Current development candidate capability API; verify each claimed host independently.",
    "callable": true,
    "useWhen": "Use Host.historyPush when application navigation should create a Back destination without changing the visible URL. Prefer historyPushLocation when the route also has a canonical location.",
    "code": "local Host = require(\"luastra/host\")\nHost.historyPush(router.encode())",
    "signature": "Host.historyPush(stateToken: string): RequestId",
    "parameters": [
      {
        "name": "stateToken",
        "values": "string",
        "description": "Opaque encoded application-navigation state for the new history entry."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.historyPush",
    "description": "Adds a new browser-history entry with the supplied opaque application state token while retaining the current location. The asynchronous acknowledgement is delivered through Application.resolve.",
    "previousPageId": "host/item-5",
    "nextPageId": "host/item-7",
    "relatedPageIds": [
      "host/item-8"
    ]
  },
  {
    "id": "host/item-7",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "beforeYouUse": "Add luastra/host to this module's dependencies in luastra.json, then import it with require(\"luastra/host\"). Declare navigation.history in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.",
    "lifecycle": "The function starts an asynchronous host request and returns immediately. Application.resolve receives its success payload or stable failure code; availability and permission can vary by host.",
    "expectedOutcome": "A RequestId now, followed later by one matching Application.resolve completion.",
    "failureGuidance": "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
    "availability": "Current development candidate capability API; verify each claimed host independently.",
    "callable": true,
    "useWhen": "Use Host.historyReplace when correcting or initializing the current entry so Back should not revisit the previous state. Use push for a user-visible navigation step.",
    "code": "local Host = require(\"luastra/host\")\nHost.historyReplace(router.encode())",
    "signature": "Host.historyReplace(stateToken: string): RequestId",
    "parameters": [
      {
        "name": "stateToken",
        "values": "string",
        "description": "Opaque encoded state replacing the current history entry."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.historyReplace",
    "description": "Replaces the current browser-history state token without adding a new Back entry. It keeps the current location and returns a RequestId for host acknowledgement.",
    "previousPageId": "host/item-6",
    "nextPageId": "host/item-8",
    "relatedPageIds": []
  },
  {
    "id": "host/item-8",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "beforeYouUse": "Add luastra/host to this module's dependencies in luastra.json, then import it with require(\"luastra/host\"). Declare navigation.history in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.",
    "lifecycle": "The function starts an asynchronous host request and returns immediately. Application.resolve receives its success payload or stable failure code; availability and permission can vary by host.",
    "expectedOutcome": "A RequestId now, followed later by one matching Application.resolve completion.",
    "failureGuidance": "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
    "availability": "Current development candidate capability API; verify each claimed host independently.",
    "callable": true,
    "useWhen": "Use Host.historyPushLocation after a successful typed route mutation that should be reversible with Back. Generate the location through Navigation.compile rather than concatenating untrusted path or query fragments.",
    "code": "local Host = require(\"luastra/host\")\nHost.historyPushLocation(\"#/card/red\", router.encode())",
    "signature": "Host.historyPushLocation(location: string, stateToken: string): RequestId",
    "parameters": [
      {
        "name": "location",
        "values": "string",
        "description": "Canonical admitted location for the new entry."
      },
      {
        "name": "stateToken",
        "values": "string",
        "description": "Opaque encoded application state associated with that location."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.historyPushLocation",
    "description": "Adds a browser-history entry containing both a canonical location and an opaque application state token, then returns the document viewport to its start. This keeps the address bar, deep-link representation, application stack, and newly opened page position synchronized.",
    "completeRecipe": {
      "sectionId": "recipe-history",
      "title": "synchronize Browser and system Back",
      "evidence": "authored-files",
      "description": "This checked recipe uses Host.historyPushLocation inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "host/item-7",
    "nextPageId": "host/item-9",
    "relatedPageIds": [
      "host/item-6"
    ]
  },
  {
    "id": "host/item-9",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "beforeYouUse": "Add luastra/host to this module's dependencies in luastra.json, then import it with require(\"luastra/host\"). Declare navigation.history in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.",
    "lifecycle": "The function starts an asynchronous host request and returns immediately. Application.resolve receives its success payload or stable failure code; availability and permission can vary by host.",
    "expectedOutcome": "A RequestId now, followed later by one matching Application.resolve completion.",
    "failureGuidance": "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
    "availability": "Current development candidate capability API; verify each claimed host independently.",
    "callable": true,
    "useWhen": "Use Host.historyReplaceLocation for redirects, canonicalization, and restoring the initial route when the obsolete location should not remain reachable through Back.",
    "code": "local Host = require(\"luastra/host\")\nHost.historyReplaceLocation(\"#/\", router.encode())",
    "signature": "Host.historyReplaceLocation(location: string, stateToken: string): RequestId",
    "parameters": [
      {
        "name": "location",
        "values": "string",
        "description": "Canonical admitted replacement location."
      },
      {
        "name": "stateToken",
        "values": "string",
        "description": "Opaque encoded application state associated with that location."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.historyReplaceLocation",
    "description": "Replaces the current browser-history location and state token without extending the Back stack, then returns the document viewport to its start. The host validates and acknowledges the requested history mutation asynchronously.",
    "completeRecipe": {
      "sectionId": "recipe-history",
      "title": "synchronize Browser and system Back",
      "evidence": "authored-files",
      "description": "This checked recipe uses Host.historyReplaceLocation inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "host/item-8",
    "nextPageId": "host/item-10",
    "relatedPageIds": [
      "host/item-7"
    ]
  },
  {
    "id": "host/item-10",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "beforeYouUse": "Add luastra/host to this module's dependencies in luastra.json, then import it with require(\"luastra/host\"). Declare navigation.history in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.",
    "lifecycle": "The function starts an asynchronous host request and returns immediately. Application.resolve receives its success payload or stable failure code; availability and permission can vary by host.",
    "expectedOutcome": "A RequestId now, followed later by one matching Application.resolve completion.",
    "failureGuidance": "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
    "availability": "Current development candidate capability API; verify each claimed host independently.",
    "callable": true,
    "useWhen": "Use Host.historyBack after Navigation.decideBack delegates to browser history or when a UI Back control intentionally mirrors browser Back. Do not also pop application state independently unless the history event contract requires it.",
    "code": "local Host = require(\"luastra/host\")\nHost.historyBack()",
    "signature": "Host.historyBack(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.historyBack",
    "description": "Requests one step back in the host browser history and returns a RequestId. The resulting location or system-Back event remains part of the normal navigation event flow.",
    "previousPageId": "host/item-9",
    "nextPageId": "host/item-11",
    "relatedPageIds": []
  },
  {
    "id": "host/item-11",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "beforeYouUse": "Add luastra/host to this module's dependencies in luastra.json, then import it with require(\"luastra/host\"). Declare navigation.history in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.",
    "lifecycle": "The function starts an asynchronous host request and returns immediately. Application.resolve receives its success payload or stable failure code; availability and permission can vary by host.",
    "expectedOutcome": "A RequestId now, followed later by one matching Application.resolve completion.",
    "failureGuidance": "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
    "availability": "Current development candidate capability API; verify each claimed host independently.",
    "callable": true,
    "useWhen": "Use Host.historyCurrent at startup or after an external history change when the application must match the browser's current entry. Validate and compile the returned location before rendering a route.",
    "code": "local Host = require(\"luastra/host\")\nlocal requestId = Host.historyCurrent()",
    "signature": "Host.historyCurrent(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.historyCurrent",
    "description": "Requests the host's current location and associated state token, returning a RequestId whose payload can initialize or reconcile application navigation.",
    "previousPageId": "host/item-10",
    "nextPageId": "host/item-12",
    "relatedPageIds": []
  },
  {
    "id": "host/item-12",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "beforeYouUse": "Add luastra/host to this module's dependencies in luastra.json, then import it with require(\"luastra/host\"). Declare navigation.history in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.",
    "lifecycle": "The function starts an asynchronous host request and returns immediately. Application.resolve receives its success payload or stable failure code; availability and permission can vary by host.",
    "expectedOutcome": "A RequestId now, followed later by one matching Application.resolve completion.",
    "failureGuidance": "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
    "availability": "Current development candidate capability API; verify each claimed host independently.",
    "callable": true,
    "useWhen": "Use Host.systemBackHandled after closing an open modal or handling Back entirely in application state. Call it once for the current intent after the state change has been accepted.",
    "code": "local Host = require(\"luastra/host\")\nHost.systemBackHandled(intentId)",
    "signature": "Host.systemBackHandled(intentId: number): RequestId",
    "parameters": [
      {
        "name": "intentId",
        "values": "number",
        "description": "ID of the pending system-Back intent consumed by application state."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.systemBackHandled",
    "description": "Acknowledges that the application consumed a specific system-Back intent without delegating to browser history or exiting. The intent ID prevents an unrelated or stale Back request from being acknowledged.",
    "previousPageId": "host/item-11",
    "nextPageId": "host/item-13",
    "relatedPageIds": []
  },
  {
    "id": "host/item-13",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "beforeYouUse": "Add luastra/host to this module's dependencies in luastra.json, then import it with require(\"luastra/host\"). Declare navigation.history in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.",
    "lifecycle": "The function starts an asynchronous host request and returns immediately. Application.resolve receives its success payload or stable failure code; availability and permission can vary by host.",
    "expectedOutcome": "A RequestId now, followed later by one matching Application.resolve completion.",
    "failureGuidance": "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
    "availability": "Current development candidate capability API; verify each claimed host independently.",
    "callable": true,
    "useWhen": "Use Host.systemBackHistory when Navigation.decideBack determines that browser or host history owns the next Back step. Do not use it when an application modal or local route must close first.",
    "code": "local Host = require(\"luastra/host\")\nHost.systemBackHistory(intentId)",
    "signature": "Host.systemBackHistory(intentId: number): RequestId",
    "parameters": [
      {
        "name": "intentId",
        "values": "number",
        "description": "ID of the pending system-Back intent delegated to host history."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.systemBackHistory",
    "description": "Delegates a specific system-Back intent to the host history mechanism and returns a RequestId. It preserves platform navigation behavior when an earlier history entry is available.",
    "completeRecipe": {
      "sectionId": "recipe-history",
      "title": "synchronize Browser and system Back",
      "evidence": "authored-files",
      "description": "This checked recipe uses Host.systemBackHistory inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "host/item-12",
    "nextPageId": "host/item-14",
    "relatedPageIds": []
  },
  {
    "id": "host/item-14",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "beforeYouUse": "Add luastra/host to this module's dependencies in luastra.json, then import it with require(\"luastra/host\"). Declare navigation.history in luastra.json. Save the returned RequestId with its purpose and implement Application.resolve.",
    "lifecycle": "The function starts an asynchronous host request and returns immediately. Application.resolve receives its success payload or stable failure code; availability and permission can vary by host.",
    "expectedOutcome": "A RequestId now, followed later by one matching Application.resolve completion.",
    "failureGuidance": "Undeclared capability, unavailable host support, denied permission, invalid input, deadline, network, or internal failure reaches the bounded failure path. Public completion codes are CANCELLED, DEADLINE, FORBIDDEN, INTERNAL, NETWORK, UNAUTHORIZED, and VALIDATION.",
    "availability": "Current development candidate capability API; verify each claimed host independently.",
    "callable": true,
    "useWhen": "Use Host.systemBackExit only when no modal, local route, or history entry can consume Back and the platform permits root exit. Desktop and web hosts may interpret this boundary differently.",
    "code": "local Host = require(\"luastra/host\")\nHost.systemBackExit(intentId)",
    "signature": "Host.systemBackExit(intentId: number): RequestId",
    "parameters": [
      {
        "name": "intentId",
        "values": "number",
        "description": "ID of the pending root-level system-Back intent requesting exit."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.systemBackExit",
    "description": "Acknowledges a root-level system-Back intent by requesting the host's admitted exit behavior. The intent ID correlates the decision with the exact pending Back event.",
    "completeRecipe": {
      "sectionId": "recipe-history",
      "title": "synchronize Browser and system Back",
      "evidence": "authored-files",
      "description": "This checked recipe uses Host.systemBackExit inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "host/item-13",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "server/item-1",
    "kind": "type",
    "sectionId": "server",
    "sectionTitle": "Server functions",
    "module": "luastra/server",
    "beforeYouUse": "Add luastra/server to this module's dependencies in luastra.json, then import it with require(\"luastra/server\"). Declare rpc.call in luastra.json. Server.call also requires a declared backend operation and deployed trusted handler; save its RequestId and implement Application.resolve.",
    "lifecycle": "The type describes request options or the tagged envelope-decoding result.",
    "expectedOutcome": "A checked request/result annotation.",
    "failureGuidance": "Handle transport failure, envelope decode failure, and domain validation failure separately. The static web build does not deploy trusted backend handlers, credentials, or production operations for you.",
    "availability": "Current development candidate API; production backend deployment remains application-owned.",
    "callable": false,
    "useWhen": "Use Server.RequestId as the key in a pending-operation map after starting an asynchronous Server request. Match and remove that key in Application.resolve instead of relying on completion order.",
    "code": "export type RequestId = number",
    "signature": "export type RequestId = number",
    "parameters": [
      {
        "name": "definition",
        "values": "number",
        "description": "Exact alias, union, or callable contract represented by Server.RequestId."
      }
    ],
    "returns": null,
    "name": "Server.RequestId",
    "description": "Server.RequestId is an opaque numeric identifier allocated for one asynchronous operation. Store it with the operation's purpose so Application.resolve can correlate out-of-order completions without inspecting payload text.",
    "previousPageId": null,
    "nextPageId": "server/item-2",
    "relatedPageIds": [
      "server/item-6",
      "server/item-7"
    ]
  },
  {
    "id": "server/item-2",
    "kind": "type",
    "sectionId": "server",
    "sectionTitle": "Server functions",
    "module": "luastra/server",
    "beforeYouUse": "Add luastra/server to this module's dependencies in luastra.json, then import it with require(\"luastra/server\"). Declare rpc.call in luastra.json. Server.call also requires a declared backend operation and deployed trusted handler; save its RequestId and implement Application.resolve.",
    "lifecycle": "The type describes request options or the tagged envelope-decoding result.",
    "expectedOutcome": "A checked request/result annotation.",
    "failureGuidance": "Handle transport failure, envelope decode failure, and domain validation failure separately. The static web build does not deploy trusted backend handlers, credentials, or production operations for you.",
    "availability": "Current development candidate API; production backend deployment remains application-owned.",
    "callable": false,
    "useWhen": "Use Server.Options when a reusable variable or helper passes configuration to the related SDK operation. The exported type keeps optional and required fields aligned with the checked public contract.",
    "code": "export type Options = { deadlineMs: number?, idempotencyKey: string?, retry: boolean? }",
    "signature": "export type Options = { deadlineMs: number?, idempotencyKey: string?, retry: boolean? }",
    "parameters": [
      {
        "name": "deadlineMs",
        "values": "number?",
        "description": "Optional request deadline after which the operation fails predictably."
      },
      {
        "name": "idempotencyKey",
        "values": "string?",
        "description": "Optional stable key allowing a retryable operation to avoid duplicate effects."
      },
      {
        "name": "retry",
        "values": "boolean?",
        "description": "Whether the host may apply its bounded retry policy for eligible failures."
      }
    ],
    "returns": null,
    "name": "Server.Options",
    "description": "Server.Options is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted.",
    "previousPageId": "server/item-1",
    "nextPageId": "server/item-3",
    "relatedPageIds": [
      "server/item-6",
      "server/item-7"
    ]
  },
  {
    "id": "server/item-3",
    "kind": "type",
    "sectionId": "server",
    "sectionTitle": "Server functions",
    "module": "luastra/server",
    "beforeYouUse": "Add luastra/server to this module's dependencies in luastra.json, then import it with require(\"luastra/server\"). Declare rpc.call in luastra.json. Server.call also requires a declared backend operation and deployed trusted handler; save its RequestId and implement Application.resolve.",
    "lifecycle": "The type describes request options or the tagged envelope-decoding result.",
    "expectedOutcome": "A checked request/result annotation.",
    "failureGuidance": "Handle transport failure, envelope decode failure, and domain validation failure separately. The static web build does not deploy trusted backend handlers, credentials, or production operations for you.",
    "availability": "Current development candidate API; production backend deployment remains application-owned.",
    "callable": false,
    "useWhen": "Use Server.DecodeSuccess after narrowing the related result with success == true. Only this branch guarantees access to the decoded value and other success-specific fields.",
    "code": "export type DecodeSuccess = { success: true, fields: { [string]: string }, error: nil }",
    "signature": "export type DecodeSuccess = { success: true, fields: { [string]: string }, error: nil }",
    "parameters": [
      {
        "name": "success",
        "values": "true",
        "description": "Discriminator that must be checked before reading branch-specific fields."
      },
      {
        "name": "fields",
        "values": "{ [string]: string }",
        "description": "Validated bounded field map carried by the decoded or migrated value."
      },
      {
        "name": "error",
        "values": "nil",
        "description": "Bounded failure information, or nil on the successful branch."
      }
    ],
    "returns": null,
    "name": "Server.DecodeSuccess",
    "description": "Server.DecodeSuccess represents the successful branch of a discriminated SDK result. Its value and success-specific fields are safe to read only after the shared success tag has narrowed the union.",
    "previousPageId": "server/item-2",
    "nextPageId": "server/item-4",
    "relatedPageIds": [
      "server/item-5",
      "server/item-7"
    ]
  },
  {
    "id": "server/item-4",
    "kind": "type",
    "sectionId": "server",
    "sectionTitle": "Server functions",
    "module": "luastra/server",
    "beforeYouUse": "Add luastra/server to this module's dependencies in luastra.json, then import it with require(\"luastra/server\"). Declare rpc.call in luastra.json. Server.call also requires a declared backend operation and deployed trusted handler; save its RequestId and implement Application.resolve.",
    "lifecycle": "The type describes request options or the tagged envelope-decoding result.",
    "expectedOutcome": "A checked request/result annotation.",
    "failureGuidance": "Handle transport failure, envelope decode failure, and domain validation failure separately. The static web build does not deploy trusted backend handlers, credentials, or production operations for you.",
    "availability": "Current development candidate API; production backend deployment remains application-owned.",
    "callable": false,
    "useWhen": "Use Server.DecodeFailure on the unsuccessful branch of the related result. Read its stable fields for control flow or diagnostics; do not parse human-readable assertion or error text.",
    "code": "export type DecodeFailure = { success: false, fields: nil, error: string }",
    "signature": "export type DecodeFailure = { success: false, fields: nil, error: string }",
    "parameters": [
      {
        "name": "success",
        "values": "false",
        "description": "Discriminator that must be checked before reading branch-specific fields."
      },
      {
        "name": "fields",
        "values": "nil",
        "description": "Validated bounded field map carried by the decoded or migrated value."
      },
      {
        "name": "error",
        "values": "string",
        "description": "Bounded failure information, or nil on the successful branch."
      }
    ],
    "returns": null,
    "name": "Server.DecodeFailure",
    "description": "Server.DecodeFailure represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message.",
    "previousPageId": "server/item-3",
    "nextPageId": "server/item-5",
    "relatedPageIds": [
      "server/item-7"
    ]
  },
  {
    "id": "server/item-5",
    "kind": "type",
    "sectionId": "server",
    "sectionTitle": "Server functions",
    "module": "luastra/server",
    "beforeYouUse": "Add luastra/server to this module's dependencies in luastra.json, then import it with require(\"luastra/server\"). Declare rpc.call in luastra.json. Server.call also requires a declared backend operation and deployed trusted handler; save its RequestId and implement Application.resolve.",
    "lifecycle": "The type describes request options or the tagged envelope-decoding result.",
    "expectedOutcome": "A checked request/result annotation.",
    "failureGuidance": "Handle transport failure, envelope decode failure, and domain validation failure separately. The static web build does not deploy trusted backend handlers, credentials, or production operations for you.",
    "availability": "Current development candidate API; production backend deployment remains application-owned.",
    "callable": false,
    "useWhen": "Use Server.DecodeResult at the boundary where untrusted or versioned input is decoded. Branch on result.success before reading value or error so both outcomes remain explicit and type-safe.",
    "code": "export type DecodeResult = DecodeSuccess | DecodeFailure",
    "signature": "export type DecodeResult = DecodeSuccess | DecodeFailure",
    "parameters": [
      {
        "name": "definition",
        "values": "DecodeSuccess | DecodeFailure",
        "description": "Exact alias, union, or callable contract represented by Server.DecodeResult."
      }
    ],
    "returns": null,
    "name": "Server.DecodeResult",
    "description": "Server.DecodeResult is a discriminated union covering successful output and bounded failure. Branching on success narrows the value to the correct exported record and makes error handling explicit.",
    "previousPageId": "server/item-4",
    "nextPageId": "server/item-6",
    "relatedPageIds": [
      "server/item-3",
      "server/item-7"
    ]
  },
  {
    "id": "server/item-6",
    "kind": "entry",
    "sectionId": "server",
    "sectionTitle": "Server functions",
    "module": "luastra/server",
    "beforeYouUse": "Add luastra/server to this module's dependencies in luastra.json, then import it with require(\"luastra/server\"). Declare rpc.call in luastra.json. Server.call also requires a declared backend operation and deployed trusted handler; save its RequestId and implement Application.resolve.",
    "lifecycle": "Server.call starts asynchronous trusted work. Application.resolve reports transport success or failure; decode a successful payload with Server.decode and then validate operation-specific fields.",
    "expectedOutcome": "A RequestId now, then one resolve completion from the configured backend.",
    "failureGuidance": "Handle transport failure, envelope decode failure, and domain validation failure separately. The static web build does not deploy trusted backend handlers, credentials, or production operations for you.",
    "availability": "Current development candidate API; production backend deployment remains application-owned.",
    "callable": true,
    "useWhen": "Use Server.call for declared backend work that cannot safely or reliably run in the client, such as privileged data access. Track the RequestId, handle transport failure in Application.resolve, and validate successful payloads before use.",
    "code": "local Server = require(\"luastra/server\")\nlocal requestId = Server.call(\"records.list.v1\", { cursor = \"\" }, { deadlineMs = 3000, retry = true })",
    "signature": "Server.call(operation: string, input: { [string]: string }, options: Options?): RequestId",
    "parameters": [
      {
        "name": "operation",
        "values": "string",
        "description": "Declared, versioned backend operation name."
      },
      {
        "name": "input",
        "values": "{ [string]: string }",
        "description": "Bounded string map sent as operation input; never include client-side secrets."
      },
      {
        "name": "options",
        "values": "Options?",
        "description": "Optional deadline and retry policy for the request."
      },
      {
        "name": "options.deadlineMs",
        "values": "integer (1..30000)?",
        "description": "Optional request deadline; defaults to 3000 ms."
      },
      {
        "name": "options.idempotencyKey",
        "values": "string (8..128 bytes)?",
        "description": "Optional stable idempotency key for operations that may be retried."
      },
      {
        "name": "options.retry",
        "values": "boolean?",
        "description": "Allows the host's bounded retry policy when true; defaults to false."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Server.call",
    "description": "Starts a versioned request to a trusted backend operation with a bounded string map and optional request settings, returning a RequestId. Server authentication, authorization, validation, and secrets remain outside client Luau.",
    "completeRecipe": {
      "sectionId": "recipe-server",
      "title": "call a server function",
      "evidence": "generated-client",
      "description": "This checked recipe provides the declaration, generated client, trusted handler, manifest, test, and run context behind Server.call."
    },
    "previousPageId": "server/item-5",
    "nextPageId": "server/item-7",
    "relatedPageIds": [
      "server/item-1",
      "server/item-2"
    ]
  },
  {
    "id": "server/item-7",
    "kind": "entry",
    "sectionId": "server",
    "sectionTitle": "Server functions",
    "module": "luastra/server",
    "beforeYouUse": "Add luastra/server to this module's dependencies in luastra.json, then import it with require(\"luastra/server\"). Declare rpc.call in luastra.json. Server.call also requires a declared backend operation and deployed trusted handler; save its RequestId and implement Application.resolve.",
    "lifecycle": "Server.decode synchronously validates only the Luastra response envelope and returns fields on success; it does not validate your domain model.",
    "expectedOutcome": "A tagged result containing result.fields or a bounded decode error.",
    "failureGuidance": "Handle transport failure, envelope decode failure, and domain validation failure separately. The static web build does not deploy trusted backend handlers, credentials, or production operations for you.",
    "availability": "Current development candidate API; production backend deployment remains application-owned.",
    "callable": true,
    "useWhen": "Use Server.decode on a successful server resolve payload before reading operation data. Treat decode failure as an untrusted or incompatible response and keep application state unchanged or move to an explicit error state.",
    "code": "local Server = require(\"luastra/server\")\nlocal result = Server.decode(payload)\nif result.success then records = result.fields else errorMessage = result.error end",
    "signature": "Server.decode(value: string): DecodeResult",
    "parameters": [
      {
        "name": "value",
        "values": "string",
        "description": "Successful transport payload whose server envelope must still be validated."
      }
    ],
    "returns": "DecodeResult — a discriminated decode result; branch on success before reading decoded fields or failure data.",
    "name": "Server.decode",
    "description": "Parses the bounded payload returned by a Luastra server operation into a discriminated DecodeResult. It separates envelope validity from the transport success reported to Application.resolve.",
    "completeRecipe": {
      "sectionId": "recipe-server",
      "title": "call a server function",
      "evidence": "generated-client",
      "description": "This checked recipe provides the declaration, generated client, trusted handler, manifest, test, and run context behind Server.decode."
    },
    "previousPageId": "server/item-6",
    "nextPageId": null,
    "relatedPageIds": [
      "server/item-1",
      "server/item-2",
      "server/item-3",
      "server/item-4"
    ]
  },
  {
    "id": "media/item-1",
    "kind": "type",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The type describes queue input, live playback state, or the tagged state-decoding result.",
    "expectedOutcome": "A checked media input/state/result annotation.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": false,
    "useWhen": "Use Media.RequestId as the key in a pending-operation map after starting an asynchronous Media request. Match and remove that key in Application.resolve instead of relying on completion order.",
    "code": "export type RequestId = number",
    "signature": "export type RequestId = number",
    "parameters": [
      {
        "name": "definition",
        "values": "number",
        "description": "Exact alias, union, or callable contract represented by Media.RequestId."
      }
    ],
    "returns": null,
    "name": "Media.RequestId",
    "description": "Media.RequestId is an opaque numeric identifier allocated for one asynchronous operation. Store it with the operation's purpose so Application.resolve can correlate out-of-order completions without inspecting payload text.",
    "previousPageId": null,
    "nextPageId": "media/item-2",
    "relatedPageIds": [
      "media/item-4",
      "media/item-8",
      "media/item-15"
    ]
  },
  {
    "id": "media/item-2",
    "kind": "type",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The type describes queue input, live playback state, or the tagged state-decoding result.",
    "expectedOutcome": "A checked media input/state/result annotation.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": false,
    "useWhen": "Use Media.QueueItem when annotating values that cross the public luastra/media boundary or when exporting helpers built on that module. The type documents the exact checked shape and prevents unrelated tables from being substituted accidentally.",
    "code": "export type QueueItem = { id: string, source: string, title: string, artist: string }",
    "signature": "export type QueueItem = { id: string, source: string, title: string, artist: string }",
    "parameters": [
      {
        "name": "id",
        "values": "string",
        "description": "Stable identifier used to correlate or address this value across operations."
      },
      {
        "name": "source",
        "values": "string",
        "description": "Admitted asset or supported media source consumed by the host player."
      },
      {
        "name": "title",
        "values": "string",
        "description": "User-visible track title exposed by playback surfaces and host controls."
      },
      {
        "name": "artist",
        "values": "string",
        "description": "User-visible creator or collection label exposed by playback surfaces."
      }
    ],
    "returns": null,
    "name": "Media.QueueItem",
    "description": "Media.QueueItem is an exported, statically checked data contract of luastra/media. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis.",
    "completeRecipe": {
      "sectionId": "recipe-media",
      "title": "play packaged audio",
      "evidence": "authored-files",
      "description": "This checked recipe uses Media.QueueItem inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "media/item-1",
    "nextPageId": "media/item-3",
    "relatedPageIds": [
      "media/item-4",
      "media/item-8",
      "media/item-15"
    ]
  },
  {
    "id": "media/item-3",
    "kind": "type",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The type describes queue input, live playback state, or the tagged state-decoding result.",
    "expectedOutcome": "A checked media input/state/result annotation.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": false,
    "useWhen": "Use Media.MediaError on the unsuccessful branch of the related result. Read its stable fields for control flow or diagnostics; do not parse human-readable assertion or error text.",
    "code": "export type MediaError = { code: string, message: string }",
    "signature": "export type MediaError = { code: string, message: string }",
    "parameters": [
      {
        "name": "code",
        "values": "string",
        "description": "Stable machine-readable failure code suitable for branching and diagnostics."
      },
      {
        "name": "message",
        "values": "string",
        "description": "Bounded human-readable diagnostic that must not be parsed for control flow."
      }
    ],
    "returns": null,
    "name": "Media.MediaError",
    "description": "Media.MediaError represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message.",
    "previousPageId": "media/item-2",
    "nextPageId": "media/item-4",
    "relatedPageIds": []
  },
  {
    "id": "media/item-4",
    "kind": "type",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The type describes queue input, live playback state, or the tagged state-decoding result.",
    "expectedOutcome": "A checked media input/state/result annotation.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": false,
    "useWhen": "Use Media.State when annotating values that cross the public luastra/media boundary or when exporting helpers built on that module. The type documents the exact checked shape and prevents unrelated tables from being substituted accidentally.",
    "code": "export type State = {\n    revision: number, status: string, itemId: string, title: string, artist: string,\n    positionMs: number, durationMs: number, bufferedMs: number, queueIndex: number, queueCount: number,\n    background: boolean, interruption: string, route: string, error: MediaError?,\n}",
    "signature": "export type State = {\n    revision: number, status: string, itemId: string, title: string, artist: string,\n    positionMs: number, durationMs: number, bufferedMs: number, queueIndex: number, queueCount: number,\n    background: boolean, interruption: string, route: string, error: MediaError?,\n}",
    "parameters": [
      {
        "name": "revision",
        "values": "number",
        "description": "Checked revision field of Media.State; its exact admitted type is number."
      },
      {
        "name": "status",
        "values": "string",
        "description": "Checked status field of Media.State; its exact admitted type is string."
      },
      {
        "name": "itemId",
        "values": "string",
        "description": "Checked itemId field of Media.State; its exact admitted type is string."
      },
      {
        "name": "title",
        "values": "string",
        "description": "Checked title field of Media.State; its exact admitted type is string."
      },
      {
        "name": "artist",
        "values": "string",
        "description": "Checked artist field of Media.State; its exact admitted type is string."
      },
      {
        "name": "positionMs",
        "values": "number",
        "description": "Current playback position in milliseconds."
      },
      {
        "name": "durationMs",
        "values": "number",
        "description": "Known media duration in milliseconds, or the declared optional form."
      },
      {
        "name": "bufferedMs",
        "values": "number",
        "description": "Checked bufferedMs field of Media.State; its exact admitted type is number."
      },
      {
        "name": "queueIndex",
        "values": "number",
        "description": "Checked queueIndex field of Media.State; its exact admitted type is number."
      },
      {
        "name": "queueCount",
        "values": "number",
        "description": "Checked queueCount field of Media.State; its exact admitted type is number."
      },
      {
        "name": "background",
        "values": "boolean",
        "description": "Checked background field of Media.State; its exact admitted type is boolean."
      },
      {
        "name": "interruption",
        "values": "string",
        "description": "Checked interruption field of Media.State; its exact admitted type is string."
      },
      {
        "name": "route",
        "values": "string",
        "description": "Checked route field of Media.State; its exact admitted type is string."
      },
      {
        "name": "error",
        "values": "MediaError?",
        "description": "Bounded failure information, or nil on the successful branch."
      }
    ],
    "returns": null,
    "name": "Media.State",
    "description": "Media.State is an exported, statically checked data contract of luastra/media. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis.",
    "completeRecipe": {
      "sectionId": "recipe-media",
      "title": "play packaged audio",
      "evidence": "authored-files",
      "description": "This checked recipe uses Media.State inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "media/item-3",
    "nextPageId": "media/item-5",
    "relatedPageIds": [
      "media/item-1",
      "media/item-2",
      "media/item-8",
      "media/item-15"
    ]
  },
  {
    "id": "media/item-5",
    "kind": "type",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The type describes queue input, live playback state, or the tagged state-decoding result.",
    "expectedOutcome": "A checked media input/state/result annotation.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": false,
    "useWhen": "Use Media.DecodeSuccess after narrowing the related result with success == true. Only this branch guarantees access to the decoded value and other success-specific fields.",
    "code": "export type DecodeSuccess = { success: true, state: State, error: nil }",
    "signature": "export type DecodeSuccess = { success: true, state: State, error: nil }",
    "parameters": [
      {
        "name": "success",
        "values": "true",
        "description": "Discriminator that must be checked before reading branch-specific fields."
      },
      {
        "name": "state",
        "values": "State",
        "description": "Validated typed media state available on the successful decode branch."
      },
      {
        "name": "error",
        "values": "nil",
        "description": "Bounded failure information, or nil on the successful branch."
      }
    ],
    "returns": null,
    "name": "Media.DecodeSuccess",
    "description": "Media.DecodeSuccess represents the successful branch of a discriminated SDK result. Its value and success-specific fields are safe to read only after the shared success tag has narrowed the union.",
    "previousPageId": "media/item-4",
    "nextPageId": "media/item-6",
    "relatedPageIds": [
      "media/item-7",
      "media/item-17"
    ]
  },
  {
    "id": "media/item-6",
    "kind": "type",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The type describes queue input, live playback state, or the tagged state-decoding result.",
    "expectedOutcome": "A checked media input/state/result annotation.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": false,
    "useWhen": "Use Media.DecodeFailure on the unsuccessful branch of the related result. Read its stable fields for control flow or diagnostics; do not parse human-readable assertion or error text.",
    "code": "export type DecodeFailure = { success: false, state: nil, error: string }",
    "signature": "export type DecodeFailure = { success: false, state: nil, error: string }",
    "parameters": [
      {
        "name": "success",
        "values": "false",
        "description": "Discriminator that must be checked before reading branch-specific fields."
      },
      {
        "name": "state",
        "values": "nil",
        "description": "Validated typed media state available on the successful decode branch."
      },
      {
        "name": "error",
        "values": "string",
        "description": "Bounded failure information, or nil on the successful branch."
      }
    ],
    "returns": null,
    "name": "Media.DecodeFailure",
    "description": "Media.DecodeFailure represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message.",
    "previousPageId": "media/item-5",
    "nextPageId": "media/item-7",
    "relatedPageIds": [
      "media/item-17",
      "media/item-4"
    ]
  },
  {
    "id": "media/item-7",
    "kind": "type",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The type describes queue input, live playback state, or the tagged state-decoding result.",
    "expectedOutcome": "A checked media input/state/result annotation.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": false,
    "useWhen": "Use Media.DecodeResult at the boundary where untrusted or versioned input is decoded. Branch on result.success before reading value or error so both outcomes remain explicit and type-safe.",
    "code": "export type DecodeResult = DecodeSuccess | DecodeFailure",
    "signature": "export type DecodeResult = DecodeSuccess | DecodeFailure",
    "parameters": [
      {
        "name": "definition",
        "values": "DecodeSuccess | DecodeFailure",
        "description": "Exact alias, union, or callable contract represented by Media.DecodeResult."
      }
    ],
    "returns": null,
    "name": "Media.DecodeResult",
    "description": "Media.DecodeResult is a discriminated union covering successful output and bounded failure. Branching on success narrows the value to the correct exported record and makes error handling explicit.",
    "previousPageId": "media/item-6",
    "nextPageId": "media/item-8",
    "relatedPageIds": [
      "media/item-5",
      "media/item-17",
      "media/item-4"
    ]
  },
  {
    "id": "media/item-8",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The command returns a RequestId for acknowledgement. Actual playback truth arrives independently through Application.handle(\"media_state\", target, payload) and must be decoded before rendering.",
    "expectedOutcome": "A RequestId now, then command completion and subsequent decoded live-state updates when playback changes.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": true,
    "useWhen": "Use Media.setQueue before play when the application owns a new playlist, meditation sequence, or sound set. Keep stable item IDs, validate the selected index, and avoid rebuilding an unchanged queue on every render.",
    "code": "local Media = require(\"luastra/media\")\nMedia.setQueue({ { id = \"intro\", source = \"asset:audio/intro\", title = \"Intro\", artist = \"Luastra\" } })",
    "signature": "Media.setQueue(items: { QueueItem }, selectedIndex: number?): RequestId",
    "parameters": [
      {
        "name": "items",
        "values": "{ QueueItem }",
        "description": "Bounded ordered QueueItem values with stable IDs and admitted sources."
      },
      {
        "name": "selectedIndex",
        "values": "number?",
        "description": "Optional one-based item selected after the queue is installed."
      },
      {
        "name": "items[].id",
        "values": "string (1..128 bytes)",
        "description": "Stable application-owned item identifier."
      },
      {
        "name": "items[].source",
        "values": "asset:* | content:*",
        "description": "Admitted project asset URI or scoped content grant."
      },
      {
        "name": "items[].title",
        "values": "string (1..256 bytes)",
        "description": "Track title shown by application and host playback surfaces."
      },
      {
        "name": "items[].artist",
        "values": "string (1..256 bytes)",
        "description": "Artist or collection label shown by playback surfaces."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.setQueue",
    "description": "Replaces the host playback queue with validated QueueItem values and optionally selects a one-based item, returning a RequestId. The host reports later playback changes through media_state events.",
    "completeRecipe": {
      "sectionId": "recipe-media",
      "title": "play packaged audio",
      "evidence": "authored-files",
      "description": "This checked recipe uses Media.setQueue inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "media/item-7",
    "nextPageId": "media/item-9",
    "relatedPageIds": [
      "media/item-1",
      "media/item-2",
      "media/item-4",
      "media/item-15"
    ]
  },
  {
    "id": "media/item-9",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The command returns a RequestId for acknowledgement. Actual playback truth arrives independently through Application.handle(\"media_state\", target, payload) and must be decoded before rendering.",
    "expectedOutcome": "A RequestId now, then command completion and subsequent decoded live-state updates when playback changes.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": true,
    "useWhen": "Use Media.play after a user action or admitted autoplay decision when a queue item is selected. Update visible controls from decoded media state rather than assuming the command succeeded immediately.",
    "code": "local Media = require(\"luastra/media\")\nMedia.play()",
    "signature": "Media.play(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.play",
    "description": "Requests playback of the selected queue item, resuming from the current position when the host state permits it. The returned RequestId acknowledges the command; live truth comes from media_state.",
    "completeRecipe": {
      "sectionId": "recipe-media",
      "title": "play packaged audio",
      "evidence": "authored-files",
      "description": "This checked recipe uses Media.play inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "media/item-8",
    "nextPageId": "media/item-10",
    "relatedPageIds": [
      "media/item-11",
      "media/item-12",
      "media/item-16"
    ]
  },
  {
    "id": "media/item-10",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The command returns a RequestId for acknowledgement. Actual playback truth arrives independently through Application.handle(\"media_state\", target, payload) and must be decoded before rendering.",
    "expectedOutcome": "A RequestId now, then command completion and subsequent decoded live-state updates when playback changes.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": true,
    "useWhen": "Use Media.pause when the user temporarily stops listening or application lifecycle policy requires a resumable pause. Use stop when position should return to the beginning.",
    "code": "local Media = require(\"luastra/media\")\nMedia.pause()",
    "signature": "Media.pause(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.pause",
    "description": "Requests that playback pause while retaining the selected item and current position for a later resume. Completion and subsequent live state are delivered through the normal media contracts.",
    "completeRecipe": {
      "sectionId": "recipe-media",
      "title": "play packaged audio",
      "evidence": "authored-files",
      "description": "This checked recipe uses Media.pause inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "media/item-9",
    "nextPageId": "media/item-11",
    "relatedPageIds": [
      "media/item-12",
      "media/item-16"
    ]
  },
  {
    "id": "media/item-11",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The command returns a RequestId for acknowledgement. Actual playback truth arrives independently through Application.handle(\"media_state\", target, payload) and must be decoded before rendering.",
    "expectedOutcome": "A RequestId now, then command completion and subsequent decoded live-state updates when playback changes.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": true,
    "useWhen": "Use Media.stop when the session ends but the same queue may be played again. Use pause for a resumable interruption and unload when the queue is no longer needed.",
    "code": "local Media = require(\"luastra/media\")\nMedia.stop()",
    "signature": "Media.stop(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.stop",
    "description": "Requests that playback stop and reset the current item according to the host contract while retaining the queue. It differs from unload, which releases the active media resources.",
    "previousPageId": "media/item-10",
    "nextPageId": "media/item-12",
    "relatedPageIds": [
      "media/item-9",
      "media/item-16"
    ]
  },
  {
    "id": "media/item-12",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The command returns a RequestId for acknowledgement. Actual playback truth arrives independently through Application.handle(\"media_state\", target, payload) and must be decoded before rendering.",
    "expectedOutcome": "A RequestId now, then command completion and subsequent decoded live-state updates when playback changes.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": true,
    "useWhen": "Use Media.unload when leaving the media feature, signing out, or replacing the session with unrelated content. Do not unload for a brief pause because it discards resumable host state.",
    "code": "local Media = require(\"luastra/media\")\nMedia.unload()",
    "signature": "Media.unload(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.unload",
    "description": "Requests release of the active media queue and playback resources, clearing state that should not survive the current media session. A later play requires setting an appropriate queue again.",
    "previousPageId": "media/item-11",
    "nextPageId": "media/item-13",
    "relatedPageIds": [
      "media/item-9",
      "media/item-10",
      "media/item-16"
    ]
  },
  {
    "id": "media/item-13",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The command returns a RequestId for acknowledgement. Actual playback truth arrives independently through Application.handle(\"media_state\", target, payload) and must be decoded before rendering.",
    "expectedOutcome": "A RequestId now, then command completion and subsequent decoded live-state updates when playback changes.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": true,
    "useWhen": "Use Media.next for an explicit Next control or a policy that advances after completion. Disable or explain the control when decoded media state shows that no next item is available.",
    "code": "local Media = require(\"luastra/media\")\nMedia.next()",
    "signature": "Media.next(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.next",
    "description": "Requests selection of the next item in the current queue according to host queue boundaries. The actual selected index and playback state arrive through media_state.",
    "previousPageId": "media/item-12",
    "nextPageId": "media/item-14",
    "relatedPageIds": [
      "media/item-4",
      "media/item-15"
    ]
  },
  {
    "id": "media/item-14",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The command returns a RequestId for acknowledgement. Actual playback truth arrives independently through Application.handle(\"media_state\", target, payload) and must be decoded before rendering.",
    "expectedOutcome": "A RequestId now, then command completion and subsequent decoded live-state updates when playback changes.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": true,
    "useWhen": "Use Media.previous for an explicit Previous control and derive availability from decoded media state. Define separately whether a near-start press should restart the current item in application UX.",
    "code": "local Media = require(\"luastra/media\")\nMedia.previous()",
    "signature": "Media.previous(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.previous",
    "description": "Requests selection of the previous item in the current queue according to host queue boundaries. It does not let application code assume whether the host restarts or changes items without observing state.",
    "previousPageId": "media/item-13",
    "nextPageId": "media/item-15",
    "relatedPageIds": [
      "media/item-4"
    ]
  },
  {
    "id": "media/item-15",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The command returns a RequestId for acknowledgement. Actual playback truth arrives independently through Application.handle(\"media_state\", target, payload) and must be decoded before rendering.",
    "expectedOutcome": "A RequestId now, then command completion and subsequent decoded live-state updates when playback changes.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": true,
    "useWhen": "Use Media.state to initialize controls after startup, restoration, or a suspected missed event. Prefer live media_state events for routine updates instead of polling continuously.",
    "code": "local Media = require(\"luastra/media\")\nlocal requestId = Media.state()",
    "signature": "Media.state(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.state",
    "description": "Requests a current snapshot of queue, selection, playback, position, duration, and bounded media error state. The asynchronous payload is decoded with Media.decodeState.",
    "previousPageId": "media/item-14",
    "nextPageId": "media/item-16",
    "relatedPageIds": [
      "media/item-1",
      "media/item-2",
      "media/item-4",
      "media/item-8"
    ]
  },
  {
    "id": "media/item-16",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "The command returns a RequestId for acknowledgement. Actual playback truth arrives independently through Application.handle(\"media_state\", target, payload) and must be decoded before rendering.",
    "expectedOutcome": "A RequestId now, then command completion and subsequent decoded live-state updates when playback changes.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": true,
    "useWhen": "Use Media.seek for a user-operated scrubber, skip control, or explicit chapter jump. Base the target on decoded duration and position, and do not issue a request for every unthrottled pointer movement.",
    "code": "local Media = require(\"luastra/media\")\nMedia.seek(30_000)",
    "signature": "Media.seek(positionMs: number): RequestId",
    "parameters": [
      {
        "name": "positionMs",
        "values": "number",
        "description": "Requested non-negative position in milliseconds within the selected item."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.seek",
    "description": "Requests movement of the selected media item to the supplied non-negative millisecond position. The host clamps or rejects values according to the current duration and reports the resulting state asynchronously.",
    "previousPageId": "media/item-15",
    "nextPageId": "media/item-17",
    "relatedPageIds": [
      "media/item-9",
      "media/item-10",
      "media/item-11",
      "media/item-12"
    ]
  },
  {
    "id": "media/item-17",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "beforeYouUse": "Add luastra/media to this module's dependencies in luastra.json, then import it with require(\"luastra/media\"). Declare media.command in luastra.json. Set an admitted queue before playback, start playback from an explicit user action where required, and implement both Application.resolve and media_state handling.",
    "lifecycle": "Media.decodeState synchronously validates a media_state or Media.state payload. On success, playback fields are under result.state.",
    "expectedOutcome": "A tagged result containing result.state or a bounded decode error.",
    "failureGuidance": "Missing capability, absent queue, invalid asset/content URI, autoplay policy, interruption, unsupported background behavior, or host failure must remain visible state. Do not optimistically treat command acknowledgement as playback success.",
    "availability": "Current development candidate API; background playback and system controls require target-specific verification.",
    "callable": true,
    "useWhen": "Use Media.decodeState for every media_state event and successful Media.state response before updating controls, lock-screen-facing state, or persistence. Preserve the previous known state when decoding fails.",
    "code": "local Media = require(\"luastra/media\")\nlocal result = Media.decodeState(payload)\nif result.success then positionMs = result.state.positionMs else errorMessage = result.error end",
    "signature": "Media.decodeState(payload: string): DecodeResult",
    "parameters": [
      {
        "name": "payload",
        "values": "string",
        "description": "Untrusted media-state event or state-response payload."
      }
    ],
    "returns": "DecodeResult — a discriminated decode result; branch on success before reading decoded fields or failure data.",
    "name": "Media.decodeState",
    "description": "Validates and decodes a media-state payload into a discriminated Media.DecodeResult containing the typed playback State or a bounded failure. This keeps host strings outside trusted application state until checked.",
    "completeRecipe": {
      "sectionId": "recipe-media",
      "title": "play packaged audio",
      "evidence": "authored-files",
      "description": "This checked recipe uses Media.decodeState inside complete authored files with the required manifest, test, and run steps."
    },
    "previousPageId": "media/item-16",
    "nextPageId": null,
    "relatedPageIds": [
      "media/item-5",
      "media/item-6",
      "media/item-7",
      "media/item-4"
    ]
  },
  {
    "id": "debug/item-1",
    "kind": "entry",
    "sectionId": "debug",
    "sectionTitle": "Debug output",
    "module": "luastra/debug",
    "beforeYouUse": "Add luastra/debug to this module's dependencies in luastra.json, then import it with require(\"luastra/debug\"). No additional host capability is required. Keep user-visible errors in UI state rather than relying on a developer console.",
    "lifecycle": "The call writes a synchronous development diagnostic. It neither changes application state nor throws merely because the error log level is used.",
    "expectedOutcome": "A prefixed diagnostic appears in the active host's development log.",
    "failureGuidance": "Never include secrets or personal data. Logging is not telemetry, recovery, or user-facing error handling, and host presentation may differ.",
    "availability": "Current development candidate diagnostic API.",
    "callable": true,
    "useWhen": "Use Debug.log for temporary progress, state-transition, and correlation diagnostics during local development. Remove noisy calls before release and never include credentials, tokens, personal data, or complete sensitive payloads.",
    "code": "local Debug = require(\"luastra/debug\")\nDebug.log(\"game\", \"round started\")",
    "signature": "Debug.log(...: any): nil",
    "parameters": [
      {
        "name": "...",
        "values": "any",
        "description": "Checked ... argument accepted by Debug.log."
      }
    ],
    "returns": "nil — the exact nil value declared by the SDK contract.",
    "name": "Debug.log",
    "description": "Emits a development diagnostic at the ordinary log level, serializing the supplied values through the host's bounded debug channel. It has no role in application state or user-visible status.",
    "previousPageId": null,
    "nextPageId": "debug/item-2",
    "relatedPageIds": []
  },
  {
    "id": "debug/item-2",
    "kind": "entry",
    "sectionId": "debug",
    "sectionTitle": "Debug output",
    "module": "luastra/debug",
    "beforeYouUse": "Add luastra/debug to this module's dependencies in luastra.json, then import it with require(\"luastra/debug\"). No additional host capability is required. Keep user-visible errors in UI state rather than relying on a developer console.",
    "lifecycle": "The call writes a synchronous development diagnostic. It neither changes application state nor throws merely because the error log level is used.",
    "expectedOutcome": "A prefixed diagnostic appears in the active host's development log.",
    "failureGuidance": "Never include secrets or personal data. Logging is not telemetry, recovery, or user-facing error handling, and host presentation may differ.",
    "availability": "Current development candidate diagnostic API.",
    "callable": true,
    "useWhen": "Use Debug.warn when the application can continue but a fallback, stale value, or unusual branch deserves developer attention. User-correctable validation belongs in the UI, not only in the debug console.",
    "code": "local Debug = require(\"luastra/debug\")\nDebug.warn(\"storage\", \"snapshot was empty\")",
    "signature": "Debug.warn(...: any): nil",
    "parameters": [
      {
        "name": "...",
        "values": "any",
        "description": "Checked ... argument accepted by Debug.warn."
      }
    ],
    "returns": "nil — the exact nil value declared by the SDK contract.",
    "name": "Debug.warn",
    "description": "Emits a warning-level development diagnostic for an unexpected but recoverable condition. Hosts may distinguish it visually from normal logs while preserving the same bounded argument handling.",
    "previousPageId": "debug/item-1",
    "nextPageId": "debug/item-3",
    "relatedPageIds": []
  },
  {
    "id": "debug/item-3",
    "kind": "entry",
    "sectionId": "debug",
    "sectionTitle": "Debug output",
    "module": "luastra/debug",
    "beforeYouUse": "Add luastra/debug to this module's dependencies in luastra.json, then import it with require(\"luastra/debug\"). No additional host capability is required. Keep user-visible errors in UI state rather than relying on a developer console.",
    "lifecycle": "The call writes a synchronous development diagnostic. It neither changes application state nor throws merely because the error log level is used.",
    "expectedOutcome": "A prefixed diagnostic appears in the active host's development log.",
    "failureGuidance": "Never include secrets or personal data. Logging is not telemetry, recovery, or user-facing error handling, and host presentation may differ.",
    "availability": "Current development candidate diagnostic API.",
    "callable": true,
    "useWhen": "Use Debug.error when an operation reaches a failure branch that should be conspicuous during development. Still update user-visible state and handle the Result or resolve failure explicitly; do not use logging as control flow.",
    "code": "local Debug = require(\"luastra/debug\")\nDebug.error(\"server\", \"request failed\")",
    "signature": "Debug.error(...: any): nil",
    "parameters": [
      {
        "name": "...",
        "values": "any",
        "description": "Checked ... argument accepted by Debug.error."
      }
    ],
    "returns": "nil — the exact nil value declared by the SDK contract.",
    "name": "Debug.error",
    "description": "Emits an error-level diagnostic without replacing structured application error handling or automatically terminating execution. The message is intended for developers observing a failing operation.",
    "previousPageId": "debug/item-2",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "cli/table-1",
    "kind": "parameter-group",
    "sectionId": "cli",
    "sectionTitle": "Command line",
    "module": "installed luastra CLI",
    "name": "Commands and outputs",
    "signature": "cli-commands",
    "description": "Shared parameters in the “Commands and outputs” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "version",
        "values": "luastra version",
        "description": "Prints JSON containing command, result=PASS, and the selected product version."
      },
      {
        "name": "doctor",
        "values": "luastra doctor [--root=<directory>]",
        "description": "Verifies Node, host selection, manager state, the active SDK receipt, every installed file, and the PATH shim."
      },
      {
        "name": "create",
        "values": "luastra create <directory>",
        "description": "Copies the starter into a missing or empty safe directory and derives project.id from its name."
      },
      {
        "name": "check",
        "values": "luastra check [--project=<path>]",
        "description": "Analyzes strict Luau, manifest, modules, capabilities, assets, and SDK identities without keeping a build artifact."
      },
      {
        "name": "test",
        "values": "luastra test [--project=<path>]",
        "description": "Executes every test module listed in the project manifest and prints a bounded result summary."
      },
      {
        "name": "conformance",
        "values": "luastra conformance [--project=<path>]",
        "description": "Builds the project and checks its declared behavior against the supported conformance contract."
      },
      {
        "name": "generate",
        "values": "luastra generate [--project=<path>]",
        "description": "Regenerates the typed server client. The manifest must declare backend.declaration, handler, generatedClient, and generatedModule."
      },
      {
        "name": "run",
        "values": "luastra run [--project=<path>] [--port=<port>] [--no-watch]",
        "description": "Builds and serves a local preview. Default port is 4175; watch mode rebuilds after source changes; Ctrl+C stops it."
      },
      {
        "name": "build web",
        "values": "luastra build web [--project=<path>] [--out=<path>]",
        "description": "Writes a static web artifact to dist/web by default. The destination must satisfy the build's safety and replacement rules."
      },
      {
        "name": "build bundle",
        "values": "luastra build bundle [--project=<path>] [--out=<path>]",
        "description": "Writes the compiled host-neutral application bundle to dist/bundle by default; this is an integration artifact, not a standalone website."
      },
      {
        "name": "sdk install",
        "values": "luastra sdk install --manifest=<path-or-https-url> [--no-use]",
        "description": "Verifies and installs an immutable release; activates it unless --no-use is supplied."
      },
      {
        "name": "sdk list",
        "values": "luastra sdk list [--root=<directory>]",
        "description": "Lists installed immutable SDK versions and identifies the active selection."
      },
      {
        "name": "sdk use",
        "values": "luastra sdk use <version> [--root=<directory>]",
        "description": "Selects a previously installed verified version; use this for rollback."
      },
      {
        "name": "sdk update",
        "values": "luastra sdk update --manifest=<path-or-https-url>",
        "description": "Installs and activates the version named by another verified release manifest."
      },
      {
        "name": "sdk remove",
        "values": "luastra sdk remove <inactive-version>",
        "description": "Removes a verified inactive SDK. Removing the active version is rejected."
      }
    ],
    "previousPageId": null,
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "manifest/item-1",
    "kind": "entry",
    "sectionId": "manifest",
    "sectionTitle": "Project manifest",
    "module": "luastra.json · schema v2",
    "callable": false,
    "useWhen": "Read this page when you need to apply Minimal manifest, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "{\n  \"schemaVersion\": 2,\n  \"project\": {\n    \"id\": \"dev.luastra.example\",\n    \"entry\": \"app/main\"\n  },\n  \"sdk\": { \"contract\": 1 },\n  \"capabilities\": [\"ui.render\"],\n  \"modules\": [\n    {\n      \"id\": \"app/main\",\n      \"source\": \"src/main.luau\",\n      \"dependencies\": [\"luastra/ui\"]\n    }\n  ]\n}",
    "signature": "schemaVersion: 2",
    "parameters": [],
    "returns": null,
    "name": "Minimal manifest",
    "description": "check enforces this explicit contract.",
    "language": "JSON",
    "previousPageId": null,
    "nextPageId": "manifest/item-2",
    "relatedPageIds": []
  },
  {
    "id": "manifest/item-2",
    "kind": "entry",
    "sectionId": "manifest",
    "sectionTitle": "Project manifest",
    "module": "luastra.json · schema v2",
    "callable": false,
    "useWhen": "Read this page when you need to apply Web metadata, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "\"web\": {\n  \"title\": \"My Luastra app\",\n  \"description\": \"A concise description for search and social previews.\",\n  \"canonicalUrl\": \"https://example.com/\",\n  \"index\": true\n}",
    "signature": "web{}",
    "parameters": [],
    "returns": null,
    "name": "Web metadata",
    "description": "Optional bounded metadata for an indexable production web shell.",
    "language": "JSON",
    "points": [
      "The web build emits title, description, canonical, robots, Open Graph, and Twitter metadata.",
      "index=true emits robots.txt and a one-location sitemap.xml; hash routes are not separate indexable documents.",
      "The build escapes metadata and rejects credentials, query strings, fragments, and non-HTTPS canonical URLs."
    ],
    "previousPageId": "manifest/item-1",
    "nextPageId": "manifest/item-3",
    "relatedPageIds": []
  },
  {
    "id": "manifest/item-3",
    "kind": "entry",
    "sectionId": "manifest",
    "sectionTitle": "Project manifest",
    "module": "luastra.json · schema v2",
    "callable": false,
    "useWhen": "Read this page when you need to apply Assets, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "\"assets\": [\n  {\n    \"id\": \"image/card-back\",\n    \"source\": \"assets/card-back.png\",\n    \"mediaType\": \"image/png\"\n  }\n]",
    "signature": "assets[]",
    "parameters": [],
    "returns": null,
    "name": "Assets",
    "description": "Admitted project files.",
    "language": "JSON",
    "previousPageId": "manifest/item-2",
    "nextPageId": "manifest/item-4",
    "relatedPageIds": []
  },
  {
    "id": "manifest/item-4",
    "kind": "entry",
    "sectionId": "manifest",
    "sectionTitle": "Project manifest",
    "module": "luastra.json · schema v2",
    "callable": false,
    "useWhen": "Read this page when you need to apply Capabilities, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "\"capabilities\": [\n  \"ui.render\",\n  \"storage.get\",\n  \"storage.set\"\n]",
    "signature": "capabilities[]",
    "parameters": [],
    "returns": null,
    "name": "Capabilities",
    "description": "Explicit host privileges.",
    "language": "JSON",
    "previousPageId": "manifest/item-3",
    "nextPageId": "manifest/item-5",
    "relatedPageIds": []
  },
  {
    "id": "manifest/item-5",
    "kind": "entry",
    "sectionId": "manifest",
    "sectionTitle": "Project manifest",
    "module": "luastra.json · schema v2",
    "callable": false,
    "useWhen": "Read this page when you need to apply Backend, verify its exact contract, and adapt the example without bypassing validation or host boundaries.",
    "code": "\"backend\": {\n  \"declaration\": \"backend/functions.json\",\n  \"handler\": \"backend/handlers.mjs\",\n  \"generatedClient\": \"src/generated/server-functions.luau\",\n  \"generatedModule\": \"app/server-functions\"\n}",
    "signature": "backend{}",
    "parameters": [],
    "returns": null,
    "name": "Backend",
    "description": "Trusted operations and generated clients.",
    "language": "JSON",
    "previousPageId": "manifest/item-4",
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "support/table-1",
    "kind": "parameter-group",
    "sectionId": "support",
    "sectionTitle": "Support and boundaries",
    "module": null,
    "name": "Current evidence boundary",
    "description": "Shared parameters in the “Current evidence boundary” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "CLI, runtime, and web build",
        "values": "Repository-verified",
        "description": "create, check, test, run, bundle, and static web build have automated coverage for the candidate checkout."
      },
      {
        "name": "Web UI and accessibility",
        "values": "Browser-verified",
        "description": "Semantic DOM, keyboard, zoom, IME, responsive layout, and selected flows have bounded browser evidence; this is not every assistive technology."
      },
      {
        "name": "Desktop host sources",
        "values": "Tauri evidence",
        "description": "The web artifact has bounded macOS, Linux, and Windows build/launch evidence; no signed installer, notarization, store package, or updater is promised."
      },
      {
        "name": "Mobile host sources",
        "values": "Capacitor evidence",
        "description": "Android/iOS simulator and selected physical-device flows have bounded evidence; no public store package or universal device certification is promised."
      },
      {
        "name": "Media and background behavior",
        "values": "Host-dependent",
        "description": "Autoplay, interruption, background playback, hardware controls, and packaging require target-specific verification."
      },
      {
        "name": "Public release",
        "values": "0.1.0-alpha",
        "description": "Pre-release APIs may change. The public installer exposes bundle and web builds; candidate documentation is not a release asset until publication."
      }
    ],
    "previousPageId": null,
    "nextPageId": null,
    "relatedPageIds": []
  },
  {
    "id": "policies/item-1",
    "kind": "guide",
    "sectionId": "policies",
    "sectionTitle": "Project policies",
    "module": null,
    "callable": false,
    "useWhen": "Read this when a message should be private or when you need to select the correct Luastra contact route.",
    "code": null,
    "signature": "CONTACT.md",
    "parameters": [],
    "returns": null,
    "name": "Contact routes",
    "description": "Dedicated addresses for general, support, security, privacy, and legal enquiries.",
    "points": [
      "General project enquiries: hello@luastra.dev.",
      "Private user support: support@luastra.dev.",
      "Security reports: security@luastra.dev; prefer GitHub private vulnerability reporting when available.",
      "Privacy enquiries: privacy@luastra.dev. Licensing, trademark, and legal enquiries: legal@luastra.dev."
    ],
    "previousPageId": null,
    "nextPageId": "policies/item-2",
    "relatedPageIds": []
  },
  {
    "id": "policies/item-2",
    "kind": "guide",
    "sectionId": "policies",
    "sectionTitle": "Project policies",
    "module": null,
    "callable": false,
    "useWhen": "Read this before reporting a suspected vulnerability or sharing a security proof of concept.",
    "code": null,
    "signature": "SECURITY.md",
    "parameters": [],
    "returns": null,
    "name": "Security policy",
    "description": "How to report a suspected vulnerability without exposing it publicly.",
    "points": [
      "Do not open a public issue for a suspected vulnerability.",
      "Use GitHub private vulnerability reporting for confidential coordination; use security@luastra.dev if that route is unavailable.",
      "Include the exact version or commit, affected hosts, safe reproduction steps, expected impact, and known preconditions.",
      "Never include real credentials, personal data, production tokens, or unrelated private source."
    ],
    "previousPageId": "policies/item-1",
    "nextPageId": "policies/item-3",
    "relatedPageIds": []
  },
  {
    "id": "policies/item-3",
    "kind": "guide",
    "sectionId": "policies",
    "sectionTitle": "Project policies",
    "module": null,
    "callable": false,
    "useWhen": "Read this before requesting help, filing a reproducible defect, or proposing a bounded feature.",
    "code": null,
    "signature": "SUPPORT.md",
    "parameters": [],
    "returns": null,
    "name": "Support policy",
    "description": "Best-effort support boundaries for pre-release software.",
    "points": [
      "The source alpha has no service-level, response-time, production, or compatibility commitment.",
      "A defect report should include the exact version, host and target, minimal reproduction, expected and actual behavior, and sanitized error output.",
      "Public issues are for reproducible defects; Discussions are for usage and design questions.",
      "Use support@luastra.dev only when a support or conduct enquiry contains context that should not be public."
    ],
    "previousPageId": "policies/item-2",
    "nextPageId": "policies/item-4",
    "relatedPageIds": []
  },
  {
    "id": "policies/item-4",
    "kind": "guide",
    "sectionId": "policies",
    "sectionTitle": "Project policies",
    "module": null,
    "callable": false,
    "useWhen": "Read this before sending personal information to a Luastra contact address or when asking how the official website handles visitor data.",
    "code": null,
    "signature": "PRIVACY.md",
    "parameters": [],
    "returns": null,
    "name": "Privacy notice",
    "description": "Limited data handling for the official documentation site and direct project correspondence.",
    "points": [
      "The project does not intentionally operate advertising, behavioural analytics, user accounts, or a contact form on luastra.dev.",
      "A local presentation preference may remain on the visitor's device; GitHub Pages may process technical request information under GitHub's own terms.",
      "Direct email provides the sender address, message, attachments, and any information the sender chooses to include.",
      "Privacy questions and requests concerning information sent to the project may be addressed to privacy@luastra.dev."
    ],
    "previousPageId": "policies/item-3",
    "nextPageId": "policies/item-5",
    "relatedPageIds": []
  },
  {
    "id": "policies/item-5",
    "kind": "guide",
    "sectionId": "policies",
    "sectionTitle": "Project policies",
    "module": null,
    "callable": false,
    "useWhen": "Read this before redistributing Luastra, starter fragments, generated output, or a Luastra-built application.",
    "code": null,
    "signature": "LICENSING.md",
    "parameters": [],
    "returns": null,
    "name": "Licensing boundary",
    "description": "Which project-owned files use Apache-2.0 or 0BSD and which rights remain separate.",
    "points": [
      "Project-owned platform code and technical documentation use Apache-2.0 unless a file says otherwise.",
      "Starter templates and scaffolding fragments use 0BSD so generated applications are not forced to be open source.",
      "User-authored applications and content remain owned by their respective rights holders.",
      "Send licensing questions to legal@luastra.dev; an email response changes no license unless it expressly says so in writing."
    ],
    "previousPageId": "policies/item-4",
    "nextPageId": "policies/item-6",
    "relatedPageIds": []
  },
  {
    "id": "policies/item-6",
    "kind": "guide",
    "sectionId": "policies",
    "sectionTitle": "Project policies",
    "module": null,
    "callable": false,
    "useWhen": "Read this before using Luastra branding in a product name, domain, logo, certification claim, or commercial material.",
    "code": null,
    "signature": "TRADEMARKS.md",
    "parameters": [],
    "returns": null,
    "name": "Trademark policy",
    "description": "Rules for the Luastra name, logo, wordmark, domains, and product identity.",
    "points": [
      "Apache-2.0 and 0BSD do not grant rights to Luastra brand assets.",
      "Truthful nominative references such as built with Luastra are intended to be allowed when they do not imply endorsement.",
      "Product names, domains, confusingly similar logos, merchandise, certification claims, and modified brand assets require separate written permission.",
      "Send permission requests to legal@luastra.dev; sending an enquiry does not itself grant permission."
    ],
    "previousPageId": "policies/item-5",
    "nextPageId": "policies/item-7",
    "relatedPageIds": []
  },
  {
    "id": "policies/item-7",
    "kind": "guide",
    "sectionId": "policies",
    "sectionTitle": "Project policies",
    "module": null,
    "callable": false,
    "useWhen": "Read this when selecting a downloadable release or checking what stability and compatibility the source alpha promises.",
    "code": null,
    "signature": "0.1.0-alpha",
    "parameters": [],
    "returns": null,
    "name": "Releases",
    "description": "The tagged source-alpha release binds source, host archives, checksums, notices, SBOMs, and installation instructions.",
    "points": [
      "The current release is pre-release software, not a stable production promise.",
      "Verify downloaded files against the release manifest before installation.",
      "Use the compatibility and support policies to distinguish verified targets from host-dependent claims."
    ],
    "previousPageId": "policies/item-6",
    "nextPageId": null,
    "relatedPageIds": []
  }
]);
