--!strict

export type ImageMetadata = {
    mediaType: "image/avif" | "image/jpeg" | "image/png" | "image/webp",
    bytes: number,
    width: number,
    height: number,
    orientation: ("normal" | "rotate90" | "rotate180" | "rotate270")?,
    placeholderColor: string?,
}

export type Image = {
    kind: "image",
    uri: string,
    metadata: ImageMetadata,
}
export type PickOptions = { maximumBytes: number?, maximumWidth: number?, maximumHeight: number? }
export type PickSelected = { status: "selected", image: Image }
export type PickCancelled = { status: "cancelled", image: nil }
export type PickResult = PickSelected | PickCancelled
export type UploadProgress = { requestId: number, loaded: number, total: number }
export type UploadResult = { status: "uploaded", bytes: number }

type CapabilityApi = { request: (kind: string, operation: string, deadlineMs: number, input: string?) -> number }

local Content = {}
local mediaTypes: { [string]: boolean } = {
    ["image/avif"] = true,
    ["image/jpeg"] = true,
    ["image/png"] = true,
    ["image/webp"] = true,
}
local orientations: { [string]: boolean } = {
    normal = true,
    rotate90 = true,
    rotate180 = true,
    rotate270 = true,
}
local maximumWireBytes = 4096
local selectionDeadlineMs = 5 * 60 * 1000
local uploadDeadlineMs = 15 * 60 * 1000
local fieldPattern = "^[a-z][a-zA-Z0-9_%.%-]*$"

local function hostCapability(): CapabilityApi
    local value = (getfenv() :: any).HostCapability
    assert(type(value) == "table" and type(value.request) == "function", "Luastra host capability API is unavailable")
    return value :: CapabilityApi
end

local function encodeValue(value: string): string
    return (string.gsub(value, "([^%w%._~-])", function(character: string): string return string.format("%%%02X", string.byte(character)) end))
end

local function encode(fields: { [string]: string }): string
    local names = {}
    for name, value in pairs(fields) do
        assert(type(name) == "string" and string.match(name, fieldPattern) ~= nil and type(value) == "string", "content field is invalid")
        table.insert(names, name)
        assert(#names <= 16, "content field count exceeded")
    end
    table.sort(names)
    local output = "v=1"
    for _, name in names do output ..= "&" .. name .. "=" .. encodeValue(fields[name]) end
    assert(#output <= maximumWireBytes, "content payload exceeds 4096 bytes")
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
            output ..= string.char(byte) index += 3
        else output ..= character index += 1 end
    end
    if encodeValue(output) ~= value then return nil end
    return output
end

local function decode(value: string): { [string]: string }?
    if type(value) ~= "string" or #value == 0 or #value > maximumWireBytes then return nil end
    local fields: { [string]: string } = {}
    local count = 0
    for token in string.gmatch(value .. "&", "(.-)&") do
        if count == 0 then if token ~= "v=1" then return nil end else
            local separator = string.find(token, "=", 1, true)
            if separator == nil or separator <= 1 then return nil end
            local name = string.sub(token, 1, separator - 1)
            local decoded = decodeValue(string.sub(token, separator + 1))
            if string.match(name, fieldPattern) == nil or fields[name] ~= nil or decoded == nil then return nil end
            fields[name] = decoded
            if count > 16 then return nil end
        end
        count += 1
    end
    return fields
end

local function whole(value: string?, minimum: number, maximum: number): number?
    if value == nil or string.match(value, "^[0-9]+$") == nil then return nil end
    local number = tonumber(value)
    if number == nil or number % 1 ~= 0 or number < minimum or number > maximum then return nil end
    return number
end

local function validHandle(value: any): boolean
    if type(value) ~= "string" then return false end
    local separator = string.find(value, ":", 1, true)
    if separator == nil then return false end
    local scope = string.sub(value, 1, separator - 1)
    local token = string.sub(value, separator + 1)
    return (scope == "content" or scope == "preview")
        and #token >= 32 and #token <= 256
        and string.match(token, "^[A-Za-z0-9_-]+$") ~= nil
end

local function validColor(value: any): boolean
    return type(value) == "string" and string.match(value, "^#%x%x%x%x%x%x$") ~= nil
end

function Content.image(handle: string, metadata: ImageMetadata): Image
    assert(validHandle(handle), "Content.image requires an opaque content: or preview: handle")
    assert(type(metadata) == "table", "Content.image requires image metadata")
    local allowed: { [string]: boolean } = { mediaType = true, bytes = true, width = true, height = true, orientation = true, placeholderColor = true }
    for key in pairs(metadata :: any) do assert(type(key) == "string" and allowed[key] == true, "Content.image metadata contains an unsupported field") end
    assert(mediaTypes[metadata.mediaType] == true, "Content.image mediaType is not supported")
    assert(type(metadata.bytes) == "number" and metadata.bytes % 1 == 0 and metadata.bytes >= 4 and metadata.bytes <= 25 * 1024 * 1024, "Content.image bytes must be between 4 and 26214400")
    assert(type(metadata.width) == "number" and metadata.width % 1 == 0 and metadata.width >= 1 and metadata.width <= 8192, "Content.image width must be between 1 and 8192")
    assert(type(metadata.height) == "number" and metadata.height % 1 == 0 and metadata.height >= 1 and metadata.height <= 8192, "Content.image height must be between 1 and 8192")
    assert(metadata.width * metadata.height <= 40 * 1024 * 1024, "Content.image dimensions exceed the decoded pixel budget")
    if metadata.orientation ~= nil then assert(orientations[metadata.orientation] == true, "Content.image orientation is not supported") end
    if metadata.placeholderColor ~= nil then assert(validColor(metadata.placeholderColor), "Content.image placeholderColor must be #RRGGBB") end
    return (table.freeze({ kind = "image", uri = handle, metadata = table.freeze(table.clone(metadata)) }) :: any) :: Image
end

function Content.uri(value: Image): string
    assert(type(value) == "table" and value.kind == "image" and validHandle(value.uri), "Content.uri requires a Content.Image")
    return value.uri
end

function Content.pickImage(options: PickOptions?): number
    local maximumBytes = if options == nil or options.maximumBytes == nil then 25 * 1024 * 1024 else options.maximumBytes
    local maximumWidth = if options == nil or options.maximumWidth == nil then 8192 else options.maximumWidth
    local maximumHeight = if options == nil or options.maximumHeight == nil then 8192 else options.maximumHeight
    assert(type(maximumBytes) == "number" and maximumBytes % 1 == 0 and maximumBytes >= 4 and maximumBytes <= 25 * 1024 * 1024, "pickImage maximumBytes is invalid")
    assert(type(maximumWidth) == "number" and maximumWidth % 1 == 0 and maximumWidth >= 1 and maximumWidth <= 8192, "pickImage maximumWidth is invalid")
    assert(type(maximumHeight) == "number" and maximumHeight % 1 == 0 and maximumHeight >= 1 and maximumHeight <= 8192, "pickImage maximumHeight is invalid")
    return hostCapability().request("content.pick", "image", selectionDeadlineMs, encode({
        maximumBytes = tostring(maximumBytes), maximumHeight = tostring(maximumHeight), maximumWidth = tostring(maximumWidth), source = "files",
    }))
end

function Content.decodePick(payload: string): PickResult
    local fields = decode(payload)
    assert(fields ~= nil and (fields.status == "cancelled" or fields.status == "selected"), "invalid content pick result")
    if fields.status == "cancelled" then
        local count = 0 for _ in pairs(fields) do count += 1 end
        assert(count == 1, "invalid cancelled content pick result")
        return { status = "cancelled", image = nil }
    end
    local count = 0 for _ in pairs(fields) do count += 1 end
    local bytes = whole(fields.bytes, 4, 25 * 1024 * 1024)
    local width = whole(fields.width, 1, 8192)
    local height = whole(fields.height, 1, 8192)
    local handle = fields.handle
    local mediaType = fields.mediaType
    local orientation = fields.orientation
    assert(count == 7 and bytes ~= nil and width ~= nil and height ~= nil and handle ~= nil and mediaType ~= nil and orientation ~= nil, "invalid selected content pick result")
    return { status = "selected", image = Content.image(handle :: string, {
        mediaType = mediaType :: any, bytes = bytes, width = width, height = height, orientation = orientation :: any,
    }) }
end

function Content.release(image: Image): number
    local handle = Content.uri(image)
    assert(string.sub(handle, 1, 8) == "preview:", "Content.release requires a selected preview image")
    return hostCapability().request("content.pick", "release", 1000, encode({ handle = handle }))
end

function Content.upload(image: Image, intent: string): number
    assert(type(intent) == "string" and string.match(intent, "^upload:[A-Za-z0-9_%-]+$") ~= nil and #intent >= 39 and #intent <= 263, "Content.upload requires an opaque upload handle")
    assert(string.sub(Content.uri(image), 1, 8) == "preview:", "Content.upload requires a selected preview image")
    return hostCapability().request("content.upload", "start", uploadDeadlineMs, encode({ intent = intent, selection = image.uri }))
end

function Content.cancelUpload(requestId: number): number
    assert(type(requestId) == "number" and requestId % 1 == 0 and requestId >= 1, "cancelUpload requestId is invalid")
    return hostCapability().request("content.upload", "cancel", 1000, encode({ requestId = tostring(requestId) }))
end

function Content.decodeUpload(payload: string): UploadResult
    local fields = decode(payload)
    assert(fields ~= nil, "invalid upload result")
    local count = 0 for _ in pairs(fields) do count += 1 end
    local bytes = whole(fields.bytes, 14, 25 * 1024 * 1024)
    assert(count == 2 and fields.status == "uploaded" and bytes ~= nil, "invalid upload result")
    return { status = "uploaded", bytes = bytes }
end

function Content.decodeProgress(payload: string): UploadProgress
    local fields = decode(payload)
    assert(fields ~= nil, "invalid upload progress")
    local count = 0 for _ in pairs(fields) do count += 1 end
    local requestId = whole(fields.requestId, 1, 2147483647)
    local loaded = whole(fields.loaded, 0, 25 * 1024 * 1024)
    local total = whole(fields.total, 1, 25 * 1024 * 1024)
    assert(count == 3 and requestId ~= nil and loaded ~= nil and total ~= nil and loaded <= total, "invalid upload progress")
    return { requestId = requestId, loaded = loaded, total = total }
end

Content.limits = table.freeze({ maximumBytes = 25 * 1024 * 1024, maximumDimension = 8192, maximumPixels = 40 * 1024 * 1024, maximumSelections = 8, selectionDeadlineMs = selectionDeadlineMs, uploadDeadlineMs = uploadDeadlineMs })

return table.freeze(Content)
