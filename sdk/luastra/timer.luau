--!strict

export type RequestId = number
export type StartOptions = {
    id: string,
    delayMs: number,
    value: string?,
}

type CapabilityApi = {
    request: (kind: string, operation: string, deadlineMs: number, input: string?) -> number,
}

local environment = getfenv() :: any
local capability = environment.HostCapability :: CapabilityApi
assert(type(capability) == "table" and type(capability.request) == "function", "Luastra timer capability is unavailable")

local maximumDelayMs = 60000
local maximumValueBytes = 4096
local requestDeadlineMs = 1000

local function timerId(value: any): string
    assert(type(value) == "string" and #value >= 1 and #value <= 128, "Timer id must contain 1 to 128 bytes")
    assert(string.sub(value, 1, 1) ~= "/" and string.sub(value, -1) ~= "/" and string.find(value, "//", 1, true) == nil, "Timer id must use lowercase path segments")
    for segment in string.gmatch(value, "[^/]+") do
        assert(string.match(segment, "^[a-z][a-z0-9_-]*$") ~= nil, "Timer id must use lowercase path segments")
    end
    return value
end

local function start(options: StartOptions): RequestId
    assert(type(options) == "table", "Timer.start requires a table")
    local id = timerId(options.id)
    local delayMs = options.delayMs
    local value = options.value or ""
    assert(type(delayMs) == "number" and delayMs == delayMs and math.abs(delayMs) ~= math.huge and delayMs % 1 == 0 and delayMs >= 0 and delayMs <= maximumDelayMs, "Timer delayMs must be an integer from 0 to 60000")
    assert(type(value) == "string" and #value <= maximumValueBytes, "Timer value exceeds 4096 bytes")
    return capability.request("timer.control", id, requestDeadlineMs, "start:" .. tostring(delayMs) .. ":" .. value)
end

local Timer = {}

function Timer.start(options: StartOptions): RequestId
    return start(options)
end

function Timer.restart(options: StartOptions): RequestId
    return start(options)
end

function Timer.cancel(id: string): RequestId
    return capability.request("timer.control", timerId(id), requestDeadlineMs, "cancel")
end

Timer.limits = table.freeze({ maximumDelayMs = maximumDelayMs, maximumValueBytes = maximumValueBytes })

return table.freeze(Timer)
