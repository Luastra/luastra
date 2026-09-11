--!strict

local Resource = require("luastra/resource")

local state: Resource.ReadState<string> = Resource.new {
    isEmpty = function(value: string): boolean return value == "" end,
}
local ticket = state.begin(1, "load")
state.resolve(ticket, 42)

return {}
