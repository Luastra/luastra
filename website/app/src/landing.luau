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
    ["landing/why"] = { title = "Build apps like games", summary = "Luastra brings a tight create, run, observe, and refine loop to application development.", body = "Application code declares semantic UI and state in Luau. Hosts provide platform rendering, navigation, storage, media, and other bounded capabilities without turning the application into platform-specific glue.", docs = "overview" },
    ["landing/targets"] = { title = "One semantic application", summary = "The same application model can adapt to different screens and hosts.", body = "Responsive presentation belongs to the host, while stable IDs, events, routes, and state remain application-owned. Host support is verified independently; success on web is never treated as native evidence.", docs = "application" },
    ["landing/source"] = { title = "Public source alpha", summary = "The current release is intentionally early and inspectable.", body = "Read the source, release inventory, compatibility boundaries, and examples before depending on an alpha API. Published release artifacts remain immutable while development continues privately.", docs = "policies", source = "https://github.com/Luastra/luastra" },
}

for _, item in productNodes do
    details[item.id] = { title = item.title, summary = item.description, body = "Open the conventional documentation view for complete, searchable, version-bound guidance and API links.", docs = item.docs }
end
for _, item in exampleNodes do
    details[item.id] = { title = item.title, summary = item.description, body = "This repository example is a real Luastra project with Luau source and tests, not a screenshot or renderer-specific mockup.", source = "https://github.com/Luastra/luastra/tree/main/examples/" .. item.source }
end
details["landing/examples/orbit"].source = nil
details["landing/examples/orbit"].docs = "ui"

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
        UI.Divider { id = "landing/focus/divider" },
    }
    if detail.docs ~= nil then
        table.insert(output, UI.Button { id = "landing/focus/docs", text = "Read the documentation", onTap = "landing.open-focus-docs" })
    end
    if detail.source ~= nil then
        table.insert(output, UI.Link { id = "landing/focus/source", text = "Open the source on GitHub", href = detail.source, external = true, label = "Open the source on GitHub" })
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
            UI.OrbitCenter { id = "landing/root/center", title = "Luastra", description = "Build apps like games." },
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
