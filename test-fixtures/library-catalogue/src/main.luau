--!strict

local App = require("luastra/app")
local UI = require("luastra/ui")
local Blocks = require("universal-blocks")

local items: { UI.Node } = {
    UI.ListItem { id = "catalogue/items/notebook", UI.Text { id = "catalogue/items/notebook/title", text = "Notebook" } },
    UI.ListItem { id = "catalogue/items/lamp", UI.Text { id = "catalogue/items/lamp/title", text = "Lamp" } },
}

return App.compose {
    features = {},
    render = function(): UI.Node
        return UI.Screen {
            id = "catalogue",
            documentTitle = "Catalogue",
            Blocks.AppBar { id = "catalogue/bar", title = "Catalogue" },
            UI.Column {
                id = "catalogue/content",
                width = "content",
                padding = "responsive",
                gap = "md",
                Blocks.PagedList {
                    id = "catalogue/items",
                    label = "Products",
                    items = items,
                    itemCount = 100000,
                    onEndReached = "catalogue.next",
                },
                Blocks.EmptyState { id = "catalogue/saved", title = "No saved filters", message = "Saved filters will appear here." },
            },
            Blocks.BottomNavigation {
                id = "catalogue/navigation",
                label = "Catalogue sections",
                items = {
                    { id = "products", text = "Products", action = "catalogue.products", icon = "list", selected = true },
                    { id = "settings", text = "Settings", action = "catalogue.settings", icon = "settings" },
                },
            },
        }
    end,
    snapshot = function() return table.freeze({ fixture = "catalogue" }) end,
}
