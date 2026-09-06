--!strict

local requests: {any} = {}
local environment = getfenv() :: any

environment.HostCapability = {
    request = function(kind: string, operation: string, deadlineMs: number, input: string?): number
        table.insert(requests, { kind = kind, operation = operation, deadlineMs = deadlineMs, input = input })
        return #requests
    end,
}

local Application = require("app/main")

local function findNode(node: any, id: string): any?
    if node.id == id then return node end
    for _, child in node.children or {} do
        local found = findNode(child, id)
        if found ~= nil then return found end
    end
    return nil
end

Application.handle("lifecycle", "app", "launch")
assert(#requests == 4)
assert(requests[1].kind == "app.launchurl.get")
assert(requests[2].kind == "navigation.history" and requests[2].operation == "current")
assert(requests[3].kind == "storage.get" and requests[3].operation == "orbit-preferences")
assert(requests[4].kind == "storage.get" and requests[4].operation == "docs-theme")
Application.resolve(1, true, "https://luastra.dev/#/product/quickstart", "", "")
Application.resolve(2, true, "", "", "")
Application.resolve(3, true, "v1:luastra:system", "", "")
Application.resolve(4, true, "v1:light", "", "")
assert(Application.snapshot().historyEstablished == true)
assert(Application.snapshot().preferencesEstablished == true)
assert(Application.snapshot().location == "/product/quickstart")
assert((findNode(Application.render(), "landing/focus/title").properties :: any).text == "Quick start")
assert(requests[5].kind == "navigation.history" and requests[5].operation == "replace-location")

Application.handle("landing.close-focus", "landing/focus/close", "")
assert(Application.snapshot().location == "/product")
assert(requests[6].kind == "navigation.history" and requests[6].operation == "replace-location")
Application.handle("open_url", "app", "https://luastra.dev/#/product/quickstart")
assert(Application.snapshot().location == "/product/quickstart")
assert(requests[7].kind == "navigation.history" and requests[7].operation == "push-location")

Application.handle("landing.open-focus-docs", "landing/focus/docs", "")
assert(Application.snapshot().location == "/docs/quickstart")
assert(requests[8].kind == "navigation.history" and requests[8].operation == "push-location")
local docsState = Application.snapshot().encodedState

Application.handle("docs.search", "docs/search", "checksum-verified")
local searchResults = Application.render()
assert(findNode(searchResults, "docs/search/clear") ~= nil)
assert((findNode(searchResults, "docs/search/count").properties :: any).text ~= "No results")
Application.handle("docs.clear-search", "docs/search/clear", "")
assert(Application.snapshot().query == "")

Application.handle("open_url", "browser", "https://luastra.dev/#/docs/overview")
assert(Application.snapshot().location == "/docs/overview")
assert(requests[9].kind == "navigation.history" and requests[9].operation == "replace-location")
local overviewTree = Application.render()
assert((findNode(overviewTree, "docs/nav/group-1/item-1").properties :: any).href == "#/docs/overview")
assert((findNode(overviewTree, "docs/nav/group-1/item-2").properties :: any).href == "#/docs/installation")

Application.handle("open_url", "browser", "https://luastra.dev/#/docs/recipe-history")
assert(Application.snapshot().location == "/docs/recipe-history")
assert(Application.snapshot().selectedSection == "recipe-history")

Application.handle("open_url", "browser", "https://luastra.dev/#/docs/not-a-section")
assert(Application.snapshot().location == "/docs/recipe-history")

Application.handle("history", "app", docsState)
assert(Application.snapshot().location == "/docs/quickstart")

Application.handle("open_url", "browser", "https://luastra.dev/#docs/content")
assert(Application.snapshot().location == "/docs/overview")

Application.handle("open_url", "browser", "https://luastra.dev/#/reference/not-a-page")
assert(Application.snapshot().location == "/docs/overview")

Application.handle("open_url", "browser", "https://luastra.dev/#/docs/ui")
local uiTree = Application.render()
assert((findNode(uiTree, "docs/page-link-125").properties :: any).href == "#/reference/ui%2Fitem-4")
assert(findNode(Application.render(), "docs/section/copy") ~= nil)
Application.handle("docs.copy-section", "docs/section/copy", "")
assert(requests[#requests].kind == "clipboard.write")
local copyRequest = #requests
Application.resolve(copyRequest, true, "", "", "")
assert((findNode(Application.render(), "docs/section/copy-status").properties :: any).text == "Example copied.")

Application.handle("open_url", "browser", "https://luastra.dev/#/reference/ui%2Fitem-8")
local buttonPage = Application.render()
assert((findNode(buttonPage, "docs/detail/previous").properties :: any).href == "#/reference/ui%2Fitem-7")
assert((findNode(buttonPage, "docs/detail/next").properties :: any).href == "#/reference/ui%2Fitem-9")
assert(findNode(buttonPage, "docs/detail/related-1") ~= nil)
assert(findNode(buttonPage, "docs/pages/ui") == nil)

return true
