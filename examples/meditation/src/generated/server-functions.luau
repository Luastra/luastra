-- Generated from the project backend declaration. Do not edit.
--!strict

local Server = require("luastra/server")

export type RequestOptions = Server.Options

export type Meditation = { accessible: boolean, description: string, durationMs: number, favorite: boolean, id: string, locked: boolean, title: string }

export type AccessMeditationInput = { meditationId: string }
export type AccessMeditationResult = { artist: string, downloadAllowed: boolean, itemId: string, resumePositionMs: number, source: string, title: string }
export type ListMeditationsInput = {  }
export type ListMeditationsResult = { meditations: { Meditation } }
export type LoginInput = { email: string, password: string }
export type LoginResult = { expiresAt: number, token: string, userName: string }
export type LogoutInput = {  }
export type LogoutResult = { revoked: boolean }
export type SaveProgressInput = { meditationId: string, positionMs: number }
export type SaveProgressResult = { meditationId: string, positionMs: number }
export type SessionInfoInput = {  }
export type SessionInfoResult = { expiresAt: number, userName: string }
export type SetFavoriteInput = { favorite: boolean, meditationId: string }
export type SetFavoriteResult = { favorite: boolean, meditationId: string }

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

function Api.login(input: LoginInput, options: Server.Options?): number
    return Server.call("auth.login.v1", { ["email"] = input.email, ["password"] = input.password }, options)
end

function Api.decodeLogin(payload: string): LoginResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: LoginResult
    local expiresAtRaw = take(fields, used, "result.expiresAt")
    local expiresAt = expiresAtRaw and tonumber(expiresAtRaw) or nil
    if expiresAt == nil then return nil end
    result.expiresAt = expiresAt
    local tokenRaw = take(fields, used, "result.token")
    local token = tokenRaw
    if token == nil then return nil end
    result.token = token
    local userNameRaw = take(fields, used, "result.userName")
    local userName = userNameRaw
    if userName == nil then return nil end
    result.userName = userName
    if not exact(fields, used) then return nil end
    return result
end

function Api.logout(input: LogoutInput, options: Server.Options?): number
    return Server.call("auth.logout.v1", {  }, options)
end

function Api.decodeLogout(payload: string): LogoutResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: LogoutResult
    local revokedRaw = take(fields, used, "result.revoked")
    if revokedRaw ~= "true" and revokedRaw ~= "false" then return nil end
    local revoked = revokedRaw == "true"
    result.revoked = revoked
    if not exact(fields, used) then return nil end
    return result
end

function Api.sessionInfo(input: SessionInfoInput, options: Server.Options?): number
    return Server.call("auth.session.v1", {  }, options)
end

function Api.decodeSessionInfo(payload: string): SessionInfoResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: SessionInfoResult
    local expiresAtRaw = take(fields, used, "result.expiresAt")
    local expiresAt = expiresAtRaw and tonumber(expiresAtRaw) or nil
    if expiresAt == nil then return nil end
    result.expiresAt = expiresAt
    local userNameRaw = take(fields, used, "result.userName")
    local userName = userNameRaw
    if userName == nil then return nil end
    result.userName = userName
    if not exact(fields, used) then return nil end
    return result
end

function Api.listMeditations(input: ListMeditationsInput, options: Server.Options?): number
    return Server.call("catalog.list.v1", {  }, options)
end

function Api.decodeListMeditations(payload: string): ListMeditationsResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: ListMeditationsResult
    local meditationsLengthRaw = take(fields, used, "result.meditations.length")
    local meditationsLength = meditationsLengthRaw and tonumber(meditationsLengthRaw) or nil
    if meditationsLength == nil or meditationsLength % 1 ~= 0 or meditationsLength < 0 or meditationsLength > 128 then return nil end
    local meditations: { Meditation } = {}
    for index = 1, meditationsLength do
        local item_accessibleRaw = take(fields, used, "result.meditations." .. tostring(index) .. ".accessible")
        if item_accessibleRaw ~= "true" and item_accessibleRaw ~= "false" then return nil end
        local item_accessible = item_accessibleRaw == "true"
        local item_descriptionRaw = take(fields, used, "result.meditations." .. tostring(index) .. ".description")
        local item_description = item_descriptionRaw
        if item_description == nil then return nil end
        local item_durationMsRaw = take(fields, used, "result.meditations." .. tostring(index) .. ".durationMs")
        local item_durationMs = item_durationMsRaw and tonumber(item_durationMsRaw) or nil
        if item_durationMs == nil then return nil end
        local item_favoriteRaw = take(fields, used, "result.meditations." .. tostring(index) .. ".favorite")
        if item_favoriteRaw ~= "true" and item_favoriteRaw ~= "false" then return nil end
        local item_favorite = item_favoriteRaw == "true"
        local item_idRaw = take(fields, used, "result.meditations." .. tostring(index) .. ".id")
        local item_id = item_idRaw
        if item_id == nil then return nil end
        local item_lockedRaw = take(fields, used, "result.meditations." .. tostring(index) .. ".locked")
        if item_lockedRaw ~= "true" and item_lockedRaw ~= "false" then return nil end
        local item_locked = item_lockedRaw == "true"
        local item_titleRaw = take(fields, used, "result.meditations." .. tostring(index) .. ".title")
        local item_title = item_titleRaw
        if item_title == nil then return nil end
        local item: Meditation = { accessible = item_accessible, description = item_description, durationMs = item_durationMs, favorite = item_favorite, id = item_id, locked = item_locked, title = item_title }
        table.insert(meditations, item)
    end
    result.meditations = meditations
    if not exact(fields, used) then return nil end
    return result
end

function Api.accessMeditation(input: AccessMeditationInput, options: Server.Options?): number
    return Server.call("content.access.v1", { ["meditationId"] = input.meditationId }, options)
end

function Api.decodeAccessMeditation(payload: string): AccessMeditationResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: AccessMeditationResult
    local artistRaw = take(fields, used, "result.artist")
    local artist = artistRaw
    if artist == nil then return nil end
    result.artist = artist
    local downloadAllowedRaw = take(fields, used, "result.downloadAllowed")
    if downloadAllowedRaw ~= "true" and downloadAllowedRaw ~= "false" then return nil end
    local downloadAllowed = downloadAllowedRaw == "true"
    result.downloadAllowed = downloadAllowed
    local itemIdRaw = take(fields, used, "result.itemId")
    local itemId = itemIdRaw
    if itemId == nil then return nil end
    result.itemId = itemId
    local resumePositionMsRaw = take(fields, used, "result.resumePositionMs")
    local resumePositionMs = resumePositionMsRaw and tonumber(resumePositionMsRaw) or nil
    if resumePositionMs == nil then return nil end
    result.resumePositionMs = resumePositionMs
    local sourceRaw = take(fields, used, "result.source")
    local source = sourceRaw
    if source == nil then return nil end
    result.source = source
    local titleRaw = take(fields, used, "result.title")
    local title = titleRaw
    if title == nil then return nil end
    result.title = title
    if not exact(fields, used) then return nil end
    return result
end

function Api.setFavorite(input: SetFavoriteInput, options: Server.Options?): number
    return Server.call("library.favorite.v1", { ["favorite"] = input.favorite and "true" or "false", ["meditationId"] = input.meditationId }, options)
end

function Api.decodeSetFavorite(payload: string): SetFavoriteResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: SetFavoriteResult
    local favoriteRaw = take(fields, used, "result.favorite")
    if favoriteRaw ~= "true" and favoriteRaw ~= "false" then return nil end
    local favorite = favoriteRaw == "true"
    result.favorite = favorite
    local meditationIdRaw = take(fields, used, "result.meditationId")
    local meditationId = meditationIdRaw
    if meditationId == nil then return nil end
    result.meditationId = meditationId
    if not exact(fields, used) then return nil end
    return result
end

function Api.saveProgress(input: SaveProgressInput, options: Server.Options?): number
    return Server.call("progress.save.v1", { ["meditationId"] = input.meditationId, ["positionMs"] = tostring(input.positionMs) }, options)
end

function Api.decodeSaveProgress(payload: string): SaveProgressResult?
    local decoded = Server.decode(payload)
    if not decoded.success then return nil end
    local fields = decoded.fields
    local used: { [string]: boolean } = {}
    local result = {} :: SaveProgressResult
    local meditationIdRaw = take(fields, used, "result.meditationId")
    local meditationId = meditationIdRaw
    if meditationId == nil then return nil end
    result.meditationId = meditationId
    local positionMsRaw = take(fields, used, "result.positionMs")
    local positionMs = positionMsRaw and tonumber(positionMsRaw) or nil
    if positionMs == nil then return nil end
    result.positionMs = positionMs
    if not exact(fields, used) then return nil end
    return result
end

return table.freeze(Api)
