--!strict

local Assets = require("luastra/assets")
local Media = require("luastra/media")
local UI = require("luastra/ui")

local state: Media.State = { revision = 0, status = "idle", itemId = "", title = "", artist = "", positionMs = 0, durationMs = 0, bufferedMs = 0, queueIndex = -1, queueCount = 0, background = false, interruption = "none", route = "default", error = nil }
local pending: { [number]: string } = {}
local message = "Awaiting launch"

local queue: { Media.QueueItem } = {
    { id = "focus", source = Assets.uri(Assets.audio("audio/focus")), title = "Focus sample", artist = "Luastra" },
    { id = "rest", source = Assets.uri(Assets.audio("audio/rest")), title = "Rest sample", artist = "Luastra" },
}

local Application = {}
local function request(id: number, label: string) pending[id] = label message = label .. " requested" end
local function apply(payload: string, nextMessage: string?)
    local decoded = Media.decodeState(payload)
    if not decoded.success then message = "Rejected media state: " .. decoded.error return end
    state = decoded.state
    if nextMessage ~= nil then message = nextMessage end
end

function Application.render(): UI.Node
    local progress = tostring(math.floor(state.positionMs / 1000)) .. "s / " .. tostring(math.floor(state.durationMs / 1000)) .. "s"
    return UI.Screen { id = "media", width = "content", padding = "responsive",
        UI.Stack { id = "media/shell", gap = "lg",
            UI.Text { id = "media/title", text = "General media capability", variant = "title" },
            UI.Text { id = "media/description", text = "Queue, playback, progress and lifecycle through the public Luastra SDK.", tone = "muted" },
            UI.Card { id = "media/now-playing", gap = "md", padding = "lg", surface = "elevated",
                UI.Text { id = "media/item", text = state.title ~= "" and state.title or "Nothing loaded", variant = "heading" },
                UI.Text { id = "media/status", text = "Status: " .. state.status, role = "status", tone = state.status == "error" and "error" or "success" },
                UI.Text { id = "media/progress", text = "Progress: " .. progress },
                UI.Text { id = "media/queue", text = "Queue: " .. tostring(state.queueIndex + 1) .. " / " .. tostring(state.queueCount) },
                UI.Text { id = "media/lifecycle", text = state.background and "Lifecycle: Background" or "Lifecycle: Foreground", tone = "muted" },
                UI.Text { id = "media/message", text = message, role = "status", tone = "muted" },
            },
            UI.Actions { id = "media/controls", gap = "sm", responsive = true,
                UI.Button { id = "media/play", text = "Play", onTap = "media-play", disabled = state.status ~= "ready" and state.status ~= "paused" and state.status ~= "ended" },
                UI.Button { id = "media/pause", text = "Pause", onTap = "media-pause", appearance = "secondary", disabled = state.status ~= "playing" and state.status ~= "buffering" },
                UI.Button { id = "media/seek", text = "Seek +5s", onTap = "media-seek", appearance = "secondary", disabled = state.durationMs == 0 },
                UI.Button { id = "media/previous", text = "Previous", onTap = "media-previous", appearance = "ghost", disabled = state.queueIndex <= 0 },
                UI.Button { id = "media/next", text = "Next", onTap = "media-next", appearance = "ghost", disabled = state.queueIndex < 0 or state.queueIndex + 1 >= state.queueCount },
            },
        },
    }
end

function Application.handle(action: string, _target: string, value: string)
    if action == "lifecycle" then
        if value == "launch" then request(Media.setQueue(queue, 1), "Queue load")
        elseif value == "background" then state.background = true
        elseif value == "foreground" then state.background = false end
    elseif action == "media_state" then apply(value, nil)
    elseif action == "media-play" then request(Media.play(), "Play")
    elseif action == "media-pause" then request(Media.pause(), "Pause")
    elseif action == "media-seek" then request(Media.seek(math.min(state.positionMs + 5000, state.durationMs)), "Seek")
    elseif action == "media-next" then request(Media.next(), "Next")
    elseif action == "media-previous" then request(Media.previous(), "Previous") end
end

function Application.resolve(requestId: number, success: boolean, payload: string, code: string, errorMessage: string)
    local label = pending[requestId]
    pending[requestId] = nil
    if label == nil then return end
    if not success then message = label .. " failed: " .. code .. " " .. errorMessage return end
    apply(payload, label .. " completed")
end

return Application
