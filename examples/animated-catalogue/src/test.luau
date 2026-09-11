--!strict

local catalogue = require("app/main")
local snapshot = catalogue.snapshot()

assert(#snapshot.cards == 2, "catalogue fixture must expose two cards")
assert(snapshot.cards[1].id == "catalogue/breathe", "first catalogue card must remain stable")
assert(snapshot.cards[2].entrance.translateY.kind == "tween", "catalogue entrance must use public Motion descriptors")
local tree = catalogue.render()
assert(tree.type == "Screen", "catalogue must render a semantic Screen")
assert(string.find(tree.properties.className, "luastra-width-wide", 1, true) ~= nil, "catalogue must use the responsive width contract")

return true
