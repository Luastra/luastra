--!strict

local UI = require("luastra/ui")

export type NavigationItem = {
    id: string,
    text: string,
    action: string,
    icon: string?,
    selected: boolean?,
}

local Blocks = {}

function Blocks.AppBar(input: {
    id: string,
    title: string,
    leading: UI.Node?,
    trailing: UI.Node?,
}): UI.Node
    local children: { UI.Node } = {}
    if input.leading ~= nil then table.insert(children, input.leading :: UI.Node) end
    table.insert(children, UI.Text { id = input.id .. "/title", text = input.title, variant = "heading" })
    if input.trailing ~= nil then table.insert(children, input.trailing :: UI.Node) end
    return UI.Row {
        id = input.id,
        width = "full",
        padding = "sm",
        gap = "sm",
        justify = "between",
        surface = "plain",
        sticky = "top",
        table.unpack(children),
    }
end

function Blocks.BottomNavigation(input: {
    id: string,
    label: string,
    items: { NavigationItem },
}): UI.Node
    assert(#input.items >= 1 and #input.items <= 5, "BottomNavigation requires 1 to 5 items")
    local children: { UI.Node } = {}
    for _, item in input.items do
        table.insert(children, UI.Button {
            id = input.id .. "/" .. item.id,
            text = item.text,
            label = item.text,
            icon = item.icon,
            selected = item.selected == true,
            appearance = "ghost",
            onTap = item.action,
        })
    end
    return UI.Row {
        id = input.id,
        label = input.label,
        role = "navigation",
        width = "full",
        padding = "sm",
        gap = "xs",
        justify = "between",
        flow = "wrap",
        surface = "elevated",
        sticky = "bottom",
        table.unpack(children),
    }
end

function Blocks.Avatar(input: {
    id: string,
    source: any,
    label: string,
    size: number?,
    placeholderColor: string?,
}): UI.Node
    local size = input.size or 48
    assert(size >= 24 and size <= 256, "Avatar size must be between 24 and 256")
    return UI.Image {
        id = input.id,
        source = input.source,
        label = input.label,
        width = size,
        height = size,
        cornerRadius = size / 2,
        fit = "cover",
        placeholderColor = input.placeholderColor,
    }
end

function Blocks.EmptyState(input: {
    id: string,
    title: string,
    message: string,
    actionText: string?,
    action: string?,
}): UI.Node
    assert((input.actionText == nil) == (input.action == nil), "EmptyState action text and action must be provided together")
    local children: { UI.Node } = {
        UI.Icon { id = input.id .. "/icon", icon = "list", decorative = true },
        UI.Text { id = input.id .. "/title", text = input.title, variant = "subheading" },
        UI.Text { id = input.id .. "/message", text = input.message, tone = "muted" },
    }
    if input.action ~= nil then
        table.insert(children, UI.Button { id = input.id .. "/action", text = input.actionText, onTap = input.action })
    end
    return UI.Column {
        id = input.id,
        width = "full",
        padding = "lg",
        gap = "sm",
        align = "center",
        surface = "card",
        table.unpack(children),
    }
end

function Blocks.RetryState(input: {
    id: string,
    title: string,
    message: string,
    actionText: string?,
    action: string,
}): UI.Node
    local actionText = input.actionText or "Try again"
    return UI.Column {
        id = input.id,
        width = "full",
        padding = "lg",
        gap = "sm",
        align = "center",
        surface = "card",
        UI.Icon { id = input.id .. "/icon", icon = "retry", decorative = true },
        UI.Text { id = input.id .. "/title", text = input.title, variant = "subheading" },
        UI.Text { id = input.id .. "/message", text = input.message, tone = "error" },
        UI.Button { id = input.id .. "/action", text = actionText, onTap = input.action },
    }
end

function Blocks.AsyncBoundary(input: {
    id: string,
    status: "idle" | "loading" | "ready" | "error",
    content: UI.Node?,
    emptyTitle: string?,
    emptyMessage: string?,
    errorTitle: string?,
    errorMessage: string?,
    retryAction: string?,
}): UI.Node
    if input.status == "ready" then
        assert(input.content ~= nil, "AsyncBoundary ready status requires content")
        return input.content :: UI.Node
    end
    if input.status == "error" then
        assert(input.retryAction ~= nil, "AsyncBoundary error status requires retryAction")
        return Blocks.RetryState {
            id = input.id,
            title = input.errorTitle or "Could not load",
            message = input.errorMessage or "Please try again.",
            action = input.retryAction :: string,
        }
    end
    if input.status == "idle" then
        return Blocks.EmptyState {
            id = input.id,
            title = input.emptyTitle or "Nothing here yet",
            message = input.emptyMessage or "New items will appear here.",
        }
    end
    return UI.Column {
        id = input.id,
        width = "full",
        padding = "lg",
        gap = "sm",
        align = "center",
        UI.Icon { id = input.id .. "/icon", icon = "activity", decorative = true },
        UI.Text { id = input.id .. "/status", text = "Loading", role = "status" },
    }
end

function Blocks.PagedList(input: {
    id: string,
    label: string,
    items: { UI.Node },
    estimatedItemSize: number?,
    overscan: number?,
    itemCount: number?,
    itemOffset: number?,
    startBusy: boolean?,
    endBusy: boolean?,
    onStartReached: string?,
    onEndReached: string?,
}): UI.Node
    return UI.List {
        id = input.id,
        label = input.label,
        mode = "windowed",
        estimatedItemSize = input.estimatedItemSize or 72,
        overscan = input.overscan or 6,
        itemCount = input.itemCount,
        itemOffset = input.itemOffset or 0,
        startBusy = input.startBusy or false,
        endBusy = input.endBusy or false,
        onStartReached = input.onStartReached,
        onEndReached = input.onEndReached,
        gap = "sm",
        table.unpack(input.items),
    }
end

return table.freeze(Blocks)
