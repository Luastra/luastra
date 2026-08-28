--!strict

local Application = require("app/main")

local initial = Application.snapshot()
assert(initial.revealed == false)
assert(initial.hasFlipped == false)

local tree = Application.render()
assert(tree.type == "Screen")
assert(tree.properties.backgroundColor == "#F4EFE3")
assert(tree.properties.textColor == "#16342E")
assert(tree.properties.accentColor == "#2F7568")
local content = tree.children[1]
local intro = content.children[1]
local title = intro.children[1]
assert(string.find(title.properties.className, "luastra-text-align-center", 1, true) ~= nil)
assert(title.properties.textColor == "accent")
assert(title.properties.backgroundColor == "surface")

Application.handle("flip-card", "live-visuals/flip", "")
local revealed = Application.snapshot()
assert(revealed.revealed == true)
assert(revealed.hasFlipped == true)

Application.handle("flip-card", "live-visuals/flip", "")
assert(Application.snapshot().revealed == false)

return true
