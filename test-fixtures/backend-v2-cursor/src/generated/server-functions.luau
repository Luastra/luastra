-- Generated from the project backend declaration. Do not edit.
--!strict

local Server = require("luastra/server")

export type RequestOptions = Server.Options
export type Nullable<T> = Server.Nullable<T>
export type Error = Server.Error

export type PageDirection = "forward" | "backward"
export type Record = { id: string, tags: { string }, title: string }
export type RecordPage = { items: { Record }, nextCursor: Server.Nullable<string>?, previousCursor: Server.Nullable<string>?, revision: string }

export type PageRecordsInput = { cursor: Server.Nullable<string>?, direction: PageDirection, limit: number }
export type PageRecordsResult = { page: RecordPage }
export type RenameRecordInput = { id: string, title: string }
export type RenameRecordResult = { record: Record }

local limits = { ["maximumDepth"] = 8, ["maximumFields"] = 128, ["maximumItems"] = 16, ["maximumPayloadBytes"] = 4096, ["maximumStringBytes"] = 1024 }
local enums = { ["PageDirection"] = { ["backward"] = true, ["forward"] = true } }
local types = { ["Record"] = { ["id"] = { ["maximumBytes"] = 64, ["type"] = "string" }, ["tags"] = { ["array"] = true, ["maximumItems"] = 4, ["type"] = "string" }, ["title"] = { ["maximumBytes"] = 256, ["type"] = "string" } }, ["RecordPage"] = { ["items"] = { ["array"] = true, ["maximumItems"] = 3, ["type"] = "Record" }, ["nextCursor"] = { ["maximumBytes"] = 128, ["nullable"] = true, ["optional"] = true, ["type"] = "string" }, ["previousCursor"] = { ["maximumBytes"] = 128, ["nullable"] = true, ["optional"] = true, ["type"] = "string" }, ["revision"] = { ["maximumBytes"] = 64, ["type"] = "string" } } }
local invalid = table.freeze({})
local absent = table.freeze({})

local encodeObject: (fields: { [string]: string }, prefix: string, definition: any, value: any, depth: number) -> ()
local function encodeScalar(fields: { [string]: string }, path: string, descriptor: any, value: any, depth: number)
    assert(depth <= limits.maximumDepth, "server v2 value exceeds maximum depth")
    local typeName = descriptor.type
    if typeName == "string" then
        assert(type(value) == "string" and #value <= (descriptor.maximumBytes or limits.maximumStringBytes), "server v2 string is invalid: " .. path)
        fields[path] = value
    elseif typeName == "number" then
        assert(type(value) == "number" and value % 1 == 0 and value >= -2147483647 and value <= 2147483647, "server v2 number is invalid: " .. path)
        fields[path] = tostring(value)
    elseif typeName == "boolean" then
        assert(type(value) == "boolean", "server v2 boolean is invalid: " .. path)
        fields[path] = if value then "true" else "false"
    elseif enums[typeName] ~= nil then
        assert(type(value) == "string" and enums[typeName][value] == true, "server v2 enum is invalid: " .. path)
        fields[path] = value
    else
        assert(types[typeName] ~= nil, "server v2 type is unknown")
        encodeObject(fields, path, types[typeName], value, depth + 1)
    end
end

local function encodeField(fields: { [string]: string }, path: string, descriptor: any, authored: any, depth: number)
    if authored == nil then
        assert(descriptor.optional == true, "server v2 required field is missing: " .. path)
        return
    end
    if descriptor.optional == true then fields[path .. ".present"] = "true" end
    local value = authored
    if descriptor.nullable == true then
        assert(type(authored) == "table" and (authored.kind == "null" or authored.kind == "value"), "server v2 nullable field is invalid: " .. path)
        if authored.kind == "null" then fields[path .. ".null"] = "true" return end
        value = authored.value
        assert(value ~= nil, "server v2 nullable value is missing: " .. path)
    end
    if descriptor.array == true then
        assert(type(value) == "table", "server v2 array is invalid: " .. path)
        local length = #value
        assert(length <= (descriptor.maximumItems or limits.maximumItems), "server v2 array exceeds item limit: " .. path)
        for key in pairs(value) do assert(type(key) == "number" and key % 1 == 0 and key >= 1 and key <= length, "server v2 array is sparse: " .. path) end
        fields[path .. ".length"] = tostring(length)
        local itemDescriptor = table.clone(descriptor)
        itemDescriptor.array = false itemDescriptor.optional = false itemDescriptor.nullable = false
        for index = 1, length do encodeScalar(fields, path .. "." .. tostring(index), itemDescriptor, value[index], depth + 1) end
    else
        encodeScalar(fields, path, descriptor, value, depth)
    end
end

encodeObject = function(fields: { [string]: string }, prefix: string, definition: any, value: any, depth: number)
    assert(depth <= limits.maximumDepth and type(value) == "table", "server v2 object is invalid: " .. prefix)
    for name in pairs(value) do assert(definition[name] ~= nil, "server v2 object has unknown field: " .. prefix .. "." .. tostring(name)) end
    for name, descriptor in pairs(definition) do encodeField(fields, prefix .. "." .. name, descriptor, value[name], depth) end
end

local function take(fields: { [string]: string }, used: { [string]: boolean }, name: string, required: boolean): any
    local value = fields[name]
    if value == nil then return if required then invalid else absent end
    if used[name] then return invalid end
    used[name] = true
    return value
end

local decodeObject: (fields: { [string]: string }, used: { [string]: boolean }, prefix: string, definition: any, depth: number) -> any
local function decodeScalar(fields: { [string]: string }, used: { [string]: boolean }, path: string, descriptor: any, depth: number): any
    if depth > limits.maximumDepth then return invalid end
    local typeName = descriptor.type
    if typeName == "string" then
        local value = take(fields, used, path, true)
        if value == invalid or #value > (descriptor.maximumBytes or limits.maximumStringBytes) then return invalid end
        return value
    elseif typeName == "number" then
        local source = take(fields, used, path, true)
        if source == invalid then return invalid end
        local value = tonumber(source)
        if value == nil or value % 1 ~= 0 or value < -2147483647 or value > 2147483647 or tostring(value) ~= source then return invalid end
        return value
    elseif typeName == "boolean" then
        local value = take(fields, used, path, true)
        if value ~= "true" and value ~= "false" then return invalid end
        return value == "true"
    elseif enums[typeName] ~= nil then
        local value = take(fields, used, path, true)
        if value == invalid or enums[typeName][value] ~= true then return invalid end
        return value
    end
    if types[typeName] == nil then return invalid end
    return decodeObject(fields, used, path, types[typeName], depth + 1)
end

local function decodeField(fields: { [string]: string }, used: { [string]: boolean }, path: string, descriptor: any, depth: number): any
    if descriptor.optional == true then
        local present = take(fields, used, path .. ".present", false)
        if present == absent then return absent end
        if present ~= "true" then return invalid end
    end
    if descriptor.nullable == true then
        local nullMarker = take(fields, used, path .. ".null", false)
        if nullMarker ~= absent then
            if nullMarker ~= "true" then return invalid end
            return Server.nullValue()
        end
    end
    local value
    if descriptor.array == true then
        local source = take(fields, used, path .. ".length", true)
        if source == invalid or (source ~= "0" and string.match(source, "^[1-9][0-9]*$") == nil) then return invalid end
        local length = tonumber(source)
        if length == nil or length > (descriptor.maximumItems or limits.maximumItems) then return invalid end
        value = {}
        local itemDescriptor = table.clone(descriptor)
        itemDescriptor.array = false itemDescriptor.optional = false itemDescriptor.nullable = false
        for index = 1, length do
            local item = decodeScalar(fields, used, path .. "." .. tostring(index), itemDescriptor, depth + 1)
            if item == invalid then return invalid end
            table.insert(value, item)
        end
    else
        value = decodeScalar(fields, used, path, descriptor, depth)
        if value == invalid then return invalid end
    end
    return if descriptor.nullable == true then Server.value(value) else value
end

decodeObject = function(fields: { [string]: string }, used: { [string]: boolean }, prefix: string, definition: any, depth: number): any
    if depth > limits.maximumDepth then return invalid end
    local value = {}
    for name, descriptor in pairs(definition) do
        local decoded = decodeField(fields, used, prefix .. "." .. name, descriptor, depth)
        if decoded == invalid then return invalid end
        if decoded ~= absent then value[name] = decoded end
    end
    return value
end

local function exact(fields: { [string]: string }, used: { [string]: boolean }): boolean
    for name in pairs(fields) do if used[name] ~= true then return false end end
    return true
end

local Api = {}
Api.decodeError = Server.decodeError
Api.nullValue = Server.nullValue
Api.value = Server.value

function Api.pageRecords(input: PageRecordsInput, options: Server.Options?): number
    local fields: { [string]: string } = {}
    encodeObject(fields, "input", { ["cursor"] = { ["maximumBytes"] = 128, ["nullable"] = true, ["optional"] = true, ["type"] = "string" }, ["direction"] = { ["type"] = "PageDirection" }, ["limit"] = { ["type"] = "number" } }, input, 0)
    return Server.callV2("records.page.v2", fields, options, { maximumBytes = limits.maximumPayloadBytes, maximumFields = limits.maximumFields })
end

function Api.decodePageRecords(payload: string): PageRecordsResult?
    if #payload > limits.maximumPayloadBytes then return nil end
    local decoded = Server.decodeV2(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local fieldCount = 0
    for _name in pairs(fields) do fieldCount += 1 end
    if fieldCount > limits.maximumFields then return nil end
    local used: { [string]: boolean } = {}
    local version = take(fields, used, "resultVersion", true)
    if version ~= "1" then return nil end
    local result = decodeObject(fields, used, "result", { ["page"] = { ["type"] = "RecordPage" } }, 0)
    if result == invalid or not exact(fields, used) then return nil end
    return result :: PageRecordsResult
end

function Api.renameRecord(input: RenameRecordInput, options: Server.Options?): number
    local fields: { [string]: string } = {}
    encodeObject(fields, "input", { ["id"] = { ["maximumBytes"] = 64, ["type"] = "string" }, ["title"] = { ["maximumBytes"] = 256, ["type"] = "string" } }, input, 0)
    return Server.callV2("records.rename.v2", fields, options, { maximumBytes = limits.maximumPayloadBytes, maximumFields = limits.maximumFields })
end

function Api.decodeRenameRecord(payload: string): RenameRecordResult?
    if #payload > limits.maximumPayloadBytes then return nil end
    local decoded = Server.decodeV2(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local fieldCount = 0
    for _name in pairs(fields) do fieldCount += 1 end
    if fieldCount > limits.maximumFields then return nil end
    local used: { [string]: boolean } = {}
    local version = take(fields, used, "resultVersion", true)
    if version ~= "1" then return nil end
    local result = decodeObject(fields, used, "result", { ["record"] = { ["type"] = "Record" } }, 0)
    if result == invalid or not exact(fields, used) then return nil end
    return result :: RenameRecordResult
end

return table.freeze(Api)
