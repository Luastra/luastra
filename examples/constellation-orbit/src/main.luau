--!strict

local App = require("luastra/app")
local Host = require("luastra/host")
local Navigation = require("luastra/navigation")
local Timer = require("luastra/timer")
local UI = require("luastra/ui")

local themeIndex = 1
local orbitMotion = "system"
local searchQueries: { [string]: string } = { root = "", build = "", examples = "" }
local actionBusy = false
local actionStatus = "Ready"
local actionStatusTone = "neutral"
local lastVisitedSection: string? = nil

local exampleFamilies = {
    { id = "media", description = "Playback and visual media experiences.", titles = { "Podcast Player", "Music Library", "Video Catalogue", "Photo Gallery", "Radio Dashboard", "Audiobook Shelf" } },
    { id = "productivity", description = "Tools for focused personal and team work.", titles = { "Task Board", "Notes Workspace", "Calendar Planner", "Habit Tracker", "Focus Timer", "Team Inbox" } },
    { id = "commerce", description = "Customer journeys and transactional interfaces.", titles = { "Storefront", "Product Catalogue", "Cart Flow", "Order Tracker", "Subscription Hub", "Customer Portal" } },
    { id = "data", description = "Dense operational information made navigable.", titles = { "Analytics Dashboard", "Operations Console", "Inventory Monitor", "Finance Overview", "Research Explorer", "Status Center" } },
    { id = "learning", description = "Structured learning and knowledge applications.", titles = { "Course Library", "Lesson Player", "Quiz Studio", "Reading List", "Language Trainer", "Workshop Guide" } },
    { id = "wellbeing", description = "Calm, continuous health and wellbeing tools.", titles = { "Meditation Player", "Fitness Log", "Sleep Journal", "Meal Planner", "Mood Diary", "Care Companion" } },
    { id = "community", description = "Shared spaces for people and local activity.", titles = { "Event Guide", "Member Directory", "Discussion Space", "Volunteer Hub", "Local Marketplace", "Creator Profile" } },
    { id = "utilities", description = "Everyday utilities across web, desktop and mobile.", titles = { "File Organizer", "Travel Planner", "Recipe Book", "Home Controller", "Weather Station", "Device Manager" } },
}
local exampleNodes: { any } = {}
local exampleFamilyValues: { string } = {}
for _, family in exampleFamilies do
    table.insert(exampleFamilyValues, family.id)
    for index, title in family.titles do
        local slug = family.id .. "-" .. tostring(index)
        table.insert(exampleNodes, {
            id = "orbit/examples/" .. slug,
            title = title,
            description = family.description,
            nodeKind = "leaf",
            priority = index == 1 and 1 or (index <= 3 and 2 or 3),
        })
    end
end

local routeCompiler = Navigation.compile {
    { name = "root", path = "/orbit" },
    { name = "build", path = "/orbit/build" },
    { name = "examples", path = "/orbit/examples" },
    {
        name = "root-leaf",
        path = "/orbit/leaf/:leaf",
        params = { leaf = { type = "enum", values = { "prototype", "learn", "measure", "ship" } } },
    },
    {
        name = "build-leaf",
        path = "/orbit/build/:leaf",
        params = { leaf = { type = "enum", values = { "interface", "motion", "adaptive", "access" } } },
    },
    {
        name = "examples-leaf",
        path = "/orbit/examples/:category/:item",
        params = {
            category = { type = "enum", values = exampleFamilyValues },
            item = { type = "integer", minimum = 1, maximum = 6 },
        },
    },
}
local rootEntry = table.freeze({ name = "root", params = table.freeze({}), query = table.freeze({}) })
local buildEntry = table.freeze({ name = "build", params = table.freeze({}), query = table.freeze({}) })
local examplesEntry = table.freeze({ name = "examples", params = table.freeze({}), query = table.freeze({}) })
local navigation = Navigation.createRouter { compiler = routeCompiler, initial = rootEntry }
local launchUrlRequest: number? = nil
local historyCurrentRequest: number? = nil
local preferenceRequest: number? = nil
local launchResolved = false
local historyResolved = false
local preferenceResolved = false
local launchPayload = ""
local currentHistoryToken: string? = nil
local pendingStartupUrl = ""
local historyEstablished = false
local preferencesEstablished = false

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

local rootNodes = {
    { id = "orbit/explore", title = "Explore", description = "Open the next constellation.", signalIcon = "compass", status = "Next", statusTone = "active", nodeKind = "constellation", priority = 1, relatedTo = { "orbit/learn", "orbit/example-galaxy" } },
    { id = "orbit/example-galaxy", title = "Example galaxy", description = "Browse 48 application ideas.", signalIcon = "grid", nodeKind = "cluster", count = #exampleNodes, priority = 1, relatedTo = { "orbit/prototype" } },
    { id = "orbit/prototype", title = "Prototype", description = "Turn an idea into a playable UI.", signalIcon = "spark", status = "Ready", statusTone = "success", nodeKind = "leaf", priority = 1, relatedTo = { "orbit/learn", "orbit/measure" } },
    { id = "orbit/learn", title = "Learn", description = "See how the Luau model works.", signalIcon = "book", status = "Guide", nodeKind = "leaf", priority = 2, relatedTo = { "orbit/ship" } },
    { id = "orbit/measure", title = "Measure", description = "Keep rendering costs visible.", signalIcon = "gauge", status = "Review", statusTone = "warning", nodeKind = "leaf", priority = 2, relatedTo = { "orbit/ship" } },
    { id = "orbit/ship", title = "Ship", description = "Target web, desktop and mobile.", signalIcon = "rocket", status = "Blocked", statusTone = "error", nodeKind = "leaf", priority = 3 },
}

local buildNodes = {
    { id = "orbit/build/interface", title = "Interface", description = "Compose semantic Orbit primitives.", nodeKind = "leaf", priority = 1 },
    { id = "orbit/build/motion", title = "Motion", description = "Animate transforms and opacity.", nodeKind = "leaf", priority = 2 },
    { id = "orbit/build/adaptive", title = "Adaptive", description = "Fall back to a readable list.", nodeKind = "leaf", priority = 2 },
    { id = "orbit/build/access", title = "Accessible", description = "Navigate every node from a keyboard.", nodeKind = "leaf", priority = 1 },
    { id = "orbit/build/optimize", title = "Optimize", description = "Precompute stable UI fragments.", signalIcon = "bolt", status = "Ready", statusTone = "neutral", nodeKind = "action", priority = 1, relatedTo = { "orbit/build/interface", "orbit/build/adaptive" } },
}

local focusSections = {
    { title = "Semantic source", copy = "The application declares intent and content in Luau. The host owns coordinates, responsive presentation, focus movement, and platform behavior." },
    { title = "Adaptive layout", copy = "The same nodes become a spatial constellation or a complete scrollable list according to the usable width, height, density, and label pressure." },
    { title = "Accessible interaction", copy = "Pointer, keyboard, history, direct links, and assistive technology reach the same semantic destination without a parallel application state." },
    { title = "Theme contract", copy = "Colors, typography, geometry, atmosphere, and motion resolve through bounded theme tokens while content and interaction remain unchanged." },
    { title = "Host-owned motion", copy = "Camera and Focus Surface transitions use short-lived geometry captured by the host, with interruption, resize invalidation, and reduced-motion fallbacks." },
    { title = "Runtime discipline", copy = "Stable IDs, bounded retained layers, deterministic layout, CSS containment, and transform-based transitions keep the interface measurable and responsive." },
}

local function nodeTitle(id: string?): string
    if id == nil then return "Selection" end
    for _, collection in { rootNodes, buildNodes, exampleNodes } do
        for _, item in collection do
            if item.id == id then return item.title end
        end
    end
    return "Selection"
end

local function themeIndexFor(id: string): number?
    for index, theme in themes do
        if theme.id == id then return index end
    end
    return nil
end

local function encodedPreferences(): string
    return "v1:" .. themes[themeIndex].id .. ":" .. orbitMotion
end

local function restorePreferences(value: string): boolean
    local version, theme, motion = string.match(value, "^(v1):([a-z]+):([a-z]+)$")
    local restoredIndex = theme and themeIndexFor(theme) or nil
    if version ~= "v1" or restoredIndex == nil or (motion ~= "system" and motion ~= "off") then return false end
    themeIndex = restoredIndex
    orbitMotion = motion
    return true
end

local function savePreferences()
    if preferencesEstablished then Host.storageSet("orbit-preferences", encodedPreferences()) end
end

local function leafEntry(target: string): any?
    local rootLeaf = string.match(target, "^orbit/([^/]+)$")
    if rootLeaf ~= nil and rootLeaf ~= "explore" then return { name = "root-leaf", params = { leaf = rootLeaf }, query = {} } end
    local buildLeaf = string.match(target, "^orbit/build/([^/]+)$")
    if buildLeaf ~= nil then return { name = "build-leaf", params = { leaf = buildLeaf }, query = {} } end
    local examplesLeaf = string.match(target, "^orbit/examples/([^/]+)$")
    if examplesLeaf ~= nil then
        local category, item = string.match(examplesLeaf, "^([a-z]+)%-([1-6])$")
        if category ~= nil and item ~= nil then return { name = "examples-leaf", params = { category = category, item = tonumber(item) }, query = {} } end
    end
    return nil
end

local function currentSection(): string
    local name = navigation.current().name
    if name == "build" or name == "build-leaf" then return "build" end
    if name == "examples" or name == "examples-leaf" then return "examples" end
    return "root"
end

local function currentDepth(): number
    return currentSection() == "root" and 0 or 1
end

local function focusedNode(): string?
    local entry = navigation.current() :: any
    if entry.name == "root-leaf" then return "orbit/" .. tostring(entry.params.leaf) end
    if entry.name == "build-leaf" then return "orbit/build/" .. tostring(entry.params.leaf) end
    if entry.name == "examples-leaf" then return "orbit/examples/" .. tostring(entry.params.category) .. "-" .. tostring(entry.params.item) end
    return nil
end

local function locationFor(): string
    return "#" .. navigation.currentLocation()
end

local function encodedState(): string
    return navigation.encode()
end

local function pushEntry(entry: any)
    local result = navigation.push(entry)
    if result.success and currentSection() ~= "root" then lastVisitedSection = currentSection() end
    if result.success and result.changed and historyEstablished then Host.historyPushLocation(locationFor(), encodedState()) end
end

local function navigateBack()
    if not navigation.canBack() then return end
    if currentSection() ~= "root" then lastVisitedSection = currentSection() end
    if historyEstablished then Host.historyBack() else navigation.back() end
end

local function entriesFor(entry: any): { any }
    if entry.name == "root" then return { rootEntry } end
    if entry.name == "build" then return { rootEntry, buildEntry } end
    if entry.name == "root-leaf" then return { rootEntry, entry } end
    if entry.name == "build-leaf" then return { rootEntry, buildEntry, entry } end
    if entry.name == "examples" then return { rootEntry, examplesEntry } end
    return { rootEntry, examplesEntry, entry }
end

local function locationFromUrl(value: string): string?
    local native = string.match(value, "^luastra://(.+)$")
    if native ~= nil then return "/" .. native end
    return string.match(value, "#(/[^#]*)$")
end

local function applyUrl(value: string, appendHistory: boolean): boolean
    local location = locationFromUrl(value)
    local matched = location and routeCompiler.match(location) or nil
    if matched == nil or not matched.success or matched.entry == nil then return false end
    local previous = encodedState()
    local entry = matched.entry :: any
    if not navigation.restore({ version = 2, entries = entriesFor(entry) }).success then return false end
    if currentSection() ~= "root" then lastVisitedSection = currentSection() end
    if appendHistory and encodedState() ~= previous then Host.historyPushLocation(locationFor(), encodedState()) end
    return true
end

local function establishHistory()
    if currentHistoryToken ~= nil and currentHistoryToken ~= "" then
        Host.historyReplaceLocation(locationFor(), encodedState())
        return
    end
    local entries = navigation.snapshot().entries
    local temporary = Navigation.createRouter { compiler = routeCompiler, initial = entries[1] }
    Host.historyReplaceLocation("#" .. temporary.currentLocation(), temporary.encode())
    for index = 2, #entries do
        assert(temporary.push(entries[index]).success, "Orbit history route is invalid")
        Host.historyPushLocation("#" .. temporary.currentLocation(), temporary.encode())
    end
end

local function finalizeStartup()
    if historyEstablished or not launchResolved or not historyResolved or not preferenceResolved then return end
    if currentHistoryToken ~= nil and currentHistoryToken ~= "" then navigation.restoreEncoded(currentHistoryToken) end
    local launchApplied = launchPayload ~= "" and applyUrl(launchPayload, false)
    if not launchApplied and pendingStartupUrl ~= "" then applyUrl(pendingStartupUrl, false) end
    pendingStartupUrl = ""
    historyEstablished = true
    establishHistory()
end

local function normalizedSearch(value: string): string
    return string.lower(string.match(value, "^%s*(.-)%s*$") or "")
end

local function matchesSearch(item: any, query: string): boolean
    local normalized = normalizedSearch(query)
    if normalized == "" then return true end
    return string.find(string.lower(item.title), normalized, 1, true) ~= nil
        or string.find(string.lower(item.description), normalized, 1, true) ~= nil
        or (item.status ~= nil and string.find(string.lower(item.status), normalized, 1, true) ~= nil)
end

local function searchCount(items: { any }, query: string): number
    local count = 0
    for _, item in items do
        if matchesSearch(item, query) then count += 1 end
    end
    return count
end

local function orbitNodes(items: { any }, query: string): { UI.Node }
    local output: { UI.Node } = {}
    local selectedNode = focusedNode()
    for _, item in items do
        if item.nodeKind == "cluster" then
            table.insert(output, UI.OrbitCluster {
                id = item.id,
                title = item.title,
                count = item.count,
                priority = item.priority,
                relatedTo = item.relatedTo,
                signalIcon = item.signalIcon,
                status = item.status,
                statusTone = item.statusTone,
                hidden = not matchesSearch(item, query),
                onTap = "open-cluster",
            })
        else
            table.insert(output, UI.OrbitNode {
                id = item.id,
                title = item.title,
                description = item.description,
                nodeKind = item.nodeKind,
                priority = item.priority,
                relatedTo = item.relatedTo,
                signalIcon = item.signalIcon,
                status = item.nodeKind == "action" and actionStatus or item.status,
                statusTone = item.nodeKind == "action" and actionStatusTone or item.statusTone,
                busy = item.nodeKind == "action" and actionBusy or nil,
                disabled = item.nodeKind == "action" and actionBusy or nil,
                selected = selectedNode == item.id,
                hidden = not matchesSearch(item, query),
                onTap = item.nodeKind == "constellation" and "open-constellation" or (item.nodeKind == "action" and "run-orbit-action" or "open-focus"),
            })
        end
    end
    return output
end

local function focusContent(focusTitle: string): { UI.Node }
    local output: { UI.Node } = {
        UI.Text { id = "orbit/focus/summary", text = focusTitle .. " demonstrates how a Luastra application keeps one semantic model across every presentation." },
        UI.Divider { id = "orbit/focus/divider" },
    }
    for index, section in focusSections do
        local key = "detail-" .. tostring(index)
        table.insert(output, UI.Text { id = "orbit/focus/" .. key .. "/title", text = section.title, variant = "subheading" })
        table.insert(output, UI.Text { id = "orbit/focus/" .. key .. "/copy", text = section.copy })
    end
    return output
end

local Root = {}

function Root.render(): UI.Node
    local depth = currentDepth()
    local section = currentSection()
    local selectedNode = focusedNode()
    local focusTitle = nodeTitle(selectedNode)
    local theme = themes[themeIndex]
    local activeItems = section == "root" and rootNodes or (section == "build" and buildNodes or exampleNodes)
    local searchKey = section
    local searchQuery = searchQueries[searchKey]
    local sectionTitle = section == "build" and "Build" or (section == "examples" and "Examples" or "")
    local retainedSection = section ~= "root" and section or lastVisitedSection
    local orbitChildren: { UI.Node } = {
        UI.OrbitPath {
            id = "orbit/path",
            label = "Orbit path",
            UI.OrbitReturn { id = "orbit/path/root", text = "Luastra", onTap = "return-root", disabled = depth == 0 },
            UI.Text { id = "orbit/path/separator", text = "/", hidden = depth == 0 },
            UI.Text { id = "orbit/path/current", text = sectionTitle, hidden = depth == 0 },
            UI.Button { id = "orbit/path/theme-previous", text = "Previous theme", onTap = "previous-theme" },
            UI.Text { id = "orbit/path/theme-current", text = theme.name },
            UI.Button { id = "orbit/path/theme-next", text = "Next theme", onTap = "next-theme" },
            UI.Button { id = "orbit/path/motion", text = orbitMotion == "system" and "Motion: System" or "Motion: Off", onTap = "toggle-motion" },
        },
        UI.OrbitSearch {
            id = "orbit/search",
            label = section == "root" and "Search Luastra possibilities" or (section == "build" and "Search Build nodes" or "Search application examples"),
            placeholder = "Search this constellation",
            query = searchQuery,
            resultCount = searchCount(activeItems, searchQuery),
            totalCount = #activeItems,
            onInput = "search-orbit",
        },
        UI.Constellation {
            id = "orbit/root",
            label = "Luastra possibilities",
            depth = 0,
            layerState = depth == 0 and "active" or "behind",
            UI.OrbitCenter { id = "orbit/root/center", title = "Luastra", description = "Build apps like games." },
            table.unpack(orbitNodes(rootNodes, searchQueries.root)),
        },
    }
    if retainedSection == "build" then
        table.insert(orbitChildren, UI.Constellation {
            id = "orbit/build",
            label = "Build an interface",
            depth = 1,
            layerState = section == "build" and "active" or "ahead",
            UI.OrbitCenter { id = "orbit/build/center", title = "Build", description = "One semantic model, adaptive presentation." },
            table.unpack(orbitNodes(buildNodes, searchQueries.build)),
        })
    elseif retainedSection == "examples" then
        table.insert(orbitChildren, UI.Constellation {
            id = "orbit/examples",
            label = "Root example galaxy",
            depth = 1,
            layerState = section == "examples" and "active" or "ahead",
            UI.OrbitCenter { id = "orbit/examples/center", title = "Examples", description = "48 ideas, one semantic system." },
            table.unpack(orbitNodes(exampleNodes, searchQueries.examples)),
        })
    end
    table.insert(orbitChildren, UI.FocusSurface {
        id = "orbit/focus",
        label = focusTitle .. " details",
        open = selectedNode ~= nil,
        onDismiss = "close-focus",
        UI.FocusHeader {
            id = "orbit/focus/header",
            UI.Text { id = "orbit/focus/title", text = focusTitle, variant = "heading" },
            UI.Button { id = "orbit/focus/close", text = "Return to the constellation", onTap = "close-focus" },
        },
        UI.Stack {
            id = "orbit/focus/content",
            gap = "md",
            table.unpack(focusContent(focusTitle)),
        },
    })
    return UI.Screen {
        id = "orbit-demo",
        documentTitle = "Constellation Orbit — Luastra",
        documentDescription = "A spatial, adaptive interface rendered from Luau.",
        documentLanguage = "en",
        width = "wide",
        UI.Orbit {
            id = "orbit",
            label = "Constellation Orbit demonstration",
            presentation = "auto",
            orbitTheme = theme.id,
            orbitMotion = orbitMotion,
            maxVisible = 12,
            table.unpack(orbitChildren),
        },
    }
end

function Root.handle(action: string, target: string, _value: string)
    if action == "lifecycle" and target == "app" and _value == "launch" and launchUrlRequest == nil then
        launchUrlRequest = Host.launchUrl()
        historyCurrentRequest = Host.historyCurrent()
        preferenceRequest = Host.storageGet("orbit-preferences")
    elseif action == "history" and target == "app" then
        local previousSection = currentSection()
        if navigation.restoreEncoded(_value).success then
            if previousSection ~= "root" then lastVisitedSection = previousSection end
            if currentSection() ~= "root" then lastVisitedSection = currentSection() end
        end
    elseif action == "open_url" and (target == "app" or target == "browser") then
        if not historyEstablished then
            pendingStartupUrl = _value
        elseif applyUrl(_value, target == "app") and target == "browser" then
            Host.historyReplaceLocation(locationFor(), encodedState())
        end
    elseif action == "system_back" and target == "app" then
        local intent = tonumber(string.match(_value, "^([1-9][0-9]*):[01]$"))
        if intent == nil then return end
        if navigation.canBack() then Host.systemBackHistory(intent) else Host.systemBackExit(intent) end
    elseif action == "open-constellation" and target == "orbit/explore" then
        pushEntry(buildEntry)
    elseif action == "open-cluster" and target == "orbit/example-galaxy" then
        pushEntry(examplesEntry)
    elseif action == "run-orbit-action" and target == "orbit/build/optimize" and not actionBusy then
        actionBusy = true
        actionStatus = "Working"
        actionStatusTone = "active"
        Timer.start { id = "orbit/optimize", delayMs = 900, value = "complete" }
    elseif action == "timer" and target == "orbit/optimize" and _value == "complete" then
        actionBusy = false
        actionStatus = "Complete"
        actionStatusTone = "success"
    elseif action == "return-root" then
        navigateBack()
    elseif action == "open-focus" then
        local entry = leafEntry(target)
        if entry ~= nil then pushEntry(entry) end
    elseif action == "close-focus" then
        navigateBack()
    elseif action == "next-theme" then
        themeIndex = themeIndex % #themes + 1
        savePreferences()
    elseif action == "previous-theme" then
        themeIndex = (themeIndex - 2) % #themes + 1
        savePreferences()
    elseif action == "toggle-motion" then
        orbitMotion = orbitMotion == "system" and "off" or "system"
        savePreferences()
    elseif action == "search-orbit" and target == "orbit/search/input" then
        searchQueries[currentSection()] = string.sub(_value, 1, 160)
    end
end

function Root.resolve(requestId: number, success: boolean, payload: string, _errorCode: string, _errorMessage: string)
    if launchUrlRequest == requestId then
        launchUrlRequest = nil
        launchResolved = true
        launchPayload = success and payload or ""
        finalizeStartup()
    elseif historyCurrentRequest == requestId then
        historyCurrentRequest = nil
        historyResolved = true
        currentHistoryToken = success and payload or ""
        finalizeStartup()
    elseif preferenceRequest == requestId then
        preferenceRequest = nil
        preferenceResolved = true
        local restored = success and restorePreferences(payload)
        preferencesEstablished = true
        if not restored then savePreferences() end
        finalizeStartup()
    end
end

function Root.snapshot()
    return {
        route = navigation.current().name,
        location = navigation.currentLocation(),
        canBack = navigation.canBack(),
        focusedNode = focusedNode(),
        historyEstablished = historyEstablished,
        theme = themes[themeIndex].id,
        motion = orbitMotion,
        preferencesEstablished = preferencesEstablished,
        section = currentSection(),
        searchQuery = searchQueries[currentSection()],
        encodedState = encodedState(),
        actionBusy = actionBusy,
        actionStatus = actionStatus,
    }
end

return App.compose {
    render = function(_outputs) return Root.render() end,
    handle = Root.handle,
    resolve = Root.resolve,
    snapshot = Root.snapshot,
}
