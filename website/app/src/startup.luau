--!strict
local Assets = require("luastra/assets")
local UI = require("luastra/ui")

local function screen(failed: boolean): UI.Node
        return UI.Screen {
            id = "startup", padding = "xl",
            backgroundColor = "#F4EFE3", textColor = "#16342E",
            accentColor = "#2F7568", mutedColor = "#526A64",
            surfaceColor = "#FFFDF7",
            UI.Column { id = "startup/content", align = "center", gap = "lg", paddingY = "xl",
                UI.Text { id = "startup/eyebrow", text = "A SMALL LANGUAGE. A WORLD OF POSSIBILITIES.",
                    textAlign = "center", tone = "muted", textStyle = { size = 12, weight = 600 } },
                UI.Image { id = "startup/mark", source = Assets.image("image/luastra-mark").uri,
                    width = 144, height = 144, fit = "contain", label = "Luastra logo" },
                UI.Text { id = "startup/title", text = "Luastra", variant = "title", textAlign = "center",
                    textStyle = { size = 56, weight = 700, fallback = "serif", lineHeight = 1.1 } },
                UI.Text { id = "startup/tagline", text = "Build apps like games.", textAlign = "center",
                    textStyle = { size = 22, weight = 400 } },
                UI.Row { id = "startup/stars", gap = "lg", justify = "center", paddingY = "md",
                    UI.Shape { id = "startup/star-left", shape = "circle", width = 6, height = 6, fill = "#2F7568" },
                    UI.Shape { id = "startup/star-center", shape = "star", width = 20, height = 20, fill = "#E4AD3A" },
                    UI.Shape { id = "startup/star-right", shape = "circle", width = 6, height = 6, fill = "#2F7568" },
                },
                UI.Text { id = "startup/loading", text = if failed then "Your constellation couldn’t open." else "Opening your constellation…", textAlign = "center",
                    textStyle = { size = 17, weight = 600 } },
                UI.Text { id = "startup/detail", text = if failed then "Check your connection and try again." else "Getting everything ready for you.", tone = "muted", textAlign = "center" },
                if failed then UI.Button { id = "startup/retry", text = "Try again", onTap = "startup.retry" } else UI.Divider { id = "startup/ready-divider" },
                UI.Link { id = "startup/docs", text = "Explore the documentation ↗", href = "https://luastra.dev/docs/",
                    external = true, label = "Explore the documentation (opens in a new tab)", marginTop = "lg" },
            },
        }
end

return {
    render = function(): UI.Node return screen(false) end,
    renderFailure = function(): UI.Node return screen(true) end,
}
