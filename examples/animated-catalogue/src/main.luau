--!strict

local Host = require("luastra/host")
local Motion = require("luastra/motion")
local Navigation = require("luastra/navigation")
local State = require("luastra/state")
local UI = require("luastra/ui")

export type CatalogueCard = {
    id: string,
    title: string,
    description: string,
    entrance: { opacity: Motion.Tween, translateY: Motion.Tween },
}

local cards: { CatalogueCard } = {
    {
        id = "catalogue/breathe",
        title = "Breathe",
        description = "A calm space for guided breathing and short pauses.",
        entrance = {
            opacity = Motion.tween { from = 0, to = 1, durationMs = 180, easing = "linear" },
            translateY = Motion.tween { from = 18, to = 0, durationMs = 240, easing = "easeOutCubic" },
        },
    },
    {
        id = "catalogue/focus",
        title = "Focus",
        description = "Simple sessions for deep work and intentional attention.",
        entrance = {
            opacity = Motion.tween { from = 0, to = 1, durationMs = 220, easing = "easeInOutCubic" },
            translateY = Motion.tween { from = 24, to = 0, durationMs = 280, easing = "easeOutCubic" },
        },
    },
}

local routeCompiler = Navigation.compile {
    { name = "catalogue", path = "/catalogue" },
    {
        name = "detail",
        path = "/detail/:card",
        params = { card = { type = "enum", values = { "breathe", "focus" } } },
    },
}
local catalogueEntry = table.freeze({ name = "catalogue", params = table.freeze({}), query = table.freeze({}) })
local navigation = Navigation.createRouter { compiler = routeCompiler, initial = catalogueEntry }
local selected = cards[1].id
local storageStatus = "Awaiting launch"
local lifecycleStatus = "Created"
local connectivity = "Unknown"
local restoreRequest: number? = nil
local launchUrlRequest: number? = nil
local historyCurrentRequest: number? = nil
local restoreResolved = false
local restorePayload = ""
local launchResolved = false
local launchPayload = ""
local historyResolved = false
local currentHistoryToken: string? = nil
local historyEstablished = false
local pendingStartupUrl = ""
local saveRequests: { [number]: boolean } = {}
local modalOpen = false
local disposed = false
local stateRewriteRequired = false
local Application = { cards = table.freeze(cards) }

local function cardById(id: string): CatalogueCard?
    for _, card in cards do if card.id == id then return card end end
    return nil
end

local function splitRoutes(value: string): { string }?
    if value == "" then return nil end
    local output = {}
    local start = 1
    while true do
        local separator = string.find(value, ",", start, true)
        local route: string
        if separator == nil then route = string.sub(value, start) else route = string.sub(value, start, separator - 1) end
        if route == "" then return nil end
        table.insert(output, route)
        if #output > Navigation.limits.maximumStackDepth then return nil end
        if separator == nil then return output end
        start = separator + 1
    end
end

local function detailEntry(cardId: string): any
    return { name = "detail", params = { card = string.gsub(cardId, "^catalogue/", "") }, query = {} }
end

local function encodedState(): string
    return State.encode(2, { selected = selected, navigation = navigation.encode() })
end

local function stateForEntries(entries: { any }): string
    local temporary = Navigation.createRouter { compiler = routeCompiler, initial = entries[1] }
    for index = 2, #entries do assert(temporary.push(entries[index]).success, "history prefix route is invalid") end
    return State.encode(2, { selected = selected, navigation = temporary.encode() })
end

local function locationFor(): string
    return "#" .. navigation.currentLocation()
end

local function establishHistory()
    if currentHistoryToken ~= "" then
        Host.historyReplaceLocation(locationFor(), encodedState())
        return
    end
    local entries = navigation.snapshot().entries
    local prefix: { any } = { entries[1] }
    local temporary = Navigation.createRouter { compiler = routeCompiler, initial = entries[1] }
    Host.historyReplaceLocation("#" .. temporary.currentLocation(), stateForEntries(prefix))
    for index = 2, #entries do
        table.insert(prefix, entries[index])
        assert(temporary.push(entries[index]).success, "history route is invalid")
        Host.historyPushLocation("#" .. temporary.currentLocation(), stateForEntries(prefix))
    end
end

local function saveState()
    if disposed then return end
    storageStatus = connectivity == "Offline" and "Saving locally while offline" or "Saving"
    local requestId = Host.storageSet("catalogue-state", encodedState())
    saveRequests[requestId] = true
end

local function restoreState(payload: string): boolean
    if payload == "" then storageStatus = "Fresh state" return true end
    local migrated = State.migrate(payload, 2, {
        [1] = function(fields)
            local restoredCard = fields.selected
            local restoredRoutes = splitRoutes(fields.routes or "")
            if restoredCard == nil or cardById(restoredCard) == nil or restoredRoutes == nil then return {} end
            local temporary = Navigation.createRouter { compiler = routeCompiler, initial = catalogueEntry }
            if #restoredRoutes == 2 and restoredRoutes[1] == "catalogue" and restoredRoutes[2] == "detail" then
                if not temporary.push(detailEntry(restoredCard)).success then return {} end
            elseif #restoredRoutes ~= 1 or restoredRoutes[1] ~= "catalogue" then return {} end
            return { selected = restoredCard, navigation = temporary.encode() }
        end,
    })
    if not migrated.success then storageStatus = "State rejected: " .. migrated.error.code return false end
    local restoredCard = migrated.fields.selected
    local encodedNavigation = migrated.fields.navigation
    if restoredCard == nil or cardById(restoredCard) == nil or encodedNavigation == nil then storageStatus = "State rejected: invalid_fields" return false end
    local candidate = Navigation.createRouter { compiler = routeCompiler, initial = catalogueEntry }
    local restored = candidate.restoreEncoded(encodedNavigation)
    if not restored.success then storageStatus = "State rejected: " .. (restored.error and restored.error.code or "invalid_navigation") return false end
    local candidateCurrent = candidate.current() :: any
    if candidateCurrent.name == "detail" and "catalogue/" .. tostring(candidateCurrent.params.card) ~= restoredCard then storageStatus = "State rejected: inconsistent_route" return false end
    local admitted = navigation.restore(candidate.snapshot())
    if not admitted.success then storageStatus = "State rejected: invalid_navigation" return false end
    selected = restoredCard
    if string.sub(payload, 1, 4) == "v=1&" then stateRewriteRequired = true end
    storageStatus = "Restored"
    return true
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
    local previousState = encodedState()
    local entry = matched.entry :: any
    local entries: { any } = { catalogueEntry }
    if entry.name == "detail" then
        local fullId = "catalogue/" .. tostring(entry.params.card)
        if cardById(fullId) == nil then return false end
        selected = fullId
        table.insert(entries, entry)
    end
    if not navigation.restore({ version = 2, entries = entries }).success then return false end
    modalOpen = false
    saveState()
    local nextState = encodedState()
    if appendHistory and nextState ~= previousState then Host.historyPushLocation(locationFor(), nextState) end
    return true
end

local function finalizeStartup()
    if historyEstablished or not restoreResolved or not launchResolved or not historyResolved then return end
    if restorePayload ~= "" then restoreState(restorePayload) else storageStatus = "Fresh state" end
    if currentHistoryToken ~= nil and currentHistoryToken ~= "" then restoreState(currentHistoryToken) end
    local launchApplied = launchPayload ~= "" and applyUrl(launchPayload, false)
    if not launchApplied and pendingStartupUrl ~= "" then applyUrl(pendingStartupUrl, false) end
    pendingStartupUrl = ""
    historyEstablished = true
    if stateRewriteRequired then stateRewriteRequired = false saveState() end
    establishHistory()
end

local function cardView(card: CatalogueCard): UI.Node
    local selectedCard = selected == card.id
    return UI.Card {
        id = card.id,
        gap = "md",
        padding = "lg",
        surface = selectedCard and "elevated" or "card",
        motion = card.entrance,
        UI.Text { id = card.id .. "/title", text = card.title, variant = "heading" },
        UI.Text { id = card.id .. "/description", text = card.description, tone = "muted" },
        UI.Actions {
            id = card.id .. "/actions",
            gap = "sm",
            responsive = true,
            UI.Button {
                id = card.id .. "/select",
                text = selectedCard and "Selected" or "Choose",
                onTap = "select-card",
                disabled = selectedCard,
            },
            UI.Button {
                id = card.id .. "/open",
                text = "View details",
                onTap = "open-card",
                appearance = "secondary",
            },
        },
    }
end

local function catalogueView(): UI.Node
    local views: { UI.Node } = {}
    for _, card in cards do table.insert(views, cardView(card)) end
    return UI.Stack {
        id = "catalogue/content",
        gap = "xl",
        UI.Stack {
            id = "catalogue/intro",
            gap = "sm",
            width = "content",
            align = "center",
            UI.Text { id = "catalogue/title", text = "Choose your rhythm", variant = "title" },
            UI.Text { id = "catalogue/subtitle", text = "Responsive navigation and versioned state through the public Luastra SDK.", tone = "muted" },
        },
        UI.Grid {
            id = "catalogue/cards",
            gap = "lg",
            columns = "adaptive",
            responsive = true,
            table.unpack(views),
        },
        UI.Row {
            id = "catalogue/selection",
            gap = "sm",
            padding = "md",
            surface = "accent",
            responsive = true,
            UI.Text { id = "catalogue/selection-label", text = "Current selection" },
            UI.Text { id = "catalogue/selection-value", text = selected },
        },
    }
end

local function detailView(): UI.Node
    local card = cardById(selected) or cards[1]
    return UI.Stack {
        id = "detail/content",
        gap = "xl",
        UI.Actions {
            id = "detail/navigation",
            gap = "sm",
            UI.Button { id = "detail/back", text = "Back to catalogue", onTap = "navigate-back", appearance = "secondary" },
            UI.Button { id = "detail/about", text = "About this view", onTap = "open-modal", appearance = "ghost" },
        },
        UI.Card {
            id = "detail/card",
            gap = "lg",
            padding = "responsive",
            surface = "elevated",
            width = "content",
            UI.Text { id = "detail/title", text = card.title, variant = "title" },
            UI.Text { id = "detail/description", text = card.description, tone = "muted" },
            UI.Text { id = "detail/route", text = "Route: detail", tone = "success" },
        },
    }
end

function Application.render(): UI.Node
    return UI.Screen {
        id = "catalogue",
        width = "wide",
        padding = "responsive",
        UI.Stack {
            id = "catalogue/shell",
            gap = "lg",
            UI.Row {
                id = "catalogue/runtime-status",
                gap = "md",
                flow = "wrap",
                responsive = true,
                UI.Text { id = "catalogue/storage-status", text = "Storage: " .. storageStatus, role = "status", tone = string.find(storageStatus, "rejected", 1, true) and "error" or "muted" },
                UI.Text { id = "catalogue/lifecycle-status", text = "Lifecycle: " .. lifecycleStatus, tone = "muted" },
                UI.Text { id = "catalogue/connectivity-status", text = "Connection: " .. connectivity, role = "status", tone = connectivity == "Offline" and "error" or "success" },
            },
            navigation.current().name == "detail" and detailView() or catalogueView(),
        },
        UI.Modal {
            id = "catalogue/about-modal",
            label = "About catalogue navigation",
            open = modalOpen,
            onDismiss = "close-modal",
            UI.Stack {
                id = "catalogue/about-content",
                gap = "md",
                padding = "lg",
                UI.Text { id = "catalogue/about-title", text = "Host-neutral navigation", variant = "heading" },
                UI.Text { id = "catalogue/about-copy", text = "This modal, route stack and persisted selection are controlled from Luau." },
                UI.Button { id = "catalogue/about-close", text = "Close", onTap = "close-modal" },
            },
        },
    }
end

function Application.handle(action: string, target: string, value: string)
    if action == "lifecycle" and target == "app" then
        if value == "launch" and restoreRequest == nil and not disposed then
            lifecycleStatus = "Launching"
            storageStatus = "Restoring"
            restoreRequest = Host.storageGet("catalogue-state")
            launchUrlRequest = Host.launchUrl()
            historyCurrentRequest = Host.historyCurrent()
        elseif value == "foreground" then lifecycleStatus = "Foreground"
        elseif value == "background" then lifecycleStatus = "Background" saveState()
        elseif value == "online" then connectivity = "Online"
        elseif value == "offline" then connectivity = "Offline"
        elseif value == "dispose" then disposed = true lifecycleStatus = "Disposed"
        end
        return
    elseif action == "history" and target == "app" then
        modalOpen = false
        if restoreState(value) then saveState() end
        return
    elseif action == "open_url" and (target == "app" or target == "browser") then
        if not historyEstablished then
            pendingStartupUrl = value
            return
        end
        applyUrl(value, target == "app")
        if target == "browser" then
            Host.historyReplaceLocation(locationFor(), encodedState())
        end
        return
    elseif action == "system_back" and target == "app" then
        local intent = tonumber(string.match(value, "^([1-9][0-9]*):[01]$"))
        if intent == nil then return end
        local decision = Navigation.decideBack { modalOpen = modalOpen, canBack = navigation.canBack() }
        if decision == "dismiss-modal" then modalOpen = false Host.systemBackHandled(intent)
        elseif decision == "history" then Host.systemBackHistory(intent)
        else Host.systemBackExit(intent)
        end
        return
    elseif action == "navigate-back" and target == "detail/back" then Host.historyBack() return
    elseif action == "open-modal" and target == "detail/about" then modalOpen = true return
    elseif action == "close-modal" and target == "catalogue/about-close" then modalOpen = false return
    end

    for _, card in cards do
        if action == "select-card" and target == card.id .. "/select" then
            selected = card.id
            saveState()
            return
        elseif action == "open-card" and target == card.id .. "/open" then
            selected = card.id
            navigation.push(detailEntry(card.id))
            modalOpen = false
            saveState()
            Host.historyPushLocation(locationFor(), encodedState())
            return
        end
    end
end

function Application.resolve(requestId: number, success: boolean, payload: string, errorCode: string, errorMessage: string)
    if restoreRequest == requestId then
        restoreRequest = nil
        restoreResolved = true
        restorePayload = success and payload or ""
        if not success then storageStatus = errorCode .. ": " .. errorMessage end
        finalizeStartup()
    elseif launchUrlRequest == requestId then
        launchUrlRequest = nil
        launchResolved = true
        launchPayload = success and payload or ""
        finalizeStartup()
    elseif historyCurrentRequest == requestId then
        historyCurrentRequest = nil
        historyResolved = true
        currentHistoryToken = success and payload or ""
        finalizeStartup()
    elseif saveRequests[requestId] then
        saveRequests[requestId] = nil
        storageStatus = success and "Persisted" or (errorCode .. ": " .. errorMessage)
    end
end

function Application.snapshot()
    return {
        selected = selected,
        route = navigation.current().name,
        canBack = navigation.canBack(),
        storageStatus = storageStatus,
        lifecycleStatus = lifecycleStatus,
        connectivity = connectivity,
        modalOpen = modalOpen,
        disposed = disposed,
        encodedState = encodedState(),
    }
end

return Application
