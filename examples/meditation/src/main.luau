--!strict

local Host = require("luastra/host")
local Media = require("luastra/media")
local ServerFunctions = require("app/server-functions")
local UI = require("luastra/ui")

type Pending = { kind: string, meditationId: string?, favorite: boolean? }

local meditations: { ServerFunctions.Meditation } = {}
local authenticated = false
local userName = "Guest"
local status = "Restoring session"
local connectivity = "Unknown"
local loginEmail = ""
local loginPassword = ""
local pending: { [number]: Pending } = {}
local sequence = 0
local selectedId: string? = nil
local resumePositionMs = 0
local restoredPosition = false
local disposed = false
local media: Media.State = { revision = 0, status = "idle", itemId = "", title = "", artist = "", positionMs = 0, durationMs = 0, bufferedMs = 0, queueIndex = -1, queueCount = 0, background = false, interruption = "none", route = "default", error = nil }

local Application = {}

local function key(kind: string): string
    sequence += 1
    return "meditation-" .. kind .. "-" .. tostring(sequence)
end

local function track(requestId: number, value: Pending)
    pending[requestId] = value
end

local function loadCatalogue()
    if disposed then return end
    status = "Loading catalogue"
    track(ServerFunctions.listMeditations({}, { deadlineMs = 2500, retry = true }), { kind = "catalog" })
end

local function clearSession(kind: string)
    authenticated = false
    userName = "Guest"
    track(Host.storageSet("session.token", ""), { kind = kind })
end

local function resumeWhenReady()
    if media.status ~= "ready" or media.durationMs <= 0 then return end
    if resumePositionMs > 0 then
        local position = math.min(resumePositionMs, media.durationMs)
        resumePositionMs = 0
        status = "Restoring saved position"
        track(Media.seek(position), { kind = "media-seek" })
    elseif not restoredPosition then
        status = "Ready to play"
    end
end

local function meditationCard(item: ServerFunctions.Meditation): UI.Node
    local accessText = if item.accessible then (item.locked and "Member access" or "Open practice") else "Members only"
    return UI.ListItem {
        id = "meditation/list/" .. item.id,
        UI.Card {
            id = "meditation/card/" .. item.id,
            gap = "md",
            padding = "lg",
            surface = selectedId == item.id and "elevated" or "card",
            UI.Text { id = "meditation/card/" .. item.id .. "/title", text = item.title, variant = "heading" },
            UI.Text { id = "meditation/card/" .. item.id .. "/description", text = item.description, tone = "muted" },
            UI.Text { id = "meditation/card/" .. item.id .. "/access", text = accessText .. " · " .. tostring(math.floor(item.durationMs / 1000)) .. " sec", tone = item.accessible and "success" or "muted" },
            UI.Actions { id = "meditation/card/" .. item.id .. "/actions", gap = "sm", responsive = true,
                UI.Button { id = "meditation/card/" .. item.id .. "/play", text = item.accessible and "Open" or "Locked", onTap = "play-item", disabled = not item.accessible },
                UI.Button { id = "meditation/card/" .. item.id .. "/favorite", text = item.favorite and "★ Favourite" or "☆ Favourite", onTap = "toggle-favorite", appearance = "secondary", hidden = not authenticated },
            },
        },
    }
end

function Application.render(): UI.Node
    local cards: { UI.Node } = {}
    for _, item in meditations do table.insert(cards, meditationCard(item)) end
    if #cards == 0 then table.insert(cards, UI.ListItem { id = "meditation/empty", text = status, tone = "muted" }) end
    local progress = tostring(math.floor(media.positionMs / 1000)) .. "s / " .. tostring(math.floor(media.durationMs / 1000)) .. "s"
    return UI.Screen { id = "meditation", width = "wide", padding = "responsive",
        UI.Stack { id = "meditation/content", gap = "xl",
            UI.Stack { id = "meditation/intro", gap = "sm",
                UI.Text { id = "meditation/title", text = "A quieter moment", variant = "title" },
                UI.Text { id = "meditation/subtitle", text = "A general-purpose Luastra reference: session, protected content, media and progress.", tone = "muted" },
                UI.Row { id = "meditation/session", gap = "sm", responsive = true,
                    UI.Text { id = "meditation/user", text = authenticated and ("Signed in: " .. userName) or "Browsing as guest", role = "status", tone = authenticated and "success" or "muted" },
                    UI.Button { id = "meditation/logout", text = "Sign out", onTap = "logout", appearance = "secondary", hidden = not authenticated },
                },
                UI.Card { id = "meditation/login-form", gap = "sm", padding = "md", hidden = authenticated,
                    UI.Text { id = "meditation/login-title", text = "Member sign in", variant = "heading" },
                    UI.TextInput { id = "meditation/login-email", label = "Email", inputType = "email", inputMode = "email", enterKeyHint = "next", autoComplete = "email", value = loginEmail, onInput = "change-login-email", required = true },
                    UI.TextInput { id = "meditation/login-password", label = "Password", inputType = "password", enterKeyHint = "done", autoComplete = "current-password", value = loginPassword, onInput = "change-login-password", required = true },
                    UI.Button { id = "meditation/login", text = "Sign in", onTap = "login", disabled = loginEmail == "" or loginPassword == "" },
                },
                UI.Text { id = "meditation/status", text = status .. " · " .. connectivity, role = "status", tone = string.find(status, "failed", 1, true) and "error" or "muted" },
            },
            UI.Grid { id = "meditation/workspace", columns = "two", gap = "lg", responsive = true,
                UI.Stack { id = "meditation/catalogue", gap = "md",
                    UI.Text { id = "meditation/catalogue/title", text = "Practices", variant = "heading" },
                    UI.List { id = "meditation/list", label = "Meditation catalogue", gap = "md", table.unpack(cards) },
                },
                UI.Card { id = "meditation/player", gap = "md", padding = "lg", surface = "elevated",
                    UI.Text { id = "meditation/player/title", text = media.title ~= "" and media.title or "Choose a practice", variant = "heading" },
                    UI.Text { id = "meditation/player/state", text = "Playback: " .. media.status, role = "status", tone = media.status == "error" and "error" or "muted" },
                    UI.Text { id = "meditation/player/progress", text = progress },
                    UI.Actions { id = "meditation/player/actions", gap = "sm", responsive = true,
                        UI.Button { id = "meditation/player/play", text = "Play", onTap = "player-play", disabled = media.itemId == "" or media.status == "playing" },
                        UI.Button { id = "meditation/player/pause", text = "Pause", onTap = "player-pause", appearance = "secondary", disabled = media.status ~= "playing" and media.status ~= "buffering" },
                        UI.Button { id = "meditation/player/save", text = "Save progress", onTap = "save-progress", appearance = "secondary", hidden = not authenticated, disabled = selectedId == nil },
                    },
                    UI.Text { id = "meditation/player/background", text = media.background and "Background playback active" or "Foreground playback", tone = "muted" },
                },
            },
        },
    }
end

function Application.handle(action: string, target: string, value: string)
    if action == "lifecycle" then
        if value == "launch" then track(Host.storageGet("session.token"), { kind = "storage-restore" })
        elseif value == "online" then connectivity = "Online"
        elseif value == "offline" then connectivity = "Offline" status = "Offline; protected playback requires a new online grant"
        elseif value == "background" then media.background = true
        elseif value == "foreground" then media.background = false
        elseif value == "dispose" then disposed = true pending = {} status = "Disposed" end
        return
    elseif action == "media_state" then
        local decoded = Media.decodeState(value)
        if decoded.success then media = decoded.state resumeWhenReady() else status = "Media state failed validation" end
        return
    elseif action == "change-login-email" and target == "meditation/login-email" then
        loginEmail = value
        status = "Editing sign in"
        return
    elseif action == "change-login-password" and target == "meditation/login-password" then
        loginPassword = value
        status = "Editing sign in"
        return
    elseif action == "login" and target == "meditation/login" then
        if loginEmail == "" or loginPassword == "" then status = "Email and password are required" return end
        status = "Signing in"
        local submittedPassword = loginPassword
        loginPassword = ""
        track(ServerFunctions.login({ email = loginEmail, password = submittedPassword }, { deadlineMs = 2500, idempotencyKey = key("login") }), { kind = "login" })
        return
    elseif action == "logout" and target == "meditation/logout" then
        status = "Signing out"
        track(ServerFunctions.logout({}, { deadlineMs = 2500, idempotencyKey = key("logout") }), { kind = "logout" })
        return
    elseif action == "player-play" then track(Media.play(), { kind = "media-play" }) return
    elseif action == "player-pause" then track(Media.pause(), { kind = "media-pause" }) return
    elseif action == "save-progress" and authenticated and selectedId ~= nil then
        status = "Saving progress"
        track(ServerFunctions.saveProgress({ meditationId = selectedId, positionMs = math.floor(media.positionMs) }, { deadlineMs = 2500, idempotencyKey = key("progress") }), { kind = "progress" })
        return
    end
    for _, item in meditations do
        if action == "play-item" and target == "meditation/card/" .. item.id .. "/play" then
            status = "Checking content access"
            track(ServerFunctions.accessMeditation({ meditationId = item.id }, { deadlineMs = 2500, retry = true }), { kind = "access", meditationId = item.id })
            return
        elseif action == "toggle-favorite" and target == "meditation/card/" .. item.id .. "/favorite" and authenticated then
            local nextFavorite = not item.favorite
            status = "Updating library"
            track(ServerFunctions.setFavorite({ meditationId = item.id, favorite = nextFavorite }, { deadlineMs = 2500, idempotencyKey = key("favorite") }), { kind = "favorite", meditationId = item.id, favorite = nextFavorite })
            return
        end
    end
end

function Application.resolve(requestId: number, success: boolean, payload: string, errorCode: string, errorMessage: string)
    local action = pending[requestId]
    pending[requestId] = nil
    if action == nil or disposed then return end
    if not success then
        if action.kind == "session" and errorCode == "UNAUTHORIZED" then status = "Session expired" clearSession("storage-expired")
        else status = action.kind .. " failed: " .. errorCode .. " " .. errorMessage end
        return
    end
    if action.kind == "storage-restore" then
        if payload == "" then status = "Guest catalogue" loadCatalogue()
        else status = "Validating session" track(ServerFunctions.sessionInfo({}, { deadlineMs = 2500 }), { kind = "session" }) end
    elseif action.kind == "session" then
        local decoded = ServerFunctions.decodeSessionInfo(payload)
        if decoded == nil then status = "Session response failed validation" clearSession("storage-expired") return end
        authenticated = true userName = decoded.userName status = "Session restored" loadCatalogue()
    elseif action.kind == "login" then
        local decoded = ServerFunctions.decodeLogin(payload)
        if decoded == nil then status = "Login response failed validation" return end
        userName = decoded.userName
        track(Host.storageSet("session.token", decoded.token), { kind = "storage-login" })
    elseif action.kind == "storage-login" then authenticated = true status = "Signed in" loadCatalogue()
    elseif action.kind == "logout" then clearSession("storage-logout")
    elseif action.kind == "storage-logout" or action.kind == "storage-expired" then status = "Guest catalogue" loadCatalogue()
    elseif action.kind == "catalog" then
        local decoded = ServerFunctions.decodeListMeditations(payload)
        if decoded == nil then status = "Catalogue response failed validation" return end
        meditations = decoded.meditations status = "Catalogue ready"
    elseif action.kind == "favorite" then
        local decoded = ServerFunctions.decodeSetFavorite(payload)
        if decoded == nil then status = "Library response failed validation" return end
        for _, item in meditations do if item.id == decoded.meditationId then item.favorite = decoded.favorite break end end
        status = "Library updated"
    elseif action.kind == "access" then
        local decoded = ServerFunctions.decodeAccessMeditation(payload)
        if decoded == nil then status = "Content response failed validation" return end
        selectedId = decoded.itemId resumePositionMs = decoded.resumePositionMs restoredPosition = false status = "Loading audio"
        track(Media.setQueue({ { id = decoded.itemId, source = decoded.source, title = decoded.title, artist = decoded.artist } }, 1), { kind = "media-load" })
    elseif action.kind == "media-load" then
        local decoded = Media.decodeState(payload)
        if decoded.success then media = decoded.state resumeWhenReady() end
    elseif action.kind == "media-seek" then
        local decoded = Media.decodeState(payload)
        if decoded.success then media = decoded.state end
        restoredPosition = true
        status = "Ready at saved position"
    elseif action.kind == "media-play" or action.kind == "media-pause" then
        local decoded = Media.decodeState(payload)
        if decoded.success then media = decoded.state status = "Playback " .. media.status end
    elseif action.kind == "progress" then
        local decoded = ServerFunctions.decodeSaveProgress(payload)
        status = decoded ~= nil and "Progress saved" or "Progress response failed validation"
    end
end

function Application.snapshot()
    local count = 0
    for _ in pending do count += 1 end
    return { authenticated = authenticated, userName = userName, status = status, connectivity = connectivity, loginEmail = loginEmail, hasLoginPassword = loginPassword ~= "", catalogueCount = #meditations, pendingCount = count, selectedId = selectedId, disposed = disposed }
end

return Application
