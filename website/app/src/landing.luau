--!strict

local UI = require("luastra/ui")

local Landing = {}

local section = "root"
local retainedSection: string? = nil
local selectedId: string? = nil
local motion = "system"
local themeIndex = 1
local themePickerOpen = false
local searches: {[string]: string} = { root = "", product = "", examples = "" }

local themes = {
    { id = "luastra", name = "Luastra Mineral" },
    { id = "abyss", name = "Abyss Observatory" },
    { id = "sakura", name = "Sakura Ink" },
    { id = "atlas", name = "Desert Atlas" },
    { id = "arctic", name = "Arctic Laboratory" },
    { id = "biolume", name = "Biolume Garden" },
    { id = "arcade", name = "Neon Arcade" },
    { id = "bauhaus", name = "Bauhaus Signal" },
    { id = "editorial", name = "Monochrome Editorial" },
    { id = "copper", name = "Copper Workshop" },
    { id = "candy", name = "Candy Pop" },
}

local function themeIndexFor(id: string): number?
    for index, theme in themes do
        if theme.id == id then return index end
    end
    return nil
end

local rootNodes = {
    { id = "landing/product", title = "Build with Luastra", description = "Follow the framework from first install to a verified web build.", kind = "constellation", priority = 1, icon = "compass", status = "Start", tone = "active", relatedTo = { "landing/reference", "landing/why" } },
    { id = "landing/examples", title = "Example galaxy", description = "Explore applications built from the same semantic SDK.", kind = "cluster", priority = 1, icon = "grid", count = 8, relatedTo = { "landing/product" } },
    { id = "landing/reference", title = "SDK Reference", description = "Read the complete version-bound API documentation.", kind = "action", priority = 1, icon = "book", status = "0.1.0-alpha", tone = "neutral", relatedTo = { "landing/product" } },
    { id = "landing/why", title = "Why Luastra", description = "Use a game-like development loop for application interfaces.", kind = "leaf", priority = 2, icon = "spark", relatedTo = { "landing/targets" } },
    { id = "landing/targets", title = "One application model", description = "Target web, desktop, and mobile without forking app state.", kind = "leaf", priority = 2, icon = "rocket", relatedTo = { "landing/why" } },
    { id = "landing/source", title = "Public source alpha", description = "Inspect the SDK, hosts, examples, and release evidence.", kind = "leaf", priority = 3, icon = "star", status = "Open source", tone = "success" },
}

local productNodes = {
    { id = "landing/product/install", title = "Install", description = "Set up the CLI and verify the toolchain.", docs = "installation", priority = 1, icon = "check" },
    { id = "landing/product/quickstart", title = "Quick start", description = "Create, check, test, and run a first application.", docs = "quickstart", priority = 1, icon = "play", relatedTo = { "landing/product/install", "landing/product/ui" } },
    { id = "landing/product/learn", title = "Learn Luastra", description = "Follow the guided Luau application workflow.", docs = "learning-path", priority = 2, icon = "book", relatedTo = { "landing/product/quickstart" } },
    { id = "landing/product/ui", title = "Semantic UI", description = "Describe intent while the host owns presentation.", docs = "ui", priority = 1, icon = "spark", relatedTo = { "landing/product/state", "landing/product/hosts" } },
    { id = "landing/product/state", title = "State and navigation", description = "Keep routes and persisted state explicit and testable.", docs = "navigation", priority = 2, icon = "compass", relatedTo = { "landing/product/ui" } },
    { id = "landing/product/hosts", title = "Host capabilities", description = "Cross trusted platform boundaries through bounded APIs.", docs = "host", priority = 2, icon = "settings", relatedTo = { "landing/product/ui" } },
}

local exampleNodes = {
    { id = "landing/examples/catalogue", title = "Animated Catalogue", description = "Navigation, state migration, and declarative motion.", source = "animated-catalogue", priority = 1 },
    { id = "landing/examples/orbit", title = "Constellation Orbit", description = "Spatial navigation with a complete adaptive list fallback.", source = "constellation-orbit", priority = 1 },
    { id = "landing/examples/meditation", title = "Meditation", description = "Media, server functions, identity, and native host boundaries.", source = "meditation", priority = 1 },
    { id = "landing/examples/forms", title = "Forms and CRUD", description = "Validated inputs and backend data operations.", source = "forms-crud", priority = 2 },
    { id = "landing/examples/media", title = "Media Player", description = "A compact application using the media capability.", source = "media-player", priority = 2 },
    { id = "landing/examples/routing", title = "Routing Lab", description = "Typed routes, history, and deterministic restoration.", source = "routing-lab", priority = 2 },
    { id = "landing/examples/visuals", title = "Live Visuals", description = "Assets, shapes, layers, and host-rendered effects.", source = "live-visuals", priority = 3 },
    { id = "landing/examples/debug", title = "Debug Lab", description = "Structured diagnostics across the runtime boundary.", source = "debug-lab", priority = 3 },
}

local details: {[string]: any} = {
    ["landing/why"] = {
        title = "Build apps like games",
        summary = "Luastra applies a tight create, verify, run, observe, and refine loop to application development.",
        body = "Application code owns strict Luau state and returns semantic UI. The runtime dispatches explicit events, while hosts render the current tree and provide bounded platform capabilities. This keeps product logic out of platform-specific glue without hiding the platform boundary.",
        sections = {
            { title = "The application contract", text = "Application.render returns the complete UI.Screen for current state. Application.handle receives controls and host events. Application.resolve correlates asynchronous Host, Server, and Media completions by RequestId." },
            { title = "The game-like loop", text = "Edit a small piece of strict Luau, run luastra check and luastra test, preview it with luastra run, observe the visible state and diagnostics, then refine. Stable IDs and deterministic state make each iteration inspectable." },
            { title = "What the slogan does not promise", text = "Build apps like games does not mean redrawing every screen continuously or treating ordinary UI as a canvas. Luastra reconciles semantic changes, and motion schedules frames only while an admitted effect is active." },
        },
        evidence = "The alpha proves an end-to-end framework and checked examples. It does not yet prove broad market demand, production suitability for every application, or equivalent maturity on every host.",
        docs = "overview",
    },
    ["landing/targets"] = {
        title = "One semantic application",
        summary = "The same Luau state, stable IDs, events, routes, and semantic UI tree can adapt to different screens and supported hosts.",
        body = "Responsive presentation belongs to the host. Application code describes intent rather than desktop, mobile, or browser coordinates, but each host still has its own packaging, permission, lifecycle, and evidence boundary.",
        sections = {
            { title = "Web artifact", text = "luastra build web creates a static application containing the compiled Luau bundle, compatible Wasm VM, browser host and renderer, HTML, CSS, JavaScript, and declared assets. Serve it over HTTP or deploy it to static hosting." },
            { title = "Desktop and mobile today", text = "The current Tauri and Capacitor targets package that web artifact. Native adapters implement selected capability boundaries such as media or secure credentials; current application UI is not translated into platform-native widgets." },
            { title = "Portability rule", text = "A shared semantic model reduces application forks, but it does not erase platform differences. Browser success proves the browser target only; Tauri, Capacitor, permissions, background behavior, and physical devices are admitted separately." },
        },
        evidence = "The private candidate has strong web and cross-browser evidence. Desktop and mobile claims remain limited to the separately verified behaviors named by their host gates; unfinished native admission is not implied by this page.",
        docs = "application",
    },
    ["landing/source"] = {
        title = "Public source alpha",
        summary = "Luastra is inspectable, but the published release and the private development candidate are deliberately different boundaries.",
        body = "Use the public repository and immutable release assets when evaluating what users can install today. Treat this local Orbit site as a preview of the next candidate until a separate public audit, merge, release, and exact-SHA deployment are complete.",
        sections = {
            { title = "Published now", text = "v0.1.0-alpha is the immutable public release. Its installer, manifest, SDK archives, checksums, notices, documentation claims, and supported commands remain version-bound." },
            { title = "Visible in this preview", text = "This private checkout uses Source SDK contract 13 and contains unreleased Constellation Orbit APIs, the migrated luastra.dev experience, and documentation improvements. Those changes are not part of the installed public alpha yet." },
            { title = "How publication works", text = "A future candidate must be cleaned, compared with public main, validated without changing old release artifacts, reviewed through a public pull request, and deployed from the exact merged commit." },
        },
        evidence = "Open-source visibility makes implementation auditable; it does not replace compatibility guarantees, security review, host-specific testing, or evidence from independent applications.",
        docs = "policies",
        source = "https://github.com/Luastra/luastra",
        links = {
            { id = "release", text = "Open the immutable v0.1.0-alpha release", href = "https://github.com/Luastra/luastra/releases/tag/v0.1.0-alpha" },
        },
    },
}

local exampleDetails: {[string]: any} = {
    ["landing/examples/catalogue"] = {
        title = "Animated Catalogue",
        summary = "Navigation, versioned state migration, browser history, and declarative entrance motion in one catalogue flow.",
        difficulty = "Advanced",
        body = "Choose a catalogue card, open its detail view, use Back, reload the page, and observe the selected card and route being restored. The application also admits launch URLs and distinguishes online from offline lifecycle state.",
        commands = "luastra check --project=examples/animated-catalogue\nluastra test --project=examples/animated-catalogue\nluastra run --project=examples/animated-catalogue",
        keyFiles = "examples/animated-catalogue/luastra.json\nexamples/animated-catalogue/src/main.luau\nexamples/animated-catalogue/src/test.luau\nexamples/animated-catalogue/src/test-navigation-state.luau",
        capabilities = "app.launchurl.get · navigation.history · storage.get · storage.set · ui.render",
        evidence = "Automated Luau tests cover catalogue behavior, typed navigation, restoration, migration rejection, and deterministic encoding. Run the preview to verify browser History and motion presentation; those checks do not prove a native host.",
        docs = "recipe-history",
        source = "https://github.com/Luastra/luastra/tree/main/examples/animated-catalogue",
    },
    ["landing/examples/orbit"] = {
        title = "Constellation Orbit",
        summary = "A spatial constellation with semantic relationships, nested navigation, Focus Surfaces, themes, motion preferences, and a complete list fallback.",
        difficulty = "Advanced",
        body = "Explore the root constellation, open a nested group, inspect a Focus Surface, search nodes, switch themes, disable motion, and resize the viewport to see the same semantic model adapt without application-owned coordinates.",
        commands = "luastra check --project=examples/constellation-orbit\nluastra test --project=examples/constellation-orbit\nluastra run --project=examples/constellation-orbit",
        keyFiles = "examples/constellation-orbit/luastra.json\nexamples/constellation-orbit/src/main.luau\nexamples/constellation-orbit/src/test.luau",
        capabilities = "app.launchurl.get · navigation.history · storage.get · storage.set · timer.control · ui.render",
        evidence = "The private candidate has automated semantic tests plus Chromium, Firefox, Safari, responsive, accessibility, and performance evidence. Capacitor, Tauri, real zoom, and assistive-technology admission remain separate open gates.",
        docs = "recipe-orbit",
    },
    ["landing/examples/meditation"] = {
        title = "Meditation",
        summary = "A larger application joining media playback, persisted state, authenticated server functions, local identity, and packaged audio content.",
        difficulty = "Advanced",
        body = "Sign in through the local development identity flow, load meditation content, select a session, and exercise playback while application state crosses explicit storage, RPC, and media boundaries.",
        commands = "luastra generate --project=examples/meditation\nluastra check --project=examples/meditation\nluastra test --project=examples/meditation\nluastra run --project=examples/meditation",
        keyFiles = "examples/meditation/luastra.json\nexamples/meditation/src/main.luau\nexamples/meditation/backend/functions.json\nexamples/meditation/backend/handlers.mjs\nexamples/meditation/src/test-flow.luau\nexamples/meditation/content/",
        capabilities = "media.command · rpc.call · storage.get · storage.set · ui.render",
        evidence = "The checked flow test covers deterministic application transitions and the generated client boundary. A browser preview proves only that host; background playback, interruptions, hardware controls, and native packaging require device-specific evidence.",
        docs = "recipe-media",
        source = "https://github.com/Luastra/luastra/tree/main/examples/meditation",
    },
    ["landing/examples/forms"] = {
        title = "Forms and CRUD",
        summary = "Validated form input and explicit create, update, and delete operations through a generated server-function client.",
        difficulty = "Intermediate",
        body = "Submit an invalid form to see field-level feedback, create and update records, delete a record, and inspect how offline state keeps an unsent mutation available for an explicit retry.",
        commands = "luastra generate --project=examples/forms-crud\nluastra check --project=examples/forms-crud\nluastra test --project=examples/forms-crud\nluastra run --project=examples/forms-crud",
        keyFiles = "examples/forms-crud/luastra.json\nexamples/forms-crud/src/main.luau\nexamples/forms-crud/src/model.luau\nexamples/forms-crud/backend/functions.json\nexamples/forms-crud/backend/handlers.mjs\nexamples/forms-crud/src/test-crud.luau",
        capabilities = "rpc.call · ui.render",
        evidence = "Three Luau test modules cover schemas and model operations, CRUD state transitions, and generated backend-client calls. They do not establish production authentication, deployment, concurrency, or a remote database provider.",
        docs = "recipe-server",
        source = "https://github.com/Luastra/luastra/tree/main/examples/forms-crud",
    },
    ["landing/examples/media"] = {
        title = "Media Player",
        summary = "A compact queue player demonstrating typed packaged audio, asynchronous media commands, progress state, seeking, and lifecycle events.",
        difficulty = "Intermediate",
        body = "Load the two packaged samples, then play, pause, seek, and move through the queue. The interface renders decoded host media state instead of assuming that an acknowledged command changed playback.",
        commands = "luastra check --project=examples/media-player\nluastra test --project=examples/media-player\nluastra run --project=examples/media-player",
        keyFiles = "examples/media-player/luastra.json\nexamples/media-player/src/main.luau\nexamples/media-player/src/test-media.luau\nexamples/media-player/assets/focus.wav\nexamples/media-player/assets/rest.wav",
        capabilities = "media.command · ui.render",
        evidence = "The test validates media-state decoding and rejects unadmitted raw or malformed sources. Audible playback and controls require a live host check; web evidence must not be reused as proof of native background playback.",
        docs = "recipe-media",
        source = "https://github.com/Luastra/luastra/tree/main/examples/media-player",
    },
    ["landing/examples/routing"] = {
        title = "Routing Lab",
        summary = "A small deterministic example of typed routes, nested path parameters, required query values, canonical locations, and in-memory Back behavior.",
        difficulty = "Beginner",
        body = "Open a workspace, then a nested document route, and move Back through the local router stack while the current canonical location remains visible on screen.",
        commands = "luastra check --project=examples/routing-lab\nluastra test --project=examples/routing-lab\nluastra run --project=examples/routing-lab",
        keyFiles = "examples/routing-lab/luastra.json\nexamples/routing-lab/src/main.luau\nexamples/routing-lab/src/test.luau",
        capabilities = "ui.render",
        evidence = "The deterministic test proves route generation and local Back transitions. This example intentionally does not request navigation.history, so its address bar and the platform Back button are outside the demonstrated contract.",
        docs = "recipe-navigation",
        source = "https://github.com/Luastra/luastra/tree/main/examples/routing-lab",
    },
    ["landing/examples/visuals"] = {
        title = "Live Visuals",
        summary = "A visual specimen combining a packaged image, application theme tokens, shapes, layers, a flip card, and event-driven motion presets.",
        difficulty = "Intermediate",
        body = "Reveal and cover the card, inspect the layered front and back, and resize the adaptive shape gallery. Motion frames exist only while an admitted effect is active; application code does not own a permanent frame loop.",
        commands = "luastra check --project=examples/live-visuals\nluastra test --project=examples/live-visuals\nluastra run --project=examples/live-visuals",
        keyFiles = "examples/live-visuals/luastra.json\nexamples/live-visuals/src/main.luau\nexamples/live-visuals/src/test.luau\nexamples/live-visuals/assets/luastra-mark.png",
        capabilities = "ui.render",
        evidence = "The Luau test verifies theme fields, aligned text, and flip state. Shape geometry, image fitting, animation smoothness, reduced motion, and contrast remain host-rendered presentation claims that need browser or device inspection.",
        docs = "recipe-assets-visuals",
        source = "https://github.com/Luastra/luastra/tree/main/examples/live-visuals",
    },
    ["landing/examples/debug"] = {
        title = "Debug Lab",
        summary = "The smallest example of structured debug, warning, and error output crossing the Luau runtime boundary.",
        difficulty = "Beginner",
        body = "Start the application and inspect the terminal or host diagnostics while the semantic screen confirms that all three debug calls ran during module initialization.",
        commands = "luastra check --project=examples/debug-lab\nluastra run --project=examples/debug-lab",
        keyFiles = "examples/debug-lab/luastra.json\nexamples/debug-lab/src/main.luau",
        capabilities = "ui.render",
        evidence = "The project is analyzer-checked but currently has no declared test module. A live run proves that the selected host receives the messages; log persistence, remote collection, and production telemetry are not provided by this example.",
        docs = "debug",
        source = "https://github.com/Luastra/luastra/tree/main/examples/debug-lab",
    },
}

for _, item in productNodes do
    details[item.id] = { title = item.title, summary = item.description, body = "Open the conventional documentation view for complete, searchable, version-bound guidance and API links.", docs = item.docs }
end
for id, detail in exampleDetails do details[id] = detail end

local function activeItems(): {any}
    if section == "product" then return productNodes end
    if section == "examples" then return exampleNodes end
    return rootNodes
end

local function matches(item: any, query: string): boolean
    local needle = string.lower(string.match(query, "^%s*(.-)%s*$") or "")
    if needle == "" then return true end
    return string.find(string.lower(item.title), needle, 1, true) ~= nil
        or string.find(string.lower(item.description), needle, 1, true) ~= nil
end

local function matchingCount(items: {any}, query: string): number
    local count = 0
    for _, item in items do if matches(item, query) then count += 1 end end
    return count
end

local function renderNodes(items: {any}, query: string): {UI.Node}
    local output: {UI.Node} = {}
    for _, item in items do
        if item.kind == "cluster" then
            table.insert(output, UI.OrbitCluster {
                id = item.id, title = item.title, count = item.count, priority = item.priority,
                relatedTo = item.relatedTo, signalIcon = item.icon, hidden = not matches(item, query), onTap = "landing.open-examples",
            })
        else
            local action = if item.kind == "constellation" then "landing.open-product" elseif item.kind == "action" then "landing.open-reference" else "landing.open-focus"
            table.insert(output, UI.OrbitNode {
                id = item.id, title = item.title, description = item.description,
                nodeKind = item.kind or "leaf", priority = item.priority, relatedTo = item.relatedTo,
                signalIcon = item.icon, status = item.status, statusTone = item.tone,
                selected = selectedId == item.id, hidden = not matches(item, query), onTap = action,
            })
        end
    end
    return output
end

local function focusChildren(detail: any): {UI.Node}
    local output: {UI.Node} = {
        UI.Text { id = "landing/focus/summary", text = detail.summary, variant = "subheading" },
        UI.Text { id = "landing/focus/body", text = detail.body },
    }
    if detail.difficulty ~= nil then
        table.insert(output, UI.Text {
            id = "landing/focus/difficulty",
            text = "Difficulty: " .. detail.difficulty,
            tone = "success",
        })
    end
    for index, sectionDetail in detail.sections or {} do
        local id = "landing/focus/section-" .. tostring(index)
        table.insert(output, UI.Stack {
            id = id,
            gap = "sm",
            UI.Text { id = id .. "/title", text = sectionDetail.title, variant = "heading" },
            UI.Text { id = id .. "/body", text = sectionDetail.text },
        })
    end
    if detail.commands ~= nil then
        table.insert(output, UI.Stack {
            id = "landing/focus/run",
            gap = "sm",
            UI.Text { id = "landing/focus/run-title", text = "Run from the repository root", variant = "heading" },
            UI.CodeBlock { id = "landing/focus/run-code", code = detail.commands, language = "Shell" },
        })
    end
    if detail.keyFiles ~= nil then
        table.insert(output, UI.Stack {
            id = "landing/focus/files",
            gap = "sm",
            UI.Text { id = "landing/focus/files-title", text = "Key files", variant = "heading" },
            UI.CodeBlock { id = "landing/focus/files-code", code = detail.keyFiles, language = "Text" },
        })
    end
    if detail.capabilities ~= nil then
        table.insert(output, UI.Stack {
            id = "landing/focus/capabilities",
            gap = "sm",
            UI.Text { id = "landing/focus/capabilities-title", text = "Declared capabilities", variant = "heading" },
            UI.Text { id = "landing/focus/capabilities-value", text = detail.capabilities },
        })
    end
    if detail.evidence ~= nil then
        table.insert(output, UI.Stack {
            id = "landing/focus/evidence",
            gap = "sm",
            UI.Text { id = "landing/focus/evidence-title", text = "Evidence boundary", variant = "heading" },
            UI.Text { id = "landing/focus/evidence-value", text = detail.evidence },
        })
    end
    table.insert(output, UI.Divider { id = "landing/focus/divider" })
    if detail.docs ~= nil then
        table.insert(output, UI.Button { id = "landing/focus/docs", text = "Read the documentation", onTap = "landing.open-focus-docs" })
    end
    if detail.source ~= nil then
        table.insert(output, UI.Link { id = "landing/focus/source", text = "Open the source on GitHub", href = detail.source, external = true, label = "Open the source on GitHub" })
    end
    for _, link in detail.links or {} do
        table.insert(output, UI.Link {
            id = "landing/focus/link-" .. link.id,
            text = link.text,
            href = link.href,
            external = true,
            label = link.text,
        })
    end
    return output
end

function Landing.render(): UI.Node
    local depth = section == "root" and 0 or 1
    local items = activeItems()
    local query = searches[section]
    local theme = themes[themeIndex]
    local currentTitle = section == "product" and "Product map" or (section == "examples" and "Examples" or "")
    local child = section ~= "root" and section or retainedSection
    local detail = selectedId and details[selectedId] or nil
    local orbitChildren: {UI.Node} = {
        UI.OrbitPath {
            id = "landing/path", label = "Luastra path",
            UI.OrbitReturn { id = "landing/path/root", text = "Luastra", onTap = "landing.return-root", disabled = depth == 0 },
            UI.Text { id = "landing/path/separator", text = "/", hidden = depth == 0 },
            UI.Text { id = "landing/path/current", text = currentTitle, hidden = depth == 0 },
            UI.Button { id = "landing/path/docs", text = "Documentation", onTap = "landing.open-reference" },
            UI.Button {
                id = "landing/path/theme", icon = "palette", onTap = "landing.open-theme-picker",
                label = "Choose a theme. Current theme: " .. theme.name,
            },
            UI.Button {
                id = "landing/path/motion", icon = motion == "system" and "activity" or "pause", onTap = "landing.toggle-motion",
                label = motion == "system" and "Disable interface motion" or "Use the system motion preference",
            },
        },
        UI.OrbitSearch {
            id = "landing/search", label = section == "root" and "Search Luastra" or `Search {currentTitle}`,
            placeholder = "Search this constellation", query = query,
            resultCount = matchingCount(items, query), totalCount = #items, onInput = "landing.search",
        },
        UI.Constellation {
            id = "landing/root", label = "Luastra product overview", depth = 0,
            layerState = depth == 0 and "active" or "behind",
            UI.OrbitCenter { id = "landing/root/center", title = "Luastra", description = "New here? Open Build with Luastra to start, or Documentation for a conventional guide." },
            table.unpack(renderNodes(rootNodes, searches.root)),
        },
    }
    if child == "product" then
        table.insert(orbitChildren, UI.Constellation {
            id = "landing/product-map", label = "Luastra product map", depth = 1,
            layerState = section == "product" and "active" or "ahead",
            UI.OrbitCenter { id = "landing/product-map/center", title = "Build", description = "From first command to a verified web build." },
            table.unpack(renderNodes(productNodes, searches.product)),
        })
    elseif child == "examples" then
        table.insert(orbitChildren, UI.Constellation {
            id = "landing/example-map", label = "Luastra examples", depth = 1,
            layerState = section == "examples" and "active" or "ahead",
            UI.OrbitCenter { id = "landing/example-map/center", title = "Examples", description = "Real projects, one semantic framework." },
            table.unpack(renderNodes(exampleNodes, searches.examples)),
        })
    end
    table.insert(orbitChildren, UI.FocusSurface {
        id = "landing/focus", label = detail and detail.title .. " details" or "Luastra details",
        open = detail ~= nil, onDismiss = "landing.close-focus",
        UI.FocusHeader {
            id = "landing/focus/header",
            UI.Text { id = "landing/focus/title", text = detail and detail.title or "Luastra", variant = "heading" },
            UI.Button { id = "landing/focus/close", text = "Return to the constellation", onTap = "landing.close-focus" },
        },
        UI.Stack { id = "landing/focus/content", gap = "md", table.unpack(detail and focusChildren(detail) or {}) },
    })
    local themeChoices: {UI.Node} = {
        UI.Text { id = "landing/theme-picker/title", text = "Choose a theme", variant = "heading" },
        UI.Text { id = "landing/theme-picker/current", text = "Current theme: " .. theme.name, role = "status" },
    }
    for index, choice in themes do
        table.insert(themeChoices, UI.Button {
            id = "landing/theme-picker/choice-" .. tostring(index),
            text = index == themeIndex and "✓ " .. choice.name or choice.name,
            label = index == themeIndex and choice.name .. ", selected" or "Use " .. choice.name,
            appearance = index == themeIndex and "primary" or "secondary",
            onTap = "landing.choose-theme",
        })
    end
    table.insert(themeChoices, UI.Button {
        id = "landing/theme-picker/close", text = "Close", appearance = "ghost", onTap = "landing.close-theme-picker",
    })
    return UI.Screen {
        id = "site/landing", width = "wide", documentLanguage = "en",
        documentTitle = "Luastra — Build apps like games",
        documentDescription = "Build web, desktop, and mobile applications in Luau with one semantic application model.",
        UI.Orbit {
            id = "landing/orbit", label = "Luastra product and example map", presentation = "auto",
            orbitTheme = theme.id, orbitMotion = motion, maxVisible = 12,
            table.unpack(orbitChildren),
        },
        UI.Modal {
            id = "landing/theme-picker", label = "Theme picker", open = themePickerOpen,
            className = "luastra-orbit-theme-picker",
            onDismiss = "landing.close-theme-picker",
            UI.Column { id = "landing/theme-picker/options", gap = "sm", table.unpack(themeChoices) },
        },
    }
end

function Landing.handle(action: string, target: string, value: string): string?
    if action == "landing.open-product" and target == "landing/product" then
        section = "product"
        selectedId = nil
        retainedSection = "product"
    elseif action == "landing.open-examples" and target == "landing/examples" then
        section = "examples"
        selectedId = nil
        retainedSection = "examples"
    elseif action == "landing.return-root" then
        if section ~= "root" then retainedSection = section end
        section = "root"
        selectedId = nil
    elseif action == "landing.open-focus" then
        if details[target] ~= nil then selectedId = target end
    elseif action == "landing.close-focus" then
        selectedId = nil
    elseif action == "landing.open-reference" then
        return "overview"
    elseif action == "landing.open-focus-docs" and target == "landing/focus/docs" then
        local detail = selectedId and details[selectedId] or nil
        if detail ~= nil then return detail.docs end
    elseif action == "landing.search" and target == "landing/search/input" then
        searches[section] = string.sub(value, 1, 160)
    elseif action == "landing.open-theme-picker" and target == "landing/path/theme" then
        themePickerOpen = true
    elseif action == "landing.close-theme-picker" then
        themePickerOpen = false
    elseif action == "landing.choose-theme" then
        local chosen = tonumber(string.match(target, "^landing/theme%-picker/choice%-([1-9][0-9]*)$"))
        if chosen ~= nil and themes[chosen] ~= nil then
            themeIndex = chosen
            themePickerOpen = false
        end
    elseif action == "landing.toggle-motion" then
        motion = motion == "system" and "off" or "system"
    end
    return nil
end

function Landing.encodedPreferences(): string
    return "v1:" .. themes[themeIndex].id .. ":" .. motion
end

function Landing.restorePreferences(value: string): boolean
    local version, theme, nextMotion = string.match(value, "^(v1):([a-z]+):([a-z]+)$")
    local nextThemeIndex = theme and themeIndexFor(theme) or nil
    if version ~= "v1" or nextThemeIndex == nil or (nextMotion ~= "system" and nextMotion ~= "off") then return false end
    themeIndex = nextThemeIndex
    motion = nextMotion
    return true
end

function Landing.restore(nextSection: string, nextSelectedId: string?): boolean
    if nextSection ~= "root" and nextSection ~= "product" and nextSection ~= "examples" then return false end
    if nextSelectedId ~= nil and details[nextSelectedId] == nil then return false end
    if nextSelectedId ~= nil then
        local expectedPrefix = nextSection == "root" and "landing/" or "landing/" .. nextSection .. "/"
        if string.find(nextSelectedId, expectedPrefix, 1, true) ~= 1 then return false end
    end
    section = nextSection
    selectedId = nextSelectedId
    if nextSection ~= "root" then retainedSection = nextSection end
    themePickerOpen = false
    return true
end

function Landing.snapshot()
    return { section = section, selectedId = selectedId, theme = themes[themeIndex].id, themePickerOpen = themePickerOpen, motion = motion, query = searches[section] }
end

return Landing
