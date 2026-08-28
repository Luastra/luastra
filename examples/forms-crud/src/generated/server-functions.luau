-- Generated from the project backend declaration. Do not edit.
--!strict

local Server = require("luastra/server")

export type RequestOptions = Server.Options

export type Record = { details: string, id: string, title: string }

export type AdminReportInput = {  }
export type AdminReportResult = { count: number }
export type CreateRecordInput = { details: string, title: string }
export type CreateRecordResult = { record: Record }
export type DeleteRecordInput = { id: string }
export type DeleteRecordResult = { deletedId: string }
export type FailSafelyInput = {  }
export type FailSafelyResult = { count: number }
export type ListRecordsInput = {  }
export type ListRecordsResult = { records: { Record } }
export type UpdateRecordInput = { details: string, id: string, title: string }
export type UpdateRecordResult = { record: Record }

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

function Api.adminReport(input: AdminReportInput, options: Server.Options?): number
    return Server.call("records.admin.v1", {  }, options)
end

function Api.decodeAdminReport(payload: string): AdminReportResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: AdminReportResult
    local countRaw = take(fields, used, "result.count")
    local count = countRaw and tonumber(countRaw) or nil
    if count == nil then return nil end
    result.count = count
    if not exact(fields, used) then return nil end
    return result
end

function Api.createRecord(input: CreateRecordInput, options: Server.Options?): number
    return Server.call("records.create.v1", { ["details"] = input.details, ["title"] = input.title }, options)
end

function Api.decodeCreateRecord(payload: string): CreateRecordResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: CreateRecordResult
    local record_detailsRaw = take(fields, used, "result.record" .. ".details")
    local record_details = record_detailsRaw
    if record_details == nil then return nil end
    local record_idRaw = take(fields, used, "result.record" .. ".id")
    local record_id = record_idRaw
    if record_id == nil then return nil end
    local record_titleRaw = take(fields, used, "result.record" .. ".title")
    local record_title = record_titleRaw
    if record_title == nil then return nil end
    local record: Record = { details = record_details, id = record_id, title = record_title }
    result.record = record
    if not exact(fields, used) then return nil end
    return result
end

function Api.deleteRecord(input: DeleteRecordInput, options: Server.Options?): number
    return Server.call("records.delete.v1", { ["id"] = input.id }, options)
end

function Api.decodeDeleteRecord(payload: string): DeleteRecordResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: DeleteRecordResult
    local deletedIdRaw = take(fields, used, "result.deletedId")
    local deletedId = deletedIdRaw
    if deletedId == nil then return nil end
    result.deletedId = deletedId
    if not exact(fields, used) then return nil end
    return result
end

function Api.failSafely(input: FailSafelyInput, options: Server.Options?): number
    return Server.call("records.fail.v1", {  }, options)
end

function Api.decodeFailSafely(payload: string): FailSafelyResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: FailSafelyResult
    local countRaw = take(fields, used, "result.count")
    local count = countRaw and tonumber(countRaw) or nil
    if count == nil then return nil end
    result.count = count
    if not exact(fields, used) then return nil end
    return result
end

function Api.listRecords(input: ListRecordsInput, options: Server.Options?): number
    return Server.call("records.list.v1", {  }, options)
end

function Api.decodeListRecords(payload: string): ListRecordsResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: ListRecordsResult
    local recordsLengthRaw = take(fields, used, "result.records.length")
    local recordsLength = recordsLengthRaw and tonumber(recordsLengthRaw) or nil
    if recordsLength == nil or recordsLength % 1 ~= 0 or recordsLength < 0 or recordsLength > 128 then return nil end
    local records: { Record } = {}
    for index = 1, recordsLength do
        local item_detailsRaw = take(fields, used, "result.records." .. tostring(index) .. ".details")
        local item_details = item_detailsRaw
        if item_details == nil then return nil end
        local item_idRaw = take(fields, used, "result.records." .. tostring(index) .. ".id")
        local item_id = item_idRaw
        if item_id == nil then return nil end
        local item_titleRaw = take(fields, used, "result.records." .. tostring(index) .. ".title")
        local item_title = item_titleRaw
        if item_title == nil then return nil end
        local item: Record = { details = item_details, id = item_id, title = item_title }
        table.insert(records, item)
    end
    result.records = records
    if not exact(fields, used) then return nil end
    return result
end

function Api.updateRecord(input: UpdateRecordInput, options: Server.Options?): number
    return Server.call("records.update.v1", { ["details"] = input.details, ["id"] = input.id, ["title"] = input.title }, options)
end

function Api.decodeUpdateRecord(payload: string): UpdateRecordResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: UpdateRecordResult
    local record_detailsRaw = take(fields, used, "result.record" .. ".details")
    local record_details = record_detailsRaw
    if record_details == nil then return nil end
    local record_idRaw = take(fields, used, "result.record" .. ".id")
    local record_id = record_idRaw
    if record_id == nil then return nil end
    local record_titleRaw = take(fields, used, "result.record" .. ".title")
    local record_title = record_titleRaw
    if record_title == nil then return nil end
    local record: Record = { details = record_details, id = record_id, title = record_title }
    result.record = record
    if not exact(fields, used) then return nil end
    return result
end

return table.freeze(Api)
