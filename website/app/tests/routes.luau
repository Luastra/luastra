--!strict

local requests: {any} = {}
local environment = getfenv() :: any

environment.HostCapability = {
    request = function(kind: string, operation: string, deadlineMs: number, input: string?): number
        table.insert(requests, { kind = kind, operation = operation, deadlineMs = deadlineMs, input = input })
        return #requests
    end,
}

local application = require("app/main")

local function findNode(node: any, id: string): any?
    if node.id == id then return node end
    for _, child in node.children or {} do
        local found = findNode(child, id)
        if found ~= nil then return found end
    end
    return nil
end

local function findNodeByHref(node: any, href: string): any?
    if node.properties ~= nil and node.properties.href == href then return node end
    for _, child in node.children or {} do
        local found = findNodeByHref(child, href)
        if found ~= nil then return found end
    end
    return nil
end

application.handle("lifecycle", "app", "launch")
assert(#requests == 4)
assert(requests[1].kind == "app.launchurl.get")
assert(requests[2].kind == "navigation.history" and requests[2].operation == "current")
assert(requests[3].kind == "storage.get" and requests[3].operation == "orbit-preferences")
assert(requests[4].kind == "storage.get" and requests[4].operation == "docs-theme")
application.resolve(1, true, "https://luastra.dev/#/product/quickstart", "", "")
application.resolve(2, true, "", "", "")
application.resolve(3, true, "v1:luastra:system", "", "")
application.resolve(4, true, "v1:light", "", "")
assert(application.snapshot().historyEstablished == true)
assert(application.snapshot().preferencesEstablished == true)
assert(application.snapshot().location == "/product/quickstart")
assert((findNode(application.render(), "landing/focus/title").properties :: any).text == "Quick start")
assert(requests[5].kind == "navigation.history" and requests[5].operation == "replace-location")

application.handle("landing.close-focus", "landing/focus/close", "")
assert(application.snapshot().location == "/product")
assert(requests[6].kind == "navigation.history" and requests[6].operation == "replace-location")
application.handle("open_url", "app", "https://luastra.dev/#/product/quickstart")
assert(application.snapshot().location == "/product/quickstart")
assert(requests[7].kind == "navigation.history" and requests[7].operation == "push-location")

application.handle("landing.open-focus-docs", "landing/focus/docs", "")
assert(application.snapshot().location == "/docs/quickstart")
assert(requests[8].kind == "navigation.history" and requests[8].operation == "push-location")
local docsState = application.snapshot().encodedState

application.handle("docs.search", "docs/search", "checksum-verified")
local searchResults = application.render()
assert(findNode(searchResults, "docs/search/clear") ~= nil)
assert((findNode(searchResults, "docs/search/count").properties :: any).text ~= "No results")
application.handle("docs.clear-search", "docs/search/clear", "")
assert(application.snapshot().query == "")

application.handle("open_url", "browser", "https://luastra.dev/#/docs/overview")
assert(application.snapshot().location == "/docs/overview")
assert(requests[9].kind == "navigation.history" and requests[9].operation == "replace-location")
local overviewTree = application.render()
assert((findNode(overviewTree, "docs/nav/group-1/item-1").properties :: any).href == "#/docs/overview")
assert((findNode(overviewTree, "docs/nav/group-1/item-2").properties :: any).href == "#/docs/installation")

application.handle("open_url", "browser", "https://luastra.dev/#/docs/recipe-history")
assert(application.snapshot().location == "/docs/recipe-history")
assert(application.snapshot().selectedSection == "recipe-history")

application.handle("open_url", "browser", "https://luastra.dev/#/docs/not-a-section")
assert(application.snapshot().location == "/docs/recipe-history")

application.handle("history", "app", docsState)
assert(application.snapshot().location == "/docs/quickstart")

application.handle("open_url", "browser", "https://luastra.dev/#docs/content")
assert(application.snapshot().location == "/docs/overview")

application.handle("open_url", "browser", "https://luastra.dev/#/reference/not-a-page")
assert(application.snapshot().location == "/docs/overview")

application.handle("open_url", "browser", "https://luastra.dev/#/docs/ui")
local uiTree = application.render()
assert(findNodeByHref(uiTree, "#/reference/ui/screen") ~= nil)
assert(findNode(application.render(), "docs/section/copy") ~= nil)
application.handle("docs.copy-section", "docs/section/copy", "")
assert(requests[#requests].kind == "clipboard.write")
local copyRequest = #requests
application.resolve(copyRequest, true, "", "", "")
assert((findNode(application.render(), "docs/section/copy-status").properties :: any).text == "Example copied.")

application.handle("open_url", "browser", "https://luastra.dev/#/reference/ui%2Fitem-8")
assert(application.snapshot().location == "/reference/ui/button")
local buttonPage = application.render()
assert(buttonPage.properties.documentTitle == "UI.Button — Luastra SDK Reference")
assert((findNode(buttonPage, "docs/detail/previous").properties :: any).href == "#/reference/ui/text")
assert((findNode(buttonPage, "docs/detail/next").properties :: any).href == "#/reference/ui/icon")
assert(findNode(buttonPage, "docs/detail/related-next-step-title") ~= nil)
assert(findNode(buttonPage, "docs/detail/related-next-step-1") ~= nil)
assert((findNode(buttonPage, "docs/detail/inventory").properties :: any).href == "#/docs/ui")
assert(findNode(buttonPage, "docs/pages/ui") == nil)

application.handle("open_url", "browser", "https://luastra.dev/#/reference/data%2Fitem-4")
assert(application.snapshot().location == "/reference/data/result")
local dataResultPage = application.render()
assert(dataResultPage.properties.documentTitle == "Data.Result — Luastra SDK Reference")
assert(findNode(dataResultPage, "docs/detail/error-codes/row-17") ~= nil)
assert((findNode(dataResultPage, "docs/detail/produced-by-1").properties :: any).href == "#/reference/data/decode")

application.handle("open_url", "browser", "https://luastra.dev/#/reference/media%2Fitem-3")
assert(application.snapshot().location == "/reference/media/media-error")
local mediaErrorPage = application.render()
assert(findNode(mediaErrorPage, "docs/detail/error-codes") == nil)
assert(string.find((findNode(mediaErrorPage, "docs/detail/error-codes-note").properties :: any).text, "host-specific", 1, true) ~= nil)
assert((findNode(mediaErrorPage, "docs/detail/produced-by-1").properties :: any).href == "#/reference/media/decode-state")

for _, pageId in { "recipe-form-modal/item-3", "recipe-media/item-3", "recipe-orbit/item-3", "advanced-tutorial/item-3" } do
    application.handle("open_url", "browser", `https://luastra.dev/#/reference/{string.gsub(pageId, "/", "%%2F")}`)
    local longExample = application.render()
    local firstBlock = findNode(longExample, "docs/detail/example")
    local secondBlock = findNode(longExample, "docs/detail/example-2")
    assert(firstBlock ~= nil and #(firstBlock.properties :: any).text <= 4096)
    assert(secondBlock ~= nil and #(secondBlock.properties :: any).text <= 4096)
end

application.handle("open_url", "browser", "https://luastra.dev/#/reference/advanced-tutorial%2Fitem-1")
assert(application.snapshot().location == "/reference/advanced-tutorial/create-the-project")
for index = 1, 40 do
    local movingForward = index % 2 == 1
    local controlId = movingForward and "docs/detail/next" or "docs/detail/previous"
    local expectedLocation = movingForward and "/reference/advanced-tutorial/replace-luastra-json" or "/reference/advanced-tutorial/create-the-project"
    local control = findNode(application.render(), controlId)
    assert(control ~= nil)
    application.handle("docs.open-page", control.id, "")
    assert(application.snapshot().location == expectedLocation)
end

return true
