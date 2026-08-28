--!strict

export type Image = { kind: "image", id: string, uri: string }
export type Audio = { kind: "audio", id: string, uri: string }
export type Font = { kind: "font", id: string, uri: string }
export type Reference = Image | Audio | Font

local Assets = {}

local function validId(id: string): boolean
    if #id < 3 or #id > 128 or string.sub(id, 1, 1) == "/" or string.sub(id, -1) == "/" then return false end
    local segments = 0
    for segment in string.gmatch(id, "[^/]+") do
        if string.match(segment, "^[a-z][a-z0-9_-]*$") == nil then return false end
        segments += 1
    end
    return segments > 0
end

local function reference(kind: "image" | "audio" | "font", id: string): any
    if not validId(id) then error("invalid asset ID: " .. id) end
    if string.sub(id, 1, #kind + 1) ~= kind .. "/" then
        error(kind .. " asset ID must begin with " .. kind .. "/")
    end
    return table.freeze({ kind = kind, id = id, uri = "asset:" .. id })
end

function Assets.image(id: string): Image return reference("image", id) end
function Assets.audio(id: string): Audio return reference("audio", id) end
function Assets.font(id: string): Font return reference("font", id) end
function Assets.uri(value: Reference): string return value.uri end

return table.freeze(Assets)
