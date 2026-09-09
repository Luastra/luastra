--!strict
local App = require("app/main")
local UI = require("luastra/ui")
local Assets = require("luastra/assets")
local first = App.render().children[1].properties.className
assert(string.find(first, "luastra-type-font-", 1, true) ~= nil)
App.handle("font.toggle", "font", "")
assert(string.find(App.render().children[1].properties.className, "luastra-type-font-", 1, true) == nil)
App.handle("size.toggle", "size", "")
assert(string.find(App.render().children[1].properties.className, "luastra-type-size-48", 1, true) ~= nil)
assert(not pcall(function() UI.Text { id = "invalid", textStyle = { size = 0 } } end))
assert(not pcall(function() UI.Text { id = "invalid", textStyle = { font = (Assets.image("image/logo") :: any) } } end))
assert(not pcall(function() UI.Text { id = "invalid", textStyle = { lineHeight = 1.234 } } end))
return true
