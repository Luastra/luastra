--!strict

local App = require("luastra/app")
local Content = require("luastra/content")
local UI = require("luastra/ui")

local goodPreview = Content.image("preview:abcdefghijklmnopqrstuvwxyz_01234", {
    mediaType = "image/png",
    bytes = 5785,
    width = 512,
    height = 512,
    placeholderColor = "#DDE5E2",
})
local brokenPreview = Content.image("preview:bcdefghijklmnopqrstuvwxyz_012345", {
    mediaType = "image/png",
    bytes = 8,
    width = 1,
    height = 1,
    placeholderColor = "#F1D7D4",
})
local unavailableContent = Content.image("content:cdefghijklmnopqrstuvwxyz_0123456", {
    mediaType = "image/png",
    bytes = 5785,
    width = 512,
    height = 512,
    placeholderColor = "#E7E1CD",
})

local selected = "good"
local loaded = 0
local failed = 0

local function source(): Content.Image
    if selected == "broken" then return brokenPreview end
    if selected == "content" then return unavailableContent end
    return goodPreview
end

return App.compose {
    render = function()
        return UI.Screen {
            id = "dynamic-image",
            padding = "responsive",
            UI.Stack {
                id = "dynamic-image/content",
                gap = "md",
                UI.Text { id = "dynamic-image/title", text = "Dynamic image browser audit", variant = "title" },
                UI.Image {
                    id = "dynamic-image/image",
                    source = source(),
                    label = "One pixel dynamic image",
                    width = 160,
                    height = 160,
                    fit = "contain",
                    onLoad = "image-loaded",
                    onError = "image-failed",
                },
                UI.Text {
                    id = "dynamic-image/status",
                    text = "Selected " .. selected .. "; loaded " .. tostring(loaded) .. "; failed " .. tostring(failed),
                    role = "status",
                },
                UI.Actions { id = "dynamic-image/actions", gap = "sm",
                    UI.Button { id = "dynamic-image/good", text = "Good preview", onTap = "select-good" },
                    UI.Button { id = "dynamic-image/broken", text = "Broken preview", onTap = "select-broken" },
                    UI.Button { id = "dynamic-image/content-handle", text = "Unavailable content", onTap = "select-content" },
                },
            },
        }
    end,
    handle = function(action)
        if action == "select-good" then selected = "good"
        elseif action == "select-broken" then selected = "broken"
        elseif action == "select-content" then selected = "content"
        elseif action == "image-loaded" then loaded += 1
        elseif action == "image-failed" then failed += 1 end
    end,
    snapshot = function()
        return { selected = selected, loaded = loaded, failed = failed }
    end,
}
