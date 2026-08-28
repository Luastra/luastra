--!strict
-- SPDX-License-Identifier: 0BSD

local UI = require("luastra/ui")

local node = UI.Text {
    id = "test/message",
    text = "Luastra test",
}

assert(node.type == "Text", "UI.Text must create a Text node")
assert(node.id == "test/message", "UI.Text must preserve the semantic ID")
assert(node.properties.text == "Luastra test", "UI.Text must preserve text")

local grid = UI.Grid {
    id = "test/grid",
    gap = "md",
    columns = "adaptive",
    responsive = true,
}
assert(grid.type == "Row", "UI.Grid must lower to an admitted semantic Row")
assert(string.find(grid.properties.className, "luastra-grid", 1, true) ~= nil, "UI.Grid must include its host-neutral class")
assert(string.find(grid.properties.className, "luastra-responsive", 1, true) ~= nil, "responsive option must lower to a class")

return true
