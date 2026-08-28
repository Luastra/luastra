// Generated from the checked Luastra SDK and reference-data.js. Do not edit by hand.

export const generatedPages = Object.freeze([
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
    ]
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
    "language": "Shell"
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
    "language": "Shell"
  },
  {
    "id": "installation/item-4",
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
    "language": "Shell"
  },
  {
    "id": "quickstart/item-1",
    "kind": "entry",
    "sectionId": "quickstart",
    "sectionTitle": "Quick start",
    "module": "installed luastra CLI",
    "callable": false,
    "useWhen": "Start here when creating a new Luastra application in its own directory.",
    "code": "luastra create hello-luastra\ncd hello-luastra",
    "signature": "luastra create hello-luastra",
    "parameters": [],
    "returns": null,
    "name": "Create and enter a project",
    "description": "Creates the starter project in a new directory.",
    "language": "Shell"
  },
  {
    "id": "quickstart/item-2",
    "kind": "entry",
    "sectionId": "quickstart",
    "sectionTitle": "Quick start",
    "module": "installed luastra CLI",
    "callable": false,
    "useWhen": "Run this after editing source or the manifest and before previewing or building the project.",
    "code": "luastra check\nluastra test",
    "signature": "luastra check · luastra test",
    "parameters": [],
    "returns": null,
    "name": "Check and test",
    "description": "Analyze the strict Luau graph and run bounded project tests.",
    "language": "Shell"
  },
  {
    "id": "quickstart/item-3",
    "kind": "entry",
    "sectionId": "quickstart",
    "sectionTitle": "Quick start",
    "module": "installed luastra CLI",
    "callable": false,
    "useWhen": "Use preview while developing interactively and checking changes in a browser with rebuild feedback.",
    "code": "luastra run",
    "signature": "luastra run",
    "parameters": [],
    "returns": null,
    "name": "Preview",
    "description": "Starts the local development host and prints the URL to open.",
    "language": "Shell"
  },
  {
    "id": "quickstart/item-4",
    "kind": "entry",
    "sectionId": "quickstart",
    "sectionTitle": "Quick start",
    "module": "installed luastra CLI",
    "callable": false,
    "useWhen": "Build the web target when you need a production-style static artifact for HTTP serving or deployment verification.",
    "code": "luastra build web",
    "signature": "luastra build web",
    "parameters": [],
    "returns": null,
    "name": "Build the web target",
    "description": "Creates a static web artifact that must be served over HTTP.",
    "language": "Shell"
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
    "language": "Shell"
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
    "language": "Shell"
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
    "language": "Shell"
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
    "language": "Shell"
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
    "language": "Shell"
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
    "language": "Shell"
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
    "description": "A colon declares the expected type. Luau can infer obvious local values, while function and module boundaries benefit from explicit annotations."
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
    ]
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
    ]
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
    "description": "A table type is Luau's struct-like construct. The analyzer checks required fields and their value types."
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
    ]
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
    "description": "A question mark means that a value may be absent. Narrow away nil before using the value as T."
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
    "description": "A value may match either type. A type, typeof, nil, or tag check narrows the union to a safe branch."
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
    "wide": true
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
    "wide": true
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
    "description": "Callbacks and ordinary functions can be typed. () after the arrow means the function returns no values."
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
    "wide": true
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
    "description": "Derive a type from an existing value. It is convenient for local configuration; an explicit type is often clearer for a public contract."
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
    "description": "Require a value to satisfy both types, which is useful when combining small reusable contracts."
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
    ]
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
    ]
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
    ]
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
    ]
  },
  {
    "id": "beginner-tutorial/item-1",
    "kind": "entry",
    "sectionId": "beginner-tutorial",
    "sectionTitle": "Beginner tutorial: an accessible counter",
    "module": "UI · state · handle",
    "callable": false,
    "useWhen": "Import luastra/ui in every module that constructs or annotates host-neutral UI nodes.",
    "code": "local UI = require(\"luastra/ui\")",
    "signature": "local UI = require(\"luastra/ui\")",
    "parameters": [],
    "returns": null,
    "name": "1. Import the UI module",
    "description": "Only declared public dependencies may be imported."
  },
  {
    "id": "beginner-tutorial/item-2",
    "kind": "entry",
    "sectionId": "beginner-tutorial",
    "sectionTitle": "Beginner tutorial: an accessible counter",
    "module": "UI · state · handle",
    "callable": false,
    "useWhen": "Keep small session state in module scope when it must survive renders but does not need persistence across application restarts.",
    "code": "local count: number = 0",
    "signature": "local count = 0",
    "parameters": [],
    "returns": null,
    "name": "2. Own application state",
    "description": "Module state survives ordinary renders in the current application session."
  },
  {
    "id": "beginner-tutorial/item-3",
    "kind": "function",
    "sectionId": "beginner-tutorial",
    "sectionTitle": "Beginner tutorial: an accessible counter",
    "module": "UI · state · handle",
    "callable": true,
    "useWhen": "Implement Application.handle whenever UI or host events need to validate input, update state, start a capability request, or choose the next screen.",
    "code": "function Application.handle(action: string, target: string, _value: string)\n    if action == \"counter.add\" and target == \"counter/add\" then\n        count += 1\n    end\nend",
    "signature": "Application.handle(action: string, target: string, value: string)",
    "parameters": [
      {
        "name": "action",
        "values": "string",
        "description": "The admitted action declared by onTap, onInput, onDismiss, or a host event."
      },
      {
        "name": "target",
        "values": "string",
        "description": "The stable component ID or host target that emitted the event."
      },
      {
        "name": "value",
        "values": "string",
        "description": "The committed input value or bounded host-event payload; it may be empty."
      }
    ],
    "returns": "Nothing. After the handler returns, Luastra renders the application again from current state.",
    "name": "3. Handle the action",
    "description": "The button emits a bounded action; the handler changes state."
  },
  {
    "id": "beginner-tutorial/item-4",
    "kind": "function",
    "sectionId": "beginner-tutorial",
    "sectionTitle": "Beginner tutorial: an accessible counter",
    "module": "UI · state · handle",
    "callable": true,
    "useWhen": "Implement Application.render in every Luastra entry module to describe the complete current interface from application state, using any supported semantic, layout, visual, input, or media-related UI components.",
    "code": "function Application.render(): UI.Node\n    return UI.Screen {\n        id = \"app\",\n        UI.Text {\n            id = \"counter/title\",\n            text = \"Counter\",\n            variant = \"title\",\n        },\n        UI.Text {\n            id = \"counter/value\",\n            text = tostring(count),\n            role = \"status\",\n        },\n        UI.Button {\n            id = \"counter/add\",\n            text = \"Add\",\n            onTap = \"counter.add\",\n        },\n    }\nend",
    "signature": "Application.render() -> UI.Node",
    "parameters": [],
    "returns": "UI.Node — exactly one UI.Screen root containing the current interface.",
    "name": "4. Render semantic UI",
    "description": "Return the complete host-neutral UI tree for current application state. This example uses Text and Button, but render may compose any supported Luastra UI components."
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
    "description": "Define canonical locations once and reject malformed parameters."
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
    "description": "Persist a small deterministic snapshot with an explicit version."
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
    "description": "Static Luau types do not make storage or server payloads trustworthy."
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
    "description": "Match the RequestId and handle bounded failure information."
  },
  {
    "id": "first-app/item-1",
    "kind": "entry",
    "sectionId": "first-app",
    "sectionTitle": "Complete mini-app",
    "module": "src/main.luau",
    "callable": false,
    "useWhen": "Use this complete example when learning how module state, event handling, semantic UI, and repeated rendering fit together in one Luastra entry module.",
    "code": "--!strict\nlocal UI = require(\"luastra/ui\")\n\nlocal count = 0\nlocal Application = {}\n\nfunction Application.handle(action: string, _target: string, _value: string)\n    if action == \"add\" then\n        count += 1\n    end\nend\n\nfunction Application.render(): UI.Node\n    return UI.Screen {\n        id = \"app\",\n        UI.Text {\n            id = \"count\",\n            text = tostring(count),\n            role = \"status\",\n        },\n        UI.Button {\n            id = \"add\",\n            text = \"Add\",\n            onTap = \"add\",\n        },\n    }\nend\n\nreturn Application",
    "signature": "Application.render + Application.handle",
    "parameters": [],
    "returns": null,
    "name": "Interaction counter",
    "description": "A complete minimal app.",
    "wide": true
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
    "description": "Returns the complete current interface as exactly one UI.Screen root."
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
    "description": "Receives admitted UI and host events before the next render."
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
    "description": "Receives the bounded completion of an asynchronous Host, Server, or Media request."
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
    ]
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
    ]
  },
  {
    "id": "ui/item-1",
    "kind": "type",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    "description": "UI.Properties is the validated map stored on a declarative UI node after constructor checks. It carries only serializable, admitted property values that host renderers can interpret consistently."
  },
  {
    "id": "ui/item-2",
    "kind": "type",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    "description": "UI.Theme is a reusable record of optional screen color overrides. Direct UI.Screen color fields take precedence, while every omitted field inherits Luastra's built-in accessible palette."
  },
  {
    "id": "ui/item-3",
    "kind": "type",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    "description": "UI.Node is the host-neutral declarative value produced by every UI constructor. Nodes contain a validated component kind, stable ID, properties, and children that hosts translate into native semantic interface elements."
  },
  {
    "id": "ui/item-4",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-5",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-6",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-7",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-8",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "Keeps native button semantics, keyboard activation, and visible focus. Do not replace it with a tappable Shape.",
    "commonMistakes": [
      "Using uppercase letters or spaces in the onTap action.",
      "Duplicating the same id across render branches."
    ],
    "callable": true,
    "useWhen": "Use UI.Button when the user initiates an operation or changes application state. Use UI.Link for navigation to a location; do not simulate a button by making a Shape clickable.",
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
        "values": "string, required",
        "description": "Visible button label."
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
    "description": "Creates an accessible native action that supports pointer, touch, keyboard, disabled state, and appearance semantics. Activation sends its declared onTap action and stable component ID to Application.handle.",
    "props": [
      "action",
      "text-style",
      "semantic"
    ]
  },
  {
    "id": "ui/item-9",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "Keeps native link semantics. Its visible text should explain the destination without relying on surrounding prose.",
    "commonMistakes": [
      "Using a duplicate id or an uppercase path segment.",
      "Passing a shared-group parameter that is not listed on this component page."
    ],
    "callable": true,
    "useWhen": "Use UI.Link when activation changes location or opens a documented resource. Use UI.Button when the action modifies current application state without navigating.",
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
        "values": "#fragment | HTTPS URL, required",
        "description": "Safe internal fragment or external HTTPS destination."
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
    "description": "Creates a semantic link for an admitted internal destination or safe external HTTPS location. Hosts preserve link navigation and accessibility behavior instead of treating it as a generic tap action.",
    "props": [
      "action",
      "text-style",
      "semantic"
    ]
  },
  {
    "id": "ui/item-10",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-11",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-12",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-13",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-14",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-15",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-16",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-17",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
    "mentalModel": "This is a declarative node: Application.render describes it again from current state, while the host matches its stable id to the existing view.",
    "childRules": "This component does not accept arbitrary child nodes; named parameters provide its content.",
    "accessibility": "label is required; use an empty string only for a genuinely decorative image.",
    "commonMistakes": [
      "Passing a filesystem path or URL instead of an admitted asset URI.",
      "Omitting the required label."
    ],
    "callable": true,
    "useWhen": "Use UI.Image for packaged raster or supported vector artwork. Use UI.Shape for geometry that can be expressed without an asset, and supply a meaningful label unless the image is decorative.",
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
    ]
  },
  {
    "id": "ui/item-18",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-19",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-20",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-21",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-22",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-23",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-24",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-25",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-26",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    "description": "Creates a bounded vertical or horizontal scrolling region and preserves its children as one navigable group. It prevents oversized content from forcing the surrounding screen beyond its intended bounds.",
    "props": [
      "layout",
      "scroll",
      "semantic"
    ]
  },
  {
    "id": "ui/item-27",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-28",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
  },
  {
    "id": "ui/item-29",
    "kind": "entry",
    "sectionId": "ui",
    "sectionTitle": "Interface components",
    "module": "luastra/ui",
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    "description": "check verifies the file before display."
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
    "description": "The first child defines shared bounds."
  },
  {
    "id": "motion/item-1",
    "kind": "type",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Motion.Easing is part of the declarative motion model consumed by supported UI motion properties. It describes deterministic values and timing; the host scheduler applies frames without rerunning Application.render for every animation frame."
  },
  {
    "id": "motion/item-2",
    "kind": "type",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Motion.TweenOptions is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted."
  },
  {
    "id": "motion/item-3",
    "kind": "type",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Motion.Tween is part of the declarative motion model consumed by supported UI motion properties. It describes deterministic values and timing; the host scheduler applies frames without rerunning Application.render for every animation frame."
  },
  {
    "id": "motion/item-4",
    "kind": "type",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Motion.Wait is part of the declarative motion model consumed by supported UI motion properties. It describes deterministic values and timing; the host scheduler applies frames without rerunning Application.render for every animation frame."
  },
  {
    "id": "motion/item-5",
    "kind": "type",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Motion.Sequence is part of the declarative motion model consumed by supported UI motion properties. It describes deterministic values and timing; the host scheduler applies frames without rerunning Application.render for every animation frame."
  },
  {
    "id": "motion/item-6",
    "kind": "type",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Motion.Descriptor is part of the declarative motion model consumed by supported UI motion properties. It describes deterministic values and timing; the host scheduler applies frames without rerunning Application.render for every animation frame."
  },
  {
    "id": "motion/item-7",
    "kind": "type",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Motion.MotionMap is part of the declarative motion model consumed by supported UI motion properties. It describes deterministic values and timing; the host scheduler applies frames without rerunning Application.render for every animation frame."
  },
  {
    "id": "motion/item-8",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Creates one deterministic numeric transition from a starting value to an ending value over a bounded duration and easing curve. A Tween becomes meaningful only when assigned to a supported motion channel or placed in a Sequence."
  },
  {
    "id": "motion/item-9",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Creates a non-visual delay step for Motion.sequence. It advances no property itself and exists only to postpone the next Tween in the same channel."
  },
  {
    "id": "motion/item-10",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Combines Tween and Wait steps into one ordered value for a single motion channel, optionally repeating the sequence. Each step begins after the previous step finishes, so timing remains deterministic across hosts."
  },
  {
    "id": "motion/item-11",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Returns a complete MotionMap that transitions opacity from a lower value to fully visible using bounded preset defaults and optional overrides. The map can be assigned directly to a component's motion property."
  },
  {
    "id": "motion/item-12",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "callable": true,
    "useWhen": "Use Motion.slideIn to introduce a panel, card, or route whose direction reinforces where it came from. Do not use it to repair layout spacing, and keep the distance modest for frequently repeated elements.",
    "code": "local Motion = require(\"luastra/motion\")\nlocal motion = Motion.slideIn { fromY = 24, durationMs = 300 }",
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
    "description": "Returns a MotionMap that combines translation with the preset's arrival timing, moving content from an offset into its final layout position. Layout is calculated at the destination; motion changes only the rendered transform."
  },
  {
    "id": "motion/item-13",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Returns a MotionMap that grows a component from a smaller scale to its final size without changing the space reserved by layout. Optional values tune the starting scale, duration, and easing within admitted bounds."
  },
  {
    "id": "motion/item-14",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
    "callable": true,
    "useWhen": "Use Motion.sway for occasional ambient motion on a decorative or game-like object, such as a hidden card. Keep the angle small, stop it when the object is inactive, and rely on host reduced-motion handling.",
    "code": "local Motion = require(\"luastra/motion\")\nlocal motion = Motion.sway { rotationDeg = 2, durationMs = 2400, iterations = 0 }",
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
    "description": "Returns a repeating rotation MotionMap that alternates around the resting angle, producing a gentle rocking effect. Iteration and duration options control whether it settles or continues."
  },
  {
    "id": "motion/item-15",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Returns a repeating scale MotionMap that expands and contracts around the component's normal size. The component keeps its original layout bounds while the transform provides visual emphasis."
  },
  {
    "id": "motion/item-16",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Returns a short horizontal translation MotionMap that moves away from and back to the resting position. It is designed as bounded feedback rather than an ambient loop."
  },
  {
    "id": "motion/item-17",
    "kind": "entry",
    "sectionId": "motion",
    "sectionTitle": "Declarative motion",
    "module": "luastra/motion",
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
    "description": "Returns a rotationY MotionMap tailored to UI.FlipCard, moving between front and back angles over a bounded duration. The FlipCard host uses the channel to hide the reverse face correctly during the 3D transition."
  },
  {
    "id": "assets/item-1",
    "kind": "type",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
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
    "description": "Assets.Image is an exported, statically checked data contract of luastra/assets. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis."
  },
  {
    "id": "assets/item-2",
    "kind": "type",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
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
    "description": "Assets.Audio is an exported, statically checked data contract of luastra/assets. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis."
  },
  {
    "id": "assets/item-3",
    "kind": "type",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
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
    "description": "Assets.Font is an exported, statically checked data contract of luastra/assets. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis."
  },
  {
    "id": "assets/item-4",
    "kind": "type",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
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
    "description": "Assets.Reference is an exported, statically checked data contract of luastra/assets. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis."
  },
  {
    "id": "assets/item-5",
    "kind": "entry",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
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
    "description": "Creates a typed reference to an image declared in luastra.json. Construction validates the asset identifier and preserves its media kind so an image cannot be passed accidentally where audio or a font is required."
  },
  {
    "id": "assets/item-6",
    "kind": "entry",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
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
    "description": "Creates a typed reference to an admitted audio asset while retaining the asset kind and canonical asset URI. The reference can be stored safely before a media queue is assembled."
  },
  {
    "id": "assets/item-7",
    "kind": "entry",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
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
    "description": "Creates a typed reference to a font declared by the project manifest. The result distinguishes font resources from images and audio before a host attempts to consume them."
  },
  {
    "id": "assets/item-8",
    "kind": "entry",
    "sectionId": "assets",
    "sectionTitle": "Typed assets",
    "module": "luastra/assets",
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
    "description": "Returns the canonical asset URI carried by a typed Image, Audio, Font, or general Reference. The URI is host-neutral and points only to a resource already admitted by the project manifest."
  },
  {
    "id": "data/item-1",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
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
    "description": "Data.ValidationError represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message."
  },
  {
    "id": "data/item-2",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
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
    "description": "Data.Success represents the successful branch of a discriminated SDK result. Its value and success-specific fields are safe to read only after the shared success tag has narrowed the union."
  },
  {
    "id": "data/item-3",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
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
    "description": "Data.Failure represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message."
  },
  {
    "id": "data/item-4",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
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
    "description": "Data.Result is a discriminated union covering successful output and bounded failure. Branching on success narrows the value to the correct exported record and makes error handling explicit."
  },
  {
    "id": "data/item-5",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
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
    "description": "Data.StringOptions is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted."
  },
  {
    "id": "data/item-6",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
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
    "description": "Data.NumberOptions is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted."
  },
  {
    "id": "data/item-7",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
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
    "description": "Data.ArrayOptions is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted."
  },
  {
    "id": "data/item-8",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
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
    "description": "Data.ObjectOptions is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted."
  },
  {
    "id": "data/item-9",
    "kind": "type",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
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
    "description": "Data.Schema is an exported, statically checked data contract of luastra/data. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis."
  },
  {
    "id": "data/item-10",
    "kind": "entry",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "callable": true,
    "useWhen": "Use Data.string for form fields, URL parameters, storage fields, or server properties that must be text at runtime. Add the narrowest useful constraints at the untrusted boundary instead of checking them repeatedly in application logic.",
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
    "description": "Builds a runtime schema for string input with optional length, pattern, or other bounded constraints defined by Data.StringOptions. The schema is a description only; validation occurs later through Data.decode."
  },
  {
    "id": "data/item-11",
    "kind": "entry",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
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
    "description": "Builds a schema that accepts finite numeric values and can enforce the documented minimum, maximum, or integer constraints. Non-numbers and non-finite values fail with structured validation information."
  },
  {
    "id": "data/item-12",
    "kind": "entry",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
    "callable": true,
    "useWhen": "Use Data.boolean for persisted toggles and server fields whose wire contract is genuinely Boolean. Normalize legacy encodings before this boundary or migrate them explicitly rather than relying on implicit coercion.",
    "code": "local Data = require(\"luastra/data\")\nlocal enabled = Data.boolean()",
    "signature": "Data.boolean(): Schema",
    "parameters": [],
    "returns": "Schema — an immutable runtime schema that can be composed or passed to Data.decode.",
    "name": "Data.boolean",
    "description": "Builds a strict boolean schema that accepts only true or false. It does not coerce strings such as \"true\", numeric flags, or other truthy values."
  },
  {
    "id": "data/item-13",
    "kind": "entry",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
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
    "description": "Builds a dense-array schema whose every element must satisfy the supplied item schema, with optional array-length bounds. Validation records the failing index so callers can identify malformed members."
  },
  {
    "id": "data/item-14",
    "kind": "entry",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
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
    "description": "Builds a schema for a table with named fields, validating each field through its own child schema and applying the object options for unknown keys. Nested schemas preserve a structured path to every failure."
  },
  {
    "id": "data/item-15",
    "kind": "entry",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
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
    "description": "Wraps another schema so nil is accepted in addition to the wrapped value. A non-nil value still passes through the complete nested validation contract."
  },
  {
    "id": "data/item-16",
    "kind": "entry",
    "sectionId": "data",
    "sectionTitle": "Runtime data validation",
    "module": "luastra/data",
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
    "description": "Validates an unknown runtime value against a Schema and returns a discriminated Data.Result instead of throwing for ordinary invalid input. Success contains the trusted value; failure contains a bounded code and path."
  },
  {
    "id": "state/item-1",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
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
    "description": "State.Fields is an exported, statically checked data contract of luastra/state. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis."
  },
  {
    "id": "state/item-2",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
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
    "description": "State.DecodeError represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message."
  },
  {
    "id": "state/item-3",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
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
    "description": "State.DecodeSuccess represents the successful branch of a discriminated SDK result. Its value and success-specific fields are safe to read only after the shared success tag has narrowed the union."
  },
  {
    "id": "state/item-4",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
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
    "description": "State.DecodeFailure represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message."
  },
  {
    "id": "state/item-5",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
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
    "description": "State.DecodeResult is a discriminated union covering successful output and bounded failure. Branching on success narrows the value to the correct exported record and makes error handling explicit."
  },
  {
    "id": "state/item-6",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
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
    "description": "State.MigrationError represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message."
  },
  {
    "id": "state/item-7",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
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
    "description": "State.MigrationSuccess represents the successful branch of a discriminated SDK result. Its value and success-specific fields are safe to read only after the shared success tag has narrowed the union."
  },
  {
    "id": "state/item-8",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
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
    "description": "State.MigrationFailure represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message."
  },
  {
    "id": "state/item-9",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
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
    "description": "State.MigrationResult is a discriminated union covering successful output and bounded failure. Branching on success narrows the value to the correct exported record and makes error handling explicit."
  },
  {
    "id": "state/item-10",
    "kind": "type",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
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
    "description": "State.Migration is an exported, statically checked data contract of luastra/state. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis."
  },
  {
    "id": "state/item-11",
    "kind": "entry",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
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
    "description": "Serializes a finite field map together with an explicit positive version into Luastra's deterministic snapshot format. The output is suitable for host storage and can be compared or migrated predictably."
  },
  {
    "id": "state/item-12",
    "kind": "entry",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
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
    "description": "Parses a snapshot string, verifies its structure and version, and returns a discriminated DecodeResult. A version mismatch or malformed value remains a normal failure branch rather than becoming trusted state."
  },
  {
    "id": "state/item-13",
    "kind": "entry",
    "sectionId": "state",
    "sectionTitle": "Versioned state",
    "module": "luastra/state",
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
    "description": "Decodes a snapshot and applies explicitly ordered Migration functions until it reaches the requested target version. The result records structured failure if a step is missing, invalid, or does not advance correctly."
  },
  {
    "id": "navigation/item-1",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
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
    "description": "Navigation.Snapshot is an exported, statically checked data contract of luastra/navigation. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis."
  },
  {
    "id": "navigation/item-2",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
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
    "description": "Navigation.RestoreError represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message."
  },
  {
    "id": "navigation/item-3",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "callable": false,
    "useWhen": "Use Navigation.RestoreResult at the boundary where untrusted or versioned input is decoded. Branch on result.success before reading value or error so both outcomes remain explicit and type-safe.",
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
    "description": "Navigation.RestoreResult is a discriminated union covering successful output and bounded failure. Branching on success narrows the value to the correct exported record and makes error handling explicit."
  },
  {
    "id": "navigation/item-4",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
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
    "description": "Navigation.Options is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted."
  },
  {
    "id": "navigation/item-5",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
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
    "description": "Navigation.Stack is a stateful navigation contract that owns route history or translates between route entries and canonical locations. Its public methods validate mutations and return bounded results instead of exposing internal tables."
  },
  {
    "id": "navigation/item-6",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
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
    "description": "Navigation.RouteError represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message."
  },
  {
    "id": "navigation/item-7",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
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
    "description": "Navigation.RouteEntry is an exported, statically checked data contract of luastra/navigation. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis."
  },
  {
    "id": "navigation/item-8",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "callable": false,
    "useWhen": "Use Navigation.RouteResult at the boundary where untrusted or versioned input is decoded. Branch on result.success before reading value or error so both outcomes remain explicit and type-safe.",
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
    "description": "Navigation.RouteResult is a discriminated union covering successful output and bounded failure. Branching on success narrows the value to the correct exported record and makes error handling explicit."
  },
  {
    "id": "navigation/item-9",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
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
    "description": "Navigation.RouteCompiler is a stateful navigation contract that owns route history or translates between route entries and canonical locations. Its public methods validate mutations and return bounded results instead of exposing internal tables."
  },
  {
    "id": "navigation/item-10",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
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
    "description": "Navigation.EntrySnapshot is an exported, statically checked data contract of luastra/navigation. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis."
  },
  {
    "id": "navigation/item-11",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
    "callable": false,
    "useWhen": "Use Navigation.MutationResult at the boundary where untrusted or versioned input is decoded. Branch on result.success before reading value or error so both outcomes remain explicit and type-safe.",
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
    "description": "Navigation.MutationResult is a discriminated union covering successful output and bounded failure. Branching on success narrows the value to the correct exported record and makes error handling explicit."
  },
  {
    "id": "navigation/item-12",
    "kind": "type",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
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
    "description": "Navigation.EntryStack is a stateful navigation contract that owns route history or translates between route entries and canonical locations. Its public methods validate mutations and return bounded results instead of exposing internal tables."
  },
  {
    "id": "navigation/item-13",
    "kind": "entry",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
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
    "description": "Evaluates the current modal, application stack, browser history, and root-exit conditions and returns the bounded Back action the application should take. It centralizes priority so platform Back behaves consistently."
  },
  {
    "id": "navigation/item-14",
    "kind": "entry",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
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
    "description": "Creates a named-route stack initialized from Navigation.Options and exposes operations such as current, push, replace, back, encode, and restore. The stack is ordinary application state and survives renders when created once at module scope."
  },
  {
    "id": "navigation/item-15",
    "kind": "entry",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
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
    "description": "Creates an entry-based navigation stack whose entries carry a route name, parameters, query values, and optional state. Mutations return structured results rather than relying on unchecked table shapes."
  },
  {
    "id": "navigation/item-16",
    "kind": "entry",
    "sectionId": "navigation",
    "sectionTitle": "Navigation and routes",
    "module": "luastra/navigation",
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
    "description": "Compiles route definitions into a RouteCompiler that generates canonical locations and matches incoming path and query strings back to typed route entries. Invalid definitions and malformed locations produce bounded route errors."
  },
  {
    "id": "timer/item-1",
    "kind": "type",
    "sectionId": "timer",
    "sectionTitle": "Application timers",
    "module": "luastra/timer",
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
    "description": "Timer.RequestId is the numeric acknowledgement returned by a timer control call. It confirms that the command crossed the SDK boundary, while the stable string timer ID identifies the later expiry delivered to Application.handle."
  },
  {
    "id": "timer/item-2",
    "kind": "type",
    "sectionId": "timer",
    "sectionTitle": "Application timers",
    "module": "luastra/timer",
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
    "description": "Timer.StartOptions is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted."
  },
  {
    "id": "timer/item-3",
    "kind": "entry",
    "sectionId": "timer",
    "sectionTitle": "Application timers",
    "module": "luastra/timer",
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
        "values": "integer (0..86400000)",
        "description": "Delay before delivery, in milliseconds."
      },
      {
        "name": "options.value",
        "values": "string?",
        "description": "Optional bounded value delivered with the timer event."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Timer.start",
    "description": "Registers a one-shot timer under the supplied stable string ID and returns an acknowledgement RequestId. After the delay, Luastra sends handle(\"timer\", id, value); it does not call Application.resolve for expiry."
  },
  {
    "id": "timer/item-4",
    "kind": "entry",
    "sectionId": "timer",
    "sectionTitle": "Application timers",
    "module": "luastra/timer",
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
        "values": "integer (0..86400000)",
        "description": "Fresh delay before the replacement timer fires."
      },
      {
        "name": "options.value",
        "values": "string?",
        "description": "Optional bounded value delivered with the replacement event."
      }
    ],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Timer.restart",
    "description": "Replaces the pending one-shot timer with the same ID and schedules a fresh delay and value. This makes repeated input postpone one logical deadline instead of allowing several expiries to race."
  },
  {
    "id": "timer/item-5",
    "kind": "entry",
    "sectionId": "timer",
    "sectionTitle": "Application timers",
    "module": "luastra/timer",
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
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Timer.cancel",
    "description": "Cancels the pending timer identified by the stable string ID and returns a request acknowledgement. A successfully cancelled timer will not later emit its timer event."
  },
  {
    "id": "host/item-1",
    "kind": "type",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
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
    "description": "Host.RequestId is an opaque numeric identifier allocated for one asynchronous operation. Store it with the operation's purpose so Application.resolve can correlate out-of-order completions without inspecting payload text."
  },
  {
    "id": "host/item-2",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
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
    "description": "Starts an asynchronous read of the named host storage entry and returns a RequestId. Completion arrives in Application.resolve with the stored string or a bounded failure code."
  },
  {
    "id": "host/item-3",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
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
    "description": "Starts an asynchronous write of a bounded string to the named host storage entry and returns a RequestId. Resolve confirms whether the host committed the value."
  },
  {
    "id": "host/item-4",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "callable": true,
    "useWhen": "Use Host.launchUrl only in the corresponding host-mediated flow when an external location must open outside Luastra rendering. Prefer UI.Link for ordinary visible navigation initiated directly by a user.",
    "code": "local Host = require(\"luastra/host\")\nlocal requestId = Host.launchUrl()",
    "signature": "Host.launchUrl(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.launchUrl",
    "description": "Requests that the host open the URL currently associated with the admitted launch-url event contract and returns a RequestId. The host validates scheme and policy before leaving the application."
  },
  {
    "id": "host/item-5",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
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
    "description": "Requests that the host place a bounded string on the system clipboard and returns a RequestId for completion. Clipboard access remains an explicit capability rather than a hidden side effect."
  },
  {
    "id": "host/item-6",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
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
    "description": "Adds a new browser-history entry with the supplied opaque application state token while retaining the current location. The asynchronous acknowledgement is delivered through Application.resolve."
  },
  {
    "id": "host/item-7",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
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
    "description": "Replaces the current browser-history state token without adding a new Back entry. It keeps the current location and returns a RequestId for host acknowledgement."
  },
  {
    "id": "host/item-8",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
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
    "description": "Adds a browser-history entry containing both a canonical location and an opaque application state token. This keeps the address bar, deep-link representation, and application stack synchronized."
  },
  {
    "id": "host/item-9",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
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
    "description": "Replaces the current browser-history location and state token without extending the Back stack. The host validates and acknowledges the requested history mutation asynchronously."
  },
  {
    "id": "host/item-10",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "callable": true,
    "useWhen": "Use Host.historyBack after Navigation.decideBack delegates to browser history or when a UI Back control intentionally mirrors browser Back. Do not also pop application state independently unless the history event contract requires it.",
    "code": "local Host = require(\"luastra/host\")\nHost.historyBack()",
    "signature": "Host.historyBack(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.historyBack",
    "description": "Requests one step back in the host browser history and returns a RequestId. The resulting location or system-Back event remains part of the normal navigation event flow."
  },
  {
    "id": "host/item-11",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
    "callable": true,
    "useWhen": "Use Host.historyCurrent at startup or after an external history change when the application must match the browser's current entry. Validate and compile the returned location before rendering a route.",
    "code": "local Host = require(\"luastra/host\")\nlocal requestId = Host.historyCurrent()",
    "signature": "Host.historyCurrent(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Host.historyCurrent",
    "description": "Requests the host's current location and associated state token, returning a RequestId whose payload can initialize or reconcile application navigation."
  },
  {
    "id": "host/item-12",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
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
    "description": "Acknowledges that the application consumed a specific system-Back intent without delegating to browser history or exiting. The intent ID prevents an unrelated or stale Back request from being acknowledged."
  },
  {
    "id": "host/item-13",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
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
    "description": "Delegates a specific system-Back intent to the host history mechanism and returns a RequestId. It preserves platform navigation behavior when an earlier history entry is available."
  },
  {
    "id": "host/item-14",
    "kind": "entry",
    "sectionId": "host",
    "sectionTitle": "Host capabilities",
    "module": "luastra/host",
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
    "description": "Acknowledges a root-level system-Back intent by requesting the host's admitted exit behavior. The intent ID correlates the decision with the exact pending Back event."
  },
  {
    "id": "server/item-1",
    "kind": "type",
    "sectionId": "server",
    "sectionTitle": "Server functions",
    "module": "luastra/server",
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
    "description": "Server.RequestId is an opaque numeric identifier allocated for one asynchronous operation. Store it with the operation's purpose so Application.resolve can correlate out-of-order completions without inspecting payload text."
  },
  {
    "id": "server/item-2",
    "kind": "type",
    "sectionId": "server",
    "sectionTitle": "Server functions",
    "module": "luastra/server",
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
    "description": "Server.Options is the checked configuration record accepted by the related SDK operation. Required fields establish the minimum contract, while optional fields preserve documented defaults when omitted."
  },
  {
    "id": "server/item-3",
    "kind": "type",
    "sectionId": "server",
    "sectionTitle": "Server functions",
    "module": "luastra/server",
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
    "description": "Server.DecodeSuccess represents the successful branch of a discriminated SDK result. Its value and success-specific fields are safe to read only after the shared success tag has narrowed the union."
  },
  {
    "id": "server/item-4",
    "kind": "type",
    "sectionId": "server",
    "sectionTitle": "Server functions",
    "module": "luastra/server",
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
    "description": "Server.DecodeFailure represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message."
  },
  {
    "id": "server/item-5",
    "kind": "type",
    "sectionId": "server",
    "sectionTitle": "Server functions",
    "module": "luastra/server",
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
    "description": "Server.DecodeResult is a discriminated union covering successful output and bounded failure. Branching on success narrows the value to the correct exported record and makes error handling explicit."
  },
  {
    "id": "server/item-6",
    "kind": "entry",
    "sectionId": "server",
    "sectionTitle": "Server functions",
    "module": "luastra/server",
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
    "description": "Starts a versioned request to a trusted backend operation with a bounded string map and optional request settings, returning a RequestId. Server authentication, authorization, validation, and secrets remain outside client Luau."
  },
  {
    "id": "server/item-7",
    "kind": "entry",
    "sectionId": "server",
    "sectionTitle": "Server functions",
    "module": "luastra/server",
    "callable": true,
    "useWhen": "Use Server.decode on a successful server resolve payload before reading operation data. Treat decode failure as an untrusted or incompatible response and keep application state unchanged or move to an explicit error state.",
    "code": "local Server = require(\"luastra/server\")\nlocal result = Server.decode(payload)\nif result.success then records = result.value end",
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
    "description": "Parses the bounded payload returned by a Luastra server operation into a discriminated DecodeResult. It separates envelope validity from the transport success reported to Application.resolve."
  },
  {
    "id": "media/item-1",
    "kind": "type",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
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
    "description": "Media.RequestId is an opaque numeric identifier allocated for one asynchronous operation. Store it with the operation's purpose so Application.resolve can correlate out-of-order completions without inspecting payload text."
  },
  {
    "id": "media/item-2",
    "kind": "type",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
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
    "description": "Media.QueueItem is an exported, statically checked data contract of luastra/media. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis."
  },
  {
    "id": "media/item-3",
    "kind": "type",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
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
    "description": "Media.MediaError represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message."
  },
  {
    "id": "media/item-4",
    "kind": "type",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
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
    "description": "Media.State is an exported, statically checked data contract of luastra/media. Its exact declaration documents the fields or alternatives accepted at the module boundary and is erased after Luau analysis."
  },
  {
    "id": "media/item-5",
    "kind": "type",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
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
    "description": "Media.DecodeSuccess represents the successful branch of a discriminated SDK result. Its value and success-specific fields are safe to read only after the shared success tag has narrowed the union."
  },
  {
    "id": "media/item-6",
    "kind": "type",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
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
    "description": "Media.DecodeFailure represents the unsuccessful branch of a bounded operation. Its stable code and structured context support control flow and safe diagnostics without parsing an exception message."
  },
  {
    "id": "media/item-7",
    "kind": "type",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
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
    "description": "Media.DecodeResult is a discriminated union covering successful output and bounded failure. Branching on success narrows the value to the correct exported record and makes error handling explicit."
  },
  {
    "id": "media/item-8",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
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
    "description": "Replaces the host playback queue with validated QueueItem values and optionally selects a one-based item, returning a RequestId. The host reports later playback changes through media_state events."
  },
  {
    "id": "media/item-9",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "callable": true,
    "useWhen": "Use Media.play after a user action or admitted autoplay decision when a queue item is selected. Update visible controls from decoded media state rather than assuming the command succeeded immediately.",
    "code": "local Media = require(\"luastra/media\")\nMedia.play()",
    "signature": "Media.play(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.play",
    "description": "Requests playback of the selected queue item, resuming from the current position when the host state permits it. The returned RequestId acknowledges the command; live truth comes from media_state."
  },
  {
    "id": "media/item-10",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "callable": true,
    "useWhen": "Use Media.pause when the user temporarily stops listening or application lifecycle policy requires a resumable pause. Use stop when position should return to the beginning.",
    "code": "local Media = require(\"luastra/media\")\nMedia.pause()",
    "signature": "Media.pause(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.pause",
    "description": "Requests that playback pause while retaining the selected item and current position for a later resume. Completion and subsequent live state are delivered through the normal media contracts."
  },
  {
    "id": "media/item-11",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "callable": true,
    "useWhen": "Use Media.stop when the session ends but the same queue may be played again. Use pause for a resumable interruption and unload when the queue is no longer needed.",
    "code": "local Media = require(\"luastra/media\")\nMedia.stop()",
    "signature": "Media.stop(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.stop",
    "description": "Requests that playback stop and reset the current item according to the host contract while retaining the queue. It differs from unload, which releases the active media resources."
  },
  {
    "id": "media/item-12",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "callable": true,
    "useWhen": "Use Media.unload when leaving the media feature, signing out, or replacing the session with unrelated content. Do not unload for a brief pause because it discards resumable host state.",
    "code": "local Media = require(\"luastra/media\")\nMedia.unload()",
    "signature": "Media.unload(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.unload",
    "description": "Requests release of the active media queue and playback resources, clearing state that should not survive the current media session. A later play requires setting an appropriate queue again."
  },
  {
    "id": "media/item-13",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "callable": true,
    "useWhen": "Use Media.next for an explicit Next control or a policy that advances after completion. Disable or explain the control when decoded media state shows that no next item is available.",
    "code": "local Media = require(\"luastra/media\")\nMedia.next()",
    "signature": "Media.next(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.next",
    "description": "Requests selection of the next item in the current queue according to host queue boundaries. The actual selected index and playback state arrive through media_state."
  },
  {
    "id": "media/item-14",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "callable": true,
    "useWhen": "Use Media.previous for an explicit Previous control and derive availability from decoded media state. Define separately whether a near-start press should restart the current item in application UX.",
    "code": "local Media = require(\"luastra/media\")\nMedia.previous()",
    "signature": "Media.previous(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.previous",
    "description": "Requests selection of the previous item in the current queue according to host queue boundaries. It does not let application code assume whether the host restarts or changes items without observing state."
  },
  {
    "id": "media/item-15",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "callable": true,
    "useWhen": "Use Media.state to initialize controls after startup, restoration, or a suspected missed event. Prefer live media_state events for routine updates instead of polling continuously.",
    "code": "local Media = require(\"luastra/media\")\nlocal requestId = Media.state()",
    "signature": "Media.state(): RequestId",
    "parameters": [],
    "returns": "RequestId — an opaque request identifier used to correlate the asynchronous completion in Application.resolve.",
    "name": "Media.state",
    "description": "Requests a current snapshot of queue, selection, playback, position, duration, and bounded media error state. The asynchronous payload is decoded with Media.decodeState."
  },
  {
    "id": "media/item-16",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
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
    "description": "Requests movement of the selected media item to the supplied non-negative millisecond position. The host clamps or rejects values according to the current duration and reports the resulting state asynchronously."
  },
  {
    "id": "media/item-17",
    "kind": "entry",
    "sectionId": "media",
    "sectionTitle": "Audio and media queue",
    "module": "luastra/media",
    "callable": true,
    "useWhen": "Use Media.decodeState for every media_state event and successful Media.state response before updating controls, lock-screen-facing state, or persistence. Preserve the previous known state when decoding fails.",
    "code": "local Media = require(\"luastra/media\")\nlocal state = Media.decodeState(payload)\nif state.success then positionMs = state.positionMs end",
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
    "description": "Validates and decodes a media-state payload into a discriminated Media.DecodeResult containing the typed playback State or a bounded failure. This keeps host strings outside trusted application state until checked."
  },
  {
    "id": "debug/item-1",
    "kind": "entry",
    "sectionId": "debug",
    "sectionTitle": "Debug output",
    "module": "luastra/debug",
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
    "description": "Emits a development diagnostic at the ordinary log level, serializing the supplied values through the host's bounded debug channel. It has no role in application state or user-visible status."
  },
  {
    "id": "debug/item-2",
    "kind": "entry",
    "sectionId": "debug",
    "sectionTitle": "Debug output",
    "module": "luastra/debug",
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
    "description": "Emits a warning-level development diagnostic for an unexpected but recoverable condition. Hosts may distinguish it visually from normal logs while preserving the same bounded argument handling."
  },
  {
    "id": "debug/item-3",
    "kind": "entry",
    "sectionId": "debug",
    "sectionTitle": "Debug output",
    "module": "luastra/debug",
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
    "description": "Emits an error-level diagnostic without replacing structured application error handling or automatically terminating execution. The message is intended for developers observing a failing operation."
  },
  {
    "id": "cli/table-1",
    "kind": "parameter-group",
    "sectionId": "cli",
    "sectionTitle": "Command line",
    "module": "bin/luastra",
    "name": "Alpha commands",
    "description": "Shared parameters in the “Alpha commands” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "version",
        "values": "command",
        "description": "Runs the version workflow."
      },
      {
        "name": "create",
        "values": "command",
        "description": "Runs the create workflow."
      },
      {
        "name": "check",
        "values": "command",
        "description": "Runs the check workflow."
      },
      {
        "name": "test",
        "values": "command",
        "description": "Runs the test workflow."
      },
      {
        "name": "conformance",
        "values": "command",
        "description": "Runs the conformance workflow."
      },
      {
        "name": "generate",
        "values": "command",
        "description": "Runs the generate workflow."
      },
      {
        "name": "run",
        "values": "command",
        "description": "Runs the run workflow."
      },
      {
        "name": "build web",
        "values": "command",
        "description": "Runs the build web workflow."
      },
      {
        "name": "build bundle",
        "values": "command",
        "description": "Runs the build bundle workflow."
      },
      {
        "name": "sdk install",
        "values": "command",
        "description": "Runs the sdk install workflow."
      }
    ]
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
    "language": "JSON"
  },
  {
    "id": "manifest/item-2",
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
    "language": "JSON"
  },
  {
    "id": "manifest/item-3",
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
    "language": "JSON"
  },
  {
    "id": "manifest/item-4",
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
    "language": "JSON"
  },
  {
    "id": "support/table-1",
    "kind": "parameter-group",
    "sectionId": "support",
    "sectionTitle": "Support and boundaries",
    "module": null,
    "name": "Source alpha status",
    "description": "Shared parameters in the “Source alpha status” group. A component page links here only when it supports this group.",
    "parameters": [
      {
        "name": "Core runtime and web",
        "values": "Verified",
        "description": "check, test, run, and build."
      },
      {
        "name": "UI, IME, accessibility",
        "values": "Verified",
        "description": "Recorded cross-host evidence."
      },
      {
        "name": "Motion and Timer",
        "values": "Verified",
        "description": "Lifecycle and cancellation coverage."
      },
      {
        "name": "Media",
        "values": "Host-dependent",
        "description": "Production packaging remains separate."
      },
      {
        "name": "Public release",
        "values": "Source alpha",
        "description": "Pre-release APIs may change; production stability is not promised."
      }
    ]
  },
  {
    "id": "policies/item-1",
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
      "Use GitHub private vulnerability reporting for confidential coordination.",
      "Include the exact version or commit, affected hosts, safe reproduction steps, expected impact, and known preconditions.",
      "Never include real credentials, personal data, production tokens, or unrelated private source."
    ]
  },
  {
    "id": "policies/item-2",
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
      "Commercial support, hosted services, and paid plans are not implied by the open-source license."
    ]
  },
  {
    "id": "policies/item-3",
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
      "Third-party materials retain their upstream licenses, while brand assets remain outside the software licenses."
    ]
  },
  {
    "id": "policies/item-4",
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
      "Forks must use a distinct product identity unless the owner grants permission."
    ]
  },
  {
    "id": "policies/item-5",
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
    ]
  }
]);
