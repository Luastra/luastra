--!strict

local requests: {any} = {}
local environment = getfenv() :: any

environment.HostCapability = {
    request = function(kind: string, operation: string, deadlineMs: number, input: string?): number
        table.insert(requests, { kind = kind, operation = operation, deadlineMs = deadlineMs, input = input })
        return #requests
    end,
}

local Application = require("app/main")

local function findNode(node: any, id: string): any?
    if node.id == id then return node end
    for _, child in node.children or {} do
        local found = findNode(child, id)
        if found ~= nil then return found end
    end
    return nil
end

Application.handle("lifecycle", "app", "launch")
assert(#requests == 2)
assert(requests[1].kind == "app.launchurl.get")
assert(requests[2].kind == "navigation.history" and requests[2].operation == "current")
Application.resolve(1, true, "https://luastra.dev/#/product/quickstart", "", "")
Application.resolve(2, true, "", "", "")
assert(Application.snapshot().historyEstablished == true)
assert(Application.snapshot().location == "/product/quickstart")
assert((findNode(Application.render(), "landing/focus/title").properties :: any).text == "Quick start")
assert(requests[3].kind == "navigation.history" and requests[3].operation == "replace-location")

Application.handle("landing.close-focus", "landing/focus/close", "")
assert(Application.snapshot().location == "/product")
assert(requests[4].kind == "navigation.history" and requests[4].operation == "replace-location")
Application.handle("open_url", "app", "https://luastra.dev/#/product/quickstart")
assert(Application.snapshot().location == "/product/quickstart")
assert(requests[5].kind == "navigation.history" and requests[5].operation == "push-location")

Application.handle("landing.open-focus-docs", "landing/focus/docs", "")
assert(Application.snapshot().location == "/docs/quickstart")
assert(requests[6].kind == "navigation.history" and requests[6].operation == "push-location")
local docsState = Application.snapshot().encodedState

Application.handle("open_url", "browser", "https://luastra.dev/#/docs/overview")
assert(Application.snapshot().location == "/docs/overview")
assert(requests[7].kind == "navigation.history" and requests[7].operation == "replace-location")

Application.handle("history", "app", docsState)
assert(Application.snapshot().location == "/docs/quickstart")

Application.handle("open_url", "browser", "https://luastra.dev/#docs/content")
assert(Application.snapshot().location == "/docs/overview")

Application.handle("open_url", "browser", "https://luastra.dev/#/reference/not-a-page")
assert(Application.snapshot().location == "/docs/overview")

return true
