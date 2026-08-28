--!strict

local Navigation = require("luastra/navigation")
local UI = require("luastra/ui")

local routes = Navigation.compile {
    { name = "home", path = "/" },
    {
        name = "workspace",
        path = "/workspaces/:workspace_id",
        params = { workspace_id = { type = "integer", minimum = 1, maximum = 999 } },
    },
    {
        name = "document",
        parent = "workspace",
        path = "documents/:document_slug",
        params = { document_slug = { type = "string", maximumLength = 32 } },
        query = { mode = { type = "enum", values = { "read", "edit" }, required = true } },
    },
}

local router = Navigation.createRouter {
    compiler = routes,
    initial = { name = "home", params = {}, query = {} },
}

local Application = {}

function Application.render(): UI.Node
    local current = router.current()
    return UI.Screen {
        id = "routing-lab",
        width = "content",
        padding = "responsive",
        UI.Stack {
            id = "routing/content",
            gap = "md",
            UI.Text { id = "routing/title", text = "Routing lab", variant = "title" },
            UI.Text { id = "routing/name", text = "Route: " .. current.name },
            UI.Text { id = "routing/location", text = router.currentLocation(), role = "status" },
            UI.Actions {
                id = "routing/actions",
                gap = "sm",
                UI.Button { id = "routing/workspace", text = "Open workspace", onTap = "open-workspace" },
                UI.Button { id = "routing/document", text = "Open document", onTap = "open-document" },
                UI.Button { id = "routing/back", text = "Back", onTap = "back", disabled = not router.canBack() },
            },
        },
    }
end

function Application.handle(action: string, target: string, _value: string)
    if action == "open-workspace" and target == "routing/workspace" then
        router.push { name = "workspace", params = { workspace_id = 7 }, query = {} }
    elseif action == "open-document" and target == "routing/document" then
        router.push { name = "document", params = { workspace_id = 7, document_slug = "release-notes" }, query = { mode = "edit" } }
    elseif action == "back" and target == "routing/back" then
        router.back()
    end
end

function Application.snapshot()
    return { name = router.current().name, location = router.currentLocation(), navigation = router.encode() }
end

return Application
