--!strict

export type RequestId = number
export type Options = { deadlineMs: number?, idempotencyKey: string?, retry: boolean? }
export type V2Limits = { maximumBytes: number, maximumFields: number }
export type DecodeSuccess = { success: true, fields: { [string]: string }, error: nil }
export type DecodeFailure = { success: false, fields: nil, error: string }
export type DecodeResult = DecodeSuccess | DecodeFailure
export type Nullable<T> = { kind: "null" } | { kind: "value", value: T }
export type Error = { code: string, message: string, fields: { [string]: string }? }

type CapabilityApi = {
    request: (kind: string, operation: string, deadlineMs: number, input: string?) -> number,
}

local environment = getfenv() :: any
local capability = environment.HostCapability :: CapabilityApi
assert(type(capability) == "table" and type(capability.request) == "function", "Luastra host capability API is unavailable")

local maximumBytes = 4096
local maximumFields = 128
local maximumV2Bytes = 4096
local maximumV2Fields = 256
local maximumErrorMessageBytes = 512
local maximumErrorFields = 32
local maximumErrorFieldBytes = 128
local maximumErrorCodeBytes = 64
local fieldPattern = "^[a-z][a-zA-Z0-9_%.%-]*$"
local operationPattern = "^[a-z][a-z0-9%.]*%.v[1-9][0-9]*$"
local errorFieldPattern = "^[%a_][%w_.%[%]-]*$"
local errorCodePattern = "^[A-Z][A-Z0-9_]*$"

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

local function encode(fields: { [string]: string }, version: number, byteLimit: number, fieldLimit: number): string
    local names = {}
    for name, value in pairs(fields) do
        assert(type(name) == "string" and #name <= 128 and string.match(name, fieldPattern) ~= nil, "server wire field is invalid")
        assert(type(value) == "string", "server wire value must be a string")
        table.insert(names, name)
        assert(#names <= fieldLimit, "server wire field count exceeded")
    end
    table.sort(names)
    local output = "v=" .. tostring(version)
    for _, name in names do output ..= "&" .. name .. "=" .. encodeValue(fields[name]) end
    assert(#output <= byteLimit, "server wire payload exceeds configured bytes")
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
    return capability.request("rpc.call", "server.call.v1", deadlineMs, encode(fields, 1, maximumBytes, maximumFields))
end

function Server.callV2(operation: string, inputFields: { [string]: string }, options: Options?, limitsValue: V2Limits?): RequestId
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
    for name, value in pairs(inputFields) do
        assert(type(name) == "string" and string.sub(name, 1, 6) == "input." and string.match(name, fieldPattern) ~= nil, "server v2 input field is invalid")
        assert(type(value) == "string", "server v2 input value must be a string")
        fields[name] = value
    end
    local limits: V2Limits = if limitsValue ~= nil then limitsValue else { maximumBytes = maximumV2Bytes, maximumFields = maximumV2Fields }
    assert(type(limits.maximumBytes) == "number" and limits.maximumBytes % 1 == 0 and limits.maximumBytes >= 1024 and limits.maximumBytes <= maximumV2Bytes, "server v2 byte limit is invalid")
    assert(type(limits.maximumFields) == "number" and limits.maximumFields % 1 == 0 and limits.maximumFields >= 1 and limits.maximumFields <= maximumV2Fields, "server v2 field limit is invalid")
    return capability.request("rpc.call", "server.call.v1", deadlineMs, encode(fields, 2, limits.maximumBytes, limits.maximumFields))
end

local function decode(value: string, version: number, byteLimit: number, fieldLimit: number): DecodeResult
    if type(value) ~= "string" or #value == 0 or #value > byteLimit then return { success = false, fields = nil, error = "invalid_size" } end
    local fields: { [string]: string } = {}
    local start = 1
    local count = 0
    while true do
        local separator = string.find(value, "&", start, true)
        local token: string
        if separator == nil then token = string.sub(value, start) else token = string.sub(value, start, separator - 1) end
        if count == 0 then
            if token ~= "v=" .. tostring(version) then return { success = false, fields = nil, error = "invalid_version" } end
        else
            local equals = string.find(token, "=", 1, true)
            if equals == nil or equals <= 1 then return { success = false, fields = nil, error = "malformed" } end
            local name = string.sub(token, 1, equals - 1)
            local decoded = decodeValue(string.sub(token, equals + 1))
            if #name > 128 or string.match(name, fieldPattern) == nil or fields[name] ~= nil or decoded == nil then return { success = false, fields = nil, error = "invalid_field" } end
            fields[name] = decoded
            if count > fieldLimit then return { success = false, fields = nil, error = "too_many_fields" } end
        end
        count += 1
        if separator == nil then break end
        start = separator + 1
    end
    return { success = true, fields = fields, error = nil }
end

function Server.decode(value: string): DecodeResult
    return decode(value, 1, maximumBytes, maximumFields)
end

function Server.decodeV2(value: string): DecodeResult
    return decode(value, 2, maximumV2Bytes, maximumV2Fields)
end

function Server.decodeError(code: string, message: string): Error?
    if type(code) ~= "string" or #code < 1 or #code > maximumErrorCodeBytes or string.match(code, errorCodePattern) == nil then return nil end
    if type(message) ~= "string" or #message < 1 or #message > maximumErrorMessageBytes then return nil end
    if string.sub(message, 1, 17) ~= "v=1&error=fields&" then
        return table.freeze({ code = code, message = message, fields = nil }) :: Error
    end
    if code ~= "VALIDATION" then return nil end
    local decoded = decode(message, 1, maximumErrorMessageBytes, 3 + maximumErrorFields * 2)
    if not decoded.success then return nil end
    local wire = decoded.fields
    if wire.error ~= "fields" or type(wire.message) ~= "string" or #wire.message < 1 then return nil end
    local lengthSource = wire["field.length"]
    if type(lengthSource) ~= "string" or string.match(lengthSource, "^[1-9][0-9]*$") == nil then return nil end
    local length = tonumber(lengthSource)
    if length == nil or length < 1 or length > maximumErrorFields then return nil end
    local fields: { [string]: string } = {}
    local expected = 3 + length * 2
    local count = 0
    for _name in pairs(wire) do count += 1 end
    if count ~= expected then return nil end
    for index = 1, length do
        local name = wire["field." .. tostring(index) .. ".name"]
        local fieldCode = wire["field." .. tostring(index) .. ".code"]
        if type(name) ~= "string" or #name < 1 or #name > maximumErrorFieldBytes or string.match(name, errorFieldPattern) == nil or fields[name] ~= nil then return nil end
        if type(fieldCode) ~= "string" or #fieldCode < 1 or #fieldCode > maximumErrorCodeBytes or string.match(fieldCode, errorCodePattern) == nil then return nil end
        fields[name] = fieldCode
    end
    table.freeze(fields)
    return table.freeze({ code = code, message = wire.message, fields = fields }) :: Error
end

function Server.nullValue(): { kind: "null" }
    local result: { kind: "null" } = { kind = "null" }
    return table.freeze(result) :: any
end

function Server.value<T>(value: T): Nullable<T>
    assert(value ~= nil, "nullable value cannot wrap nil")
    return table.freeze({ kind = "value", value = value }) :: Nullable<T>
end

Server.limits = table.freeze({
    maximumBytes = maximumBytes,
    maximumFields = maximumFields,
    maximumV2Bytes = maximumV2Bytes,
    maximumV2Fields = maximumV2Fields,
    maximumErrorMessageBytes = maximumErrorMessageBytes,
    maximumErrorFields = maximumErrorFields,
    maximumErrorFieldBytes = maximumErrorFieldBytes,
    maximumErrorCodeBytes = maximumErrorCodeBytes,
})

return table.freeze(Server)
