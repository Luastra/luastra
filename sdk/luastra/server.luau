--!strict

export type RequestId = number
export type Options = { deadlineMs: number?, idempotencyKey: string?, retry: boolean? }
export type DecodeSuccess = { success: true, fields: { [string]: string }, error: nil }
export type DecodeFailure = { success: false, fields: nil, error: string }
export type DecodeResult = DecodeSuccess | DecodeFailure

type CapabilityApi = {
    request: (kind: string, operation: string, deadlineMs: number, input: string?) -> number,
}

local environment = getfenv() :: any
local capability = environment.HostCapability :: CapabilityApi
assert(type(capability) == "table" and type(capability.request) == "function", "Luastra host capability API is unavailable")

local maximumBytes = 4096
local maximumFields = 128
local fieldPattern = "^[a-z][a-zA-Z0-9_%.%-]*$"
local operationPattern = "^[a-z][a-z0-9%.]*%.v[1-9][0-9]*$"

local function encodeValue(value: string): string
    return (string.gsub(value, "([^%w%._~-])", function(character: string): string
        return string.format("%%%02X", string.byte(character))
    end))
end

local function decodeValue(value: string): string?
    local output = ""
    local index = 1
    while index <= #value do
        local character = string.sub(value, index, index)
        if character == "%" then
            if index + 2 > #value then return nil end
            local byte = tonumber(string.sub(value, index + 1, index + 2), 16)
            if byte == nil then return nil end
            output ..= string.char(byte)
            index += 3
        else
            output ..= character
            index += 1
        end
    end
    if encodeValue(output) ~= value then return nil end
    return output
end

local function encode(fields: { [string]: string }): string
    local names = {}
    for name, value in pairs(fields) do
        assert(type(name) == "string" and #name <= 128 and string.match(name, fieldPattern) ~= nil, "server wire field is invalid")
        assert(type(value) == "string", "server wire value must be a string")
        table.insert(names, name)
        assert(#names <= maximumFields, "server wire field count exceeded")
    end
    table.sort(names)
    local output = "v=1"
    for _, name in names do output ..= "&" .. name .. "=" .. encodeValue(fields[name]) end
    assert(#output <= maximumBytes, "server wire payload exceeds 4096 bytes")
    return output
end

local Server = {}

function Server.call(operation: string, input: { [string]: string }, options: Options?): RequestId
    assert(type(operation) == "string" and #operation <= 128 and string.match(operation, operationPattern) ~= nil, "server function name is invalid")
    local actual: Options = if options ~= nil then options else ({} :: Options)
    local deadlineMs = actual.deadlineMs or 3000
    assert(type(deadlineMs) == "number" and deadlineMs % 1 == 0 and deadlineMs >= 1 and deadlineMs <= 30000, "server deadline is invalid")
    local fields: { [string]: string } = { ["function"] = operation, retry = actual.retry == true and "true" or "false" }
    local idempotencyKey = actual.idempotencyKey
    if idempotencyKey ~= nil then
        assert(#idempotencyKey >= 8 and #idempotencyKey <= 128 and string.match(idempotencyKey, "^[A-Za-z0-9][A-Za-z0-9_:%-]*$") ~= nil, "idempotency key is invalid")
        fields.idempotency = idempotencyKey
    end
    for name, value in pairs(input) do
        assert(type(name) == "string" and string.match(name, "^[a-z][a-zA-Z0-9_]*$") ~= nil, "server input field is invalid")
        fields["input." .. name] = value
    end
    return capability.request("rpc.call", "server.call.v1", deadlineMs, encode(fields))
end

function Server.decode(value: string): DecodeResult
    if type(value) ~= "string" or #value == 0 or #value > maximumBytes then return { success = false, fields = nil, error = "invalid_size" } end
    local fields: { [string]: string } = {}
    local start = 1
    local count = 0
    while true do
        local separator = string.find(value, "&", start, true)
        local token: string
        if separator == nil then token = string.sub(value, start) else token = string.sub(value, start, separator - 1) end
        if count == 0 then
            if token ~= "v=1" then return { success = false, fields = nil, error = "invalid_version" } end
        else
            local equals = string.find(token, "=", 1, true)
            if equals == nil or equals <= 1 then return { success = false, fields = nil, error = "malformed" } end
            local name = string.sub(token, 1, equals - 1)
            local decoded = decodeValue(string.sub(token, equals + 1))
            if #name > 128 or string.match(name, fieldPattern) == nil or fields[name] ~= nil or decoded == nil then return { success = false, fields = nil, error = "invalid_field" } end
            fields[name] = decoded
            if count > maximumFields then return { success = false, fields = nil, error = "too_many_fields" } end
        end
        count += 1
        if separator == nil then break end
        start = separator + 1
    end
    return { success = true, fields = fields, error = nil }
end

Server.limits = table.freeze({ maximumBytes = maximumBytes, maximumFields = maximumFields })

return table.freeze(Server)
