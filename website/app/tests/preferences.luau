--!strict

local requests: {any} = {}
local environment = getfenv() :: any

environment.HostCapability = {
    request = function(kind: string, operation: string, deadlineMs: number, input: string?): number
        table.insert(requests, { kind = kind, operation = operation, deadlineMs = deadlineMs, input = input })
        return #requests
    end,
}

local application = require("app/main")

application.handle("lifecycle", "app", "launch")
assert(#requests == 4)
application.resolve(1, true, "https://luastra.dev/#/", "", "")
application.resolve(2, true, "", "", "")
application.resolve(3, true, "v1:atlas:off", "", "")
application.resolve(4, true, "v1:dark", "", "")

local restored = application.snapshot()
assert(restored.preferencesEstablished == true)
assert(restored.landing.theme == "atlas")
assert(restored.landing.motion == "off")
assert(restored.darkMode == true)

application.handle("landing.open-theme-picker", "landing/path/theme", "")
application.handle("landing.choose-theme", "landing/theme-picker/choice-2", "")
assert(requests[#requests].kind == "storage.set")
assert(requests[#requests].operation == "orbit-preferences")
assert(requests[#requests].input == "v1:abyss:off")

application.handle("landing.toggle-motion", "landing/path/motion", "")
assert(requests[#requests].operation == "orbit-preferences")
assert(requests[#requests].input == "v1:abyss:system")

application.handle("landing.open-reference", "landing/path/docs", "")
application.handle("docs.toggle-theme", "docs/header/theme", "")
assert(requests[#requests].kind == "storage.set")
assert(requests[#requests].operation == "docs-theme")
assert(requests[#requests].input == "v1:light")

return true
