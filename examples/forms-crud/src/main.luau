--!strict

local Model = require("app/model")
local ServerFunctions = require("app/server-functions")
local UI = require("luastra/ui")

type RetryAction = { kind: string, id: string?, title: string?, details: string?, key: string? }

local records: { ServerFunctions.Record } = {}
local editingId: string? = nil
local draftTitle = ""
local draftDetails = ""
local titleError: string? = nil
local status = "Awaiting launch"
local connectivity = "Unknown"
local pending: { [number]: RetryAction } = {}
local retryAction: RetryAction? = nil
local requestSequence = 0
local launched = false
local disposed = false

local Application = {}

local function clearDraft()
    editingId = nil
    draftTitle = ""
    draftDetails = ""
    titleError = nil
end

local function busy(): boolean
    return next(pending) ~= nil
end

local function newKey(kind: string): string
    requestSequence += 1
    return "crud-" .. kind .. "-" .. tostring(requestSequence)
end

local function issue(action: RetryAction, retry: boolean)
    if disposed then return end
    if connectivity == "Offline" then
        status = "Offline: changes were not sent"
        retryAction = action
        return
    end
    local options: ServerFunctions.RequestOptions = { deadlineMs = 2000, idempotencyKey = action.key, retry = retry }
    local requestId: number
    if action.kind == "list" then
        requestId = ServerFunctions.listRecords({}, { deadlineMs = 2000, retry = true })
        status = retry and "Retrying records" or "Loading records"
    elseif action.kind == "create" then
        requestId = ServerFunctions.createRecord({ title = action.title or "", details = action.details or "" }, options)
        status = retry and "Retrying create" or "Creating record"
    elseif action.kind == "update" then
        requestId = ServerFunctions.updateRecord({ id = action.id or "", title = action.title or "", details = action.details or "" }, options)
        status = retry and "Retrying update" or "Updating record"
    else
        requestId = ServerFunctions.deleteRecord({ id = action.id or "" }, options)
        status = retry and "Retrying delete" or "Deleting record"
    end
    pending[requestId] = action
    retryAction = nil
end

local function recordView(record: ServerFunctions.Record): UI.Node
    return UI.ListItem {
        id = "crud/list/" .. record.id,
        UI.Card {
            id = "crud/card/" .. record.id,
            gap = "md",
            padding = "lg",
            surface = editingId == record.id and "elevated" or "card",
            UI.Text { id = "crud/card/" .. record.id .. "/title", text = record.title, variant = "heading" },
            UI.Text { id = "crud/card/" .. record.id .. "/details", text = record.details ~= "" and record.details or "No details", tone = "muted" },
            UI.Actions {
                id = "crud/card/" .. record.id .. "/actions",
                gap = "sm",
                responsive = true,
                UI.Button { id = "crud/card/" .. record.id .. "/edit", text = "Edit", onTap = "edit-record", appearance = "secondary", disabled = busy() },
                UI.Button { id = "crud/card/" .. record.id .. "/delete", text = "Delete", onTap = "delete-record", appearance = "danger", disabled = busy() },
            },
        },
    }
end

function Application.render(): UI.Node
    local recordViews: { UI.Node } = {}
    for _, record in records do table.insert(recordViews, recordView(record)) end
    if #recordViews == 0 then
        table.insert(recordViews, UI.ListItem { id = "crud/list/empty", text = busy() and "Loading records…" or "No records yet.", tone = "muted" })
    end
    return UI.Screen {
        id = "crud",
        width = "wide",
        padding = "responsive",
        UI.Stack {
            id = "crud/content",
            gap = "xl",
            UI.Stack {
                id = "crud/intro",
                gap = "sm",
                UI.Text { id = "crud/title", text = "Records without boilerplate", variant = "title" },
                UI.Text { id = "crud/subtitle", text = "Generated Luau server functions with explicit auth, authorization and retry state.", tone = "muted" },
                UI.Row {
                    id = "crud/runtime-status",
                    gap = "sm",
                    responsive = true,
                    UI.Text { id = "crud/connection", text = "Connection: " .. connectivity, role = "status", tone = connectivity == "Offline" and "error" or "success" },
                    UI.Text { id = "crud/backend-status", text = status, role = "status", tone = string.find(status, ":", 1, true) and "error" or "muted" },
                    UI.Button { id = "crud/retry", text = "Retry", onTap = "retry-request", hidden = retryAction == nil, disabled = connectivity == "Offline" or busy() },
                },
            },
            UI.Grid {
                id = "crud/workspace",
                columns = "two",
                gap = "lg",
                responsive = true,
                UI.Card {
                    id = "crud/editor",
                    gap = "lg",
                    padding = "lg",
                    surface = "elevated",
                    UI.Text { id = "crud/editor/title", text = editingId == nil and "Create record" or "Edit record", variant = "heading" },
                    UI.Field {
                        id = "crud/title-field",
                        gap = "xs",
                        role = "group",
                        label = "Title field",
                        UI.Text { id = "crud/title-label", text = "Title" },
                        UI.TextInput { id = "crud/title-input", label = "Title", value = draftTitle, onInput = "change-title", inputMode = "text", enterKeyHint = "next", autoComplete = "off", required = true, errorId = titleError ~= nil and "crud/title-error" or nil, disabled = busy() },
                        UI.Text { id = "crud/title-error", text = titleError or "", role = "alert", tone = "error", hidden = titleError == nil },
                    },
                    UI.Field {
                        id = "crud/details-field",
                        gap = "xs",
                        role = "group",
                        label = "Details field",
                        UI.Text { id = "crud/details-label", text = "Details" },
                        UI.TextInput { id = "crud/details-input", label = "Details", value = draftDetails, onInput = "change-details", inputMode = "text", enterKeyHint = "done", autoComplete = "off", disabled = busy() },
                        UI.Text { id = "crud/details-hint", text = "Optional, up to 240 bytes.", tone = "muted" },
                    },
                    UI.Actions {
                        id = "crud/editor/actions",
                        gap = "sm",
                        responsive = true,
                        UI.Button { id = "crud/save", text = editingId == nil and "Create" or "Save changes", onTap = "save-record", appearance = "primary", busy = busy(), disabled = busy() },
                        UI.Button { id = "crud/cancel", text = "Cancel", onTap = "cancel-edit", appearance = "secondary", hidden = editingId == nil, disabled = busy() },
                    },
                },
                UI.Stack {
                    id = "crud/records",
                    gap = "md",
                    UI.Row {
                        id = "crud/records/header",
                        align = "between",
                        responsive = true,
                        gap = "sm",
                        UI.Text { id = "crud/records/title", text = "Records", variant = "heading" },
                        UI.Text { id = "crud/records/count", text = tostring(#records) .. " total", tone = "muted" },
                    },
                    UI.List { id = "crud/list", label = "Records", gap = "md", busy = busy(), table.unpack(recordViews) },
                },
            },
        },
    }
end

function Application.handle(action: string, target: string, value: string)
    if action == "lifecycle" and target == "app" then
        if value == "launch" and not launched then launched = true issue({ kind = "list" }, false)
        elseif value == "online" then connectivity = "Online"
        elseif value == "offline" then connectivity = "Offline"
        elseif value == "dispose" then disposed = true pending = {} status = "Disposed"
        end
        return
    elseif action == "retry-request" and target == "crud/retry" and retryAction ~= nil then
        issue(retryAction, true)
        return
    elseif action == "change-title" and target == "crud/title-input" then
        draftTitle = value titleError = nil status = "Editing" return
    elseif action == "change-details" and target == "crud/details-input" then
        draftDetails = value status = "Editing" return
    elseif action == "cancel-edit" and target == "crud/cancel" then
        clearDraft() status = "Edit cancelled" return
    elseif action == "save-record" and target == "crud/save" then
        local checked = Model.validateDraft(draftTitle, draftDetails)
        if not checked.success then
            titleError = checked.error.path == "$.title" and (checked.error.code == "too_long" and "Title must be at most 80 bytes." or "Title is required.") or "The form is invalid."
            status = "Fix the highlighted field"
            return
        end
        if editingId == nil then issue({ kind = "create", title = checked.value.title, details = checked.value.details, key = newKey("create") }, false)
        else issue({ kind = "update", id = editingId, title = checked.value.title, details = checked.value.details, key = newKey("update") }, false) end
        return
    end
    for _, record in records do
        if action == "edit-record" and target == "crud/card/" .. record.id .. "/edit" then
            editingId = record.id draftTitle = record.title draftDetails = record.details titleError = nil status = "Editing " .. record.title return
        elseif action == "delete-record" and target == "crud/card/" .. record.id .. "/delete" then
            issue({ kind = "delete", id = record.id, key = newKey("delete") }, false) return
        end
    end
end

function Application.resolve(requestId: number, success: boolean, payload: string, errorCode: string, errorMessage: string)
    local action = pending[requestId]
    if action == nil then return end
    pending[requestId] = nil
    if not success then
        status = errorCode .. ": " .. errorMessage
        if errorCode == "NETWORK" or errorCode == "DEADLINE" then retryAction = action end
        return
    end
    if action.kind == "list" then
        local decoded = ServerFunctions.decodeListRecords(payload)
        if decoded == nil then status = "INTERNAL: Invalid list response" return end
        records = decoded.records status = "Records loaded"
    elseif action.kind == "create" then
        local decoded = ServerFunctions.decodeCreateRecord(payload)
        if decoded == nil then status = "INTERNAL: Invalid create response" return end
        table.insert(records, decoded.record) clearDraft() status = "Record created"
    elseif action.kind == "update" then
        local decoded = ServerFunctions.decodeUpdateRecord(payload)
        if decoded == nil then status = "INTERNAL: Invalid update response" return end
        for index, record in records do if record.id == decoded.record.id then records[index] = decoded.record break end end
        clearDraft() status = "Record updated"
    else
        local decoded = ServerFunctions.decodeDeleteRecord(payload)
        if decoded == nil then status = "INTERNAL: Invalid delete response" return end
        local nextRecords: { ServerFunctions.Record } = {}
        for _, record in records do if record.id ~= decoded.deletedId then table.insert(nextRecords, record) end end
        records = nextRecords
        if editingId == decoded.deletedId then clearDraft() end
        status = "Record deleted"
    end
end

function Application.snapshot()
    return { records = table.clone(records), editingId = editingId, draftTitle = draftTitle, draftDetails = draftDetails, titleError = titleError, status = status, connectivity = connectivity, busy = busy(), retry = retryAction ~= nil, disposed = disposed }
end

return Application
