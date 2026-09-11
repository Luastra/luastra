--!strict

local application = require("app/main")
local UI = require("luastra/ui")

local function byId(node: any, id: string): any
    if node.id == id then return node end
    for _, child in node.children do
        local matched = byId(child, id)
        if matched ~= nil then return matched end
    end
    return nil
end

local function hasClass(node: any, className: string): boolean
    return string.find(" " .. node.properties.className .. " ", " " .. className .. " ", 1, true) ~= nil
end

local initial = application.render()
assert(initial.type == "Screen")
assert(hasClass(byId(initial, "orbit"), "luastra-orbit"))
assert(hasClass(byId(initial, "orbit/search"), "luastra-orbit-search"))
assert(hasClass(byId(initial, "orbit/root"), "luastra-constellation-state-active"))
assert(byId(initial, "orbit/build") == nil)
assert(byId(initial, "orbit/examples") == nil)
assert(hasClass(byId(initial, "orbit/example-galaxy"), "luastra-orbit-cluster"))
assert(byId(initial, "orbit/example-galaxy/count").properties.text == "48 items")
assert(byId(initial, "orbit/explore").properties.orbitRelatedTo == "orbit/learn,orbit/example-galaxy")
assert(byId(initial, "orbit/ship").properties.orbitSignalIcon == "rocket")
assert(byId(initial, "orbit/ship/status").properties.text == "Blocked")
assert(hasClass(byId(initial, "orbit/ship"), "luastra-orbit-status-error"))
local validCluster = UI.OrbitCluster { id = "test/cluster", title = "Examples", count = 48, onTap = "open-cluster" }
assert(hasClass(validCluster, "luastra-orbit-kind-cluster"))
assert(byId(validCluster, "test/cluster/count").properties.text == "48 items")
local invalidCluster = pcall(function()
    UI.OrbitCluster { id = "test/invalid-cluster", title = "Empty", count = 0, onTap = "open-cluster" }
end)
assert(invalidCluster == false)
local invalidRelationship = pcall(function()
    UI.Constellation {
        id = "test/constellation",
        UI.OrbitCenter { id = "test/center", title = "Center" },
        UI.OrbitNode { id = "test/node", title = "Node", relatedTo = { "test/missing" }, onTap = "open-focus" },
    }
end)
assert(invalidRelationship == false)
local invalidSignalIcon = pcall(function()
    UI.OrbitNode { id = "test/invalid-signal", title = "Signal", signalIcon = "letter-s", onTap = "open-focus" }
end)
assert(invalidSignalIcon == false)
local invalidStatusTone = pcall(function()
    UI.OrbitNode { id = "test/invalid-status", title = "Status", status = "Unknown", statusTone = "danger", onTap = "open-focus" }
end)
assert(invalidStatusTone == false)
local orphanStatusTone = pcall(function()
    UI.OrbitCluster { id = "test/orphan-status", title = "Status", count = 2, statusTone = "active", onTap = "open-cluster" }
end)
assert(orphanStatusTone == false)

application.handle("open-constellation", "orbit/explore", "")
local nested = application.render()
assert(hasClass(byId(nested, "orbit/root"), "luastra-constellation-state-behind"))
assert(hasClass(byId(nested, "orbit/build"), "luastra-constellation-state-active"))
assert(byId(nested, "orbit/examples") == nil)
assert(application.snapshot().location == "/orbit/build")

local readyAction = byId(application.render(), "orbit/build/optimize")
assert(hasClass(readyAction, "luastra-orbit-kind-action"))
assert(readyAction.properties.busy == nil)
assert(readyAction.properties.disabled == nil)

application.handle("search-orbit", "orbit/search/input", "motion")
local filtered = application.render()
assert(byId(filtered, "orbit/search/status").properties.text == "1 matching node")
assert(byId(filtered, "orbit/build/motion").properties.hidden == false)
assert(byId(filtered, "orbit/build/interface").properties.hidden == true)
application.handle("search-orbit", "orbit/search/input", "no such node")
local empty = application.render()
assert(byId(empty, "orbit/search/status").properties.text == "No matching nodes. Press Escape to clear.")
assert(hasClass(byId(empty, "orbit/search"), "luastra-orbit-search-empty"))
assert(byId(empty, "orbit/build/interface").properties.hidden == true)
assert(byId(empty, "orbit/build/motion").properties.hidden == true)
application.handle("search-orbit", "orbit/search/input", "")

application.handle("open-focus", "orbit/build/interface", "")
local focused = application.render()
assert(byId(focused, "orbit/focus").properties.open == true)
assert(hasClass(byId(focused, "orbit/build/interface"), "luastra-orbit-selected"))
assert(hasClass(byId(focused, "orbit/focus/header"), "luastra-focus-header"))
assert(byId(focused, "orbit/focus/detail-6/copy") ~= nil)
assert(byId(focused, "orbit/focus/close") ~= nil)
local focusedState = application.snapshot().encodedState
assert(application.snapshot().location == "/orbit/build/interface")

application.handle("close-focus", "orbit/focus/close", "")
assert(byId(application.render(), "orbit/focus").properties.open == false)
assert(application.snapshot().location == "/orbit/build")

application.handle("history", "app", focusedState)
assert(byId(application.render(), "orbit/focus").properties.open == true)
assert(application.snapshot().focusedNode == "orbit/build/interface")
application.handle("close-focus", "orbit/focus/close", "")

application.handle("next-theme", "orbit/path/theme-next", "")
assert(hasClass(byId(application.render(), "orbit"), "luastra-orbit-theme-abyss"))

application.handle("previous-theme", "orbit/path/theme-previous", "")
assert(hasClass(byId(application.render(), "orbit"), "luastra-orbit-theme-luastra"))

for _ = 1, 11 do
    application.handle("next-theme", "orbit/path/theme-next", "")
end
assert(hasClass(byId(application.render(), "orbit"), "luastra-orbit-theme-luastra"))

application.handle("toggle-motion", "orbit/path/motion", "")
assert(hasClass(byId(application.render(), "orbit"), "luastra-orbit-motion-off"))

application.handle("return-root", "orbit/build", "")
assert(hasClass(byId(application.render(), "orbit/root"), "luastra-constellation-state-active"))
assert(hasClass(byId(application.render(), "orbit/build"), "luastra-constellation-state-ahead"))
assert(byId(application.render(), "orbit/examples") == nil)

application.handle("open-cluster", "orbit/example-galaxy", "")
local examples = application.render()
assert(hasClass(byId(examples, "orbit/examples"), "luastra-constellation-state-active"))
assert(byId(examples, "orbit/build") == nil)
assert(byId(examples, "orbit/path/current").properties.text == "Examples")
assert(byId(examples, "orbit/search/status").properties.text == "48 nodes available")
assert(application.snapshot().location == "/orbit/examples")

application.handle("search-orbit", "orbit/search/input", "timer")
local searchedExamples = application.render()
assert(byId(searchedExamples, "orbit/search/status").properties.text == "1 matching node")
assert(byId(searchedExamples, "orbit/examples/productivity-5").properties.hidden == false)
assert(byId(searchedExamples, "orbit/examples/media-1").properties.hidden == true)
application.handle("search-orbit", "orbit/search/input", "")

application.handle("open-focus", "orbit/examples/productivity-5", "")
local exampleFocus = application.render()
assert(byId(exampleFocus, "orbit/focus/title").properties.text == "Focus Timer")
assert(application.snapshot().location == "/orbit/examples/productivity/5")
application.handle("close-focus", "orbit/focus/close", "")
assert(application.snapshot().location == "/orbit/examples")

application.handle("return-root", "orbit/examples", "")
assert(application.snapshot().location == "/orbit")

return true
