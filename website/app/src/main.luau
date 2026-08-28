--!strict

local Examples = require("app/examples")
local ReferenceData = require("app/reference-data")
local Host = require("luastra/host")
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
local copyStatusByPage: {[string]: string} = {}
local pendingCopy: {[number]: string} = {}
local targetPages: {[string]: string} = {}
local targetSections: {[string]: string} = {}
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

local function link(id: string, text: string, pageId: string): UI.Node
    targetPages[id] = pageId
    return UI.Link {
        id = id,
        text = text,
        href = "#docs/content",
        onTap = "docs.open-page",
    }
end

local function sectionLink(id: string, text: string, sectionId: string, className: string?): UI.Node
    targetSections[id] = sectionId
    return UI.Link {
        id = id,
        text = text,
        href = "#docs/content",
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
    if action == "docs.search" and target == "docs/search" then
        query = value
        selectedPageId = nil
        navigationOpen = false
    elseif action == "docs.open-page" then
        local pageId = targetPages[target]
        if pageId ~= nil then
            query = ""
            selectedPageId = pageId
            navigationOpen = false
        end
    elseif action == "docs.open-section" then
        local sectionId = targetSections[target]
        if sectionId ~= nil then
            query = ""
            selectedPageId = nil
            selectedSection = sectionId
            navigationOpen = false
        end
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
    local pageId = pendingCopy[id]
    if pageId == nil then return end
    pendingCopy[id] = nil
    copyStatusByPage[pageId] = success and "Example copied." or "Could not copy the example."
end

return Application
