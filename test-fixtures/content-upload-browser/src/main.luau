--!strict

local App = require("luastra/app")
local Content = require("luastra/content")
local Api = require("app/generated/server-functions")
local UI = require("luastra/ui")

local pending: { [number]: string } = {}
local image: Content.Image? = nil
local selectedPreview: Content.Image? = nil
local intent = ""
local objectId = ""
local status = "Ready"
local progress = 0
local mutation = 0

local function track(requestId: number, purpose: string)
    pending[requestId] = purpose
end

local function key(name: string): string
    mutation += 1
    return "content-upload-" .. name .. "-" .. tostring(mutation)
end

return App.compose {
    render = function()
        local children = {
            UI.Text { id = "upload/title", text = "Content upload browser audit", variant = "title" },
            UI.Text { id = "upload/status", text = status .. "; progress " .. tostring(progress), role = "status" },
        }
        if image ~= nil then table.insert(children, UI.Image { id = "upload/image", source = image, label = "Selected upload", width = 160, height = 160, fit = "contain" }) end
        table.insert(children, UI.Actions { id = "upload/actions", gap = "sm",
            UI.Button { id = "upload/select", text = "Select image", onTap = "select-image", disabled = next(pending) ~= nil },
            UI.Button { id = "upload/delete", text = "Delete image", onTap = "delete-image", hidden = objectId == "", disabled = next(pending) ~= nil },
        })
        return UI.Screen { id = "upload", padding = "responsive", UI.Stack { id = "upload/content", gap = "md", table.unpack(children) } }
    end,
    handle = function(action, _target, value)
        if action == "select-image" then
            status = "Selecting"
            track(Content.pickImage { maximumBytes = 1048576, maximumWidth = 2048, maximumHeight = 2048 }, "pick")
        elseif action == "delete-image" and objectId ~= "" and image ~= nil then
            status = "Deleting"
            track(Api.deleteUpload({ purpose = "profile-image", objectId = objectId, mediaType = image.metadata.mediaType, bytes = image.metadata.bytes, width = image.metadata.width, height = image.metadata.height }, { idempotencyKey = key("delete") }), "delete")
        elseif action == "content_progress" then
            local decoded = Content.decodeProgress(value)
            progress = math.floor(decoded.loaded * 100 / decoded.total)
        end
    end,
    resolve = function(requestId, success, payload, errorCode)
        local purpose = pending[requestId]
        pending[requestId] = nil
        if purpose == nil then return end
        if not success then status = purpose .. " failed: " .. errorCode return end
        if purpose == "pick" then
            local result = Content.decodePick(payload)
            if result.status == "cancelled" then status = "Selection cancelled" return end
            image = result.image selectedPreview = result.image status = "Preview ready"
            local metadata = result.image.metadata
            track(Api.createUpload({ purpose = "profile-image", mediaType = metadata.mediaType, bytes = metadata.bytes, width = metadata.width, height = metadata.height }, { idempotencyKey = key("create") }), "create")
        elseif purpose == "create" then
            local result = Api.decodeCreateUpload(payload)
            local preview = selectedPreview
            if result == nil or preview == nil then status = "Invalid intent" return end
            intent = result.handle status = "Uploading"
            track(Content.upload(preview, intent), "upload")
        elseif purpose == "upload" then
            Content.decodeUpload(payload)
            status = "Committing"
            track(Api.commitUpload({ handle = intent }, { idempotencyKey = key("commit") }), "commit")
        elseif purpose == "commit" then
            local result = Api.decodeCommitUpload(payload)
            if result == nil then status = "Invalid commit" return end
            objectId = result.objectId
            image = Content.image(result.source, { mediaType = result.mediaType :: any, bytes = result.bytes, width = result.width, height = result.height, orientation = result.orientation :: any })
            local preview = selectedPreview
            if preview ~= nil then track(Content.release(preview), "release") selectedPreview = nil end
            progress = 100 status = "Committed"
        elseif purpose == "release" then
            status = "Committed"
        elseif purpose == "delete" then
            local result = Api.decodeDeleteUpload(payload)
            if result == nil or not result.deleted then status = "Delete failed" return end
            image = nil objectId = "" intent = "" progress = 0 status = "Deleted"
        end
    end,
    snapshot = function() return { status = status, objectId = objectId, progress = progress } end,
}
