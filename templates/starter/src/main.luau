--!strict
-- SPDX-License-Identifier: 0BSD

local App = require("luastra/app")
local UI = require("luastra/ui")

local interactions = 0
return App.compose {
    features = {},
    render = function()
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
    end,
    handle = function(action: string, target: string, _value: string)
        if action == "increment" and target == "continue" then
            interactions += 1
        end
    end,
    snapshot = function()
        return table.freeze({ interactions = interactions })
    end,
}
