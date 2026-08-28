--!strict

export type RequestId = number
export type QueueItem = { id: string, source: string, title: string, artist: string }
export type MediaError = { code: string, message: string }
export type State = {
    revision: number, status: string, itemId: string, title: string, artist: string,
    positionMs: number, durationMs: number, bufferedMs: number, queueIndex: number, queueCount: number,
    background: boolean, interruption: string, route: string, error: MediaError?,
}
export type DecodeSuccess = { success: true, state: State, error: nil }
export type DecodeFailure = { success: false, state: nil, error: string }
export type DecodeResult = DecodeSuccess | DecodeFailure

type CapabilityApi = { request: (kind: string, operation: string, deadlineMs: number, input: string?) -> number }
local environment = getfenv() :: any
local capability = environment.HostCapability :: CapabilityApi
assert(type(capability) == "table" and type(capability.request) == "function", "Luastra host capability API is unavailable")

local maximumBytes = 4096
local maximumQueueItems = 32
local deadlineMs = 3000
local fieldPattern = "^[a-z][a-zA-Z0-9_%.%-]*$"
local statuses = { idle = true, loading = true, ready = true, playing = true, paused = true, buffering = true, ended = true, error = true }

local function encodeValue(value: string): string
    return (string.gsub(value, "([^%w%._~-])", function(character: string): string return string.format("%%%02X", string.byte(character)) end))
end

local function encode(fields: { [string]: string }): string
    local names = {}
    for name, value in pairs(fields) do
        assert(type(name) == "string" and #name <= 128 and string.match(name, fieldPattern) ~= nil, "media field is invalid")
        assert(type(value) == "string", "media value must be a string")
        table.insert(names, name)
        assert(#names <= 128, "media field count exceeded")
    end
    table.sort(names)
    local output = "v=1"
    for _, name in names do output ..= "&" .. name .. "=" .. encodeValue(fields[name]) end
    assert(#output <= maximumBytes, "media payload exceeds 4096 bytes")
    return output
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
        else output ..= character index += 1 end
    end
    if encodeValue(output) ~= value then return nil end
    return output
end

local function decodeFields(value: string): { [string]: string }?
    if type(value) ~= "string" or #value == 0 or #value > maximumBytes then return nil end
    local fields: { [string]: string } = {}
    local start = 1
    local count = 0
    while true do
        local separator = string.find(value, "&", start, true)
        local token = if separator == nil then string.sub(value, start) else string.sub(value, start, separator - 1)
        if count == 0 then if token ~= "v=1" then return nil end else
            local equals = string.find(token, "=", 1, true)
            if equals == nil or equals <= 1 then return nil end
            local name = string.sub(token, 1, equals - 1)
            local decoded = decodeValue(string.sub(token, equals + 1))
            if string.match(name, fieldPattern) == nil or fields[name] ~= nil or decoded == nil then return nil end
            fields[name] = decoded
            if count > 128 then return nil end
        end
        count += 1
        if separator == nil then break end
        start = separator + 1
    end
    return fields
end

local function whole(value: string?, minimum: number, maximum: number): number?
    if value == nil or string.match(value, "^-?[0-9]+$") == nil then return nil end
    local parsed = tonumber(value)
    if parsed == nil or parsed % 1 ~= 0 or parsed < minimum or parsed > maximum then return nil end
    return parsed
end

local function command(name: string, fields: { [string]: string }): RequestId
    return capability.request("media.command", name, deadlineMs, encode(fields))
end

local function validSource(source: string): boolean
    if #source >= 7 and #source <= 1024 and string.match(source, "^asset:[a-z][a-z0-9_/%-]*$") ~= nil then
        return string.sub(source, -1) ~= "/" and string.find(source, "//", 1, true) == nil
    end
    if string.sub(source, 1, 8) ~= "content:" then return false end
    local token = string.sub(source, 9)
    return #token >= 32 and #token <= 256 and string.match(token, "^[A-Za-z0-9_%-]+$") ~= nil
end

local Media = {}

function Media.setQueue(items: { QueueItem }, selectedIndex: number?): RequestId
    assert(#items >= 1 and #items <= maximumQueueItems, "media queue must contain 1 to 32 items")
    local index = selectedIndex or 1
    assert(index % 1 == 0 and index >= 1 and index <= #items, "media queue index is invalid")
    local fields: { [string]: string } = { count = tostring(#items), index = tostring(index - 1) }
    for position, item in items do
        assert(type(item.id) == "string" and #item.id >= 1 and #item.id <= 128, "media item id is invalid")
        assert(type(item.source) == "string" and validSource(item.source), "media source must be an admitted asset or scoped content grant")
        assert(type(item.title) == "string" and #item.title >= 1 and #item.title <= 256, "media title is invalid")
        assert(type(item.artist) == "string" and #item.artist >= 1 and #item.artist <= 256, "media artist is invalid")
        local prefix = "item." .. tostring(position - 1) .. "."
        fields[prefix .. "id"] = item.id fields[prefix .. "source"] = item.source
        fields[prefix .. "title"] = item.title fields[prefix .. "artist"] = item.artist
    end
    return command("queue.set", fields)
end

function Media.play(): RequestId return command("play", {}) end
function Media.pause(): RequestId return command("pause", {}) end
function Media.stop(): RequestId return command("stop", {}) end
function Media.unload(): RequestId return command("unload", {}) end
function Media.next(): RequestId return command("queue.next", {}) end
function Media.previous(): RequestId return command("queue.previous", {}) end
function Media.state(): RequestId return command("state", {}) end
function Media.seek(positionMs: number): RequestId
    assert(positionMs % 1 == 0 and positionMs >= 0 and positionMs <= 86400000, "media seek position is invalid")
    return command("seek", { positionMs = tostring(positionMs) })
end

function Media.decodeState(payload: string): DecodeResult
    local fields = decodeFields(payload)
    if fields == nil then return { success = false, state = nil, error = "invalid_wire" } end
    local required = { "revision", "status", "itemId", "title", "artist", "positionMs", "durationMs", "bufferedMs", "queueIndex", "queueCount", "background", "interruption", "route", "errorCode", "errorMessage" }
    for _, name in required do if fields[name] == nil then return { success = false, state = nil, error = "missing_field" } end end
    local count = 0 for _ in pairs(fields) do count += 1 end
    if count ~= #required or statuses[fields.status] ~= true or (fields.background ~= "true" and fields.background ~= "false") then return { success = false, state = nil, error = "invalid_state" } end
    local revision = whole(fields.revision, 0, 2147483647)
    local position = whole(fields.positionMs, 0, 86400000)
    local duration = whole(fields.durationMs, 0, 86400000)
    local buffered = whole(fields.bufferedMs, 0, 86400000)
    local queueIndex = whole(fields.queueIndex, -1, 31)
    local queueCount = whole(fields.queueCount, 0, 32)
    if revision == nil or position == nil or duration == nil or buffered == nil or queueIndex == nil or queueCount == nil then return { success = false, state = nil, error = "invalid_number" } end
    local mediaError: MediaError? = nil
    if fields.errorCode ~= "" then
        if fields.errorMessage == "" then return { success = false, state = nil, error = "invalid_error" } end
        mediaError = ({ code = fields.errorCode, message = fields.errorMessage } :: MediaError)
    elseif fields.errorMessage ~= "" then return { success = false, state = nil, error = "invalid_error" } end
    return { success = true, state = {
        revision = revision, status = fields.status, itemId = fields.itemId, title = fields.title, artist = fields.artist,
        positionMs = position, durationMs = duration, bufferedMs = buffered, queueIndex = queueIndex, queueCount = queueCount,
        background = fields.background == "true", interruption = fields.interruption, route = fields.route, error = mediaError,
    }, error = nil }
end

Media.limits = table.freeze({ maximumBytes = maximumBytes, maximumQueueItems = maximumQueueItems, deadlineMs = deadlineMs })
return table.freeze(Media)
