--!strict

local Landing = require("app/landing")
local UI = require("luastra/ui")

local function findNode(node: any, id: string): any?
    if node.id == id then return node end
    for _, child in node.children or {} do
        local found = findNode(child, id)
        if found ~= nil then return found end
    end
    return nil
end

local root = Landing.render()
assert(root.id == "site/landing")
assert(findNode(root, "landing/root") ~= nil)
assert((findNode(root, "landing/focus").properties :: any).open == false)
local validRoute = pcall(function() UI.Link { id = "route/valid", text = "Quick start", href = "#/docs/quickstart" } end)
local validEncodedRoute = pcall(function() UI.Link { id = "route/encoded", text = "Reference", href = "#/reference/ui%2Fitem-4" } end)
local invalidEscape = pcall(function() UI.Link { id = "route/bad-escape", text = "Bad", href = "#/docs/%ZZ" } end)
local invalidSlash = pcall(function() UI.Link { id = "route/bad-slash", text = "Bad", href = "#//example.test" } end)
assert(validRoute)
assert(validEncodedRoute)
assert(not invalidEscape)
assert(not invalidSlash)

Landing.handle("landing.open-theme-picker", "landing/path/theme", "")
assert(Landing.snapshot().themePickerOpen == true)
Landing.handle("landing.choose-theme", "landing/theme-picker/choice-2", "")
assert(Landing.snapshot().theme == "abyss")
assert(Landing.snapshot().themePickerOpen == false)
Landing.handle("landing.open-theme-picker", "landing/path/theme", "")
Landing.handle("landing.choose-theme", "landing/theme-picker/choice-1", "")
assert(Landing.snapshot().theme == "luastra")
Landing.handle("landing.toggle-motion", "landing/path/motion", "")
assert(Landing.snapshot().motion == "off")
assert(Landing.encodedPreferences() == "v1:luastra:off")
assert(Landing.restorePreferences("v1:atlas:system"))
assert(Landing.snapshot().theme == "atlas")
assert(Landing.snapshot().motion == "system")
assert(not Landing.restorePreferences("v2:atlas:system"))

Landing.handle("landing.open-product", "landing/product", "")
assert(Landing.snapshot().section == "product")
assert(findNode(Landing.render(), "landing/product-map") ~= nil)
Landing.handle("landing.search", "landing/search/input", "semantic")
assert(Landing.snapshot().query == "semantic")
Landing.handle("landing.open-focus", "landing/product/ui", "")
assert(Landing.snapshot().selectedId == "landing/product/ui")
assert(Landing.handle("landing.open-focus-docs", "landing/focus/docs", "") == "ui")
Landing.handle("landing.close-focus", "landing/focus/close", "")

Landing.handle("landing.return-root", "landing/path/root", "")
Landing.handle("landing.open-examples", "landing/examples", "")
local examples = Landing.render()
assert(Landing.snapshot().section == "examples")
assert(findNode(examples, "landing/example-map") ~= nil)
assert(findNode(examples, "landing/examples/orbit") ~= nil)

return true
