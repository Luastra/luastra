--!strict

local Examples = require("app/examples")
local Landing = require("app/landing")
local ReferenceData = require("app/reference-data")
local Host = require("luastra/host")
local Navigation = require("luastra/navigation")
local UI = require("luastra/ui")

local Application = {}

local lightTheme: UI.Theme = {
    backgroundColor = "#F4EFE3",
    textColor = "#16342E",
    accentColor = "#2F7568",
    mutedColor = "#526A64",
    surfaceColor = "#FFFDF7",
    successColor = "#245C53",
    warningColor = "#E4AD3A",
    dangerColor = "#9C3C32",
}

local darkTheme: UI.Theme = {
    backgroundColor = "#0E201D",
    textColor = "#F4EFE3",
    accentColor = "#65AD9F",
    mutedColor = "#B6C7C1",
    surfaceColor = "#18332E",
    successColor = "#8FD2BF",
    warningColor = "#EFB944",
    dangerColor = "#EF8C80",
}

local query = ""
local selectedSection = "overview"
local selectedPageId: string? = nil
local exampleCounter = 0
local learningStep = 1
local darkMode = false
local navigationOpen = false
local showingLanding = true
local copyStatusByPage: {[string]: string} = {}
local pendingCopy: {[number]: string} = {}
local targetPages: {[string]: string} = {}
local targetSections: {[string]: string} = {}

local sectionIds: {string} = {}
local pageById: {[string]: boolean} = {}
for _, section in ReferenceData.sections do table.insert(sectionIds, section.id) end
for _, page in ReferenceData.pages do pageById[page.id] = true end

local routeCompiler = Navigation.compile {
    { name = "home", path = "/" },
    { name = "product", path = "/product" },
    { name = "examples", path = "/examples" },
    { name = "about", path = "/about/:topic", params = { topic = { type = "enum", values = { "why", "targets", "source" } } } },
    { name = "product-detail", path = "/product/:topic", params = { topic = { type = "enum", values = { "install", "quickstart", "learn", "ui", "state", "hosts" } } } },
    { name = "example-detail", path = "/examples/:example", params = { example = { type = "enum", values = { "catalogue", "orbit", "meditation", "forms", "media", "routing", "visuals", "debug" } } } },
    { name = "docs", path = "/docs/:section", params = { section = { type = "enum", values = sectionIds } } },
    { name = "reference", path = "/reference/:page", params = { page = { type = "string", maximumLength = 128 } } },
}
local homeEntry = table.freeze({ name = "home", params = table.freeze({}), query = table.freeze({}) })
local navigation = Navigation.createRouter { compiler = routeCompiler, initial = homeEntry }
local launchUrlRequest: number? = nil
local historyCurrentRequest: number? = nil
local launchResolved = false
local historyResolved = false
local launchPayload = ""
local currentHistoryToken: string? = nil
local pendingStartupUrl = ""
local historyEstablished = false
local propertyGroups: {[string]: string} = {
    action = "ui-properties-events",
    columns = "ui-properties-layout",
    input = "ui-properties-input",
    label = "ui-properties-semantics",
    layout = "ui-properties-layout",
    modal = "ui-properties-semantics",
    motion = "ui-properties-events",
    scroll = "ui-properties-layout",
    semantic = "ui-properties-semantics",
    surface = "ui-properties-layout",
    text = "ui-properties-text-style",
    ["text-style"] = "ui-properties-text-style",
    theme = "ui-properties-theme",
    visual = "ui-properties-visual",
}

local function lower(value: string): string
    return string.lower(value)
end

local function includes(value: string?, needle: string): boolean
    return value ~= nil and string.find(lower(value), needle, 1, true) ~= nil
end

local function selectedPage(): any?
    if selectedPageId == nil then return nil end
    for _, page in ReferenceData.pages do
        if page.id == selectedPageId then return page end
    end
    return nil
end

local function sectionById(id: string): any?
    for _, section in ReferenceData.sections do
        if section.id == id then return section end
    end
    return nil
end

local function applyRoute(): boolean
    local entry = navigation.current() :: any
    query = ""
    navigationOpen = false
    if entry.name == "home" then
        showingLanding = true
        return Landing.restore("root", nil)
    elseif entry.name == "product" then
        showingLanding = true
        return Landing.restore("product", nil)
    elseif entry.name == "examples" then
        showingLanding = true
        return Landing.restore("examples", nil)
    elseif entry.name == "about" then
        showingLanding = true
        return Landing.restore("root", "landing/" .. tostring(entry.params.topic))
    elseif entry.name == "product-detail" then
        showingLanding = true
        return Landing.restore("product", "landing/product/" .. tostring(entry.params.topic))
    elseif entry.name == "example-detail" then
        showingLanding = true
        return Landing.restore("examples", "landing/examples/" .. tostring(entry.params.example))
    elseif entry.name == "docs" then
        showingLanding = false
        selectedPageId = nil
        selectedSection = tostring(entry.params.section)
        return sectionById(selectedSection) ~= nil
    elseif entry.name == "reference" then
        local pageId = tostring(entry.params.page)
        if pageById[pageId] ~= true then return false end
        showingLanding = false
        selectedPageId = pageId
        return true
    end
    return false
end

local function applyRouteOrHome()
    if applyRoute() then return end
    local fallback = navigation.replace(homeEntry)
    assert(fallback.success and applyRoute(), "site fallback route did not resolve")
end

local function locationFor(): string
    return "#" .. navigation.currentLocation()
end

local function pushEntry(entry: any)
    local result = navigation.push(entry)
    if not result.success then return end
    assert(applyRoute(), "site route did not resolve")
    if result.changed and historyEstablished then Host.historyPushLocation(locationFor(), navigation.encode()) end
end

local function replaceEntry(entry: any)
    local result = navigation.replace(entry)
    if not result.success then return end
    assert(applyRoute(), "site route did not resolve")
    if historyEstablished then Host.historyReplaceLocation(locationFor(), navigation.encode()) end
end

local function locationFromUrl(value: string): string?
    if string.match(value, "#docs/content$") ~= nil then return "/docs/overview" end
    return string.match(value, "#(/[^#]*)$")
end

local function applyUrl(value: string, appendHistory: boolean): boolean
    local location = locationFromUrl(value)
    local matched = location and routeCompiler.match(location) or nil
    if matched == nil or not matched.success or matched.entry == nil then return false end
    local entry = matched.entry :: any
    local params = entry.params :: any
    if entry.name == "reference" and pageById[tostring(params.page)] ~= true then return false end
    local result = appendHistory and navigation.push(entry) or navigation.replace(entry)
    if not result.success or not applyRoute() then return false end
    if historyEstablished then
        if appendHistory and result.changed then Host.historyPushLocation(locationFor(), navigation.encode())
        else Host.historyReplaceLocation(locationFor(), navigation.encode()) end
    end
    return true
end

local function finalizeStartup()
    if historyEstablished or not launchResolved or not historyResolved then return end
    if currentHistoryToken ~= nil and currentHistoryToken ~= "" then navigation.restoreEncoded(currentHistoryToken) end
    local applied = launchPayload ~= "" and applyUrl(launchPayload, false)
    if not applied and pendingStartupUrl ~= "" then applied = applyUrl(pendingStartupUrl, false) end
    if not applied then applyRouteOrHome() end
    pendingStartupUrl = ""
    historyEstablished = true
    Host.historyReplaceLocation(locationFor(), navigation.encode())
end

local function landingEntry(target: string): any?
    if target == "landing/product" then return { name = "product", params = {}, query = {} } end
    if target == "landing/examples" then return { name = "examples", params = {}, query = {} } end
    local about = string.match(target, "^landing/([a-z]+)$")
    if about == "why" or about == "targets" or about == "source" then return { name = "about", params = { topic = about }, query = {} } end
    local product = string.match(target, "^landing/product/([a-z]+)$")
    if product ~= nil then return { name = "product-detail", params = { topic = product }, query = {} } end
    local example = string.match(target, "^landing/examples/([a-z]+)$")
    if example ~= nil then return { name = "example-detail", params = { example = example }, query = {} } end
    return nil
end

local function hrefFor(entry: any): string
    local generated = routeCompiler.generate(entry)
    assert(generated.success and generated.location ~= nil, "site link route is invalid")
    return "#" .. (generated.location :: string)
end

local function navigateBack(fallback: any)
    if not navigation.canBack() then
        replaceEntry(fallback)
    elseif historyEstablished then
        Host.historyBack()
    else
        navigation.back()
        assert(applyRoute(), "previous site route did not resolve")
    end
end

local function link(id: string, text: string, pageId: string): UI.Node
    targetPages[id] = pageId
    return UI.Link {
        id = id,
        text = text,
        href = hrefFor({ name = "reference", params = { page = pageId }, query = {} }),
        onTap = "docs.open-page",
    }
end

local function sectionLink(id: string, text: string, sectionId: string, className: string?): UI.Node
    targetSections[id] = sectionId
    return UI.Link {
        id = id,
        text = text,
        href = hrefFor({ name = "docs", params = { section = sectionId }, query = {} }),
        onTap = "docs.open-section",
        className = className,
    }
end

local function renderPageLinks(sectionId: string): UI.Node
    local input: any = {
        id = `docs/pages/{sectionId}`,
        gap = "sm",
    }
    local count = 0
    for index, page in ReferenceData.pages do
        if page.sectionId == sectionId then
            count += 1
            table.insert(input, link(`docs/page-link-{index}`, page.name, page.id))
        end
    end
    if count == 0 then
        table.insert(input, UI.Text { id = `docs/pages/{sectionId}/empty`, text = "This overview has no separate API pages." })
    end
    return UI.Column(input)
end

local function renderNavigation(): UI.Node
    local navigation: any = {
        id = "docs/nav",
        label = "Documentation sections",
        role = "navigation",
        gap = "none",
    }
    for groupIndex, group in ReferenceData.navigationGroups do
        local items: any = {
            id = `docs/nav/group-{groupIndex}`,
            className = "luastra-site-nav-group",
            gap = "none",
        }
        table.insert(items, UI.Text {
            id = `docs/nav/group-{groupIndex}/label`,
            text = group.label,
            className = "luastra-site-nav-label",
        })
        for itemIndex, item in group.items do
            local sectionId = item[1]
            table.insert(items, sectionLink(
                `docs/nav/group-{groupIndex}/item-{itemIndex}`,
                item[2],
                sectionId,
                "luastra-site-nav-link"
            ))
        end
        table.insert(navigation, UI.Column(items))
    end
    return UI.Column(navigation)
end

local function renderSidebar(): UI.Node
    return UI.Column {
        id = "docs/sidebar",
        className = navigationOpen and "luastra-site-sidebar luastra-site-sidebar-open" or "luastra-site-sidebar",
        role = "complementary",
        label = "SDK reference navigation",
        renderNavigation(),
        UI.Card {
            id = "docs/sidebar/note",
            className = "luastra-site-note",
            width = "full",
            gap = "xs",
            UI.Text { id = "docs/sidebar/note/title", text = "Source alpha", variant = "subheading" },
            UI.Text {
                id = "docs/sidebar/note/text",
                text = "This reference is version-bound. APIs may change between pre-release versions.",
                tone = "muted",
            },
        },
    }
end

local function renderHeader(): UI.Node
    return UI.Row {
        id = "docs/header",
        className = "luastra-site-topbar",
        role = "banner",
        UI.Button {
            id = "docs/header/home",
            className = "luastra-site-icon-button",
            text = "✦",
            label = "Return to the Luastra home experience",
            appearance = "secondary",
            onTap = "site.open-home",
        },
        UI.Button {
            id = "docs/header/menu",
            className = "luastra-site-icon-button luastra-site-menu-button",
            text = "☰",
            label = navigationOpen and "Close navigation" or "Open navigation",
            appearance = "secondary",
            onTap = "docs.toggle-navigation",
        },
        UI.Column {
            id = "docs/header/brand",
            className = "luastra-site-brand",
            gap = "none",
            UI.Text { id = "docs/header/brand/name", className = "luastra-site-brand-name", text = "Luastra" },
            UI.Text { id = "docs/header/brand/subtitle", className = "luastra-site-brand-subtitle", text = "SDK Reference" },
        },
        UI.Column {
            id = "docs/header/search",
            className = "luastra-site-search",
            width = "full",
            UI.TextInput {
                id = "docs/search",
                label = "Search the SDK",
                value = query,
                placeholder = "Find a component or function…",
                onInput = "docs.search",
                inputMode = "search",
                enterKeyHint = "search",
            },
        },
        UI.Text {
            id = "docs/header/version",
            className = "luastra-site-version",
            text = ReferenceData.release.version,
        },
        UI.Button {
            id = "docs/header/theme",
            className = "luastra-site-icon-button",
            text = darkMode and "☀" or "◐",
            label = darkMode and "Use light theme" or "Use dark theme",
            appearance = "secondary",
            onTap = "docs.toggle-theme",
        },
    }
end

local function renderSearchResults(): UI.Node
    local needle = lower(query)
    local input: any = { id = "docs/search/results", gap = "sm" }
    local count = 0
    for index, page in ReferenceData.pages do
        local matched = includes(page.name, needle)
            or includes(page.signature, needle)
            or includes(page.description, needle)
            or includes(page.module, needle)
        if matched then
            count += 1
            if count <= 40 then
                table.insert(input, UI.Card {
                    id = `docs/search/result-{index}`,
                    className = "luastra-site-reference-card",
                    width = "full",
                    padding = "md",
                    gap = "xs",
                    link(`docs/search/link-{index}`, page.name, page.id),
                    UI.Text { id = `docs/search/result-{index}/description`, text = page.description, tone = "muted" },
                })
            end
        end
    end
    table.insert(input, 1, UI.Text {
        id = "docs/search/count",
        text = count == 0 and "No pages found" or `Pages found: {count}`,
        variant = "subheading",
    })
    return UI.Column(input)
end

local function renderOverview(section: any): UI.Node
    local input: any = {
        id = "docs/section",
        gap = "lg",
        className = section.id == "overview" and "luastra-site-hero" or "luastra-site-reference-card",
    }
    if section.eyebrow ~= nil then
        table.insert(input, UI.Text {
            id = "docs/section/eyebrow",
            className = "luastra-site-eyebrow",
            text = section.eyebrow,
        })
    end
    table.insert(input, UI.Text { id = "docs/section/title", text = section.title, variant = "title" })
    if section.module ~= nil then table.insert(input, UI.Code { id = "docs/section/module", code = section.module, language = "Luau" }) end
    if section.summary ~= nil then table.insert(input, UI.Text { id = "docs/section/summary", text = section.summary }) end
    for index, paragraph in section.guide or {} do
        table.insert(input, UI.Text { id = `docs/section/guide-{index}`, text = paragraph })
    end
    for index, note in section.notes or {} do
        table.insert(input, UI.Text { id = `docs/section/note-{index}`, text = note, tone = "muted" })
    end
    if section.badges ~= nil and #section.badges > 0 then
        local badges: any = {
            id = "docs/section/badges",
            className = "luastra-site-badges",
            gap = "xs",
            flow = "wrap",
        }
        for index, badge in section.badges do
            table.insert(badges, UI.Text {
                id = `docs/section/badge-{index}`,
                className = "luastra-site-badge",
                text = badge,
            })
        end
        table.insert(input, UI.Row(badges))
    end
    for index, item in section.links or {} do
        table.insert(input, UI.Link {
            id = `docs/section/link-{index}`,
            text = item.text,
            href = item.href,
            label = item.text,
        })
    end
    if section.callout ~= nil then
        table.insert(input, UI.Card {
            id = "docs/section/callout",
            width = "full",
            surface = "accent",
            padding = "md",
            UI.Text { id = "docs/section/callout/text", text = section.callout },
        })
    end
    if section.example ~= nil then
        table.insert(input, UI.Text { id = "docs/section/example-title", text = "Complete example", variant = "subheading" })
        table.insert(input, UI.CodeBlock { id = "docs/section/example", code = section.example, language = "Luau" })
    end
    table.insert(input, UI.Divider { id = "docs/section/divider" })
    table.insert(input, UI.Text { id = "docs/section/pages-title", text = "Detail pages", variant = "subheading" })
    table.insert(input, renderPageLinks(section.id))
    if section.id == "overview" then table.insert(input, Examples.render(exampleCounter)) end
    if section.id == "learning-path" then table.insert(input, Examples.renderLearning(learningStep)) end
    return UI.Column(input)
end

local function renderPoints(page: any): UI.Node?
    if page.points == nil then return nil end
    local input: any = { id = "docs/detail/points", label = "Important details", gap = "xs" }
    for index, point in page.points do
        table.insert(input, UI.ListItem { id = `docs/detail/point-{index}`, text = point })
    end
    return UI.List(input)
end

local function renderParameters(page: any): UI.Node
    if page.parameters == nil or #page.parameters == 0 then
        return UI.Text {
            id = "docs/detail/parameters-empty",
            text = "No parameters.",
            tone = "muted",
        }
    end
    local tableInput: any = { id = "docs/detail/parameters", label = "Parameters" }
    table.insert(tableInput, UI.TableRow {
        id = "docs/detail/parameters/header",
        UI.TableCell { id = "docs/detail/parameters/header/name", header = true, scope = "col", text = "Parameter" },
        UI.TableCell { id = "docs/detail/parameters/header/value", header = true, scope = "col", text = "Type / values" },
        UI.TableCell { id = "docs/detail/parameters/header/description", header = true, scope = "col", text = "Description" },
    })
    for index, parameter in page.parameters do
        table.insert(tableInput, UI.TableRow {
            id = `docs/detail/parameters/row-{index}`,
            UI.TableCell { id = `docs/detail/parameters/row-{index}/name`, header = true, scope = "row", text = parameter.name },
            UI.TableCell { id = `docs/detail/parameters/row-{index}/value`, text = parameter.values },
            UI.TableCell { id = `docs/detail/parameters/row-{index}/description`, text = parameter.description },
        })
    end
    return UI.Table(tableInput)
end

local function renderParameterGroups(page: any): UI.Node?
    if page.props == nil or #page.props == 0 then return nil end
    local input: any = { id = "docs/detail/groups", gap = "xs" }
    for index, group in page.props do
        local groupName = group :: string
        local tableId = propertyGroups[groupName]
        local pageId = if tableId ~= nil then ReferenceData.parameterGroupPages[tableId] else nil
        if pageId ~= nil then
            table.insert(input, link(`docs/detail/group-{index}`, groupName, pageId))
        end
    end
    if #input == 0 then return nil end
    return UI.Column(input)
end

local function renderDetail(page: any): UI.Node
    local input: any = { id = "docs/detail", gap = "lg" }
    table.insert(input, sectionLink("docs/detail/back", `← {page.sectionTitle}`, page.sectionId))
    table.insert(input, UI.Text { id = "docs/detail/title", text = page.name, variant = "title" })
    if page.module ~= nil then table.insert(input, UI.Code { id = "docs/detail/module", code = page.module, language = "Luau" }) end
    if page.signature ~= nil and page.kind ~= "type" then table.insert(input, UI.CodeBlock { id = "docs/detail/signature", code = page.signature, language = "Luau" }) end
    table.insert(input, UI.Text { id = "docs/detail/description", text = page.description })
    if page.mentalModel ~= nil then
        table.insert(input, UI.Text { id = "docs/detail/mental-model-title", text = "Mental model", variant = "subheading" })
        table.insert(input, UI.Text { id = "docs/detail/mental-model", text = page.mentalModel })
    end
    if page.useWhen ~= nil then
        table.insert(input, UI.Card {
            id = "docs/detail/use-when",
            className = "luastra-site-use-when",
            width = "full",
            padding = "md",
            gap = "xs",
            UI.Text { id = "docs/detail/use-when/title", text = "When to use it", variant = "subheading" },
            UI.Text { id = "docs/detail/use-when/text", text = page.useWhen },
        })
    end
    local points = renderPoints(page)
    if points ~= nil then table.insert(input, points) end
    local groups = renderParameterGroups(page)
    if groups ~= nil then
        table.insert(input, UI.Text { id = "docs/detail/groups-title", text = "Shared parameter groups", variant = "subheading" })
        table.insert(input, groups)
    end
    if page.kind == "type" or page.callable == true then
        table.insert(input, UI.Text { id = "docs/detail/parameters-title", text = if page.kind == "type" then "Fields or definition" else "Parameters", variant = "subheading" })
        table.insert(input, renderParameters(page))
    end
    if page.childRules ~= nil then
        table.insert(input, UI.Text { id = "docs/detail/children-title", text = "Children and layout", variant = "subheading" })
        table.insert(input, UI.Text { id = "docs/detail/children", text = page.childRules })
    end
    if page.accessibility ~= nil then
        table.insert(input, UI.Text { id = "docs/detail/accessibility-title", text = "Accessibility and keyboard", variant = "subheading" })
        table.insert(input, UI.Text { id = "docs/detail/accessibility", text = page.accessibility })
    end
    if page.commonMistakes ~= nil and #page.commonMistakes > 0 then
        table.insert(input, UI.Text { id = "docs/detail/mistakes-title", text = "Common mistakes", variant = "subheading" })
        local mistakeList: any = { id = "docs/detail/mistakes", label = "Common mistakes", gap = "xs" }
        for index, mistake in page.commonMistakes do
            table.insert(mistakeList, UI.ListItem { id = `docs/detail/mistake-{index}`, text = mistake })
        end
        table.insert(input, UI.List(mistakeList))
    end
    if page.returns ~= nil then
        table.insert(input, UI.Text { id = "docs/detail/returns-title", text = "Returns", variant = "subheading" })
        table.insert(input, UI.Text { id = "docs/detail/returns", text = page.returns })
    end
    if page.code ~= nil then
        table.insert(input, UI.Text { id = "docs/detail/example-title", text = if page.kind == "type" then "Exact declaration" else "Minimal example", variant = "subheading" })
        table.insert(input, UI.CodeBlock { id = "docs/detail/example", code = page.code, language = page.language or "Luau" })
        table.insert(input, UI.Button { id = "docs/detail/copy", text = if page.kind == "type" then "Copy declaration" else "Copy example", appearance = "secondary", onTap = "docs.copy" })
        local copyStatus = copyStatusByPage[page.id]
        if copyStatus ~= nil then table.insert(input, UI.Text { id = "docs/detail/copy-status", text = copyStatus, role = "status" }) end
    end
    if page.name == "UI.Button" then table.insert(input, Examples.render(exampleCounter)) end
    table.insert(input, UI.Divider { id = "docs/detail/divider" })
    table.insert(input, UI.Text { id = "docs/detail/related-title", text = "Related pages", variant = "subheading" })
    table.insert(input, renderPageLinks(page.sectionId))
    return UI.Column(input)
end

local function renderContent(): UI.Node
    if query ~= "" then return renderSearchResults() end
    local page = selectedPage()
    if page ~= nil then return renderDetail(page) end
    local section = sectionById(selectedSection) or ReferenceData.sections[1]
    return renderOverview(section)
end

function Application.render(): UI.Node
    if showingLanding then return Landing.render() end
    targetPages = {}
    targetSections = {}
    return UI.Screen {
        id = "docs/root",
        theme = darkMode and darkTheme or lightTheme,
        className = "luastra-site",
        width = "full",
        padding = "none",
        gap = "none",
        documentTitle = "Luastra — Build apps like games",
        documentDescription = "Version-bound Luastra documentation, tutorials, and live examples.",
        documentLanguage = "en",

        renderHeader(),
        UI.Row {
            id = "docs/layout",
            className = "luastra-site-layout",
            align = "start",
            renderSidebar(),
            UI.Column {
                id = "docs/content",
                className = "luastra-site-main",
                role = "main",
                width = "full",
                gap = "lg",
                renderContent(),
            },
        },
        UI.Button {
            id = "docs/navigation-scrim",
            className = navigationOpen and "luastra-site-scrim luastra-site-scrim-open" or "luastra-site-scrim",
            text = "Close navigation",
            label = "Close navigation",
            appearance = "ghost",
            onTap = "docs.close-navigation",
        },
    }
end

function Application.handle(action: string, target: string, value: string)
    if action == "lifecycle" and target == "app" and value == "launch" and launchUrlRequest == nil then
        launchUrlRequest = Host.launchUrl()
        historyCurrentRequest = Host.historyCurrent()
        return
    elseif action == "history" and target == "app" then
        if navigation.restoreEncoded(value).success then applyRouteOrHome() end
        return
    elseif action == "open_url" and (target == "app" or target == "browser") then
        if not historyEstablished then pendingStartupUrl = value
        else applyUrl(value, target == "app") end
        return
    elseif action == "system_back" and target == "app" then
        local intent = tonumber(string.match(value, "^([1-9][0-9]*):[01]$"))
        if intent ~= nil then
            if navigation.canBack() then Host.systemBackHistory(intent) else Host.systemBackExit(intent) end
        end
        return
    elseif action == "site.open-home" then
        pushEntry(homeEntry)
        return
    end
    if showingLanding then
        if action == "landing.open-product" or action == "landing.open-examples" or action == "landing.open-focus" then
            local entry = landingEntry(target)
            if entry ~= nil then pushEntry(entry) end
        elseif action == "landing.open-reference" then
            pushEntry({ name = "docs", params = { section = "overview" }, query = {} })
        elseif action == "landing.open-focus-docs" then
            local destination = Landing.handle(action, target, value)
            if destination ~= nil then pushEntry({ name = "docs", params = { section = destination }, query = {} }) end
        elseif action == "landing.return-root" then
            navigateBack(homeEntry)
        elseif action == "landing.close-focus" then
            local routeName = navigation.current().name
            if routeName == "product-detail" then navigateBack({ name = "product", params = {}, query = {} })
            elseif routeName == "example-detail" then navigateBack({ name = "examples", params = {}, query = {} })
            else navigateBack(homeEntry) end
        else
            Landing.handle(action, target, value)
        end
        return
    end
    if action == "docs.search" and target == "docs/search" then
        query = value
        selectedPageId = nil
        navigationOpen = false
    elseif action == "docs.open-page" then
        local pageId = targetPages[target]
        if pageId ~= nil then pushEntry({ name = "reference", params = { page = pageId }, query = {} }) end
    elseif action == "docs.open-section" then
        local sectionId = targetSections[target]
        if sectionId ~= nil then pushEntry({ name = "docs", params = { section = sectionId }, query = {} }) end
    elseif action == "docs.toggle-navigation" and target == "docs/header/menu" then
        navigationOpen = not navigationOpen
    elseif action == "docs.close-navigation" and target == "docs/navigation-scrim" then
        navigationOpen = false
    elseif action == "docs.toggle-theme" and target == "docs/header/theme" then
        darkMode = not darkMode
    elseif action == "docs.copy" and target == "docs/detail/copy" then
        local page = selectedPage()
        if page ~= nil and page.code ~= nil then
            copyStatusByPage[page.id] = "Copying…"
            local code = page.code :: string
            pendingCopy[Host.clipboardWrite(code)] = page.id
        end
    elseif action == "example.increment" and target == "live/increment" then
        exampleCounter += 1
    elseif action == "example.reset" and target == "live/reset" then
        exampleCounter = 0
    elseif action == "learn.next" and target == "learn/next" then
        if learningStep < Examples.learningStepCount() then learningStep += 1 end
    elseif action == "learn.back" and target == "learn/back" then
        if learningStep > 1 then learningStep -= 1 end
    elseif action == "learn.reset" and target == "learn/reset" then
        learningStep = 1
    end
end

function Application.resolve(id: number, success: boolean, _payload: string, _code: string, _message: string)
    if launchUrlRequest == id then
        launchUrlRequest = nil
        launchResolved = true
        launchPayload = success and _payload or ""
        finalizeStartup()
        return
    elseif historyCurrentRequest == id then
        historyCurrentRequest = nil
        historyResolved = true
        currentHistoryToken = success and _payload or ""
        finalizeStartup()
        return
    end
    local pageId = pendingCopy[id]
    if pageId == nil then return end
    pendingCopy[id] = nil
    copyStatusByPage[pageId] = success and "Example copied." or "Could not copy the example."
end

function Application.snapshot()
    return {
        route = navigation.current().name,
        location = navigation.currentLocation(),
        encodedState = navigation.encode(),
        canBack = navigation.canBack(),
        historyEstablished = historyEstablished,
        showingLanding = showingLanding,
        selectedSection = selectedSection,
        selectedPageId = selectedPageId,
        landing = Landing.snapshot(),
    }
end

return Application
