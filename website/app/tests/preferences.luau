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

Application.handle("lifecycle", "app", "launch")
assert(#requests == 4)
Application.resolve(1, true, "https://luastra.dev/#/", "", "")
Application.resolve(2, true, "", "", "")
Application.resolve(3, true, "v1:atlas:off", "", "")
Application.resolve(4, true, "v1:dark", "", "")

local restored = Application.snapshot()
assert(restored.preferencesEstablished == true)
assert(restored.landing.theme == "atlas")
assert(restored.landing.motion == "off")
assert(restored.darkMode == true)

Application.handle("landing.open-theme-picker", "landing/path/theme", "")
Application.handle("landing.choose-theme", "landing/theme-picker/choice-2", "")
assert(requests[#requests].kind == "storage.set")
assert(requests[#requests].operation == "orbit-preferences")
assert(requests[#requests].input == "v1:abyss:off")

Application.handle("landing.toggle-motion", "landing/path/motion", "")
assert(requests[#requests].operation == "orbit-preferences")
assert(requests[#requests].input == "v1:abyss:system")

Application.handle("landing.open-reference", "landing/path/docs", "")
Application.handle("docs.toggle-theme", "docs/header/theme", "")
assert(requests[#requests].kind == "storage.set")
assert(requests[#requests].operation == "docs-theme")
assert(requests[#requests].input == "v1:light")

return true
