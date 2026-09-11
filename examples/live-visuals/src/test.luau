--!strict

local application = require("app/main")

local initial = application.snapshot()
assert(initial.revealed == false)
assert(initial.hasFlipped == false)

local tree = application.render()
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

application.handle("flip-card", "live-visuals/flip", "")
local revealed = application.snapshot()
assert(revealed.revealed == true)
assert(revealed.hasFlipped == true)

application.handle("flip-card", "live-visuals/flip", "")
assert(application.snapshot().revealed == false)

return true
