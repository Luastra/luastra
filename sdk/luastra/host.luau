--!strict

export type RequestId = number

type CapabilityApi = {
    request: (kind: string, operation: string, deadlineMs: number, input: string?) -> number,
}

local environment = getfenv() :: any
local capability = environment.HostCapability :: CapabilityApi
assert(type(capability) == "table" and type(capability.request) == "function", "Luastra host capability API is unavailable")

local keyPattern = "^[a-z][a-z0-9._-]*$"
local maximumValueBytes = 4096
local maximumLocationBytes = 1024
local deadlineMs = 1000

local function key(value: string): string
    assert(#value >= 1 and #value <= 128 and string.match(value, keyPattern) ~= nil, "storage key is invalid")
    return value
end

local Host = {}

function Host.storageGet(name: string): RequestId
    return capability.request("storage.get", key(name), deadlineMs, "")
end

function Host.storageSet(name: string, value: string): RequestId
    assert(type(value) == "string" and #value <= maximumValueBytes, "storage value exceeds 4096 bytes")
    return capability.request("storage.set", key(name), deadlineMs, value)
end

function Host.launchUrl(): RequestId
    return capability.request("app.launchurl.get", "launch-url", deadlineMs, "")
end

function Host.clipboardWrite(value: string): RequestId
    assert(type(value) == "string" and #value <= maximumValueBytes, "clipboard text exceeds 4096 bytes")
    return capability.request("clipboard.write", "write-text", deadlineMs, value)
end

local function historyToken(value: string): string
    assert(type(value) == "string" and #value >= 1 and #value <= maximumValueBytes, "history state token must contain 1 to 4096 bytes")
    return value
end

local function locationFragment(value: string): string
    assert(type(value) == "string" and #value >= 3 and #value <= maximumLocationBytes, "history location must contain 3 to 1024 bytes")
    assert(string.sub(value, 1, 2) == "#/" and string.match(string.sub(value, 3), "^[A-Za-z0-9%%._~!$&'()*+,;=:@/?%-]+$") ~= nil, "history location must be an admitted fragment route")
    return value
end

local function locationPayload(location: string, stateToken: string): string
    local admittedLocation = locationFragment(location)
    local admittedToken = historyToken(stateToken)
    local payload = tostring(#admittedLocation) .. ":" .. admittedLocation .. admittedToken
    assert(#payload <= maximumValueBytes, "history location payload exceeds 4096 bytes")
    return payload
end

local function systemBackIntent(value: number): string
    assert(type(value) == "number" and value >= 1 and value % 1 == 0, "system Back intent ID must be a positive integer")
    return tostring(value)
end

function Host.historyPush(stateToken: string): RequestId
    return capability.request("navigation.history", "push", deadlineMs, historyToken(stateToken))
end

function Host.historyReplace(stateToken: string): RequestId
    return capability.request("navigation.history", "replace", deadlineMs, historyToken(stateToken))
end

function Host.historyPushLocation(location: string, stateToken: string): RequestId
    return capability.request("navigation.history", "push-location", deadlineMs, locationPayload(location, stateToken))
end

function Host.historyReplaceLocation(location: string, stateToken: string): RequestId
    return capability.request("navigation.history", "replace-location", deadlineMs, locationPayload(location, stateToken))
end

function Host.historyBack(): RequestId
    return capability.request("navigation.history", "back", deadlineMs, "")
end

function Host.historyCurrent(): RequestId
    return capability.request("navigation.history", "current", deadlineMs, "")
end

function Host.systemBackHandled(intentId: number): RequestId
    return capability.request("navigation.history", "system-handled", deadlineMs, systemBackIntent(intentId))
end

function Host.systemBackHistory(intentId: number): RequestId
    return capability.request("navigation.history", "system-history", deadlineMs, systemBackIntent(intentId))
end

function Host.systemBackExit(intentId: number): RequestId
    return capability.request("navigation.history", "system-exit", deadlineMs, systemBackIntent(intentId))
end

Host.limits = table.freeze({ maximumValueBytes = maximumValueBytes, maximumLocationBytes = maximumLocationBytes, deadlineMs = deadlineMs })

return table.freeze(Host)
