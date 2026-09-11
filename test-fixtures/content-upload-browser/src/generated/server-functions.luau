-- Generated from the project backend declaration. Do not edit.
--!strict

local Server = require("luastra/server")

export type RequestOptions = Server.Options
export type Error = Server.Error

export type CommitUploadInput = { handle: string }
export type CommitUploadResult = { bytes: number, height: number, mediaType: string, objectId: string, orientation: string, source: string, width: number }
export type CreateUploadInput = { bytes: number, height: number, mediaType: string, purpose: string, width: number }
export type CreateUploadResult = { expiresAt: number, handle: string }
export type DeleteUploadInput = { bytes: number, height: number, mediaType: string, objectId: string, purpose: string, width: number }
export type DeleteUploadResult = { deleted: boolean }

local function take(fields: { [string]: string }, used: { [string]: boolean }, name: string): string?
    local value = fields[name]
    if value == nil or used[name] then return nil end
    used[name] = true
    return value
end

local function exact(fields: { [string]: string }, used: { [string]: boolean }): boolean
    for name in pairs(fields) do if used[name] ~= true then return false end end
    return true
end

local Api = {}
Api.decodeError = Server.decodeError

function Api.commitUpload(input: CommitUploadInput, options: Server.Options?): number
    return Server.call("content.upload.commit.v1", { ["handle"] = input.handle }, options)
end

function Api.decodeCommitUpload(payload: string): CommitUploadResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: CommitUploadResult
    local bytesRaw = take(fields, used, "result.bytes")
    local bytes = bytesRaw and tonumber(bytesRaw) or nil
    if bytes == nil then return nil end
    result.bytes = bytes
    local heightRaw = take(fields, used, "result.height")
    local height = heightRaw and tonumber(heightRaw) or nil
    if height == nil then return nil end
    result.height = height
    local mediaTypeRaw = take(fields, used, "result.mediaType")
    local mediaType = mediaTypeRaw
    if mediaType == nil then return nil end
    result.mediaType = mediaType
    local objectIdRaw = take(fields, used, "result.objectId")
    local objectId = objectIdRaw
    if objectId == nil then return nil end
    result.objectId = objectId
    local orientationRaw = take(fields, used, "result.orientation")
    local orientation = orientationRaw
    if orientation == nil then return nil end
    result.orientation = orientation
    local sourceRaw = take(fields, used, "result.source")
    local source = sourceRaw
    if source == nil then return nil end
    result.source = source
    local widthRaw = take(fields, used, "result.width")
    local width = widthRaw and tonumber(widthRaw) or nil
    if width == nil then return nil end
    result.width = width
    if not exact(fields, used) then return nil end
    return result
end

function Api.createUpload(input: CreateUploadInput, options: Server.Options?): number
    return Server.call("content.upload.create.v1", { ["bytes"] = tostring(input.bytes), ["height"] = tostring(input.height), ["mediaType"] = input.mediaType, ["purpose"] = input.purpose, ["width"] = tostring(input.width) }, options)
end

function Api.decodeCreateUpload(payload: string): CreateUploadResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: CreateUploadResult
    local expiresAtRaw = take(fields, used, "result.expiresAt")
    local expiresAt = expiresAtRaw and tonumber(expiresAtRaw) or nil
    if expiresAt == nil then return nil end
    result.expiresAt = expiresAt
    local handleRaw = take(fields, used, "result.handle")
    local handle = handleRaw
    if handle == nil then return nil end
    result.handle = handle
    if not exact(fields, used) then return nil end
    return result
end

function Api.deleteUpload(input: DeleteUploadInput, options: Server.Options?): number
    return Server.call("content.upload.delete.v1", { ["bytes"] = tostring(input.bytes), ["height"] = tostring(input.height), ["mediaType"] = input.mediaType, ["objectId"] = input.objectId, ["purpose"] = input.purpose, ["width"] = tostring(input.width) }, options)
end

function Api.decodeDeleteUpload(payload: string): DeleteUploadResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: DeleteUploadResult
    local deletedRaw = take(fields, used, "result.deleted")
    if deletedRaw ~= "true" and deletedRaw ~= "false" then return nil end
    local deleted = deletedRaw == "true"
    result.deleted = deleted
    if not exact(fields, used) then return nil end
    return result
end

return table.freeze(Api)
