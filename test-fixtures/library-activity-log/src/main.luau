--!strict

local App = require("luastra/app")
local UI = require("luastra/ui")
local Blocks = require("universal-blocks")

local activities: { UI.Node } = {
    UI.ListItem { id = "activity/items/sync", UI.Text { id = "activity/items/sync/title", text = "Workspace synchronized" } },
    UI.ListItem { id = "activity/items/export", UI.Text { id = "activity/items/export/title", text = "Archive exported" } },
}

local activityList = Blocks.PagedList {
    id = "activity/items",
    label = "Recent activity",
    items = activities,
    itemCount = 100000,
    onStartReached = "activity.previous",
    onEndReached = "activity.next",
}

return App.compose {
    features = {},
    render = function(): UI.Node
        return UI.Screen {
            id = "activity",
            documentTitle = "Activity log",
            Blocks.AppBar {
                id = "activity/bar",
                title = "Activity log",
                trailing = UI.Button { id = "activity/refresh", icon = "retry", label = "Refresh activity", onTap = "activity.refresh", busy = false },
            },
            UI.Column {
                id = "activity/content",
                width = "content",
                padding = "responsive",
                gap = "md",
                Blocks.AsyncBoundary { id = "activity/boundary", status = "ready", content = activityList },
                Blocks.RetryState { id = "activity/offline", title = "Offline", message = "The activity log is temporarily unavailable.", action = "activity.retry" },
            },
            Blocks.BottomNavigation {
                id = "activity/navigation",
                label = "Activity sections",
                items = {
                    { id = "log", text = "Log", action = "activity.log", icon = "activity", selected = true },
                    { id = "account", text = "Account", action = "activity.account", icon = "user" },
                },
            },
        }
    end,
    snapshot = function() return table.freeze({ fixture = "activity-log" }) end,
}
