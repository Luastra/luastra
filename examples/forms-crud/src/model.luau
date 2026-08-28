--!strict

local Data = require("luastra/data")

export type Record = {
    id: string,
    title: string,
    details: string,
}

export type Draft = {
    title: string,
    details: string,
}

export type DraftSuccess = { success: true, value: Draft, error: nil }
export type DraftFailure = { success: false, value: nil, error: Data.ValidationError }
export type DraftResult = DraftSuccess | DraftFailure

local draftSchema = Data.object({
    title = Data.string { minBytes = 1, maxBytes = 80, trim = true },
    details = Data.string { maxBytes = 240, trim = true },
})

local recordSchema = Data.object({
    id = Data.string { minBytes = 1, maxBytes = 64 },
    title = Data.string { minBytes = 1, maxBytes = 80, trim = true },
    details = Data.string { maxBytes = 240, trim = true },
})

local Model = {}

function Model.validateDraft(title: string, details: string): DraftResult
    local decoded = Data.decode(draftSchema, { title = title, details = details })
    if not decoded.success then return decoded :: any end
    return { success = true, value = decoded.value :: Draft, error = nil }
end

function Model.decodeRecord(value: any): Data.Result
    return Data.decode(recordSchema, value)
end

function Model.initialRecords(): { Record }
    return {
        { id = "record-1", title = "Plan the release", details = "Define the smallest honest public-alpha boundary." },
        { id = "record-2", title = "Review accessibility", details = "Check labels, errors, focus and keyboard flow." },
    }
end

function Model.find(records: { Record }, id: string): Record?
    for _, record in records do
        if record.id == id then return record end
    end
    return nil
end

function Model.create(records: { Record }, id: string, draft: Draft): { Record }
    assert(Model.find(records, id) == nil, "record ID already exists")
    local output = table.clone(records)
    table.insert(output, { id = id, title = draft.title, details = draft.details })
    return output
end

function Model.update(records: { Record }, id: string, draft: Draft): { Record }
    local output: { Record } = {}
    local found = false
    for _, record in records do
        if record.id == id then
            table.insert(output, { id = id, title = draft.title, details = draft.details })
            found = true
        else
            table.insert(output, record)
        end
    end
    assert(found, "record to update was not found")
    return output
end

function Model.delete(records: { Record }, id: string): { Record }
    local output: { Record } = {}
    local found = false
    for _, record in records do
        if record.id == id then found = true else table.insert(output, record) end
    end
    assert(found, "record to delete was not found")
    return output
end

return table.freeze(Model)
