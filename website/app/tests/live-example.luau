--!strict
local environment = getfenv() :: any
environment.HostCapability = { request = function(): number return 1 end }
local Application = require("app/live-example")
local function find(node: any, id: string): any?
    if node.id == id then return node end
    for _, child in node.children or {} do
        local found = find(child, id)
        if found ~= nil then return found end
    end
    return nil
end
Application.handle("example.increment", "live/increment", "")
assert(find(Application.render(), "live/increment").properties.text == "Clicks: 1")
Application.handle("example.reset", "live/reset", "")
assert(find(Application.render(), "live/increment").properties.text == "Clicks: 0")
Application.handle("lifecycle", "app", "launch")
Application.resolve(1, true, "https://luastra.dev/live-example/#learning", "", "")
assert(find(Application.render(), "learn/progress").properties.text == "Step 1 of 5")
Application.handle("learn.next", "learn/next", "")
assert(find(Application.render(), "learn/progress").properties.text == "Step 2 of 5")
Application.handle("learn.back", "learn/back", "")
assert(find(Application.render(), "learn/progress").properties.text == "Step 1 of 5")
return true
