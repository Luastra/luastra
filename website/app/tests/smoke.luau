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

local function findLink(node: any, text: string): any?
    local properties = node.properties :: any
    if node.type == "Link" and properties.text == text then return node end
    for _, child in node.children or {} do
        local found = findLink(child, text)
        if found ~= nil then return found end
    end
    return nil
end

local tree = application.render()
assert(tree.type == "Screen")
assert(tree.id == "site/landing")
assert((tree.properties :: any).documentLanguage == "en")
assert(findNode(tree, "landing/orbit") ~= nil)
assert(findNode(tree, "landing/root/center") ~= nil)

application.handle("landing.open-product", "landing/product", "")
assert(application.snapshot().location == "/product")
local productTree = application.render()
assert(findNode(productTree, "landing/product-map") ~= nil)
application.handle("landing.open-focus", "landing/product/quickstart", "")
assert(application.snapshot().location == "/product/quickstart")
local productFocus = application.render()
assert((findNode(productFocus, "landing/focus").properties :: any).open == true)
assert((findNode(productFocus, "landing/focus/title").properties :: any).text == "Quick start")
application.handle("landing.open-focus-docs", "landing/focus/docs", "")
assert(application.snapshot().location == "/docs/quickstart")

local docsTree = application.render()
assert(docsTree.id == "docs/root")
assert(#docsTree.children >= 2)
assert((docsTree.properties :: any).documentLanguage == "en")
assert(string.find((findNode(docsTree, "docs/header/menu").properties :: any).className, "luastra-site-menu-button", 1, true) ~= nil)
assert((findNode(docsTree, "docs/search").properties :: any).placeholder == "Find a component or function…")

application.handle("site.open-home", "docs/header/home", "")
local returnedHome = application.render()
assert(returnedHome.id == "site/landing")
assert(application.snapshot().location == "/")
assert((findNode(returnedHome, "landing/focus").properties :: any).open == false)
application.handle("landing.open-reference", "landing/path/docs", "")

application.handle("docs.toggle-theme", "docs/header/theme", "")
local darkTree = application.render()
assert((darkTree.properties :: any).backgroundColor == "#0E201D")
application.handle("docs.toggle-theme", "docs/header/theme", "")

application.handle("docs.toggle-navigation", "docs/header/menu", "")
assert(string.find((findNode(application.render(), "docs/sidebar").properties :: any).className, "luastra-site-sidebar-open", 1, true) ~= nil)
application.handle("docs.close-navigation", "docs/navigation-scrim", "")

application.handle("example.increment", "live/increment", "")
assert(application.render().type == "Screen")

application.handle("docs.search", "docs/search", "Create a project")
local createLink = findLink(application.render(), "Create a project")
assert(createLink ~= nil)
application.handle("docs.open-page", createLink.id, "")
application.render()
application.handle("docs.copy", "docs/detail/copy", "")
assert(#requests == 1 and requests[1].kind == "clipboard.write" and requests[1].operation == "write-text")
application.resolve(1, true, "", "", "")
local copiedPage = application.render()
local copiedStatus = findNode(copiedPage, "docs/detail/copy-status")
assert(copiedStatus ~= nil and (copiedStatus.properties :: any).text == "Example copied.")

application.handle("docs.search", "docs/search", "Analyzes the strict Luau graph")
local checkLink = findLink(application.render(), "Check")
assert(checkLink ~= nil)
application.handle("docs.open-page", checkLink.id, "")
local otherPage = application.render()
assert(findNode(otherPage, "docs/detail/copy-status") == nil)

application.handle("docs.search", "docs/search", "Creates the bounded root for Constellation Orbit")
local orbitLink = findLink(application.render(), "UI.Orbit")
assert(orbitLink ~= nil)
application.handle("docs.open-page", orbitLink.id, "")
local orbitPage = application.render()
local orbitRecipe = findLink(orbitPage, "Open build a small Constellation Orbit recipe")
assert(orbitRecipe ~= nil)
application.handle("docs.open-section", orbitRecipe.id, "")
assert(application.snapshot().selectedSection == "recipe-orbit")

application.handle("docs.search", "docs/search", "")
local learningLink = findLink(application.render(), "Interactive learning path")
assert(learningLink ~= nil)
application.handle("docs.open-section", learningLink.id, "")
local learning = application.render()
assert((findNode(learning, "learn/progress").properties :: any).text == "Step 1 of 5")
application.handle("learn.next", "learn/next", "")
assert((findNode(application.render(), "learn/progress").properties :: any).text == "Step 2 of 5")
application.handle("learn.reset", "learn/reset", "")
assert((findNode(application.render(), "learn/progress").properties :: any).text == "Step 1 of 5")

application.handle("docs.search", "docs/search", "Security policy")
local securityLink = findLink(application.render(), "Security policy")
assert(securityLink ~= nil)
assert(string.find((securityLink.properties :: any).href, "#/reference/", 1, true) == 1)
application.handle("docs.open-page", securityLink.id, "")
local securityPage = application.render()
assert(findNode(securityPage, "docs/detail/points") ~= nil)
assert(findNode(securityPage, "docs/detail/parameters-title") == nil)

return true
