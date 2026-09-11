--!strict

local Blocks = require("universal-blocks")
local UI = require("luastra/ui")

local appBar = Blocks.AppBar { id = "proof/bar", title = "Proof" }
assert(appBar.type == "Row" and appBar.children[1].type == "Text")
assert(string.find(appBar.properties.className, "luastra-sticky-top", 1, true) ~= nil)

local empty = Blocks.EmptyState { id = "proof/empty", title = "Empty", message = "No values" }
assert(empty.type == "Column" and empty.children[1].type == "Icon")

local retry = Blocks.RetryState { id = "proof/retry", title = "Unavailable", message = "Offline", action = "retry" }
assert(retry.children[4].type == "Button")

local item = UI.ListItem { id = "proof/item", UI.Text { id = "proof/item/text", text = "One" } }
local list = Blocks.PagedList { id = "proof/list", label = "Proof values", items = { item }, itemCount = 100000 }
assert(list.type == "List" and list.properties.mode == "windowed" and list.properties.itemCount == 100000)

local navigation = Blocks.BottomNavigation {
    id = "proof/navigation",
    label = "Proof navigation",
    items = {
        { id = "home", text = "Home", action = "home", icon = "home", selected = true },
        { id = "settings", text = "Settings", action = "settings", icon = "settings" },
    },
}
assert(navigation.type == "Row" and navigation.children[1].properties.selected == true)
assert(string.find(navigation.properties.className, "luastra-sticky-bottom", 1, true) ~= nil)

return true
