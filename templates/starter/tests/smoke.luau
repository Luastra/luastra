--!strict
-- SPDX-License-Identifier: 0BSD

local Application = require("app/main")

local initial = Application.render()
local title = initial.children[1].children[1]
local button = initial.children[1].children[2]
assert(title.properties.text == "Build apps like games. Interactions: 0", "The app must render its initial counter")
assert(button.id == "continue", "The app must expose its counter button")

Application.handle(button.properties.onTap, button.id, "")
local updated = Application.render()
assert(updated.children[1].children[1].properties.text == "Build apps like games. Interactions: 1", "The button must increment the app counter")

Application.handle("unrelated", button.id, "")
assert(Application.render().children[1].children[1].properties.text == "Build apps like games. Interactions: 1", "Unrelated actions must preserve state")

return true
