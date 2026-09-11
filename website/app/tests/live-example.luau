--!strict
local environment = getfenv() :: any
environment.HostCapability = { request = function(): number return 1 end }
local application = require("app/live-example")
local function find(node: any, id: string): any?
    if node.id == id then return node end
    for _, child in node.children or {} do
        local found = find(child, id)
        if found ~= nil then return found end
    end
    return nil
end
application.handle("example.increment", "live/increment", "")
assert(find(application.render(), "live/increment").properties.text == "Clicks: 1")
application.handle("example.reset", "live/reset", "")
assert(find(application.render(), "live/increment").properties.text == "Clicks: 0")
application.handle("lifecycle", "app", "launch")
application.resolve(1, true, "https://luastra.dev/live-example/#learning", "", "")
assert(find(application.render(), "learn/progress").properties.text == "Step 1 of 5")
application.handle("learn.next", "learn/next", "")
assert(find(application.render(), "learn/progress").properties.text == "Step 2 of 5")
application.handle("learn.back", "learn/back", "")
assert(find(application.render(), "learn/progress").properties.text == "Step 1 of 5")
return true
