--!strict
local App = require("luastra/app")
local UI = require("luastra/ui")
local Host = require("luastra/host")
local Examples = require("app/examples")
local counter, step = 0, 1
local learning = false
local launchRequest: number? = nil
local Root = {}

function Root.render(): UI.Node
    return UI.Screen {
        id = "example/root", padding = "none", gap = "none",
        if learning then Examples.renderLearning(step) else Examples.render(counter),
    }
end

function Root.handle(action: string, target: string, value: string)
    if action == "lifecycle" and target == "app" and value == "launch" then
        launchRequest = Host.launchUrl()
    elseif action == "example.increment" and target == "live/increment" then counter += 1
    elseif action == "example.reset" and target == "live/reset" then counter = 0
    elseif action == "learn.next" and target == "learn/next" then step = math.min(step + 1, Examples.learningStepCount())
    elseif action == "learn.back" and target == "learn/back" then step = math.max(step - 1, 1)
    elseif action == "learn.reset" and target == "learn/reset" then step = 1 end
end

function Root.resolve(requestId: number, success: boolean, payload: string, _code: string, _message: string)
    if requestId == launchRequest and success then learning = string.match(payload, "#learning$") ~= nil end
end

function Root.snapshot()
    return table.freeze({ counter = counter, step = step, learning = learning })
end

return App.compose {
    render = function(_outputs) return Root.render() end,
    handle = Root.handle,
    resolve = Root.resolve,
    snapshot = Root.snapshot,
}
