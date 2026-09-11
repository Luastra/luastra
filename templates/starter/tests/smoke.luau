--!strict
-- SPDX-License-Identifier: 0BSD

local application = require("app/main")

local initial = application.render()
local title = initial.children[1].children[1]
local button = initial.children[1].children[2]
assert(title.properties.text == "Build apps like games. Interactions: 0", "The app must render its initial counter")
assert(button.id == "continue", "The app must expose its counter button")

application.handle(button.properties.onTap, button.id, "")
local updated = application.render()
assert(updated.children[1].children[1].properties.text == "Build apps like games. Interactions: 1", "The button must increment the app counter")

application.handle("unrelated", button.id, "")
assert(application.render().children[1].children[1].properties.text == "Build apps like games. Interactions: 1", "Unrelated actions must preserve state")

return true
