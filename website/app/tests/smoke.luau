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

local function findLink(node: any, text: string): any?
    local properties = node.properties :: any
    if node.type == "Link" and properties.text == text then return node end
    for _, child in node.children or {} do
        local found = findLink(child, text)
        if found ~= nil then return found end
    end
    return nil
end

local tree = Application.render()
assert(tree.type == "Screen")
assert(tree.id == "site/landing")
assert((tree.properties :: any).documentLanguage == "en")
assert(findNode(tree, "landing/orbit") ~= nil)
assert(findNode(tree, "landing/root/center") ~= nil)

Application.handle("landing.open-product", "landing/product", "")
assert(Application.snapshot().location == "/product")
local productTree = Application.render()
assert(findNode(productTree, "landing/product-map") ~= nil)
Application.handle("landing.open-focus", "landing/product/quickstart", "")
assert(Application.snapshot().location == "/product/quickstart")
local productFocus = Application.render()
assert((findNode(productFocus, "landing/focus").properties :: any).open == true)
assert((findNode(productFocus, "landing/focus/title").properties :: any).text == "Quick start")
Application.handle("landing.open-focus-docs", "landing/focus/docs", "")
assert(Application.snapshot().location == "/docs/quickstart")

local docsTree = Application.render()
assert(docsTree.id == "docs/root")
assert(#docsTree.children >= 2)
assert((docsTree.properties :: any).documentLanguage == "en")
assert(string.find((findNode(docsTree, "docs/header/menu").properties :: any).className, "luastra-site-menu-button", 1, true) ~= nil)
assert((findNode(docsTree, "docs/search").properties :: any).placeholder == "Find a component or function…")

Application.handle("site.open-home", "docs/header/home", "")
local returnedHome = Application.render()
assert(returnedHome.id == "site/landing")
assert(Application.snapshot().location == "/")
assert((findNode(returnedHome, "landing/focus").properties :: any).open == false)
Application.handle("landing.open-reference", "landing/path/docs", "")

Application.handle("docs.toggle-theme", "docs/header/theme", "")
local darkTree = Application.render()
assert((darkTree.properties :: any).backgroundColor == "#0E201D")
Application.handle("docs.toggle-theme", "docs/header/theme", "")

Application.handle("docs.toggle-navigation", "docs/header/menu", "")
assert(string.find((findNode(Application.render(), "docs/sidebar").properties :: any).className, "luastra-site-sidebar-open", 1, true) ~= nil)
Application.handle("docs.close-navigation", "docs/navigation-scrim", "")

Application.handle("example.increment", "live/increment", "")
assert(Application.render().type == "Screen")

Application.handle("docs.search", "docs/search", "Create a project")
local createLink = findLink(Application.render(), "Create a project")
assert(createLink ~= nil)
Application.handle("docs.open-page", createLink.id, "")
Application.render()
Application.handle("docs.copy", "docs/detail/copy", "")
assert(#requests == 1 and requests[1].kind == "clipboard.write" and requests[1].operation == "write-text")
Application.resolve(1, true, "", "", "")
local copiedPage = Application.render()
local copiedStatus = findNode(copiedPage, "docs/detail/copy-status")
assert(copiedStatus ~= nil and (copiedStatus.properties :: any).text == "Example copied.")

Application.handle("docs.search", "docs/search", "Analyzes the strict Luau graph")
local checkLink = findLink(Application.render(), "Check")
assert(checkLink ~= nil)
Application.handle("docs.open-page", checkLink.id, "")
local otherPage = Application.render()
assert(findNode(otherPage, "docs/detail/copy-status") == nil)

Application.handle("docs.search", "docs/search", "Creates the bounded root for Constellation Orbit")
local orbitLink = findLink(Application.render(), "UI.Orbit")
assert(orbitLink ~= nil)
Application.handle("docs.open-page", orbitLink.id, "")
local orbitPage = Application.render()
local orbitRecipe = findLink(orbitPage, "Open build a small Constellation Orbit recipe")
assert(orbitRecipe ~= nil)
Application.handle("docs.open-section", orbitRecipe.id, "")
assert(Application.snapshot().selectedSection == "recipe-orbit")

Application.handle("docs.search", "docs/search", "")
local learningLink = findLink(Application.render(), "Interactive learning path")
assert(learningLink ~= nil)
Application.handle("docs.open-section", learningLink.id, "")
local learning = Application.render()
assert((findNode(learning, "learn/progress").properties :: any).text == "Step 1 of 5")
Application.handle("learn.next", "learn/next", "")
assert((findNode(Application.render(), "learn/progress").properties :: any).text == "Step 2 of 5")
Application.handle("learn.reset", "learn/reset", "")
assert((findNode(Application.render(), "learn/progress").properties :: any).text == "Step 1 of 5")

Application.handle("docs.search", "docs/search", "Security policy")
local securityLink = findLink(Application.render(), "Security policy")
assert(securityLink ~= nil)
assert(string.find((securityLink.properties :: any).href, "#/reference/", 1, true) == 1)
Application.handle("docs.open-page", securityLink.id, "")
local securityPage = Application.render()
assert(findNode(securityPage, "docs/detail/points") ~= nil)
assert(findNode(securityPage, "docs/detail/parameters-title") == nil)

return true
