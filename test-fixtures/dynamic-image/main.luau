--!strict

local Assets = require("luastra/assets")
local Content = require("luastra/content")
local UI = require("luastra/ui")

local remote = Content.image("content:abcdefghijklmnopqrstuvwxyz_012345", {
    mediaType = "image/png",
    bytes = 4096,
    width = 640,
    height = 480,
    placeholderColor = "#DDE5E2",
})

local image = UI.Image {
    id = "dynamic/image",
    source = remote,
    placeholder = Assets.image("image/placeholder"),
    label = "Protected example",
    onLoad = "image.loaded",
    onError = "image.failed",
}

assert(image.properties.source == "content:abcdefghijklmnopqrstuvwxyz_012345")
assert(image.properties.contentBytes == 4096)
assert(image.properties.pixelWidth == 640)
assert(image.properties.pixelHeight == 480)
assert(image.properties.placeholder == "asset:image/placeholder")

return image
