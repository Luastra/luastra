--!strict
-- SPDX-License-Identifier: 0BSD

local UI = require("luastra/ui")

local interactions = 0
local Application = {}

function Application.render()
    return UI.Screen {
        id = "app",

        UI.Column {
            id = "welcome",

            UI.Text {
                id = "title",
                text = `Build apps like games. Interactions: {interactions}`,
                variant = "title",
            },

            UI.Button {
                id = "continue",
                text = "Continue",
                onTap = "increment",
            },
        },
    }
end

function Application.handle(action: string, target: string, _value: string)
    if action == "increment" and target == "continue" then
        interactions += 1
    end
end

return Application
