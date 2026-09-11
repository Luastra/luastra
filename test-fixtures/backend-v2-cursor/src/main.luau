--!strict

local App = require("luastra/app")
local Api = require("app/generated/server-functions")
local UI = require("luastra/ui")

local status = "idle"
local firstTitle = "No records loaded"
local nextCursor = "none"
local titleError = "none"
local pendingRequest: number? = nil
local pendingKind = "none"

local plainError = Api.decodeError("NETWORK", "Backend unavailable")
assert(plainError ~= nil and plainError.message == "Backend unavailable" and plainError.fields == nil)
assert(Api.decodeError("VALIDATION", "v=1&error=fields&message=Missing") == nil)

return App.compose {
    render = function(_outputs): UI.Node
        return UI.Screen { id = "backend-v2", padding = "lg", gap = "md",
            UI.Text { id = "backend-v2/status", text = status, role = "status" },
            UI.Text { id = "backend-v2/first-title", text = firstTitle },
            UI.Text { id = "backend-v2/next-cursor", text = nextCursor },
            UI.Text { id = "backend-v2/title-error", text = titleError },
            UI.Button { id = "backend-v2/load", text = "Load typed page", onTap = "load-page" },
            UI.Button { id = "backend-v2/reject", text = "Reject invalid rename", onTap = "reject-rename" },
        }
    end,
    handle = function(action: string, _target: string, _value: string)
        if pendingRequest ~= nil then return end
        if action == "load-page" then
            status = "loading"
            pendingKind = "page"
            pendingRequest = Api.pageRecords({ cursor = Api.nullValue(), direction = "forward", limit = 2 }, { retry = true })
        elseif action == "reject-rename" then
            status = "renaming"
            pendingKind = "rename"
            pendingRequest = Api.renameRecord({ id = "record-1", title = "" }, { idempotencyKey = "rename-invalid-1" })
        end
    end,
    resolve = function(requestId: number, success: boolean, payload: string, errorCode: string, errorMessage: string)
        if requestId ~= pendingRequest then return end
        pendingRequest = nil
        local kind = pendingKind
        pendingKind = "none"
        if not success then
            local decoded = Api.decodeError(errorCode, errorMessage)
            if decoded == nil then status = "invalid-error" return end
            status = decoded.code .. ": " .. decoded.message
            if decoded.fields ~= nil then titleError = decoded.fields.title or "none" end
            return
        end
        if kind ~= "page" then status = "unexpected-success" return end
        local result = Api.decodePageRecords(payload)
        if result == nil then status = "invalid" return end
        status = "loaded " .. tostring(#result.page.items)
        firstTitle = result.page.items[1].title
        local cursor = result.page.nextCursor
        if cursor == nil then nextCursor = "absent"
        elseif cursor.kind == "null" then nextCursor = "end"
        else nextCursor = cursor.value end
    end,
    snapshot = function()
        return { status = status, firstTitle = firstTitle, nextCursor = nextCursor, titleError = titleError, pending = pendingRequest ~= nil }
    end,
}
