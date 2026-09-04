--!strict

local Landing = require("app/landing")

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

Landing.handle("landing.next-theme", "landing/path/theme-next", "")
assert(Landing.snapshot().theme == "abyss")
for _ = 1, 10 do Landing.handle("landing.next-theme", "landing/path/theme-next", "") end
assert(Landing.snapshot().theme == "luastra")
Landing.handle("landing.toggle-motion", "landing/path/motion", "")
assert(Landing.snapshot().motion == "off")

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
