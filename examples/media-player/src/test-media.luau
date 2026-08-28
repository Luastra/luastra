--!strict

local Media = require("luastra/media")

local decoded = Media.decodeState("v=1&artist=Luastra&background=false&bufferedMs=500&durationMs=1000&errorCode=&errorMessage=&interruption=none&itemId=sample&positionMs=250&queueCount=1&queueIndex=0&revision=3&route=default&status=playing&title=Sample")
assert(decoded.success and decoded.state.status == "playing" and decoded.state.positionMs == 250)
assert(not Media.decodeState("v=2&status=playing").success)
assert(not Media.decodeState("v=1&status=unknown").success)
local rawUrlAccepted = pcall(function()
    Media.setQueue({ { id = "private", source = "https://example.invalid/private.wav", title = "Private", artist = "Unknown" } }, 1)
end)
assert(not rawUrlAccepted)
local shortGrantAccepted = pcall(function()
    Media.setQueue({ { id = "private", source = "content:short", title = "Private", artist = "Unknown" } }, 1)
end)
assert(not shortGrantAccepted)

return true
