--!strict
local App = require("luastra/app")
local UI = require("luastra/ui")
local clicks = 0
return App.compose {
    render = function(_outputs): UI.Node
        return UI.Screen { id = "app", padding = "xl", gap = "lg",
            UI.Text { id = "app/title", text = "Your application is ready", variant = "title" },
            UI.Button { id = "app/counter", text = "Clicks: " .. tostring(clicks), onTap = "increment" },
        }
    end,
    handle = function(action: string, _target: string, _value: string)
        if action == "increment" then clicks += 1 end
    end,
    snapshot = function()
        return { clicks = clicks }
    end,
}
