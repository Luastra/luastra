--!strict

local App = require("luastra/app")
local Debug = require("luastra/debug")
local UI = require("luastra/ui")

Debug.log("debug lab", 7, true)
Debug.warn("warning example")
Debug.error("error example")

local Root = {}
local appTheme: UI.Theme = {
    backgroundColor = "#F4EFE3",
    textColor = "#16342E",
    accentColor = "#2F7568",
}

function Root.render(): UI.Node
    return UI.Screen {
        id = "debug-lab",
        theme = appTheme,
        accentColor = "#245C53",
        UI.Text { id = "debug/status", text = "Debug output emitted" },
    }
end

function Root.snapshot()
    return table.freeze({ status = "emitted" })
end

return App.compose {
    render = function(_outputs) return Root.render() end,
    snapshot = Root.snapshot,
}
