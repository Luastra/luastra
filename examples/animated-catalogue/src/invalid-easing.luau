--!strict

local Motion = require("luastra/motion")

return Motion.tween {
    from = 0,
    to = 1,
    durationMs = 200,
    easing = "bounce",
}
