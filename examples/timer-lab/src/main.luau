--!strict

local Timer = require("luastra/timer")
local UI = require("luastra/ui")

local Application = {}
local elapsed = 0
local lastValue = "waiting"

function Application.render(): UI.Node
    return UI.Screen {
        id = "timer-lab",
        UI.Text { id = "timer/status", text = `{elapsed}:{lastValue}` },
        UI.Button { id = "timer/start", text = "Start", onTap = "start-timer" },
    }
end

function Application.handle(action: string, target: string, value: string)
    if action == "start-timer" and target == "timer/start" then
        Timer.start { id = "timer/next-card", delayMs = 25, value = "next" }
    elseif action == "timer" and target == "timer/next-card" then
        elapsed += 1
        lastValue = value
    end
end

return Application
