--!strict
local UI = require("luastra/ui")

return {
    render = function(): UI.Node
        return UI.Screen { id = "startup", padding = "xl", gap = "lg",
            UI.Column { id = "startup/content", gap = "lg", align = "center",
                UI.Text { id = "startup/title", text = "Luastra", variant = "title", textStyle = { size = 48, weight = 700 } },
                UI.Text { id = "startup/message", text = "Preparing your application…", textStyle = { size = 20 } },
                UI.Link { id = "startup/docs", text = "Read the documentation (opens in a new tab)", href = "https://luastra.dev/docs/", external = true },
            },
        }
    end,
}
